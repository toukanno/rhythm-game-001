import {
  type Beatmap, type ActiveNote, type HitEffect, type GameState, type Judgment,
  TIMING, SCORE_MAP, SCROLL_SPEED, LANE_COUNT,
} from './types';
import { Renderer } from './renderer';
import { AudioManager } from './audio';
import { InputManager } from './input';

export class Game {
  private renderer: Renderer;
  private audio: AudioManager;
  private input: InputManager;
  private beatmap: Beatmap | null = null;
  private state: GameState;
  private rafId = 0;
  private onFinish: ((state: GameState) => void) | null = null;
  private songDuration = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.audio = new AudioManager();
    this.input = new InputManager();
    this.state = this.freshState();

    // Resize handling
    const ro = new ResizeObserver(() => this.renderer.resize());
    ro.observe(canvas);
  }

  private freshState(): GameState {
    return {
      score: 0,
      combo: 0,
      maxCombo: 0,
      judgments: { perfect: 0, great: 0, good: 0, bad: 0, miss: 0 },
      activeNotes: [],
      hitEffects: [],
      startTime: 0,
      currentTime: 0,
      playing: false,
      paused: false,
      finished: false,
    };
  }

  getAudio(): AudioManager {
    return this.audio;
  }

  async loadBeatmap(beatmap: Beatmap, audioBuffer?: AudioBuffer): Promise<void> {
    this.beatmap = beatmap;
    this.state = this.freshState();

    if (audioBuffer) {
      await this.audio.loadBuffer(audioBuffer);
    } else {
      await this.audio.loadFromUrl(beatmap.audioFile);
    }

    // Prepare active notes sorted by time
    this.state.activeNotes = beatmap.notes
      .sort((a, b) => a.time - b.time)
      .map(note => ({
        note,
        hit: false,
        judged: false,
      }));

    // Estimate song duration from last note + 3s
    const lastNote = beatmap.notes[beatmap.notes.length - 1];
    this.songDuration = lastNote ? lastNote.time + (lastNote.duration || 0) + 3000 : 30000;
  }

  start(onFinish: (state: GameState) => void): void {
    this.onFinish = onFinish;
    this.state.playing = true;
    this.state.paused = false;
    this.state.finished = false;

    // Bind input
    this.input.bind(
      this.renderer['canvas'],
      (x: number) => {
        const lane = Math.floor((x - this.renderer.playAreaLeft) / this.renderer.laneWidth);
        return Math.max(0, Math.min(LANE_COUNT - 1, lane));
      },
      (lane, pressed) => this.onInput(lane, pressed),
    );

    // Start audio with a small delay so canvas shows first frame
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
      // Release — check for hold note end
      this.tryReleaseHold(lane);
    }
  }

  private tryHitNote(lane: number): void {
    const now = this.audio.currentTime;
    let bestNote: ActiveNote | null = null;
    let bestDiff = Infinity;

    for (const an of this.state.activeNotes) {
      if (an.judged || an.note.lane !== lane) continue;
      const diff = Math.abs(now - an.note.time);
      if (diff < bestDiff && diff <= TIMING.bad) {
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
        bestNote.judged = false; // will be fully judged on release
        bestNote.holdEndJudged = false;
      }

      this.applyJudgment(judgment, lane);
    }
  }

  private tryReleaseHold(lane: number): void {
    const now = this.audio.currentTime;

    for (const an of this.state.activeNotes) {
      if (an.note.lane !== lane || !an.holdActive || an.holdEndJudged) continue;

      const endTime = an.note.time + (an.note.duration || 0);
      const diff = Math.abs(now - endTime);
      const judgment = diff <= TIMING.bad ? this.getJudgment(diff) : 'miss' as Judgment;

      an.holdActive = false;
      an.holdEndJudged = true;
      an.judged = true;

      this.applyJudgment(judgment, lane);
    }
  }

  private getJudgment(diff: number): Judgment {
    if (diff <= TIMING.perfect) return 'perfect';
    if (diff <= TIMING.great) return 'great';
    if (diff <= TIMING.good) return 'good';
    return 'bad';
  }

  private applyJudgment(judgment: Judgment, lane: number): void {
    this.state.judgments[judgment]++;
    this.state.score += SCORE_MAP[judgment];

    if (judgment === 'miss' || judgment === 'bad') {
      this.state.combo = 0;
    } else {
      this.state.combo++;
      if (this.state.combo > this.state.maxCombo) {
        this.state.maxCombo = this.state.combo;
      }
      // Combo bonus
      this.state.score += Math.floor(this.state.combo * 10);
    }

    // Create hit effect
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
      // Make sure all remaining notes get judged
      let allDone = true;
      for (const an of this.state.activeNotes) {
        if (!an.judged) {
          if (now - an.note.time > TIMING.bad + 100) {
            an.judged = true;
            an.judgment = 'miss';
            this.state.judgments.miss++;
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

      // Calculate Y position based on timing
      const timeDiff = an.note.time - now;
      const pxPerMs = hitLineY / (1500); // note travels hitLineY pixels in 1500ms
      an.y = hitLineY - timeDiff * pxPerMs;

      // Check for miss (note passed hit line without being hit)
      if (!an.judged && !an.hit && timeDiff < -(TIMING.bad)) {
        an.judged = true;
        an.judgment = 'miss';
        this.state.judgments.miss++;
        this.state.combo = 0;

        // Create miss effect
        this.state.hitEffects.push({
          lane: an.note.lane,
          judgment: 'miss',
          time: performance.now(),
          y: hitLineY,
        });
      }

      // Check hold notes that weren't released
      if (an.holdActive && an.note.duration) {
        const endTime = an.note.time + an.note.duration;
        if (now > endTime + TIMING.bad) {
          an.holdActive = false;
          an.holdEndJudged = true;
          an.judged = true;
          an.judgment = 'miss';
          this.state.judgments.miss++;
          this.state.combo = 0;
        }
      }
    }
  }

  private render(): void {
    const r = this.renderer;
    r.clear();
    r.drawLanes(this.input.pressedLanes);

    // Draw notes (only visible ones)
    for (const an of this.state.activeNotes) {
      if (an.y === undefined) continue;
      if (an.y < -50 || an.y > r.height + 50) continue;
      if (an.judged && !an.holdActive) continue;
      r.drawNote(an);
    }

    // Draw hit effects
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
