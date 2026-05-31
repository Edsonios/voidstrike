/* =====================================================================
   VOIDSTRIKE — Warhammer 40,000 10th edition simulator
   Single-file engine. Loaded by index.html.
   ===================================================================== */

const d6=()=>Math.floor(Math.random()*6)+1;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const $=id=>document.getElementById(id);

/* ---------- BUILT-IN DATASHEETS (offline fallback) ---------- */
function W(name,type,rng,a,skill,s,ap,d,ab){return{name,type,rng,a,skill,s,ap,d,ab:ab||{}};}
let TEMPLATES={
  captain:{name:"Captain",kw:["CHARACTER","INFANTRY","TACTICUS"],pts:80,m:6,t:4,sv:3,inv:4,w:5,ld:6,oc:1,models:1,
    ranged:[W("Master-crafted bolter","R",24,2,2,4,-1,2),W("Bolt pistol","R",12,1,2,4,0,1,{pistol:true})],
    melee:[W("Master-crafted power weapon","M",0,6,2,5,-2,2)],abilities:[{name:"Leader",type:"Core",desc:"Can be attached to a Bodyguard unit."},{name:"Oath of Moment",type:"Faction",desc:"Re-roll Hit rolls against your Oath target."},{name:"Rites of Battle",type:"Datasheet",desc:"Once per round, reduce a Stratagem's CP cost by 1."}]},
  lieutenant:{name:"Lieutenant",kw:["CHARACTER","INFANTRY","TACTICUS"],pts:70,m:6,t:4,sv:3,inv:0,w:4,ld:6,oc:1,models:1,
    ranged:[W("Plasma pistol (supercharge)","R",12,1,2,8,-3,2,{hazardous:true,pistol:true})],
    melee:[W("Power fist","M",0,4,2,8,-2,2)],abilities:[{name:"Leader",type:"Core",desc:"Can be attached to a Bodyguard unit."},{name:"Oath of Moment",type:"Faction",desc:"Re-roll Hit rolls against your Oath target."},{name:"Target Priority",type:"Datasheet",desc:"Its unit ignores modifiers to Hit when shooting your Oath target."}]},
  intercessors:{name:"Intercessor Squad",kw:["INFANTRY","BATTLELINE","TACTICUS"],pts:80,m:6,t:4,sv:3,inv:0,w:2,ld:6,oc:2,models:5,
    ranged:[W("Bolt rifle","R",24,2,3,4,-1,1,{rapidfire:1})],melee:[W("Close combat weapon","M",0,3,3,4,0,1)],
    abilities:[{name:"Oath of Moment",type:"Faction",desc:"Re-roll Hit rolls against your Oath target."},{name:"Objective Secured",type:"Datasheet",desc:"Sticky objectives: stays held after you leave."}]},
  assault:{name:"Assault Intercessors",kw:["INFANTRY","BATTLELINE","TACTICUS"],pts:75,m:6,t:4,sv:3,inv:0,w:2,ld:6,oc:2,models:5,
    ranged:[W("Heavy bolt pistol","R",18,1,3,4,-1,1,{pistol:true})],melee:[W("Astartes chainsword","M",0,4,3,4,-1,1)],
    abilities:[{name:"Oath of Moment",type:"Faction",desc:"Re-roll Hit rolls against your Oath target."},{name:"Shock Assault",type:"Datasheet",desc:"+1 Attack when it charges."}]},
  terminators_sm:{name:"Terminator Squad",kw:["INFANTRY","TERMINATOR"],pts:185,m:5,t:5,sv:2,inv:4,w:3,ld:6,oc:1,models:5,
    ranged:[W("Storm bolter","R",24,2,3,4,0,1,{rapidfire:2})],melee:[W("Power fist","M",0,3,3,8,-2,2)],
    abilities:[{name:"Oath of Moment",type:"Faction",desc:"Re-roll Hit rolls against your Oath target."},{name:"Teleport Homer",type:"Datasheet",desc:"Deep Strike; re-roll Reserves arrival."}]},
  hellblasters:{name:"Hellblaster Squad",kw:["INFANTRY","TACTICUS"],pts:115,m:6,t:4,sv:3,inv:0,w:2,ld:6,oc:2,models:5,
    ranged:[W("Plasma incinerator (supercharge)","R",30,1,3,8,-4,3,{hazardous:true})],melee:[W("Close combat weapon","M",0,1,3,4,0,1)],
    abilities:[{name:"Oath of Moment",type:"Faction",desc:"Re-roll Hit rolls against your Oath target."}]},
  aggressors:{name:"Aggressor Squad",kw:["INFANTRY","GRAVIS"],pts:120,m:5,t:6,sv:3,inv:0,w:4,ld:6,oc:2,models:3,
    ranged:[W("Boltstorm gauntlets","R",18,3,3,4,0,1,{rapidfire:3})],melee:[W("Power fists","M",0,3,3,8,-2,2)],
    abilities:[{name:"Oath of Moment",type:"Faction",desc:"Re-roll Hit rolls against your Oath target."},{name:"Fire Storm",type:"Datasheet",desc:"After shooting, may shoot a second time at a unit within 6\"."}]},
  chaoslord:{name:"Chaos Lord",kw:["CHARACTER","INFANTRY","CHAOS"],pts:85,m:6,t:4,sv:3,inv:4,w:5,ld:6,oc:1,models:1,
    ranged:[W("Bolt pistol","R",12,1,3,4,0,1,{pistol:true})],melee:[W("Daemon hammer","M",0,5,3,8,-2,2)],
    abilities:[{name:"Leader",type:"Core",desc:"Can be attached to a Bodyguard unit."},{name:"Dark Pact",type:"Faction",desc:"Sacrifice to give weapons Lethal Hits (risk mortal wounds)."}]},
  darkapostle:{name:"Dark Apostle",kw:["CHARACTER","INFANTRY","CHAOS"],pts:75,m:6,t:4,sv:3,inv:4,w:5,ld:6,oc:1,models:1,
    ranged:[W("Bolt pistol","R",12,1,3,4,0,1,{pistol:true})],melee:[W("Accursed crozius","M",0,5,2,6,-1,2)],
    abilities:[{name:"Leader",type:"Core",desc:"Can be attached to a Bodyguard unit."},{name:"Dark Pact",type:"Faction",desc:"Sacrifice to give weapons Lethal Hits (risk mortal wounds)."},{name:"Demagogue",type:"Datasheet",desc:"Its unit gains a 4+ invulnerable save in melee."}]},
  legionaries:{name:"Chaos Legionaries",kw:["INFANTRY","BATTLELINE","CHAOS"],pts:90,m:6,t:4,sv:3,inv:0,w:2,ld:6,oc:2,models:5,
    ranged:[W("Boltgun","R",24,2,3,4,0,1,{rapidfire:1})],melee:[W("Chainsword","M",0,4,3,4,-1,1)],
    abilities:[{name:"Dark Pact",type:"Faction",desc:"Sacrifice to give weapons Lethal Hits (risk mortal wounds)."}]},
  cultists:{name:"Cultist Mob",kw:["INFANTRY","BATTLELINE","CULTIST","CHAOS"],pts:50,m:6,t:3,sv:6,inv:0,w:1,ld:7,oc:2,models:10,
    ranged:[W("Autopistol","R",12,1,4,3,0,1,{pistol:true})],melee:[W("Brutal assault weapon","M",0,1,4,3,0,1)],
    abilities:[{name:"Dark Pact",type:"Faction",desc:"Sacrifice to give weapons Lethal Hits (risk mortal wounds)."}]},
  terminators_cha:{name:"Chaos Terminators",kw:["INFANTRY","TERMINATOR","CHAOS"],pts:200,m:5,t:5,sv:2,inv:4,w:3,ld:6,oc:1,models:5,
    ranged:[W("Combi-bolter","R",24,2,3,4,0,1,{rapidfire:1})],melee:[W("Accursed weapons","M",0,3,3,5,-2,1)],
    abilities:[{name:"Dark Pact",type:"Faction",desc:"Sacrifice to give weapons Lethal Hits (risk mortal wounds)."},{name:"Deep Strike",type:"Core",desc:"Can arrive from Reserves >9\" from enemies."}]},
  raptors:{name:"Raptors",kw:["INFANTRY","FLY","CHAOS"],pts:75,m:6,t:4,sv:3,inv:0,w:2,ld:6,oc:1,models:5,
    ranged:[W("Bolt pistol","R",12,1,3,4,0,1,{pistol:true})],melee:[W("Astartes chainsword","M",0,4,3,4,-1,1)],
    abilities:[{name:"Dark Pact",type:"Faction",desc:"Sacrifice to give weapons Lethal Hits (risk mortal wounds)."}]},
  possessed:{name:"Possessed",kw:["INFANTRY","DAEMON","CHAOS"],pts:115,m:6,t:5,sv:3,inv:5,w:2,ld:6,oc:1,models:5,
    ranged:[],melee:[W("Hideous mutations","M",0,4,3,6,-1,2,{devastating:true})],
    abilities:[{name:"Dark Pact",type:"Faction",desc:"Sacrifice to give weapons Lethal Hits (risk mortal wounds)."}]},
};

let FACTION_UNITS={1:["captain","lieutenant","intercessors","assault","hellblasters","aggressors","terminators_sm"],
                   2:["chaoslord","darkapostle","legionaries","cultists","raptors","possessed","terminators_cha"]};
let FACTIONS={
  sm:{name:"Ultramarines (built-in)",units:FACTION_UNITS[1],color:'imp'},
  csm:{name:"Chaos Space Marines (built-in)",units:FACTION_UNITS[2],color:'cha'},
};
let pFaction={1:'sm',2:'csm'};
let dataLoaded=false;

/* ---------- MODES ---------- */
const MODES={
  boarding:{name:"Boarding Actions",pts:500,rounds:5,grid:[24,22],terrain:true,desc:"Compact strike forces fight through corridors. Walls and hatchways block movement and sight; Engagement Range extends through open hatchways."},
  open:{name:"Open War",pts:1000,rounds:5,grid:[24,22],terrain:false,desc:"A larger clash with five objectives. Place your own terrain before deploying."},
  sandbox:{name:"Sandbox",pts:Infinity,rounds:9,grid:[28,24],terrain:false,desc:"No points limit, custom board size, full manual control. Build any battle you like."},
};
let mode='boarding';

/* ---------- GLOBAL STATE ---------- */
let PNAME={1:"Ultramarines",2:"Chaos Space Marines"};
let PSHORT={1:"PLAYER 1",2:"PLAYER 2"};
function refreshPlayerNames(){
  const tr=s=>(s||'').replace(/\s*\(built-in\)/i,'');
  PNAME={1:tr(FACTIONS[pFaction[1]]?.name)||"Player 1",2:tr(FACTIONS[pFaction[2]]?.name)||"Player 2"};
  const sh=s=>s.toUpperCase().split(/\s+/).slice(0,2).join(' ');
  PSHORT={1:sh(PNAME[1]),2:sh(PNAME[2])};
}
const PHASES=["Command","Movement","Shooting","Charge","Fight"];
const HEX_INCH=2;
let CELL=28, GW=24, GH=22;
let customW=24, customH=22;

let roster={1:{},2:{}};
let units=[], objectives=[], walls=[], hatchways=[], entryZones={1:[],2:[]};
let selId=null, round=1, turn=1, phaseIdx=0;
let vp={1:0,2:0}, cp={1:0,2:0};
let phaseDone=[false,false,false,false,false];
let deploying=false, deployIdx={1:0,2:0}, deployTurn=1, deployList={1:[],2:[]};
let placingTerrain=false, terrainTool='wall';   // 'wall' | 'hatch' | 'objective' | 'erase'
let cv,ctx,logEl;

/* interactive action state (set during phases, consumed by the action panel) */
let action=null;   // {kind:'advance'|'shoot'|'charge'|'fight', ...}

/* ===================================================================
   DETACHMENT SYSTEM  (faction-agnostic; data in detachments.js)
   =================================================================== */
let pDetach={1:null,2:null};        // chosen detachment name per player
let activeDoctrine={1:null,2:null}; // current army doctrine id per player (Gladius/Librarius etc.)
let usedDoctrines={1:[],2:[]};      // doctrines already chosen this battle
let unitDoctrine={};                // unitId -> doctrine id (Adaptive Strategy etc.)
let oathTarget={1:null,2:null};     // enemy unitId named as Oath of Moment
let stratState={};                  // transient stratagem flags, keyed per-unit/phase
let firstCoyActive={1:false,2:false};
let pendingStrat=null;              // a stratagem awaiting target selection

function factionDataFor(p){
  // resolve the player's faction to a DETACHMENT_DATA bucket (Space Marines covers all chapters)
  const f=FACTIONS[pFaction[p]];if(!f)return null;
  if(f.isSM||/space marines|adeptus astartes|ultramarines|blood angels|dark angels|space wolves|black templars|deathwatch|imperial fists|crimson fists|iron hands|salamanders|raven guard|white scars/i.test(f.name))
    return DETACHMENT_DATA["Space Marines"];
  return DETACHMENT_DATA[f.name]||null;
}
function detachOf(p){const d=factionDataFor(p);if(!d||!pDetach[p])return null;return d.detachments[pDetach[p]];}
function armyRuleOf(p){const d=factionDataFor(p);return d?d.armyRule:null;}

function unitHasKw(u,kw){return (u.kw||[]).includes(kw)||(u.allKw||[]).includes(kw);}
function unitOnObjective(u){return objectives.some(o=>Math.hypot(o.hx-u.hx,o.hy-u.hy)<=1.5);}

/* Evaluate one fx condition string for an attack context. */
function condMet(cond,ctx){
  if(!cond)return true;
  return cond.split('+').every(c=>oneCond(c,ctx));
}
function oneCond(c,ctx){
  const {att,def,weapon,isMelee,p}=ctx;
  switch(c){
    case 'targetIsOath': return def&&oathTarget[p]===def.id;
    case 'codexPure': { // army has no divergent-chapter units
      const div=['BLACK TEMPLARS','BLOOD ANGELS','DARK ANGELS','DEATHWATCH','SPACE WOLVES'];
      return !units.some(u=>u.player===p&&!u.dead&&(u.allKw||[]).some(k=>div.includes(k)));
    }
    case 'firstCoyActive': return firstCoyActive[p];
    case 'within12': return def&&dist(att,def)<=12;
    case 'targetBeyond12': return def&&dist(att,def)>12;
    case 'attackerBeyond12': return att&&def&&dist(att,def)>12; // used defensively (att=enemy)
    case 'remainedStationary': return att&&!att.moved&&!att.advanced&&!att.fellback;
    case 'alreadyHeavy': return weapon&&weapon.ab&&weapon.ab.heavy;
    case 'remainedStationary+alreadyHeavy': return true; // handled via split
    case 'targetMonsterVehicle': return def&&(unitHasKw(def,'MONSTER')||unitHasKw(def,'VEHICLE'));
    case 'targetCMV': return def&&(unitHasKw(def,'CHARACTER')||unitHasKw(def,'MONSTER')||unitHasKw(def,'VEHICLE'));
    case 'targetCharacter': return def&&unitHasKw(def,'CHARACTER');
    case 'targetBelowStrength': return def&&totalWounds(def)<maxWounds(def);
    case 'selfBelowHalf': return att&&belowHalf(att);
    case 'inTerrain': return att&&hasCover(att,att); // approx: in/near terrain
    case 'unitBattleline': return att&&unitHasKw(att,'BATTLELINE');
    case 'psykerOnly': return att&&unitHasKw(att,'PSYKER');
    case 'torrentOnly': return weapon&&weapon.ab&&weapon.ab.torrent;
    case 'alreadyAssault': return weapon&&weapon.ab&&weapon.ab.assault;
    case 'targetWithinObjective': return def&&unitOnObjective(def);
    case 'selfOnHeldObjective': return att&&unitOnObjective(att);
    case 'strHigherThanT': return att&&def&&weapon&&(weapon.s+0)>def.t;
    case 'strGEQT': return att&&def&&weapon&&(weapon.s+0)>=def.t;
    case 'doctrine:assault': return doctrineActiveFor(p)==='assault';
    case 'doctrine:devastator': return doctrineActiveFor(p)==='devastator';
    case 'doctrine:tactical': return doctrineActiveFor(p)==='tactical';
    case 'doctrine:divination': return doctrineActiveFor(p)==='divination';
    case 'doctrine:pyromancy': return doctrineActiveFor(p)==='pyromancy';
    case 'doctrine:biomancy': return doctrineActiveFor(p)==='biomancy';
    case 'closestWithin6': return def&&dist(att,def)<=6; // approx (closest not tracked)
    case 'closestWithin12': return def&&dist(att,def)<=12;
    case 'targetScanned': return def&&def._scanned;
    case 'setUpThisTurn': return att&&att._setupThisTurn;
    case 'dropPodThisTurn': return false;
    case 'disembarkedHeavy': return false;
    case 'tankAceStationaryish': return att&&unitHasKw(att,'VEHICLE')&&!att.advanced;
    default: return true;
  }
}
function doctrineActiveFor(p){
  // a unit-specific doctrine overrides; else the army doctrine
  return activeDoctrine[p];
}

