# VOIDSTRIKE — Warhammer 40,000 10e Simulator

A single-page, two-player hot-seat battle simulator for Warhammer 40,000 (10th edition rules approximation). Muster forces, set up terrain, deploy, and fight a five-phase battle round with interactive dice. Loads every faction and unit from Wahapedia's public data export.

> Unofficial fan tool. Warhammer 40,000 is © Games Workshop. Game data is © Wahapedia; this project is unaffiliated with both.

---

## Files

```
voidstrike/
├── index.html                     ← the app (open this / serve this)
├── app.js                         ← game engine
├── netlify.toml                   ← Netlify config
└── netlify/functions/
    └── wahapedia.js               ← server-side data proxy (avoids CORS)
```

---

## Running it

### Option A — Deploy to Netlify (recommended: one-click data loading works)

The data-fetch "Fetch (auto)" button only works reliably when the site is served by Netlify, because it uses the bundled server function to pull Wahapedia data without CORS problems.

**Drag-and-drop:**
1. Go to https://app.netlify.com/drop
2. Drag the whole `voidstrike` **folder** onto the page (not just index.html).
3. Wait for deploy; open the URL. Done.

**Git (for ongoing edits):**
1. Push this folder to a GitHub repo.
2. In Netlify: "Add new site" → "Import an existing project" → pick the repo.
3. Build command: none. Publish directory: `.` (already set in `netlify.toml`).

### Option B — Open locally (no install)

Double-click `index.html`. Everything works **except** the auto-fetch button (no server). Use the **Upload CSV files** tab instead — see below.

---

## Loading all factions & units

Faction data **loads automatically** for every visitor from a committed snapshot file (`factions-data.json`) in your repo root. Visitors never fetch from Wahapedia and can't touch the fetch controls — they just open the page and all factions are there.

### Admin / maintainer workflow (password-gated)

The fetch, import and export controls live in the **Admin · Data Management** panel on the muster screen, locked behind a password.

- **Default password:** `voidstrike-admin`
- **To change it:** in `app.js` find the line `const ADMIN_HASH=...` and replace the number with the hash of your chosen password. Compute the hash by opening the browser console on your site and running:
  ```js
  (s=>{let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return h>>>0;})('your-new-password')
  ```
  Paste the resulting number as the new `ADMIN_HASH`, commit, done.

**To refresh the game data** (e.g. after a GW points/dataslate update):
1. Open the Admin panel, enter the password.
2. **Fetch & Load** (or **Re-fetch (update)** to bypass caches). Run it a couple of times if you want to be sure the data is complete and correct.
3. Click **Export Data Bundle** — this downloads `factions-data.json`.
4. Commit that file to your **repo root** (same folder as `index.html`). Netlify redeploys, and every visitor now auto-loads the new data.

> **Security note:** the password is a front-end gate — it keeps casual visitors out of the data controls, but it is *not* strong security (someone technical could bypass it via the page source or console). Don't reuse a sensitive password. For this use case (stopping randoms from triggering fetches) it's perfectly adequate.

> The data files used for a refresh: `Factions`, `Datasheets`, `Datasheets_models`, `Datasheets_wargear` (required), plus `Datasheets_models_cost` (points), `Datasheets_keywords` (keywords), `Datasheets_abilities` + `Abilities` (abilities).

