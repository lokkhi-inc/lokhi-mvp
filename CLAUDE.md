# Lokhi

Static HTML/CSS/JS PWA. Running and deploying go through `make`; the `lokhi-dev` skill has the workflow, file map, and conventions.

## Output

- Answer in as few words as the question allows. No preamble, no sign-off.
- Don't recap what the tool output already showed, or list files you didn't change.
- A tight paragraph beats headings and bullets for anything short.

## Context

- Prefer `take_snapshot` over `take_screenshot` — text tree, much cheaper.
- `make check` runs at session start and is silent when healthy. No report means
  the setup is fine; don't re-run it to confirm.
- Check locally with `make run` before spending a deploy (100/day, shared).
- After a PR merges, run `make prune` (lists only) and report any
  stranded previews. Never delete them yourself; `make prune DELETE=1` is the user's.

## Code

- Comment only what the code can't say itself. No comment restating the next line.
- Match surrounding style; don't reformat untouched code.
- Mock data lives in `app-data.js`. Change it there, not in screen code.
- Every styling decision comes from `DESIGN.md` — colors, type, spacing, radii,
  component anatomy. Don't invent a value; if it isn't there, ask.
- A change that edits a `DESIGN.md` token, adds a value that isn't in one, or
  touches more than one screen is a system change: update `DESIGN.md` first,
  get it agreed, then write code. Never the reverse — see `## Changing this
  system`.
