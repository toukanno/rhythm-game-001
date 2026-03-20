import {
  LANE_COLORS, JUDGMENT_COLORS, JUDGMENT_LABELS,
  type ActiveNote, type HitEffect, type Judgment,
} from './types';
import { keyConfig } from './keyConfig';

/**
 * Handles all canvas rendering for the gameplay screen.
 * Enhanced with neon arcade visuals and particle effects.
 */
export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private _width = 0;
  private _height = 0;
  private screenFlashAlpha = 0;

  private get laneCount() { return keyConfig.laneCount; }

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

  triggerScreenFlash(): void {
    this.screenFlashAlpha = 0.15;
  }

  clear(): void {
    const ctx = this.ctx;
    // Deep dark background
    const grad = ctx.createLinearGradient(0, 0, 0, this._height);
    grad.addColorStop(0, '#050510');
    grad.addColorStop(0.5, '#0a0a20');
    grad.addColorStop(1, '#0f0f2a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this._width, this._height);

    // Screen flash overlay
    if (this.screenFlashAlpha > 0) {
      ctx.fillStyle = `rgba(255,215,0,${this.screenFlashAlpha})`;
      ctx.fillRect(0, 0, this._width, this._height);
      this.screenFlashAlpha *= 0.85;
      if (this.screenFlashAlpha < 0.005) this.screenFlashAlpha = 0;
    }
  }

  drawLanes(pressedLanes: Set<number>, keyLabels?: string[]): void {
    const ctx = this.ctx;

    // Subtle lane background glow
    for (let i = 0; i < this.laneCount; i++) {
      const x = this.getLaneX(i);
      const color = LANE_COLORS[i];
      ctx.fillStyle = color + '06';
      ctx.fillRect(x, 0, this.laneWidth, this.hitLineY + 60);
    }

    // Lane separators (subtle neon lines)
    for (let i = 0; i <= this.laneCount; i++) {
      const x = this.getLaneX(i);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.hitLineY + 60);
      ctx.stroke();
    }

    // Hit line (neon glow)
    ctx.shadowColor = '#ff2d78';
    ctx.shadowBlur = 8;
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.playAreaLeft, this.hitLineY);
    ctx.lineTo(this.playAreaLeft + this.playAreaWidth, this.hitLineY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Tap zones
    for (let i = 0; i < this.laneCount; i++) {
      const x = this.getLaneX(i);
      const pressed = pressedLanes.has(i);
      const color = LANE_COLORS[i];

      if (pressed) {
        // Bright glow when pressed
        const grad = ctx.createRadialGradient(
          x + this.laneWidth / 2, this.hitLineY, 0,
          x + this.laneWidth / 2, this.hitLineY, this.laneWidth * 1.2
        );
        grad.addColorStop(0, color + '55');
        grad.addColorStop(0.5, color + '22');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(x - 10, this.hitLineY - this.laneWidth * 1.2, this.laneWidth + 20, this.laneWidth * 2.4);
      }

      // Tap circle with neon border
      ctx.beginPath();
      ctx.arc(x + this.laneWidth / 2, this.hitLineY, this.laneWidth * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = pressed ? color + 'cc' : color + '22';
      ctx.fill();
      ctx.shadowColor = color;
      ctx.shadowBlur = pressed ? 12 : 4;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Key labels
    const keys = keyLabels ?? ['S', 'D', 'F', 'J', 'K', 'L'];
    ctx.font = `${Math.max(11, this.laneWidth * 0.22)}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < this.laneCount; i++) {
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
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
      const bodyTop = Math.max(0, an.holdActive ? this.hitLineY : (y as number) - (note.duration / 1000) * 400);
      ctx.fillStyle = color + '33';
      ctx.fillRect(lx + 3, bodyTop, w, (y as number) - bodyTop);
      ctx.strokeStyle = color + '66';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, bodyTop);
      ctx.lineTo(cx, y as number);
      ctx.stroke();
    }

    if (note.type === 'tap' || note.type === 'hold') {
      const nx = lx + 3;
      const ny = (y as number) - h / 2;
      const r = h / 3;
      ctx.beginPath();
      ctx.roundRect(nx, ny, w, h, r);
      const grad = ctx.createLinearGradient(nx, ny, nx, ny + h);
      grad.addColorStop(0, color);
      grad.addColorStop(1, color + '88');
      ctx.fillStyle = grad;
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#fff8';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Inner shine
      ctx.beginPath();
      ctx.roundRect(nx + 2, ny + 2, w - 4, h / 2 - 2, r - 1);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fill();
    }

    if (note.type === 'flick') {
      ctx.beginPath();
      ctx.moveTo(cx, (y as number) - h * 0.7);
      ctx.lineTo(cx + w / 2, y as number);
      ctx.lineTo(cx, (y as number) + h * 0.7);
      ctx.lineTo(cx - w / 2, y as number);
      ctx.closePath();
      const grad = ctx.createLinearGradient(cx - w / 2, (y as number) - h, cx + w / 2, (y as number) + h);
      grad.addColorStop(0, '#ff2dff');
      grad.addColorStop(1, color);
      ctx.fillStyle = grad;
      ctx.shadowColor = '#ff2dff';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#fff8';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Arrow
      ctx.beginPath();
      ctx.moveTo(cx - 6, (y as number) - 2);
      ctx.lineTo(cx, (y as number) - 8);
      ctx.lineTo(cx + 6, (y as number) - 2);
      ctx.strokeStyle = '#fffa';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  drawHitEffect(effect: HitEffect, now: number): boolean {
    const ctx = this.ctx;
    const elapsed = now - effect.time;
    if (elapsed > 600) return false;

    const progress = elapsed / 600;
    const alpha = 1 - progress;
    const scale = 1 + progress * 2.5;
    const cx = this.getLaneCenterX(effect.lane);
    const cy = this.hitLineY;
    const color = JUDGMENT_COLORS[effect.judgment];

    // Ring expand with glow
    ctx.beginPath();
    ctx.arc(cx, cy, this.laneWidth * 0.4 * scale, 0, Math.PI * 2);
    ctx.shadowColor = color;
    ctx.shadowBlur = 10 * alpha;
    const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
    ctx.strokeStyle = color + a;
    ctx.lineWidth = 3 * (1 - progress);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Particle burst for Perfect/Great
    if (effect.judgment === 'perfect' || effect.judgment === 'great') {
      const particleCount = effect.judgment === 'perfect' ? 12 : 8;
      for (let p = 0; p < particleCount; p++) {
        const angle = (p / particleCount) * Math.PI * 2 + elapsed * 0.004;
        const dist = (15 + 35 * progress) * scale * 0.6;
        const px = cx + Math.cos(angle) * dist;
        const py = cy + Math.sin(angle) * dist;
        const size = (3 - progress * 2.5) * (effect.judgment === 'perfect' ? 1.2 : 1);
        if (size > 0) {
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          const pa = Math.round(alpha * 220).toString(16).padStart(2, '0');
          ctx.fillStyle = color + pa;
          ctx.fill();
        }
      }
    }

    // Judgment text with scale animation
    const textScale = effect.judgment === 'perfect' ? 1.3 : 1.1;
    const fontSize = (16 + 6 * (1 - progress)) * (progress < 0.1 ? 0.8 + progress * 2 : textScale);
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = color;
    ctx.shadowBlur = 8 * alpha;
    ctx.fillStyle = color + Math.round(alpha * 255).toString(16).padStart(2, '0');
    ctx.fillText(JUDGMENT_LABELS[effect.judgment], cx, cy - 45 - progress * 25);
    ctx.shadowBlur = 0;

    return true;
  }

  drawComboAndScore(combo: number, score: number): void {
    const ctx = this.ctx;

    if (combo >= 2) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Combo color based on milestone
      let comboColor = '#ffffff';
      let glowColor = '#ffffff';
      if (combo >= 500) { comboColor = '#ffd700'; glowColor = '#ffd700'; }
      else if (combo >= 200) { comboColor = '#ff2dff'; glowColor = '#ff2dff'; }
      else if (combo >= 100) { comboColor = '#ff2d78'; glowColor = '#ff2d78'; }
      else if (combo >= 50) { comboColor = '#00e676'; glowColor = '#00e676'; }

      const comboSize = Math.min(56, 32 + combo * 0.08);
      ctx.font = `bold ${comboSize}px sans-serif`;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 12;
      ctx.fillStyle = comboColor;
      ctx.fillText(`${combo}`, this._width / 2, this.hitLineY - 110);
      ctx.shadowBlur = 0;

      ctx.font = `bold 12px sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText('コンボ', this._width / 2, this.hitLineY - 82);
    }

    // Score (top right)
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(score.toLocaleString(), this._width - 20, 16);

    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('スコア', this._width - 20, 42);
  }

  drawProgress(currentTime: number, totalTime: number): void {
    const ctx = this.ctx;
    const progress = Math.min(1, currentTime / totalTime);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(0, 0, this._width, 3);
    const grad = ctx.createLinearGradient(0, 0, this._width * progress, 0);
    grad.addColorStop(0, '#ff2d78');
    grad.addColorStop(1, '#d500f9');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this._width * progress, 3);
  }

  drawPause(): void {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, this._width, this._height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 40px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('一時停止', this._width / 2, this._height / 2 - 30);

    ctx.font = '15px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('ESCキーまたはタップで再開', this._width / 2, this._height / 2 + 25);
  }
}
