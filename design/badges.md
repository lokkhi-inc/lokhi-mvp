# Lokhi Badges

A framework for badges earned by *doing things in Lokhi*, modelled on the
[GitHub Achievements](https://github.com/drknzz/GitHub-Achievements) format: each
badge has a name, a one-line "how to earn it", and an optional set of tiers.

Three families for the three activities, plus one-off specials:

| Family | Measures | Badges |
|---|---|---|
| **Streaks** | showing up, week after week | Steady Orbit, Comeback |
| **Dreams** | how many dreams you have defined | Dreamer, Starstruck, Constellation |
| **Expeditions** | stages covered inside dreams | Pathfinder, Landfall, Deep Space |
| **Special** | one-off moments | First Light, Why First, Fairy's Favourite, Full Circle |

> Status: proposal. Nothing here is built. Names, thresholds and copy are
> placeholders to react to.

## Principles

1. **Consistency, never position.** Badges count what a user *did* (weeks shown
   up, dreams defined, stages covered). They never read balances, income,
   spending or net worth, and never compare users. This is the existing
   gamification rule in the `lokhi-dev` skill.
2. **Nothing is ever taken away.** A broken streak does not remove a badge. Streak
   badges are earned on the **best** streak ever reached, so a lapse costs
   nothing. Copy never says "lost", "broke" or "behind".
3. **Every tier is a fact plus a consequence.** "4 weeks in a row. The habit is
   forming." Not "Great job!"
4. **Quiet by default.** A badge appears once as a toast and then lives on the
   profile. No badge nags.
5. **Earned retroactively.** On first run of the badge engine, existing state is
   replayed so nobody starts at zero for things they already did.

## Tiers

GitHub uses a default badge plus Bronze / Silver / Gold. Lokhi has no extra
colour to spend (see `DESIGN.md`: structure is achromatic), so a tier is carried
by **ink detail**, the same way a Planet terraforms:

| Tier | Label | Visual |
|---|---|---|
| I | *(default)* | 1px circle outline, glyph inside |
| II | `x2` | adds one tick ring |
| III | `x3` | adds a second tick ring |
| IV | `x4` | adds a tick ring and an outer ring |

Locked badges render as the same outline, **dashed**, with the requirement
beneath in `micro-mono`. A tier chip (`x2`, `x3`, `x4`) sits at the badge's
corner, as on GitHub.

---

## Streaks

A *week* counts when the user does at least one meaningful action in it: strikes
off a stage, defines or edits a dream, or finishes a Grow quest. Weeks run
Monday to Sunday in the user's local time. The streak is `streakWeeks` in
`app-data.js`.

### Steady Orbit

*Show up week after week.*

Earned for the longest run of consecutive active weeks.

| Tier | Requirement |
|---|---|
| I | 2 weeks in a row |
| II `x2` | 4 weeks in a row |
| III `x3` | 12 weeks in a row |
| IV `x4` | 26 weeks in a row |

### Comeback

*Pick it back up.*

Earned when the user is active again after a gap of one or more weeks. It exists
so that a lapse produces a badge, not a penalty.

| Tier | Requirement |
|---|---|
| I | Return after a gap, once |
| II `x2` | Return 3 times |
| III `x3` | Return 10 times |

---

## Dreams

Counts dreams the user has **defined**, meaning completed the Create Dream flow
(`addDream`). Seed fixtures do not count. Deleted dreams still count: the badge
records that the dream was defined.

### Dreamer

*Put a dream into words.*

| Tier | Requirement |
|---|---|
| I | Define 1 dream |
| II `x2` | Define 3 dreams |
| III `x3` | Define 6 dreams |
| IV `x4` | Define 12 dreams |

### Starstruck

*Dream at every scale.*

Earned for covering the three levels of the dream hierarchy.

| Tier | Requirement |
|---|---|
| I | Define a Micro Dream |
| II `x2` | Also define a Life Goal |
| III `x3` | Also define a Super Goal |

### Constellation

*Connect dreams into something bigger.*

Earned for dreams grouped under a Super Goal (`parentId` set).

| Tier | Requirement |
|---|---|
| I | 2 dreams under one Super Goal |
| II `x2` | 4 dreams under one Super Goal |
| III `x3` | 2 Super Goals with 2 dreams each |

---

## Expeditions

A *stage* is one node on a dream's expedition path (a quest in `DL.quests`).
**Covered** means struck off. Stages count once each, even if undone and redone.

### Pathfinder

*Cover stages across all your dreams.*

| Tier | Requirement |
|---|---|
| I | Cover 1 stage |
| II `x2` | Cover 10 stages |
| III `x3` | Cover 30 stages |
| IV `x4` | Cover 100 stages |

### Landfall

*Reach a planet.*

Earned for finishing every stage of a dream.

| Tier | Requirement |
|---|---|
| I | Finish 1 dream |
| II `x2` | Finish 3 dreams |
| III `x3` | Finish a Life Goal |
| IV `x4` | Finish a Super Goal |

### Deep Space

*Keep going on a single dream.*

Earned for the most stages covered inside **one** dream. Rewards depth, where
Pathfinder rewards breadth.

| Tier | Requirement |
|---|---|
| I | 3 stages in one dream |
| II `x2` | 6 stages in one dream |
| III `x3` | 10 stages in one dream |

---

## Special

One-off badges with no tiers, like GitHub's Quickdraw or YOLO.

| Badge | How to earn it |
|---|---|
| **First Light** | Define your first dream. |
| **Why First** | Answer "Why does this matter to you?" in the Create Dream flow, and keep your answer after reviewing it. |
| **Fairy's Favourite** | Ask your Fairy Godmother a question on 3 different dreams. |
| **Full Circle** | Cover a stage, then open the Vision board with 3 or more task cards pinned. |

---

## Framework

### Badge definition

Definitions are data, not code, so thresholds can change without touching the
engine. They live in `badges-data.js` alongside the other fixtures.

```js
{
  id: "pathfinder",
  family: "expeditions",           // streaks | dreams | expeditions | special
  name: "Pathfinder",
  tagline: "Cover stages across all your dreams.",
  glyph: "compass",                // key from lokhi-assets/icons
  metric: "stages_covered",        // see Metrics below
  tiers: [
    { tier: 1, at: 1,   line: "First stage covered. You're on your way." },
    { tier: 2, at: 10,  line: "10 stages covered. The path is getting familiar." },
    { tier: 3, at: 30,  line: "30 stages covered. You're building a habit of finishing." },
    { tier: 4, at: 100, line: "100 stages covered." }
  ]
}
```

Special badges use `metric: "flag"` and a single tier with `at: 1`.

### Metrics

A metric is a number derived from existing state. Nothing is stored twice.

| Metric | Derived from |
|---|---|
| `best_streak_weeks` | highest value ever reached by the weekly streak |
| `comebacks` | count of active weeks that follow a gap |
| `dreams_defined` | count of `addDream` events (an event log, so deletes don't reduce it) |
| `dream_levels_covered` | distinct `type` values among defined dreams |
| `dreams_in_super_goal` | max children under one Super Goal |
| `stages_covered` | distinct quest ids ever struck off |
| `dreams_finished` | dreams whose progress reached 1 |
| `max_stages_in_one_dream` | max done quests across dreams |

### Evaluation

```
user action -> event -> update metric -> compare with tiers -> award new tier -> toast
```

1. The UI emits a small event: `dream_defined`, `stage_covered`, `week_active`,
   `fairy_asked`, `board_opened`.
2. `BadgeEngine.record(event)` appends to an event log in `localStorage`.
3. `BadgeEngine.evaluate()` recomputes metrics from the log and compares each to
   its tiers.
4. A badge only moves **up**. An award is written once and never revoked.
5. New awards are returned to the caller, which shows one toast per award.

Because metrics come from an append-only log, `evaluate()` is idempotent and can
be replayed at any time. That is also how retroactive earning works.

### Stored record

Only awards and the log are persisted. Definitions are static.

```js
// localStorage: lokhi_badges
{
  events: [{ type: "stage_covered", dreamId: "dream-1", questId: "q_why", at: "2026-10-26" }],
  awards: { pathfinder: { tier: 2, at: "2026-10-26" } }
}
```

### Module boundaries

Same separation as Dream Lab, so each piece can be replaced on its own.

| Piece | Responsibility | Knows about |
|---|---|---|
| `badges-data.js` | Definitions and copy (fixtures) | nothing |
| `badge-engine.js` | `record`, `evaluate`, `progressFor` (pure, no DOM) | definitions, event log |
| `badges.js` | Profile grid, toast, detail sheet | engine |
| Dream Lab / Grow / app | Emit events only | engine's `record` |

Screens never decide whether a badge is earned. They only report what happened.

### Where badges appear

- **Profile.** A grid of Badge tiles on paper, earned first, locked dashed after.
  Per `DESIGN.md`, Profile uses hairline rules and `numeral-lg` plus
  `micro-mono`, not filled badges.
- **Toast.** One line when a tier is awarded: name, tier, and its `line`.
- **Badge sheet.** Tap a badge for its tagline, tier table, and progress to the
  next tier as a Segment row (not a percentage).
- **Expedition page.** Nothing. Badges stay out of the dream itself so the dream
  is never about the badge.

### Copy rules

- State a fact and its consequence. "4 weeks in a row. The habit is forming."
- Never use: *lost*, *broke*, *missed*, *behind*, *only*, *just*.
- Streak copy always speaks of the best run, never the current one ending.
- No emoji. Glyphs come from the line icon set, or a diamond.

### Out of scope

- Leaderboards, rankings, sharing, or any comparison between users.
- Badges for money outcomes (amount saved, target reached in yen, net worth).
- Rewards or coins attached to badges. Coins belong to stages (see
  `DESIGN.md`).

### Open questions

1. Does a Grow quest count toward an active week, or only Dream Lab activity?
2. Should Landfall count dreams the user finished before the engine existed?
   (Current plan: yes, via replay.)
3. Are `x2` / `x3` / `x4` chips enough to distinguish tiers at 40px, or does the
   tick ring need to be larger?
4. Do special badges need a hidden state until earned, like GitHub's secret
   achievements?
