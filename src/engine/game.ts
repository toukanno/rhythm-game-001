import {
  type Beatmap, type ActiveNote, type HitEffect, type GameState, type Judgment,
  TIMING, SCORE_MAP,
} from './types';
import { Renderer } from './renderer';
import { AudioManager } from './audio';
import { InputManager } from './input';
import { keyConfig } from './keyConfig';

export class Game {
  private renderer: Renderer;
  private audio: AudioManager;
  private input: InputManager;
  private beatmap: Beatmap | null = null;
  private state: GameState;
  private rafId = 0;
  private onFinish: ((state: GameState) => void) | null = null;
  private onQuit: (() => void) | null = null;
  private songDuration = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.audio = new AudioManager();
    this.input = new InputManager();
    this.state = this.freshState();

    const ro = new ResizeObserver(() => this.renderer.resize());
    ro.observe(canvas);
  }

  private freshState(): GameState {
    return {
      score: 0,
      combo: 0,
      maxCombo: 0,
      judgments: { marvelous: 0, perfect: 0, great: 0, good: 0, bad: 0, safe: 0, late: 0 },
      activeNotes: [],
      hitEffects: [],
      startTime: 0,
      currentTime: 0,
      playing: false,
      paused: false,
      finished: false,
    };
  }

  getAudio(): AudioManager { return this.audio; }

  async loadBeatmap(beatmap: Beatmap, audioBuffer?: AudioBuffer): Promise<void> {
    this.beatmap = beatmap;
    this.state = this.freshState();

    if (audioBuffer) {
      await this.audio.loadBuffer(audioBuffer);
    } else {
      await this.audio.loadFromUrl(beatmap.audioFile);
    }

    this.state.activeNotes = beatmap.notes
      .sort((a, b) => a.time - b.time)
      .map(note => ({ note, hit: false, judged: false }));

    const lastNote = beatmap.notes[beatmap.notes.length - 1];
    this.songDuration = lastNote ? lastNote.time + (lastNote.duration || 0) + 3000 : 30000;
  }

  start(onFinish: (state: GameState) => void, onQuit?: () => void): void {
    this.onFinish = onFinish;
    this.onQuit = onQuit || null;
    this.state.playing = true;
    this.state.paused = false;
    this.state.finished = false;

    this.input.bind(
      this.renderer['canvas'],
      (x: number) => {
        const lane = Math.floor((x - this.renderer.playAreaLeft) / this.renderer.laneWidth);
        return Math.max(0, Math.min(keyConfig.laneCount - 1, lane));
      },
      (lane, pressed) => this.onInput(lane, pressed),
    );

    setTimeout(() => {
      this.audio.play(0);
      this.state.startTime = performance.now();
      this.loop();
    }, 500);
  }

  stop(): void {
    this.audio.stop();
    this.input.unbind();
    cancelAnimationFrame(this.rafId);
    this.state.playing = false;
  }

  quit(): void {
    this.stop();
    this.onQuit?.();
  }

  togglePause(): void {
    if (this.state.finished) return;
    if (this.state.paused) {
      this.state.paused = false;
      this.audio.resume();
      this.loop();
    } else {
      this.state.paused = true;
      this.audio.pause();
      cancelAnimationFrame(this.rafId);
      this.renderer.drawPause();
    }
  }

  private onInput(lane: number, pressed: boolean): void {
    if (!this.state.playing || this.state.paused) return;
    if (pressed) {
      this.tryHitNote(lane);
    } else {
      this.tryReleaseHold(lane);
    }
  }

  private tryHitNote(lane: number): void {
    const now = this.audio.currentTime + keyConfig.timingOffset;
    let bestNote: ActiveNote | null = null;
    let bestDiff = Infinity;

    // Find closest unjudged note in this lane within any reachable window
    for (const an of this.state.activeNotes) {
      if (an.judged || an.note.lane !== lane) continue;
      const diff = Math.abs(now - an.note.time);
      // Accept anything within 500ms (the "late" window is unlimited but
      // we limit search to avoid matching very far-future notes)
      if (diff < bestDiff && diff <= 500) {
        bestDiff = diff;
        bestNote = an;
      }
    }

    if (bestNote) {
      const judgment = this.getJudgment(bestDiff);
      bestNote.judged = true;
      bestNote.hit = true;
      bestNote.judgment = judgment;

      if (bestNote.note.type === 'hold' && bestNote.note.duration) {
        bestNote.holdActive = true;
        bestNote.judged = false;
        bestNote.holdEndJudged = false;
      }

      this.applyJudgment(judgment, lane);
    }
  }

  private tryReleaseHold(lane: number): void {
    const now = this.audio.currentTime + keyConfig.timingOffset;

    for (const an of this.state.activeNotes) {
      if (an.note.lane !== lane || !an.holdActive || an.holdEndJudged) continue;

      const endTime = an.note.time + (an.note.duration || 0);
      const diff = Math.abs(now - endTime);
      const judgment = this.getJudgment(diff);

      an.holdActive = false;
      an.holdEndJudged = true;
      an.judged = true;

      this.applyJudgment(judgment, lane);
    }
  }

  private getJudgment(diff: number): Judgment {
    if (diff <= TIMING.marvelous) return 'marvelous';
    if (diff <= TIMING.perfect) return 'perfect';
    if (diff <= TIMING.great) return 'great';
    if (diff <= TIMING.good) return 'good';
    if (diff <= TIMING.bad) return 'bad';
    if (diff <= TIMING.safe) return 'safe';
    return 'late';
  }

  private applyJudgment(judgment: Judgment, lane: number): void {
    this.state.judgments[judgment]++;
    this.state.score += SCORE_MAP[judgment];

    // Combo breaks only on 'late'
    if (judgment === 'late') {
      this.state.combo = 0;
    } else {
      this.state.combo++;
      if (this.state.combo > this.state.maxCombo) {
        this.state.maxCombo = this.state.combo;
      }
      this.state.score += Math.floor(this.state.combo * 10);
    }

    // Screen flash on marvelous
    if (judgment === 'marvelous') {
      this.renderer.triggerScreenFlash();
    }

    this.state.hitEffects.push({
      lane,
      judgment,
      time: performance.now(),
      y: this.renderer.hitLineY,
    });
  }

  private loop = (): void => {
    if (this.state.paused || this.state.finished) return;

    const now = this.audio.currentTime;
    this.state.currentTime = now;

    this.update(now);
    this.render();

    // Check if song is done
    if (now > this.songDuration || (!this.audio.playing && now > 2000)) {
      let allDone = true;
      for (const an of this.state.activeNotes) {
        if (!an.judged) {
          if (now - an.note.time > 500) {
            // Auto-judge as 'late' (no MISS)
            an.judged = true;
            an.judgment = 'late';
            this.state.judgments.late++;
            this.state.combo = 0;
          } else {
            allDone = false;
          }
        }
      }
      if (allDone && now > this.songDuration - 1000) {
        this.finish();
        return;
      }
    }

    this.rafId = requestAnimationFrame(this.loop);
  };

  private update(now: number): void {
    const hitLineY = this.renderer.hitLineY;

    for (const an of this.state.activeNotes) {
      if (an.judged && !an.holdActive) continue;

      const timeDiff = an.note.time - now;
      const pxPerMs = hitLineY / 1500;
      an.y = hitLineY - timeDiff * pxPerMs;

      // Auto-judge notes that passed far beyond the hit line as 'late' (no MISS)
      if (!an.judged && !an.hit && timeDiff < -300) {
        an.judged = true;
        an.judgment = 'late';
        this.state.judgments.late++;
        this.state.combo = 0;

        this.state.hitEffects.push({
          lane: an.note.lane,
          judgment: 'late',
          time: performance.now(),
          y: hitLineY,
        });
      }

      // Hold notes that weren't released
      if (an.holdActive && an.note.duration) {
        const endTime = an.note.time + an.note.duration;
        if (now > endTime + 300) {
          an.holdActive = false;
          an.holdEndJudged = true;
          an.judged = true;
          an.judgment = 'late';
          this.state.judgments.late++;
          this.state.combo = 0;
        }
      }
    }
  }

  private render(): void {
    const r = this.renderer;
    r.clear();
    r.drawLanes(this.input.pressedLanes, keyConfig.labels);

    for (const an of this.state.activeNotes) {
      if (an.y === undefined) continue;
      if (an.y < -50 || an.y > r.height + 50) continue;
      if (an.judged && !an.holdActive) continue;
      r.drawNote(an);
    }

    const now = performance.now();
    this.state.hitEffects = this.state.hitEffects.filter(e => r.drawHitEffect(e, now));

    r.drawComboAndScore(this.state.combo, this.state.score);
    r.drawProgress(this.state.currentTime, this.songDuration);
  }

  private finish(): void {
    this.state.finished = true;
    this.state.playing = false;
    this.audio.stop();
    this.input.unbind();
    cancelAnimationFrame(this.rafId);
    this.onFinish?.(this.state);
  }

  getState(): GameState {
    return this.state;
  }
}
