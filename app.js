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
const HEX_INCH=1;          // simulation resolution: 1 cell = 1 inch (finer grid; was 2)
const _RES=2/HEX_INCH;     // resolution factor vs the original 2"/cell board — cell-based constants scale by this
let CELL=28, GW=Math.round(24*_RES), GH=Math.round(22*_RES);
let hoverHx=-1, hoverHy=-1;   // current mouse-hover cell (for move-preview + facing-toward-cursor render)
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
let sagaDone={1:false,2:false};     // Space Wolves: player has manually marked their Saga completed
let waaaghCalled={1:false,2:false}; // Orks: Waaagh! has been called this battle (once per battle)
let waaaghActive={1:false,2:false}; // Orks: Waaagh! active until start of this player's next Command phase
let waaaghTurnLeft={1:0,2:0};       // turns the active Waaagh! has left (auto-expires)
let shadowUsed={1:false,2:false};   // Tyranids: Shadow in the Warp used this battle (once per battle)
let synapticImp={1:null,2:null};    // Tyranids (Synaptic Nexus): active Synaptic Imperative id this battle round
let spotted={1:[],2:[]};            // T'au: enemy unit ids marked as Spotted by player p this Shooting phase
let spottedML={1:[],2:[]};          // T'au: subset Spotted by a MARKERLIGHT Observer (grants Ignores Cover)
let battleFocus={1:0,2:0};          // Aeldari: Battle Focus tokens available this battle round (spent on Agile Manoeuvres)
let painTokens={1:0,2:0};           // Drukhari: Pain token pool (gain at Command start / per enemy destroyed / per enemy failed Battle-shock; spend to Empower)
let empowered={1:[],2:[]};          // Drukhari: unit ids Empowered this phase (Pain abilities active; cleared each phase start)
let yieldPoints={1:0,2:0};          // Leagues of Votann: Yield Point pool (gain by objective control / kills; threshold flips army stance)
let votannStance={1:'hostile',2:'hostile'};  // 'hostile' (<7YP) or 'fortify' (>=7YP); flips only at end of Command phase
let assailed={1:[],2:[]};           // Votann Persecution Prospect: enemy unit ids assailed by player p (set after a hit; label for bonuses)
let pinned=[];                      // unit ids pinned (Persecution Prospect / suppression): -2" Move, -2 Charge
let resurgence={1:0,2:0};           // Genestealer Cults: Resurgence point pool (Cult Ambush resurrection)
let khorneBlessings={1:[],2:[]};    // World Eaters: active Blessing ids this battle round (e.g. 'bloodlust','warp')
let khorneDice={1:null,2:null};     // World Eaters: current Blessings of Khorne 8D6 roll awaiting activation
let khorneRolled={1:false,2:false}; // whether the Blessings roll has been made this battle round
let pactPoints={1:0,2:0};           // Emperor's Children (Coterie of the Conceited): accumulated Pact points → cumulative combat tiers
let ecPledge={1:0,2:0};             // EC: number of enemy units pledged to destroy this battle round
let ecKills={1:0,2:0};              // EC: enemy units actually destroyed by this player this battle round (tallied for the pledge)
let ecPledged={1:false,2:false};    // EC: whether a pledge has been made this battle round
let favouredChampions={1:null,2:null}; // EC (Slaanesh's Chosen): unit id of the army's current Favoured Champions (reroll Wound; reassigned on a CHARACTER kill)
let miracleDice={1:[],2:[]};        // Adepta Sororitas: Miracle dice pool — array of pre-rolled values (gain 1 per battle round + 1 per ASORITAS unit destroyed)
let sororVow={1:null,2:null};       // Adepta Sororitas (Penitent Host): active Vow of Atonement id this round
let sororRighteous={1:[],2:[]};     // Adepta Sororitas (Champions of Faith): unit ids that are Righteous until next Command phase
let sororUseMiracleBshock={1:false,2:false}; // Sororitas: per-turn intent to substitute a Miracle die into Battle-shock tests
let unitOrders={1:{},2:{}};         // Astra Militarum: map of unit id -> active Order id (lasts until that player's next Command phase)
let ordersIssued={1:0,2:0};         // AM: count of Orders issued this Command phase (for the per-round officer budget)
let dgPlague={1:null,2:null};       // Death Guard: chosen Plague id ('blight'|'ague'|'soulrot') for the army
let dgAfflictExtra={1:[],2:[]};     // Death Guard: enemy unit ids force-Afflicted by stratagem/bombardment this round
let fluxTokens={1:0,2:0};           // Chaos Daemons (Tzeentch): Fates in Flux shared re-roll token pool
let shadowCorrupt={1:[],2:[]};      // Chaos Daemons: objective indices Corrupted into the Shadow of Chaos (stratagem)
let ritualTargets={1:{},2:{}};      // Thousand Sons: enemy unit ids buffed-against by manifested Rituals this phase {destiny:[],destiny10:[],twist:[],twist12:[]}
let ritualsAttempted={1:[],2:[]};   // Thousand Sons: Ritual ids already attempted this turn (each manifestable once)
let kindredTSon={1:null,2:null};    // Thousand Sons (Grand Coven): chosen Kindred Sorcery ability this round
let dreadActive={1:[],2:[]};        // Chaos Knights: active Dread ability ids (accumulate over rounds 1/3/5)
let dreadRolledRound={1:0,2:0};     // last round in which Dread abilities were banked (so we prompt once per 1/3/5)
let darkPact={1:false,2:false};     // Heretic Astartes: Dark Pact active this phase (army-wide toggle, granting Lethal+Sustained)
let bileAugments={1:[],2:[]};       // Creations of Bile: active augmentation ids (chosen at battle start)
let pendingStrat=null;              // a stratagem awaiting target selection
let pendingGate=null;               // Gate of Infinity: {p,max,ids} units offered for reserve recall

function factionDataFor(p){
  // resolve the player's faction to a DETACHMENT_DATA bucket.
  const f=FACTIONS[pFaction[p]];if(!f)return null;
  // chapter/sub-faction supplements take priority if present (e.g. Black Templars)
  const chap=f.chapter||'';
  const chapName=chap?chap[0]+chap.slice(1).toLowerCase():'';
  if(f.name&&DETACHMENT_DATA[f.name])return DETACHMENT_DATA[f.name];
  if(chapName&&DETACHMENT_DATA[chapName])return DETACHMENT_DATA[chapName];
  // shared Space Marines bucket covers all loyalist chapters without their own supplement
  if(f.isSM||/space marines|adeptus astartes|ultramarines|blood angels|dark angels|space wolves|black templars|deathwatch|imperial fists|crimson fists|iron hands|salamanders|raven guard|white scars/i.test(f.name))
    return DETACHMENT_DATA["Space Marines"];
  return DETACHMENT_DATA[f.name]||null;
}
function detachOf(p){const d=factionDataFor(p);if(!d||!pDetach[p])return null;return d.detachments[pDetach[p]];}
function armyRuleOf(p){const det=detachOf(p);if(det&&det.armyRule)return det.armyRule;const d=factionDataFor(p);return d?d.armyRule:null;}

function unitHasKw(u,kw){return (u.kw||[]).includes(kw)||(u.allKw||[]).includes(kw);}
// AIRCRAFT only if it has the keyword AND is not in Hover mode (Hover strips the AIRCRAFT keyword and rules).
function isAircraft(u){return !!u && unitHasKw(u,'AIRCRAFT') && !u._hover;}
function unitCanFly(u){return !!u && (unitHasKw(u,'FLY')||unitHasKw(u,'AIRCRAFT'));}   // AIRCRAFT inherently fly
const AIRCRAFT_MIN_MOVE=20;
function stepFromInch(inch){return Math.max(1,Math.ceil(inch/HEX_INCH));}
/* Hover mode (declared pre-battle for AIRCRAFT with a Hover ability): Move becomes 20", the model loses
   the AIRCRAFT keyword and all aircraft rules, and does NOT start in Reserves. Modelled with `_hover` -
   isAircraft() returns false while set, bypassing every aircraft special-case - plus M:=20. Reversible. */
function unitHasHover(u){return (u.abilities||[]).some(a=>/(^|\b)hover(\b|$)/i.test(a.name||''));}
function setHover(u,on){
  if(!u||!unitHasKw(u,'AIRCRAFT'))return false;
  if(on){ if(u._hover)return true; u._hoverBaseM=u.m; u.m=20; u._hover=true; log("sys",`${u.name} enters Hover mode (Move 20, loses AIRCRAFT rules).`); }
  else { if(!u._hover)return true; if(typeof u._hoverBaseM==='number')u.m=u._hoverBaseM; u._hover=false; log("sys",`${u.name} leaves Hover mode.`); }
  return true;
}
function unitOnObjective(u){const a=unitAnchor(u);return objectives.some(o=>Math.hypot(o.hx-a.hx,o.hy-a.hy)<=1.5);}
function isDeathwing(u){
  // Explicit keyword, or (Dark Angels chapter) granted to Terminators / certain veterans / Dreadnoughts / Land Raiders & Repulsors
  if(unitHasKw(u,'DEATHWING'))return true;
  if(!unitHasKw(u,'DARK ANGELS'))return false;
  return unitHasKw(u,'TERMINATOR')||unitHasKw(u,'DREADNOUGHT')||unitHasKw(u,'LAND RAIDER')||unitHasKw(u,'REPULSOR')
    ||unitHasKw(u,'BLADEGUARD VETERAN SQUAD')||unitHasKw(u,'STERNGUARD VETERAN SQUAD')||unitHasKw(u,'VANGUARD VETERAN SQUAD')||unitHasKw(u,'BLADEGUARD ANCIENT');
}
function isRavenwing(u){
  // Explicit keyword, or (Dark Angels chapter) granted to Mounted units and Vehicles that can Fly
  if(unitHasKw(u,'RAVENWING'))return true;
  if(!unitHasKw(u,'DARK ANGELS'))return false;
  return unitHasKw(u,'MOUNTED')||(unitHasKw(u,'VEHICLE')&&unitHasKw(u,'FLY'));
}
function isClosestEnemy(att,def){
  // true if def is the closest enemy unit to att
  let best=Infinity,bid=null;
  units.filter(e=>e.player!==att.player&&!e.dead).forEach(e=>{const d=dist(att,e);if(d<best){best=d;bid=e.id;}});
  return bid===def.id;
}
function isUnravelling(target){
  // Pantheon of Woe: an enemy unit within 6" of a friendly NECRONS MONSTER is unravelling
  return units.some(m=>m.player!==target.player&&!m.dead&&unitHasKw(m,'NECRONS')&&unitHasKw(m,'MONSTER')&&dist(m,target)<=6);
}

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
    case 'sagaCompleted': return sagaDone[p];          // Space Wolves: Saga marked complete
    case 'waaaghActive': return waaaghActive[p];        // Orks: Waaagh! currently active
    case 'withinSynapse': return att&&unitInSynapse(att);    // Tyranids: attacker in Synapse Range
    case 'synAug': return att&&unitInSynapse(att)&&synapticImp[p]==='aug';   // Synaptic Augmentation active+in range
    case 'synSurge': return att&&unitInSynapse(att)&&synapticImp[p]==='surge';
    case 'synGoad': return att&&unitInSynapse(att)&&synapticImp[p]==='goad';
    case 'khBlood': return att&&khorneBlessingActive(p,'bloodlust');     // Unbridled Bloodlust (charge reroll)
    case 'khRage': return att&&khorneBlessingActive(p,'rage');
    case 'khCarnage': return att&&khorneBlessingActive(p,'carnage');
    case 'khMartial': return att&&khorneBlessingActive(p,'martial')&&isMelee;   // Martial Excellence (Sustained melee)
    case 'khWarp': return att&&khorneBlessingActive(p,'warp')&&isMelee;         // Warp Blades (Lethal melee)
    case 'khDecap': return att&&khorneBlessingActive(p,'decap')&&isMelee&&def&&unitHasKw(def,'INFANTRY'); // Decapitating Strikes
    case 'guided': return def&&!isMelee&&spotted[p]&&spotted[p].includes(def.id);            // T'au: shooting a Spotted unit
    case 'guidedML': return def&&!isMelee&&spottedML[p]&&spottedML[p].includes(def.id);       // Spotted by a MARKERLIGHT observer
    case 'round3plus': return round>=3;        // T'au Kauyon (rounds 3-5)
    case 'round1to3': return round<=3;         // T'au Mont'ka (rounds 1-3)
    case 'within12': return def&&dist(att,def)<=12;
    case 'targetWithinHalf': return def&&dist(att,def)<=12;  // approx "within half range" (range bands not tracked per weapon)
    case 'within9': return def&&dist(att,def)<=9;     // T'au Bonded Heroes / Point-blank
    case 'within6': return def&&dist(att,def)<=6;     // Adepta Sororitas Fervent Purgation / Rites of Fire (target within 6")
    case 'targetInfantry': return def&&(def.allKw||def.kw||[]).includes('INFANTRY');   // target is an INFANTRY unit
    case 'targetVehicle': return def&&(def.allKw||def.kw||[]).includes('VEHICLE');     // target is a VEHICLE unit
    case 'targetMonster': return def&&(def.allKw||def.kw||[]).includes('MONSTER');     // target is a MONSTER unit
    case 'targetBeyond12': return def&&dist(att,def)>12;
    case 'attackerBeyond12': return att&&def&&dist(att,def)>12; // used defensively (att=enemy)
    case 'remainedStationary': return att&&!att.moved&&!att.advanced&&!att.fellback;
    case 'chargedThisTurn': return att&&att.charged;            // Red Thirst / Maddened Ferocity trigger
    case 'selfBattleshocked': return att&&att.bshock;           // BA "if Battle-shocked, +2 instead"
    case 'alreadyHeavy': return weapon&&weapon.ab&&weapon.ab.heavy;
    case 'remainedStationary+alreadyHeavy': return true; // handled via split
    case 'targetMonsterVehicle': return def&&(unitHasKw(def,'MONSTER')||unitHasKw(def,'VEHICLE'));
    case 'targetChaos': return def&&(unitHasKw(def,'CHAOS')||unitHasKw(def,'DAEMON'));   // GK Chaos Bane
    case 'targetDaemon': return def&&unitHasKw(def,'DAEMON');                              // Ordo Malleus Destroy the Daemonic
    case 'empowered': return att&&unitEmpowered(att);                                       // Drukhari: this unit has spent a Pain token this phase
    case 'selfEmpowered': return att&&unitEmpowered(att);
    case 'votannHostile': return att&&votannStanceFor(att.player)==='hostile';               // Leagues of Votann army stance
    case 'votannFortify': return att&&votannStanceFor(att.player)==='fortify';
    case 'targetAssailed': return def&&att&&unitAssailedBy(def,att);                          // Votann Persecution Prospect: target labelled assailed
    case 'selfOnObjective': return att&&unitOnObjective(att);                                 // attacking unit is within range of an objective
    case 'isCthonianBeserks': return att&&unitHasKw(att,'CTHONIAN BESERKS');                   // Dêlve Assault Shift
    case 'isEinhyr': return att&&(unitHasKw(att,'KÂHL')||unitHasKw(att,'EINHYR HEARTHGUARD')||unitHasKw(att,'ÛTHAR THE DESTINED'));  // Hearthband Methodical Annihilation AP
    case 'isTerminator': return att&&unitHasKw(att,'TERMINATOR');     // GK Duty Before All
    case 'isVehicle': return att&&unitHasKw(att,'VEHICLE');           // GK Mailed Fist
    case 'targetInfantrySwarm': return def&&(unitHasKw(def,'INFANTRY')||unitHasKw(def,'SWARM'));  // Tyr Swarming Instincts
    case 'isHarvester': return att&&unitHasKw(att,'HARVESTER');       // Tyr Feed the Swarm
    case 'isTyranidWarrior': return att&&(unitHasKw(att,'TYRANID WARRIORS')||unitHasKw(att,'WINGED TYRANID PRIME'));  // Tyr Leader-beasts invuln
    case 'targetCMV': return def&&(unitHasKw(def,'CHARACTER')||unitHasKw(def,'MONSTER')||unitHasKw(def,'VEHICLE'));
    case 'targetCharacter': return def&&unitHasKw(def,'CHARACTER');
    case 'targetBelowStrength': return def&&totalWounds(def)<maxWounds(def);
    case 'selfBelowHalf': return att&&belowHalf(att);
    case 'selfBelowStrength': return att&&totalWounds(att)<maxWounds(att);   // Stubborn Tenacity etc.
    case 'selfWithinObjective': return att&&unitOnObjective(att);            // approx: within your Vowed objective
    case 'deathwing': return att&&isDeathwing(att);
    case 'ravenwing': return att&&isRavenwing(att);
    case 'targetInfMountedChar': return def&&unitHasKw(def,'CHARACTER')&&(unitHasKw(def,'INFANTRY')||unitHasKw(def,'MOUNTED'));
    case 'outnumbersTarget': return att&&def&&att.models>def.models;        // Pack's Quarry: more models than the target
    case 'targetEngagedByAlly': return att&&def&&units.some(o=>o.player===att.player&&!o.dead&&o.id!==att.id&&unitHasKw(o,'ADEPTUS ASTARTES')&&engaged(o,def)); // target in ER of another friendly Astartes unit
    case 'packsQuarry': return (att&&def&&att.models>def.models)||(att&&def&&units.some(o=>o.player===att.player&&!o.dead&&o.id!==att.id&&unitHasKw(o,'ADEPTUS ASTARTES')&&engaged(o,def)));
    case 'inTerrain': return att&&hasCover(att,att); // approx: in/near terrain
    case 'unitBattleline': return att&&unitHasKw(att,'BATTLELINE');
    case 'psykerOnly': return att&&unitHasKw(att,'PSYKER');
    case 'torrentOnly': return weapon&&weapon.ab&&weapon.ab.torrent;
    case 'alreadyAssault': return weapon&&weapon.ab&&weapon.ab.assault;
    case 'targetWithinObjective': return def&&unitOnObjective(def);
    case 'selfOnHeldObjective': return att&&unitOnObjective(att);
    case 'strHigherThanT': return att&&def&&weapon&&(weapon.s+0)>def.t;
    case 'incomingStrHigherThanSelfT': return att&&weapon&&(weapon.s+0)>att.t;  // DEFENSIVE: in ectx att=the unit being attacked, weapon=incoming attack. Fortify Takeover / Stitchflesh
    case 'selfRighteous': return att&&isRighteous(att);                          // Adepta Sororitas Champions of Faith: this unit is Righteous
    case 'vowAbsolution': return att&&sororVowFor(att.player)==='absolution'&&att.charged; // Sororitas Penitent Host: Absolution in Battle (charged this turn)
    case 'selfNotVehicle': return att&&!unitHasKw(att,'VEHICLE');                // DEFENSIVE: the unit being attacked is not a VEHICLE
    case 'strLowerThanT': return att&&def&&weapon&&(weapon.s+0)<def.t;        // Aeldari No Prey Too Big
    case 'objectiveContested': return (att&&unitOnObjective(att))||(def&&unitOnObjective(def));  // Guardian Defend at All Costs
    case 'isHarleMountedVeh': return att&&(unitHasKw(att,'MOUNTED')||unitHasKw(att,'VEHICLE'))&&unitHasKw(att,'HARLEQUINS');  // Serpent's Brood
    case 'isMountedVehicle': return att&&(unitHasKw(att,'MOUNTED')||unitHasKw(att,'VEHICLE'));      // GSC Rapid Takeover
    case 'within18': return def&&dist(att,def)<=18;       // GSC Close-range Shoot-out
    case 'within6OfAlly': return att&&units.some(o=>o.player===att.player&&!o.dead&&o.id!==att.id&&dist(att,o)<=6);  // GSC Final Day Catalyst (approx)
    case 'strGEQT': return att&&def&&weapon&&(weapon.s+0)>=def.t;
    case 'strLEQT': return att&&def&&weapon&&(weapon.s+0)<=def.t;     // Accept Any Challenge (melee)
    case 'targetAfflicted': return def&&isDeathGuardArmy(att.player)&&unitAfflictedBy(def,att.player);  // Death Guard: target is Afflicted
    case 'inShadow': return att&&unitInShadow(att,att.player);                 // Chaos Daemons: attacker within its Shadow of Chaos
    case 'selfInShadow': return att&&unitInShadow(att,att.player);
    case 'targetBattleshocked': return def&&def.bshock;                        // Daemons Draught of Terror etc.
    case 'attackerBattleshocked': return def&&def.bshock;                      // defensive: in ectx, def is the real attacker (Nightmare Hunt -1 to hit)
    case 'selfAlone': return att&&!units.some(o=>o.player===att.player&&!o.dead&&o!==att&&o.deployed&&!o.inReserve&&dist(o,att)<=3);  // Custodes Against All Odds: no friendly units within 6"
    case 'isWalker': return att&&unitHasKw(att,'WALKER');
    case 'selfAtStartingStrength': return att&&totalWounds(att)>=maxWounds(att)&&(att.models||1)>=(att.maxModels||att.models||1);  // Custodes Auric Armour
    case 'kwKhorne': return att&&unitHasKw(att,'KHORNE');
    case 'kwTzeentch': return att&&unitHasKw(att,'TZEENTCH');
    case 'kwNurgle': return att&&unitHasKw(att,'NURGLE');
    case 'kwSlaanesh': return att&&unitHasKw(att,'SLAANESH');
    case 'ritDestiny': return def&&ritualMarkedHas(att.player,'destiny',def.id);          // Destiny's Ruin: re-roll Hits of 1
    case 'ritDestiny10': return def&&ritualMarkedHas(att.player,'destiny10',def.id);      // (10+: re-roll all)
    case 'ritTwist': return def&&ritualMarkedHas(att.player,'twist',def.id);              // Twist of Fate: +1 AP
    case 'ritTwist12': return def&&ritualMarkedHas(att.player,'twist12',def.id);          // (12+: +2 AP)
    case 'inFlow': return att&&isThousandSonsArmy(att.player)&&inControlZone(att.hx,att.hy,att.player);  // Hexwarp Flow of Magic (same zone model)
    case 'kindredMaelstrom': return att&&kindredTSon[att.player]==='maelstrom';           // Grand Coven Psychic Maelstrom (+1 wound psychic)
    case 'psychicOnly': return weapon&&(weapon.psychic||/psych/i.test(weapon.name||''));  // approx: psychic-tagged weapon
    case 'dreadDoom': return att&&isChaosKnightsArmy(att.player)&&dreadHas(att.player,'doom')&&def&&def.bshock;  // Doom: +1 wound vs Battle-shocked
    case 'pactActive': return att&&darkPact[att.player];                                   // Heretic Astartes: a Dark Pact is active this phase
    case 'pactMeleeKhorne': return att&&darkPact[att.player]&&isMelee&&unitHasKw(att,'KHORNE');   // Mark of Khorne: melee crit on 5+ (with Lethal)
    case 'pactRangedTzeentch': return att&&darkPact[att.player]&&!isMelee&&unitHasKw(att,'TZEENTCH'); // Mark of Tzeentch: ranged crit on 5+
    case 'pactRangedNurgle': return att&&darkPact[att.player]&&!isMelee&&unitHasKw(att,'NURGLE');     // Mark of Nurgle: ranged crit on 5+ (with Sustained)
    case 'pactMeleeSlaanesh': return att&&darkPact[att.player]&&isMelee&&unitHasKw(att,'SLAANESH');   // Mark of Slaanesh: melee crit on 5+ (with Sustained)
    case 'pactUndivided': return att&&darkPact[att.player]&&unitHasKw(att,'CHAOS UNDIVIDED');         // Mark of Chaos Undivided: re-roll Hits of 1
    case 'targetPsyker': return def&&unitHasKw(def,'PSYKER');         // Abhor the Witch
    case 'meleeOnly': return isMelee;
    case 'rangedOnly': return !isMelee;
    case 'selfAncientNearObjective': return att&&unitOnObjective(att)&&unitHasKw(att,'ANCIENT');
    case 'disembarkedThisTurn': return att&&att._disembarkedThisTurn;
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
    // --- Necrons ---
    case 'characterLeading': return att&&(unitHasKw(att,'CHARACTER')||units.some(u=>u.player===att.player&&!u.dead&&u.id!==att.id&&unitHasKw(u,'CHARACTER')&&dist(att,u)<=3));
    case 'targetHalfRange': return def&&weapon&&weapon.rng>0&&dist(att,def)<=weapon.rng/2;
    case 'targetUnravelling': return def&&isUnravelling(def);
    case 'closestTarget': return def&&isClosestEnemy(att,def);
    case 'selfNearObjective': return att&&unitOnObjective(att);
    case 'destroyerCult': return att&&unitHasKw(att,'DESTROYER CULT');
    case 'targetBelowHalf': return def&&belowHalf(def);
    case 'cryptekCanoptek': return att&&(unitHasKw(att,'CRYPTEK')||unitHasKw(att,'CANOPTEK'));
    case 'cryptekUnit': return att&&unitHasKw(att,'CRYPTEK');
    case 'nobleLychguardTriarch': return att&&(unitHasKw(att,'NOBLE')||unitHasKw(att,'LYCHGUARD')||unitHasKw(att,'TRIARCH'));
    case 'vehicleMounted': return att&&(unitHasKw(att,'VEHICLE')||unitHasKw(att,'MOUNTED'));
    case 'critWound': return false; // applied at crit-time, not pre-roll (see Ingrained Superiority note)
    default:
      if(c.indexOf('doctrine:')===0)return doctrineActiveFor(p)===c.slice(9); // generic round-pick stance match
      return true;
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
  const m={addHit:0,addWound:0,plusAttacksMelee:0,plusAttacksRanged:0,plusStrMelee:0,plusStrRanged:0,
    plusApMelee:0,plusApRanged:0,rerollHit:0,rerollWound:0,worsenIncomingAP:0,
    reduceIncomingDmg:0,subIncomingHit:0,subIncomingWound:0,ignoresCover:false,grantCoverDef:false,
    grantSustained:0,grantLethal:false,grantDevastating:false,grantLance:false,grantIgnoresCover:false,
    grantPrecision:false,grantAssault:false,antiKw:null,critOn:0,defFnp:0,defInvuln:0,subIncomingStr:0,ignoreMods:false,rerollOne:false,worsenSave:0,notes:[]};
  const ctx={att,def,weapon,isMelee,p};
  const ectx={att:def,def:att,weapon,isMelee,p:ep}; // for defender-side conditions

  // ---- attacker-side: army rule + detachment rule + active doctrine + enhancements + active stratagems
  collectFx(att,p,ctx,m,'attack');
  // unit-attached enhancement on a leader within the unit is modeled per-unit (att.enh)
  // ---- defender-side: defensive effects (Armour of Contempt, -1 to be hit/wound, FNP, invuln)
  collectFx(def,ep,ectx,m,'defend');
  // Universal Core abilities on the defender (Stealth: -1 to incoming ranged Hit). Applied through the defend path so
  // conditions (rangedOnly) and the -1 cap behave identically to every other defensive modifier.
  applyFxList(coreFxFor(def),ectx,m,'defend');

  // Aeldari Star Engines (Battle Focus): a flagged unit's ranged weapons gain [ASSAULT]
  if(att._bfAssault&&!isMelee)m.grantAssault=true;
  // World Eaters Blessings of Khorne (active army-wide this round; melee only where noted)
  if(isMelee&&isWorldEatersArmy(p)){
    if(khorneBlessingActive(p,'martial'))m.grantSustained=Math.max(m.grantSustained,1);
    if(khorneBlessingActive(p,'warp'))m.grantLethal=true;
    if(khorneBlessingActive(p,'decap')&&def&&unitHasKw(def,'INFANTRY'))m.grantDevastating=true;
  }
  // Death Guard chosen Plague: debuffs applied to an Afflicted unit.
  // Skullsquirm Blight (-1 to the Afflicted attacker's Hit rolls): att is Afflicted by the DEFENDER's DG army.
  if(isDeathGuardArmy(ep)&&dgChosenPlague(ep)==='blight'&&unitAfflictedBy(att,ep))m.subIncomingHit+=1;
  // Rattlejoint Ague (worsen the Afflicted defender's Save): def is Afflicted by the ATTACKER's DG army.
  if(isDeathGuardArmy(p)&&dgChosenPlague(p)==='ague'&&unitAfflictedBy(def,p))m.worsenSave+=1;
  // Thousand Sons manifested Rituals (army-wide, target-keyed, this phase)
  if(isThousandSonsArmy(p)&&def){
    if(ritualMarkedHas(p,'destiny10',def.id))m.rerollHit=mergeRR(m.rerollHit,'all');
    else if(ritualMarkedHas(p,'destiny',def.id))m.rerollHit=mergeRR(m.rerollHit,1);
    if(ritualMarkedHas(p,'twist12',def.id)){if(isMelee)m.plusApMelee+=2;else m.plusApRanged+=2;}
    else if(ritualMarkedHas(p,'twist',def.id)){if(isMelee)m.plusApMelee+=1;else m.plusApRanged+=1;}
  }
  // Chaos Knights Harbingers of Dread (army-wide flags). Doom: +1 Wound vs Battle-shocked. Darkness: -1 to be
  // hit when the attacker is Battle-shocked or shooting from >18" away (defensive, on the Chaos Knights unit).
  if(isChaosKnightsArmy(p)&&dreadHas(p,'doom')&&def&&def.bshock)m.addWound+=1;
  if(isChaosKnightsArmy(ep)&&dreadHas(ep,'darkness')){
    const far=!isMelee&&def&&att&&dist(att,def)>18;
    if(att.bshock||far)m.subIncomingHit+=1;
  }
  // Heretic Astartes Dark Pact (army-wide this phase): grant both Lethal and Sustained 1 (the generous union).
  // Detachment riders (Mark-of-Chaos crits, Cabal Str/AP) flow through collectFx via the pact* conditions.
  if(isHereticAstartesArmy(p)&&darkPact[p]){m.grantLethal=true;m.grantSustained=Math.max(m.grantSustained,1);}
  // Drukhari Empowered (a Pain token was spent on this unit this phase). The ability->fx join layer now supplies
  // each unit's ACTUAL Pain-ability effect (ability_fx.js) instead of a blanket bonus; an unmapped unit falls back
  // to [SUSTAINED HITS 1] (the old reasonable default) so custom/imported units still do something sensible.
  if(att&&unitEmpowered(att)){
    const pf=empoweredFxFor(att);
    if(pf.length)applyFxList(pf,ctx,m,'attack',att);
    else m.grantSustained=Math.max(m.grantSustained,1);
  }
  // Emperor's Children — Pledges to the Dark Prince (Coterie of the Conceited): cumulative Pact-point tiers, army-wide.
  if(isCoterieArmy(p)){
    if(pactPoints[p]>=1)m.rerollHit=mergeRR(m.rerollHit,1);                 // 1+: re-roll Hit roll of 1
    if(pactPoints[p]>=3)m.rerollWound=mergeRR(m.rerollWound,1);             // 3+: re-roll Wound roll of 1
    if(pactPoints[p]>=5&&isMelee){m.grantLethal=true;m.grantSustained=Math.max(m.grantSustained,1);} // 5+: melee Lethal + Sustained 1
    if(pactPoints[p]>=7)m.critOn=m.critOn?Math.min(m.critOn,5):5;                 // 7+: Critical Hit on unmodified 5+
  }
  // Emperor's Children — Daemonic Empowerment (Carnival of Excess): a unit near allied Legions of Excess is Empowered →
  // Sustained 1 (crit-on-5+ if already Sustained). Allied composition isn't modelled, so applied army-wide to EC units.
  if(isECArmy(p)&&detachOf(p)&&/daemonic empowerment/i.test((detachOf(p).rule&&detachOf(p).rule.name)||'')){
    if(m.grantSustained>=1)m.critOn=m.critOn?Math.min(m.critOn,5):5;
    else m.grantSustained=Math.max(m.grantSustained,1);
  }
  // Emperor's Children — Favoured Champions (Slaanesh's Chosen): the army's Favoured unit re-rolls the Wound roll.
  if(att&&isFavouredChampions(att))m.rerollWound=mergeRR(m.rerollWound,'all');
  // Astra Militarum: an Order active on the attacking unit (Take Aim! / Fix Bayonets! / First Rank Fire!).
  if(att&&isAstraArmy(att.player))orderCombatMods(att,isMelee,m);
  // Grizzled Company (Ruthless Discipline): a unit affected by any Order re-rolls a Hit roll of 1.
  if(att&&isAstraArmy(att.player)&&unitOrder(att)&&detachOf(att.player)&&/ruthless discipline/i.test((detachOf(att.player).rule&&detachOf(att.player).rule.name)||''))m.rerollHit=mergeRR(m.rerollHit,1);
  // Astra Militarum: Take Cover! on the DEFENDING unit improves its save (worsenSave is added to def.sv, so subtract; not better than 3+).
  if(def&&isAstraArmy(def.player)&&unitOrder(def)==='cover'&&def.sv>3)m.worsenSave-=1;
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
      case 'plusAttacksRanged': if(!isDef)m.plusAttacksRanged+=fx.n; break;
      case 'plusStrMelee': if(!isDef)m.plusStrMelee+=fx.n; break;
      case 'plusStrRanged': if(!isDef)m.plusStrRanged+=fx.n; break;
      case 'plusApMelee': if(!isDef)m.plusApMelee+=fx.n; break;
      case 'plusApRanged': if(!isDef)m.plusApRanged+=fx.n; break;
      case 'rerollHit': if(!isDef)m.rerollHit=mergeRR(m.rerollHit,fx.val); break;
      case 'rerollWound': if(!isDef)m.rerollWound=mergeRR(m.rerollWound,fx.val); break;
      case 'rerollOnePerPhase': if(!isDef){m.rerollOne=true;          // once/phase single-die re-roll, approximated as re-roll of 1s
        m.rerollHit=mergeRR(m.rerollHit,1);m.rerollWound=mergeRR(m.rerollWound,1);} break;
      case 'grant': if(!isDef){const a=fx.ab;
        if(a==='sustained')m.grantSustained=Math.max(m.grantSustained,fx.val||1);
        if(a==='lethal')m.grantLethal=true;if(a==='devastating')m.grantDevastating=true;
        if(a==='lance')m.grantLance=true;if(a==='ignorescover'){m.grantIgnoresCover=true;m.ignoresCover=true;}
        if(a==='precision')m.grantPrecision=true;if(a==='assault')m.grantAssault=true;} break;
      case 'antiVal': if(!isDef)m.antiKw={kw:fx.kw,val:fx.val}; break;
      case 'critOn': if(!isDef)m.critOn=fx.val; break;
      case 'fightsFirst': /* declarative: detected via unitHasElig in the Fight-phase ordering, not a combat-math mod */ break;
      // defensive (apply when this unit is the DEFENDER)
      case 'worsenIncomingAP': if(isDef)m.worsenIncomingAP+=fx.n; break;
      case 'worsenSave': if(isDef)m.worsenSave+=fx.n; break;   // defensive save modifier (negative = better save, e.g. AM Masters of Camouflage / Take Cover!)
      case 'reduceIncomingDmg': if(isDef)m.reduceIncomingDmg+=fx.n; break;
      case 'subIncomingHit': if(isDef)m.subIncomingHit+=fx.n; break;
      case 'subIncomingWound': if(isDef)m.subIncomingWound+=fx.n; break;
      case 'grantCoverDef': if(isDef)m.grantCoverDef=true; break;
      case 'fnp': if(isDef)m.defFnp=m.defFnp?Math.min(m.defFnp,fx.val):fx.val; break;
      case 'invuln': if(isDef)m.defInvuln=m.defInvuln?Math.min(m.defInvuln,fx.val):fx.val; break;
      case 'subIncomingStr': if(isDef)m.subIncomingStr=(m.subIncomingStr||0)+fx.n; break;  // reduces attacker S (defensive)
      case 'ignoreModifiers': if(!isDef)m.ignoreMods=true; break;     // ignore negative modifiers to our hit/wound
      case 'saveTo': /* characteristic change handled at muster/enhancement assignment, not per-attack */ break;
      case 'objControl': /* applied in scoring via _ocBonus when stratagem committed */ break;
      case 'reanimate': /* hook: Reanimation Protocols healing — fires once a healing system exists */ break;
      case 'note': /* display-only: ability text the abstract board can't apply; logged by the consumer */ break;
    }
  });
}
function mergeRR(cur,val){if(cur==='all'||val==='all')return 'all';return Math.max(cur||0,val||0);}

