/* ===========================================================================
   ABILITY_FX — the hand-authored ability -> fx join layer.

   This is the UNBUILT HALF of roadmap step 2, now built. The CSV importer
   already FETCHES and DISPLAYS each datasheet's Core/Faction/Datasheet/Wargear
   ability TEXT (stored on each template's `abilities` array as {name,type,desc}
   and shown on the unit detail panel). What this file adds is APPLICATION:
   a map from a datasheet's ability NAME to a list of mechanical fx, using the
   exact same fx vocabulary the detachment engine consumes (see detachments.js
   header). The two are joined at load time by abilityFxFor() in app.js.

   WHY A SEPARATE FILE (a JOIN KEY, not a merge): factions-data.json is
   overwritten wholesale every time the user re-fetches from Wahapedia for a
   balance update. This map is hand-authored and must survive that, so it lives
   in its own code file keyed by:
       datasheet_id (the TEMPLATES key, e.g. "dru_archon")
         -> normalised ability name (lowercase, alphanumerics only)
            -> [ fx, ... ]
   Join is tolerant: if the fetched data renames or drops an ability, the
   lookup simply misses and the engine shows the text but applies nothing
   (graceful degradation — never a crash).

   SCOPE OF THIS FIRST PASS: the Drukhari "Pain" abilities, which are the first
   consumer. Each entry is the effect a unit gains WHILE EMPOWERED (i.e. after a
   Pain token has been spent on it this phase). The Drukhari empowerUnit() path
   reads these instead of the old blanket [SUSTAINED HITS 1]. Effects the
   abstract board can't model yet (return models, reposition to Reserves,
   suppress/Benefit-of-Cover denial, embark-after-Advance) are recorded as
   `note` fx so the intent is logged but nothing illegal is attempted.

   TARGET-KEYWORD RIDERS *ARE* MODELLED. A rider like "only vs INFANTRY" or
   "only vs VEHICLES" is just a condition on the target's keywords, checked the
   same way as the engine's existing antiKw/isVehicle/targetCharacter logic.
   These are enforced via the targetInfantry / targetVehicle / targetMonster
   conditions (e.g. Incubi's [DEVASTATING WOUNDS] vs INFANTRY, the Reaper's
   [SUSTAINED HITS 2] vs VEHICLES). An earlier version wrongly relaxed these and
   mislabelled them as unmodellable; that was a convenience shortcut, not a real
   limitation, and has been corrected.

   CAVEAT — PER-MODEL WARGEAR COMPOSITION IS GENUINELY NOT MODELLED, for TWO
   compounding reasons:
     1. The engine tracks each unit as a single token with a shared weapon list
        and a `models` count — it does not track which individual model carries
        which weapon.
     2. The imported data (factions-data.json) does not contain per-model
        loadouts either: a unit lists every weapon ANY of its models could take
        as one flat menu (e.g. Kabalite Warriors list blast pistol, blaster,
        dark lance, shredder, splinter cannon... with no record of which model
        has which, or how many). So even a per-model-token engine could not
        populate the loadouts from this data.
   Consequently, riders that depend on a unit *containing a specific model type*
   — e.g. Court of the Archon's "if it contains a Lhamaean", Beastmaster's "if
   it contains a Beastmaster" — cannot be checked and are deliberately relaxed
   (the fx applies unconditionally) with a comment saying so. This is a real
   limitation rooted in the data, NOT the same kind of thing as the target-
   keyword riders above, which ARE enforced.

   fx shapes reused here (all already understood by applyFxList in app.js):
     {k:'grant', ab:'sustained'|'lethal'|'devastating'|'precision'|..., val?}
     {k:'rerollHit'|'rerollWound', val:1|'all'}
     {k:'plusStrMelee'|'plusApMelee'|'plusAttacksMelee', n}
     {k:'plusStrRanged'|'plusApRanged', n}
     {k:'addWound', n}
     {k:'rerollAdvance'} {k:'rerollCharge'}
     {k:'eligChargeAfterAdvance'} {k:'eligChargeAfterFallBack'}
     {k:'fightOnDeath'}
     {k:'critOn', val}
   Plus one display-only marker handled by the consumer:
     {k:'note', text:'...'}  -> logged, applies nothing.
=========================================================================== */
const ABILITY_FX = {
  // --- Drukhari Pain abilities (effect granted while the unit is Empowered) ---
  dru_archon:        { hatredeternalpain:        [ { k:'rerollHit', val:'all' } ] },                         // re-roll the Hit roll
  dru_succubus:      { litheagilitypain:         [ { k:'rerollAdvance' }, { k:'rerollCharge' } ] },          // re-roll Advance & Charge
  dru_lelith_hesperax:{ bridesofdeathpain:       [ { k:'plusStrMelee', n:1, cond:'meleeOnly' }, { k:'plusApMelee', n:1, cond:'meleeOnly' } ] }, // +1 S/AP melee
  dru_haemonculus:   { fleshcraftpain:           [ { k:'note', text:'returns up to D3+1 destroyed Bodyguard models (not modelled)' } ] },
  dru_urien_rakarth: { sculptoroftormentspain:   [ { k:'addWound', n:1, cond:'meleeOnly' } ] },              // +1 Wound melee
  dru_drazhar:       { masterofbladespain:       [ { k:'addWound', n:1, cond:'meleeOnly' } ] },              // +1 Wound melee
  dru_kabalite_warriors:{ sadisticraiderspain:   [ { k:'rerollWound', val:1 } ] },                          // re-roll Wound 1 (objective rider not modelled)
  dru_wyches:        { acrobaticgladiatorspain:  [ { k:'eligChargeAfterAdvance' }, { k:'eligChargeAfterFallBack' } ] }, // charge after Advance/Fall Back
  dru_incubi:        { decapitatingstrikespain:  [ { k:'grant', ab:'devastating', cond:'meleeOnly+targetInfantry' } ] },    // melee [DEVASTATING WOUNDS] vs INFANTRY (target rider now enforced)
  dru_mandrakes:     { fadeawaypain:             [ { k:'note', text:'removes the unit to Strategic Reserves (not modelled)' } ] },
  dru_wracks:        { experimentalenhancementspain:[ { k:'plusAttacksMelee', n:1, cond:'meleeOnly' } ] },   // one of several options; +1 Attack chosen
  dru_grotesques:    { macrosteroidspain:        [ { k:'plusStrMelee', n:1, cond:'meleeOnly' }, { k:'grant', ab:'lethal', cond:'meleeOnly' } ] }, // S8 + [LETHAL HITS] (approx +1 S + Lethal)
  dru_beastmaster:   { goadedsavagerypain:       [ { k:'rerollHit', val:'all', cond:'meleeOnly' } ] },       // CAVEAT: real rider 'if unit contains a BEASTMASTER, BEAST models re-roll' is per-model composition — not in the data; relaxed to the whole unit
  dru_raider:        { splinterrackspain:        [ { k:'note', text:'re-rolls [ANTI] weapon Hit/Wound for embarked-unit fire (not modelled)' } ] },
  dru_venom:         { rapiddeploymentpain:      [ { k:'note', text:'allows disembark after Advancing (transports not modelled)' } ] },
  dru_reavers:       { matchlessswiftnesspain:   [ { k:'rerollAdvance' } ] },                                // +8" Advance, no roll (approx: re-roll Advance)
  dru_hellions:      { battlefieldbutcherypain:  [ { k:'plusAttacksMelee', n:1, cond:'meleeOnly' }, { k:'plusStrMelee', n:1, cond:'meleeOnly' } ] }, // +1 A/S melee
  dru_razorwing_jetfighter:{ nowheretorunpain:   [ { k:'note', text:'debuffs a hit enemy unit after shooting (not modelled)' } ] },
  dru_voidraven_bomber:{ nowheretohidepain:      [ { k:'grant', ab:'ignorescover', cond:'rangedOnly' } ] }, // denies a target Benefit of Cover (approx: Ignores Cover)
  dru_scourges_with_heavy_weapons:{ wingedstrikepain:[ { k:'rerollHit', val:'all', cond:'rangedOnly' } ] }, // ranged re-roll Hit
  dru_talos:         { mindlesskillingmachinespain:[ { k:'fightOnDeath' } ] },                               // destroyed melee models fight before removal (2+)
  dru_cronos:        { painparasitepain:         [ { k:'note', text:'gains a Pain token / heals after destroying a unit (not modelled)' } ] },
  dru_ravager:       { agonisingsuppressionpain: [ { k:'note', text:'suppresses a hit enemy unit (not modelled)' } ] },
  dru_reaper:        { electromagenticcascadepain:[ { k:'grant', ab:'sustained', val:2, cond:'rangedOnly+targetVehicle' } ] }, // [SUSTAINED HITS 2] vs VEHICLEs (target rider now enforced)
  dru_tantalus:      { engineofdestructionpain:  [ { k:'note', text:'pulse disintegrators gain [RAPID FIRE 8] (weapon-keyword grant not modelled)' } ] },
  dru_raven_strike_fighter:{ shreddingfirepain:  [ { k:'plusApRanged', n:1 } ] },                           // +1 ranged AP
  dru_court_of_the_archon:{ deadlyretinuepain:   [ { k:'grant', ab:'lethal', cond:'meleeOnly' } ] },         // CAVEAT: real rider 'if unit contains a Lhamaean' (per-model composition) — not in the data; the Lhamaean melee [LETHAL HITS] branch applied unconditionally
  dru_lady_malys:    { archonofthepoisonedtonguepain:[ { k:'grant', ab:'sustained', val:1 }, { k:'grant', ab:'lethal' } ] }, // pick Sustained or Lethal (grant both as the generous union)
  dru_hand_of_the_archon:{ assassinspoisonspain: [ { k:'grant', ab:'lethal' }, { k:'grant', ab:'precision' } ] }, // [LETHAL HITS] + [PRECISION]
  dru_scourges_with_shardcarbines:{ swoopingdescentpain:[ { k:'note', text:'improves Deep Strike placement (Reserves not modelled)' } ] }
};

