import {
  LANE_COLORS, JUDGMENT_COLORS, JUDGMENT_LABELS,
  type ActiveNote, type HitEffect, type Judgment,
} from './types';
import { keyConfig } from './keyConfig';

/**
 * ガルパ風 renderer — circular notes, rainbow lanes, pink/purple theme.
 */
export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private _width = 0;
  private _height = 0;
  private screenFlashAlpha = 0;
  private frameCount = 0;

  private get laneCount() { return keyConfig.laneCount; }

  laneWidth = 0;
  playAreaLeft = 0;
  playAreaWidth = 0;
  hitLineY = 0;
  noteRadius = 12;

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
    this.hitLineY = this._height - 110;
    this.noteRadius = Math.max(10, this.laneWidth * 0.32);
  }

  getLaneX(lane: number): number {
    return this.playAreaLeft + lane * this.laneWidth;
  }

  getLaneCenterX(lane: number): number {
    return this.getLaneX(lane) + this.laneWidth / 2;
  }

  triggerScreenFlash(): void {
    this.screenFlashAlpha = 0.12;
  }

  clear(): void {
    this.frameCount++;
    const ctx = this.ctx;

    // ガルパ-style pink/purple gradient background
    const grad = ctx.createLinearGradient(0, 0, 0, this._height);
    grad.addColorStop(0, '#1a0a2e');
    grad.addColorStop(0.4, '#150825');
    grad.addColorStop(1, '#0d0520');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this._width, this._height);

    // Side decorations (pink/purple gradient pillars)
    const sideW = this.playAreaLeft - 10;
    if (sideW > 20) {
      const leftGrad = ctx.createLinearGradient(0, 0, sideW, 0);
      leftGrad.addColorStop(0, 'rgba(139,92,246,0.06)');
      leftGrad.addColorStop(1, 'rgba(255,105,180,0.03)');
      ctx.fillStyle = leftGrad;
      ctx.fillRect(0, 0, sideW, this._height);

      const rightX = this.playAreaLeft + this.playAreaWidth + 10;
      const rightGrad = ctx.createLinearGradient(rightX, 0, this._width, 0);
      rightGrad.addColorStop(0, 'rgba(255,105,180,0.03)');
      rightGrad.addColorStop(1, 'rgba(139,92,246,0.06)');
      ctx.fillStyle = rightGrad;
      ctx.fillRect(rightX, 0, this._width - rightX, this._height);
    }

    // Screen flash
    if (this.screenFlashAlpha > 0) {
      ctx.fillStyle = `rgba(255,215,0,${this.screenFlashAlpha})`;
      ctx.fillRect(0, 0, this._width, this._height);
      this.screenFlashAlpha *= 0.82;
      if (this.screenFlashAlpha < 0.004) this.screenFlashAlpha = 0;
    }
  }

  drawLanes(pressedLanes: Set<number>, keyLabels?: string[]): void {
    const ctx = this.ctx;

    // Subtle lane fill
    for (let i = 0; i < this.laneCount; i++) {
      const x = this.getLaneX(i);
      const color = LANE_COLORS[i];
      ctx.fillStyle = color + '08';
      ctx.fillRect(x, 0, this.laneWidth, this.hitLineY + 50);
    }

    // Lane separators
    for (let i = 0; i <= this.laneCount; i++) {
      const x = this.getLaneX(i);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.hitLineY + 50);
      ctx.stroke();
    }

    // Hit line — glowing pink/purple
    const hlGrad = ctx.createLinearGradient(this.playAreaLeft, 0, this.playAreaLeft + this.playAreaWidth, 0);
    hlGrad.addColorStop(0, '#FF69B4');
    hlGrad.addColorStop(0.5, '#BA68C8');
    hlGrad.addColorStop(1, '#8B5CF6');
    ctx.shadowColor = '#FF69B4';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = hlGrad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(this.playAreaLeft, this.hitLineY);
    ctx.lineTo(this.playAreaLeft + this.playAreaWidth, this.hitLineY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Tap zone circles
    for (let i = 0; i < this.laneCount; i++) {
      const cx = this.getLaneCenterX(i);
      const pressed = pressedLanes.has(i);
      const color = LANE_COLORS[i];

      if (pressed) {
        // Glow pillar
        const glow = ctx.createRadialGradient(cx, this.hitLineY, 0, cx, this.hitLineY, this.laneWidth);
        glow.addColorStop(0, color + '44');
        glow.addColorStop(0.6, color + '11');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(this.getLaneX(i), this.hitLineY - this.laneWidth, this.laneWidth, this.laneWidth * 2);
      }

      // Outer ring
      ctx.beginPath();
      ctx.arc(cx, this.hitLineY, this.noteRadius + 4, 0, Math.PI * 2);
      ctx.strokeStyle = pressed ? color + 'cc' : color + '33';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Inner filled circle
      ctx.beginPath();
      ctx.arc(cx, this.hitLineY, this.noteRadius, 0, Math.PI * 2);
      ctx.fillStyle = pressed ? color + 'aa' : color + '18';
      ctx.fill();
    }

    // Key labels
    const keys = keyLabels ?? ['S', 'D', 'F', 'J', 'K', 'L'];
    ctx.font = `700 ${Math.max(10, this.laneWidth * 0.2)}px 'M PLUS Rounded 1c', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < this.laneCount; i++) {
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillText(keys[i], this.getLaneCenterX(i), this.hitLineY + 36);
    }
  }

  drawNote(an: ActiveNote): void {
    const ctx = this.ctx;
    const { note, y } = an;
    if (y === undefined || an.judged) return;

    const cx = this.getLaneCenterX(note.lane);
    const r = this.noteRadius;
    const color = LANE_COLORS[note.lane];

    if (note.type === 'hold' && note.duration) {
      const bodyTop = Math.max(0, an.holdActive ? this.hitLineY : (y as number) - (note.duration / 1000) * 400);
      // Hold body
      ctx.fillStyle = color + '28';
      const hw = r * 1.4;
      ctx.fillRect(cx - hw, bodyTop, hw * 2, (y as number) - bodyTop);
      // Center line
      ctx.strokeStyle = color + '55';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, bodyTop);
      ctx.lineTo(cx, y as number);
      ctx.stroke();
    }

    if (note.type === 'tap' || note.type === 'hold') {
      // ガルパ-style circular note
      ctx.beginPath();
      ctx.arc(cx, y as number, r, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(cx - r * 0.3, (y as number) - r * 0.3, 0, cx, y as number, r);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.3, color);
      grad.addColorStop(1, color + 'aa');
      ctx.fillStyle = grad;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      // White border ring
      ctx.beginPath();
      ctx.arc(cx, y as number, r + 1.5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    if (note.type === 'flick') {
      // Diamond/arrow flick note
      const s = r * 1.3;
      ctx.beginPath();
      ctx.moveTo(cx, (y as number) - s);
      ctx.lineTo(cx + s, y as number);
      ctx.lineTo(cx, (y as number) + s * 0.6);
      ctx.lineTo(cx - s, y as number);
      ctx.closePath();

      const grad = ctx.createLinearGradient(cx - s, (y as number) - s, cx + s, (y as number) + s);
      grad.addColorStop(0, '#FF69B4');
      grad.addColorStop(1, '#8B5CF6');
      ctx.fillStyle = grad;
      ctx.shadowColor = '#FF69B4';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Up arrow
      ctx.beginPath();
      ctx.moveTo(cx - 5, (y as number));
      ctx.lineTo(cx, (y as number) - 7);
      ctx.lineTo(cx + 5, (y as number));
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  drawHitEffect(effect: HitEffect, now: number): boolean {
    const ctx = this.ctx;
    const elapsed = now - effect.time;
    if (elapsed > 650) return false;

    const progress = elapsed / 650;
    const alpha = 1 - progress;
    const scale = 1 + progress * 2.5;
    const cx = this.getLaneCenterX(effect.lane);
    const cy = this.hitLineY;
    const color = JUDGMENT_COLORS[effect.judgment];

    // Expanding ring
    ctx.beginPath();
    ctx.arc(cx, cy, this.noteRadius * scale * 1.2, 0, Math.PI * 2);
    ctx.shadowColor = color;
    ctx.shadowBlur = 10 * alpha;
    const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
    ctx.strokeStyle = color + a;
    ctx.lineWidth = 2.5 * (1 - progress);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Star burst particles for Perfect/Great
    if (effect.judgment === 'perfect' || effect.judgment === 'great') {
      const count = effect.judgment === 'perfect' ? 10 : 6;
      for (let p = 0; p < count; p++) {
        const angle = (p / count) * Math.PI * 2 + elapsed * 0.005;
        const dist = (10 + 40 * progress) * scale * 0.5;
        const px = cx + Math.cos(angle) * dist;
        const py = cy + Math.sin(angle) * dist;
        const size = (2.5 - progress * 2) * (effect.judgment === 'perfect' ? 1.3 : 1);
        if (size > 0.3) {
          // Star shape (simplified as 4-point)
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(elapsed * 0.008 + p);
          ctx.beginPath();
          for (let s = 0; s < 4; s++) {
            const sa = (s / 4) * Math.PI * 2;
            const sx = Math.cos(sa) * size;
            const sy = Math.sin(sa) * size;
            s === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
            const ia = sa + Math.PI / 4;
            ctx.lineTo(Math.cos(ia) * size * 0.4, Math.sin(ia) * size * 0.4);
          }
          ctx.closePath();
          const pa = Math.round(alpha * 220).toString(16).padStart(2, '0');
          ctx.fillStyle = (effect.judgment === 'perfect' ? '#ffd700' : '#FF69B4') + pa;
          ctx.fill();
          ctx.restore();
        }
      }
    }

    // Judgment text
    const bounce = progress < 0.1 ? 0.8 + progress * 2 : 1;
    const fontSize = (15 + 5 * (1 - progress)) * bounce;
    ctx.font = `900 ${fontSize}px 'M PLUS Rounded 1c', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = color;
    ctx.shadowBlur = 8 * alpha;
    ctx.fillStyle = color + Math.round(alpha * 255).toString(16).padStart(2, '0');
    ctx.fillText(JUDGMENT_LABELS[effect.judgment], cx, cy - 42 - progress * 22);
    ctx.shadowBlur = 0;

    return true;
  }

  drawComboAndScore(combo: number, score: number): void {
    const ctx = this.ctx;

    if (combo >= 2) {
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let comboColor = '#ffffff';
      let glowColor = 'rgba(255,255,255,0.3)';
      if (combo >= 500) { comboColor = '#ffd700'; glowColor = 'rgba(255,215,0,0.5)'; }
      else if (combo >= 200) { comboColor = '#FF69B4'; glowColor = 'rgba(255,105,180,0.4)'; }
      else if (combo >= 100) { comboColor = '#BA68C8'; glowColor = 'rgba(186,104,200,0.4)'; }
      else if (combo >= 50) { comboColor = '#FFB6C1'; glowColor = 'rgba(255,182,193,0.3)'; }

      const comboSize = Math.min(54, 30 + combo * 0.06);
      ctx.font = `900 ${comboSize}px 'M PLUS Rounded 1c', sans-serif`;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 15;
      ctx.fillStyle = comboColor;
      ctx.fillText(`${combo}`, this._width / 2, this.hitLineY - 105);
      ctx.shadowBlur = 0;

      ctx.font = `700 11px 'M PLUS Rounded 1c', sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText('コンボ', this._width / 2, this.hitLineY - 78);
    }

    // Score
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.font = `900 20px 'M PLUS Rounded 1c', sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(score.toLocaleString(), this._width - 18, 14);

    ctx.font = `700 9px 'M PLUS Rounded 1c', sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillText('スコア', this._width - 18, 38);
  }

  drawProgress(currentTime: number, totalTime: number): void {
    const ctx = this.ctx;
    const progress = Math.min(1, currentTime / totalTime);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(0, 0, this._width, 3);
    const grad = ctx.createLinearGradient(0, 0, this._width * progress, 0);
    grad.addColorStop(0, '#FF69B4');
    grad.addColorStop(1, '#8B5CF6');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, this._width * progress, 3);
  }

  drawPause(): void {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(13,5,32,0.75)';
    ctx.fillRect(0, 0, this._width, this._height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 38px 'M PLUS Rounded 1c', sans-serif`;
    ctx.fillStyle = '#FFB6C1';
    ctx.fillText('一時停止', this._width / 2, this._height / 2 - 28);

    ctx.font = `400 14px 'M PLUS Rounded 1c', sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText('ESCキーまたはタップで再開', this._width / 2, this._height / 2 + 22);
  }
}
