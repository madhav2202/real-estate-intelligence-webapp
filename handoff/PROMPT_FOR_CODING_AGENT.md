# Plinth — Frontend Replication Brief

Paste the following into your coding agent (Cursor / Claude Code / etc.) along with the three files in this folder.

---

## 🎯 Goal

Replace the current frontend of my real-estate decision-intelligence platform **Plinth** with the new design provided in `index.html`, `styles.css`, and `app.jsx`. The backend is already built and should remain untouched — the new UI must consume the existing data layer through whatever fetching pattern this codebase already uses (REST endpoints, GraphQL, Redux store, React Query, etc. — detect and follow it).

---

## 📐 Design System (must be preserved exactly)

**Theme:** Dark luxury / minimal — near-black layered surfaces with a violet accent.

**CSS variables** (defined in `styles.css` — do not change names; values can be themed):
- Surfaces: `--bg`, `--bg2`, `--bg3`, `--bg4`
- Borders: `--border`, `--border-bright`
- Text: `--text`, `--text-dim`, `--text-muted`
- Accent: `--accent` (#7c6af5), `--accent-glow`, `--accent-dim`
- Signals: `--green` / `--amber` / `--red` (+ dim variants)
- Type stack: `--font-display` (DM Serif Display), `--font-body` (DM Sans), `--font-mono` (DM Mono)

**Signal color mapping** (used everywhere — score rings, pins, badges):
- `score >= 80` → green `#4ade80` (Strong Shortlist / Fair entry)
- `score >= 65` → amber `#f5a623` (Moderate / Pending)
- `score < 65`  → red `#f87171` (Avoid at ask)

**Animations** (keyframes already in `styles.css`): `fadeUp`, `fadeIn`, `slideLeft`, `slideRight`, `ticker`, `blink`, `pulse-glow`, `shimmer`. Keep the staggered entry timing on lists/grids — it is part of the feel.

---

## 🧱 Component inventory (in `app.jsx`)

| Component | Purpose |
|---|---|
| `ScoreRing` | Animated SVG ring + count-up for the PropSpot 0–100 score. Color tier follows signal mapping. |
| `Ticker` | Infinite horizontal crawl of all launches across the top of the page. |
| `ProjectCard` | Sidebar list item — name, sector, stage pill, score dot. Truncates cleanly. |
| `MapView` | Custom canvas-rendered NCR map. Glowing radial-gradient pins, hover tooltip, click-to-select. Uses lat/lng bounds `28.35–28.62, 76.88–77.22`. |
| `ProjectDetail` | Right-side rich detail panel — hero, 2×2 quick stats, builder vs fair-entry price cards, score card, animated metric bars, CTA buttons. |
| `MetricBar` | Animated horizontal fill bar for 0–10 scores (location maturity, builder risk). |
| `ScreenerView` | Sortable / filterable comparison table. Inline mini score rings. |
| `DashboardView` | "Terminal" home — live clock, summary stats, top-ranked panel, quick-action tiles, entry-signal grid. |
| `App` | Root layout — top nav + ticker + sidebar + main view + detail panel. View state: `'dashboard' \| 'map' \| 'screener'`. |

---

## 📦 Data contract

`App` consumes a `projects` prop. Each project must match this shape:

```ts
type Project = {
  id: number | string;
  code: string;            // 'GGM-36A-TER'
  name: string;
  developer: string;
  sector: string;
  corridor: string;
  city: string;
  stage: 'New Launch' | 'Under Construction' | 'Ready' | string;
  ticket: string;          // human-readable, e.g. '₹4.50 Cr'
  sqftPrice: number | null;
  fairLow: number | null;
  fairHigh: number | null;
  score: number;           // 0–100 PropSpot score
  possession: string;      // 'Q1 2030'
  signal: string;          // 'Fair entry' | 'Avoid at ask' | ...
  signalType: 'neutral' | 'warning' | 'danger';
  launched: 'EOI' | 'Launched';
  absorption: string;      // '78%' or 'Data pending'
  location: number;        // 0–10
  builderRisk: number;     // 0–10
  lat: number;
  lng: number;
  color: string;           // hex matching signalType
};
```

---

## ✅ Implementation plan for the agent

1. **Detect this repo's frontend conventions** before writing anything:
   - Build tool? (Vite / Next.js / CRA / Webpack)
   - State / data layer? (Redux / Zustand / React Query / SWR / context / raw fetch)
   - Styling pattern? (CSS modules / styled-components / Tailwind / plain CSS)
   - Routing? (React Router / Next.js routes)

2. **Convert the three reference files into idiomatic modules for this repo:**
   - Split `app.jsx` into one file per component under `src/components/plinth/` (`ScoreRing.tsx`, `Ticker.tsx`, `MapView.tsx`, `ProjectDetail.tsx`, `MetricBar.tsx`, `ProjectCard.tsx`, `ScreenerView.tsx`, `DashboardView.tsx`).
   - Move CSS variables and keyframes from `styles.css` into the global stylesheet (or a `theme.css` / `tokens.css` module).
   - Convert inline-style objects to the project's preferred styling system **only if** that system is in use; otherwise keep inline styles since they are theme-token-driven.
   - Add TypeScript types if the project uses TypeScript (use the `Project` interface above).

3. **Wire to real data:**
   - Replace the hard-coded `PROJECTS` array in `app.jsx` with the existing data hook / selector / query that fetches projects.
   - Map any field-name mismatches with a small adapter rather than mutating component props.
   - Keep the same prop shape — components must stay pure.

4. **Preserve every animation:**
   - Score ring count-up + dash-offset
   - Ticker infinite crawl (40s)
   - Staggered `fadeUp` row entries in the screener
   - `slideLeft` entry on the detail panel (use `animKey` re-mount)
   - `blink` on live status dots
   - Animated metric bar fills

5. **Routing:**
   - The `view` state (`dashboard | map | screener`) should map to the project's router (e.g. `/`, `/map`, `/screener`).
   - The selected project should be a query param or path segment so deep-linking works.

6. **Replace the existing dashboard chrome:**
   - Top nav (logo + nav tabs + LIVE DATA pill)
   - Live ticker (always visible below the nav)
   - Sidebar (search + budget filter + stage filter + project list)
   - Main view + right-side detail panel

7. **Sanity check before delivery:**
   - All three views render with real data.
   - Map pins position correctly using the project lat/lng.
   - Score ring colors match the signal tier rules.
   - No console errors.
   - Fonts (DM Serif Display, DM Sans, DM Mono) load via Google Fonts.

---

## 🚫 Do NOT

- Change any backend code, API contracts, or database schema.
- Introduce a new state-management library if one already exists — adopt the current one.
- Replace the canvas-based map with Mapbox/Google Maps unless explicitly asked. The custom canvas map is part of the brand feel.
- Drop the dark theme or violet accent. These are intentional.
- Use emojis or gradient walls — the design is restrained on purpose.

---

## 📂 Files in this handoff

- **`index.html`** — minimal shell loading fonts + React + Babel + `app.jsx`. Use only as a pixel-reference; in your real app, integrate via the existing entry point.
- **`styles.css`** — design-system tokens, scrollbar styling, keyframes. Drop into your global styles.
- **`app.jsx`** — every component in one file. Split into modules per step 2 above.

---

## 🎁 Acceptance criteria

- `npm run dev` (or equivalent) renders the new Plinth UI bound to live backend data.
- Switching between Terminal / Map / Screener works from the nav.
- Clicking any project anywhere opens the detail panel with that project's real data.
- Filters in the sidebar (search / budget / stage) narrow the project list and downstream views.
- All animations, hover states, and the live ticker behave identically to the reference HTML.