/* Collect all active fx for a unit's player from rule + doctrine + enhancements + active stratagems. */
function collectFx(unit,p,ctx,m,side){
  const fd=factionDataFor(p);if(!fd)return;
  const det=detachOf(p);
  // army rule (detachment may override the faction default, e.g. Black Templars' Vows)
  const ar=(det&&det.armyRule)?det.armyRule:fd.armyRule;
  if(ar)applyFxList(ar.fx,ctx,m,side);
  // detachment rule
  if(det&&det.rule)applyFxList(det.rule.fx,ctx,m,side);
  // active doctrine
  const dId=doctrineActiveFor(p);
  if(dId){const src=doctrineSource(p);const doc=src&&src.list.find(d=>d.id===dId);if(doc)applyFxList(doc.fx,ctx,m,side);}
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
/* Does unit u currently have a movement-eligibility permission (e.g. eligShootAfterFallBack)?
   Scans army rule + detachment rule + active doctrine + this unit's active stratagems + enhancement,
   honouring each fx's condition. Used to lift the Advance/Fall-Back shooting & charging restrictions. */
function unitHasElig(u,code){
  const p=u.player;const fd=factionDataFor(p);if(!fd)return false;
  const det=detachOf(p);
  const ctx={att:u,def:null,weapon:null,isMelee:false,p};
  const scan=fxArr=>(fxArr||[]).some(fx=>fx.k===code&&condMet(fx.cond,ctx));
  const ar=(det&&det.armyRule)?det.armyRule:fd.armyRule;
  if(ar&&scan(ar.fx))return true;
  if(det&&det.rule&&scan(det.rule.fx))return true;
  const dId=doctrineActiveFor(p);
  if(dId){const src=doctrineSource(p);const doc=src&&src.list.find(d=>d.id===dId);if(doc&&scan(doc.fx))return true;}
  if(det&&det.enhancements&&u.enh){const e=det.enhancements.find(x=>x.name===u.enh);if(e&&scan(e.fx))return true;}
  if(u._stratAtk&&det&&det.stratagems){if(u._stratAtk.some(sn=>{const s=det.stratagems.find(x=>x.name===sn);return s&&scan(s.fx);}))return true;}
  // Ability->fx join: an Empowered Drukhari unit's Pain ability may grant eligibility (e.g. Wyches' charge after Advance/Fall Back).
  if(unitEmpowered(u)&&scan(empoweredFxFor(u)))return true;
  return false;
}
/* Tyranids: is unit u within Synapse Range of its army? True if it is a SYNAPSE model itself,
   or within 6" of any friendly living SYNAPSE unit. (Models-per-unit abstraction: the unit's token.) */
function unitInSynapse(u){
  if(!u||u.dead)return false;
  if(unitHasKw(u,'SYNAPSE'))return true;
  return units.some(o=>o.player===u.player&&!o.dead&&o!==u&&unitHasKw(o,'SYNAPSE')&&dist(o,u)<=6);
}
function isTyranidArmy(p){return /tyranids/i.test((FACTIONS[pFaction[p]]||{}).name||'');}
function isDeathGuardArmy(p){const ar=armyRuleOf(p);return /death guard/i.test((FACTIONS[pFaction[p]]||{}).name||'')||/nurgle.s gift/i.test((ar&&ar.name)||'');}
function isDaemonsArmy(p){const ar=armyRuleOf(p);return /chaos daemons|legiones daemonica/i.test((FACTIONS[pFaction[p]]||{}).name||'')||/shadow of chaos/i.test((ar&&ar.name)||'');}
// Which zone is a board cell in? 'own1' = player 1's deploy zone, 'own2' = player 2's, 'nml' = No Man's Land.
function zoneOfCell(hx,hy){
  if(entryZones[1].some(z=>hx>=z.x0&&hx<=z.x1&&hy>=z.y0&&hy<=z.y1))return 'z1';
  if(entryZones[2].some(z=>hx>=z.x0&&hx<=z.x1&&hy>=z.y0&&hy<=z.y1))return 'z2';
  return 'nml';
}
// Count objectives in each zone and who controls them (by summed OC of units within 1.5 hexes).
function objectiveControlInZone(zone){
  // returns {1:nControlled,2:nControlled,total}
  let r={1:0,2:0,total:0};
  objectives.forEach((o,i)=>{
    if(zoneOfCell(o.hx,o.hy)!==zone)return;
    r.total++;
    let oc={1:0,2:0};
    units.forEach(u=>{if(!u.dead&&u.deployed&&!u.inReserve){const a=unitAnchor(u);if(Math.hypot(o.hx-a.hx,o.hy-a.hy)<=1.5)oc[u.player]+=ocOf(u);}});
    if(oc[1]>oc[2])r[1]++;else if(oc[2]>oc[1])r[2]++;
  });
  return r;
}
function ocOf(u){return Math.max(0,(u.oc||0)+(u._ocBonus||0)+(u._orderOc||0)+armyOcBonus(u))*(u._ocMult||1)*u.models;}
// Army-rule / detachment-rule objControl fx with scope:'army' (e.g. Lords of Dread +2 OC to Knight CHARACTERs).
// Evaluated per-unit so conditions like characterLeading are honoured; this is a standing bonus, not a stratagem.
function armyOcBonus(u){
  if(!u||u.dead)return 0;const p=u.player;const fd=factionDataFor(p);if(!fd)return 0;
  const det=detachOf(p);let bonus=0;
  const lists=[];
  const ar=(det&&det.armyRule)?det.armyRule:fd.armyRule;if(ar&&ar.fx)lists.push(ar.fx);
  if(det&&det.rule&&det.rule.fx)lists.push(det.rule.fx);
  const ctx={att:u,def:null,p,ep:(p===1?2:1),isMelee:false};
  lists.forEach(fxArr=>fxArr.forEach(fx=>{if(fx.k==='objControl'&&fx.scope==='army'&&condMet(fx.cond,ctx))bonus+=fx.n;}));
  return bonus;
}
// Pure zone geometry: is cell (hx,hy) in player dp's own zone / a controlled NML / controlled enemy zone /
// a Corrupted-objective bubble? Used by both Shadow of Chaos (Daemons) and Flow of Magic (Thousand Sons).
function inControlZone(hx,hy,dp){
  const myZone=dp===1?'z1':'z2', oppZone=dp===1?'z2':'z1';
  const z=zoneOfCell(hx,hy);
  if(z===myZone)return true;                                   // own deployment zone always
  if(shadowCorrupt[dp]&&shadowCorrupt[dp].some(i=>objectives[i]&&Math.hypot(objectives[i].hx-hx,objectives[i].hy-hy)*HEX_INCH<=6))return true;
  if(z==='nml'){const c=objectiveControlInZone('nml');return c.total>0&&c[dp]*2>=c.total;}        // NML if you hold half its objectives
  if(z===oppZone){const c=objectiveControlInZone(oppZone);return c.total>0&&c[dp]*2>=c.total;}    // enemy zone likewise
  return false;
}
// Is board cell (hx,hy) within daemon player dp's Shadow of Chaos this phase?
function inShadowOfChaos(hx,hy,dp){
  if(!isDaemonsArmy(dp))return false;
  return inControlZone(hx,hy,dp);
}
function unitInShadow(u,dp){return u&&inShadowOfChaos(u.hx,u.hy,dp);}
// Greater Daemon keywords that project Daemonic Terror within 6".
const GREATER_DAEMONS=['BLOODTHIRSTER','GREAT UNCLEAN ONE','KAIROS FATEWEAVER','KEEPER OF SECRETS','LORD OF CHANGE','ROTIGUS','SHALAXI HELBANE','SKARBRAND'];
function nearGreaterDaemon(u,dp){
  return units.some(o=>o.player===dp&&!o.dead&&o.deployed&&!o.inReserve&&GREATER_DAEMONS.some(k=>unitHasKw(o,k))&&dist(o,u)<=6);
}
function isScintillatingLegion(p){return /fates in flux/i.test((detachOf(p)?.rule?.name)||'');}
function isThousandSonsArmy(p){const ar=armyRuleOf(p);return /thousand sons/i.test((FACTIONS[pFaction[p]]||{}).name||'')||/cabal of sorcerers/i.test((ar&&ar.name)||'');}
function isChaosKnightsArmy(p){const ar=armyRuleOf(p);return /chaos knights/i.test((FACTIONS[pFaction[p]]||{}).name||'')||/harbingers of dread/i.test((ar&&ar.name)||'');}
function isHereticAstartesArmy(p){const ar=armyRuleOf(p);return /heretic astartes|chaos space marines/i.test((FACTIONS[pFaction[p]]||{}).name||'')||/dark pacts|focus of hatred|slaves to none|empyric wellspring|debt to the soul forge|terror made manifest|iron fortitude|marks of chaos|warp portals|soul forge boons|masters of misdirection|raiders and reavers|tyrannical motivation|experimental augmentations|desperate devotion/i.test((ar&&ar.name)||'');}
function isRenegadeWarband(p){return /slaves to none/i.test((detachOf(p)?.rule?.name)||'');}  // Renegades lose Dark Pacts
// Make a Dark Pact for the acting player (army-wide toggle for the phase). Ld test on a representative unit;
// fail -> D3 mortal wounds. Grants Lethal + Sustained-style benefit (we apply both as the generous union).
function makeDarkPact(){
  if(!isHereticAstartesArmy(turn)||isRenegadeWarband(turn)){log("sys","This army cannot make Dark Pacts.");return;}
  if(darkPact[turn]){log("sys","A Dark Pact is already active this phase.");return;}
  const u=units.find(x=>x.player===turn&&!x.dead&&x.deployed&&!x.inReserve);
  const r=d6()+d6();
  const pass=u?r>=u.ld:true;
  log("hd",`⛧ ${PNAME[turn]} invokes a Dark Pact — Ld test ${r}${u?` vs LD${u.ld}`:''}: ${pass?'<span class="save">held</span>':'<span class="kill">FAILED</span>'}`);
  darkPact[turn]=true;
  if(!pass&&u){const mw=d3();applyMortals(u,mw);log("kill",`&nbsp;&nbsp;${u.name} suffers ${mw} mortal wound(s) from the failed pact.`);}
  renderStratPanel&&renderStratPanel();
}
// Creations of Bile / experimental augmentations (chosen at battle start; mostly characteristic-level)
const BILE_AUGMENTS=[
  {id:'cholin',name:'Cholinergic Accelerants',desc:'+1 Attack to melee weapons.'},
  {id:'hyper',name:'Hyperadrenal Infusion',desc:'+2" Move.'},
  {id:'parane',name:'Paraneural Reactions',desc:'+1 WS (melee).'},
  {id:'chitin',name:'Supracutaneous Chitination',desc:'+1 Toughness.'},
  {id:'sinew',name:'Macrotensile Sinews',desc:'+1 Strength (melee).'},
  {id:'ophth',name:'Ophthalmic Enhancement',desc:'+1 BS (ranged).'},
];
function isCreationsOfBile(p){return /experimental augmentations/i.test((detachOf(p)?.rule?.name)||'');}
function haTerrorActive(p){return isHereticAstartesArmy(p)&&/terror descends|terror made manifest/i.test((detachOf(p)?.rule?.name)||'');}  // Dread Talons / Nightmare Hunt
// The seven Dread abilities. Deathly Terror is always active; the rest are banked at rounds 1/3/5.
const DREAD_ABILITIES=[
  {id:'terror',name:'Deathly Terror',desc:'Enemies within 9": -1 Leadership.'},
  {id:'despair',name:'Despair',desc:'Enemies within 9": a further -1 Leadership.'},
  {id:'doom',name:'Doom',desc:'+1 Wound vs Battle-shocked targets.'},
  {id:'darkness',name:'Darkness',desc:'-1 to be hit by Battle-shocked or far (>18") attackers.'},
  {id:'dismay',name:'Dismay',desc:'Below-strength enemies within 9" take a Battle-shock test.'},
  {id:'delirium',name:'Delirium',desc:'Below-half enemies within 9" that fail Battle-shock suffer D3 mortals.'},
  {id:'dominion',name:'Dominion',desc:'+3" to your Aura ranges.'},
];
function dreadHas(p,id){return dreadActive[p]&&dreadActive[p].includes(id);}
function dreadName(id){const d=DREAD_ABILITIES.find(x=>x.id===id);return d?d.name:id;}
function seedDread(p){if(isChaosKnightsArmy(p)&&!dreadHas(p,'terror'))dreadActive[p].push('terror');}  // Deathly Terror always on
function bankDread(p,id){
  if(!isChaosKnightsArmy(p)||dreadHas(p,id))return;
  dreadActive[p].push(id);
  log("hd",`☠ ${PNAME[p]} — Dread ability active: ${dreadName(id)}.`);
  renderStratPanel&&renderStratPanel();
}
// Effective aura range for Chaos Knights (Dominion adds 3"); used by the Leadership/Battle-shock auras.
function dreadAuraRange(p){return dreadHas(p,'dominion')?12:9;}
// Total Leadership worsening an enemy unit `eu` suffers from being near the Chaos Knights player kp's models.
function dreadLdPenalty(eu,kp){
  if(!isChaosKnightsArmy(kp))return 0;
  const R=dreadAuraRange(kp);
  const near=units.some(o=>o.player===kp&&!o.dead&&o.deployed&&!o.inReserve&&unitHasKw(o,'CHAOS KNIGHTS')&&dist(o,eu)<=R);
  if(!near)return 0;
  let pen=0;
  if(dreadHas(kp,'terror'))pen+=1;
  if(dreadHas(kp,'despair'))pen+=1;
  return pen;
}
function isPsykerUnit(u){return u&&(unitHasKw(u,'PSYKER')||unitHasKw(u,'SORCERER')||unitHasKw(u,'CHARACTER'));}  // models able to attempt Rituals (approx)
const RITUALS=[
  {id:'destiny',name:"Destiny\u2019s Ruin",wc:5,desc:"Re-roll Hits of 1 vs a target (re-roll all on 10+)."},
  {id:'surge',name:"Temporal Surge",wc:6,desc:"A friendly unit makes a D6\" move (6\" on 10+)."},
  {id:'doombolt',name:"Doombolt",wc:7,desc:"A target suffers D3 mortal wounds (D3+3 on 11+)."},
  {id:'twist',name:"Twist of Fate",wc:9,desc:"+1 AP vs a target (+2 on 12+)."},
];
function ritualMarkedHas(p,key,id){return ritualTargets[p]&&ritualTargets[p][key]&&ritualTargets[p][key].includes(id);}
// Attempt one Ritual: pick the sorcerer model, the highest-charge Ritual that hasn't been tried, an enemy/own target.
function attemptRitual(channel){
  if(!isThousandSonsArmy(turn))return;
  const sorc=units.find(u=>u.player===turn&&!u.dead&&u.deployed&&!u.inReserve&&isPsykerUnit(u)&&!u._ritualThisTurn);
  if(!sorc){log("sys","No sorcerer available to attempt a Ritual.");return;}
  const ritual=RITUALS.find(r=>!ritualsAttempted[turn].includes(r.id));
  if(!ritual){log("sys","All Rituals have been attempted this turn.");return;}
  sorc._ritualThisTurn=true;ritualsAttempted[turn].push(ritual.id);
  const dice=[d6(),d6()];if(channel)dice.push(d6());
  const total=dice.reduce((a,b)=>a+b,0);
  // doubles/triples backlash: D3 mortal wounds to the sorcerer's unit
  const counts={};dice.forEach(d=>counts[d]=(counts[d]||0)+1);
  const hadMulti=Object.values(counts).some(c=>c>=2);
  log("hd",`✶ ${PNAME[turn]} Ritual — ${ritual.name} (WC ${ritual.wc}): rolled ${dice.join(', ')}${channel?' (Channelled)':''} = ${total}`);
  logDice(dice.map(v=>({v})));
  if(hadMulti){const mw=d3();applyMortals(sorc,mw);log("kill",`&nbsp;&nbsp;Perils: ${sorc.name} suffers ${mw} mortal wound(s) (doubles).`);}
  if(sorc.dead){log("miss","&nbsp;&nbsp;The sorcerer is destroyed — Ritual fails.");renderStratPanel();return;}
  if(total<ritual.wc){log("miss",`&nbsp;&nbsp;Failed to manifest (needed ${ritual.wc}).`);renderStratPanel();return;}
  manifestRitual(ritual,total);
  renderStratPanel();
}
function manifestRitual(ritual,total){
  const ep=turn===1?2:1;
  const enemies=units.filter(u=>u.player===ep&&!u.dead&&u.deployed&&!u.inReserve);
  if(ritual.id==='destiny'){
    if(!enemies.length)return;const t=closestEnemyToAny(turn,enemies);
    (ritualTargets[turn].destiny=ritualTargets[turn].destiny||[]).push(t.id);
    if(total>=10)(ritualTargets[turn].destiny10=ritualTargets[turn].destiny10||[]).push(t.id);
    log("sys",`&nbsp;&nbsp;Destiny\u2019s Ruin on ${t.name}: re-roll ${total>=10?'all Hits':'Hits of 1'}.`);
  } else if(ritual.id==='twist'){
    if(!enemies.length)return;const t=closestEnemyToAny(turn,enemies);
    (ritualTargets[turn].twist=ritualTargets[turn].twist||[]).push(t.id);
    if(total>=12)(ritualTargets[turn].twist12=ritualTargets[turn].twist12||[]).push(t.id);
    log("sys",`&nbsp;&nbsp;Twist of Fate on ${t.name}: +${total>=12?2:1} AP for your attacks.`);
  } else if(ritual.id==='doombolt'){
    if(!enemies.length)return;const t=closestEnemyToAny(turn,enemies);
    const mw=total>=11?(d3()+3):d3();applyMortals(t,mw);
    log("kill",`&nbsp;&nbsp;Doombolt strikes ${t.name}: ${mw} mortal wound(s).`);
  } else if(ritual.id==='surge'){
    log("sys",`&nbsp;&nbsp;Temporal Surge: a friendly unit may make a ${total>=10?'6':'D6'}" move (logged).`);
  }
}
function closestEnemyToAny(p,enemies){
  // the enemy nearest to any of this player's units (a sensible auto-target)
  const mine=units.filter(u=>u.player===p&&!u.dead&&u.deployed&&!u.inReserve);
  let best=enemies[0],bd=Infinity;
  enemies.forEach(e=>{mine.forEach(m=>{const d=dist(m,e);if(d<bd){bd=d;best=e;}});});
  return best;
}
function grantFlux(p){if(isScintillatingLegion(p)){fluxTokens[p]=3;log("sys",`${PNAME[p]} begins with 3 Flux tokens (Fates in Flux).`);}}
function spendFlux(){
  // Spend one Flux token (gives the opponent one, per the rule) — a re-roll resource the player narrates.
  if(fluxTokens[turn]<=0)return;
  const ep=turn===1?2:1;
  fluxTokens[turn]--;fluxTokens[ep]++;
  log("sys",`${PNAME[turn]} spends a Flux token to re-roll (opponent gains one). ${fluxTokens[turn]} left.`);
  renderStratPanel();
}
// Contagion Range grows over the battle: 3" (R1), 6" (R2), 9" (R3+). Plaguesurge/Blooming add +3" (not tracked per-unit here).
function contagionRange(){return round<=1?3:round===2?6:9;}
// Is enemy unit `eu` Afflicted by Death Guard player `dgP`? (within Contagion Range of any DG model, or force-Afflicted)
function unitAfflictedBy(eu,dgP){
  if(!eu||eu.dead)return false;
  if(dgAfflictExtra[dgP]&&dgAfflictExtra[dgP].includes(eu.id))return true;
  if(!isDeathGuardArmy(dgP))return false;
  const R=contagionRange();
  return units.some(o=>o.player===dgP&&!o.dead&&o.deployed&&!o.inReserve&&dist(o,eu)<=R);
}
// The chosen Plague effect for player p (defaults to Skullsquirm if DG and none chosen).
function dgChosenPlague(p){return dgPlague[p]||(isDeathGuardArmy(p)?'blight':null);}
function hasShadowModel(p){return units.some(u=>u.player===p&&!u.dead&&unitHasKw(u,'SYNAPSE'));}

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
/* Apply the unseeable-X override library (xvalues.js) over the imported templates. Runs after any import
   so manually-maintained X's survive a re-fetch. firingDeck: a real number overrides; null keeps the
   importer's default (2 when present). deadlyDemise/scouts: a real value (number or dice string) is stamped
   onto the template; null leaves it unknown (engine uses its dormant/default handling and can log a note). */
function applyXValues(){
  if(typeof X_VALUES==='undefined')return;
  const fd=X_VALUES.firingDeck||{}, dd=X_VALUES.deadlyDemise||{}, sc=X_VALUES.scouts||{};
  Object.keys(fd).forEach(k=>{const t=TEMPLATES[k];if(t&&fd[k]!=null)t.firingDeck=fd[k];});
  Object.keys(dd).forEach(k=>{const t=TEMPLATES[k];if(t&&dd[k]!=null)t.deadlyDemise=dd[k];});
  Object.keys(sc).forEach(k=>{const t=TEMPLATES[k];if(t&&sc[k]!=null)t.scoutsMove=sc[k];});
}
function applyBundle(p){
  if(!p||!p.TEMPLATES||!p.FACTIONS)return false;
  Object.assign(TEMPLATES,p.TEMPLATES);
  FACTIONS=Object.assign({},FACTIONS,p.FACTIONS);
  applyXValues();
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

/* ---- WARGEAR OPTIONS / LOADOUT PARSER -------------------------------------------------------------
   Wahapedia's Datasheets_options table holds free-form English describing legal wargear swaps, e.g.
   "1 in 5 models may replace its boltgun with a flamer", "the Sergeant may take a power fist".
   We attach the RAW text to every template (lossless), and parse the COMMON structured patterns into a
   machine-usable loadoutOptions array. Anything we can't confidently parse is kept as raw text and flagged
   unparsed — we never invent an illegal loadout. Each parsed option:
   {ratio:{n,per}|null, who:string|null, replace:[names], with:[names], take:[names], raw}. */
function parseLoadoutOptions(rows){
  const out={options:[],unparsed:[]};
  const clean=s=>String(s).replace(/^(a|an|its|their|the)\s+/i,'').replace(/^\d+\s+/,'').replace(/[.;*]+$/,'').trim();
  // multi-item lists in the real data are "one of the following:" with items often newline-joined and
  // each prefixed by a count ("1 castellan axe1 sentinel blade"). Split on newlines AND on the "<digit>"
  // boundaries that begin each item, then strip leading counts.
  const splitChoices=s=>{
    let t=String(s).replace(/^.*one of the following:?/i,'');
    // A choice item may itself be an "A and B" bundle ("1 plasma pistol and 1 Astartes chainsword").
    // Insert a separator before a count ("1 "/"2 ") that starts a NEW choice — but NOT when that count is
    // joined to the previous item by "and" (i.e. it's part of the same bundle). So we break before "<n> "
    // only when preceded by a letter/paren that is NOT the word "and".
    t=t.replace(/([a-z\)])\s+and\s+(\d+\s)/gi,'$1 and \u0001$2');   // protect "and 1 X" bundle joins
    t=t.replace(/([a-z\)])\s*(\d+\s)/g,'$1\n$2');                    // break before a new choice's count
    t=t.replace(/\u0001/g,'');                                       // unprotect
    return t.split(/\n+/).map(x=>x.replace(/^\d+\s+/,'').replace(/\s+and\s+\d+\s+/gi,' and ').replace(/[.;*]+$/,'').trim()).filter(Boolean);
  };
  // split an "A and B" replace-target into its weapons ("bolt pistol and Astartes chainsword" -> [a,b])
  const splitAnd=s=>String(s).replace(/\band\b/gi,'\u0003').split('\u0003').map(x=>x.replace(/^\d+\s+/,'').replace(/^(a|an|its|their|the)\s+/i,'').replace(/[.;*]+$/,'').trim()).filter(Boolean);
  const splitWith=s=>{
    let t=String(s).replace(/^:\s*/,'');               // strip a leading colon ("equipped with:1 X")
    if(/one of the following/i.test(t))return splitChoices(t);
    if(/^:?\s*\d/.test(s)&&/\d.*\d/.test(t)){            // colon-joined count-prefixed list without "one of the following"
      let z=t.replace(/([a-z\)])\s+and\s+(\d+\s)/gi,'$1 and \u0001$2');  // protect "and 1 X" bundle joins
      z=z.replace(/([a-z\)])\s*(\d+\s)/g,'$1\n$2');                       // break before a new item's count
      z=z.replace(/\u0001/g,'');                                          // unprotect
      const parts=z.split(/\n+/).map(x=>x.replace(/^\d+\s+/,'').replace(/\s+and\s+\d+\s+/gi,' and ').replace(/[.;*]+$/,'').trim()).filter(Boolean);
      if(parts.length>=1)return parts;
    }
    return t.replace(/\bor\b/gi,',').split(',').map(x=>x.replace(/^\d+\s+/,'').replace(/^(a|an|its|their|the)\s+/i,'').replace(/[.;*]+$/,'').trim()).filter(Boolean);
  };
  (rows||[]).forEach(r=>{
    const raw=stripHtml(r.description||r.button||r.line||'').trim();
    if(!raw)return;
    if(/^none\.?$/i.test(raw))return;                     // "None"/"None." = no options, not a failure
    let text=raw.replace(/\u2019/g,"'").replace(/\bcan replaced\b/gi,'can be replaced').replace(/\bcan be replace\b/gi,'can be replaced').replace(/replaced one of the following/gi,'replaced with one of the following'); // source typos
    if(/^\*/.test(text))return;                          // footnote restriction, not an option
    if(/'s .+ replaced with /i.test(text) && !/\bcan \b/i.test(text)) text=text.replace(/ replaced with /i,' can be replaced with '); // source typo: missing 'can be'
    // Non-options that should NOT count as parse failures:
    if(/\bis equipped with:/i.test(text))return;         // a named model's FIXED default loadout
    if(/^this weapon cannot be replaced/i.test(text))return;
    if(/^for every .+ it can have .*token/i.test(text))return;   // unit-level token/upgrade grant, not a weapon swap
    if(/\bplasmacyte\b/i.test(text))return;                      // Plasmacyte is modelled as a unit ability (grantPlasmacytes), not a wargear swap
    // Conditional options: "If <condition>, <clause>" / "If <condition>:<clause>" — keep the clause + condition.
    let condition=null;
    let cond=text.match(/^if\s+(.+?)[,:]\s*(.+)$/i);
    if(cond && /(can be equipped with|can be replaced|can each have|can have|can replace|replaced with)/i.test(cond[2])){
      condition=cond[1].trim(); text=cond[2].trim();
    } else if(/can do one of the following/i.test(text)){
      // Choice-of-ACTIONS: "<subject> can do one of the following: <action1>. <action2>." where each action
      // is itself a full clause ("Replace its A and B with C", "Be equipped with D"). Parse the subject,
      // split the actions, and recursively parse each as its own option; emit a single option carrying a
      // `choices` array. The player picks exactly one action.
      const cm=text.match(/^(.+?)\s+can do one of the following:\s*(.+)$/i);
      if(cm){
        const cwho=subjName(cm[1]);
        // split actions on sentence boundaries before a capitalised verb ("Replace"/"Be equipped"/"Have")
        let body=cm[2].replace(/\.\s*(Replace|Be equipped|Have|Take)\b/g,'.\u0002$1');
        const acts=body.split('\u0002').map(a=>a.replace(/\.\s*$/,'').trim()).filter(Boolean);
        const choices=[];
        acts.forEach(a=>{
          // each action: "Replace its A (and B) with C" | "Be equipped with D" | "Take D"
          let am;
          if((am=a.match(/^replace\s+(?:its|their)?\s*(.+?)\s+with\s+(.+)$/i))){
            choices.push({replace:splitAnd(am[1]),with:splitWith(am[2]),take:[]});
          } else if((am=a.match(/^be equipped with\s+(.+)$/i))){
            choices.push({replace:[],with:[],take:splitWith(am[1])});
          } else if((am=a.match(/^take\s+(.+)$/i))){
            choices.push({replace:[],with:[],take:splitWith(am[1])});
          }
        });
        if(choices.length){ out.options.push({ratio:null,who:cwho,replace:[],with:[],take:[],choices,condition:null,raw}); return; }
      }
      out.unparsed.push(raw);return;                     // couldn't structure it -> keep verbatim
    }

    // ---- STAGE 1: peel off a quantifier prefix and record the ratio ----------------------------------
    // recognises: "Any number of <X>", "All (of the )?models|<X>", "Up to N <X>", "N <X>",
    //             "For every N models, (up to )?M <X>", and a bare "This model".
    let ratio=null, rest=text;
    let m;
    // (leading 'This unit' is handled as a normal subject by Stage-2's verb split)
    if((m=text.match(/^for every (\d+) models?,?\s+(?:up to\s+)?(\d+|two|three|four|five)\s+(.*)$/i))){
      ratio={n:wnum(m[2]),per:+m[1]}; rest=m[3];
    } else if((m=text.match(/^any number of\s+(.*)$/i))){
      ratio={n:'*',per:1}; rest=m[1];
    } else if((m=text.match(/^all(?: of the)?\s+models?\s+(?:in this unit\s+)?(.*)$/i))){
      ratio={n:'*',per:1}; rest=m[1];
    } else if((m=text.match(/^all\s+(.+?)\s+in this unit\s+(.*)$/i))){
      ratio={n:'*',per:1}; rest=m[2];                    // "All <NamedModels> in this unit ..."
    } else if((m=text.match(/^up to\s+(\d+|two|three|four|five)\s+(.*)$/i))){
      ratio={n:wnum(m[1]),per:0}; rest=m[2];
    } else if((m=text.match(/^(\d+|one|two|three|four|five)\s+(.*)$/i))){
      ratio={n:wnum(m[1]),per:0}; rest=m[2];             // bare "2 models ...", "one model ...", "1 <Named> ..."
    }
    // strip a residual leading subject noun ("models", "<Named>s", "<Named>") before the verb,
    // keeping the subject name for who when it is not a generic "models"
    let who=null;
    let vm=rest.match(/^(.*?)\b(can each be replaced|can be replaced|can each have|can have|can each be equipped|can be equipped|can each replace|can replace|must be equipped)\b(.*)$/i);
    if(!vm){ out.unparsed.push(raw); return; }
    let subjectPhrase=vm[1].trim(), verb=vm[2].toLowerCase(), tail=vm[3].trim();

    // ---- STAGE 2: parse the action --------------------------------------------------------------------
    // possessive subject: "<subject>'s <weapon>"  -> the weapon being replaced lives in the subject phrase
    let possWeapon=null;
    const pm=subjectPhrase.match(/^(.*?)'s\s+(.+)$/);
    if(pm){ who=subjName(pm[1]); possWeapon=pm[2].trim(); }
    else { who=subjName(subjectPhrase); }

    let parsed=null;
    if(/be equipped/.test(verb)){
      parsed={ratio,who,replace:[],with:[],take:splitWith(stripLead(tail)),condition,raw};
    } else if(/can each have|can have/.test(verb)){
      // "... have [their] A replaced with B"
      const hm=tail.match(/^(?:their\s+)?(.+?)\s+replaced with\s+(.+)$/i);
      if(hm)parsed={ratio,who,replace:[clean(hm[1])],with:splitWith(hm[2]),take:[],condition,raw};
    } else if(/can each replace|can replace/.test(verb)){
      // "... replace [its|their] A with B"  (active voice; supports "with:" colon and bundle targets)
      const rm=tail.match(/^(?:its|their)?\s*(.+?)\s+with[\s:]+(.+)$/i);
      if(rm)parsed={ratio,who,replace:splitAnd(rm[1]),with:splitWith(':'+rm[2]),take:[],condition,raw};
    } else if(/be replaced/.test(verb)){
      // possessive form: weapon is possWeapon, replacement is in tail ("with B" or "with:1 B and 1 C")
      const wm=tail.match(/^with[\s:]+(.+)$/i);
      if(wm&&possWeapon)parsed={ratio,who,replace:splitAnd(possWeapon),with:splitWith(':'+wm[1]),take:[],condition,raw};
      else if(wm)parsed={ratio,who,replace:[],with:splitWith(':'+wm[1]),take:[],condition,raw};  // whole-model swap
    }
    if(parsed&&(parsed.with.length||parsed.take.length))out.options.push(parsed);
    else out.unparsed.push(raw);
  });
  return out;
  function wnum(x){if(!x)return 0;if(/^\d+$/.test(x))return +x;return {two:2,three:3,four:4,five:5}[String(x).toLowerCase()]||0;}
  function stripLead(s){return String(s).replace(/^(?:with\s*)?:?\s*/i,'');}
  function subjName(s){
    s=String(s).replace(/\bmodels?\b/ig,'').replace(/^(the|a|an)\s+/i,'').replace(/^\d+\s*/,'').replace(/\badditional\b/ig,'').replace(/\bin this unit\b/i,'').trim();
    if(!s||/^this$/i.test(s))return 'model';
    return s;
  }
}

/* Build TEMPLATES + FACTIONS from parsed CSV tables (incl. abilities). */
function buildFromCSV(tables){
  const {Factions,Datasheets,Datasheets_models,Datasheets_wargear,Datasheets_models_cost,
         Datasheets_keywords,Datasheets_abilities,Datasheets_options,Abilities}=tables;
  if(!Factions||!Datasheets||!Datasheets_models||!Datasheets_wargear)
    throw new Error("Need at least Factions, Datasheets, Datasheets_models, Datasheets_wargear.");
  const facName={};Factions.forEach(f=>facName[f.id]=f.name);
  const abilityById={};(Abilities||[]).forEach(a=>abilityById[a.id]={name:a.name,desc:stripHtml(a.description||a.legend||''),type:'Core'});
  const byDs=arr=>{const m={};(arr||[]).forEach(r=>{(m[r.datasheet_id]=m[r.datasheet_id]||[]).push(r);});return m;};
  const models=byDs(Datasheets_models), wargear=byDs(Datasheets_wargear),
        costs=byDs(Datasheets_models_cost), kws=byDs(Datasheets_keywords), dsAb=byDs(Datasheets_abilities),
        opts=byDs(Datasheets_options);

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
    // Transport capacity: Wahapedia's Datasheets CSV carries a `transport` field describing the capacity.
    // Parse the leading model count from it (e.g. "This model has a transport capacity of 12 ... models").
    let capacity=0;
    if(ds.transport){const cm=String(ds.transport).match(/(\d+)/);if(cm)capacity=toInt(cm[1],0);}
    // Firing Deck x: the export carries only the generic glossary text (placeholder 'x'), so a number
    // rarely parses. If the ability is PRESENT, default to 2 (the modal 10e value); xvalues.js can override.
    let firingDeck=0;
    abilities.forEach(a=>{
      const blob=String(a.name+' '+(a.desc||''));
      if(/firing deck/i.test(blob)){
        const fm=blob.match(/firing deck\s*['\u2018\u2019]?(\d+)/i);
        firingDeck=Math.max(firingDeck, fm?toInt(fm[1],2):2);   // present-but-unnumbered -> default 2
      }
    });
    newTpl[key]={name:ds.name,kw:kwList.length?kwList:["INFANTRY"],factionKw,allKw:allKwUpper,pts:pts||0,role:ds.role||'',
      m,t,sv,inv,w,ld,oc,models:modelCount,
      ranged,melee:melee.length?melee:[W("Close combat weapon","M",0,1,4,t,0,1)],
      abilities,
      transportCapacity:capacity, firingDeck:firingDeck,
      loadout:parseLoadoutOptions(opts[ds.id])};
    (facUnits[ds.faction_id]=facUnits[ds.faction_id]||[]).push(key);
  });

  Object.assign(TEMPLATES,newTpl);
  applyXValues();
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
  {kw:'BLOOD RAVENS',name:'Blood Ravens'},
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
               'Datasheets_models_cost','Datasheets_keywords','Datasheets_abilities','Datasheets_options','Abilities'];
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
  const names=['Factions','Datasheets','Datasheets_models','Datasheets_wargear','Datasheets_models_cost','Datasheets_keywords','Datasheets_abilities','Datasheets_options','Abilities'];
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
    hx:-1,hy:-1,modelPos:null,deployed:false,moved:false,advanced:false,fellback:false,charged:false,fought:false,
    inReserve:false,_reserveRound:0,_setupThisTurn:false,_arriveExtraMove:null,
    _plasmacytes:0,
    facing:null,   // heading in degrees (0=east, 90=south on screen y-down); null = no facing tracked. Pass A: written on move, read by nothing yet.
    _capacity:(t.transportCapacity||0),_firingDeck:(t.firingDeck||0),_embarkedIn:null,_embarked:[],_disembarkedThisTurn:false,
    shotWith:[],bshock:false,dead:false,_stratAtk:[],_stratDef:[],_ocBonus:0,_ocMult:1,_orderMove:0,_orderOc:0,_orderLd:0};
}
function totalWounds(u){return (u.models-1)*u.w+u.woundsLeft;}
/* ---- Per-model position layer (migration seam, Pass 1: scaffolding only) -------------------
   The engine is moving from a single-token representation toward per-model positions. To do that
   without a disruptive rewrite, position is accessed through these helpers. While `u.modelPos` is
   null (the current state), they derive everything from the token `hx/hy`, so behaviour is
   byte-identical to before — proven by the equivalence oracle. Later passes will (a) populate
   `modelPos` as an array of {hx,hy} at deployment, and (b) make the token fields a derived view
   (centroid) so any not-yet-migrated reader still sees a sensible single position.
   positionsOf(u) -> array of model positions ([{hx,hy}], length 1 until populated).
   unitAnchor(u)  -> the canonical single position (centroid of modelPos, or the token).            */