/* Build the modifier object consulted by resolveAttacks.
   ctx player = attacker's player; also folds in DEFENDER's defensive stratagems. */
function gatherCombatMods(att,def,weapon,isMelee){
  const p=att.player, ep=def.player;
  const m={addHit:0,addWound:0,plusAttacksMelee:0,plusStrMelee:0,plusStrRanged:0,
    plusApMelee:0,plusApRanged:0,rerollHit:0,rerollWound:0,worsenIncomingAP:0,
    reduceIncomingDmg:0,subIncomingHit:0,subIncomingWound:0,ignoresCover:false,grantCoverDef:false,
    grantSustained:0,grantLethal:false,grantDevastating:false,grantLance:false,grantIgnoresCover:false,
    grantPrecision:false,grantAssault:false,antiKw:null,critOn:0,defFnp:0,defInvuln:0,notes:[]};
  const ctx={att,def,weapon,isMelee,p};
  const ectx={att:def,def:att,weapon,isMelee,p:ep}; // for defender-side conditions

  // ---- attacker-side: army rule + detachment rule + active doctrine + enhancements + active stratagems
  collectFx(att,p,ctx,m,'attack');
  // unit-attached enhancement on a leader within the unit is modeled per-unit (att.enh)
  // ---- defender-side: defensive effects (Armour of Contempt, -1 to be hit/wound, FNP, invuln)
  collectFx(def,ep,ectx,m,'defend');

  // doctrine note for log
  const dn=doctrineActiveFor(p);
  if(rerollText(m))m.note=rerollText(m);
  return m;
}
function rerollText(m){const t=[];if(m.rerollHit==='all')t.push('rr hit');else if(m.rerollHit===1)t.push('rr hit 1s');
  if(m.rerollWound==='all')t.push('rr wnd');else if(m.rerollWound===1)t.push('rr wnd 1s');
  if(m.addHit)t.push('+'+m.addHit+' hit');if(m.addWound)t.push('+'+m.addWound+' wnd');
  if(m.grantSustained)t.push('SUS'+m.grantSustained);if(m.grantLethal)t.push('LETH');if(m.grantLance)t.push('LANCE');
  if(m.worsenIncomingAP)t.push('-AP def');if(m.defFnp)t.push('FNP'+m.defFnp);
  return t.join(', ');
}
function applyFxList(fxArr,ctx,m,side,sourceUnit){
  if(!fxArr)return;
  fxArr.forEach(fx=>{
    if(!condMet(fx.cond,ctx))return;
    // selfOnly fx apply only when the source unit IS the acting unit
    if(fx.selfOnly && sourceUnit && ctx.att && sourceUnit.id!==ctx.att.id && side==='attack')return;
    const isDef=side==='defend';
    switch(fx.k){
      case 'addHit': if(!isDef)m.addHit+=fx.n; break;
      case 'addWound': if(!isDef)m.addWound+=fx.n; break;
      case 'plusAttacksMelee': if(!isDef)m.plusAttacksMelee+=fx.n; break;
      case 'plusStrMelee': if(!isDef)m.plusStrMelee+=fx.n; break;
      case 'plusStrRanged': if(!isDef)m.plusStrRanged+=fx.n; break;
      case 'plusApMelee': if(!isDef)m.plusApMelee+=fx.n; break;
      case 'plusApRanged': if(!isDef)m.plusApRanged+=fx.n; break;
      case 'rerollHit': if(!isDef)m.rerollHit=mergeRR(m.rerollHit,fx.val); break;
      case 'rerollWound': if(!isDef)m.rerollWound=mergeRR(m.rerollWound,fx.val); break;
      case 'grant': if(!isDef){const a=fx.ab;
        if(a==='sustained')m.grantSustained=Math.max(m.grantSustained,fx.val||1);
        if(a==='lethal')m.grantLethal=true;if(a==='devastating')m.grantDevastating=true;
        if(a==='lance')m.grantLance=true;if(a==='ignorescover'){m.grantIgnoresCover=true;m.ignoresCover=true;}
        if(a==='precision')m.grantPrecision=true;if(a==='assault')m.grantAssault=true;} break;
      case 'antiVal': if(!isDef)m.antiKw={kw:fx.kw,val:fx.val}; break;
      case 'critOn': if(!isDef)m.critOn=fx.val; break;
      // defensive (apply when this unit is the DEFENDER)
      case 'worsenIncomingAP': if(isDef)m.worsenIncomingAP+=fx.n; break;
      case 'reduceIncomingDmg': if(isDef)m.reduceIncomingDmg+=fx.n; break;
      case 'subIncomingHit': if(isDef)m.subIncomingHit+=fx.n; break;
      case 'subIncomingWound': if(isDef)m.subIncomingWound+=fx.n; break;
      case 'grantCoverDef': if(isDef)m.grantCoverDef=true; break;
      case 'fnp': if(isDef)m.defFnp=m.defFnp?Math.min(m.defFnp,fx.val):fx.val; break;
      case 'invuln': if(isDef)m.defInvuln=m.defInvuln?Math.min(m.defInvuln,fx.val):fx.val; break;
    }
  });
}
function mergeRR(cur,val){if(cur==='all'||val==='all')return 'all';return Math.max(cur||0,val||0);}

/* Collect all active fx for a unit's player from rule + doctrine + enhancements + active stratagems. */
function collectFx(unit,p,ctx,m,side){
  const fd=factionDataFor(p);if(!fd)return;
  const det=detachOf(p);
  // army rule
  if(fd.armyRule)applyFxList(fd.armyRule.fx,ctx,m,side);
  // detachment rule
  if(det&&det.rule)applyFxList(det.rule.fx,ctx,m,side);
  // active doctrine
  const dId=doctrineActiveFor(p);
  if(det&&det.doctrines&&dId){const doc=det.doctrines.find(d=>d.id===dId);if(doc)applyFxList(doc.fx,ctx,m,side);}
  // enhancements present on units of this player (leader buffs whole unit; selfOnly handled in applyFxList)
  if(det&&det.enhancements){
    units.filter(u=>u.player===p&&!u.dead&&u.enh).forEach(src=>{
      const e=det.enhancements.find(x=>x.name===src.enh);
      if(!e)return;
      // enhancement applies to the bearer's unit; here unit granularity = the bearer unit itself
      if(side==='attack' && ctx.att && ctx.att.id!==src.id) return; // only bearer's unit benefits (we model unit=bearer)
      if(side==='defend' && ctx.att && ctx.att.id!==src.id) return;
      applyFxList(e.fx,ctx,m,side,src);
    });
  }
  // active stratagems (flags set on units)
  const sg=side==='attack'?unit._stratAtk:unit._stratDef;
  if(sg&&det&&det.stratagems){sg.forEach(sn=>{const s=det.stratagems.find(x=>x.name===sn);if(s)applyFxList(s.fx,ctx,m,side);});}
}

/* ===================================================================
   PERSISTENT STORAGE  (localStorage)  +  remote fetch (Netlify fn / proxy)
   =================================================================== */
const LS_KEY='voidstrike_data_v1';
function saveData(){
  try{
    const payload={ts:Date.now(),TEMPLATES,FACTIONS:serializeFactions()};
    localStorage.setItem(LS_KEY,JSON.stringify(payload));
    return true;
  }catch(e){return false;}
}
function serializeFactions(){
  // store only imported factions (skip built-ins, they always exist)
  const out={};Object.entries(FACTIONS).forEach(([id,f])=>{if(id!=='sm'&&id!=='csm')out[id]=f;});return out;
}
function loadStoredData(){
  try{
    const raw=localStorage.getItem(LS_KEY);if(!raw)return false;
    return applyBundle(JSON.parse(raw));
  }catch(e){return false;}
}
function clearStoredData(){try{localStorage.removeItem(LS_KEY);}catch(e){}}

/* Apply a {TEMPLATES, FACTIONS} bundle into the live globals (shared loader). */
function applyBundle(p){
  if(!p||!p.TEMPLATES||!p.FACTIONS)return false;
  Object.assign(TEMPLATES,p.TEMPLATES);
  FACTIONS=Object.assign({},FACTIONS,p.FACTIONS);
  dataLoaded=true;
  const ids=Object.keys(p.FACTIONS);
  if(ids.length>=1)pFaction[1]=ids[0];
  if(ids.length>=2)pFaction[2]=ids[1];
  return {nFac:ids.length,nUnits:Object.keys(p.TEMPLATES).length,ts:p.ts};
}

/* Build the committed bundle object and trigger a download as factions-data.json. */
function exportBundle(){
  const payload={ts:Date.now(),version:1,TEMPLATES,FACTIONS:serializeFactions()};
  const facCount=Object.keys(payload.FACTIONS).length;
  if(!facCount){dpLog('dpLog','Nothing to export — fetch or load data first.','err');return;}
  const blob=new Blob([JSON.stringify(payload)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='factions-data.json';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url),2000);
  dpLog('dpLog',`★ Exported factions-data.json (${facCount} factions). Commit it to your repo root.`,'ok');
}

/* On startup, try to load the committed snapshot from the repo (factions-data.json). */
async function autoLoadCommittedData(){
  try{
    const res=await fetch('factions-data.json',{cache:'no-cache'});
    if(!res.ok)return false;
    const p=await res.json();
    const r=applyBundle(p);
    if(r){saveData();return r;}   // mirror into localStorage for instant next load
    return false;
  }catch(e){return false;}
}

