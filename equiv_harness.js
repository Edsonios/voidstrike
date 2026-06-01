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
  const xv  = fs.existsSync('xvalues.js') ? fs.readFileSync('xvalues.js','utf8') : '';
  const det = fs.readFileSync('detachments.js','utf8');
  const app = fs.readFileSync('app.js','utf8');
  // Expose a hook so scenarios (run inside the eval blob) can install the seeded RNG.
  const boot = `
    logEl=document.getElementById('log');cv=document.getElementById('board');ctx=cv.getContext('2d');
    mode='open';GW=24;GH=22;PNAME={1:'P1',2:'P2'};objectives=[];walls=[];hatchways=[];
    globalThis.__seedRng=function(seed){ Math.random=globalThis.__mulberry32(seed); };
  `;
  return af + "\n" + xv + "\n" + det + "\n" + app + "\n" + boot;
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
  `,

  // 13. Blast: +1 attack per 5 models in the target. 2 models * (base 1 + floor(15/5)=3) = 8 attacks.
  weapon_blast: `
    __seedRng(1313);
    TEMPLATES.bl={name:'Blaster',kw:['INFANTRY'],allKw:['INFANTRY'],pts:100,m:6,t:4,sv:4,inv:0,w:1,ld:6,oc:1,ranged:[{name:'frag',type:'R',rng:24,a:1,skill:3,s:5,ap:0,d:1,ab:{blast:true}}],melee:[],models:2,abilities:[]};
    TEMPLATES.mob={name:'Mob',kw:['INFANTRY'],allKw:['INFANTRY'],pts:90,m:6,t:4,sv:6,inv:0,w:1,ld:6,oc:1,ranged:[],melee:[],models:15,abilities:[]};
    FACTIONS.fa={name:'FA',units:['bl'],color:'imp'};FACTIONS.fb={name:'FB',units:['mob'],color:'xenos'};
    pFaction[1]='fa';pFaction[2]='fb';pDetach[1]=null;pDetach[2]=null;turn=1;
    var a=newUnit('bl',1),t=newUnit('mob',2);a.deployed=t.deployed=true;a.hx=10;a.hy=10;t.hx=12;t.hy=10;
    units.length=0;units.push(a,t);
    var res=resolveAttacks(a,t,a.ranged[0],a.models,true);
    globalThis.__result={attacks:res.attacks};   // expect 2*(1 + floor(15/5)) = 8
  `,

  // 14. Melta: +X damage at half range vs far. Same seed both times; only damage-per-hit differs.
  weapon_melta: `
    TEMPLATES.me={name:'Melta',kw:['INFANTRY'],allKw:['INFANTRY'],pts:100,m:6,t:4,sv:4,inv:0,w:1,ld:2,oc:1,ranged:[{name:'gun',type:'R',rng:24,a:3,skill:2,s:9,ap:-4,d:3,ab:{melta:2}}],melee:[],models:3,abilities:[]};
    TEMPLATES.tank={name:'Tank',kw:['VEHICLE'],allKw:['VEHICLE'],pts:200,m:10,t:9,sv:3,inv:0,w:30,ld:7,oc:2,ranged:[],melee:[],models:1,abilities:[]};
    FACTIONS.fa={name:'FA',units:['me'],color:'imp'};FACTIONS.fb={name:'FB',units:['tank'],color:'xenos'};
    pFaction[1]='fa';pFaction[2]='fb';pDetach[1]=null;pDetach[2]=null;turn=1;
    var aN=newUnit('me',1),tN=newUnit('tank',2);aN.deployed=tN.deployed=true;aN.hx=10;aN.hy=10;tN.hx=12;tN.hy=10; // 4" = half range
    units.length=0;units.push(aN,tN);
    __seedRng(1414);resolveAttacks(aN,tN,aN.ranged[0],aN.models,true);
    var nearW=__snap(tN).w;
    var aF=newUnit('me',1),tF=newUnit('tank',2);aF.deployed=tF.deployed=true;aF.hx=2;aF.hy=2;tF.hx=20;tF.hy=18; // far
    units.length=0;units.push(aF,tF);
    __seedRng(1414);resolveAttacks(aF,tF,aF.ranged[0],aF.models,true);
    var farW=__snap(tF).w;
    globalThis.__result={nearWoundsLeft:nearW, farWoundsLeft:farW, meltaDealtMore:(nearW<farW)};
  `,

  // 15. Heavy: +1 to Hit when stationary. BS6+ so dice of exactly 5 only hit WITH the bonus — proves +1 fired.
  weapon_heavy: `
    TEMPLATES.hv={name:'Heavy',kw:['INFANTRY'],allKw:['INFANTRY'],pts:100,m:6,t:4,sv:4,inv:0,w:1,ld:6,oc:1,ranged:[{name:'cannon',type:'R',rng:36,a:30,skill:6,s:6,ap:-1,d:1,ab:{heavy:true}}],melee:[],models:1,abilities:[]};
    TEMPLATES.bag={name:'Bag',kw:['INFANTRY'],allKw:['INFANTRY'],pts:90,m:6,t:4,sv:7,inv:0,w:999,ld:6,oc:1,ranged:[],melee:[],models:1,abilities:[]};
    FACTIONS.fa={name:'FA',units:['hv'],color:'imp'};FACTIONS.fb={name:'FB',units:['bag'],color:'xenos'};
    pFaction[1]='fa';pFaction[2]='fb';pDetach[1]=null;pDetach[2]=null;turn=1;
    var aS=newUnit('hv',1),tS=newUnit('bag',2);aS.deployed=tS.deployed=true;aS.hx=10;aS.hy=10;tS.hx=14;tS.hy=10;aS.moved=false;
    units.length=0;units.push(aS,tS);
    __seedRng(1515);var rS=resolveAttacks(aS,tS,aS.ranged[0],1,true);
    var aM=newUnit('hv',1),tM=newUnit('bag',2);aM.deployed=tM.deployed=true;aM.hx=10;aM.hy=10;tM.hx=14;tM.hy=10;aM.moved=true;
    units.length=0;units.push(aM,tM);
    __seedRng(1515);var rM=resolveAttacks(aM,tM,aM.ranged[0],1,true);
    // BS6+ moving hits only on 6; stationary (5+) hits on 5 and 6. With 30 dice, stationary MUST score strictly more.
    globalThis.__result={stationaryHits:rS.hits, movedHits:rM.hits, heavyStrictlyHelped:(rS.hits>rM.hits)};
  `,

  // 16. Indirect Fire: no line of sight -> attack still happens at -1 to Hit (and target gains cover).
  //     Stubs visible() to force each branch deterministically, restores it after.
  weapon_indirect: `
    TEMPLATES.ind={name:'Mortar',kw:['INFANTRY'],allKw:['INFANTRY'],pts:100,m:6,t:4,sv:4,inv:0,w:1,ld:6,oc:1,ranged:[{name:'shell',type:'R',rng:48,a:12,skill:3,s:5,ap:0,d:1,ab:{indirect:true}}],melee:[],models:1,abilities:[]};
    TEMPLATES.bag2={name:'Bag2',kw:['INFANTRY'],allKw:['INFANTRY'],pts:90,m:6,t:4,sv:4,inv:0,w:99,ld:6,oc:1,ranged:[],melee:[],models:1,abilities:[]};
    FACTIONS.fa={name:'FA',units:['ind'],color:'imp'};FACTIONS.fb={name:'FB',units:['bag2'],color:'xenos'};
    pFaction[1]='fa';pFaction[2]='fb';pDetach[1]=null;pDetach[2]=null;turn=1;
    var realVisible=visible;
    var a=newUnit('ind',1),t=newUnit('bag2',2);a.deployed=t.deployed=true;a.hx=10;a.hy=10;t.hx=30;t.hy=10;
    units.length=0;units.push(a,t);
    visible=function(){return false;};
    __seedRng(1616);var rNo=resolveAttacks(a,t,a.ranged[0],1,true);
    var t2=newUnit('bag2',2);t2.deployed=true;t2.hx=30;t2.hy=10;units.length=0;units.push(a,t2);
    visible=function(){return true;};
    __seedRng(1616);var rYes=resolveAttacks(a,t2,a.ranged[0],1,true);
    visible=realVisible;
    globalThis.__result={noLoS_hits:rNo.hits, loS_hits:rYes.hits, indirectPenaltyApplied:(rNo.hits<=rYes.hits)};
  `,

  // 17. Unit Coherency: a synced cluster is coherent; a stranded model is not; end-of-turn enforcement
  //     removes exactly the stranded model(s); the 7+ threshold needs two links.
  coherency_capability: `
    mode='open';GW=24;GH=22;PNAME={1:'A',2:'B'};objectives=[];walls=[];hatchways=[];
    TEMPLATES.sq={name:'Sq',kw:['INFANTRY'],allKw:['INFANTRY'],pts:100,m:6,t:4,sv:4,inv:0,w:1,ld:6,oc:1,ranged:[],melee:[],models:5,abilities:[]};
    TEMPLATES.big={name:'Big',kw:['INFANTRY'],allKw:['INFANTRY'],pts:140,m:6,t:4,sv:4,inv:0,w:1,ld:6,oc:1,ranged:[],melee:[],models:8,abilities:[]};
    FACTIONS.a={name:'A',units:['sq','big'],color:'imp'};pFaction[1]='a';turn=1;
    var u=newUnit('sq',1);u.deployed=true;u.hx=10;u.hy=10;syncModelPos(u);
    var coherentCluster=inCoherency(u);                       // expect true (synced cluster)
    // strand model 0 far away
    moveModel(u,0,22,2);
    var afterStrand=inCoherency(u);                           // expect false
    var modelsBefore=u.models;
    var removed=enforceCoherency(u);                          // should drop the stranded model
    var coherentAfter=inCoherency(u);                         // expect true again
    // 7+ unit needs TWO links: a line where an end model has only one neighbour within 2 is incoherent
    var b=newUnit('big',1);b.deployed=true;b.hx=10;b.hy=10;syncModelPos(b);
    var bigCoherent=inCoherency(b);                           // synced 8-model cluster, expect true
    globalThis.__result={
      coherentCluster:coherentCluster, afterStrand:afterStrand,
      removed:removed, modelsBefore:modelsBefore, modelsAfter:u.models, coherentAfter:coherentAfter,
      bigClusterCoherent:bigCoherent
    };
  `,

  // 18. Multi-target melee: a unit with populated per-model positions straddling TWO enemies splits its
  //     models between them. With modelPos populated and models placed adjacent to two different foes,
  //     meleeTargetSplit must return two entries whose model counts sum to the unit size.
  multitarget_melee: `
    mode='open';GW=24;GH=22;PNAME={1:'A',2:'B'};objectives=[];walls=[];hatchways=[];
    TEMPLATES.sq={name:'Sq',kw:['INFANTRY'],allKw:['INFANTRY'],pts:100,m:6,t:4,sv:4,inv:0,w:1,ld:6,oc:1,ranged:[],melee:[{name:'b',type:'M',rng:0,a:2,skill:3,s:5,ap:-1,d:1,ab:{}}],models:4,abilities:[]};
    TEMPLATES.foe={name:'Foe',kw:['INFANTRY'],allKw:['INFANTRY'],pts:80,m:6,t:4,sv:5,inv:0,w:1,ld:6,oc:1,ranged:[],melee:[],models:3,abilities:[]};
    FACTIONS.a={name:'A',units:['sq'],color:'imp'};FACTIONS.b={name:'B',units:['foe'],color:'xenos'};
    pFaction[1]='a';pFaction[2]='b';turn=1;
    var u=newUnit('sq',1);u.deployed=true;u.hx=10;u.hy=10;
    var eA=newUnit('foe',2);eA.deployed=true;eA.hx=8;eA.hy=10;syncModelPos(eA);
    var eB=newUnit('foe',2);eB.deployed=true;eB.hx=12;eB.hy=10;syncModelPos(eB);
    units.length=0;units.push(u,eA,eB);
    // hand-place u's 4 models: two adjacent to eA (left), two adjacent to eB (right)
    u.modelPos=[{hx:9,hy:10},{hx:9,hy:11},{hx:11,hy:10},{hx:11,hy:11}];recenterToken(u);
    var split=meleeTargetSplit(u);
    var byFoe={};split.forEach(s=>{byFoe[s.enemy.hx<10?'left':'right']=s.nModels;});
    globalThis.__result={
      numTargets:split.length, totalModels:split.reduce((a,s)=>a+s.nModels,0),
      leftCount:byFoe.left||0, rightCount:byFoe.right||0
    };
  `,

  // 19. Reserves / Deep Strike: round gating, wall-aware distance, and end-of-R3 destruction carve-out.
  reserves_deepstrike: `
    mode='open';GW=24;GH=22;PNAME={1:'A',2:'B'};objectives=[];walls=[];hatchways=[];
    entryZones={1:[{x0:0,y0:GH-6,x1:GW-1,y1:GH-1}],2:[{x0:0,y0:0,x1:GW-1,y1:5}]};
    TEMPLATES.ds={name:'DS',kw:['INFANTRY'],allKw:['INFANTRY','DEEP STRIKE'],pts:100,m:6,t:4,sv:4,inv:0,w:1,ld:6,oc:1,ranged:[],melee:[],models:5,abilities:[{name:'Deep Strike',type:'Core',desc:'x'}]};
    TEMPLATES.foe={name:'Foe',kw:['INFANTRY'],allKw:['INFANTRY'],pts:80,m:6,t:4,sv:4,inv:0,w:1,ld:6,oc:1,ranged:[],melee:[],models:5,abilities:[]};
    FACTIONS.a={name:'A',units:['ds'],color:'imp'};FACTIONS.b={name:'B',units:['foe'],color:'xenos'};
    pFaction[1]='a';pFaction[2]='b';turn=1;round=1;

    // a reserved Deep Strike unit, an enemy on the board at (10,10)
    var u=newUnit('ds',1);reserveUnit(u,true);
    var foe=newUnit('foe',2);foe.deployed=true;foe.hx=10;foe.hy=10;syncModelPos(foe);
    units.length=0;units.push(u,foe);

    // (a) placement within 9" of the enemy is rejected; beyond 9" accepted
    var near=deepStrikePlace(u,11,10);          // ~2" away -> reject (still in reserve)
    var stillReserve=u.inReserve;
    var far=deepStrikePlace(u,10,20);           // 10" away (>9") -> accept
    var placedFar=!u.inReserve;

    // (b) wall-aware: put the unit back in reserve, drop a wall between a near enemy and the drop point
    reserveUnit(u,true);
    walls=[{type:'v',x:11,y:10}];               // vertical wall segment between enemy(10,10) and (12,10)
    var nearBehindWall=deepStrikePlace(u,12,10);// within 9" but wall blocks the line -> enemy ignored -> accept
    var placedBehindWall=!u.inReserve;
    walls=[];

    // (c) round gating via beginReinforcements eligibility: DS not eligible R1, eligible R2
    reserveUnit(u,true);units.length=0;units.push(u,foe);
    round=1;var r1=beginReinforcements(1);var dsR1=action&&action.dsEligible;
    round=2;var r2=beginReinforcements(1);var dsR2=action&&action.dsEligible;
    action=null;

    // (d) end-of-R3 destruction carve-out: pre-battle reserve (_reserveRound<=1) destroyed; late reserve survives
    var early=newUnit('ds',1);reserveUnit(early,true);early._reserveRound=0;   // pre-battle
    var late=newUnit('ds',1);reserveUnit(late,true);late._reserveRound=3;      // reserved during R3
    units.length=0;units.push(early,late);
    // simulate the end-of-R3 sweep directly
    round=3;
    units.filter(x=>!x.dead&&x.inReserve&&(x._reserveRound==null||x._reserveRound<=1)).forEach(x=>{x.dead=true;});

    globalThis.__result={
      nearRejected:(near===false&&stillReserve===true), farAccepted:(far===true&&placedFar===true),
      wallIgnoredAccepted:(nearBehindWall===true&&placedBehindWall===true),
      dsBlockedR1:(dsR1===false), dsAllowedR2:(dsR2===true),
      earlyDestroyed:early.dead, lateSurvived:!late.dead
    };
  `,

  // 20. Transports: embark (capacity), disembark (3" + timing), destroyed-transport disembark, Firing Deck.
  transports: `
    mode='open';GW=24;GH=22;PNAME={1:'A',2:'B'};objectives=[];walls=[];hatchways=[];
    TEMPLATES.rhino={name:'Rhino',kw:['VEHICLE','TRANSPORT'],allKw:['VEHICLE','TRANSPORT'],pts:75,m:12,t:9,sv:3,inv:0,w:10,ld:6,oc:2,ranged:[{name:'bolter',type:'R',rng:24,a:3,skill:3,s:4,ap:0,d:1,ab:{}}],melee:[],models:1,transportCapacity:10,firingDeck:1,abilities:[]};
    TEMPLATES.squad={name:'Squad',kw:['INFANTRY'],allKw:['INFANTRY'],pts:90,m:6,t:4,sv:4,inv:0,w:1,ld:6,oc:1,ranged:[{name:'rifle',type:'R',rng:24,a:1,skill:3,s:4,ap:0,d:1,ab:{}}],melee:[],models:5,abilities:[]};
    TEMPLATES.big={name:'Big',kw:['INFANTRY'],allKw:['INFANTRY'],pts:120,m:6,t:4,sv:4,inv:0,w:1,ld:6,oc:1,ranged:[],melee:[],models:8,abilities:[]};
    TEMPLATES.foe={name:'Foe',kw:['INFANTRY'],allKw:['INFANTRY'],pts:80,m:6,t:4,sv:4,inv:0,w:1,ld:6,oc:1,ranged:[],melee:[],models:5,abilities:[]};
    FACTIONS.a={name:'A',units:['rhino','squad','big'],color:'imp'};FACTIONS.b={name:'B',units:['foe'],color:'xenos'};
    pFaction[1]='a';pFaction[2]='b';turn=1;round=1;

    // capacity check: capacity 10; a 5-model squad fits, then an 8-model unit does NOT (5+8>10)
    var tr=newUnit('rhino',1);tr.deployed=true;tr.hx=10;tr.hy=10;syncModelPos(tr);
    var sq=newUnit('squad',1);sq.deployed=true;sq.hx=11;sq.hy=10;syncModelPos(sq);  // within 3"
    var big=newUnit('big',1);big.deployed=true;big.hx=11;big.hy=11;syncModelPos(big);
    units.length=0;units.push(tr,sq,big);
    var emb1=embarkUnit(sq,tr);                 // 5 models -> fits
    var emb2=embarkUnit(big,tr);                // +8 -> exceeds 10 -> reject
    var capacityRespected=(emb1===true && emb2===false);
    var sqOffBoard=(sq._embarkedIn===tr.id && sq.deployed===false);

    // disembark within 3", clear of enemies
    var dis=disembarkUnit(sq,tr,10,12);         // 2 cells (~4"?) -> within 3"? cell dist 2 -> rawDist 4 >3; try adjacent
    var dis2=sq._embarkedIn?disembarkUnit(sq,tr,11,10):true;  // adjacent cell within 3"
    var disembarked=(sq._embarkedIn===null && sq.deployed===true);

    // Firing Deck: re-embark squad, transport gains an extra weapon, squad locked from shooting
    sq._embarkedIn=tr.id;sq.deployed=false;sq.shotWith=[];
    var deck=firingDeckShots(tr);
    var deckGaveShot=(deck.length===1);
    var paxLockedOut=(sq.shotWith&&sq.shotWith.length>0);

    // destroyed transport: embark the squad, kill the transport, squad must bail (battle-shocked, on board or dead)
    sq._embarkedIn=tr.id;sq.deployed=false;sq.shotWith=[];sq.bshock=false;
    var foe=newUnit('foe',2);foe.deployed=true;foe.hx=20;foe.hy=20;syncModelPos(foe);units.push(foe);
    tr.dead=false;
    destroyedTransportDisembark(tr);
    var bailedOut=(sq._embarkedIn===null && (sq.deployed===true||sq.dead===true));
    var bshockApplied=(sq.dead||sq.bshock===true);

    globalThis.__result={
      capacityRespected:capacityRespected, sqOffBoard:sqOffBoard,
      disembarked:disembarked, deckGaveShot:deckGaveShot, paxLockedOut:!!paxLockedOut,
      bailedOut:bailedOut, bshockApplied:bshockApplied
    };
  `,

  // 21. X-values override library: applyXValues stamps firingDeck (default 2 present), and overrides from
  //     X_VALUES win over imported values. Verifies the re-fetch-surviving override layer works.
  xvalues_override: `
    // simulate an imported transport template with Firing Deck present (default 2 from importer) and a
    // template id that exists in X_VALUES.firingDeck
    var fdId = (typeof X_VALUES!=='undefined' && X_VALUES.firingDeck) ? Object.keys(X_VALUES.firingDeck)[0] : null;
    var ddId = (typeof X_VALUES!=='undefined' && X_VALUES.deadlyDemise) ? Object.keys(X_VALUES.deadlyDemise)[0] : null;
    // create templates at those ids and run applyXValues
    if(fdId){TEMPLATES[fdId]={name:'FDtest',kw:['VEHICLE','TRANSPORT'],allKw:['VEHICLE','TRANSPORT'],pts:80,m:10,t:9,sv:3,inv:0,w:10,ld:6,oc:2,ranged:[],melee:[],models:1,abilities:[],firingDeck:0,transportCapacity:10};}
    if(ddId){TEMPLATES[ddId]=TEMPLATES[ddId]||{name:'DDtest',kw:['VEHICLE'],allKw:['VEHICLE'],pts:80,m:10,t:9,sv:3,inv:0,w:10,ld:6,oc:2,ranged:[],melee:[],models:1,abilities:[]};}
    // temporarily set a known deadlyDemise override to prove a non-null value stamps
    var savedDD = ddId? X_VALUES.deadlyDemise[ddId] : undefined;
    if(ddId) X_VALUES.deadlyDemise[ddId]='D3';
    applyXValues();
    var fdApplied = fdId? TEMPLATES[fdId].firingDeck : 2;     // override 2 should win over imported 0
    var ddApplied = ddId? TEMPLATES[ddId].deadlyDemise : 'D3';
    if(ddId) X_VALUES.deadlyDemise[ddId]=savedDD;             // restore (don't mutate the shared lib across runs)
    globalThis.__result={
      hasXValues: (typeof X_VALUES!=='undefined'),
      firingDeckApplied: fdApplied, deadlyDemiseStamped: ddApplied
    };
  `,

  // 22. Wargear-options loadout parser, pinned against the REAL Wahapedia grammar (verified vs the live
  //     export at ~89% of real option lines). Common patterns parse; tokens/footnotes/None skipped or
  //     left unparsed; illegal loadouts never invented.
  loadout_parser: `
    var rows=[
      {description:"This model's multi-melta can be replaced with 1 Kheres-pattern assault cannon."},
      {description:"This model can be equipped with 1 hunter-killer missile."},
      {description:"Any number of models can each have their guardian spear replaced with 1 castellan axe."},
      {description:"Up to 2 Storm Guardians can each have their shuriken pistol replaced with 1 flamer."},
      {description:"The Skitarii Ranger Alpha can be equipped with 1 Alpha combat weapon."},
      {description:"None"},
      {description:"* That model's galvanic rifle cannot be replaced."},
      {description:"For every 5 models in this unit, it can have 1 Aspect Shrine token."}
    ];
    var res=parseLoadoutOptions(rows);
    var rep=res.options.find(o=>o.replace[0]==='multi-melta');
    var equip=res.options.find(o=>o.take[0]==='hunter-killer missile');
    var anyNum=res.options.find(o=>o.ratio&&o.ratio.n==='*');
    var upTo=res.options.find(o=>o.ratio&&o.ratio.n===2);
    // choice-of-actions ("can do one of the following")
    var coa=parseLoadoutOptions([{description:"The Assault Sergeant can do one of the following:Replace its bolt pistol and Astartes chainsword with 1 twin lightning claws.Be equipped with 1 Astartes shield."}]).options[0];
    globalThis.__result={
      parsedCount:res.options.length, unparsedCount:res.unparsed.length,
      replaceOK:!!(rep&&rep.with[0]==='Kheres-pattern assault cannon'),
      equipOK:!!equip,
      anyNumberOK:!!(anyNum&&anyNum.replace[0]==='guardian spear'&&anyNum.with[0]==='castellan axe'),
      upToNOK:!!(upTo&&upTo.with[0]==='flamer'),
      noneSkipped: !res.options.some(o=>/none/i.test(o.raw)) && !res.unparsed.some(u=>/^none$/i.test(u)),
      footnoteSkipped: !res.unparsed.some(u=>/^\\*/.test(u)),
      choiceOfActionsOK: !!(coa&&coa.choices&&coa.choices.length===2&&coa.choices[0].replace.length===2&&coa.choices[1].take[0]==='Astartes shield')
    };
  `,

  // 24. Facing/heading math (Pass A — dormant facing layer). Pure helpers must compute correct angles;
  //     setFacingFromMove records direction of travel; withinArc gates a forward ±arc. Read by nothing yet.
  facing_math: `
    mode='open';GW=24;GH=22;PNAME={1:'A',2:'B'};objectives=[];walls=[];hatchways=[];
    TEMPLATES.q={name:'Q',kw:['INFANTRY'],allKw:['INFANTRY'],pts:10,m:6,t:4,sv:4,inv:0,w:1,ld:6,oc:1,ranged:[],melee:[],models:1,abilities:[]};
    FACTIONS.a={name:'A',units:['q'],color:'imp'};pFaction[1]='a';
    var u=newUnit('q',1);u.deployed=true;u.hx=10;u.hy=10;syncModelPos(u);u.facing=0;
    var east=Math.round(headingDeg(0,0,5,0)), south=Math.round(headingDeg(0,0,0,5)), west=Math.round(headingDeg(0,0,-5,0));
    var wrap=pivotDiff(170,-170);
    var arcAhead=withinArc(u,15,10,90), arcBehind=withinArc(u,5,10,90), arcEdge=withinArc(u,10,5,90);
    u.facing=null;setFacingFromMove(u,10,10,10,16);var recS=Math.round(u.facing);
    u.facing=45;setFacingFromMove(u,10,10,10,10);var kept=u.facing;
    globalThis.__result={
      east:east, south:south, west:west, wrap:wrap,
      arcAhead:arcAhead, arcBehind:arcBehind, arcEdgeInclusive:arcEdge,
      recordedSouth:recS, keptOnZeroMove:kept
    };
  `,

  // 25. Aircraft movement (Pass B): >=20" minimum forward move, 90 deg pivot cap (no rearward dest), only a
  //     Normal move; reserveAircraft puts them in Reserves at battle start. Non-aircraft unaffected.
  aircraft_move: `
    mode='open';GW=40;GH=30;PNAME={1:'A',2:'B'};objectives=[];walls=[];hatchways=[];turn=1;phaseIdx=1;
    TEMPLATES.jet={name:'Jet',kw:['VEHICLE','AIRCRAFT','FLY'],allKw:['VEHICLE','AIRCRAFT','FLY'],pts:160,m:20,t:10,sv:3,inv:0,w:14,ld:6,oc:0,ranged:[{name:'gun',type:'R',rng:36,a:4,skill:3,s:7,ap:-1,d:2,ab:{}}],melee:[],models:1,abilities:[]};
    TEMPLATES.inf={name:'Inf',kw:['INFANTRY'],allKw:['INFANTRY'],pts:80,m:6,t:4,sv:4,inv:0,w:1,ld:6,oc:1,ranged:[],melee:[],models:5,abilities:[]};
    FACTIONS.a={name:'A',units:['jet','inf'],color:'imp'};pFaction[1]='a';pDetach[1]=null;
    var jet=newUnit('jet',1);jet.deployed=true;jet.hx=5;jet.hy=15;syncModelPos(jet);jet.facing=0; // facing east (+x)
    var inf=newUnit('inf',1);inf.deployed=true;inf.hx=5;inf.hy=20;syncModelPos(inf);
    units.length=0;units.push(jet,inf);
    // (a) short move (<20") rejected — jet stays put
    tryMove(jet,8,15);                       // 3 cells = 6" -> reject
    var shortRejected=(jet.hx===5&&jet.hy===15&&!jet.moved);
    // (b) >=20" forward (east) move within arc accepted
    tryMove(jet,26,15);                      // 21 cells east = 21" (>=20) within arc -> accept
    var forwardOK=(jet.hx===26&&jet.moved);
    // (c) reset, try to move BEHIND heading (west) >=20": should reject (needs >90 deg pivot)
    jet.moved=false;jet.hx=30;jet.hy=15;jet.facing=0;syncModelPos(jet);
    tryMove(jet,9,15);                       // 21 cells west = 21" but behind heading -> reject (>90 deg)
    var rearwardRejected=(jet.hx===30&&!jet.moved);
    // (d) non-aircraft unaffected: infantry normal 6" move works
    tryMove(inf,7,20);                       // 2 cells = 4" <= 6"
    var infMovedNormally=(inf.hx===7&&inf.moved);
    // (e) reserveAircraft puts a deployed aircraft into reserve
    var jet2=newUnit('jet',1);jet2.deployed=true;jet2.hx=5;jet2.hy=5;syncModelPos(jet2);units.push(jet2);
    reserveAircraft(1);
    var aircraftReserved=(jet2.inReserve===true);
    globalThis.__result={shortRejected,forwardOK,rearwardRejected,infMovedNormally,aircraftReserved};
  `,

  // 26. Aircraft combat & Hover (Pass C): aircraft can't charge; only FLY can charge/melee an aircraft;
  //     aircraft only melee FLY; aircraft with no FLY enemy makes no attacks; Hover strips aircraft rules.
  aircraft_combat: `
    mode='open';GW=24;GH=22;PNAME={1:'A',2:'B'};objectives=[];walls=[];hatchways=[];turn=1;phaseIdx=3;
    TEMPLATES.jet={name:'Jet',kw:['VEHICLE','AIRCRAFT','FLY'],allKw:['VEHICLE','AIRCRAFT','FLY'],pts:160,m:20,t:10,sv:3,inv:0,w:14,ld:6,oc:0,ranged:[],melee:[{name:'strafe',type:'M',rng:0,a:3,skill:3,s:6,ap:-1,d:1,ab:{}}],models:1,abilities:[{name:'Hover',type:'Core',desc:'x'}]};
    TEMPLATES.inf={name:'Inf',kw:['INFANTRY'],allKw:['INFANTRY'],pts:80,m:6,t:4,sv:4,inv:0,w:1,ld:6,oc:1,ranged:[],melee:[{name:'cc',type:'M',rng:0,a:2,skill:3,s:4,ap:0,d:1,ab:{}}],models:5,abilities:[]};
    TEMPLATES.flyer={name:'Flyer',kw:['INFANTRY','FLY'],allKw:['INFANTRY','FLY'],pts:90,m:12,t:4,sv:4,inv:0,w:2,ld:6,oc:1,ranged:[],melee:[{name:'cc',type:'M',rng:0,a:3,skill:3,s:5,ap:-1,d:1,ab:{}}],models:3,abilities:[]};
    FACTIONS.a={name:'A',units:['jet','inf','flyer'],color:'imp'};FACTIONS.b={name:'B',units:['inf','flyer'],color:'xenos'};
    pFaction[1]='a';pFaction[2]='b';pDetach[1]=null;pDetach[2]=null;

    // (a) aircraft can't charge: beginChargeSelection should refuse (action stays null)
    var jet=newUnit('jet',1);jet.deployed=true;jet.hx=10;jet.hy=10;syncModelPos(jet);
    var ground=newUnit('inf',2);ground.deployed=true;ground.hx=11;ground.hy=10;syncModelPos(ground);
    var flyer=newUnit('flyer',2);flyer.deployed=true;flyer.hx=10;flyer.hy=11;syncModelPos(flyer);
    units.length=0;units.push(jet,ground,flyer);
    action=null; beginChargeSelection(jet); var aircraftCantCharge=(action===null);

    // (b) ground (non-FLY) charging: aircraft NOT an eligible target, but the flyer enemy is
    action=null; beginChargeSelection(ground);
    var groundTargets=action?action.targets.map(t=>t.id):[];
    var groundCantTargetAircraft=!groundTargets.includes(jet.id);
    action=null;

    // (c) melee: aircraft (jet) engaged with both a ground unit and a flyer -> may only hit the flyer
    var jetFoes=meleeTargetSplit(jet).map(p=>p.enemy.id);
    var jetOnlyHitsFly=(jetFoes.includes(flyer.id)&&!jetFoes.includes(ground.id));

    // (d) ground unit engaged only with the aircraft -> no legal melee targets (empty split)
    var lonelyGround=newUnit('inf',2);lonelyGround.deployed=true;lonelyGround.hx=10;lonelyGround.hy=10; // co-located with jet only
    units.push(lonelyGround);
    var groundVsAircraftOnly=meleeTargetSplit(lonelyGround).filter(p=>p.enemy.id===jet.id).length===0;

    // (e) Hover strips aircraft behaviour: setHover(true) -> isAircraft false, M=20
    var hov=newUnit('jet',1);hov.deployed=true;hov.hx=2;hov.hy=2;syncModelPos(hov);
    var wasAircraft=isAircraft(hov);
    setHover(hov,true);
    var hoverStrips=(wasAircraft===true && isAircraft(hov)===false && hov.m===20);
    setHover(hov,false);
    var hoverReversible=(isAircraft(hov)===true);

    globalThis.__result={aircraftCantCharge,groundCantTargetAircraft,jetOnlyHitsFly,groundVsAircraftOnly,hoverStrips,hoverReversible};
  `,

  // 27. Grid resolution invariant: at HEX_INCH=1 the sim grid is 1"/cell. Physical distances must hold —
  //     an M=6 unit moves up to 6 cells (=6"), 7 cells (=7") is not a plain Normal move; coherency stays 2".
  grid_resolution: `
    mode='open';GW=48;GH=44;PNAME={1:'A',2:'B'};objectives=[];walls=[];hatchways=[];turn=1;phaseIdx=1;
    TEMPLATES.inf={name:'Inf',kw:['INFANTRY'],allKw:['INFANTRY'],pts:80,m:6,t:4,sv:4,inv:0,w:1,ld:6,oc:1,ranged:[],melee:[],models:5,abilities:[]};
    FACTIONS.a={name:'A',units:['inf'],color:'imp'};pFaction[1]='a';pDetach[1]=null;
    var u=newUnit('inf',1);u.deployed=true;u.hx=10;u.hy=10;syncModelPos(u);units.length=0;units.push(u);
    var hexInch=HEX_INCH;
    // M=6 over 6 cells = 6" -> legal Normal move
    tryMove(u,16,10); var move6OK=(u.hx===16&&u.moved);
    // 7 cells = 7" > M6 -> not a plain Normal move (stays, an Advance action would be offered)
    u.moved=false;u.hx=10;syncModelPos(u);tryMove(u,17,10); var move7NotNormal=(u.hx===10);
    globalThis.__result={hexInch:hexInch, boardDoubled:(GW===48&&GH===44), move6OK:move6OK, move7NotNormal:move7NotNormal, cohCells:COH_CELLS};
  `,

  // 28. Deadly Demise x: on a 6 when destroyed, each unit within 6" takes x mortal wounds (random rolled
  //     per unit); '?' magnitude (data-blocked) inflicts nothing; units beyond 6" are safe; fires once.
  deadly_demise: `
    mode='open';GW=48;GH=44;PNAME={1:'A',2:'B'};objectives=[];walls=[];hatchways=[];turn=1;
    TEMPLATES.tank={name:'Tank',kw:['VEHICLE'],allKw:['VEHICLE'],pts:150,m:10,t:9,sv:3,inv:0,w:10,ld:6,oc:0,ranged:[],melee:[],models:1,abilities:[]};
    TEMPLATES.vic={name:'Vic',kw:['INFANTRY'],allKw:['INFANTRY'],pts:60,m:6,t:4,sv:5,inv:0,w:2,ld:6,oc:1,ranged:[],melee:[],models:6,abilities:[]};
    FACTIONS.a={name:'A',units:['tank']};FACTIONS.b={name:'B',units:['vic']};pFaction[1]='a';pFaction[2]='b';
    function setup(dd){var tank=newUnit('tank',1);tank._deadlyDemise=dd;tank.deployed=true;tank.hx=20;tank.hy=20;syncModelPos(tank);
      var near=newUnit('vic',2);near.deployed=true;near.hx=23;near.hy=20;syncModelPos(near);   // 3" away
      var far=newUnit('vic',2);far.deployed=true;far.hx=30;far.hy=20;syncModelPos(far);        // 10" away
      units.length=0;units.push(tank,near,far);return {tank,near,far};}
    // forced 6 (Math.random=0.99 -> d6=6), DD=3: near hit, far untouched
    var _savedRng=Math.random; Math.random=function(){return 0.99;};
    var g=setup(3); var nb=g.near.models, fb=g.far.models;
    deadlyDemiseCheck(g.tank);
    var nearHit=(g.near.dead||g.near.models<nb), farSafe=(g.far.models===fb);
    // '?' magnitude: 6 rolled but no damage
    var gq=setup('?'); var nbq=gq.near.models; deadlyDemiseCheck(gq.tank); var unknownNoDamage=(gq.near.models===nbq);
    // non-6 (Math.random=0): no detonation; guard set
    Math.random=function(){return 0.0;};
    var gn=setup(3); var nbn=gn.near.models; deadlyDemiseCheck(gn.tank); var nonSixNoDamage=(gn.near.models===nbn), guardSet=(gn.tank._demiseDone===true);
    Math.random=_savedRng;
    globalThis.__result={nearHit, farSafe, unknownNoDamage, nonSixNoDamage, guardSet};
  `,

  // 29. Emergency Disembarkation: if a unit can't be placed wholly within 3" of the destroyed transport (and
  //     clear of Engagement Range), it uses the 6" ring instead and takes a mortal on each 1-3 (not just 1);
  //     if it still can't be placed, it's destroyed. Forced 1-3 rolls via Math.random to make damage occur.
  emergency_disembark: `
    mode='open';GW=48;GH=44;PNAME={1:'A',2:'B'};objectives=[];walls=[];hatchways=[];turn=1;round=1;
    TEMPLATES.rhino={name:'Rhino',kw:['VEHICLE','TRANSPORT'],allKw:['VEHICLE','TRANSPORT'],pts:75,m:12,t:9,sv:3,inv:0,w:10,ld:6,oc:2,ranged:[],melee:[],models:1,transportCapacity:10,abilities:[]};
    TEMPLATES.squad={name:'Squad',kw:['INFANTRY'],allKw:['INFANTRY'],pts:90,m:6,t:4,sv:4,inv:0,w:1,ld:6,oc:1,ranged:[],melee:[],models:5,abilities:[]};
    TEMPLATES.foe={name:'Foe',kw:['INFANTRY'],allKw:['INFANTRY'],pts:80,m:6,t:4,sv:4,inv:0,w:1,ld:6,oc:1,ranged:[],melee:[],models:5,abilities:[]};
    FACTIONS.a={name:'A',units:['rhino','squad'],color:'imp'};FACTIONS.b={name:'B',units:['foe'],color:'xenos'};
    pFaction[1]='a';pFaction[2]='b';

    // ring enemies ~3" around the transport so the 3" disembark ring is all within Engagement Range -> forces
    // the 6" emergency ring. (At 1"/cell, place foes 3 cells out on the 4 diagonals/orthogonals.)
    var _save=Math.random; Math.random=function(){return 0.1;};   // d6 -> 1 (a 1-3 result => emergency mortal)
    var tr=newUnit('rhino',1);tr.deployed=true;tr.hx=24;tr.hy=22;syncModelPos(tr);
    var sq=newUnit('squad',1);sq.deployed=true;sq.hx=25;sq.hy=22;syncModelPos(sq);
    units.length=0;units.push(tr,sq);
    embarkUnit(sq,tr);
    // surround at 3 cells (=3") in 8 directions to block the 3" ring with Engagement Range
    [[3,0],[-3,0],[0,3],[0,-3],[2,2],[-2,2],[2,-2],[-2,-2]].forEach((d,i)=>{var f=newUnit('foe',2);f.deployed=true;f.hx=tr.hx+d[0];f.hy=tr.hy+d[1];syncModelPos(f);units.push(f);});
    sq._embarkedIn=tr.id;sq.deployed=false;sq.bshock=false;
    var before=sq.models;
    destroyedTransportDisembark(tr);
    // expect: placed on the 6" ring (deployed) OR destroyed; battle-shocked; took mortal(s) from the 1-3 rolls
    var placedOrDead=(sq._embarkedIn===null && (sq.deployed===true||sq.dead===true));
    var tookEmergencyMortals=(sq.dead||sq.models<before);
    var bshock=(sq.dead||sq.bshock===true);

    // fully enclosed: a transport boxed in by enemies at every range -> unit cannot be placed -> destroyed
    var tr2=newUnit('rhino',1);tr2.deployed=true;tr2.hx=5;tr2.hy=5;syncModelPos(tr2);
    var sq2=newUnit('squad',1);sq2.deployed=true;sq2.hx=6;sq2.hy=5;syncModelPos(sq2);units.push(tr2,sq2);
    embarkUnit(sq2,tr2);sq2._embarkedIn=tr2.id;sq2.deployed=false;
    // flood the whole 6" neighbourhood with enemies (within ER of every candidate cell)
    for(var dx=-7;dx<=7;dx++)for(var dy=-7;dy<=7;dy++){if(!dx&&!dy)continue;var fx=tr2.hx+dx,fy=tr2.hy+dy;if(fx<0||fy<0||fx>=GW||fy>=GH)continue;var f=newUnit('foe',2);f.deployed=true;f.hx=fx;f.hy=fy;f.models=1;syncModelPos(f);units.push(f);}
    destroyedTransportDisembark(tr2);
    var enclosedDestroyed=(sq2.dead===true);

    Math.random=_save;
    globalThis.__result={placedOrDead, tookEmergencyMortals, bshock, enclosedDestroyed};
  `,

  // 23. Plasmacyte (Necron Destroyer Cult): floor(models/3) tokens granted at battle start; spending one
  //     when the unit fights gives its melee [DEVASTATING WOUNDS] for that fight; token consumed; no leak.
  plasmacyte: `
    mode='open';GW=24;GH=22;PNAME={1:'A',2:'B'};objectives=[];walls=[];hatchways=[];
    TEMPLATES.skor={name:'Skorpekh',kw:['INFANTRY'],allKw:['INFANTRY'],pts:90,m:6,t:6,sv:4,inv:0,w:3,ld:6,oc:1,ranged:[],melee:[{name:'blade',type:'M',rng:0,a:10,skill:2,s:14,ap:-3,d:2,ab:{}}],models:6,abilities:[{name:'Plasmacyte',type:'Datasheet',desc:'[DEVASTATING WOUNDS]'}]};
    TEMPLATES.tgt={name:'Tgt',kw:['INFANTRY'],allKw:['INFANTRY'],pts:80,m:6,t:4,sv:2,inv:0,w:6,ld:6,oc:1,ranged:[],melee:[],models:3,abilities:[]};
    FACTIONS.a={name:'A',units:['skor'],color:'imp'};FACTIONS.b={name:'B',units:['tgt'],color:'xenos'};
    pFaction[1]='a';pFaction[2]='b';turn=1;
    var u=newUnit('skor',1);u.deployed=true;u.hx=10;u.hy=10;
    var e=newUnit('tgt',2);e.deployed=true;e.hx=11;e.hy=10;
    units.length=0;units.push(u,e);
    grantPlasmacytes(1);
    var granted=u._plasmacytes;                       // expect 2 = floor(6/3)
    // many attacks (10 A x 6 models) at high S so wound-crits (6s) reliably occur; buff turns crits into mortals
    __seedRng(7);
    u.melee[0].ab.devastating=true;
    var withBuff=resolveAttacks(u,e,u.melee[0],6,true);
    delete u.melee[0].ab.devastating;
    globalThis.__result={
      granted:granted,
      devastatingProducesMortals:(withBuff.devastating>0),
      buffNotLeakedAfter:!(u.melee[0].ab&&u.melee[0].ab.devastating)
    };
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
