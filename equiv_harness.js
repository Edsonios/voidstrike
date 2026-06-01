/* ============================================================================
   VOIDSTRIKE EQUIVALENCE HARNESS
   ----------------------------------------------------------------------------
   Purpose: pin the engine's current observable behaviour as a deterministic
   ORACLE, so the upcoming per-model migration can be proven to change NOTHING
   that works today. Every migration pass re-runs this; any differing result is
   a regression, surfaced immediately.

   How it works:
     1. A seedable PRNG replaces Math.random (engine RNG flows through d6/d3 +
        a couple of muster picks), making identical inputs -> identical outputs.
     2. A battery of fixed SCENARIOS exercises combat math, the two-step Fight
        phase, Pile In / Consolidate movement, objective control, Stealth /
        Lone Operative, and a few faction army-rules.
     3. Each scenario emits a compact RESULT object (positions, wounds, deaths,
        objective control, key combat tallies). The set of results is the
        FINGERPRINT of current behaviour.

   Modes:
     node equiv_harness.js record   -> writes baseline fingerprint to equiv_baseline.json
     node equiv_harness.js check    -> re-runs, diffs against baseline, exits non-zero on any diff

   The harness imports app.js/detachments.js/ability_fx.js exactly as the unit
   tests do (single global.eval blob so const-scoped TEMPLATES/FACTIONS are
   visible). It does NOT modify the engine — it only observes it.
============================================================================ */

const fs = require('fs');

