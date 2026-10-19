---
name: design-compliance
description: Audit the Lokhi PWA against DESIGN.md and report violations, optionally applying the safe ones. Use before opening a PR that touches CSS, HTML or screen code; when asked whether something is on-spec, matches the design system, or has drifted; and when asked to sweep the whole app for design violations. Takes `full` to sweep every file instead of the diff, and `fix` to apply drift fixes after reporting.
---

# Design compliance

Audit the app against `DESIGN.md`. Report first, always. Fix only when asked, and only the findings that are safe to fix.

**`DESIGN.md` is the only authority.** Read it at the start of every audit. The checks below are derived from it, not a substitute for it — if this file and `DESIGN.md` disagree, `DESIGN.md` is right and this file is stale. Say so in the report.

## Arguments

| Invocation | Scope |
|---|---|
| `/design-compliance` | The working diff: `git diff`, `git diff --cached`, and untracked files |
| `/design-compliance full` | Every file in scope. Expect a large result — see Buckets |
| `/design-compliance fix` | Audit the diff, report, then apply **drift fixes only** |
| `/design-compliance full fix` | Both |

Diff mode is the default because it catches drift where it's introduced, which is what keeps the app compliant day to day. Reach for `full` when asked to sweep, or after a migration.

Files in scope: `index.html`, `onboarding.html`, `share-target.html`, `app-styles.css`, `dreamlab-styles.css`, `app.js`, `dreamlab.js`, `app-data.js`, `dreamlab-data.js`, `lokhi-assets/**`.

Never in scope: `design/reference/**`. That is source reference art, not app code, and complies with nothing.

## The reporting contract

**Audit and fix are separate steps, and the separation is the point.** A violation can mean the code is wrong *or* that someone decided the system should change, and those have opposite remedies. `DESIGN.md § Changing this system` requires design changes to land in the spec before the code, so a fix applied without that decision is itself an undeclared system change.

So:

- **Report before touching anything**, even a one-character fix, even with `fix` passed. The report comes first in the response; the edits follow it.
- **Without `fix`, change nothing.** Not the CSS, not `DESIGN.md`. Offer the fix in one line at the end.
- **With `fix`, apply bucket 1 only.** Never bucket 2 — those cannot be fixed in code by definition, because the remedy is a decision about the spec.
- **Never edit `DESIGN.md` as part of a fix.** If the audit concludes the spec is wrong, say so and stop. That is a product decision.

## Buckets

Sort every finding into exactly one. This is the most important step; an unsorted report is noise.

**1 — Drift.** Code contradicts `DESIGN.md` and `DESIGN.md` is right. A hardcoded `#2E5C8A` where a token exists, a `border-radius: 4px`, a new `box-shadow`. Remedy: fix the code. Itemise with file:line. Safe to apply under `fix`.

**2 — Undeclared system change.** The code introduces a value or rule that isn't in `DESIGN.md` and looks deliberate rather than careless: a new accent used consistently across three screens, a font weight applied to a whole component class, a new radius used as though it were a token. Remedy: **stop.** Needs `DESIGN.md` updated and agreed first. Flag loudest — rarer than bucket 1 and the only findings that block.

**3 — Pre-redesign debt.** The app predates Hairline Almanac and hasn't been migrated. Baseline at the time the spec was written: ~11 `box-shadow` declarations, ~76 `font-weight` above 400, system sans rather than Cormorant Garamond + IBM Plex Mono, ~10 hex literals outside `:root`, 4 gradients, 2 `100vh`, 7 emoji in `dreamlab-data.js`, no `prefers-reduced-motion` in `app-styles.css`. **Count these, never itemise them.** One line: "Pre-redesign debt: N findings across M files (unchanged from baseline)." Itemise only if the count went *up* — new debt is bucket 1 or 2, not bucket 3.

In diff mode bucket 3 is empty by construction: if the diff didn't touch it, it isn't a finding.

When a finding is ambiguous between 1 and 2, put it in 2 and say why. A false "stop and decide" costs a conversation; a false "just fix it" costs a silent spec violation.

