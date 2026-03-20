// ===== Note Types =====
export type NoteType = 'tap' | 'hold' | 'flick';

export type Judgment = 'marvelous' | 'perfect' | 'great' | 'good' | 'bad' | 'safe' | 'late';

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
export const LANE_COUNT = 7; // max lanes supported
export const SCROLL_SPEED = 800;
export const NOTE_APPEAR_TIME = 1500;

// 7-level timing windows (ms) — no MISS, everything registers
export const TIMING = {
  marvelous: 15,
  perfect: 30,
  great: 50,
  good: 80,
  bad: 100,
  safe: 150,
  // anything beyond 150ms = late (auto-catch)
} as const;

// Scoring per judgment
export const SCORE_MAP: Record<Judgment, number> = {
  marvelous: 2000,
  perfect: 1500,
  great: 1000,
  good: 500,
  bad: 200,
  safe: 50,
  late: 10,
};

// ガルパ-style rainbow lane colors
export const LANE_COLORS = [
  '#FF69B4', '#FF8A65', '#FFD54F', '#81C784',
  '#64B5F6', '#BA68C8', '#EF5350',
];

export const JUDGMENT_COLORS: Record<Judgment, string> = {
  marvelous: '#ffd700',
  perfect: '#FF69B4',
  great: '#BA68C8',
  good: '#64B5F6',
  bad: '#9E9E9E',
  safe: '#666666',
  late: '#444444',
};

export const JUDGMENT_LABELS: Record<Judgment, string> = {
  marvelous: 'MARVELOUS',
  perfect: 'PERFECT',
  great: 'GREAT',
  good: 'GOOD',
  bad: 'BAD',
  safe: 'SAFE',
  late: 'LATE',
};

// All judgments in display order
export const ALL_JUDGMENTS: Judgment[] = [
  'marvelous', 'perfect', 'great', 'good', 'bad', 'safe', 'late',
];

// Japanese difficulty labels
export const DIFFICULTY_LABELS: Record<string, string> = {
  'EASY': 'イージー',
  'NORMAL': 'ノーマル',
  'HARD': 'ハード',
};