// ---- seedable PRNG (mulberry32): deterministic, fast, good enough for test fingerprints ----
function mulberry32(seed){
  let a = seed >>> 0;
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- DOM / browser stubs (same shape the unit-test harnesses use) ----
function makeEnv(){
  global.getComputedStyle = () => ({ getPropertyValue: () => '#fff' });
  let _uid = 0;
  global.crypto = { randomUUID: () => 'u' + (++_uid) };   // deterministic ids (no Math.random in id gen)
  global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  function mkEl(){
    return { innerHTML:'', textContent:'', value:'', checked:true, style:{},
      classList:{ add(){}, remove(){}, toggle(){}, contains(){return false} },
      appendChild(){}, querySelector(){return mkEl();}, querySelectorAll(){return [];},
      dataset:{}, getContext(){ return new Proxy({}, { get(){return ()=>{};}, set(){return true;} }); },
      getBoundingClientRect(){ return {left:0,top:0,width:600,height:550}; },
      addEventListener(){}, insertBefore(){}, width:600, height:550,
      firstChild:{textContent:''}, files:[], children:[] };
  }
  const els = {};
  global.document = {
    getElementById: id => els[id] || (els[id] = mkEl()),
    createElement: () => mkEl(), querySelector: () => mkEl(), querySelectorAll: () => [] };
  global.window = { addEventListener: () => {} };
}

// ---- load the engine into the global scope ----
function loadEngine(){
  const af  = fs.readFileSync('ability_fx.js','utf8');
  const det = fs.readFileSync('detachments.js','utf8');
  const app = fs.readFileSync('app.js','utf8');
  // Expose a hook so scenarios (run inside the eval blob) can install the seeded RNG.
  const boot = `
    logEl=document.getElementById('log');cv=document.getElementById('board');ctx=cv.getContext('2d');
    mode='open';GW=24;GH=22;PNAME={1:'P1',2:'P2'};objectives=[];walls=[];hatchways=[];
    globalThis.__seedRng=function(seed){ Math.random=globalThis.__mulberry32(seed); };
  `;
  return af + "\n" + det + "\n" + app + "\n" + boot;
}

// round positions/wounds to integers; produce a stable, comparable snapshot of a unit
const SNAP = u => ({
  tpl: u.tpl, p: u.player, hx: u.hx, hy: u.hy,
  models: u.models, w: (typeof u.woundsLeft==='number'? u.woundsLeft : null),
  dead: !!u.dead, fought: !!u.fought, charged: !!u.charged,
  reserve: !!u.inReserve, bshock: !!u.bshock
});

/* ----------------------------------------------------------------------------
   SCENARIOS
   Each scenario is a string of engine code (run inside the eval blob). It must:
     - call __seedRng(<fixed seed>) for determinism,
     - set up TEMPLATES / FACTIONS / units deterministically,
     - perform the action under test,
     - assign its result object to `globalThis.__result`.
   Results are intentionally small and position/count-focused — the things a
   per-model rewrite is most likely to perturb.
---------------------------------------------------------------------------- */
const SCENARIOS = {

  // 1. Pure combat math: a fixed volley, seeded — pins hit/wound/save/damage pipeline.
  combat_basic: `
    __seedRng(1001);
    TEMPLATES.atk={name:'Atk',kw:['INFANTRY'],allKw:['INFANTRY'],pts:100,m:6,t:4,sv:4,inv:0,w:1,ld:6,oc:1,ranged:[{name:'g',type:'R',rng:24,a:2,skill:3,s:5,ap:-1,d:1,ab:{}}],melee:[{name:'cc',type:'M',rng:0,a:1,skill:4,s:4,ap:0,d:1,ab:{}}],models:5,abilities:[]};
    TEMPLATES.tgt={name:'Tgt',kw:['INFANTRY'],allKw:['INFANTRY'],pts:90,m:6,t:4,sv:4,inv:0,w:1,ld:6,oc:1,ranged:[],melee:[],models:10,abilities:[]};
    FACTIONS.fa={name:'FA',units:['atk','tgt'],color:'imp'};FACTIONS.fb={name:'FB',units:['atk','tgt'],color:'xenos'};
    pFaction[1]='fa';pFaction[2]='fb';pDetach[1]=null;pDetach[2]=null;turn=1;
    var a=newUnit('atk',1),t=newUnit('tgt',2);a.deployed=t.deployed=true;a.hx=10;a.hy=10;t.hx=12;t.hy=10;
    units.length=0;units.push(a,t);
    resolveAttacks(a,t,a.ranged[0],a.models,true);
    globalThis.__result={target:__snap(t),attacker:__snap(a)};
  `,

  // 2. Stealth: defender Core ability must subtract 1 from incoming ranged hits (and not melee).
  core_stealth: `
    __seedRng(2002);
    TEMPLATES.sh={name:'Shooter',kw:['INFANTRY'],allKw:['INFANTRY'],pts:90,m:6,t:4,sv:4,inv:0,w:1,ld:6,oc:1,ranged:[{name:'g',type:'R',rng:24,a:3,skill:3,s:4,ap:0,d:1,ab:{}}],melee:[{name:'cc',type:'M',rng:0,a:3,skill:3,s:4,ap:0,d:1,ab:{}}],models:10,abilities:[]};
    TEMPLATES.st={name:'Stealthy',kw:['INFANTRY'],allKw:['INFANTRY'],pts:90,m:6,t:4,sv:4,inv:0,w:1,ld:6,oc:1,ranged:[],melee:[],models:10,abilities:[{name:'Stealth',type:'Core',desc:'x'}]};
    FACTIONS.fa={name:'FA',units:['sh','st'],color:'imp'};FACTIONS.fb={name:'FB',units:['sh','st'],color:'xenos'};
    pFaction[1]='fa';pFaction[2]='fb';pDetach[1]=null;pDetach[2]=null;turn=1;
    var s=newUnit('sh',1),d=newUnit('st',2);s.deployed=d.deployed=true;s.hx=10;s.hy=10;d.hx=12;d.hy=10;
    units.length=0;units.push(s,d);
    var mR=gatherCombatMods(s,d,s.ranged[0],false), mM=gatherCombatMods(s,d,s.melee[0],true);
    globalThis.__result={ranged_subHit:mR.subIncomingHit, melee_subHit:mM.subIncomingHit};
  `,

  // 3. Lone Operative targeting restriction (the helper the AI + interactive paths use).
  core_loneop: `
    __seedRng(3003);
    TEMPLATES.lo={name:'LO',kw:['INFANTRY','CHARACTER'],allKw:['INFANTRY','CHARACTER'],pts:120,m:7,t:4,sv:6,inv:4,w:5,ld:6,oc:1,ranged:[],melee:[],models:1,abilities:[{name:'Lone Operative',type:'Core',desc:'x'}]};
    FACTIONS.fa={name:'FA',units:['lo'],color:'imp'};FACTIONS.fb={name:'FB',units:['lo'],color:'xenos'};
    pFaction[1]='fa';pFaction[2]='fb';pDetach[1]=null;pDetach[2]=null;turn=1;
    var shooter=newUnit('lo',1),loneop=newUnit('lo',2);shooter.deployed=loneop.deployed=true;
    shooter.hx=10;shooter.hy=10;loneop.hx=14;loneop.hy=10;  // ~8" -> within 12 (targetable)
    units.length=0;units.push(shooter,loneop);
    var near = (!unitIsLoneOp(loneop)||dist(shooter,loneop)<=12);
    loneop.hx=2;loneop.hy=2;shooter.hx=22;shooter.hy=20;     // far -> blocked
    var far = (!unitIsLoneOp(loneop)||dist(shooter,loneop)<=12);
    globalThis.__result={near_targetable:near, far_targetable:far, isLoneOp:unitIsLoneOp(loneop)};
  `,

  // 4. Two-step Fight phase: non-active Fights-First unit strikes a normal active unit. Pins ordering + outcome.
  fight_fightsfirst: `
    __seedRng(4004);
    TEMPLATES.ff={name:'FF',kw:['INFANTRY'],allKw:['INFANTRY'],pts:100,m:6,t:3,sv:6,inv:0,w:1,ld:6,oc:1,ranged:[],melee:[{name:'b',type:'M',rng:0,a:6,skill:2,s:8,ap:-3,d:3,ab:{}}],models:5,abilities:[{name:'Fights First',type:'Core',desc:'x'}]};
    TEMPLATES.nm={name:'NM',kw:['INFANTRY'],allKw:['INFANTRY'],pts:100,m:6,t:3,sv:6,inv:0,w:1,ld:6,oc:1,ranged:[],melee:[{name:'c',type:'M',rng:0,a:6,skill:2,s:8,ap:-3,d:3,ab:{}}],models:5,abilities:[]};
    FACTIONS.fa={name:'FA',units:['ff','nm'],color:'imp'};FACTIONS.fb={name:'FB',units:['ff','nm'],color:'xenos'};
    pFaction[1]='fa';pFaction[2]='fb';pDetach[1]=null;pDetach[2]=null;turn=1;
    var act=newUnit('nm',1),react=newUnit('ff',2);act.deployed=react.deployed=true;act.hx=10;act.hy=10;react.hx=11;react.hy=10;
    units.length=0;units.push(act,react);
    phaseIdx=PHASES.indexOf('Fight');var realAdv=advancePhase;advancePhase=function(){};
    autoResolvePhase();advancePhase=realAdv;
    globalThis.__result={active_normal:__snap(act), nonactive_ff:__snap(react)};
  `,

  // 5. In-combat movement: unit wipes a foe and consolidates onto a 2nd enemy, becoming fightable (dynamic eligibility).
  fight_consolidate_chain: `
    __seedRng(5005);
    TEMPLATES.killer={name:'Killer',kw:['INFANTRY'],allKw:['INFANTRY'],pts:100,m:6,t:3,sv:6,inv:0,w:1,ld:6,oc:1,ranged:[],melee:[{name:'b',type:'M',rng:0,a:20,skill:2,s:9,ap:-4,d:4,ab:{}}],models:5,abilities:[]};
    TEMPLATES.weak={name:'Weak',kw:['INFANTRY'],allKw:['INFANTRY'],pts:60,m:6,t:3,sv:6,inv:0,w:1,ld:6,oc:1,ranged:[],melee:[{name:'f',type:'M',rng:0,a:1,skill:5,s:3,ap:0,d:1,ab:{}}],models:1,abilities:[]};
    FACTIONS.fa={name:'FA',units:['killer','weak'],color:'imp'};FACTIONS.fb={name:'FB',units:['killer','weak'],color:'xenos'};
    pFaction[1]='fa';pFaction[2]='fb';pDetach[1]=null;pDetach[2]=null;turn=1;
    var k=newUnit('killer',1),w1=newUnit('weak',2),w2=newUnit('weak',2);
    k.deployed=w1.deployed=w2.deployed=true;k.hx=10;k.hy=10;w1.hx=11;w1.hy=10;w2.hx=12;w2.hy=10;
    units.length=0;units.push(k,w1,w2);
    phaseIdx=PHASES.indexOf('Fight');var realAdv=advancePhase;advancePhase=function(){};
    autoResolvePhase();advancePhase=realAdv;
    globalThis.__result={killer:__snap(k), w1:__snap(w1), w2:__snap(w2)};
  `,

  // 6. Consolidate onto objective when no enemy reachable.
  fight_consolidate_objective: `
    __seedRng(6006);
    TEMPLATES.solo={name:'Solo',kw:['INFANTRY'],allKw:['INFANTRY'],pts:100,m:6,t:3,sv:6,inv:0,w:1,ld:6,oc:1,ranged:[],melee:[{name:'b',type:'M',rng:0,a:3,skill:3,s:5,ap:-1,d:1,ab:{}}],models:5,abilities:[]};
    FACTIONS.fa={name:'FA',units:['solo'],color:'imp'};
    pFaction[1]='fa';pDetach[1]=null;turn=1;
    var s=newUnit('solo',1);s.deployed=true;s.hx=10;s.hy=10;
    units.length=0;units.push(s);objectives=[{hx:11,hy:11}];
    var moved=consolidateMove(s);
    globalThis.__result={moved:moved, pos:[s.hx,s.hy], onObjective:unitOnObjective(s)};
    objectives=[];
  `,

  // 7. Objective control tally: summed OC with a contested vs controlled case.
  objective_control: `
    __seedRng(7007);
    TEMPLATES.hi={name:'Hi',kw:['INFANTRY'],allKw:['INFANTRY'],pts:100,m:6,t:4,sv:4,inv:0,w:1,ld:6,oc:3,ranged:[],melee:[],models:5,abilities:[]};
    TEMPLATES.lo2={name:'Lo2',kw:['INFANTRY'],allKw:['INFANTRY'],pts:80,m:6,t:4,sv:4,inv:0,w:1,ld:6,oc:1,ranged:[],melee:[],models:5,abilities:[]};
    FACTIONS.fa={name:'FA',units:['hi','lo2'],color:'imp'};FACTIONS.fb={name:'FB',units:['hi','lo2'],color:'xenos'};
    pFaction[1]='fa';pFaction[2]='fb';pDetach[1]=null;pDetach[2]=null;turn=1;
    objectives=[{hx:10,hy:10}];
    var p1u=newUnit('hi',1),p2u=newUnit('lo2',2);p1u.deployed=p2u.deployed=true;p1u.hx=10;p1u.hy=10;p2u.hx=11;p2u.hy=10;
    units.length=0;units.push(p1u,p2u);
    // who controls obj 0? sum OC within 1.5 cells
    function ctrl(){var c={1:0,2:0};units.forEach(function(u){if(!u.dead&&Math.hypot(u.hx-10,u.hy-10)<=1.5)c[u.player]+=ocOf(u);});return c;}
    globalThis.__result={control:ctrl()};
    objectives=[];
  `,

  // 9. Wound-table branch coverage: every S-vs-T case of woundTarget, so a combat rewrite can't silently shift one.
  //    (Pure function probe — deterministic, no RNG. This closes the coverage gap that let an injected s==t bug slip past.)
  woundtable_branches: `
    globalThis.__result={
      twice:      woundTarget(8,4),   // s>=2t -> 2
      doubleExact:woundTarget(8,4),   // boundary
      greater:    woundTarget(5,4),   // s>t   -> 3
      equal:      woundTarget(4,4),   // s==t  -> 4   <-- the branch the injected bug hit
      less:       woundTarget(4,5),   // s<t   -> 5
      half:       woundTarget(3,6),   // 2s<=t -> 6
      halfExact:  woundTarget(2,4)    // 2s==t -> 6 boundary
    };
  `,

  // 10. Damage allocation across a multi-wound unit (excess-damage-lost rule) — pins applyDamage on chunky targets.
  damage_allocation: `
    __seedRng(1010);
    TEMPLATES.big={name:'Big',kw:['INFANTRY'],allKw:['INFANTRY'],pts:200,m:6,t:5,sv:3,inv:0,w:3,ld:7,oc:2,ranged:[],melee:[],models:4,abilities:[]};
    TEMPLATES.hh={name:'HH',kw:['INFANTRY'],allKw:['INFANTRY'],pts:150,m:6,t:5,sv:3,inv:0,w:1,ld:7,oc:1,ranged:[{name:'h',type:'R',rng:24,a:4,skill:2,s:8,ap:-2,d:2,ab:{}}],melee:[],models:5,abilities:[]};
    FACTIONS.fa={name:'FA',units:['big','hh'],color:'imp'};FACTIONS.fb={name:'FB',units:['big','hh'],color:'xenos'};
    pFaction[1]='fa';pFaction[2]='fb';pDetach[1]=null;pDetach[2]=null;turn=1;
    var s=newUnit('hh',1),t=newUnit('big',2);s.deployed=t.deployed=true;s.hx=10;s.hy=10;t.hx=12;t.hy=10;
    units.length=0;units.push(s,t);
    resolveAttacks(s,t,s.ranged[0],s.models,true);
    globalThis.__result={target:__snap(t)};
  `,

  // 11. Ability-fx join coverage via a target-keyword rider. Uses the engine's own condition machinery
  //     (targetInfantry/targetVehicle) the Drukhari fixes rely on, with synthetic templates that exist in
  //     committed code (so it runs headless without the export). Pins that a grant fires vs the right target
  //     keyword and is withheld vs the wrong one — the exact behaviour the per-model rewrite must preserve.
  join_target_keyword: `
    __seedRng(1111);
    TEMPLATES.zz_atk={name:'ZZAtk',kw:['INFANTRY'],allKw:['INFANTRY'],pts:100,m:6,t:4,sv:4,inv:0,w:1,ld:6,oc:1,ranged:[],melee:[{name:'blade',type:'M',rng:0,a:3,skill:3,s:5,ap:-2,d:2,ab:{}}],models:5,abilities:[]};
    TEMPLATES.zz_inf={name:'ZZInf',kw:['INFANTRY'],allKw:['INFANTRY'],pts:60,m:6,t:4,sv:5,inv:0,w:1,ld:7,oc:2,ranged:[],melee:[],models:10,abilities:[]};
    TEMPLATES.zz_veh={name:'ZZVeh',kw:['VEHICLE'],allKw:['VEHICLE'],pts:150,m:10,t:9,sv:3,inv:0,w:11,ld:7,oc:3,ranged:[],melee:[],models:1,abilities:[]};
    FACTIONS.fa={name:'FA',units:['zz_atk'],color:'imp'};FACTIONS.fb={name:'FB',units:['zz_inf','zz_veh'],color:'xenos'};
    pFaction[1]='fa';pFaction[2]='fb';pDetach[1]=null;pDetach[2]=null;turn=1;
    var a=newUnit('zz_atk',1),inf=newUnit('zz_inf',2),veh=newUnit('zz_veh',2);
    a.deployed=inf.deployed=veh.deployed=true;a.hx=10;a.hy=10;inf.hx=11;inf.hy=10;veh.hx=11;veh.hy=11;
    units.length=0;units.push(a,inf,veh);
    // condMet is the join's condition evaluator; check the target-keyword conditions directly against each target
    var ctxInf={att:a,def:inf,weapon:a.melee[0],isMelee:true,p:1};
    var ctxVeh={att:a,def:veh,weapon:a.melee[0],isMelee:true,p:1};
    globalThis.__result={
      infMatchesInfantry: condMet('targetInfantry',ctxInf),
      vehMatchesInfantry: condMet('targetInfantry',ctxVeh),
      vehMatchesVehicle:  condMet('targetVehicle',ctxVeh),
      infMatchesVehicle:  condMet('targetVehicle',ctxInf)
    };
  `,

  // 12. Drukhari Empowered join (graceful-skip guard): fires only if the real export templates are loaded.
  //     Kept so that, in a context WITH the export, this pins the live Pain-ability join too.
  faction_drukhari_empowered: `
    __seedRng(8008);
    var key = TEMPLATES.dru_incubi ? 'dru_incubi' : Object.keys(TEMPLATES).find(function(k){return k.indexOf('dru_')===0;});
    if(!key){ globalThis.__result={skipped:'no drukhari templates loaded'}; }
    else{
      empowered={1:[],2:[]};
      if(!TEMPLATES.tgt_inf){TEMPLATES.tgt_inf={name:'Inf',kw:['INFANTRY'],allKw:['INFANTRY'],pts:60,m:6,t:3,sv:5,inv:0,w:1,ld:7,oc:2,ranged:[],melee:[],models:10,abilities:[]};}
      if(!FACTIONS.dru){FACTIONS.dru={name:'Drukhari',units:[key],color:'xenos'};}
      pFaction[1]='dru';pFaction[2]='dru';pDetach[1]=null;pDetach[2]=null;turn=1;
      var a=newUnit(key,1),t=newUnit('tgt_inf',2);a.deployed=t.deployed=true;a.hx=10;a.hy=10;t.hx=11;t.hy=10;
      units.length=0;units.push(a,t);empowered[1]=[a.id];
      var mm = a.melee&&a.melee.length ? gatherCombatMods(a,t,a.melee[0],true) : null;
      globalThis.__result={ key:key, hasMelee:!!(a.melee&&a.melee.length),
        grantDevastating: mm?mm.grantDevastating:null, grantLethal: mm?mm.grantLethal:null,
        grantSustained: mm?mm.grantSustained:null };
    }
  `
};

// ---- run one scenario in a fresh engine instance, return its result object ----
function runScenario(name){
  makeEnv();
  globalThis.__mulberry32 = mulberry32;
  globalThis.__snap = SNAP;
  globalThis.__result = null;
  const engine = loadEngine();
  const code = engine + "\n" + SCENARIOS[name] + "\nglobalThis.__OUT=globalThis.__result;";
  try {
    global.eval(code);
    return { ok:true, result: globalThis.__OUT };
  } catch(e){
    return { ok:false, error: e.message, stack: (e.stack||'').split('\n').slice(1,3).join(' | ') };
  }
}

function runAll(){
  const out = {};
  for(const name of Object.keys(SCENARIOS)){
    out[name] = runScenario(name);
  }
  return out;
}

// ---- stable stringify (sorted keys) so diffs are meaningful ----
function stable(o){
  return JSON.stringify(o, (k,v)=>{
    if(v && typeof v==='object' && !Array.isArray(v)){
      return Object.keys(v).sort().reduce((a,key)=>{a[key]=v[key];return a;},{});
    }
    return v;
  });
}

const mode = process.argv[2] || 'check';
const BASELINE = 'equiv_baseline.json';

if(mode === 'record'){
  const results = runAll();
  fs.writeFileSync(BASELINE, JSON.stringify(results, null, 2));
  const n = Object.keys(results).length;
  const failed = Object.entries(results).filter(([,r])=>!r.ok);
  console.log(`recorded ${n} scenarios -> ${BASELINE}`);
  if(failed.length) console.log('WARNING — scenarios that errored at record time:', failed.map(([k])=>k).join(', '));
  failed.forEach(([k,r])=>console.log(`   ${k}: ${r.error} (${r.stack})`));
  process.exit(failed.length ? 2 : 0);
}

if(mode === 'check'){
  if(!fs.existsSync(BASELINE)){ console.log('no baseline; run `node equiv_harness.js record` first'); process.exit(3); }
  const base = JSON.parse(fs.readFileSync(BASELINE,'utf8'));
  const now = runAll();
  let diffs = 0, errs = 0;
  for(const name of Object.keys(SCENARIOS)){
    const b = base[name], n = now[name];
    if(!n.ok){ console.log(`✗ ${name}: ERROR ${n.error} (${n.stack})`); errs++; continue; }
    if(!b){ console.log(`• ${name}: NEW scenario (no baseline entry)`); continue; }
    if(stable(b) !== stable(n)){
      console.log(`✗ ${name}: RESULT CHANGED`);
      console.log(`    baseline: ${stable(b.result)}`);
      console.log(`    now:      ${stable(n.result)}`);
      diffs++;
    } else {
      console.log(`✓ ${name}`);
    }
  }
  console.log(`\n${Object.keys(SCENARIOS).length} scenarios | ${diffs} changed | ${errs} errored`);
  process.exit((diffs||errs) ? 1 : 0);
}

console.log('usage: node equiv_harness.js [record|check]');
process.exit(0);