function positionsOf(u){
  if(u&&u.modelPos&&u.modelPos.length)return u.modelPos;
  return [{hx:u?u.hx:-1,hy:u?u.hy:-1}];
}
function unitAnchor(u){
  if(u&&u.modelPos&&u.modelPos.length){
    let sx=0,sy=0;for(const p of u.modelPos){sx+=p.hx;sy+=p.hy;}
    return {hx:sx/u.modelPos.length,hy:sy/u.modelPos.length};
  }
  return {hx:u?u.hx:-1,hy:u?u.hy:-1};
}
/* Pass 2: populate per-model positions as a symmetric cluster centred on the token (hx,hy).
   Because the cluster is symmetric, its centroid equals the token exactly, so unitAnchor() — and
   therefore every consumer already routed through it, like dist() — is byte-identical to before.
   The token remains the authoritative anchor for now; modelPos tracks it. A later pass will invert
   this (modelPos becomes authoritative, token becomes the derived centroid) once enough consumers
   read modelPos directly. Cluster pattern: the anchor cell first, then a ring of offsets, so a
   1-model unit sits exactly on the token and larger units fan out by ~1 cell — close enough to the
   2" coherency spacing the board uses without yet enforcing coherency. */
const _CLUSTER_OFFSETS_BASE=[[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1],[2,0],[-2,0],[0,2]];
// Scale the per-model cluster offsets so the cluster keeps the same PHYSICAL footprint at any resolution.
const _CLUSTER_OFFSETS=_CLUSTER_OFFSETS_BASE.map(o=>[Math.round(o[0]*_RES),Math.round(o[1]*_RES)]);
function syncModelPos(u){
  if(!u||u.dead){if(u)u.modelPos=null;return;}
  const n=Math.max(1,u.models|0);
  const out=[];
  for(let i=0;i<n;i++){
    const off=_CLUSTER_OFFSETS[i%_CLUSTER_OFFSETS.length];
    out.push({hx:clamp(u.hx+off[0],0,GW-1),hy:clamp(u.hy+off[1],0,GH-1)});
  }
  // re-centre so the centroid lands exactly on the token (clamping at board edges could skew it);
  // if the centroid drifted, fall back to all-models-on-anchor to preserve unitAnchor()==token.
  let sx=0,sy=0;for(const p of out){sx+=p.hx;sy+=p.hy;}
  const cx=sx/out.length, cy=sy/out.length;
  if(Math.abs(cx-u.hx)>1e-9||Math.abs(cy-u.hy)>1e-9){
    for(const p of out){p.hx=u.hx;p.hy=u.hy;}   // edge case: keep anchor exact (transparency over fan-out)
  }
  u.modelPos=out;
  recenterToken(u);
}
/* Authority inversion (Pass 4): modelPos is now the canonical store; the token hx/hy is a DERIVED
   centroid of modelPos. recenterToken() recomputes the token from the model positions — called at the
   end of syncModelPos and after any per-model move. Because syncModelPos still builds a symmetric
   cluster around the requested anchor, the recomputed centroid equals what callers set, so all existing
   behaviour is byte-identical (proven by the oracle). The win: per-model writes (moveModel) now update
   the anchor automatically, and any future code that displaces individual models keeps the token honest. */
/* ---- FACING / HEADING math (Pass A — pure helpers, dormant) ---------------------------------------
   Headings are in degrees, 0°=+x (east), increasing clockwise on the screen's y-down grid (90°=south).
   These are pure functions used by the aircraft movement subsystem (Pass B). In Pass A they are only
   exercised by `setFacingFromMove`, which records a unit's heading as its direction of travel; nothing
   READS facing yet, so behaviour is unchanged. */
function headingDeg(fromx,fromy,tox,toy){
  return Math.atan2(toy-fromy, tox-fromx)*180/Math.PI;   // [-180,180]
}
function normDeg(a){ a%=360; if(a>180)a-=360; if(a<-180)a+=360; return a; }
function pivotDiff(a,b){ return Math.abs(normDeg(b-a)); }   // smallest angle between two headings, [0,180]
// Is target point within the forward arc (±arcDeg of facing) of a unit at its anchor? (read by Pass B/C)
function withinArc(u,tx,ty,arcDeg){
  if(u.facing==null)return true;                            // no facing tracked -> unconstrained
  const a=unitAnchor(u);
  return pivotDiff(u.facing, headingDeg(a.hx,a.hy,tx,ty)) <= arcDeg;
}
// Record heading from a just-completed move (called at every move commit in Pass A; harmless until read).
function setFacingFromMove(u,fromx,fromy,tox,toy){
  if(fromx===tox&&fromy===toy)return;                       // no displacement -> keep prior heading
  u.facing=headingDeg(fromx,fromy,tox,toy);
}
function recenterToken(u){
  if(!u||!u.modelPos||!u.modelPos.length)return;
  let sx=0,sy=0;for(const p of u.modelPos){sx+=p.hx;sy+=p.hy;}
  // round to the nearest cell so the token stays a valid grid coordinate (consumers measure via unitAnchor,
  // which uses the exact float centroid; the rounded token is for legacy raw reads and rendering).
  u.hx=Math.round(sx/u.modelPos.length);
  u.hy=Math.round(sy/u.modelPos.length);
}
// Move a single model (by index) to a new cell, then re-derive the token. The primitive the capability
// layer (coherency, multi-target melee, spreading) will build on. No-op if index/unit invalid.
function moveModel(u,i,hx,hy){
  if(!u||!u.modelPos||i<0||i>=u.modelPos.length)return;
  u.modelPos[i]={hx:clamp(hx,0,GW-1),hy:clamp(hy,0,GH-1)};
  recenterToken(u);
}
/* ---- Unit Coherency (capability layer) -------------------------------------------------------
   Core Rules: a unit of 2-6 models must have every model within 2" of at least ONE other model;
   a unit of 7+ models within 2" of at least TWO others. On this board 1 cell = 2" (HEX_INCH), and
   syncModelPos fans models out to a ~2-cell radius, so "within coherency" is modelled as a
   connectivity test with COH_CELLS=2 (a model is "linked" to another within 2 cells). A unit is
   coherent if every model has the required number of links AND the whole unit forms one connected
   group. A freshly-synced symmetric cluster always passes (so existing behaviour is unchanged and
   the oracle stays green); incoherency only arises once individual models are moved apart by the
   capability layer — which is exactly when the rule should bite.                                   */
const COH_CELLS=Math.round(2/HEX_INCH);   // 2 physical inches of coherency, in cells (scales with resolution)
function _linkCount(modelPos,i){
  let n=0;const a=modelPos[i];
  for(let j=0;j<modelPos.length;j++){if(j===i)continue;
    if(Math.max(Math.abs(modelPos[j].hx-a.hx),Math.abs(modelPos[j].hy-a.hy))<=COH_CELLS)n++;}
  return n;
}
function inCoherency(u){
  if(!u||!u.modelPos||u.modelPos.length<=1)return true;
  const need=u.modelPos.length>=7?2:1;
  // every model must have >= need links
  for(let i=0;i<u.modelPos.length;i++){if(_linkCount(u.modelPos,i)<need)return false;}
  // and the unit must form a single connected group (flood fill via the link graph)
  const seen=new Array(u.modelPos.length).fill(false);const stack=[0];seen[0]=true;let count=1;
  while(stack.length){const i=stack.pop();const a=u.modelPos[i];
    for(let j=0;j<u.modelPos.length;j++){if(seen[j])continue;
      if(Math.max(Math.abs(u.modelPos[j].hx-a.hx),Math.abs(u.modelPos[j].hy-a.hy))<=COH_CELLS){seen[j]=true;count++;stack.push(j);}}}
  return count===u.modelPos.length;
}
// End-of-turn coherency: remove stranded models one at a time until the unit is coherent again.
// Per the rules these count as destroyed but trigger NO on-death rules — so we shrink modelPos and
// the model count directly, without invoking the death-trigger chain. Returns models removed.
function enforceCoherency(u){
  if(!u||u.dead||!u.modelPos||u.modelPos.length<=1)return 0;
  let removed=0,guard=0;
  while(!inCoherency(u)&&u.modelPos.length>1&&guard++<50){
    // remove the most-isolated model (fewest links; ties -> farthest from centroid)
    const c=unitAnchor(u);let worst=0,wScore=1e9;
    for(let i=0;i<u.modelPos.length;i++){
      const links=_linkCount(u.modelPos,i);
      const dc=Math.hypot(u.modelPos[i].hx-c.hx,u.modelPos[i].hy-c.hy);
      const score=links*1000-dc;            // fewest links first, then farthest
      if(score<wScore){wScore=score;worst=i;}
    }
    u.modelPos.splice(worst,1);
    u.models=Math.max(0,u.models-1);
    if(u.models<=0){u.dead=true;u.woundsLeft=0;break;}
    removed++;
    recenterToken(u);
  }
  return removed;
}
// Multi-target melee (capability layer): partition the attacking unit's MODELS by which enemy unit each
// model is individually engaged with, using per-model positions. Returns [{enemy, nModels}], so a unit
// straddling two enemies splits its attacks between them (Core Rules: models in a unit may attack different
// targets). A model engaged with several enemies is assigned to its closest; a model engaged with none
// (while the unit is engaged overall) falls back to the unit's closest enemy, so no attacks are lost.
function meleeTargetSplit(u){
  const hasPos=u.modelPos&&u.modelPos.length===Math.max(1,u.models);
  // An enemy is a valid melee target if the unit is engaged with it. With per-model positions, "engaged"
  // means ANY model is within reach of that enemy (the centroid alone can be out of reach while edge
  // models are adjacent — exactly the multi-target case). Without positions, fall back to unit-level engaged().
  const foeReach=(mp,e)=>{const ea=unitAnchor(e);if(segBlocked(mp.hx,mp.hy,ea.hx,ea.hy))return false;
    const reach=ENGAGE_IN+(pathThroughOpenHatch({hx:mp.hx,hy:mp.hy},e)?1.3:0);return rawDist(mp,ea)<=reach;};
  let foes;
  // AIRCRAFT melee rules: an AIRCRAFT can only make melee attacks against units that can FLY; and only
  // units that can FLY can make melee attacks against AIRCRAFT. So a (u,e) melee pairing is legal unless
  // one side is an aircraft and the other cannot FLY.
  const meleeLegal=e=>{
    if(isAircraft(u) && !unitCanFly(e))return false;   // aircraft attacker may only hit FLY
    if(isAircraft(e) && !unitCanFly(u))return false;   // non-FLY may not hit aircraft
    return true;
  };
  if(hasPos){
    foes=units.filter(e=>!e.dead&&e.player!==u.player&&meleeLegal(e)&&u.modelPos.some(mp=>foeReach(mp,e)));
  }else{
    foes=units.filter(e=>!e.dead&&e.player!==u.player&&meleeLegal(e)&&engaged(u,e));
  }
  if(!foes.length)return [];
  const anchorClosest=()=>{let best=foes[0],bd=1e9;for(const e of foes){const d=dist(u,e);if(d<bd){bd=d;best=e;}}return best;};
  if(!hasPos){
    return [{enemy:anchorClosest(), nModels:u.models}];
  }
  const counts=new Map();
  const add=e=>{const c=counts.get(e.id)||{enemy:e,nModels:0};c.nModels++;counts.set(e.id,c);};
  for(const mp of u.modelPos){
    let chosen=null,cd=1e9;
    for(const e of foes){
      const ea=unitAnchor(e);
      if(segBlocked(mp.hx,mp.hy,ea.hx,ea.hy))continue;
      const reach=ENGAGE_IN+(pathThroughOpenHatch({hx:mp.hx,hy:mp.hy},e)?1.3:0);
      const d=rawDist(mp,ea);
      if(d<=reach&&d<cd){cd=d;chosen=e;}
    }
    add(chosen||anchorClosest());
  }
  return [...counts.values()];
}
function maxWounds(u){return u.maxModels*u.w;}
function belowHalf(u){return totalWounds(u)<=maxWounds(u)/2;}