/* CSV parsing */
function parseCSV(text){
  text=text.replace(/^\uFEFF/,'');
  const lines=text.split(/\r?\n/).filter(l=>l.length);
  if(!lines.length)return [];
  const header=lines[0].split('|').map(h=>h.trim());
  const rows=[];
  for(let i=1;i<lines.length;i++){
    const cells=lines[i].split('|');const o={};
    header.forEach((h,j)=>o[h]=(cells[j]||'').trim());
    rows.push(o);
  }
  return rows;
}
function toInt(v,def){const n=parseInt(String(v).replace(/[^0-9-]/g,''),10);return isNaN(n)?def:n;}
function svNum(v){return toInt(v,7);}
function apNum(v){const n=toInt(v,0);return n>0?-n:n;}
function rngNum(v){if(/melee/i.test(v))return 0;return toInt(v,0);}
function parseWeaponAbilities(desc){
  const ab={};const d=(desc||'').toUpperCase();const has=t=>d.includes('['+t);
  let m;
  if(m=d.match(/\[RAPID FIRE (\d+)/))ab.rapidfire=+m[1];
  if(m=d.match(/\[SUSTAINED HITS (\d+)/))ab.sustained=+m[1];
  if(has('LETHAL HITS'))ab.lethal=true;
  if(has('DEVASTATING WOUNDS'))ab.devastating=true;
  if(has('TWIN-LINKED'))ab.twinlinked=true;
  if(has('TORRENT'))ab.torrent=true;
  if(has('ASSAULT'))ab.assault=true;
  if(has('PISTOL'))ab.pistol=true;
  if(has('HAZARDOUS'))ab.hazardous=true;
  if(m=d.match(/\[ANTI-([A-Z ]+?) (\d)\+/))ab.anti={kw:m[1].trim(),val:+m[2]};
  return ab;
}
function slug(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,46);}

/* Build TEMPLATES + FACTIONS from parsed CSV tables (incl. abilities). */
function buildFromCSV(tables){
  const {Factions,Datasheets,Datasheets_models,Datasheets_wargear,Datasheets_models_cost,
         Datasheets_keywords,Datasheets_abilities,Abilities}=tables;
  if(!Factions||!Datasheets||!Datasheets_models||!Datasheets_wargear)
    throw new Error("Need at least Factions, Datasheets, Datasheets_models, Datasheets_wargear.");
  const facName={};Factions.forEach(f=>facName[f.id]=f.name);
  const abilityById={};(Abilities||[]).forEach(a=>abilityById[a.id]={name:a.name,desc:stripHtml(a.description||a.legend||''),type:'Core'});
  const byDs=arr=>{const m={};(arr||[]).forEach(r=>{(m[r.datasheet_id]=m[r.datasheet_id]||[]).push(r);});return m;};
  const models=byDs(Datasheets_models), wargear=byDs(Datasheets_wargear),
        costs=byDs(Datasheets_models_cost), kws=byDs(Datasheets_keywords), dsAb=byDs(Datasheets_abilities);

  const newTpl={}, facUnits={};
  Datasheets.forEach(ds=>{
    if(ds.virtual==='true')return;
    const mlist=models[ds.id];if(!mlist||!mlist.length)return;
    const lead=mlist[0];
    const m=toInt(lead.M,6),t=toInt(lead.T,4),sv=svNum(lead.Sv),w=toInt(lead.W,1),
          ld=toInt(lead.Ld,7),oc=toInt(lead.OC,1),inv=lead.inv_sv?svNum(lead.inv_sv):0;
    const allKw=(kws[ds.id]||[]).map(k=>({kw:(k.keyword||k.name||'').toUpperCase(),fac:k.is_faction_keyword==='true'})).filter(k=>k.kw);
    const kwList=allKw.filter(k=>!k.fac).map(k=>k.kw);
    const factionKw=allKw.filter(k=>k.fac).map(k=>k.kw);
    const allKwUpper=allKw.map(k=>k.kw);   // every keyword regardless of the faction flag
    const ranged=[],melee=[];
    (wargear[ds.id]||[]).forEach(wg=>{
      const isMelee=/melee/i.test(wg.range)||/melee/i.test(wg.type);
      const ab=parseWeaponAbilities(wg.description||wg.type);
      const wpn={name:wg.name||'Weapon',type:isMelee?'M':'R',rng:rngNum(wg.range),
        a:toInt(wg.A,1)||1,skill:toInt(wg.BS_WS,4),s:toInt(wg.S,4),ap:apNum(wg.AP),d:toInt(wg.D,1)||1,ab};
      (isMelee?melee:ranged).push(wpn);
    });
    // abilities (Core/Faction by id, Datasheet/Wargear inline)
    const abilities=[];
    (dsAb[ds.id]||[]).forEach(a=>{
      if(a.ability_id&&abilityById[a.ability_id]){
        abilities.push({name:abilityById[a.ability_id].name,type:a.type||'Core',desc:abilityById[a.ability_id].desc});
      }else if(a.name){
        abilities.push({name:a.name,type:a.type||'Datasheet',desc:stripHtml(a.description||'')});
      }
    });
    let pts=0;
    if(costs[ds.id]&&costs[ds.id].length)pts=toInt(costs[ds.id][0].cost,0);
    let modelCount=1;
    if(ds.unit_composition){const cm=ds.unit_composition.match(/(\d+)\s*[-–]\s*(\d+)/);if(cm)modelCount=toInt(cm[1],1);}
    else if(mlist.length>1)modelCount=mlist.length;
    if(kwList.includes('CHARACTER')||kwList.includes('MONSTER')||kwList.includes('VEHICLE'))modelCount=1;
    modelCount=clamp(modelCount,1,20);

    const key=slug(ds.faction_id+'_'+ds.name)||('ds'+ds.id);
    newTpl[key]={name:ds.name,kw:kwList.length?kwList:["INFANTRY"],factionKw,allKw:allKwUpper,pts:pts||0,role:ds.role||'',
      m,t,sv,inv,w,ld,oc,models:modelCount,
      ranged,melee:melee.length?melee:[W("Close combat weapon","M",0,1,4,t,0,1)],
      abilities};
    (facUnits[ds.faction_id]=facUnits[ds.faction_id]||[]).push(key);
  });

  Object.assign(TEMPLATES,newTpl);
  const newFactions={};
  Object.keys(facUnits).forEach(fid=>{
    facUnits[fid].sort((a,b)=>{
      const ca=TEMPLATES[a].kw.includes('CHARACTER')?0:1,cb=TEMPLATES[b].kw.includes('CHARACTER')?0:1;
      if(ca!==cb)return ca-cb;return TEMPLATES[a].pts-TEMPLATES[b].pts;});
    newFactions[fid]={name:facName[fid]||('Faction '+fid),units:facUnits[fid],
      color:/chaos|daemon|death|emperor|thousand|world eater/i.test(facName[fid]||'')?'cha':'imp'};
  });
  splitSpaceMarineChapters(newFactions,facName);
  FACTIONS=Object.assign({},FACTIONS,newFactions);
  dataLoaded=true;
  const ids=Object.keys(newFactions);
  if(ids.length>=1)pFaction[1]=ids[0];
  if(ids.length>=2)pFaction[2]=ids[1];
  roster={1:{},2:{}};
  saveData();
  const nUnits=Object.keys(newTpl).length,nFac=ids.length;
  const st=$('dpStatus');if(st){st.textContent=`${nFac} factions · ${nUnits} units (saved)`;st.classList.add('loaded');}
  renderFacSelectors();renderShops();
  return {nUnits,nFac};
}
function stripHtml(s){return (s||'').replace(/<[^>]+>/g,'').replace(/&[a-z]+;/g,' ').replace(/\s+/g,' ').trim();}

/* Known Space Marine chapters that appear as a second Faction keyword on datasheets.
   Generic marine units carry <CHAPTER> (or only ADEPTUS ASTARTES) and belong to any chapter. */
const SM_CHAPTERS=[
  {kw:'ULTRAMARINES',name:'Ultramarines'},{kw:'BLOOD ANGELS',name:'Blood Angels'},
  {kw:'DARK ANGELS',name:'Dark Angels'},{kw:'SPACE WOLVES',name:'Space Wolves'},
  {kw:'BLACK TEMPLARS',name:'Black Templars'},{kw:'DEATHWATCH',name:'Deathwatch'},
  {kw:'IMPERIAL FISTS',name:'Imperial Fists'},{kw:'CRIMSON FISTS',name:'Crimson Fists'},
  {kw:'IRON HANDS',name:'Iron Hands'},{kw:'SALAMANDERS',name:'Salamanders'},
  {kw:'RAVEN GUARD',name:'Raven Guard'},{kw:'WHITE SCARS',name:'White Scars'},
];
function isSpaceMarineFaction(name){
  const n=(name||'').toLowerCase();
  if(/chaos|heretic|traitor|daemon|death guard|thousand sons|world eaters|emperor's children/.test(n))return false;
  return /space marines|adeptus astartes/.test(n);
}
// True only for loyalist Astartes units (rejects Chaos/Heretic Astartes).
function isLoyalAstartesUnit(k){
  const kw=kwsOf(k);
  if(kw.includes('HERETIC ASTARTES')||kw.includes('CHAOS'))return false;
  return kw.includes('ADEPTUS ASTARTES');
}
function kwsOf(k){const t=TEMPLATES[k];return (t&&(t.allKw||t.factionKw||t.kw))||[];}
/* For a Space Marines faction, generate one selectable sub-faction per chapter:
   chapter-specific datasheets + all generic Space Marine datasheets.
   Detection scans EVERY keyword on each datasheet (chapter keywords are not always
   flagged is_faction_keyword in the data). */
function splitSpaceMarineChapters(newFactions,facName){
  const chapterKWs=SM_CHAPTERS.map(c=>c.kw);
  // Find the SM faction: by name, OR by its units being loyalist Astartes (not Chaos).
  let smId=Object.keys(newFactions).find(fid=>isSpaceMarineFaction(newFactions[fid].name));
  if(!smId){
    smId=Object.keys(newFactions).find(fid=>{
      if(/chaos|heretic/i.test(newFactions[fid].name||''))return false;
      const u=newFactions[fid].units;
      return u.length>3 && u.some(isLoyalAstartesUnit) && u.some(k=>kwsOf(k).some(x=>chapterKWs.includes(x)));
    });
  }
  if(!smId)return 0;
  // don't re-split an already-split faction (its name is the catch-all) unless chapters missing
  const smUnits=newFactions[smId].units;
  const present=SM_CHAPTERS.filter(ch=>smUnits.some(k=>kwsOf(k).includes(ch.kw)));
  if(!present.length)return 0;
  const sortFn=(a,b)=>{const ca=TEMPLATES[a].kw.includes('CHARACTER')?0:1,cb=TEMPLATES[b].kw.includes('CHARACTER')?0:1;if(ca!==cb)return ca-cb;return TEMPLATES[a].pts-TEMPLATES[b].pts;};
  const generic=smUnits.filter(k=>!kwsOf(k).some(fk=>chapterKWs.includes(fk)));
  present.forEach(ch=>{
    const own=smUnits.filter(k=>kwsOf(k).includes(ch.kw));
    const unitSet=[...new Set([...own,...generic])].sort(sortFn);
    const fid='sm_'+ch.kw.toLowerCase().replace(/[^a-z]+/g,'_');
    newFactions[fid]={name:ch.name,units:unitSet,color:'imp',chapter:ch.kw,isSM:true};
  });
  newFactions[smId]={name:'Space Marines (any Chapter)',units:smUnits.slice().sort(sortFn),color:'imp',isSM:true};
  return present.length;
}
/* Re-run chapter splitting on the LIVE FACTIONS object (works after any load path).
   Returns number of chapters created. Idempotent and safe to call repeatedly. */
function rebuildChapters(){
  // already split? (chapter sub-factions exist) -> nothing to do
  if(Object.values(FACTIONS).some(f=>f.isSM&&f.chapter))return 0;
  const n=splitSpaceMarineChapters(FACTIONS,{});
  if(n){renderFacSelectors&&renderFacSelectors();}
  return n;
}

/* Diagnostic: report what chapter data the importer actually sees. */
function diagnoseSM(){
  clearDpLog('dpLog');
  dpLog('dpLog','build marker: chapters-v2','info');   // confirms this app.js version is live
  const chapterKWs=SM_CHAPTERS.map(c=>c.kw);
  const all=Object.entries(FACTIONS).filter(([id])=>id!=='sm'&&id!=='csm');
  dpLog('dpLog',`${all.length} imported factions total.`,'info');
  let smId=all.find(([id,f])=>isSpaceMarineFaction(f.name))?.[0];
  if(!smId)smId=all.find(([id,f])=>!/chaos|heretic/i.test(f.name)&&(f.units||[]).some(isLoyalAstartesUnit))?.[0];
  if(!smId){
    dpLog('dpLog','No LOYALIST Space Marines faction detected. Faction names found:','err');
    all.slice(0,30).forEach(([id,f])=>dpLog('dpLog',`  · ${f.name} (${f.units.length})`,'info'));
    return;
  }
  const f=FACTIONS[smId];
  dpLog('dpLog',`Loyalist SM faction: "${f.name}" — ${f.units.length} units`,'ok');
  // does the data carry allKw? (old committed bundles do NOT)
  const sampleHasAllKw=f.units.slice(0,20).some(k=>TEMPLATES[k]&&TEMPLATES[k].allKw);
  if(!sampleHasAllKw)dpLog('dpLog','⚠ Loaded data has no full-keyword field (allKw). This is an OLD exported bundle — Re-fetch, then Export & commit factions-data.json again.','err');
  const found={};
  f.units.forEach(k=>kwsOf(k).forEach(w=>{if(chapterKWs.includes(w))found[w]=(found[w]||0)+1;}));
  const chs=Object.keys(found);
  if(chs.length)dpLog('dpLog',`Chapter keywords detected: ${chs.map(c=>c+'('+found[c]+')').join(', ')}`,'ok');
  else dpLog('dpLog','NO chapter keywords on these units.','err');
  let splits=Object.values(FACTIONS).filter(x=>x.isSM&&x.chapter).length;
  if(!splits&&chs.length){const made=rebuildChapters();dpLog('dpLog',`Ran rebuildChapters() → created ${made} chapters.`,made?'ok':'err');splits=made;}
  dpLog('dpLog',`Chapter sub-factions in dropdown: ${splits}`,splits?'ok':'err');
  if(splits)dpLog('dpLog','✓ Chapters are live. Open the faction dropdown — they are grouped under "Space Marine Chapters". Export & commit to persist for visitors.','ok');
}
const PROXIES=[
  {id:'allorigins.win',wrap:u=>'https://api.allorigins.win/raw?url='+encodeURIComponent(u)},
  {id:'codetabs.com', wrap:u=>'https://api.codetabs.com/v1/proxy/?quest='+encodeURIComponent(u)},
  {id:'corsproxy.io', wrap:u=>'https://corsproxy.io/?url='+encodeURIComponent(u)},
  {id:'thingproxy',   wrap:u=>'https://thingproxy.freeboard.io/fetch/'+u},
];
function fetchWithTimeout(url,ms){
  const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),ms);
  return fetch(url,{signal:ctl.signal,redirect:'follow'}).finally(()=>clearTimeout(t));
}
async function tryFunction(file,refresh){
  // Netlify function endpoint (same-origin → no CORS). Works only when served by Netlify.
  const url='/.netlify/functions/wahapedia?file='+file+(refresh?'&refresh=1':'');
  const res=await fetchWithTimeout(url,20000);
  if(!res.ok)throw new Error('fn HTTP '+res.status);
  const txt=await res.text();
  if(!txt||txt.indexOf('|')===-1)throw new Error('fn returned non-CSV');
  return txt;
}
async function fetchCSV(file,logId,base,startIdx,refresh){
  // 1) try our own Netlify function
  try{const t=await tryFunction(file,refresh);dpLog(logId,'    via Netlify function','info');return t;}
  catch(e){/* fall through to proxies */}
  // 2) public proxies
  const order=[];if(startIdx>=0)order.push(PROXIES[startIdx]);
  PROXIES.forEach((p,i)=>{if(i!==startIdx)order.push(p);});
  let lastErr='';
  for(const p of order){
    try{
      const res=await fetchWithTimeout(p.wrap(base+file+'.csv'),15000);
      if(!res.ok){lastErr=p.id+': HTTP '+res.status;continue;}
      const txt=await res.text();
      if(!txt||txt.length<20){lastErr=p.id+': empty';continue;}
      if(txt.indexOf('|')===-1){lastErr=p.id+': not CSV';continue;}
      dpLog(logId,'    via '+p.id,'info');return txt;
    }catch(e){lastErr=p.id+': '+(e.name==='AbortError'?'timeout':e.message);}
  }
  throw new Error(lastErr||'all sources failed');
}
async function fetchAllFactions(refresh){
  clearDpLog('dpLog');
  const startIdx=+($('proxySel').value);
  const base=$('baseUrl').value.trim().replace(/\/?$/,'/');
  const files=['Factions','Datasheets','Datasheets_models','Datasheets_wargear',
               'Datasheets_models_cost','Datasheets_keywords','Datasheets_abilities','Abilities'];
  const tables={};
  dpLog('dpLog',refresh?'Re-fetching latest data…':'Fetching CSVs (Netlify function → proxies)…','info');
  for(const f of files){
    const optional=!['Factions','Datasheets','Datasheets_models','Datasheets_wargear'].includes(f);
    try{
      const txt=await fetchCSV(f,'dpLog',base,startIdx,refresh);
      tables[f]=parseCSV(txt);
      dpLog('dpLog',`✓ ${f}.csv — ${tables[f].length} rows`,'ok');
    }catch(e){
      dpLog('dpLog',`${optional?'(optional) ':''}✗ ${f}.csv — ${e.message}`,optional?'info':'err');
      if(!optional){
        dpLog('dpLog','Core file failed via every source. If not on Netlify, use the Upload tab.','err');
        return;
      }
    }
  }
  try{const r=buildFromCSV(tables);dpLog('dpLog',`★ Loaded & saved ${r.nFac} factions, ${r.nUnits} units. Pick factions below.`,'ok');}
  catch(e){dpLog('dpLog','Parse error: '+e.message,'err');}
}
function loadFromFiles(fileList){
  clearDpLog('dpLogFile');
  const tables={};let pending=fileList.length;if(!pending)return;
  const names=['Factions','Datasheets','Datasheets_models','Datasheets_wargear','Datasheets_models_cost','Datasheets_keywords','Datasheets_abilities','Abilities'];
  Array.from(fileList).forEach(file=>{
    const rdr=new FileReader();
    rdr.onload=()=>{
      const key=file.name.replace(/\.csv$/i,'');
      const norm=names.find(k=>k.toLowerCase()===key.toLowerCase());
      if(norm){tables[norm]=parseCSV(rdr.result);dpLog('dpLogFile',`✓ ${norm} — ${tables[norm].length} rows`,'ok');}
      else dpLog('dpLogFile',`(ignored ${file.name})`,'info');
      if(--pending===0){try{const r=buildFromCSV(tables);dpLog('dpLogFile',`★ Loaded & saved ${r.nFac} factions, ${r.nUnits} units.`,'ok');}catch(e){dpLog('dpLogFile','Error: '+e.message,'err');}}
    };
    rdr.onerror=()=>{dpLog('dpLogFile','✗ read fail '+file.name,'err');pending--;};
    rdr.readAsText(file);
  });
}
const stagedCSV={};
function stagePaste(){
  const type=$('pasteType').value,txt=$('pasteArea').value;
  if(!txt.trim()){dpLog('dpLogPaste','Nothing to stage.','err');return;}
  stagedCSV[type]=parseCSV(txt);dpLog('dpLogPaste',`✓ staged ${type} — ${stagedCSV[type].length} rows`,'ok');
  $('pasteArea').value='';
}
function loadFromPaste(){
  clearDpLog('dpLogPaste');
  try{const r=buildFromCSV(stagedCSV);dpLog('dpLogPaste',`★ Loaded & saved ${r.nFac} factions, ${r.nUnits} units.`,'ok');}
  catch(e){dpLog('dpLogPaste','Error: '+e.message,'err');}
}
function dpLog(elId,msg,cls){const el=$(elId);if(!el)return;const s=document.createElement('div');if(cls)s.className=cls;s.textContent=msg;el.appendChild(s);el.scrollTop=el.scrollHeight;}
function clearDpLog(elId){const el=$(elId);if(el)el.innerHTML='';}

/* ===================================================================
   MUSTER SCREEN
   =================================================================== */
function renderModeSel(){
  const host=$('modeSel');host.innerHTML='';
  Object.entries(MODES).forEach(([k,m])=>{
    const d=document.createElement('div');d.className='modeCard'+(k===mode?' sel':'');
    const cap=m.pts===Infinity?'NO LIMIT':m.pts+' PTS';
    d.innerHTML=`<span class="badge">${cap}</span><h3>${m.name}</h3><p>${m.desc}</p>`;
    d.onclick=()=>{mode=k;renderModeSel();renderSizeRow();renderShops();};
    host.appendChild(d);
  });
}
function renderSizeRow(){
  const row=$('sizeRow');if(!row)return;
  const show=(mode==='sandbox');
  row.style.display=show?'flex':'none';
  if(show){$('inW').value=customW;$('inH').value=customH;}
}
function unitsForPlayer(p){return FACTIONS[pFaction[p]]?FACTIONS[pFaction[p]].units:[];}
function renderFacSelectors(){
  const entries=Object.entries(FACTIONS);
  const smChapters=entries.filter(([id,f])=>f.isSM).sort((a,b)=>a[1].name.localeCompare(b[1].name));
  const others=entries.filter(([id,f])=>!f.isSM).sort((a,b)=>a[1].name.localeCompare(b[1].name));
  [1,2].forEach(p=>{
    const sel=$('facSel'+p);if(!sel)return;sel.innerHTML='';
    const addOpt=(host,id,f)=>{const o=document.createElement('option');o.value=id;o.textContent=f.name;if(id===pFaction[p])o.selected=true;host.appendChild(o);};
    others.forEach(([id,f])=>addOpt(sel,id,f));
    if(smChapters.length){
      const og=document.createElement('optgroup');og.label='— Space Marine Chapters —';
      smChapters.forEach(([id,f])=>addOpt(og,id,f));
      sel.appendChild(og);
    }
    sel.onchange=()=>{pFaction[p]=sel.value;roster[p]={};
      const col=$('col'+p),c=FACTIONS[pFaction[p]].color;
      col.classList.remove('imp','cha');col.classList.add(c==='cha'?'cha':'imp');
      pDetach[p]=null;renderDetachSelectors();renderShops();};
  });
  renderDetachSelectors();
}
function renderDetachSelectors(){
  [1,2].forEach(p=>{
    const sel=$('detSel'+p);if(!sel)return;sel.innerHTML='';
    const fd=factionDataFor(p);
    if(!fd||!fd.detachments){const o=document.createElement('option');o.textContent='— none available —';o.value='';sel.appendChild(o);pDetach[p]=null;return;}
    const names=Object.keys(fd.detachments);
    // if current faction is a specific chapter, list chapter-specific detachments first, hide other chapters' exclusives
    const chap=FACTIONS[pFaction[p]]&&FACTIONS[pFaction[p]].chapter;
    const none=document.createElement('option');none.textContent='— choose detachment —';none.value='';sel.appendChild(none);
    names.forEach(n=>{
      const d=fd.detachments[n];
      if(d.chapter&&chap&&d.chapter!==chap)return;  // hide other chapters' named detachments
      const o=document.createElement('option');o.value=n;o.textContent=n+(d.chapter?` (${d.chapter[0]+d.chapter.slice(1).toLowerCase()})`:'');
      if(n===pDetach[p])o.selected=true;sel.appendChild(o);
    });
    sel.onchange=()=>{pDetach[p]=sel.value||null;};
  });
}
function rosterPts(p){return Object.entries(roster[p]).reduce((s,[k,q])=>s+((TEMPLATES[k]?.pts||0)*q),0);}
function rosterModels(p){return Object.entries(roster[p]).reduce((s,[k,q])=>s+((TEMPLATES[k]?.models||1)*q),0);}
function renderShops(){
  [1,2].forEach(p=>{
    const host=$('shop'+p);host.innerHTML='';
    const list=unitsForPlayer(p);
    if(!list.length){host.innerHTML='<p class="dpNote" style="padding:8px">No units in this faction.</p>';}
    list.forEach(k=>{
      const t=TEMPLATES[k];if(!t)return;const q=roster[p][k]||0;
      const it=document.createElement('div');it.className='shopItem'+(q>0?' has':'');
      it.innerHTML=`<div class="si-name"><b>${t.name}</b><span>${t.models} model${t.models>1?'s':''} · T${t.t} Sv${t.sv}+ W${t.w}${t.inv?` · ${t.inv}++`:''}${t.role?` · ${t.role}`:''}</span></div>
        <span class="si-pts">${t.pts}pt</span>
        <div class="qty"><button class="qbtn" data-m="${p}" data-k="${k}" data-d="-1">−</button>
        <span class="qnum">${q}</span><button class="qbtn" data-m="${p}" data-k="${k}" data-d="1">+</button></div>`;
      host.appendChild(it);
    });
    host.querySelectorAll('.qbtn').forEach(b=>b.onclick=()=>{
      const k=b.dataset.k,delta=+b.dataset.d;
      roster[p][k]=clamp((roster[p][k]||0)+delta,0,30);renderShops();
    });
  });
  updatePtBars();
}
function updatePtBars(){
  const cap=MODES[mode].pts;
  [1,2].forEach(p=>{
    const pts=rosterPts(p);
    const label=cap===Infinity?`${pts} pts · ${rosterModels(p)} models`:`${pts} / ${cap}`;
    $('pc'+p).textContent=label;
    const bar=$('pb'+p);
    bar.style.width=cap===Infinity?Math.min(100,rosterModels(p)*2)+'%':Math.min(100,pts/cap*100)+'%';
    bar.classList.toggle('over',cap!==Infinity&&pts>cap);
    $('pc'+p).style.color=(cap!==Infinity&&pts>cap)?'var(--blood2)':'var(--gold2)';
  });
  const within=p=>cap===Infinity||rosterPts(p)<=cap;
  const ok=rosterPts(1)>0&&rosterPts(2)>0&&within(1)&&within(2);
  $('toBattle').disabled=!ok;
}
function quickMuster(){
  const cap=MODES[mode].pts===Infinity?700:MODES[mode].pts;
  [1,2].forEach(p=>{
    roster[p]={};
    const pool=unitsForPlayer(p).filter(k=>TEMPLATES[k]&&TEMPLATES[k].pts>0);
    if(!pool.length)return;
    const chars=pool.filter(k=>TEMPLATES[k].kw.includes("CHARACTER"));
    const others=pool.filter(k=>!TEMPLATES[k].kw.includes("CHARACTER"));
    if(chars.length)roster[p][chars[0]]=1;
    let spent=chars.length?TEMPLATES[chars[0]].pts:0;
    const buy=others.length?others:pool;let g=0;
    while(spent<cap-40&&g<60&&buy.length){
      const k=buy[Math.floor(Math.random()*buy.length)];
      if(spent+TEMPLATES[k].pts<=cap){roster[p][k]=(roster[p][k]||0)+1;spent+=TEMPLATES[k].pts;}
      g++;
    }
  });
  renderShops();
}

/* ===================================================================
   BUILD BATTLEFIELD  +  TERRAIN PLACEMENT
   =================================================================== */
function newUnit(tplKey,player){
  const t=TEMPLATES[tplKey];
  return {id:crypto.randomUUID(),tpl:tplKey,name:t.name,player,kw:[...t.kw],allKw:[...(t.allKw||t.kw||[])],
    m:t.m,t:t.t,sv:t.sv,inv:t.inv,w:t.w,ld:t.ld,oc:t.oc,pts:t.pts,abilities:t.abilities||[],
    maxModels:t.models,models:t.models,woundsLeft:t.w,ranged:t.ranged,melee:t.melee,enh:null,
    hx:-1,hy:-1,deployed:false,moved:false,advanced:false,fellback:false,charged:false,fought:false,
    shotWith:[],bshock:false,dead:false,_stratAtk:[],_stratDef:[],_ocBonus:0,_ocMult:1};
}
function totalWounds(u){return (u.models-1)*u.w+u.woundsLeft;}
function maxWounds(u){return u.maxModels*u.w;}
function belowHalf(u){return totalWounds(u)<=maxWounds(u)/2;}

function buildBattle(){
  refreshPlayerNames();
  const M=MODES[mode];
  if(mode==='sandbox'){GW=clamp(customW,12,40);GH=clamp(customH,10,34);}
  else{[GW,GH]=M.grid;}
  CELL=Math.floor(Math.min(760/GW,660/GH));CELL=clamp(CELL,16,34);
  cv.width=GW*CELL;cv.height=GH*CELL;
  units=[];objectives=[];walls=[];hatchways=[];
  vp={1:0,2:0};cp={1:1,2:1};round=1;turn=1;phaseIdx=0;selId=null;action=null;
  phaseDone=[false,false,false,false,false];
  activeDoctrine={1:null,2:null};usedDoctrines={1:[],2:[]};unitDoctrine={};
  oathTarget={1:null,2:null};firstCoyActive={1:false,2:false};pendingStrat=null;

  [1,2].forEach(p=>Object.entries(roster[p]).forEach(([k,q])=>{for(let i=0;i<q;i++)units.push(newUnit(k,p));}));

  // default objectives
  if(GW>=18){objectives=[{hx:Math.floor(GW/2),hy:Math.floor(GH/2)},
    {hx:5,hy:5},{hx:GW-6,hy:5},{hx:5,hy:GH-6},{hx:GW-6,hy:GH-6}];}
  else objectives=[{hx:Math.floor(GW/2),hy:Math.floor(GH/2)}];

  // entry zones
  if(mode==='boarding'){
    entryZones={1:[{x0:0,y0:0,x1:3,y1:GH-1}],2:[{x0:GW-4,y0:0,x1:GW-1,y1:GH-1}]};
    buildShipInterior();
  }else{
    entryZones={1:[{x0:0,y0:GH-6,x1:GW-1,y1:GH-1}],2:[{x0:0,y0:0,x1:GW-1,y1:5}]};
  }

  // TERRAIN PLACEMENT PHASE first (boarding starts with preset interior but still editable)
  placingTerrain=true;deploying=false;terrainTool='wall';

  clearLog();
  log("hd","╔ MUSTER COMPLETE ╗");
  log("sys",`${M.name} — ${PNAME[1]} ${rosterPts(1)}pts vs ${PNAME[2]} ${rosterPts(2)}pts on a ${GW}×${GH} board.`);
  log("sys","TERRAIN: place walls, hatchways and objectives, then press Begin Deployment.");

  $('tMode').textContent=M.name.toUpperCase();
  $('tMaxRound').textContent=M.rounds;
  $('subTitle').textContent='WARHAMMER 40,000 · '+M.name.toUpperCase();
  buildLegend();renderPhases();renderAll();updateHint();render();
  showTerrainBar(true);showActionPanel(false);
}
function buildShipInterior(){
  walls=[];hatchways=[];
  const vlines=[Math.floor(GW/3),Math.floor(2*GW/3)];
  vlines.forEach(vx=>{
    for(let y=0;y<GH;y++)walls.push({type:'v',x:vx,y});
    [3,GH-4,Math.floor(GH/2)].forEach(hy=>{const w=walls.find(w=>w.type==='v'&&w.x===vx&&w.y===hy);if(w){w.hatch=true;w.open=false;hatchways.push(w);}});
  });
}
function buildLegend(){
  const L=$('legend');let h=`<span><i class="dot" style="background:var(--imp)"></i>${PNAME[1]}</span>
    <span><i class="dot" style="background:var(--cha)"></i>${PNAME[2]}</span>
    <span><i class="dot" style="background:var(--gold)"></i>Objective</span>
    <span><i class="sq" style="background:var(--line3)"></i>Wall</span>
    <span><i class="sq" style="background:var(--hatch)"></i>Hatchway</span>
    <span style="color:var(--dim)">1 cell = ${HEX_INCH}″</span>`;
  L.innerHTML=h;
}

/* ---- terrain placement interaction: click cell edges for walls, cells for objectives ---- */
function terrainClick(hx,hy,ex,ey){
  // ex,ey = fractional position within cell (0..1) to decide nearest edge
  if(terrainTool==='objective'){
    const i=objectives.findIndex(o=>o.hx===hx&&o.hy===hy);
    if(i>=0)objectives.splice(i,1); else objectives.push({hx,hy});
    render();return;
  }
  if(terrainTool==='erase'){
    walls=walls.filter(w=>!nearWall(w,hx,hy,ex,ey));
    hatchways=hatchways.filter(w=>walls.includes(w));
    const oi=objectives.findIndex(o=>o.hx===hx&&o.hy===hy);if(oi>=0)objectives.splice(oi,1);
    render();return;
  }
  // wall/hatch: pick the nearest cell edge
  const edges=[{type:'v',x:hx,y:hy,d:ex},{type:'v',x:hx+1,y:hy,d:1-ex},
               {type:'h',x:hx,y:hy,d:ey},{type:'h',x:hx,y:hy+1,d:1-ey}];
  edges.sort((a,b)=>a.d-b.d);const e=edges[0];
  const exists=walls.find(w=>w.type===e.type&&w.x===e.x&&w.y===e.y);
  if(exists){
    if(terrainTool==='hatch'&&!exists.hatch){exists.hatch=true;exists.open=false;hatchways.push(exists);}
    else if(terrainTool==='wall'&&exists.hatch){exists.hatch=false;hatchways=hatchways.filter(h=>h!==exists);}
    else{walls=walls.filter(w=>w!==exists);hatchways=hatchways.filter(h=>h!==exists);}
  }else{
    const w={type:e.type,x:e.x,y:e.y};
    if(terrainTool==='hatch'){w.hatch=true;w.open=false;hatchways.push(w);}
    walls.push(w);
  }
  render();
}
function nearWall(w,hx,hy,ex,ey){
  if(w.type==='v')return (w.x===hx&&w.y===hy)||(w.x===hx+1&&w.y===hy);
  return (w.x===hx&&w.y===hy)||(w.x===hx&&w.y===hy+1);
}
function finishTerrain(){
  placingTerrain=false;
  deploying=true;
  deployList={1:units.filter(u=>u.player===1),2:units.filter(u=>u.player===2)};
  [1,2].forEach(p=>deployList[p].sort((a,b)=>(a.kw.includes("CHARACTER")?1:0)-(b.kw.includes("CHARACTER")?1:0)));
  deployIdx={1:0,2:0};deployTurn=1;
  log("hd","◆ DEPLOYMENT");
  log("sys","Players alternate placing units in their Entry Zone. Click a highlighted cell.");
  showTerrainBar(false);renderPhases();renderAll();updateHint();render();
}

/* ===================================================================
   GEOMETRY
   =================================================================== */
function cellCenter(hx,hy){return {x:hx*CELL+CELL/2,y:hy*CELL+CELL/2};}
function segInt(x1,y1,x2,y2,x3,y3,x4,y4){
  const d=(x2-x1)*(y4-y3)-(y2-y1)*(x4-x3);if(Math.abs(d)<1e-9)return false;
  const t=((x3-x1)*(y4-y3)-(y3-y1)*(x4-x3))/d,u=((x3-x1)*(y2-y1)-(y3-y1)*(x2-x1))/d;
  return t>0.001&&t<0.999&&u>0.001&&u<0.999;
}
function wallSeg(w){
  if(w.type==='v')return [w.x*CELL,w.y*CELL,w.x*CELL,(w.y+1)*CELL];
  return [w.x*CELL,w.y*CELL,(w.x+1)*CELL,w.y*CELL];
}
function segBlocked(ax,ay,bx,by){
  if(!walls.length)return false;
  const A=cellCenter(ax,ay),B=cellCenter(bx,by);
  for(const w of walls){if(w.hatch&&w.open)continue;const s=wallSeg(w);if(segInt(A.x,A.y,B.x,B.y,s[0],s[1],s[2],s[3]))return true;}
  return false;
}
function rawDist(a,b){return Math.hypot(a.hx-b.hx,a.hy-b.hy)*HEX_INCH;}
function dist(a,b){return rawDist(a,b);}
function visible(a,b){return !segBlocked(a.hx,a.hy,b.hx,b.hy);}
function pathThroughOpenHatch(a,b){
  const A=cellCenter(a.hx,a.hy),B=cellCenter(b.hx,b.hy);
  for(const w of hatchways){if(!w.open)continue;const s=wallSeg(w);if(segInt(A.x,A.y,B.x,B.y,s[0],s[1],s[2],s[3]))return true;}
  return false;
}
const ENGAGE_IN=2.9;   // base-to-base reach: adjacent cells (orthogonal/diagonal)
function engaged(a,b){
  if(segBlocked(a.hx,a.hy,b.hx,b.hy))return false;
  const d=rawDist(a,b);
  if(d<=ENGAGE_IN)return true;
  if(d<=ENGAGE_IN+1.3&&pathThroughOpenHatch(a,b))return true;
  return false;
}
function inER(u){return units.some(e=>!e.dead&&e.player!==u.player&&engaged(u,e));}
function cellOccupied(hx,hy,exceptId){return units.some(u=>!u.dead&&u.id!==exceptId&&u.hx===hx&&u.hy===hy);}
function inEntryZone(p,hx,hy){return entryZones[p].some(z=>hx>=z.x0&&hx<=z.x1&&hy>=z.y0&&hy<=z.y1);}

/* ===================================================================
   LOG + DICE
   =================================================================== */
function clearLog(){logEl.innerHTML='';}
function log(cls,txt){const d=document.createElement('div');d.className='e '+(cls||'');d.innerHTML=txt;logEl.appendChild(d);logEl.scrollTop=logEl.scrollHeight;}
function logDice(arr){
  if(!$('dieToggle').checked||!arr.length)return;
  const box=document.createElement('div');box.className='dicebox';
  arr.forEach(r=>{const s=document.createElement('span');
    s.className='die'+(r.v===6&&r.crit?' s6':'')+(r.v===1&&r.fail?' s1':'')+(r.ok?' ok':'')+(r.bad?' bad':'');
    s.textContent=r.v;box.appendChild(s);});
  logEl.appendChild(box);logEl.scrollTop=logEl.scrollHeight;
}
function woundTarget(s,t){if(s>=t*2)return 2;if(s>t)return 3;if(s===t)return 4;if(s*2<=t)return 6;return 5;}
function hasCover(att,def){
  if(walls.length){return walls.some(w=>{if(w.hatch&&w.open)return false;
    const wx=w.type==='v'?w.x:w.x+0.5,wy=w.type==='v'?w.y+0.5:w.y;return Math.hypot(wx-def.hx,wy-def.hy)<=1.2;});}
  return objectives.some(o=>Math.hypot(o.hx-def.hx,o.hy-def.hy)<=1.5);
}

/* Resolve a full attack sequence (used by auto-resolve & by manual roll). Returns a report. */
function resolveAttacks(att,def,weapon,nModels,silent){
  const isMelee=weapon.type==='M';
  // Gather detachment/doctrine/stratagem/enhancement modifiers for this attack
  const mods=(typeof gatherCombatMods==='function')?gatherCombatMods(att,def,weapon,isMelee):null;
  // effective weapon abilities (granted abilities merged in)
  const ab=Object.assign({},weapon.ab);
  if(mods){if(mods.grantSustained&&!ab.sustained)ab.sustained=mods.grantSustained;
    if(mods.grantLethal)ab.lethal=true;if(mods.grantDevastating)ab.devastating=true;
    if(mods.grantLance)ab.lance=true;if(mods.grantIgnoresCover)ab.ignorescover=true;
    if(mods.grantPrecision)ab.precision=true;
    if(mods.grantAssault)ab.assault=true;
    if(mods.antiKw&&def.kw.includes(mods.antiKw.kw)){if(!ab.anti||ab.anti.val>mods.antiKw.val)ab.anti={kw:mods.antiKw.kw,val:mods.antiKw.val};}}
  let perModel=weapon.a + (isMelee&&mods?mods.plusAttacksMelee:0);
  if(ab.rapidfire&&weapon.type==="R"&&dist(att,def)<=weapon.rng/2)perModel+=ab.rapidfire;
  if(perModel<1)perModel=1;
  let attacks=perModel*nModels;
  const wStr=weapon.s + (mods?(isMelee?mods.plusStrMelee:mods.plusStrRanged):0);
  const wAp=weapon.ap - (mods?(isMelee?mods.plusApMelee:mods.plusApRanged):0); // ap stored negative; subtract to improve
  const skill=clamp(weapon.skill - (mods?mods.addHit:0),2,6);
  if(!silent){let line=`<span class="roll">${att.name}</span> ▸ <span class="roll">${def.name}</span> · ${weapon.name} · <b>${attacks}</b> attacks`;
    if(mods&&mods.note)line+=` <span class="sys">[${mods.note}]</span>`;log("",line);}
  let hits=0,critHits=0,autoWounds=0,sustainExtra=0;const hitDice=[];
  const critHitOn=mods&&mods.critOn?mods.critOn:6;
  const rerollHit=mods?mods.rerollHit:0;   // 0 | 1 | 'all'
  if(ab.torrent){hits=attacks;if(!silent)log("hit","&nbsp;&nbsp;TORRENT — auto-hits.");}
  else{
    for(let i=0;i<attacks;i++){let r=d6();
      if(((rerollHit==='all'&&r<skill)||(rerollHit===1&&r===1))&&r!==6)r=d6();
      const crit=r>=critHitOn;const ok=(r>=skill||crit)&&r!==1;
      hitDice.push({v:r,crit:true,fail:true,ok});
      if(ok){hits++;if(crit){critHits++;if(ab.lethal)autoWounds++;if(ab.sustained)sustainExtra+=ab.sustained;}}}
    if(!silent){logDice(hitDice);let m=`&nbsp;&nbsp;Hits: <span class="hit">${hits}</span> (${skill}+)`;
      if(critHits)m+=` · <span class="crit">${critHits} crit</span>`;if(sustainExtra)m+=` · SUSTAINED +${sustainExtra}`;
      if(ab.lethal&&autoWounds)m+=` · LETHAL ${autoWounds}`;log("",m);}
  }
  let woundAttempts=hits+sustainExtra-autoWounds;if(woundAttempts<0)woundAttempts=0;
  let wt=woundTarget(wStr,def.t);
  // wound roll modifier (clamped; net +/-1 cap is approximated by direct add)
  const woundMod=mods?(mods.addWound - mods.subIncomingWound):0;
  let wounds=autoWounds,devastating=0;const woundDice=[];
  let antiOn=7;if(ab.anti&&def.kw.includes(ab.anti.kw))antiOn=ab.anti.val;
  const rerollWound=mods?mods.rerollWound:0;
  for(let i=0;i<woundAttempts;i++){let r=d6();
    if(((rerollWound==='all'&&r<wt)||(rerollWound===1&&r===1))&&r!==6)r=d6();
    if(ab.twinlinked&&r<wt&&r!==6)r=d6();
    const eff=clamp(r+woundMod,1,6);
    const crit=(r===6)||(eff>=antiOn)||(r>=antiOn);const ok=(eff>=wt||crit)&&r!==1;woundDice.push({v:r,crit:true,fail:true,ok});
    if(ok){wounds++;if(crit&&ab.devastating)devastating++;}}
  if(!silent){logDice(woundDice);let wm=`&nbsp;&nbsp;Wounds: <span class="wound">${wounds}</span> (${wt}+`;
    if(woundMod)wm+=`, ${woundMod>0?'+':''}${woundMod}`;if(ab.twinlinked)wm+=`, TL`;wm+=`)`;
    if(devastating)wm+=` · <span class="crit">DEVASTATING ${devastating}</span>`;log("",wm);}
  let normalWounds=wounds-devastating;if(normalWounds<0)normalWounds=0;
  let failed=0;const saveDice=[];
  let cover=hasCover(att,def)&&weapon.type==="R";
  if(mods&&mods.ignoresCover)cover=false;
  if(mods&&mods.grantCoverDef&&weapon.type==='R')cover=true;
  let apEff=-wAp;                                  // positive number = penalty to save
  if(mods)apEff=Math.max(0,apEff-mods.worsenIncomingAP*0)+0; // (incoming AP worsen handled below for defender)
  // defender AP worsening (Armour of Contempt etc.) reduces attacker AP
  let apPenalty=-wAp - (mods?mods.worsenIncomingAP:0);
  const useInv=def.inv>0 && def.inv < (def.sv+apPenalty+(cover&&!(def.sv<=3&&wAp===0)?1:0));
  const invUsed=mods&&mods.defInvuln?Math.min(def.inv||7,mods.defInvuln):def.inv;
  for(let i=0;i<normalWounds;i++){let r=d6();let need;
    if(useInv)need=invUsed||def.inv;
    else{let mod=apPenalty;if(cover&&!(def.sv<=3&&wAp===0))mod+=1;need=def.sv-mod;}
    const saved=(r>=need)&&r!==1;saveDice.push({v:r,fail:true,ok:saved,bad:!saved});if(!saved)failed++;}
  if(!silent){logDice(saveDice);let sm=`&nbsp;&nbsp;Saves: <span class="save">${normalWounds-failed} saved</span>`;
    if(cover)sm+=` (cover)`;if(useInv)sm+=` (invuln ${invUsed||def.inv}+)`;log("",sm);}
  let perHit=weapon.d - (mods?mods.reduceIncomingDmg:0);if(perHit<1)perHit=1;
  const totalDamage=failed*perHit,mortal=devastating*perHit;
  if(!silent&&mortal)log("",`&nbsp;&nbsp;Mortal wounds: <span class="kill">${mortal}</span>`);
  // Feel No Pain (defender)
  const fnp=mods&&mods.defFnp?mods.defFnp:0;
  applyDamage(def,totalDamage,perHit,mortal,silent,fnp);
  if(ab.hazardous){const haz=[];let fails=0;
    for(let i=0;i<nModels;i++){const r=d6();haz.push({v:r,fail:true,bad:r===1,ok:r!==1});if(r===1)fails++;}
    if(!silent){log("",`&nbsp;&nbsp;<span style="color:var(--blood2)">HAZARDOUS</span>: ${fails} failed`);logDice(haz);}
    if(fails){const mw=fails*3;if(!silent)log("kill",`&nbsp;&nbsp;${att.name} takes <span class="kill">${mw}</span> mortal (Hazardous)!`);applyDamage(att,0,0,mw,silent);}}
  return {attacks,hits,wounds,failed,devastating};
}
function applyDamage(u,normalDamage,dPerHit,mortal,silent,fnp){
  const before=totalWounds(u);
  // Feel No Pain: roll for each wound that would be lost
  function fnpFilter(dmg){
    if(!fnp)return dmg;let kept=0;for(let i=0;i<dmg;i++){if(d6()<fnp)kept++;}return kept;
  }
  if(dPerHit>0&&normalDamage>0){const hits=Math.round(normalDamage/dPerHit);
    for(let h=0;h<hits;h++){const dealt=fnpFilter(dPerHit);for(let x=0;x<dealt;x++)dmgChunk(u,1,true);}}
  if(mortal){const m2=fnpFilter(mortal);for(let m=0;m<m2;m++)dmgChunk(u,1,true);}
  const lost=before-totalWounds(u);
  if(silent)return;
  if(u.dead)log("kill",`&nbsp;&nbsp;☠ ${u.name} DESTROYED!`);
  else if(lost>0)log("",`&nbsp;&nbsp;${u.name} −<span class="kill">${lost}</span>W${fnp?' (after FNP '+fnp+'+)':''} · ${u.models} model(s) left.`);
  else log("miss",`&nbsp;&nbsp;${u.name} unharmed.`);
}
function dmgChunk(u,dmg,spill){let rem=dmg;
  while(rem>0&&!u.dead){
    if(rem>=u.woundsLeft){rem-=u.woundsLeft;u.models--;if(u.models<=0){u.models=0;u.woundsLeft=0;u.dead=true;break;}u.woundsLeft=u.w;if(!spill)break;}
    else{u.woundsLeft-=rem;rem=0;}
  }
}

/* ===================================================================
   PHASES (interactive)
   =================================================================== */
function beginPhase(){
  if(deploying||placingTerrain)return;
  action=null;showActionPanel(false);
  const ph=PHASES[phaseIdx];
  $('tPhase').textContent=ph.toUpperCase();
  // clear per-phase stratagem flags
  units.forEach(u=>{u._stratAtk=[];u._stratDef=[];});
  if(ph==="Command")doCommandPhase();
  if(ph==="Movement")units.forEach(u=>{if(u.player===turn){u.moved=false;u.advanced=false;u.fellback=false;}});
  if(ph==="Shooting")units.forEach(u=>{if(u.player===turn)u.shotWith=[];});
  if(ph==="Charge")units.forEach(u=>{if(u.player===turn)u.charged=false;});
  if(ph==="Fight")units.forEach(u=>u.fought=false);
  updateHint();renderPhases();renderAll();render();renderStratPanel();
}
function doCommandPhase(){
  log("hd",`◆ R${round} · ${PNAME[turn].toUpperCase()} · COMMAND`);
  cp[turn]+=1;log("sys",`+1 CP → ${cp[turn]} CP.`);
  units.filter(u=>u.player===turn&&!u.dead&&belowHalf(u)).forEach(u=>{
    const r=d6()+d6();const pass=r>=u.ld;
    log("",`Battle-shock ${u.name}: <b>${r}</b> vs LD${u.ld} — ${pass?'<span class="save">PASS</span>':'<span class="kill">FAIL · shocked</span>'}`);
    u.bshock=!pass;});
  units.filter(u=>u.player===turn&&!belowHalf(u)).forEach(u=>u.bshock=false);
  phaseDone[0]=true;
  // prompt Oath of Moment + doctrine selection for the active player
  promptCommandChoices();
  renderAll();
}
function promptCommandChoices(){
  const ar=armyRuleOf(turn);
  const det=detachOf(turn);
  // Oath of Moment (or any army rule that needs an enemy target)
  if(ar&&/oath/i.test(ar.name)){
    const enemies=units.filter(u=>u.player!==turn&&!u.dead);
    if(enemies.length){action={kind:'oath'};showActionPanel(true);renderAction();return;}
  }
  // doctrine selection
  if(det&&det.doctrines&&det.doctrines.length){promptDoctrine();return;}
}
function promptDoctrine(){
  const det=detachOf(turn);if(!det||!det.doctrines)return;
  action={kind:'doctrine'};showActionPanel(true);renderAction();
}
function chooseDoctrine(id){
  activeDoctrine[turn]=id;
  if(!usedDoctrines[turn].includes(id))usedDoctrines[turn].push(id);
  const det=detachOf(turn);const doc=det.doctrines.find(d=>d.id===id);
  log("sys",`Doctrine active: ${doc?doc.name:id}.`);
  action=null;showActionPanel(false);renderAll();render();renderStratPanel();updateHint();
}
function chooseOath(eid){
  oathTarget[turn]=eid;const e=units.find(u=>u.id===eid);
  log("sys",`Oath of Moment → ${e?e.name:'target'}.`);
  // proceed to doctrine if any
  const det=detachOf(turn);
  if(det&&det.doctrines&&det.doctrines.length)promptDoctrine();
  else{action=null;showActionPanel(false);}
  renderAll();render();
}

/* ---- STRATAGEMS: CP economy + timing windows ---- */
function currentWindow(){
  // map current game state to a stratagem "when" window
  if(deploying||placingTerrain)return null;
  const ph=PHASES[phaseIdx];
  if(ph==="Command")return 'command';
  if(ph==="Movement")return 'movement';
  if(ph==="Shooting")return 'shooting';
  if(ph==="Charge")return 'charge';
  if(ph==="Fight")return 'fight';
  return null;
}
function stratagemsAvailable(p){
  const det=detachOf(p);if(!det)return [];
  const w=currentWindow();
  // a player may use their own-phase stratagems on their turn; defensive ones are handled inline via prompts
  const ownTurn=(p===turn);
  return det.stratagems.filter(s=>{
    if(s.cp>cp[p])return false;
    if(ownTurn){
      if(s.when===w)return true;
      if(s.when==='shootOrFight'&&(w==='shooting'||w==='fight'))return true;
      if(s.when==='chargeOrFight'&&(w==='charge'||w==='fight'))return true;
      if(s.when==='shootOrCharge'&&(w==='shooting'||w==='charge'))return true;
    }
    return false;
  });
}
function useStratagem(p,name){
  const det=detachOf(p);const s=det.stratagems.find(x=>x.name===name);if(!s)return;
  if(s.cp>cp[p]){updateHint("Not enough CP.");return;}
  // stratagems that target one of your units → enter selection
  if(s.targetSelf){pendingStrat={p,s};action={kind:'stratTarget',s};showActionPanel(true);renderAction();return;}
  commitStratagem(p,s,null);
}
function commitStratagem(p,s,unit){
  cp[p]-=s.cp;
  log("sys",`✦ ${PNAME[p]} uses <b>${s.name}</b> (${s.cp}CP)${unit?' on '+unit.name:''}. ${s.desc}`);
  // attach effect flags to the target unit for the relevant side
  if(unit){
    const offensive=['shooting','fight','shootOrFight','charge','chargeOrFight','shootOrCharge','movement','command'].includes(s.when);
    if(s.when==='targeted'||s.when==='fightTargeted'||s.when==='oppShootResolved'||s.when==='oppChargeEnd'||s.when==='oppMove'){
      unit._stratDef=unit._stratDef||[];unit._stratDef.push(s.name);
    }else{
      unit._stratAtk=unit._stratAtk||[];unit._stratAtk.push(s.name);
    }
    // immediate-effect stratagems
    s.fx.forEach(fx=>{
      if(fx.k==='objControl')unit._ocBonus=(unit._ocBonus||0)+fx.n;
      if(fx.k==='objControlMult')unit._ocMult=(unit._ocMult||1)*fx.n;
      if(fx.k==='stickyObjective')stickyObjectiveFor(unit);
      if(fx.k==='extraMove')doExtraMove(unit,fx.dice);
    });
  }
  pendingStrat=null;action=null;showActionPanel(false);
  renderAll();render();renderStratPanel();updateHint();
}
function stickyObjectiveFor(u){
  const o=objectives.find(o=>Math.hypot(o.hx-u.hx,o.hy-u.hy)<=1.5);
  if(o){o.sticky=u.player;log("sys",`&nbsp;&nbsp;Objective held stickily by ${PNAME[u.player]}.`);}
}
function doExtraMove(u,dice){
  let d=dice==='6'?6:dice==='D3+3'?(d6()%3+1+3):d6();   // D6 default
  log("sys",`&nbsp;&nbsp;${u.name} makes a ${d}" move.`);
  // simple move toward nearest objective or away from enemy; here just mark moved
  u._extraMove=d;
}

/* ---- MOVEMENT: normal moves are click-to-move; advancing prompts a dice roll ---- */
function tryMove(u,hx,hy){
  if(u.player!==turn){updateHint("Not your unit this turn.");return;}
  if(PHASES[phaseIdx]!=="Movement"){updateHint("Only during Movement.");return;}
  if(u.moved){updateHint(`${u.name} already moved.`);return;}
  if(cellOccupied(hx,hy,u.id)){updateHint("Cell occupied.");return;}
  if(segBlocked(u.hx,u.hy,hx,hy)){updateHint("A wall or closed hatchway blocks that path.");return;}
  const d=Math.hypot(u.hx-hx,u.hy-hy)*HEX_INCH;
  const startER=inER(u);
  const wouldER=units.some(e=>!e.dead&&e.player!==u.player&&Math.hypot(e.hx-hx,e.hy-hy)*HEX_INCH<=ENGAGE_IN&&!segBlocked(e.hx,e.hy,hx,hy));
  if(startER){
    if(d<=u.m&&!wouldER){u.hx=hx;u.hy=hy;u.fellback=true;u.moved=true;log("sys",`${u.name} Falls Back ${d.toFixed(1)}″.`);
      if(u.bshock){const r=d6();if(r<=2){u.models=Math.max(0,u.models-1);log("kill","&nbsp;&nbsp;Desperate Escape: 1 model lost.");}}}
    else{updateHint("In Engagement Range — Fall Back clear of the enemy, or stay.");return;}
  }else if(d<=u.m&&!wouldER){u.hx=hx;u.hy=hy;u.moved=true;log("sys",`${u.name} Normal move ${d.toFixed(1)}″.`);}
  else if(!wouldER){
    // needs an Advance — set up an interactive roll
    if(d>u.m+6){updateHint(`Too far even with a max Advance (need ${d.toFixed(1)}″, max ${u.m+6}″).`);return;}
    action={kind:'advance',u,hx,hy,need:d};
    showActionPanel(true);renderAction();return;
  }else{updateHint("Cannot end within Engagement Range.");return;}
  render();renderAll();updateHint();
}
function rollAdvance(){
  const a=action;const adv=d6();const tot=a.u.m+adv;
  log("",`${a.u.name} Advance: rolled <b>${adv}</b> → ${tot}″ move.`);logDice([{v:adv}]);
  if(a.need<=tot){a.u.hx=a.hx;a.u.hy=a.hy;a.u.moved=true;a.u.advanced=true;
    log("sys",`&nbsp;&nbsp;Reached destination (${a.need.toFixed(1)}″). No shooting (non-Assault) or charging.`);}
  else log("miss",`&nbsp;&nbsp;Advance fell short of ${a.need.toFixed(1)}″ — ${a.u.name} stays put.`);
  action=null;showActionPanel(false);render();renderAll();updateHint();
}

/* ---- SHOOTING: pick target + weapon, range highlighted, roll attacks ---- */
function beginShootSelection(u){
  if(u.player!==turn||u.dead){return;}
  if(PHASES[phaseIdx]!=="Shooting"){return;}
  if(u.advanced&&!u.ranged.some(w=>w.ab.assault)){updateHint(`${u.name} Advanced and has no Assault weapons.`);return;}
  if(u.fellback){updateHint(`${u.name} Fell Back — cannot shoot.`);return;}
  if(!u.ranged.length){updateHint(`${u.name} has no ranged weapons.`);return;}
  action={kind:'shoot',u,weapon:null,target:null};
  selId=u.id;showActionPanel(true);renderAction();render();
}
function shootPickWeapon(idx){if(action&&action.kind==='shoot'){action.weapon=idx;action.target=null;renderAction();render();}}
function shootPickTarget(t){if(action&&action.kind==='shoot'){action.target=t.id;renderAction();render();}}
function rollShoot(){
  const a=action;const u=a.u;const w=u.ranged[a.weapon];const tgt=units.find(x=>x.id===a.target);
  if(!w||!tgt)return;
  const er=inER(u);
  if(er&&!w.ab.pistol){updateHint("In Engagement Range — only Pistols may fire.");return;}
  resolveAttacks(u,tgt,w,u.models,false);
  u.shotWith.push(a.weapon);
  scoreObjectivesLive();
  // allow firing remaining weapons; keep panel open with weapon cleared
  a.weapon=null;a.target=null;renderAction();renderAll();render();
}

/* ---- CHARGE: select a legal target, then roll 2D6 ---- */
function beginChargeSelection(u){
  if(u.player!==turn||u.dead||PHASES[phaseIdx]!=="Charge")return;
  if(u.advanced||u.fellback){updateHint(`${u.name} can't charge (Advanced/Fell Back).`);return;}
  if(u.charged){updateHint(`${u.name} already charged.`);return;}
  if(inER(u)){updateHint(`${u.name} already in combat.`);return;}
  const targets=units.filter(e=>!e.dead&&e.player!==turn&&dist(u,e)<=12&&!segBlocked(u.hx,u.hy,e.hx,e.hy));
  if(!targets.length){updateHint(`No enemy within 12″ of ${u.name}.`);return;}
  action={kind:'charge',u,targets,target:null};selId=u.id;showActionPanel(true);renderAction();render();
}
function chargePickTarget(t){if(action&&action.kind==='charge'){action.target=t.id;renderAction();render();}}
function rollCharge(){
  const a=action;const u=a.u;const tgt=units.find(x=>x.id===a.target);if(!tgt)return;
  const need=Math.max(0,dist(u,tgt)-ENGAGE_IN);const r1=d6(),r2=d6(),roll=r1+r2;
  log("",`${u.name} charges ${tgt.name}: 2D6 = <b>${roll}″</b> (need ${need.toFixed(1)}″)`);logDice([{v:r1},{v:r2}]);
  if(roll>=need){moveAdjacent(u,tgt);u.charged=true;log("save","&nbsp;&nbsp;Charge SUCCESS — Fights First.");}
  else log("miss","&nbsp;&nbsp;Charge failed.");
  action=null;showActionPanel(false);render();renderAll();updateHint();
}
function moveAdjacent(u,tgt){
  const dx=Math.sign(tgt.hx-u.hx),dy=Math.sign(tgt.hy-u.hy);
  let nx=clamp(tgt.hx-dx,0,GW-1),ny=clamp(tgt.hy-dy,0,GH-1);
  if(cellOccupied(nx,ny,u.id)){nx=clamp(tgt.hx-dx,0,GW-1);ny=clamp(tgt.hy,0,GH-1);}
  u.hx=nx;u.hy=ny;
}

/* ---- FIGHT: pick an engaged unit, roll its attacks ---- */
function beginFightSelection(u){
  if(u.dead||PHASES[phaseIdx]!=="Fight")return;
  if(!inER(u)){updateHint(`${u.name} is not in Engagement Range.`);return;}
  if(u.fought){updateHint(`${u.name} already fought.`);return;}
  if(!u.melee.length){updateHint(`${u.name} has no melee weapons.`);return;}
  const targets=units.filter(e=>!e.dead&&e.player!==u.player&&engaged(u,e));
  if(!targets.length)return;
  action={kind:'fight',u,targets,target:targets[0].id};selId=u.id;showActionPanel(true);renderAction();render();
}
function fightPickTarget(t){if(action&&action.kind==='fight'){action.target=t.id;renderAction();render();}}
function rollFight(){
  const a=action;const u=a.u;const tgt=units.find(x=>x.id===a.target);if(!tgt)return;
  if(u.charged)log("sys",`${u.name} (charged — fights first)`);
  resolveAttacks(u,tgt,u.melee[0],u.models,false);
  u.fought=true;scoreObjectivesLive();
  action=null;showActionPanel(false);render();renderAll();updateHint();
}

/* ---- hatchway operation on ending movement ---- */
function operateHatchways(){
  if(!hatchways.length)return;
  hatchways.forEach(w=>{
    const hc=w.type==='v'?{hx:w.x-0.5,hy:w.y+0.5}:{hx:w.x+0.5,hy:w.y-0.5};
    const near=units.find(u=>u.player===turn&&!u.dead&&!inER(u)&&Math.hypot(u.hx-hc.hx,u.hy-hc.hy)<=1.3);
    if(near){w.open=!w.open;log("sys",`${PNAME[turn]} ${w.open?'opens':'closes'} a hatchway.`);}
  });
}

/* ---- SCORING ---- */
function scoreObjectives(){
  objectives.forEach(o=>{let oc={1:0,2:0};
    units.filter(u=>!u.dead&&!u.bshock&&Math.hypot(u.hx-o.hx,u.hy-o.hy)<=1.5).forEach(u=>{
      let ocv=(u.oc+(u._ocBonus||0))*(u._ocMult||1)*u.models;oc[u.player]+=ocv;});
    let holder=oc[1]>oc[2]?1:oc[2]>oc[1]?2:0;
    if(holder===0&&o.sticky)holder=o.sticky;       // sticky: stays held if uncontested
    if(holder){vp[holder]+=1;if(o.sticky&&o.sticky!==holder)o.sticky=holder;else if(!o.sticky&&holder)o.lastHeld=holder;}
  });
  // clear one-turn OC bonuses
  units.forEach(u=>{u._ocBonus=0;u._ocMult=1;});
}
function scoreObjectivesLive(){/* no-op placeholder; scoring happens at round end */}

/* ---- TURN FLOW ---- */
function advancePhase(){
  if(deploying||placingTerrain)return;
  const ph=PHASES[phaseIdx];
  if(ph==="Movement"){operateHatchways();log("sys","Movement ended.");}
  phaseDone[phaseIdx]=true;action=null;showActionPanel(false);
  renderAll();renderPhases();render();
  if(phaseIdx<PHASES.length-1){phaseIdx++;phaseDone[phaseIdx]=false;beginPhase();}
  else endTurn();
}
function endTurn(){
  if(turn===1)turn=2;
  else{scoreObjectives();log("hd",`▼ END R${round} — VP ${PNAME[1]} ${vp[1]} · ${PNAME[2]} ${vp[2]}`);
    if(round>=MODES[mode].rounds){endGame();return;}round++;turn=1;}
  phaseIdx=0;phaseDone=[false,false,false,false,false];beginPhase();renderAll();render();
}
function endGame(){
  let name,color,txt;
  if(vp[1]>vp[2]){name=PNAME[1].toUpperCase();color="var(--impl)";txt=`Victory ${vp[1]}–${vp[2]} VP.`;}
  else if(vp[2]>vp[1]){name=PNAME[2].toUpperCase();color="var(--chal)";txt=`Victory ${vp[2]}–${vp[1]} VP.`;}
  else{name="STALEMATE";color="var(--gold2)";txt=`A draw at ${vp[1]}–${vp[2]}.`;}
  $('victorName').textContent=name;$('victorName').style.color=color;$('victorText').textContent=txt;
  $('modal').classList.add('on');
}

/* ---- DEPLOYMENT ---- */
function nextDeployUnit(){
  for(let i=0;i<2;i++){const p=deployTurn;if(deployIdx[p]<deployList[p].length)return {p,u:deployList[p][deployIdx[p]]};deployTurn=deployTurn===1?2:1;}
  return null;
}
function placeUnit(hx,hy){
  const nd=nextDeployUnit();if(!nd)return;const {p,u}=nd;
  if(!inEntryZone(p,hx,hy)){updateHint(`<b>${PNAME[p]}</b> must deploy inside their Entry Zone.`);return;}
  if(cellOccupied(hx,hy)){updateHint("Cell occupied.");return;}
  u.hx=hx;u.hy=hy;u.deployed=true;log("sys",`${PNAME[p]} deploys ${u.name}.`);
  deployIdx[p]++;deployTurn=deployTurn===1?2:1;
  if(deployIdx[1]>=deployList[1].length&&deployIdx[2]>=deployList[2].length){
    deploying=false;turn=1;phaseIdx=0;log("hd","◆ ALL FORCES DEPLOYED — BATTLE BEGINS");beginPhase();}
  selId=null;renderAll();render();updateHint();renderPhases();
}

/* ===================================================================
   RENDER
   =================================================================== */
function gc(v){return getComputedStyle(document.documentElement).getPropertyValue(v).trim();}
function render(){
  ctx.clearRect(0,0,cv.width,cv.height);
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){ctx.fillStyle=((x+y)&1)?'#0f131a':'#11161e';ctx.fillRect(x*CELL,y*CELL,CELL,CELL);}
  ctx.strokeStyle='rgba(40,50,64,.5)';ctx.lineWidth=1;
  for(let i=0;i<=GW;i++){ctx.beginPath();ctx.moveTo(i*CELL,0);ctx.lineTo(i*CELL,GH*CELL);ctx.stroke();}
  for(let i=0;i<=GH;i++){ctx.beginPath();ctx.moveTo(0,i*CELL);ctx.lineTo(GW*CELL,i*CELL);ctx.stroke();}

  if(deploying){
    [1,2].forEach(p=>{const col=p===1?'rgba(47,111,176,.13)':'rgba(184,52,42,.13)';
      entryZones[p].forEach(z=>{ctx.fillStyle=col;ctx.fillRect(z.x0*CELL,z.y0*CELL,(z.x1-z.x0+1)*CELL,(z.y1-z.y0+1)*CELL);});});
    const nd=nextDeployUnit();
    if(nd)entryZones[nd.p].forEach(z=>{ctx.strokeStyle=nd.p===1?gc('--impl'):gc('--chal');ctx.lineWidth=2;ctx.setLineDash([6,5]);
      ctx.strokeRect(z.x0*CELL+1,z.y0*CELL+1,(z.x1-z.x0+1)*CELL-2,(z.y1-z.y0+1)*CELL-2);ctx.setLineDash([]);});
  }

  // shooting range highlight
  if(action&&action.kind==='shoot'&&action.weapon!=null){
    const w=action.u.ranged[action.weapon];const c=cellCenter(action.u.hx,action.u.hy);
    ctx.beginPath();ctx.arc(c.x,c.y,(w.rng/HEX_INCH)*CELL,0,7);
    ctx.fillStyle='rgba(63,198,214,.08)';ctx.fill();
    ctx.strokeStyle='rgba(63,198,214,.5)';ctx.setLineDash([6,4]);ctx.lineWidth=1.5;ctx.stroke();ctx.setLineDash([]);
    if(w.ab.rapidfire){ctx.beginPath();ctx.arc(c.x,c.y,(w.rng/2/HEX_INCH)*CELL,0,7);ctx.strokeStyle='rgba(240,212,105,.4)';ctx.setLineDash([3,3]);ctx.stroke();ctx.setLineDash([]);}
  }
  // charge/fight reach highlight
  if(action&&(action.kind==='charge')){const c=cellCenter(action.u.hx,action.u.hy);
    ctx.beginPath();ctx.arc(c.x,c.y,(12/HEX_INCH)*CELL,0,7);ctx.strokeStyle='rgba(240,162,58,.4)';ctx.setLineDash([6,4]);ctx.lineWidth=1.5;ctx.stroke();ctx.setLineDash([]);}
  // movement range
  const sel=units.find(u=>u.id===selId);
  if(sel&&!sel.dead&&sel.player===turn&&!deploying&&!placingTerrain&&PHASES[phaseIdx]==="Movement"&&!sel.moved&&!action){
    const c=cellCenter(sel.hx,sel.hy);ctx.beginPath();ctx.arc(c.x,c.y,(sel.m/HEX_INCH)*CELL,0,7);
    ctx.strokeStyle='rgba(155,211,74,.55)';ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ctx.stroke();ctx.setLineDash([]);}

  // objectives
  objectives.forEach(o=>{const c=cellCenter(o.hx,o.hy);
    ctx.beginPath();ctx.arc(c.x,c.y,CELL*1.5,0,7);ctx.strokeStyle='rgba(212,175,55,.2)';ctx.lineWidth=1;ctx.stroke();
    ctx.beginPath();ctx.arc(c.x,c.y,8,0,7);ctx.fillStyle=gc('--gold');ctx.fill();ctx.strokeStyle='#6e5a13';ctx.lineWidth=2;ctx.stroke();
    ctx.fillStyle='#1a1505';ctx.font='bold 9px Share Tech Mono';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('OBJ',c.x,c.y);});

  // walls / hatchways
  walls.forEach(w=>{const s=wallSeg(w);
    if(w.hatch){if(w.open){ctx.strokeStyle=gc('--acid');ctx.setLineDash([4,4]);ctx.lineWidth=3;}else{ctx.strokeStyle=gc('--hatch');ctx.setLineDash([]);ctx.lineWidth=5;}
      ctx.beginPath();ctx.moveTo(s[0],s[1]);ctx.lineTo(s[2],s[3]);ctx.stroke();ctx.setLineDash([]);}
    else{ctx.strokeStyle=gc('--line3');ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(s[0],s[1]);ctx.lineTo(s[2],s[3]);ctx.stroke();}});

  // units
  const tgtId=action&&action.target;
  units.forEach(u=>{if(u.dead||u.hx<0)return;const c=cellCenter(u.hx,u.hy);
    const base=u.player===1?gc('--imp'):gc('--cha');
    // target highlight ring
    if(u.id===tgtId){ctx.beginPath();ctx.arc(c.x,c.y,CELL*0.5,0,7);ctx.strokeStyle=gc('--blood2');ctx.lineWidth=3;ctx.setLineDash([4,3]);ctx.stroke();ctx.setLineDash([]);}
    ctx.beginPath();ctx.arc(c.x,c.y,CELL*0.40,0,7);ctx.fillStyle=base;ctx.fill();
    ctx.lineWidth=u.id===selId?3:1.5;ctx.strokeStyle=u.id===selId?gc('--gold2'):(u.player===1?gc('--impd'):gc('--chad'));
    if(u.id===selId){ctx.shadowColor=gc('--gold');ctx.shadowBlur=14;}ctx.stroke();ctx.shadowBlur=0;
    if(u.kw.includes("CHARACTER")){ctx.fillStyle=gc('--gold2');ctx.font='bold 14px Cinzel';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('✠',c.x,c.y);}
    else{ctx.fillStyle='#fff';ctx.font='600 12px Share Tech Mono';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(u.models,c.x,c.y);}
    const hpw=CELL*0.7,frac=totalWounds(u)/maxWounds(u);
    ctx.fillStyle='#000';ctx.fillRect(c.x-hpw/2,c.y+CELL*0.4,hpw,3);
    ctx.fillStyle=frac>0.5?gc('--acid'):gc('--blood2');ctx.fillRect(c.x-hpw/2,c.y+CELL*0.4,hpw*frac,3);
    if(u.bshock){ctx.fillStyle=gc('--blood2');ctx.font='8px Share Tech Mono';ctx.fillText('SHOCK',c.x,c.y-CELL*0.42-3);}
    // acted marker
    let acted=u.player===turn&&((PHASES[phaseIdx]==="Movement"&&u.moved)||(PHASES[phaseIdx]==="Charge"&&u.charged)||(PHASES[phaseIdx]==="Fight"&&u.fought));
    if(acted){ctx.fillStyle=gc('--dim');ctx.beginPath();ctx.arc(c.x+CELL*0.30,c.y-CELL*0.30,3,0,7);ctx.fill();}
  });
}

