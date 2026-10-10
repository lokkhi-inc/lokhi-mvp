# Swapping the surface layer

Lokhi's visual design is two layers. The point of this file is to keep them apart so the second one can be replaced without touching the first.

**Layer 1 — Structure.** Does not change. Geometry, type scale, spacing rhythm, layout grid, component anatomy, motion budget, and the three rules that make the whole thing work: one stroke weight, colour contained to small areas, no shadows.

**Layer 2 — Surface.** Changes. The ink and paper hues, the display typeface, the ornament vocabulary, the illustration style, and what carries personality.

Today Layer 2 is `DESIGN.md` — Hairline Almanac. The intended successor is `design/hand-drawn.md` — Chick & Friends. Neither is a redesign of the other; they are two surfaces over the same frame.

## The seam

Every value below is Layer 2. If a change is confined to this table, the swap is a token edit. If it is not, Layer 1 is leaking into component code and should be fixed before the swap, not during it.

| Token | Now (Hairline Almanac) | Later (Chick & Friends) |
|---|---|---|
| `colors.ink` | `#111111` | `#3A3A38` |
| `colors.ink-muted` | `#666666` | `#6B6862` |
| `colors.paper` | `#FFFFFF` | `#F3F0E8` |
| surface fill | `#FFFFFF` | `#FFFDF8` |
| `colors.wash` | `#F4F4F4` | hatch texture |
| `colors.state-on-track` | `#EFC22B` | `#EFC22B` — unchanged |
| `colors.state-attention` | `#F1BF88` | `#F1BF88` — unchanged |
| `colors.state-over` | `#EC97A8` | `#EC97A8` — unchanged |
| display family | Cormorant Garamond 400 | Gaegu 700 / 400 |
| mono family | IBM Plex Mono 400 | IBM Plex Mono 400 — unchanged |
| `rounded.card` | `28px` | asymmetric wobble |
| stroke | 1px straight | 1px graphite, round caps, slight wobble |
| ornament | diamond, tick dial, hairline rule | sparkle, sweat, thought dots, bubbles |
| personality carrier | italic serif verdicts | the three characters |

The semantic colours are deliberately identical across both rows. They were chosen from the hand-drawn kit's coloured pencils so that the one thing a finance app cannot afford to get wrong — what "over budget" looks like — never moves.

## Build so the swap is cheap

1. **Every Layer 2 value goes through a CSS custom property.** No literal hex, no literal font-family, no literal radius in component CSS. A `grep -E '#[0-9a-fA-F]{6}' app-styles.css` outside `:root` should come back empty.
2. **Name tokens by role, not by appearance.** `--ink`, not `--black`. `--state-over`, not `--pink`. The hand-drawn layer's ink is brown-grey; a token called `--black` will be a lie within one release.
3. **Keep stroke weight behind one token.** `--stroke: 1px`. Wobble arrives later as a filter or an SVG swap, and it needs a single place to attach.
4. **Draw ornaments as inline SVG, never as a font or an image.** The diamond becomes a sparkle; that is a path swap if it is a path, and a redesign if it is a character.
5. **Keep the bloom gradients in exactly two places** — the page wash and the bloom card. The hand-drawn layer has no gradients at all, so these two rules get deleted rather than translated.
6. **Do not couple layout to the serif's metrics.** Cormorant runs narrow and tall; Gaegu runs wide and short. Size containers from content, not from a line count.

## When the swap happens

1. Promote `design/hand-drawn.md` to `DESIGN.md` and move the current file to `design/hairline-almanac.md`.
2. Replace the `:root` block. Nothing else in `app-styles.css` should need to change.
3. Swap the font links in `index.html`, `onboarding.html` and `share-target.html`.
4. Replace ornament SVGs; introduce characters per the casting rules in `design/hand-drawn.md`.
5. Delete the two bloom gradient rules.
6. Re-check contrast: graphite on sketch paper is a lower ratio than ink on white, and `micro-mono` at 11px is the first thing to fail.

Until then, `design/hand-drawn.md` is reference only. Build against `DESIGN.md`.

For changes *within* the active layer rather than a swap between layers, see `## Changing this system` in `DESIGN.md`. The seam table above is step 3 of that process.
