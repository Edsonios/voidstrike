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
  }
};
