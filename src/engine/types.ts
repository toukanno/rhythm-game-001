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

// ガルパ-style rainbow lane colors
export const LANE_COLORS = [
  '#FF69B4', '#FF8A65', '#FFD54F', '#81C784',
  '#64B5F6', '#BA68C8', '#EF5350',
];

export const JUDGMENT_COLORS: Record<Judgment, string> = {
  perfect: '#ffd700',
  great: '#FF69B4',
  good: '#81C784',
  bad: '#64B5F6',
  miss: '#777777',
};

// Japanese judgment labels
export const JUDGMENT_LABELS: Record<Judgment, string> = {
  perfect: 'PERFECT',
  great: 'GREAT',
  good: 'GOOD',
  bad: 'BAD',
  miss: 'MISS',
};

// Japanese difficulty labels
export const DIFFICULTY_LABELS: Record<string, string> = {
  'EASY': 'イージー',
  'NORMAL': 'ノーマル',
  'HARD': 'ハード',
};