/* ---- ACTION PANEL ---- */
function showActionPanel(on){const p=$('actionPanel');if(p)p.style.display=on?'block':'none';}
function renderStratPanel(){
  const host=$('stratBody');if(!host)return;
  if(deploying||placingTerrain){host.innerHTML='<p class="apNote">Stratagems available once the battle begins.</p>';$('cpDisplay').textContent='';return;}
  const det=detachOf(turn);
  $('cpDisplay').textContent=`${PSHORT[turn]} · ${cp[turn]} CP`;
  if(!det){host.innerHTML='<p class="apNote">No detachment selected for this army (choose one in the muster screen).</p>';return;}
  const avail=stratagemsAvailable(turn);
  let h=`<div class="apSub">${pDetach[turn]} — ${currentWindow()||'—'} phase</div>`;
  if(!avail.length)h+='<p class="apNote">No stratagems usable right now (timing or CP).</p>';
  else avail.forEach(s=>{h+=`<button class="stratBtn" data-s="${s.name}"><b>${s.name}</b> <span class="cp">${s.cp}CP</span><span class="ty">${s.type}</span><span class="ds">${s.desc}</span></button>`;});
  // also list the detachment rule + active doctrine for reference
  h+=`<div class="apSub" style="margin-top:10px">Active</div><p class="apNote">Rule: <b>${det.rule.name}</b>${activeDoctrine[turn]?` · Doctrine: <b>${(det.doctrines||[]).find(d=>d.id===activeDoctrine[turn])?.name||activeDoctrine[turn]}</b>`:''}${oathTarget[turn]?` · Oath set`:''}</p>`;
  host.innerHTML=h;
  host.querySelectorAll('.stratBtn').forEach(b=>b.onclick=()=>useStratagem(turn,b.dataset.s));
}
function renderAction(){
  const host=$('actionBody');if(!host||!action)return;
  const a=action;let h='';
  if(a.kind==='advance'){
    h=`<div class="apTitle">ADVANCE — ${a.u.name}</div>
       <p class="apNote">Needs ${a.need.toFixed(1)}″ (Move ${a.u.m}″ + D6). Roll the die.</p>
       <button class="btn primary apRoll" id="apRollBtn">🎲 Roll Advance D6</button>
       <button class="btn apCancel" id="apCancelBtn">Cancel</button>`;
  }else if(a.kind==='shoot'){
    h=`<div class="apTitle">SHOOT — ${a.u.name}</div>`;
    h+=`<div class="apSub">1 · Pick a weapon</div><div class="apWpns">`;
    a.u.ranged.forEach((w,i)=>{const used=a.u.shotWith.includes(i);
      h+=`<button class="apWpn${a.weapon===i?' sel':''}${used?' used':''}" data-w="${i}">${w.name}<span>${w.rng}" A${w.a} ${w.skill}+ S${w.s} AP${w.ap} D${w.d}${abShort(w)}</span></button>`;});
    h+=`</div>`;
    if(a.weapon!=null){
      const w=a.u.ranged[a.weapon];
      const er=inER(a.u);
      let tg=units.filter(e=>!e.dead&&e.player!==a.u.player&&dist(a.u,e)<=w.rng&&visible(a.u,e));
      if(er)tg=tg.filter(e=>engaged(a.u,e));
      h+=`<div class="apSub">2 · Pick a target (in range &amp; sight)</div>`;
      if(!tg.length)h+=`<p class="apNote">No valid target for this weapon.</p>`;
      else{h+=`<div class="apTargets">`;tg.forEach(t=>{h+=`<button class="apTgt${a.target===t.id?' sel':''}" data-t="${t.id}">${t.name} <span>${dist(a.u,t).toFixed(0)}″ · T${t.t} Sv${t.sv}+</span></button>`;});h+=`</div>`;}
      if(a.target)h+=`<button class="btn primary apRoll" id="apRollBtn">🎲 Roll Attacks</button>`;
    }
    h+=`<button class="btn apCancel" id="apCancelBtn">Done shooting</button>`;
  }else if(a.kind==='charge'){
    h=`<div class="apTitle">CHARGE — ${a.u.name}</div><div class="apSub">1 · Select a target within 12″</div><div class="apTargets">`;
    a.targets.forEach(t=>{h+=`<button class="apTgt${a.target===t.id?' sel':''}" data-t="${t.id}">${t.name} <span>${dist(a.u,t).toFixed(1)}″ · need ${Math.max(0,dist(a.u,t)-ENGAGE_IN).toFixed(1)}″</span></button>`;});
    h+=`</div>`;
    if(a.target)h+=`<button class="btn primary apRoll" id="apRollBtn">🎲 Roll 2D6 Charge</button>`;
    h+=`<button class="btn apCancel" id="apCancelBtn">Cancel</button>`;
  }else if(a.kind==='oath'){
    const enemies=units.filter(u=>u.player!==turn&&!u.dead);
    h=`<div class="apTitle">OATH OF MOMENT — ${PSHORT[turn]}</div><div class="apSub">Name your Oath target (re-roll Hits, and Wounds if Codex-pure)</div><div class="apTargets">`;
    enemies.forEach(t=>{h+=`<button class="apTgt" data-oath="${t.id}">${t.name} <span>T${t.t} Sv${t.sv}+ · ${t.models} models</span></button>`;});
    h+=`</div>`;
  }else if(a.kind==='doctrine'){
    const det=detachOf(turn);
    h=`<div class="apTitle">${det.rule.name.toUpperCase()} — ${PSHORT[turn]}</div><div class="apSub">Select a doctrine for this round</div><div class="apTargets">`;
    det.doctrines.forEach(d=>{const used=usedDoctrines[turn].includes(d.id);
      h+=`<button class="apTgt${used?' used':''}" data-doc="${d.id}">${d.name}${used?' (used)':''} <span>${d.desc}</span></button>`;});
    h+=`</div><button class="btn apCancel" id="apCancelBtn">Skip</button>`;
  }else if(a.kind==='stratTarget'){
    const s=a.s;const eligible=units.filter(u=>u.player===turn&&!u.dead);
    h=`<div class="apTitle">✦ ${s.name} (${s.cp}CP)</div><p class="apNote">${s.desc}</p><div class="apSub">Choose target unit</div><div class="apTargets">`;
    eligible.forEach(t=>{h+=`<button class="apTgt" data-strat="${t.id}">${t.name}</button>`;});
    h+=`</div><button class="btn apCancel" id="apCancelBtn">Cancel</button>`;
  }
  host.innerHTML=h;
  // wire
  host.querySelectorAll('.apWpn').forEach(b=>b.onclick=()=>shootPickWeapon(+b.dataset.w));
  host.querySelectorAll('[data-oath]').forEach(b=>b.onclick=()=>chooseOath(b.dataset.oath));
  host.querySelectorAll('[data-doc]').forEach(b=>b.onclick=()=>chooseDoctrine(b.dataset.doc));
  host.querySelectorAll('[data-strat]').forEach(b=>b.onclick=()=>{const u=units.find(x=>x.id===b.dataset.strat);commitStratagem(turn,action.s,u);});
  host.querySelectorAll('.apTgt').forEach(b=>{if(b.dataset.oath||b.dataset.doc||b.dataset.strat)return;b.onclick=()=>{const t=units.find(u=>u.id===b.dataset.t);
    if(a.kind==='shoot')shootPickTarget(t);else if(a.kind==='charge')chargePickTarget(t);else if(a.kind==='fight')fightPickTarget(t);};});
  const rb=$('apRollBtn');if(rb)rb.onclick=()=>{if(a.kind==='advance')rollAdvance();else if(a.kind==='shoot')rollShoot();else if(a.kind==='charge')rollCharge();else if(a.kind==='fight')rollFight();};
  const cb=$('apCancelBtn');if(cb)cb.onclick=()=>{action=null;showActionPanel(false);renderAll();render();updateHint();renderStratPanel();};
}
function abShort(w){const o=[];const a=w.ab;
  if(a.rapidfire)o.push('RF'+a.rapidfire);if(a.sustained)o.push('SH'+a.sustained);if(a.lethal)o.push('LH');
  if(a.devastating)o.push('DW');if(a.twinlinked)o.push('TL');if(a.torrent)o.push('TOR');if(a.assault)o.push('AS');
  if(a.pistol)o.push('PST');if(a.hazardous)o.push('HAZ');if(a.anti)o.push('ANTI');return o.length?' · '+o.join(' '):'';}

