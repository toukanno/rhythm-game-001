import { keyConfig } from './keyConfig';

export type InputCallback = (lane: number, pressed: boolean) => void;

/**
 * Manages keyboard and touch input, mapping both to lane presses.
 */
export class InputManager {
  private callback: InputCallback | null = null;
  private _pressedLanes = new Set<number>();
  private canvas: HTMLCanvasElement | null = null;
  private getLaneFromX: ((x: number) => number) | null = null;
  private activeTouches = new Map<number, number>(); // touchId -> lane

  get pressedLanes(): Set<number> {
    return this._pressedLanes;
  }

  bind(canvas: HTMLCanvasElement, getLaneFromX: (x: number) => number, callback: InputCallback): void {
    this.canvas = canvas;
    this.getLaneFromX = getLaneFromX;
    this.callback = callback;

    // Keyboard
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    // Touch
    canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', this.onTouchMove, { passive: false });
    canvas.addEventListener('touchend', this.onTouchEnd, { passive: false });
    canvas.addEventListener('touchcancel', this.onTouchEnd, { passive: false });

    // Mouse (for desktop testing touch behavior)
    canvas.addEventListener('mousedown', this.onMouseDown);
    canvas.addEventListener('mouseup', this.onMouseUp);
  }

  unbind(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);

    if (this.canvas) {
      this.canvas.removeEventListener('touchstart', this.onTouchStart);
      this.canvas.removeEventListener('touchmove', this.onTouchMove);
      this.canvas.removeEventListener('touchend', this.onTouchEnd);
      this.canvas.removeEventListener('touchcancel', this.onTouchEnd);
      this.canvas.removeEventListener('mousedown', this.onMouseDown);
      this.canvas.removeEventListener('mouseup', this.onMouseUp);
    }

    this._pressedLanes.clear();
    this.activeTouches.clear();
    this.callback = null;
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.repeat) return;
    const lane = keyConfig.bindings[e.key];
    if (lane !== undefined) {
      e.preventDefault();
      this._pressedLanes.add(lane);
      this.callback?.(lane, true);
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    const lane = keyConfig.bindings[e.key];
    if (lane !== undefined) {
      this._pressedLanes.delete(lane);
      this.callback?.(lane, false);
    }
  };

  private onTouchStart = (e: TouchEvent): void => {
    e.preventDefault();
    if (!this.canvas || !this.getLaneFromX) return;
    const rect = this.canvas.getBoundingClientRect();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const x = touch.clientX - rect.left;
      const lane = this.getLaneFromX(x);
      if (lane >= 0 && lane < keyConfig.laneCount) {
        this.activeTouches.set(touch.identifier, lane);
        this._pressedLanes.add(lane);
        this.callback?.(lane, true);
      }
    }
  };

  private onTouchMove = (e: TouchEvent): void => {
    e.preventDefault();
    if (!this.canvas || !this.getLaneFromX) return;
    const rect = this.canvas.getBoundingClientRect();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const x = touch.clientX - rect.left;
      const newLane = this.getLaneFromX(x);
      const oldLane = this.activeTouches.get(touch.identifier);

      if (oldLane === undefined) continue;
      if (newLane < 0 || newLane >= keyConfig.laneCount) continue;
      if (newLane === oldLane) continue;

      // Release old lane if no other touch is on it
      this.activeTouches.set(touch.identifier, newLane);
      let oldStillPressed = false;
      for (const [, l] of this.activeTouches) {
        if (l === oldLane) { oldStillPressed = true; break; }
      }
      if (!oldStillPressed) {
        this._pressedLanes.delete(oldLane);
        this.callback?.(oldLane, false);
      }

      // Press new lane
      this._pressedLanes.add(newLane);
      this.callback?.(newLane, true);
    }
  };

  private onTouchEnd = (e: TouchEvent): void => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const lane = this.activeTouches.get(touch.identifier);
      if (lane !== undefined) {
        this.activeTouches.delete(touch.identifier);
        // Check if any other touch is still on this lane
        let stillPressed = false;
        for (const [, l] of this.activeTouches) {
          if (l === lane) { stillPressed = true; break; }
        }
        if (!stillPressed) {
          this._pressedLanes.delete(lane);
          this.callback?.(lane, false);
        }
      }
    }
  };

  private onMouseDown = (e: MouseEvent): void => {
    if (!this.canvas || !this.getLaneFromX) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const lane = this.getLaneFromX(x);
    if (lane >= 0 && lane < keyConfig.laneCount) {
      this._pressedLanes.add(lane);
      this.callback?.(lane, true);
    }
  };

  private onMouseUp = (_e: MouseEvent): void => {
    // Release all mouse-pressed lanes
    for (const lane of this._pressedLanes) {
      this.callback?.(lane, false);
    }
    this._pressedLanes.clear();
  };
}
