# Test Coverage Analysis

## Current State

The project has **zero test files** and **no test framework configured**. There are no `*.test.ts` or `*.spec.ts` files, no test runner (Vitest, Jest, etc.) in `package.json`, and no CI pipeline.

## Recommended Test Framework

**Vitest** is the natural choice — it integrates natively with the existing Vite build tool, supports TypeScript out of the box, and requires minimal configuration.

---

## Priority Areas for Testing

### 1. Judgment / Timing Logic (`engine/game.ts` — `getJudgment`)

**Why:** This is the core gameplay mechanic. The `getJudgment(diff)` function maps timing differences to `perfect/great/good/bad` based on fixed thresholds from `TIMING`. A regression here would ruin the game feel.

**What to test:**
- Boundary values at each timing window edge (40ms, 80ms, 120ms, 160ms)
- Values just inside and outside each threshold
- Zero diff (exact perfect hit)

**Complexity:** Low — pure function, no dependencies.

### 2. Scoring & Combo System (`engine/game.ts` — `applyJudgment`)

**Why:** Score calculation involves combo multipliers (`combo * 10` bonus), combo resets on miss/bad, and max combo tracking. Bugs here would show wrong scores on the results screen.

**What to test:**
- Score increments for each judgment type match `SCORE_MAP`
- Combo increments on perfect/great/good, resets on bad/miss
- `maxCombo` tracks the highest streak correctly
- Combo bonus math: `floor(combo * 10)` added per hit

**Complexity:** Low — requires a `GameState` object but no DOM or audio.

### 3. Hit Detection (`engine/game.ts` — `tryHitNote`)

**Why:** Selects the closest unjudged note within the `TIMING.bad` window for a given lane. Incorrect logic could cause hits to register on wrong notes or miss valid ones.

**What to test:**
- Picks the closest note when multiple notes are in the window
- Ignores notes in other lanes
- Ignores already-judged notes
- Returns no hit when outside the timing window
- Hold note behavior: sets `holdActive` and defers final judgment

**Complexity:** Medium — needs mock `audio.currentTime` and a populated `activeNotes` array.

### 4. Hold Note Release (`engine/game.ts` — `tryReleaseHold`)

**Why:** Hold notes have a two-phase judgment (press + release). Releasing too early, too late, or not at all should produce different outcomes.

**What to test:**
- Release within timing window gives appropriate judgment
- Release outside `TIMING.bad` gives miss
- Unreleased hold notes eventually auto-miss in `update()`
- Multiple hold notes on same lane handled correctly

**Complexity:** Medium.

### 5. Miss Detection (`engine/game.ts` — `update`)

**Why:** Notes that scroll past the hit line without being hit must be auto-judged as misses. This also resets the combo.

**What to test:**
- Notes past `TIMING.bad` after their time get judged as miss
- Combo resets to 0 on miss
- Miss effect is created at the hit line

**Complexity:** Medium — needs a renderer mock for `hitLineY`.

### 6. Rank Calculation (`screens/results.ts` — `getRank`)

**Why:** Determines the final grade (S/A/B/C/D) shown to the player. Currently a private function; could be extracted for testing.

**What to test:**
- S rank: 0 misses AND ≥95% perfect+great rate
- A rank: ≥90% rate
- B rank: ≥80% rate
- C rank: ≥60% rate
- D rank: below 60% or zero notes
- Edge case: exactly at each threshold boundary

**Complexity:** Low — pure function of `GameState`.

### 7. Key Configuration (`engine/keyConfig.ts` — `KeyConfig`)

**Why:** Manages lane count switching, custom key bindings, duplicate detection, and localStorage persistence. A bug here could make lanes unplayable.

**What to test:**
- `bindings` returns correct key→lane map for 6 and 7 lanes
- `setKey` rejects duplicates (returns `false`)
- `setKey` accepts reassigning the same lane
- `labels` converts to uppercase, space to `⎵`
- `resetKeys` restores defaults
- `setLaneCount` switches between 6 and 7
- `load()` handles corrupt/missing localStorage gracefully
- `keysFor` / `labelsFor` return correct arrays for each mode

**Complexity:** Low — needs a `localStorage` mock (Vitest provides `vi.stubGlobal`).

### 8. Demo Beatmap Generation (`beatmaps/demo.ts`)

**Why:** Procedurally generates beatmaps. Must produce valid note data for both 6-lane and 7-lane modes.

**What to test:**
- All generated notes have `lane` within `[0, laneCount-1]`
- All notes have valid `type` (`tap`, `hold`, `flick`)
- Hold notes have positive `duration`
- Notes are ordered by time (or can be sorted)
- `createDemoBeatmap(6)` produces different lane distribution than `createDemoBeatmap(7)`
- `createEasyDemoBeatmap` produces fewer notes than `createDemoBeatmap`

**Complexity:** Low — pure functions, no side effects.

### 9. Song Duration Estimation (`engine/game.ts` — `loadBeatmap`)

**Why:** Song end is estimated from the last note time + duration + 3000ms. Wrong estimation could cut off gameplay early or leave the player waiting.

**What to test:**
- Duration calculated from last note's time + duration + 3000ms
- Defaults to 30000ms when no notes exist
- Notes are sorted by time after loading

**Complexity:** Low (can test the logic in isolation).

---

## Lower Priority (DOM/Canvas-dependent, harder to unit test)

| Area | File | Reason it's lower priority |
|------|------|---------------------------|
| Renderer | `engine/renderer.ts` | Canvas drawing — better tested with visual/snapshot tests |
| Screen rendering | `screens/*.ts` | DOM manipulation — integration/E2E tests more appropriate |
| Audio Manager | `engine/audio.ts` | Web Audio API — requires browser mocks, fragile to test |
| Input Manager | `engine/input.ts` | Event listeners — integration tests with simulated events |
| Custom Loader | `beatmaps/customLoader.ts` | File API + DOM — E2E test candidate |

---

## Suggested Implementation Order

1. **Set up Vitest** — `npm install -D vitest`, add `"test": "vitest"` to scripts
2. **`getJudgment` + `applyJudgment`** — Extract as pure functions, write boundary tests
3. **`getRank`** — Export and test with various `GameState` inputs
4. **`KeyConfig`** — Test with mocked `localStorage`
5. **Demo beatmap validation** — Verify structural correctness
6. **Hit detection + hold notes** — Test with mock audio time
7. **Miss detection** — Test the `update()` auto-miss logic
8. **Integration tests** — Full game loop with simulated inputs (later phase)

## Estimated Coverage Impact

Implementing tests for priorities 1–8 above would cover the core game logic, which represents roughly **60–70% of the meaningful application behavior**. The remaining 30–40% is rendering and DOM/browser interaction, better addressed with E2E testing tools like Playwright.