/* ---- TERRAIN BAR ---- */
function showTerrainBar(on){const b=$('terrainBar');if(b)b.style.display=on?'flex':'none';}
function setTool(t){terrainTool=t;document.querySelectorAll('.toolBtn').forEach(b=>b.classList.toggle('sel',b.dataset.tool===t));updateHint();}

/* ---- PHASE TRACKER + PANELS ---- */
function renderPhases(){
  const el=$('phaseList');el.innerHTML='';
  if(placingTerrain){const d=document.createElement('div');d.className='phase active';d.innerHTML='<span class="pn">▸</span> Terrain Setup';el.appendChild(d);}
  if(deploying){const d=document.createElement('div');d.className='phase active';d.innerHTML='<span class="pn">▸</span> Deployment';el.appendChild(d);}
  PHASES.forEach((p,i)=>{const d=document.createElement('div');
    const active=!placingTerrain&&!deploying&&i===phaseIdx;
    d.className='phase'+(active?' active':'')+(phaseDone[i]&&i<phaseIdx&&!deploying&&!placingTerrain?' done':'');
    d.innerHTML=`<span class="pn">${i+1}</span> ${p}`;el.appendChild(d);});
  $('tRound').textContent=round;$('tTurn').textContent=PSHORT[turn];$('tTurnTag').className='tag turn'+turn;
  $('rosterTitle').textContent=placingTerrain?'Forces':deploying?'Deployment Queue':PNAME[turn];
  const b=$('advBtn');
  if(placingTerrain){b.textContent="Begin Deployment ▸";b.disabled=false;b.onclick=finishTerrain;}
  else if(deploying){b.textContent="Deploy on the board";b.disabled=true;b.onclick=null;}
  else{b.disabled=false;b.onclick=advancePhase;const ph=PHASES[phaseIdx];
    b.textContent=ph==="Movement"?"End Movement ▸":ph==="Shooting"?"End Shooting ▸":ph==="Charge"?"End Charges ▸":ph==="Fight"?"End Fight ▸":"Proceed ▸";}
  $('autoBtn').style.display=(deploying||placingTerrain)?'none':'block';
}
function renderAll(){
  const trim=s=>s.replace(/\s*\(built-in\)/i,'');
  if($('sb1'))$('sb1').textContent=trim(PNAME[1]);if($('sb2'))$('sb2').textContent=trim(PNAME[2]);
  $('vp1').innerHTML=vp[1]+'<small> VP</small>';$('vp2').innerHTML=vp[2]+'<small> VP</small>';
  $('cp1').textContent=cp[1];$('cp2').textContent=cp[2];
  $('pts1').textContent=units.filter(u=>u.player===1).reduce((s,u)=>s+u.pts,0);
  $('pts2').textContent=units.filter(u=>u.player===2).reduce((s,u)=>s+u.pts,0);
  const host=$('rosterActive');host.innerHTML='';
  if(placingTerrain){[1,2].forEach(p=>units.filter(u=>u.player===p).forEach(u=>host.appendChild(unitCard(u))));}
  else if(deploying){[1,2].forEach(p=>deployList[p].forEach((u,i)=>{const c=unitCard(u);if(i===deployIdx[p]&&p===nextDeployUnit()?.p)c.classList.add('sel');host.appendChild(c);}));}
  else units.filter(u=>u.player===turn).forEach(u=>host.appendChild(unitCard(u)));
  renderDetail();
  if(typeof renderStratPanel==='function'&&!deploying&&!placingTerrain)renderStratPanel();
}
function unitCard(u){
  const d=document.createElement('div');
  const acted=!deploying&&!placingTerrain&&u.player===turn&&((PHASES[phaseIdx]==="Movement"&&u.moved)||(PHASES[phaseIdx]==="Charge"&&u.charged)||(PHASES[phaseIdx]==="Shooting"&&u.shotWith.length)||(PHASES[phaseIdx]==="Fight"&&u.fought));
  d.className='unit p'+u.player+(u.id===selId?' sel':'')+(u.dead?' dead':'')+(acted?' acted':'');
  const frac=u.dead?0:totalWounds(u)/maxWounds(u);
  d.innerHTML=`<div class="uhead"><b>${u.name}</b>${u.bshock?'<span class="bshock">shock</span>':''}
    ${!u.deployed&&deploying?'<span class="upip">queued</span>':`<span class="upip">OC ${u.bshock?0:u.oc}</span>`}</div>
    <div class="ustats"><div><span class="k">M</span><span class="v">${u.m}"</span></div><div><span class="k">T</span><span class="v">${u.t}</span></div>
    <div><span class="k">SV</span><span class="v">${u.sv}+</span></div><div><span class="k">W</span><span class="v">${u.w}</span></div>
    <div><span class="k">LD</span><span class="v">${u.ld}+</span></div><div><span class="k">INV</span><span class="v">${u.inv?u.inv+'+':'—'}</span></div></div>
    <div class="uhp"><i class="${frac<=0.5?'low':''}" style="width:${frac*100}%"></i></div>
    <div class="umodels"><span>${u.models}/${u.maxModels} models</span><span>${u.dead?'DESTROYED':totalWounds(u)+'/'+maxWounds(u)+' W'}</span></div>`;
  d.onclick=()=>{
    selId=u.id;
    if(!deploying&&!placingTerrain&&u.player===turn){
      const ph=PHASES[phaseIdx];
      if(ph==="Shooting")beginShootSelection(u);
      else if(ph==="Charge")beginChargeSelection(u);
      else if(ph==="Fight")beginFightSelection(u);
    }
    if(!deploying&&!placingTerrain&&PHASES[phaseIdx]==="Fight"&&u.player!==turn)beginFightSelection(u);
    renderAll();render();
  };
  return d;
}
function renderDetail(){
  const u=units.find(x=>x.id===selId);const el=$('detail');
  if(!u){el.innerHTML='No unit selected.';return;}
  const row=w=>`<div class="wpn"><span class="wn">${w.name}${abLabel(w)?`<span class="ab">${abLabel(w)}</span>`:''}</span><span>${w.type==='M'?'Melee':w.rng+'"'} A${w.a} ${w.skill}+ S${w.s} AP${w.ap} D${w.d}</span></div>`;
  const abrow=a=>`<div class="abRow"><b>${a.name}</b> <span class="abType">${a.type}</span><div class="abDesc">${a.desc||''}</div></div>`;
  el.innerHTML=`<h3>${u.name} ${u.kw.includes('CHARACTER')?'✠':''}</h3>
    <div class="statline">${PNAME[u.player]} · ${u.kw.join(', ')} · <b>${u.pts} pts</b></div>
    <div class="statline">${u.models}/${u.maxModels} models · ${totalWounds(u)}/${maxWounds(u)} wounds${u.bshock?' · <b style="color:var(--blood2)">BATTLE-SHOCKED</b>':''}</div>
    ${u.ranged.length?`<div class="wlabel">RANGED</div>${u.ranged.map(row).join('')}`:''}
    ${u.melee.length?`<div class="wlabel">MELEE</div>${u.melee.map(row).join('')}`:''}
    ${u.abilities&&u.abilities.length?`<div class="wlabel">ABILITIES</div>${u.abilities.map(abrow).join('')}`:''}`;
}
function abLabel(w){const a=w.ab,o=[];if(a.lethal)o.push('LETHAL HITS');if(a.sustained)o.push('SUSTAINED '+a.sustained);
  if(a.devastating)o.push('DEVASTATING');if(a.twinlinked)o.push('TWIN-LINKED');if(a.rapidfire)o.push('RAPID FIRE '+a.rapidfire);
  if(a.torrent)o.push('TORRENT');if(a.assault)o.push('ASSAULT');if(a.pistol)o.push('PISTOL');if(a.hazardous)o.push('HAZARDOUS');
  if(a.anti)o.push('ANTI-'+a.anti.kw+' '+a.anti.val+'+');return o.join(' · ');}

