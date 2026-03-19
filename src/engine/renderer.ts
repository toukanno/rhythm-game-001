import {
  LANE_COLORS, JUDGMENT_COLORS,
  type ActiveNote, type HitEffect, type Judgment,
} from './types';
import { keyConfig } from './keyConfig';

/**
 * Handles all canvas rendering for the gameplay screen.
 */
export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private _width = 0;
  private _height = 0;

  private get laneCount() { return keyConfig.laneCount; }

  // Layout constants (recalculated on resize)
  laneWidth = 0;
  playAreaLeft = 0;
  playAreaWidth = 0;
  hitLineY = 0;
  noteHeight = 24;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
  }

  get width() { return this._width; }
  get height() { return this._height; }

  resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this._width = rect.width;
    this._height = rect.height;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Calculate layout
    const maxPlayWidth = Math.min(this._width * 0.85, 560);
    this.laneWidth = maxPlayWidth / this.laneCount;
    this.playAreaWidth = this.laneWidth * this.laneCount;
    this.playAreaLeft = (this._width - this.playAreaWidth) / 2;
    this.hitLineY = this._height - 120;
    this.noteHeight = Math.max(16, this.laneWidth * 0.35);
  }

  getLaneX(lane: number): number {
    return this.playAreaLeft + lane * this.laneWidth;
  }

  getLaneCenterX(lane: number): number {
    return this.getLaneX(lane) + this.laneWidth / 2;
  }

  clear(): void {
    // Dark gradient background
    const grad = this.ctx.createLinearGradient(0, 0, 0, this._height);
    grad.addColorStop(0, '#0a0a1a');
    grad.addColorStop(1, '#1a1a3e');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this._width, this._height);
  }

  drawLanes(pressedLanes: Set<number>, keyLabels?: string[]): void {
    const ctx = this.ctx;

    // Lane separators
    for (let i = 0; i <= this.laneCount; i++) {
      const x = this.getLaneX(i);
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.hitLineY + 60);
      ctx.stroke();
    }

    // Hit line
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.playAreaLeft, this.hitLineY);
    ctx.lineTo(this.playAreaLeft + this.playAreaWidth, this.hitLineY);
    ctx.stroke();

    // Tap zones
    for (let i = 0; i < this.laneCount; i++) {
      const x = this.getLaneX(i);
      const pressed = pressedLanes.has(i);

      // Glow when pressed
      if (pressed) {
        const grad = ctx.createRadialGradient(
          x + this.laneWidth / 2, this.hitLineY, 0,
          x + this.laneWidth / 2, this.hitLineY, this.laneWidth
        );
        grad.addColorStop(0, LANE_COLORS[i] + '60');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(x, this.hitLineY - this.laneWidth, this.laneWidth, this.laneWidth * 2);
      }

      // Tap circle
      ctx.beginPath();
      ctx.arc(x + this.laneWidth / 2, this.hitLineY, this.laneWidth * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = pressed ? LANE_COLORS[i] + 'cc' : LANE_COLORS[i] + '44';
      ctx.fill();
      ctx.strokeStyle = LANE_COLORS[i];
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Key labels at bottom
    const keys = keyLabels ?? ['A', 'S', 'D', 'F', 'J', 'K', 'L'];
    ctx.font = `${Math.max(11, this.laneWidth * 0.22)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < this.laneCount; i++) {
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillText(keys[i], this.getLaneCenterX(i), this.hitLineY + 40);
    }
  }

  drawNote(an: ActiveNote): void {
    const ctx = this.ctx;
    const { note, y } = an;
    if (y === undefined || an.judged) return;

    const cx = this.getLaneCenterX(note.lane);
    const lx = this.getLaneX(note.lane);
    const w = this.laneWidth - 6;
    const h = this.noteHeight;
    const color = LANE_COLORS[note.lane];

    if (note.type === 'hold' && note.duration) {
      // Draw hold body first
      const holdEndY = y - (note.duration / 1000) * 800 * (this.hitLineY / (this.hitLineY));
      // Simplified: we get hold end from the game engine
      const bodyTop = Math.max(0, an.holdActive ? this.hitLineY : (y as number) - (note.duration / 1000) * 400);

      ctx.fillStyle = color + '44';
      ctx.fillRect(lx + 3, bodyTop, w, (y as number) - bodyTop);

      // Hold trail glow
      ctx.strokeStyle = color + '88';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, bodyTop);
      ctx.lineTo(cx, y as number);
      ctx.stroke();
    }

    if (note.type === 'tap' || note.type === 'hold') {
      // Rounded rect note
      const nx = lx + 3;
      const ny = (y as number) - h / 2;
      const r = h / 3;

      ctx.beginPath();
      ctx.roundRect(nx, ny, w, h, r);

      // Gradient fill
      const grad = ctx.createLinearGradient(nx, ny, nx, ny + h);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color + '88');
      ctx.fillStyle = grad;
      ctx.fill();

      // Border
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner shine
      ctx.beginPath();
      ctx.roundRect(nx + 2, ny + 2, w - 4, h / 2 - 2, r - 1);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fill();
    }

    if (note.type === 'flick') {
      // Diamond shape for flick notes
      ctx.beginPath();
      ctx.moveTo(cx, (y as number) - h * 0.7);
      ctx.lineTo(cx + w / 2, y as number);
      ctx.lineTo(cx, (y as number) + h * 0.7);
      ctx.lineTo(cx - w / 2, y as number);
      ctx.closePath();

      const grad = ctx.createLinearGradient(cx - w / 2, (y as number) - h, cx + w / 2, (y as number) + h);
      grad.addColorStop(0, '#ff6bff');
      grad.addColorStop(1, color);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Arrow indicator
      ctx.beginPath();
      ctx.moveTo(cx - 6, (y as number) - 2);
      ctx.lineTo(cx, (y as number) - 8);
      ctx.lineTo(cx + 6, (y as number) - 2);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  drawHitEffect(effect: HitEffect, now: number): boolean {
    const ctx = this.ctx;
    const elapsed = now - effect.time;
    if (elapsed > 500) return false; // expired

    const progress = elapsed / 500;
    const alpha = 1 - progress;
    const scale = 1 + progress * 2;

    const cx = this.getLaneCenterX(effect.lane);
    const cy = this.hitLineY;

    // Ring expand
    ctx.beginPath();
    ctx.arc(cx, cy, this.laneWidth * 0.4 * scale, 0, Math.PI * 2);
    ctx.strokeStyle = JUDGMENT_COLORS[effect.judgment] + Math.round(alpha * 255).toString(16).padStart(2, '0');
    ctx.lineWidth = 3 * (1 - progress);
    ctx.stroke();

    // Particles
    if (effect.judgment === 'perfect' || effect.judgment === 'great') {
      for (let p = 0; p < 6; p++) {
        const angle = (p / 6) * Math.PI * 2 + elapsed * 0.003;
        const dist = 20 * scale;
        const px = cx + Math.cos(angle) * dist;
        const py = cy + Math.sin(angle) * dist;
        ctx.beginPath();
        ctx.arc(px, py, 2 * (1 - progress), 0, Math.PI * 2);
        ctx.fillStyle = JUDGMENT_COLORS[effect.judgment] + Math.round(alpha * 200).toString(16).padStart(2, '0');
        ctx.fill();
      }
    }

    // Judgment text
    ctx.font = `bold ${14 + 4 * (1 - progress)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = JUDGMENT_COLORS[effect.judgment] + Math.round(alpha * 255).toString(16).padStart(2, '0');
    ctx.fillText(effect.judgment.toUpperCase(), cx, cy - 40 - progress * 20);

    return true; // still alive
  }

  drawComboAndScore(combo: number, score: number): void {
    const ctx = this.ctx;

    // Combo
    if (combo >= 2) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.font = `bold ${Math.min(48, 28 + combo * 0.3)}px sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${combo}`, this._width / 2, this.hitLineY - 100);

      ctx.font = `${14}px sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fillText('COMBO', this._width / 2, this.hitLineY - 75);
    }

    // Score (top right)
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(score.toLocaleString(), this._width - 20, 20);

    ctx.font = '11px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('SCORE', this._width - 20, 44);
  }

  drawProgress(currentTime: number, totalTime: number): void {
    const ctx = this.ctx;
    const progress = Math.min(1, currentTime / totalTime);

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(0, 0, this._width, 4);
    ctx.fillStyle = '#ff6b9d';
    ctx.fillRect(0, 0, this._width * progress, 4);
  }

  drawPause(): void {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, this._width, this._height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('PAUSED', this._width / 2, this._height / 2 - 30);

    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText('Press ESC or tap to resume', this._width / 2, this._height / 2 + 20);
  }
}
