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

Open **"Load All Factions & Units"** on the muster screen. Three ways:

1. **Fetch (auto)** — on Netlify, pulls everything via the server function in one click. Off Netlify, it falls back to public CORS proxies, which are often rate-limited.
2. **Upload CSV files** — the bulletproof method. The tab has direct links to each CSV; right-click → "Save link as…", then select them all in the file picker. Works anywhere, no network needed at load time.
3. **Paste CSV** — paste each file's text, tag its type, stage, repeat, then Build.

The files used: `Factions`, `Datasheets`, `Datasheets_models`, `Datasheets_wargear` (required), plus `Datasheets_models_cost` (points), `Datasheets_keywords` (keywords), `Datasheets_abilities` + `Abilities` (Core/Faction/Datasheet abilities).

### Data persists across restarts
Imported data is saved in your browser's **localStorage**, so the next time you open the app — even after rebooting your PC — the same factions are there and selectable, with no re-fetch.

- **Re-fetch (update):** pulls fresh data when a new GW balance dataslate / points update drops, and overwrites the saved copy.
- **Clear saved data:** wipes the local copy and reverts to the two built-in armies.

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
