---
version: "alpha"
name: "Hairline Almanac"
description: "White paper, one-weight ink rules, a neo-serif display face against uppercase monospace microcopy, and colour held back to soft blooms at the edges. Premium without gravity — built for a money app that should read as calm and well-made rather than corporate or cute. Placeholder surface layer for Lokhi until the hand-drawn direction lands."
colors:
  ink: "#111111"
  ink-muted: "#666666"
  paper: "#FFFFFF"
  wash: "#F4F4F4"
  accent: "#E2559A"
  bloom-rose: "#FF78B4"
  bloom-blush: "#FFB3C8"
  bloom-amber: "#FFE1A1"
  sprout: "#B5DDA4"
  state-on-track: "#EFC22B"
  state-attention: "#F1BF88"
  state-over: "#EC97A8"
typography:
  display-xl:
    fontFamily: Cormorant Garamond
    fontSize: clamp(34px, 4.4vw, 56px)
    fontWeight: 400
    lineHeight: 1.1
  display-lg:
    fontFamily: Cormorant Garamond
    fontSize: clamp(32px, 3vw, 44px)
    fontWeight: 400
    lineHeight: 1.05
  display-md:
    fontFamily: Cormorant Garamond
    fontSize: 28px
    fontWeight: 400
    lineHeight: 1.1
  display-sm:
    fontFamily: Cormorant Garamond
    fontSize: 22px
    fontWeight: 400
    lineHeight: 1.2
  verdict:
    fontFamily: Cormorant Garamond
    fontSize: 36px
    fontWeight: 400
    lineHeight: 1
  numeral-xl:
    fontFamily: Cormorant Garamond
    fontSize: 64px
    fontWeight: 400
    lineHeight: 1
  numeral-lg:
    fontFamily: Cormorant Garamond
    fontSize: 44px
    fontWeight: 400
    lineHeight: 1
  body-mono:
    fontFamily: IBM Plex Mono
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: 0.06em
  label-mono:
    fontFamily: IBM Plex Mono
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0.1em
  micro-mono:
    fontFamily: IBM Plex Mono
    fontSize: 11px
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: 0.12em
  numeric-inline:
    fontFamily: IBM Plex Mono
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0.02em
spacing:
  hair: 1px
  "2xs": 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 20px
  xl: 24px
  "2xl": 28px
  "3xl": 44px
  "4xl": 72px
rounded:
  input: 14px
  card: 28px
  pill: 999px
components:
  card:
    backgroundColor: "{colors.paper}"
    borderColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: 28px
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    borderColor: "{colors.ink}"
    typography: "{typography.micro-mono}"
    rounded: "{rounded.pill}"
    padding: 11px 26px
  button-ghost:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    borderColor: "{colors.ink}"
    typography: "{typography.micro-mono}"
    rounded: "{rounded.pill}"
    padding: 11px 16px
  chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    borderColor: "{colors.ink}"
    typography: "{typography.micro-mono}"
    rounded: "{rounded.pill}"
    padding: 5px 12px
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    borderColor: "{colors.ink}"
    typography: "{typography.numeric-inline}"
    rounded: "{rounded.input}"
    padding: 12px 16px
  meter:
    backgroundColor: "{colors.paper}"
    borderColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: 6px
  segment:
    backgroundColor: "{colors.paper}"
    borderColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    height: 14px
  rule:
    backgroundColor: "{colors.ink}"
    height: 1px
---

# Lokhi — Hairline Almanac

## Overview

White paper, one-weight ink rules, a neo-serif display face against uppercase monospace microcopy, and colour held back to soft blooms at the edges. Premium without gravity — built for a money app that should read as calm and well-made rather than corporate or cute. Placeholder surface layer for Lokhi until the hand-drawn direction lands.