function updateHint(msg){
  const h=$('hint');if(msg){h.innerHTML=msg;return;}
  if(placingTerrain){h.innerHTML=`<b>Terrain setup.</b> Tool: <b class="k">${terrainTool}</b>. Click near a cell edge to place walls/hatchways; click a cell for objectives. Press <span class="k">Begin Deployment</span> when ready.`;return;}
  if(deploying){const nd=nextDeployUnit();if(nd)h.innerHTML=`<b>${PNAME[nd.p]}</b>, place <b>${nd.u.name}</b> — click a highlighted cell.`;return;}
  const ph=PHASES[phaseIdx];const m={
    Command:`<b>Command.</b> CP &amp; Battle-shock auto-resolved. Press <span class="k">Proceed</span>.`,
    Movement:`<b>Movement.</b> Click a unit, then a destination. Within the green ring = Normal move; beyond it you'll <span class="k">roll an Advance</span>.`,
    Shooting:`<b>Shooting.</b> Click one of your units to open the fire-control panel: pick a weapon (range shows on the board), pick a target, then <span class="k">roll attacks</span>.`,
    Charge:`<b>Charge.</b> Click a unit to see legal charges, pick a target, then <span class="k">roll 2D6</span>.`,
    Fight:`<b>Fight.</b> Click any unit in Engagement Range, choose its target, and <span class="k">roll melee attacks</span>. Chargers should fight first.`,
  };h.innerHTML=m[ph];
}

