import type { Beatmap } from '../engine/types';

/**
 * Create a demo beatmap adapted to the given lane count.
 * BPM = 150, beat = 400ms
 */
export function createDemoBeatmap(laneCount: 6 | 7 = 6): Beatmap {
  const bpm = 150;
  const beatMs = 60000 / bpm;
  const notes: Beatmap['notes'] = [];
  const offset = 2000;
  const maxLane = laneCount - 1;
  const mid = Math.floor(laneCount / 2); // 3 for both 6 and 7

  const add = (beat: number, lane: number, type: 'tap' | 'hold' | 'flick' = 'tap', duration = 0) => {
    // Clamp lane to valid range
    const l = Math.min(lane, maxLane);
    notes.push({
      lane: l,
      time: offset + beat * beatMs,
      type,
      ...(duration > 0 ? { duration: duration * beatMs } : {}),
    });
  };

  // Helper for symmetric lane (mirrors around center)
  const sym = (offset_from_center: number): [number, number] => {
    return [mid - offset_from_center, mid + offset_from_center - (laneCount === 6 ? 1 : 0)];
  };

  // === Section 1: Intro - simple taps (beats 0-16) ===
  add(0, mid);
  add(2, mid);
  add(4, mid - 1);
  add(6, mid + 1);
  add(8, mid - 2);
  add(10, mid + 2);
  add(12, 0);
  add(14, maxLane);

  // === Section 2: Basic patterns (beats 16-32) ===
  add(16, mid - 1); add(17, mid + 1);
  add(18, mid - 2); add(19, mid + 2);
  add(20, mid - 1); add(21, mid + 1);
  add(22, mid);
  const [sL1, sR1] = sym(2);
  add(24, sL1); add(24, sR1);
  const [sL2, sR2] = sym(1);
  add(26, sL2); add(26, sR2);
  add(28, 0); add(28, maxLane);
  add(30, mid);
  add(31, mid);

  // === Section 3: Staircase (beats 32-48) ===
  for (let i = 0; i <= maxLane; i++) add(32 + i, i);
  for (let i = maxLane; i >= 0; i--) add(40 + (maxLane - i), i);

  // === Section 4: Hold notes (beats 48-64) ===
  add(48, mid, 'hold', 4);
  add(50, mid - 2); add(51, mid + 2);
  add(52, mid - 2); add(53, mid + 2);

  add(56, mid - 2, 'hold', 3);
  add(56, mid + 2, 'hold', 3);
  add(58, mid);
  add(60, mid);
  add(62, mid, 'hold', 2);

  // === Section 5: Flick notes (beats 64-80) ===
  add(64, mid, 'flick');
  add(66, mid - 1); add(66, mid + 1);
  add(68, mid - 2, 'flick'); add(68, mid + 2, 'flick');
  add(70, mid);
  add(72, 0, 'flick'); add(72, maxLane, 'flick');
  add(74, mid - 1); add(75, mid + 1);
  add(76, mid, 'flick');
  add(78, mid - 2); add(78, mid + 2);

  // === Section 6: Mixed patterns (beats 80-104) ===
  add(80, mid - 1); add(80.5, mid + 1);
  add(81, mid - 1); add(81.5, mid + 1);
  add(82, mid);
  add(83, mid - 2); add(83, mid + 2);
  add(84, mid - 1); add(84.5, mid + 1);
  add(85, mid - 1); add(85.5, mid + 1);
  add(86, mid, 'flick');
  add(88, 0); add(88, mid); add(88, maxLane);

  add(90, mid - 1); add(90.5, mid + 1); add(91, mid - 1); add(91.5, mid + 1);
  add(92, mid - 2); add(92.5, mid + 2); add(93, mid - 2); add(93.5, mid + 2);
  add(94, mid, 'hold', 2);

  // Cascading doubles
  add(96, 0); add(96, 1);
  add(97, mid - 1); add(97, mid);
  add(98, mid); add(98, mid + 1);
  add(99, maxLane - 1); add(99, maxLane);
  add(100, mid); add(100, mid + 1);
  add(101, 1); add(101, 2);
  add(102, 0); add(102, maxLane);

  // === Section 7: Climax (beats 104-128) ===
  add(104, mid);
  add(105, mid - 1); add(105, mid + 1);
  add(106, mid - 2); add(106, mid + 2);
  add(107, 0); add(107, maxLane);
  add(108, mid - 2); add(108, mid + 2);
  add(109, mid - 1); add(109, mid + 1);
  add(110, mid, 'flick');

  // Wide spread
  for (let i = 0; i <= maxLane; i += 2) add(112, i);
  for (let i = 1; i <= maxLane; i += 2) add(114, i);
  for (let i = 0; i <= maxLane; i += 2) add(116, i);
  add(118, mid, 'hold', 4);
  add(119, mid - 2, 'flick'); add(119, mid + 2, 'flick');
  add(120, 0); add(120, maxLane);

  // === Outro (beats 124-140) ===
  add(124, mid);
  add(126, mid - 1); add(126, mid + 1);
  add(128, mid - 2); add(128, mid); add(128, mid + 2);
  add(130, mid, 'hold', 4);
  // All lanes hit
  for (let i = 0; i < laneCount; i++) add(134, i);
  add(138, mid, 'flick');

  return {
    title: 'Digital Pulse',
    artist: 'RhythmStriker Demo',
    difficulty: 'NORMAL',
    bpm,
    audioFile: '',
    offset,
    notes,
  };
}

/**
 * Easy beatmap variant.
 */
export function createEasyDemoBeatmap(laneCount: 6 | 7 = 6): Beatmap {
  const bpm = 150;
  const beatMs = 60000 / bpm;
  const notes: Beatmap['notes'] = [];
  const offset = 2000;
  const mid = Math.floor(laneCount / 2);
  const maxLane = laneCount - 1;

  const add = (beat: number, lane: number, type: 'tap' | 'hold' | 'flick' = 'tap', duration = 0) => {
    notes.push({
      lane: Math.min(lane, maxLane),
      time: offset + beat * beatMs,
      type,
      ...(duration > 0 ? { duration: duration * beatMs } : {}),
    });
  };

  // Mostly center lane, slow
  for (let b = 0; b < 120; b += 4) {
    add(b, mid);
  }
  // Some variety
  const sideLanes = [mid - 2, mid - 1, mid + 1, mid + 2];
  for (let b = 2; b < 120; b += 8) {
    add(b, sideLanes[Math.floor(b / 8) % sideLanes.length]);
  }
  // A few holds
  add(32, mid, 'hold', 4);
  add(64, mid, 'hold', 4);
  add(96, mid, 'hold', 4);

  return {
    title: 'Digital Pulse',
    artist: 'RhythmStriker Demo',
    difficulty: 'EASY',
    bpm,
    audioFile: '',
    offset,
    notes,
  };
}