/* ===========================================================================
   CORE_FX — universal Core abilities, keyed by normalised ability name (NOT by
   datasheet_id). Applied to ANY unit whose `abilities` array contains a Core
   ability of that name, regardless of faction. This is the "authored once,
   applies across hundreds of datasheets" batch.

   What is APPLIED here:
     stealth  -> defender-side -1 to incoming ranged Hit rolls (per the Core
                 Rules; ~80 datasheets). A genuine combat effect.
   What is handled ELSEWHERE (deliberately NOT mapped, to avoid double-applying):
     feelnopain -> already read from the stat-block / FNP path and shown on the
                   unit panel; mapping it again would double-apply.
     leader     -> pure army-construction (attach to a Bodyguard). No battle fx.
   What is handled by DEDICATED ENGINE CODE, not the fx list:
     loneoperative -> a ranged-targeting restriction (can only be targeted from
                      within 12"); enforced in the shooting target path by
                      unitIsLoneOp() + the eligibility check, not as an fx here.
   What is a NOTE because the magnitude or the underlying system is NOT in the
   data / not modelled (logged, applies nothing):
     deadlydemise -> CAVEAT: the per-unit value (1 / D3 / D6 ...) is NOT in the
                     export — all 721 entries share one generic glossary string,
                     so the magnitude is unknown. The death-hook mechanism exists,
                     but applying a guessed value would be inventing rules. Noted.
     deepstrike, scouts, infiltrators -> deployment/Reserves abilities; the
                     Reserves/deployment system is dormant in the sim. Noted.
                     (Also their X" value, where applicable, is not in the data.)
     firingdeck, hover -> transport / aircraft mechanics, both dormant. Noted.
   These notes are honest placeholders: if/when the Reserves, transport, aircraft
   or death-magnitude data+systems exist, they become real fx with no schema change.
=========================================================================== */
const CORE_FX = {
  stealth:       [ { k:'subIncomingHit', n:1, defensive:true, cond:'rangedOnly' } ],   // -1 to incoming ranged Hit rolls
  // --- handled elsewhere / not double-encoded ---
  feelnopain:    [ { k:'note', text:'Feel No Pain is applied from the stat-block / FNP path, not the join' } ],
  leader:        [ { k:'note', text:'Leader is army construction (attach to a Bodyguard); no in-battle fx' } ],
  loneoperative: [ { k:'note', text:'Lone Operative is enforced as a ranged-targeting restriction in engine code (unitIsLoneOp), not as an fx' } ],
  // --- dormant systems / value-not-in-data: logged, not applied ---
  deadlydemise:  [ { k:'note', text:'Deadly Demise magnitude (1/D3/D6...) is not in the export; death-hook exists but value unknown — not applied' } ],
  deepstrike:    [ { k:'note', text:'Deep Strike (Reserves) — deployment/Reserves system dormant' } ],
  scouts:        [ { k:'note', text:'Scouts pre-game move — deployment system dormant (and X" not in data)' } ],
  infiltrators:  [ { k:'note', text:'Infiltrators deployment — deployment system dormant' } ],
  firingdeck:    [ { k:'note', text:'Firing Deck — transport embark/shoot system dormant' } ],
  hover:         [ { k:'note', text:'Hover — aircraft system dormant' } ]
};

if (typeof module !== 'undefined' && module.exports) module.exports = { ABILITY_FX, CORE_FX };