function buildBattle(){
  refreshPlayerNames();
  const M=MODES[mode];
  if(mode==='sandbox'){GW=clamp(Math.round(customW*_RES),Math.round(12*_RES),Math.round(40*_RES));GH=clamp(Math.round(customH*_RES),Math.round(10*_RES),Math.round(34*_RES));}
  else{[GW,GH]=M.grid;}
  CELL=Math.floor(Math.min(760/GW,660/GH));CELL=clamp(CELL,16,34);
  cv.width=GW*CELL;cv.height=GH*CELL;
  units=[];objectives=[];walls=[];hatchways=[];
  vp={1:0,2:0};cp={1:1,2:1};round=1;turn=1;phaseIdx=0;selId=null;action=null;
  phaseDone=[false,false,false,false,false];
  activeDoctrine={1:null,2:null};usedDoctrines={1:[],2:[]};unitDoctrine={};
  oathTarget={1:null,2:null};firstCoyActive={1:false,2:false};sagaDone={1:false,2:false};pendingStrat=null;pendingGate=null;
  waaaghCalled={1:false,2:false};waaaghActive={1:false,2:false};waaaghTurnLeft={1:0,2:0};
  shadowUsed={1:false,2:false};synapticImp={1:null,2:null};
  spotted={1:[],2:[]};spottedML={1:[],2:[]};battleFocus={1:0,2:0};resurgence={1:0,2:0};
  painTokens={1:0,2:0};empowered={1:[],2:[]};
  yieldPoints={1:0,2:0};votannStance={1:'hostile',2:'hostile'};assailed={1:[],2:[]};pinned=[];
  pactPoints={1:0,2:0};ecPledge={1:0,2:0};ecKills={1:0,2:0};ecPledged={1:false,2:false};favouredChampions={1:null,2:null};
  miracleDice={1:[],2:[]};sororVow={1:null,2:null};sororRighteous={1:[],2:[]};sororUseMiracleBshock={1:false,2:false};
  unitOrders={1:{},2:{}};ordersIssued={1:0,2:0};
  khorneBlessings={1:[],2:[]};khorneDice={1:null,2:null};khorneRolled={1:false,2:false};
  dgPlague={1:null,2:null};dgAfflictExtra={1:[],2:[]};
  fluxTokens={1:0,2:0};shadowCorrupt={1:[],2:[]};
  ritualTargets={1:{},2:{}};ritualsAttempted={1:[],2:[]};kindredTSon={1:null,2:null};
  dreadActive={1:[],2:[]};dreadRolledRound={1:0,2:0};
  darkPact={1:false,2:false};bileAugments={1:[],2:[]};

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
function dist(a,b){return rawDist(unitAnchor(a),unitAnchor(b));}
function visible(a,b){const A=unitAnchor(a),B=unitAnchor(b);return !segBlocked(A.hx,A.hy,B.hx,B.hy);}
/* Walkable path cost between two cells, routing AROUND walls (BFS over the cell grid, 8-connected; a step
   is allowed only if the segment between adjacent cell centres is not wall-blocked). Returns the shortest
   path length in inches, or Infinity if unreachable within the search bound. Used so that ground moves pay
   the longer go-around distance instead of being hard-blocked by a wall. Bounded by maxCells for cost. */
function pathCostCells(ax,ay,bx,by,maxCells){
  if(ax===bx&&ay===by)return 0;
  maxCells=maxCells||40;
  const key=(x,y)=>x+','+y;
  const start=key(ax,ay), goal=key(bx,by);
  // Dijkstra-lite: diagonal step costs sqrt2, orthogonal 1; cap explored radius for performance.
  const distMap=new Map([[start,0]]);
  const pq=[{x:ax,y:ay,g:0}];
  while(pq.length){
    pq.sort((p,q)=>p.g-q.g); const cur=pq.shift();
    if(cur.x===bx&&cur.y===by)return cur.g;
    if(cur.g>maxCells)continue;
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){
      if(!dx&&!dy)continue; const nx=cur.x+dx,ny=cur.y+dy;
      if(nx<0||ny<0||nx>=GW||ny>=GH)continue;
      if(segBlocked(cur.x,cur.y,nx,ny))continue;            // wall between the two cells -> cannot step
      // a diagonal step must not cut through a wall corner: the two orthogonal "corner" cells it passes
      // between must both be reachable without crossing a wall (checked from both endpoints).
      if(dx&&dy&&(segBlocked(cur.x,cur.y,cur.x+dx,cur.y)||segBlocked(cur.x,cur.y,cur.x,cur.y+dy)
                 ||segBlocked(nx,ny,nx-dx,ny)||segBlocked(nx,ny,nx,ny-dy)))continue;
      const step=(dx&&dy)?Math.SQRT2:1; const ng=cur.g+step;
      const k=key(nx,ny);
      if(ng<(distMap.has(k)?distMap.get(k):Infinity)){ distMap.set(k,ng); pq.push({x:nx,y:ny,g:ng}); }
    }
  }
  return distMap.has(goal)?distMap.get(goal):Infinity;
}
// Path distance in INCHES (Infinity if unreachable). Aircraft ignore this (they fly straight over terrain).
function pathInches(ax,ay,bx,by,maxInch){
  if(!walls.length)return Math.hypot(ax-bx,ay-by)*HEX_INCH;   // no walls -> straight line (unchanged behaviour)
  const cells=pathCostCells(ax,ay,bx,by,Math.ceil((maxInch||40)/HEX_INCH)+4);
  return cells*HEX_INCH;
}
function pathThroughOpenHatch(a,b){
  const aa=unitAnchor(a),bb=unitAnchor(b);
  const A=cellCenter(aa.hx,aa.hy),B=cellCenter(bb.hx,bb.hy);
  for(const w of hatchways){if(!w.open)continue;const s=wallSeg(w);if(segInt(A.x,A.y,B.x,B.y,s[0],s[1],s[2],s[3]))return true;}
  return false;
}
const ENGAGE_IN=2.9;   // base-to-base reach: adjacent cells (orthogonal/diagonal)
function engaged(a,b){
  const A=unitAnchor(a),B=unitAnchor(b);
  if(segBlocked(A.hx,A.hy,B.hx,B.hy))return false;
  const d=rawDist(A,B);
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
    const wx=w.type==='v'?w.x:w.x+0.5,wy=w.type==='v'?w.y+0.5:w.y;const da=unitAnchor(def);return Math.hypot(wx-da.hx,wy-da.hy)<=1.2;});}
  const da2=unitAnchor(def);return objectives.some(o=>Math.hypot(o.hx-da2.hx,o.hy-da2.hy)<=1.5);
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
  let perModel=weapon.a + (isMelee&&mods?mods.plusAttacksMelee:0) + (!isMelee&&mods?(mods.plusAttacksRanged||0):0);
  if(ab.rapidfire&&weapon.type==="R"&&dist(att,def)<=weapon.rng/2)perModel+=ab.rapidfire;
  if(perModel<1)perModel=1;
  let attacks=perModel*nModels;
  // [BLAST]: +1 attack for every 5 models in the target unit (rounding down), per the Core Rules.
  if(ab.blast&&weapon.type==="R"){attacks+=Math.floor((def.models||1)/5)*nModels;}
  const wStr=Math.max(1, weapon.s + (mods?(isMelee?mods.plusStrMelee:mods.plusStrRanged):0) - (mods?mods.subIncomingStr:0));
  const wAp=weapon.ap - (mods?(isMelee?mods.plusApMelee:mods.plusApRanged):0); // ap stored negative; subtract to improve
  // ignoreMods (e.g. "ignore modifiers to Hit") cancels NEGATIVE hit modifiers against this attacker
  let hitAdd=mods?(mods.ignoreMods?Math.max(0,mods.addHit):mods.addHit):0;
  // [HEAVY]: +1 to Hit if the bearer's unit Remained Stationary this turn (ranged only).
  if(ab.heavy&&weapon.type==="R"&&!att.moved&&!att.advanced&&!att.fellback)hitAdd+=1;
  // [INDIRECT FIRE]: if no model in the target is visible, the attack may still be made at -1 to Hit
  // (and the target gains cover — handled below). Applied only when the attacker has no line of sight.
  let indirectNoLoS=false;
  if(ab.indirect&&weapon.type==="R"&&typeof visible==='function'&&!visible(att,def)){hitAdd-=1;indirectNoLoS=true;}
  const skill=clamp(weapon.skill - hitAdd,2,6);
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
  // Death Guard Nurgle's Gift: an Afflicted enemy has -1 Toughness vs Death Guard attacks
  let effT=def.t;
  if(isDeathGuardArmy(att.player)&&unitAfflictedBy(def,att.player))effT=Math.max(1,effT-1);
  let wt=woundTarget(wStr,effT);
  // wound roll modifier (ignoreMods cancels negative wound modifiers against this attacker)
  const woundMod=mods?(mods.ignoreMods?Math.max(0,mods.addWound):(mods.addWound - mods.subIncomingWound)):0;
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
  if(indirectNoLoS)cover=true;                    // [INDIRECT FIRE] with no line of sight: target gains Benefit of Cover
  if(mods&&mods.ignoresCover)cover=false;
  if(mods&&mods.grantCoverDef&&weapon.type==='R')cover=true;
  let apEff=-wAp;                                  // positive number = penalty to save
  if(mods)apEff=Math.max(0,apEff-mods.worsenIncomingAP*0)+0; // (incoming AP worsen handled below for defender)
  // defender AP worsening (Armour of Contempt etc.) reduces attacker AP
  let apPenalty=-wAp - (mods?mods.worsenIncomingAP:0);
  const dgSaveWorsen=mods?(mods.worsenSave||0):0;   // save modifier: + worsens (Death Guard Ague), − improves (AM Take Cover! / Masters of Camouflage)
  let effSv=def.sv+dgSaveWorsen;
  if(dgSaveWorsen<0&&effSv<3)effSv=3;               // improving Save cannot go better than 3+
  const useInv=def.inv>0 && def.inv < (effSv+apPenalty+(cover&&!(def.sv<=3&&wAp===0)?1:0));
  const invUsed=mods&&mods.defInvuln?Math.min(def.inv||7,mods.defInvuln):def.inv;
  for(let i=0;i<normalWounds;i++){let r=d6();let need;
    if(useInv)need=invUsed||def.inv;
    else{let mod=apPenalty;if(cover&&!(def.sv<=3&&wAp===0))mod+=1;need=effSv-mod;}
    const saved=(r>=need)&&r!==1;saveDice.push({v:r,fail:true,ok:saved,bad:!saved});if(!saved)failed++;}
  if(!silent){logDice(saveDice);let sm=`&nbsp;&nbsp;Saves: <span class="save">${normalWounds-failed} saved</span>`;
    if(cover)sm+=` (cover)`;if(useInv)sm+=` (invuln ${invUsed||def.inv}+)`;log("",sm);}
  let perHit=weapon.d - (mods?mods.reduceIncomingDmg:0);if(perHit<1)perHit=1;
  // [MELTA X]: +X Damage when targeting a unit within half range (ranged only).
  if(ab.melta&&weapon.type==="R"&&dist(att,def)<=weapon.rng/2)perHit+=ab.melta;
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
  if(u.modelPos)syncModelPos(u);
  if(silent)return;
  if(u.dead){if(u._embarked||isTransport(u)){const pax=units.filter(z=>!z.dead&&z._embarkedIn===u.id);if(pax.length)destroyedTransportDisembark(u);}log("kill",`&nbsp;&nbsp;☠ ${u.name} DESTROYED!`);cultAmbushResurrect(u);painOnEnemyDeath(u);ypOnEnemyDeath(u);ecOnEnemyDeath(u,units.find(x=>x.id===selId&&x.player!==u.player&&!x.dead));miracleOnDeath(u);}
  else if(lost>0)log("",`&nbsp;&nbsp;${u.name} −<span class="kill">${lost}</span>W${fnp?' (after FNP '+fnp+'+)':''} · ${u.models} model(s) left.`);
  else log("miss",`&nbsp;&nbsp;${u.name} unharmed.`);
}
function dmgChunk(u,dmg,spill){let rem=dmg;
  while(rem>0&&!u.dead){
    if(rem>=u.woundsLeft){rem-=u.woundsLeft;u.models--;if(u.models<=0){u.models=0;u.woundsLeft=0;u.dead=true;break;}u.woundsLeft=u.w;if(!spill)break;}
    else{u.woundsLeft-=rem;rem=0;}
  }
}
// Mortal wounds: spill across the whole unit, then handle Cult Ambush resurrection if it dies.
function applyMortals(u,n){
  if(!u||u.dead||n<=0)return;
  dmgChunk(u,n,true);
  if(u.modelPos)syncModelPos(u);
  if(u.dead){if(u._embarked||isTransport(u)){const pax=units.filter(z=>!z.dead&&z._embarkedIn===u.id);if(pax.length)destroyedTransportDisembark(u);}log("kill",`&nbsp;&nbsp;☠ ${u.name} DESTROYED!`);cultAmbushResurrect(u);painOnEnemyDeath(u);ypOnEnemyDeath(u);ecOnEnemyDeath(u,units.find(x=>x.id===selId&&x.player!==u.player&&!x.dead));miracleOnDeath(u);}
}
/* Reanimation Protocols: heal up to `wounds` across the unit.
   First tops up the current wounded model, then returns destroyed models at 1W,
   then heals the returned model. A wholly-destroyed unit (dead) is not revived. */
function reanimateUnit(u,wounds,silent){
  if(!u||u.dead||wounds<=0)return 0;
  let healed=0;
  for(let i=0;i<wounds;i++){
    if(u.woundsLeft<u.w){u.woundsLeft++;healed++;}              // top up current model
    else if(u.models<u.maxModels){u.models++;u.woundsLeft=1;healed++;} // return a destroyed model at 1W
    else break;                                                  // at full strength
  }
  if(healed&&!silent)log("sys",`&nbsp;&nbsp;♻ ${u.name} reanimates <span class="save">${healed}</span>W → ${u.models}/${u.maxModels} models.`);
  return healed;
}
function d3(){return (Math.floor(Math.random()*3))+1;}
function necronLeaderBonus(u){
  // +1 reanimation if a NECRONS CHARACTER leads (modeled: a friendly CHARACTER unit within 3")
  return units.some(o=>o.player===u.player&&!o.dead&&o!==u&&unitHasKw(o,'CHARACTER')&&unitHasKw(o,'NECRONS')&&dist(o,u)<=3)?1:0;
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
  if(ph==="Movement"){units.forEach(u=>{if(u.player===turn){u.moved=false;u.advanced=false;u.fellback=false;u._bfMove=0;u._bfAssault=false;u._bfSudden=false;u._disembarkedThisTurn=false;u._noChargeThisTurn=false;}});beginReinforcements(turn);}
  if(ph==="Shooting"){units.forEach(u=>{if(u.player===turn)u.shotWith=[];});spotted[turn]=[];spottedML[turn]=[];ritualTargets[turn]={};ritualsAttempted[turn]=[];}
  darkPact={1:false,2:false};   // Dark Pact lasts only the phase in which it is invoked
  empowered={1:[],2:[]};        // Empowered (Drukhari Pain abilities) lasts only the phase
  if(ph==="Charge")units.forEach(u=>{if(u.player===turn)u.charged=false;});
  if(ph==="Fight")units.forEach(u=>u.fought=false);
  updateHint();renderPhases();renderAll();render();renderStratPanel();
}
function doCommandPhase(){
  log("hd",`◆ R${round} · ${PNAME[turn].toUpperCase()} · COMMAND`);
  units.forEach(u=>{if(u.player===turn){u._setupThisTurn=false;u._ritualThisTurn=false;}});   // arrival + ritual flags last only the turn
  // Orks: a Waaagh! lasts until the start of this player's NEXT Command phase, then expires
  if(waaaghActive[turn]){waaaghTurnLeft[turn]--;if(waaaghTurnLeft[turn]<=0){waaaghActive[turn]=false;log("sys",`The Waaagh! subsides for ${PNAME[turn]}.`);}}
  // Tyranids (Synaptic Nexus): a Synaptic Imperative lasts the battle round; clear it so it can be re-picked
  if(isTyranidArmy(turn))synapticImp[turn]=null;
  if(isThousandSonsArmy(turn))kindredTSon[turn]=null;   // Grand Coven Kindred Sorcery: re-pickable each round
  if(isSororitasArmy(turn)){sororRighteous[turn]=[];}  // Righteous lasts until this player's next Command phase, then is re-picked
  if(isAstraArmy(turn)){clearOrders(turn);autoIssueOrders(turn);}  // Voice of Command: last round's Orders expire; officers issue new ones (auto in headless/AI; interactive via panel)
  cp[turn]+=1;log("sys",`+1 CP → ${cp[turn]} CP.`);
  // Drukhari Power from Pain: +1 Pain token at the start of each Command phase
  if(isDrukhariArmy(turn))gainPain(turn,1,'Command phase');
  // Tzeentch Fates in Flux: in your Command phase, if the opponent has any Flux tokens, you gain one
  if(isScintillatingLegion(turn)){const ep=turn===1?2:1;if(fluxTokens[ep]>0){fluxTokens[turn]++;fluxTokens[ep]--;log("sys",`Fates in Flux: ${PNAME[turn]} draws a Flux token from the opponent (${fluxTokens[turn]} held).`);}}
  units.filter(u=>u.player===turn&&!u.dead&&belowHalf(u)).forEach(u=>{
    let r,syn=isTyranidArmy(turn)&&unitInSynapse(u);
    if(syn){const a=d6(),b=d6(),c=d6();r=a+b+c-Math.min(a,b,c);}  // 3D6 keep highest 2 (Synapse)
    else r=d6()+d6();
    // Adepta Sororitas Acts of Faith: substitute one die of the 2D6 Battle-shock test with a Miracle dice (if armed).
    let miracleSub=null;
    if(isSororitasArmy(turn)&&sororUseMiracleBshock[turn]&&miracleDice[turn].length){
      const md=spendBestMiracle(turn);if(md!=null){r=md+d6();miracleSub=md;}
    }
    // Chaos Daemons: Daemonic Manifestation (+1 in own Shadow); Daemonic Terror (-1 from enemy Shadow / Greater Daemon)
    const ep=turn===1?2:1;
    let mod=0,manifest=false,terror=false;
    if(isDaemonsArmy(turn)&&unitInShadow(u,turn)){mod+=1;manifest=true;}
    if(isDaemonsArmy(ep)&&(unitInShadow(u,ep)||nearGreaterDaemon(u,ep))){mod-=1;terror=true;}
    // Heretic Astartes terror detachments (Dread Talons / Nightmare Hunt): -1 to the test when within 12" of an HA unit
    if(haTerrorActive(ep)&&units.some(o=>o.player===ep&&!o.dead&&o.deployed&&!o.inReserve&&unitHasKw(o,'HERETIC ASTARTES')&&dist(o,u)<=6)){mod-=1;}
    // Chaos Knights Harbingers of Dread: Deathly Terror / Despair worsen the enemy's Leadership (higher LD = harder)
    const ldPen=dreadLdPenalty(u,ep);
    const effLd=u.ld+ldPen-(u._orderLd||0);   // Astra Militarum Duty and Honour!: +1 Ld → lower target number
    r+=mod;
    const pass=r>=effLd;
    log("",`Battle-shock ${u.name}: <b>${r}</b> vs LD${effLd}${syn?' (Synapse 3D6)':''}${miracleSub!=null?` (Miracle ${miracleSub}+D6)`:''}${mod?` (${mod>0?'+':''}${mod} Shadow)`:''}${ldPen?` (+${ldPen} Dread)`:''} — ${pass?'<span class="save">PASS</span>':'<span class="kill">FAIL · shocked</span>'}`);
    u.bshock=!pass;
    if(u.bshock&&isAstraArmy(u.player)&&unitOrders[u.player][u.id]){delete unitOrders[u.player][u.id];u._orderMove=0;u._orderOc=0;u._orderLd=0;log("sys",`&nbsp;&nbsp;${u.name} is Battle-shocked — its Order ceases.`);}
    if(!pass&&isDrukhariArmy(ep))gainPain(ep,1,'enemy failed Battle-shock');  // Power from Pain: +1 when an enemy fails Battle-shock
    if(manifest&&pass){const h=reanimateUnit(u,d3());if(h)log("sys",`&nbsp;&nbsp;Daemonic Manifestation: ${u.name} reknits ${h}W.`);}
    if(terror&&!pass){const mw=d3();applyMortals(u,mw);log("kill",`&nbsp;&nbsp;Daemonic Terror: ${u.name} suffers ${mw} mortal wound(s).`);}
    // Chaos Knights Delirium: a below-half enemy near a Chaos Knight that fails Battle-shock suffers D3 mortal wounds
    if(!pass&&isChaosKnightsArmy(ep)&&dreadHas(ep,'delirium')&&belowHalf(u)){
      const R=dreadAuraRange(ep);
      if(units.some(o=>o.player===ep&&!o.dead&&o.deployed&&!o.inReserve&&unitHasKw(o,'CHAOS KNIGHTS')&&dist(o,u)<=R)){
        const mw=d3();applyMortals(u,mw);log("kill",`&nbsp;&nbsp;Delirium: ${u.name} suffers ${mw} mortal wound(s).`);
      }
    }
  });
  units.filter(u=>u.player===turn&&!belowHalf(u)).forEach(u=>u.bshock=false);
  if(isSororitasArmy(turn))sororUseMiracleBshock[turn]=false;  // Acts of Faith arm is consumed once this phase's Battle-shock tests are done
  // Reanimation Protocols: NECRONS units heal D3 wounds at end of Command phase
  const ar=armyRuleOf(turn);
  if(ar&&/reanimation/i.test(ar.name)){
    units.filter(u=>u.player===turn&&!u.dead&&unitHasKw(u,'NECRONS')).forEach(u=>{
      const n=d3()+necronLeaderBonus(u);reanimateUnit(u,n);});
  }
  // Feed the Swarm (Assimilation Swarm): each HARVESTER heals a friendly TYRANIDS unit within 6"
  if(isTyranidArmy(turn)&&/feed the swarm/i.test((detachOf(turn)?.rule?.name)||'')){
    const harvesters=units.filter(u=>u.player===turn&&!u.dead&&unitHasKw(u,'HARVESTER'));
    harvesters.forEach(h=>{
      const tgt=units.find(u=>u.player===turn&&!u.dead&&dist(u,h)<=6&&totalWounds(u)<maxWounds(u));
      if(tgt)reanimateUnit(tgt,d3()+1);
    });
  }
  // Leagues of Votann (Prioritised Efficiency): at end of Command phase, gain YP from objective control, then re-evaluate stance.
  if(isVotannArmy(turn))votannCommandYield(turn);
  phaseDone[0]=true;
  // prompt Oath of Moment + doctrine selection for the active player
  promptCommandChoices();
  renderAll();
}
function promptCommandChoices(){
  const ar=armyRuleOf(turn);
  const det=detachOf(turn);
  // Oath of Moment (or any army rule that needs an enemy target). Vows/Litanies don't pick an enemy.
  if(ar&&/oath/i.test(ar.name)){
    const enemies=units.filter(u=>u.player!==turn&&!u.dead);
    if(enemies.length){action={kind:'oath'};showActionPanel(true);renderAction();return;}
  }
  maybePromptDoctrine();
}
function doctrineSource(p){
  // returns the list + label for selectable command states: detachment doctrines, OR a Vow/Litany army rule
  const det=detachOf(p);
  if(det&&det.doctrines&&det.doctrines.length)return {list:det.doctrines,label:det.doctrineLabel||'Doctrine',once:!!det.doctrineOncePerBattle};
  const ar=armyRuleOf(p);
  if(ar&&ar.choices&&ar.choices.length)return {list:ar.choices,label:ar.choiceLabel||'Vow',once:!!ar.oncePerBattle};
  return null;
}
function maybePromptDoctrine(){
  const src=doctrineSource(turn);
  if(!src){action=null;showActionPanel(false);return;}
  // once-per-battle states (Vows): if already chosen, don't re-prompt
  if(src.once && activeDoctrine[turn]){action=null;showActionPanel(false);return;}
  action={kind:'doctrine'};showActionPanel(true);renderAction();
}
function promptDoctrine(){maybePromptDoctrine();}
function chooseDoctrine(id){
  activeDoctrine[turn]=id;
  if(!usedDoctrines[turn].includes(id))usedDoctrines[turn].push(id);
  const src=doctrineSource(turn);const doc=src&&src.list.find(d=>d.id===id);
  log("sys",`${src?src.label:'Doctrine'} active: ${doc?doc.name:id}.`);
  action=null;showActionPanel(false);renderAll();render();renderStratPanel();updateHint();
}
function chooseOath(eid){
  oathTarget[turn]=eid;const e=units.find(u=>u.id===eid);
  log("sys",`Oath of Moment → ${e?e.name:'target'}.`);
  maybePromptDoctrine();
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
      if(fx.k==='reanimate'){const n=d3()+(fx.bonus||0)+necronLeaderBonus(unit);reanimateUnit(unit,n);}
      if(fx.k==='selfBattleshock'){unit.bshock=true;log("kill",`&nbsp;&nbsp;${unit.name} gives in to the Red Thirst — now Battle-shocked.`);}
      if(fx.k==='toReserves')reserveUnit(unit);
      if(fx.k==='grantDeepStrike'){unit._grantDeepStrike=true;log("sys",`&nbsp;&nbsp;${unit.name} gains Deep Strike.`);}
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
  const dStraight=Math.hypot(u.hx-hx,u.hy-hy)*HEX_INCH;
  let d=dStraight;   // aircraft fly straight over terrain; ground units use a wall-aware path distance (below)
  // ---- AIRCRAFT movement (facing-constrained) ----------------------------------------------------
  // Only a Normal move; must travel a minimum of 20" straight forward, then pivot up to 90° (modelled as:
  // the destination must lie within the forward ±90° arc of current heading, since reaching a point behind
  // would require a turn >90° before moving). Cannot Advance/Fall Back/Remain Stationary. If it cannot make
  // a legal >=20" move (or none is offered), the aircraft is placed into Strategic Reserves and returns next turn.
  if(isAircraft(u)){
    if(d<AIRCRAFT_MIN_MOVE){updateHint(`Aircraft must move at least ${AIRCRAFT_MIN_MOVE}″ straight forward.`);return;}
    if(u.facing!=null && !withinArc(u,hx,hy,90)){updateHint("Aircraft can pivot at most 90° — that heading is behind it.");return;}
    const wouldERa=units.some(e=>!e.dead&&e.player!==u.player&&Math.hypot(e.hx-hx,e.hy-hy)*HEX_INCH<=ENGAGE_IN&&!segBlocked(e.hx,e.hy,hx,hy));
    if(wouldERa){updateHint("Cannot end on top of / within Engagement Range of a model.");return;}
    const _fx=u.hx,_fy=u.hy;u.hx=hx;u.hy=hy;u.moved=true;syncModelPos(u);setFacingFromMove(u,_fx,_fy,hx,hy);
    log("sys",`${u.name} (Aircraft) makes a ${d.toFixed(1)}″ pass.`);
    render();renderAll();updateHint();return;
  }
  // Ground move: route around walls. Path distance costs the longer go-around; unreachable -> blocked.
  const eMcap=u.m+(u._bfMove||0)+(u._orderMove||0)+6;   // generous cap for the path search (Move + max Advance)
  d=pathInches(u.hx,u.hy,hx,hy,eMcap);
  if(!isFinite(d)){updateHint("No path — a wall or closed hatchway blocks every route there.");return;}
  const eM=u.m+(u._bfMove||0)+(u._orderMove||0);   // effective Move incl. Battle Focus + AM Move! Move! Move! Order
  const startER=inER(u);
  const wouldER=units.some(e=>!e.dead&&e.player!==u.player&&Math.hypot(e.hx-hx,e.hy-hy)*HEX_INCH<=ENGAGE_IN&&!segBlocked(e.hx,e.hy,hx,hy));
  if(startER){
    if(d<=eM&&!wouldER){const _fx=u.hx,_fy=u.hy;u.hx=hx;u.hy=hy;u.fellback=true;u.moved=true;syncModelPos(u);setFacingFromMove(u,_fx,_fy,hx,hy);log("sys",`${u.name} Falls Back ${d.toFixed(1)}″.`);
      if(u.bshock){const r=d6();if(r<=2){u.models=Math.max(0,u.models-1);log("kill","&nbsp;&nbsp;Desperate Escape: 1 model lost.");}}}
    else{updateHint("In Engagement Range — Fall Back clear of the enemy, or stay.");return;}
  }else if(d<=eM&&!wouldER){const _fx=u.hx,_fy=u.hy;u.hx=hx;u.hy=hy;u.moved=true;syncModelPos(u);setFacingFromMove(u,_fx,_fy,hx,hy);log("sys",`${u.name} Normal move ${d.toFixed(1)}″.`);}
  else if(!wouldER){
    // needs an Advance — set up an interactive roll
    if(d>eM+6){updateHint(`Too far even with a max Advance (need ${d.toFixed(1)}″, max ${eM+6}″).`);return;}
    action={kind:'advance',u,hx,hy,need:d};
    showActionPanel(true);renderAction();return;
  }else{updateHint("Cannot end within Engagement Range.");return;}
  render();renderAll();updateHint();
}
function rollAdvance(){
  const a=action;const adv=d6();const tot=a.u.m+(a.u._bfMove||0)+(a.u._orderMove||0)+adv;
  log("",`${a.u.name} Advance: rolled <b>${adv}</b> → ${tot}″ move.`);logDice([{v:adv}]);
  if(a.need<=tot){const _fx=a.u.hx,_fy=a.u.hy;a.u.hx=a.hx;a.u.hy=a.hy;a.u.moved=true;a.u.advanced=true;syncModelPos(a.u);setFacingFromMove(a.u,_fx,_fy,a.hx,a.hy);
    log("sys",`&nbsp;&nbsp;Reached destination (${a.need.toFixed(1)}″). No shooting (non-Assault) or charging.`);}
  else log("miss",`&nbsp;&nbsp;Advance fell short of ${a.need.toFixed(1)}″ — ${a.u.name} stays put.`);
  action=null;showActionPanel(false);render();renderAll();updateHint();
}

