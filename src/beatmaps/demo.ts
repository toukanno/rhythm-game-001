import type { Beatmap } from '../engine/types';

/**
 * Demo beatmap — procedurally generated, plays with the generated demo song.
 * 150 BPM = 400ms per beat
 */
export function createDemoBeatmap(): Beatmap {
  const bpm = 150;
  const beatMs = 60000 / bpm; // 400ms
  const notes: Beatmap['notes'] = [];

  const offset = 2000; // 2 second lead-in

  // Helper to add note
  const add = (beat: number, lane: number, type: 'tap' | 'hold' | 'flick' = 'tap', duration = 0) => {
    notes.push({
      lane,
      time: offset + beat * beatMs,
      type,
      ...(duration > 0 ? { duration: duration * beatMs } : {}),
    });
  };

  // === Section 1: Intro - simple taps (beats 0-16) ===
  // Single notes to warm up
  add(0, 3);
  add(2, 3);
  add(4, 2);
  add(6, 4);
  add(8, 1);
  add(10, 5);
  add(12, 0);
  add(14, 6);

  // === Section 2: Basic patterns (beats 16-32) ===
  // Alternating left-right
  add(16, 2); add(17, 4);
  add(18, 1); add(19, 5);
  add(20, 2); add(21, 4);
  add(22, 3);
  add(24, 1); add(24, 5);  // double
  add(26, 2); add(26, 4);  // double
  add(28, 0); add(28, 6);  // double wide
  add(30, 3);
  add(31, 3);

  // === Section 3: Staircase patterns (beats 32-48) ===
  // Ascending
  add(32, 0); add(33, 1); add(34, 2); add(35, 3);
  add(36, 4); add(37, 5); add(38, 6);
  // Descending
  add(40, 6); add(41, 5); add(42, 4); add(43, 3);
  add(44, 2); add(45, 1); add(46, 0);

  // === Section 4: Hold notes (beats 48-64) ===
  add(48, 3, 'hold', 4);  // center hold for 4 beats
  add(50, 1); add(51, 5);  // taps during hold
  add(52, 1); add(53, 5);

  add(56, 1, 'hold', 3);
  add(56, 5, 'hold', 3);
  add(58, 3);
  add(60, 3);

  add(62, 3, 'hold', 2);

  // === Section 5: Flick notes (beats 64-80) ===
  add(64, 3, 'flick');
  add(66, 2, 'tap'); add(66, 4, 'tap');
  add(68, 1, 'flick'); add(68, 5, 'flick');
  add(70, 3);
  add(72, 0, 'flick'); add(72, 6, 'flick');
  add(74, 2); add(75, 4);
  add(76, 3, 'flick');
  add(78, 1); add(78, 5);

  // === Section 6: Mixed patterns (beats 80-112) ===
  // Syncopated rhythms
  add(80, 2); add(80.5, 4);
  add(81, 2); add(81.5, 4);
  add(82, 3);
  add(83, 1); add(83, 5);
  add(84, 2); add(84.5, 4);
  add(85, 2); add(85.5, 4);
  add(86, 3, 'flick');
  add(88, 0); add(88, 3); add(88, 6); // triple

  // Fast alternating
  add(90, 2); add(90.5, 4); add(91, 2); add(91.5, 4);
  add(92, 1); add(92.5, 5); add(93, 1); add(93.5, 5);
  add(94, 3, 'hold', 2);

  // Cascading doubles
  add(96, 0); add(96, 1);
  add(97, 2); add(97, 3);
  add(98, 4); add(98, 5);
  add(99, 5); add(99, 6);
  add(100, 3); add(100, 4);
  add(101, 1); add(101, 2);
  add(102, 0); add(102, 6);

  // === Section 7: Climax (beats 104-128) ===
  add(104, 3, 'tap');
  add(105, 2); add(105, 4);
  add(106, 1); add(106, 5);
  add(107, 0); add(107, 6);
  add(108, 1); add(108, 5);
  add(109, 2); add(109, 4);
  add(110, 3, 'flick');

  add(112, 0); add(112, 2); add(112, 4); add(112, 6); // quad
  add(114, 1); add(114, 3); add(114, 5);
  add(116, 0); add(116, 2); add(116, 4); add(116, 6);
  add(118, 3, 'hold', 4);
  add(119, 1, 'flick'); add(119, 5, 'flick');
  add(120, 0); add(120, 6);

  // === Outro (beats 124-140) ===
  add(124, 3);
  add(126, 2); add(126, 4);
  add(128, 1); add(128, 3); add(128, 5);
  add(130, 3, 'hold', 4);
  add(134, 0); add(134, 1); add(134, 2); add(134, 3); add(134, 4); add(134, 5); add(134, 6);
  add(138, 3, 'flick');

  return {
    title: 'Digital Pulse',
    artist: 'RhythmStriker Demo',
    difficulty: 'NORMAL',
    bpm,
    audioFile: '',  // uses generated audio
    offset,
    notes,
  };
}

/**
 * Also create an easy beatmap as an alternative.
 */
export function createEasyDemoBeatmap(): Beatmap {
  const bpm = 150;
  const beatMs = 60000 / bpm;
  const notes: Beatmap['notes'] = [];
  const offset = 2000;

  const add = (beat: number, lane: number, type: 'tap' | 'hold' | 'flick' = 'tap', duration = 0) => {
    notes.push({
      lane,
      time: offset + beat * beatMs,
      type,
      ...(duration > 0 ? { duration: duration * beatMs } : {}),
    });
  };

  // Very simple pattern — mostly center lane, slow
  for (let b = 0; b < 120; b += 4) {
    add(b, 3);
  }
  // Add some variety
  for (let b = 2; b < 120; b += 8) {
    add(b, [1, 2, 4, 5][Math.floor(b / 8) % 4]);
  }
  // A few holds
  add(32, 3, 'hold', 4);
  add(64, 3, 'hold', 4);
  add(96, 3, 'hold', 4);

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