/* ===================================================================
   EVENTS / BOOT
   =================================================================== */
function boardClick(e){
  const r=cv.getBoundingClientRect();
  const fx=(e.clientX-r.left)/(r.width/GW),fy=(e.clientY-r.top)/(r.height/GH);
  const hx=Math.floor(fx),hy=Math.floor(fy);
  if(hx<0||hy<0||hx>=GW||hy>=GH)return;
  if(placingTerrain){terrainClick(hx,hy,fx-hx,fy-hy);return;}
  if(deploying){placeUnit(hx,hy);return;}
  const clicked=units.find(u=>!u.dead&&u.hx===hx&&u.hy===hy);
  if(clicked){
    // routing through card click logic
    selId=clicked.id;
    if(clicked.player===turn){const ph=PHASES[phaseIdx];
      if(ph==="Shooting")beginShootSelection(clicked);
      else if(ph==="Charge")beginChargeSelection(clicked);
      else if(ph==="Fight")beginFightSelection(clicked);}
    else if(PHASES[phaseIdx]==="Fight")beginFightSelection(clicked);
    renderAll();render();return;
  }
  const sel=units.find(u=>u.id===selId);
  if(sel&&PHASES[phaseIdx]==="Movement"&&!action)tryMove(sel,hx,hy);
}
function startBattle(){
  if(mode==='sandbox'){
    const w=parseInt($('inW').value,10),h=parseInt($('inH').value,10);
    if(!isNaN(w))customW=clamp(w,12,40);
    if(!isNaN(h))customH=clamp(h,10,34);
  }
  $('screenMuster').classList.remove('on');$('screenBattle').classList.add('on');
  $('hdrTags').style.display='flex';buildBattle();
}
function backToMuster(){
  $('modal').classList.remove('on');$('screenBattle').classList.remove('on');$('screenMuster').classList.add('on');
  $('hdrTags').style.display='none';$('subTitle').textContent='WARHAMMER 40,000 · BOARDING ACTIONS';
  renderModeSel();renderSizeRow();renderFacSelectors();renderShops();
}