## Static pass

Run from the repo root. Each maps to a rule in `DESIGN.md § Do's and Don'ts` — re-read that section in case it has grown.

| Rule | Check |
|---|---|
| No shadows | `grep -n 'box-shadow' app-styles.css dreamlab-styles.css *.html` |
| No weight above 400 | `grep -nE 'font-weight: *([5-9]00\|bold)' *.css *.html` |
| Colour only via tokens | hex literals outside the `:root` block in either stylesheet |
| Two families only | `grep -nE 'font-family' *.css *.html` — Cormorant Garamond and IBM Plex Mono only |
| 1px stroke | `grep -nE 'border(-\w+)?: *(0\|[2-9]px\|1\.[1-9])' *.css` — 1.6px on dial major ticks only |
| Minimum radius 14px | `grep -nE 'border-radius: *([0-9]\|1[0-3])px'` — `50%` on a true circle is fine |
| No red/green state | any hex or token with hue 0–40° or 90–160° used for state — `--sprout` on the Sankey's Grow stream is the one allowed green |
| `100dvh` not `100vh` | `grep -n '100vh' *.css *.html` |
| No gradient on border/button/glyph | `grep -n 'gradient' *.css` — only the page wash, bloom card and corner glow recipes are legal |
| Motion budget | durations outside 160–240ms; anything animating a property other than `transform`/`opacity` |
| Reduced motion | `prefers-reduced-motion` present in each stylesheet that declares motion |
| No emoji in UI | `grep -nP '[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]' *.js` |
| No copy clichés | "Elevate", "Seamless", "Unlock", "Effortlessly", "Your financial journey" in data and screen files |
| Token coverage | every `:root` custom property has a counterpart in `DESIGN.md` front matter, and vice versa |

That last one catches the slowest failure: a token added to CSS and never written down.

## Rendered pass

Only after the static pass, and only for what static cannot see. In diff mode, skip it entirely unless the diff touched layout, colour or motion.

Follow the `lokhi-dev` skill: `make run` with `run_in_background: true`, drive Chrome, `make stop` when done. Prefer `take_snapshot` — it is a text tree and far cheaper than a screenshot. Screenshot only for the three genuinely visual questions: the bloom, the dial, and greyscale survival.

At 390px, for `home`, `grow`, `optimize`, `dreamlab`, `profile` and `onboarding.html`:

- **Greyscale survival.** Apply `filter: grayscale(1)` via `evaluate_script` and confirm every state is still distinguishable. `DESIGN.md` requires state to be carried by ink first and colour second. This is the highest-value check in the whole skill.
- **Colour budget.** At most one bloom card per screen; no glow on small tiles, list rows or ink-filled elements; no glow behind a semantic dot or underline; neighbouring glows don't repeat a colour.
- **One big number, one verdict.** Exactly one `numeral-xl`-scale figure per screen, at most one italic verdict.
- **No horizontal overflow** at 390px.
- **Contrast.** `micro-mono` at 11px against its background is the first thing to fail.
- **Console clean** via `list_console_messages`.

## Report format

Lead with the verdict in one line. Then only the non-empty buckets, ordered 2, 1, 3 — most consequential first.

```
UNDECLARED SYSTEM CHANGE  (needs DESIGN.md updated + agreed before code lands)
  app-styles.css:214  --accent redefined to #7B61FF, used on 3 screens
    → DESIGN.md colors.accent is #E2559A. If intended, update DESIGN.md
      first per § Changing this system.

DRIFT  (code is wrong, DESIGN.md is right)
  app-styles.css:88   box-shadow on .card — system has no shadows
  app.js:412          hardcoded #2E5C8A — use var(--ink)

PRE-REDESIGN DEBT
  142 findings across 6 files (unchanged from baseline)
```

No preamble, no restating the brief. If everything passes, say so in one line and stop — do not pad a clean report.

Under `fix`, after the report: apply bucket 1, list what changed in one line per file, and state plainly that bucket 2 was left alone and why.
