# CLAUDE.md — Rhythm Striker ★

## Project Overview

Browser-based 7-lane rhythm game inspired by BanG Dream! (Bandori). Fully offline single-page application with procedurally generated demo audio, canvas-based rendering, custom beatmap support, and responsive desktop/mobile input.

**Stack:** TypeScript (strict) + Vite 8 + HTML5 Canvas + Web Audio API
**No runtime dependencies** — uses only browser APIs.

## Quick Start

```bash
npm install          # Install dev dependencies (vite, typescript)
npm run dev          # Start dev server at http://localhost:5173
npm run build        # TypeScript check + Vite production build
npm run preview      # Preview production build locally
```

No test framework or linter is configured. `npm run build` (which runs `tsc`) is the primary correctness check.

## Repository Structure

```
src/
├── main.ts                  # Entry point — App class orchestrates screen navigation
├── style.css                # Global styles (dark theme, responsive layout)
├── engine/
│   ├── types.ts             # All type definitions and game constants
│   ├── game.ts              # Core game loop (update/render via RAF)
│   ├── renderer.ts          # Canvas 2D drawing (notes, effects, UI)
│   ├── audio.ts             # Web Audio API — playback & procedural demo generation
│   ├── input.ts             # Keyboard, touch, and mouse input handling
│   └── keyConfig.ts         # Key bindings & lane count (persisted to localStorage)
├── screens/
│   ├── title.ts             # Animated title screen
│   ├── songSelect.ts        # Song list + custom beatmap loading
│   ├── gameplay.ts          # Canvas container setup
│   ├── results.ts           # Score display & rank calculation
│   └── settings.ts          # Key rebinding UI
├── beatmaps/
│   ├── demo.ts              # Procedural demo beatmap generator
│   └── customLoader.ts      # File picker modal for custom beatmaps
└── assets/                  # Static images (mostly unused)

public/
├── beatmaps/                # Pre-made beatmap JSON files + songlist.json
├── songs/                   # MP3 audio files
└── favicon.svg
```

## Architecture

### Screen Flow

```
Title → Song Select → Gameplay → Results → (Retry | Back to Song Select)
         ↕
       Settings
```

`App` in `main.ts` manages screen transitions. Each screen in `src/screens/` renders into `div#app` and calls back to `App` for navigation.

### Game Engine (`src/engine/`)

- **Game** (`game.ts`): State machine (`playing` → `paused` | `finished`). Runs update/render loop via `requestAnimationFrame`. Handles note hit detection, judgment, scoring, and combo tracking.
- **Renderer** (`renderer.ts`): Draws lanes, notes (tap/hold/flick), hit effects, combo/score HUD, progress bar, and pause overlay. Scales to window size with device pixel ratio support.
- **AudioManager** (`audio.ts`): Wraps Web Audio API. Loads MP3s via fetch or generates a procedural 65-second demo song (kick, hi-hat, bass, melody, chord pad at 150 BPM).
- **InputManager** (`input.ts`): Maps keyboard keys and touch/mouse events to lane presses. Tracks pressed state for visual feedback.
- **KeyConfig** (`keyConfig.ts`): Singleton managing 6/7 lane toggle and per-lane key bindings. Persists to localStorage.

### Beatmap Format

```typescript
interface Beatmap {
  title: string;
  artist: string;
  difficulty: string;      // "EASY", "NORMAL", "HARD"
  bpm: number;
  audioFile: string;       // URL to audio file
  offset: number;          // Lead-in time in ms
  notes: BeatmapNote[];
}

interface BeatmapNote {
  lane: number;            // 0-based (0–6 for 7 lanes)
  time: number;            // Hit time in ms from song start
  type: "tap" | "hold" | "flick";
  duration?: number;       // Hold length in ms (hold notes only)
}
```

Pre-made beatmaps live in `public/beatmaps/`. The song list is defined in `public/beatmaps/songlist.json`.

### Judgment System

| Judgment | Timing Window | Points |
|----------|--------------|--------|
| Perfect  | ±40ms        | 1500   |
| Great    | ±80ms        | 1000   |
| Good     | ±120ms       | 500    |
| Bad      | ±160ms       | 100    |
| Miss     | >±160ms      | 0      |

Combo bonus: `combo × 10` added per hit. Combo resets on Bad/Miss.

## Code Conventions

- **TypeScript strict mode** — all code is TypeScript with strict checks enabled
- **ES modules** — `import`/`export` throughout
- **Naming:** PascalCase for classes, camelCase for functions/variables, UPPER_CASE for constants
- **Types:** Centralized in `src/engine/types.ts` — add new types/interfaces/constants there
- **No runtime dependencies** — use only Web APIs (Canvas, Web Audio, Fetch, Touch Events, localStorage)
- **Component pattern:** Each screen is a standalone module that renders into the DOM and cleans up after itself
- **Game loop:** `requestAnimationFrame`-based update/render cycle in `Game.loop()`

## Key Constants (in `src/engine/types.ts`)

- `TIMING` — judgment timing windows in ms
- `SCORE_MAP` — points per judgment tier
- `LANE_COLORS` — per-lane color palette (7 colors)

## Deployment

Vite config sets `base: '/rhythm-game-001/'` for GitHub Pages deployment. Production build outputs to `dist/`.

## Common Tasks

### Adding a new note type
1. Add the type string to `BeatmapNote.type` union in `types.ts`
2. Add rendering logic in `renderer.ts` `drawNote()`
3. Add hit/judgment logic in `game.ts` `tryHitNote()`

### Adding a new screen
1. Create `src/screens/newScreen.ts` exporting a render function
2. Add navigation method in `App` class in `main.ts`
3. Wire up transitions from/to adjacent screens

### Adding a pre-made beatmap
1. Add audio file to `public/songs/`
2. Add beatmap JSON to `public/beatmaps/`
3. Register in `public/beatmaps/songlist.json`

### Modifying key bindings defaults
Edit `DEFAULT_KEYS_7` and `DEFAULT_KEYS_6` in `src/engine/keyConfig.ts`.
