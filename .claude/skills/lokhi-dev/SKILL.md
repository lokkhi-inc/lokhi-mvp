---
name: lokhi-dev
description: Run the Lokhi PWA locally and deploy branch previews to your own Vercel account. Use when asked to run, serve, start, preview, screenshot, click through, or debug the app locally, and when asked to deploy, ship, or get a preview URL for the current branch.
---

# Lokhi: local dev and preview deploys

Static HTML/CSS/JS PWA. **No build step, no package manager, no tests.** Running
it means serving this directory; deploying it means uploading this directory.
Everything goes through `make` — read the `Makefile` if a target's behavior is
unclear rather than reinventing the command.

## Running it locally

`make run` blocks (it's a foreground server), so **always start it with
`run_in_background: true`**, then drive it with the Chrome DevTools MCP tools:

1. `make run` with `run_in_background: true` — serves on `http://127.0.0.1:8080`
2. `navigate_page` to the URL you need
3. `take_snapshot` (preferred — it's a text tree, far cheaper than a screenshot)
   or `take_screenshot` when the question is genuinely visual
4. `list_console_messages` to catch JS errors
5. `make stop` when finished

Entry points:

| URL | What it is |
|---|---|
| `http://127.0.0.1:8080/index.html` | Main app — all five tabs |
| `http://127.0.0.1:8080/onboarding.html` | First-run onboarding, then redirects to index |
| `http://127.0.0.1:8080/share-target.html` | Landing page for shared-in content |

Port 8080 is the default; `make run PORT=8081` if it's taken. If `make run`
fails because the port is busy, run `make stop` rather than switching ports —
a stale server usually means a previous session left one behind.

**Serve over HTTP, never open the files via `file://`.** The service worker in
`sw.js` will not register under `file://`, so the PWA behavior silently differs.

State lives in `localStorage` (XP, level, completed missions, archetype,
guided-journey step) and under `lokhi_profile_overrides` for onboarding facts.
To test a first-run experience, clear site data via `evaluate_script` running
`localStorage.clear()` — don't hunt for a reset button.

## Deploying a preview

`make deploy` uploads the current working tree to **whichever Vercel account you
are logged into locally**.

Vercel deployments are immutable, so each deploy is a new artifact with its own
URL. The script points a stable alias — `lokkhi-<branch>-<vercel-account>.vercel.app`
— at the newest one, then deletes the deployment that alias previously pointed
at, but only when that one was READY. BLOCKED and ERROR builds are kept so they
can be inspected. **Share the alias, not the per-deploy URL**; the alias is what
lands in `.vercel-preview-url`.

The alias carries the deploying account because `*.vercel.app` is a global
namespace: without it, two people deploying the same branch collide and the
second silently gets no stable URL. So the same branch has a different preview
URL per person — say whose it is when you report one.

- It refuses to run on `main` on purpose. `main` ships separately; previews are
  for branches. Don't pass `ALLOW_MAIN=1` unless the user explicitly asks.
- Vercel attaches the HEAD commit author to a CLI deploy and **blocks** the
  build when that author lacks permission on the project — being logged in as
  yourself is not enough. `scripts/deploy.sh` handles this in two paths:
  - author email matches your Vercel account: deploys normally, nothing asked.
  - it does not match: asks whether to deploy with git metadata stripped, which
    removes the author and skips the check.
- Non-interactively (which is how you run it) the mismatch path cannot prompt,
  so it exits and tells the user to re-run with `GITLESS=1`. **Relay that and
  let the user decide** — don't pass `GITLESS=1` on your own initiative.
- A blocked build never goes ready, so the script deploys with `--no-wait` and
  polls the real state. Never drop that flag; without it the CLI hangs forever.
- It deploys the **working tree, not the last commit** — uncommitted changes go
  out too. That's intended for fast iteration, but say so when reporting a URL
  so nobody is surprised that a preview contains unpushed work.
- Deploys count against a shared **100/day** Vercel Hobby cap. Don't deploy to
  check something you could check with `make run` locally.

## The shared dev URL

Feature branches merge freely into `dev`; `dev` is reviewed against `main` weekly.
`dev` lives at **https://lokkhi-dev.vercel.app** — a preview deployment with a
shared alias, because Hobby has no custom environments (`--target=dev` is Pro-only).

- **CI** (`.github/workflows/deploy-dev.yml`) redeploys it on every push to `dev`
  and reaps the deployment the alias moved off, if that one was READY.
- **`make deploy DEV=1`** does the same from a laptop. It refuses unless you're on
  `dev`, the tree is clean, and HEAD equals `origin/dev` — the URL is shared, so it
  must show the branch, never local edits. Prefer letting CI do it; this is the
  manual redeploy.
- Like every preview, it sits behind Vercel's deployment protection (login wall).

## Cleaning up after a merge

When a PR merges its branch is deleted, which strands that branch's preview
deployments. After a merge — and occasionally otherwise — run:

```
make prune
```

It only lists; it never deletes, and it skips production entirely. If it finds
anything, tell the user what is stranded and that `make prune DELETE=1` will remove it
after they confirm. **Never run `make prune DELETE=1` yourself to clear them** — deletion
is irreversible and the confirmation prompt is the user's, not yours. It is
untidiness, not cost: Vercel does not bill for stored deployments, so there is
never a reason to push.

## Setup checks

`make check` reports whether `python3`, the Vercel CLI, and `gh` are installed
and authenticated, and prints the exact fix command for anything missing.

This runs automatically at the start of every Claude session via the
`SessionStart` hook in `.claude/settings.json`, which calls `make check-quiet`.
That target is silent when the setup is healthy, so if no setup report appeared
at the top of the session, everything is already in order — don't re-run it to
confirm. When a report does appear, relay it and the fix commands immediately.

Run `make check` by hand when a `make run` or `make deploy` failure looks
environmental. Report what it says and let the user run the fix — **never run
`vercel login` or `gh auth login` yourself**, they're interactive and need the
user's own browser.

## Where things live

Prefer targeted reads over whole files — `app.js` and `app-styles.css` are
~850 lines each.

| File | Lines | Contents |
|---|---|---|
| `app.js` | ~840 | All UI logic: rendering, tab nav, quest simulator, XP/leveling, guided journey |
| `app-styles.css` | ~880 | Design system (color, type, cards, buttons, charts) and every screen's layout |
| `app-data.js` | ~380 | All mock data as `window.APP_DATA` — the single source of truth |
| `index.html` | ~290 | App shell: five tabs, modals, Fairy Godmother widget, journey overlay |
| `onboarding.html` | ~300 | Onboarding flow plus archetype pick |
| `sw.js` | ~95 | Cache-first service worker and Web Share Target handling |
| `share-target.html` | ~125 | Renders content shared into the app |
| `vercel.json` | — | Two headers only: no-cache on `sw.js`, content-type on the manifest |
| `icons/`, `lokhi-assets/` | — | Generated icons; hand-authored SVGs. Regenerate icons with `scripts/gen_assets.py` |

To change mock data, edit `app-data.js` alone — it's designed to be swapped for
a real API client without touching screen code.

## Conventions worth preserving

- Money values use `font-variant-numeric: tabular-nums` so figures stay aligned.
- Every Optimize opportunity and Playground recommendation states *why* it was
  generated; every simulator projection is labeled a scenario, not a promise.
- Gamification (XP, levels, streaks, badges) never scores or compares balances,
  income, or transactions — only consistency. Don't add anything that ranks a
  user's financial position.

## Don't

- Commit `.vercel/` — it points at the individual developer's own Vercel
  project. It's gitignored; keep it that way.
- Add a build step, bundler, or framework to make a change easier. The zero-build
  setup is deliberate.
- Deploy to check something a local server would answer.