The look has no single settled name. What designers currently call the parts: **neo-serif + mono** for the type pairing (an expressive serif carrying meaning, a monospace carrying data and labels), **aurora** or **mesh gradient** for the soft chromatic blooms, and **editorial minimalism** or **quiet luxury** for the achromatic hairline structure holding it together. The ornament — rules that terminate in a small rotated square, engraved tick dials, a sunburst — is almanac and scientific-instrument vocabulary. Call the whole thing Hairline Almanac internally and nobody has to argue about the trend name.

The tension the system exists to resolve: a finance app that is playful risks looking like it is not safe with money, and a finance app that is serious risks looking like a bank. This resolves it by keeping *structure* severe and *voice* warm. Every line is 1px. Every corner is generous. Nothing is bold, nothing is shouted, nothing glows. The lightness arrives entirely through what the type says, the italic one-word verdicts, and three pink-to-amber blooms that never carry meaning and never sit under text.

- Density: 3/10 — Airy
- Variance: 6/10 — Composed contrast
- Motion: 2/10 — Barely there

- **Style:** Premium, Warm, Unhurried
- **Keywords:** hairline, engraved, almanac, neo-serif, monospace, aurora, instrument, calm
- **Era:** Contemporary Editorial
- **Light/Dark:** ✓ Light / ✗ No dark mode yet — see `design/migration.md`

Source material lives at `design/reference/interlude.html` (the dashboard this is derived from — open it in a browser, it is the ground truth) and <https://interludeapp.net/> (the same grammar at landing-page scale).

## Colors

The palette is two layers that never mix jobs.

**Structure is achromatic.** Every border, rule, tick, fill, glyph and icon is ink, muted ink, or paper. If a thing conveys information, it is black on white.

**Colour is atmosphere.** The blooms are decoration, and there is a dash of them on every screen at three strengths: the page wash at the bottom edge, one bloom card per screen, and a soft corner glow on most panels. They rise from a bottom edge, never tint a border or a glyph, and never mean anything.