/* ---- SHOOTING: pick target + weapon, range highlighted, roll attacks ---- */
function beginShootSelection(u){
  if(u.player!==turn||u.dead){return;}
  if(PHASES[phaseIdx]!=="Shooting"){return;}
  if(u.advanced&&!u.ranged.some(w=>w.ab.assault)&&!unitHasElig(u,'eligShootAfterAdvance')){updateHint(`${u.name} Advanced and has no Assault weapons.`);return;}
  if(u.fellback&&!unitHasElig(u,'eligShootAfterFallBack')){updateHint(`${u.name} Fell Back — cannot shoot.`);return;}
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
  if(isAircraft(u)){updateHint(`${u.name} (Aircraft) cannot declare a charge.`);return;}   // AIRCRAFT cannot charge
  if((u.advanced&&!unitHasElig(u,'eligChargeAfterAdvance'))||(u.fellback&&!unitHasElig(u,'eligChargeAfterFallBack'))){updateHint(`${u.name} can't charge (Advanced/Fell Back).`);return;}
  if(u.charged){updateHint(`${u.name} already charged.`);return;}
  if(inER(u)){updateHint(`${u.name} already in combat.`);return;}
  // Only units that can FLY may select an AIRCRAFT as a charge target.
  const targets=units.filter(e=>!e.dead&&e.player!==turn&&dist(u,e)<=12&&!segBlocked(u.hx,u.hy,e.hx,e.hy)&&(!isAircraft(e)||unitCanFly(u)));
  if(!targets.length){updateHint(`No eligible enemy within 12″ of ${u.name}.`);return;}
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
  const _fx=u.hx,_fy=u.hy;u.hx=nx;u.hy=ny;syncModelPos(u);setFacingFromMove(u,_fx,_fy,nx,ny);
}

/* In-combat movement on the single-token board. The real game moves each MODEL up to 3" toward the closest
   enemy, ending in base-to-base + Unit Coherency; with one position per unit we model the NET unit-level move:
   step toward the closest target by the largest legal step within `maxInch` (Pile In / Consolidate are both 3"),
   ending in an engaging (adjacent) cell when reachable. Per-model coherency / spreading across units is not
   represented because per-model positions don't exist in this engine. Returns true if the unit actually moved.
   `closestEnemyTo(u)` — nearest living enemy by distance, ignoring AIRCRAFT unless u can FLY (matches Pile-In rules). */
function closestEnemyTo(u){
  let best=null,bd=1e9;
  units.forEach(e=>{ if(e.dead||e.player===u.player)return;
    if((e.allKw||e.kw||[]).includes('AIRCRAFT') && !(u.allKw||u.kw||[]).includes('FLY'))return;
    const d=dist(u,e); if(d<bd){bd=d;best=e;} });
  return best;
}
// Step u up to maxInch toward (tx,ty), one cell at a time, choosing the neighbour that most reduces distance,
// never stacking, never crossing blocked terrain, never leaving the board. Stops early if already adjacent to goal.
function stepToward(u,tx,ty,maxInch){
  let budget=maxInch, moved=false, guard=0;
  while(budget>0 && guard++<8){
    const here=Math.hypot(u.hx-tx,u.hy-ty);
    if(here<=1.0)break; // already in/at the goal cell (adjacent)
    let best=null,bd=here;
    for(let ox=-1;ox<=1;ox++)for(let oy=-1;oy<=1;oy++){
      if(!ox&&!oy)continue;
      const nx=u.hx+ox, ny=u.hy+oy;
      if(nx<0||ny<0||nx>=GW||ny>=GH)continue;
      const stepCost=Math.hypot(ox,oy)*HEX_INCH;          // 2" orthogonal, ~2.83" diagonal
      if(stepCost>budget+1e-6)continue;
      if(cellOccupied(nx,ny,u.id))continue;
      if(segBlocked(u.hx,u.hy,nx,ny))continue;
      const nd=Math.hypot(nx-tx,ny-ty);
      if(nd<bd-1e-6){bd=nd;best={nx,ny,cost:stepCost};}
    }
    if(!best)break;
    const _fx=u.hx,_fy=u.hy;u.hx=best.nx;u.hy=best.ny;budget-=best.cost;moved=true;syncModelPos(u);setFacingFromMove(u,_fx,_fy,best.nx,best.ny);
  }
  return moved;
}
// Pile In: 3" toward the closest enemy, only if the unit is (and stays) engaged. No move if not engaged.
function pileInMove(u){
  if(!inER(u))return false;
  const tgt=closestEnemyTo(u); if(!tgt)return false;
  const moved=stepToward(u,tgt.hx,tgt.hy,3);
  if(moved&&!inER(u)){/* never end a Pile In out of engagement */ }
  return moved;
}
// Consolidate: 3" toward the closest enemy; if none is reachable into engagement, toward the closest objective
// (ending within range of it). Lets a unit that destroyed its foe advance onto a new enemy or seize an objective.
function consolidateMove(u){
  if(u.dead)return false;
  const tgt=closestEnemyTo(u);
  if(tgt){
    const before={hx:u.hx,hy:u.hy};
    let moved=stepToward(u,tgt.hx,tgt.hy,3);
    if(moved&&inER(u))return true;            // reached/closed on an enemy — good
    if(moved&&!inER(u)){u.hx=before.hx;u.hy=before.hy;moved=false;syncModelPos(u);} // would end out of engagement via enemy path; try objective instead
    if(moved)return true;
  }
  // toward closest objective, but only finish if we end within range (≤1.5 cells), per the rules' fallback
  if(objectives.length){
    let best=null,bd=1e9; objectives.forEach(o=>{const d=Math.hypot(o.hx-u.hx,o.hy-u.hy);if(d<bd){bd=d;best=o;}});
    if(best){const before={hx:u.hx,hy:u.hy};const moved=stepToward(u,best.hx,best.hy,3);
      if(moved&&Math.hypot(u.hx-best.hx,u.hy-best.hy)<=1.5)return true;
      u.hx=before.hx;u.hy=before.hy;syncModelPos(u);} // couldn't end in range — undo
  }
  return false;
}

/* ---- FIGHT: pick an engaged unit, roll its attacks ---- */
function beginFightSelection(u){
  if(u.dead||PHASES[phaseIdx]!=="Fight")return;
  if(!inER(u)){updateHint(`${u.name} is not in Engagement Range.`);return;}
  if(u.fought){updateHint(`${u.name} already fought.`);return;}
  if(!u.melee.length){updateHint(`${u.name} has no melee weapons.`);return;}
  if(pileInMove(u))log("",`${u.name} piles in.`);          // 1. Pile In (3" toward closest enemy)
  const targets=units.filter(e=>!e.dead&&e.player!==u.player&&engaged(u,e));
  if(!targets.length)return;
  action={kind:'fight',u,targets,target:targets[0].id};selId=u.id;showActionPanel(true);renderAction();render();
}
function fightPickTarget(t){if(action&&action.kind==='fight'){action.target=t.id;renderAction();render();}}
function rollFight(){
  const a=action;const u=a.u;const tgt=units.find(x=>x.id===a.target);if(!tgt)return;
  if(u.charged)log("sys",`${u.name} (charged — fights first)`);
  resolveAttacks(u,tgt,u.melee[0],u.models,false);
  u.fought=true;
  if(!u.dead&&consolidateMove(u))log("",`${u.name} consolidates.`);   // 3. Consolidate
  scoreObjectivesLive();
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
      let ocv=(u.oc+(u._ocBonus||0)+(u._orderOc||0)+armyOcBonus(u))*(u._ocMult||1)*u.models;oc[u.player]+=ocv;});
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
  // End-of-turn Unit Coherency: the player whose turn is ending removes stranded models from their units
  // (counts as destroyed but triggers no on-death rules). Only acts on units actually out of coherency,
  // so healthy clusters are untouched.
  units.filter(u=>u.player===turn&&!u.dead&&u.deployed&&!u.inReserve).forEach(u=>{
    const r=enforceCoherency(u);
    if(r>0)log("sys",`${u.name} loses ${r} model${r>1?'s':''} to Coherency.`);
  });
  // Gate of Infinity / end-of-opponent's-Fight reserve recall, for the player whose turn is NOT ending
  maybeGateOfInfinity(turn===1?2:1);
  if(turn===1)turn=2;
  else{scoreObjectives();log("hd",`▼ END R${round} — VP ${PNAME[1]} ${vp[1]} · ${PNAME[2]} ${vp[2]}`);
    ecResolvePledge(1);ecResolvePledge(2);
    if(round>=MODES[mode].rounds){endGame();return;}
    // End-of-round-3 Reserves rule: any unit still in Strategic Reserves at the end of round 3 counts as
    // destroyed — EXCEPT units placed into Reserves after the first battle round started (_reserveRound>1).
    if(round===3){
      units.filter(u=>!u.dead&&u.inReserve&&(u._reserveRound==null||u._reserveRound<=1)).forEach(u=>{
        u.dead=true;u.models=0;u.woundsLeft=0;u.modelPos=null;
        log("sys",`${u.name} never arrived from Reserves — counts as destroyed (end of round 3).`);
      });
    }
    round++;turn=1;
    grantBattleFocus(1);grantBattleFocus(2);allianceOfAgony(1);allianceOfAgony(2);
    khorneBlessings={1:[],2:[]};khorneDice={1:null,2:null};khorneRolled={1:false,2:false};
    dgAfflictExtra={1:[],2:[]};
    // Emperor's Children (Coterie): pledge a kill-count for the new round. Interactive players set this via the panel;
    // here we auto-pledge a modest 1 so the AI/headless path resolves (the panel can raise it via Unbound Arrogance etc.).
    [1,2].forEach(pl=>{if(isCoterieArmy(pl))ecMakePledge(pl,1);});
    grantMiracleRound(1);grantMiracleRound(2);}                 // Adepta Sororitas: +1 Miracle dice at the start of each battle round
  phaseIdx=0;phaseDone=[false,false,false,false,false];beginPhase();renderAll();render();
}
function gateMaxFor(p){const sz=MODES[mode].pts; return sz>=2000?4:sz>=1000?3:2;}  // Onslaught/Strike Force/Incursion analogue
function maybeGateOfInfinity(p){
  const ar=armyRuleOf(p);
  if(!ar||!/gate of infinity/i.test(ar.name||''))return;
  // eligible: on board, not in engagement range, every model has Deep Strike (we treat GK INFANTRY/units with DS as eligible)
  const elig=units.filter(u=>u.player===p&&!u.dead&&u.deployed&&!inER(u)&&unitHasDeepStrike(u));
  if(!elig.length)return;
  const max=gateMaxFor(p);
  // auto-policy in headless/AI; interactive prompt otherwise is deferred to a button — here we log availability
  log("sys",`↯ ${PNAME[p]} may use Gate of Infinity (up to ${max} unit${max>1?'s':''} into Reserves).`);
  // expose for UI: store a pending gate so the player can action it from the panel
  pendingGate={p,max,ids:elig.map(u=>u.id)};
}
function endGame(){
  let name,color,txt;
  if(vp[1]>vp[2]){name=PNAME[1].toUpperCase();color="var(--impl)";txt=`Victory ${vp[1]}–${vp[2]} VP.`;}
  else if(vp[2]>vp[1]){name=PNAME[2].toUpperCase();color="var(--chal)";txt=`Victory ${vp[2]}–${vp[1]} VP.`;}
  else{name="STALEMATE";color="var(--gold2)";txt=`A draw at ${vp[1]}–${vp[2]}.`;}
  $('victorName').textContent=name;$('victorName').style.color=color;$('victorText').textContent=txt;
  $('modal').classList.add('on');
}

/* ---- STRATEGIC RESERVES / DEEP STRIKE ----
   A reserved unit is off-board: inReserve=true, deployed=false, hx/hy=-1.
   It is alive (dead=false) so it is not counted as destroyed, but it is excluded
   from combat, targeting and scoring because those filter on board position. */
function unitHasDeepStrike(u){
  if(u._grantDeepStrike)return true;
  return (u.abilities||[]).some(a=>/deep strike/i.test(a.name||'')) || (u.allKw||[]).includes('DEEP STRIKE');
}
function reserveUnit(u,silent){
  if(!u||u.dead||u.inReserve)return false;
  u.inReserve=true;u.deployed=false;u.hx=-1;u.hy=-1;u.modelPos=null;
  u.moved=u.advanced=u.fellback=u.charged=false;
  u._reserveRound=(typeof round==='number')?round:0;
  if(!silent)log("sys",`${u.name} removed to Strategic Reserves.`);
  return true;
}
function reservesOf(p){return units.filter(u=>!u.dead&&u.inReserve&&u.player===p);}
/* place a reserved unit on the board at hx,hy via Deep Strike (must be >9" from all enemies) */
function deepStrikePlace(u,hx,hy){
  if(!u||!u.inReserve)return false;
  if(cellOccupied(hx,hy)){updateHint("Cell occupied.");return false;}
  // >9" horizontally from every enemy model; Walls and closed Hatchways are ignored (boarding rule; no-op in open mode)
  const tooClose=units.some(e=>!e.dead&&e.player!==u.player&&e.deployed&&rawDist(unitAnchor(e),{hx,hy})<9&&!segBlocked(e.hx,e.hy,hx,hy));
  if(tooClose){updateHint("Deep Strike must be more than 9″ from all enemy units (walls/closed hatches block line ignored).");return false;}
  u.inReserve=false;u.deployed=true;u.hx=hx;u.hy=hy;syncModelPos(u);
  u._setupThisTurn=true;u.moved=true;   // arriving counts as having moved (cannot also Normal-move)
  log("sys",`${u.name} arrives from Deep Strike.`);
  // optional bonus move granted on arrival (e.g. "make a D6 move after arriving")
  if(u._arriveExtraMove){const d=rollExtraMove(u._arriveExtraMove);u._arriveExtraMove=null;if(d)log("sys",`&nbsp;&nbsp;…and may reposition up to ${d}″ (move it now).`);}
  return true;
}
function rollExtraMove(spec){
  if(spec==='D6')return d6();
  if(spec==='6')return 6;
  if(spec==='D3+3')return d3()+3;
  return 0;
}
/* ---- TRANSPORTS -----------------------------------------------------------------------------------
   A TRANSPORT model carries friendly models up to its capacity. Embarked units are off-board
   (_embarkedIn = transport.id), excluded from combat/targeting/scoring, exactly like reserves but tied
   to a carrier. Capacity comes from the template's transportCapacity (fetched from Wahapedia's Datasheets
   `transport` field); if 0/unknown, capacity is treated as unlimited-but-flagged so the mechanism still
   works pending real data. Firing Deck x lets the transport fire up to x embarked models' weapons.        */
function isTransport(u){return !!u && ((u.allKw||u.kw||[]).includes('TRANSPORT') || (u._capacity>0));}
function embarkedUnits(tr){return units.filter(u=>!u.dead&&u._embarkedIn===tr.id);}
function embarkedModelCount(tr){return embarkedUnits(tr).reduce((n,u)=>n+Math.max(1,u.models),0);}
function transportHasRoom(tr,unit){
  if(!tr._capacity)return true;                       // unknown capacity -> allow (flagged), pending real data
  return embarkedModelCount(tr)+Math.max(1,unit.models) <= tr._capacity;
}
// Embark: unit ended a move within 3" of a friendly transport, hasn't disembarked this phase, room exists.
function embarkUnit(unit,tr){
  if(!unit||!tr||unit.dead||tr.dead)return false;
  if(unit._disembarkedThisTurn){updateHint("Cannot embark after disembarking this phase.");return false;}
  if(!isTransport(tr)||tr.player!==unit.player){return false;}
  if(rawDist(unitAnchor(unit),unitAnchor(tr))>3+0.0001 && dist(unit,tr)>3){updateHint("Must end within 3″ of the Transport.");return false;}
  if(!transportHasRoom(tr,unit)){updateHint("Transport is at capacity.");return false;}
  unit._embarkedIn=tr.id;unit.deployed=false;unit.hx=-1;unit.hy=-1;unit.modelPos=null;
  log("sys",`${unit.name} embarks within ${tr.name}.`);
  return true;
}
// Disembark: set up wholly within 3" of the transport, not within Engagement Range of enemies.
// emergency=true widens to 6" (used for destroyed transports when 3" placement fails).
function disembarkPlace(unit,tr,hx,hy,emergency){
  const radius=emergency?6:3;
  if(rawDist(unitAnchor(tr),{hx,hy})>radius)return false;
  if(cellOccupied(hx,hy))return false;
  // not within Engagement Range of any enemy
  if(units.some(e=>!e.dead&&e.player!==unit.player&&e.deployed&&rawDist(unitAnchor(e),{hx,hy})<=ENGAGE_IN))return false;
  unit._embarkedIn=null;unit.deployed=true;unit.hx=hx;unit.hy=hy;syncModelPos(unit);
  unit._disembarkedThisTurn=true;
  return true;
}
function disembarkUnit(unit,tr,hx,hy){
  if(!unit||unit._embarkedIn!==tr.id)return false;
  if(tr.advanced||tr.fellback){updateHint("Cannot disembark from a Transport that Advanced or Fell Back.");return false;}
  if(!disembarkPlace(unit,tr,hx,hy,false)){updateHint("Disembark must be wholly within 3″ and clear of enemies.");return false;}
  // timing: if the transport already made a Normal move, the unit counts as having moved and cannot charge
  if(tr.moved){unit.moved=true;unit._noChargeThisTurn=true;}
  log("sys",`${unit.name} disembarks from ${tr.name}.`);
  return true;
}
/* Destroyed transport: embarked units immediately disembark; D6 per disembarking model (1 -> 1 mortal to
   that unit), unit Battle-shocked, counts as moved, cannot charge. Emergency Disembarkation (within 6",
   mortal on 1-3, unplaceable models destroyed) if 3" placement is impossible. */
function destroyedTransportDisembark(tr){
  const passengers=embarkedUnits(tr);
  passengers.forEach(unit=>{
    // try a 3" ring of cells around the transport, else a 6" ring (emergency)
    const place=(emergency)=>{
      const R=emergency?3:1;   // ring radius in cells (~6"/3")
      for(let r=1;r<=R+2;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++){
        const hx=tr.hx+dx,hy=tr.hy+dy;if(hx<0||hy<0||hx>=GW||hy>=GH)continue;
        if(disembarkPlace(unit,tr,hx,hy,emergency))return true;
      }
      return false;
    };
    let emergency=false;
    if(!place(false)){emergency=true;if(!place(true)){
      // cannot place at all: the unit is destroyed
      unit.dead=true;unit.models=0;unit.woundsLeft=0;unit._embarkedIn=null;
      log("kill",`${unit.name} cannot disembark from the wreck — destroyed.`);return;
    }}
    // mortal wounds: D6 per model, 1 (or 1-3 emergency) -> 1 mortal to the unit
    let mw=0;const n=Math.max(1,unit.models);
    for(let i=0;i<n;i++){const r=d6();if(emergency?r<=3:r===1)mw++;}
    if(mw>0)applyMortals(unit,mw);
    if(!unit.dead){
      unit.bshock=true;unit.moved=true;unit._noChargeThisTurn=true;
      log("sys",`${unit.name} bails from the wreck${emergency?' (emergency)':''}${mw?` — ${mw} mortal`:''}; Battle-shocked.`);
    }
  });
}
/* Firing Deck x: when the transport shoots, up to x embarked models contribute a ranged weapon and their
   units are locked out of shooting this phase. With per-model loadouts not in the data, we model the
   effect: the transport gains up to x extra ranged attacks sourced from embarked units, and those units
   are flagged as having shot. Returns the number of decks used (for logging). */
function firingDeckShots(tr){
  const x=tr._firingDeck||0;if(x<=0)return [];
  const pax=embarkedUnits(tr).filter(u=>!u.shotWith||!u.shotWith.length);
  const picked=pax.slice(0,x);
  const extra=[];
  picked.forEach(u=>{
    const w=(u.ranged||[]).find(w=>!(w.ab&&w.ab.oneshot));
    if(w){extra.push(w);u.shotWith=(u.shotWith||[]).concat(['__firingdeck__']);log("sys",`${u.name} fires via ${tr.name}'s Firing Deck.`);}
  });
  return extra;
}
/* Reinforcements step (start of a player's Movement phase). Arrival rules (unified across modes):
   - Strategic Reserves (any reserve unit): from battle round 1, the player may bring on ONE unit per
     Entry Zone of theirs that currently has NO models in it, setting it up within that zone.
   - Deep Strike units: from battle round 2, ONE such unit per turn may instead be set up via its Deep
     Strike rule (>9", walls/closed hatches ignored) anywhere legal, instead of an Entry Zone.
   Per-round caps are tracked on the player via _dsUsedRound (Deep Strike once/round). */
function emptyEntryZonesFor(p){
  // zones with no living, deployed, on-board models of player p
  return entryZones[p].filter(z=>!units.some(u=>u.player===p&&!u.dead&&u.deployed&&!u.inReserve&&
    u.hx>=z.x0&&u.hx<=z.x1&&u.hy>=z.y0&&u.hy<=z.y1));
}
function beginReinforcements(p){
  const res=reservesOf(p);
  if(!res.length)return false;
  const dsEligible = round>=2 && res.some(u=>unitHasDeepStrike(u));      // Deep Strike from round 2
  const zoneSlots  = emptyEntryZonesFor(p).length;                       // Strategic Reserves from round 1, per empty zone
  if(zoneSlots<=0 && !dsEligible)return false;                           // nothing can arrive this turn
  action={kind:'deepstrike',p,queue:res.map(u=>u.id),i:0,zoneSlots,dsEligible,dsUsed:false,zonesUsed:0};
  showActionPanel(true);renderAction();
  const bits=[];
  if(zoneSlots>0)bits.push(`${zoneSlots} Entry-Zone arrival${zoneSlots>1?'s':''}`);
  if(dsEligible)bits.push(`1 Deep Strike`);
  updateHint(`<b>${PNAME[p]}</b> Reinforcements: ${bits.join(' · ')} available, or skip.`);
  return true;
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
  u.hx=hx;u.hy=hy;u.deployed=true;syncModelPos(u);log("sys",`${PNAME[p]} deploys ${u.name}.`);
  deployIdx[p]++;deployTurn=deployTurn===1?2:1;
  if(deployIdx[1]>=deployList[1].length&&deployIdx[2]>=deployList[2].length){
    deploying=false;turn=1;phaseIdx=0;log("hd","◆ ALL FORCES DEPLOYED — BATTLE BEGINS");grantBattleFocus(1);grantBattleFocus(2);grantResurgence(1);grantResurgence(2);grantFlux(1);grantFlux(2);seedDread(1);seedDread(2);allianceOfAgony(1);allianceOfAgony(2);ecSeedFavoured(1);ecSeedFavoured(2);ecMakePledge(1,1);ecMakePledge(2,1);grantMiracleRound(1);grantMiracleRound(2);grantPlasmacytes(1);grantPlasmacytes(2);reserveAircraft(1);reserveAircraft(2);beginPhase();}
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
    // facing indicator: a short prow line from the centre in the heading direction (units that track facing)
    if(u.facing!=null){
      const rad=u.facing*Math.PI/180, r0=CELL*0.40, r1=CELL*0.62;
      ctx.beginPath();ctx.moveTo(c.x+Math.cos(rad)*r0,c.y+Math.sin(rad)*r0);ctx.lineTo(c.x+Math.cos(rad)*r1,c.y+Math.sin(rad)*r1);
      ctx.strokeStyle=isAircraft(u)?gc('--gold'):'rgba(180,200,220,.7)';ctx.lineWidth=isAircraft(u)?3:2;ctx.stroke();
      // arrowhead
      ctx.beginPath();ctx.moveTo(c.x+Math.cos(rad)*r1,c.y+Math.sin(rad)*r1);
      ctx.lineTo(c.x+Math.cos(rad+2.6)*CELL*0.5,c.y+Math.sin(rad+2.6)*CELL*0.5);
      ctx.lineTo(c.x+Math.cos(rad-2.6)*CELL*0.5,c.y+Math.sin(rad-2.6)*CELL*0.5);
      ctx.closePath();ctx.fillStyle=isAircraft(u)?gc('--gold'):'rgba(180,200,220,.7)';ctx.fill();
    }
  });
  // ---- move-preview ghost + facing-toward-cursor (selected movable unit, hovering a cell) -------------
  drawMovePreview();
}
/* Translucent preview at the hovered cell for the selected movable unit, plus a heading arrow from the unit
   toward the cursor (showing the direction it would face after moving). Pure render; reads hoverHx/hoverHy. */
