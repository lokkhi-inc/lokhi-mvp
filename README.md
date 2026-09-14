# Lokhi

A premium, gamified personal finance PWA. Static HTML/CSS/JS — no framework,
no build step. Turns managing money into a game: goals, simulations,
opportunities, and steady progress instead of spreadsheets and jargon.

## Running locally

No build step. From this directory:

```
python3 -m http.server 8080
```

Then open `http://localhost:8080/onboarding.html` (first run) or
`http://localhost:8080/index.html`.

Opening `index.html` directly via `file://` also works, except the service
worker (`sw.js`) won't register under `file://` — serve over HTTP for the
full PWA experience.

## Deploying

Zero-config static deploy:

```
vercel deploy
```

`vercel.json` only sets two headers (no-cache on `sw.js`, correct content
type on the manifest) — no build command is needed.

## Installing on iOS

1. Visit the deployed URL in Safari on iOS.
2. Share → **Add to Home Screen**.
3. Launch from the home screen icon — it opens standalone, with no browser
   chrome, using the icon and name from `manifest.webmanifest` and the
   `apple-touch-icon` link in `<head>`.

## Structure

- `index.html` — the main app shell: all five tabs (Home, Playground,
  Optimize, Grow, Profile), modals, the Fairy Godmother widget, and the
  guided financial plan journey overlay.
- `onboarding.html` — the minimal-facts onboarding flow plus the financial
  archetype pick (Flow 1 + Flow 2). Redirects into `index.html` when done.
- `app-data.js` — the single source of truth for mock data, exposed as
  `window.APP_DATA`. Swap this file for a real API client without touching
  any screen code.
- `app.js` — all UI logic: rendering, tab navigation, the quest simulator,
  XP/leveling, and the guided journey. Reads `APP_DATA` and layers in
  progress persisted to `localStorage`.
- `app-styles.css` — the design system (colors, type, cards, buttons,
  charts) and every screen's layout.
- `manifest.webmanifest`, `sw.js` — PWA manifest and a minimal cache-first
  service worker for offline support.
- `icons/` — app icons (regular + maskable, 192/512), the iOS
  `apple-touch-icon`, favicons, and optional splash screens, all generated
  by `scripts/gen_assets.py`.
- `lokhi-assets/` — hand-authored SVGs: the Fairy Godmother logo mark and
  the three owl progress states (dormant / on-track / crowned), used inline
  in the app.
- `scripts/gen_assets.py` — a build-time-only pure-Python (stdlib) PNG
  generator used to produce the files in `icons/`. Not part of the deployed
  app; re-run it if the brand mark or palette changes.

## Data model

Progress (XP, level, completed missions, quest amounts, badges, archetype,
guided-journey step) persists to `localStorage`. Onboarding facts persist
separately under `lokhi_profile_overrides`. Clearing site data resets the
app to the default mock profile in `app-data.js`.

## Notes

- All money values use `font-variant-numeric: tabular-nums` so figures stay
  aligned wherever they appear.
- Every Optimize opportunity and Playground recommendation states *why* it
  was generated. Every projection in the simulator is labeled a scenario,
  not a promise.
- The gamification layer (XP, levels, streaks, badges) never scores or
  compares balances, income, or transactions — only consistency.