/* ---- ADMIN GATE ---- */
const ADMIN_HASH=3757899016;   // hash of "voidstrike-admin" — change the password by replacing this number (see README)
let adminUnlocked=false;
function strHash(s){let h=0;for(let i=0;i<s.length;i++){h=(h*31+s.charCodeAt(i))|0;}return h>>>0;}
function tryAdminUnlock(){
  const v=$('adminPw').value||'';
  if(strHash(v)===ADMIN_HASH){
    adminUnlocked=true;$('adminGate').style.display='none';$('adminPanel').style.display='block';
    $('adminMsg').textContent='';
  }else{$('adminMsg').textContent='Incorrect password.';}
}

function setStatus(info,where){
  const st=$('dpStatus');if(!st||!info)return;
  const d=info.ts?new Date(info.ts):null;
  st.textContent=`${info.nFac} factions · ${info.nUnits} units${where?' ('+where+')':''}`;st.classList.add('loaded');
}

window.addEventListener('DOMContentLoaded',async()=>{
  cv=$('board');ctx=cv.getContext('2d');logEl=$('log');
  renderModeSel();renderSizeRow();renderFacSelectors();renderShops();

  // DATA LOAD ORDER: committed repo snapshot → localStorage → built-ins only
  let info=null,where='';
  const committed=await autoLoadCommittedData();
  if(committed){info=committed;where='live data';}
  else{const stored=loadStoredData();if(stored){info=stored;where='saved on device';}}
  if(info){rebuildChapters();setStatus(info,where);refreshPlayerNames();renderFacSelectors();renderShops();}

  $('quickFill').onclick=quickMuster;
  $('toBattle').onclick=startBattle;
  $('autoBtn').onclick=()=>autoResolvePhase();
  $('resetBtn').onclick=backToMuster;
  $('modalReset').onclick=backToMuster;
  cv.addEventListener('click',boardClick);

  // ADMIN panel (password-gated): contains all fetch/import/export controls
  $('dpToggle').onclick=()=>{const b=$('dpBody');b.style.display=b.style.display==='none'?'block':'none';};
  $('adminUnlock').onclick=tryAdminUnlock;
  $('adminPw').onkeydown=e=>{if(e.key==='Enter')tryAdminUnlock();};
  document.querySelectorAll('.dpTab').forEach(tab=>tab.onclick=()=>{document.querySelectorAll('.dpTab').forEach(t=>t.classList.remove('active'));tab.classList.add('active');
    ['url','file','paste'].forEach(t=>$('tab-'+t).style.display=(t===tab.dataset.tab?'block':'none'));});
  $('fetchBtn').onclick=()=>fetchAllFactions(false);
  $('refetchBtn').onclick=()=>fetchAllFactions(true);
  $('exportBtn').onclick=exportBundle;
  $('diagBtn').onclick=diagnoseSM;
  $('clearBtn').onclick=()=>{clearStoredData();location.reload();};
  $('fileInput').onchange=e=>loadFromFiles(e.target.files);
  $('pasteBtn').onclick=stagePaste;$('pasteLoadBtn').onclick=loadFromPaste;
  document.querySelectorAll('.toolBtn').forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
});

/* Auto-resolve the active phase (uses the same engine, no manual dice). */
function autoResolvePhase(){
  if(deploying||placingTerrain)return;
  const ph=PHASES[phaseIdx];
  if(ph==="Movement"){
    units.filter(u=>u.player===turn&&!u.dead).forEach(u=>{
      if(inER(u))return;   // stay and fight
      const foes=units.filter(e=>!e.dead&&e.player!==u.player);if(!foes.length)return;
      foes.sort((a,b)=>dist(u,a)-dist(u,b));const foe=foes[0];
      // step up to Move inches toward the foe, into the nearest free, unblocked, non-ER cell
      const stepCells=Math.max(1,Math.round(u.m/HEX_INCH));
      let best=null,bestD=Infinity;
      for(let dx=-stepCells;dx<=stepCells;dx++)for(let dy=-stepCells;dy<=stepCells;dy++){
        const nx=u.hx+dx,ny=u.hy+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;
        if(Math.hypot(dx,dy)*HEX_INCH>u.m)continue;
        if(cellOccupied(nx,ny,u.id))continue;if(segBlocked(u.hx,u.hy,nx,ny))continue;
        const wouldER=units.some(e=>!e.dead&&e.player!==u.player&&Math.hypot(e.hx-nx,e.hy-ny)*HEX_INCH<=ENGAGE_IN);
        const d=Math.hypot(foe.hx-nx,foe.hy-ny);
        if(d<bestD&&(!wouldER||d<=Math.hypot(foe.hx-u.hx,foe.hy-u.hy))){bestD=d;best={nx,ny};}
      }
      if(best){u.hx=best.nx;u.hy=best.ny;u.moved=true;}
    });
    operateHatchways();
    advancePhase();return;
  }
  if(ph==="Shooting"){
    units.filter(u=>u.player===turn&&!u.dead&&!u.fellback).forEach(u=>{
      const er=inER(u);
      u.ranged.forEach((w,i)=>{if(u.advanced&&!w.ab.assault)return;if(er&&!w.ab.pistol)return;
        let tg=units.filter(e=>!e.dead&&e.player!==turn&&dist(u,e)<=w.rng&&visible(u,e));if(er)tg=tg.filter(e=>engaged(u,e));
        if(!tg.length)return;tg.sort((a,b)=>dist(u,a)-dist(u,b));resolveAttacks(u,tg[0],w,u.models,false);});});
  }else if(ph==="Charge"){
    units.filter(u=>u.player===turn&&!u.dead&&!u.advanced&&!u.fellback&&!inER(u)).forEach(u=>{
      const tg=units.filter(e=>!e.dead&&e.player!==turn&&dist(u,e)<=12&&!segBlocked(u.hx,u.hy,e.hx,e.hy));if(!tg.length)return;
      tg.sort((a,b)=>dist(u,a)-dist(u,b));const need=Math.max(0,dist(u,tg[0])-ENGAGE_IN);const roll=d6()+d6();
      log("",`${u.name} charges ${tg[0].name}: 2D6=<b>${roll}″</b> (need ${need.toFixed(1)}″)`);
      if(roll>=need){moveAdjacent(u,tg[0]);u.charged=true;log("save","&nbsp;&nbsp;Success.");}else log("miss","&nbsp;&nbsp;Failed.");});
  }else if(ph==="Fight"){
    const fighters=units.filter(u=>!u.dead&&inER(u));const chargers=fighters.filter(u=>u.charged);const rest=fighters.filter(u=>!u.charged);
    const ordered=[...chargers];let tg=turn===1?2:1;const byP={1:rest.filter(u=>u.player===1),2:rest.filter(u=>u.player===2)};
    while(byP[1].length||byP[2].length){if(byP[tg].length)ordered.push(byP[tg].shift());tg=tg===1?2:1;}
    ordered.forEach(u=>{if(u.dead)return;const t=units.filter(e=>!e.dead&&e.player!==u.player&&engaged(u,e));if(!t.length||!u.melee.length)return;
      resolveAttacks(u,t[0],u.melee[0],u.models,false);u.fought=true;});
  }
  advancePhase();
}