function drawMovePreview(){
  const sel=units.find(u=>u.id===selId);
  if(!sel||sel.dead||sel.player!==turn||deploying||placingTerrain||action)return;
  if(PHASES[phaseIdx]!=="Movement"||sel.moved)return;
  if(hoverHx<0||hoverHy<0||hoverHx>=GW||hoverHy>=GH)return;
  if(hoverHx===sel.hx&&hoverHy===sel.hy)return;
  const from=cellCenter(sel.hx,sel.hy), to=cellCenter(hoverHx,hoverHy);
  const straight=Math.hypot(sel.hx-hoverHx,sel.hy-hoverHy)*HEX_INCH;
  // aircraft fly straight; ground units pay the wall-aware path distance (matches tryMove)
  const dInch=isAircraft(sel)?straight:pathInches(sel.hx,sel.hy,hoverHx,hoverHy,(sel.m+(sel._bfMove||0)+(sel._orderMove||0)+6));
  // legality preview: aircraft need >=20" and within 90 deg arc; others within Move (rough, ignores Advance)
  let ok;
  if(isAircraft(sel)) ok = straight>=AIRCRAFT_MIN_MOVE && (sel.facing==null||withinArc(sel,hoverHx,hoverHy,90)) && !segBlocked(sel.hx,sel.hy,hoverHx,hoverHy);
  else ok = isFinite(dInch) && dInch<=(sel.m+(sel._bfMove||0)+(sel._orderMove||0)) && !cellOccupied(hoverHx,hoverHy,sel.id);
  // travel line
  ctx.beginPath();ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);
  ctx.strokeStyle=ok?'rgba(155,211,74,.55)':'rgba(184,52,42,.5)';ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ctx.stroke();ctx.setLineDash([]);
  // translucent ghost token at destination
  ctx.globalAlpha=0.45;
  ctx.beginPath();ctx.arc(to.x,to.y,CELL*0.40,0,7);ctx.fillStyle=ok?(sel.player===1?gc('--imp'):gc('--cha')):'rgba(120,40,34,.8)';ctx.fill();
  ctx.lineWidth=1.5;ctx.strokeStyle=ok?gc('--gold2'):gc('--blood2');ctx.stroke();
  ctx.globalAlpha=1;
  // facing-toward-cursor arrow from the destination ghost (where it would point after moving)
  const rad=headingDeg(sel.hx,sel.hy,hoverHx,hoverHy)*Math.PI/180;
  ctx.beginPath();ctx.moveTo(to.x+Math.cos(rad)*CELL*0.40,to.y+Math.sin(rad)*CELL*0.40);ctx.lineTo(to.x+Math.cos(rad)*CELL*0.66,to.y+Math.sin(rad)*CELL*0.66);
  ctx.strokeStyle='rgba(240,212,105,.8)';ctx.lineWidth=2;ctx.stroke();
  // distance label
  ctx.fillStyle='#cfe';ctx.font='10px Share Tech Mono';ctx.textAlign='center';ctx.fillText(isFinite(dInch)?dInch.toFixed(0)+'″':'—',to.x,to.y-CELL*0.55);
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
  const src=doctrineSource(turn);const activeName=src&&activeDoctrine[turn]?(src.list.find(d=>d.id===activeDoctrine[turn])?.name||activeDoctrine[turn]):null;
  h+=`<div class="apSub" style="margin-top:10px">Active</div><p class="apNote">Rule: <b>${det.rule.name}</b>${activeName?` · ${src.label}: <b>${activeName}</b>`:''}${oathTarget[turn]?` · Oath set`:''}</p>`;
  // Space Wolves: a Saga-driven detachment offers a manual completion toggle
  if(detachUsesSaga(det)){
    h+=`<button class="stratBtn" id="sagaToggleBtn" style="margin-top:6px"><b>${sagaDone[turn]?'✓ Saga COMPLETED':'◻ Mark Saga completed'}</b><span class="ds">Toggles the Saga upgrade for this detachment (track the tally yourself).</span></button>`;
  }
  // Grey Knights: Gate of Infinity recall offered at the start of this player's turn
  if(pendingGate&&pendingGate.p===turn&&phaseIdx===0){
    const n=Math.min(pendingGate.max,pendingGate.ids.filter(id=>{const u=units.find(x=>x.id===id);return u&&!u.dead&&u.deployed&&!inER(u);}).length);
    if(n>0)h+=`<button class="stratBtn" id="gateBtn" style="margin-top:6px"><b>↯ Gate of Infinity</b><span class="cp">0CP</span><span class="ds">Place up to ${n} eligible unit${n>1?'s':''} into Strategic Reserves (re-deploy via Deep Strike next Movement phase).</span></button>`;
  }
  // Orks: Call Waaagh! (once per battle, Command phase). Show active status when running.
  if(isOrkArmy(turn)){
    if(waaaghActive[turn])h+=`<p class="apNote" style="color:#7fe084;margin-top:6px"><b>WAAAGH! ACTIVE</b> — +1 S/+1 A melee, charge after Advancing, 5+ invuln.</p>`;
    else if(!waaaghCalled[turn]&&PHASES[phaseIdx]==='Command')h+=`<button class="stratBtn" id="waaaghBtn" style="margin-top:6px;border-color:#3a7d3a"><b>▼ Call the WAAAGH!</b><span class="cp">0CP</span><span class="ds">Once per battle. +1 Strength & Attacks in melee, charge after Advancing, 5+ invulnerable — until your next Command phase.</span></button>`;
    else if(waaaghCalled[turn])h+=`<p class="apNote" style="margin-top:6px">Waaagh! already called this battle.</p>`;
  }
  // Tyranids: Shadow in the Warp (once per battle, Command phase) + Synaptic Imperative (Synaptic Nexus)
  if(isTyranidArmy(turn)){
    if(PHASES[phaseIdx]==='Command'&&!shadowUsed[turn]&&hasShadowModel(turn))
      h+=`<button class="stratBtn" id="shadowBtn" style="margin-top:6px;border-color:#5a3a7d"><b>░ Shadow in the Warp</b><span class="cp">0CP</span><span class="ds">Once per battle. Every enemy unit takes a Battle-shock test (−1 within 6\" of a Synapse model).</span></button>`;
    else if(shadowUsed[turn])h+=`<p class="apNote" style="margin-top:6px">Shadow in the Warp already unleashed.</p>`;
    if(det&&/synaptic imperatives/i.test(det.rule.name||'')&&PHASES[phaseIdx]==='Command'){
      h+=`<div class="apSub" style="margin-top:8px">Synaptic Imperative (each once/battle)</div>`;
      [['aug','Augmentation','5+ invuln in Synapse'],['surge','Surging Vitality','+1 Advance/Charge in Synapse'],['goad','Goaded to Slaughter','+1 melee Hit in Synapse']].forEach(([id,nm,ds])=>{
        h+=`<button class="stratBtn synImpBtn" data-imp="${id}" style="margin-top:4px"><b>${synapticImp[turn]===id?'✓ ':''}${nm}</b><span class="ds">${ds}</span></button>`;
      });
    }
  }
  // T'au Empire: For the Greater Good — mark Spotted targets at the start of the Shooting phase
  if(isTauArmy(turn)&&PHASES[phaseIdx]==='Shooting'){
    const n=spotted[turn]?spotted[turn].length:0;
    h+=`<button class="stratBtn" id="markBtn" style="margin-top:6px;border-color:#3a6d7d"><b>◎ Mark targets (markerlights)</b><span class="cp">0CP</span><span class="ds">Each eligible unit becomes an Observer and marks the closest enemy as Spotted. Guided units get +1 to hit vs Spotted targets (markerlight: also ignores cover).</span></button>`;
    if(n)h+=`<p class="apNote" style="color:#7fd0c8;margin-top:4px">${n} unit${n!==1?'s':''} Spotted this phase.</p>`;
  }
  // Aeldari: Battle Focus token pool + Agile Manoeuvre spends (select a unit first)
  if(isAsuryaniArmy(turn)){
    h+=`<div class="apSub" style="margin-top:8px">Battle Focus — ${battleFocus[turn]} token${battleFocus[turn]!==1?'s':''}</div>`;
    if(battleFocus[turn]>0){
      const sel=units.find(x=>x.id===selId&&x.player===turn&&!x.dead);
      h+=`<p class="apNote">${sel?`Spend on <b>${sel.name}</b>:`:'Select one of your units, then spend:'}</p>`;
      [['swift','Swift as the Wind','+2-3" Move'],['fade','Reposition','D6+1" Normal move'],['star','Star Engines','Vehicle ranged → Assault'],['sudden','Sudden Strike','6" Pile-in/Consolidate'],['flit','Flitting Shadows','No Overwatch this turn']].forEach(([k,nm,ds])=>{
        h+=`<button class="stratBtn bfBtn" data-bf="${k}" style="margin-top:4px"><b>${nm}</b><span class="cp">1 BF</span><span class="ds">${ds}</span></button>`;
      });
    } else h+=`<p class="apNote">No Battle Focus tokens remaining this round.</p>`;
  }
  // Genestealer Cults: Resurgence pool (Cult Ambush resurrection is automatic on unit death)
  if(isGSCArmy(turn)){
    h+=`<div class="apSub" style="margin-top:8px">Cult Ambush — ${resurgence[turn]} Resurgence point${resurgence[turn]!==1?'s':''}</div>`;
    h+=`<p class="apNote">When an eligible unit is destroyed, Resurgence is spent automatically to return an identical unit into Cult Ambush (reserves), arriving in a later Movement phase.</p>`;
  }
  // Drukhari: Power from Pain — Pain token pool + Empower the selected unit
  if(isDrukhariArmy(turn)){
    h+=`<div class="apSub" style="margin-top:8px">Power from Pain — ${painTokens[turn]} Pain token${painTokens[turn]!==1?'s':''}</div>`;
    h+=`<p class="apNote">Gain 1 at the start of your Command phase, 1 per enemy unit destroyed, and 1 per enemy that fails a Battle-shock test. Spend 1 to Empower a unit (its weapons gain [SUSTAINED HITS 1] this phase).</p>`;
    if(painTokens[turn]>0){
      const su=units.find(x=>x.id===selId&&x.player===turn&&!x.dead);
      const emp=su&&unitEmpowered(su);
      if(su&&!emp)h+=`<button class="stratBtn painBtn" style="margin-top:4px"><b>✦ Empower ${su.name}</b><span class="cp">1 Pain</span><span class="ds">Activate this unit's Pain abilities until end of phase.</span></button>`;
      else if(su&&emp)h+=`<p class="apNote" style="color:#e8c">${su.name} is Empowered this phase.</p>`;
      else h+=`<p class="apNote">Select one of your units to Empower it.</p>`;
    }
  }
  // Leagues of Votann: Prioritised Efficiency — Yield Point pool + current army stance
  if(isVotannArmy(turn)){
    const st=votannStance[turn]==='fortify'?'Fortify Takeover':'Hostile Acquisition';
    h+=`<div class="apSub" style="margin-top:8px">Prioritised Efficiency — ${yieldPoints[turn]}YP</div>`;
    h+=`<p class="apNote" style="color:${votannStance[turn]==='fortify'?'#8fd':'#fd8'}">Stance: <b>${st}</b>${votannStance[turn]==='fortify'?' (≥7YP: +1 Hit on a held objective, −1 to incoming Wound when S&gt;T)':' (&lt;7YP: +1 Hit vs a target on an objective, re-roll Advance/Charge)'}</p>`;
    h+=`<p class="apNote">YP are gained automatically at the end of your Command phase (objective control), and the stance flips there at the 7YP threshold. Stratagems that spend YP are resolved with their effect logged.</p>`;
    h+=`<button class="stratBtn votannFlipBtn" style="margin-top:4px"><b>⚖ Toggle stance (spend 3YP)</b><span class="cp">3YP</span><span class="ds">Mercenary / Adaptable Avarice: manually switch Hostile ↔ Fortify by spending 3YP.</span></button>`;
  }
  // Emperor's Children — Pledges to the Dark Prince (Coterie) and Favoured Champions (Slaanesh's Chosen)
  if(isCoterieArmy(turn)){
    h+=`<div class="apSub" style="margin-top:8px">Pledges to the Dark Prince — ${pactPoints[turn]} Pact point${pactPoints[turn]!==1?'s':''}</div>`;
    const tiers=[];if(pactPoints[turn]>=1)tiers.push('1+ re-roll Hit 1');if(pactPoints[turn]>=3)tiers.push('3+ re-roll Wound 1');if(pactPoints[turn]>=5)tiers.push('5+ melee Lethal+Sustained');if(pactPoints[turn]>=7)tiers.push('7+ crit on 5+');
    h+=`<p class="apNote" style="color:#d9a">Pledge this round: <b>${ecPledge[turn]}</b> · destroyed so far: <b>${ecKills[turn]}</b>. ${tiers.length?'Active: '+tiers.join(', ')+'.':'No tier yet.'}</p>`;
    h+=`<p class="apNote">At round start you pledge a kill-count (auto 1; raise via Unbound Arrogance). At round end, meeting it banks that many Pact points; missing it costs your Warlord D3 mortal wounds.</p>`;
    h+=`<button class="stratBtn ecPledgeBtn" data-d="1" style="margin-top:4px"><b>◈ Pledge +1 this round</b><span class="ds">Raise your pledge by 1 (more Pact points if met, more risk if not).</span></button>`;
  }
  if(isSlaaneshChosenArmy(turn)){
    const fc=units.find(u=>u.id===favouredChampions[turn]&&!u.dead);
    h+=`<div class="apSub" style="margin-top:8px">Internal Rivalries</div>`;
    h+=`<p class="apNote" style="color:#d9a">Favoured Champions: <b>${fc?fc.name:'—'}</b> (re-rolls the Wound roll; reassigned to the next CHARACTER that destroys an enemy unit).</p>`;
  }
  // Adepta Sororitas: Acts of Faith (Miracle dice pool) + Vows (Penitent Host) + Righteous (Champions of Faith)
  if(isSororitasArmy(turn)){
    const pool=miracleDice[turn];
    h+=`<div class="apSub" style="margin-top:8px">Acts of Faith — Miracle dice</div>`;
    h+=`<p class="apNote" style="color:#fd8">Pool: ${pool.length?'<b>['+pool.join(', ')+']</b>':'<i>empty</i>'} · gain 1 each battle round and 1 whenever one of your units is destroyed.</p>`;
    if(pool.length){
      const armed=sororUseMiracleBshock[turn];
      h+=`<button class="stratBtn sororBshockBtn" style="margin-top:4px"><b>✠ ${armed?'Disarm':'Arm'} Miracle die on Battle-shock</b><span class="ds">Substitute your best Miracle die into this turn's Battle-shock tests (one of the 2D6).</span></button>`;
    }
    h+=`<p class="apNote">Other Acts of Faith (substituting Hit/Wound/Damage/Advance/Charge/Save rolls) are resolved against the abstract dice engine; the pool, round/death gains, and the Battle-shock substitution are live.</p>`;
    const det=detachOf(turn);
    if(det&&/desperate for redemption/i.test((det.rule&&det.rule.name)||'')){
      const v=sororVow[turn];
      h+=`<div class="apSub" style="margin-top:8px">Vow of Atonement${v?': '+({penitent:'Path of the Penitent',absolution:'Absolution in Battle',disgrace:'Death Before Disgrace'}[v]||v):''}</div>`;
      if(phaseIdx===0){
        h+=`<div class="vowRow">`;
        [['penitent','Path of the Penitent (+3\" Move)'],['absolution','Absolution in Battle (charge → +1 A/S melee)'],['disgrace','Death Before Disgrace (fight on death)']].forEach(([id,nm])=>{
          h+=`<button class="stratBtn sororVowBtn" data-v="${id}" style="margin-top:4px${v===id?';border-color:#caa14a':''}"><b>${nm}</b></button>`;
        });
        h+=`</div>`;
      }
    }
    if(det&&/righteous purpose/i.test((det.rule&&det.rule.name)||'')&&phaseIdx===0){
      h+=`<div class="apSub" style="margin-top:8px">Righteous units (${sororRighteous[turn].length}/3)</div>`;
      const su=units.find(x=>x.id===selId&&x.player===turn&&!x.dead);
      if(su)h+=`<button class="stratBtn sororRightBtn" data-u="${su.id}" style="margin-top:4px"><b>✠ ${isRighteous(su)?'Remove Righteous':'Make Righteous'}: ${su.name}</b><span class="ds">+1 Move, +1 Ld, +1 WS/BS (Battle Sisters/Sacresants/Paragons) until your next Command phase.</span></button>`;
      else h+=`<p class="apNote">Select one of your units to mark it Righteous (up to 3).</p>`;
    }
  }
  // Astra Militarum: Voice of Command — show active Orders and let the player issue one to the selected unit
  if(isAstraArmy(turn)){
    const issued=Object.entries(unitOrders[turn]).map(([id,oid])=>{const u=units.find(x=>x.id===id);return u?`${u.name}: ${orderName(oid)}`:null;}).filter(Boolean);
    h+=`<div class="apSub" style="margin-top:8px">Voice of Command — ${ordersIssued[turn]}/${orderBudgetFor(turn)} Orders issued</div>`;
    h+=`<p class="apNote" style="color:#cd9">${issued.length?'Active: '+issued.join(' · '):'No Orders active.'} Orders last until your next Command phase and fall off Battle-shocked units.</p>`;
    if(phaseIdx===0){
      const su=units.find(x=>x.id===selId&&x.player===turn&&!x.dead);
      const of=su?units.filter(u=>u.player===turn&&!u.dead&&u.deployed&&isOfficer(u)).sort((a,b)=>dist(a,su)-dist(b,su))[0]:null;
      if(su&&!isOfficer(su)&&of&&dist(of,su)<=orderRangeFor(turn)&&unitHasKw(su,'ASTRA MILITARUM')&&!su.bshock){
        h+=`<p class="apNote">Issue to <b>${su.name}</b> (from ${of.name}, ${dist(of,su).toFixed(0)}" away):</p><div class="vowRow">`;
        ORDERS.forEach(o=>{h+=`<button class="stratBtn amOrderBtn" data-o="${o.id}" data-u="${su.id}" data-of="${of.id}" style="margin-top:3px${unitOrders[turn][su.id]===o.id?';border-color:#caa14a':''}"><b>${o.name}</b><span class="ds">${o.desc}</span></button>`;});
        h+=`</div>`;
      } else if(su&&isOfficer(su)){
        h+=`<p class="apNote">Select a non-officer ASTRA MILITARUM unit within command range to issue it an Order.</p>`;
      } else {
        h+=`<p class="apNote">Select one of your units (within 6"/12" of an Officer) to issue it an Order.</p>`;
      }
    }
  }
  // World Eaters: Blessings of Khorne dice-pool (roll 8D6, activate up to two Blessings per round)
  if(isWorldEatersArmy(turn)){
    h+=`<div class="apSub" style="margin-top:8px">Blessings of Khorne</div>`;
    if(!khorneRolled[turn]){
      h+=`<button class="stratBtn" id="khorneRollBtn" style="margin-top:4px;border-color:#7d2a2a"><b>🎲 Roll 8D6 (Blessings of Khorne)</b><span class="ds">At the start of the battle round, roll eight dice, then spend doubles/triples to activate up to two Blessings for the round.</span></button>`;
    } else {
      h+=`<p class="apNote">Dice: ${khorneDice[turn]&&khorneDice[turn].length?khorneDice[turn].join(', '):'(spent)'} · ${khorneBlessings[turn].length}/2 Blessings active</p>`;
      const avail=khorneDice[turn]?khorneAvailable(khorneDice[turn]):[];
      KHORNE_BLESSINGS.forEach(b=>{
        const active=khorneBlessingActive(turn,b.id);
        const can=avail.includes(b.id)&&khorneBlessings[turn].length<2&&!active;
        if(active)h+=`<div class="apNote" style="color:#e88">☩ ${b.name} — active</div>`;
        else if(can)h+=`<button class="stratBtn khBlessBtn" data-kh="${b.id}" style="margin-top:4px"><b>${b.name}</b><span class="cp">dbl ${b.thr}+</span><span class="ds">${b.desc}</span></button>`;
      });
      if(khorneBlessings[turn].length>=2)h+=`<p class="apNote">Two Blessings active — roll is locked until next round.</p>`;
      else if(!avail.length&&!khorneBlessings[turn].length)h+=`<p class="apNote">No doubles available this round.</p>`;
    }
  }
  // Death Guard: Nurgle's Gift — show Contagion Range and the chosen-Plague selector
  if(isDeathGuardArmy(turn)){
    const cur=dgChosenPlague(turn);
    h+=`<div class="apSub" style="margin-top:8px">Nurgle\u2019s Gift — Contagion ${contagionRange()}"</div>`;
    h+=`<p class="apNote">Enemies within ${contagionRange()}" of your models are Afflicted: -1 Toughness vs your attacks, plus the chosen Plague.</p>`;
    [['blight','Skullsquirm Blight','Afflicted enemies: -1 to their Hit rolls'],['ague','Rattlejoint Ague','Afflicted enemies: -1 to their Save'],['soulrot','Scabrous Soulrot','Afflicted enemies: -1 Move / Ld / OC']].forEach(([id,nm,ds])=>{
      h+=`<button class="stratBtn dgPlagueBtn" data-pl="${id}" style="margin-top:4px"><b>${cur===id?'✓ ':''}${nm}</b><span class="ds">${ds}</span></button>`;
    });
  }
  // Chaos Daemons: Shadow of Chaos status + Tzeentch Flux pool
  if(isDaemonsArmy(turn)){
    const nml=objectiveControlInZone('nml'), oz=objectiveControlInZone(turn===1?'z2':'z1');
    const nmlIn=nml.total>0&&nml[turn]*2>=nml.total, ozIn=oz.total>0&&oz[turn]*2>=oz.total;
    h+=`<div class="apSub" style="margin-top:8px">Shadow of Chaos</div>`;
    h+=`<p class="apNote">Your deployment zone is always in the Shadow${nmlIn?', No Man\u2019s Land is in the Shadow (you hold its objectives)':''}${ozIn?', the enemy zone is in the Shadow':''}. Daemons in the Shadow heal on a passed Battle-shock test; enemies in it (or near a Greater Daemon) take -1 and risk mortal wounds.</p>`;
    if(isScintillatingLegion(turn)){
      h+=`<div class="apSub" style="margin-top:6px">Fates in Flux — ${fluxTokens[turn]} token${fluxTokens[turn]!==1?'s':''}</div>`;
      if(fluxTokens[turn]>0)h+=`<button class="stratBtn fluxBtn" style="margin-top:4px"><b>↻ Spend Flux (re-roll)</b><span class="ds">Spend one to re-roll a roll; your opponent then gains one Flux token.</span></button>`;
    }
  }
  // Thousand Sons: Cabal of Sorcerers Ritual attempts (Shooting phase), Kindred Sorcery (Command), Flow status
  if(isThousandSonsArmy(turn)){
    if(PHASES[phaseIdx]==='Command'){
      h+=`<div class="apSub" style="margin-top:8px">Kindred Sorcery</div>`;
      [['imbued','Imbued Manifestation','+6" range to Psychic weapons'],['maelstrom','Psychic Maelstrom','+1 Wound with Psychic weapons'],['wrath','Wrath of the Immaterium','Psychic weapons gain [DEVASTATING WOUNDS]']].forEach(([id,nm,ds])=>{
        h+=`<button class="stratBtn kindredBtn" data-kd="${id}" style="margin-top:4px"><b>${kindredTSon[turn]===id?'✓ ':''}${nm}</b><span class="ds">${ds}</span></button>`;
      });
    }
    if(PHASES[phaseIdx]==='Shooting'){
      const left=RITUALS.filter(r=>!ritualsAttempted[turn].includes(r.id));
      h+=`<div class="apSub" style="margin-top:8px">Cabal of Sorcerers</div>`;
      if(left.length){
        h+=`<p class="apNote">Next Ritual: <b>${left[0].name}</b> (Warp Charge ${left[0].wc}). ${left[0].desc}</p>`;
        h+=`<button class="stratBtn ritualBtn" data-ch="0" style="margin-top:4px"><b>✶ Attempt Ritual (2D6)</b><span class="ds">Roll 2D6 vs the Warp Charge. Doubles risk D3 mortal wounds.</span></button>`;
        h+=`<button class="stratBtn ritualBtn" data-ch="1" style="margin-top:4px"><b>✶ Attempt + Channel (3D6)</b><span class="ds">Add a third D6 for a higher total — but more chance of a double.</span></button>`;
      } else h+=`<p class="apNote">All Rituals attempted this turn.</p>`;
    }
  }
  // Chaos Knights: Harbingers of Dread — bank abilities at rounds 1/3/5 (Command phase)
  if(isChaosKnightsArmy(turn)){
    h+=`<div class="apSub" style="margin-top:8px">Harbingers of Dread — ${dreadActive[turn].map(dreadName).join(', ')||'none'}</div>`;
    const canBank=PHASES[phaseIdx]==='Command'&&(round===1||round===3||round===5);
    if(canBank){
      h+=`<p class="apNote">Bank a Dread ability (rounds 1/3/5; each once per battle):</p>`;
      DREAD_ABILITIES.filter(d=>!dreadHas(turn,d.id)).forEach(d=>{
        h+=`<button class="stratBtn dreadBtn" data-dr="${d.id}" style="margin-top:4px"><b>${d.name}</b><span class="ds">${d.desc}</span></button>`;
      });
    } else h+=`<p class="apNote">Dread abilities accumulate at the start of rounds 1, 3 and 5 and last all battle.</p>`;
  }
  // Heretic Astartes: Dark Pact toggle (Shooting/Fight phases) + Creations of Bile augment chooser
  if(isHereticAstartesArmy(turn)){
    if((PHASES[phaseIdx]==='Shooting'||PHASES[phaseIdx]==='Fight')&&!isRenegadeWarband(turn)){
      h+=`<div class="apSub" style="margin-top:8px">Dark Pacts</div>`;
      if(darkPact[turn])h+=`<p class="apNote">A Dark Pact is active — weapons have [LETHAL HITS] and [SUSTAINED HITS 1] this phase.</p>`;
      else{
        h+=`<p class="apNote">Take a Leadership test (fail → D3 mortal wounds) to grant your army [LETHAL HITS] + [SUSTAINED HITS 1] this phase.</p>`;
        h+=`<button class="stratBtn pactBtn" style="margin-top:4px"><b>⛧ Make a Dark Pact</b><span class="ds">Beseech the Dark Gods for lethal boons — at the risk of mortal wounds.</span></button>`;
      }
    }
    if(isCreationsOfBile(turn)&&PHASES[phaseIdx]==='Command'&&round===1&&bileAugments[turn].length===0){
      h+=`<div class="apSub" style="margin-top:8px">Experimental Augmentations</div><p class="apNote">Select an augmentation for the battle:</p>`;
      BILE_AUGMENTS.forEach(a=>{h+=`<button class="stratBtn bileBtn" data-bi="${a.id}" style="margin-top:4px"><b>${a.name}</b><span class="ds">${a.desc}</span></button>`;});
    } else if(isCreationsOfBile(turn)&&bileAugments[turn].length){
      h+=`<div class="apSub" style="margin-top:8px">Augmentations — ${bileAugments[turn].map(id=>(BILE_AUGMENTS.find(a=>a.id===id)||{}).name).join(', ')}</div>`;
    }
  }
  host.innerHTML=h;
  host.querySelectorAll('.stratBtn').forEach(b=>{if(b.id!=='sagaToggleBtn'&&b.id!=='gateBtn'&&b.id!=='waaaghBtn'&&b.id!=='shadowBtn'&&b.id!=='markBtn'&&b.id!=='khorneRollBtn'&&!b.classList.contains('synImpBtn')&&!b.classList.contains('bfBtn')&&!b.classList.contains('khBlessBtn')&&!b.classList.contains('dgPlagueBtn')&&!b.classList.contains('fluxBtn')&&!b.classList.contains('ritualBtn')&&!b.classList.contains('kindredBtn')&&!b.classList.contains('dreadBtn')&&!b.classList.contains('pactBtn')&&!b.classList.contains('bileBtn')&&!b.classList.contains('painBtn')&&!b.classList.contains('votannFlipBtn')&&!b.classList.contains('ecPledgeBtn')&&!b.classList.contains('sororBshockBtn')&&!b.classList.contains('sororVowBtn')&&!b.classList.contains('sororRightBtn')&&!b.classList.contains('amOrderBtn'))b.onclick=()=>useStratagem(turn,b.dataset.s);});
  const sg=$('sagaToggleBtn');if(sg)sg.onclick=()=>{sagaDone[turn]=!sagaDone[turn];log("sys",`${PNAME[turn]} Saga ${sagaDone[turn]?'COMPLETED — upgraded effects active':'reset'}.`);renderStratPanel();};
  const gb=$('gateBtn');if(gb)gb.onclick=()=>doGateOfInfinity();
  const wb=$('waaaghBtn');if(wb)wb.onclick=()=>callWaaagh();
  const shb=$('shadowBtn');if(shb)shb.onclick=()=>unleashShadow();
  const mkb=$('markBtn');if(mkb)mkb.onclick=()=>doMarkerlights();
  const khr=$('khorneRollBtn');if(khr)khr.onclick=()=>{rollKhorneBlessings(turn);renderStratPanel();};
  host.querySelectorAll('.synImpBtn').forEach(b=>b.onclick=()=>pickSynImp(b.dataset.imp));
  host.querySelectorAll('.bfBtn').forEach(b=>b.onclick=()=>spendBattleFocus(b.dataset.bf));
  host.querySelectorAll('.khBlessBtn').forEach(b=>b.onclick=()=>activateKhorneBlessing(turn,b.dataset.kh));
  host.querySelectorAll('.dgPlagueBtn').forEach(b=>b.onclick=()=>{dgPlague[turn]=b.dataset.pl;const nm={blight:'Skullsquirm Blight',ague:'Rattlejoint Ague',soulrot:'Scabrous Soulrot'}[b.dataset.pl];log("sys",`${PNAME[turn]} chooses the Plague: ${nm}.`);renderStratPanel();});
  host.querySelectorAll('.fluxBtn').forEach(b=>b.onclick=()=>spendFlux());
  host.querySelectorAll('.ritualBtn').forEach(b=>b.onclick=()=>attemptRitual(b.dataset.ch==='1'));
  host.querySelectorAll('.kindredBtn').forEach(b=>b.onclick=()=>{kindredTSon[turn]=b.dataset.kd;const nm={imbued:'Imbued Manifestation',maelstrom:'Psychic Maelstrom',wrath:'Wrath of the Immaterium'}[b.dataset.kd];log("sys",`${PNAME[turn]} invokes Kindred Sorcery: ${nm}.`);renderStratPanel();});
  host.querySelectorAll('.dreadBtn').forEach(b=>b.onclick=()=>bankDread(turn,b.dataset.dr));
  host.querySelectorAll('.pactBtn').forEach(b=>b.onclick=()=>makeDarkPact());
  host.querySelectorAll('.bileBtn').forEach(b=>b.onclick=()=>{if(!bileAugments[turn].includes(b.dataset.bi))bileAugments[turn].push(b.dataset.bi);const nm=(BILE_AUGMENTS.find(a=>a.id===b.dataset.bi)||{}).name;log("sys",`${PNAME[turn]} augmentation active: ${nm}.`);renderStratPanel();});
  host.querySelectorAll('.painBtn').forEach(b=>b.onclick=()=>empowerUnit());
  host.querySelectorAll('.votannFlipBtn').forEach(b=>b.onclick=()=>votannFlipStance());
  host.querySelectorAll('.ecPledgeBtn').forEach(b=>b.onclick=()=>ecRaisePledge(parseInt(b.dataset.d||'1',10)));
  host.querySelectorAll('.sororBshockBtn').forEach(b=>b.onclick=()=>sororToggleMiracleBshock());
  host.querySelectorAll('.sororVowBtn').forEach(b=>b.onclick=()=>chooseSororVow(b.dataset.v));
  host.querySelectorAll('.sororRightBtn').forEach(b=>b.onclick=()=>toggleRighteous(b.dataset.u));
  host.querySelectorAll('.amOrderBtn').forEach(b=>b.onclick=()=>{const of=units.find(u=>u.id===b.dataset.of),tu=units.find(u=>u.id===b.dataset.u);if(issueOrder(of,tu,b.dataset.o)){renderAll();render();renderStratPanel();updateHint();}});
}
function doGateOfInfinity(){
  if(!pendingGate||pendingGate.p!==turn)return;
  let n=0;
  for(const id of pendingGate.ids){
    if(n>=pendingGate.max)break;
    const u=units.find(x=>x.id===id);
    if(u&&!u.dead&&u.deployed&&!inER(u)){reserveUnit(u);n++;}
  }
  log("sys",`↯ ${PNAME[turn]} Gates ${n} unit${n!==1?'s':''} into Reserves.`);
  pendingGate=null;renderAll();render();renderStratPanel();updateHint();
}
function isOrkArmy(p){const fd=factionDataFor(p);const ar=armyRuleOf(p);return /orks/i.test((FACTIONS[pFaction[p]]||{}).name||'')||/waaagh/i.test((ar&&ar.name)||'');}
function callWaaagh(){
  if(waaaghCalled[turn]||!isOrkArmy(turn))return;
  waaaghCalled[turn]=true;waaaghActive[turn]=true;waaaghTurnLeft[turn]=1;
  log("hd",`▼▼ ${PNAME[turn].toUpperCase()} CALLS A WAAAGH! ▼▼`);
  log("sys","Charge after Advancing · +1 Strength & +1 Attack in melee · 5+ invulnerable save — until your next Command phase.");
  renderAll();render();renderStratPanel();updateHint();
}
function unleashShadow(){
  if(shadowUsed[turn]||!isTyranidArmy(turn)||!hasShadowModel(turn))return;
  shadowUsed[turn]=true;
  log("hd",`░░ ${PNAME[turn].toUpperCase()} UNLEASHES THE SHADOW IN THE WARP ░░`);
  const ep=turn===1?2:1;
  units.filter(u=>u.player===ep&&!u.dead&&u.deployed).forEach(u=>{
    const near=units.some(s=>s.player===turn&&!s.dead&&unitHasKw(s,'SYNAPSE')&&dist(s,u)<=6);
    const r=d6()+d6()-(near?1:0);const pass=r>=u.ld;
    log("",`Shadow Battle-shock ${u.name}: <b>${r}</b> vs LD${u.ld}${near?' (−1)':''} — ${pass?'<span class="save">PASS</span>':'<span class="kill">FAIL · shocked</span>'}`);
    if(!belowHalf(u))u.bshock=!pass;else u.bshock=u.bshock||!pass;
  });
  renderAll();render();renderStratPanel();updateHint();
}
function pickSynImp(id){
  // Synaptic Nexus: choose a Synaptic Imperative for the battle round (each once per battle)
  synapticImp[turn]=id;
  const nm={aug:'Synaptic Augmentation (5+ invuln)',surge:'Surging Vitality (+1 Advance/Charge)',goad:'Goaded to Slaughter (+1 melee Hit)'}[id];
  log("sys",`${PNAME[turn]} Synaptic Imperative: ${nm}.`);
  renderStratPanel();render();
}
function isTauArmy(p){return /t.au empire/i.test((FACTIONS[pFaction[p]]||{}).name||'');}
function isAsuryaniArmy(p){const ar=armyRuleOf(p);return /aeldari/i.test((FACTIONS[pFaction[p]]||{}).name||'')||/battle focus/i.test((ar&&ar.name)||'');}
function isGSCArmy(p){const ar=armyRuleOf(p);return /genestealer cults/i.test((FACTIONS[pFaction[p]]||{}).name||'')||/cult ambush/i.test((ar&&ar.name)||'');}
function isWorldEatersArmy(p){const ar=armyRuleOf(p);return /world eaters/i.test((FACTIONS[pFaction[p]]||{}).name||'')||/blessings of khorne/i.test((ar&&ar.name)||'');}
// The six Blessings of Khorne and the double/triple threshold each requires.
const KHORNE_BLESSINGS=[
  {id:'bloodlust',name:'Unbridled Bloodlust',thr:1,desc:'Re-roll Charge rolls.'},
  {id:'rage',name:'Rage-fuelled Invigoration',thr:2,desc:'6" Pile-in/Consolidate.'},
  {id:'carnage',name:'Total Carnage',thr:3,desc:'Destroyed-in-melee models fight on (4+).'},
  {id:'martial',name:'Martial Excellence',thr:4,desc:'Melee gain [SUSTAINED HITS 1].'},
  {id:'warp',name:'Warp Blades',thr:5,desc:'Melee gain [LETHAL HITS].'},
  {id:'decap',name:'Decapitating Strikes',thr:6,desc:'Melee gain [DEVASTATING WOUNDS] vs INFANTRY.'},
];
function khorneBlessingActive(p,id){return khorneBlessings[p]&&khorneBlessings[p].includes(id);}
// Given an array of dice values, which Blessing thresholds are satisfiable (a double/triple of thr-or-higher exists)?
function khorneAvailable(dice){
  const avail=[];
  KHORNE_BLESSINGS.forEach(b=>{
    const n=dice.filter(d=>d>=b.thr).length;   // dice at or above threshold can pair to form a "double of thr or higher"
    if(n>=2)avail.push(b.id);
  });
  return avail;
}
function rollKhorneBlessings(p){
  if(!isWorldEatersArmy(p)||khorneRolled[p])return;
  const dice=[];for(let i=0;i<8;i++)dice.push(d6());
  khorneDice[p]=dice;khorneRolled[p]=true;
  log("hd",`☩ ${PNAME[p]} BLESSINGS OF KHORNE — rolled: ${dice.join(', ')}`);
  logDice(dice.map(v=>({v})));
  const avail=khorneAvailable(dice);
  if(!avail.length)log("sys","No doubles available — no Blessings can be activated.");
}
function activateKhorneBlessing(p,id){
  if(!isWorldEatersArmy(p)||!khorneDice[p])return;
  if(khorneBlessings[p].length>=2){log("sys","Already two Blessings active this round.");return;}
  if(khorneBlessingActive(p,id)){return;}
  const b=KHORNE_BLESSINGS.find(x=>x.id===id);if(!b)return;
  // consume two dice at or above the threshold
  const idxs=[];khorneDice[p].forEach((d,i)=>{if(d>=b.thr&&idxs.length<2)idxs.push(i);});
  if(idxs.length<2){log("sys",`Not enough dice (need a double ${b.thr}+) for ${b.name}.`);return;}
  idxs.sort((a,c)=>c-a).forEach(i=>khorneDice[p].splice(i,1));
  khorneBlessings[p].push(id);
  log("hd",`☩ ${b.name} ACTIVE — ${b.desc}`);
  renderStratPanel&&renderStratPanel();
}
function resurgenceStart(){const sz=MODES[mode].pts;return sz>=2000?14:sz>=1000?10:6;}  // Onslaught/Strike Force/Incursion
function grantResurgence(p){
  if(!isGSCArmy(p)){resurgence[p]=0;return;}
  let n=resurgenceStart();
  // enhancement bonuses to starting Resurgence (Deeds That Speak to the Masses +2)
  units.filter(u=>u.player===p&&!u.dead&&u.enh==='Deeds That Speak to the Masses').forEach(()=>n+=2);
  resurgence[p]=n;
  log("sys",`${PNAME[p]} begins with ${n} Resurgence point${n!==1?'s':''} (Cult Ambush).`);
}
// Cost in Resurgence points to bring back a unit of this template, scaled to its max model count.
function resurgenceCost(u){
  const big=u.maxModels>=10;
  const nm=(u.name||'').toLowerCase();
  if(/aberrant/.test(nm))return big?8:4;
  if(/acolyte|metamorph/.test(nm))return big?4:2;
  if(/jackal/.test(nm))return big?6:2;
  if(/neophyte/.test(nm))return u.maxModels>=20?6:3;
  if(/purestrain|genestealer/.test(nm))return big?6:2;
  return big?5:3; // generic fallback
}
function unitCultAmbushEligible(u){
  // every model in the unit must have the Cult Ambush ability — modelled as GSC INFANTRY/MOUNTED battleline-ish
  return isGSCArmy(u.player)&&unitHasKw(u,'GENESTEALER CULTS')&&!unitHasKw(u,'CHARACTER')&&!unitHasKw(u,'VEHICLE');
}
function cultAmbushResurrect(u){
  // On a GSC unit's destruction, spend Resurgence to recreate an identical unit in Cult Ambush (reserves).
  if(!u||!u.dead||!unitCultAmbushEligible(u))return;
  const cost=resurgenceCost(u);
  if(resurgence[u.player]<cost)return;
  resurgence[u.player]-=cost;
  const nu=newUnit(u.tpl,u.player);
  nu.enh=null;nu.inReserve=true;nu.deployed=false;nu.dead=false;nu.hx=-1;nu.hy=-1;nu._cultAmbush=true;nu._reserveRound=(typeof round==='number'?round:0);
  units.push(nu);
  log("hd",`✥ CULT AMBUSH — ${u.name} returns from the shadows (${cost} Resurgence, ${resurgence[u.player]} left).`);
}
function battleFocusBase(){const sz=MODES[mode].pts;return sz>=2000?6:sz>=1000?4:2;}  // Onslaught/Strike Force/Incursion
// ---- Drukhari: Power from Pain ----
function isDrukhariArmy(p){const ar=armyRuleOf(p);return /drukhari/i.test((FACTIONS[pFaction[p]]||{}).name||'')||/power from pain|alliance of agony|rain of cruelty|combat drugs|stitchflesh|murderous agenda|callous competition/i.test((ar&&ar.name)||'');}
function gainPain(p,n,why){
  if(!isDrukhariArmy(p)||n<=0)return;
  painTokens[p]+=n;
  log("sys",`${PNAME[p]} gains ${n} Pain token${n!==1?'s':''}${why?` (${why})`:''} — ${painTokens[p]} in pool.`);
}
function painOnEnemyDeath(u){
  // u is the unit that just died; its controller's OPPONENT (the killer) gains a Pain token if Drukhari.
  if(!u)return;const ep=u.player===1?2:1;
  if(isDrukhariArmy(ep))gainPain(ep,1,'enemy destroyed');
}
function empowerUnit(){
  // Spend 1 Pain token to Empower the selected unit for the phase (its Pain abilities take effect).
  if(!isDrukhariArmy(turn)){log("sys","Only Drukhari can Empower units.");return;}
  if(painTokens[turn]<=0){log("sys","No Pain tokens to spend.");return;}
  const u=units.find(x=>x.id===selId&&x.player===turn&&!x.dead);
  if(!u){log("sys","Select one of your units first, then Empower it.");return;}
  if(empowered[turn].includes(u.id)){log("sys",`${u.name} is already Empowered this phase.`);return;}
  painTokens[turn]--;empowered[turn].push(u.id);
  log("hd",`✦ ${u.name} is Empowered (1 Pain token spent, ${painTokens[turn]} left) — Pain abilities active this phase.`);
  renderAll();render();renderStratPanel();updateHint();
}
function unitEmpowered(u){return !!u&&isDrukhariArmy(u.player)&&empowered[u.player]&&empowered[u.player].includes(u.id);}
// ---- Ability -> fx join layer (ability_fx.js). Keyed by datasheet_id (template key) + normalised ability name. ----
function normAbil(s){return (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'');}
// Return the list of fx authored for a given unit's named abilities (matched by template key + ability name).
// Tolerant: an unmapped or renamed ability simply contributes nothing (the text still displays elsewhere).
function abilityFxFor(u, filterFn){
  if(typeof ABILITY_FX==='undefined'||!u||!u.tpl)return [];
  const map=ABILITY_FX[u.tpl];if(!map)return [];
  const out=[];
  (u.abilities||[]).forEach(a=>{
    if(filterFn&&!filterFn(a))return;
    const fx=map[normAbil(a.name)];
    if(fx)fx.forEach(f=>out.push(f));
  });
  return out;
}
// The Drukhari Empowered combat contribution: this unit's actual Pain-ability fx (replaces the old blanket Sustained 1).
// Pain abilities are the ones tagged "(Pain)" in their name. Applied through the same applyFxList path as everything else.
function empoweredFxFor(u){
  return abilityFxFor(u, a=>/\(pain\)/i.test(a.name||''));
}
// Universal Core abilities (CORE_FX, keyed by normalised ability name, faction-agnostic). Returns the fx for whichever
// Core abilities this unit has. `note` fx are no-ops; the only currently-applied Core fx is Stealth (defender-side -1 to hit).
function coreFxFor(u){
  if(typeof CORE_FX==='undefined'||!u)return [];
  const out=[];
  (u.abilities||[]).forEach(a=>{
    if((a.type||'')!=='Core')return;
    const fx=CORE_FX[normAbil(a.name)];
    if(fx)fx.forEach(f=>out.push(f));
  });
  return out;
}
// Lone Operative: a unit with this Core ability can only be targeted by ranged attacks from within 12" (unless Attached).
function unitIsLoneOp(u){
  return !!u && (u.abilities||[]).some(a=>(a.type||'')==='Core' && normAbil(a.name)==='loneoperative');
}
// Fights First (Core Rules step 1). A unit fights in the Fights First step if ANY of:
//   - it made a Charge move this turn (the rules explicitly fold chargers into step 1, and they carry the Charge bonus),
//   - it has the Fights First Core ability on its datasheet,
//   - it currently has a granted Fights First effect (enhancement/stratagem emitting the fightsFirst fx).
function unitHasFightsFirstAbility(u){
  return !!u && ((u.abilities||[]).some(a=>(a.type||'')==='Core' && normAbil(a.name)==='fightsfirst') || unitHasElig(u,'fightsFirst'));
}
function unitFightsFirst(u){
  return !!u && (u.charged || unitHasFightsFirstAbility(u));
}
function allianceOfAgony(p){
  // Realspace Raiders: start with up to 6 Pain tokens (2 per Archon+Kabalite / Succubus+Wych / Haemonculus+Wrack combo).
  // Detachment composition isn't tracked, so grant a flat starting pool to a Realspace Raiders Drukhari army.
  if(!isDrukhariArmy(p))return;
  const det=detachOf(p);
  if(det&&/alliance of agony/i.test((det.rule&&det.rule.name)||'')){gainPain(p,6,'Alliance of Agony');}
}
// ---- Leagues of Votann: Prioritised Efficiency (Yield Points + Hostile Acquisition / Fortify Takeover) ----
function isVotannArmy(p){const ar=armyRuleOf(p);return /leagues of votann|votann/i.test((FACTIONS[pFaction[p]]||{}).name||'')||/prioritised efficiency|martial leverage|assailed from every angle|fury from the d.?lve|mobile sensor relays|optimal application|methodical annihilation|ruthless reinvestment/i.test((ar&&ar.name)||'');}
function gainYP(p,n,why){
  if(!isVotannArmy(p)||n<=0)return;
  yieldPoints[p]+=n;
  log("sys",`${PNAME[p]} gains ${n}YP${why?` (${why})`:''} — ${yieldPoints[p]}YP held.`);
}
function ypOnEnemyDeath(u){
  // Needgaârd Martial Leverage / Mercenary Prospector: the killer (dying unit's opponent) gains YP if Votann.
  if(!u)return;const ep=u.player===1?2:1;
  if(!isVotannArmy(ep))return;
  const det=detachOf(ep);
  if(det&&/martial leverage/i.test((det.rule&&det.rule.name)||''))gainYP(ep,1,'enemy destroyed (Martial Leverage)');
}
function votannStanceFor(p){return isVotannArmy(p)?votannStance[p]:null;}
// YP gain from objective control at the END of a player's Command phase, then re-evaluate the stance threshold.
function votannCommandYield(p){
  if(!isVotannArmy(p))return;
  const own='z'+p;                                   // this player's own deployment zone id
  const inOwn=objectiveControlInZone(own)[p];
  // Tally objectives this player controls that are NOT in their own deployment zone, across the other two zones.
  const zones=['z1','z2','nml'].filter(z=>z!==own);
  let outZone=0; zones.forEach(z=>{outZone+=objectiveControlInZone(z)[p];});
  // Opponent's total controlled objectives (all zones) for the "more than opponent" check.
  const ep=p===1?2:1; let mine=inOwn+outZone, theirs=0;
  ['z1','z2','nml'].forEach(z=>{theirs+=objectiveControlInZone(z)[ep];});
  let gain=0;
  if(inOwn>=1)gain+=1;                                // hold an objective in your own zone
  if(round>=2){
    if(outZone>=1)gain+=1;                            // one or more not-in-zone
    if(outZone>=2)gain+=1;                            // two or more not-in-zone
    if(mine>theirs)gain+=1;                           // more than the opponent
  }
  // Hearthfyre Optimal Application: +1 YP per not-in-zone objective held with an IRON-MASTER/MEMNYR STRATEGIST in range (max 2).
  const det=detachOf(p);
  if(det&&/optimal application/i.test((det.rule&&det.rule.name)||'')){
    let bonus=0;
    objectives.forEach(o=>{
      if(zoneOfCell(o.hx,o.hy)===own)return;
      const ctrl=objectiveControlledBy(o,p); if(!ctrl)return;
      const near=units.some(u=>u.player===p&&!u.dead&&u.deployed&&!u.inReserve&&(unitHasKw(u,'IRON-MASTER')||unitHasKw(u,'MEMNYR STRATEGIST'))&&Math.hypot(o.hx-unitAnchor(u).hx,o.hy-unitAnchor(u).hy)<=1.5);
      if(near)bonus++;
    });
    if(bonus>0)gainYP(p,Math.min(2,bonus),'Optimal Application');
  }
  if(gain>0)gainYP(p,gain,'objective control');
  updateVotannStance(p);
}
function objectiveControlledBy(o,p){
  let oc={1:0,2:0};
  units.forEach(u=>{if(!u.dead&&u.deployed&&!u.inReserve){const a=unitAnchor(u);if(Math.hypot(o.hx-a.hx,o.hy-a.hy)<=1.5)oc[u.player]+=ocOf(u);}});
  return oc[p]>oc[p===1?2:1]&&oc[p]>0;
}
function updateVotannStance(p){
  if(!isVotannArmy(p))return;
  const det=detachOf(p);
  // Mercenary Oathband (Ruthless Reinvestment): no auto-flip; stance only changes via spending 3YP (modelled as a manual toggle, default stays hostile).
  if(det&&/ruthless reinvestment/i.test((det.rule&&det.rule.name)||''))return;
  const next=yieldPoints[p]>=7?'fortify':'hostile';
  if(votannStance[p]!==next){votannStance[p]=next;log("sys",`${PNAME[p]}: army stance is now ${next==='fortify'?'Fortify Takeover':'Hostile Acquisition'} (${yieldPoints[p]}YP).`);}
}
function unitAssailedBy(u,attacker){
  // is u (a target) assailed by the attacker's player?
  return !!u&&!!attacker&&isVotannArmy(attacker.player)&&assailed[attacker.player]&&assailed[attacker.player].includes(u.id);
}
function votannFlipStance(){
  if(!isVotannArmy(turn)){log("sys","Only Leagues of Votann can switch stance.");return;}
  if(yieldPoints[turn]<3){log("sys","Need 3YP to switch stance.");return;}
  yieldPoints[turn]-=3;
  votannStance[turn]=votannStance[turn]==='fortify'?'hostile':'fortify';
  log("hd",`⚖ ${PNAME[turn]} spends 3YP to switch stance → ${votannStance[turn]==='fortify'?'Fortify Takeover':'Hostile Acquisition'} (${yieldPoints[turn]}YP left).`);
  renderAll();render();renderStratPanel();updateHint();
}
// ---- Emperor's Children: Thrill Seekers + Pledges to the Dark Prince + Favoured Champions ----
function isECArmy(p){const ar=armyRuleOf(p);return /emperor.?s children/i.test((FACTIONS[pFaction[p]]||{}).name||'')||/thrill seekers|quicksilver grace|exquisite swordsmanship|mechanised murder|daemonic empowerment|pledges to the dark prince|internal rivalries|sensational performance/i.test((ar&&ar.name)||'');}
function isCoterieArmy(p){const det=detachOf(p);return isECArmy(p)&&det&&/pledges to the dark prince/i.test((det.rule&&det.rule.name)||'');}
function isSlaaneshChosenArmy(p){const det=detachOf(p);return isECArmy(p)&&det&&/internal rivalries/i.test((det.rule&&det.rule.name)||'');}
// At the start of a battle round, the Coterie player pledges how many enemy units they'll destroy this round.
function ecMakePledge(p,n){
  if(!isCoterieArmy(p))return;
  ecPledge[p]=Math.max(0,n|0);ecKills[p]=0;ecPledged[p]=true;
  log("hd",`◈ ${PNAME[p]} pledges ${ecPledge[p]} enemy unit${ecPledge[p]!==1?'s':''} to the Dark Prince this round.`);
}
// At the end of a battle round: if kills >= pledge, bank that many Pact points; else Warlord suffers D3 mortal wounds.
function ecResolvePledge(p){
  if(!isCoterieArmy(p)||!ecPledged[p])return;
  if(ecPledge[p]>0&&ecKills[p]>=ecPledge[p]){
    pactPoints[p]+=ecPledge[p];
    log("hd",`◈ ${PNAME[p]} fulfilled the pledge (${ecKills[p]}/${ecPledge[p]} destroyed) — gains ${ecPledge[p]} Pact point${ecPledge[p]!==1?'s':''} (${pactPoints[p]} total).`);
  } else {
    const wl=units.find(u=>u.player===p&&!u.dead&&u.isWarlord)||units.find(u=>u.player===p&&!u.dead&&unitHasKw(u,'CHARACTER'));
    log("hd",`◈ ${PNAME[p]} failed the pledge (${ecKills[p]}/${ecPledge[p]}) — no Pact points; Warlord suffers D3 mortal wounds.`);
    if(wl)applyMortals(wl,d3());
  }
  ecPledged[p]=false;ecKills[p]=0;ecPledge[p]=0;
}
function ecRaisePledge(n){
  if(!isCoterieArmy(turn)){log("sys","Only a Coterie of the Conceited army pledges to Slaanesh.");return;}
  if(!ecPledged[turn]){ecMakePledge(turn,n);}
  else{ecPledge[turn]+=n;log("hd",`◈ ${PNAME[turn]} raises the pledge to ${ecPledge[turn]} (destroyed so far: ${ecKills[turn]}).`);}
  renderAll();render();renderStratPanel();updateHint();
}
function ecPactTier(p,thr){return isCoterieArmy(p)&&pactPoints[p]>=thr;}// Favoured Champions (Slaanesh's Chosen): the army's reroll-Wound marker, set to the Warlord's unit at battle start.
function ecSeedFavoured(p){
  if(!isSlaaneshChosenArmy(p))return;
  const wl=units.find(u=>u.player===p&&!u.dead&&u.isWarlord&&unitHasKw(u,'CHARACTER'))||units.find(u=>u.player===p&&!u.dead&&unitHasKw(u,'CHARACTER'));
  if(wl){favouredChampions[p]=wl.id;log("sys",`${PNAME[p]}: ${wl.name} is the army's Favoured Champions.`);}
}
function isFavouredChampions(u){return !!u&&isSlaaneshChosenArmy(u.player)&&favouredChampions[u.player]===u.id;}
// Per-enemy-death EC hook: tally the killer's kills for the pledge, and (Slaanesh's Chosen) hand Favoured Champions to a CHARACTER killer.
function ecOnEnemyDeath(victim,killer){
  if(!victim)return;const ep=victim.player===1?2:1;
  if(isCoterieArmy(ep)&&ecPledged[ep])ecKills[ep]++;
  if(killer&&isSlaaneshChosenArmy(killer.player)&&unitHasKw(killer,'CHARACTER')&&!killer.dead){
    if(favouredChampions[killer.player]!==killer.id){favouredChampions[killer.player]=killer.id;log("sys",`${killer.name} becomes ${PNAME[killer.player]}'s Favoured Champions.`);}
  }
}
// ---- Adepta Sororitas: Acts of Faith (Miracle dice pool) + Vows of Atonement + Righteous units ----
function isSororitasArmy(p){const ar=armyRuleOf(p);return /adepta sororitas|sororitas/i.test((FACTIONS[pFaction[p]]||{}).name||'')||/acts of faith|blood of martyrs|desperate for redemption|fervent purgation|sacred rites|righteous purpose/i.test((ar&&ar.name)||'');}
// Gain n Miracle dice, each rolled (value 1-6). Optionally force a value (some enhancements grant a 6).
function gainMiracle(p,n,why,forceVal){
  if(!isSororitasArmy(p)||n<=0)return;
  const vals=[];for(let i=0;i<n;i++){const v=forceVal||d6();miracleDice[p].push(v);vals.push(v);}
  log("sys",`${PNAME[p]} gains ${n} Miracle dice [${vals.join(', ')}] — pool: [${miracleDice[p].join(', ')}].`);
}
function grantMiracleRound(p){ if(isSororitasArmy(p))gainMiracle(p,1,'start of battle round'); }   // +1 each battle round
function miracleOnDeath(u){ if(u&&isSororitasArmy(u.player))gainMiracle(u.player,1,`${u.name} destroyed`); } // +1 per ASORITAS unit destroyed
// Spend (remove) the best Miracle die from the pool and return its value, or null if empty. Used for substitutions.
function spendBestMiracle(p){
  if(!miracleDice[p]||!miracleDice[p].length)return null;
  let bi=0;for(let i=1;i<miracleDice[p].length;i++)if(miracleDice[p][i]>miracleDice[p][bi])bi=i;
  return miracleDice[p].splice(bi,1)[0];
}
// Player toggles intent to spend a Miracle die on this turn's Battle-shock tests (substitutes one of the 2D6).
function sororToggleMiracleBshock(){
  if(!isSororitasArmy(turn)){log("sys","Only Adepta Sororitas have Miracle dice.");return;}
  if(!miracleDice[turn].length){log("sys","No Miracle dice in the pool.");return;}
  sororUseMiracleBshock[turn]=!sororUseMiracleBshock[turn];
  log("sys",`Acts of Faith: Miracle-dice substitution on Battle-shock tests ${sororUseMiracleBshock[turn]?'ARMED':'disarmed'} for this turn.`);
  renderAll();render();renderStratPanel();updateHint();
}
// Penitent Host Vows of Atonement (round pick) — combat-relevant ones flow via the sororVow* conditions.
function sororVowFor(p){return isSororitasArmy(p)?sororVow[p]:null;}
function chooseSororVow(id){
  if(!isSororitasArmy(turn))return;
  sororVow[turn]=id;
  const nm={penitent:'The Path of the Penitent',absolution:'Absolution in Battle',disgrace:'Death Before Disgrace'}[id]||id;
  log("hd",`✠ ${PNAME[turn]} swears the Vow: ${nm} (until the next battle round).`);
  renderAll();render();renderStratPanel();updateHint();
}
// Champions of Faith — Righteous units (Command-phase pick of up to 3); buffs flow via the selfRighteous condition.
function isRighteous(u){return !!u&&isSororitasArmy(u.player)&&sororRighteous[u.player].includes(u.id);}
function toggleRighteous(uid){
  if(!isSororitasArmy(turn))return;
  const arr=sororRighteous[turn];const i=arr.indexOf(uid);
  if(i>=0)arr.splice(i,1);
  else{if(arr.length>=3){log("sys","Up to 3 units can be Righteous.");return;}arr.push(uid);}
  const u=units.find(x=>x.id===uid);if(u)log("sys",`${u.name} ${arr.includes(uid)?'is now Righteous':'is no longer Righteous'} (${arr.length}/3).`);
  renderAll();render();renderStratPanel();updateHint();
}
// ---- Astra Militarum: Voice of Command (Orders) ----
function isAstraArmy(p){const ar=armyRuleOf(p);return /astra militarum/i.test((FACTIONS[pFaction[p]]||{}).name||'')||/voice of command|born soldiers|artillery support|armoured fist|iron tread|masters of camouflage|only the best|ruthless discipline|ceaseless cannonade|squadron command/i.test((ar&&ar.name)||'');}
// The six core Orders (plus enhancement/detachment Orders abstracted). id -> {name, kind, apply}
const ORDERS=[
  {id:'mmm', name:'Move! Move! Move!',  desc:'+3" Move.'},
  {id:'bayonets', name:'Fix Bayonets!',  desc:'+1 WS (melee Hit).'},
  {id:'aim', name:'Take Aim!',  desc:'+1 BS (ranged Hit).'},
  {id:'firstrank', name:'First Rank, Fire!',  desc:'+1 Attack to Rapid Fire (ranged).'},
  {id:'cover', name:'Take Cover!',  desc:'+1 Save (max 3+).'},
  {id:'duty', name:'Duty and Honour!',  desc:'+1 Leadership and +1 Objective Control.'}
];
function orderName(id){const o=ORDERS.find(x=>x.id===id);return o?o.name:id;}
function isOfficer(u){return !!u&&(unitHasKw(u,'OFFICER')||/\bofficer\b/i.test(u.name||''));}
// Active Order on a unit (null if none or if the unit is Battle-shocked — Orders fall off shocked units).
function unitOrder(u){if(!u||u.bshock)return null;return unitOrders[u.player]&&unitOrders[u.player][u.id]||null;}
// Apply the persistent (non-combat) parts of an Order immediately: Move and OC bonuses ride on the unit.
function applyOrderPersistent(u){
  const id=unitOrder(u);if(!u)return;
  // recompute order-driven move/OC from scratch each time
  u._orderMove=0;u._orderOc=0;u._orderLd=0;
  if(id==='mmm')u._orderMove=3;
  if(id==='duty'){u._orderOc=1;u._orderLd=1;}
}
function issueOrder(officer,unitU,orderId){
  if(!isAstraArmy(turn)){log("sys","Only Astra Militarum can issue Orders.");return false;}
  if(!officer||!isOfficer(officer)){log("sys","Select an OFFICER to issue the Order.");return false;}
  if(!unitU||unitU.player!==turn||unitU.dead){log("sys","Pick a friendly unit to receive the Order.");return false;}
  if(unitU.bshock){log("sys",`${unitU.name} is Battle-shocked and cannot receive Orders.`);return false;}
  if(!unitHasKw(unitU,'ASTRA MILITARUM')){log("sys","Only ASTRA MILITARUM units benefit from Orders.");return false;}
  const R=orderRangeFor(turn);
  if(dist(officer,unitU)>R){log("sys",`${unitU.name} is out of command range (${R}").`);return false;}
  if(!ORDERS.find(o=>o.id===orderId)){log("sys","Unknown Order.");return false;}
  unitOrders[turn][unitU.id]=orderId;
  applyOrderPersistent(unitU);
  ordersIssued[turn]++;
  log("hd",`📣 ${officer.name} issues "${orderName(orderId)}" to ${unitU.name}.`);
  return true;
}
// Command range for Orders (6", or 12" with a Laud Hailer / Grizzled Company enhancement on the army).
function orderRangeFor(p){
  if(units.some(u=>u.player===p&&!u.dead&&(u.enh==='Laud Hailer')))return 12;
  return 6;
}
// Orders budget this Command phase: 1 per Officer, +1 each from Grand Strategist / Ruthless Discipline (Grizzled Company).
function orderBudgetFor(p){
  const officers=units.filter(u=>u.player===p&&!u.dead&&u.deployed&&isOfficer(u));
  let n=officers.length;   // each officer issues at least one (datasheet specifics abstracted)
  const det=detachOf(p);
  if(det&&/ruthless discipline/i.test((det.rule&&det.rule.name)||''))n+=officers.length;  // +1 per officer
  n+=units.filter(u=>u.player===p&&!u.dead&&u.enh==='Grand Strategist').length;
  return n;
}
// At the start of this player's Command phase, all Orders they issued last round expire; bonuses are cleared.
function clearOrders(p){
  Object.keys(unitOrders[p]).forEach(id=>{const u=units.find(x=>x.id===id);if(u){u._orderMove=0;u._orderOc=0;u._orderLd=0;}});
  unitOrders[p]={};ordersIssued[p]=0;
}
// Combat contribution of a unit's active Order (attacker side).
function orderCombatMods(u,isMelee,m){
  const id=unitOrder(u);if(!id)return;
  if(id==='bayonets'&&isMelee)m.addHit+=1;             // Fix Bayonets!: +1 WS
  if(id==='aim'&&!isMelee)m.addHit+=1;                 // Take Aim!: +1 BS
  if(id==='firstrank'&&!isMelee)m.plusAttacksRanged+=1; // First Rank, Fire!: +1 Attack (Rapid Fire abstracted to all ranged)
}
// Defensive contribution (Take Cover! improves the save → modelled as worsenSave -1, capped so it can't beat 3+).
function orderDefMods(u,m){
  const id=unitOrder(u);if(id==='cover'&&u){if(u.sv>3)m.worsenSave-=1;}  // +1 Save, but not better than 3+
}
// Auto-issue Orders for the AI/headless flow: each officer in range buffs a nearby eligible unit.
function autoIssueOrders(p){
  if(!isAstraArmy(p))return;
  let budget=orderBudgetFor(p);if(budget<=0)return;
  const R=orderRangeFor(p);
  const officers=units.filter(u=>u.player===p&&!u.dead&&u.deployed&&isOfficer(u));
  const targets=units.filter(u=>u.player===p&&!u.dead&&u.deployed&&!u.bshock&&unitHasKw(u,'ASTRA MILITARUM')&&!isOfficer(u));
  officers.forEach(of=>{
    const near=targets.filter(t=>dist(of,t)<=R&&!unitOrders[p][t.id]);
    near.sort((a,b)=>dist(of,a)-dist(of,b));
    let give=Math.max(1,Math.ceil(budget/Math.max(1,officers.length)));
    near.slice(0,give).forEach(t=>{
      if(budget<=0)return;
      // pick an order: shooty units get Take Aim!, melee-leaning get Fix Bayonets!, else Take Cover!
      const hasRanged=(t.ranged||[]).length>0;
      const oid=hasRanged?'aim':((t.melee||[]).some(w=>w.a>=3)?'bayonets':'cover');
      if(issueOrder(of,t,oid))budget--;
    });
  });
}
/* Plasmacyte (Necron Destroyer Cult — Skorpekh & Ophydian Destroyers): at the start of the battle a unit
   can have 1 Plasmacyte per 3 models. Each is a once-per-battle token: when the unit is selected to fight,
   spend one to give the unit's melee weapons [DEVASTATING WOUNDS] until end of phase. We grant the maximum
   (floor(models/3)) at battle start — the "can have" cap — which the muster screen can later make a choice. */