### Data load order
1. `factions-data.json` committed in the repo (the snapshot you exported) — used for all visitors.
2. Browser localStorage (a returning visitor's cached copy) — instant.
3. Built-in Ultramarines + Chaos Space Marines only (if no snapshot exists yet).

---

## Game modes

- **Boarding Actions** (500 pts) — compact fight through a voidship interior with preset walls and hatchways.
- **Open War** (1000 pts) — larger clash on open ground; place your own terrain.
- **Sandbox** (no points limit, custom board size) — choose board dimensions (12–40 × 10–34 cells; 1 cell = 2″) and field any forces you like.

## Flow of a battle

1. **Muster** — pick factions per player, add units (or "Quick Muster").
2. **Terrain Setup** — choose a tool (Wall / Hatchway / Objective / Erase) and click the board. Walls block movement and line of sight; open hatchways let you move and fight through them. Press **Begin Deployment**.
3. **Deployment** — players alternate placing units in their highlighted Entry Zone.
4. **Battle rounds** — each player turn runs five phases:
   - **Command** — auto: +1 CP and Battle-shock tests.
   - **Movement** — click a unit, then a destination. Inside the green ring = Normal move; beyond it you **roll a D6 Advance**.
   - **Shooting** — click a unit to open fire control: pick a weapon (its range highlights on the board), pick a target, **roll the attacks** (hits → wounds → saves resolve in one batch). Fire each weapon separately.
   - **Charge** — click a unit to see legal targets within 12″, pick one, **roll 2D6**.
   - **Fight** — click any unit in Engagement Range, pick its target, **roll melee**. Chargers fight first.

Toggle **show dice rolls** in the right panel to see every die. **Auto-resolve Phase** plays the current phase for you (handy for watching or speeding through).

---

## Notes & limitations

- Weapon **ability tags** are parsed from Wahapedia (Rapid Fire, Sustained Hits, Lethal Hits, Devastating Wounds, Twin-linked, Torrent, Assault, Pistol, Hazardous, Anti-X) and affect the dice math. Unit **abilities** (Core/Faction/Datasheet) are imported and shown on the unit detail panel, but their rules effects are descriptive only — they aren't auto-applied.
- Weapons import at their **base profile**; wargear-option swaps aren't modelled. Squad sizes are inferred from the datasheet's unit composition — adjust with ± in the muster screen if needed.
- Stats, points, keywords and weapon tags come straight from Wahapedia; the rest is a faithful-but-simplified take on the core rules.

---

## Detachments, doctrines, stratagems & enhancements

A faction-agnostic detachment engine lives in `detachments.js`. Each faction is one entry; the file currently includes the full **Space Marines / Adeptus Astartes** set (17 detachments — Gladius, Anvil Siege, Ironstorm, Firestorm, Stormlance, Vanguard Spearhead, 1st Company, Librarius Conclave, Bastion, Orbital Assault, Ceramite Sentinels, Armoured Speartip, Headhunter, plus Ultramarines' Blade of Ultramar & Reclamation Force).

How it works in play:
- **Muster**: pick a Detachment per army from the new dropdown. Chapter-specific detachments only show for that chapter.
- **Command phase**: name your **Oath of Moment** target, and (for detachments with doctrines) select a **Combat Doctrine** / Psychic Discipline. Effects apply army-wide until your next Command phase.
- **Stratagem panel** (battle, left column): shows your **CP** and the stratagems whose timing window is open right now. Click to spend CP; target-self stratagems prompt for a unit. Effects feed into the live dice resolution.
- **Enhancements**: assigned to characters in code (`unit.enh`); their buffs apply to the bearer's unit.

Effects that are mechanically wired into combat include: Oath re-rolls, doctrine eligibility (shoot/charge after Advance/Fall Back), +1 Hit/Wound, granted weapon abilities ([SUSTAINED HITS], [LETHAL HITS], [DEVASTATING WOUNDS], [LANCE], [IGNORES COVER], [ASSAULT], [PRECISION], [ANTI-X]), Armour-of-Contempt AP worsening, -1 to be hit/wounded, Feel No Pain, invulnerable saves, bonus attacks/strength/AP, objective-control bonuses and sticky objectives.

### Adding more factions
Paste a faction's detachment rules, enhancements and stratagems and they're encoded into `DETACHMENT_DATA` using the same schema (see the top of `detachments.js` for the effect-code vocabulary). Currently **only Space Marines** is filled in — every other army (Chaos factions, Orks, Tyranids, Necrons, Aeldari, Drukhari, T'au, Astra Militarum, Custodes, Sisters, Mechanicus, Knights, Agents, Votann, Genestealer Cults, and the divergent SM chapters' own detachments) still needs its data pasted in.

> Detachment rules text is GW's copyrighted material. The data file stores only the **mechanical effects** in brief, original wording — not the published flavour text.
