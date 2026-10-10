---
version: "draft"
name: "Chick & Friends"
description: "NOT ACTIVE. The hand-drawn direction Lokhi is heading toward — soft graphite pencil lines, warm sketch paper, three characters who narrate the money, and colour that appears only as hatched coloured-pencil on cheeks, beaks and captions. Documented so the placeholder layer can be built to swap into it."
colors:
  graphite: "#3A3A38"
  graphite-soft: "#6B6862"
  sketch-paper: "#F3F0E8"
  sheet: "#FFFDF8"
  yolk: "#F9E27C"
  yolk-hatch: "#EFC22B"
  apricot: "#F9E2C6"
  apricot-hatch: "#F1BF88"
  blush: "#F7C9D1"
  blush-hatch: "#EC97A8"
  cream: "#FAE5CB"
typography:
  title:
    fontFamily: Gaegu
    fontSize: clamp(32px, 4vw, 56px)
    fontWeight: 700
    lineHeight: 1.1
  caption:
    fontFamily: Gaegu
    fontSize: 22px
    fontWeight: 400
    lineHeight: 1.3
  body-mono:
    fontFamily: IBM Plex Mono
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: 0.08em
rounded:
  wobble-sm: 10px 14px 8px 16px
  wobble-md: 14px 18px 12px 20px
  wobble-lg: 16px 20px 14px 22px
---

# Chick & Friends — the direction, not the system

**Status: not fixed.** Nothing here is approved and none of it is built. This file exists so that the active system in `DESIGN.md` can be built in a way that swaps into this cheaply. Do not implement from this file. If asked to apply "the hand-drawn look", ask first — the decision has not been made.

Artwork by Meghalee. Source kit: `design/reference/ChicknFriends/` — `Character Kit.dc.html` is the index, with `Chick.dc.html`, `Cat.dc.html`, `Pup.dc.html` and `Bubble.dc.html` as the individual components and `support.js` as their runtime. Open the Character Kit in a browser before touching any of it.

## The cast

- **Chick** — the narrator. Big round head, scalloped collar, cheeks and beak in a row. Chick delivers the verdict and the recap.
- **Cat** — the friend who nudges. Pointy ears, yolk patches, ω mouth. Cat carries prompts, quests and optional nudges.
- **Pup** — the one with the rules. Floppy ears, long snout, blush speckled cheek. Pup carries limits, deadlines and anything the user agreed to.

Casting matters more than it looks like it does. If Pup delivers encouragement or Chick delivers a limit, the tone inverts and the app starts nagging.

## The three principles, verbatim from the kit

- **A — One line weight.** Soft graphite, round caps, a little wobble.
- **B — Colour only on cheeks, beak, collar and patches** — hatched like coloured pencil.
- **C — Faces stay tiny.** Mood lives in brows, eyes and the marks around them.

These are the same three moves as the active system, drawn with a pencil instead of a ruler: one stroke weight, colour held to small contained areas, expression carried by the smallest marks on the page. That is why the swap is a surface change and not a rebuild.

## Pencils

| Name | Hex | Use |
|---|---|---|
| Graphite | #3A3A38 | All lines |
| Sketch paper | #F3F0E8 | Page |
| Sheet | #FFFDF8 | Fills |
| Yolk | #F9E27C → #EFC22B | Cheeks, beak |
| Apricot | #F9E2C6 → #F1BF88 | Captions |
| Blush | #F7C9D1 → #EC97A8 | Pup's cheek |

Each colour is a pair: the light tone is the fill, the darker tone is the hatch drawn across it. Colour is never flat — it is always two tones with visible pencil strokes between them.

## Type

- **Gaegu Bold** — titles and SFX.
- **Gaegu Regular** — bubbles and captions.
- **IBM Plex Mono** — retained from the active system for data, amounts and labels. This is the one face that survives the swap, which is what keeps numbers feeling trustworthy while everything around them softens.

## Vocabulary beyond the characters

- **Bubbles:** speech, speech tinted, tail-right, thought, shout, caption (plain and tinted), banner.
- **Props and marks:** easel, phone, letter, writing, pencil cup, paint pot, sweat, sparkle, thought dots, "huh" / "!".
- **Corners wobble.** Radii are asymmetric — `10px 14px 8px 16px`, `14px 18px 12px 20px`. No corner matches its neighbour.
- **Strips.** The kit supports multi-panel strips. Candidate home for onboarding and for monthly recaps; not for anything the user needs to act on quickly.

## Open questions

- Does a character appear on every screen, or only at moments (recap, verdict, milestone)? Constant presence risks the childish end of the brief.
- Do amounts stay in IBM Plex Mono, or does Gaegu reach the numbers? Recommendation: never Gaegu for money.
- Light sketch paper only, or is there a night version?
- How do the characters survive at 24px in a tab bar, given principle C?
