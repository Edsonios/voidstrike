/* =====================================================================
   VOIDSTRIKE — DETACHMENT DATA
   ---------------------------------------------------------------------
   Generic, faction-agnostic schema. Each faction is a key in DETACHMENT_DATA.
   The engine (detach-engine in app.js) reads the structured "fx" effect codes;
   the prose here is short, mechanical, and written for the simulator — it is
   NOT the publisher's flavour text.

   SCHEMA per faction:
   {
     armyRule: { name, desc, fx:[...] },          // always-on / command-phase army rule
     restrictions: [ "short text", ... ],          // shown in muster, not auto-enforced unless coded
     detachments: {
       "Detachment Name": {
         rule:  { name, desc, fx:[...] },          // detachment rule (doctrines live in fx)
         doctrines: [ { id, name, desc, fx:[...] } ],   // optional: selectable command-phase states
         enhancements: [ { name, pts, restrict, desc, fx:[...] } ],
         stratagems: [ {
            name, cp, type,            // type: Battle Tactic / Strategic Ploy / Epic Deed / Wargear
            when,                      // timing window code (see WHENS in app.js)
            targetSelf,                // true if targets one of YOUR units
            desc,                      // short mechanical description
            fx:[...]                   // effect codes applied while active
         } ]
       }
     }
   }

   EFFECT CODE vocabulary (fx entries are {k:'CODE', ...params}):
     {k:'rerollHit', val:1|'all'}             re-roll hit rolls (1 = re-roll 1s)
     {k:'rerollWound', val:1|'all'}           re-roll wound rolls
     {k:'rerollDamage', val:1|'all'}
     {k:'rerollAdvance'} {k:'rerollCharge'}
     {k:'addWound', n}                        +n to Wound roll
     {k:'addHit', n}                          +n to Hit roll
     {k:'plusAttacksMelee', n} {k:'plusStrMelee', n} {k:'plusApMelee', n}
     {k:'grant', ab:'sustained'|'lethal'|'devastating'|'lance'|'ignorescover'|'assault'|'heavy'|'precision', val?}
     {k:'worsenIncomingAP', n}                incoming attacks' AP worsened by n (defensive)
     {k:'reduceIncomingDmg', n}               -n damage per attack (defensive)
     {k:'fnp', val}                           Feel No Pain val+
     {k:'invuln', val}                        invulnerable save val+
     {k:'saveTo', val}                        set Save characteristic
     {k:'subIncomingHit', n} {k:'subIncomingWound', n}   incoming attacks suffer -n (defensive)
     {k:'eligChargeAfterAdvance'} {k:'eligChargeAfterFallBack'}
     {k:'eligShootAfterAdvance'} {k:'eligShootAfterFallBack'}
     {k:'objControl', n}                      +n OC
     {k:'extraMove', dice}                    e.g. 'D6','6','D3+3'
     {k:'mortalNearObjective'} ... (narrative; shown, limited auto-apply)
     {k:'antiVal', kw, val}                   grant ANTI-kw val+
   Conditions on fx: optional `cond` field, e.g. cond:'within12' | 'remainedStationary'
     | 'doctrine:assault' | 'targetBelowStrength' | 'targetMonsterVehicle' | 'inTerrain'
     | 'unitBattleline' | 'targetWithinObjective'
   Scope: optional `scope`: 'army'(default for rules) | 'unit'(stratagem/enh target) | 'self'
   ===================================================================== */
const DETACHMENT_DATA = {
  "Space Marines": {
    armyRule: {
      name: "Oath of Moment",
      desc: "Command phase: name one enemy unit as your Oath target. Your attacks targeting it may re-roll the Hit roll (and Wound roll too, if your Codex army has no Black Templars/Blood Angels/Dark Angels/Deathwatch/Space Wolves units).",
      fx: [
        { k: 'rerollHit', val: 'all', cond: 'targetIsOath', scope: 'army' },
        { k: 'rerollWound', val: 'all', cond: 'targetIsOath+codexPure', scope: 'army' }
      ]
    },
    restrictions: [
      "One Chapter only: you cannot mix units from two different Chapters.",
      "Black Templars army: no ADEPTUS ASTARTES PSYKER models; some vehicles must have the Black Templars keyword.",
      "Deathwatch army: cannot include Devastator/Scout/Tactical Squad.",
      "Space Wolves army: cannot include Apothecary/Devastator/Tactical Squad."
    ],
    detachments: {
      "Gladius Task Force": {
        rule: {
          name: "Combat Doctrines",
          desc: "Command phase: select one Combat Doctrine (each once per battle). It applies to all your ADEPTUS ASTARTES units until your next Command phase.",
          fx: []
        },
        doctrines: [
          { id: 'devastator', name: "Devastator Doctrine", desc: "Eligible to shoot in a turn it Advanced.", fx: [{ k: 'eligShootAfterAdvance', scope: 'army' }] },
          { id: 'tactical', name: "Tactical Doctrine", desc: "Eligible to shoot and charge in a turn it Fell Back.", fx: [{ k: 'eligShootAfterFallBack', scope: 'army' }, { k: 'eligChargeAfterFallBack', scope: 'army' }] },
          { id: 'assault', name: "Assault Doctrine", desc: "Eligible to charge in a turn it Advanced.", fx: [{ k: 'eligChargeAfterAdvance', scope: 'army' }] }
        ],
        enhancements: [
          { name: "Artificer Armour", pts: 10, restrict: "ADEPTUS ASTARTES", desc: "Save 2+ and Feel No Pain 5+.", fx: [{ k: 'saveTo', val: 2 }, { k: 'fnp', val: 5 }] },
          { name: "The Honour Vehement", pts: 15, restrict: "ADEPTUS ASTARTES", desc: "+1 A & S to melee (+2 instead under Assault Doctrine).", fx: [{ k: 'plusAttacksMelee', n: 1 }, { k: 'plusStrMelee', n: 1 }, { k: 'plusAttacksMelee', n: 1, cond: 'doctrine:assault' }, { k: 'plusStrMelee', n: 1, cond: 'doctrine:assault' }] },
          { name: "Adept of the Codex", pts: 20, restrict: "CAPTAIN", desc: "Command phase: may give the bearer's unit the Tactical Doctrine even if already used army-wide.", fx: [] },
          { name: "Fire Discipline", pts: 25, restrict: "ADEPTUS ASTARTES", desc: "Bearer's unit ranged weapons gain [SUSTAINED HITS 1]; re-roll Advances under Devastator Doctrine.", fx: [{ k: 'grant', ab: 'sustained', val: 1 }, { k: 'rerollAdvance', cond: 'doctrine:devastator' }] }
        ],
        stratagems: [
          { name: "Armour of Contempt", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Worsen incoming attacks' AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Only in Death Does Duty End", cp: 2, type: "Epic Deed", when: 'fightTargeted', targetSelf: true, desc: "Destroyed models still get to fight before removal.", fx: [{ k: 'fightOnDeath' }] },
          { name: "Honour the Chapter", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Melee gain [LANCE] (and +1 AP under Assault Doctrine).", fx: [{ k: 'grant', ab: 'lance' }, { k: 'plusApMelee', n: 1, cond: 'doctrine:assault' }] },
          { name: "Adaptive Strategy", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Set one unit's active Doctrine independently.", fx: [{ k: 'pickDoctrineUnit' }] },
          { name: "Storm of Fire", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Ranged gain [IGNORES COVER] (+1 AP under Devastator).", fx: [{ k: 'grant', ab: 'ignorescover' }, { k: 'plusApRanged', n: 1, cond: 'doctrine:devastator' }] },
          { name: "Squad Tactics", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Make a D6\" Normal move (6\" under Tactical Doctrine).", fx: [{ k: 'extraMove', dice: 'D6' }] }
        ]
      },
      "Anvil Siege Force": {
        rule: {
          name: "Shield of the Imperium",
          desc: "Your ranged weapons gain [HEAVY]; if a weapon already has [HEAVY] and the unit Remained Stationary, +1 to Wound.",
          fx: [{ k: 'grant', ab: 'heavy', scope: 'army' }, { k: 'addWound', n: 1, cond: 'remainedStationary+alreadyHeavy', scope: 'army' }]
        },
        enhancements: [
          { name: "Indomitable Fury", pts: 20, restrict: "GRAVIS", desc: "First destroyed: on 2+ return with full wounds.", fx: [{ k: 'resurrect', val: 2 }] },
          { name: "Fleet Commander", pts: 15, restrict: "CAPTAIN", desc: "Once: line bombardment, D3 mortals to units under a drawn line.", fx: [] },
          { name: "Stoic Defender", pts: 15, restrict: "ADEPTUS ASTARTES", desc: "Unit gains FNP 6+ near an objective; halve OC (not 0) while Battle-shocked.", fx: [{ k: 'fnp', val: 6, cond: 'nearObjective' }] },
          { name: "Architect of War", pts: 25, restrict: "ADEPTUS ASTARTES", desc: "Bearer's unit ranged weapons gain [IGNORES COVER].", fx: [{ k: 'grant', ab: 'ignorescover' }] }
        ],
        stratagems: [
          { name: "Armour of Contempt", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Worsen incoming attacks' AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Rigid Discipline", cp: 1, type: "Strategic Ploy", when: 'fightEnd', targetSelf: true, desc: "Fall Back up to 6\" (must end in your DZ or on an objective).", fx: [{ k: 'extraMove', dice: '6' }] },
          { name: "Not One Backwards Step", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Double OC but must Remain Stationary.", fx: [{ k: 'objControlMult', n: 2 }] },
          { name: "No Threat Too Great", cp: 2, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Re-roll Wounds vs MONSTER/VEHICLE.", fx: [{ k: 'rerollWound', val: 'all', cond: 'targetMonsterVehicle' }] },
          { name: "Battle Drill Recall", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Ranged gain [SUSTAINED HITS 1]; crit on 5+ if Remained Stationary.", fx: [{ k: 'grant', ab: 'sustained', val: 1 }, { k: 'critOn', val: 5, cond: 'remainedStationary' }] },
          { name: "Hail of Vengeance", cp: 2, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Shoot back at the attacker.", fx: [{ k: 'shootBack' }] }
        ]
      },
      "Ironstorm Spearhead": {
        rule: {
          name: "Armoured Wrath",
          desc: "Once per phase for each of your units, re-roll one Hit, Wound or Damage roll.",
          fx: [{ k: 'rerollOnePerPhase', scope: 'army' }]
        },
        enhancements: [
          { name: "Target Augury Web", pts: 30, restrict: "TECHMARINE", desc: "Command phase: a nearby VEHICLE gains [LETHAL HITS].", fx: [] },
          { name: "The Flesh is Weak", pts: 10, restrict: "ADEPTUS ASTARTES", desc: "Feel No Pain 4+.", fx: [{ k: 'fnp', val: 4 }] },
          { name: "Adept of the Omnissiah", pts: 35, restrict: "TECHMARINE", desc: "Once/round: a nearby VEHICLE's failed save → 0 damage.", fx: [] },
          { name: "Master of Machine War", pts: 20, restrict: "ADEPTUS ASTARTES", desc: "Command phase: a nearby VEHICLE may shoot after Falling Back/Advancing.", fx: [] }
        ],
        stratagems: [
          { name: "Unbowed Conviction", cp: 1, type: "Battle Tactic", when: 'command', targetSelf: true, desc: "Ignore modifiers to characteristics/rolls (not saves).", fx: [{ k: 'ignoreModifiers' }] },
          { name: "Armour of Contempt", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Worsen incoming attacks' AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Mercy is Weakness", cp: 2, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "[SUSTAINED HITS 1] vs targets below Starting Strength.", fx: [{ k: 'grant', ab: 'sustained', val: 1, cond: 'targetBelowStrength' }] },
          { name: "Vengeful Animus", cp: 1, type: "Epic Deed", when: 'vehicleDestroyed', targetSelf: true, desc: "Deadly Demise auto-inflicts mortals.", fx: [] },
          { name: "Ancient Fury", cp: 1, type: "Epic Deed", when: 'command', targetSelf: true, desc: "WALKER: +1 M/T/Ld/OC and +1 to Hit.", fx: [{ k: 'addHit', n: 1 }, { k: 'objControl', n: 1 }] },
          { name: "Power of the Machine Spirit", cp: 1, type: "Epic Deed", when: 'oppShootResolved', targetSelf: true, desc: "VEHICLE shoots back at the attacker.", fx: [{ k: 'shootBack' }] }
        ]
      },
      "Firestorm Assault Force": {
        rule: {
          name: "Close-range Eradication",
          desc: "Your ranged weapons gain [ASSAULT]; +1 Strength on attacks targeting a unit within 12\".",
          fx: [{ k: 'grant', ab: 'assault', scope: 'army' }, { k: 'plusStrRanged', n: 1, cond: 'within12', scope: 'army' }]
        },
        enhancements: [
          { name: "Champion of Humanity", pts: 10, restrict: "TACTICUS", desc: "Unit ignores modifiers to characteristics/rolls (not saves).", fx: [{ k: 'ignoreModifiers' }] },
          { name: "War-tempered Artifice", pts: 25, restrict: "ADEPTUS ASTARTES INFANTRY", desc: "+3 Strength to bearer's melee.", fx: [{ k: 'plusStrMelee', n: 3, selfOnly: true }] },
          { name: "Forged in Battle", pts: 15, restrict: "ADEPTUS ASTARTES", desc: "Once/turn change a Hit or save to a 6.", fx: [] },
          { name: "Adamantine Mantle", pts: 20, restrict: "ADEPTUS ASTARTES", desc: "-1 Damage to attacks on bearer (Melta/Torrent → D1).", fx: [{ k: 'reduceIncomingDmg', n: 1, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Armour of Contempt", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Worsen incoming attacks' AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Crucible of Battle", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "+1 to Wound vs the closest target within 6\".", fx: [{ k: 'addWound', n: 1, cond: 'closestWithin6' }] },
          { name: "Rapid Embarkation", cp: 1, type: "Strategic Ploy", when: 'fightEnd', targetSelf: true, desc: "Embark a nearby INFANTRY unit.", fx: [] },
          { name: "Immolation Protocols", cp: 2, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Torrent weapons gain [DEVASTATING WOUNDS].", fx: [{ k: 'grant', ab: 'devastating', cond: 'torrentOnly' }] },
          { name: "Onslaught of Fire", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "+1 Hit vs closest within 12\" (disembarked unit).", fx: [{ k: 'addHit', n: 1, cond: 'closestWithin12' }] },
          { name: "Burning Vengeance", cp: 1, type: "Battle Tactic", when: 'oppShootResolved', targetSelf: true, desc: "Embarked unit disembarks and shoots the attacker.", fx: [{ k: 'shootBack' }] }
        ]
      },
      "Stormlance Task Force": {
        rule: {
          name: "Lightning Assault",
          desc: "Your units are eligible to charge in a turn they Advanced or Fell Back.",
          fx: [{ k: 'eligChargeAfterAdvance', scope: 'army' }, { k: 'eligChargeAfterFallBack', scope: 'army' }]
        },
        enhancements: [
          { name: "Fury of the Storm", pts: 25, restrict: "ADEPTUS ASTARTES MOUNTED", desc: "+1 S/AP melee (+2 after a Charge move).", fx: [{ k: 'plusStrMelee', n: 1 }, { k: 'plusApMelee', n: 1 }] },
          { name: "Portents of Wisdom", pts: 15, restrict: "ADEPTUS ASTARTES", desc: "Re-roll Advances for the unit.", fx: [{ k: 'rerollAdvance' }] },
          { name: "Feinting Withdrawal", pts: 10, restrict: "ADEPTUS ASTARTES", desc: "Unit eligible to shoot in a turn it Fell Back.", fx: [{ k: 'eligShootAfterFallBack' }] },
          { name: "Hunter's Instincts", pts: 25, restrict: "ADEPTUS ASTARTES MOUNTED", desc: "Arrives from Reserves one round earlier.", fx: [] }
        ],
        stratagems: [
          { name: "Armour of Contempt", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Worsen incoming attacks' AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Blitzing Fusillade", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Ranged gain [ASSAULT] (or [SUSTAINED HITS 1] if already Assault).", fx: [{ k: 'grant', ab: 'assault' }, { k: 'grant', ab: 'sustained', val: 1, cond: 'alreadyAssault' }] },
          { name: "Full Throttle", cp: 2, type: "Wargear", when: 'movement', targetSelf: true, desc: "Auto-Advance +6\" (+9\" Mounted).", fx: [{ k: 'extraMove', dice: '6' }] },
          { name: "Shock Assault", cp: 1, type: "Battle Tactic", when: 'charge', targetSelf: true, desc: "Re-roll Charge; melee gain [LANCE].", fx: [{ k: 'rerollCharge' }, { k: 'grant', ab: 'lance' }] },
          { name: "Ride Hard, Ride Fast", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Incoming attacks suffer -1 Hit and -1 Wound.", fx: [{ k: 'subIncomingHit', n: 1 }, { k: 'subIncomingWound', n: 1 }] },
          { name: "Wind-swift Evasion", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Make a 6\" Normal move.", fx: [{ k: 'extraMove', dice: '6' }] }
        ]
      },
      "Vanguard Spearhead": {
        rule: {
          name: "Shadow Masters",
          desc: "Ranged attacks against your units from beyond 12\" suffer -1 to Hit and the target has Benefit of Cover.",
          fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12', scope: 'army' }, { k: 'grantCoverDef', cond: 'attackerBeyond12', scope: 'army' }]
        },
        enhancements: [
          { name: "The Blade Driven Deep", pts: 25, restrict: "ADEPTUS ASTARTES INFANTRY", desc: "Unit gains Infiltrators.", fx: [] },
          { name: "Ghostweave Cloak", pts: 15, restrict: "ADEPTUS ASTARTES", desc: "Bearer gains Stealth and Lone Operative.", fx: [{ k: 'subIncomingHit', n: 1, selfOnly: true }] },
          { name: "Execute and Redeploy", pts: 20, restrict: "PHOBOS", desc: "After shooting, may make a 6\" Normal move (then can't charge).", fx: [] },
          { name: "Shadow War Veteran", pts: 30, restrict: "PHOBOS", desc: "Aura: enemy Stratagems on units within 12\" cost +1CP.", fx: [{ k: 'enemyStratTax', val: 1 }] }
        ],
        stratagems: [
          { name: "A Deadly Prize", cp: 1, type: "Wargear", when: 'command', targetSelf: true, desc: "Sabotage an objective: enemies near it risk D3 mortals.", fx: [] },
          { name: "Armour of Contempt", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Worsen incoming attacks' AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Surgical Strikes", cp: 2, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Melee gain [PRECISION].", fx: [{ k: 'grant', ab: 'precision' }] },
          { name: "Strike from the Shadows", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "+1 BS & AP vs targets beyond 12\".", fx: [{ k: 'addHit', n: 1, cond: 'targetBeyond12' }, { k: 'plusApRanged', n: 1, cond: 'targetBeyond12' }] },
          { name: "Calculated Feint", cp: 1, type: "Strategic Ploy", when: 'oppCharge', targetSelf: true, desc: "Make a D6\" Normal move (6\" Phobos/Scout).", fx: [{ k: 'extraMove', dice: 'D6' }] },
          { name: "Guerrilla Tactics", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Redeploy units into Strategic Reserves.", fx: [] }
        ]
      },
      "1st Company Task Force": {
        rule: {
          name: "Extremis-level Threat",
          desc: "Once per battle (Command phase): until your next Command phase, attacks against your Oath target may re-roll the Wound roll too.",
          fx: [{ k: 'rerollWound', val: 'all', cond: 'targetIsOath+firstCoyActive', scope: 'army' }]
        },
        enhancements: [
          { name: "The Imperium's Sword", pts: 25, restrict: "ADEPTUS ASTARTES", desc: "+1 A melee; once/battle +1 A to the whole unit's melee.", fx: [{ k: 'plusAttacksMelee', n: 1, selfOnly: true }] },
          { name: "Fear Made Manifest", pts: 30, restrict: "ADEPTUS ASTARTES", desc: "Aura: enemies failing Battle-shock within 6\" lose a model.", fx: [] },
          { name: "Rites of War", pts: 10, restrict: "ADEPTUS ASTARTES TERMINATOR", desc: "+1 OC; once/battle +1 OC to the unit.", fx: [{ k: 'objControl', n: 1, selfOnly: true }] },
          { name: "Iron Resolve", pts: 15, restrict: "ADEPTUS ASTARTES TERMINATOR", desc: "FNP 5+; once/battle give the unit FNP 5+.", fx: [{ k: 'fnp', val: 5, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Armour of Contempt", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Worsen incoming attacks' AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Heroes of the Chapter", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "+1 Hit; +1 Wound if Below Half-strength.", fx: [{ k: 'addHit', n: 1 }, { k: 'addWound', n: 1, cond: 'selfBelowHalf' }] },
          { name: "Terrifying Proficiency", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Enemies near the unit take Battle-shock next Command phase.", fx: [] },
          { name: "Duty and Honour", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Hold an objective stickily.", fx: [{ k: 'stickyObjective' }] },
          { name: "Orbital Teleportarium", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "TERMINATORS to Reserves to Deep Strike next turn.", fx: [] },
          { name: "Legendary Fortitude", cp: 1, type: "Battle Tactic", when: 'oppChargeEnd', targetSelf: true, desc: "-1 Damage to attacks on the unit.", fx: [{ k: 'reduceIncomingDmg', n: 1 }] }
        ]
      },
      "Librarius Conclave": {
        rule: {
          name: "Psychic Disciplines",
          desc: "Start of battle round: select one Discipline; it applies to your PSYKER units until end of round.",
          fx: []
        },
        doctrines: [
          { id: 'biomancy', name: "Biomancy", desc: "+2\" Move for PSYKER units.", fx: [] },
          { id: 'divination', name: "Divination", desc: "PSYKER units re-roll Hit and Wound rolls of 1.", fx: [{ k: 'rerollHit', val: 1, cond: 'psykerOnly' }, { k: 'rerollWound', val: 1, cond: 'psykerOnly' }] },
          { id: 'pyromancy', name: "Pyromancy", desc: "+1 AP on PSYKER ranged attacks within 12\".", fx: [{ k: 'plusApRanged', n: 1, cond: 'psykerOnly+within12' }] },
          { id: 'telekinesis', name: "Telekinesis", desc: "-1 Strength to ranged attacks targeting PSYKER units.", fx: [{ k: 'subIncomingStr', n: 1, cond: 'psykerOnly' }] },
          { id: 'telepathy', name: "Telepathy", desc: "PSYKER units ignore modifiers to BS/WS and Hit rolls.", fx: [{ k: 'ignoreHitModifiers', cond: 'psykerOnly' }] }
        ],
        enhancements: [
          { name: "Prescience", pts: 25, restrict: "ADEPTUS ASTARTES PSYKER", desc: "Reactive D6\" move when an enemy ends a move near you.", fx: [] },
          { name: "Celerity", pts: 30, restrict: "ADEPTUS ASTARTES PSYKER", desc: "Unit eligible to charge after Advancing (and after Falling Back under Biomancy).", fx: [{ k: 'eligChargeAfterAdvance' }] },
          { name: "Obfuscation", pts: 20, restrict: "ADEPTUS ASTARTES PSYKER", desc: "No Overwatch vs bearer's unit; can't be shot from beyond 18\" under Telepathy.", fx: [] },
          { name: "Fusillade", pts: 35, restrict: "ADEPTUS ASTARTES PSYKER", desc: "Unit ranged gain [ANTI-MONSTER 5+] & [ANTI-VEHICLE 5+] (+[SUSTAINED HITS 1] under Pyromancy).", fx: [{ k: 'antiVal', kw: 'MONSTER', val: 5 }, { k: 'antiVal', kw: 'VEHICLE', val: 5 }] }
        ],
        stratagems: [
          { name: "Sensory Assault", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Pin an enemy unit (-2 Move, -2 Charge).", fx: [] },
          { name: "Armour of Contempt", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Worsen incoming attacks' AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Fiery Shield", cp: 1, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "-1 Hit vs your unit (Hazardous to attackers under Pyromancy).", fx: [{ k: 'subIncomingHit', n: 1 }] },
          { name: "Iron Arm", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "+1 S melee (+2 under Biomancy).", fx: [{ k: 'plusStrMelee', n: 1 }] },
          { name: "Assail", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Roll 6D6 (4+ = 1 mortal) to a nearby enemy.", fx: [] },
          { name: "Prescient Precision", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "[LETHAL HITS] (+[IGNORES COVER] under Divination).", fx: [{ k: 'grant', ab: 'lethal' }] }
        ]
      },
      "Bastion Task Force": {
        rule: {
          name: "Interlocking Tactics",
          desc: "Your BATTLELINE units may shoot/charge/act after Advancing or Falling Back. After they attack, mark an enemy 'auspex scanned'; your attacks vs scanned units re-roll Hit rolls of 1.",
          fx: [{ k: 'eligShootAfterAdvance', cond: 'unitBattleline', scope: 'army' }, { k: 'eligChargeAfterAdvance', cond: 'unitBattleline', scope: 'army' }, { k: 'eligShootAfterFallBack', cond: 'unitBattleline', scope: 'army' }, { k: 'eligChargeAfterFallBack', cond: 'unitBattleline', scope: 'army' }, { k: 'rerollHit', val: 1, cond: 'targetScanned', scope: 'army' }]
        },
        enhancements: [
          { name: "Eye of the Primarch", pts: 10, restrict: "ADEPTUS ASTARTES", desc: "Bearer & BATTLELINE in unit: ranged gain [PRECISION].", fx: [{ k: 'grant', ab: 'precision' }] },
          { name: "Hero of the Chapter", pts: 20, restrict: "ADEPTUS ASTARTES", desc: "Bearer gains BATTLELINE.", fx: [] },
          { name: "Blades of Valour", pts: 15, restrict: "ADEPTUS ASTARTES", desc: "+1 AP melee for bearer & BATTLELINE in unit.", fx: [{ k: 'plusApMelee', n: 1 }] },
          { name: "Bombast Omnivox", pts: 15, restrict: "ADEPTUS ASTARTES", desc: "Targeting bearer's unit with a Strat: 4+ regain 1CP.", fx: [] }
        ],
        stratagems: [
          { name: "Codex Discipline", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Re-roll Hits of 1 (Wounds of 1 vs scanned).", fx: [{ k: 'rerollHit', val: 1 }, { k: 'rerollWound', val: 1, cond: 'targetScanned' }] },
          { name: "Guided Disruption", cp: 1, type: "Strategic Ploy", when: 'afterBattlelineAttack', targetSelf: true, desc: "Scanned non-MONSTER/VEHICLE becomes pinned.", fx: [] },
          { name: "Light of Vengeance", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "[LETHAL HITS] or [SUSTAINED HITS 1] vs scanned / if BATTLELINE.", fx: [{ k: 'grant', ab: 'lethal', cond: 'targetScanned' }] },
          { name: "Shock Bombardment", cp: 1, type: "Strategic Ploy", when: 'afterBattlelineAttack', targetSelf: true, desc: "Scanned unit becomes suppressed (-1 to Hit).", fx: [] },
          { name: "Angels Defiant", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "If attack S > your T, -1 to Wound.", fx: [{ k: 'subIncomingWound', n: 1, cond: 'strHigherThanT' }] },
          { name: "Heresy Undone", cp: 1, type: "Strategic Ploy", when: 'shootOrCharge', targetSelf: true, desc: "Non-BATTLELINE unit may shoot/charge after Advance/Fall Back vs scanned.", fx: [{ k: 'eligShootAfterAdvance' }, { k: 'eligChargeAfterAdvance' }] }
        ]
      },
      "Orbital Assault Force": {
        rule: {
          name: "Rapid-drop Deployment",
          desc: "Give a number of units Deep Strike (by battle size). Attacks by a unit set up this turn re-roll Wound rolls of 1 (and Hit rolls of 1 if it disembarked from a Drop Pod).",
          fx: [{ k: 'rerollWound', val: 1, cond: 'setUpThisTurn', scope: 'army' }, { k: 'rerollHit', val: 1, cond: 'dropPodThisTurn', scope: 'army' }]
        },
        enhancements: [
          { name: "Laurels of Thunder", pts: 15, restrict: "ADEPTUS ASTARTES", desc: "Re-roll Charges the turn the unit is set up.", fx: [{ k: 'rerollCharge', cond: 'setUpThisTurn' }] },
          { name: "Veteran of the Vanguard", pts: 20, restrict: "ADEPTUS ASTARTES", desc: "Unit gains Scouts 6\".", fx: [] },
          { name: "Orbital Uplink Reliquary", pts: 25, restrict: "ADEPTUS ASTARTES", desc: "Redeploy up to 3 units after deployment.", fx: [] },
          { name: "Dedicated Gunship", pts: 15, restrict: "ADEPTUS ASTARTES TERMINATOR", desc: "Once: pull the unit into Reserves.", fx: [] }
        ],
        stratagems: [
          { name: "Suppression Strafing", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Battle-shock a nearby enemy (suppress on fail).", fx: [] },
          { name: "Tactical Decapitation", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "[PRECISION]; +1 Hit vs CHARACTERS.", fx: [{ k: 'grant', ab: 'precision' }, { k: 'addHit', n: 1, cond: 'targetCharacter' }] },
          { name: "Shock Onslaught", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Pile-in/Consolidate up to 6\".", fx: [] },
          { name: "Auto-sense Coordination", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "[LETHAL HITS] or [SUSTAINED HITS 1] when disembarked / within 12\".", fx: [{ k: 'grant', ab: 'lethal', cond: 'within12' }] },
          { name: "Blind Screen", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Stealth + Benefit of Cover vs the attack.", fx: [{ k: 'subIncomingHit', n: 1 }] },
          { name: "Onward for the Emperor", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Embark a nearby reserve-arriving unit.", fx: [] }
        ]
      },
      "Ceramite Sentinels": {
        rule: {
          name: "Adaptive Defence",
          desc: "While within a terrain feature, your attacks re-roll Hit and Wound rolls of 1. Units gain ENTRENCHED while in terrain, not set up this turn, and having moved ≤3\".",
          fx: [{ k: 'rerollHit', val: 1, cond: 'inTerrain', scope: 'army' }, { k: 'rerollWound', val: 1, cond: 'inTerrain', scope: 'army' }]
        },
        enhancements: [
          { name: "Honour Indefatigable", pts: 25, restrict: "GRAVIS", desc: "First destroyed: on 2+ return with full wounds.", fx: [{ k: 'resurrect', val: 2 }] },
          { name: "Castellum Omnivox", pts: 20, restrict: "ADEPTUS ASTARTES", desc: "On Fall Back, unit may still act/shoot/charge.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Spy-skull Data Link", pts: 15, restrict: "ADEPTUS ASTARTES", desc: "Unit ranged gain [IGNORES COVER].", fx: [{ k: 'grant', ab: 'ignorescover' }] },
          { name: "Defensive Mastery", pts: 25, restrict: "ADEPTUS ASTARTES", desc: "Redeploy up to 3 units after deployment.", fx: [] }
        ],
        stratagems: [
          { name: "Unyielding Might", cp: 1, type: "Battle Tactic", when: 'command', targetSelf: true, desc: "+1 OC.", fx: [{ k: 'objControl', n: 1 }] },
          { name: "Priority Strike", cp: 2, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Re-roll Wounds vs CHARACTER/MONSTER/VEHICLE.", fx: [{ k: 'rerollWound', val: 'all', cond: 'targetCMV' }] },
          { name: "Armour of Contempt", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Worsen incoming attacks' AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Stand to the End", cp: 1, type: "Epic Deed", when: 'fightTargeted', targetSelf: true, desc: "Destroyed models may fight (4+, +1 if ENTRENCHED).", fx: [{ k: 'fightOnDeath' }] },
          { name: "Augmented Targeting", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "[SUSTAINED HITS 1] or [LETHAL HITS] (both if ENTRENCHED).", fx: [{ k: 'grant', ab: 'sustained', val: 1 }] },
          { name: "Evasive Repositioning", cp: 1, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Make a D6\" Normal move.", fx: [{ k: 'extraMove', dice: 'D6' }] }
        ]
      },
      "Armoured Speartip": {
        rule: {
          name: "Rapid Deployment",
          desc: "A unit disembarking from a TRANSPORT that moved may make a D6\" move (D3+3\" from a Heavy Transport, 14+ wounds).",
          fx: []
        },
        enhancements: [
          { name: "Liberator", pts: 15, restrict: "ADEPTUS ASTARTES", desc: "Sticky objective control near the bearer/Heavy Transport.", fx: [{ k: 'stickyObjective' }] },
          { name: "Tip of the Spear", pts: 40, restrict: "ADEPTUS ASTARTES", desc: "Starting transport gains Scouts 6\".", fx: [] },
          { name: "Shock Deployment", pts: 20, restrict: "ADEPTUS ASTARTES TERMINATOR/GRAVIS", desc: "Disembarked, ranged gain [SUSTAINED HITS 1].", fx: [{ k: 'grant', ab: 'sustained', val: 1 }] },
          { name: "Armoured Commander", pts: 25, restrict: "ADEPTUS ASTARTES", desc: "A reserve transport may arrive a round earlier.", fx: [] }
        ],
        stratagems: [
          { name: "Machine Wrath", cp: 1, type: "Epic Deed", when: 'vehicleDestroyed', targetSelf: true, desc: "Dying Heavy Transport makes a move first.", fx: [] },
          { name: "Armour of Contempt", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Worsen incoming attacks' AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Rapid Embarkation", cp: 1, type: "Wargear", when: 'fightEnd', targetSelf: true, desc: "Embark a nearby INFANTRY unit in a Heavy Transport.", fx: [] },
          { name: "Ceramite Sledgehammer", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Transport may move through terrain/models.", fx: [] },
          { name: "Advanced Deployment", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Disembark after the transport Advanced.", fx: [] },
          { name: "Purgation Doctrine", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "+1 Hit (+1 Wound if disembarked from a Heavy Transport).", fx: [{ k: 'addHit', n: 1 }, { k: 'addWound', n: 1, cond: 'disembarkedHeavy' }] }
        ]
      },
      "Headhunter Task Force": {
        rule: {
          name: "Target Sighted",
          desc: "Your TANK ACE vehicles auto-Advance +6\". If they didn't Advance, re-roll the Damage roll when they shoot.",
          fx: [{ k: 'rerollDamage', val: 'all', cond: 'tankAceStationaryish', scope: 'army' }]
        },
        enhancements: [
          { name: "Redoubtable Machine Spirit", pts: 25, restrict: "ADEPTUS ASTARTES VEHICLE", desc: "5+ invuln; regain 1 wound each Command phase.", fx: [{ k: 'invuln', val: 5 }] },
          { name: "Gunnery Honours", pts: 20, restrict: "ADEPTUS ASTARTES VEHICLE", desc: "Once/phase re-roll a Hit, Wound and Damage for the bearer.", fx: [{ k: 'rerollOnePerPhase' }] },
          { name: "Firestorm Coordinators", pts: 20, restrict: "ADEPTUS ASTARTES VEHICLE", desc: "Bearer ranged gain [SUSTAINED HITS 1].", fx: [{ k: 'grant', ab: 'sustained', val: 1, selfOnly: true }] },
          { name: "Astartes Tank Ace", pts: 40, restrict: "ADEPTUS ASTARTES VEHICLE", desc: "Aura: nearby VEHICLE ranged gain [ASSAULT].", fx: [] }
        ],
        stratagems: [
          { name: "Armour of Contempt", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Worsen incoming attacks' AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Target Weak Point", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "+1 AP vs MONSTER/VEHICLE.", fx: [{ k: 'plusApRanged', n: 1, cond: 'targetMonsterVehicle' }] },
          { name: "Kill Shot", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Re-roll Wounds of 1 vs MONSTER/VEHICLE (all if below strength).", fx: [{ k: 'rerollWound', val: 1, cond: 'targetMonsterVehicle' }] },
          { name: "Rapid Gunnery", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Unit eligible to shoot in a turn it Fell Back.", fx: [{ k: 'eligShootAfterFallBack' }] },
          { name: "Reactive Repositioning", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Make a D6\" Normal move.", fx: [{ k: 'extraMove', dice: 'D6' }] },
          { name: "Machine Vengeance", cp: 1, type: "Epic Deed", when: 'oppShootResolved', targetSelf: true, desc: "Shoot back at the attacker.", fx: [{ k: 'shootBack' }] }
        ]
      },
      "Blade of Ultramar": {
        chapter: "ULTRAMARINES",
        rule: {
          name: "Mastered Doctrines",
          desc: "Up to three Command phases: select a Combat Doctrine. With Marneus Calgar on the field you may re-select doctrines already used.",
          fx: []
        },
        doctrines: [
          { id: 'devastator', name: "Devastator Doctrine", desc: "Eligible to shoot in a turn it Advanced.", fx: [{ k: 'eligShootAfterAdvance', scope: 'army' }] },
          { id: 'tactical', name: "Tactical Doctrine", desc: "Eligible to shoot and charge in a turn it Fell Back.", fx: [{ k: 'eligShootAfterFallBack', scope: 'army' }, { k: 'eligChargeAfterFallBack', scope: 'army' }] },
          { id: 'assault', name: "Assault Doctrine", desc: "Eligible to charge in a turn it Advanced.", fx: [{ k: 'eligChargeAfterAdvance', scope: 'army' }] }
        ],
        enhancements: [
          { name: "Armour of Antoninus", pts: 10, restrict: "ADEPTUS ASTARTES", desc: "Save 2+ and Feel No Pain 5+.", fx: [{ k: 'saveTo', val: 2 }, { k: 'fnp', val: 5 }] },
          { name: "Oath of Macragge", pts: 15, restrict: "ADEPTUS ASTARTES", desc: "+1 A & S melee (+2 under Assault Doctrine).", fx: [{ k: 'plusAttacksMelee', n: 1 }, { k: 'plusStrMelee', n: 1 }, { k: 'plusAttacksMelee', n: 1, cond: 'doctrine:assault' }, { k: 'plusStrMelee', n: 1, cond: 'doctrine:assault' }] },
          { name: "Student of the Codex", pts: 20, restrict: "ADEPTUS ASTARTES", desc: "Command phase: Tactical Doctrine for this unit.", fx: [] },
          { name: "Veteran of Behemoth", pts: 25, restrict: "ADEPTUS ASTARTES", desc: "Unit ranged gain [SUSTAINED HITS 1]; re-roll Advances under Devastator.", fx: [{ k: 'grant', ab: 'sustained', val: 1 }, { k: 'rerollAdvance', cond: 'doctrine:devastator' }] }
        ],
        stratagems: [
          { name: "Armour of Contempt", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Worsen incoming attacks' AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Tactical Foresight", cp: 1, type: "Epic Deed", when: 'targeted', targetSelf: true, desc: "If attack S ≥ your T, -1 to Wound.", fx: [{ k: 'subIncomingWound', n: 1, cond: 'strGEQT' }] },
          { name: "Courage and Honour!", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Melee gain [LANCE] (+1 AP under Assault Doctrine).", fx: [{ k: 'grant', ab: 'lance' }, { k: 'plusApMelee', n: 1, cond: 'doctrine:assault' }] },
          { name: "Ultramarian Adaptivity", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Set one unit's Doctrine independently.", fx: [{ k: 'pickDoctrineUnit' }] },
          { name: "Exemplary Vigilance", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "[IGNORES COVER] (+1 AP under Devastator).", fx: [{ k: 'grant', ab: 'ignorescover' }, { k: 'plusApRanged', n: 1, cond: 'doctrine:devastator' }] },
          { name: "Practical Tactics", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Make a D6\" Normal move (6\" under Tactical).", fx: [{ k: 'extraMove', dice: 'D6' }] }
        ]
      },
      "Reclamation Force": {
        chapter: "ULTRAMARINES",
        rule: {
          name: "Oath of Reclamation",
          desc: "+1 AP on your melee attacks targeting a unit within range of an objective. While within range of an objective you held at the start of the phase, if attack S > your T (or your unit is TITUS), -1 to Wound against you.",
          fx: [{ k: 'plusApMelee', n: 1, cond: 'targetWithinObjective', scope: 'army' }, { k: 'subIncomingWound', n: 1, cond: 'selfOnHeldObjective+strHigherThanT', scope: 'army' }]
        },
        enhancements: [
          { name: "Seals of Reconquest", pts: 20, restrict: "ADEPTUS ASTARTES", desc: "Unit gains a 5+ invulnerable save.", fx: [{ k: 'invuln', val: 5 }] },
          { name: "Avenging Avatar", pts: 10, restrict: "ADEPTUS ASTARTES", desc: "Aura: enemy below-strength units within 9\" take Battle-shock.", fx: [] },
          { name: "Scroll of Proclamation", pts: 15, restrict: "ADEPTUS ASTARTES", desc: "Re-roll Charges when charging onto an objective.", fx: [{ k: 'rerollCharge', cond: 'targetWithinObjective' }] },
          { name: "Liberatum", pts: 25, restrict: "ADEPTUS ASTARTES", desc: "Bearer re-rolls Hit and Wound vs targets on objectives.", fx: [{ k: 'rerollHit', val: 'all', cond: 'targetWithinObjective', selfOnly: true }, { k: 'rerollWound', val: 'all', cond: 'targetWithinObjective', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Crusading Conquerors", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "+1 OC.", fx: [{ k: 'objControl', n: 1 }] },
          { name: "Furious Dedication", cp: 1, type: "Battle Tactic", when: 'chargeOrFight', targetSelf: true, desc: "+2 Charge and +1 A melee.", fx: [{ k: 'plusAttacksMelee', n: 1 }] },
          { name: "Fight to the End", cp: 1, type: "Battle Tactic", when: 'fightTargeted', targetSelf: true, desc: "Destroyed models fight on a 4+.", fx: [{ k: 'fightOnDeath' }] },
          { name: "Scions of Guilliman", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot/charge after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Ultramarian Destiny", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Hold an objective stickily.", fx: [{ k: 'stickyObjective' }] },
          { name: "Marching Ever On", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Make a D6+1\" Normal move when an enemy Falls Back.", fx: [{ k: 'extraMove', dice: 'D6' }] }
        ]
      }
    }
  },

  "Black Templars": {
    // Black Templars replace Oath of Moment with Templar Vows (chosen once, start of battle).
    armyRule: {
      name: "Templar Vows",
      desc: "At the start of the first battle round pick one Vow; it applies to your ADEPTUS ASTARTES units all game. (Replaces Oath of Moment.)",
      oncePerBattle: true,
      choiceLabel: "Vow",
      choices: [
        { id: 'abhor', name: "Abhor the Witch", desc: "Re-roll Charges vs PSYKERS; melee has [PRECISION] vs PSYKERS.",
          fx: [{ k: 'rerollCharge', cond: 'targetPsyker' }, { k: 'grant', ab: 'precision', cond: 'targetPsyker+meleeOnly', scope: 'army' }] },
        { id: 'challenge', name: "Accept Any Challenge", desc: "+1 to Wound in melee when attack S ≤ target T.",
          fx: [{ k: 'addWound', n: 1, cond: 'meleeOnly+strLEQT', scope: 'army' }] },
        { id: 'unclean', name: "Suffer Not the Unclean", desc: "Eligible to charge after Falling Back; freer Pile-in/Consolidate.",
          fx: [{ k: 'eligChargeAfterFallBack', scope: 'army' }] },
        { id: 'honour', name: "Uphold the Honour of the Emperor", desc: "INFANTRY hold objectives stickily; may act after Advancing.",
          fx: [{ k: 'eligShootAfterAdvance', cond: 'unitBattleline', scope: 'army' }] }
      ]
    },
    restrictions: [
      "Black Templars Chapter only. No ADEPTUS ASTARTES PSYKER models.",
      "Replaces Oath of Moment with Templar Vows. Cannot use the 1st Company Task Force detachment.",
      "Cannot include: Gladiator Lancer/Reaper/Valiant, Impulsor, Land Raider Crusader, Repulsor, Repulsor Executioner, Sternguard Veteran Squad, Terminator Squad."
    ],
    detachments: {
      "Companions of Vehemence": {
        chapter: "BLACK TEMPLARS",
        rule: { name: "Righteous Fervour", desc: "Re-roll Advance and Charge rolls for your units.",
          fx: [{ k: 'rerollAdvance', scope: 'army' }, { k: 'rerollCharge', scope: 'army' }] },
        enhancements: [
          { name: "Incendiary Animus", pts: 25, restrict: "CHAPLAIN/JUDICIAR", desc: "+1 AP to the unit's melee.", fx: [{ k: 'plusApMelee', n: 1 }] },
          { name: "Oathbound Exemplar", pts: 15, restrict: "ADEPTUS ASTARTES INFANTRY", desc: "+1 Advance; may act after Advancing.", fx: [{ k: 'rerollAdvance' }] },
          { name: "Merciless Denunciation", pts: 25, restrict: "CHAPLAIN/JUDICIAR", desc: "Re-roll melee Hit rolls for the unit.", fx: [{ k: 'rerollHit', val: 'all', cond: 'meleeOnly' }] },
          { name: "Zealous Vanguard", pts: 20, restrict: "ADEPTUS ASTARTES", desc: "Unit gains Scouts 6\".", fx: [] }
        ],
        stratagems: [
          { name: "Devout Push", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Pile-in/Consolidate up to 6\".", fx: [] },
          { name: "Hearts Hardened to Duty", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Consolidate freely (no need to move toward enemy).", fx: [] },
          { name: "For the Emperor's Honour!", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Melee gain [PRECISION].", fx: [{ k: 'grant', ab: 'precision' }] },
          { name: "Pious Enmity", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Re-roll melee Hits of 1 (Wounds of 1 vs MONSTER/VEHICLE).", fx: [{ k: 'rerollHit', val: 1 }, { k: 'rerollWound', val: 1, cond: 'targetMonsterVehicle' }] },
          { name: "Heresy Begets Retribution", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Chaplain/Judiciar makes a D6\" move toward the enemy.", fx: [{ k: 'extraMove', dice: 'D6' }] },
          { name: "Dread Crusaders", cp: 1, type: "Strategic Ploy", when: 'oppCharge', targetSelf: true, desc: "The charging enemy takes a Battle-shock test (-1).", fx: [] }
        ]
      },
      "Vindication Task Force": {
        chapter: "BLACK TEMPLARS",
        rule: { name: "Purge and Sanctify", desc: "ANCIENT units near objectives get -1 to Wound against them (when attack S > their T). Crusader Squads can Righteous-Zeal toward objectives.",
          fx: [{ k: 'subIncomingWound', n: 1, cond: 'selfAncientNearObjective+strHigherThanT', scope: 'army' }] },
        enhancements: [
          { name: "Imperialis of the Eternal Crusade", pts: 15, restrict: "ANCIENT", desc: "Enemies charging the unit get -2 to the Charge roll.", fx: [] },
          { name: "Consecrating Aura", pts: 25, restrict: "ADEPTUS ASTARTES", desc: "Unit gains a 5+ invulnerable save.", fx: [{ k: 'invuln', val: 5 }] },
          { name: "Orb of the Emperor's Aegis", pts: 10, restrict: "ADEPTUS ASTARTES", desc: "Unit gains Deep Strike.", fx: [] },
          { name: "Warden of Honour", pts: 20, restrict: "CRUSADE ANCIENT", desc: "+1 to the unit's Vengeful Exhortation rolls.", fx: [] }
        ],
        stratagems: [
          { name: "Refusal to Yield", cp: 1, type: "Epic Deed", when: 'vehicleDestroyed', targetSelf: true, desc: "Destroyed ANCIENT returns with full wounds.", fx: [{ k: 'resurrect', val: 1 }] },
          { name: "Litanies of Purgation", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "+1 AP when you or the target are near an objective.", fx: [{ k: 'plusApMelee', n: 1, cond: 'targetWithinObjective' }] },
          { name: "Spoor of the Unholy", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Ranged gain [IGNORES COVER]; ignore Hit-roll modifiers.", fx: [{ k: 'grant', ab: 'ignorescover' }, { k: 'ignoreModifiers' }] },
          { name: "Reclaim Our Honour!", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "+1 to Hit vs the unit that killed your Ancient (rest of battle).", fx: [{ k: 'addHit', n: 1 }] },
          { name: "Recitation of the Revered", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "ANCIENT unit: incoming attacks -1 to Hit.", fx: [{ k: 'subIncomingHit', n: 1 }] },
          { name: "Perfervid Intervention", cp: 2, type: "Strategic Ploy", when: 'oppChargeEnd', targetSelf: true, desc: "Declare and resolve a charge in the opponent's turn (no bonus).", fx: [] }
        ]
      },
      "Godhammer Assault Force": {
        chapter: "BLACK TEMPLARS",
        rule: { name: "Shock and Awe", desc: "Units that disembarked this turn: a charge target takes Battle-shock, and +1 to melee Hit rolls.",
          fx: [{ k: 'addHit', n: 1, cond: 'meleeOnly+disembarkedThisTurn', scope: 'army' }] },
        enhancements: [
          { name: "Paragon of Fury", pts: 25, restrict: "ADEPTUS ASTARTES", desc: "+2 S melee; +1 Damage if the bearer disembarked this turn.", fx: [{ k: 'plusStrMelee', n: 2, selfOnly: true }] },
          { name: "Battle-psalm Precentor", pts: 10, restrict: "ADEPTUS ASTARTES", desc: "Shock-and-Awe Battle-shock tests get an extra -1.", fx: [] },
          { name: "Augury Servo-host", pts: 15, restrict: "ADEPTUS ASTARTES", desc: "A target within 12\" loses Benefit of Cover this Shooting phase.", fx: [{ k: 'grant', ab: 'ignorescover' }] },
          { name: "Herald of Sacred Slaughter", pts: 15, restrict: "ADEPTUS ASTARTES", desc: "Starting dedicated transport gains Scouts 9\".", fx: [] }
        ],
        stratagems: [
          { name: "A Ceaseless Cause", cp: 1, type: "Strategic Ploy", when: 'fightEnd', targetSelf: true, desc: "Make a 6\" Normal move.", fx: [{ k: 'extraMove', dice: '6' }] },
          { name: "Uncompromising Egress", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Disembark within 6\" of a Land Raider, even into Engagement Range.", fx: [] },
          { name: "Gauntlet of the God-Emperor", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "VEHICLE may move through terrain.", fx: [] },
          { name: "Focused Hatred", cp: 1, type: "Strategic Ploy", when: 'charge', targetSelf: true, desc: "Charge move may pass through models.", fx: [] },
          { name: "Condemnatory Info-screed", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Disembarked: re-roll Wounds of 1 (all if from a Land Raider).", fx: [{ k: 'rerollWound', val: 1, cond: 'disembarkedThisTurn' }] },
          { name: "Blessed Hull", cp: 2, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "VEHICLE: -1 Damage to incoming attacks.", fx: [{ k: 'reduceIncomingDmg', n: 1 }] }
        ]
      },
      "Wrathful Procession": {
        chapter: "BLACK TEMPLARS",
        rule: { name: "Zealous Litanies", desc: "Start of battle round: pick one Litany for your INFANTRY/MOUNTED units (re-selectable each round).",
          fx: [] },
        doctrineLabel: "Litany",
        doctrines: [
          { id: 'hate', name: "Chorus of Relentless Hate", desc: "+2\" Move and +1 Advance.", fx: [] },
          { id: 'wrath', name: "Rite of Perfervid Wrath", desc: "+1 Strength to melee weapons.", fx: [{ k: 'plusStrMelee', n: 1, cond: 'meleeOnly', scope: 'army' }] },
          { id: 'devotion', name: "Chant of Deathless Devotion", desc: "5+ invulnerable save vs ranged attacks.", fx: [{ k: 'invuln', val: 5, cond: 'rangedOnly', scope: 'army' }] }
        ],
        enhancements: [
          { name: "Pyrebrand", pts: 25, restrict: "BLACK TEMPLARS", desc: "Unit gains Stealth.", fx: [{ k: 'subIncomingHit', n: 1, cond: 'rangedOnly' }] },
          { name: "Sacred Rage", pts: 30, restrict: "ADEPTUS ASTARTES", desc: "Once: unit gains Fights First this Fight phase.", fx: [{ k: 'fightsFirst', selfOnly: true }] },
          { name: "Taramond's Censer", pts: 15, restrict: "BLACK TEMPLARS", desc: "Enemies in Engagement Range take Battle-shock (-1) at start of Fight.", fx: [] },
          { name: "Benediction of Fury", pts: 10, restrict: "CHAPLAIN", desc: "Bearer's melee gain [DEVASTATING WOUNDS].", fx: [{ k: 'grant', ab: 'devastating', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Fuelled by Faith", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "FNP 5+ vs mortal wounds.", fx: [{ k: 'fnp', val: 5 }] },
          { name: "Armour of Contempt", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Worsen incoming attacks' AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Castigate the Demagogues", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Melee gain [PRECISION].", fx: [{ k: 'grant', ab: 'precision' }] },
          { name: "Brute Fervour", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Re-roll melee Hits of 1; ignore Hit/Wound modifiers.", fx: [{ k: 'rerollHit', val: 1 }, { k: 'ignoreModifiers' }] },
          { name: "Relentless Momentum", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Models within 3\" become eligible to fight.", fx: [] },
          { name: "Voice of Devotion", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Switch this unit's active Litany.", fx: [] }
        ]
      }
    }
  },

  "Necrons": {
    armyRule: {
      name: "Reanimation Protocols",
      desc: "End of your Command phase: each unit reanimates D3 wounds — healing a wounded model, or returning a destroyed model with 1 wound. (Healing resolves once the sim's repair system is active; effect is stored and shown.)",
      fx: [{ k: 'reanimate', dice: 'D3', scope: 'army', selfTrigger: 'endCommand' }]
    },
    restrictions: [
      "Army Faction NECRONS. Reanimation Protocols apply army-wide.",
      "Pantheon of Woe increases the points of each MONSTER (Necrodermal Binding) and is a last-resort C'tan detachment."
    ],
    detachments: {
      "Awakened Dynasty": {
        rule: { name: "Command Protocols", desc: "While a NECRONS CHARACTER leads a unit, +1 to that unit's Hit rolls.",
          fx: [{ k: 'addHit', n: 1, cond: 'characterLeading', scope: 'army' }] },
        enhancements: [
          { name: "Veil of Darkness", pts: 20, restrict: "NECRONS", desc: "Once: redeploy the bearer's unit via Reserves.", fx: [] },
          { name: "Nether-realm Casket", pts: 20, restrict: "NECRONS", desc: "Bearer's unit gains Stealth.", fx: [{ k: 'subIncomingHit', n: 1, cond: 'rangedOnly' }] },
          { name: "Phasal Subjugator", pts: 35, restrict: "NECRONS", desc: "Aura: nearby units get +1 to Hit.", fx: [{ k: 'addHit', n: 1 }] },
          { name: "Enaegic Dermal Bond", pts: 30, restrict: "NECRONS", desc: "Bearer has Feel No Pain 4+.", fx: [{ k: 'fnp', val: 4, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Protocol of the Eternal Revenant", cp: 1, type: "Epic Deed", when: 'fightTargeted', targetSelf: true, desc: "Destroyed CHARACTER returns with half wounds.", fx: [{ k: 'resurrect', val: 1 }] },
          { name: "Protocol of the Undying Legions", cp: 1, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Reanimate D3 (D3+1 if a Character leads).", fx: [{ k: 'reanimate', dice: 'D3' }] },
          { name: "Protocol of the Hungry Void", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "+1 S melee (+1 AP if a Character leads).", fx: [{ k: 'plusStrMelee', n: 1 }, { k: 'plusApMelee', n: 1, cond: 'characterLeading' }] },
          { name: "Protocol of the Sudden Storm", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Ranged gain [ASSAULT]; re-roll Advance if a Character leads.", fx: [{ k: 'grant', ab: 'assault' }, { k: 'rerollAdvance', cond: 'characterLeading' }] },
          { name: "Protocol of the Conquering Tyrant", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Re-roll Hits of 1 within half range (full re-roll if a Character leads).", fx: [{ k: 'rerollHit', val: 1, cond: 'targetHalfRange' }, { k: 'rerollHit', val: 'all', cond: 'targetHalfRange+characterLeading' }] },
          { name: "Protocol of the Vengeful Stars", cp: 2, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Character unit shoots the attacker.", fx: [{ k: 'shootBack' }] }
        ]
      },
      "Annihilation Legion": {
        rule: { name: "Annihilation Protocol", desc: "Destroyer Cult / Flayed Ones re-roll Charges (+1 vs below-half targets). Destroyer Cult ranged attacks vs the closest target get +1 AP.",
          fx: [{ k: 'rerollCharge', cond: 'destroyerCult', scope: 'army' }, { k: 'plusApRanged', n: 1, cond: 'destroyerCult+rangedOnly', scope: 'army' }] },
        enhancements: [
          { name: "Eternal Madness", pts: 25, restrict: "NECRONS", desc: "Fight: destroyed models fight on a 4+ before removal.", fx: [{ k: 'fightOnDeath' }] },
          { name: "Ingrained Superiority", pts: 10, restrict: "NECRONS", desc: "+1 AP on Critical Wounds.", fx: [] },
          { name: "Soulless Reaper", pts: 20, restrict: "DESTROYER CULT", desc: "Enemies may fail to Fall Back from the bearer's unit.", fx: [] },
          { name: "Eldritch Nightmare", pts: 15, restrict: "DESTROYER CULT", desc: "Enemies in Engagement Range take Battle-shock at start of Fight.", fx: [] }
        ],
        stratagems: [
          { name: "Masks of Death", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Incoming attacks -1 to Hit.", fx: [{ k: 'subIncomingHit', n: 1 }] },
          { name: "The Spoor of Frailty", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "+1 Hit vs below-strength (+1 Wound if below half).", fx: [{ k: 'addHit', n: 1, cond: 'targetBelowStrength' }, { k: 'addWound', n: 1, cond: 'targetBelowHalf' }] },
          { name: "Murderous Reanimation", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Reanimate after destroying/breaking a unit.", fx: [{ k: 'reanimate', dice: 'D3' }] },
          { name: "Pitiless Hunters", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Pile-in/Consolidate up to 6\".", fx: [] },
          { name: "Blood-fuelled Cruelty", cp: 1, type: "Battle Tactic", when: 'oppMove', targetSelf: true, desc: "Mortal wounds to a falling-back enemy, then move.", fx: [{ k: 'extraMove', dice: 'D6' }] },
          { name: "Insanity's Ire", cp: 1, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Move toward the enemy that shot you.", fx: [{ k: 'extraMove', dice: 'D6' }] }
        ]
      },
      "Canoptek Court": {
        rule: { name: "Power Matrix", desc: "Cryptek/Canoptek re-roll Hits of 1 (full re-roll if wholly within your Power Matrix — your DZ, or No Man's Land/enemy DZ when you hold half its objectives).",
          fx: [{ k: 'rerollHit', val: 1, cond: 'cryptekCanoptek', scope: 'army' }] },
        enhancements: [
          { name: "Dimensional Sanctum", pts: 20, restrict: "CRYPTEK", desc: "Bearer's unit gains Infiltrators.", fx: [] },
          { name: "Hyperphasic Fulcrum", pts: 15, restrict: "CRYPTEK", desc: "Within Power Matrix, re-roll Wounds of 1.", fx: [{ k: 'rerollWound', val: 1 }] },
          { name: "Autodivinator", pts: 15, restrict: "CRYPTEK", desc: "Steal CP when the opponent gains CP.", fx: [] },
          { name: "Metalodermal Tesla Weave", pts: 10, restrict: "CRYPTEK", desc: "Mortal wounds to chargers.", fx: [] }
        ],
        stratagems: [
          { name: "Curse of the Cryptek", cp: 1, type: "Battle Tactic", when: 'oppShootResolved', targetSelf: true, desc: "Canoptek get +1 Hit & +1 Wound vs the attacker (rest of battle).", fx: [{ k: 'addHit', n: 1 }, { k: 'addWound', n: 1 }] },
          { name: "Cynosure of Eradication", cp: 2, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Cryptek/Canoptek weapons gain [DEVASTATING WOUNDS].", fx: [{ k: 'grant', ab: 'devastating' }] },
          { name: "Solar Pulse", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "[IGNORES COVER] vs units near a chosen objective.", fx: [{ k: 'grant', ab: 'ignorescover' }] },
          { name: "Reactive Subroutines", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Canoptek makes a 6\" move.", fx: [{ k: 'extraMove', dice: '6' }] },
          { name: "Countertemporal Shift", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Can only be shot from within 18\".", fx: [{ k: 'subIncomingHit', n: 1 }] },
          { name: "Suboptimal Facade", cp: 1, type: "Strategic Ploy", when: 'oppCharge', targetSelf: true, desc: "Reanimate when charged within the Power Matrix.", fx: [{ k: 'reanimate', dice: 'D3' }] }
        ]
      },
      "Obeisance Phalanx": {
        rule: { name: "Worthy Foes", desc: "Command phase: mark one enemy unit. Your NOBLE/LYCHGUARD/TRIARCH units get +1 to Wound against it.",
          fx: [{ k: 'addWound', n: 1, cond: 'targetIsOath+nobleLychguardTriarch', scope: 'army' }] },
        enhancements: [
          { name: "Honourable Combatant", pts: 10, restrict: "OVERLORD", desc: "Killing an enemy CHARACTER costs them 1CP.", fx: [] },
          { name: "Unflinching Will", pts: 20, restrict: "OVERLORD", desc: "Bearer's melee gain [PRECISION] and [ANTI-INFANTRY 5+].", fx: [{ k: 'grant', ab: 'precision', selfOnly: true }, { k: 'antiVal', kw: 'INFANTRY', val: 5, selfOnly: true }] },
          { name: "Warrior Noble", pts: 15, restrict: "OVERLORD", desc: "Incoming melee attacks -1 to Hit.", fx: [{ k: 'subIncomingHit', n: 1, cond: 'meleeOnly' }] },
          { name: "Eternal Conqueror", pts: 25, restrict: "OVERLORD", desc: "Re-roll Hits vs enemies on an objective.", fx: [{ k: 'rerollHit', val: 'all', cond: 'targetWithinObjective' }] }
        ],
        stratagems: [
          { name: "Your Time is Nigh", cp: 1, type: "Epic Deed", when: 'command', targetSelf: true, desc: "Enemy Battle-shock/Leadership tests get -1 (rest of battle).", fx: [] },
          { name: "Enslaved Artifice", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Crit on unmodified 5+.", fx: [{ k: 'critOn', val: 5 }] },
          { name: "Nanoassembly Protocols", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "VEHICLE: -1 Damage to incoming attacks.", fx: [{ k: 'reduceIncomingDmg', n: 1 }] },
          { name: "Sentinels of Eternity", cp: 1, type: "Epic Deed", when: 'fightTargeted', targetSelf: true, desc: "Lychguard/Triarch destroyed models fight on 4+.", fx: [{ k: 'fightOnDeath' }] },
          { name: "Suffer No Rival", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Lychguard/Triarch melee gain [PRECISION].", fx: [{ k: 'grant', ab: 'precision' }] },
          { name: "Territorial Obsession", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "+1 OC (+3 if VEHICLE).", fx: [{ k: 'objControl', n: 1 }] }
        ]
      },
      "Hypercrypt Legion": {
        rule: { name: "Hyperphasing", desc: "End of opponent's turn: pull NECRONS units into Strategic Reserves (count by battle size). (Reserve teleport resolves once that system is built; stored and shown.)",
          fx: [] },
        enhancements: [
          { name: "Dimensional Overseer", pts: 25, restrict: "NECRONS", desc: "+1 unit to Hyperphasing selections.", fx: [] },
          { name: "Arisen Tyrant", pts: 25, restrict: "NECRONS", desc: "Re-roll Hits of 1 (full re-roll if set up this turn).", fx: [{ k: 'rerollHit', val: 1 }, { k: 'rerollHit', val: 'all', cond: 'setUpThisTurn' }] },
          { name: "Hyperspatial Transfer Node", pts: 15, restrict: "NECRONS", desc: "Auto-Advance +6\".", fx: [] },
          { name: "Osteoclave Fulcrum", pts: 20, restrict: "NECRONS", desc: "Bearer's unit gains Deep Strike.", fx: [] }
        ],
        stratagems: [
          { name: "Hyperphasic Recall", cp: 2, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Teleport a damaged unit beside a Monolith.", fx: [] },
          { name: "Quantum Deflection", cp: 1, type: "Wargear", when: 'targeted', targetSelf: true, desc: "VEHICLE gains a 4+ invulnerable save.", fx: [{ k: 'invuln', val: 4 }] },
          { name: "Reanimation Crypts", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Reserve units reanimate.", fx: [{ k: 'reanimate', dice: 'D3' }] },
          { name: "Cosmic Precision", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Deep-strike arrival more than 6\" away.", fx: [] },
          { name: "Dimensional Corridor", cp: 2, type: "Strategic Ploy", when: 'charge', targetSelf: true, desc: "A unit arriving via Eternity Gate may charge.", fx: [] },
          { name: "Entropic Damping", cp: 1, type: "Wargear", when: 'targeted', targetSelf: true, desc: "TITANIC: attacker's weapons gain [HAZARDOUS].", fx: [] }
        ]
      },
      "Starshatter Arsenal": {
        rule: { name: "Relentless Onslaught", desc: "Your non-MONSTER models get +1 to Hit vs units near objectives. Vehicle/Mounted ranged weapons gain [ASSAULT].",
          fx: [{ k: 'addHit', n: 1, cond: 'targetWithinObjective', scope: 'army' }, { k: 'grant', ab: 'assault', cond: 'vehicleMounted', scope: 'army' }] },
        enhancements: [
          { name: "Dread Majesty", pts: 30, restrict: "OVERLORD/COMMAND BARGE", desc: "Aura: nearby units re-roll Hits and Wounds of 1.", fx: [{ k: 'rerollHit', val: 1 }, { k: 'rerollWound', val: 1 }] },
          { name: "Miniaturised Nebuloscope", pts: 15, restrict: "NECRONS", desc: "Bearer's unit ranged gain [IGNORES COVER].", fx: [{ k: 'grant', ab: 'ignorescover' }] },
          { name: "Demanding Leader", pts: 10, restrict: "NECRONS", desc: "A nearby Vehicle/Mounted may shoot after Falling Back.", fx: [] },
          { name: "Chrono-impedance Fields", pts: 25, restrict: "NECRONS", desc: "A nearby Vehicle/Mounted: -1 Damage to incoming attacks.", fx: [] }
        ],
        stratagems: [
          { name: "Merciless Reclamation", cp: 2, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "+1 Wound vs targets near objectives.", fx: [{ k: 'addWound', n: 1, cond: 'targetWithinObjective' }] },
          { name: "Unyielding Forms", cp: 2, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Vehicle/Mounted: if attack S > your T, -1 to Wound.", fx: [{ k: 'subIncomingWound', n: 1, cond: 'strHigherThanT' }] },
          { name: "Chronoshift", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Auto-Advance +6\".", fx: [{ k: 'extraMove', dice: '6' }] },
          { name: "Dimensional Tunnel", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Move through models and terrain.", fx: [] },
          { name: "Endless Servitude", cp: 1, type: "Strategic Ploy", when: 'fightEnd', targetSelf: true, desc: "Reanimate (unit on a held objective).", fx: [{ k: 'reanimate', dice: 'D3' }] },
          { name: "Reactive Reposition", cp: 1, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Make a D6\" Normal move.", fx: [{ k: 'extraMove', dice: 'D6' }] }
        ]
      },
      "Cryptek Conclave": {
        rule: { name: "Technosorcerous Augmentations", desc: "Cryptek ranged weapons gain [ASSAULT]. Each Shooting phase, a Cryptek unit picks one ability ([ANTI-INFANTRY 3+], [ANTI-MOUNTED 4+], [ASSAULT], [HEAVY], or [IGNORES COVER]).",
          fx: [{ k: 'grant', ab: 'assault', cond: 'cryptekUnit', scope: 'army' }] },
        enhancements: [
          { name: "Quantum Abacus", pts: 15, restrict: "NECRONS", desc: "Regain CP when targeted by a Stratagem (4+).", fx: [] },
          { name: "Atomic Disintegrators", pts: 10, restrict: "CRYPTEK", desc: "Extra ANTI ability options.", fx: [] },
          { name: "Gauntlet of Compression", pts: 20, restrict: "NECRONS", desc: "+6\" Range to the unit's ranged weapons.", fx: [] },
          { name: "Gravitic Bolas", pts: 15, restrict: "CRYPTEK", desc: "Pins an enemy hit by the bearer's shooting.", fx: [] }
        ],
        stratagems: [
          { name: "Molecular Targeting", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Ignore Hit modifiers (and Wound modifiers if CRYPTEK).", fx: [{ k: 'ignoreModifiers' }] },
          { name: "Microscarab Swarm", cp: 1, type: "Wargear", when: 'targeted', targetSelf: true, desc: "Warriors gain 5+ invuln; Immortals 4+ invuln.", fx: [{ k: 'invuln', val: 5 }] },
          { name: "Animus Curse", cp: 1, type: "Wargear", when: 'oppShootResolved', targetSelf: true, desc: "Re-roll Hits vs the unit that killed your Cryptek.", fx: [{ k: 'rerollHit', val: 'all' }] },
          { name: "Synergistic Empowerment", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Grant a nearby model the CRYPTEK keyword.", fx: [] },
          { name: "Untapped Power", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Pick an extra Augmentation ability.", fx: [{ k: 'grant', ab: 'ignorescover' }] },
          { name: "Potentiality Syphon", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Reanimate (unit near an objective; +1 if Cryptek).", fx: [{ k: 'reanimate', dice: 'D3' }] }
        ]
      },
      "Cursed Legion": {
        rule: { name: "Cold Fervour", desc: "+2 Strength to Destroyer Cult weapons. After a Destroyer Cult unit destroys/breaks a unit (first time each turn), +2 Strength to your other Necrons' weapons until end of turn.",
          fx: [{ k: 'plusStrMelee', n: 2, cond: 'destroyerCult', scope: 'army' }, { k: 'plusStrRanged', n: 2, cond: 'destroyerCult', scope: 'army' }] },
        enhancements: [
          { name: "Destroyer Ankh", pts: 20, restrict: "OVERLORD/COMMAND BARGE", desc: "Bearer gains DESTROYER CULT; +2 Attacks melee.", fx: [{ k: 'plusAttacksMelee', n: 2, selfOnly: true }] },
          { name: "Murdermind", pts: 15, restrict: "CRYPTEK", desc: "Bearer joins a Destroyer Cult unit.", fx: [] },
          { name: "Mark of the Nekrosor", pts: 20, restrict: "DESTROYER CULT", desc: "+1 to the unit's Hit rolls.", fx: [{ k: 'addHit', n: 1 }] },
          { name: "Cursed Circlet", pts: 25, restrict: "DESTROYER CULT", desc: "Surge move toward the enemy after taking casualties.", fx: [] }
        ],
        stratagems: [
          { name: "Methodical Murder", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Weapons gain [SUSTAINED HITS 1].", fx: [{ k: 'grant', ab: 'sustained', val: 1 }] },
          { name: "Image of Death", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Destroyer Cult: incoming attacks -1 to Hit.", fx: [{ k: 'subIncomingHit', n: 1 }] },
          { name: "Mortis Protocols", cp: 1, type: "Strategic Ploy", when: 'shootOrFight', targetSelf: true, desc: "A nearby unit reanimates.", fx: [{ k: 'reanimate', dice: 'D3' }] },
          { name: "Driven to Butchery", cp: 1, type: "Strategic Ploy", when: 'shootOrCharge', targetSelf: true, desc: "Shoot/charge after Advancing.", fx: [{ k: 'eligShootAfterAdvance' }, { k: 'eligChargeAfterAdvance' }] },
          { name: "Spreading Madness", cp: 1, type: "Battle Tactic", when: 'charge', targetSelf: true, desc: "+2 Charge when supported by a friendly unit in combat.", fx: [{ k: 'rerollCharge' }] },
          { name: "Unnatural Aggression", cp: 2, type: "Strategic Ploy", when: 'oppChargeEnd', targetSelf: true, desc: "Declare and resolve a charge in the opponent's turn (no bonus).", fx: [] }
        ]
      },
      "Pantheon of Woe": {
        rule: { name: "Cosmic Distortion", desc: "Enemy units within 6\" of your MONSTERS are 'unravelling' (attacks vs them get +1 AP). A MONSTER may take 3 mortal wounds to extend that aura to 9\".",
          fx: [{ k: 'plusApMelee', n: 1, cond: 'targetUnravelling', scope: 'army' }, { k: 'plusApRanged', n: 1, cond: 'targetUnravelling', scope: 'army' }] },
        enhancements: [
          { name: "Singularity Matrix (Deceiver)", pts: 55, restrict: "C'TAN DECEIVER", desc: "Aura: enemy Stratagems within 12\" cost +1CP.", fx: [{ k: 'enemyStratTax', val: 1 }] },
          { name: "Quantum Goad (Nightbringer)", pts: 45, restrict: "C'TAN NIGHTBRINGER", desc: "May charge after Advancing.", fx: [{ k: 'eligChargeAfterAdvance', selfOnly: true }] },
          { name: "Animus Damper (Void Dragon)", pts: 35, restrict: "C'TAN VOID DRAGON", desc: "Debuffs an enemy VEHICLE's attacks.", fx: [] },
          { name: "Reletavistic Tether", pts: 40, restrict: "TRANSCENDENT C'TAN", desc: "Flexible deep-strike placement.", fx: [] }
        ],
        stratagems: [
          { name: "Disharmonisation Cascade", cp: 1, type: "Epic Deed", when: 'vehicleDestroyed', targetSelf: true, desc: "MONSTER Deadly Demise triggers on 3+.", fx: [] },
          { name: "Molecular Erosion", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Battle-shock an unravelling enemy (D3+1 mortals on fail).", fx: [] },
          { name: "Mass Transmogrification", cp: 1, type: "Epic Deed", when: 'shootOrFight', targetSelf: true, desc: "Reanimate after a MONSTER destroys an unravelling unit.", fx: [{ k: 'reanimate', dice: 'D3' }] },
          { name: "Entrophasic Aura Targeting", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Re-roll Hits of 1 (Wounds of 1 vs unravelling).", fx: [{ k: 'rerollHit', val: 1 }, { k: 'rerollWound', val: 1, cond: 'targetUnravelling' }] },
          { name: "Chronodistortion", cp: 1, type: "Battle Tactic", when: 'fightTargeted', targetSelf: true, desc: "Destroyed models fight on 4+ (+1 if attacker unravelling).", fx: [{ k: 'fightOnDeath' }] },
          { name: "Phase Melding", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Force Desperate Escape tests on a falling-back unravelling enemy.", fx: [] }
        ]
      }
    }
  },

  "Blood Angels": {
    // Blood Angels keep Oath of Moment (Sons of Sanguinius is the chapter-naming rule).
    // They are on the Oath exclusion list, so codexPure is false -> hit re-roll yes, +1 wound no.
    armyRule: {
      name: "Oath of Moment",
      desc: "Pick an enemy Oath target each Command phase; re-roll Hits against it. (Blood Angels do not get the +1-to-Wound half.)",
      fx: [{ k: 'rerollHit', val: 'all', cond: 'targetIsOath', scope: 'army' },
           { k: 'rerollWound', val: 'all', cond: 'targetIsOath+codexPure', scope: 'army' }]
    },
    restrictions: [
      "Blood Angels Chapter only (no other Chapter's units).",
      "On the Oath exclusion list: Oath grants the Hit re-roll but not the +1 to Wound."
    ],
    detachments: {
      "Liberator Assault Group": {
        chapter: "BLOOD ANGELS",
        rule: { name: "Red Thirst", desc: "A unit that Charged this turn: +1 Attack and +2 Strength to its melee weapons until end of phase.",
          fx: [{ k: 'plusAttacksMelee', n: 1, cond: 'meleeOnly+chargedThisTurn', scope: 'army' },
               { k: 'plusStrMelee', n: 2, cond: 'meleeOnly+chargedThisTurn', scope: 'army' }] },
        enhancements: [
          { name: "Speed of the Primarch", pts: 25, restrict: "ADEPTUS ASTARTES", desc: "Once: unit gains Fights First this Fight phase.", fx: [{ k: 'fightsFirst', selfOnly: true }] },
          { name: "Rage-fuelled Warrior", pts: 35, restrict: "ADEPTUS ASTARTES", desc: "Once: bearer's melee gain [SUSTAINED HITS 3] this Fight phase.", fx: [{ k: 'grant', ab: 'sustained', val: 3, selfOnly: true }] },
          { name: "Icon of the Angel", pts: 20, restrict: "ADEPTUS ASTARTES", desc: "Enemies in Engagement Range take Desperate Escape tests when falling back.", fx: [] },
          { name: "Gift of Foresight", pts: 15, restrict: "ADEPTUS ASTARTES", desc: "Once per round: treat a Hit/Wound/save for the bearer as an unmodified 6.", fx: [] }
        ],
        stratagems: [
          { name: "Angelic Grace", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "FNP 5+ vs mortal wounds.", fx: [{ k: 'fnp', val: 5 }] },
          { name: "Armour of Contempt", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Worsen incoming AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Savage Echoes", cp: 1, type: "Battle Tactic", when: 'oppCharge', targetSelf: true, desc: "+1 Strength to melee (when charged).", fx: [{ k: 'plusStrMelee', n: 1 }] },
          { name: "Savage Echoes (Red Thirst)", cp: 1, type: "Battle Tactic", when: 'oppCharge', targetSelf: true, desc: "Give in: become Battle-shocked, +1 Strength AND +1 Attacks to melee.", fx: [{ k: 'plusStrMelee', n: 1 }, { k: 'plusAttacksMelee', n: 1 }, { k: 'selfBattleshock' }] },
          { name: "Red Rampage", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Melee gain [LANCE] or [LETHAL HITS].", fx: [{ k: 'grant', ab: 'lethal' }] },
          { name: "Red Rampage (Red Thirst)", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Give in: become Battle-shocked, melee gain [LANCE] and [LETHAL HITS].", fx: [{ k: 'grant', ab: 'lethal' }, { k: 'grant', ab: 'lance' }, { k: 'selfBattleshock' }] },
          { name: "Aggressive Onslaught", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot or charge after Advancing.", fx: [{ k: 'eligChargeAfterAdvance' }, { k: 'eligShootAfterAdvance' }] },
          { name: "Relentless Assault", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot or charge after Falling Back.", fx: [{ k: 'eligChargeAfterFallBack' }, { k: 'eligShootAfterFallBack' }] }
        ]
      },
      "The Lost Brethren": {
        chapter: "BLOOD ANGELS",
        rule: { name: "A Noble Death in Combat", desc: "Death Company melee: re-roll Wounds of 1 if below Starting Strength; full re-roll if Below Half-strength.",
          fx: [{ k: 'rerollWound', val: 1, cond: 'meleeOnly+selfBelowStrength', scope: 'army' },
               { k: 'rerollWound', val: 'all', cond: 'meleeOnly+selfBelowHalf', scope: 'army' }] },
        enhancements: [
          { name: "Sanguinius' Grace", pts: 20, restrict: "DEATH COMPANY", desc: "Once: bearer fights one additional time (vs 3+ enemy models).", fx: [] },
          { name: "Blood Shard", pts: 25, restrict: "DEATH COMPANY", desc: "First destroyed: returns on a 2+ with 3 wounds.", fx: [{ k: 'resurrect', val: 3 }] },
          { name: "To Slay the Warmaster", pts: 15, restrict: "DEATH COMPANY", desc: "Once: mortal-wound an enemy CHARACTER in Engagement Range.", fx: [] },
          { name: "Vengeful Onslaught", pts: 10, restrict: "DEATH COMPANY", desc: "If destroyed, friendly Death Company get +1 Hit until end of next turn.", fx: [] }
        ],
        stratagems: [
          { name: "Glorious Sacrifice", cp: 1, type: "Epic Deed", when: 'anyDestroyed', targetSelf: true, desc: "Hold a contested objective stickily after dying on it.", fx: [{ k: 'stickyObjective' }] },
          { name: "Armour of Contempt", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Worsen incoming AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Final Retribution", cp: 1, type: "Epic Deed", when: 'fightTargeted', targetSelf: true, desc: "Destroyed models fight on a 4+ (+1 near a Chaplain).", fx: [{ k: 'fightOnDeath' }] },
          { name: "Furious Onslaught", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Pile-in up to D3+3\" (6\" near a Chaplain or if below strength).", fx: [] },
          { name: "Lost to Rage", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Below-strength: +1 Attacks/Strength/AP to melee ([HAZARDOUS] unless near a Chaplain).", fx: [{ k: 'plusAttacksMelee', n: 1 }, { k: 'plusStrMelee', n: 1 }, { k: 'plusApMelee', n: 1 }] },
          { name: "Wrathful Rampage", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Death Company: charge after Advancing (shoot too if near a Chaplain / below strength).", fx: [{ k: 'eligChargeAfterAdvance' }] }
        ]
      },
      "The Angelic Host": {
        chapter: "BLOOD ANGELS",
        rule: { name: "Upon Wings of Fire", desc: "End of opponent's turn: pull JUMP PACK units into Reserves, then Deep Strike them next Movement phase. (Reserve teleport resolves once that system exists; stored and shown.)",
          fx: [] },
        enhancements: [
          { name: "Artisan of War", pts: 20, restrict: "JUMP PACK", desc: "+1 AP to bearer's weapons; 2+ Save.", fx: [{ k: 'plusApMelee', n: 1, selfOnly: true }, { k: 'plusApRanged', n: 1, selfOnly: true }] },
          { name: "Visage of Death", pts: 15, restrict: "JUMP PACK", desc: "Enemies in Engagement Range take a Battle-shock test each opponent's Command phase.", fx: [] },
          { name: "Archangel's Shard", pts: 15, restrict: "JUMP PACK", desc: "Bearer's melee gain [ANTI-CHAOS 5+] and [LANCE].", fx: [{ k: 'grant', ab: 'lance', selfOnly: true }, { k: 'antiVal', kw: 'CHAOS', val: 5, selfOnly: true }] },
          { name: "Gleaming Pinions", pts: 25, restrict: "JUMP PACK", desc: "Reactive 6\" Normal move when an enemy ends a move nearby.", fx: [] }
        ],
        stratagems: [
          { name: "Unbridled Ardour", cp: 1, type: "Epic Deed", when: 'anyDestroyed', targetSelf: true, desc: "Sanguinary Guard re-roll Hits & Wounds vs the unit that killed yours (rest of battle).", fx: [{ k: 'rerollHit', val: 'all' }, { k: 'rerollWound', val: 'all' }] },
          { name: "Armour of Contempt", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Worsen incoming AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Angel's Sacrifice", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Enemies in Engagement Range must target this unit with all attacks.", fx: [] },
          { name: "Martial Exemplars", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Melee gain [LETHAL HITS] and [PRECISION].", fx: [{ k: 'grant', ab: 'lethal' }, { k: 'grant', ab: 'precision' }] },
          { name: "Descent of Angels", cp: 1, type: "Epic Deed", when: 'movement', targetSelf: true, desc: "Deep-Striking JUMP PACK unit sets up >6\" away (no charge that turn).", fx: [] },
          { name: "Death from the Skies", cp: 1, type: "Epic Deed", when: 'movement', targetSelf: true, desc: "JUMP PACK: shoot and charge after Advancing or Falling Back.", fx: [{ k: 'eligShootAfterAdvance' }, { k: 'eligChargeAfterAdvance' }, { k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] }
        ]
      },
      "Angelic Inheritors": {
        chapter: "BLOOD ANGELS",
        rule: { name: "Legacy of the Angel", desc: "Start of battle: pick two Angelic Legacies for your CHARACTER units (persist all game).",
          fx: [] },
        doctrineLabel: "Legacy",
        doctrineOncePerBattle: true,
        doctrines: [
          { id: 'grace', name: "Sanguinary Grace", desc: "CHARACTERS: shoot and charge after Falling Back.", fx: [{ k: 'eligShootAfterFallBack', cond: 'characterLeading', scope: 'army' }, { k: 'eligChargeAfterFallBack', cond: 'characterLeading', scope: 'army' }] },
          { id: 'carmine', name: "Carmine Wrath", desc: "CHARACTERS: re-roll Hits of 1 and Wounds of 1.", fx: [{ k: 'rerollHit', val: 1, cond: 'characterLeading', scope: 'army' }, { k: 'rerollWound', val: 1, cond: 'characterLeading', scope: 'army' }] },
          { id: 'hour', name: "Their Appointed Hour", desc: "CHARACTERS: re-roll Advance and Charge rolls.", fx: [{ k: 'rerollAdvance', cond: 'characterLeading', scope: 'army' }, { k: 'rerollCharge', cond: 'characterLeading', scope: 'army' }] }
        ],
        enhancements: [
          { name: "Prescient Flash", pts: 20, restrict: "ADEPTUS ASTARTES", desc: "Unit gains Scouts 6\".", fx: [] },
          { name: "Troubling Visions", pts: 15, restrict: "ADEPTUS ASTARTES", desc: "Once: all Legacies active for the bearer's unit this turn.", fx: [] },
          { name: "Blazing Icon", pts: 20, restrict: "ADEPTUS ASTARTES INFANTRY", desc: "Enemies cannot Fire Overwatch at the bearer's unit.", fx: [] },
          { name: "Ordained Sacrifice", pts: 25, restrict: "ADEPTUS ASTARTES", desc: "First destroyed: returns on a 2+ with 3 wounds.", fx: [{ k: 'resurrect', val: 3 }] }
        ],
        stratagems: [
          { name: "Armour of Contempt", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Worsen incoming AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Focused Fury", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Melee gain [LETHAL HITS] ([LANCE] too if a CHARACTER unit).", fx: [{ k: 'grant', ab: 'lethal' }, { k: 'grant', ab: 'lance', cond: 'characterLeading' }] },
          { name: "Instant of Grace", cp: 1, type: "Epic Deed", when: 'command', targetSelf: true, desc: "A non-character model in your unit gains CHARACTER until your next Command phase.", fx: [] },
          { name: "Strike Now for Glory", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Ranged gain [SUSTAINED HITS 1].", fx: [{ k: 'grant', ab: 'sustained', val: 1 }] },
          { name: "In the Shadow of Great Wings", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "CHARACTER unit can only be shot from within 18\".", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12' }] },
          { name: "Unto the Burning Skies", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull a JUMP PACK unit into Reserves.", fx: [] }
        ]
      },
      "Rage-cursed Onslaught": {
        chapter: "BLOOD ANGELS",
        rule: { name: "Maddened Ferocity", desc: "Re-roll melee Wounds of 1. A unit that Charged: +1 Attack to melee (+2 instead if Battle-shocked).",
          fx: [{ k: 'rerollWound', val: 1, cond: 'meleeOnly', scope: 'army' },
               { k: 'plusAttacksMelee', n: 1, cond: 'meleeOnly+chargedThisTurn', scope: 'army' },
               { k: 'plusAttacksMelee', n: 1, cond: 'meleeOnly+chargedThisTurn+selfBattleshocked', scope: 'army' }] },
        enhancements: [
          { name: "Carmine Reliquary", pts: 30, restrict: "CHAPLAIN", desc: "Unit gains Scouts 6\"; re-roll Battle-shock tests for nearby units.", fx: [] },
          { name: "Master of the Red Thirst", pts: 25, restrict: "ADEPTUS ASTARTES", desc: "Once: unit gains Fights First this Fight phase.", fx: [{ k: 'fightsFirst', selfOnly: true }] },
          { name: "Sanguinary Tear", pts: 35, restrict: "ADEPTUS ASTARTES", desc: "Aura: friendly Death Company within 6\" get +1 Strength.", fx: [] },
          { name: "Angel's Fang", pts: 25, restrict: "ADEPTUS ASTARTES", desc: "Bearer's melee vs CHARACTER/MONSTER/VEHICLE have [SUSTAINED HITS 2].", fx: [{ k: 'grant', ab: 'sustained', val: 2, cond: 'targetCMV', selfOnly: true }] }
        ],
        stratagems: [
          { name: "A Grim Warning", cp: 1, type: "Epic Deed", when: 'anyDestroyed', targetSelf: true, desc: "Hold a contested objective stickily after dying on it.", fx: [{ k: 'stickyObjective' }] },
          { name: "Armour of Contempt", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Worsen incoming AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Insensate Rampage", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Death Company gain Feel No Pain 5+.", fx: [{ k: 'fnp', val: 5 }] },
          { name: "Limb from Limb", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "+1 Strength or AP to melee (charged this turn).", fx: [{ k: 'plusStrMelee', n: 1 }] },
          { name: "Limb from Limb (Red Thirst)", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Give in: become Battle-shocked, +1 Strength AND +1 AP to melee.", fx: [{ k: 'plusStrMelee', n: 1 }, { k: 'plusApMelee', n: 1 }, { k: 'selfBattleshock' }] },
          { name: "Deathless Duty", cp: 2, type: "Epic Deed", when: 'fightTargeted', targetSelf: true, desc: "Death Company destroyed models fight on before removal.", fx: [{ k: 'fightOnDeath' }] },
          { name: "Red Wrath", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot or charge after Advancing (both, become Battle-shocked, if you give in).", fx: [{ k: 'eligChargeAfterAdvance' }] }
        ]
      }
    }
  },

  "Dark Angels": {
    // The Unforgiven keep Oath of Moment but are on the exclusion list (Hit re-roll, no Wound bonus).
    // Distinctive: DEATHWING / RAVENWING sub-keywords (derived by unit type) and Battle-shock as a positive trigger.
    armyRule: {
      name: "Oath of Moment",
      desc: "Pick an enemy Oath target each Command phase; re-roll Hits against it. (Dark Angels do not get the +1-to-Wound half.)",
      fx: [{ k: 'rerollHit', val: 'all', cond: 'targetIsOath', scope: 'army' },
           { k: 'rerollWound', val: 'all', cond: 'targetIsOath+codexPure', scope: 'army' }]
    },
    restrictions: [
      "Dark Angels Chapter only (no other Chapter's units).",
      "On the Oath exclusion list: Oath grants the Hit re-roll but not the +1 to Wound.",
      "DEATHWING (Terminators, certain veterans, Dreadnoughts, Land Raiders/Repulsors) and RAVENWING (Mounted, Fly-Vehicles) keywords are derived by unit type."
    ],
    detachments: {
      "Unforgiven Task Force": {
        chapter: "DARK ANGELS",
        rule: { name: "Grim Resolve", desc: "Battle-shocked units keep OC 1 (not 0). In Command, a chosen unit gets +1 OC.",
          fx: [] },
        enhancements: [
          { name: "Shroud of Heroes", pts: 25, restrict: "ADEPTUS ASTARTES", desc: "First destroyed: returns on a 2+ with 3 wounds (full if it was Battle-shocked).", fx: [{ k: 'resurrect', val: 3 }] },
          { name: "Stubborn Tenacity", pts: 15, restrict: "ADEPTUS ASTARTES", desc: "+1 Hit if the unit is below Starting Strength; +1 Wound too if also Battle-shocked.",
            fx: [{ k: 'addHit', n: 1, cond: 'selfBelowStrength' }, { k: 'addWound', n: 1, cond: 'selfBelowStrength+selfBattleshocked' }] },
          { name: "Weapons of the First Legion", pts: 15, restrict: "ADEPTUS ASTARTES", desc: "+1 A/S/D melee (+2 instead while Battle-shocked).",
            fx: [{ k: 'plusAttacksMelee', n: 1, selfOnly: true }, { k: 'plusStrMelee', n: 1, selfOnly: true }, { k: 'plusAttacksMelee', n: 1, cond: 'selfBattleshocked', selfOnly: true }, { k: 'plusStrMelee', n: 1, cond: 'selfBattleshocked', selfOnly: true }] },
          { name: "Pennant of Remembrance", pts: 10, restrict: "ANCIENT", desc: "Unit has FNP 6+ (FNP 4+ while Battle-shocked).", fx: [{ k: 'fnp', val: 6 }, { k: 'fnp', val: 4, cond: 'selfBattleshocked' }] }
        ],
        stratagems: [
          { name: "Armour of Contempt", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Worsen incoming AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Unforgiven Fury", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Weapons gain [LETHAL HITS]; crit on 5+ if any of your units are Battle-shocked.", fx: [{ k: 'grant', ab: 'lethal' }, { k: 'critOn', val: 5, cond: 'selfBattleshocked' }] },
          { name: "Intractable", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot and charge after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Fire Discipline", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Ranged gain [ASSAULT], [HEAVY] and [IGNORES COVER].", fx: [{ k: 'grant', ab: 'assault' }, { k: 'grant', ab: 'heavy' }, { k: 'grant', ab: 'ignorescover' }] },
          { name: "Grim Retribution", cp: 1, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Shoot back at the unit that just attacked you.", fx: [{ k: 'shootBack' }] },
          { name: "Unbreakable Lines", cp: 2, type: "Battle Tactic", when: 'oppChargeEnd', targetSelf: true, desc: "Incoming attacks -1 to Wound this turn.", fx: [{ k: 'subIncomingWound', n: 1 }] }
        ]
      },
      "Inner Circle Task Force": {
        chapter: "DARK ANGELS",
        rule: { name: "Vowed Target", desc: "Pick Vowed objective(s) each Movement phase. DEATHWING INFANTRY get +1 to Wound vs units within range of them.",
          fx: [{ k: 'addWound', n: 1, cond: 'deathwing+targetWithinObjective', scope: 'army' }] },
        enhancements: [
          { name: "Champion of the Deathwing", pts: 15, restrict: "DEATHWING", desc: "Bearer's melee have [LETHAL HITS]; crit on 5+ near your Vowed objective.", fx: [{ k: 'grant', ab: 'lethal', selfOnly: true }, { k: 'critOn', val: 5, cond: 'selfWithinObjective', selfOnly: true }] },
          { name: "Eye of the Unseen", pts: 10, restrict: "DEATHWING", desc: "Chance to refund 1CP when targeted by a Stratagem.", fx: [] },
          { name: "Singular Will", pts: 20, restrict: "DEATHWING", desc: "Unit Piles-in/Consolidates an extra 3\".", fx: [] },
          { name: "Deathwing Assault", pts: 30, restrict: "DEATHWING", desc: "Deep Strike in turn 1, 2 or 3 regardless of mission rules.", fx: [] }
        ],
        stratagems: [
          { name: "Armour of Contempt", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Worsen incoming AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Martial Mastery", cp: 1, type: "Epic Deed", when: 'fight', targetSelf: true, desc: "Re-roll melee Wounds of 1 (full re-roll near your Vowed objective).", fx: [{ k: 'rerollWound', val: 1, cond: 'meleeOnly' }, { k: 'rerollWound', val: 'all', cond: 'meleeOnly+selfWithinObjective' }] },
          { name: "Duty unto Death", cp: 1, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "Deathwing destroyed models fight on (4+, +1 near Vowed objective).", fx: [{ k: 'fightOnDeath' }] },
          { name: "Relic Teleportarium", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Deep-Striking Deathwing sets up >6\" away (no charge).", fx: [] },
          { name: "Wrath of the Lion", cp: 1, type: "Epic Deed", when: 'charge', targetSelf: true, desc: "Deathwing Infantry that charged: mortal wounds to an engaged enemy.", fx: [] },
          { name: "Unmatched Fortitude", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Deathwing Infantry: -1 to Wound when attack S > their T.", fx: [{ k: 'subIncomingWound', n: 1, cond: 'strHigherThanT' }] }
        ]
      },
      "Company of Hunters": {
        chapter: "DARK ANGELS",
        rule: { name: "Masters of Manoeuvre", desc: "Your units may shoot after Advancing or Falling Back; MOUNTED units may shoot and charge after Advancing or Falling Back.",
          fx: [{ k: 'eligShootAfterAdvance', scope: 'army' }, { k: 'eligShootAfterFallBack', scope: 'army' },
               { k: 'eligChargeAfterAdvance', cond: 'ravenwing', scope: 'army' }, { k: 'eligChargeAfterFallBack', cond: 'ravenwing', scope: 'army' }] },
        enhancements: [
          { name: "Master-crafted Weapon", pts: 10, restrict: "RAVENWING", desc: "Bearer's melee have [PRECISION].", fx: [{ k: 'grant', ab: 'precision', selfOnly: true }] },
          { name: "Mounted Strategist", pts: 30, restrict: "RAVENWING", desc: "Re-roll Advance and Charge rolls for the unit.", fx: [{ k: 'rerollAdvance' }, { k: 'rerollCharge' }] },
          { name: "Master of Manoeuvre", pts: 15, restrict: "RAVENWING", desc: "Reserves bonus: arrives a round earlier and ignores the reserves points cap.", fx: [] },
          { name: "Recon Hunter", pts: 20, restrict: "RAVENWING", desc: "Unit gains Scouts 9\".", fx: [] }
        ],
        stratagems: [
          { name: "Hunters' Trail", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Ravenwing Mounted hold an objective stickily.", fx: [{ k: 'stickyObjective' }] },
          { name: "Armour of Contempt", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Worsen incoming AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Talon Strike", cp: 1, type: "Strategic Ploy", when: 'shootOrFight', targetSelf: true, desc: "Ravenwing Mounted: +1 Wound vs INFANTRY/MOUNTED CHARACTERS.", fx: [{ k: 'addWound', n: 1, cond: 'targetInfMountedChar' }] },
          { name: "Death on the Wind", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Battle-shock a unit you just hit (-1 if Ravenwing nearby).", fx: [] },
          { name: "High-speed Focus", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Incoming attacks -1 to Hit.", fx: [{ k: 'subIncomingHit', n: 1 }] },
          { name: "Rapid Reappraisal", cp: 1, type: "Battle Tactic", when: 'oppFightEnd', targetSelf: true, desc: "Pull a Ravenwing unit into Reserves.", fx: [] }
        ]
      },
      "Wrath of the Rock": {
        chapter: "DARK ANGELS",
        rule: { name: "Dutiful Tenacity", desc: "INFANTRY/MOUNTED units: -1 to Wound against them when the attack's Strength exceeds their Toughness.",
          fx: [{ k: 'subIncomingWound', n: 1, cond: 'strHigherThanT', scope: 'army' }] },
        enhancements: [
          { name: "Tempered in Battle", pts: 10, restrict: "ADEPTUS ASTARTES", desc: "Aura: re-roll Battle-shock/Leadership for nearby units.", fx: [] },
          { name: "Ancient Weapons", pts: 25, restrict: "ADEPTUS ASTARTES", desc: "+2 Strength, +1 AP, +1 Damage to bearer's melee.", fx: [{ k: 'plusStrMelee', n: 2, selfOnly: true }, { k: 'plusApMelee', n: 1, selfOnly: true }] },
          { name: "Deathwing Assault", pts: 15, restrict: "DEATHWING", desc: "Deep Strike in turn 1, 2 or 3 regardless of mission rules.", fx: [] },
          { name: "Lord of the Ravenwing", pts: 10, restrict: "RAVENWING", desc: "Re-roll Advance and Charge rolls for the unit.", fx: [{ k: 'rerollAdvance' }, { k: 'rerollCharge' }] }
        ],
        stratagems: [
          { name: "Inescapable Justice", cp: 2, type: "Battle Tactic", when: 'anyDestroyed', targetSelf: true, desc: "After your Oath target dies, name a new one within 12\".", fx: [] },
          { name: "Lion's Will", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "+1 OC; +1 Hit too if not Deathwing/Ravenwing/Vehicle.", fx: [{ k: 'objControl', n: 1 }] },
          { name: "Armour of Contempt", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Worsen incoming AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Tactical Mastery", cp: 1, type: "Battle Tactic", when: 'movement', targetSelf: true, desc: "Shoot and charge after Advancing (Ravenwing: after Falling Back too).", fx: [{ k: 'eligShootAfterAdvance' }, { k: 'eligChargeAfterAdvance' }, { k: 'eligShootAfterFallBack', cond: 'ravenwing' }, { k: 'eligChargeAfterFallBack', cond: 'ravenwing' }] },
          { name: "Relics of the Dark Age", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "+2 Strength to ranged weapons.", fx: [{ k: 'plusStrRanged', n: 2 }] },
          { name: "Leonine Aggression", cp: 1, type: "Strategic Ploy", when: 'oppChargeEnd', targetSelf: true, desc: "Declare and resolve a charge in the opponent's turn (no bonus).", fx: [] }
        ]
      },
      "Lion's Blade Task Force": {
        chapter: "DARK ANGELS",
        rule: { name: "In the Lion's Claws", desc: "Enemies falling back from your Ravenwing take Desperate Escape tests; Deathwing charging a target engaged by your Ravenwing add 2 to the Charge roll.",
          fx: [] },
        enhancements: [
          { name: "Calibanite Armaments", pts: 15, restrict: "ADEPTUS ASTARTES", desc: "+1 Damage to bearer's melee.", fx: [] },
          { name: "Lord of the Hunt", pts: 15, restrict: "RAVENWING", desc: "Shoot and charge after Falling Back; re-roll Desperate Escape.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Stalwart Champion", pts: 25, restrict: "CAPTAIN/CHAPLAIN/LIEUTENANT", desc: "+1 OC while the bearer's unit is not Battle-shocked.", fx: [] },
          { name: "Fulgus Magna", pts: 20, restrict: "DEATHWING", desc: "Once: pull the bearer's unit into Reserves at end of opponent's turn.", fx: [] }
        ],
        stratagems: [
          { name: "Overpowering Exaction", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Battle-shock an engaged enemy (-1 if Deathwing/Ravenwing).", fx: [] },
          { name: "Armour of Contempt", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Worsen incoming AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Strength in Unity", cp: 1, type: "Battle Tactic", when: 'fightTargeted', targetSelf: true, desc: "Attackers near your Ravenwing -1 Hit; near your Deathwing -1 Wound when S>T.", fx: [{ k: 'subIncomingHit', n: 1, cond: 'ravenwing' }, { k: 'subIncomingWound', n: 1, cond: 'deathwing+strHigherThanT' }] }
        ]
      }
    }
  },

  "Space Wolves": {
    // Sons of Russ keep Oath of Moment but are on the exclusion list (Hit re-roll, no Wound re-roll).
    // Each detachment carries a SAGA: a baseline effect plus a "Saga completed" upgrade, toggled manually.
    armyRule: {
      name: "Oath of Moment",
      desc: "Pick an enemy Oath target each Command phase; re-roll Hits against it. (Space Wolves do not get the +1-to-Wound half. Curse of the Wulfen — an objective-control aura — is tracked separately.)",
      fx: [{ k: 'rerollHit', val: 'all', cond: 'targetIsOath', scope: 'army' },
           { k: 'rerollWound', val: 'all', cond: 'targetIsOath+codexPure', scope: 'army' }]
    },
    restrictions: [
      "Space Wolves Chapter only (no other Chapter's units).",
      "On the Oath exclusion list: Oath grants the Hit re-roll but not the +1 to Wound.",
      "Each detachment has a Saga objective. Use the 'Mark Saga completed' toggle in the stratagem panel once you've met it; this unlocks the detachment rule's upgraded effect.",
      "Curse of the Wulfen (Objective-Control aura near Space Wolves Characters/Wolf Priests) is positional and tracked by the players."
    ],
    detachments: {
      "Saga of the Hunter": {
        chapter: "SPACE WOLVES",
        saga: true,
        rule: { name: "Pack's Quarry", desc: "+1 to Hit in melee vs a target engaged by another friendly Astartes unit OR outnumbered by the attacker. Saga: +1 to Wound as well.",
          fx: [{ k: 'addHit', n: 1, cond: 'meleeOnly+packsQuarry', scope: 'army' },
               { k: 'addWound', n: 1, cond: 'meleeOnly+packsQuarry+sagaCompleted', scope: 'army' }] },
        enhancements: [
          { name: "Swift Hunter", pts: 20, restrict: "SPACE WOLVES", desc: "Unit gains Scouts 7\".", fx: [] },
          { name: "Fenrisian Grit", pts: 15, restrict: "ADEPTUS ASTARTES", desc: "Bearer has Feel No Pain 4+.", fx: [{ k: 'fnp', val: 4, selfOnly: true }] },
          { name: "Wolf Master", pts: 5, restrict: "SPACE WOLVES", desc: "A chosen unit's beast weapons gain [LETHAL HITS] (Command phase).", fx: [] },
          { name: "Feral Rage", pts: 10, restrict: "ADEPTUS ASTARTES", desc: "+1 Attack melee (+1 more after a Charge).", fx: [{ k: 'plusAttacksMelee', n: 1, selfOnly: true }, { k: 'plusAttacksMelee', n: 1, cond: 'chargedThisTurn', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Hunters' Trail", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Pile-in/Consolidate up to 6\", freely toward closest unit.", fx: [] },
          { name: "Territorial Advantage", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Hold an objective stickily after destroying a unit.", fx: [{ k: 'stickyObjective' }] },
          { name: "Overwhelming Onslaught", cp: 1, type: "Battle Tactic", when: 'fightTargeted', targetSelf: true, desc: "Attackers vs your engaged unit get -1 to Hit.", fx: [{ k: 'subIncomingHit', n: 1 }] },
          { name: "Chosen Prey", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot and charge after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Bounding Advance", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Move through models this phase.", fx: [] },
          { name: "Marked for Destruction", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Two units focus one target; re-roll Wounds of 1.", fx: [{ k: 'rerollWound', val: 1 }] }
        ]
      },
      "Saga of the Bold": {
        chapter: "SPACE WOLVES",
        saga: true,
        rule: { name: "Heroes All", desc: "A CHARACTER unit may re-roll one Hit/Wound/Damage roll. Saga: ANY unit may re-roll one Hit, one Wound and one Damage roll.",
          fx: [{ k: 'rerollOnePerPhase', cond: 'characterLeading', scope: 'army' },
               { k: 'rerollOnePerPhase', cond: 'sagaCompleted', scope: 'army' }] },
        enhancements: [
          { name: "Braggart's Steel", pts: 20, restrict: "SPACE WOLVES", desc: "+2 Strength melee (+1 Damage once a Boast is achieved).", fx: [{ k: 'plusStrMelee', n: 2, selfOnly: true }] },
          { name: "Skjald", pts: 15, restrict: "ADEPTUS ASTARTES", desc: "Gain 1CP when a Character achieves a Boast.", fx: [] },
          { name: "Hordeslayer", pts: 15, restrict: "SPACE WOLVES", desc: "+2 Attacks melee when outnumbered (+3 once a Boast is achieved).", fx: [] },
          { name: "Thunderwolf's Fortitude", pts: 25, restrict: "ADEPTUS ASTARTES", desc: "First destroyed: returns on a 2+ with 3 wounds.", fx: [{ k: 'resurrect', val: 3 }] }
        ],
        stratagems: [
          { name: "Inspiring Presence", cp: 1, type: "Epic Deed", when: 'fight', targetSelf: true, desc: "Character unit's melee gain [LETHAL HITS].", fx: [{ k: 'grant', ab: 'lethal' }] },
          { name: "Champion's Guidance", cp: 1, type: "Epic Deed", when: 'shootOrFight', targetSelf: true, desc: "Re-roll the Hit roll.", fx: [{ k: 'rerollHit', val: 'all' }] },
          { name: "Birth of a Saga", cp: 1, type: "Epic Deed", when: 'command', targetSelf: true, desc: "A Wolf Guard leader model gains CHARACTER until your next Command phase.", fx: [] },
          { name: "Alpha Strike", cp: 1, type: "Epic Deed", when: 'charge', targetSelf: true, desc: "Character unit may charge after Advancing.", fx: [{ k: 'eligChargeAfterAdvance' }] },
          { name: "Heroic Resolve", cp: 2, type: "Epic Deed", when: 'targeted', targetSelf: true, desc: "Character unit: -1 Damage to incoming attacks.", fx: [{ k: 'reduceIncomingDmg', n: 1 }] },
          { name: "Countercharge", cp: 2, type: "Epic Deed", when: 'oppChargeEnd', targetSelf: true, desc: "Character unit declares and resolves a charge in the opponent's turn.", fx: [] }
        ]
      },
      "Saga of the Beastslayer": {
        chapter: "SPACE WOLVES",
        saga: true,
        rule: { name: "Legendary Slayers", desc: "Attacks vs CHARACTER/MONSTER/VEHICLE have [LETHAL HITS]. Saga: ALL your attacks have [LETHAL HITS].",
          fx: [{ k: 'grant', ab: 'lethal', cond: 'targetCMV', scope: 'army' },
               { k: 'grant', ab: 'lethal', cond: 'sagaCompleted', scope: 'army' }] },
        enhancements: [
          { name: "Wolf-touched", pts: 15, restrict: "SPACE WOLVES", desc: "+2\" Move; may join a Wulfen unit.", fx: [] },
          { name: "Hunter's Guile", pts: 20, restrict: "ADEPTUS ASTARTES", desc: "Redeploy up to three Cavalry/Wulfen/Blood Claws units after deployment.", fx: [] },
          { name: "Elder's Guidance", pts: 20, restrict: "SPACE WOLVES", desc: "Once: +1 AP to a led Blood Claws unit's melee this Fight phase.", fx: [] },
          { name: "Helm of the Beastslayer", pts: 15, restrict: "ADEPTUS ASTARTES", desc: "Incoming attacks from CHARACTER/MONSTER/VEHICLE get -1 AP.", fx: [{ k: 'worsenIncomingAP', n: 1, cond: 'targetCMV' }] }
        ],
        stratagems: [
          { name: "Unbridled Ferocity", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "+1 to Wound in melee.", fx: [{ k: 'addWound', n: 1 }] },
          { name: "Shock Cavalry", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Thunderwolf Cavalry move through models/low terrain.", fx: [] },
          { name: "Pinning Fire", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Pin a CHARACTER/MONSTER/VEHICLE you hit.", fx: [] },
          { name: "Thunderous Pursuit", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Make a D6\" (or 6\") Normal move toward an enemy.", fx: [{ k: 'extraMove', dice: 'D6' }] },
          { name: "Impetuosity", cp: 1, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Wulfen/Blood Claws make an Impetuous move toward the enemy.", fx: [{ k: 'extraMove', dice: 'D6' }] },
          { name: "Coordinated Strike", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull a Space Wolves unit (near a board edge) into Reserves.", fx: [] }
        ]
      },
      "Champions of Fenris": {
        chapter: "SPACE WOLVES",
        rule: { name: "The Great Wolf Watches", desc: "End of opponent's Charge: eligible Infantry/Walkers within 3\" may counter-charge. Terminators get +1 OC while not Battle-shocked.",
          fx: [] },
        enhancements: [
          { name: "Wolves' Wisdom", pts: 30, restrict: "ADEPTUS ASTARTES INFANTRY", desc: "Counter-charge range extended to 6\".", fx: [] },
          { name: "Foes' Fate", pts: 15, restrict: "ADEPTUS ASTARTES TERMINATOR", desc: "Enemies in Engagement Range take Desperate Escape tests when falling back.", fx: [] },
          { name: "Fangrune Pendant", pts: 15, restrict: "ADEPTUS ASTARTES TERMINATOR", desc: "Unit may shoot and charge after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Longstrider", pts: 20, restrict: "ADEPTUS ASTARTES", desc: "Re-roll Charge rolls for the unit.", fx: [{ k: 'rerollCharge' }] }
        ],
        stratagems: [
          { name: "Preytaker's Eye", cp: 1, type: "Strategic Ploy", when: 'shootOrFight', targetSelf: true, desc: "Weapons gain [LETHAL HITS] or [SUSTAINED HITS 1].", fx: [{ k: 'grant', ab: 'lethal' }] },
          { name: "Armour of Contempt", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Worsen incoming AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Runes of Claiming", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Hold an objective stickily.", fx: [{ k: 'stickyObjective' }] },
          { name: "Chilling Howl", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Battle-shock enemies within 6\" of your Terminators.", fx: [] },
          { name: "Stalking Wolves", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Unit gains Stealth (incoming ranged -1 to Hit beyond 12\").", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12' }] },
          { name: "Onrushing Storm", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull a Terminator unit into Reserves.", fx: [] }
        ]
      },
      "Saga of the Great Wolf": {
        chapter: "SPACE WOLVES",
        rule: { name: "Master of Wolves", desc: "Command phase: pick a Hunting Pack (once each per battle) for your army.",
          fx: [] },
        doctrineLabel: "Hunting Pack",
        doctrineOncePerBattle: false,
        doctrines: [
          { id: 'jaws', name: "Encircling Jaws", desc: "Re-roll Advance and Charge rolls.", fx: [{ k: 'rerollAdvance', scope: 'army' }, { k: 'rerollCharge', scope: 'army' }] },
          { id: 'eye', name: "Hunter's Eye", desc: "+1 to Hit with ranged attacks.", fx: [{ k: 'addHit', n: 1, cond: 'rangedOnly', scope: 'army' }] },
          { id: 'strike', name: "Ferocious Strike", desc: "Melee gain [LETHAL HITS].", fx: [{ k: 'grant', ab: 'lethal', cond: 'meleeOnly', scope: 'army' }] }
        ],
        enhancements: [
          { name: "Grimnar's Mark", pts: 20, restrict: "ADEPTUS ASTARTES TERMINATOR CAPTAIN", desc: "Free Rapid Ingress/Heroic Intervention on the bearer's unit once per round.", fx: [] },
          { name: "Howlmaw", pts: 15, restrict: "WOLF PRIEST", desc: "Battle-shock an enemy within 6\" at start of Fight.", fx: [] },
          { name: "Chariots of the Storm", pts: 25, restrict: "ADEPTUS ASTARTES", desc: "Redeploy up to three units after deployment (into Reserves if wished).", fx: [] },
          { name: "Skjald's Foretelling", pts: 25, restrict: "WOLF GUARD BATTLE LEADER", desc: "Led unit's weapons gain [LANCE].", fx: [{ k: 'grant', ab: 'lance' }] }
        ],
        stratagems: [
          { name: "The Foe Foreseen", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Worsen incoming AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Grimnar's Command", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Switch this unit's active Hunting Pack.", fx: [] },
          { name: "Fenrisian Ferocity", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Mounted/Walker move through models and terrain.", fx: [] },
          { name: "Unrelenting Hunters", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Charge after Falling Back (Space Wolves: after Advancing too).", fx: [{ k: 'eligChargeAfterFallBack' }, { k: 'eligChargeAfterAdvance' }] },
          { name: "Eye of the Pack", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "+1 to Wound.", fx: [{ k: 'addWound', n: 1 }] },
          { name: "Battle Instincts", cp: 1, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Make a D6\" Normal move.", fx: [{ k: 'extraMove', dice: 'D6' }] }
        ]
      }
    }
  },

  "Deathwatch": {
    // Keep Oath of Moment but on the exclusion list (Hit re-roll, no Wound bonus).
    // Black Spear Task Force is the ONLY detachment — no shared-codex merge.
    armyRule: {
      name: "Oath of Moment",
      desc: "Pick an enemy Oath target each Command phase; re-roll Hits against it. (Deathwatch do not get the +1-to-Wound half. Kill Teams use their majority Toughness when wounded — see notes.)",
      fx: [{ k: 'rerollHit', val: 'all', cond: 'targetIsOath', scope: 'army' },
           { k: 'rerollWound', val: 'all', cond: 'targetIsOath+codexPure', scope: 'army' }]
    },
    restrictions: [
      "Deathwatch Chapter only (no other Chapter's units, and a long list of excluded squads).",
      "On the Oath exclusion list: Oath grants the Hit re-roll but not the +1 to Wound.",
      "Black Spear Task Force is the only detachment available (no generic Codex detachments).",
      "Kill Teams rule (mixed-Toughness units wound on their majority Toughness) is a no-op in this sim, which models each unit with a single Toughness value already."
    ],
    detachments: {
      "Black Spear Task Force": {
        chapter: "DEATHWATCH",
        rule: { name: "Mission Tactics", desc: "Command phase: pick a Mission Tactic (once each per battle) for your army — Furor ([SUSTAINED HITS 1]), Malleus ([LETHAL HITS]), or Purgatus (Critical Hits grant [PRECISION]).",
          fx: [] },
        doctrineLabel: "Mission Tactic",
        doctrineOncePerBattle: true,
        doctrines: [
          { id: 'furor', name: "Furor Tactics", desc: "Weapons gain [SUSTAINED HITS 1].", fx: [{ k: 'grant', ab: 'sustained', val: 1, scope: 'army' }] },
          { id: 'malleus', name: "Malleus Tactics", desc: "Weapons gain [LETHAL HITS].", fx: [{ k: 'grant', ab: 'lethal', scope: 'army' }] },
          { id: 'purgatus', name: "Purgatus Tactics", desc: "Critical Hits grant [PRECISION].", fx: [{ k: 'grant', ab: 'precision', scope: 'army' }] }
        ],
        enhancements: [
          { name: "Thief of Secrets", pts: 25, restrict: "ADEPTUS ASTARTES", desc: "+1 S/D/AP to bearer's melee (+2 once it has killed in melee).", fx: [{ k: 'plusStrMelee', n: 1, selfOnly: true }, { k: 'plusApMelee', n: 1, selfOnly: true }] },
          { name: "Osseus Key", pts: 15, restrict: "WATCH MASTER/TECHMARINE", desc: "Force a nearby enemy Vehicle to test or be unable to shoot.", fx: [] },
          { name: "Beacon Angelis", pts: 25, restrict: "ADEPTUS ASTARTES", desc: "Unit gains Deep Strike; free Rapid Ingress on it.", fx: [] },
          { name: "The Tome of Ectoclades", pts: 30, restrict: "WATCH MASTER/CAPTAIN", desc: "Once: name a SECOND Oath of Moment target.", fx: [] }
        ],
        stratagems: [
          { name: "Armour of Contempt", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Worsen incoming AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Adaptive Tactics", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Set a unit's Mission Tactic independently of the army's.", fx: [] },
          { name: "Hellfire Rounds", cp: 1, type: "Wargear", when: 'shooting', targetSelf: true, desc: "Ranged gain [ANTI-INFANTRY 2+] and [ANTI-MONSTER 5+].", fx: [{ k: 'antiVal', kw: 'INFANTRY', val: 2 }] },
          { name: "Kraken Rounds", cp: 1, type: "Wargear", when: 'shooting', targetSelf: true, desc: "+1 AP and +6\" Range to ranged weapons.", fx: [{ k: 'plusApRanged', n: 1 }] },
          { name: "Dragonfire Rounds", cp: 1, type: "Wargear", when: 'shooting', targetSelf: true, desc: "Ranged gain [ASSAULT] and [IGNORES COVER].", fx: [{ k: 'grant', ab: 'assault' }, { k: 'grant', ab: 'ignorescover' }] },
          { name: "Site-to-site Teleportation", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull Kill Teams into Reserves (gain Deep Strike).", fx: [] }
        ]
      }
    }
  },

  "Grey Knights": {
    // Own faction (not an Astartes chapter). Army rule Gate of Infinity is backed by the
    // Strategic Reserves / Deep Strike subsystem. Almost everything keys off deep-striking.
    armyRule: {
      name: "Gate of Infinity",
      desc: "At end of your opponent's Fight phase, pull eligible units (every model has Deep Strike, not in Engagement Range) into Strategic Reserves to re-deploy via Deep Strike. (Use the Gate button in the panel.)",
      fx: []
    },
    restrictions: [
      "Grey Knights faction only.",
      "Gate of Infinity: number of units recallable scales with battle size (2 / 3 / 4).",
      "Deep Strike re-roll bonuses key off the turn a unit arrives (setUpThisTurn)."
    ],
    detachments: {
      "Brotherhood Strike": {
        rule: { name: "Fury of Titan", desc: "Each unit set up by Deep Strike re-rolls Hit and Wound rolls of 1 until end of turn.",
          fx: [{ k: 'rerollHit', val: 1, cond: 'setUpThisTurn', scope: 'army' },
               { k: 'rerollWound', val: 1, cond: 'setUpThisTurn', scope: 'army' }] },
        enhancements: [
          { name: "Banishing Wave", pts: 20, restrict: "GREY KNIGHTS", desc: "Mortal wounds to nearby enemies when the bearer Deep Strikes.", fx: [] },
          { name: "Blinding Aura", pts: 10, restrict: "GREY KNIGHTS", desc: "No Overwatch against the bearer's unit the turn it Deep Strikes.", fx: [] },
          { name: "Purity of Purpose", pts: 15, restrict: "GREY KNIGHTS", desc: "Re-roll Charge rolls the turn the bearer's unit Deep Strikes.", fx: [{ k: 'rerollCharge', cond: 'setUpThisTurn' }] },
          { name: "Tome of Forbidden Ways", pts: 25, restrict: "GREY KNIGHTS", desc: "+1 to the number of units you can Gate of Infinity.", fx: [] }
        ],
        stratagems: [
          { name: "Truesilver Channelling", cp: 2, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Psychic melee weapons gain [DEVASTATING WOUNDS].", fx: [{ k: 'grant', ab: 'devastating' }] },
          { name: "Combat Manifestation", cp: 1, type: "Epic Deed", when: 'movement', targetSelf: true, desc: "Deep Strike >6\" from enemies (no charge this turn).", fx: [] },
          { name: "Purgation Pattern", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Just-arrived unit's weapons gain [SUSTAINED HITS 1].", fx: [{ k: 'grant', ab: 'sustained', val: 1, cond: 'setUpThisTurn' }] },
          { name: "Duty Unending", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Place a Deep-Strike-capable unit into Reserves.", fx: [{ k: 'toReserves' }] },
          { name: "Shining Veil", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Unit gains Stealth (incoming ranged -1 to Hit beyond 12\").", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12' }] },
          { name: "Expeditious Exit", cp: 2, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull a Deep-Strike Psyker Infantry unit into Reserves (even if engaged).", fx: [{ k: 'toReserves' }] }
        ]
      },
      "Hallowed Conclave": {
        rule: { name: "Duty Before All", desc: "Grey Knights Terminator units may shoot and declare a charge in a turn in which they Fell Back.",
          fx: [{ k: 'eligShootAfterFallBack', cond: 'isTerminator', scope: 'army' }, { k: 'eligChargeAfterFallBack', cond: 'isTerminator', scope: 'army' }] },
        enhancements: [
          { name: "Eye of the Augurium", pts: 25, restrict: "GREY KNIGHTS", desc: "Free Fire Overwatch/Heroic Intervention on the bearer's unit once per round.", fx: [] },
          { name: "Inescapable Judgement", pts: 20, restrict: "GREY KNIGHTS", desc: "Mortal wounds to an enemy that Falls Back from the bearer.", fx: [] },
          { name: "Sanctic Reaper", pts: 15, restrict: "GREY KNIGHTS TERMINATOR", desc: "+3 Attacks to the bearer's melee.", fx: [{ k: 'plusAttacksMelee', n: 3, selfOnly: true }] },
          { name: "Nemesis Rounds", pts: 10, restrict: "GREY KNIGHTS TERMINATOR", desc: "Overwatch hits on 5+ for the bearer's unit.", fx: [] }
        ],
        stratagems: [
          { name: "Giants of the Battlefield", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "+1 Attack to melee weapons.", fx: [{ k: 'plusAttacksMelee', n: 1 }] },
          { name: "Unending Fidelity", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Destroyed models may shoot/fight before removal (4+).", fx: [{ k: 'fightOnDeath' }] },
          { name: "Point-blank Purgation", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Storm bolters gain [PISTOL] and [TWIN-LINKED] (re-roll Wounds).", fx: [{ k: 'rerollWound', val: 'all', cond: 'rangedOnly' }] },
          { name: "Grind Them Underfoot", cp: 1, type: "Strategic Ploy", when: 'charge', targetSelf: true, desc: "Mortal wounds to an engaged enemy after a Terminator charge.", fx: [] },
          { name: "Precognitive Strategies", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Make a D6\" Normal move.", fx: [{ k: 'extraMove', dice: 'D6' }] },
          { name: "Shining Resolve", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "-1 to Wound when the attack's Strength exceeds your Toughness.", fx: [{ k: 'subIncomingWound', n: 1, cond: 'strHigherThanT' }] }
        ]
      },
      "Banishers": {
        rule: { name: "Channelled Force", desc: "When a unit fights, on a passed Leadership test its Psychic melee weapons gain [SUSTAINED HITS 1] or [LETHAL HITS] (player's choice). Modelled here as [LETHAL HITS] in melee.",
          fx: [{ k: 'grant', ab: 'lethal', cond: 'meleeOnly', scope: 'army' }] },
        enhancements: [
          { name: "Sigil of the Hunt", pts: 10, restrict: "GREY KNIGHTS", desc: "Re-roll ranged Hit rolls of 1 for the bearer's unit.", fx: [{ k: 'rerollHit', val: 1, cond: 'rangedOnly', selfOnly: true }] },
          { name: "The Ephemeral Tome", pts: 15, restrict: "GREY KNIGHTS INFANTRY", desc: "Bearer's unit may make a D6\" move in the Shooting phase (no charge).", fx: [] },
          { name: "The Sixty-sixth Seal", pts: 25, restrict: "GREY KNIGHTS", desc: "+1 AP to the bearer's unit's ranged attacks.", fx: [{ k: 'plusApRanged', n: 1, selfOnly: true }] },
          { name: "Pyresoul", pts: 20, restrict: "GREY KNIGHTS", desc: "Deal D3 mortal wounds to a nearby enemy in your Shooting phase.", fx: [] }
        ],
        stratagems: [
          { name: "Hexwrought Reprisal", cp: 1, type: "Epic Deed", when: 'command', targetSelf: true, desc: "Reflect mortal wounds back at an attacker that hurt you this phase.", fx: [] },
          { name: "Warding Chant", cp: 1, type: "Epic Deed", when: 'targeted', targetSelf: true, desc: "Feel No Pain 5+ vs Damage-1 attacks.", fx: [{ k: 'fnp', val: 5 }] },
          { name: "Chaos Bane", cp: 1, type: "Epic Deed", when: 'shooting', targetSelf: true, desc: "Ranged weapons gain [ANTI-CHAOS 4+].", fx: [{ k: 'antiVal', kw: 'CHAOS', val: 4, cond: 'targetChaos' }] },
          { name: "Celerity", cp: 1, type: "Epic Deed", when: 'charge', targetSelf: true, desc: "Charge after Advancing.", fx: [{ k: 'eligChargeAfterAdvance' }] },
          { name: "Circle of Sanctuary", cp: 1, type: "Epic Deed", when: 'oppMove', targetSelf: true, desc: "Enemy reserves can't arrive within 12\" of the bearer.", fx: [] },
          { name: "Shadow of Anarch", cp: 1, type: "Epic Deed", when: 'oppMove', targetSelf: true, desc: "Make a 6\" move, or go into Reserves if Deep-Strike capable.", fx: [{ k: 'extraMove', dice: '6' }] }
        ]
      },
      "Sanctic Spearhead": {
        rule: { name: "Mailed Fist", desc: "When a Grey Knights VEHICLE Advances, don't roll: +6\" Move, and its ranged weapons gain [ASSAULT] until end of turn.",
          fx: [{ k: 'grant', ab: 'assault', cond: 'rangedOnly+isVehicle', scope: 'army' }] },
        enhancements: [
          { name: "Driven by Duty", pts: 10, restrict: "GREY KNIGHTS WALKER", desc: "Pile-in/Consolidate up to 6\".", fx: [] },
          { name: "Quickening Foci", pts: 15, restrict: "GREY KNIGHTS INFANTRY", desc: "Re-roll Charge rolls after disembarking.", fx: [] },
          { name: "Sigil of Exigence", pts: 30, restrict: "GREY KNIGHTS", desc: "Once: re-deploy the bearer's unit when targeted by ranged attacks.", fx: [] },
          { name: "Spiritus Machina", pts: 25, restrict: "GREY KNIGHTS INFANTRY", desc: "Re-roll Wounds after disembarking.", fx: [] }
        ],
        stratagems: [
          { name: "Truesilver Will", cp: 1, type: "Epic Deed", when: 'anyPhase', targetSelf: true, desc: "Feel No Pain 4+ vs mortal wounds.", fx: [] },
          { name: "Abominus-class Targets", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "+1 to Wound vs MONSTER/VEHICLE.", fx: [{ k: 'addWound', n: 1, cond: 'targetMonsterVehicle' }] },
          { name: "Armoured Aegis", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "A Vehicle regains up to 3 lost wounds.", fx: [] },
          { name: "Redoubled Assault", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Vehicle may shoot and charge after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Force Wave", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Vehicle moves through terrain.", fx: [] },
          { name: "Argent Wrath", cp: 1, type: "Strategic Ploy", when: 'charge', targetSelf: true, desc: "Battle-shock enemies near a charging Vehicle.", fx: [] }
        ]
      },
      "Augurium Task Force": {
        rule: { name: "Prescient Redeployment", desc: "From round 2, at the start of your Movement phase you may place one eligible unit into Reserves if you didn't max out Gate of Infinity.",
          fx: [] },
        enhancements: [
          { name: "Grimoire of Conjunctions", pts: 10, restrict: "GREY KNIGHTS", desc: "Once: +4 Strength to the bearer's melee this Fight phase.", fx: [] },
          { name: "Shield of Prophecy", pts: 20, restrict: "GREY KNIGHTS", desc: "Once: +2 Toughness to the bearer's unit for a battle round.", fx: [] },
          { name: "A Foot in the Future", pts: 15, restrict: "GREY KNIGHTS", desc: "D6\" move when the bearer's unit arrives (no charge).", fx: [] },
          { name: "Doomseer's Amulet", pts: 25, restrict: "GREY KNIGHTS", desc: "Battle-shock a nearby enemy when the bearer arrives.", fx: [] }
        ],
        stratagems: [
          { name: "Aggressive Anticipation", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Ignore Hit-roll and BS/WS modifiers.", fx: [{ k: 'ignoreModifiers' }] },
          { name: "Appointed Hour", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Critical Hits on unmodified 5+.", fx: [{ k: 'critOn', val: 5 }] },
          { name: "Forewarned Evasion", cp: 1, type: "Epic Deed", when: 'targeted', targetSelf: true, desc: "Walker: incoming attacks -1 to Hit.", fx: [{ k: 'subIncomingHit', n: 1 }] },
          { name: "Necessary End", cp: 1, type: "Epic Deed", when: 'fightTargeted', targetSelf: true, desc: "Destroyed models may fight on (roll > battle round).", fx: [{ k: 'fightOnDeath' }] },
          { name: "Redirected Strike", cp: 1, type: "Epic Deed", when: 'command', targetSelf: true, desc: "Place a Deep-Strike Psyker unit into Reserves.", fx: [{ k: 'toReserves' }] },
          { name: "Mirage of Echoes", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Place a Deep-Strike Psyker unit into Reserves.", fx: [{ k: 'toReserves' }] }
        ]
      },
      "Warpbane Task Force": {
        rule: { name: "Hallowed Ground", desc: "Re-roll Hit rolls of 1 (full re-roll for Purifiers or while on Hallowed Ground). Hallowed Ground approximated here as your held objectives / deployment zone.",
          fx: [{ k: 'rerollHit', val: 1, scope: 'army' },
               { k: 'rerollHit', val: 'all', cond: 'selfOnHeldObjective', scope: 'army' }] },
        enhancements: [
          { name: "Mandulian Reliquary", pts: 20, restrict: "GREY KNIGHTS", desc: "+3 OC while the bearer is not Battle-shocked.", fx: [] },
          { name: "Radiant Champion", pts: 15, restrict: "GREY KNIGHTS INFANTRY", desc: "Bearer's melee gain [PRECISION]; mortal wound on a wound while on Hallowed Ground.", fx: [{ k: 'grant', ab: 'precision', selfOnly: true }] },
          { name: "Phial of the Abyss", pts: 25, restrict: "GREY KNIGHTS INFANTRY", desc: "Bearer's unit gains Stealth.", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12', selfOnly: true }] },
          { name: "Paragon of Sanctity", pts: 10, restrict: "GREY KNIGHTS", desc: "Once: make a friendly unit count as on Hallowed Ground.", fx: [] }
        ],
        stratagems: [
          { name: "Sanctified Kill Zone", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Re-roll Wounds of 1 (full re-roll for Purifiers).", fx: [{ k: 'rerollWound', val: 1 }] },
          { name: "Flames of Sanctity", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Mortal wounds to enemies near a Purifier Squad.", fx: [] },
          { name: "Hallowed Beacon", cp: 1, type: "Battle Tactic", when: 'movement', targetSelf: true, desc: "Deep Strike onto Hallowed Ground, >6\" from enemies.", fx: [] },
          { name: "Fires of Covenant", cp: 1, type: "Battle Tactic", when: 'oppMove', targetSelf: true, desc: "Mortal wounds to enemies that come within 6\".", fx: [] },
          { name: "Aegis Eternal", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "4+ invulnerable save while on Hallowed Ground.", fx: [{ k: 'invuln', val: 4, cond: 'selfOnHeldObjective' }] },
          { name: "Repelling Sphere", cp: 1, type: "Battle Tactic", when: 'oppChargeEnd', targetSelf: true, desc: "Enemies charging your unit subtract 1-2 from the Charge roll.", fx: [] }
        ]
      }
    }
  },

  "Orks": {
    // Army rule Waaagh! is backed by the Waaagh! subsystem (Call Waaagh! button, once per battle).
    // While active: charge after Advancing, +1 Strength & +1 Attack in melee, 5+ invulnerable.
    armyRule: {
      name: "Waaagh!",
      desc: "Once per battle (Command phase) call a Waaagh!: until your next Command phase your units may charge after Advancing, gain +1 Strength & +1 Attack in melee, and a 5+ invulnerable save.",
      fx: [{ k: 'eligChargeAfterAdvance', cond: 'waaaghActive', scope: 'army' },
           { k: 'plusStrMelee', n: 1, cond: 'waaaghActive', scope: 'army' },
           { k: 'plusAttacksMelee', n: 1, cond: 'waaaghActive', scope: 'army' },
           { k: 'invuln', val: 5, cond: 'waaaghActive', scope: 'army' }]
    },
    restrictions: [
      "Orks faction. Use the 'Call the WAAAGH!' button in the panel (once per battle, Command phase).",
      "Bully Boyz can call a second Waaagh! for Warboss/Nobz/Meganobz; modelled via the same toggle."
    ],
    detachments: {
      "War Horde": {
        rule: { name: "Get Stuck In", desc: "Melee weapons of ORKS models have [SUSTAINED HITS 1].",
          fx: [{ k: 'grant', ab: 'sustained', val: 1, cond: 'meleeOnly', scope: 'army' }] },
        enhancements: [
          { name: "Follow Me Ladz", pts: 25, restrict: "ORKS", desc: "+2\" Move to the bearer's unit.", fx: [] },
          { name: "Headwoppa's Killchoppa", pts: 20, restrict: "ORKS", desc: "Bearer's melee gain [DEVASTATING WOUNDS].", fx: [{ k: 'grant', ab: 'devastating', selfOnly: true }] },
          { name: "Kunnin' But Brutal", pts: 15, restrict: "ORKS", desc: "Bearer's unit may shoot and charge after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Supa-Cybork Body", pts: 15, restrict: "ORKS", desc: "Bearer has Feel No Pain 4+.", fx: [{ k: 'fnp', val: 4, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Careen!", cp: 1, type: "Epic Deed", when: 'anyDestroyed', targetSelf: true, desc: "Destroyed vehicle makes a move before its Deadly Demise.", fx: [] },
          { name: "Orks Is Never Beaten", cp: 2, type: "Epic Deed", when: 'fightTargeted', targetSelf: true, desc: "Destroyed models fight on before removal.", fx: [{ k: 'fightOnDeath' }] },
          { name: "Unbridled Carnage", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Critical Hits in melee on unmodified 5+.", fx: [{ k: 'critOn', val: 5, cond: 'meleeOnly' }] },
          { name: "'Ard As Nails", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Incoming attacks -1 to Wound.", fx: [{ k: 'subIncomingWound', n: 1 }] },
          { name: "Mob Rule", cp: 1, type: "Battle Tactic", when: 'command', targetSelf: true, desc: "Remove Battle-shock from a nearby Infantry unit.", fx: [] },
          { name: "'Ere We Go", cp: 1, type: "Battle Tactic", when: 'movement', targetSelf: true, desc: "+2 to Advance and Charge rolls.", fx: [{ k: 'rerollCharge' }] }
        ]
      },
      "Da Big Hunt": {
        rule: { name: "Da Hunt Is On", desc: "Pick an enemy MONSTER/VEHICLE/CHARACTER as Prey each Command phase. Beast Snaggas re-roll Charges vs it and get +1 AP attacking it.",
          fx: [{ k: 'plusApMelee', n: 1, cond: 'targetIsOath', scope: 'army' }, { k: 'plusApRanged', n: 1, cond: 'targetIsOath', scope: 'army' }] },
        enhancements: [
          { name: "Glory Hog", pts: 30, restrict: "BEASTBOSS ON SQUIGOSAUR", desc: "Unit gains Scouts 9\".", fx: [] },
          { name: "Proper Killy", pts: 15, restrict: "BEAST SNAGGA", desc: "+1 Damage to the bearer's melee.", fx: [] },
          { name: "Skrag Every Stash!", pts: 25, restrict: "BEAST SNAGGA", desc: "Hold an objective stickily.", fx: [] },
          { name: "Surly as a Squiggoth", pts: 20, restrict: "BEASTBOSS ON SQUIGOSAUR", desc: "-1 to Wound when the attack's Strength exceeds Toughness.", fx: [{ k: 'subIncomingWound', n: 1, cond: 'strHigherThanT' }] }
        ],
        stratagems: [
          { name: "Drag It Down", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Melee gain [SUSTAINED HITS 1]; crit 5+ vs Prey.", fx: [{ k: 'grant', ab: 'sustained', val: 1, cond: 'meleeOnly' }] },
          { name: "Unstoppable Momentum", cp: 1, type: "Strategic Ploy", when: 'charge', targetSelf: true, desc: "Mortal wounds to an engaged enemy after a Mounted charge.", fx: [] },
          { name: "Dat One's Even Bigga!", cp: 1, type: "Strategic Ploy", when: 'charge', targetSelf: true, desc: "Charge after Advancing/Falling Back; re-roll vs Prey.", fx: [{ k: 'eligChargeAfterAdvance' }, { k: 'eligChargeAfterFallBack' }, { k: 'rerollCharge' }] },
          { name: "Where D'ya Fink You're Going?", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Make a 6\" Normal move.", fx: [{ k: 'extraMove', dice: '6' }] },
          { name: "Stalkin' Taktiks", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Benefit of Cover; Stealth if Infantry.", fx: [{ k: 'grantCoverDef' }] },
          { name: "Instinctive Hunters", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull a Beast Snagga unit into Reserves.", fx: [{ k: 'toReserves' }] }
        ]
      },
      "Kult of Speed": {
        rule: { name: "Adrenaline Junkies", desc: "Speed Freeks units may shoot and declare a charge in a turn in which they Advanced or Fell Back.",
          fx: [{ k: 'eligShootAfterAdvance', scope: 'army' }, { k: 'eligShootAfterFallBack', scope: 'army' }, { k: 'eligChargeAfterAdvance', scope: 'army' }, { k: 'eligChargeAfterFallBack', scope: 'army' }] },
        enhancements: [
          { name: "Fasta Than Yooz", pts: 35, restrict: "ORKS INFANTRY", desc: "May charge after disembarking from a moved transport.", fx: [] },
          { name: "Speed Makes Right", pts: 25, restrict: "ORKS", desc: "Chance to gain 1CP near enemies.", fx: [] },
          { name: "Squig-hide Tyres", pts: 15, restrict: "DEFFKILLA WARTRIKE", desc: "Consolidate up to 6\".", fx: [] },
          { name: "Wazblasta", pts: 10, restrict: "DEFFKILLA WARTRIKE", desc: "Make a 6\" move after shooting (no charge).", fx: [] }
        ],
        stratagems: [
          { name: "Speediest Freeks", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "5+ invuln (4+ for light vehicles).", fx: [{ k: 'invuln', val: 5 }] },
          { name: "Squig Flingin'", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Battle-shock a nearby enemy.", fx: [] },
          { name: "Dakkastorm", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Ranged gain [SUSTAINED HITS 1] (2 within 9\").", fx: [{ k: 'grant', ab: 'sustained', val: 1, cond: 'rangedOnly' }] },
          { name: "Blitza Fire", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Ranged gain [LETHAL HITS]; crit 5+ within 9\".", fx: [{ k: 'grant', ab: 'lethal', cond: 'rangedOnly' }] },
          { name: "Full Throttle!", cp: 1, type: "Battle Tactic", when: 'charge', targetSelf: true, desc: "+1 to Wound in melee this turn.", fx: [{ k: 'addWound', n: 1, cond: 'meleeOnly' }] },
          { name: "More Gitz Over 'Ere!", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Make a 6\" Normal move.", fx: [{ k: 'extraMove', dice: '6' }] }
        ]
      },
      "Dread Mob": {
        rule: { name: "Try Dat Button!", desc: "When a Mek/Walker/Grot-vehicle unit shoots or fights, roll D6 (or choose, with Hazardous) for [SUSTAINED HITS 1]/[LETHAL HITS]/+2 AP on crit. Modelled here as [SUSTAINED HITS 1].",
          fx: [{ k: 'grant', ab: 'sustained', val: 1, scope: 'army' }] },
        enhancements: [
          { name: "Gitfinder Googlez", pts: 10, restrict: "MEK", desc: "Ranged gain [IGNORES COVER].", fx: [{ k: 'grant', ab: 'ignorescover', selfOnly: true }] },
          { name: "Press It Fasta!", pts: 35, restrict: "MEK", desc: "Roll an extra Button die; gain both effects.", fx: [] },
          { name: "Smoky Gubbinz", pts: 15, restrict: "MEK", desc: "Unit gains Stealth.", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12', selfOnly: true }] },
          { name: "Supa-glowy Fing", pts: 20, restrict: "MEK", desc: "Random debuff to a nearby enemy in Command.", fx: [] }
        ],
        stratagems: [
          { name: "Klankin' Klaws", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "+2 Strength melee (push: +1 Damage, Hazardous).", fx: [{ k: 'plusStrMelee', n: 2 }] },
          { name: "Superfuelled Boiler", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Re-roll Advance; ranged gain [ASSAULT].", fx: [{ k: 'grant', ab: 'assault', cond: 'rangedOnly' }] },
          { name: "Bigger Shells For Bigger Gitz", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "+1 to Wound vs MONSTER/VEHICLE.", fx: [{ k: 'addWound', n: 1, cond: 'targetMonsterVehicle' }] },
          { name: "Dakka! Dakka! Dakka!", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Re-roll Hit rolls of 1 (push: full re-roll).", fx: [{ k: 'rerollHit', val: 1 }] },
          { name: "Conniving Runts", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Mortal wounds to a nearby enemy, then move.", fx: [] },
          { name: "Extra Gubbinz", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Incoming attacks -1 Damage.", fx: [{ k: 'reduceIncomingDmg', n: 1 }] }
        ]
      },
      "Green Tide": {
        rule: { name: "Mob Mentality", desc: "Boyz units have a 6+ invuln (5+ if 10+ models).",
          fx: [{ k: 'invuln', val: 6, scope: 'army' }] },
        enhancements: [
          { name: "Bloodthirsty Belligerence", pts: 15, restrict: "ORKS INFANTRY", desc: "Re-roll Advance (and Charge if 10+ models).", fx: [{ k: 'rerollAdvance' }] },
          { name: "Brutal But Kunnin'", pts: 25, restrict: "ORKS INFANTRY", desc: "Chance to gain 1CP in Command.", fx: [] },
          { name: "Ferocious Show Off", pts: 10, restrict: "ORKS INFANTRY", desc: "+1 Strength melee (+3 if 10+ models).", fx: [{ k: 'plusStrMelee', n: 1, selfOnly: true }] },
          { name: "Raucous Warcaller", pts: 20, restrict: "ORKS INFANTRY", desc: "Unit always counts as 10+ models for rules.", fx: [] }
        ],
        stratagems: [
          { name: "Competitive Streak", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Re-roll Wounds of 1 (full if 10+ models).", fx: [{ k: 'rerollWound', val: 1 }] },
          { name: "Bulldozer Brutality", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Models within 3\" are eligible to fight.", fx: [] },
          { name: "Braggin' Rights", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Two units count as 10+ models.", fx: [] },
          { name: "Come On Ladz!", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Return D3+2 destroyed models.", fx: [{ k: 'resurrect', val: 3 }] },
          { name: "Tide of Muscle", cp: 1, type: "Epic Deed", when: 'charge', targetSelf: true, desc: "+1 Charge (re-roll if 10+ models).", fx: [{ k: 'rerollCharge' }] },
          { name: "Go Get 'Em!", cp: 1, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Make a D6\" move toward the enemy.", fx: [{ k: 'extraMove', dice: 'D6' }] }
        ]
      },
      "Bully Boyz": {
        rule: { name: "Da Boss Is Watchin'", desc: "With a Warboss on the field, you may call a second Waaagh! (Warboss/Nobz/Meganobz only). Modelled via the Waaagh! toggle.",
          fx: [] },
        enhancements: [
          { name: "Big Gob", pts: 20, restrict: "INFANTRY WARBOSS", desc: "Battle-shock an engaged enemy at start of Fight.", fx: [] },
          { name: "Da Biggest Boss", pts: 15, restrict: "INFANTRY WARBOSS", desc: "+2 Wounds to the bearer.", fx: [] },
          { name: "'Eadstompa", pts: 10, restrict: "INFANTRY WARBOSS", desc: "Re-roll Wounds of 1 vs below-strength (full vs below-half).", fx: [{ k: 'rerollWound', val: 1, cond: 'targetBelowStrength', selfOnly: true }] },
          { name: "Tellyporta", pts: 25, restrict: "WARBOSS IN MEGA ARMOUR", desc: "Unit gains Deep Strike.", fx: [{ k: 'grantDeepStrike' }] }
        ],
        stratagems: [
          { name: "Armed To Da Teef", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Re-roll Hits of 1 (full if Waaagh active).", fx: [{ k: 'rerollHit', val: 1 }, { k: 'rerollHit', val: 'all', cond: 'waaaghActive' }] },
          { name: "Too Arrogant To Die", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Destroyed models fight/shoot on (5+).", fx: [{ k: 'fightOnDeath' }] },
          { name: "Always Lookin' Fer A Fight", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Bigger Consolidation moves after a kill.", fx: [] },
          { name: "Crushing Impact", cp: 1, type: "Epic Deed", when: 'charge', targetSelf: true, desc: "Mortal wounds to an engaged enemy after a charge.", fx: [] },
          { name: "Cut'em Down", cp: 1, type: "Battle Tactic", when: 'oppMove', targetSelf: true, desc: "Desperate Escape tests on a falling-back enemy.", fx: [] },
          { name: "Hulking Brutes", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Worsen incoming AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] }
        ]
      },
      "Taktikal Brigade": {
        rule: { name: "Lissen 'Ere", desc: "Once per round, Boss Snikrot/Mek/Warboss issue a Taktik to a nearby unit (re-roll Charges / +1 S melee / Stealth+Cover / +1 Hit ranged). Modelled as +1 Hit ranged army-wide.",
          fx: [{ k: 'addHit', n: 1, cond: 'rangedOnly', scope: 'army' }] },
        enhancements: [
          { name: "Skwad Leader", pts: 15, restrict: "WARBOSS INFANTRY", desc: "Lead Kommandos: Infiltrators and Stealth.", fx: [] },
          { name: "Mek Kaptin", pts: 45, restrict: "BIG MEK", desc: "Lead Flash Gitz: re-roll ranged Hits.", fx: [{ k: 'rerollHit', val: 'all', cond: 'rangedOnly', selfOnly: true }] },
          { name: "Mork's Kunnin'", pts: 15, restrict: "ORKS", desc: "Redeploy up to three units after deployment.", fx: [] },
          { name: "Gob Boomer", pts: 10, restrict: "WARBOSS/MEK", desc: "Issue Taktiks at 18\".", fx: [] }
        ],
        stratagems: [
          { name: "Dat's Ours", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "+1 OC to an engaged unit.", fx: [{ k: 'objControl', n: 1 }] },
          { name: "Fight Proppa", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Melee gain [SUSTAINED HITS 1] or [LETHAL HITS].", fx: [{ k: 'grant', ab: 'lethal', cond: 'meleeOnly' }] },
          { name: "Taktikal Retreat", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot and charge after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Krunchin' Descent", cp: 1, type: "Battle Tactic", when: 'charge', targetSelf: true, desc: "Mortal wounds to an engaged enemy after a Stormboyz charge.", fx: [] },
          { name: "On To Da Next", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Make a 6\" Normal move.", fx: [{ k: 'extraMove', dice: '6' }] },
          { name: "Ded Sneaky", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull a Kommandos/Stormboyz unit into Reserves.", fx: [{ k: 'toReserves' }] }
        ]
      },
      "More Dakka!": {
        rule: { name: "Dakka! Dakka! Dakka!", desc: "ORKS Infantry/Walker ranged weapons have [ASSAULT]. While a Waaagh! is active, in your Shooting phase they also have [SUSTAINED HITS 1].",
          fx: [{ k: 'grant', ab: 'assault', cond: 'rangedOnly', scope: 'army' },
               { k: 'grant', ab: 'sustained', val: 1, cond: 'rangedOnly+waaaghActive', scope: 'army' }] },
        enhancements: [
          { name: "Da Gobshot Thunderbuss", pts: 15, restrict: "ORKS", desc: "Bearer's ranged gain [DEVASTATING WOUNDS] and [HAZARDOUS].", fx: [{ k: 'grant', ab: 'devastating', cond: 'rangedOnly', selfOnly: true }] },
          { name: "Dead Shiny Shootas", pts: 35, restrict: "ORKS", desc: "Unit's ranged gain [RAPID FIRE 1].", fx: [] },
          { name: "Targetin' Squigs", pts: 15, restrict: "ORKS", desc: "+1 to Hit with ranged.", fx: [{ k: 'addHit', n: 1, cond: 'rangedOnly', selfOnly: true }] },
          { name: "Zog Off and Eat Dakka!", pts: 10, restrict: "ORKS", desc: "Bearer's unit may shoot after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }] }
        ],
        stratagems: [
          { name: "Orks Is Still Orks", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Re-roll Wounds of 1 (full near an objective).", fx: [{ k: 'rerollWound', val: 1 }] },
          { name: "Get Stuck In, Ladz!", cp: 2, type: "Epic Deed", when: 'command', targetSelf: true, desc: "Waaagh! active for this unit even if already called.", fx: [] },
          { name: "Huge Show-offs", cp: 1, type: "Epic Deed", when: 'command', targetSelf: true, desc: "+1 Move/LD/OC and +1 Hit for a Walker.", fx: [{ k: 'addHit', n: 1 }] },
          { name: "Long, Uncontrolled Bursts", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Ranged gain [IGNORES COVER].", fx: [{ k: 'grant', ab: 'ignorescover' }] },
          { name: "Speshul Shells", cp: 1, type: "Wargear", when: 'shooting', targetSelf: true, desc: "+1 AP vs closest target within 18\".", fx: [{ k: 'plusApRanged', n: 1 }] },
          { name: "Call Dat Dakka?", cp: 1, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Shoot back at the unit that attacked you.", fx: [{ k: 'shootBack' }] }
        ]
      },
      "Freebooter Krew": {
        rule: { name: "Here Be Loot", desc: "Pick a loot objective each Command phase. ORKS Infantry/Mounted/Walker attacks gain [SUSTAINED HITS 1] while near it or targeting a unit near it. Modelled as [SUSTAINED HITS 1] vs a target on an objective.",
          fx: [{ k: 'grant', ab: 'sustained', val: 1, cond: 'targetWithinObjective', scope: 'army' }] },
        enhancements: [
          { name: "Da Kaptin", pts: 10, restrict: "WARBOSS", desc: "Cure Battle-shock on a nearby unit (it takes D3 mortal wounds).", fx: [] },
          { name: "Git-spotter Squig", pts: 20, restrict: "ORKS", desc: "Unit's ranged gain [IGNORES COVER].", fx: [{ k: 'grant', ab: 'ignorescover', selfOnly: true }] },
          { name: "Bionik Workshop", pts: 15, restrict: "BIG MEK/PAINBOY", desc: "Random bionik buff (Move/Strength/WS).", fx: [] },
          { name: "Razgit's Magik Map", pts: 25, restrict: "ORKS", desc: "Redeploy up to three Infantry units after deployment.", fx: [] }
        ],
        stratagems: [
          { name: "Bash and Grab", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Re-roll Wounds vs a unit near the loot objective.", fx: [{ k: 'rerollWound', val: 'all', cond: 'targetWithinObjective' }] },
          { name: "Grab and Bash", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Waaagh! active for this unit even if already called.", fx: [] },
          { name: "Boardin' Rush", cp: 1, type: "Battle Tactic", when: 'movement', targetSelf: true, desc: "+6\" Move on the Advance (no roll).", fx: [{ k: 'extraMove', dice: '6' }] },
          { name: "Deck Fraggers", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Ranged gain [BLAST] vs Infantry.", fx: [] },
          { name: "Rolling Loot-heap", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Flash Gitz ranged gain [ANTI-VEHICLE 4+].", fx: [{ k: 'antiVal', kw: 'VEHICLE', val: 4, cond: 'targetMonsterVehicle' }] },
          { name: "Krump and Run", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Make a 6\" Normal move.", fx: [{ k: 'extraMove', dice: '6' }] }
        ]
      },
      "Speedwaaagh!": {
        rule: { name: "Turbo Boostas", desc: "Speed Freeks/Trukk units may turbo on the Advance: 24\" straight-line move, ranged gain [ASSAULT], but cannot charge. Modelled as ranged [ASSAULT] army-wide.",
          fx: [{ k: 'grant', ab: 'assault', cond: 'rangedOnly', scope: 'army' }] },
        enhancements: [
          { name: "Kustom Shokk Box", pts: 10, restrict: "DEFFKILLA WARTRIKE", desc: "Move through terrain when using turbo.", fx: [] },
          { name: "Dakkamek", pts: 25, restrict: "MEK", desc: "Grant a Vehicle [RAPID FIRE 1] via Mekaniak.", fx: [] },
          { name: "Supa-burny Fuel", pts: 15, restrict: "DEFFKILLA WARTRIKE", desc: "More attacks on the bearer's flame weapons.", fx: [] },
          { name: "Master Meknologist", pts: 20, restrict: "BIG MEK", desc: "+1 BS to the bearer's ranged.", fx: [{ k: 'addHit', n: 1, cond: 'rangedOnly', selfOnly: true }] }
        ],
        stratagems: [
          { name: "On Da Move", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot and charge after Falling Back/Advancing.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligShootAfterAdvance' }, { k: 'eligChargeAfterFallBack' }, { k: 'eligChargeAfterAdvance' }] },
          { name: "Mobile Dakkastorm", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "+2 Strength vs a unit you hit.", fx: [{ k: 'plusStrRanged', n: 2 }] },
          { name: "Speshul Ammo", cp: 1, type: "Wargear", when: 'shooting', targetSelf: true, desc: "Ranged gain [ANTI-MONSTER 4+] and [ANTI-VEHICLE 4+].", fx: [{ k: 'antiVal', kw: 'MONSTER', val: 4, cond: 'targetMonsterVehicle' }] },
          { name: "Ded Killy Construction", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Melee gain [LANCE] (+1 Damage after a charge).", fx: [{ k: 'grant', ab: 'lance', cond: 'meleeOnly' }] },
          { name: "Dust Trails", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Benefit of Cover.", fx: [{ k: 'grantCoverDef' }] },
          { name: "Evasive Manoova", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull a Speed Freeks/Trukk unit into Reserves.", fx: [{ k: 'toReserves' }] }
        ]
      },
      "Blitz Brigade": {
        rule: { name: "Eager for the Fight", desc: "When an ORKS unit disembarks, re-roll its Advance and Charge rolls that turn.",
          fx: [{ k: 'rerollCharge', cond: 'disembarkedThisTurn', scope: 'army' }, { k: 'rerollAdvance', cond: 'disembarkedThisTurn', scope: 'army' }] },
        enhancements: [
          { name: "Runnin' Boots", pts: 10, restrict: "ORKS INFANTRY CHARACTER", desc: "+1 Charge after disembarking.", fx: [] },
          { name: "Blitzkaptin", pts: 25, restrict: "ORKS CHARACTER", desc: "Redeploy up to three Vehicle units after deployment.", fx: [] },
          { name: "Supercharged Squig Oil", pts: 10, restrict: "MEK", desc: "Re-roll Charges for a Mekaniak-selected Vehicle.", fx: [] },
          { name: "Tuff Git", pts: 5, restrict: "ORKS INFANTRY CHARACTER", desc: "Cure Battle-shock after disembarking.", fx: [] }
        ],
        stratagems: [
          { name: "Mount Up, Ladz", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Embark an Infantry unit into a nearby transport.", fx: [] },
          { name: "Mekanised Brutality", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Disembarked units may charge after the transport moved.", fx: [] },
          { name: "Run 'Em Down", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Nearby Vehicles/Monsters may charge after Advancing.", fx: [{ k: 'eligChargeAfterAdvance' }] },
          { name: "Armoured Duellists", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "+1 Hit and +1 Wound vs MONSTER/VEHICLE.", fx: [{ k: 'addHit', n: 1, cond: 'targetMonsterVehicle' }, { k: 'addWound', n: 1, cond: 'targetMonsterVehicle' }] },
          { name: "Impervious", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "-1 to Wound when the attack's Strength exceeds Toughness.", fx: [{ k: 'subIncomingWound', n: 1, cond: 'strHigherThanT' }] },
          { name: "Yooz In Trouble Now", cp: 1, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Disembark and Surge-move an Infantry unit.", fx: [{ k: 'extraMove', dice: 'D6' }] }
        ]
      }
    }
  },

  "Tyranids": {
    // Army rule Synapse is backed by the Synapse subsystem (positional: within 6" of a friendly
    // SYNAPSE model). While in Synapse Range: +1 Strength in melee, and Battle-shock on 3D6.
    // Shadow in the Warp is a once-per-battle button. The withinSynapse condition gates many fx.
    armyRule: {
      name: "Synapse",
      desc: "While a TYRANIDS unit is within 6\" of a friendly SYNAPSE model it is in Synapse Range: +1 Strength on its melee attacks, and it takes Battle-shock tests on 3D6 (keep highest two). Plus a once-per-battle Shadow in the Warp (button).",
      fx: [{ k: 'plusStrMelee', n: 1, cond: 'withinSynapse', scope: 'army' }]
    },
    restrictions: [
      "Tyranids faction. Synapse Range is positional — keep units within 6\" of a SYNAPSE model.",
      "Shadow in the Warp: use the panel button once per battle (Command phase)."
    ],
    detachments: {
      "Invasion Fleet": {
        // Hyper-adaptations are chosen at battle start; modelled as doctrines (once-set for the battle).
        rule: { name: "Hyper-adaptations", desc: "At battle start pick one Hyper-adaptation for the army: Sustained vs Infantry/Swarm, Lethal vs Monster/Vehicle, or Precision-on-crit vs Characters.", fx: [] },
        doctrineLabel: "Hyper-adaptation",
        doctrines: [
          { id: 'swarming', name: "Swarming Instincts", desc: "[SUSTAINED HITS 1] vs INFANTRY/SWARM targets.", fx: [{ k: 'grant', ab: 'sustained', val: 1, cond: 'targetInfantrySwarm' }] },
          { id: 'aggression', name: "Hyper-aggression", desc: "[LETHAL HITS] vs MONSTER/VEHICLE targets.", fx: [{ k: 'grant', ab: 'lethal', cond: 'targetMonsterVehicle' }] },
          { id: 'predators', name: "Hive Predators", desc: "[PRECISION] on Critical Hits vs CHARACTER targets.", fx: [{ k: 'grant', ab: 'precision', cond: 'targetCharacter' }] }
        ],
        enhancements: [
          { name: "Alien Cunning", pts: 30, restrict: "TYRANIDS", desc: "Redeploy up to three units after deployment (may go to Reserves).", fx: [] },
          { name: "Perfectly Adapted", pts: 15, restrict: "TYRANIDS", desc: "Once per turn re-roll one Hit/Wound/Damage/Advance/Charge/save for the bearer.", fx: [{ k: 'rerollOnePerPhase', selfOnly: true }] },
          { name: "Synaptic Linchpin", pts: 20, restrict: "TYRANIDS", desc: "Friendly units within 9\" of the bearer count as in Synapse Range.", fx: [] },
          { name: "Adaptive Biology", pts: 25, restrict: "TYRANIDS", desc: "Bearer has Feel No Pain 5+ (4+ once below starting wounds).", fx: [{ k: 'fnp', val: 5, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Rapid Regeneration", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "FNP 6+ (5+ in Synapse Range).", fx: [{ k: 'fnp', val: 6 }, { k: 'fnp', val: 5, cond: 'withinSynapse' }] },
          { name: "Adrenal Surge", cp: 2, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Critical Hits on unmodified 5+.", fx: [{ k: 'critOn', val: 5 }] },
          { name: "Death Frenzy", cp: 1, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "Destroyed models fight on (4+) before removal.", fx: [{ k: 'fightOnDeath' }] },
          { name: "Overrun", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Bigger Consolidation, or a 6\" Normal move if in Synapse Range.", fx: [{ k: 'extraMove', dice: '6', cond: 'withinSynapse' }] },
          { name: "Predatory Imperative", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Add a second Hyper-adaptation to some units this turn.", fx: [] },
          { name: "Endless Swarm", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Return D3+3 destroyed models to Endless Multitude units.", fx: [{ k: 'resurrect', val: 3 }] }
        ]
      },
      "Crusher Stampede": {
        rule: { name: "Enraged Behemoths", desc: "TYRANIDS MONSTERS get +1 Hit while below Starting Strength and +1 Wound while Below Half-strength; +2 OC at full strength.",
          fx: [{ k: 'addHit', n: 1, cond: 'selfBelowStrength', scope: 'army' }, { k: 'addWound', n: 1, cond: 'selfBelowHalf', scope: 'army' }] },
        enhancements: [
          { name: "Ominous Presence", pts: 15, restrict: "TYRANIDS MONSTER", desc: "+3 Objective Control.", fx: [{ k: 'objControl', n: 3, selfOnly: true }] },
          { name: "Enraged Reserves", pts: 20, restrict: "TYRANIDS MONSTER", desc: "If destroyed in melee, fight on (3+) before removal.", fx: [{ k: 'fightOnDeath', selfOnly: true }] },
          { name: "Null Nodules", pts: 10, restrict: "TYRANIDS MONSTER", desc: "Once: FNP 5+ vs Psychic Attacks.", fx: [] },
          { name: "Monstrous Nemesis", pts: 25, restrict: "TYRANIDS MONSTER", desc: "+1 to Wound in melee vs MONSTER/VEHICLE.", fx: [{ k: 'addWound', n: 1, cond: 'targetMonsterVehicle+meleeOnly', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Corrosive Viscera", cp: 1, type: "Strategic Ploy", when: 'anyDestroyed', targetSelf: true, desc: "Auto-inflict Deadly Demise mortal wounds.", fx: [] },
          { name: "Rampaging Monstrosities", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Re-roll Hit rolls.", fx: [{ k: 'rerollHit', val: 'all' }] },
          { name: "Savage Roar", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Attackers -1 to Hit (−1 Wound if they fail a Battle-shock).", fx: [{ k: 'subIncomingHit', n: 1 }] },
          { name: "Untrammelled Ferocity", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Move through models and low terrain.", fx: [] },
          { name: "Swarm-guided Salvoes", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Ranged gain [IGNORES COVER]; ignore Hit/BS modifiers.", fx: [{ k: 'grant', ab: 'ignorescover' }, { k: 'ignoreModifiers' }] },
          { name: "Massive Impact", cp: 1, type: "Epic Deed", when: 'charge', targetSelf: true, desc: "Mortal wounds to an engaged enemy after a Monster charge.", fx: [] }
        ]
      },
      "Unending Swarm": {
        rule: { name: "Insurmountable Odds", desc: "When an Endless Multitude unit loses models to enemy shooting, it makes a Surge move toward the nearest enemy. (Surge movement is approximated; the engine resolves AI advances.)", fx: [] },
        enhancements: [
          { name: "Relentless Hunger", pts: 20, restrict: "TYRANIDS", desc: "+2\" Move to the bearer's unit.", fx: [] },
          { name: "Naturalised Camouflage", pts: 30, restrict: "TYRANIDS", desc: "Some Endless Multitude units get Benefit of Cover round 1.", fx: [] },
          { name: "Piercing Talons", pts: 25, restrict: "TYRANIDS", desc: "+1 AP on Critical Wounds.", fx: [{ k: 'grant', ab: 'lance', cond: 'meleeOnly', selfOnly: true }] },
          { name: "Adrenalised Onslaught", pts: 15, restrict: "TYRANIDS", desc: "+3\" on Pile In / Consolidate.", fx: [] }
        ],
        stratagems: [
          { name: "Synaptic Goading", cp: 1, type: "Strategic Ploy", when: 'anyPhase', targetSelf: true, desc: "Re-roll a Surge move; end near an objective.", fx: [] },
          { name: "Unending Waves", cp: 2, type: "Strategic Ploy", when: 'anyDestroyed', targetSelf: true, desc: "Return a destroyed unit to Reserves at full strength.", fx: [] },
          { name: "Teeming Masses", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Attackers -1 to Hit.", fx: [{ k: 'subIncomingHit', n: 1 }] },
          { name: "Swarming Masses", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Weapons gain [SUSTAINED HITS 1]; crit 5+ if 15+ models.", fx: [{ k: 'grant', ab: 'sustained', val: 1 }] },
          { name: "Bounding Advance", cp: 1, type: "Battle Tactic", when: 'movement', targetSelf: true, desc: "+6\" Move on the Advance (no roll).", fx: [{ k: 'extraMove', dice: '6' }] },
          { name: "Preservation Imperative", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Counts as <5 models vs [BLAST].", fx: [] }
        ]
      },
      "Assimilation Swarm": {
        rule: { name: "Feed the Swarm", desc: "In your Command phase each HARVESTER unit Regenerates a friendly unit within 6\" (heal D3+1 wounds, or return models). Healing is modelled on the reanimation hook.", fx: [{ k: 'reanimate', scope: 'army', cond: 'isHarvester' }] },
        enhancements: [
          { name: "Regenerating Monstrosity", pts: 20, restrict: "TYRANIDS", desc: "Bearer's unit can be regenerated twice per phase.", fx: [] },
          { name: "Instinctive Defence", pts: 15, restrict: "TYRANIDS", desc: "Near a Harvester: Fights First; free Heroic Intervention.", fx: [{ k: 'fightsFirst', selfOnly: true }] },
          { name: "Biophagic Flow", pts: 10, restrict: "TYRANIDS", desc: "Extends a Harvester's Regenerate range to 9\".", fx: [] },
          { name: "Parasitic Biomorphology", pts: 25, restrict: "TYRANIDS", desc: "+1 Strength melee; +1 Attack after first kill near a Harvester.", fx: [{ k: 'plusStrMelee', n: 1, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Broodguard Impulse", cp: 1, type: "Epic Deed", when: 'anyDestroyed', targetSelf: true, desc: "+1 Wound vs the unit that killed your Harvester.", fx: [] },
          { name: "Reclaim Biomass", cp: 1, type: "Strategic Ploy", when: 'anyPhase', targetSelf: true, desc: "Regenerate a unit near your Harvester.", fx: [{ k: 'reanimate' }] },
          { name: "Tyrannoformed", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Hold an objective stickily.", fx: [{ k: 'stickyObjective', cond: 'selfOnHeldObjective' }] },
          { name: "Ablative Carapace", cp: 2, type: "Epic Deed", when: 'targeted', targetSelf: true, desc: "FNP 5+ (4+ on a held objective).", fx: [{ k: 'fnp', val: 5 }, { k: 'fnp', val: 4, cond: 'selfOnHeldObjective' }] },
          { name: "Secure Biomass", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Melee gain [LETHAL HITS].", fx: [{ k: 'grant', ab: 'lethal', cond: 'meleeOnly' }] },
          { name: "Rapacious Hunger", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Regenerate after destroying an enemy.", fx: [{ k: 'reanimate' }] }
        ]
      },
      "Vanguard Onslaught": {
        rule: { name: "Questing Tendrils", desc: "TYRANIDS units may charge in a turn in which they Fell Back; VANGUARD INVADER units may charge after Advancing.",
          fx: [{ k: 'eligChargeAfterFallBack', scope: 'army' }, { k: 'eligChargeAfterAdvance', scope: 'army' }] },
        enhancements: [
          { name: "Hunting Grounds", pts: 20, restrict: "TYRANIDS", desc: "Enemy Reserves arriving must test Battle-shock (2+).", fx: [] },
          { name: "Chameleonic", pts: 15, restrict: "VANGUARD INVADER", desc: "Stealth + Benefit of Cover.", fx: [{ k: 'grantCoverDef', selfOnly: true }, { k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12', selfOnly: true }] },
          { name: "Stalker", pts: 10, restrict: "VANGUARD INVADER", desc: "+1 Hit and +1 Wound vs a chosen enemy unit.", fx: [{ k: 'addHit', n: 1, cond: 'targetIsOath', selfOnly: true }, { k: 'addWound', n: 1, cond: 'targetIsOath', selfOnly: true }] },
          { name: "Neuronode", pts: 20, restrict: "TYRANIDS", desc: "Redeploy up to three Vanguard Invader units (may go to Reserves).", fx: [] }
        ],
        stratagems: [
          { name: "Surprise Assault", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "+1 Hit vs a target (battle-shock it; +1 Wound if it fails).", fx: [{ k: 'addHit', n: 1 }] },
          { name: "Assassin Beasts", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Melee gain [PRECISION].", fx: [{ k: 'grant', ab: 'precision', cond: 'meleeOnly' }] },
          { name: "Seeded Broods", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Reserve units arrive as if the round were one higher.", fx: [] },
          { name: "Hypersensory Scillia", cp: 2, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Make a 6\" Normal move.", fx: [{ k: 'extraMove', dice: '6' }] },
          { name: "Unseen Lurkers", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Can only be shot from within 18\".", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12' }] },
          { name: "Invisible Hunter", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull Vanguard units into Reserves.", fx: [{ k: 'toReserves' }] }
        ]
      },
      "Synaptic Nexus": {
        // Synaptic Imperatives chosen each battle round via the panel; gated on synAug/synSurge/synGoad.
        rule: { name: "Synaptic Imperatives", desc: "Each battle round pick a Synaptic Imperative (each once per battle): Augmentation (5+ invuln), Surging Vitality (+1 Advance/Charge), or Goaded to Slaughter (+1 melee Hit) — for units in Synapse Range. Use the panel buttons.",
          fx: [{ k: 'invuln', val: 5, cond: 'synAug', scope: 'army' },
               { k: 'rerollAdvance', cond: 'synSurge', scope: 'army' },
               { k: 'rerollCharge', cond: 'synSurge', scope: 'army' },
               { k: 'addHit', n: 1, cond: 'synGoad+meleeOnly', scope: 'army' }] },
        enhancements: [
          { name: "Power of the Hive Mind", pts: 10, restrict: "TYRANIDS PSYKER", desc: "+1 Strength & AP to the bearer's psychic weapons.", fx: [{ k: 'plusStrRanged', n: 1, cond: 'psykerOnly', selfOnly: true }, { k: 'plusApRanged', n: 1, cond: 'psykerOnly', selfOnly: true }] },
          { name: "Psychostatic Disruption", pts: 30, restrict: "TYRANIDS SYNAPSE", desc: "Enemy Reserves can't arrive within 12\"; once, a 4+ delays an arrival.", fx: [] },
          { name: "Synaptic Control", pts: 20, restrict: "TYRANIDS SYNAPSE", desc: "Incoming attacks -1 Damage.", fx: [{ k: 'reduceIncomingDmg', n: 1, selfOnly: true }] },
          { name: "The Dirgeheart of Kharis", pts: 15, restrict: "TYRANIDS SYNAPSE", desc: "Worsen nearby enemy Leadership by 1.", fx: [] }
        ],
        stratagems: [
          { name: "The Smothering Shadow", cp: 1, type: "Strategic Ploy", when: 'anyPhase', targetSelf: true, desc: "Mortal wounds to an enemy that failed a Battle-shock.", fx: [] },
          { name: "Synaptic Channelling", cp: 1, type: "Battle Tactic", when: 'command', targetSelf: true, desc: "Extend Synapse Range to 9\" for a Synapse unit this turn.", fx: [] },
          { name: "Irresistible Will", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Re-roll Hits and Wounds of 1 near your Synapse unit.", fx: [{ k: 'rerollHit', val: 1, cond: 'withinSynapse' }, { k: 'rerollWound', val: 1, cond: 'withinSynapse' }] },
          { name: "Reinforced Hive Node", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Worsen incoming AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Imperative Dominance", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Re-pick a Synaptic Imperative for one unit.", fx: [] },
          { name: "Override Instincts", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot and charge after Falling Back (in Synapse Range).", fx: [{ k: 'eligShootAfterFallBack', cond: 'withinSynapse' }, { k: 'eligChargeAfterFallBack', cond: 'withinSynapse' }] }
        ]
      },
      "Warrior Bioform Onslaught": {
        rule: { name: "Leader-beasts", desc: "Tyranid Warriors, Tyranid Prime with Lash Whip and Winged Tyranid Prime units have a 5+ invulnerable save.",
          fx: [{ k: 'invuln', val: 5, cond: 'isTyranidWarrior', scope: 'army' }] },
        enhancements: [
          { name: "Synaptic Tyrant", pts: 10, restrict: "NEUROTYRANT", desc: "May attach to a Tyranid Warriors unit.", fx: [] },
          { name: "Ocular Adaptation", pts: 20, restrict: "WINGED TYRANID PRIME", desc: "+1 to Hit for the bearer's unit.", fx: [{ k: 'addHit', n: 1, selfOnly: true }] },
          { name: "Sensory Assimilation", pts: 20, restrict: "WINGED TYRANID PRIME", desc: "Attackers -1 to Hit.", fx: [{ k: 'subIncomingHit', n: 1, selfOnly: true }] },
          { name: "Elevated Might", pts: 30, restrict: "TYRANIDS", desc: "Bearer's unit may charge after Advancing.", fx: [{ k: 'eligChargeAfterAdvance' }] }
        ],
        stratagems: [
          { name: "Synaptic Amplification", cp: 1, type: "Strategic Ploy", when: 'shootOrFight', targetSelf: true, desc: "Re-roll Wounds of 1 (and Hits of 1 for Warriors).", fx: [{ k: 'rerollWound', val: 1 }] },
          { name: "Spontaneous Hypercorrosion", cp: 1, type: "Wargear", when: 'shootOrFight', targetSelf: true, desc: "+2 Strength ranged, +1 Strength melee for Warriors.", fx: [{ k: 'plusStrRanged', n: 2 }] },
          { name: "Restorative Impulse", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Return 1 destroyed Warrior model.", fx: [{ k: 'resurrect', val: 1 }] },
          { name: "Synaptic Micronodes", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Hold an objective stickily.", fx: [{ k: 'stickyObjective', cond: 'selfOnHeldObjective' }] },
          { name: "Parasitic Payload", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Ranged gain [IGNORES COVER]; strip cover from a hit unit.", fx: [{ k: 'grant', ab: 'ignorescover', cond: 'rangedOnly' }] },
          { name: "Synaptic Shield", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "-1 to Wound when the attack's Strength exceeds Toughness.", fx: [{ k: 'subIncomingWound', n: 1, cond: 'strHigherThanT' }] }
        ]
      }
    }
  },

  "T\u2019au Empire": {
    // Army rule For the Greater Good is backed by the markerlight subsystem: a "Mark targets" button
    // designates Observers that Spot enemies; Guided units (the `guided` condition) get +1 to hit vs
    // Spotted targets, and markerlight-Spotted targets are hit ignoring cover (the `guidedML` cond).
    armyRule: {
      name: "For the Greater Good",
      desc: "At the start of your Shooting phase use the Mark targets button: eligible units become Observers and mark the closest enemy as Spotted. Guided units (shooting a Spotted unit) get +1 to hit; markerlight-Spotted targets are also hit ignoring cover.",
      fx: [{ k: 'addHit', n: 1, cond: 'guided', scope: 'army' },
           { k: 'grant', ab: 'ignorescover', cond: 'guidedML', scope: 'army' }]
    },
    restrictions: [
      "T'au Empire faction. Use the Mark targets (markerlights) button each Shooting phase.",
      "Guided bonuses apply only to ranged attacks against Spotted enemy units."
    ],
    detachments: {
      "Kauyon": {
        rule: { name: "Patient Hunter", desc: "Rounds 3-5: T'au ranged weapons gain [SUSTAINED HITS 1]; Guided units shooting Spotted targets may ignore Hit/BS modifiers.",
          fx: [{ k: 'grant', ab: 'sustained', val: 1, cond: 'rangedOnly+round3plus', scope: 'army' },
               { k: 'ignoreModifiers', cond: 'guided+round3plus', scope: 'army' }] },
        enhancements: [
          { name: "Exemplar of the Kauyon", pts: 20, restrict: "T\u2019AU EMPIRE", desc: "Patient Hunter applies to the bearer's unit from round 2.", fx: [] },
          { name: "Precision of the Patient Hunter", pts: 15, restrict: "T\u2019AU EMPIRE", desc: "+1 to Hit with ranged; +1 to Wound from round 3.", fx: [{ k: 'addHit', n: 1, cond: 'rangedOnly', selfOnly: true }, { k: 'addWound', n: 1, cond: 'rangedOnly+round3plus', selfOnly: true }] },
          { name: "Solid-image Projection Unit", pts: 30, restrict: "T\u2019AU EMPIRE", desc: "Redeploy up to three units after deployment (may go to Reserves).", fx: [] },
          { name: "Through Unity, Devastation", pts: 40, restrict: "T\u2019AU EMPIRE", desc: "While the bearer's unit is an Observer, Guided units gain [LETHAL HITS] vs their Spotted target.", fx: [{ k: 'grant', ab: 'lethal', cond: 'guided', selfOnly: true }] }
        ],
        stratagems: [
          { name: "A Tempting Trap", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "+1 to Wound vs enemies near your Trap objective (rounds 3+).", fx: [{ k: 'addWound', n: 1, cond: 'targetWithinObjective+round3plus' }] },
          { name: "Point-blank Ambush", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "+1 AP vs targets within 9\" (rounds 3+).", fx: [{ k: 'plusApRanged', n: 1, cond: 'within12+round3plus' }] },
          { name: "Coordinate to Engage", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "+1 to hit vs your Spotted target (markerlight: ignores cover).", fx: [{ k: 'addHit', n: 1, cond: 'guided' }] },
          { name: "Combat Embarkation", cp: 1, type: "Wargear", when: 'oppCharge', targetSelf: true, desc: "Embark to dodge a charge.", fx: [] },
          { name: "Photon Grenades", cp: 1, type: "Wargear", when: 'oppCharge', targetSelf: true, desc: "Battle-shock a charging enemy; -2 to its Charge.", fx: [] },
          { name: "Wall of Mirrors", cp: 1, type: "Battle Tactic", when: 'oppFightEnd', targetSelf: true, desc: "Pull a Stealth/Ghostkeel/Shadowsun unit into Reserves.", fx: [{ k: 'toReserves' }] }
        ]
      },
      "Mont\u2019ka": {
        rule: { name: "Killing Blow", desc: "Rounds 1-3: T'au ranged weapons gain [ASSAULT]; Guided units' ranged weapons gain [LETHAL HITS].",
          fx: [{ k: 'grant', ab: 'assault', cond: 'rangedOnly+round1to3', scope: 'army' },
               { k: 'grant', ab: 'lethal', cond: 'guided+round1to3', scope: 'army' }] },
        enhancements: [
          { name: "Coordinated Exploitation", pts: 40, restrict: "T\u2019AU EMPIRE", desc: "While the bearer's unit is an Observer, Guided units gain [SUSTAINED HITS 1] vs their Spotted target.", fx: [{ k: 'grant', ab: 'sustained', val: 1, cond: 'guided', selfOnly: true }] },
          { name: "Exemplar of the Mont\u2019ka", pts: 10, restrict: "T\u2019AU EMPIRE", desc: "Killing Blow also applies to the bearer's unit in round 4.", fx: [] },
          { name: "Strategic Conqueror", pts: 15, restrict: "T\u2019AU EMPIRE", desc: "+1 OC near a chosen objective.", fx: [{ k: 'objControl', n: 1, cond: 'selfOnHeldObjective', selfOnly: true }] },
          { name: "Strike Swiftly", pts: 25, restrict: "T\u2019AU EMPIRE", desc: "Grant two nearby units Scouts 6\".", fx: [] }
        ],
        stratagems: [
          { name: "Pinpoint Counter-offensive", cp: 1, type: "Battle Tactic", when: 'anyPhase', targetSelf: true, desc: "Re-roll Hits vs the unit that killed yours.", fx: [] },
          { name: "Aggressive Mobility", cp: 1, type: "Battle Tactic", when: 'movement', targetSelf: true, desc: "+6\" Move on the Advance (no roll).", fx: [{ k: 'extraMove', dice: '6' }] },
          { name: "Focused Fire", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "+1 AP when massing fire on one target (rounds 1-3).", fx: [{ k: 'plusApRanged', n: 1, cond: 'round1to3' }] },
          { name: "Combat Debarkation", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Re-roll Wounds vs the closest enemy after disembarking.", fx: [{ k: 'rerollWound', val: 'all', cond: 'closestTarget' }] },
          { name: "Pulse Onslaught", cp: 2, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Shake an enemy hit by your fire (−2 Move/Advance/Charge).", fx: [] },
          { name: "Counterfire Defence Systems", cp: 2, type: "Wargear", when: 'targeted', targetSelf: true, desc: "Incoming attacks -1 Damage.", fx: [{ k: 'reduceIncomingDmg', n: 1 }] }
        ]
      },
      "Retaliation Cadre": {
        rule: { name: "Bonded Heroes", desc: "T'au BATTLESUIT ranged attacks: +1 Strength vs targets within 12\", and +1 AP as well vs targets within 9\".",
          fx: [{ k: 'plusStrRanged', n: 1, cond: 'within12', scope: 'army' },
               { k: 'plusApRanged', n: 1, cond: 'within9', scope: 'army' }] },
        enhancements: [
          { name: "Internal Grenade Racks", pts: 20, restrict: "T\u2019AU EMPIRE BATTLESUIT", desc: "Bomb run: mortal wounds to a unit moved over.", fx: [] },
          { name: "Prototype Weapon System", pts: 15, restrict: "T\u2019AU EMPIRE BATTLESUIT", desc: "Bearer's ranged gain [LETHAL HITS] or [SUSTAINED HITS 1].", fx: [{ k: 'grant', ab: 'lethal', cond: 'rangedOnly', selfOnly: true }] },
          { name: "Puretide Engram Neurochip", pts: 25, restrict: "T\u2019AU EMPIRE BATTLESUIT", desc: "Chance to refund CP when targeted by a Stratagem.", fx: [] },
          { name: "Starflare Ignition System", pts: 20, restrict: "T\u2019AU EMPIRE BATTLESUIT", desc: "Slip into Reserves at end of opponent's turn.", fx: [] }
        ],
        stratagems: [
          { name: "Fail-safe Detonator", cp: 2, type: "Epic Deed", when: 'anyDestroyed', targetSelf: true, desc: "Force a max Deadly Demise, or mortal wounds nearby.", fx: [] },
          { name: "Stimm Injectors", cp: 1, type: "Wargear", when: 'targeted', targetSelf: true, desc: "Feel No Pain 6+.", fx: [{ k: 'fnp', val: 6 }] },
          { name: "The Shortened Blade", cp: 2, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Deep Strike >6\" from enemies (no charge).", fx: [] },
          { name: "The Arro\u2019kon Protocol", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "[SUSTAINED HITS 1] vs 6+ model units (2 vs 11+).", fx: [{ k: 'grant', ab: 'sustained', val: 1 }] },
          { name: "The Torchstar Gambit", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Make a Normal move after shooting (no charge).", fx: [{ k: 'extraMove', dice: '6' }] },
          { name: "Grav-inhibitor Field", cp: 1, type: "Strategic Ploy", when: 'oppCharge', targetSelf: true, desc: "Battle-shock a charging enemy; mortal wounds on 6s.", fx: [] }
        ]
      },
      "Kroot Hunting Pack": {
        rule: { name: "Hunter\u2019s Instincts", desc: "KROOT attacks: +1 Hit vs below-strength targets, +1 Wound vs below-half targets. KROOT have a 6+ invuln vs melee, 5+ vs ranged.",
          fx: [{ k: 'addHit', n: 1, cond: 'targetBelowStrength', scope: 'army' },
               { k: 'addWound', n: 1, cond: 'targetBelowHalf', scope: 'army' },
               { k: 'invuln', val: 5, cond: 'rangedOnly', scope: 'army' },
               { k: 'invuln', val: 6, cond: 'meleeOnly', scope: 'army' }] },
        enhancements: [
          { name: "Borthrod Gland", pts: 15, restrict: "KROOT FLESH SHAPER", desc: "Bearer's unit: melee crit on unmodified 5+.", fx: [{ k: 'critOn', val: 5, cond: 'meleeOnly', selfOnly: true }] },
          { name: "Kroothawk Flock", pts: 10, restrict: "KROOT", desc: "Ranged gain [IGNORES COVER]; deny nearby enemy reserves.", fx: [{ k: 'grant', ab: 'ignorescover', cond: 'rangedOnly', selfOnly: true }] },
          { name: "Nomadic Hunter", pts: 20, restrict: "KROOT TRAIL SHAPER", desc: "+3\" Move and [ASSAULT] for the bearer's unit.", fx: [{ k: 'grant', ab: 'assault', cond: 'rangedOnly', selfOnly: true }] },
          { name: "Root-carved Weapons", pts: 10, restrict: "KROOT WAR SHAPER", desc: "Bearer's weapons gain [PRECISION] and [DEVASTATING WOUNDS].", fx: [{ k: 'grant', ab: 'precision', selfOnly: true }, { k: 'grant', ab: 'devastating', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Join the Hunt", cp: 2, type: "Battle Tactic", when: 'anyPhase', targetSelf: true, desc: "Return a destroyed Kroot unit to Reserves at full strength.", fx: [] },
          { name: "A Trap Well Laid", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "+1 AP vs a unit you hit (if not Battle-shocked).", fx: [{ k: 'plusApRanged', n: 1 }, { k: 'plusApMelee', n: 1 }] },
          { name: "EMP Grenades", cp: 1, type: "Wargear", when: 'oppShootOrFight', targetSelf: true, desc: "Worsen a nearby enemy Vehicle's WS/BS by 1.", fx: [] },
          { name: "The Grisly Feast", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Battle-shock enemies near a unit that killed this phase.", fx: [] },
          { name: "Guerrilla Warriors", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot and charge after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Hidden Hunters", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Can only be shot from within 18\".", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12' }] }
        ]
      },
      "Auxiliary Cadre": {
        rule: { name: "Integrated Command Structure", desc: "Kroot/Vespid project a Targeting Triangulation aura (+1 AP for T'au shooting enemies near them) and benefit from Localised Stealth Projectors. Aura modelled as a flat +1 AP for non-Kroot T'au ranged attacks.",
          fx: [{ k: 'plusApRanged', n: 1, scope: 'army' }] },
        enhancements: [
          { name: "Student of Kauyon", pts: 15, restrict: "KROOT SHAPER", desc: "Grant up to three Kroot units Deep Strike.", fx: [] },
          { name: "Admired Leader", pts: 20, restrict: "T\u2019AU EMPIRE", desc: "+1 LD/OC to a nearby Kroot/Vespid unit in Command.", fx: [] },
          { name: "Fanatical Convert", pts: 10, restrict: "KROOT", desc: "Bearer's unit gains For the Greater Good.", fx: [] },
          { name: "Transponder Lock Module", pts: 25, restrict: "T\u2019AU EMPIRE WALKER", desc: "Reliable early Deep Strike near Kroot/Vespid.", fx: [{ k: 'grantDeepStrike' }] }
        ],
        stratagems: [
          { name: "Experimental Modifications", cp: 1, type: "Strategic Ploy", when: 'shootOrFight', targetSelf: true, desc: "+1 AP to the unit's weapons.", fx: [{ k: 'plusApRanged', n: 1 }, { k: 'plusApMelee', n: 1 }] },
          { name: "Multisensory Scanning", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Re-roll Wounds of 1 (full for Kroot/Vespid).", fx: [{ k: 'rerollWound', val: 1 }] },
          { name: "Interlocking Manoeuvres", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Make a 6\" Normal move or Fall Back.", fx: [{ k: 'extraMove', dice: '6' }] },
          { name: "Pheromone Waypoints", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "+6\" Move on the Advance (no roll).", fx: [{ k: 'extraMove', dice: '6' }] },
          { name: "Alien Expertise", cp: 1, type: "Battle Tactic", when: 'movement', targetSelf: true, desc: "Shoot after Advancing (Kroot/Vespid: charge too).", fx: [{ k: 'eligShootAfterAdvance' }] },
          { name: "Guided Fire", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "+1 Strength ranged (+2 near Kroot/Vespid).", fx: [{ k: 'plusStrRanged', n: 1 }] }
        ]
      },
      "Experimental Prototype Cadre": {
        rule: { name: "Superior Craftsmanship", desc: "+6\" Range to ranged weapons of T'au models. (Range extension is modelled where the engine uses weapon range.)", fx: [] },
        enhancements: [
          { name: "Supernova Launcher", pts: 15, restrict: "T\u2019AU EMPIRE", desc: "Upgrades an airbursting projector (+3 S, +1 AP/D).", fx: [] },
          { name: "Thermoneutronic Projector", pts: 20, restrict: "T\u2019AU EMPIRE", desc: "Upgrades a T'au flamer (+2 S, +1 AP/D).", fx: [] },
          { name: "Plasma Accelerator Rifle", pts: 10, restrict: "T\u2019AU EMPIRE", desc: "Upgrades a plasma rifle (+2 S, +1 A/AP/D).", fx: [] },
          { name: "Fusion Blades", pts: 25, restrict: "T\u2019AU EMPIRE", desc: "Upgrades a fusion blaster (+1 A, +3 S, [MELTA 4]).", fx: [] }
        ],
        stratagems: [
          { name: "Automated Repair Drones", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "A Battlesuit model regains D3+1 wounds.", fx: [] },
          { name: "Reactive Impact Dampeners", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "-1 to Wound when the attack's Strength exceeds Toughness.", fx: [{ k: 'subIncomingWound', n: 1, cond: 'strHigherThanT' }] },
          { name: "Experimental Weaponry", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Re-roll attack-number dice.", fx: [] },
          { name: "Experimental Ammunition", cp: 1, type: "Wargear", when: 'shooting', targetSelf: true, desc: "+1 Strength ranged (or +1 S/AP with Hazardous).", fx: [{ k: 'plusStrRanged', n: 1 }] },
          { name: "Threat Assessment Analyser", cp: 1, type: "Wargear", when: 'shooting', targetSelf: true, desc: "Ranged gain [SUSTAINED HITS 1] or [LETHAL HITS].", fx: [{ k: 'grant', ab: 'lethal', cond: 'rangedOnly' }] },
          { name: "Neuroweb System Jammer", cp: 1, type: "Wargear", when: 'targeted', targetSelf: true, desc: "Crisis unit can only be shot from within 18\".", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12' }] }
        ]
      }
    }
  },

  "Aeldari": {
    // Army rule Battle Focus is backed by the token subsystem (per-round pool by battle size, spent on
    // Agile Manoeuvres via the panel). Most manoeuvres are movement; Star Engines grants Assault.
    armyRule: {
      name: "Battle Focus",
      desc: "At the start of each battle round you receive Battle Focus tokens by battle size (2/4/6). Spend them via the panel for Agile Manoeuvres: Swift as the Wind (+2\" Move), repositions (D6+1\"), Star Engines (Vehicle ranged → Assault), Sudden Strike, Flitting Shadows (no Overwatch). Unspent tokens are lost at round end.",
      fx: []
    },
    restrictions: [
      "Asuryani army. Battle Focus tokens are tracked in the panel; spend them on Agile Manoeuvres.",
      "Harlequins may be included; Ynnari/Harlequins generally can't be the Army Faction."
    ],
    detachments: {
      "Warhost": {
        rule: { name: "Martial Grace", desc: "+1 Battle Focus token each round; Swift as the Wind gives +1\" extra; +1 to any Agile Manoeuvre D6.", fx: [] },
        enhancements: [
          { name: "Phoenix Gem", pts: 35, restrict: "ASURYANI", desc: "Once: the bearer returns at full wounds on a 2+ when destroyed.", fx: [] },
          { name: "Timeless Strategist", pts: 15, restrict: "ASURYANI", desc: "+1 Battle Focus token each round.", fx: [] },
          { name: "Gift of Foresight", pts: 15, restrict: "ASURYANI", desc: "Free Command Re-roll on the bearer's unit once per round.", fx: [] },
          { name: "Psychic Destroyer", pts: 30, restrict: "ASURYANI PSYKER", desc: "+1 Damage to the bearer's ranged psychic weapons.", fx: [] }
        ],
        stratagems: [
          { name: "Lightning-fast Reactions", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Attackers -1 to Hit.", fx: [{ k: 'subIncomingHit', n: 1 }] },
          { name: "Skyborne Sanctuary", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Embark into a nearby transport.", fx: [] },
          { name: "Feigned Retreat", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot and charge after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Blitzing Firepower", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "[SUSTAINED HITS 1] vs targets within 12\".", fx: [{ k: 'grant', ab: 'sustained', val: 1, cond: 'within12' }] },
          { name: "Fire and Fade", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Make a D6+1\" Normal move after shooting.", fx: [{ k: 'extraMove', dice: 'D6' }] },
          { name: "Webway Tunnel", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull an Infantry unit near a board edge into Reserves.", fx: [{ k: 'toReserves' }] }
        ]
      },
      "Windrider Host": {
        rule: { name: "Ride the Wind", desc: "Asuryani Mounted/Vyper units can start in and recycle through Reserves; treat the round as one higher for their arrival.", fx: [] },
        enhancements: [
          { name: "Firstdrawn Blade", pts: 10, restrict: "ASURYANI MOUNTED", desc: "Bearer's unit gains Scouts 9\".", fx: [] },
          { name: "Mirage Field", pts: 25, restrict: "ASURYANI MOUNTED", desc: "Attackers -1 to Hit.", fx: [{ k: 'subIncomingHit', n: 1, selfOnly: true }] },
          { name: "Seersight Strike", pts: 15, restrict: "ASURYANI MOUNTED PSYKER", desc: "Bearer's psychic weapons gain [ANTI-MONSTER 2+] and [ANTI-VEHICLE 2+].", fx: [{ k: 'antiVal', kw: 'VEHICLE', val: 2, cond: 'targetMonsterVehicle', selfOnly: true }] },
          { name: "Echoes of Ulthanesh", pts: 20, restrict: "ASURYANI MOUNTED", desc: "Chance to gain CP based on the bearer's position.", fx: [] }
        ],
        stratagems: [
          { name: "Death from on High", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Re-roll Wounds for a just-arrived unit.", fx: [{ k: 'rerollWound', val: 'all', cond: 'setUpThisTurn' }] },
          { name: "Overflight", cp: 1, type: "Strategic Ploy", when: 'shootOrFightEnd', targetSelf: true, desc: "Make a 7\" Normal move after a kill.", fx: [{ k: 'extraMove', dice: '6' }] },
          { name: "Wind of Blades", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot and charge after Advancing/Falling Back.", fx: [{ k: 'eligShootAfterAdvance' }, { k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterAdvance' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Daring Riders", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Arrive from Reserves >6\" from enemies.", fx: [] },
          { name: "Focused Firepower", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "+1 AP to the unit's attacks.", fx: [{ k: 'plusApRanged', n: 1 }] },
          { name: "Spiralling Evasion", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "4+ invulnerable save.", fx: [{ k: 'invuln', val: 4 }] }
        ]
      },
      "Spirit Conclave": {
        rule: { name: "Shepherds of the Dead", desc: "Wraith constructs near a friendly Aeldari Psyker gain Battle Focus; +1 Hit/+1 Wound vs units that killed your Psykers (Vengeful Dead, approximated).", fx: [] },
        enhancements: [
          { name: "Light of Clarity", pts: 30, restrict: "SPIRITSEER", desc: "+OC to a nearby Wraith Construct unit.", fx: [] },
          { name: "Stave of Kurnous", pts: 15, restrict: "SPIRITSEER", desc: "A nearby Wraith Construct gains [PRECISION] on Critical Wounds.", fx: [] },
          { name: "Rune of Mists", pts: 10, restrict: "SPIRITSEER", desc: "A nearby Wraith Construct gains Benefit of Cover beyond 18\".", fx: [] },
          { name: "Higher Duty", pts: 25, restrict: "SPIRITSEER", desc: "Reactive 6\" move when enemies approach.", fx: [] }
        ],
        stratagems: [
          { name: "Seer\u2019s Eye", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Ignore AP/Damage modifiers vs a chosen enemy.", fx: [{ k: 'ignoreModifiers' }] },
          { name: "Wraithbone Armour", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Incoming attacks -1 Damage.", fx: [{ k: 'reduceIncomingDmg', n: 1 }] },
          { name: "Blades from Beyond", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Melee gain [DEVASTATING WOUNDS].", fx: [{ k: 'grant', ab: 'devastating', cond: 'meleeOnly' }] },
          { name: "Soul Bridge", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Extend Psyker guidance range to a Wraith unit.", fx: [] },
          { name: "Spirit Token", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Hold an objective stickily.", fx: [{ k: 'stickyObjective', cond: 'selfOnHeldObjective' }] },
          { name: "Crushing Strides", cp: 1, type: "Battle Tactic", when: 'charge', targetSelf: true, desc: "Mortal wounds to an engaged enemy after a Wraith charge.", fx: [] }
        ]
      },
      "Guardian Battlehost": {
        rule: { name: "Defend at All Costs", desc: "Dire Avenger/Guardian/Support Weapon/War Walker attacks: +1 to Hit if your unit and/or the target are near an objective.",
          fx: [{ k: 'addHit', n: 1, cond: 'objectiveContested', scope: 'army' }] },
        enhancements: [
          { name: "Craftworld\u2019s Champion", pts: 25, restrict: "ASURYANI", desc: "Bearer has Objective Control 5.", fx: [{ k: 'objControl', n: 3, selfOnly: true }] },
          { name: "Ethereal Pathway", pts: 30, restrict: "ASURYANI", desc: "Two Guardian units gain Infiltrators.", fx: [] },
          { name: "Protector of the Paths", pts: 20, restrict: "ASURYANI", desc: "Free, improved Fire Overwatch once per round.", fx: [] },
          { name: "Breath of Vaul", pts: 10, restrict: "ASURYANI", desc: "Re-roll flamer attack and fusion damage dice.", fx: [] }
        ],
        stratagems: [
          { name: "Warding Salvoes", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Re-roll Wounds vs enemies near an objective.", fx: [{ k: 'rerollWound', val: 'all', cond: 'targetWithinObjective' }] },
          { name: "Shield Nodes", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "On an objective: attackers -1 to Wound.", fx: [{ k: 'subIncomingWound', n: 1, cond: 'selfOnHeldObjective' }] },
          { name: "Vaul\u2019s Vengeance", cp: 1, type: "Battle Tactic", when: 'oppShootResolved', targetSelf: true, desc: "War Walkers shoot back at the killer.", fx: [{ k: 'shootBack' }] },
          { name: "Time to Strike", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "+6\" Move on the Advance; shoot/charge after.", fx: [{ k: 'extraMove', dice: '6' }, { k: 'eligShootAfterAdvance' }, { k: 'eligChargeAfterAdvance' }] },
          { name: "Blades of Asuryan", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Ranged gain [PISTOL].", fx: [] },
          { name: "Cost of Victory", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull a Guardian unit into Reserves, returning its dead.", fx: [{ k: 'toReserves' }] }
        ]
      },
      "Ghosts of the Webway": {
        rule: { name: "Acrobatic Onslaught", desc: "Harlequins models can move through enemy models when charging.", fx: [] },
        enhancements: [
          { name: "Cegorach\u2019s Coil", pts: 25, restrict: "TROUPE MASTER", desc: "Mortal wounds to an engaged enemy after a charge.", fx: [] },
          { name: "Mask of Secrets", pts: 15, restrict: "HARLEQUINS", desc: "Enemies near the bearer suffer worse Desperate Escape.", fx: [] },
          { name: "Murder\u2019s Jest", pts: 20, restrict: "DEATH JESTER", desc: "Crit on every hit vs below-half-strength targets.", fx: [{ k: 'critOn', val: 6, cond: 'targetBelowHalf', selfOnly: true }] },
          { name: "Mistweave", pts: 15, restrict: "SHADOWSEER", desc: "Bearer's unit gains Infiltrators.", fx: [] }
        ],
        stratagems: [
          { name: "Staged Death", cp: 1, type: "Strategic Ploy", when: 'anyPhase', targetSelf: true, desc: "Return a destroyed Character at half wounds.", fx: [] },
          { name: "Heroes\u2019 Fall", cp: 1, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "Destroyed models fight on (4+).", fx: [{ k: 'fightOnDeath' }] },
          { name: "Mocking Flight", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot and charge after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Tricksters\u2019 Retort", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Make a 6\" Normal move.", fx: [{ k: 'extraMove', dice: '6' }] },
          { name: "Bloody Dance", cp: 1, type: "Strategic Ploy", when: 'oppChargeEnd', targetSelf: true, desc: "Declare and resolve a charge in your opponent's turn.", fx: [] },
          { name: "Exit the Stage", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull a Harlequins unit into Reserves.", fx: [{ k: 'toReserves' }] }
        ]
      },
      "Devoted of Ynnead": {
        rule: { name: "Strength from Death", desc: "Lethal Intent/Surge/Reprisal: react to losses with extra moves and Fights First for below-strength units (movement approximated).", fx: [] },
        enhancements: [
          { name: "Gaze of Ynnead", pts: 15, restrict: "FARSEER", desc: "Bearer's Eldritch Storm gains [DEVASTATING WOUNDS].", fx: [] },
          { name: "Storm of Whispers", pts: 10, restrict: "WARLOCK", desc: "Battle-shock an enemy the bearer hits.", fx: [] },
          { name: "Borrowed Vigour", pts: 10, restrict: "ARCHON", desc: "+2 Attacks to the bearer's melee.", fx: [{ k: 'plusAttacksMelee', n: 2, selfOnly: true }] },
          { name: "Morbid Might", pts: 15, restrict: "SUCCUBUS", desc: "Re-roll the bearer's melee Wounds.", fx: [{ k: 'rerollWound', val: 'all', cond: 'meleeOnly', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Pall of Dread", cp: 1, type: "Strategic Ploy", when: 'anyPhase', targetSelf: true, desc: "Hold an objective stickily after a unit dies on it.", fx: [{ k: 'stickyObjective', cond: 'selfOnHeldObjective' }] },
          { name: "Macabre Resilience", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Attackers -1 to Wound.", fx: [{ k: 'subIncomingWound', n: 1 }] },
          { name: "Emissaries of Ynnead", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Re-roll Hits of 1 (full if below strength).", fx: [{ k: 'rerollHit', val: 1 }, { k: 'rerollHit', val: 'all', cond: 'selfBelowStrength' }] },
          { name: "Parting the Veil", cp: 2, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "Destroyed models fight on before removal.", fx: [{ k: 'fightOnDeath' }] },
          { name: "Soulsight", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Ranged gain [LETHAL HITS] and [IGNORES COVER].", fx: [{ k: 'grant', ab: 'lethal', cond: 'rangedOnly' }, { k: 'grant', ab: 'ignorescover', cond: 'rangedOnly' }] },
          { name: "Death Answers Death", cp: 1, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Shoot back after losing models.", fx: [{ k: 'shootBack' }] }
        ]
      },
      "Seer Council": {
        rule: { name: "Strands of Fate", desc: "Fate dice (rolled at battle start) can discount Seer Council Stratagems. (Fate-dice economy not separately tracked; the listed Stratagems work normally.)", fx: [] },
        enhancements: [
          { name: "Lucid Eye", pts: 30, restrict: "ASURYANI PSYKER", desc: "Adjust a Fate die in Command.", fx: [] },
          { name: "Runes of Warding", pts: 25, restrict: "ASURYANI PSYKER", desc: "Bearer's unit FNP 4+ vs mortals/psychic/devastating.", fx: [{ k: 'fnp', val: 4, selfOnly: true }] },
          { name: "Stone of Eldritch Fury", pts: 15, restrict: "ASURYANI PSYKER", desc: "+12\" range to the bearer's psychic weapons.", fx: [] },
          { name: "Torc of Morai-Heg", pts: 20, restrict: "ASURYANI PSYKER", desc: "Tax an enemy Stratagem near the bearer.", fx: [{ k: 'enemyStratTax' }] }
        ],
        stratagems: [
          { name: "Presentiment of Dread", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Battle-shock a visible enemy at -1.", fx: [] },
          { name: "Forewarned", cp: 1, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "Attackers -1 Hit and -1 Wound (near a Psyker).", fx: [{ k: 'subIncomingHit', n: 1 }, { k: 'subIncomingWound', n: 1 }] },
          { name: "Unshrouded Truth", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Redeploy a unit >9\" from enemies.", fx: [] },
          { name: "Fate Inescapable", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Ranged gain [IGNORES COVER]; +1 AP on Critical Wounds.", fx: [{ k: 'grant', ab: 'ignorescover', cond: 'rangedOnly' }] },
          { name: "Isha\u2019s Fury", cp: 1, type: "Epic Deed", when: 'oppMove', targetSelf: true, desc: "Mortal wounds to a nearby enemy.", fx: [] },
          { name: "Psychic Shield", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Can only be shot from within 18\".", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12' }] }
        ]
      },
      "Aspect Host": {
        // Path of the Warrior is a per-activation choice; modelled as a doctrine pair (re-roll Hits or Wounds of 1).
        rule: { name: "Path of the Warrior", desc: "Each time an Aspect Warriors/Avatar unit shoots or fights, choose to re-roll Hit rolls of 1 or Wound rolls of 1.", fx: [] },
        doctrineLabel: "Aspect focus",
        doctrines: [
          { id: 'asphit', name: "Re-roll Hits of 1", desc: "Re-roll Hit rolls of 1.", fx: [{ k: 'rerollHit', val: 1 }] },
          { id: 'aspwnd', name: "Re-roll Wounds of 1", desc: "Re-roll Wound rolls of 1.", fx: [{ k: 'rerollWound', val: 1 }] }
        ],
        enhancements: [
          { name: "Aspect of Murder", pts: 25, restrict: "AUTARCH", desc: "+1 Damage and [PRECISION] to the bearer's melee.", fx: [{ k: 'grant', ab: 'precision', cond: 'meleeOnly', selfOnly: true }] },
          { name: "Mantle of Wisdom", pts: 30, restrict: "AUTARCH", desc: "Bearer's Aspect unit gets both Path of the Warrior re-rolls.", fx: [{ k: 'rerollHit', val: 1, selfOnly: true }, { k: 'rerollWound', val: 1, selfOnly: true }] },
          { name: "Shimmerstone", pts: 15, restrict: "AUTARCH", desc: "Bearer's Aspect unit: attackers -1 to Wound (ranged).", fx: [{ k: 'subIncomingWound', n: 1, cond: 'rangedOnly', selfOnly: true }] },
          { name: "Strategic Savant", pts: 15, restrict: "AUTARCH", desc: "+1 Objective Control to the bearer's Aspect unit.", fx: [{ k: 'objControl', n: 1, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Warrior Focus", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Ignore all modifiers to your attacks.", fx: [{ k: 'ignoreModifiers' }] },
          { name: "To Their Final Breath", cp: 1, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "Destroyed models fight on (4+).", fx: [{ k: 'fightOnDeath' }] },
          { name: "Skyborne Sanctuary", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Embark into a nearby transport.", fx: [] },
          { name: "Doom Inescapable", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Avatar's Wailing Doom becomes 18\" Damage 8.", fx: [] },
          { name: "Preternatural Precision", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Ranged gain Ignores Cover/Lethal/Sustained.", fx: [{ k: 'grant', ab: 'lethal', cond: 'rangedOnly' }] },
          { name: "Khaine\u2019s Vengeance", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Desperate Escape tests on a falling-back enemy.", fx: [] }
        ]
      },
      "Armoured Warhost": {
        rule: { name: "Skilled Crews", desc: "Aeldari VEHICLE ranged weapons have [ASSAULT]; re-roll Advance for Aeldari VEHICLE FLY units.",
          fx: [{ k: 'grant', ab: 'assault', cond: 'rangedOnly+isVehicle', scope: 'army' }] },
        enhancements: [
          { name: "Guiding Presence", pts: 25, restrict: "AELDARI PSYKER", desc: "+1 Hit for a nearby Vehicle in the Shooting phase.", fx: [] },
          { name: "Harmonisation Matrix", pts: 30, restrict: "AELDARI", desc: "Chance to gain CP on an objective.", fx: [] },
          { name: "Spirit Stone of Raelyth", pts: 20, restrict: "AELDARI PSYKER", desc: "Lone Operative near vehicles; heal a nearby Vehicle D3.", fx: [] },
          { name: "Guileful Strategist", pts: 15, restrict: "AELDARI", desc: "Redeploy up to three Vehicle units (may go to Reserves).", fx: [] }
        ],
        stratagems: [
          { name: "Layered Wards", cp: 1, type: "Strategic Ploy", when: 'anyPhase', targetSelf: true, desc: "FNP 5+ vs mortal wounds.", fx: [] },
          { name: "Swift Deployment", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Disembark after the transport Advanced.", fx: [] },
          { name: "Vectored Engines", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Vehicle may shoot after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }] },
          { name: "Cloudstrike", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Flying Vehicle gains Deep Strike, arrives >6\".", fx: [{ k: 'grantDeepStrike' }] },
          { name: "Soulsight", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Re-roll one Hit, Wound and Damage.", fx: [{ k: 'rerollHit', val: 1 }] },
          { name: "Anti-grav Repulsion", cp: 1, type: "Strategic Ploy", when: 'oppCharge', targetSelf: true, desc: "-2 to a charging enemy's Charge roll.", fx: [] }
        ]
      },
      "Serpent\u2019s Brood": {
        rule: { name: "Boons of the Brood", desc: "Harlequins Mounted/Vehicle weapons have [SUSTAINED HITS 1]; disembarking Harlequins gain it too.",
          fx: [{ k: 'grant', ab: 'sustained', val: 1, cond: 'isHarleMountedVeh', scope: 'army' }] },
        enhancements: [
          { name: "Key of Ghosts", pts: 20, restrict: "HARLEQUINS", desc: "Bearer's unit gains Scouts 6\".", fx: [] },
          { name: "Weavers\u2019 Wail", pts: 20, restrict: "TROUPE MASTER", desc: "+3 Strength, +1 Attacks to the bearer's melee.", fx: [{ k: 'plusStrMelee', n: 3, selfOnly: true }, { k: 'plusAttacksMelee', n: 1, selfOnly: true }] },
          { name: "Fanged Leer", pts: 10, restrict: "DEATH JESTER", desc: "Death Jester picks two shrieker abilities.", fx: [] },
          { name: "Shedskin Raiment", pts: 25, restrict: "SHADOWSEER", desc: "Redeploy up to three Harlequins units (may go to Reserves).", fx: [] }
        ],
        stratagems: [
          { name: "Fangs of the Brood", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Pick three Dance-of-Death abilities.", fx: [{ k: 'grant', ab: 'sustained', val: 1, cond: 'meleeOnly' }] },
          { name: "Venomous Wrath", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Make a 6\" move after shooting.", fx: [{ k: 'extraMove', dice: '6' }] },
          { name: "Striking Stride", cp: 1, type: "Strategic Ploy", when: 'charge', targetSelf: true, desc: "Charge after Advancing.", fx: [{ k: 'eligChargeAfterAdvance' }] },
          { name: "Weavers\u2019 Coils", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Make a Normal or Fall Back move.", fx: [{ k: 'extraMove', dice: '6' }] },
          { name: "Weaving Stride", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Make a 6\" Normal move.", fx: [{ k: 'extraMove', dice: '6' }] },
          { name: "Skyward Lunge", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull a Vehicle/Mounted unit into Reserves.", fx: [{ k: 'toReserves' }] }
        ]
      },
      "Eldritch Raiders": {
        rule: { name: "Yriel\u2019s Own", desc: "Aeldari units may charge after Advancing; Anhrathe/Rangers/Shroud Runners re-roll Advance rolls.",
          fx: [{ k: 'eligChargeAfterAdvance', scope: 'army' }, { k: 'rerollAdvance', scope: 'army' }] },
        enhancements: [
          { name: "Pirate Prince", pts: 15, restrict: "PRINCE YRIEL", desc: "Chance to refund a Battle Focus token.", fx: [] },
          { name: "Alacritous Assault", pts: 20, restrict: "ANHRATHE", desc: "Unit's melee gain [LANCE].", fx: [{ k: 'grant', ab: 'lance', cond: 'meleeOnly', selfOnly: true }] },
          { name: "Exotic Munitions", pts: 15, restrict: "ANHRATHE", desc: "Ranged gain [ANTI-MONSTER 5+]/[ANTI-VEHICLE 5+].", fx: [{ k: 'antiVal', kw: 'VEHICLE', val: 5, cond: 'targetMonsterVehicle', selfOnly: true }] },
          { name: "Adrenal Infusions", pts: 20, restrict: "ANHRATHE INFANTRY", desc: "Free Fade Back manoeuvre.", fx: [] }
        ],
        stratagems: [
          { name: "Raiders\u2019 Spoils", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "+1 OC to an engaged unit.", fx: [{ k: 'objControl', n: 1 }] },
          { name: "Ruthless Killers", cp: 1, type: "Strategic Ploy", when: 'shootOrFight', targetSelf: true, desc: "+1 Damage to the unit's attacks.", fx: [] },
          { name: "Yriel\u2019s Example", cp: 1, type: "Epic Deed", when: 'fightTargeted', targetSelf: true, desc: "Feel No Pain 5+.", fx: [{ k: 'fnp', val: 5 }] },
          { name: "No Prey Too Big", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "+1 Wound when out-toughened.", fx: [{ k: 'addWound', n: 1, cond: 'strLowerThanT' }] },
          { name: "Impeding Fire", cp: 1, type: "Wargear", when: 'oppCharge', targetSelf: true, desc: "-2 to a visible enemy's Charge roll.", fx: [] },
          { name: "Withdraw and Reinforce", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull an Anhrathe unit into Reserves, returning its dead.", fx: [{ k: 'toReserves' }] }
        ]
      },
      "Corsair Coterie": {
        rule: { name: "Relentless Raiders", desc: "Enemies moving within range of objectives you control risk D3 mortal wounds; Anhrathe hold objectives stickily.", fx: [] },
        enhancements: [
          { name: "Infamy", pts: 25, restrict: "ANHRATHE", desc: "Enemies within 3\" lose 1 Objective Control.", fx: [] },
          { name: "Webway Pathstone", pts: 25, restrict: "ANHRATHE", desc: "Unit gains Deep Strike; can re-enter Reserves once.", fx: [{ k: 'grantDeepStrike' }] },
          { name: "Archraider", pts: 35, restrict: "ANHRATHE CHARACTER", desc: "Tax enemy Stratagems near this model.", fx: [{ k: 'enemyStratTax' }] },
          { name: "Voidstone", pts: 15, restrict: "ANHRATHE INFANTRY", desc: "Unit has a 5+ invulnerable save.", fx: [{ k: 'invuln', val: 5, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Pirates\u2019 Due", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Re-roll Wounds of 1 (full vs enemies near an objective).", fx: [{ k: 'rerollWound', val: 1 }] },
          { name: "Lethal Ruse", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Charge after Falling Back; mortal wounds for Anhrathe.", fx: [{ k: 'eligChargeAfterFallBack' }] },
          { name: "Outcast Ambush", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Ranged gain [IGNORES COVER], [RAPID FIRE 1], +1 AP.", fx: [{ k: 'grant', ab: 'ignorescover', cond: 'rangedOnly' }, { k: 'plusApRanged', n: 1 }] },
          { name: "Into the Breach", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Make a D6+1\" move after a kill.", fx: [{ k: 'extraMove', dice: 'D6' }] },
          { name: "Cloak and Shadow", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Stealth; can only be shot from within 18\".", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12' }] },
          { name: "Vengeful Sorrow", cp: 1, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Make a Surge move after losing models.", fx: [{ k: 'extraMove', dice: 'D6' }] }
        ]
      }
    }
  },

  "Genestealer Cults": {
    // Army rule Cult Ambush is backed by the Resurgence subsystem (point pool by battle size; an
    // eligible destroyed unit is auto-recreated into Cult Ambush / reserves). Arrival bonuses key on
    // setUpThisTurn via the Deep Strike / reserves flow.
    armyRule: {
      name: "Cult Ambush",
      desc: "Start with Resurgence points by battle size (6/10/14). When an eligible GENESTEALER CULTS unit is destroyed, Resurgence is spent automatically to return an identical unit into Cult Ambush (Strategic Reserves), arriving in a later Movement phase. Tracked in the panel.",
      fx: []
    },
    restrictions: [
      "Genestealer Cults army. Cult Ambush resurrection is automatic on death while Resurgence remains.",
      "Brood Brother (Astra Militarum) and Final Day (Tyranids) allied units are an army-composition rule not modelled here; their detachment Stratagems still work."
    ],
    detachments: {
      "Host of Ascension": {
        rule: { name: "A Perfect Ambush", desc: "Each GENESTEALER CULTS unit set up as Reinforcements gains [SUSTAINED HITS 1] and [IGNORES COVER] until your next Fight phase.",
          fx: [{ k: 'grant', ab: 'sustained', val: 1, cond: 'setUpThisTurn', scope: 'army' },
               { k: 'grant', ab: 'ignorescover', cond: 'setUpThisTurn', scope: 'army' }] },
        enhancements: [
          { name: "Prowling Agitant", pts: 15, restrict: "GENESTEALER CULTS", desc: "Reactive D6\" move when enemies approach.", fx: [] },
          { name: "A Chink in Their Armour", pts: 20, restrict: "GENESTEALER CULTS", desc: "Bearer's unit ranged gain [LETHAL HITS] when arriving.", fx: [{ k: 'grant', ab: 'lethal', cond: 'setUpThisTurn+rangedOnly', selfOnly: true }] },
          { name: "Our Time Is Nigh", pts: 20, restrict: "GENESTEALER CULTS", desc: "Once: +2 to the bearer's unit's Charge roll.", fx: [{ k: 'rerollCharge', selfOnly: true }] },
          { name: "Assassination Edict", pts: 15, restrict: "GENESTEALER CULTS", desc: "+1 to Hit vs CHARACTER units.", fx: [{ k: 'addHit', n: 1, cond: 'targetCharacter', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Coordinated Trap", cp: 2, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Focus fire on one enemy: +1 to Wound.", fx: [{ k: 'addWound', n: 1 }] },
          { name: "Primed and Readied", cp: 2, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Critical Hits on unmodified 5+.", fx: [{ k: 'critOn', val: 5 }] },
          { name: "Tunnel Crawlers", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Deep Strike >6\" from enemies (no charge).", fx: [] },
          { name: "Lying in Wait", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Set up from a Cult Ambush marker wholly within 6\" of it.", fx: [] },
          { name: "Return to the Shadows", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull an Infantry unit into Reserves.", fx: [{ k: 'toReserves' }] },
          { name: "A Deadly Snare", cp: 1, type: "Strategic Ploy", when: 'oppCharge', targetSelf: true, desc: "Mortal wounds to a charging enemy.", fx: [] }
        ]
      },
      "Xenocreed Congregation": {
        rule: { name: "Unquestioning Fanaticism", desc: "Acolyte/Metamorph/Neophyte units led by a Character may re-roll Advance and Charge; a leading Magus/Primus/Acolyte Iconward gets Feel No Pain 3+.",
          fx: [{ k: 'rerollAdvance', cond: 'characterLeading', scope: 'army' }, { k: 'rerollCharge', cond: 'characterLeading', scope: 'army' }] },
        enhancements: [
          { name: "Gene-sire\u2019s Reliquant", pts: 5, restrict: "MAGUS/PRIMUS/ICONWARD", desc: "Re-roll the bearer's unit's Battle-shock tests.", fx: [] },
          { name: "Denunciator of Tyrants", pts: 25, restrict: "MAGUS/PRIMUS/ICONWARD", desc: "+1 Hit and +1 Wound vs CHARACTER units.", fx: [{ k: 'addHit', n: 1, cond: 'targetCharacter', selfOnly: true }, { k: 'addWound', n: 1, cond: 'targetCharacter', selfOnly: true }] },
          { name: "Deeds That Speak to the Masses", pts: 25, restrict: "MAGUS/PRIMUS/ICONWARD", desc: "+2 starting Resurgence points.", fx: [] },
          { name: "Incendiary Inspiration", pts: 15, restrict: "MAGUS/PRIMUS/ICONWARD", desc: "Bearer's unit may charge after Advancing.", fx: [{ k: 'eligChargeAfterAdvance' }] }
        ],
        stratagems: [
          { name: "Vengeance for the Martyr!", cp: 1, type: "Epic Deed", when: 'oppShootOrFight', targetSelf: true, desc: "Re-roll Hits vs the unit that killed your Character.", fx: [] },
          { name: "Frenzied Devotion", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "+1 Attacks and WS in melee (Hazardous).", fx: [{ k: 'plusAttacksMelee', n: 1 }] },
          { name: "Tireless Fervour", cp: 1, type: "Strategic Ploy", when: 'charge', targetSelf: true, desc: "Charge after Advancing/Falling Back; re-roll near a Character.", fx: [{ k: 'eligChargeAfterAdvance' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Transcendent Celerity", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Ranged gain [ASSAULT].", fx: [{ k: 'grant', ab: 'assault', cond: 'rangedOnly' }] },
          { name: "The Downtrodden Rise", cp: 2, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Set up a Cult Ambush unit without a marker, >6\" from enemies.", fx: [] },
          { name: "The Path of Anguish", cp: 1, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Make a D6\" move toward the enemy.", fx: [{ k: 'extraMove', dice: 'D6' }] }
        ]
      },
      "Biosanctic Broodsurge": {
        rule: { name: "Hypermorphic Fury", desc: "+1 Charge for Aberrants/Biophagus/Purestrain Genestealers; if such a unit charged this turn, +1 Attack in melee.",
          fx: [{ k: 'rerollCharge', scope: 'army' }, { k: 'plusAttacksMelee', n: 1, cond: 'chargedThisTurn', scope: 'army' }] },
        enhancements: [
          { name: "Predatory Instincts", pts: 20, restrict: "ABOMINANT/BIOPHAGUS/PATRIARCH", desc: "Unit gains Infiltrators; free Heroic Intervention.", fx: [] },
          { name: "Biomorph Adaptation", pts: 25, restrict: "ABOMINANT/PATRIARCH", desc: "+1 AP and +1 Damage to the bearer's melee.", fx: [{ k: 'plusApMelee', n: 1, selfOnly: true }] },
          { name: "Mutagenic Regeneration", pts: 10, restrict: "ABOMINANT/BIOPHAGUS/PATRIARCH", desc: "One model heals 1 wound each Command phase.", fx: [] },
          { name: "Alien Majesty", pts: 15, restrict: "ABOMINANT/BIOPHAGUS/PATRIARCH", desc: "Engaged enemies lose 1 Objective Control.", fx: [] }
        ],
        stratagems: [
          { name: "Evasive Vanguard", cp: 1, type: "Strategic Ploy", when: 'anyPhase', targetSelf: true, desc: "Relocate a Cult Ambush marker.", fx: [] },
          { name: "Saintly Paroxysm", cp: 1, type: "Epic Deed", when: 'fight', targetSelf: true, desc: "Mortal wounds when your Character is destroyed.", fx: [] },
          { name: "Gene-twisted Muscle", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "+1 to Wound vs MONSTER/VEHICLE.", fx: [{ k: 'addWound', n: 1, cond: 'targetMonsterVehicle' }] },
          { name: "Hyper-metabolic Vigour", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "6\" Pile-in/Consolidate.", fx: [] },
          { name: "Stimulated Bio-surge", cp: 1, type: "Battle Tactic", when: 'charge', targetSelf: true, desc: "+1 Charge per target, up to +3.", fx: [{ k: 'rerollCharge' }] },
          { name: "Bio-horror Revelation", cp: 1, type: "Strategic Ploy", when: 'oppShoot', targetSelf: true, desc: "Nearby enemies test Leadership; failure means -1 to Hit you.", fx: [] }
        ]
      },
      "Outlander Claw": {
        rule: { name: "Rapid Takeover", desc: "GENESTEALER CULTS Mounted/Vehicle (not Battle-shocked) get +1 OC; Atalan Jackals hold objectives stickily.",
          fx: [{ k: 'objControl', n: 1, cond: 'isMountedVehicle', scope: 'army' }] },
        enhancements: [
          { name: "Serpentine Tactics", pts: 10, restrict: "GENESTEALER CULTS MOUNTED", desc: "Bearer's unit may shoot after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }] },
          { name: "Cartographic Data-leech", pts: 10, restrict: "GENESTEALER CULTS", desc: "Improves the bearer's transport Firing Deck BS.", fx: [] },
          { name: "Starfall Shells", pts: 10, restrict: "GENESTEALER CULTS MOUNTED", desc: "Sniped enemy suffers -1 to Hit.", fx: [] },
          { name: "Assault Commando", pts: 15, restrict: "GENESTEALER CULTS", desc: "Re-roll ranged Hits after disembarking.", fx: [{ k: 'rerollHit', val: 'all', cond: 'disembarkedThisTurn+rangedOnly', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Along Shadowed Trails", cp: 1, type: "Strategic Ploy", when: 'anyPhase', targetSelf: true, desc: "Relocate a Cult Ambush marker.", fx: [] },
          { name: "Devoted Crew", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Goliath: incoming attacks -1 Damage.", fx: [{ k: 'reduceIncomingDmg', n: 1 }] },
          { name: "Close-range Shoot-out", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Ranged gain [LETHAL HITS] vs targets within 18\".", fx: [{ k: 'grant', ab: 'lethal', cond: 'rangedOnly+within18' }] },
          { name: "Rapid Feint", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Make a 6\" Normal move.", fx: [{ k: 'extraMove', dice: '6' }] },
          { name: "Deft Manoeuvring", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "4+ invulnerable save.", fx: [{ k: 'invuln', val: 4 }] },
          { name: "Encircling the Prey", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull a Mounted/Vehicle unit near a board edge into Reserves.", fx: [{ k: 'toReserves' }] }
        ]
      },
      "Brood Brother Auxilia": {
        rule: { name: "Integrated Tactics", desc: "Astra Militarum units can focus-fire one enemy, marking it for overlapping fire (GSC attacks vs it get +1 Hit). Allied-unit composition not modelled; the marking bonus is approximated as +1 Hit vs your Oath-style target if set.",
          fx: [{ k: 'addHit', n: 1, cond: 'targetIsOath', scope: 'army' }] },
        enhancements: [
          { name: "Martial Espionage", pts: 25, restrict: "GENESTEALER CULTS INFANTRY", desc: "Improve a nearby Guard unit's ranged AP.", fx: [] },
          { name: "Adaptive Reprisal", pts: 15, restrict: "GENESTEALER CULTS INFANTRY", desc: "Free Heroic Intervention on a nearby GSC unit.", fx: [] },
          { name: "The Hero Returned", pts: 20, restrict: "GENESTEALER CULTS INFANTRY", desc: "+1 Leadership and +1 OC to the bearer's unit.", fx: [{ k: 'objControl', n: 1, selfOnly: true }] },
          { name: "Firepoint Commander", pts: 10, restrict: "GENESTEALER CULTS INFANTRY", desc: "Improved Fire Overwatch.", fx: [] }
        ],
        stratagems: [
          { name: "In the Shadow of Iron", cp: 1, type: "Strategic Ploy", when: 'anyPhase', targetSelf: true, desc: "Relocate a Cult Ambush marker near a Vehicle.", fx: [] },
          { name: "Regimental Reinforcements", cp: 1, type: "Strategic Ploy", when: 'oppShootOrFight', targetSelf: true, desc: "Return a destroyed Guard unit into Cult Ambush (3+).", fx: [] },
          { name: "Suppress and Overwhelm", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Deny Overwatch and grant charge re-rolls vs a hit enemy.", fx: [] },
          { name: "Acceptable Losses", cp: 2, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Fire into combat (risking your own units).", fx: [] },
          { name: "Symbiotic Destruction", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Combined fire: re-roll Wounds of 1.", fx: [{ k: 'rerollWound', val: 1 }] },
          { name: "A Dark Network", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Make a 6\" Normal move when enemy reserves arrive.", fx: [{ k: 'extraMove', dice: '6' }] }
        ]
      },
      "Final Day": {
        rule: { name: "Psionic Parasitism", desc: "Tyranid Synapse units drain a nearby GSC unit (D3+1 mortal wounds) to heal a Tyranids unit and grant it +1 Hit; Tyranids project a Catalyst aura (+1 Hit for GSC attacks vs nearby enemies). Allied composition not modelled; Catalyst approximated as +1 Hit army-wide.",
          fx: [{ k: 'addHit', n: 1, cond: 'within6OfAlly', scope: 'army' }] },
        enhancements: [
          { name: "Synaptic Auger", pts: 15, restrict: "TYRANIDS", desc: "Double the wounds healed by Psionic Parasitism.", fx: [] },
          { name: "Enraptured Damnation", pts: 10, restrict: "GENESTEALER CULTS", desc: "No Overwatch against the bearer's unit.", fx: [] },
          { name: "Vanguard Tyrant", pts: 25, restrict: "WINGED HIVE TYRANT", desc: "+1 Strength and +1 AP to the bearer's melee.", fx: [{ k: 'plusStrMelee', n: 1, selfOnly: true }, { k: 'plusApMelee', n: 1, selfOnly: true }] },
          { name: "Inhuman Integration", pts: 20, restrict: "GENESTEALER CULTS", desc: "Unit weapons gain [SUSTAINED HITS 1] near Tyranids.", fx: [{ k: 'grant', ab: 'sustained', val: 1, cond: 'within6OfAlly', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Hyperferocity", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Re-roll Wounds of 1 (full near Tyranids).", fx: [{ k: 'rerollWound', val: 1 }] },
          { name: "Psi Surge", cp: 1, type: "Strategic Ploy", when: 'anyPhase', targetSelf: true, desc: "Extend a Tyranid's Catalyst range by 3\".", fx: [] },
          { name: "Avenge the Star Children", cp: 1, type: "Battle Tactic", when: 'oppShootOrFight', targetSelf: true, desc: "+1 Hit and +1 Wound vs the unit that killed your Tyranid Character.", fx: [] },
          { name: "Divine Imperative", cp: 1, type: "Battle Tactic", when: 'charge', targetSelf: true, desc: "+1 Charge and re-roll vs an enemy engaged with Tyranids.", fx: [{ k: 'rerollCharge' }] },
          { name: "Darting Attacks", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Tyranids shoot and charge after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Resistance Tunnels", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull a GSC or Tyranids unit into Reserves.", fx: [{ k: 'toReserves' }] }
        ]
      }
    }
  },

  "World Eaters": {
    // Army rule Blessings of Khorne is backed by the dice-pool subsystem: roll 8D6 each round, activate up
    // to two Blessings via the panel. The six Blessings apply army-wide; the melee grants (Martial/Warp/Decap)
    // are injected by the combat-mod builder, the rest gate via khBlood/khRage/khCarnage conditions.
    armyRule: {
      name: "Blessings of Khorne",
      desc: "At the start of each battle round, roll 8D6 and spend doubles/triples to activate up to two Blessings for the round (panel): Unbridled Bloodlust (re-roll Charge), Rage-fuelled Invigoration (6\" Pile-in/Consolidate), Total Carnage (fight-on-death 4+), Martial Excellence (melee Sustained Hits 1), Warp Blades (melee Lethal Hits), Decapitating Strikes (melee Devastating vs INFANTRY).",
      fx: []
    },
    restrictions: [
      "World Eaters army. Roll and activate Blessings of Khorne each round in the panel.",
      "Blood Legions allied units (Khorne Daemonkin) are an army-composition rule not modelled here; that detachment's Stratagems still work."
    ],
    detachments: {
      "Berzerker Warband": {
        rule: { name: "Relentless Rage", desc: "Each WORLD EATERS unit that made a Charge move this turn gets +1 Attack and +2 Strength on its melee weapons until end of turn.",
          fx: [{ k: 'plusAttacksMelee', n: 1, cond: 'chargedThisTurn', scope: 'army' }, { k: 'plusStrMelee', n: 2, cond: 'chargedThisTurn', scope: 'army' }] },
        enhancements: [
          { name: "Berzerker Glaive", pts: 35, restrict: "WORLD EATERS", desc: "+1 Attacks and +1 Damage to the bearer's melee.", fx: [{ k: 'plusAttacksMelee', n: 1, selfOnly: true }] },
          { name: "Helm of Brazen Ire", pts: 30, restrict: "WORLD EATERS", desc: "Attacks allocated to the bearer get -1 Damage.", fx: [{ k: 'reduceIncomingDmg', n: 1, selfOnly: true }] },
          { name: "Favoured of Khorne", pts: 15, restrict: "WORLD EATERS", desc: "Re-roll up to two Blessings dice.", fx: [] },
          { name: "Battle-lust", pts: 10, restrict: "WORLD EATERS", desc: "Re-roll the bearer's unit's Charge rolls.", fx: [{ k: 'rerollCharge', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Blood Offering", cp: 1, type: "Epic Deed", when: 'anyPhase', targetSelf: true, desc: "Hold an objective stickily after a unit dies on it.", fx: [{ k: 'stickyObjective', cond: 'selfOnHeldObjective' }] },
          { name: "Hack and Slash", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "+1 AP to melee for a unit that charged.", fx: [{ k: 'plusApMelee', n: 1, cond: 'chargedThisTurn' }] },
          { name: "Frenzied Resilience", cp: 2, type: "Battle Tactic", when: 'fightTargeted', targetSelf: true, desc: "Incoming attacks -1 Damage.", fx: [{ k: 'reduceIncomingDmg', n: 1 }] },
          { name: "Skulls for the Skull Throne!", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Activate an extra Blessing after killing a Character/Monster.", fx: [] },
          { name: "Apoplectic Frenzy", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Berzerkers may charge after Advancing.", fx: [{ k: 'eligChargeAfterAdvance' }] },
          { name: "Berzerker\u2019s Wrath", cp: 1, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "8\" Blood Surge move.", fx: [{ k: 'extraMove', dice: '6' }] }
        ]
      },
      "Cult of Blood": {
        // Idols of Khorne is a per-round Command-phase aura choice; modelled as a doctrine triple
        // (the auras affect nearby Jakhals/Goremongers — approximated army-wide while chosen).
        rule: { name: "Idols of Khorne", desc: "Each Command phase pick one Idol aura (once each per battle): Infinite Rage (+1 Hit/+1 Wound near a Titanic/Monster), Burning Wrath (+1\" Move, +1 Advance/Charge), Blessed Blood (4+ invuln). Auras approximated army-wide while chosen.", fx: [] },
        doctrineLabel: "Idol of Khorne",
        doctrines: [
          { id: 'idolrage', name: "Idol of Infinite Rage", desc: "+1 Hit and +1 Wound (near a Khornate engine).", fx: [{ k: 'addHit', n: 1, cond: 'within6OfAlly' }, { k: 'addWound', n: 1, cond: 'within6OfAlly' }] },
          { id: 'idolwrath', name: "Idol of Burning Wrath", desc: "Re-roll Charge (near a Khornate engine).", fx: [{ k: 'rerollCharge', cond: 'within6OfAlly' }] },
          { id: 'idolblood', name: "Idol of Blessed Blood", desc: "4+ invulnerable save (near a Khornate engine).", fx: [{ k: 'invuln', val: 4, cond: 'within6OfAlly' }] }
        ],
        enhancements: [
          { name: "Chosen of the Blood God", pts: 15, restrict: "WORLD EATERS MONSTER", desc: "+3\" to the bearer's Aura range.", fx: [] },
          { name: "Butcher Lord", pts: 10, restrict: "WORLD EATERS INFANTRY", desc: "Attach to a Jakhals/Goremongers unit (Infiltrators if Goremongers).", fx: [] },
          { name: "Brazen Form", pts: 25, restrict: "WORLD EATERS MONSTER", desc: "+1 Toughness and Feel No Pain 5+.", fx: [{ k: 'fnp', val: 5, selfOnly: true }] },
          { name: "Strategic Slaughter", pts: 20, restrict: "WORLD EATERS", desc: "Redeploy up to three cultist units (may go to Reserves).", fx: [] }
        ],
        stratagems: [
          { name: "Bloody Vengeance", cp: 1, type: "Epic Deed", when: 'anyPhase', targetSelf: true, desc: "Re-roll Hits vs the unit that killed your engine.", fx: [] },
          { name: "Drawn to the Slaughter", cp: 2, type: "Strategic Ploy", when: 'anyPhase', targetSelf: true, desc: "Return a destroyed Jakhals unit into Reserves.", fx: [{ k: 'toReserves' }] },
          { name: "In the Shadow of Brass Idols", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Cultists gain Feel No Pain 6+ (5+ near an engine).", fx: [{ k: 'fnp', val: 6 }] },
          { name: "Bloodthirsty Horde", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Models within 3\" become eligible to fight.", fx: [] },
          { name: "Fail Not the Blood God", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Re-roll Hits of 1 (full near an engine).", fx: [{ k: 'rerollHit', val: 1 }] },
          { name: "Brazen Idol", cp: 2, type: "Epic Deed", when: 'command', targetSelf: true, desc: "Grant a single unit a chosen Idol aura.", fx: [] }
        ]
      },
      "Khorne Daemonkin": {
        rule: { name: "Blood Tithe", desc: "Gain Blood Tithe points on kills (3+) and spend them in Command for army-wide buffs (FNP vs psychic/mortal, Lance, 4+ invuln, or Blessings of Khorne for Blood Legions). Blood Tithe economy and Blood Legions allies not modelled; the Stratagems work.", fx: [] },
        enhancements: [
          { name: "Icon of War", pts: 25, restrict: "WORLD EATERS", desc: "Grant nearby Blood Legions the Blessings of Khorne ability.", fx: [] },
          { name: "Blood-forged Armour", pts: 20, restrict: "WORLD EATERS", desc: "Bearer has a 2+ Save; gain a Blood Tithe point if destroyed.", fx: [{ k: 'saveTo', val: 2, selfOnly: true }] },
          { name: "Disciple of Khorne", pts: 15, restrict: "LORD ON JUGGERNAUT", desc: "Bearer's mount unit gains Deep Strike and Blood Legions.", fx: [{ k: 'grantDeepStrike', selfOnly: true }] },
          { name: "Blade of Endless Bloodshed", pts: 30, restrict: "WORLD EATERS", desc: "+1 Attacks, +1 Strength, +1 Damage to the bearer's melee.", fx: [{ k: 'plusAttacksMelee', n: 1, selfOnly: true }, { k: 'plusStrMelee', n: 1, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Summoned by Slaughter", cp: 1, type: "Strategic Ploy", when: 'anyPhase', targetSelf: true, desc: "Set up a Bloodletters unit near a destroyed model.", fx: [] },
          { name: "Daemonic Fury", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "A nearby World Eaters unit's melee gain [LANCE].", fx: [{ k: 'grant', ab: 'lance', cond: 'meleeOnly' }] },
          { name: "A Worthy Skull", cp: 1, type: "Epic Deed", when: 'fight', targetSelf: true, desc: "Gain D3 Blood Tithe and spend it.", fx: [] },
          { name: "Blessing of Burning Blood", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "5+ invuln (4+ if Boon of Blood active).", fx: [{ k: 'invuln', val: 5 }] },
          { name: "Daemontide", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Return destroyed models to a Blood Legions unit.", fx: [] },
          { name: "Murder-call", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull a Blood Legions unit into Reserves.", fx: [{ k: 'toReserves' }] }
        ]
      },
      "Possessed Slaughterband": {
        rule: { name: "Brazen Fury", desc: "World Eaters Possessed units that lose models to enemy shooting can make a reactive D6\" Brazen Fury move toward the enemy (reactive move logged as intent).", fx: [] },
        enhancements: [
          { name: "Malicious Vigour", pts: 30, restrict: "SLAUGHTERBOUND", desc: "Brazen Fury move always counts as a 6.", fx: [] },
          { name: "Killing Clarity", pts: 15, restrict: "WORLD EATERS DAEMON", desc: "Chance to gain CP on a kill.", fx: [] },
          { name: "Frenzied Focus", pts: 20, restrict: "WORLD EATERS DAEMON", desc: "Critical Hits on unmodified 5+.", fx: [{ k: 'critOn', val: 5, selfOnly: true }] },
          { name: "Violent Demise", pts: 10, restrict: "WORLD EATERS DAEMON", desc: "Improved Deadly Demise.", fx: [] }
        ],
        stratagems: [
          { name: "Daemonic Resistance", cp: 2, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Attackers -1 to Wound.", fx: [{ k: 'subIncomingWound', n: 1 }] },
          { name: "Daemonic Strength", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "+1 Damage vs appropriate targets (Eightbound).", fx: [] },
          { name: "Immortal Fury", cp: 2, type: "Battle Tactic", when: 'fightTargeted', targetSelf: true, desc: "Destroyed models fight on before removal.", fx: [{ k: 'fightOnDeath' }] },
          { name: "Rapid Manifestation", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Deep Strike >6\" from enemies (no charge).", fx: [] },
          { name: "Warp Stalkers", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Move through enemy models.", fx: [] },
          { name: "Horrifying Violence", cp: 1, type: "Strategic Ploy", when: 'oppCommand', targetSelf: true, desc: "Battle-shock engaged enemies.", fx: [] }
        ]
      },
      "Goretrack Onslaught": {
        rule: { name: "Rush to the Fray", desc: "Each WORLD EATERS unit that disembarks from a transport gets +1 Charge and its melee weapons gain [LANCE] until end of turn.",
          fx: [{ k: 'grant', ab: 'lance', cond: 'disembarkedThisTurn+meleeOnly', scope: 'army' }] },
        enhancements: [
          { name: "Murderous Onslaught", pts: 5, restrict: "WORLD EATERS", desc: "No Overwatch vs the bearer's unit after disembarking.", fx: [] },
          { name: "Aggressive Deployment", pts: 20, restrict: "WORLD EATERS", desc: "Bearer's dedicated transport gains Scouts 9\".", fx: [] },
          { name: "Unleash Hell", pts: 10, restrict: "WORLD EATERS", desc: "Suppress an enemy a nearby Vehicle hits (-1 to Hit).", fx: [] },
          { name: "Infernal Infusion", pts: 25, restrict: "WORLD EATERS", desc: "Once: bearer's unit has Fights First.", fx: [{ k: 'fightsFirst', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Endless Pursuit of Violence", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Embark into a nearby transport.", fx: [] },
          { name: "Smash Through", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Vehicle moves through terrain.", fx: [] },
          { name: "Aggressive Disembarkation", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Disembark within 6\" of the Rhino, near enemies.", fx: [] },
          { name: "Full-throttle Assault", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Disembark and still charge after a Normal move.", fx: [{ k: 'eligChargeAfterAdvance' }] },
          { name: "Unrelenting Advance", cp: 1, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Vehicle makes a 6\" move.", fx: [{ k: 'extraMove', dice: '6' }] },
          { name: "Fury Unleashed", cp: 1, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Berzerkers disembark and Blood Surge.", fx: [] }
        ]
      },
      "Vessels of Wrath": {
        rule: { name: "Wrath of Khorne", desc: "After Blessings of Khorne, mark up to N models (2/3/4 by size) as VESSEL OF WRATH and activate one extra Blessing for them. (Vessel marking not separately tracked; the Stratagems work and their Vessel bonuses are treated as applying.)", fx: [] },
        enhancements: [
          { name: "Archslaughterer", pts: 25, restrict: "WORLD EATERS", desc: "+1 AP to the bearer's melee (+1 Damage while a Vessel).", fx: [{ k: 'plusApMelee', n: 1, selfOnly: true }] },
          { name: "Vox-diabolus", pts: 20, restrict: "WORLD EATERS", desc: "Chance to gain CP on a melee kill.", fx: [] },
          { name: "Avenger\u2019s Crown", pts: 15, restrict: "WORLD EATERS", desc: "Bearer fights on (2+) if destroyed in melee.", fx: [] },
          { name: "Gateways to Glory", pts: 10, restrict: "WORLD EATERS DAEMON PRINCE/MOUNTED", desc: "Bearer moves through models and terrain.", fx: [] }
        ],
        stratagems: [
          { name: "Aspire to Infamy", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "+1 Strength and +1 AP to non-Character melee.", fx: [{ k: 'plusStrMelee', n: 1 }, { k: 'plusApMelee', n: 1 }] },
          { name: "Overshadowed by None", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Re-roll Wounds vs MONSTER/VEHICLE.", fx: [{ k: 'rerollWound', val: 'all', cond: 'targetMonsterVehicle' }] },
          { name: "Gory Dedication", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Hold an objective stickily after a melee kill.", fx: [{ k: 'stickyObjective', cond: 'selfOnHeldObjective' }] },
          { name: "Punish the Craven", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Desperate Escape tests on a falling-back enemy.", fx: [] },
          { name: "Meet Force with Force", cp: 1, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Blood Surge move (re-roll for Berzerkers/Vessels).", fx: [{ k: 'extraMove', dice: 'D6' }] },
          { name: "Brazen Contempt", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Attackers -1 to Wound when out-toughening you.", fx: [{ k: 'subIncomingWound', n: 1, cond: 'strHigherThanT' }] }
        ]
      }
    }
  },

  "Death Guard": {
    // Army rule Nurgle's Gift is backed by the Contagion subsystem: enemies within Contagion Range
    // (3/6/9 by round) are Afflicted (-1 Toughness vs DG attacks + the army's chosen Plague). The Plague
    // is chosen in the panel; -1 T folds into wound math, Skullsquirm/Rattlejoint into hit/save.
    armyRule: {
      name: "Nurgle\u2019s Gift",
      desc: "Enemy units within Contagion Range (3\" round 1, 6\" round 2, 9\" round 3+) of your models are Afflicted: -1 Toughness vs Death Guard attacks, plus your chosen Plague (panel) — Skullsquirm Blight (-1 to their Hit rolls), Rattlejoint Ague (worse Save), or Scabrous Soulrot (worse Move/Ld/OC).",
      fx: []
    },
    restrictions: [
      "Death Guard army. Choose a Plague in the panel; Affliction is positional (Contagion Range grows by round).",
      "Plague Legions allied units (Tallyband Summoners) are an army-composition rule not modelled here; that detachment's Stratagems still work."
    ],
    detachments: {
      "Virulent Vectorium": {
        rule: { name: "Worldblight", desc: "Hold objectives stickily with a non-Battle-shocked Death Guard unit in range; held objectives also project Nurgle's Gift.",
          fx: [{ k: 'stickyObjective', cond: 'selfOnHeldObjective', scope: 'army' }] },
        enhancements: [
          { name: "Daemon Weapon of Nurgle", pts: 10, restrict: "DEATH GUARD", desc: "Critical Hits on unmodified 5+ in melee.", fx: [{ k: 'critOn', val: 5, cond: 'meleeOnly', selfOnly: true }] },
          { name: "Furnace of Plagues", pts: 25, restrict: "DEATH GUARD", desc: "+1 Strength, +1 Attacks and [DEVASTATING WOUNDS] to the bearer's melee.", fx: [{ k: 'plusStrMelee', n: 1, selfOnly: true }, { k: 'plusAttacksMelee', n: 1, selfOnly: true }, { k: 'grant', ab: 'devastating', cond: 'meleeOnly', selfOnly: true }] },
          { name: "Arch Contaminator", pts: 25, restrict: "DEATH GUARD", desc: "Re-roll Wounds while the bearer's unit is on an objective.", fx: [{ k: 'rerollWound', val: 'all', cond: 'selfOnHeldObjective', selfOnly: true }] },
          { name: "Revolting Regeneration", pts: 20, restrict: "DEATH GUARD", desc: "Bearer has Feel No Pain 5+.", fx: [{ k: 'fnp', val: 5, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Putrid Detonation", cp: 1, type: "Strategic Ploy", when: 'anyPhase', targetSelf: true, desc: "Auto Deadly Demise; victims become Afflicted.", fx: [] },
          { name: "Disgustingly Resilient", cp: 2, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Incoming attacks -1 Damage.", fx: [{ k: 'reduceIncomingDmg', n: 1 }] },
          { name: "Plaguesurge", cp: 2, type: "Epic Deed", when: 'command', targetSelf: true, desc: "+3\" Contagion Range this round.", fx: [] },
          { name: "Leechspore Eruption", cp: 1, type: "Epic Deed", when: 'command', targetSelf: true, desc: "Mortal wounds and self-heal from a wounded model.", fx: [] },
          { name: "Overwhelming Generosity", cp: 1, type: "Wargear", when: 'shooting', targetSelf: true, desc: "Re-roll attack-count dice vs a chosen enemy.", fx: [] },
          { name: "Creeping Blight", cp: 1, type: "Wargear", when: 'shooting', targetSelf: true, desc: "Re-roll Hits and Wounds vs Afflicted enemies.", fx: [{ k: 'rerollHit', val: 'all', cond: 'targetAfflicted' }, { k: 'rerollWound', val: 'all', cond: 'targetAfflicted' }] }
        ]
      },
      "Mortarion\u2019s Hammer": {
        rule: { name: "Miasmic Bombardment", desc: "At the start of each battle round, force-Afflict 1/2/3 enemy units that are more than 12\" from all your models (use a stratagem-style effect; here applied via the panel/auto).", fx: [] },
        enhancements: [
          { name: "Eye of Affliction", pts: 20, restrict: "DEATH GUARD", desc: "Ranged gain [IGNORES COVER] vs Afflicted enemies.", fx: [{ k: 'grant', ab: 'ignorescover', cond: 'targetAfflicted+rangedOnly', selfOnly: true }] },
          { name: "Bilemaw Blight", pts: 10, restrict: "MALIGNANT PLAGUECASTER", desc: "+12\" range to the bearer's Plague Wind.", fx: [] },
          { name: "Shriekworm Familiar", pts: 15, restrict: "DEATH GUARD", desc: "Free Fire Overwatch once per round.", fx: [] },
          { name: "Tendrilous Emissions", pts: 30, restrict: "LORD OF VIRULENCE", desc: "Lone Operative near vehicles; re-roll their Wounds of 1.", fx: [] }
        ],
        stratagems: [
          { name: "Blighted Land", cp: 2, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Afflict enemies near a terrain feature.", fx: [] },
          { name: "Relentless Grind", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Vehicle moves through terrain.", fx: [] },
          { name: "Drawn to Despair", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Re-roll Hits vs enemies in their deployment zone.", fx: [{ k: 'rerollHit', val: 'all', cond: 'targetBeyond12' }] },
          { name: "Font of Filth", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Vehicle ranged gain [ASSAULT].", fx: [{ k: 'grant', ab: 'assault', cond: 'rangedOnly' }] },
          { name: "Eyestinger Storm", cp: 1, type: "Strategic Ploy", when: 'oppCommand', targetSelf: true, desc: "Battle-shock Afflicted enemies near an objective.", fx: [] },
          { name: "Stinking Mire", cp: 1, type: "Strategic Ploy", when: 'oppCharge', targetSelf: true, desc: "-2 to enemy Charge rolls vs the vehicle.", fx: [] }
        ]
      },
      "Champions of Contagion": {
        rule: { name: "Manifold Maladies", desc: "At the start of each battle round you may change your chosen Plague (do so in the panel).", fx: [] },
        enhancements: [
          { name: "Final Ingredient", pts: 20, restrict: "BIOLOGUS PUTRIFIER", desc: "Once: add a second Plague effect after killing a Character.", fx: [] },
          { name: "Visions of Virulence", pts: 15, restrict: "MALIGNANT PLAGUECASTER", desc: "Enfeebled enemies also become Afflicted.", fx: [] },
          { name: "Needle of Nurgle", pts: 25, restrict: "PLAGUE SURGEON", desc: "Return up to D3 destroyed models with Tainted Narthecium.", fx: [] },
          { name: "Cornucophagus", pts: 35, restrict: "LORD OF POXES", desc: "Add a second Plague effect within the bearer's Contagion Range.", fx: [] }
        ],
        stratagems: [
          { name: "Blessings of Filth", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Critical Hits on unmodified 5+.", fx: [{ k: 'critOn', val: 5 }] },
          { name: "Malignance Magnified", cp: 2, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Re-roll Hits and Wounds vs below-strength enemies.", fx: [{ k: 'rerollHit', val: 'all', cond: 'targetBelowStrength' }, { k: 'rerollWound', val: 'all', cond: 'targetBelowStrength' }] },
          { name: "Grotesque Fortitude", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "+2 Toughness this phase.", fx: [{ k: 'subIncomingWound', n: 1 }] },
          { name: "Rabid Infusion", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Fights First for a twin-Character unit.", fx: [{ k: 'fightsFirst' }] },
          { name: "Mobile Vector", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Attach a loose Character to a unit.", fx: [] },
          { name: "Death\u2019s Heads", cp: 1, type: "Wargear", when: 'shooting', targetSelf: true, desc: "Afflict an enemy with all Plagues.", fx: [] }
        ]
      },
      "Tallyband Summoners": {
        rule: { name: "Reverberant Rancidity", desc: "Plague Legions near Death Guard gain Nurgle's Gift; Death Guard near Plague Legions get +3\" Contagion. Allied composition not modelled; the Stratagems work.", fx: [] },
        enhancements: [
          { name: "Beckoning Blight", pts: 20, restrict: "DEATH GUARD", desc: "Plague Legions Deep Strike closer near the bearer.", fx: [] },
          { name: "Fell Harvester", pts: 10, restrict: "DEATH GUARD", desc: "+2 Attacks to the bearer's melee.", fx: [{ k: 'plusAttacksMelee', n: 2, selfOnly: true }] },
          { name: "Entropic Knell", pts: 15, restrict: "GREAT UNCLEAN ONE", desc: "Battle-shock below-strength enemies nearby.", fx: [] },
          { name: "Tome of Bounteous Blessings", pts: 20, restrict: "MALIGNANT PLAGUECASTER", desc: "Buff nearby Plague Legions' Battle-shock and healing.", fx: [] }
        ],
        stratagems: [
          { name: "Persistent Pests", cp: 1, type: "Strategic Ploy", when: 'anyPhase', targetSelf: true, desc: "Return a destroyed Nurglings unit into Reserves.", fx: [{ k: 'toReserves' }] },
          { name: "Clutching Corruption", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Re-roll Hits vs enemies engaged with Plague Legions.", fx: [{ k: 'rerollHit', val: 'all', cond: 'within6OfAlly' }] },
          { name: "All Is Rot", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Shoot out of combat; reflect mortal wounds.", fx: [] },
          { name: "Fleshy Avalanche", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Monster moves through terrain.", fx: [] },
          { name: "Avatars of Decay", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Afflict enemies within 6\" of your unit.", fx: [] },
          { name: "Mireslick", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Falling-back enemies test Ld or Remain Stationary.", fx: [] }
        ]
      },
      "Shamblerot Vectorium": {
        rule: { name: "Numberless Horde", desc: "Add a fresh 10-model Poxwalkers unit to Reserves in your Command phase on rounds 2-5 (by size). Reinforcement not auto-spawned; Poxwalkers gain Battleline.", fx: [] },
        enhancements: [
          { name: "Witherbone Pipes", pts: 25, restrict: "NOXIOUS BLIGHTBRINGER", desc: "+1 OC and better Battle-shock for a led Poxwalkers unit.", fx: [{ k: 'objControl', n: 1, selfOnly: true }] },
          { name: "Lord of the Walking Pox", pts: 15, restrict: "DEATH GUARD", desc: "Poxwalkers arrive as if round 3.", fx: [] },
          { name: "Sorrowsyphon", pts: 10, restrict: "MALIGNANT PLAGUECASTER", desc: "+1 Damage Plague Wind (at the cost of Bodyguard models).", fx: [] },
          { name: "Talisman of Burgeoning", pts: 25, restrict: "DEATH GUARD", desc: "+1 Toughness to a led Poxwalkers unit.", fx: [] }
        ],
        stratagems: [
          { name: "Grip of the Walking Pox", cp: 1, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "Destroyed Poxwalkers reflect mortal wounds.", fx: [] },
          { name: "Smeared with Filth", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Afflict an enemy that attacked your Poxwalkers.", fx: [] },
          { name: "Gnawing Hunger", cp: 1, type: "Battle Tactic", when: 'command', targetSelf: true, desc: "+1 Move, +1 Attacks, +1 Strength to a Poxwalkers unit.", fx: [{ k: 'plusAttacksMelee', n: 1 }, { k: 'plusStrMelee', n: 1 }] },
          { name: "Hidden Amongst the Dead", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Poxwalkers in Reserves gain Deep Strike.", fx: [{ k: 'grantDeepStrike' }] },
          { name: "Shock and Horror", cp: 1, type: "Strategic Ploy", when: 'charge', targetSelf: true, desc: "Battle-shock engaged enemies after a charge.", fx: [] },
          { name: "Shambling Wall", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Poxwalkers soak hits for a Death Guard unit.", fx: [] }
        ]
      },
      "Death Lord\u2019s Chosen": {
        rule: { name: "Deadly Vectors", desc: "In your opponent's Command phase, roll 2D6 per Afflicted enemy unit (-1 if below half); 6 or less inflicts D3 mortal wounds. (Mortal-wound output not auto-resolved.)", fx: [] },
        enhancements: [
          { name: "Face of Death", pts: 10, restrict: "TERMINATOR", desc: "Battle-shock engaged enemies at the start of Fight.", fx: [] },
          { name: "Vile Vigour", pts: 15, restrict: "TERMINATOR", desc: "+1 Move and re-roll Advance for the bearer's unit.", fx: [{ k: 'rerollAdvance', selfOnly: true }] },
          { name: "Warprot Talisman", pts: 30, restrict: "TERMINATOR", desc: "Once: pull the bearer's unit into Reserves.", fx: [] },
          { name: "Helm of the Fly King", pts: 20, restrict: "TERMINATOR", desc: "Bearer's unit can only be shot from within 18\".", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Blooming Pestilence", cp: 1, type: "Epic Deed", when: 'anyPhase', targetSelf: true, desc: "+3\" Contagion Range this phase.", fx: [] },
          { name: "Grim Reapers", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Re-roll Hits vs non-Monster/Vehicle enemies.", fx: [{ k: 'rerollHit', val: 'all' }] },
          { name: "Undying Spite", cp: 1, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "Destroyed models fight on (4+).", fx: [{ k: 'fightOnDeath' }] },
          { name: "Signal Pox", cp: 1, type: "Epic Deed", when: 'command', targetSelf: true, desc: "Afflict enemies near a chosen objective.", fx: [] },
          { name: "Mortarion\u2019s Teachings", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Terminator ranged gain [ASSAULT] and [HEAVY].", fx: [{ k: 'grant', ab: 'assault', cond: 'rangedOnly' }, { k: 'grant', ab: 'heavy', cond: 'rangedOnly' }] },
          { name: "Sickening Impact", cp: 1, type: "Strategic Ploy", when: 'charge', targetSelf: true, desc: "Mortal wounds to an engaged enemy after a charge.", fx: [] }
        ]
      },
      "Flyblown Host": {
        rule: { name: "Verminous Haze", desc: "Death Guard Infantry (excluding Poxwalkers) not embarked gain Scouts 5\" and Stealth (Stealth approximated as attackers -1 to Hit at range).",
          fx: [{ k: 'subIncomingHit', n: 1, cond: 'rangedOnly', scope: 'army' }] },
        enhancements: [
          { name: "Droning Chorus", pts: 15, restrict: "DEATH GUARD INFANTRY", desc: "Bearer's unit ranged gain [ASSAULT].", fx: [{ k: 'grant', ab: 'assault', cond: 'rangedOnly', selfOnly: true }] },
          { name: "Insectile Murmuration", pts: 20, restrict: "DEATH GUARD INFANTRY", desc: "Re-roll Wounds of 1 vs enemies in Contagion Range.", fx: [{ k: 'rerollWound', val: 1, cond: 'targetAfflicted', selfOnly: true }] },
          { name: "Rejuvenating Swarm", pts: 10, restrict: "DEATH GUARD INFANTRY", desc: "Bearer regains all lost wounds each phase.", fx: [] },
          { name: "Plagueveil", pts: 25, restrict: "DEATH GUARD INFANTRY", desc: "On an objective: only shot from within 18\".", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12+selfOnHeldObjective', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Nauseating Paroxysms", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Battle-shock an engaged enemy.", fx: [] },
          { name: "Vermin Cloud", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "6\" Pile-in/Consolidate.", fx: [] },
          { name: "Eye of the Swarm", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Ranged (non-Blast) gain [PISTOL].", fx: [] },
          { name: "Droning Horror", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Re-roll Hits of 1 (full at half range).", fx: [{ k: 'rerollHit', val: 1 }] },
          { name: "Enervating Onslaught", cp: 1, type: "Strategic Ploy", when: 'charge', targetSelf: true, desc: "Mortal wounds to an engaged enemy after a charge.", fx: [] },
          { name: "Myphitic Invigoration", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Attackers -1 to Wound when out-toughening you.", fx: [{ k: 'subIncomingWound', n: 1, cond: 'strHigherThanT' }] }
        ]
      }
    }
  },

  "Chaos Daemons": {
    // Army rule Shadow of Chaos is backed by the zone subsystem: own deployment zone (always) + No Man's
    // Land / enemy zone when you hold half their objectives + Corrupted-objective bubbles. Daemonic
    // Manifestation (heal on passed Battle-shock in Shadow) and Daemonic Terror (-1 + mortal wounds to
    // enemies in Shadow / near Greater Daemons) are wired into the Command-phase Battle-shock step.
    armyRule: {
      name: "Shadow of Chaos",
      desc: "Your deployment zone is always within your Shadow of Chaos; No Man's Land or the enemy zone joins it while you hold half its objectives. Your daemons in the Shadow heal on a passed Battle-shock test (Daemonic Manifestation); enemies in the Shadow or within 6\" of a Greater Daemon take -1 to Battle-shock and D3 mortal wounds on a failure (Daemonic Terror).",
      fx: []
    },
    restrictions: [
      "Legiones Daemonica army. The Shadow of Chaos is positional and shifts with objective control.",
      "Mono-god detachments (Blood/Excess/Plague/Scintillating Legion) restrict you to that god's units."
    ],
    detachments: {
      "Daemonic Incursion": {
        rule: { name: "Warp Rifts", desc: "Daemons Deep Striking wholly within your Shadow of Chaos (or near a matching Greater Daemon) arrive >6\" from enemies instead of >9\".", fx: [] },
        enhancements: [
          { name: "A\u2019rgath, the King of Blades", pts: 20, restrict: "KHORNE", desc: "+1 Attacks/Strength melee (+2 within your Shadow).", fx: [{ k: 'plusAttacksMelee', n: 1, selfOnly: true }, { k: 'plusStrMelee', n: 1, selfOnly: true }, { k: 'plusStrMelee', n: 1, cond: 'selfInShadow', selfOnly: true }] },
          { name: "Soulstealer", pts: 15, restrict: "SLAANESH", desc: "Heal on a melee kill (better within your Shadow).", fx: [] },
          { name: "The Endless Gift", pts: 30, restrict: "NURGLE", desc: "Bearer has Feel No Pain 5+.", fx: [{ k: 'fnp', val: 5, selfOnly: true }] },
          { name: "The Everstave", pts: 25, restrict: "TZEENTCH", desc: "+1 Strength/+3\" range ranged (+2/+6\" within your Shadow).", fx: [{ k: 'plusStrRanged', n: 1, selfOnly: true }, { k: 'plusStrRanged', n: 1, cond: 'selfInShadow', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Corrupt Realspace", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Corrupt an objective: hold it stickily and project Shadow around it.", fx: [{ k: 'stickyObjective', cond: 'selfOnHeldObjective' }] },
          { name: "Warp Surge", cp: 1, type: "Strategic Ploy", when: 'charge', targetSelf: true, desc: "Charge after Advancing (in the Shadow).", fx: [{ k: 'eligChargeAfterAdvance', cond: 'selfInShadow' }] },
          { name: "Draught of Terror", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "+1 AP; re-roll Wounds vs Battle-shocked enemies.", fx: [{ k: 'plusApMelee', n: 1 }, { k: 'plusApRanged', n: 1 }, { k: 'rerollWound', val: 'all', cond: 'targetBattleshocked' }] },
          { name: "Denizens of the Warp", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Deep Strike >6\" from enemies.", fx: [] },
          { name: "The Realm of Chaos", cp: 1, type: "Battle Tactic", when: 'oppFightEnd', targetSelf: true, desc: "Pull units into Reserves to redeploy.", fx: [{ k: 'toReserves' }] },
          { name: "Daemonic Invulnerability", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Re-roll invulnerable saves of 1.", fx: [{ k: 'rerollOnePerPhase' }] }
        ]
      },
      "Shadow Legion": {
        rule: { name: "First Prince of Chaos", desc: "Be'lakor's thralls gain per-god boons: Khorne can charge after Advancing; Tzeentch attackers -1 Hit; Nurgle attackers -1 Wound when out-toughening; Slaanesh can't be Overwatched.",
          fx: [{ k: 'eligChargeAfterAdvance', cond: 'kwKhorne', scope: 'army' },
               { k: 'subIncomingHit', n: 1, cond: 'kwTzeentch', scope: 'army' },
               { k: 'subIncomingWound', n: 1, cond: 'kwNurgle+strHigherThanT', scope: 'army' }] },
        enhancements: [
          { name: "Leaping Shadows", pts: 25, restrict: "SHADOW LEGION", desc: "Bearer's unit gains Scouts 9\".", fx: [] },
          { name: "Mantle of Gloom", pts: 20, restrict: "SHADOW LEGION", desc: "Engaged enemies lose 1 Objective Control.", fx: [] },
          { name: "Fade to Darkness", pts: 30, restrict: "SHADOW LEGION", desc: "Pull the bearer's unit into Reserves after a kill.", fx: [] },
          { name: "Malice Made Manifest", pts: 25, restrict: "SHADOW LEGION", desc: "Mortal wounds to an engaged enemy at the start of Fight.", fx: [] }
        ],
        stratagems: [
          { name: "Spiteful Demise", cp: 1, type: "Strategic Ploy", when: 'anyPhase', targetSelf: true, desc: "Mortal wounds to engaged enemies when destroyed.", fx: [] },
          { name: "Channelled Wrath", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Melee gain [LANCE] (+1 AP if Khorne).", fx: [{ k: 'grant', ab: 'lance', cond: 'meleeOnly' }, { k: 'plusApMelee', n: 1, cond: 'kwKhorne+meleeOnly' }] },
          { name: "Death Denied", cp: 1, type: "Battle Tactic", when: 'command', targetSelf: true, desc: "Heal 3 wounds (return a model if Tzeentch).", fx: [] },
          { name: "Encroaching Darkness", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Just-arrived units gain [IGNORES COVER].", fx: [{ k: 'grant', ab: 'ignorescover', cond: 'setUpThisTurn' }] },
          { name: "Shade Path", cp: 2, type: "Battle Tactic", when: 'oppCharge', targetSelf: true, desc: "-2 to the charging enemy's roll (Battle-shock if Nurgle).", fx: [] },
          { name: "Binding Shadow", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull units into Reserves.", fx: [{ k: 'toReserves' }] }
        ]
      },
      "Blood Legion": {
        rule: { name: "Murdercall", desc: "Khorne daemons can Surge toward enemies that move within 6\" (reactive move logged), and hold objectives stickily after a kill (Blood Tainted).",
          fx: [{ k: 'stickyObjective', cond: 'selfOnHeldObjective', scope: 'army' }] },
        enhancements: [
          { name: "Slaughterthirst", pts: 25, restrict: "KHORNE", desc: "Nearby Khorne units' weapons gain [LANCE].", fx: [{ k: 'grant', ab: 'lance', cond: 'meleeOnly', selfOnly: true }] },
          { name: "Fury\u2019s Cage", pts: 20, restrict: "KHORNE MONSTER", desc: "Re-roll Hits and Wounds (at the cost of D3+1 wounds).", fx: [{ k: 'rerollHit', val: 'all', selfOnly: true }, { k: 'rerollWound', val: 'all', selfOnly: true }] },
          { name: "Brazenmaw", pts: 15, restrict: "KHORNE", desc: "+2 to the bearer's unit's Charge rolls.", fx: [{ k: 'rerollCharge', selfOnly: true }] },
          { name: "Gateway Unto Damnation", pts: 10, restrict: "KHORNE MONSTER", desc: "Improved Deadly Demise.", fx: [] }
        ],
        stratagems: [
          { name: "Wrath Undeniable", cp: 1, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "Destroyed models fight on (4+).", fx: [{ k: 'fightOnDeath' }] },
          { name: "Gore-hungry Onslaught", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Move through terrain.", fx: [] },
          { name: "Skulls Beget Blood", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Mortal wounds to a nearby enemy.", fx: [] },
          { name: "Blood Begets Skulls", cp: 1, type: "Strategic Ploy", when: 'charge', targetSelf: true, desc: "Charge after Advancing.", fx: [{ k: 'eligChargeAfterAdvance' }] },
          { name: "Fools\u2019 Flight", cp: 2, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Charge a falling-back enemy in your opponent's turn.", fx: [] },
          { name: "Sheathed in Brass", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Unit has a 3+ Save this phase.", fx: [{ k: 'saveTo', val: 3 }] }
        ]
      },
      "Legion of Excess": {
        rule: { name: "Beguiling Aura", desc: "Slaanesh daemons can charge after Falling Back; after a charge they may trade Fights First for re-roll Hits and Wounds-of-1 (Seductive Gambit).",
          fx: [{ k: 'eligChargeAfterFallBack', cond: 'kwSlaanesh', scope: 'army' }] },
        enhancements: [
          { name: "False Majesty", pts: 30, restrict: "SLAANESH", desc: "Nearby Slaanesh units +1 to Wound in melee.", fx: [{ k: 'addWound', n: 1, cond: 'meleeOnly', selfOnly: true }] },
          { name: "Dreaming Crown", pts: 30, restrict: "SLAANESH", desc: "Nearby Slaanesh units +1 to Hit in melee.", fx: [{ k: 'addHit', n: 1, cond: 'meleeOnly', selfOnly: true }] },
          { name: "Avatar of Perfection", pts: 15, restrict: "SLAANESH MONSTER", desc: "Re-roll Advance/Charge and ignore move modifiers when alone.", fx: [{ k: 'rerollCharge', selfOnly: true }] },
          { name: "Soul Glutton", pts: 10, restrict: "SLAANESH MONSTER", desc: "Heal D3 after a Fight-phase kill.", fx: [] }
        ],
        stratagems: [
          { name: "Thieves of Pain", cp: 1, type: "Strategic Ploy", when: 'anyPhase', targetSelf: true, desc: "Redirect wounds to another Slaanesh unit.", fx: [] },
          { name: "Archagonists", cp: 2, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "+1 to Wound.", fx: [{ k: 'addWound', n: 1 }] },
          { name: "Sensory Excruciation", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Battle-shock all units in the Shadow.", fx: [] },
          { name: "Phantasmal Longing", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Move through terrain.", fx: [] },
          { name: "Cavalcade of Blades", cp: 1, type: "Battle Tactic", when: 'charge', targetSelf: true, desc: "Mortal wounds to an engaged enemy after a charge.", fx: [] },
          { name: "Overwhelming Excess", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Attackers -1 to Hit.", fx: [{ k: 'subIncomingHit', n: 1 }] }
        ]
      },
      "Plague Legion": {
        rule: { name: "Melancholic Miasma", desc: "Enemies within 9\" of your Nurgle daemons are in your Shadow of Chaos; each Command phase a chosen enemy in the Shadow takes a Battle-shock test.", fx: [] },
        enhancements: [
          { name: "Cankerblight", pts: 15, restrict: "NURGLE", desc: "Destroy a model in a nearby enemy that fails Battle-shock.", fx: [] },
          { name: "Maggot Maws", pts: 15, restrict: "NURGLE", desc: "Battle-shock and mortal wounds to a nearby enemy.", fx: [] },
          { name: "Droning Shroud", pts: 35, restrict: "NURGLE MONSTER", desc: "Nearby Nurgle units only shot from within 18\".", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12', selfOnly: true }] },
          { name: "Font of Spores", pts: 20, restrict: "NURGLE MONSTER", desc: "Nearby Nurgle units +1 AP.", fx: [{ k: 'plusApRanged', n: 1, selfOnly: true }, { k: 'plusApMelee', n: 1, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Seeping Virulence", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Critical Hits on unmodified 5+.", fx: [{ k: 'critOn', val: 5 }] },
          { name: "Fever Visions", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "+1 to Hit; Battle-shock a hit enemy.", fx: [{ k: 'addHit', n: 1 }] },
          { name: "Foetid Resurgence", cp: 2, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Return destroyed models / heal a Monster.", fx: [] },
          { name: "Rot and Renewal", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Move through terrain.", fx: [] },
          { name: "Murkshadows", cp: 1, type: "Battle Tactic", when: 'movement', targetSelf: true, desc: "+5\" Move on a Normal move.", fx: [{ k: 'extraMove', dice: '6' }] },
          { name: "Plague of Woes", cp: 1, type: "Strategic Ploy", when: 'oppCommand', targetSelf: true, desc: "A second enemy takes a Battle-shock test.", fx: [] }
        ]
      },
      "Scintillating Legion": {
        rule: { name: "Fates in Flux", desc: "Start with 3 Flux tokens (panel); spend one to re-roll a roll (your opponent then gains one). You draw a Flux token from the opponent in your Command phase if they have any.", fx: [] },
        enhancements: [
          { name: "Inescapable Eye", pts: 10, restrict: "TZEENTCH", desc: "Gain an extra Flux token in Command if the opponent has any.", fx: [] },
          { name: "Infernal Puppeteer", pts: 25, restrict: "TZEENTCH MONSTER", desc: "Measure the bearer's ranged attacks from another unit.", fx: [] },
          { name: "Neverblade", pts: 20, restrict: "TZEENTCH MONSTER", desc: "+2 Strength, +1 Attacks/AP, +1 Hit to the bearer's melee.", fx: [{ k: 'plusStrMelee', n: 2, selfOnly: true }, { k: 'plusApMelee', n: 1, selfOnly: true }, { k: 'plusAttacksMelee', n: 1, selfOnly: true }, { k: 'addHit', n: 1, cond: 'meleeOnly', selfOnly: true }] },
          { name: "Improbable Shield", pts: 30, restrict: "TZEENTCH", desc: "Nearby Tzeentch units FNP 4+ vs psychic/mortal.", fx: [{ k: 'fnp', val: 4, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Impossible Eclipse", cp: 1, type: "Strategic Ploy", when: 'anyPhase', targetSelf: true, desc: "Extend the Shadow over No Man's Land / enemy zone.", fx: [] },
          { name: "Pyrogenesis", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "+2 Strength to weapons (+3/+1 AP with a Flux token).", fx: [{ k: 'plusStrRanged', n: 2 }, { k: 'plusStrMelee', n: 2 }] },
          { name: "Flickering Reality", cp: 1, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "Attacks fail on a rolled Hit value.", fx: [{ k: 'subIncomingHit', n: 1 }] },
          { name: "Fateborne Nightmares", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Move through terrain.", fx: [] },
          { name: "Ficklefire", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Shoot out of combat; reflect mortal wounds.", fx: [] },
          { name: "Delirium Unmade", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull a unit into Reserves.", fx: [{ k: 'toReserves' }] }
        ]
      }
    }
  },

  "Thousand Sons": {
    // Army rule Cabal of Sorcerers is backed by the Ritual subsystem: at Shooting-phase start, sorcerers
    // roll 2D6 (+optional Channel) vs a Warp Charge, risking Perils on doubles. Destiny's Ruin / Twist of
    // Fate mark a target (re-roll Hits / +AP), Doombolt deals mortal wounds, Temporal Surge repositions.
    armyRule: {
      name: "Cabal of Sorcerers",
      desc: "At the start of your Shooting phase, your sorcerers attempt Rituals (panel): roll 2D6, optionally Channel a third, take Perils (D3 mortal wounds) on any double, and meet the Warp Charge to manifest. Destiny's Ruin (WC5, re-roll Hits vs a target), Temporal Surge (WC6, a unit repositions), Doombolt (WC7, mortal wounds), Twist of Fate (WC9, +AP vs a target). Each Ritual once per turn.",
      fx: []
    },
    restrictions: [
      "Thousand Sons army. Attempt Rituals each Shooting phase via the panel.",
      "Scintillating Legions allied units (Changehost) are an army-composition rule not modelled here; those Stratagems still work."
    ],
    detachments: {
      "Grand Coven": {
        // Kindred Sorcery is a per-Command-phase ability choice (panel). Psychic Maelstrom (+1 wound with
        // psychic weapons) is wired; the range / Devastating options are characteristic-level.
        rule: { name: "Kindred Sorcery", desc: "Each Command phase pick one (once each per battle): Imbued Manifestation (+6\" Psychic range), Psychic Maelstrom (+1 Wound with Psychic weapons), Wrath of the Immaterium (Psychic weapons gain [DEVASTATING WOUNDS]).",
          fx: [{ k: 'addWound', n: 1, cond: 'kindredMaelstrom+psychicOnly', scope: 'army' }] },
        enhancements: [
          { name: "Lord of Forbidden Lore", pts: 20, restrict: "THOUSAND SONS", desc: "+6\" range to the bearer's manifested Rituals.", fx: [] },
          { name: "Incandaeum", pts: 15, restrict: "EXALTED SORCERER", desc: "Once: attempt Doombolt even if already attempted.", fx: [] },
          { name: "Umbralefic Crystal", pts: 20, restrict: "THOUSAND SONS", desc: "Once: pull the bearer's unit into Reserves to redeploy.", fx: [] },
          { name: "Eldritch Vortex of E\u2019taph", pts: 35, restrict: "THOUSAND SONS", desc: "+1 Strength and Damage to the bearer's Psychic weapons.", fx: [] }
        ],
        stratagems: [
          { name: "Psychic Dominion", cp: 1, type: "Epic Deed", when: 'targeted', targetSelf: true, desc: "Attacker's Psychic weapons gain [HAZARDOUS]; FNP 4+ vs psychic.", fx: [{ k: 'fnp', val: 4 }] },
          { name: "Destined by Fate", cp: 1, type: "Epic Deed", when: 'anyPhase', targetSelf: true, desc: "Change a failed-save attack's Damage to 0.", fx: [] },
          { name: "Egotistical Power", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Swap your Kindred Sorcery ability for one unit.", fx: [] },
          { name: "Desecration of Worlds", cp: 1, type: "Epic Deed", when: 'command', targetSelf: true, desc: "Hold an objective stickily.", fx: [{ k: 'stickyObjective', cond: 'selfOnHeldObjective' }] },
          { name: "Arcane Focus", cp: 1, type: "Epic Deed", when: 'shooting', targetSelf: true, desc: "Re-roll all dice for a Channelled Psychic test.", fx: [] },
          { name: "Devastating Sorcery", cp: 2, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "+9\" Psychic range; re-roll Hits and Wounds with Psychic weapons.", fx: [{ k: 'rerollHit', val: 'all', cond: 'psychicOnly' }, { k: 'rerollWound', val: 'all', cond: 'psychicOnly' }] }
        ]
      },
      "Changehost of Deceit": {
        rule: { name: "Infernal Pacts", desc: "Scintillating Legions near a Thousand Sons Psyker get a 4+ invuln vs ranged; Thousand Sons near a Scintillating Psyker gain Cabal of Sorcerers. Allied composition not modelled; the Stratagems work.", fx: [] },
        enhancements: [
          { name: "Nethershriek Mind-eater", pts: 10, restrict: "THOUSAND SONS/LORD OF CHANGE", desc: "Battle-shock and mortal wounds to a nearby enemy.", fx: [] },
          { name: "Diabolic Savant", pts: 20, restrict: "THOUSAND SONS INFANTRY", desc: "+1 to Channel near Scintillating Legions.", fx: [] },
          { name: "Duplicitous Malediction", pts: 15, restrict: "THOUSAND SONS/LORD OF CHANGE", desc: "Redeploy up to three Thousand Sons units (may go to Reserves).", fx: [] },
          { name: "Tome of True Names", pts: 20, restrict: "THOUSAND SONS INFANTRY", desc: "Once: bearer gains a 2+ invuln for a phase.", fx: [] }
        ],
        stratagems: [
          { name: "Sulphurous Veil", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Attackers -1 to Hit.", fx: [{ k: 'subIncomingHit', n: 1 }] },
          { name: "Deceptive Glamour", cp: 2, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Enemies must target Scintillating Legions first.", fx: [] },
          { name: "Ethereal Phantasm", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Scintillating unit makes a D6\"/6\" move.", fx: [{ k: 'extraMove', dice: 'D6' }] },
          { name: "Fractal Disjunction", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Only shot from within 18\".", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12' }] },
          { name: "Chronosorcerous Bleed", cp: 1, type: "Strategic Ploy", when: 'oppCharge', targetSelf: true, desc: "-2 to the charging enemy's roll.", fx: [] },
          { name: "Glimmershift Portal", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull Scintillating units into Reserves.", fx: [{ k: 'toReserves' }] }
        ]
      },
      "Warpmeld Pact": {
        rule: { name: "Warpmeld Sacrifice", desc: "Tzeentch Mutant units can sacrifice for +1 Wound (attacking) or -1 to be Wounded (defending), suffering D3 mortal wounds after the phase (sacrifice backlash not auto-resolved); Tzaangors gain Battleline and +1 OC.", fx: [] },
        enhancements: [
          { name: "Warpmeld Dagger", pts: 10, restrict: "TZAANGOR SHAMAN", desc: "Boost a Ritual at the cost of mortal wounds.", fx: [] },
          { name: "Diamond of Distortion", pts: 20, restrict: "TZAANGOR SHAMAN", desc: "Led unit: attackers -1 to Hit.", fx: [{ k: 'subIncomingHit', n: 1, selfOnly: true }] },
          { name: "Bray Lord", pts: 15, restrict: "SORCERER/INFERNAL MASTER", desc: "Scouts 6\"; attach to a Tzaangors unit.", fx: [] },
          { name: "Flowing Flesh", pts: 10, restrict: "TZAANGOR SHAMAN", desc: "Bearer has Feel No Pain 4+.", fx: [{ k: 'fnp', val: 4, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Gift of Change", cp: 1, type: "Epic Deed", when: 'anyPhase', targetSelf: true, desc: "Spawn a Chaos Spawn when a Character dies.", fx: [] },
          { name: "Warped Vicissitude", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Tzaangors gain a 4+ invuln.", fx: [{ k: 'invuln', val: 4 }] },
          { name: "Deranged Ferocity", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "6\" Pile-in; models within 3\" fight.", fx: [] },
          { name: "Blessed Transmutations", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Return D3+1 destroyed Tzaangors.", fx: [] },
          { name: "Touched by Tzeentch", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot or charge after Advancing.", fx: [{ k: 'eligChargeAfterAdvance' }, { k: 'eligShootAfterAdvance' }] },
          { name: "Twisted Mirage", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Arrive from Reserves >6\" from enemies.", fx: [] }
        ]
      },
      "Rubricae Phalanx": {
        rule: { name: "All is Dust", desc: "Each time a Damage-1 attack is allocated to a RUBRICAE model, +1 to that armour save (modelled as -1 incoming Damage on Damage-1 attacks → effectively tougher; approximated as a small defensive bonus).",
          fx: [{ k: 'subIncomingWound', n: 1, cond: 'rangedOnly', scope: 'army' }] },
        enhancements: [
          { name: "Risen Rubricae", pts: 30, restrict: "THOUSAND SONS", desc: "Rubricae units gain Infiltrators.", fx: [] },
          { name: "Arcane Thralls", pts: 5, restrict: "THOUSAND SONS", desc: "Re-roll Battle-shock for nearby Rubricae.", fx: [] },
          { name: "Lord of the Rubricae", pts: 15, restrict: "THOUSAND SONS", desc: "+1 to Hit for Rubricae in the led unit.", fx: [{ k: 'addHit', n: 1, selfOnly: true }] },
          { name: "The Stave Abominus", pts: 20, restrict: "THOUSAND SONS INFANTRY", desc: "Bearer's melee gain [SUSTAINED HITS D3] and [DEVASTATING WOUNDS].", fx: [{ k: 'grant', ab: 'sustained', val: 1, cond: 'meleeOnly', selfOnly: true }, { k: 'grant', ab: 'devastating', cond: 'meleeOnly', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Ardent Automata", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot and charge after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Inexorable Advance", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Ignore move/Advance modifiers; ranged gain [ASSAULT].", fx: [{ k: 'grant', ab: 'assault', cond: 'rangedOnly' }] },
          { name: "Infernal Fusillade", cp: 2, type: "Wargear", when: 'shooting', targetSelf: true, desc: "Inferno weapons gain [PSYCHIC] and Strength 5.", fx: [] },
          { name: "Revenge of the Rubricae", cp: 1, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Shoot back at the unit that killed your Psyker.", fx: [{ k: 'shootBack' }] },
          { name: "Implacable Guardians", cp: 2, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Incoming attacks -1 Damage.", fx: [{ k: 'reduceIncomingDmg', n: 1 }] },
          { name: "Unwavering Phalanx", cp: 1, type: "Battle Tactic", when: 'oppCharge', targetSelf: true, desc: "Attackers -1 to Wound this turn.", fx: [{ k: 'subIncomingWound', n: 1 }] }
        ]
      },
      "Warpforged Cabal": {
        rule: { name: "Warpfire Infusion", desc: "Thousand Sons Vehicles re-roll a Hit/Wound/Damage (all three if near a friendly Psyker) when attacking; better Deadly Demise near Psykers.",
          fx: [{ k: 'rerollHit', val: 1, cond: 'isVehicle', scope: 'army' }] },
        enhancements: [
          { name: "Warp Syphon", pts: 5, restrict: "THOUSAND SONS", desc: "Re-roll a Channel die at the cost of a vehicle wound.", fx: [] },
          { name: "The Perplexing Cloak", pts: 20, restrict: "THOUSAND SONS INFANTRY", desc: "Lone Operative near vehicles.", fx: [] },
          { name: "Biomechanical Mutation", pts: 15, restrict: "THOUSAND SONS", desc: "Heal a nearby Vehicle D3 in Command.", fx: [] },
          { name: "Warp-cursed Runemaster", pts: 10, restrict: "THOUSAND SONS", desc: "+6\" range to manifested Rituals near vehicles.", fx: [] }
        ],
        stratagems: [
          { name: "Hex-marked Armour", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Incoming attacks worsen AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Mutate Landscape", cp: 1, type: "Epic Deed", when: 'command', targetSelf: true, desc: "Hold an objective stickily; it damages passing enemies.", fx: [{ k: 'stickyObjective', cond: 'selfOnHeldObjective' }] },
          { name: "Cyberspirit Machinations", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Vehicle shoots and charges after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Malevolent Animus", cp: 1, type: "Epic Deed", when: 'command', targetSelf: true, desc: "Vehicle ignores characteristic/roll modifiers.", fx: [{ k: 'ignoreModifiers' }] },
          { name: "Ensorcelled Infusion", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Vehicle ranged gain [PSYCHIC]; +1 to Wound.", fx: [{ k: 'addWound', n: 1, cond: 'rangedOnly' }] },
          { name: "Warpflame Gargoyles", cp: 1, type: "Wargear", when: 'oppCharge', targetSelf: true, desc: "Mortal wounds and Battle-shock to a charging enemy.", fx: [] }
        ]
      },
      "Hexwarp Thrallband": {
        // Flow of Magic reuses the Shadow-of-Chaos zone model (inFlow condition). +1 Wound psychic in the Flow.
        rule: { name: "Flow of Magic", desc: "Your deployment zone is always in your Flow of Magic; No Man's Land / enemy zone joins it while you hold half its objectives. Thousand Sons re-roll Psychic Wounds of 1 (+1 to Wound instead while wholly in the Flow).",
          fx: [{ k: 'rerollWound', val: 1, cond: 'psychicOnly', scope: 'army' }, { k: 'addWound', n: 1, cond: 'inFlow+psychicOnly', scope: 'army' }] },
        enhancements: [
          { name: "Arcane Might", pts: 20, restrict: "THOUSAND SONS", desc: "+1 Strength to unit's Psychic weapons (+2 wholly in the Flow).", fx: [{ k: 'plusStrRanged', n: 1, cond: 'psychicOnly', selfOnly: true }] },
          { name: "Empowered Manifestation", pts: 20, restrict: "THOUSAND SONS", desc: "+6\" Psychic range and re-roll Hazardous while in the Flow.", fx: [] },
          { name: "Empyric Onslaught", pts: 25, restrict: "THOUSAND SONS", desc: "+3 Attacks to ranged Psychic weapons while in the Flow.", fx: [] },
          { name: "Noctilith Mantle", pts: 15, restrict: "THOUSAND SONS", desc: "Bearer's unit is always in the Flow (but can't use Rituals).", fx: [] }
        ],
        stratagems: [
          { name: "Warding Hex", cp: 1, type: "Epic Deed", when: 'command', targetSelf: true, desc: "Hold a Flow objective stickily.", fx: [{ k: 'stickyObjective', cond: 'selfOnHeldObjective' }] },
          { name: "Wrath of the Doomed", cp: 1, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "Destroyed models fight on (4+, +1 in the Flow).", fx: [{ k: 'fightOnDeath' }] },
          { name: "Strands of Time", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot or charge after Falling Back (both in the Flow).", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack', cond: 'inFlow' }] },
          { name: "Through the Veil", cp: 1, type: "Epic Deed", when: 'movement', targetSelf: true, desc: "Rubricae/Scarab Occult Deep Strike from Reserves.", fx: [{ k: 'grantDeepStrike' }] },
          { name: "Scouring Warpflame", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Ranged gain [IGNORES COVER]; strip cover from a hit enemy.", fx: [{ k: 'grant', ab: 'ignorescover', cond: 'rangedOnly' }] },
          { name: "Kaleidoscopic Tempest", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Stealth; Benefit of Cover while in the Flow.", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12' }] }
        ]
      }
    }
  },

  "Chaos Knights": {
    // Army rule Harbingers of Dread is backed by the escalating-menu subsystem: Deathly Terror is active from
    // the start, and at rounds 1/3/5 you bank one (or randomly two) more Dread abilities (Command-phase panel).
    // Banked abilities are permanent. Doom (+1 wound vs Battle-shocked) and Darkness (-1 to be hit from
    // Battle-shocked/far) are wired into combat; Deathly Terror/Despair/Delirium feed the Battle-shock test.
    armyRule: {
      name: "Harbingers of Dread",
      desc: "Deathly Terror (enemies within 9\": -1 Leadership) is active from the start. At the start of rounds 1, 3 and 5, bank one more Dread ability via the panel (they last all battle, no repeats): Despair (further -1 Ld), Doom (+1 Wound vs Battle-shocked), Darkness (-1 to be hit by Battle-shocked or >18\" attackers), Dismay (below-strength enemies near you test Battle-shock), Delirium (below-half enemies that fail suffer D3 mortals), Dominion (+3\" aura range).",
      fx: []
    },
    restrictions: [
      "Chaos Knights army. Bank Dread abilities at rounds 1/3/5 via the panel.",
      "Dreadblades (allied Knights) and the Super-heavy Walker movement rule are army-composition / movement rules not modelled here."
    ],
    detachments: {
      "Traitoris Lance": {
        rule: { name: "Paragons of Terror", desc: "At the start of round 1, after banking your Dread abilities, bank one additional (non-random) Dread ability. (Bank the extra via the panel.)", fx: [] },
        enhancements: [
          { name: "Nightmare\u2019s Master", pts: 20, restrict: "CHAOS KNIGHTS", desc: "Fight-phase Battle-shock test on enemies in Engagement Range.", fx: [] },
          { name: "Tyrant\u2019s Shadow", pts: 25, restrict: "CHAOS KNIGHTS", desc: "Hold an objective stickily; it gains Deathly Terror.", fx: [{ k: 'stickyObjective', cond: 'selfOnHeldObjective' }] },
          { name: "Malevolent Heraldry", pts: 30, restrict: "CHAOS KNIGHTS", desc: "Re-roll the dice when randomly selecting Dread abilities.", fx: [] },
          { name: "Veil of Medrengard", pts: 35, restrict: "CHAOS KNIGHTS", desc: "4+ invuln vs ranged, 5+ invuln vs melee.", fx: [{ k: 'invuln', val: 4, cond: 'rangedOnly', selfOnly: true }, { k: 'invuln', val: 5, cond: 'meleeOnly', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Pterrorshades", cp: 1, type: "Wargear", when: 'anyPhase', targetSelf: true, desc: "Mortal wounds to a Battle-shocked enemy; heal a wound.", fx: [] },
          { name: "Conquerors Without Mercy", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "+1 AP melee for a charging Knight; Battle-shock nearby enemies on a kill.", fx: [{ k: 'plusApMelee', n: 1, cond: 'chargedThisTurn' }] },
          { name: "Disdain for the Weak", cp: 1, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "FNP 6+ (5+ vs Battle-shocked attackers).", fx: [{ k: 'fnp', val: 6 }] },
          { name: "A Long Leash", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "War Dogs treated as within your Abhorrent's auras.", fx: [] },
          { name: "Imperious Advance", cp: 1, type: "Epic Deed", when: 'movement', targetSelf: true, desc: "Move through models/terrain; auto-pass Desperate Escape.", fx: [] },
          { name: "Storm of Darkness", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Stealth and Benefit of Cover.", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12' }] }
        ]
      },
      "Infernal Lance": {
        // Malefic Surge is a per-unit Empowered pick. Modelled as a doctrine-style army choice (Empowered mode)
        // selecting one of three buffs; the Leadership-test backlash is not auto-resolved.
        rule: { name: "Malefic Surge", desc: "In your Command phase, Knights can become Empowered (Leadership test or D3 mortal wounds), then use one ability until next Command: Unholy Hunger (+3\" Move), Diabolic Power ([LETHAL] or [SUSTAINED HITS 1]), or Unnatural Fortitude (5+ invuln or 6+ FNP). Pick the army-wide mode below.",
          fx: [] },
        doctrineLabel: "Malefic Surge ability",
        doctrines: [
          { id: 'hunger', name: "Unholy Hunger", desc: "+3\" Move (logged; raises effective Move where movement reads it).", fx: [{ k: 'extraMove', val: '3' }] },
          { id: 'powerL', name: "Diabolic Power — Lethal", desc: "Weapons gain [LETHAL HITS].", fx: [{ k: 'grant', ab: 'lethal', scope: 'army' }] },
          { id: 'powerS', name: "Diabolic Power — Sustained", desc: "Weapons gain [SUSTAINED HITS 1].", fx: [{ k: 'grant', ab: 'sustained', val: 1, scope: 'army' }] },
          { id: 'fortInv', name: "Unnatural Fortitude — Invuln", desc: "5+ invulnerable save.", fx: [{ k: 'invuln', val: 5, defensive: true, scope: 'army' }] },
          { id: 'fortFnp', name: "Unnatural Fortitude — FNP", desc: "Feel No Pain 6+.", fx: [{ k: 'fnp', val: 6, scope: 'army' }] }
        ],
        enhancements: [
          { name: "Knight Diabolus", pts: 25, restrict: "CHAOS KNIGHTS", desc: "+1 WS; [LANCE] while using Diabolic Power.", fx: [{ k: 'grant', ab: 'lance', cond: 'meleeOnly', selfOnly: true }] },
          { name: "Blasphemous Engine", pts: 35, restrict: "CHAOS KNIGHTS", desc: "+2 Wounds; re-roll the Malefic Surge Leadership test.", fx: [] },
          { name: "Fleshmetal Fusion", pts: 35, restrict: "CHAOS KNIGHTS", desc: "+1 Toughness; better saves vs Damage-1 while Fortitude is up.", fx: [] },
          { name: "Bestial Aspect", pts: 20, restrict: "CHAOS KNIGHTS", desc: "Ranged gain [ASSAULT]; ignore Move modifiers while using Unholy Hunger.", fx: [{ k: 'grant', ab: 'assault', cond: 'rangedOnly', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Profane Symbiosis", cp: 1, type: "Battle Tactic", when: 'anyPhase', targetSelf: true, desc: "A unit makes a Malefic Surge.", fx: [] },
          { name: "Hellforged Construction", cp: 1, type: "Battle Tactic", when: 'fightTargeted', targetSelf: true, desc: "Incoming attacks worsen AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Corrupting Taint", cp: 1, type: "Epic Deed", when: 'command', targetSelf: true, desc: "Hold an objective stickily.", fx: [{ k: 'stickyObjective', cond: 'selfOnHeldObjective' }] },
          { name: "Unleash Balefire", cp: 1, type: "Wargear", when: 'shooting', targetSelf: true, desc: "Set a hit enemy aflame (Battle-shock; -2 Move, -2 Charge).", fx: [] },
          { name: "Warp Vision", cp: 1, type: "Wargear", when: 'shooting', targetSelf: true, desc: "Ranged gain [IGNORES COVER].", fx: [{ k: 'grant', ab: 'ignorescover', cond: 'rangedOnly' }] },
          { name: "Diabolic Bulwark", cp: 1, type: "Wargear", when: 'targeted', targetSelf: true, desc: "4+ invulnerable save.", fx: [{ k: 'invuln', val: 4 }] }
        ]
      },
      "Lords of Dread": {
        rule: { name: "Tyrannical Court", desc: "+2 Objective Control to CHAOS KNIGHTS CHARACTER models. Once per round, if your Warlord is on the battlefield, use Claimed for the Dark Gods for 0CP.",
          fx: [{ k: 'objControl', n: 2, cond: 'characterLeading', scope: 'army' }] },
        enhancements: [
          { name: "Throne Mechanicum of Skulls", pts: 25, restrict: "CHAOS KNIGHTS", desc: "Re-roll Charge rolls; once, charge after Advancing.", fx: [{ k: 'rerollCharge', selfOnly: true }] },
          { name: "Blade of Celerity", pts: 35, restrict: "CHAOS KNIGHTS", desc: "Ranged gain [ASSAULT]; once, Fights First.", fx: [{ k: 'grant', ab: 'assault', cond: 'rangedOnly', selfOnly: true }, { k: 'fightsFirst', selfOnly: true }] },
          { name: "Warp-borne Stalker", pts: 25, restrict: "CHAOS KNIGHTS", desc: "Deep Strike; once, redeploy to Reserves.", fx: [{ k: 'grantDeepStrike', selfOnly: true }] },
          { name: "Putrid Carapace", pts: 30, restrict: "CHAOS KNIGHTS", desc: "Save 2+; once, heal D6.", fx: [{ k: 'saveTo', val: 2, selfOnly: true }] },
          { name: "Mirror of Fates", pts: 30, restrict: "CHAOS KNIGHTS", desc: "0CP Command Re-roll once/round; enemy Stratagems near you cost +1CP.", fx: [{ k: 'enemyStratTax', selfOnly: true }] },
          { name: "Blessing of the Dark Master", pts: 20, restrict: "CHAOS KNIGHTS", desc: "Stealth; once, change a failed-save attack's Damage to 0.", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Claimed for the Dark Gods", cp: 1, type: "Epic Deed", when: 'command', targetSelf: true, desc: "Hold an objective at Control 5 stickily.", fx: [{ k: 'stickyObjective', cond: 'selfOnHeldObjective' }] },
          { name: "Spiteful Demise", cp: 1, type: "Epic Deed", when: 'anyPhase', targetSelf: true, desc: "Deadly Demise triggers on 4+ instead of 6.", fx: [] },
          { name: "Runes of Disdain", cp: 2, type: "Epic Deed", when: 'targeted', targetSelf: true, desc: "Incoming attacks -1 Damage.", fx: [{ k: 'reduceIncomingDmg', n: 1 }] },
          { name: "Titanic Duel", cp: 1, type: "Epic Deed", when: 'shooting', targetSelf: true, desc: "Re-roll Hits/Wounds of 1 vs a Monster/Vehicle (all if Titanic).", fx: [{ k: 'rerollHit', val: 1, cond: 'targetMonsterVehicle' }, { k: 'rerollWound', val: 1, cond: 'targetMonsterVehicle' }] },
          { name: "Trophy Hunter", cp: 1, type: "Epic Deed", when: 'fight', targetSelf: true, desc: "+3\" Consolidation toward enemies.", fx: [] },
          { name: "Crushed Like Vermin", cp: 1, type: "Epic Deed", when: 'movement', targetSelf: true, desc: "Mortal wounds to a non-Monster/Vehicle moved over; Battle-shock.", fx: [] }
        ]
      },
      "Helhunt Lance": {
        rule: { name: "Masters of the Pack", desc: "If a Titanic Chaos Knight has an Aura affecting friendly War Dogs and two or more War Dog models are within range, that Titanic Knight is also affected by its own Aura. Aura-sharing is not modelled mechanically; the Stratagems work.", fx: [] },
        enhancements: [
          { name: "Aspect of the Beast", pts: 30, restrict: "CHAOS KNIGHTS", desc: "Bearer gains an extra Dread ability each Command phase.", fx: [] },
          { name: "Hunter\u2019s Helm", pts: 15, restrict: "CHAOS KNIGHTS", desc: "Re-roll Advance and Charge rolls.", fx: [{ k: 'rerollCharge', selfOnly: true }, { k: 'rerollAdvance', selfOnly: true }] },
          { name: "Octagram of Conjuration", pts: 40, restrict: "KNIGHT ABOMINANT", desc: "Battle-shock test on enemies hit by nearby War Dogs.", fx: [] },
          { name: "Throne Tyrannicus", pts: 25, restrict: "TITANIC CHAOS KNIGHTS", desc: "Share War Dog auras with a nearby Character.", fx: [] }
        ],
        stratagems: [
          { name: "Feral Arrogance", cp: 1, type: "Strategic Ploy", when: 'anyPhase', targetSelf: true, desc: "FNP 5+ vs mortal wounds.", fx: [{ k: 'fnp', val: 5 }] },
          { name: "Merciless Fusillade", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Focus-fire with [SUSTAINED HITS 1].", fx: [{ k: 'grant', ab: 'sustained', val: 1 }] },
          { name: "Beasthide Manifestation", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Incoming attacks worsen AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Flush the Quarry", cp: 1, type: "Battle Tactic", when: 'movement', targetSelf: true, desc: "War Dogs move through models/terrain.", fx: [] },
          { name: "Contemptuous Volleys", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot and charge after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Goaded Beast", cp: 1, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Make a D6\" Surge move toward the enemy.", fx: [{ k: 'extraMove', dice: 'D6' }] }
        ]
      },
      "Houndpack Lance": {
        // Marked Prey marks one enemy each Command phase: WAR DOG attacks vs it gain Sustained. Modelled army-wide
        // vs the closest target (approx) — full target-selection UI not present.
        rule: { name: "Marked Prey", desc: "Each Command phase mark one enemy unit; War Dog attacks targeting it gain [SUSTAINED HITS 1] (approximated vs the closest enemy). Army must include 3+ War Dog units; they gain Battleline; pick three as Characters.",
          fx: [{ k: 'grant', ab: 'sustained', val: 1, cond: 'closestTarget', scope: 'army' }] },
        enhancements: [
          { name: "Preyslayer\u2019s Mantle", pts: 15, restrict: "WAR DOG", desc: "Bearer gains Super-heavy Walker.", fx: [] },
          { name: "Final Howl", pts: 20, restrict: "WAR DOG", desc: "Nearby War Dogs re-roll Wounds of 1.", fx: [{ k: 'rerollWound', val: 1, cond: 'within6OfAlly', scope: 'army' }] },
          { name: "Loping Predator", pts: 10, restrict: "WAR DOG", desc: "Ranged gain [ASSAULT].", fx: [{ k: 'grant', ab: 'assault', cond: 'rangedOnly', selfOnly: true }] },
          { name: "Panoply of the Cursed Knight", pts: 15, restrict: "WAR DOG", desc: "Incoming attacks worsen AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Vox-howl", cp: 2, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Battle-shock nearby enemies; rally nearby War Dogs.", fx: [] },
          { name: "Hungry for Combat", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Focus-fire; Critical Hits on 5+.", fx: [{ k: 'critOn', val: 5 }] },
          { name: "Cunning Hunter", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot and charge after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Animalistic Rage", cp: 1, type: "Battle Tactic", when: 'anyPhase', targetSelf: true, desc: "Destroyed War Dog shoots/fights before Deadly Demise.", fx: [{ k: 'fightOnDeath' }] },
          { name: "Harrying Hounds", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "War Dog makes a 6\" Normal move.", fx: [{ k: 'extraMove', val: '6' }] },
          { name: "Encircling Pack", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull a War Dog into Reserves.", fx: [{ k: 'toReserves' }] }
        ]
      },
      "Iconoclast Fiefdom": {
        rule: { name: "Dreaded Masters", desc: "Titanic Knights near a friendly DAMNED unit re-roll Hits/Wounds of 1 (Dread Tyrants). Knights can make a Dark Sacrifice (kill D3/D3+3 of a nearby Damned unit) for [LETHAL] or [SUSTAINED HITS 1]. DAMNED allied composition not modelled; the Dark Sacrifice bonus is approximated as army-wide [SUSTAINED HITS 1].",
          fx: [{ k: 'grant', ab: 'sustained', val: 1, scope: 'army' }] },
        enhancements: [
          { name: "Profane Altar", pts: 20, restrict: "CHAOS KNIGHTS", desc: "Dark Sacrifice kills the max and grants both [LETHAL] and [SUSTAINED].", fx: [{ k: 'grant', ab: 'lethal', selfOnly: true }] },
          { name: "Pave the Way", pts: 15, restrict: "CHAOS KNIGHTS", desc: "Up to three Damned units gain Scouts 6\".", fx: [] },
          { name: "Tyrant\u2019s Banner", pts: 5, restrict: "CHAOS KNIGHTS", desc: "Dark Sacrifice can pick any visible Damned unit.", fx: [] },
          { name: "Diabolical Resilience", pts: 35, restrict: "CHAOS KNIGHTS", desc: "Feel No Pain 6+; ignore Move/Advance/Charge modifiers.", fx: [{ k: 'fnp', val: 6, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Avenge the Masters!", cp: 1, type: "Strategic Ploy", when: 'anyPhase', targetSelf: true, desc: "Damned attacks vs the killer gain [LETHAL HITS].", fx: [] },
          { name: "Wretched Masses", cp: 2, type: "Battle Tactic", when: 'anyPhase', targetSelf: true, desc: "Return a destroyed Damned unit to Reserves.", fx: [] },
          { name: "Soul Hunger", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Heal D3 (D3+2 vs Battle-shocked) on a kill.", fx: [] },
          { name: "Unrestrained Rage", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot and charge after Advancing/Falling Back.", fx: [{ k: 'eligShootAfterAdvance' }, { k: 'eligChargeAfterAdvance' }, { k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Worthless Chattel", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Damned ignore Engagement for shooting; bodyguard losses.", fx: [] },
          { name: "Preserve the Idols", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "A Damned unit makes a 6\" interposing move.", fx: [] }
        ]
      }
    }
  },

  "Chaos Space Marines": {
    // Army rule Dark Pacts is backed by a per-phase army-wide toggle (panel button): take a Leadership test
    // (fail -> D3 mortal wounds), then weapons gain [LETHAL HITS] + [SUSTAINED HITS 1] for the phase. Several
    // detachments layer riders on top (Pactbound Marks-of-Chaos crits, Cabal Str/AP) gated on the pact* conditions.
    armyRule: {
      name: "Dark Pacts",
      desc: "Each Shooting/Fight phase a unit can make a Dark Pact (panel): take a Leadership test — on a fail it suffers D3 mortal wounds — then your weapons gain [LETHAL HITS] and [SUSTAINED HITS 1] until end of phase. (Modelled army-wide for the phase.)",
      fx: []
    },
    restrictions: [
      "Heretic Astartes army. Invoke Dark Pacts via the panel in your Shooting/Fight phases.",
      "Cult of the Dark Gods allies (Berzerkers/Rubricae/Plague/Noise Marines) are an army-composition rule not modelled; those units fight under their own factions."
    ],
    detachments: {
      "Veterans of the Long War": {
        // Focus of Hatred = mark one enemy each Command phase for Hit re-rolls. Reuses the Oath-target mechanism
        // (set via the Oath panel / oathTarget); re-roll injected through the targetIsOath condition.
        rule: { name: "Focus of Hatred", desc: "At the start of your Command phase, name one enemy unit your focus of hatred (use the Oath chooser): re-roll Hit rolls vs it. (Reuses the Oath-target marker.)",
          fx: [{ k: 'rerollHit', val: 'all', cond: 'targetIsOath', scope: 'army' }] },
        enhancements: [
          { name: "Eager for Vengeance", pts: 20, restrict: "HERETIC ASTARTES", desc: "Shoot/charge after Falling Back; +1 Hit/+1 Charge vs focus of hatred.", fx: [{ k: 'eligShootAfterFallBack', selfOnly: true }, { k: 'eligChargeAfterFallBack', selfOnly: true }] },
          { name: "Eye of Abaddon", pts: 15, restrict: "HERETIC ASTARTES", desc: "Gain 1CP (4+) when your focus of hatred dies.", fx: [] },
          { name: "Mark of Legend", pts: 10, restrict: "HERETIC ASTARTES", desc: "Once/turn re-roll a Hit, Wound or save for the bearer.", fx: [{ k: 'rerollOnePerPhase', selfOnly: true }] },
          { name: "Warmaster\u2019s Gift", pts: 15, restrict: "CHAOS LORD", desc: "Critical Wound on 5+ vs focus of hatred.", fx: [] }
        ],
        stratagems: [
          { name: "Endless Ire", cp: 2, type: "Epic Deed", when: 'anyPhase', targetSelf: true, desc: "Name a new focus of hatred when one dies.", fx: [] },
          { name: "Contemptuous Disregard", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Incoming attacks worsen AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Bringers of Despair", cp: 2, type: "Epic Deed", when: 'fight', targetSelf: true, desc: "Fights First in Engagement with your focus.", fx: [{ k: 'fightsFirst' }] },
          { name: "Black Crusade", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot after Advancing/Falling Back; bolt weapons gain [DEVASTATING WOUNDS].", fx: [{ k: 'eligShootAfterAdvance' }, { k: 'eligShootAfterFallBack' }, { k: 'grant', ab: 'devastating', cond: 'rangedOnly' }] },
          { name: "Let the Galaxy Burn", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Ranged gain [IGNORES COVER].", fx: [{ k: 'grant', ab: 'ignorescover', cond: 'rangedOnly' }] },
          { name: "Millennia of Experience", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Make a 6\" Normal move.", fx: [{ k: 'extraMove', val: '6' }] }
        ]
      },
      "Deceptors": {
        rule: { name: "Masters of Misdirection", desc: "Select Legionaries / Cultist Mob units to gain Infiltrators at battle start (army-composition; not auto-applied). The Stratagems work.", fx: [] },
        enhancements: [
          { name: "Cursed Fang", pts: 10, restrict: "HERETIC ASTARTES INFANTRY", desc: "+1 AP and [PRECISION] to bearer's melee.", fx: [{ k: 'plusApMelee', n: 1, selfOnly: true }, { k: 'grant', ab: 'precision', cond: 'meleeOnly', selfOnly: true }] },
          { name: "Falsehood", pts: 10, restrict: "CHAOS LORD", desc: "Deploy in Reserves; emerge by sacrificing a friendly model.", fx: [] },
          { name: "Shroud of Obfuscation", pts: 15, restrict: "HERETIC ASTARTES INFANTRY", desc: "Bearer has Stealth and Lone Operative.", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12', selfOnly: true }] },
          { name: "Soul Link", pts: 5, restrict: "HERETIC ASTARTES INFANTRY", desc: "Copy another character's datasheet abilities.", fx: [] }
        ],
        stratagems: [
          { name: "Detonator", cp: 1, type: "Wargear", when: 'anyPhase', targetSelf: true, desc: "Auto-inflict a dying enemy's Deadly Demise mortal wounds.", fx: [] },
          { name: "From All Sides", cp: 1, type: "Battle Tactic", when: 'charge', targetSelf: true, desc: "+1 Charge per other charging HA unit (max +3).", fx: [{ k: 'rerollCharge' }] },
          { name: "Pick Them Off", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Re-roll Hits vs below-strength (Wounds too if below-half).", fx: [{ k: 'rerollHit', val: 'all', cond: 'targetBelowStrength' }, { k: 'rerollWound', val: 'all', cond: 'targetBelowHalf' }] },
          { name: "Coils of Deception", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }] },
          { name: "Relentless Pursuit", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Make a 6\" Normal move.", fx: [{ k: 'extraMove', val: '6' }] },
          { name: "Scrambled Coordinates", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Block enemy Reserves within 12\".", fx: [] }
        ]
      },
      "Renegade Raiders": {
        rule: { name: "Raiders and Reavers", desc: "Ranged weapons gain [ASSAULT]; +1 AP to attacks targeting a unit within range of an objective marker.",
          fx: [{ k: 'grant', ab: 'assault', cond: 'rangedOnly', scope: 'army' }, { k: 'plusApRanged', n: 1, cond: 'targetWithinObjective', scope: 'army' }, { k: 'plusApMelee', n: 1, cond: 'targetWithinObjective', scope: 'army' }] },
        enhancements: [
          { name: "Despot\u2019s Claim", pts: 15, restrict: "HERETIC ASTARTES", desc: "Chance of 1CP each Command phase.", fx: [] },
          { name: "Dread Reaver", pts: 15, restrict: "HERETIC ASTARTES", desc: "Re-roll melee Hits/Wounds near the enemy zone.", fx: [{ k: 'rerollHit', val: 'all', cond: 'meleeOnly', selfOnly: true }, { k: 'rerollWound', val: 'all', cond: 'meleeOnly', selfOnly: true }] },
          { name: "Mark of the Hound", pts: 25, restrict: "HERETIC ASTARTES", desc: "Bearer's unit has Scouts 6\".", fx: [] },
          { name: "Tyrant\u2019s Lash", pts: 20, restrict: "HERETIC ASTARTES", desc: "Re-roll Advance; shoot after Falling Back.", fx: [{ k: 'rerollAdvance', selfOnly: true }, { k: 'eligShootAfterFallBack', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Unfailingly Obdurate", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Incoming attacks worsen AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Scour and Seize", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "[PRECISION] vs units on objectives.", fx: [{ k: 'grant', ab: 'precision', cond: 'targetWithinObjective' }] },
          { name: "Opportunistic Raiders", cp: 1, type: "Strategic Ploy", when: 'fightEnd', targetSelf: true, desc: "Make a 6\"/12\" move or Fall Back.", fx: [{ k: 'extraMove', val: '6' }] },
          { name: "Warpcharged Engines", cp: 1, type: "Wargear", when: 'movement', targetSelf: true, desc: "Auto-Advance +6\" Move.", fx: [{ k: 'extraMove', val: '6' }] },
          { name: "Ruinous Raid", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Re-roll Hits/Wounds vs units on objectives (post-disembark).", fx: [{ k: 'rerollHit', val: 'all', cond: 'targetWithinObjective' }, { k: 'rerollWound', val: 'all', cond: 'targetWithinObjective' }] },
          { name: "Reavers\u2019 Haste", cp: 1, type: "Strategic Ploy", when: 'charge', targetSelf: true, desc: "Charge after Advancing; +1 Charge vs objectives.", fx: [{ k: 'eligChargeAfterAdvance' }] }
        ]
      },
      "Dread Talons": {
        // Terror Descends: enemies near HA units below-strength must test, -1 to the test. Wired via haTerrorActive.
        rule: { name: "Terror Descends", desc: "Below-strength enemies within 12\" of your units must take a Battle-shock test, at -1. (Wired into the Battle-shock step.)", fx: [] },
        enhancements: [
          { name: "Eater of Dread", pts: 15, restrict: "HERETIC ASTARTES", desc: "CP for Battle-shocked enemies.", fx: [] },
          { name: "Night\u2019s Shroud", pts: 20, restrict: "CHAOS LORD", desc: "Bearer's unit has Stealth.", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12', selfOnly: true }] },
          { name: "Warp-fuelled Thrusters", pts: 20, restrict: "JUMP PACK CHAOS LORD", desc: "Redeploy to Reserves end of opponent's turn.", fx: [] },
          { name: "Willbreaker", pts: 10, restrict: "HERETIC ASTARTES", desc: "Battle-shock test on a hit enemy in melee.", fx: [] }
        ],
        stratagems: [
          { name: "Depthless Cruelty", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "+1 AP vs Battle-shocked / below-half.", fx: [{ k: 'plusApMelee', n: 1, cond: 'targetBattleshocked' }] },
          { name: "Bloody Example", cp: 1, type: "Epic Deed", when: 'fight', targetSelf: true, desc: "Battle-shock nearby enemies on a Character kill.", fx: [] },
          { name: "Pitiless Hunters", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Re-roll Hits/Wounds vs Battle-shocked / below-half.", fx: [{ k: 'rerollHit', val: 'all', cond: 'targetBattleshocked' }, { k: 'rerollWound', val: 'all', cond: 'targetBattleshocked' }] },
          { name: "Relentless Terror", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Charge after Falling Back.", fx: [{ k: 'eligChargeAfterFallBack' }] },
          { name: "Screaming Descent", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Deep Strike a Jump Pack unit; Battle-shock a nearby enemy.", fx: [{ k: 'grantDeepStrike' }] },
          { name: "Merciless Pursuit", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Charge a unit that Fell Back.", fx: [] }
        ]
      },
      "Fellhammer Siege-host": {
        rule: { name: "Iron Fortitude", desc: "When a ranged attack with Strength greater than your unit's Toughness targets you, subtract 1 from the Wound roll.",
          fx: [{ k: 'subIncomingWound', n: 1, cond: 'rangedOnly+strHigherThanT', scope: 'army' }] },
        enhancements: [
          { name: "Bastion Plate", pts: 10, restrict: "CHAOS LORD", desc: "Once/round change a failed-save attack's Damage to 0.", fx: [] },
          { name: "Iron Artifice", pts: 10, restrict: "HERETIC ASTARTES INFANTRY", desc: "[ANTI-VEHICLE 4+] and [ANTI-FORTIFICATION 4+].", fx: [{ k: 'antiVal', kw: 'VEHICLE', val: 4, selfOnly: true }] },
          { name: "Ironbound Enmity", pts: 15, restrict: "HERETIC ASTARTES", desc: "+1 Wound while within range of an objective.", fx: [{ k: 'addWound', n: 1, cond: 'selfWithinObjective', selfOnly: true }] },
          { name: "Warp Tracer", pts: 20, restrict: "HERETIC ASTARTES", desc: "Strip cover from a hit enemy.", fx: [] }
        ],
        stratagems: [
          { name: "Persistent Assailants", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Re-roll Hits (Wounds too if below-half).", fx: [{ k: 'rerollHit', val: 'all' }, { k: 'rerollWound', val: 'all', cond: 'selfBelowHalf' }] },
          { name: "Brutal Attrition", cp: 1, type: "Epic Deed", when: 'fightTargeted', targetSelf: true, desc: "Reflect melee damage as mortal wounds.", fx: [] },
          { name: "Pitiless Cannonade", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Critical Hit on 5+ vs below-half.", fx: [{ k: 'critOn', val: 5, cond: 'targetBelowHalf' }] },
          { name: "Point-blank Destruction", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Ranged weapons gain [PISTOL].", fx: [{ k: 'grant', ab: 'pistol', cond: 'rangedOnly' }] },
          { name: "Steadfast Determination", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Feel No Pain 5+.", fx: [{ k: 'fnp', val: 5 }] },
          { name: "Siegecraft", cp: 1, type: "Strategic Ploy", when: 'oppCharge', targetSelf: true, desc: "-2 to enemy Charge rolls.", fx: [] }
        ]
      },
      "Pactbound Zealots": {
        // Marks of Chaos: when a unit makes a Dark Pact (and passes), its Mark grants an extra crit/reroll effect.
        // Wired through the pact* conditions (pactMeleeKhorne, pactRangedTzeentch, pactUndivided, etc.).
        rule: { name: "Marks of Chaos", desc: "Every unit takes a Mark (Khorne/Tzeentch/Nurgle/Slaanesh/Undivided). When it makes a Dark Pact, its Mark adds a bonus: Khorne crit-5+ melee, Tzeentch crit-5+ ranged, Nurgle crit-5+ ranged, Slaanesh crit-5+ melee, Undivided re-roll Hits of 1.",
          fx: [
            { k: 'critOn', val: 5, cond: 'pactMeleeKhorne', scope: 'army' },
            { k: 'critOn', val: 5, cond: 'pactRangedTzeentch', scope: 'army' },
            { k: 'critOn', val: 5, cond: 'pactRangedNurgle', scope: 'army' },
            { k: 'critOn', val: 5, cond: 'pactMeleeSlaanesh', scope: 'army' },
            { k: 'rerollHit', val: 1, cond: 'pactUndivided', scope: 'army' }
          ] },
        enhancements: [
          { name: "Eye of Tzeentch", pts: 15, restrict: "HERETIC ASTARTES TZEENTCH", desc: "CP on a high Dark Pact roll.", fx: [] },
          { name: "Intoxicating Elixir", pts: 15, restrict: "HERETIC ASTARTES SLAANESH", desc: "Feel No Pain 5+; Battle-shock on a hit enemy after a pact.", fx: [{ k: 'fnp', val: 5, selfOnly: true }] },
          { name: "Orbs of Unlife", pts: 15, restrict: "HERETIC ASTARTES NURGLE", desc: "Mortal wounds to nearby enemies after a pact.", fx: [] },
          { name: "Talisman of Burning Blood", pts: 15, restrict: "HERETIC ASTARTES KHORNE", desc: "+1 Attacks/Strength melee (D3 after a pact).", fx: [{ k: 'plusAttacksMelee', n: 1, selfOnly: true }, { k: 'plusStrMelee', n: 1, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Eye of the Gods", cp: 1, type: "Epic Deed", when: 'fight', targetSelf: true, desc: "Permanent +1 stats on a kill.", fx: [] },
          { name: "Eternal Hate", cp: 1, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "Destroyed models fight on (4+, +1 if Khorne).", fx: [{ k: 'fightOnDeath' }] },
          { name: "Profane Zeal", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Undivided unit re-rolls Wounds.", fx: [{ k: 'rerollWound', val: 'all' }] },
          { name: "Skinshift", cp: 1, type: "Epic Deed", when: 'command', targetSelf: true, desc: "Heal 3; return a Tzeentch model.", fx: [] },
          { name: "Torpefying Refrain", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Charge after Falling Back (Slaanesh: after Advancing too).", fx: [{ k: 'eligChargeAfterFallBack' }] },
          { name: "Festering Miasma", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Stealth; Nurgle shot only within 18\".", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12' }] }
        ]
      },
      "Chaos Cult": {
        rule: { name: "Desperate Devotion", desc: "Damned units can make a Desperate Pact (+2 Move, +2 Charge; Leadership test or D3 mortals). Traitor Guardsmen Squads gain Battleline. Desperate Pact is logged; the Stratagems work.", fx: [] },
        enhancements: [
          { name: "Amulet of Tainted Vigour", pts: 20, restrict: "DARK APOSTLE", desc: "Return D3 destroyed Damned models in Command.", fx: [] },
          { name: "Cultist\u2019s Brand", pts: 20, restrict: "DARK APOSTLE/DAMNED", desc: "Re-roll Advance and Charge for an all-Damned unit.", fx: [{ k: 'rerollCharge', selfOnly: true }, { k: 'rerollAdvance', selfOnly: true }] },
          { name: "Incendiary Goad", pts: 15, restrict: "DARK APOSTLE/DAMNED", desc: "+1 Strength (and +1 Attacks below half) to Damned melee.", fx: [] },
          { name: "Warped Foresight", pts: 10, restrict: "DARK APOSTLE/DAMNED", desc: "Share Scouts 6\" with the unit.", fx: [] }
        ],
        stratagems: [
          { name: "Chosen for Glory", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Re-roll Hits (Wounds too if the pact held).", fx: [{ k: 'rerollHit', val: 'all' }] },
          { name: "Selfless Demise", cp: 1, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "Destroyed Damned reflect mortal wounds (6).", fx: [] },
          { name: "Infernal Sacrifice", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "+1 Attacks (and +1 Strength if pact held), at the cost of mortals.", fx: [{ k: 'plusAttacksMelee', n: 1 }] },
          { name: "Crazed Focus", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "+1 AP (and +1 Strength if pact held).", fx: [{ k: 'plusApRanged', n: 1 }] },
          { name: "Reckless Haste", cp: 1, type: "Strategic Ploy", when: 'charge', targetSelf: true, desc: "Charge after Advancing.", fx: [{ k: 'eligChargeAfterAdvance' }] },
          { name: "Mortal Thralls", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "A Damned unit soaks Wounds for an HA unit.", fx: [] }
        ]
      },
      "Soulforged Warpack": {
        rule: { name: "Debt to the Soul Forge", desc: "When an HA Daemon Vehicle makes a Dark Pact it can invoke its contract (-1 to the Ld test): +1 Wound ranged, +2 Attacks melee. Approximated as +1 Wound for Vehicles while a Dark Pact is active.",
          fx: [{ k: 'addWound', n: 1, cond: 'pactActive+isVehicle', scope: 'army' }] },
        enhancements: [
          { name: "Forge\u2019s Blessing", pts: 20, restrict: "HERETIC ASTARTES", desc: "Grant a nearby Vehicle Feel No Pain 6+.", fx: [] },
          { name: "Invigorated Mechatendrils", pts: 15, restrict: "WARPSMITH", desc: "+4\" Move.", fx: [] },
          { name: "Tempting Addendum", pts: 25, restrict: "HERETIC ASTARTES", desc: "Re-roll Hits for a nearby contract-invoking Vehicle.", fx: [] },
          { name: "Soul Harvester", pts: 15, restrict: "HERETIC ASTARTES", desc: "CP when nearby enemies die.", fx: [] }
        ],
        stratagems: [
          { name: "Desperate Pledge", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Contract-invoking Vehicle gains +1 AP.", fx: [{ k: 'plusApRanged', n: 1, cond: 'isVehicle' }, { k: 'plusApMelee', n: 1, cond: 'isVehicle' }] },
          { name: "Glut of Souls", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Heal on kills.", fx: [] },
          { name: "Daemonic Possession", cp: 1, type: "Epic Deed", when: 'command', targetSelf: true, desc: "A Vehicle gains the DAEMON keyword.", fx: [] },
          { name: "Unstoppable Rampage", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Move through terrain.", fx: [] },
          { name: "Predatory Pursuit", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Make a 6\" Normal move toward the enemy.", fx: [{ k: 'extraMove', val: '6' }] },
          { name: "Feeding Frenzy", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Force Desperate Escape tests on Falling-Back enemies.", fx: [] }
        ]
      },
      "Cabal of Chaos": {
        rule: { name: "Empyric Wellspring", desc: "When a unit makes a Dark Pact, pick Leaping Warpflame (+1 ranged Strength near a friendly Psyker) or Monstrous Manifestation (+1 melee AP near a friendly Daemon Prince). Approximated as +1 ranged Strength while a Dark Pact is active and a Psyker is within 9\".",
          fx: [{ k: 'plusStrRanged', n: 1, cond: 'pactActive+within6OfAlly', scope: 'army' }] },
        enhancements: [
          { name: "Touched by the Warp", pts: 10, restrict: "HERETIC ASTARTES", desc: "Bearer gains PSYKER.", fx: [] },
          { name: "Eyes of Z\u2019desh", pts: 25, restrict: "HERETIC ASTARTES", desc: "Bearer's unit has Scouts 6\".", fx: [] },
          { name: "Mind Blade", pts: 25, restrict: "PSYKER", desc: "Unit's melee gain [LANCE].", fx: [{ k: 'grant', ab: 'lance', cond: 'meleeOnly', selfOnly: true }] },
          { name: "Infernal Avatar", pts: 20, restrict: "DAEMON PRINCE", desc: "+2 Strength, +1 AP to bearer's melee.", fx: [{ k: 'plusStrMelee', n: 2, selfOnly: true }, { k: 'plusApMelee', n: 1, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Baleful Blessing", cp: 1, type: "Epic Deed", when: 'anyPhase', targetSelf: true, desc: "Feel No Pain 5+ vs mortal wounds.", fx: [{ k: 'fnp', val: 5 }] },
          { name: "No Rest in Death", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Heal D3+1 / return D3 models.", fx: [] },
          { name: "Mutation\u2019s Curse", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Mortal wounds to a nearby enemy.", fx: [] },
          { name: "Soulseekers", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Ranged gain [IGNORES COVER].", fx: [{ k: 'grant', ab: 'ignorescover', cond: 'rangedOnly' }] },
          { name: "Unholy Haste", cp: 1, type: "Epic Deed", when: 'charge', targetSelf: true, desc: "Charge after Advancing.", fx: [{ k: 'eligChargeAfterAdvance' }] },
          { name: "Shroud of Chaos", cp: 1, type: "Battle Tactic", when: 'oppShoot', targetSelf: true, desc: "Nearby HA units gain Stealth.", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12' }] }
        ]
      },
      "Creations of Bile": {
        // Experimental Augmentations = an escalating-menu-style choice at battle start (panel). Mostly characteristic-
        // level; modelled as a chosen-augment set (bileAugments). The Stratagems work.
        rule: { name: "Experimental Augmentations", desc: "At battle start choose an augmentation (panel) for your Infantry: +1 melee Attacks, +2 Move, +1 melee WS, +1 Toughness, +1 melee Strength, or +1 ranged BS. (Characteristic-level; chosen via the panel.)", fx: [] },
        enhancements: [
          { name: "Surgical Precision", pts: 10, restrict: "HERETIC ASTARTES", desc: "Bearer's melee gain [PRECISION].", fx: [{ k: 'grant', ab: 'precision', cond: 'meleeOnly', selfOnly: true }] },
          { name: "Living Carapace", pts: 15, restrict: "CHAOS LORD", desc: "+1 Wound; Feel No Pain 5+.", fx: [{ k: 'fnp', val: 5, selfOnly: true }] },
          { name: "Helm of All-seeing", pts: 25, restrict: "HERETIC ASTARTES INFANTRY", desc: "Block enemy Reserves within 12\".", fx: [] },
          { name: "Prime Test Subject", pts: 35, restrict: "HERETIC ASTARTES INFANTRY", desc: "+1 melee Damage; re-roll melee Hits.", fx: [{ k: 'rerollHit', val: 'all', cond: 'meleeOnly', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Monstrous Visages", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Attackers -1 to Hit.", fx: [{ k: 'subIncomingHit', n: 1 }] },
          { name: "Masters Are Watching", cp: 1, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "Destroyed models fight on (4+).", fx: [{ k: 'fightOnDeath' }] },
          { name: "Specimens for the Spider", cp: 2, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Re-roll Wounds vs Characters; Battle-shock on a kill.", fx: [{ k: 'rerollWound', val: 'all', cond: 'targetCharacter' }] },
          { name: "Delayed Mutations", cp: 2, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Add another augmentation at the cost of mortals.", fx: [] },
          { name: "Diabolic Regeneration", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Return destroyed models.", fx: [] },
          { name: "Autostimulants", cp: 1, type: "Strategic Ploy", when: 'charge', targetSelf: true, desc: "Charge after Advancing.", fx: [{ k: 'eligChargeAfterAdvance' }] }
        ]
      },
      "Nightmare Hunt": {
        // Terror Made Manifest: terror Battle-shock (-1) + below-half/Battle-shock combat bonuses, all army-wide.
        rule: { name: "Terror Made Manifest", desc: "Below-strength enemies within 12\" must take a Battle-shock test (at -1). +1 Hit vs below-half targets; -1 to be hit by Battle-shocked attackers; +1 Wound vs Battle-shocked targets.",
          fx: [
            { k: 'addHit', n: 1, cond: 'targetBelowHalf', scope: 'army' },
            { k: 'addWound', n: 1, cond: 'targetBattleshocked', scope: 'army' },
            { k: 'subIncomingHit', n: 1, cond: 'attackerBattleshocked', scope: 'army' }
          ] },
        enhancements: [
          { name: "Greyveil Hex", pts: 25, restrict: "CHAOS LORD", desc: "Stealth; shot only within 18\" while on an objective.", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12', selfOnly: true }] },
          { name: "Warp-fuelled Thrusters", pts: 20, restrict: "CHAOS LORD JUMP PACK", desc: "Redeploy to Reserves end of opponent's Fight phase.", fx: [] },
          { name: "Terrorglut Parasite", pts: 20, restrict: "HERETIC ASTARTES", desc: "Battle-shock (-1) on enemies in Engagement at Fight start.", fx: [] },
          { name: "Sorrowscent Vulture", pts: 35, restrict: "CHAOS LORD JUMP PACK", desc: "Scouts 6\"; attach to Warp Talons.", fx: [] }
        ],
        stratagems: [
          { name: "Talons Sunk Deep", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "+1 AP vs Battle-shocked / below-half.", fx: [{ k: 'plusApMelee', n: 1, cond: 'targetBattleshocked' }, { k: 'plusApRanged', n: 1, cond: 'targetBattleshocked' }] },
          { name: "Prey on the Weak", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Re-roll Hits vs Battle-shocked / below-half.", fx: [{ k: 'rerollHit', val: 'all', cond: 'targetBattleshocked' }] },
          { name: "Sadistic Display", cp: 1, type: "Epic Deed", when: 'fight', targetSelf: true, desc: "Battle-shock nearby enemies on a kill.", fx: [] },
          { name: "Malicious Surge", cp: 1, type: "Strategic Ploy", when: 'charge', targetSelf: true, desc: "Charge after Advancing.", fx: [{ k: 'eligChargeAfterAdvance' }] },
          { name: "Relentless Terror", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot and charge after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Horrific Incursion", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Battle-shock (-1) a nearby enemy after arriving.", fx: [] }
        ]
      },
      "Huron\u2019s Marauders": {
        rule: { name: "Tyrannical Motivation", desc: "Each Command phase pick Huron's Elite (+1 to Hit) or Mobile Marauders (shoot/charge after Falling Back) for your Infantry; near Huron a unit gets both. Approximated as +1 to Hit army-wide.",
          fx: [{ k: 'addHit', n: 1, scope: 'army' }] },
        enhancements: [
          { name: "Voice of the Tyrant", pts: 25, restrict: "HERETIC ASTARTES", desc: "Bearer's unit gets both Tyrannical Motivation abilities.", fx: [{ k: 'eligShootAfterFallBack', selfOnly: true }, { k: 'eligChargeAfterFallBack', selfOnly: true }] },
          { name: "Raid Leader", pts: 20, restrict: "HERETIC ASTARTES", desc: "Charge after disembarking from a moving transport.", fx: [] },
          { name: "Dread Reputation", pts: 25, restrict: "HERETIC ASTARTES", desc: "Battle-shock nearby enemies when set up.", fx: [] },
          { name: "Eager for Bloodshed", pts: 30, restrict: "HERETIC ASTARTES", desc: "Bearer has Infiltrators.", fx: [] }
        ],
        stratagems: [
          { name: "Hardened Killers", cp: 1, type: "Battle Tactic", when: 'command', targetSelf: true, desc: "Buff a Damned unit (BS / Attacks / Save).", fx: [] },
          { name: "At the Tyrant\u2019s Command", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot and charge after Advancing.", fx: [{ k: 'eligShootAfterAdvance' }, { k: 'eligChargeAfterAdvance' }] },
          { name: "Seize the Prize", cp: 1, type: "Battle Tactic", when: 'movement', targetSelf: true, desc: "Auto-Advance +6\" Move.", fx: [{ k: 'extraMove', val: '6' }] },
          { name: "Reavers\u2019 Flurry", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "+1 Attacks melee for a charging unit.", fx: [{ k: 'plusAttacksMelee', n: 1, cond: 'chargedThisTurn' }] },
          { name: "To the Favoured the Spoils", cp: 1, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Make a D6\" Surge move.", fx: [{ k: 'extraMove', dice: 'D6' }] },
          { name: "Encircling Surge", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull a unit into Reserves.", fx: [{ k: 'toReserves' }] }
        ]
      },
      "Renegade Warband": {
        // Slaves to None: lose Dark Pacts, gain [ASSAULT]. Vendetta marks one enemy for Hit re-rolls (Oath reuse).
        rule: { name: "Slaves to None", desc: "Your army loses Dark Pacts; ranged weapons gain [ASSAULT]. Vendetta: name an enemy each Command phase (use the Oath chooser) to re-roll Hits against it.",
          fx: [{ k: 'grant', ab: 'assault', cond: 'rangedOnly', scope: 'army' }, { k: 'rerollHit', val: 'all', cond: 'targetIsOath', scope: 'army' }] },
        enhancements: [
          { name: "Weaponised Hatred", pts: 35, restrict: "HERETIC ASTARTES", desc: "Name a new Vendetta target when one dies.", fx: [] },
          { name: "Eyes of the Hunter", pts: 15, restrict: "HERETIC ASTARTES", desc: "Unit's ranged gain [IGNORES COVER].", fx: [{ k: 'grant', ab: 'ignorescover', cond: 'rangedOnly', selfOnly: true }] },
          { name: "Fratricidal Trophies", pts: 5, restrict: "HERETIC ASTARTES TERMINATOR", desc: "Re-roll Hits after Defaulting to Doctrine.", fx: [] },
          { name: "Empyric Symbiote", pts: 15, restrict: "HERETIC ASTARTES", desc: "+1 Advance and Charge.", fx: [{ k: 'rerollCharge', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Never Outgunned", cp: 1, type: "Epic Deed", when: 'shootOrFight', targetSelf: true, desc: "Weapons gain [LETHAL HITS] or [SUSTAINED HITS 1].", fx: [{ k: 'grant', ab: 'lethal' }] },
          { name: "Vengeful Destruction", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "+1 Wound vs Vendetta target.", fx: [{ k: 'addWound', n: 1, cond: 'targetIsOath' }] },
          { name: "Undying Hatred", cp: 1, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "Destroyed models fight on (4+).", fx: [{ k: 'fightOnDeath' }] },
          { name: "Renegade Claim", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Hold an objective stickily.", fx: [{ k: 'stickyObjective', cond: 'selfOnHeldObjective' }] },
          { name: "Corrupted Munitions", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "+1 AP ranged.", fx: [{ k: 'plusApRanged', n: 1 }] },
          { name: "Reavers\u2019 Reaction", cp: 1, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Make a D6\" Normal move.", fx: [{ k: 'extraMove', dice: 'D6' }] }
        ]
      },
      "Warpstrike Champions": {
        rule: { name: "Warp Portals", desc: "At the end of your opponent's turn, pull Terminator/Obliterator/Mutilator units into Strategic Reserves to redeploy. (Army-composition / reserve manoeuvre; the Stratagems work.)", fx: [] },
        enhancements: [
          { name: "Infernal Fulgurite", pts: 20, restrict: "HERETIC ASTARTES", desc: "0CP Rapid Ingress once/battle.", fx: [] },
          { name: "Eye of the Warp", pts: 15, restrict: "HERETIC ASTARTES", desc: "Re-roll Charge after Deep Strike.", fx: [{ k: 'rerollCharge', cond: 'setUpThisTurn', selfOnly: true }] },
          { name: "Akshur\u2019s Binding Runes", pts: 20, restrict: "HERETIC ASTARTES", desc: "Flexible Deep Strike timing.", fx: [{ k: 'grantDeepStrike', selfOnly: true }] },
          { name: "Tzagulla", pts: 25, restrict: "HERETIC ASTARTES", desc: "+1 Attacks/Strength/AP; +1 Damage on arrival.", fx: [{ k: 'plusStrMelee', n: 1, selfOnly: true }, { k: 'plusApMelee', n: 1, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Empyric Dislocation", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Incoming attacks worsen AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Armour of Corruption", cp: 2, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "Incoming attacks -1 Damage.", fx: [{ k: 'reduceIncomingDmg', n: 1 }] },
          { name: "Warp Flicker", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot and charge after Advancing.", fx: [{ k: 'eligShootAfterAdvance' }, { k: 'eligChargeAfterAdvance' }] },
          { name: "Warp-tainted", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Hold an objective stickily.", fx: [{ k: 'stickyObjective', cond: 'selfOnHeldObjective' }] },
          { name: "Siegebreaker Strike", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Deep-Struck units' ranged gain [IGNORES COVER].", fx: [{ k: 'grant', ab: 'ignorescover', cond: 'rangedOnly+setUpThisTurn' }] },
          { name: "Portal of Spite", cp: 1, type: "Battle Tactic", when: 'charge', targetSelf: true, desc: "+2 Charge when targeting the closest enemy after Deep Strike.", fx: [] }
        ]
      },
      "Cult of the Arkifane": {
        rule: { name: "Soul Forge Boons", desc: "Heretic Astartes Vehicles gain the DAEMON keyword; Vehicles / Lord Discordant / Vashtorr gain SOUL FORGE; Soul Forge units have a 5+ invulnerable save.",
          fx: [{ k: 'invuln', val: 5, defensive: true, cond: 'isVehicle', scope: 'army' }] },
        enhancements: [
          { name: "Wyredjinn", pts: 25, restrict: "HERETIC ASTARTES", desc: "Chance of 1CP each Command phase.", fx: [] },
          { name: "Cybinfernal Font", pts: 20, restrict: "HERETIC ASTARTES", desc: "Bearer's unit gains SOUL FORGE.", fx: [] },
          { name: "Mark of the Soul Forges", pts: 20, restrict: "HERETIC ASTARTES", desc: "Critical Hit on 5+.", fx: [{ k: 'critOn', val: 5, selfOnly: true }] },
          { name: "Crown of Worms", pts: 15, restrict: "WARPSMITH", desc: "+3\" to Warpsmith abilities.", fx: [] }
        ],
        stratagems: [
          { name: "Touch of the Arkifane", cp: 1, type: "Battle Tactic", when: 'anyPhase', targetSelf: true, desc: "Dark Pact grants both weapon abilities.", fx: [] },
          { name: "Balefire Boon", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Soul Forge unit gains +1 AP.", fx: [{ k: 'plusApRanged', n: 1 }, { k: 'plusApMelee', n: 1 }] },
          { name: "Soul-tally Offering", cp: 2, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Re-roll Wounds vs Character/Monster/Vehicle.", fx: [{ k: 'rerollWound', val: 'all', cond: 'targetMonsterVehicle' }] },
          { name: "Biomechanoid Regeneration", cp: 1, type: "Epic Deed", when: 'command', targetSelf: true, desc: "Heal a model.", fx: [] },
          { name: "Forge-fire Surge", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot (Soul Forge: and charge) after Advancing.", fx: [{ k: 'eligShootAfterAdvance' }] },
          { name: "Unholy Fortitude", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "+1 Toughness.", fx: [] }
        ]
      }
    }
  },

  "Adeptus Custodes": {
    // Army rule Martial Ka'tah is an on-fight round-pick stance (reuses the doctrine-pick machinery via armyRule.choices):
    // Dacatarai -> melee [SUSTAINED HITS 1]; Rendax -> melee [LETHAL HITS]. The doctrine:<id> conditions resolve generically.
    armyRule: {
      name: "Martial Ka\u2019tah",
      desc: "Each Command phase (panel) pick a Ka'tah Stance for the round: Dacatarai (melee [SUSTAINED HITS 1]) or Rendax (melee [LETHAL HITS]).",
      fx: [],
      choices: [
        { id: 'dacatarai', name: "Dacatarai Stance", desc: "Melee weapons have [SUSTAINED HITS 1].", fx: [{ k: 'grant', ab: 'sustained', val: 1, cond: 'meleeOnly+doctrine:dacatarai', scope: 'army' }] },
        { id: 'rendax', name: "Rendax Stance", desc: "Melee weapons have [LETHAL HITS].", fx: [{ k: 'grant', ab: 'lethal', cond: 'meleeOnly+doctrine:rendax', scope: 'army' }] }
      ],
      choiceLabel: "Ka'tah Stance"
    },
    restrictions: ["Adeptus Custodes army. Pick a Ka'tah Stance each Command phase via the panel."],
    detachments: {
      "Talons of the Emperor": {
        rule: { name: "Revered Companions", desc: "Anathema Psykana give a Null Aegis aura (FNP 5+ vs Psychic/mortal to nearby Custodes); other Custodes give Deadly Unity (+1 Hit to nearby Anathema Psykana). Allied-unit aura, approximated; the Stratagems work.", fx: [] },
        enhancements: [
          { name: "Aegis Projector", pts: 20, restrict: "ADEPTUS CUSTODES", desc: "Once/turn change a failed-save attack's Damage to 0.", fx: [] },
          { name: "Champion of the Imperium", pts: 25, restrict: "ADEPTUS CUSTODES", desc: "Aura range to 9\".", fx: [] },
          { name: "Gift of Terran Artifice", pts: 15, restrict: "ADEPTUS CUSTODES", desc: "+1 Wound on melee.", fx: [{ k: 'addWound', n: 1, cond: 'meleeOnly', selfOnly: true }] },
          { name: "Radiant Mantle", pts: 30, restrict: "ADEPTUS CUSTODES", desc: "-1 to be hit by attackers within 12\".", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Hunt as One", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot/charge after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Talons Interlocked", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "+1 Str/+1 AP ranged on a shared target.", fx: [{ k: 'plusStrRanged', n: 1 }, { k: 'plusApRanged', n: 1 }] },
          { name: "Empyric Severance", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "FNP 4+ vs Psychic/mortal.", fx: [{ k: 'fnp', val: 4 }] },
          { name: "Emperor\u2019s Executioners", cp: 2, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "+1 Wound vs below-strength.", fx: [{ k: 'addWound', n: 1, cond: 'targetBelowStrength' }] },
          { name: "Taloned Pincer", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Make a 6\" Normal move.", fx: [{ k: 'extraMove', val: '6' }] },
          { name: "Shield of Honour", cp: 1, type: "Epic Deed", when: 'oppShoot', targetSelf: true, desc: "Redirect attacks from an Anathema unit.", fx: [] }
        ]
      },
      "Shield Host": {
        // Martial Mastery is a second round-pick layered on top of Martial Ka'tah; modelled as detachment doctrines
        // (its own selectable list) granting crit-5+ or +1 AP to Ka'tah users.
        rule: { name: "Martial Mastery", desc: "Each round pick (panel) one: melee crit on 5+, or +1 melee AP, for Custodes with Martial Ka'tah.", fx: [] },
        doctrines: [
          { id: 'mm_crit', name: "Honed Killers", desc: "Melee crit on unmodified 5+.", fx: [{ k: 'critOn', val: 5, cond: 'meleeOnly+doctrine:mm_crit', scope: 'army' }] },
          { id: 'mm_ap', name: "Perfected Strikes", desc: "+1 AP to melee.", fx: [{ k: 'plusApMelee', n: 1, cond: 'doctrine:mm_ap', scope: 'army' }] }
        ],
        doctrineLabel: "Martial Mastery",
        enhancements: [
          { name: "Auric Mantle", pts: 15, restrict: "SHIELD-CAPTAIN/BLADE CHAMPION", desc: "+2 Wounds.", fx: [] },
          { name: "Castellan\u2019s Mark", pts: 20, restrict: "SHIELD-CAPTAIN", desc: "Redeploy up to two units after deployment.", fx: [] },
          { name: "From the Hall of Armouries", pts: 25, restrict: "SHIELD-CAPTAIN", desc: "+1 Str/+1 Damage melee.", fx: [{ k: 'plusStrMelee', n: 1, selfOnly: true }] },
          { name: "Panoptispex", pts: 5, restrict: "SHIELD-CAPTAIN/BLADE CHAMPION", desc: "Unit's ranged gain [IGNORES COVER].", fx: [{ k: 'grant', ab: 'ignorescover', cond: 'rangedOnly', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Arcane Genetic Alchemy", cp: 1, type: "Battle Tactic", when: 'anyPhase', targetSelf: true, desc: "FNP 4+ vs mortal wounds.", fx: [{ k: 'fnp', val: 4 }] },
          { name: "Avenge the Fallen", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "+1 Attacks melee (below-half: +2).", fx: [{ k: 'plusAttacksMelee', n: 1 }] },
          { name: "Unwavering Sentinels", cp: 1, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "-1 to be hit in melee on a held objective.", fx: [{ k: 'subIncomingHit', n: 1, cond: 'meleeOnly' }] },
          { name: "Multipotentiality", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot/charge after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Vigilance Eternal", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Hold an objective stickily.", fx: [{ k: 'stickyObjective', cond: 'selfOnHeldObjective' }] },
          { name: "Archeotech Munitions", cp: 1, type: "Wargear", when: 'shooting', targetSelf: true, desc: "Ranged gain [LETHAL HITS] or [SUSTAINED HITS 1].", fx: [{ k: 'grant', ab: 'lethal', cond: 'rangedOnly' }] }
        ]
      },
      "Null Maiden Vigil": {
        // Creeping Dread is a Battle-shock aura (Psyker/below-strength enemies within 12" must test). Reuses haTerror-style;
        // wired as a Custodes-specific terror flag.
        rule: { name: "Creeping Dread", desc: "Psyker or below-strength enemies within 12\" of an Anathema Psykana unit must take a Battle-shock test (below-half: at -1).", fx: [] },
        enhancements: [
          { name: "Enhanced Voidsheen Cloak", pts: 10, restrict: "ANATHEMA PSYKANA", desc: "-1 Damage incoming (Psyker/Battle-shocked: Damage to 1).", fx: [{ k: 'reduceIncomingDmg', n: 1, selfOnly: true }] },
          { name: "Huntress\u2019 Eye", pts: 15, restrict: "ANATHEMA PSYKANA", desc: "Battle-shock a nearby enemy in Command.", fx: [] },
          { name: "Oblivion Knight", pts: 25, restrict: "ANATHEMA PSYKANA", desc: "+1 Hit (+1 Wound vs Psykers).", fx: [{ k: 'addHit', n: 1, selfOnly: true }, { k: 'addWound', n: 1, cond: 'targetPsyker', selfOnly: true }] },
          { name: "Raptor Blade", pts: 5, restrict: "ANATHEMA PSYKANA", desc: "+1 Attacks/Str/Damage melee.", fx: [{ k: 'plusStrMelee', n: 1, selfOnly: true }, { k: 'plusAttacksMelee', n: 1, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Desperation\u2019s Price", cp: 1, type: "Strategic Ploy", when: 'anyPhase', targetSelf: true, desc: "Battle-shock / mortals on an enemy Psyker.", fx: [] },
          { name: "Witch Hunters", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Weapons gain [LETHAL HITS] vs Psykers.", fx: [{ k: 'grant', ab: 'lethal', cond: 'targetPsyker' }] },
          { name: "Anathema Blademastery", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Re-roll Hits (Wounds vs Psyker/Battle-shocked).", fx: [{ k: 'rerollHit', val: 'all', cond: 'meleeOnly' }, { k: 'rerollWound', val: 'all', cond: 'targetPsyker' }] },
          { name: "Psy-chaff Volley", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Mark a hit enemy 'prosecuted'.", fx: [] },
          { name: "Purgation Sweep", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "+1 Torrent Attacks (vs Psyker/Battle-shocked: +2).", fx: [] },
          { name: "Psychic Abominations", cp: 1, type: "Strategic Ploy", when: 'oppShoot', targetSelf: true, desc: "Stealth; Psyker/Battle-shocked shoot only within 12\".", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12' }] }
        ]
      },
      "Auric Champions": {
        // Assemblage of Might = mark one enemy each Command phase; +1 Wound for Custodes CHARACTERs vs it. Reuses oathTarget.
        rule: { name: "Assemblage of Might", desc: "Each Command phase name one enemy unit (Oath chooser): Custodes Character attacks vs it get +1 Wound.",
          fx: [{ k: 'addWound', n: 1, cond: 'targetIsOath+characterLeading', scope: 'army' }] },
        enhancements: [
          { name: "Blade Imperator", pts: 25, restrict: "ADEPTUS CUSTODES", desc: "Mortal wounds / Battle-shock on a charge.", fx: [] },
          { name: "Inspirational Exemplar", pts: 10, restrict: "ADEPTUS CUSTODES", desc: "Ld 5+; clear a nearby unit's Battle-shock.", fx: [] },
          { name: "Martial Philosopher", pts: 30, restrict: "ADEPTUS CUSTODES", desc: "Shoot/charge after Falling Back.", fx: [{ k: 'eligShootAfterFallBack', selfOnly: true }, { k: 'eligChargeAfterFallBack', selfOnly: true }] },
          { name: "Veiled Blade", pts: 25, restrict: "ADEPTUS CUSTODES", desc: "+2 Attacks melee.", fx: [{ k: 'plusAttacksMelee', n: 2, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Slayer of Champions", cp: 1, type: "Epic Deed", when: 'anyPhase', targetSelf: true, desc: "Name a new marked target after a kill.", fx: [] },
          { name: "Superhuman Reserves", cp: 2, type: "Epic Deed", when: 'anyPhase', targetSelf: true, desc: "Reuse a once-per-battle ability.", fx: [] },
          { name: "The Emperor\u2019s Auspice", cp: 1, type: "Epic Deed", when: 'targeted', targetSelf: true, desc: "Characters gain FNP 4+.", fx: [{ k: 'fnp', val: 4, cond: 'characterLeading' }] },
          { name: "Earning of a Name", cp: 1, type: "Epic Deed", when: 'fight', targetSelf: true, desc: "Re-roll Hits/Wounds vs Monster/Vehicle.", fx: [{ k: 'rerollHit', val: 'all', cond: 'targetMonsterVehicle' }, { k: 'rerollWound', val: 'all', cond: 'targetMonsterVehicle' }] },
          { name: "Vigil Unending", cp: 2, type: "Epic Deed", when: 'fight', targetSelf: true, desc: "A destroyed Character fights on.", fx: [{ k: 'fightOnDeath' }] },
          { name: "Shoulder the Mantle", cp: 1, type: "Epic Deed", when: 'movement', targetSelf: true, desc: "Attach a loose Character to a unit.", fx: [] }
        ]
      },
      "Solar Spearhead": {
        rule: { name: "Auric Armour", desc: "Custodes Vehicles at full strength get +2 OC; below strength re-roll Hits of 1; below half re-roll Hits and Wounds of 1. Walkers get +2\" Move and +1 Advance/Charge.",
          fx: [
            { k: 'objControl', n: 2, cond: 'isVehicle+selfAtStartingStrength', scope: 'army' },
            { k: 'rerollHit', val: 1, cond: 'isVehicle+selfBelowStrength', scope: 'army' },
            { k: 'rerollWound', val: 1, cond: 'isVehicle+selfBelowHalf', scope: 'army' }
          ] },
        enhancements: [
          { name: "Adamantine Talisman", pts: 25, restrict: "ADEPTUS CUSTODES", desc: "+1 Attacks/Str/Damage melee.", fx: [{ k: 'plusStrMelee', n: 1, selfOnly: true }, { k: 'plusAttacksMelee', n: 1, selfOnly: true }] },
          { name: "Augury Uplink", pts: 35, restrict: "ADEPTUS CUSTODES", desc: "Feel No Pain 5+.", fx: [{ k: 'fnp', val: 5, selfOnly: true }] },
          { name: "Honoured Fallen", pts: 15, restrict: "ADEPTUS CUSTODES VEHICLE", desc: "Nearby Custodes re-roll Hits of 1.", fx: [] },
          { name: "Veteran of the Kataphraktoi", pts: 10, restrict: "ADEPTUS CUSTODES", desc: "Grant a nearby Vehicle/Mounted unit fall-back shooting.", fx: [] }
        ],
        stratagems: [
          { name: "Flawless Construction", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Vehicle: -1 Wound when S>T.", fx: [{ k: 'subIncomingWound', n: 1, cond: 'strHigherThanT' }] },
          { name: "Emperor\u2019s Vengeance", cp: 1, type: "Battle Tactic", when: 'fightTargeted', targetSelf: true, desc: "Destroyed models fight on (Walker: +1).", fx: [{ k: 'fightOnDeath' }] },
          { name: "Wrathful Advance", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Pile-in up to D3+3\".", fx: [] },
          { name: "Unstoppable", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Move through terrain.", fx: [] },
          { name: "Relentless Persecution", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot (Walker: and charge) after Advancing.", fx: [{ k: 'eligShootAfterAdvance' }] },
          { name: "Punishment Inescapable", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Ranged gain [IGNORES COVER]; ignore Hit modifiers.", fx: [{ k: 'grant', ab: 'ignorescover', cond: 'rangedOnly' }, { k: 'ignoreModifiers' }] }
        ]
      },
      "Lions of the Emperor": {
        // Against All Odds: a lone Custodes unit (no friends within 6") gets +1 Hit and +1 Wound. Reuses the new selfAlone cond.
        rule: { name: "Against All Odds", desc: "Each time a Custodes model (excluding Vehicles) attacks, if no friendly units are within 6\", add 1 to the Hit roll and 1 to the Wound roll.",
          fx: [{ k: 'addHit', n: 1, cond: 'selfAlone', scope: 'army' }, { k: 'addWound', n: 1, cond: 'selfAlone', scope: 'army' }] },
        enhancements: [
          { name: "Superior Creation", pts: 25, restrict: "ADEPTUS CUSTODES INFANTRY", desc: "Return to play once when destroyed.", fx: [] },
          { name: "Praesidius", pts: 25, restrict: "ADEPTUS CUSTODES", desc: "Lone Operative and Stealth.", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12', selfOnly: true }] },
          { name: "Fierce Conqueror", pts: 15, restrict: "SHIELD-CAPTAIN", desc: "+2 Attacks per 5 nearby enemies.", fx: [{ k: 'plusAttacksMelee', n: 2, selfOnly: true }] },
          { name: "Admonimortis", pts: 10, restrict: "SHIELD-CAPTAIN", desc: "+3 Str, +1 AP/+1 Damage melee.", fx: [{ k: 'plusStrMelee', n: 3, selfOnly: true }, { k: 'plusApMelee', n: 1, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Gilded Champion", cp: 1, type: "Strategic Ploy", when: 'anyPhase', targetSelf: true, desc: "Reuse a once-per-battle ability.", fx: [] },
          { name: "Defiant to the Last", cp: 1, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "Destroyed models fight on (Character: +2).", fx: [{ k: 'fightOnDeath' }] },
          { name: "Peerless Warrior", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Melee gain [PRECISION].", fx: [{ k: 'grant', ab: 'precision', cond: 'meleeOnly' }] },
          { name: "Unleash the Lions", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Split a Terminator unit into single models.", fx: [] },
          { name: "Manoeuvre and Fire", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot/charge after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Swift as the Eagle", cp: 1, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Make a D6\" Normal move.", fx: [{ k: 'extraMove', dice: 'D6' }] }
        ]
      }
    }
  },

  "Adeptus Titanicus": {
    // Towering Example skips the detachment step entirely and lets a non-CHARACTER model be Warlord. Super-heavy Walker
    // is the only mechanical army-wide effect we model (movement is AI-abstracted). Minimal stub, no detachments.
    armyRule: {
      name: "Towering Example",
      desc: "Adeptus Titanicus armies skip the detachment step; pick any model as Warlord. Titans are Super-heavy Walkers (move over models and terrain \u22644\" tall). Designed for apocalyptic-scale battles well above normal points.",
      fx: []
    },
    restrictions: ["Adeptus Titanicus army. No detachment is selected (Towering Example). Titanicus Traitoris swaps IMPERIUM for CHAOS."],
    detachments: {
      "Towering Example": {
        rule: { name: "Towering Example", desc: "No detachment rule — Titans fight under the army rule alone. Super-heavy Walker movement is abstracted by the engine.", fx: [] },
        enhancements: [],
        stratagems: []
      }
    }
  },

  "Adeptus Mechanicus": {
    // Army rule Doctrina Imperatives is a round-pick (reuses the generic stance matcher via armyRule.choices):
    // Protector -> ranged [HEAVY] + ~+1 BS (addHit ranged) + -1 to be hit in melee; Conqueror -> ranged [ASSAULT] +
    // ~+1 WS (addHit melee) + +1 AP. The Battleline-proximity rider is approximated by the unit's own BATTLELINE keyword.
    armyRule: {
      name: "Doctrina Imperatives",
      desc: "Each round (panel) pick a Doctrina Imperative: Protector (ranged [HEAVY], +1 to ranged Hit, and -1 to be hit in melee for Battleline) or Conqueror (ranged [ASSAULT], +1 to melee Hit, and +1 AP for Battleline).",
      fx: [],
      choices: [
        { id: 'protector', name: "Protector Imperative", desc: "Ranged [HEAVY]; +1 to ranged Hit; Battleline -1 to be hit in melee.",
          fx: [
            { k: 'grant', ab: 'heavy', cond: 'rangedOnly+doctrine:protector', scope: 'army' },
            { k: 'addHit', n: 1, cond: 'rangedOnly+doctrine:protector', scope: 'army' },
            { k: 'subIncomingHit', n: 1, defensive: true, cond: 'meleeOnly+doctrine:protector+unitBattleline', scope: 'army' }
          ] },
        { id: 'conqueror', name: "Conqueror Imperative", desc: "Ranged [ASSAULT]; +1 to melee Hit; Battleline +1 AP.",
          fx: [
            { k: 'grant', ab: 'assault', cond: 'rangedOnly+doctrine:conqueror', scope: 'army' },
            { k: 'addHit', n: 1, cond: 'meleeOnly+doctrine:conqueror', scope: 'army' },
            { k: 'plusApRanged', n: 1, cond: 'doctrine:conqueror+unitBattleline', scope: 'army' },
            { k: 'plusApMelee', n: 1, cond: 'doctrine:conqueror+unitBattleline', scope: 'army' }
          ] }
      ],
      choiceLabel: "Doctrina Imperative"
    },
    restrictions: ["Adeptus Mechanicus army. Pick a Doctrina Imperative each round via the panel."],
    detachments: {
      "Rad-Zone Corps": {
        rule: { name: "Rad-bombardment", desc: "Battle-round 1: enemies in their deployment zone take mortal wounds / Battle-shock. Rounds 2+: a Fallout mortal-wound + Battle-shock check on enemies in their zone. (Mission-scale bombardment; logged, not auto-applied. The Imperative pick and Stratagems work.)", fx: [] },
        enhancements: [
          { name: "Radial Suffusion", pts: 25, restrict: "ADEPTUS MECHANICUS", desc: "Extend Fallout to enemies near their zone.", fx: [] },
          { name: "Malphonic Susurrus", pts: 20, restrict: "ADEPTUS MECHANICUS", desc: "Bearer's unit has Stealth.", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12', selfOnly: true }] },
          { name: "Peerless Eradicator", pts: 20, restrict: "ADEPTUS MECHANICUS", desc: "Unit's ranged gain [SUSTAINED HITS 1].", fx: [{ k: 'grant', ab: 'sustained', val: 1, cond: 'rangedOnly', selfOnly: true }] },
          { name: "Autoclavic Denunciation", pts: 15, restrict: "ADEPTUS MECHANICUS", desc: "Bearer's ranged gain [ANTI-INFANTRY 2+] / [ANTI-MONSTER 4+].", fx: [{ k: 'antiVal', kw: 'INFANTRY', val: 2, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Baleful Halo", cp: 2, type: "Battle Tactic", when: 'fightTargeted', targetSelf: true, desc: "Attackers -1 Wound.", fx: [{ k: 'subIncomingWound', n: 1 }] },
          { name: "Extinction Order", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Mortal wounds / Battle-shock on enemies near an objective.", fx: [] },
          { name: "Aggressor Imperative", cp: 1, type: "Battle Tactic", when: 'movement', targetSelf: true, desc: "Auto-Advance +6\" Move.", fx: [{ k: 'extraMove', val: '6' }] },
          { name: "Pre-calibrated Purge Solution", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Re-roll Hits vs enemies in their deployment zone.", fx: [{ k: 'rerollHit', val: 'all' }] },
          { name: "Lethal Dosage", cp: 1, type: "Wargear", when: 'shooting', targetSelf: true, desc: "Ranged gain [LETHAL HITS].", fx: [{ k: 'grant', ab: 'lethal', cond: 'rangedOnly' }] },
          { name: "Bulwark Imperative", cp: 2, type: "Battle Tactic", when: 'oppShoot', targetSelf: true, desc: "4+ invulnerable save.", fx: [{ k: 'invuln', val: 4, defensive: true }] }
        ]
      },
      "Skitarii Hunter Cohort": {
        rule: { name: "Stealth Optimisation", desc: "Skitarii Infantry/Mounted and Ironstrider Ballistarii have Stealth; ranged attacks on Sicarian units beyond 12\" face the Benefit of Cover. (Stealth approximated as -1 to be hit from beyond 12\".)",
          fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12', scope: 'army' }] },
        enhancements: [
          { name: "Cantic Thrallnet", pts: 25, restrict: "SKITARII MARSHAL", desc: "Both Imperatives active for a nearby unit.", fx: [] },
          { name: "Clandestine Infiltrator", pts: 20, restrict: "SKITARII", desc: "Infiltrators and Scouts 6\".", fx: [] },
          { name: "Veiled Hunter", pts: 10, restrict: "SKITARII MARSHAL", desc: "Redeploy up to three units after deployment.", fx: [] },
          { name: "Battle-sphere Uplink", pts: 30, restrict: "SKITARII", desc: "Make a 6\" move after shooting.", fx: [] }
        ],
        stratagems: [
          { name: "Bionic Endurance", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Feel No Pain 5+.", fx: [{ k: 'fnp', val: 5 }] },
          { name: "Binharic Offence", cp: 2, type: "Strategic Ploy", when: 'shootOrFight', targetSelf: true, desc: "+1 AP on a shared target.", fx: [{ k: 'plusApRanged', n: 1 }, { k: 'plusApMelee', n: 1 }] },
          { name: "Expedited Purge Protocol", cp: 1, type: "Strategic Ploy", when: 'charge', targetSelf: true, desc: "Charge after Advancing.", fx: [{ k: 'eligChargeAfterAdvance' }] },
          { name: "Isolate and Destroy", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "+1 Wound vs isolated targets.", fx: [{ k: 'addWound', n: 1 }] },
          { name: "Shroud Protocols", cp: 1, type: "Strategic Ploy", when: 'oppShoot', targetSelf: true, desc: "Shot only within 18\".", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12' }] },
          { name: "Programmed Withdrawal", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull units into Reserves.", fx: [{ k: 'toReserves' }] }
        ]
      },
      "Data-Psalm Conclave": {
        // Benedictions of the Omnissiah is a battle-start pick for Cult Mechanicus; modelled as detachment doctrines.
        rule: { name: "Benedictions of the Omnissiah", desc: "At battle start pick (panel) one Benediction for Cult Mechanicus units: Panegyric Procession (+1 ranged AP within half range) or Citation in Savagery (+1 Str/+1 Attacks melee on the charge).", fx: [] },
        doctrines: [
          { id: 'panegyric', name: "Panegyric Procession", desc: "+1 ranged AP within half range.", fx: [{ k: 'plusApRanged', n: 1, cond: 'doctrine:panegyric+targetWithinHalf', scope: 'army' }] },
          { id: 'savagery', name: "Citation in Savagery", desc: "On the charge, +1 Str and +1 Attacks melee.", fx: [{ k: 'plusStrMelee', n: 1, cond: 'doctrine:savagery+chargedThisTurn', scope: 'army' }, { k: 'plusAttacksMelee', n: 1, cond: 'doctrine:savagery+chargedThisTurn', scope: 'army' }] }
        ],
        doctrineLabel: "Benediction",
        enhancements: [
          { name: "Mechanicus Locum", pts: 10, restrict: "TECH-PRIEST", desc: "Ld 6+; clear a nearby unit's Battle-shock.", fx: [] },
          { name: "Mantle of the Gnosticarch", pts: 15, restrict: "TECH-PRIEST", desc: "Incoming attack Damage set to 1.", fx: [] },
          { name: "Data-blessed Autosermon", pts: 20, restrict: "TECH-PRIEST", desc: "Add the other Benediction for the bearer's unit.", fx: [] },
          { name: "Temporcopia", pts: 25, restrict: "TECH-PRIEST", desc: "Bearer's unit has Fights First.", fx: [{ k: 'fightsFirst', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Incantation of the Iron Soul", cp: 1, type: "Battle Tactic", when: 'anyPhase', targetSelf: true, desc: "FNP 4+ vs mortal wounds.", fx: [{ k: 'fnp', val: 4 }] },
          { name: "Chant of the Remorseless Fist", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "+1 Wound melee.", fx: [{ k: 'addWound', n: 1, cond: 'meleeOnly' }] },
          { name: "Verse of Vengeance", cp: 1, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "Destroyed models fight on (4+).", fx: [{ k: 'fightOnDeath' }] },
          { name: "Tribute of Emphatic Veneration", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Battle-shock a nearby enemy.", fx: [] },
          { name: "Litany of the Electromancer", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Mortal wounds to nearby enemies.", fx: [] },
          { name: "Luminescent Blessing", cp: 1, type: "Battle Tactic", when: 'oppShoot', targetSelf: true, desc: "4+ invulnerable save.", fx: [{ k: 'invuln', val: 4, defensive: true }] }
        ]
      },
      "Explorator Maniple": {
        // Acquisition objective: re-roll Wounds of 1 when attacking from/at an objective. Approximated via objective proximity.
        rule: { name: "Acquisition At Any Cost", desc: "Each Command phase name an Acquisition objective. Attacks re-roll Wounds of 1 when your unit or the target is within range of it. (Approximated to objectives you hold / the target holds.)",
          fx: [{ k: 'rerollWound', val: 1, cond: 'selfWithinObjective', scope: 'army' }, { k: 'rerollWound', val: 1, cond: 'targetWithinObjective', scope: 'army' }] },
        enhancements: [
          { name: "Magos", pts: 15, restrict: "TECH-PRIEST", desc: "CP near the Acquisition objective.", fx: [] },
          { name: "Genetor", pts: 25, restrict: "TECH-PRIEST", desc: "4+ invuln near the Acquisition objective.", fx: [{ k: 'invuln', val: 4, defensive: true, cond: 'selfWithinObjective', selfOnly: true }] },
          { name: "Logis", pts: 20, restrict: "TECH-PRIEST", desc: "+1 Hit vs units near the objective.", fx: [{ k: 'addHit', n: 1, cond: 'targetWithinObjective', selfOnly: true }] },
          { name: "Artisan", pts: 15, restrict: "TECH-PRIEST", desc: "Once/phase set a roll to 6 near the objective.", fx: [] }
        ],
        stratagems: [
          { name: "Cached Acquisition", cp: 1, type: "Epic Deed", when: 'anyPhase', targetSelf: true, desc: "Hold an objective stickily.", fx: [{ k: 'stickyObjective', cond: 'selfOnHeldObjective' }] },
          { name: "Priority Reclamation", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Consolidate up to 6\" to the objective.", fx: [] },
          { name: "Infoslave Skull", cp: 1, type: "Wargear", when: 'command', targetSelf: true, desc: "Add a second Acquisition objective.", fx: [] },
          { name: "Auto-oracular Retrieval", cp: 2, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "+1 Wound vs units near the objective (post-disembark).", fx: [{ k: 'addWound', n: 1, cond: 'targetWithinObjective' }] },
          { name: "Incense Exhausts", cp: 1, type: "Wargear", when: 'oppShoot', targetSelf: true, desc: "Stealth + Benefit of Cover.", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12' }, { k: 'grantCoverDef' }] },
          { name: "Reactive Safeguard", cp: 1, type: "Strategic Ploy", when: 'oppCharge', targetSelf: true, desc: "Embark to dodge a charge.", fx: [] }
        ]
      },
      "Cohort Cybernetica": {
        rule: { name: "Cyber-Psalm Programming", desc: "Legio Cybernetica units get +2\" Move and (unless Battle-shocked) +1 Objective Control.",
          fx: [{ k: 'objControl', n: 1, cond: 'isVehicle', scope: 'army' }] },
        enhancements: [
          { name: "Necromechanic", pts: 25, restrict: "TECH-PRIEST", desc: "Once/round change a nearby Vehicle's failed-save Damage to 0.", fx: [] },
          { name: "Lord of Machines", pts: 20, restrict: "TECH-PRIEST", desc: "Shut down an enemy Vehicle's shooting.", fx: [] },
          { name: "Emotionless Clarity", pts: 15, restrict: "TECH-PRIEST", desc: "Auto Deadly Demise on a nearby dying Vehicle.", fx: [] },
          { name: "Arch-negator", pts: 10, restrict: "TECH-PRIEST", desc: "Bearer's ranged gain [ANTI-VEHICLE 4+].", fx: [{ k: 'antiVal', kw: 'VEHICLE', val: 4, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Motive Imperative", cp: 1, type: "Battle Tactic", when: 'command', targetSelf: true, desc: "+3\" Move, +1 Advance/Charge.", fx: [] },
          { name: "Auto-divinatory Targeting", cp: 1, type: "Battle Tactic", when: 'command', targetSelf: true, desc: "BS 3+ and [IGNORES COVER] vs an objective.", fx: [{ k: 'grant', ab: 'ignorescover', cond: 'rangedOnly' }] },
          { name: "Machine Spirit Resurgent", cp: 1, type: "Epic Deed", when: 'command', targetSelf: true, desc: "Below-strength Vehicle re-rolls Hits (below-half: Wounds too).", fx: [{ k: 'rerollHit', val: 'all', cond: 'isVehicle+selfBelowStrength' }, { k: 'rerollWound', val: 'all', cond: 'isVehicle+selfBelowHalf' }] },
          { name: "Machine Superiority", cp: 1, type: "Epic Deed", when: 'command', targetSelf: true, desc: "Shoot after Falling Back; ignore modifiers.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'ignoreModifiers' }] },
          { name: "Transcendent Cogitation", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Both Imperatives active for the unit.", fx: [] },
          { name: "Benevolence of the Omnissiah", cp: 1, type: "Battle Tactic", when: 'command', targetSelf: true, desc: "FNP 6+ (5+ vs mortal wounds).", fx: [{ k: 'fnp', val: 6 }] }
        ]
      },
      "Eradication Cohort": {
        // Murderous Imperative gates re-rolls on the active Doctrina stance (generic doctrine: conditions).
        rule: { name: "Murderous Imperative", desc: "Skitarii re-roll Hits of 1 while Protector is active, or Wounds of 1 while Conqueror is active.",
          fx: [{ k: 'rerollHit', val: 1, cond: 'doctrine:protector', scope: 'army' }, { k: 'rerollWound', val: 1, cond: 'doctrine:conqueror', scope: 'army' }] },
        enhancements: [
          { name: "Omnicogitator", pts: 25, restrict: "SKITARII MARSHAL", desc: "Both Imperatives active for the bearer's unit.", fx: [] },
          { name: "Martial Signatum Amplificator", pts: 15, restrict: "TECH-PRIEST", desc: "Bearer's unit gains SKITARII.", fx: [] },
          { name: "Belicosa-Class Capacitor Vanes", pts: 30, restrict: "ADEPTUS MECHANICUS", desc: "+6\" Range, +1 Strength ranged.", fx: [{ k: 'plusStrRanged', n: 1, selfOnly: true }] },
          { name: "Omnissiah\u2019s Fury", pts: 10, restrict: "SKITARII MARSHAL", desc: "+2 Attacks, +1 AP/+1 Damage melee.", fx: [{ k: 'plusAttacksMelee', n: 2, selfOnly: true }, { k: 'plusApMelee', n: 1, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Servo-driven Charge", cp: 1, type: "Wargear", when: 'fight', targetSelf: true, desc: "Melee gain [LANCE].", fx: [{ k: 'grant', ab: 'lance', cond: 'meleeOnly' }] },
          { name: "Unrelenting Aggression", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot (Skitarii: and charge) after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }] },
          { name: "Unshackled Wrath", cp: 1, type: "Wargear", when: 'shooting', targetSelf: true, desc: "Ranged gain [SUSTAINED HITS 1] or [LETHAL HITS].", fx: [{ k: 'grant', ab: 'lethal', cond: 'rangedOnly' }] },
          { name: "Threat-cogitation Targeters", cp: 1, type: "Wargear", when: 'shooting', targetSelf: true, desc: "Re-roll Damage vs Monster/Vehicle.", fx: [{ k: 'rerollDamage', val: 'all', cond: 'targetMonsterVehicle' }] },
          { name: "Precision Onslaught", cp: 1, type: "Battle Tactic", when: 'charge', targetSelf: true, desc: "Mortal wounds on a charge.", fx: [] },
          { name: "Analytic Reprisals", cp: 1, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Shoot back at the attacker.", fx: [{ k: 'shootBack' }] }
        ]
      },
      "Haloscreed Battle Clade": {
        // Noospheric Transference is a per-unit Override-ability pick. Modelled as detachment doctrines granting the
        // army the chosen Override (Move/Toughness/charge-after-Advance/Stealth) army-wide for simplicity.
        rule: { name: "Noospheric Transference", desc: "Each Command phase select units to gain HALO OVERRIDE and pick (panel) an Override: +2\" Move, +1 Toughness, charge after Advancing, or Stealth. (Modelled army-wide for the chosen Override.)", fx: [] },
        doctrines: [
          { id: 'halo_move', name: "Electromotive Energisation", desc: "+2\" Move (abstracted).", fx: [] },
          { id: 'halo_tough', name: "Microactuator Bracing", desc: "+1 Toughness (Override units).", fx: [] },
          { id: 'halo_charge', name: "Predation Protocols", desc: "Charge after Advancing.", fx: [{ k: 'eligChargeAfterAdvance', cond: 'doctrine:halo_charge', scope: 'army' }] },
          { id: 'halo_stealth', name: "Muted Servomotors", desc: "Stealth (-1 to be hit beyond 12\").", fx: [{ k: 'subIncomingHit', n: 1, cond: 'doctrine:halo_stealth+attackerBeyond12', scope: 'army' }] }
        ],
        doctrineLabel: "Override",
        enhancements: [
          { name: "Transoracular Dyad Wafers", pts: 15, restrict: "CYBERNETICA DATASMITH", desc: "Permanent HALO OVERRIDE for a Kastelan unit.", fx: [] },
          { name: "Cognitive Reinforcement", pts: 35, restrict: "ADEPTUS MECHANICUS", desc: "Both Imperatives active for the bearer's unit.", fx: [] },
          { name: "Sanctified Ordnance", pts: 10, restrict: "ADEPTUS MECHANICUS", desc: "+6\" Range; re-roll Hazardous.", fx: [] },
          { name: "Inloaded Lethality", pts: 15, restrict: "TECH-PRIEST DOMINUS/MANIPULUS", desc: "+3 Attacks, +1 Damage melee.", fx: [{ k: 'plusAttacksMelee', n: 3, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Eradication Protocols", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Re-roll Wounds of 1 (Halo: Hits of 1 too).", fx: [{ k: 'rerollWound', val: 1 }] },
          { name: "Targeting Override", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Critical Hit on 5+.", fx: [{ k: 'critOn', val: 5 }] },
          { name: "Neural Overload", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Add an Override (at the cost of mortals).", fx: [] },
          { name: "Aggressive Impulse", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Charge after disembarking from a moving transport.", fx: [] },
          { name: "Guided Retreat", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot/charge after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Analytical Divination", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Make a D6\" (Halo: 6\") Normal move.", fx: [{ k: 'extraMove', dice: 'D6' }] }
        ]
      }
    }
  },

  "Agents of the Imperium": {
    // Army rule Assigned Agents is mainly an allied-attachment / Kill-Team build rule; in a single-faction sim it has no
    // combat fx. A pure Agents army selects a detachment as normal, which is what is encoded here.
    armyRule: {
      name: "Assigned Agents",
      desc: "Agents of the Imperium can be attached to other Imperium armies (allied composition, not modelled here). A pure-Agents army picks a detachment as normal. Kill Team units use a majority-Toughness rule (a unit-build mechanic).",
      fx: []
    },
    restrictions: ["Agents of the Imperium army. Allied attachment to other Imperium factions is an army-composition rule not modelled by the single-faction simulator."],
    detachments: {
      "Ordo Xenos": {
        // Deathwatch Mission Tactics is a detachment-specific round-pick (its own doctrines list, via the generic matcher).
        rule: { name: "Deathwatch Mission Tactics", desc: "Each Command phase pick (panel) a Mission Tactic for Deathwatch units: Furor ([SUSTAINED HITS 1]), Malleus ([LETHAL HITS]) or Purgatus ([PRECISION] on a Critical Wound).", fx: [] },
        doctrines: [
          { id: 'furor', name: "Furor Tactics", desc: "Weapons have [SUSTAINED HITS 1].", fx: [{ k: 'grant', ab: 'sustained', val: 1, cond: 'doctrine:furor', scope: 'army' }] },
          { id: 'malleus', name: "Malleus Tactics", desc: "Weapons have [LETHAL HITS].", fx: [{ k: 'grant', ab: 'lethal', cond: 'doctrine:malleus', scope: 'army' }] },
          { id: 'purgatus', name: "Purgatus Tactics", desc: "[PRECISION] on a Critical Wound.", fx: [{ k: 'grant', ab: 'precision', cond: 'doctrine:purgatus', scope: 'army' }] }
        ],
        doctrineLabel: "Mission Tactic",
        enhancements: [
          { name: "Amulet of Auto-Chastisement", pts: 25, restrict: "WATCH MASTER", desc: "Shut down an enemy Vehicle's shooting.", fx: [] },
          { name: "Beacon Angelis", pts: 30, restrict: "WATCH MASTER", desc: "Deep Strike + 0CP Rapid Ingress.", fx: [{ k: 'grantDeepStrike', selfOnly: true }] },
          { name: "Blackweave Shroud", pts: 15, restrict: "AGENTS OF THE IMPERIUM", desc: "Feel No Pain 4+.", fx: [{ k: 'fnp', val: 4, selfOnly: true }] },
          { name: "Universal Anathema", pts: 10, restrict: "AGENTS OF THE IMPERIUM", desc: "Bearer's melee gain [ANTI-INFANTRY 2+] / [ANTI-MONSTER 4+].", fx: [{ k: 'antiVal', kw: 'INFANTRY', val: 2, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Armour of Contempt", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Incoming attacks worsen AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Adaptive Tactics", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Switch a unit's Mission Tactic.", fx: [] },
          { name: "Hellfire Rounds", cp: 1, type: "Wargear", when: 'shooting', targetSelf: true, desc: "Ranged gain [ANTI-INFANTRY 2+] / [ANTI-MONSTER 5+].", fx: [{ k: 'antiVal', kw: 'INFANTRY', val: 2 }] },
          { name: "Dragonfire Rounds", cp: 1, type: "Wargear", when: 'shooting', targetSelf: true, desc: "Ranged gain [ASSAULT] and [IGNORES COVER].", fx: [{ k: 'grant', ab: 'assault', cond: 'rangedOnly' }, { k: 'grant', ab: 'ignorescover', cond: 'rangedOnly' }] },
          { name: "Kraken Rounds", cp: 1, type: "Wargear", when: 'shooting', targetSelf: true, desc: "+1 AP and +6\" Range ranged.", fx: [{ k: 'plusApRanged', n: 1 }] },
          { name: "Rapid Tactical Relocation", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull a unit into Reserves to redeploy.", fx: [{ k: 'toReserves' }] }
        ]
      },
      "Ordo Hereticus": {
        // "Chaos unit with 5+ models" rider approximated to any Chaos target (most Chaos infantry field 5+).
        rule: { name: "Root out Heresy", desc: "Arbites/Inquisitor/Inquisitorial Agents/Ordo Hereticus ranged weapons gain [IGNORES COVER]; attacks vs a Chaos unit (5+ models) gain [SUSTAINED HITS 1].",
          fx: [{ k: 'grant', ab: 'ignorescover', cond: 'rangedOnly', scope: 'army' }, { k: 'grant', ab: 'sustained', val: 1, cond: 'targetChaos', scope: 'army' }] },
        enhancements: [
          { name: "Ignis Judicium", pts: 10, restrict: "INQUISITOR/MINISTORUM PRIEST", desc: "Bearer's ranged gain [DEVASTATING WOUNDS], [MELTA 1], [PRECISION].", fx: [{ k: 'grant', ab: 'devastating', cond: 'rangedOnly', selfOnly: true }, { k: 'grant', ab: 'precision', cond: 'rangedOnly', selfOnly: true }] },
          { name: "Liber Heresius", pts: 10, restrict: "INQUISITOR/MINISTORUM PRIEST", desc: "Redeploy up to three units after deployment.", fx: [] },
          { name: "No Escape", pts: 25, restrict: "INQUISITOR", desc: "Nearby enemies struggle to Fall Back.", fx: [] },
          { name: "Witch Hunter", pts: 15, restrict: "INQUISITOR/MINISTORUM PRIEST", desc: "Re-roll Hits vs Psykers.", fx: [{ k: 'rerollHit', val: 'all', cond: 'targetPsyker', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Stun Grenades", cp: 1, type: "Wargear", when: 'anyPhase', targetSelf: true, desc: "Battle-shock and -1 Hit on a nearby enemy.", fx: [] },
          { name: "Dispense Justice", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Weapons gain [LETHAL HITS].", fx: [{ k: 'grant', ab: 'lethal' }] },
          { name: "Inviolate Jurisdiction", cp: 1, type: "Strategic Ploy", when: 'targeted', targetSelf: true, desc: "Feel No Pain 5+ on an objective.", fx: [{ k: 'fnp', val: 5, cond: 'selfWithinObjective' }] },
          { name: "Execution Order", cp: 2, type: "Epic Deed", when: 'command', targetSelf: true, desc: "[PRECISION] vs a chosen enemy Character.", fx: [] },
          { name: "Line of Fire", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Shoot into combat within 12\".", fx: [] },
          { name: "Exact Punishment", cp: 1, type: "Strategic Ploy", when: 'oppShoot', targetSelf: true, desc: "Shoot back at the attacker.", fx: [{ k: 'shootBack' }] }
        ]
      },
      "Ordo Malleus": {
        rule: { name: "Destroy the Daemonic", desc: "Inquisitor/Inquisitorial Agents/Ordo Malleus models re-roll Hits of 1, and re-roll Wounds of 1 vs Daemon units.",
          fx: [{ k: 'rerollHit', val: 1, scope: 'army' }, { k: 'rerollWound', val: 1, cond: 'targetDaemon', scope: 'army' }] },
        enhancements: [
          { name: "Daemon Slayer", pts: 10, restrict: "INQUISITOR", desc: "+1 Attacks melee; [ANTI-DAEMON 3+].", fx: [{ k: 'plusAttacksMelee', n: 1, selfOnly: true }, { k: 'antiVal', kw: 'DAEMON', val: 3, selfOnly: true }] },
          { name: "Formidable Resolve", pts: 5, restrict: "INQUISITOR", desc: "+1 Ld/+1 Wound; clear Battle-shock once.", fx: [] },
          { name: "Gift of the Prescient", pts: 20, restrict: "INQUISITOR", desc: "0CP Rapid Ingress for a Grey Knights unit.", fx: [] },
          { name: "Grimoire of True Names", pts: 10, restrict: "INQUISITOR", desc: "Nearby enemies -1 Ld; nearby Daemons -1 Hit/-1 Wound.", fx: [] }
        ],
        stratagems: [
          { name: "Ritual of Warding", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Ward an objective (sticky; blocks Daemon arrivals).", fx: [{ k: 'stickyObjective', cond: 'selfOnHeldObjective' }] },
          { name: "Rites of Exorcism", cp: 1, type: "Strategic Ploy", when: 'shootOrFight', targetSelf: true, desc: "[DEVASTATING WOUNDS] vs a Battle-shocked Daemon.", fx: [{ k: 'grant', ab: 'devastating', cond: 'targetDaemon' }] },
          { name: "Steel Heart", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot/charge after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Truesilver Armour", cp: 1, type: "Wargear", when: 'targeted', targetSelf: true, desc: "Incoming attacks worsen AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Hexagrammic Wards", cp: 1, type: "Wargear", when: 'targeted', targetSelf: true, desc: "Enemy Psychic weapons gain [HAZARDOUS].", fx: [] },
          { name: "Psybolt Ammunition", cp: 1, type: "Wargear", when: 'shooting', targetSelf: true, desc: "Ranged gain [LETHAL HITS] and [PSYCHIC].", fx: [{ k: 'grant', ab: 'lethal', cond: 'rangedOnly' }] }
        ]
      },
      "Imperialis Fleet": {
        // At all Costs: each Command phase pick Eliminate (mark an enemy for +1 Hit; reuses oathTarget) or Acquire (objective buff).
        rule: { name: "At all Costs", desc: "Each Command phase pick Eliminate at all Costs (name an enemy via the Oath chooser: +1 to Hit vs it) or Acquire at all Costs (an objective grants +1 Ld/OC and a 5+ invuln to units holding it).",
          fx: [{ k: 'addHit', n: 1, cond: 'targetIsOath', scope: 'army' }] },
        enhancements: [
          { name: "Clandestine Operation", pts: 15, restrict: "AGENTS OF THE IMPERIUM", desc: "Infiltrators on up to three units.", fx: [] },
          { name: "Combat Landers", pts: 10, restrict: "VOIDFARERS", desc: "Deep Strike on up to three Voidfarers units.", fx: [] },
          { name: "Digital Weapons", pts: 10, restrict: "AGENTS OF THE IMPERIUM", desc: "Mortal wounds in melee.", fx: [] },
          { name: "Fleetmaster", pts: 20, restrict: "VOIDFARERS", desc: "0CP detachment Stratagems once/round.", fx: [] }
        ],
        stratagems: [
          { name: "Violent Acquisition", cp: 2, type: "Strategic Ploy", when: 'shootOrFight', targetSelf: true, desc: "[SUSTAINED HITS 1], [LANCE], [IGNORES COVER] vs units on objectives.", fx: [{ k: 'grant', ab: 'sustained', val: 1, cond: 'targetWithinObjective' }, { k: 'grant', ab: 'lance', cond: 'targetWithinObjective' }, { k: 'grant', ab: 'ignorescover', cond: 'targetWithinObjective' }] },
          { name: "Masters of the Void", cp: 1, type: "Epic Deed", when: 'movement', targetSelf: true, desc: "Arrive from Reserves in the enemy zone.", fx: [] },
          { name: "Close-quarters Barrage", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "+1 Str/+1 AP ranged within 12\".", fx: [{ k: 'plusStrRanged', n: 1, cond: 'within12' }, { k: 'plusApRanged', n: 1, cond: 'within12' }] },
          { name: "Emperor\u2019s Will", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot after Advancing/Falling Back.", fx: [{ k: 'eligShootAfterAdvance' }, { k: 'eligShootAfterFallBack' }] },
          { name: "Displacer Field", cp: 1, type: "Wargear", when: 'oppShoot', targetSelf: true, desc: "4+ invuln, then a 6\" move.", fx: [{ k: 'invuln', val: 4, defensive: true }, { k: 'extraMove', val: '6' }] },
          { name: "Selfless Bodyguard", cp: 1, type: "Epic Deed", when: 'targeted', targetSelf: true, desc: "Redirect Precision attacks to Bodyguards.", fx: [] }
        ]
      },
      "Veiled Blade": {
        rule: { name: "Extremis Sanction", desc: "Officio Assassinorum units can use their signature abilities (Overkill/Soulless Horror/Shieldbreaker) twice per battle, and each carries an Extremis upgrade (anti-keyword weapons, decoys, etc.). Unit-build / once-per-battle abilities; the Stratagems work.", fx: [] },
        enhancements: [],
        stratagems: [
          { name: "Prime Target", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Re-roll Wounds of 1 vs Characters (vs Warlord: full re-roll).", fx: [{ k: 'rerollWound', val: 1, cond: 'targetCharacter' }] },
          { name: "Hyperstimms", cp: 2, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "+1 Toughness (Eversor: FNP 4+).", fx: [] },
          { name: "Will-sapping Salvo", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Ranged gain [SUSTAINED HITS 1].", fx: [{ k: 'grant', ab: 'sustained', val: 1, cond: 'rangedOnly' }] },
          { name: "Orbital Oversight", cp: 1, type: "Strategic Ploy", when: 'oppShoot', targetSelf: true, desc: "Shot only within 18\" (Lone Op: 6\").", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12' }] },
          { name: "Blind Grenades", cp: 1, type: "Strategic Ploy", when: 'oppCharge', targetSelf: true, desc: "-1 (Vindicare: -2) to enemy Charge rolls.", fx: [] },
          { name: "Ensnaring Trap", cp: 1, type: "Strategic Ploy", when: 'oppChargeEnd', targetSelf: true, desc: "Counter-charge a nearby enemy.", fx: [] }
        ]
      }
    }
  },

  "Drukhari": {
    // Army rule Power from Pain is a resource pool (panel): gain Pain tokens at Command start / per enemy destroyed /
    // per enemy failed Battle-shock; spend 1 to Empower a unit (its weapons gain [SUSTAINED HITS 1] this phase).
    armyRule: {
      name: "Power from Pain",
      desc: "Gain Pain tokens (1 at the start of your Command phase, 1 per enemy unit destroyed, 1 per enemy that fails a Battle-shock test). Spend 1 via the panel to Empower a unit — its Pain abilities (modelled as [SUSTAINED HITS 1]) take effect until end of phase.",
      fx: []
    },
    restrictions: [
      "Drukhari army. Empower units by spending Pain tokens via the panel.",
      "Harlequins and Anhrathe allies (Corsairs and Travelling Players) are an army-composition rule not modelled by the single-faction simulator."
    ],
    detachments: {
      "Realspace Raiders": {
        // Alliance of Agony grants a flat 6 Pain tokens at battle start (wired in app.js).
        rule: { name: "Alliance of Agony", desc: "Start the battle with up to 6 Pain tokens (2 per Archon+Kabalite / Succubus+Wych / Haemonculus+Wrack combination). Modelled as a flat starting pool.", fx: [] },
        enhancements: [
          { name: "Dark Vitality", pts: 25, restrict: "DRUKHARI", desc: "Bearer's unit is always Empowered (no token needed).", fx: [{ k: 'grant', ab: 'sustained', val: 1, selfOnly: true }] },
          { name: "Labyrinthine Cunning", pts: 25, restrict: "ARCHON", desc: "Chance of 1CP each Command phase.", fx: [] },
          { name: "Eye of Spite", pts: 15, restrict: "SUCCUBUS", desc: "+1 Attacks/+1 AP melee (Pain: +2).", fx: [{ k: 'plusAttacksMelee', n: 1, selfOnly: true }, { k: 'plusApMelee', n: 1, selfOnly: true }] },
          { name: "Crucible of Malediction", pts: 20, restrict: "HAEMONCULUS", desc: "Battle-shock + anti-Psyker mortal wounds.", fx: [] }
        ],
        stratagems: [
          { name: "Insensible to Pain", cp: 2, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Incoming attacks -1 Damage.", fx: [{ k: 'reduceIncomingDmg', n: 1 }] },
          { name: "Fighting Shadows", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Attackers -1 to Hit.", fx: [{ k: 'subIncomingHit', n: 1 }] },
          { name: "Instinctive Spite", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "+1 Hit (Pain: +1 Wound) vs below-half.", fx: [{ k: 'addHit', n: 1, cond: 'targetBelowHalf' }] },
          { name: "Dark Harvest", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Melee gain [LETHAL HITS].", fx: [{ k: 'grant', ab: 'lethal', cond: 'meleeOnly' }] },
          { name: "Eager for the Kill", cp: 1, type: "Battle Tactic", when: 'movement', targetSelf: true, desc: "Auto-Advance +6\" Move.", fx: [{ k: 'extraMove', val: '6' }] },
          { name: "Raid and Fade", cp: 2, type: "Strategic Ploy", when: 'shootingEnd', targetSelf: true, desc: "Make a 6\" Normal move.", fx: [{ k: 'extraMove', val: '6' }] }
        ]
      },
      "Skysplinter Assault": {
        rule: { name: "Rain of Cruelty", desc: "When a unit disembarks from a transport, its ranged weapons gain [IGNORES COVER] and melee gain [LANCE] until end of turn. (Disembark-triggered; approximated as army-wide ignores-cover + lance, since the engine abstracts transports.)",
          fx: [{ k: 'grant', ab: 'ignorescover', cond: 'rangedOnly', scope: 'army' }, { k: 'grant', ab: 'lance', cond: 'meleeOnly', scope: 'army' }] },
        enhancements: [
          { name: "Phantasmal Smoke", pts: 15, restrict: "DRUKHARI", desc: "Stealth + cover near a transport.", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12', selfOnly: true }] },
          { name: "Sadistic Fulcrum", pts: 15, restrict: "DRUKHARI", desc: "Empowering in Shooting lets a nearby transport re-roll Hits.", fx: [] },
          { name: "Spiteful Raider", pts: 10, restrict: "DRUKHARI", desc: "Extra Pain token on an objective kill.", fx: [] },
          { name: "Nightmare Shroud", pts: 20, restrict: "DRUKHARI", desc: "No Overwatch after disembarking.", fx: [] }
        ],
        stratagems: [
          { name: "Vicious Blades", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Mortal wounds from a transport's embarked models.", fx: [] },
          { name: "Wraithlike Retreat", cp: 1, type: "Strategic Ploy", when: 'fightEnd', targetSelf: true, desc: "Make a Normal/Fall Back move to a transport.", fx: [{ k: 'extraMove', val: '6' }] },
          { name: "Pounce on the Prey", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Charge after disembarking from a moving transport.", fx: [{ k: 'eligChargeAfterAdvance' }] },
          { name: "Skyborne Annihilation", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Ranged gain [SUSTAINED HITS 1] (Kabalite: 2).", fx: [{ k: 'grant', ab: 'sustained', val: 1, cond: 'rangedOnly' }] },
          { name: "Swooping Mockery", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "A transport makes a 6\" Normal move.", fx: [{ k: 'extraMove', val: '6' }] },
          { name: "Night Shield", cp: 1, type: "Wargear", when: 'oppShoot', targetSelf: true, desc: "Vehicle 4+ invulnerable save.", fx: [{ k: 'invuln', val: 4, defensive: true }] }
        ]
      },
      "Spectacle of Spite": {
        // Combat Drugs is a Command-phase menu pick for WYCH CULT; modelled as detachment doctrines (army-wide approximation).
        rule: { name: "Combat Drugs", desc: "Each Command phase pick (panel) a Combat Drug for Wych Cult units: Adrenalight (+1 melee Attacks), Hypex (+2\" Move), Serpentin (+1 melee WS/Hit), Painbringer (+1 Toughness), Grave Lotus (+1 melee Strength), or Splintermind (+1 Ld/+1 ranged BS).", fx: [] },
        doctrines: [
          { id: 'adrenalight', name: "Adrenalight", desc: "+1 melee Attacks.", fx: [{ k: 'plusAttacksMelee', n: 1, cond: 'doctrine:adrenalight', scope: 'army' }] },
          { id: 'serpentin', name: "Serpentin", desc: "+1 to melee Hit (WS).", fx: [{ k: 'addHit', n: 1, cond: 'meleeOnly+doctrine:serpentin', scope: 'army' }] },
          { id: 'gravelotus', name: "Grave Lotus", desc: "+1 melee Strength.", fx: [{ k: 'plusStrMelee', n: 1, cond: 'doctrine:gravelotus', scope: 'army' }] },
          { id: 'splintermind', name: "Splintermind", desc: "+1 to ranged Hit (BS).", fx: [{ k: 'addHit', n: 1, cond: 'rangedOnly+doctrine:splintermind', scope: 'army' }] }
        ],
        doctrineLabel: "Combat Drug",
        enhancements: [
          { name: "Pharmacophex", pts: 15, restrict: "SUCCUBUS", desc: "An extra random Combat Drug for the bearer's unit.", fx: [] },
          { name: "Chronoshard", pts: 15, restrict: "SUCCUBUS", desc: "Once/battle Fights First.", fx: [{ k: 'fightsFirst', selfOnly: true }] },
          { name: "Periapt of Torments", pts: 25, restrict: "SUCCUBUS", desc: "No Overwatch against the bearer's unit.", fx: [] },
          { name: "Morghenna\u2019s Curse", pts: 20, restrict: "SUCCUBUS", desc: "+1 AP/+1 Damage melee.", fx: [{ k: 'plusApMelee', n: 1, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Berserk Fugue", cp: 2, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "Destroyed models fight on.", fx: [{ k: 'fightOnDeath' }] },
          { name: "Deadly Debut", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Melee gain [LETHAL HITS] (Wyches: +1 AP).", fx: [{ k: 'grant', ab: 'lethal', cond: 'meleeOnly' }] },
          { name: "Feigned Weakness", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot/charge after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Preternatural Agility", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Ignore move/Advance/Charge modifiers; move through models.", fx: [{ k: 'ignoreModifiers' }] },
          { name: "A Challenge Met", cp: 2, type: "Battle Tactic", when: 'oppMove', targetSelf: true, desc: "Charge a freshly-arrived enemy.", fx: [] },
          { name: "Acrobatic Display", cp: 1, type: "Battle Tactic", when: 'oppShoot', targetSelf: true, desc: "5+ invulnerable save.", fx: [{ k: 'invuln', val: 5, defensive: true }] }
        ]
      },
      "Covenite Coterie": {
        rule: { name: "Stitchflesh Abominations", desc: "When an attack targets a Haemonculus Covens unit and its Strength exceeds the unit's Toughness, subtract 1 from the Wound roll.",
          fx: [{ k: 'subIncomingWound', n: 1, cond: 'strHigherThanT', scope: 'army' }] },
        enhancements: [
          { name: "Master Regenesist", pts: 25, restrict: "HAEMONCULUS", desc: "Return more Bodyguard models with Fleshcraft.", fx: [] },
          { name: "Master Nemesine", pts: 5, restrict: "HAEMONCULUS", desc: "[ANTI-BEAST 2+] / [ANTI-MONSTER 4+].", fx: [{ k: 'antiVal', kw: 'MONSTER', val: 4, selfOnly: true }] },
          { name: "Master Artisan", pts: 20, restrict: "HAEMONCULUS", desc: "+1 Wound; +1 Toughness to the unit.", fx: [] },
          { name: "Master Repugnomancer", pts: 15, restrict: "HAEMONCULUS", desc: "Pain tokens when nearby Drukhari fail Battle-shock / die.", fx: [] }
        ],
        stratagems: [
          { name: "Postmortality", cp: 1, type: "Epic Deed", when: 'anyPhase', targetSelf: true, desc: "Resurrect a destroyed Haemonculus (spend Pain).", fx: [] },
          { name: "Symphony of Suffering", cp: 1, type: "Epic Deed", when: 'fight', targetSelf: true, desc: "Battle-shock nearby enemies on a kill.", fx: [] },
          { name: "Poisoner\u2019s Art", cp: 1, type: "Epic Deed", when: 'fight', targetSelf: true, desc: "Poison a hit enemy (mortal wounds each Command).", fx: [] },
          { name: "Distillers of Fear", cp: 2, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "[DEVASTATING WOUNDS] vs Battle-shocked.", fx: [{ k: 'grant', ab: 'devastating', cond: 'targetBattleshocked' }] },
          { name: "Connoisseurs of Pain", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Incoming attacks worsen AP by 1 (spend Pain).", fx: [{ k: 'worsenIncomingAP', n: 1 }] },
          { name: "Enfolding Nightmare", cp: 1, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Make a D6\" move toward the enemy.", fx: [{ k: 'extraMove', dice: 'D6' }] }
        ]
      },
      "Kabalite Cartel": {
        // Murderous Agenda Contract = mark one enemy at battle start; KABAL/BLADES FOR HIRE gain an ability vs it.
        // Reuses oathTarget (mark the Contract unit), granting [PRECISION] vs it as the common Trophy Hunters effect.
        rule: { name: "Murderous Agenda", desc: "At the start name a Contract unit (Oath chooser): Kabal / Blades for Hire attacks vs it gain [PRECISION] (Trophy Hunters). Completing the Contract grants 3 Pain tokens.",
          fx: [{ k: 'grant', ab: 'precision', cond: 'targetIsOath', scope: 'army' }] },
        enhancements: [
          { name: "Leechbite Plate", pts: 5, restrict: "ARCHON", desc: "Save 3+; heal fully for 1 Pain token.", fx: [] },
          { name: "Webway Awl", pts: 25, restrict: "ARCHON", desc: "Deep Strike + 0CP Rapid Ingress.", fx: [{ k: 'grantDeepStrike', selfOnly: true }] },
          { name: "Informant Network", pts: 30, restrict: "ARCHON", desc: "Infiltrators on up to three Kabalite units.", fx: [] },
          { name: "Towering Arrogance", pts: 20, restrict: "ARCHON", desc: "+1 Ld/+1 OC to the bearer's unit.", fx: [{ k: 'objControl', n: 1, scope: 'army', cond: 'characterLeading' }] }
        ],
        stratagems: [
          { name: "Double-cross", cp: 1, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "Soak attacks onto a nearby Drukhari unit.", fx: [] },
          { name: "Taken Alive", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "+1 Hit; Battle-shock the enemy if the Contract dies.", fx: [{ k: 'addHit', n: 1 }] },
          { name: "Tailored Toxins", cp: 1, type: "Epic Deed", when: 'shootOrFight', targetSelf: true, desc: "Critical Hit on 5+ vs the Contract unit.", fx: [{ k: 'critOn', val: 5, cond: 'targetIsOath' }] },
          { name: "Enemies Without Number", cp: 1, type: "Epic Deed", when: 'command', targetSelf: true, desc: "Name a new Contract unit.", fx: [] },
          { name: "Making a Point", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "+1 ranged BS/+1 AP.", fx: [{ k: 'plusApRanged', n: 1 }] },
          { name: "Deadly Deceivers", cp: 1, type: "Strategic Ploy", when: 'oppShoot', targetSelf: true, desc: "Shot only within 18\".", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12' }] }
        ]
      },
      "Reaper\u2019s Wager": {
        // Callous Competition: Drukhari start winning the wager (re-roll Hits of 1); losing the wager would re-roll Hits
        // and Wounds of 1. With Harlequin allies unmodelled, Drukhari stay winning, so a static Hit-1 re-roll is encoded.
        rule: { name: "Callous Competition", desc: "Drukhari start winning the wager: re-roll Hits of 1 (a losing side would re-roll Hits and Wounds of 1). With Harlequin allies not modelled, the Drukhari army stays winning.",
          fx: [{ k: 'rerollHit', val: 1, scope: 'army' }] },
        enhancements: [
          { name: "Archraider", pts: 15, restrict: "DRUKHARI", desc: "A dedicated transport gains Scouts 9\".", fx: [] },
          { name: "Webway Walker", pts: 15, restrict: "DRUKHARI", desc: "Deep Strike; re-roll Charge when losing the wager.", fx: [{ k: 'grantDeepStrike', selfOnly: true }] },
          { name: "Reaper\u2019s Cowl", pts: 25, restrict: "HARLEQUINS", desc: "Stealth and Infiltrators.", fx: [] },
          { name: "Conductor of Torment", pts: 20, restrict: "DRUKHARI", desc: "Flip the wager for a Pain token.", fx: [] }
        ],
        stratagems: [
          { name: "Malicious Frenzy", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Weapons gain [LETHAL HITS] or [SUSTAINED HITS 1].", fx: [{ k: 'grant', ab: 'lethal' }] },
          { name: "Fateful Role", cp: 1, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "Destroyed models fight on.", fx: [{ k: 'fightOnDeath' }] },
          { name: "Murderer\u2019s Circus", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "Attackers -1 to Hit.", fx: [{ k: 'subIncomingHit', n: 1 }] },
          { name: "Shorten the Odds", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot/charge after Advancing.", fx: [{ k: 'eligShootAfterAdvance' }, { k: 'eligChargeAfterAdvance' }] },
          { name: "Scintillating Tempo", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "No Overwatch against the unit.", fx: [] },
          { name: "Dance Macabre", cp: 2, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Make a D6\" (losing: 6\") Normal move.", fx: [{ k: 'extraMove', dice: 'D6' }] }
        ]
      }
    }
  },

  "Leagues of Votann": {
    // Army rule Prioritised Efficiency: a Yield Point pool (gained from objective control / kills) flips the army between
    // two stances at the 7YP threshold, re-evaluated at end of each Command phase (wired in app.js):
    //  Hostile Acquisition (<7YP): +1 Hit vs a target on an objective; re-roll Advance & Charge.
    //  Fortify Takeover (>=7YP): +1 Hit when YOUR unit is on a held objective; -1 to incoming Wound when S>T (non-VEHICLE).
    armyRule: {
      name: "Prioritised Efficiency",
      desc: "Your army holds Yield Points (YP), gained at the end of each Command phase from objective control (and some detachments grant more). With fewer than 7YP your units have Hostile Acquisition; with 7YP or more they have Fortify Takeover. The stance is re-checked at the end of your Command phase.",
      fx: [
        // Hostile Acquisition
        { k: 'addHit', n: 1, cond: 'votannHostile+targetWithinObjective', scope: 'army' },
        { k: 'rerollAdvance', cond: 'votannHostile', scope: 'army' },
        { k: 'rerollCharge', cond: 'votannHostile', scope: 'army' },
        // Fortify Takeover
        { k: 'addHit', n: 1, cond: 'votannFortify+selfOnHeldObjective', scope: 'army' },
        { k: 'subIncomingWound', n: 1, defensive: true, cond: 'votannFortify+incomingStrHigherThanSelfT+selfNotVehicle', scope: 'army' }
      ]
    },
    restrictions: ["Leagues of Votann army. Yield Points accrue automatically; the army stance (Hostile Acquisition / Fortify Takeover) flips at 7YP at the end of your Command phase. Use the panel's Toggle to spend 3YP for a manual flip (Mercenary / Adaptable Avarice)."],
    detachments: {
      "Needga\u00e2rd Oathband": {
        // Martial Leverage: +1 YP per enemy unit destroyed (wired via ypOnEnemyDeath).
        rule: { name: "Martial Leverage", desc: "Each time an enemy unit is destroyed, you gain 1YP.", fx: [] },
        enhancements: [
          { name: "Oathbound Speculator", pts: 30, restrict: "LEAGUES OF VOTANN", desc: "Re-roll a Wound roll of 1; spend 3YP for +1 Wound for a phase.", fx: [{ k: 'rerollWound', val: 1, selfOnly: true }] },
          { name: "Dead Reckoning", pts: 10, restrict: "LEAGUES OF VOTANN", desc: "Gain 1YP at end of turn if you spent none.", fx: [] },
          { name: "Iron Ambassador", pts: 5, restrict: "AUTOCH-PATTERN COMBI-BOLTER", desc: "Once/battle spend up to 3YP for +Damage ranged.", fx: [] },
          { name: "Ancestral Crest", pts: 15, restrict: "LEAGUES OF VOTANN", desc: "Spend 1YP to cut a Command Re-roll's cost by 1CP.", fx: [] }
        ],
        stratagems: [
          { name: "Void Hardened", cp: 1, type: "Wargear", when: 'targeted', targetSelf: true, desc: "Fortify Takeover only: incoming attacks worsen AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1, cond: 'votannFortify' }] },
          { name: "Honour of the Hold", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "+1 (YP: +2) melee AP vs one enemy.", fx: [{ k: 'plusApMelee', n: 1 }] },
          { name: "Ordered Retreat", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot/charge after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Ancestral Sentence", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Ranged gain [SUSTAINED HITS 1] (YP: 2).", fx: [{ k: 'grant', ab: 'sustained', val: 1, cond: 'rangedOnly' }] },
          { name: "Huntr\u2019s Mark", cp: 1, type: "Battle Tactic", when: 'shootOrFight', targetSelf: true, desc: "Re-roll Hits and Wounds of 1.", fx: [{ k: 'rerollHit', val: 1 }, { k: 'rerollWound', val: 1 }] },
          { name: "Reactive Reprisal", cp: 2, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Fortify Takeover only: shoot back at the attacker.", fx: [{ k: 'shootBack', cond: 'votannFortify' }] }
        ]
      },
      "Persecution Prospect": {
        // Assailed From Every Angle / Guerrilla Adepts: shooting can label a target 'assailed' (then 'pinned'). Modelled as a
        // marker the engine tracks; assailed-keyed bonuses use targetAssailed. The pin debuff is logged (Move/Charge penalties).
        rule: { name: "Assailed From Every Angle", desc: "After a HERNKYN-heavy unit shoots, it can mark its target 'assailed' (and 'pinned' if already assailed). Assailed targets take extra punishment from this army's Enhancements and Stratagems.", fx: [] },
        enhancements: [
          { name: "Eye for Weakness", pts: 25, restrict: "LEAGUES OF VOTANN", desc: "+1 Wound vs an assailed unit.", fx: [{ k: 'addWound', n: 1, cond: 'targetAssailed', selfOnly: true }] },
          { name: "Writ of Acquisition", pts: 10, restrict: "LEAGUES OF VOTANN", desc: "Gain 1YP per assailed unit the bearer's unit hits (max 3).", fx: [] },
          { name: "Surgical Saboteur", pts: 10, restrict: "LEAGUES OF VOTANN", desc: "Pin a Monster/Vehicle the bearer's unit hits.", fx: [] },
          { name: "Nomad Strategist", pts: 20, restrict: "LEAGUES OF VOTANN", desc: "Once/battle spend YP to pull HERNKYN units into Reserves.", fx: [] }
        ],
        stratagems: [
          { name: "Adaptable Avarice", cp: 1, type: "Strategic Ploy", when: 'anyPhase', targetSelf: true, desc: "Fortify Takeover only: spend YP to drop to Hostile Acquisition.", fx: [] },
          { name: "Frontier Momentum", cp: 1, type: "Battle Tactic", when: 'movement', targetSelf: true, desc: "Auto-Advance +6\" Move (HERNKYN).", fx: [{ k: 'extraMove', val: '6' }] },
          { name: "Exposed Flaws", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Re-roll Wounds vs assailed (or if YP spent).", fx: [{ k: 'rerollWound', val: 'all', cond: 'targetAssailed' }] },
          { name: "Ranger Tactics", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Re-roll Hits vs assailed / for HERNKYN.", fx: [{ k: 'rerollHit', val: 'all', cond: 'targetAssailed' }] },
          { name: "Claimstaker Reflex", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Make a D6\" (YP: 6\") Normal move.", fx: [{ k: 'extraMove', dice: 'D6' }] },
          { name: "Dispersed Formation", cp: 1, type: "Strategic Ploy", when: 'oppShoot', targetSelf: true, desc: "Stealth + Benefit of Cover.", fx: [{ k: 'subIncomingHit', n: 1, cond: 'attackerBeyond12' }, { k: 'grantCoverDef' }] }
        ]
      },
      "D\u00ealve Assault Shift": {
        rule: { name: "Fury From The D\u00ealve", desc: "CTHONIAN BESERKS units gain the Deep Strike and BATTLELINE keywords.", fx: [{ k: 'grantDeepStrike', cond: 'isCthonianBeserks', scope: 'army' }] },
        enhancements: [
          { name: "D\u00ealvwerke Navigator", pts: 25, restrict: "LEAGUES OF VOTANN", desc: "Return destroyed Cthonian Beserk models by spending YP.", fx: [] },
          { name: "Multiwave System Jammer", pts: 10, restrict: "LEAGUES OF VOTANN", desc: "Once/battle treat a Cthonian unit's arrival round as one higher.", fx: [] },
          { name: "Quake Supervisor", pts: 20, restrict: "LEAGUES OF VOTANN", desc: "Lone Operative near Artillery; +1 Hit for those Artillery.", fx: [] },
          { name: "Piledriver", pts: 15, restrict: "LEAGUES OF VOTANN", desc: "Spend up to 2YP for +Damage melee.", fx: [] }
        ],
        stratagems: [
          { name: "Cyberstimm Infusion", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Re-roll Wounds of 1 (YP: full re-roll), Cthonian Beserks.", fx: [{ k: 'rerollWound', val: 1 }] },
          { name: "Unstoppable Force", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Pile-in/Consolidate up to 6\".", fx: [] },
          { name: "Augmented Assault", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Spend YP for +Move; charge after Advancing.", fx: [{ k: 'eligChargeAfterAdvance' }] },
          { name: "Tectonic Fracture", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "Slow a hit enemy (-2\" Move; YP: -2 Charge).", fx: [] },
          { name: "Weavew\u00ebrke Buttress", cp: 1, type: "Strategic Ploy", when: 'oppShoot', targetSelf: true, desc: "Hostile Acquisition only: -1 to incoming Wound (Infantry).", fx: [{ k: 'subIncomingWound', n: 1, cond: 'votannHostile' }] },
          { name: "Hidden Accessways", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull a unit into Strategic Reserves.", fx: [{ k: 'toReserves' }] }
        ]
      },
      "Brandfast Oathband": {
        // Mobile Sensor Relays / Firebase Control: Infantry near a Votann TRANSPORT get [SUSTAINED HITS 1]. Transports are
        // abstracted in the sim, so this is approximated army-wide for ranged attacks.
        rule: { name: "Mobile Sensor Relays", desc: "Infantry near a Votann TRANSPORT gain [SUSTAINED HITS 1] on ranged weapons (Firebase Control aura; approximated army-wide as transports are abstracted).",
          fx: [{ k: 'grant', ab: 'sustained', val: 1, cond: 'rangedOnly', scope: 'army' }] },
        enhancements: [
          { name: "Tactical Alchemy", pts: 10, restrict: "K\u00c2HL", desc: "Spend 1YP near a not-in-zone objective for a chance at 1CP.", fx: [] },
          { name: "Triv\u00e4rg Cyber Implant", pts: 40, restrict: "LEAGUES OF VOTANN", desc: "Disembark / spend 2YP for [SUSTAINED HITS 2] ranged.", fx: [{ k: 'grant', ab: 'sustained', val: 2, cond: 'rangedOnly', selfOnly: true }] },
          { name: "Precursive Judgement", pts: 15, restrict: "K\u00c2HL", desc: "0CP Fire Overwatch near a transport, hitting on 5+.", fx: [] },
          { name: "Signature Restoration", pts: 5, restrict: "IRON-MASTER", desc: "Repaired models regain 1 extra wound.", fx: [] }
        ],
        stratagems: [
          { name: "Secure Positions", cp: 1, type: "Strategic Ploy", when: 'anyPhase', targetSelf: true, desc: "Disembark a unit anywhere within 6\" of the transport.", fx: [] },
          { name: "Bastion Running", cp: 1, type: "Battle Tactic", when: 'movement', targetSelf: true, desc: "Hekaton moves through terrain.", fx: [] },
          { name: "Illuminated Priority", cp: 1, type: "Wargear", when: 'shooting', targetSelf: true, desc: "Infantry re-roll Hits of 1 vs a marked enemy.", fx: [{ k: 'rerollHit', val: 1 }] },
          { name: "Inexorable Efficiency", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }] },
          { name: "Opportunistic Escalation", cp: 1, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "Hostile Acquisition only: a hit vehicle makes a D6\" move.", fx: [{ k: 'extraMove', dice: 'D6', cond: 'votannHostile' }] },
          { name: "Vengeance Flare", cp: 2, type: "Strategic Ploy", when: 'oppShootResolved', targetSelf: true, desc: "A nearby Kapricus/Sagitaur (YP: Hekaton) shoots the attacker.", fx: [{ k: 'shootBack' }] }
        ]
      },
      "Hearthfyre Arsenal": {
        // Optimal Application: +1 YP per not-in-zone objective held with an IRON-MASTER/MEMNYR STRATEGIST in range (max 2),
        // wired in votannCommandYield. The +Hit-of-1 spend is modelled via the Stratagems.
        rule: { name: "Optimal Application", desc: "At end of Command phase, +1YP per not-in-zone objective you hold with an Iron-master/Memnyr Strategist in range (max 2). In Shooting, spend 1YP to let a Br\u00f4khyr / Ironkin / Arkanyst unit re-roll Hits of 1.", fx: [] },
        enhancements: [
          { name: "F\u00e2rstrydr Node", pts: 20, restrict: "IRON-MASTER/MEMNYR STRATEGIST", desc: "Bearer's unit gains Deep Strike.", fx: [{ k: 'grantDeepStrike', selfOnly: true }] },
          { name: "Calculated Tenacity", pts: 15, restrict: "IRON-MASTER/MEMNYR STRATEGIST", desc: "+1 OC to the bearer's unit.", fx: [{ k: 'objControl', n: 1, scope: 'army', cond: 'characterLeading' }] },
          { name: "Mantle of Elders", pts: 10, restrict: "MEMNYR STRATEGIST", desc: "Chance to refund 1YP when spending on Optimal Application.", fx: [] },
          { name: "Graviton Vault", pts: 5, restrict: "IRON-MASTER", desc: "Suppress a Monster/Vehicle the bearer hits (-1 Hit).", fx: [] }
        ],
        stratagems: [
          { name: "Unwavering Accuracy", cp: 2, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "Ignore modifiers to BS/Hit/Wound/AP (Thunderkyn).", fx: [{ k: 'ignoreModifiers' }] },
          { name: "First Concern", cp: 1, type: "Strategic Ploy", when: 'shooting', targetSelf: true, desc: "A stationary heavy unit makes a Normal move.", fx: [] },
          { name: "Delayed-fire Rounds", cp: 1, type: "Wargear", when: 'shooting', targetSelf: true, desc: "Mortal wounds to a hit enemy as it moves.", fx: [] },
          { name: "Wall of Steel", cp: 1, type: "Battle Tactic", when: 'charge', targetSelf: true, desc: "Mortal wounds on an Ironkin charge.", fx: [] },
          { name: "Preventative Purge", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Shoot an enemy that Fell Back (at -1 Hit).", fx: [{ k: 'shootBack' }] },
          { name: "Cogitated Need", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Ironkin make a Normal move toward an objective.", fx: [{ k: 'extraMove', val: '6' }] }
        ]
      },
      "Hearthband": {
        // Methodical Annihilation: attacks vs the closest eligible target (or a target in Engagement Range) re-roll Wounds of 1,
        // and KAHL / EINHYR HEARTHGUARD / UTHAR improve AP by 1. Modelled with closestTarget; the +AP keys on those keywords.
        rule: { name: "Methodical Annihilation", desc: "Against the closest eligible target (or one in Engagement Range), re-roll Wounds of 1; if the unit is a K\u00e2hl / Einhyr Hearthguard / \u00dcthar, +1 AP as well.",
          fx: [
            { k: 'rerollWound', val: 1, cond: 'closestTarget', scope: 'army' },
            { k: 'plusApMelee', n: 1, cond: 'closestTarget+isEinhyr', scope: 'army' },
            { k: 'plusApRanged', n: 1, cond: 'closestTarget+isEinhyr', scope: 'army' }
          ] },
        enhancements: [
          { name: "Bastion Shield", pts: 25, restrict: "LEAGUES OF VOTANN", desc: "Incoming ranged within 12\" (YP: 18\") worsen AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1, cond: 'attackerBeyond12', selfOnly: true }] },
          { name: "Quake Multigenerator", pts: 15, restrict: "K\u00c2HL", desc: "Suppress an enemy the bearer hits (-1 Hit).", fx: [] },
          { name: "Ironskein", pts: 10, restrict: "LEAGUES OF VOTANN", desc: "+2 Wounds.", fx: [] },
          { name: "High K\u00e2hl", pts: 30, restrict: "K\u00c2HL", desc: "Bearer's unit fights on death (4+).", fx: [{ k: 'fightOnDeath', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Br\u00ebkkeknots", cp: 1, type: "Battle Tactic", when: 'targeted', targetSelf: true, desc: "4+ invulnerable save (K\u00e2hl/\u00dcthar/Einhyr).", fx: [{ k: 'invuln', val: 4, defensive: true }] },
          { name: "Sure of Purpose", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Pile-in/Consolidate up to 6\".", fx: [] },
          { name: "Superior Craftsmanship", cp: 2, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "+1 Damage vs Monster/Vehicle.", fx: [{ k: 'addWound', n: 0, cond: 'targetMonsterVehicle' }] },
          { name: "Unyielding Aggression", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot/charge after Falling Back (Infantry).", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Materialisation Matrices", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Deep Strike within 6\" (no charge).", fx: [{ k: 'grantDeepStrike' }] },
          { name: "Fury of the Hearth", cp: 1, type: "Battle Tactic", when: 'shooting', targetSelf: true, desc: "+1 ranged Strength (YP: +[SUSTAINED HITS 1]), Einhyr.", fx: [{ k: 'plusStrRanged', n: 1 }] }
        ]
      },
      "Mercenary Oathband": {
        // Ruthless Reinvestment: no automatic stance flip; spend 3YP at end of Command phase to flip. Modelled by suppressing
        // the auto-flip in updateVotannStance; the panel Toggle button performs the manual 3YP flip.
        rule: { name: "Ruthless Reinvestment", desc: "Your army does not flip stance automatically. It starts with Hostile Acquisition; at end of your Command phase you may spend 3YP to switch to the other stance (use the panel Toggle).", fx: [] },
        enhancements: [
          { name: "Mercenary Prospector", pts: 20, restrict: "K\u00c2HL", desc: "Gain 2YP each time the bearer's unit destroys an enemy.", fx: [] },
          { name: "Metaphysical Brokerage", pts: 20, restrict: "MEMNYR STRATEGIST", desc: "Top up to 3YP gained at end of turn.", fx: [] },
          { name: "Etacarn SB9 Targeting Implant", pts: 15, restrict: "LEAGUES OF VOTANN", desc: "Re-roll a Hit roll of 1; spend 3YP for [SUSTAINED HITS 1].", fx: [{ k: 'rerollHit', val: 1, selfOnly: true }] },
          { name: "Asset Manipulator", pts: 25, restrict: "LEAGUES OF VOTANN", desc: "Spend 3YP to drop nearby enemy OC by 1.", fx: [] }
        ],
        stratagems: [
          { name: "Auxiliary Contract", cp: 1, type: "Strategic Ploy", when: 'shootOrFight', targetSelf: true, desc: "Weapons gain [PRECISION].", fx: [{ k: 'grant', ab: 'precision' }] },
          { name: "Optimal Expenditure", cp: 1, type: "Wargear", when: 'fight', targetSelf: true, desc: "Re-roll Hits & Wounds of 1 (YP: full Wound re-roll).", fx: [{ k: 'rerollHit', val: 1, cond: 'meleeOnly' }, { k: 'rerollWound', val: 1, cond: 'meleeOnly' }] },
          { name: "Grand Artifice", cp: 1, type: "Strategic Ploy", when: 'movement', targetSelf: true, desc: "Shoot/charge after Falling Back.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Privateer Arsenal", cp: 1, type: "Wargear", when: 'shooting', targetSelf: true, desc: "Re-roll Hits & Wounds of 1 (YP: full Hit re-roll).", fx: [{ k: 'rerollHit', val: 1, cond: 'rangedOnly' }, { k: 'rerollWound', val: 1, cond: 'rangedOnly' }] },
          { name: "New Horizons", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Embark a unit within 6\" of a transport.", fx: [] },
          { name: "Mobile Exploitation", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull HERNKYN units into Strategic Reserves.", fx: [{ k: 'toReserves' }] }
        ]
      }
    }
  },

  "Emperor's Children": {
    armyRule: {
      name: "Thrill Seekers",
      desc: "EMPEROR'S CHILDREN units are eligible to shoot and declare a charge in a turn in which they Advanced or Fell Back (target restrictions apply). Pact of Excess: cannot select Legions of Excess as Army Faction.",
      fx: [
        { k: 'eligShootAfterAdvance', scope: 'army' },
        { k: 'eligChargeAfterAdvance', scope: 'army' },
        { k: 'eligShootAfterFallBack', scope: 'army' },
        { k: 'eligChargeAfterFallBack', scope: 'army' }
      ]
    },
    restrictions: ["Emperor's Children army. Thrill Seekers' target restrictions (can't target a unit you were in Engagement Range of at the start of the turn, or one already targeted this phase) aren't enforced by the abstract board. Legions of Excess allied composition (Carnival of Excess, several stratagems) isn't modelled — the sim runs a single faction. Pledges to the Dark Prince (Coterie) and Favoured Champions (Slaanesh's Chosen) are tracked in the panel."],
    detachments: {
      "Mercurial Host": {
        rule: { name: "Quicksilver Grace", desc: "Re-roll Advance rolls for EMPEROR'S CHILDREN units.", fx: [{ k: 'rerollAdvance', scope: 'army' }] },
        enhancements: [
          { name: "Steeped in Suffering", pts: 20, restrict: "EMPEROR'S CHILDREN", desc: "+1 Hit vs a target below Starting Strength; +1 Wound as well if it's also Below Half-strength.", fx: [{ k: 'addHit', n: 1, cond: 'targetBelowStrength' }, { k: 'addWound', n: 1, cond: 'targetBelowHalf' }] },
          { name: "Intoxicating Musk", pts: 20, restrict: "EMPEROR'S CHILDREN", desc: "Defensive: −1 to incoming Wound rolls from melee attacks where S > this unit's T.", fx: [{ k: 'subIncomingWound', n: 1, defensive: true, cond: 'incomingStrHigherThanSelfT+meleeOnly' }] },
          { name: "Tactical Perfection", pts: 15, restrict: "EMPEROR'S CHILDREN", desc: "Redeploy up to two units after deployment (may go to Strategic Reserves).", fx: [{ k: 'toReserves' }] },
          { name: "Loathsome Dexterity", pts: 10, restrict: "EMPEROR'S CHILDREN", desc: "Bearer's unit can move through enemy models (Desperate Escape auto-passed).", fx: [] }
        ],
        stratagems: [
          { name: "Violent Excess", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Melee weapons gain [SUSTAINED HITS 1].", fx: [{ k: 'grant', ab: 'sustained', val: 1 }] },
          { name: "Combat Stimms", cp: 2, type: "Battle Tactic", when: 'fightTargeted', targetSelf: true, desc: "Defensive: −1 to incoming Wound rolls.", fx: [{ k: 'subIncomingWound', n: 1, defensive: true }] },
          { name: "Honour the Prince", cp: 1, type: "Battle Tactic", when: 'move', targetSelf: true, desc: "Advance without rolling; +6\" Move instead.", fx: [{ k: 'extraMove', val: '6' }] },
          { name: "Dark Vigour", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Make a Normal move of up to 6\".", fx: [{ k: 'extraMove', val: '6' }] },
          { name: "Capricious Reactions", cp: 1, type: "Battle Tactic", when: 'oppShootTargeted', targetSelf: true, desc: "Defensive: −1 to incoming Hit rolls.", fx: [{ k: 'subIncomingHit', n: 1, defensive: true }] },
          { name: "Cruel Raiders", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Pull a unit near a board edge into Strategic Reserves.", fx: [{ k: 'toReserves' }] }
        ]
      },
      "Peerless Bladesmen": {
        rule: { name: "Exquisite Swordsmanship", desc: "A unit that made a Charge move picks [LETHAL HITS] or [SUSTAINED HITS 1] for its melee weapons (modelled as both granted on the charge).", fx: [{ k: 'grant', ab: 'lethal', scope: 'army', cond: 'chargedThisTurn+meleeOnly' }, { k: 'grant', ab: 'sustained', val: 1, scope: 'army', cond: 'chargedThisTurn+meleeOnly' }] },
        enhancements: [
          { name: "Faultless Opportunist", pts: 15, restrict: "EMPEROR'S CHILDREN", desc: "Free Heroic Intervention on the bearer's unit (no in-combat fx).", fx: [] },
          { name: "Blinding Speed", pts: 25, restrict: "EMPEROR'S CHILDREN", desc: "Once/battle the bearer's unit has Fights First for a phase.", fx: [{ k: 'fightsFirst', selfOnly: true }] },
          { name: "Distortion", pts: 25, restrict: "EMPEROR'S CHILDREN", desc: "+1 Attacks and +1 Damage to the bearer's melee weapons.", fx: [{ k: 'plusAttacksMelee', n: 1, selfOnly: true }] },
          { name: "Rise to the Challenge", pts: 30, restrict: "EMPEROR'S CHILDREN", desc: "Once/battle the bearer fights an extra time when surrounded (logged).", fx: [] }
        ],
        stratagems: [
          { name: "Deft Parry", cp: 1, type: "Battle Tactic", when: 'fightTargeted', targetSelf: true, desc: "Defensive: −1 to incoming Hit rolls.", fx: [{ k: 'subIncomingHit', n: 1, defensive: true }] },
          { name: "Death Ecstasy", cp: 2, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "Destroyed models fight before removal.", fx: [{ k: 'fightOnDeath' }] },
          { name: "Incessant Violence", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Consolidate up to 6\" (logged).", fx: [] },
          { name: "Cruel Bladesman", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Charged this turn: +1 melee AP.", fx: [{ k: 'plusApMelee', n: 1, cond: 'chargedThisTurn' }] },
          { name: "Terrifying Spectacle", cp: 1, type: "Strategic Ploy", when: 'oppCommand', targetSelf: true, desc: "Enemy units within 6\" take a Battle-shock test (logged).", fx: [{ k: 'selfBattleshock' }] },
          { name: "Cut Down the Weak", cp: 2, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "Declare a charge at a falling-back enemy (no Charge bonus).", fx: [] }
        ]
      },
      "Rapid Evisceration": {
        rule: { name: "Mechanised Murder", desc: "A TRANSPORT model, or a model that disembarked this turn, re-rolls a Hit roll of 1 and a Wound roll of 1. Disembarking isn't modelled, so applied to VEHICLE/TRANSPORT units.", fx: [{ k: 'rerollHit', val: 1, scope: 'army', cond: 'isVehicle' }, { k: 'rerollWound', val: 1, scope: 'army', cond: 'isVehicle' }] },
        enhancements: [
          { name: "Sublime Prescience", pts: 25, restrict: "EMPEROR'S CHILDREN", desc: "A reserved TRANSPORT arrives a round earlier (logged).", fx: [] },
          { name: "Spearhead Striker", pts: 20, restrict: "EMPEROR'S CHILDREN", desc: "On disembark, re-roll Charge rolls; no Overwatch against the unit (logged).", fx: [{ k: 'rerollCharge', selfOnly: true }] },
          { name: "Accomplished Tactician", pts: 35, restrict: "EMPEROR'S CHILDREN", desc: "Re-embark a hit unit into a transport (logged).", fx: [] },
          { name: "Heretek Adept", pts: 35, restrict: "EMPEROR'S CHILDREN", desc: "Once/round set a failed save's Damage to 0 for a nearby VEHICLE (logged).", fx: [] }
        ],
        stratagems: [
          { name: "Onto the Next", cp: 1, type: "Strategic Ploy", when: 'fightEnd', targetSelf: true, desc: "Re-embark a unit that destroyed an enemy (logged).", fx: [] },
          { name: "Advance and Claim", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Hold an objective your transport is on (sticky).", fx: [{ k: 'stickyObjective' }] },
          { name: "Dynamic Breakthrough", cp: 1, type: "Epic Deed", when: 'move', targetSelf: true, desc: "Vehicle moves through enemy models this phase (logged).", fx: [] },
          { name: "Ceaseless Onslaught", cp: 1, type: "Strategic Ploy", when: 'charge', targetSelf: true, desc: "A disembarked unit is eligible to charge.", fx: [{ k: 'eligChargeAfterAdvance' }] },
          { name: "Reactive Disembarkation", cp: 1, type: "Strategic Ploy", when: 'oppShootTargeted', targetSelf: true, desc: "Disembark a unit from the targeted transport (logged).", fx: [] },
          { name: "Outflanking Strike", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Put transports near a board edge into Strategic Reserves.", fx: [{ k: 'toReserves' }] }
        ]
      },
      "Carnival of Excess": {
        rule: { name: "Daemonic Empowerment", desc: "Units near allied Legions of Excess are Empowered: weapons gain [SUSTAINED HITS 1], or crit-on-5+ if already Sustained. Allies aren't modelled, so applied army-wide to EC units.", fx: [] },
        enhancements: [
          { name: "Empyric Suffusion", pts: 15, restrict: "EMPEROR'S CHILDREN", desc: "Free Heroic Intervention on a nearby SLAANESH unit (logged).", fx: [] },
          { name: "Dark Blessings", pts: 10, restrict: "EMPEROR'S CHILDREN", desc: "Once/battle the bearer has a 3+ invulnerable save for a phase.", fx: [{ k: 'invuln', val: 3, defensive: true, selfOnly: true }] },
          { name: "Possessed Blade", pts: 25, restrict: "EMPEROR'S CHILDREN", desc: "+1 Attacks to one melee weapon; on fighting, +1 Damage and [DEVASTATING WOUNDS] (and [HAZARDOUS]).", fx: [{ k: 'plusAttacksMelee', n: 1, selfOnly: true }, { k: 'grant', ab: 'devastating', cond: 'meleeOnly' }] },
          { name: "Warp Walker", pts: 30, restrict: "EMPEROR'S CHILDREN", desc: "Advance without rolling for +6\" Move; move through enemy models.", fx: [{ k: 'rerollAdvance', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Sustained by Agony", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Heal/return models to a nearby Legions of Excess unit (logged).", fx: [] },
          { name: "Ecstatic Slaughter", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "An EC unit near a killing daemon can charge (logged).", fx: [] },
          { name: "Violent Crescendo", cp: 2, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Bigger Pile-in/Consolidate for SLAANESH units (logged).", fx: [] },
          { name: "Sycophantic Surge", cp: 1, type: "Battle Tactic", when: 'charge', targetSelf: true, desc: "A Legions of Excess unit can charge after Advancing/Falling Back.", fx: [{ k: 'eligChargeAfterAdvance' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Uncanny Reactions", cp: 1, type: "Battle Tactic", when: 'oppShootTargeted', targetSelf: true, desc: "Defensive: −1 to incoming Hit rolls.", fx: [{ k: 'subIncomingHit', n: 1, defensive: true }] },
          { name: "Dark Apparitions", cp: 2, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Put a Daemonettes unit into Strategic Reserves (deep-strike closer).", fx: [{ k: 'toReserves' }] }
        ]
      },
      "Coterie of the Conceited": {
        rule: { name: "Pledges to the Dark Prince", desc: "At round start pledge a number of enemy units to destroy; meet it to bank that many Pact points, miss it for D3 mortals on the Warlord. Cumulative tiers: 1+ re-roll Hit 1; 3+ re-roll Wound 1; 5+ melee Lethal+Sustained; 7+ crit on 5+. (Wired in the engine; panel shows pledge/Pact points.)", fx: [] },
        enhancements: [
          { name: "Pledge of Eternal Servitude", pts: 25, restrict: "EMPEROR'S CHILDREN", desc: "First time destroyed, the bearer may return on a Leadership test (logged).", fx: [{ k: 'resurrect' }] },
          { name: "Pledge of Dark Glory", pts: 25, restrict: "EMPEROR'S CHILDREN", desc: "+1 Leadership and +1 Objective Control to the bearer's unit.", fx: [{ k: 'objControl', n: 1, scope: 'army', cond: 'characterLeading' }] },
          { name: "Pledge of Mortal Pain", pts: 15, restrict: "EMPEROR'S CHILDREN", desc: "Shooting phase: a nearby enemy tests Leadership or takes 3 mortal wounds (logged).", fx: [] },
          { name: "Pledge of Unholy Fortune", pts: 30, restrict: "EMPEROR'S CHILDREN", desc: "Once/turn treat a roll as an unmodified 6 (logged).", fx: [] }
        ],
        stratagems: [
          { name: "Protection of the Dark Prince", cp: 1, type: "Strategic Ploy", when: 'anyTargeted', targetSelf: true, desc: "Feel No Pain 6+ (4+ vs mortal wounds) for a phase.", fx: [{ k: 'fnp', val: 6, defensive: true }] },
          { name: "Unshakeable Opponents", cp: 1, type: "Epic Deed", when: 'command', targetSelf: true, desc: "Ignore modifiers to BS/WS, Hit and Wound rolls this turn.", fx: [{ k: 'ignoreModifiers' }] },
          { name: "Embrace the Pain", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Enemies in Engagement Range must target your unit (logged).", fx: [] },
          { name: "Martial Perfection", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Re-roll the Hit roll.", fx: [{ k: 'rerollHit', val: 'all' }] },
          { name: "Unbound Arrogance", cp: 1, type: "Epic Deed", when: 'fight', targetSelf: true, desc: "Increase your pledge to Slaanesh by 1 (use the panel's Pledge +1).", fx: [] },
          { name: "Armour of Abhorrence", cp: 1, type: "Wargear", when: 'oppShootTargeted', targetSelf: true, desc: "Defensive: worsen incoming AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1, defensive: true }] }
        ]
      },
      "Slaanesh's Chosen": {
        rule: { name: "Internal Rivalries", desc: "EC CHARACTERs ignore modifiers to Move/Advance/Charge. The army's Favoured Champions unit (starts as the Warlord's unit; reassigned when an EC CHARACTER destroys an enemy) re-rolls the Wound roll. (Wired in the engine; panel shows the current Favoured Champions.)", fx: [] },
        enhancements: [
          { name: "Eager to Prove", pts: 15, restrict: "EMPEROR'S CHILDREN", desc: "Re-roll Charge rolls; +2\" Move while the bearer's unit is Favoured Champions.", fx: [{ k: 'rerollCharge', selfOnly: true }] },
          { name: "Repulsed by Weakness", pts: 25, restrict: "EMPEROR'S CHILDREN", desc: "Enemies falling back near the bearer take −1 Desperate Escape if Favoured (logged).", fx: [] },
          { name: "Proud and Vainglorious", pts: 20, restrict: "EMPEROR'S CHILDREN", desc: "Re-roll Battle-shock/Leadership; +1 OC while Favoured Champions.", fx: [] },
          { name: "Slayer of Champions", pts: 15, restrict: "EMPEROR'S CHILDREN", desc: "Bearer's melee gain [PRECISION]; +1 S and +1 AP vs CHARACTERs.", fx: [{ k: 'grant', ab: 'precision', cond: 'meleeOnly' }, { k: 'plusStrMelee', n: 1, cond: 'targetCharacter', selfOnly: true }, { k: 'plusApMelee', n: 1, cond: 'targetCharacter', selfOnly: true }] }
        ],
        stratagems: [
          { name: "Devoted Duellists", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "CHARACTER melee weapons gain [SUSTAINED HITS 1] vs a chosen unit.", fx: [{ k: 'grant', ab: 'sustained', val: 1, cond: 'meleeOnly' }] },
          { name: "Beautiful Death", cp: 1, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "Destroyed CHARACTER models may fight before removal.", fx: [{ k: 'fightOnDeath' }] },
          { name: "Heightened Jealousy", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Non-Favoured EC CHARACTERs get +1 Strength (logged).", fx: [] },
          { name: "Diabolic Majesty", cp: 1, type: "Epic Deed", when: 'fight', targetSelf: true, desc: "Enemies within 6\" of the new Favoured Champions take a Battle-shock test (logged).", fx: [{ k: 'selfBattleshock' }] },
          { name: "Refusal to be Outdone", cp: 1, type: "Battle Tactic", when: 'charge', targetSelf: true, desc: "+2 to a Charge roll against a chosen enemy.", fx: [{ k: 'rerollCharge' }] },
          { name: "Vengeful Surge", cp: 1, type: "Strategic Ploy", when: 'oppShootTargeted', targetSelf: true, desc: "Make a Surge move after being shot (logged).", fx: [] }
        ]
      },
      "Court of the Phoenician": {
        rule: { name: "Sensational Performance", desc: "A unit that made a Charge move improves the Strength and AP of its melee weapons by 1 (target restrictions not enforced).", fx: [{ k: 'plusStrMelee', n: 1, scope: 'army', cond: 'chargedThisTurn' }, { k: 'plusApMelee', n: 1, scope: 'army', cond: 'chargedThisTurn' }] },
        enhancements: [
          { name: "Tears of the Phoenix", pts: 25, restrict: "EMPEROR'S CHILDREN", desc: "Ignore modifiers to melee WS, Hit and Wound rolls.", fx: [{ k: 'ignoreModifiers', cond: 'meleeOnly' }] },
          { name: "Exalted Patron", pts: 15, restrict: "LORD EXULTANT", desc: "+1\" Move; can join a Flawless Blades unit (logged).", fx: [] },
          { name: "Soulstain Made Manifest", pts: 15, restrict: "EMPEROR'S CHILDREN", desc: "Start of Fight: a nearby enemy takes a −1 Battle-shock test (logged).", fx: [] },
          { name: "Spiritsliver", pts: 20, restrict: "DAEMON PRINCE", desc: "+1 Strength and +1 Attacks to the bearer's melee weapons.", fx: [{ k: 'plusStrMelee', n: 1, selfOnly: true }, { k: 'plusAttacksMelee', n: 1, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Contemptuous Disregard", cp: 1, type: "Strategic Ploy", when: 'oppShootTargeted', targetSelf: true, desc: "Defensive: −1 to incoming Wound rolls when the attack's S > your T.", fx: [{ k: 'subIncomingWound', n: 1, defensive: true, cond: 'incomingStrHigherThanSelfT' }] },
          { name: "Prideful Superiority", cp: 2, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Re-roll Hit and Wound vs CHARACTER units.", fx: [{ k: 'rerollHit', val: 'all', cond: 'targetCharacter' }, { k: 'rerollWound', val: 'all', cond: 'targetCharacter' }] },
          { name: "Sinuous Breach", cp: 1, type: "Strategic Ploy", when: 'move', targetSelf: true, desc: "DAEMON unit moves through terrain (logged).", fx: [] },
          { name: "Close-Quarters Excruciation", cp: 1, type: "Battle Tactic", when: 'shoot', targetSelf: true, desc: "+1 S and +1 AP vs targets within 12\".", fx: [{ k: 'plusStrRanged', n: 1, cond: 'within12' }, { k: 'plusApRanged', n: 1, cond: 'within12' }] },
          { name: "Euphoric Inspiration", cp: 1, type: "Strategic Ploy", when: 'charge', targetSelf: true, desc: "Re-roll Charge rolls for nearby EC units.", fx: [{ k: 'rerollCharge' }] },
          { name: "Catalytic Stimulus", cp: 1, type: "Strategic Ploy", when: 'oppShoot', targetSelf: true, desc: "Make a Stimulus move after being shot (logged).", fx: [] }
        ]
      }
    }
  },

  "Adepta Sororitas": {
    armyRule: {
      name: "Acts of Faith",
      desc: "Each unit can perform one Act of Faith per phase using Miracle dice — substitute a pre-rolled valued die into a roll. Gain 1 Miracle dice at the start of each battle round and 1 each time an ADEPTA SORORITAS unit is destroyed. (Pool, gains, and Battle-shock substitution are wired; the panel manages the pool.)",
      fx: []
    },
    restrictions: ["Adepta Sororitas army. Acts of Faith: the Miracle-dice pool and its round/death gains are tracked, and a die can be substituted into Battle-shock tests via the panel. Substituting into in-attack Hit/Wound/Damage/Advance/Charge/Save rolls isn't threaded into the batch dice resolver, so those Acts are resolved against the abstract engine. Many enhancements/stratagems manipulate the Miracle pool (re-roll, set to 6, convert) and are logged."],
    detachments: {
      "Hallowed Martyrs": {
        rule: { name: "The Blood of Martyrs", desc: "+1 Hit while the unit is below Starting Strength; +1 Wound as well while Below Half-strength.", fx: [{ k: 'addHit', n: 1, scope: 'army', cond: 'selfBelowStrength' }, { k: 'addWound', n: 1, scope: 'army', cond: 'selfBelowHalf' }] },
        enhancements: [
          { name: "Saintly Example", pts: 10, restrict: "ADEPTA SORORITAS", desc: "When the bearer is destroyed, gain D3 Miracle dice (logged).", fx: [] },
          { name: "Through Suffering, Strength", pts: 25, restrict: "ADEPTA SORORITAS", desc: "+1 A/S/Damage to the bearer's melee (+2 if the bearer has lost wounds).", fx: [{ k: 'plusAttacksMelee', n: 1, selfOnly: true }, { k: 'plusStrMelee', n: 1, selfOnly: true }] },
          { name: "Chaplet of Sacrifice", pts: 25, restrict: "ADEPTA SORORITAS", desc: "End of Command: re-roll 1 (or 3 if below strength) Miracle dice (logged).", fx: [] },
          { name: "Mantle of Ophelia", pts: 20, restrict: "CANONESS", desc: "Change the Damage of attacks allocated to the bearer to 1.", fx: [{ k: 'reduceIncomingDmg', n: 99, defensive: true, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Divine Intervention", cp: 1, type: "Epic Deed", when: 'any', targetSelf: true, desc: "Discard Miracle dice to return a destroyed CHARACTER (logged).", fx: [{ k: 'resurrect' }] },
          { name: "Suffering and Sacrifice", cp: 1, type: "Strategic Ploy", when: 'fight', targetSelf: true, desc: "Enemies in Engagement Range must target your unit (logged).", fx: [] },
          { name: "Righteous Vengeance", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Re-roll melee Hits (and Wounds if Below Half-strength).", fx: [{ k: 'rerollHit', val: 'all', cond: 'meleeOnly' }, { k: 'rerollWound', val: 'all', cond: 'meleeOnly+selfBelowHalf' }] },
          { name: "Sanctified Immolation", cp: 1, type: "Strategic Ploy", when: 'any', targetSelf: true, desc: "Deadly Demise mortals auto-inflicted (logged).", fx: [] },
          { name: "Spirit of the Martyr", cp: 2, type: "Strategic Ploy", when: 'fightTargeted', targetSelf: true, desc: "Destroyed models fight before removal.", fx: [{ k: 'fightOnDeath' }] },
          { name: "Praise the Fallen", cp: 1, type: "Strategic Ploy", when: 'oppShoot', targetSelf: true, desc: "Shoot back at a unit that destroyed your models (logged).", fx: [{ k: 'shootBack' }] }
        ]
      },
      "Penitent Host": {
        rule: { name: "Desperate for Redemption", desc: "Pick a Vow of Atonement each round (panel): Path of the Penitent (+3\" Move to PENITENT), Absolution in Battle (charged → +1 A/S melee for PENITENT), or Death Before Disgrace (PENITENT fight on death).", fx: [{ k: 'plusAttacksMelee', n: 1, scope: 'army', cond: 'vowAbsolution' }, { k: 'plusStrMelee', n: 1, scope: 'army', cond: 'vowAbsolution' }] },
        enhancements: [
          { name: "Psalm of Righteous Judgement", pts: 30, restrict: "ADEPTA SORORITAS", desc: "Convert a Miracle die to a 6 when a PENITENT unit kills (logged).", fx: [] },
          { name: "Verse of Holy Piety", pts: 15, restrict: "PENITENT", desc: "Once/battle a second Vow for the bearer's unit (logged).", fx: [] },
          { name: "Refrain of Enduring Faith", pts: 25, restrict: "PENITENT", desc: "Bearer's unit has a 5+ invulnerable save.", fx: [{ k: 'invuln', val: 5, defensive: true }] },
          { name: "Catechism of Divine Penitence", pts: 20, restrict: "CANONESS", desc: "Bearer gains PENITENT; can join a Repentia Squad (logged).", fx: [] }
        ],
        stratagems: [
          { name: "Final Redemption", cp: 1, type: "Epic Deed", when: 'any', targetSelf: true, desc: "Keep an objective a destroyed PENITENT unit held (sticky).", fx: [{ k: 'stickyObjective' }] },
          { name: "Purity of Suffering", cp: 1, type: "Battle Tactic", when: 'oppShootTargeted', targetSelf: true, desc: "PENITENT models gain Feel No Pain 4+.", fx: [{ k: 'fnp', val: 4, defensive: true }] },
          { name: "Passion of the Penitent", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "PENITENT melee crit on unmodified 5+.", fx: [{ k: 'critOn', val: 5, cond: 'meleeOnly' }] },
          { name: "Lash of Guilt", cp: 1, type: "Battle Tactic", when: 'move', targetSelf: true, desc: "Charge in a turn it Advanced.", fx: [{ k: 'eligChargeAfterAdvance' }] },
          { name: "Boundless Zeal", cp: 1, type: "Strategic Ploy", when: 'move', targetSelf: true, desc: "Shoot/charge in a turn it Fell Back.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack' }] },
          { name: "Devout Fanaticism", cp: 1, type: "Strategic Ploy", when: 'oppShoot', targetSelf: true, desc: "Make a D6\" move toward the enemy after being shot (logged).", fx: [] }
        ]
      },
      "Bringers of Flame": {
        rule: { name: "Fervent Purgation", desc: "ADEPTA SORORITAS ranged weapons have [ASSAULT]; +1 Strength to attacks targeting a unit within 6\".", fx: [{ k: 'grant', ab: 'assault', scope: 'army' }, { k: 'plusStrRanged', n: 1, scope: 'army', cond: 'within6+rangedOnly' }] },
        enhancements: [
          { name: "Righteous Rage", pts: 15, restrict: "ADEPTA SORORITAS", desc: "Discard up to 3 Miracle dice for +1 A/S melee each (logged).", fx: [] },
          { name: "Manual of Saint Griselda", pts: 20, restrict: "ADEPTA SORORITAS", desc: "Convert two Miracle dice into one summed die (logged).", fx: [] },
          { name: "Fire and Fury", pts: 30, restrict: "ADEPTA SORORITAS", desc: "Bearer's unit: +1 Attacks to Torrent; other ranged gain [SUSTAINED HITS 1].", fx: [{ k: 'grant', ab: 'sustained', val: 1, cond: 'rangedOnly' }] },
          { name: "Iron Surplice of Saint Istalela", pts: 10, restrict: "CANONESS", desc: "Bearer has Save 2+ and Feel No Pain 5+.", fx: [{ k: 'fnp', val: 5, defensive: true, selfOnly: true }] }
        ],
        stratagems: [
          { name: "Shield of Aversion", cp: 1, type: "Battle Tactic", when: 'oppShootTargeted', targetSelf: true, desc: "Defensive: worsen incoming AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1, defensive: true }] },
          { name: "Righteous Blows", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Melee gain [LETHAL HITS].", fx: [{ k: 'grant', ab: 'lethal' }] },
          { name: "Carry Forth the Faithful", cp: 1, type: "Strategic Ploy", when: 'move', targetSelf: true, desc: "Re-roll Advance; disembark after Advancing (logged).", fx: [{ k: 'rerollAdvance' }] },
          { name: "Cleansing Flames", cp: 2, type: "Battle Tactic", when: 'shoot', targetSelf: true, desc: "Torrent weapons gain [DEVASTATING WOUNDS].", fx: [{ k: 'grant', ab: 'devastating', cond: 'rangedOnly' }] },
          { name: "Rites of Fire", cp: 1, type: "Battle Tactic", when: 'shoot', targetSelf: true, desc: "Disembarked: +1 Wound vs units within 6\" on an objective.", fx: [{ k: 'addWound', n: 1, cond: 'within6+rangedOnly' }] },
          { name: "Blazing Ire", cp: 2, type: "Strategic Ploy", when: 'oppShoot', targetSelf: true, desc: "Disembark and shoot back at the attacker (logged).", fx: [{ k: 'shootBack' }] }
        ]
      },
      "Army of Faith": {
        rule: { name: "Sacred Rites", desc: "Each ADEPTA SORORITAS unit can perform up to two Acts of Faith per phase instead of one (more Miracle-dice substitutions; tracked via the pool).", fx: [] },
        enhancements: [
          { name: "Litanies of Faith", pts: 10, restrict: "CANONESS", desc: "Command phase Leadership test → gain 1 Miracle dice (logged).", fx: [] },
          { name: "Blade of Saint Ellynor", pts: 15, restrict: "ADEPTA SORORITAS", desc: "+1 S/AP and [PRECISION] to the bearer's melee; gain a Miracle die on a kill.", fx: [{ k: 'plusStrMelee', n: 1, selfOnly: true }, { k: 'plusApMelee', n: 1, selfOnly: true }, { k: 'grant', ab: 'precision', cond: 'meleeOnly' }] },
          { name: "Divine Aspect", pts: 5, restrict: "ADEPTA SORORITAS", desc: "Force a nearby enemy Battle-shock test → gain a Miracle die on a fail (logged).", fx: [] },
          { name: "Triptych of the Macharian Crusade", pts: 20, restrict: "ADEPTA SORORITAS", desc: "A save substituted by an Act of Faith auto-succeeds (logged).", fx: [] }
        ],
        stratagems: [
          { name: "Shield of Faith", cp: 1, type: "Battle Tactic", when: 'any', targetSelf: true, desc: "Feel No Pain 5+ vs mortal wounds.", fx: [{ k: 'fnp', val: 5, defensive: true }] },
          { name: "Light of the Emperor", cp: 1, type: "Battle Tactic", when: 'command', targetSelf: true, desc: "Ignore modifiers to characteristics/WS/BS/rolls (not saves).", fx: [{ k: 'ignoreModifiers' }] },
          { name: "Faith and Fury", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Melee gain [LANCE].", fx: [{ k: 'grant', ab: 'lance' }] },
          { name: "Blinding Radiance", cp: 1, type: "Strategic Ploy", when: 'oppShootTargeted', targetSelf: true, desc: "Defensive: −1 to incoming Hit rolls.", fx: [{ k: 'subIncomingHit', n: 1, defensive: true }] },
          { name: "Divine Guidance", cp: 1, type: "Battle Tactic", when: 'shoot', targetSelf: true, desc: "+1 AP to all attacks this phase.", fx: [{ k: 'plusApRanged', n: 1 }, { k: 'plusApMelee', n: 1 }] },
          { name: "Angelic Descent", cp: 1, type: "Strategic Ploy", when: 'oppFightEnd', targetSelf: true, desc: "Put a JUMP PACK unit into Strategic Reserves.", fx: [{ k: 'toReserves' }] }
        ]
      },
      "Champions of Faith": {
        rule: { name: "Righteous Purpose", desc: "Command phase: mark up to 3 units Righteous (panel) until your next Command phase — +1 Move, +1 Leadership, and +1 WS/BS for Battle Sisters/Sacresants/Paragons.", fx: [] },
        enhancements: [
          { name: "Triptych of Judgement", pts: 15, restrict: "ADEPTA SORORITAS", desc: "Ignore modifiers to the bearer's unit's BS/WS and Hit rolls.", fx: [{ k: 'ignoreModifiers' }] },
          { name: "Mark of Devotion", pts: 30, restrict: "ADEPTA SORORITAS", desc: "+1 Attacks melee (+2 A and +1 Damage while Righteous).", fx: [{ k: 'plusAttacksMelee', n: 1, selfOnly: true }, { k: 'plusAttacksMelee', n: 1, selfOnly: true, cond: 'selfRighteous' }] },
          { name: "Eyes of the Oracle", pts: 10, restrict: "ADEPTA SORORITAS", desc: "Bearer's weapons gain [PRECISION]; +1CP on a CHARACTER kill (logged).", fx: [{ k: 'grant', ab: 'precision' }] },
          { name: "Sanctified Amulet", pts: 25, restrict: "ADEPTA SORORITAS", desc: "Enemy Reserves can't arrive within 12\" of the bearer (logged).", fx: [] }
        ],
        stratagems: [
          { name: "Shield of Denial", cp: 1, type: "Battle Tactic", when: 'any', targetSelf: true, desc: "Feel No Pain 6+ vs mortals (5+ if Righteous).", fx: [{ k: 'fnp', val: 6, defensive: true }, { k: 'fnp', val: 5, defensive: true, cond: 'selfRighteous' }] },
          { name: "Suffer Not the Unfaithful", cp: 1, type: "Strategic Ploy", when: 'shoot', targetSelf: true, desc: "Righteous unit: weapons gain [LETHAL HITS] or [SUSTAINED HITS 1].", fx: [{ k: 'grant', ab: 'lethal', cond: 'selfRighteous' }] },
          { name: "To the Heart of Heresy", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "+1 melee Strength (+1 AP as well if Righteous).", fx: [{ k: 'plusStrMelee', n: 1 }, { k: 'plusApMelee', n: 1, cond: 'selfRighteous' }] },
          { name: "Path of the Righteous", cp: 1, type: "Battle Tactic", when: 'fight', targetSelf: true, desc: "Bigger Pile-in/Consolidate (logged).", fx: [] },
          { name: "Bastion of Faith", cp: 1, type: "Battle Tactic", when: 'fightTargeted', targetSelf: true, desc: "Defensive: −1 to incoming Hit rolls.", fx: [{ k: 'subIncomingHit', n: 1, defensive: true }] },
          { name: "Indefatigable Dedication", cp: 1, type: "Strategic Ploy", when: 'move', targetSelf: true, desc: "Shoot (and charge if Righteous) in a turn it Fell Back.", fx: [{ k: 'eligShootAfterFallBack' }, { k: 'eligChargeAfterFallBack', cond: 'selfRighteous' }] }
        ]
      }
    }
  },

  "Astra Militarum": {
    armyRule: {
      name: "Voice of Command",
      desc: "OFFICER models issue Orders (Move! Move! Move!, Fix Bayonets!, Take Aim!, First Rank Fire!, Take Cover!, Duty and Honour!) to a friendly ASTRA MILITARUM unit within 6\" in the Command phase, lasting until your next Command phase. Orders fall off Battle-shocked units. (Issuance, the six effects, and expiry are wired; the panel issues Orders, and the AI auto-issues.)",
      fx: []
    },
    restrictions: ["Astra Militarum army. Orders are issued in the Command phase (panel or auto) and buff Move/WS/BS/Attacks/Save/Ld+OC. Officer-specific Order counts and the many Order-targeting and transport/Strategic-Reserves stratagems are abstracted: each Officer issues at least one Order (Grand Strategist / Ruthless Discipline add more; Laud Hailer extends range to 12\"). Embark/disembark, super-heavy/TITANIC CHARACTER selection, artillery-barrage board effects, and Deep Strike repositioning are approximated or dormant pending those subsystems."],
    detachments: {
      "Combined Arms": {
        rule: { name: "Born Soldiers", desc: "REGIMENT ranged attacks vs non-MONSTER/VEHICLE units have [LETHAL HITS]; SQUADRON ranged attacks vs MONSTER/VEHICLE units have [LETHAL HITS]. Approximated as army-wide ranged [LETHAL HITS].", fx: [{ k: 'grant', ab: 'lethal', scope: 'army', cond: 'rangedOnly' }] },
        enhancements: [
          { name: "Death Mask of Ollanius", pts: 10, restrict: "OFFICER", desc: "Battle-shocked bearer's unit loses only 1 OC instead of all (logged).", fx: [] },
          { name: "Drill Commander", pts: 20, restrict: "OFFICER", desc: "Bearer's unit: ranged crit on 5+ if it Remained Stationary (modelled as crit-on-5+ ranged).", fx: [{ k: 'critOn', val: 5, cond: 'rangedOnly' }] },
          { name: "Grand Strategist", pts: 15, restrict: "OFFICER", desc: "Issue one additional Order each Command phase.", fx: [] },
          { name: "Reactive Command", pts: 15, restrict: "OFFICER", desc: "Issue an Order when an enemy arrives within 9\" (logged).", fx: [] }
        ],
        stratagems: [
          { name: "Coordinated Action", cp: 1, type: "Battle Tactic", when: 'any', targetSelf: true, desc: "Share Orders between a Regiment and a Squadron (logged).", fx: [] },
          { name: "Reinforcements!", cp: 2, type: "Strategic Ploy", when: 'any', targetSelf: true, desc: "Return a destroyed Infantry Regiment unit to Reserves (logged).", fx: [{ k: 'resurrect' }] },
          { name: "Flexible Command", cp: 2, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Officers can Order Regiment and Squadron units (logged).", fx: [] },
          { name: "Fields of Fire", cp: 1, type: "Battle Tactic", when: 'shoot', targetSelf: true, desc: "+1 AP vs a chosen enemy.", fx: [{ k: 'plusApRanged', n: 1 }] },
          { name: "Inspired Command", cp: 1, type: "Epic Deed", when: 'oppCommand', targetSelf: true, desc: "Issue an Order in the opponent's Command phase (logged).", fx: [] },
          { name: "Stalwart Protector", cp: 1, type: "Battle Tactic", when: 'oppShootTargeted', targetSelf: true, desc: "Infantry behind a vehicle gain Benefit of Cover (logged).", fx: [] }
        ]
      },
      "Siege Regiment": {
        rule: { name: "Artillery Support", desc: "Each round pick a barrage: Creeping Barrage (shake distant enemies: −2\" Move, −2 Charge), Incendiary Bombardment (distant enemies lose cover), or Smoke Shells (your units gain Stealth). Barrage board effects are abstracted/logged.", fx: [] },
        enhancements: [
          { name: "Eager Advance", pts: 20, restrict: "OFFICER", desc: "Bearer's Regiment unit has Scouts 6\" (logged).", fx: [] },
          { name: "Flash Grenades", pts: 20, restrict: "OFFICER", desc: "No Overwatch against the bearer's unit (logged).", fx: [] },
          { name: "Legacy Sidearm", pts: 10, restrict: "OFFICER", desc: "+2 Attacks to the bearer's Pistols (logged).", fx: [] },
          { name: "Stalwart's Honours", pts: 15, restrict: "OFFICER", desc: "When the bearer's unit gets an Order, it's also affected by Take Cover! (logged).", fx: [] }
        ],
        stratagems: [
          { name: "Trench Fighters", cp: 1, type: "Battle Tactic", when: 'fightTargeted', targetSelf: true, desc: "Destroyed models fight before removal.", fx: [{ k: 'fightOnDeath' }] },
          { name: "Over the Top", cp: 2, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Move! Move! Move! to any number of Infantry, any range (logged).", fx: [] },
          { name: "Flare Burst", cp: 1, type: "Wargear", when: 'shoot', targetSelf: true, desc: "Re-roll Hits vs visible enemies within 12\".", fx: [{ k: 'rerollHit', val: 'all', cond: 'within12+rangedOnly' }] },
          { name: "Callous Sacrifice", cp: 1, type: "Battle Tactic", when: 'shoot', targetSelf: true, desc: "Shoot out of Engagement Range at a cost (logged).", fx: [] },
          { name: "Furious Fusillade", cp: 1, type: "Strategic Ploy", when: 'shoot', targetSelf: true, desc: "+1 ranged Attack vs targets within half range (≈12\").", fx: [{ k: 'plusAttacksRanged', n: 1, cond: 'within12' }] },
          { name: "Minefield", cp: 1, type: "Wargear", when: 'oppCharge', targetSelf: true, desc: "Mortal wounds to enemies charging into your unit (logged).", fx: [] }
        ]
      },
      "Mechanised Assault": {
        rule: { name: "Armoured Fist", desc: "A model that disembarked from a TRANSPORT this turn adds 1 to its ranged Wound rolls. Disembarking isn't modelled, so applied to INFANTRY ranged attacks army-wide.", fx: [{ k: 'addWound', n: 1, scope: 'army', cond: 'rangedOnly' }] },
        enhancements: [
          { name: "Bold Leadership", pts: 25, restrict: "OFFICER", desc: "Hold an objective near the bearer (sticky).", fx: [{ k: 'stickyObjective' }] },
          { name: "Sacred Unguents", pts: 10, restrict: "TECH-PRIEST", desc: "Re-roll a nearby Transport's Hits (logged).", fx: [] },
          { name: "Smoke Grenades", pts: 10, restrict: "OFFICER", desc: "Cover + Stealth near a Transport (logged).", fx: [] },
          { name: "Vanguard Honours", pts: 15, restrict: "OFFICER", desc: "Disembark after the Transport Advanced (logged).", fx: [] }
        ],
        stratagems: [
          { name: "Vox-Relay", cp: 1, type: "Wargear", when: 'command', targetSelf: true, desc: "Issue Orders from inside a Transport (logged).", fx: [] },
          { name: "Rapid Dispersal", cp: 1, type: "Strategic Ploy", when: 'move', targetSelf: true, desc: "A disembarked unit makes a D6\" move (logged).", fx: [] },
          { name: "Clear and Secure", cp: 1, type: "Battle Tactic", when: 'shoot', targetSelf: true, desc: "Disembarked: re-roll Hits and Wounds vs a unit on an objective.", fx: [{ k: 'rerollHit', val: 'all' }, { k: 'rerollWound', val: 'all' }] },
          { name: "Swift Interception", cp: 1, type: "Battle Tactic", when: 'oppMove', targetSelf: true, desc: "A Transport makes a 6\" Normal move (logged).", fx: [] },
          { name: "Hasty Extraction", cp: 1, type: "Battle Tactic", when: 'oppCharge', targetSelf: true, desc: "Re-embark a charged Infantry unit (logged).", fx: [] },
          { name: "Move Out", cp: 1, type: "Strategic Ploy", when: 'oppTurnEnd', targetSelf: true, desc: "Re-embark a unit at end of opponent's turn (logged).", fx: [] }
        ]
      },
      "Hammer of the Emperor": {
        rule: { name: "Iron Tread", desc: "A SQUADRON unit Advancing doesn't roll: +6\" Move and it can move through enemy models. Advance-move handling is abstracted; the +6\" is applied via the Advance system.", fx: [{ k: 'rerollAdvance', scope: 'army', cond: 'isVehicle' }] },
        enhancements: [
          { name: "Calm Under Fire", pts: 15, restrict: "OFFICER", desc: "Re-issue a Squadron Order to a second Squadron (logged).", fx: [] },
          { name: "Indomitable Steed", pts: 15, restrict: "OFFICER", desc: "Bearer has Feel No Pain 6+.", fx: [{ k: 'fnp', val: 6, defensive: true, selfOnly: true }] },
          { name: "Regimental Banner", pts: 20, restrict: "OFFICER", desc: "+3 Objective Control to the bearer.", fx: [{ k: 'objControl', n: 3, selfOnly: true }] },
          { name: "Veteran Crew", pts: 20, restrict: "OFFICER", desc: "Re-roll ranged Hit rolls of 1 for the bearer's unit.", fx: [{ k: 'rerollHit', val: 1, cond: 'rangedOnly' }] }
        ],
        stratagems: [
          { name: "Final Hour", cp: 1, type: "Epic Deed", when: 'command', targetSelf: true, desc: "Below-half Squadron: ignore BS modifiers (and [HAZARDOUS]).", fx: [{ k: 'ignoreModifiers', cond: 'rangedOnly' }] },
          { name: "Blazing Advance", cp: 1, type: "Battle Tactic", when: 'move', targetSelf: true, desc: "Shoot in a turn it Advanced.", fx: [{ k: 'eligShootAfterAdvance' }] },
          { name: "Tactical Withdrawal", cp: 1, type: "Strategic Ploy", when: 'move', targetSelf: true, desc: "Shoot in a turn it Fell Back.", fx: [{ k: 'eligShootAfterFallBack' }] },
          { name: "Crash Through", cp: 1, type: "Strategic Ploy", when: 'move', targetSelf: true, desc: "Move through terrain (logged).", fx: [] },
          { name: "Furious Cannonade", cp: 1, type: "Battle Tactic", when: 'shoot', targetSelf: true, desc: "+1 AP vs targets within 12\".", fx: [{ k: 'plusApRanged', n: 1, cond: 'within12' }] },
          { name: "Ablative Plating", cp: 2, type: "Wargear", when: 'oppShootTargeted', targetSelf: true, desc: "Defensive: −1 to incoming Damage.", fx: [{ k: 'reduceIncomingDmg', n: 1, defensive: true }] }
        ]
      },
      "Recon Element": {
        rule: { name: "Masters of Camouflage", desc: "ASTRA MILITARUM WALKER and REGIMENT models have Benefit of Cover; if they already have cover, improve their Save by 1 (max 3+). Modelled as a +1 save (capped) army-wide.", fx: [{ k: 'worsenSave', n: -1, defensive: true, scope: 'army' }] },
        enhancements: [
          { name: "Guerrilla Honours", pts: 25, restrict: "OFFICER", desc: "Redeploy up to three Infantry units after deployment (logged).", fx: [{ k: 'toReserves' }] },
          { name: "Scare Gas Grenades", pts: 5, restrict: "ASTRA MILITARUM", desc: "Once/battle force a nearby enemy Battle-shock test (logged).", fx: [] },
          { name: "Survival Gear", pts: 5, restrict: "ASTRA MILITARUM", desc: "Bearer has Scouts 6\" (logged).", fx: [] },
          { name: "Tripwires", pts: 20, restrict: "ASTRA MILITARUM", desc: "Enemies that move within 9\" risk being stunned (−1 to hit) (logged).", fx: [] }
        ],
        stratagems: [
          { name: "Crack Shots", cp: 1, type: "Battle Tactic", when: 'shoot', targetSelf: true, desc: "Ranged weapons gain [PRECISION].", fx: [{ k: 'grant', ab: 'precision', cond: 'rangedOnly' }] },
          { name: "Draw Them Out", cp: 1, type: "Strategic Ploy", when: 'oppMove', targetSelf: true, desc: "A Platoon makes a 6\" Normal move (logged).", fx: [] },
          { name: "Scramble Field", cp: 1, type: "Wargear", when: 'oppMove', targetSelf: true, desc: "Block enemy Reserves within 12\" (logged).", fx: [] },
          { name: "Courageous Diversion", cp: 1, type: "Strategic Ploy", when: 'oppShoot', targetSelf: true, desc: "Feel No Pain 6+ and −1 to be hit if closest.", fx: [{ k: 'fnp', val: 6, defensive: true }, { k: 'subIncomingHit', n: 1, defensive: true }] },
          { name: "Tanglefoot Grenades", cp: 1, type: "Wargear", when: 'oppCharge', targetSelf: true, desc: "−2 to Charge rolls against your unit (logged).", fx: [] },
          { name: "Scouting Outriders", cp: 1, type: "Battle Tactic", when: 'oppTurnEnd', targetSelf: true, desc: "Put a Mounted/Walker unit into Strategic Reserves.", fx: [{ k: 'toReserves' }] }
        ]
      },
      "Bridgehead Strike": {
        rule: { name: "Only the Best", desc: "ASTRA MILITARUM INFANTRY re-roll a ranged Hit roll of 1. (Fire Zone Purge: Tempestus that arrived from Reserves/disembarked add 1 to Hit — abstracted into the re-roll.)", fx: [{ k: 'rerollHit', val: 1, scope: 'army', cond: 'rangedOnly' }] },
        enhancements: [
          { name: "Bombast-class Vox-array", pts: 35, restrict: "OFFICER", desc: "Issue an Order to up to three Regiment units (logged).", fx: [] },
          { name: "Priority-drop Beacon", pts: 30, restrict: "OFFICER", desc: "Deep Strike in turns 1-3 (logged).", fx: [] },
          { name: "Shroud Projector", pts: 15, restrict: "OFFICER", desc: "No Overwatch against the bearer's unit (logged).", fx: [] },
          { name: "Advance Augury", pts: 15, restrict: "OFFICER", desc: "Redeploy up to three Regiment units after deployment (logged).", fx: [{ k: 'toReserves' }] }
        ],
        stratagems: [
          { name: "Bellicosa Drop", cp: 1, type: "Battle Tactic", when: 'move', targetSelf: true, desc: "Deep Strike within 6\" of enemies (logged).", fx: [] },
          { name: "Firing Hot", cp: 2, type: "Battle Tactic", when: 'shoot', targetSelf: true, desc: "+1 S/AP to hot-shot weapons vs targets within 12\".", fx: [{ k: 'plusStrRanged', n: 1, cond: 'within12' }, { k: 'plusApRanged', n: 1, cond: 'within12' }] },
          { name: "Fire and Relocate", cp: 1, type: "Strategic Ploy", when: 'shoot', targetSelf: true, desc: "Shoot in a turn it Advanced.", fx: [{ k: 'eligShootAfterAdvance' }] },
          { name: "Servo-designators", cp: 1, type: "Strategic Ploy", when: 'shoot', targetSelf: true, desc: "A hit enemy loses Benefit of Cover (logged).", fx: [] },
          { name: "Aerial Extraction", cp: 1, type: "Epic Deed", when: 'oppFightEnd', targetSelf: true, desc: "Put a Deep Strike unit into Strategic Reserves.", fx: [{ k: 'toReserves' }] },
          { name: "On My Position", cp: 1, type: "Epic Deed", when: 'oppFightEnd', targetSelf: true, desc: "Mortal wounds to engaged enemies, at a cost to your unit (logged).", fx: [] }
        ]
      },
      "Grizzled Company": {
        rule: { name: "Ruthless Discipline", desc: "Each Officer issues +1 Order. While a unit is affected by an Order, re-roll a Hit roll of 1. (The +1 Order is applied to the Orders budget; the re-roll is applied to units carrying an Order.)", fx: [] },
        enhancements: [
          { name: "Abhuman Detail", pts: 20, restrict: "COMMISSAR", desc: "Add OGRYN to Orderable units; can join an Ogryn unit (logged).", fx: [] },
          { name: "Aquilan Eye", pts: 20, restrict: "OFFICER", desc: "Adds the Target Weak Spot Order (+1 AP vs within 12\") — logged.", fx: [] },
          { name: "Spec Ops Veteran", pts: 15, restrict: "OFFICER", desc: "Adds the Move to the Shadows Order (Stealth when shot) — logged.", fx: [] },
          { name: "Laud Hailer", pts: 10, restrict: "OFFICER", desc: "Issue Orders to units within 12\" instead of 6\".", fx: [] }
        ],
        stratagems: [
          { name: "Snap to It", cp: 1, type: "Strategic Ploy", when: 'any', targetSelf: true, desc: "Issue an Order as if it were your Command phase (logged).", fx: [] },
          { name: "No Retreat!", cp: 1, type: "Strategic Ploy", when: 'command', targetSelf: true, desc: "Hold an objective with a Duty-and-Honour! unit (sticky).", fx: [{ k: 'stickyObjective' }] },
          { name: "Veteran Sharpshooters", cp: 1, type: "Battle Tactic", when: 'shoot', targetSelf: true, desc: "Ranged weapons gain [IGNORES COVER].", fx: [{ k: 'grant', ab: 'ignorescover', cond: 'rangedOnly' }] },
          { name: "Purging Fire", cp: 1, type: "Battle Tactic", when: 'shoot', targetSelf: true, desc: "Ordered unit on an objective: ranged gain [LETHAL HITS].", fx: [{ k: 'grant', ab: 'lethal', cond: 'rangedOnly' }] },
          { name: "Mordian Minute", cp: 1, type: "Battle Tactic", when: 'shoot', targetSelf: true, desc: "First-Rank-ordered unit: +1 Strength to attacks.", fx: [{ k: 'plusStrRanged', n: 1 }] },
          { name: "Additional Armour", cp: 1, type: "Wargear", when: 'oppShootTargeted', targetSelf: true, desc: "Defensive: worsen incoming AP by 1.", fx: [{ k: 'worsenIncomingAP', n: 1, defensive: true }] }
        ]
      },
      "Steel Hammer": {
        rule: { name: "Ceaseless Cannonade", desc: "TITANIC/SQUADRON units can shoot into Engagement Range without the in-combat Hit penalty (if no other friendly unit is engaged). TITANIC units may gain CHARACTER. Modelled via the no-penalty allowance; selection abstracted.", fx: [] },
        enhancements: [
          { name: "Battalion Commander", pts: 30, restrict: "ASTRA MILITARUM", desc: "Titanic bearer gains Voice of Command/OFFICER; issues 2 Orders to Titanic/Squadron (logged).", fx: [] },
          { name: "Titan Killer", pts: 20, restrict: "ASTRA MILITARUM", desc: "Re-roll the bearer's ranged Damage rolls (logged).", fx: [] },
          { name: "Engine Speaker", pts: 15, restrict: "TECH-PRIEST", desc: "+3\" Move to a blessed Vehicle (logged).", fx: [] },
          { name: "Assault Hatches", pts: 25, restrict: "ASTRA MILITARUM", desc: "Disembarked units can still charge (logged).", fx: [] }
        ],
        stratagems: [
          { name: "Engine of Wrath", cp: 1, type: "Epic Deed", when: 'fight', targetSelf: true, desc: "Titanic: +6 melee Attacks and +2 AP vs one enemy.", fx: [{ k: 'plusAttacksMelee', n: 6 }, { k: 'plusApMelee', n: 2 }] },
          { name: "Imposing Arrival", cp: 1, type: "Strategic Ploy", when: 'move', targetSelf: true, desc: "Bring a Titanic unit on from Reserves (logged).", fx: [] },
          { name: "Adamantine Behemoth", cp: 1, type: "Strategic Ploy", when: 'move', targetSelf: true, desc: "Move through terrain (logged).", fx: [] },
          { name: "Shattering Salvo", cp: 1, type: "Strategic Ploy", when: 'shoot', targetSelf: true, desc: "A hit enemy loses Benefit of Cover (logged).", fx: [] },
          { name: "Withering Firepower", cp: 1, type: "Strategic Ploy", when: 'shoot', targetSelf: true, desc: "A hit enemy takes a −1 Battle-shock test (logged).", fx: [{ k: 'selfBattleshock' }] },
          { name: "Accuracy Under Pressure", cp: 2, type: "Battle Tactic", when: 'shoot', targetSelf: true, desc: "Re-roll Hit rolls.", fx: [{ k: 'rerollHit', val: 'all' }] }
        ]
      },
      "Armoured Infantry": {
        rule: { name: "Squadron Command", desc: "Officers can also Order SQUADRON units; adds the On My Signal Order (reactive D6\" move for Armoured Skirmishers). SQUADRON units gain ARMOURED SKIRMISHER. Order-targeting and the reactive move are abstracted.", fx: [] },
        enhancements: [
          { name: "Exemplary Officer", pts: 20, restrict: "OFFICER", desc: "Order also issued to two nearby Platoon units (logged).", fx: [] },
          { name: "Master Manoeuvrist", pts: 15, restrict: "OFFICER", desc: "Re-embark at end of opponent's Fight phase (logged).", fx: [] },
          { name: "Omnissian Unguents", pts: 35, restrict: "TECH-PRIEST", desc: "Nearby Armoured Skirmishers gain Feel No Pain 5+ (logged).", fx: [] },
          { name: "Grand Strategist", pts: 25, restrict: "OFFICER", desc: "Redeploy up to two Regiment/Squadron units after deployment (logged).", fx: [{ k: 'toReserves' }] }
        ],
        stratagems: [
          { name: "Order the Advance", cp: 1, type: "Battle Tactic", when: 'move', targetSelf: true, desc: "Re-roll Advance rolls for nearby units.", fx: [{ k: 'rerollAdvance' }] },
          { name: "Mobile Firebase", cp: 1, type: "Strategic Ploy", when: 'move', targetSelf: true, desc: "Shoot in a turn it Advanced or Fell Back.", fx: [{ k: 'eligShootAfterAdvance' }, { k: 'eligShootAfterFallBack' }] },
          { name: "Burst of Speed", cp: 1, type: "Strategic Ploy", when: 'move', targetSelf: true, desc: "Make a D6\" Normal move (logged).", fx: [] },
          { name: "Supporting Ordnance", cp: 1, type: "Battle Tactic", when: 'shoot', targetSelf: true, desc: "Re-roll Hits vs MONSTER/VEHICLE.", fx: [{ k: 'rerollHit', val: 'all', cond: 'isVehicle' }] },
          { name: "Combined Fire", cp: 1, type: "Battle Tactic", when: 'shoot', targetSelf: true, desc: "A hit enemy loses cover; +2 Strength vs it.", fx: [{ k: 'plusStrRanged', n: 2 }] },
          { name: "Opening Salvo", cp: 1, type: "Battle Tactic", when: 'shoot', targetSelf: true, desc: "Disembarked: +1 to Wound rolls.", fx: [{ k: 'addWound', n: 1 }] }
        ]
      }
    }
  }
};

/* Black Templars use the full Space Marines datasheet pool and may also take the shared
   Codex detachments (except 1st Company Task Force). Merge those in so a BT player sees
   both their supplement detachments and the generic codex ones. */
(function mergeBlackTemplars(){
  const sm=DETACHMENT_DATA["Space Marines"], bt=DETACHMENT_DATA["Black Templars"];
  if(!sm||!bt)return;
  Object.keys(sm.detachments).forEach(name=>{
    if(name==='1st Company Task Force')return;        // forbidden for BT
    if(sm.detachments[name].chapter&&sm.detachments[name].chapter!=='BLACK TEMPLARS')return; // skip other chapters' exclusives
    if(!bt.detachments[name])bt.detachments[name]=sm.detachments[name];
  });
})();

/* Blood Angels likewise use the full Space Marines datasheet pool and may take the shared
   Codex detachments (no 1st-Company restriction). Merge the generic ones in. */
(function mergeBloodAngels(){
  const sm=DETACHMENT_DATA["Space Marines"], ba=DETACHMENT_DATA["Blood Angels"];
  if(!sm||!ba)return;
  Object.keys(sm.detachments).forEach(name=>{
    if(sm.detachments[name].chapter&&sm.detachments[name].chapter!=='BLOOD ANGELS')return; // skip other chapters' exclusives
    if(!ba.detachments[name])ba.detachments[name]=sm.detachments[name];
  });
})();

/* Dark Angels likewise take the shared Codex detachments (no restriction). Merge them in. */
(function mergeDarkAngels(){
  const sm=DETACHMENT_DATA["Space Marines"], da=DETACHMENT_DATA["Dark Angels"];
  if(!sm||!da)return;
  Object.keys(sm.detachments).forEach(name=>{
    if(sm.detachments[name].chapter&&sm.detachments[name].chapter!=='DARK ANGELS')return; // skip other chapters' exclusives
    if(!da.detachments[name])da.detachments[name]=sm.detachments[name];
  });
})();

/* Space Wolves likewise take the shared Codex detachments (no restriction). Merge them in. */
(function mergeSpaceWolves(){
  const sm=DETACHMENT_DATA["Space Marines"], sw=DETACHMENT_DATA["Space Wolves"];
  if(!sm||!sw)return;
  Object.keys(sm.detachments).forEach(name=>{
    if(sm.detachments[name].chapter&&sm.detachments[name].chapter!=='SPACE WOLVES')return; // skip other chapters' exclusives
    if(!sw.detachments[name])sw.detachments[name]=sm.detachments[name];
  });
})();