- **Ink** (#111111) — All text, all 1px strokes, all filled progress. The only text colour.
- **Ink Muted** (#666666) — Secondary metadata only: counts, timestamps, "of 100", "26 days left". Never a full sentence.
- **Paper** (#FFFFFF) — Page and card background. Pure white, not off-white.
- **Wash** (#F4F4F4) — Ghost-button hover and sunken rows. The only grey fill.
- **Accent** (#E2559A) — The one interactive chroma: link hover, focus ring, the active tab's indicator. Used as a line or an underline, never as a fill behind text.
- **Bloom Rose** (#FF78B4) — Primary bloom.
- **Bloom Blush** (#FFB3C8) — Secondary bloom, also #FFA8CC inside cards.
- **Bloom Amber** (#FFE1A1) — The warm end of every bloom. Always present, always last.

Semantic colour exists but is deliberately starved. A money app has to say over / tight / fine, and black-on-white alone cannot. These three are the full-strength versions of the coloured-pencil tones in the hand-drawn kit, so the future swap costs nothing:

- **On Track** (#EFC22B) — Within plan.
- **Attention** (#F1BF88) — Close to the edge.
- **Over** (#EC97A8) — Past the line.

Rules for semantic colour, in order:

1. **State is carried by ink first.** A filled bar, a crossed rule, a count, an italic word. Colour is the second signal, never the only one. Nothing in this app should be unreadable in greyscale.
2. **Semantic colour appears as a 2px underline, a dot, or a bar fill — never a background panel, never text colour.**
3. **No red. No green for state.** Red reads as failure and green as permission; Lokhi does neither. Over-budget is rose, not alarm. Green exists in exactly one place — Sprout, the Grow stream in the Sankey, money being put to work — and is never used to mean "good".

Bloom recipes. The first two are verbatim from the reference; the corner glow is ours.

```css
/* Page bottom wash — behind everything, pointer-events:none, height ~520px */
background:
  radial-gradient(60% 90% at 15% 110%, #ff78b4 0%, rgba(255,120,180,0) 70%),
  radial-gradient(55% 80% at 60% 115%, #ffb3c8 0%, rgba(255,179,200,0) 70%),
  radial-gradient(50% 90% at 95% 110%, #ffe1a1 0%, rgba(255,225,161,0) 70%);

/* Bloom card — the screen's hero panel, one per screen */
background:
  radial-gradient(80% 70% at 10% 100%, #ffa8cc 0%, rgba(255,168,204,0) 70%),
  radial-gradient(70% 70% at 100% 100%, #ffe1a1 0%, rgba(255,225,161,0) 70%),
  #fff;

/* Corner glow — one per panel, a single colour from one bottom corner */
background:
  radial-gradient(85% 75% at 0% 110%, rgba(255,120,180,0.45) 0%, rgba(255,120,180,0) 70%),  /* rose, bottom-left */
  #fff;
/* amber: #ffe1a1 at full strength, bottom-right · blush: #ffb3c8 at 0.7, bottom-right */
```

Every recipe anchors its gradient centres *below* the box (at 100–115% vertical) so colour rises from an edge and thins out by the time it reaches the type. Keep that. A bloom centred in a box looks like a bug.

**Corner glows cycle rose → amber → blush in document order** within a group (a stat grid, a stack of cards), so neighbouring panels never repeat a colour and the screen reads as warm overall rather than as one colour. A glow may sit behind text — every bloom tone keeps ink above 10:1 — but it never sits behind a semantic dot or underline, which would muddy the one colour that means something.

**Where colour goes.** Full-width cards glow. Small tiles — the stat grid, garden tiles, two-up compare tiles, quest tiles, badges — stay paper; a glow in a small box reads as a smudge, not light. List rows — missions, checklists, explorer and theme rows, journey rows — stay plain paper; they are the quiet layer, and their plainness is what makes the panels above them read as warm. Inverted (ink-filled) elements never glow.

## Typography

Two families, no third.

- **Display / Numerals:** Cormorant Garamond — weight 400 only, regular and italic. High-contrast strokes, old-style figures. Carries headlines, amounts, names, and one-word verdicts.
- **Everything else:** IBM Plex Mono — weight 400 only. Carries body copy, labels, metadata, buttons, inputs, and all UI chrome.

Scale:

| Token | Size | Used for |
|---|---|---|
| `display-xl` | clamp(34px, 4.4vw, 56px) | Screen greeting, the one big line per screen |
| `display-lg` | clamp(32px, 3vw, 44px) | Card headline, quest title |
| `display-md` | 28px | Section head |
| `display-sm` | 22px | Row name, inline item title |
| `verdict` | 36px *italic* | A single word or two: "Steady." "6 days" |
| `numeral-xl` | 64px | The one headline number on a screen |
| `numeral-lg` | 44px | Stat-card figure |
| `body-mono` | 12px / 1.7, 0.06em, UPPERCASE | All prose |
| `label-mono` | 12px / 1.4, 0.1em, UPPERCASE | Card labels, nav |
| `micro-mono` | 11px / 1.6, 0.12em, UPPERCASE | Tags, counts, buttons, captions |
| `numeric-inline` | 13px, 0.02em | Amounts inside rows, input values |

Hard rules:

1. **Never bold.** Both faces run at 400 everywhere. Hierarchy comes from size, case and family — that is what makes the page feel drawn with one pen. A `font-weight: 600` anywhere is a bug.
2. **Mono is uppercase with tracking, and that is why it must stay short.** Uppercase monospace at 12px is slow to read. Cap any mono paragraph at ~46ch and 3 lines. If the copy will not fit, the copy is wrong, not the type.
3. **Sentence case survives in exactly two places:** input values and inline amounts (`numeric-inline`). Everywhere else mono is uppercase.
4. **Serif never writes a paragraph.** It gets headlines, numbers, names, and verdicts. The moment it carries a second sentence it stops feeling like a title.
5. **Italic is the emotional register.** Reserve it for the brand wordmark and for verdicts — the word that tells the user how they are doing. Never for emphasis inside a sentence.
6. **Let Cormorant's old-style figures through.** `+18%` with a descending 8 is the point; do not force lining figures.
7. `text-wrap: balance` on every display line, `text-wrap: pretty` on every mono paragraph.

Load both from Google Fonts with `font-display: swap`: Cormorant Garamond 400 + 400 italic, IBM Plex Mono 400. Three files, nothing more.

## Layout

The PWA is mobile-first. The reference is a desktop dashboard; translate it, do not transplant it.

- **Grid:** CSS Grid. One column below 720px, `repeat(auto-fit, minmax(min(100%, 340px), 1fr))` above it. Max-width 1360px, centred.
- **Page frame:** padding `40px clamp(20px, 4vw, 56px) 72px`. On mobile the gutter floors at 20px. The bottom padding is deliberately deep — the bloom needs room below the last card.
- **Spacing rhythm:** base unit 4px. Card-to-card 24px, stack-within-column 20px, content-within-card 18–22px, label-to-value 8px.
- **Vertical order on every screen:** header → the one big thing → supporting cards → quiet list rows. Never two big things.
- **Chrome:** header 56px, tab bar 64px plus `env(safe-area-inset-bottom)`. Both sit on paper with a single 1px ink rule, no shadow, no blur.
- **Asymmetry is required.** No three-equal-column rows. The reference runs a tall score card, a medium quest stack, and a short stat cluster — different heights, same gutter.
- **Colour budget per screen:** the page wash, one bloom card (the hero panel), and corner glows on the remaining full-width cards. Never two bloom cards, never a glow on a small tile.
- **z-index contract:** base 0 / sticky chrome 100 / overlay 200 / sheet 300 / toast 500.

## Elevation & Depth

**There are no shadows in this system.** Not on cards, not on the tab bar, not on sheets, not on buttons. The reference contains zero `box-shadow` declarations and that is the single biggest reason it reads as expensive rather than as a template.

Depth comes from three things only:

1. **The hairline.** A 1px #111 border is the entire separation between a card and the page.
2. **The bloom.** Colour rising behind white cards is what gives the page its sense of a lit surface.
3. **Overlap and scale.** A card that is taller than its neighbours, or a numeral at 64px beside a label at 11px, does the work a shadow would.

Sheets and overlays get a 1px ink border and paper fill, entering from the bottom. The scrim behind them is `rgba(17,17,17,0.14)` — no blur.

Motion:

- **Physics:** ease-out, 160–240ms. No spring, no bounce, no overshoot.
- **Entry:** fade + translateY 12px → 0 over 220ms. Lists stagger 60ms, maximum five items.
- **Hover:** background shift only (`#fff` → `#f4f4f4` for ghost, `#111` → `#333` for primary), 160ms. No lift, no scale, no glow.
- **Press:** `translateY(1px)`. That is the whole press state.
- **Page transitions:** fade, 200ms.
- **The bloom does not animate.** If it ever does, 20s+ and sub-pixel. A drifting gradient turns premium into screensaver.
- **Performance:** transform and opacity only. Honour `prefers-reduced-motion: reduce` by dropping to opacity-only.

## Shapes

One stroke weight — 1px #111 — on every border, rule, tick, divider and outline in the app. This is the rule the whole system hangs from.

- **Card radius:** 28px. Large relative to the content, which is what keeps severe lines from reading as clinical.
- **Pill radius:** 999px. Buttons, chips, tags, meters, segments, nav items, single-line rows.
- **Input radius:** 14px.
- **Nothing square.** There is no 0px corner anywhere.
- **The diamond.** A 8–9px square filled ink, rotated 45°. It terminates hairline rules and marks list rows. It is the only decorative glyph in the system; use it sparingly and never more than three to a screen.
- **Icons:** the line set in `lokhi-assets/icons/line/` — Feather paths thinned to a 1.5 stroke on the 24px grid, which lands at about 1px at the 18–20px sizes the UI uses. Round caps, `currentColor` via CSS mask. If an icon needs a fill to read, it is the wrong icon — use a word in `micro-mono` instead.

## Components

**Rule** — `height: 1px; background: #111`. The horizontal divider inside cards and across the page. Dressed version: `flex rule · 9px diamond · content · 9px diamond · flex rule`, which is how the screen greeting is set.

**Card** — 1px #111, radius 28px, paper fill, padding 28px (22px for compact stat cards, `24px 28px` for wide short ones), `display: flex; flex-direction: column; gap: 18–22px`. No shadow. Label row at the top in `label-mono`, muted on the right.

**Bloom card** — a Card whose background is the bloom-card gradient above. One per screen: the hero panel. Its content is a `micro-mono` eyebrow, a `display-lg` headline, then `margin-top: auto` pushing a `numeral-xl` amount and a `body-mono` line to the bottom. The bloom must stay in the lower half, behind nothing but whitespace.

**Dial** — the signature component. SVG, `viewBox="0 0 260 260"`, centre 130,130:

- Inner circle: `r=70`, `fill=none`, `stroke=#111`, `stroke-width=1`.
- 44 radial ticks sweeping 270°, starting at −225°.
- Every 11th tick is major: `stroke-width 1.6`, inner radius 92. All others: `stroke-width 1`, inner radius 100. Outer radius 116 for all. `stroke-linecap="round"`.
- Ticks at or below the value: `opacity 1`. Above it: `opacity 0.2`. That contrast *is* the gauge — there is no coloured arc.
- Centred inside: the value in `numeral-xl`, the unit in `micro-mono` muted beneath.

**Sankey (money flow)** — the one hand-drawn element in the system, and the first thing on Home: where this month's income goes. Sources on the left, packed close together. A source band thick enough to hold its own label runs out to the card edge and carries the label inside (as the sketch does); thinner ones are labelled outside, in a column sized to their widest label. Amounts on both sides use short notation — ¥820k, ¥1.2M — with full figures in the hidden table. They converge into a single pinch line, then split right into Expenses, Grow (set to be invested) and Idle (cash with no job), each ending in a small chevron and labelled with name, amount and share of income.

- **Hand-drawn, not precise.** Band edges are 1px ink drawn per band (shared edges double up, like a pen going over a line twice), with control points jittered a couple of pixels from a seeded random so the drawing is stable between renders. An SVG turbulence displacement gives the ink a slight wobble, and a stronger one gives the fills a watercolour edge. Only the hand-drawn charts (this and the Expense bars) get these filters.
- **Washes, not fills.** Income bands are Bloom Amber. Expenses are Bloom Rose, Grow is Sprout (#B5DDA4), a pale sage — the one green in the system, as in the sketch, and Idle is unpainted paper with only its ink edges, because idle money has no job yet. Every band is directly labelled; colour is never the only identity.
- **Palette check.** The data-viz validator fails Amber and Sprout on lightness and chroma — they are washes, too pale to read as marks on their own — and passes colour-blind separation. That is accepted on purpose: the ink outline on every band, the direct labels and the table view are the required relief. Don't remove any of the three.
- **Time range.** The card's top-right holds a Select: the current month, short (Oct), this year to date, last year, Custom. Custom reveals a From / To pair of Inputs under the header row. Amounts cover the chosen range; the split is the same shape at any range.
- **Static.** No tap or hover states — the labels already say everything. A visually hidden table carries the same numbers for screen readers.
- The card around it is plain paper — the colour lives in the diagram.

**Meter** — a 6px-tall pill, 1px #111 border, filled from the left with solid #111 to the percentage. Label above in `display-sm`, amount right in `numeric-inline`. For an over-budget meter, fill past 100% in `state-over` and keep the ink fill up to the line.

**Segment row** — N equal pills in a flex row, `height: 14px`, 1px border, `gap: 6px`. Done segments fill #111, pending stay paper. Used for countable progress (tag 8 of 12). Preferable to a percentage whenever the number is small and real.

**Chip / tag** — pill, 1px border, `5px 12px`, `micro-mono`. Paper fill. Never coloured.

**Button, primary** — pill, `11px 26px`, ink fill, paper text, `micro-mono` uppercase. Hover `#333`. One per card, bottom-right, usually `margin-left: auto`.

**Button, ghost** — pill, `11px 16px`, 1px border, paper fill, ink text. Hover `#f4f4f4`. Dismissals and alternatives sit as a row of these to the left of the primary.

**Income bars** — the Income card, between the Sankey and Expenses. The same hand-drawn stacked columns as the Expense bars below (one shared drawing), for the last three complete months, followed by a fourth, empty column for the current month: a dotted 1px ink outline at the expected salary, with a serif italic "?" on its cap because side income and bonuses can't be known ahead.

- **Three groups, bottom to top, all on the Sankey's income amber so income reads as one colour across Home:** Salary is plain Bloom Amber; Side & business (freelance, rental) adds 1px ink hatching at 135° — the opposite angle to Expenses' taxes, so the two cards never share a texture; Bonus adds ink stippling. Wash / lines / dots stay distinct in greyscale. A legend, including the dotted "Expected" key, is always shown.
- Headline numbers: last month's total on the left, the current month's expected salary on the right.

**Expense bars** — the second hand-drawn chart, in the Expenses card under the Income card. Stacked columns for the last three complete months, with a thin dotted line showing the trend fitted over the last twelve — the user's personal inflation rate, also stated as a number above the chart.

- **Four groups, bottom to top:** Taxes & insurance (income, residence and capital-gains tax; social, health and home insurance — deductions under one roof), Rent & loans, Card spending, Utilities & other.
- **Identity by texture and wash, because green belongs to Grow:** Taxes & insurance is ink hatching at 45°, Rent & loans is Bloom Rose, Card spending is Bloom Amber, Utilities & other is plain paper. The four stay distinct in greyscale. A legend is always shown; segment amounts appear inside a segment only when they fit, totals sit on each column's cap, and a visually hidden table carries every number.
- **Drawn like the Sankey:** one wobbly 1px ink outline around each whole column and a 2px paper gap between its segments; columns are wider than the data-viz default (≤24px) because three thin columns on a phone read as empty. Gridlines are solid hairlines in muted ink. The trend line is 1px dotted ink — never a colour.
- **Four columns at a time.** The chart always fits four columns to the card; older months sit to the left and are a horizontal swipe away (the y-axis stays pinned while the columns scroll). The chart opens on its newest columns. When there is more to the left, a sliver of the next column peeks in at the edge as the scroll cue — no fade, which would be a gradient. Every column is full size with its amounts, at any range.
- **Time range** (Income and Expenses alike), a Select at the top of the opened card, matching the Sankey's: 3 months (default — the latest months, with all history a swipe away), the current year, last year, Custom — Custom reveals a From / To pair of month Inputs. A year or custom range limits what can be scrolled to. Headline numbers always describe the latest month; the header's period follows the range. Expenses' trend line is always the twelve-month fit and is drawn only across the columns inside those twelve months. Income's dotted expected column appears only when the range ends at the latest month.
- **Collapsed by default** (Income and Expenses alike). The card shows its header row and the two headline numbers, and the whole summary is one button with a chevron beside the period. Tapping it reveals the chart and legend with the standard entry motion (fade + 12px rise, 220ms — opacity and transform only, never height) and turns the chevron up; tapping again hides them. The button carries `aria-expanded`; the state resets on reload. Charts themselves stay static. The card is plain paper.

**Select** — a native `<select>` dressed as a Chip: pill, 1px ink, `micro-mono` uppercase, `5px 26px 5px 11px`, tracking 0.08em, with a 6px chevron drawn from two 1px ink borders on the right. Native so phones get their own picker. Focus is the standard accent ring.

**Input** — 1px border, radius 14px, `12px 16px`, paper fill, `numeric-inline`, placeholder in muted ink with an ellipsis ("A note for future you…"). Label above in `label-mono`. Focus: 2px `accent` ring at 2px offset. No floating labels.

**Glow panel** — any other full-width Card with one corner glow, cycling rose → amber → blush. Small tiles and list rows stay plain.

**Planet** — a dream on the Dreamscape. A circle with a 1px ink outline, paper fill, the dream's icon centred, title in `display-sm`-scaled serif beneath and the percentage in `micro-mono` muted. Terraforming is carried by ink detail only, never colour: 0–24% barren (outline plus two crater circles), 25–49% adds a latitude rule, 50–74% adds a meridian ellipse, 75–99% adds a tick halo like the Dial's, 100% adds a ring. Exploring dreams stay dashed. Life Goals are the larger circle, Micro Dreams the smaller.

**Expedition path** — the dream's quests as a winding hairline: a 1px ink rule curving left and right, with a Node at each quest. A Node is a 44px circle, 1px border, paper fill, the step number in `numeric-inline`. Done: ink fill, paper numeral. Next: 1px outline plus a second 1px outline at 4px offset (the completed-planet vocabulary). Later: dashed. Tapping a Node opens a sheet with the quest, its Dhan, and one primary button to strike it off. Rule segments between done Nodes are solid; ahead of the next Node they are dashed.

**Dhan** — the resource earned by striking off a quest. Shown as a `numeral-lg` count with `DHAN` in `micro-mono` beneath, never as a coin, glyph or colour. Always derived from done quests (10 each unless a quest says otherwise), so it cannot drift. It never ranks or compares balances — it counts consistency only.

**Galaxy return** — a ghost button, top-left of the expedition view, labelled `See overall galaxy view` with the left-arrow line icon. Entering a Planet zooms the Dreamscape camera onto it (transform only, 240ms ease-out); this button zooms back out. Reduced motion: cross-fade.

**Nav / tab bar** — icon over label, as in the original app: a 20px line icon above a 10px `micro-mono` uppercase label, on paper with a 1px ink rule along the top edge. No pills, no fills. Inactive: muted ink. Active: ink, with a 5px accent diamond under the label.

**List row** — a single-line pill, `18px 24px`, 1px border: `diamond · flex-1 text in body-mono · muted value right`. The quiet layer at the bottom of a screen.

**Empty state** — a hairline rule with a centred diamond, a `verdict`-italic line, one `body-mono` sentence, one ghost button. No illustration, no icon.

**Skeleton** — the component's hairline outline drawn with nothing inside, pulsing opacity 1 → 0.4 → 1 over 1.4s. Never a grey block, never a spinner.

## Do's and Don'ts

- No `box-shadow`. Anywhere. Depth is hairline, bloom, and scale.
- No `font-weight` above 400. Both faces, every size.
- No stroke weight other than 1px, except dial major ticks at 1.6px.
- No square corners. Minimum radius in the system is 14px.
- No red or green for state. Over-budget is rose; on-track is ink plus yolk. Sprout green is only ever the Grow stream.
- No colour as the sole carrier of state — the screen must survive greyscale.
- No bloom centred in a box, no glow behind a semantic dot or underline, no more than one bloom card per screen, no glow on list rows or inverted elements.
- No gradient on a border, a button, or a glyph.
- No emoji in UI. Use `micro-mono` words or the diamond.
- No icon fonts and no new icon sets — use the thinned line set in `lokhi-assets/icons/line/`, and draw additions to match it.
- No three-equal-column grids. Vary height and span.
- No `h-screen` / `100vh` — use `100dvh`.
- No mono paragraph over ~46ch or 3 lines.
- No AI copy clichés: "Elevate", "Seamless", "Unlock", "Effortlessly", "Your financial journey".
- Do write microcopy that states a fact and its consequence: "Covered. You'll still have ¥41,200 left."
- Do give every screen exactly one big number and one italic verdict.
- Do let serif numerals keep their old-style figures.
- Do terminate a hairline rule with a diamond when it frames something important.
- Do use real amounts and real names in mock-ups — mock data lives in `app-data.js`.

## Surfaces

The system governs every pixel a user sees in this repo. Per-screen interpretation:

- **Home** (`index.html`, `data-screen="home"`) — the Visualize pillar: the net-worth card first under the greeting, then the Sankey overview, then the detailed breakdown cards — Income, then Expenses; Bank account and Growth to follow. The net-worth card is Home's Bloom card; chart cards are plain paper — the colour lives in the charts. A share-received notice appears under the greeting only when something has been shared into Lokhi.
- **Grow** (`data-screen="grow"`) — the quest stack. `display-md` section head with a muted "N of M · skip anytime" to its right, then one Card per quest: chip + duration on the label row, `display-lg` title, `body-mono` body, a row of ghost buttons with one primary.
- **Optimize** (`data-screen="optimize"`) — the "found so far" card is the bloom card; opportunity cards glow. Two-up figures with `micro-mono` captions.
- **Dreamlab** (`data-screen="dreamlab"`) — the Dreamscape viewport is the bloom card, the one place it takes a full-bleed panel, because the screen is aspirational rather than factual. Still no shadow. Goals render as Meters, not as charts. Each dream is a Planet; tapping one zooms into its Expedition path, with Dhan counted in the toolbar and a Galaxy return button to zoom back out. The expedition view is a plain page (no bloom card); the detail sections follow beneath the path.
- **Profile** (`data-screen="profile"`) — hairline rules and List rows almost exclusively. Level, streak and badges as `numeral-lg` plus `micro-mono`, not as badges-with-fills. The avatar sits in a 1px circle.
- **Onboarding** (`onboarding.html`) — full page bloom wash, one `display-xl` line per step, one ghost + one primary. No progress bar; use a Segment row.
- **Share target** (`share-target.html`) — a single Card on the page wash. Nothing else.

The fairy, owl and avatar assets in `lokhi-assets/` predate this system. Until the hand-drawn layer lands, render them at 1px stroke in ink only, or replace them with a diamond.

## Use Case

Mobile-first PWA for personal finance. Dashboards, goal tracking, onboarding flows, and any surface where numbers need to feel considered rather than alarming.

This is the **placeholder** surface layer. The hand-drawn direction that will replace it is described in `design/hand-drawn.md`, and the seam between them — what changes, what does not — is in `design/migration.md`. Build against the structural rules (hairline, geometry, scale, layout, no shadow) and the swap stays cheap.

## Changing this system

Design decisions live here first and in code second. The order is not bureaucracy — this file is the only written record of *intent*. Code edited first turns it into a lie, and the next person or agent to read it will faithfully follow the lie.

**It is a system change if it does any one of these:**

- edits a value in the front matter
- introduces a value the front matter doesn't already have — a new hex, a font, a radius, a weight, a duration
- affects more than one component or more than one screen
- contradicts a line in Do's and Don'ts

**It is not a system change** to write copy, to compose a new screen from existing components, or to pick a different value *from* an existing scale. Those need no ceremony.

**Order of operations:**

1. **Edit the token.** The front matter is normative; everything else describes it.
2. **Edit every prose rule the old value held up.** This is the step that gets skipped. A palette change usually invalidates sentences in Colors *and* Do's and Don'ts. A typeface change usually invalidates the scale table, the hard rules under it, and the Google Fonts line. Grep the file for the old value before you declare it done.
3. **Update the seam table** in `design/migration.md` if the value appears there — every Layer 2 value does.
4. **Get it agreed.** A change to the system is a product decision, not a refactor. One person changing the accent colour changes every screen.
5. **Then change `:root` in `app-styles.css`.** Only `:root`.

**Step 5 is the test.** If the change cannot be made by editing custom properties alone, one of two things is true: component CSS has hardcoded values that should be tokenised first, or the change is structural rather than surface — see the two-layer split in `design/migration.md` — and needs a conversation, not a find-and-replace.

**Some changes are not token edits at all.** Reintroducing shadows, adding a font weight above 400, adding a second display family, using red or green for state, or putting a glow behind a semantic mark each break a rule the rest of the system is built on. Those are rewrites of Hairline Almanac, not adjustments to it. Say so out loud rather than landing them as a diff.