function unitHasPlasmacyte(u){
  return (u.abilities||[]).some(a=>/plasmacyte/i.test(a.name||''));
}
/* Aircraft deploy into Reserves: at battle start, any non-Hover AIRCRAFT unit must start in Strategic
   Reserves (then arrives via the normal reinforcement path). Hover-mode aircraft are excluded (they lost
   the AIRCRAFT keyword and deploy normally). _reserveRound is stamped 0 by reserveUnit so they are subject
   to the standard end-of-R3 destruction unless they have arrived. */
function reserveAircraft(p){
  units.forEach(u=>{ if(u.player!==p||u.dead)return;
    if(isAircraft(u) && u.deployed && !u.inReserve){ reserveUnit(u,true); log("sys",`${u.name} (Aircraft) begins in Reserves.`); }
  });
}
function grantPlasmacytes(p){
  units.forEach(u=>{ if(u.player!==p||u.dead)return;
    if(unitHasPlasmacyte(u)){ u._plasmacytes=Math.floor(Math.max(1,u.models)/3);
      if(u._plasmacytes>0)log("sys",`${u.name} has ${u._plasmacytes} Plasmacyte${u._plasmacytes>1?'s':''}.`); }
  });
}
function grantBattleFocus(p){
  // Start of battle round: refresh the Battle Focus pool (unspent tokens are lost). +1 for Warhost's
  // Martial Grace, +1 if a Timeless Strategist enhancement is present on the army.
  if(!isAsuryaniArmy(p)){battleFocus[p]=0;return;}
  let n=battleFocusBase();
  const det=detachOf(p);
  if(det&&/martial grace/i.test((det.rule&&det.rule.name)||''))n+=1;
  if(units.some(u=>u.player===p&&!u.dead&&u.enh==='Timeless Strategist'))n+=1;
  battleFocus[p]=n;
  log("sys",`${PNAME[p]} receives ${n} Battle Focus token${n!==1?'s':''} this round.`);
}
function spendBattleFocus(kind){
  // Spend one Battle Focus token to perform an Agile Manoeuvre on the selected unit (or army-wide note).
  if(!isAsuryaniArmy(turn)||battleFocus[turn]<=0)return;
  const u=units.find(x=>x.id===selId&&x.player===turn&&!x.dead);
  battleFocus[turn]--;
  const grace=detachOf(turn)&&/martial grace/i.test((detachOf(turn).rule&&detachOf(turn).rule.name)||'');
  if(kind==='swift'){const bonus=grace?3:2;if(u){u._bfMove=(u._bfMove||0)+bonus;}log("sys",`Swift as the Wind: +${bonus}" Move${u?` to ${u.name}`:''} (token spent).`);}
  else if(kind==='star'){if(u)u._bfAssault=true;log("sys",`Star Engines: ${u?u.name+"'s":'unit\u2019s'} ranged weapons gain [ASSAULT] (token spent).`);}
  else if(kind==='sudden'){if(u)u._bfSudden=true;log("sys",`Sudden Strike: bigger Pile-in/Consolidate${u?` for ${u.name}`:''} (token spent).`);}
  else if(kind==='fade'){const d=d6()+(grace?1:0)+1;log("sys",`Fade Back / reposition: up to ${d}" Normal move${u?` for ${u.name}`:''} (token spent).`);if(u){u._bfMove=(u._bfMove||0)+d;}}
  else if(kind==='flit'){log("sys",`Flitting Shadows: no Overwatch against ${u?u.name:'the unit'} this turn (token spent).`);}
  renderAll();render();renderStratPanel();updateHint();
}
function unitIsObserverCapable(u){
  // For the Greater Good ability: model the army-wide ability as available to all T'au EMPIRE units
  // (excluding battle-shocked); MARKER DRONE / MARKERLIGHT units additionally grant Ignores Cover.
  return !!u&&!u.dead&&u.deployed&&!u.bshock&&!inER(u)&&isTauArmy(u.player);
}
function doMarkerlights(){
  // T'au For the Greater Good: each eligible unit acts as an Observer, marking the closest visible
  // enemy as Spotted. MARKERLIGHT observers add the cover-ignoring flag. Resets each Shooting phase.
  if(!isTauArmy(turn)||PHASES[phaseIdx]!=='Shooting')return;
  spotted[turn]=[];spottedML[turn]=[];
  const ep=turn===1?2:1;
  const enemies=units.filter(u=>u.player===ep&&!u.dead&&u.deployed);
  if(!enemies.length){log("sys","No enemy units to mark.");return;}
  const observers=units.filter(u=>u.player===turn&&unitIsObserverCapable(u));
  let marks=0;
  observers.forEach(o=>{
    // closest enemy to this observer that isn't already spotted (each enemy markable once)
    const avail=enemies.filter(e=>!spotted[turn].includes(e.id));
    const pool=avail.length?avail:enemies;
    let best=null,bd=1e9;pool.forEach(e=>{const d=dist(o,e);if(d<bd){bd=d;best=e;}});
    if(best&&!spotted[turn].includes(best.id)){
      spotted[turn].push(best.id);
      if(unitHasKw(o,'MARKERLIGHT'))spottedML[turn].push(best.id);
      marks++;
    }
  });
  log("hd",`◎ ${PNAME[turn].toUpperCase()} MARKS ${marks} TARGET${marks!==1?'S':''} (markerlights)`);
  log("sys","Guided units gain +1 to hit (BS) vs Spotted targets; markerlight-spotted also ignore cover.");
  renderAll();render();renderStratPanel();updateHint();
}
function detachUsesSaga(det){
  if(!det)return false;
  const scan=arr=>(arr||[]).some(fx=>fx&&typeof fx.cond==='string'&&fx.cond.includes('sagaCompleted'));
  if(det.rule&&scan(det.rule.fx))return true;
  if(det.doctrines&&det.doctrines.some(d=>scan(d.fx)))return true;
  return false;
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
      tg=tg.filter(e=>!unitIsLoneOp(e)||dist(a.u,e)<=12);   // Lone Operative: only targetable from within 12"
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
    const src=doctrineSource(turn);
    const title=src?src.label.toUpperCase():'DOCTRINE';
    h=`<div class="apTitle">${title} — ${PSHORT[turn]}</div><div class="apSub">Select a ${src?src.label.toLowerCase():'doctrine'}</div><div class="apTargets">`;
    (src?src.list:[]).forEach(d=>{const used=usedDoctrines[turn].includes(d.id);
      h+=`<button class="apTgt${used?' used':''}" data-doc="${d.id}">${d.name}${used?' (used)':''} <span>${d.desc}</span></button>`;});
    h+=`</div><button class="btn apCancel" id="apCancelBtn">Skip</button>`;
  }else if(a.kind==='stratTarget'){
    const s=a.s;const eligible=units.filter(u=>u.player===turn&&!u.dead);
    h=`<div class="apTitle">✦ ${s.name} (${s.cp}CP)</div><p class="apNote">${s.desc}</p><div class="apSub">Choose target unit</div><div class="apTargets">`;
    eligible.forEach(t=>{h+=`<button class="apTgt" data-strat="${t.id}">${t.name}</button>`;});
    h+=`</div><button class="btn apCancel" id="apCancelBtn">Cancel</button>`;
  }else if(a.kind==='deepstrike'){
    const u=units.find(x=>x.id===a.queue[a.i]);
    const left=a.queue.length-a.i;
    h=`<div class="apTitle">↯ DEEP STRIKE — ${u?u.name:''}</div>
       <p class="apNote">Click a cell more than 9″ from all enemy units to set up this unit. ${left} unit${left>1?'s':''} left in reserve.</p>
       <button class="btn apCancel" id="apSkipDsBtn">Skip remaining (stay in Reserves)</button>`;
  }
  host.innerHTML=h;
  // wire
  host.querySelectorAll('.apWpn').forEach(b=>b.onclick=()=>shootPickWeapon(+b.dataset.w));
  host.querySelectorAll('[data-oath]').forEach(b=>b.onclick=()=>chooseOath(b.dataset.oath));
  host.querySelectorAll('[data-doc]').forEach(b=>b.onclick=()=>chooseDoctrine(b.dataset.doc));
  host.querySelectorAll('[data-strat]').forEach(b=>b.onclick=()=>{const u=units.find(x=>x.id===b.dataset.strat);commitStratagem(turn,action.s,u);});
  host.querySelectorAll('.apTgt').forEach(b=>{if(b.dataset.oath||b.dataset.doc||b.dataset.strat)return;b.onclick=()=>{const t=units.find(u=>u.id===b.dataset.t);
    if(a.kind==='shoot')shootPickTarget(t);else if(a.kind==='charge')chargePickTarget(t);else if(a.kind==='fight')fightPickTarget(t);};});
  const dsb=$('apSkipDsBtn');if(dsb)dsb.onclick=()=>{action=null;showActionPanel(false);updateHint("Reserves held back.");renderAll();render();renderStratPanel();};
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
  d.className='unit p'+u.player+(u.id===selId?' sel':'')+(u.dead?' dead':'')+(acted?' acted':'')+(u.inReserve?' reserve':'');
  const frac=u.dead?0:totalWounds(u)/maxWounds(u);
  d.innerHTML=`<div class="uhead"><b>${u.name}</b>${u.bshock?'<span class="bshock">shock</span>':''}${u.inReserve?'<span class="bshock" style="background:#10314e;color:#7fd0ff">reserve</span>':''}
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
  const abMap=(typeof ABILITY_FX!=='undefined'&&u.tpl)?ABILITY_FX[u.tpl]:null;
  const coreMap=(typeof CORE_FX!=='undefined')?CORE_FX:null;
  const abApplied=a=>{
    const dm=abMap&&abMap[normAbil(a.name)];
    if(dm&&dm.some(f=>f.k!=='note'))return true;
    if((a.type||'')==='Core'&&coreMap){const cf=coreMap[normAbil(a.name)];if(cf&&cf.some(f=>f.k!=='note'))return true;}
    return normAbil(a.name)==='loneoperative';   // enforced in engine code, not as an fx
  };
  const abrow=a=>{const applied=abApplied(a);return `<div class="abRow"><b>${a.name}</b> <span class="abType">${a.type}</span>${applied?' <span class="abType" style="background:#3a2d4d;color:#caa">✦ engine</span>':''}<div class="abDesc">${a.desc||''}</div></div>`;};
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
  if(action&&action.kind==='deepstrike'){
    const u=units.find(x=>x.id===action.queue[action.i]);
    if(u&&deepStrikePlace(u,hx,hy)){
      action.i++;
      if(action.i>=action.queue.length){action=null;showActionPanel(false);updateHint("All reserves placed.");}
      else renderAction();
      renderAll();render();
    }
    return;
  }
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
  cv.addEventListener('mousemove',e=>{
    const r=cv.getBoundingClientRect();
    const fx=(e.clientX-r.left)/(r.width/GW),fy=(e.clientY-r.top)/(r.height/GH);
    const hx=Math.floor(fx),hy=Math.floor(fy);
    if(hx!==hoverHx||hy!==hoverHy){hoverHx=hx;hoverHy=hy;if(typeof render==='function')render();}
  });
  cv.addEventListener('mouseleave',()=>{hoverHx=-1;hoverHy=-1;if(typeof render==='function')render();});

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
function autoPlaceReserves(p){
  reservesOf(p).forEach(u=>{
    // try to place near the nearest enemy but >9", scanning the board
    let placed=false;
    const foes=units.filter(e=>!e.dead&&e.deployed&&e.player!==p);
    let best=null,bestD=Infinity;
    for(let x=0;x<GW&&!placed;x++)for(let y=0;y<GH;y++){
      if(cellOccupied(x,y))continue;
      const tooClose=foes.some(e=>Math.hypot(e.hx-x,e.hy-y)*HEX_INCH<9);
      if(tooClose)continue;
      // prefer cells closest to an objective, else to centre
      const ref=objectives.length?objectives.reduce((a,o)=>{const d=Math.hypot(o.hx-x,o.hy-y);return d<a.d?{d,o}:a;},{d:Infinity}).d:Math.hypot(GW/2-x,GH/2-y);
      if(ref<bestD){bestD=ref;best={x,y};}
    }
    if(best){deepStrikePlace(u,best.x,best.y);placed=true;}
  });
}
function autoResolvePhase(){
  if(deploying||placingTerrain)return;
  // auto-place any Deep Strike reserves at a valid cell (>9" from enemies), else hold them back
  if(action&&action.kind==='deepstrike'){
    autoPlaceReserves(action.p);
    action=null;showActionPanel(false);
  }
  const ph=PHASES[phaseIdx];
  if(ph==="Movement"){
    units.filter(u=>u.player===turn&&!u.dead).forEach(u=>{
      // Aircraft: must make a >=20" forward pass (within 90 deg of heading) or go to Strategic Reserves (returns next turn).
      if(isAircraft(u)){
        let best=null,bestScore=-1;
        const reach=Math.max(stepFromInch(AIRCRAFT_MIN_MOVE), stepFromInch(u.m+8));
        for(let dx=-reach;dx<=reach;dx++)for(let dy=-reach;dy<=reach;dy++){
          const nx=u.hx+dx,ny=u.hy+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;
          const dInch=Math.hypot(dx,dy)*HEX_INCH; if(dInch<AIRCRAFT_MIN_MOVE)continue;
          if(u.facing!=null && !withinArc(u,nx,ny,90))continue;
          if(cellOccupied(nx,ny,u.id))continue;if(segBlocked(u.hx,u.hy,nx,ny))continue;
          if(units.some(e=>!e.dead&&e.player!==u.player&&Math.hypot(e.hx-nx,e.hy-ny)*HEX_INCH<=ENGAGE_IN))continue;
          const foe=units.filter(e=>!e.dead&&e.player!==u.player).sort((a,b)=>Math.hypot(a.hx-nx,a.hy-ny)-Math.hypot(b.hx-nx,b.hy-ny))[0];
          const score=foe? -Math.hypot(foe.hx-nx,foe.hy-ny) : dInch;
          if(score>bestScore){bestScore=score;best={nx,ny};}
        }
        if(best){const _fx=u.hx,_fy=u.hy;u.hx=best.nx;u.hy=best.ny;u.moved=true;syncModelPos(u);setFacingFromMove(u,_fx,_fy,best.nx,best.ny);log("sys",`${u.name} (Aircraft) makes a pass.`);}
        else{reserveUnit(u);log("sys",`${u.name} (Aircraft) leaves the table edge - into Strategic Reserves.`);}
        return;
      }
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
      if(best){u.hx=best.nx;u.hy=best.ny;u.moved=true;syncModelPos(u);}
    });
    operateHatchways();
    advancePhase();return;
  }
  if(ph==="Shooting"){
    if(isTauArmy(turn))doMarkerlights();   // T'au: auto-mark Spotted targets before shooting
    units.filter(u=>u.player===turn&&!u.dead&&!u.fellback).forEach(u=>{
      const er=inER(u);
      u.ranged.forEach((w,i)=>{if(u.advanced&&!w.ab.assault)return;if(er&&!w.ab.pistol)return;
        let tg=units.filter(e=>!e.dead&&e.player!==turn&&dist(u,e)<=w.rng&&visible(u,e));if(er)tg=tg.filter(e=>engaged(u,e));
        tg=tg.filter(e=>!unitIsLoneOp(e)||dist(u,e)<=12);   // Lone Operative: only targetable from within 12"
        if(!tg.length)return;tg.sort((a,b)=>dist(u,a)-dist(u,b));resolveAttacks(u,tg[0],w,u.models,false);});});
  }else if(ph==="Charge"){
    units.filter(u=>u.player===turn&&!u.dead&&!u.advanced&&!u.fellback&&!inER(u)).forEach(u=>{
      const tg=units.filter(e=>!e.dead&&e.player!==turn&&dist(u,e)<=12&&!segBlocked(u.hx,u.hy,e.hx,e.hy));if(!tg.length)return;
      tg.sort((a,b)=>dist(u,a)-dist(u,b));const need=Math.max(0,dist(u,tg[0])-ENGAGE_IN);const roll=d6()+d6();
      log("",`${u.name} charges ${tg[0].name}: 2D6=<b>${roll}″</b> (need ${need.toFixed(1)}″)`);
      if(roll>=need){moveAdjacent(u,tg[0]);u.charged=true;log("save","&nbsp;&nbsp;Success.");}else log("miss","&nbsp;&nbsp;Failed.");});
  }else if(ph==="Fight"){
    // Two-step Fight phase per the Core Rules. Step 1 (Fights First): units that made a Charge move OR have the
    // Fights First ability. Step 2 (Remaining Combats): everyone else. In each step players ALTERNATE selecting an
    // eligible unit, starting with the player whose turn is NOT taking place. Eligibility is re-checked as units die.
    const nonActive=turn===1?2:1;
    function fightStep(filterFn){
      let starter=nonActive;
      let guard=0;
      while(guard++<200){
        // units still eligible this step: alive, in Engagement Range (or charged), haven't fought, and match the step filter
        const elig=units.filter(u=>!u.dead&&!u.fought&&(inER(u)||u.charged)&&u.melee.length&&filterFn(u));
        if(!elig.length)break;
        // pick the starter player's unit if any remain eligible; otherwise the other player's
        let pick=elig.find(u=>u.player===starter) || elig.find(u=>u.player!==starter);
        if(!pick)break;
        pileInMove(pick);                                   // 1. Pile In (3" toward closest enemy)
        // 2. Make melee attacks — split the unit's models across the enemies they are individually engaged with.
        const split=meleeTargetSplit(pick);
        split.sort((a,b)=>dist(pick,a.enemy)-dist(pick,b.enemy));   // resolve closest target first (stable order)
        // Plasmacyte: when selected to fight, spend one token (once per battle each) to give this unit's
        // melee weapons [DEVASTATING WOUNDS] until end of phase. Engine consumes a token and flags melee.
        let _plasmaFlagged=null;
        if(pick._plasmacytes>0){
          pick._plasmacytes--;
          _plasmaFlagged=(pick.melee||[]).filter(w=>!(w.ab&&w.ab.devastating));
          _plasmaFlagged.forEach(w=>{w.ab=w.ab||{};w.ab.devastating=true;});
          log("sys",`${pick.name} injects a Plasmacyte — melee weapons gain Devastating Wounds (${pick._plasmacytes} left).`);
        }
        for(const part of split){ if(pick.dead)break; if(part.enemy.dead)continue;
          resolveAttacks(pick,part.enemy,pick.melee[0],part.nModels,false); }
        if(_plasmaFlagged)_plasmaFlagged.forEach(w=>{delete w.ab.devastating;});   // buff lasts the phase; restore weapon template after this unit's fight
        pick.fought=true;
        if(!pick.dead)consolidateMove(pick);                // 3. Consolidate (toward enemy, else objective)
        starter=starter===1?2:1;   // alternate
      }
    }
    fightStep(u=>unitFightsFirst(u));    // Step 1: Fights First (chargers + ability)
    fightStep(u=>!unitFightsFirst(u));   // Step 2: Remaining Combats
  }
  advancePhase();
}
