// ===== Note Types =====
export type NoteType = 'tap' | 'hold' | 'flick';

export type Judgment = 'perfect' | 'great' | 'good' | 'bad' | 'miss';

export interface BeatmapNote {
  lane: number;       // 0-6 (7 lanes)
  time: number;       // hit time in ms from song start
  type: NoteType;
  duration?: number;  // for hold notes, in ms
}

export interface Beatmap {
  title: string;
  artist: string;
  difficulty: string;
  bpm: number;
  audioFile: string;
  offset: number;     // ms offset before first beat
  notes: BeatmapNote[];
}

// ===== Runtime Note State =====
export interface ActiveNote {
  note: BeatmapNote;
  hit: boolean;
  judged: boolean;
  judgment?: Judgment;
  holdActive?: boolean;
  holdEndJudged?: boolean;
  y?: number;         // current screen Y position
}

// ===== Hit Effect =====
export interface HitEffect {
  lane: number;
  judgment: Judgment;
  time: number;       // creation time in ms
  y: number;
}

// ===== Game State =====
export interface GameState {
  score: number;
  combo: number;
  maxCombo: number;
  judgments: Record<Judgment, number>;
  activeNotes: ActiveNote[];
  hitEffects: HitEffect[];
  startTime: number;
  currentTime: number;
  playing: boolean;
  paused: boolean;
  finished: boolean;
}

// ===== Screen Management =====
export type ScreenType = 'title' | 'songSelect' | 'gameplay' | 'results';

// ===== Game Config =====
// NOTE: LANE_COUNT is kept for backward compat but runtime code should use keyConfig.laneCount
export const LANE_COUNT = 7; // max lanes supported
export const SCROLL_SPEED = 800; // pixels per second
export const NOTE_APPEAR_TIME = 1500; // ms before hit time the note appears

// Timing windows (ms)
export const TIMING = {
  perfect: 40,
  great: 80,
  good: 120,
  bad: 160,
} as const;

// Scoring
export const SCORE_MAP: Record<Judgment, number> = {
  perfect: 1500,
  great: 1000,
  good: 500,
  bad: 100,
  miss: 0,
};

// Key bindings (desktop)
export const KEY_BINDINGS: Record<string, number> = {
  'a': 0, 's': 1, 'd': 2, 'f': 3, 'j': 4, 'k': 5, 'l': 6,
  'A': 0, 'S': 1, 'D': 2, 'F': 3, 'J': 4, 'K': 5, 'L': 6,
};

// Colors per lane
export const LANE_COLORS = [
  '#ff6b9d', '#ff9a76', '#ffd93d', '#6bcb77',
  '#4d96ff', '#9b59b6', '#e74c3c',
];

export const JUDGMENT_COLORS: Record<Judgment, string> = {
  perfect: '#ffeb3b',
  great: '#ff9800',
  good: '#4caf50',
  bad: '#2196f3',
  miss: '#9e9e9e',
};
