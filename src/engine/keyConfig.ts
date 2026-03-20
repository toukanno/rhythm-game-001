const STORAGE_KEY = 'rhythmStriker_keyBindings';
const LANE_COUNT_KEY = 'rhythmStriker_laneCount';
const OFFSET_KEY = 'rhythmStriker_timingOffset';

const DEFAULT_KEYS_6 = ['s', 'd', 'f', 'j', 'k', 'l'];
const DEFAULT_KEYS_7 = ['a', 's', 'd', 'f', 'j', 'k', 'l'];

export type LaneCountOption = 6 | 7;

/**
 * Manages lane count and per-lane key bindings with localStorage persistence.
 * Singleton — import `keyConfig` from this module.
 */
class KeyConfig {
  private _laneCount: LaneCountOption;
  private _keys6: string[];
  private _keys7: string[];
  private _timingOffset: number = 0; // -100 to +100 ms

  constructor() {
    this._laneCount = 6;
    this._keys6 = [...DEFAULT_KEYS_6];
    this._keys7 = [...DEFAULT_KEYS_7];
    this.load();
  }

  get laneCount(): LaneCountOption { return this._laneCount; }
  get timingOffset(): number { return this._timingOffset; }

  setTimingOffset(ms: number): void {
    this._timingOffset = Math.max(-100, Math.min(100, Math.round(ms)));
    this.save();
  }

  /** Current keys array for the active lane count. */
  private get activeKeys(): string[] {
    return this._laneCount === 6 ? this._keys6 : this._keys7;
  }

  /** Current key labels (upper-case for display). */
  get labels(): string[] {
    return this.activeKeys.map(k => k === ' ' ? '⎵' : k.toUpperCase());
  }

  /** Current keys (lower-case). */
  get keys(): string[] {
    return [...this.activeKeys];
  }

  /** Build a key→lane lookup map (both cases + Space). */
  get bindings(): Record<string, number> {
    const map: Record<string, number> = {};
    const keys = this.activeKeys;
    for (let i = 0; i < this._laneCount; i++) {
      const k = keys[i];
      map[k.toLowerCase()] = i;
      map[k.toUpperCase()] = i;
      if (k === ' ') map[' '] = i;
    }
    return map;
  }

  /** Default keys for given lane count. */
  defaultKeysFor(count: LaneCountOption): string[] {
    return count === 6 ? [...DEFAULT_KEYS_6] : [...DEFAULT_KEYS_7];
  }

  /** Keys for a specific lane count (for settings UI). */
  keysFor(count: LaneCountOption): string[] {
    return count === 6 ? [...this._keys6] : [...this._keys7];
  }

  /** Labels for a specific lane count (for settings UI). */
  labelsFor(count: LaneCountOption): string[] {
    const keys = count === 6 ? this._keys6 : this._keys7;
    return keys.map(k => k === ' ' ? '⎵' : k.toUpperCase());
  }

  setLaneCount(count: LaneCountOption): void {
    this._laneCount = count;
    this.save();
  }

  /** Set a single lane key for the given lane count mode. Returns false if duplicate. */
  setKey(lane: number, key: string, count?: LaneCountOption): boolean {
    const c = count ?? this._laneCount;
    const arr = c === 6 ? this._keys6 : this._keys7;
    const lower = key.toLowerCase();
    const existing = arr.indexOf(lower);
    if (existing !== -1 && existing !== lane) return false;
    arr[lane] = lower;
    this.save();
    return true;
  }

  /** Reset keys for a specific lane count to defaults. */
  resetKeys(count: LaneCountOption): void {
    if (count === 6) this._keys6 = [...DEFAULT_KEYS_6];
    else this._keys7 = [...DEFAULT_KEYS_7];
    this.save();
  }

  /** Full reset. */
  reset(): void {
    this._laneCount = 6;
    this._keys6 = [...DEFAULT_KEYS_6];
    this._keys7 = [...DEFAULT_KEYS_7];
    this.save();
  }

  // ---- persistence ---------------------------------------------------

  private save(): void {
    try {
      localStorage.setItem(LANE_COUNT_KEY, String(this._laneCount));
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        keys6: this._keys6,
        keys7: this._keys7,
      }));
      localStorage.setItem(OFFSET_KEY, String(this._timingOffset));
    } catch { /* silently ignore */ }
  }

  private load(): void {
    try {
      const lc = localStorage.getItem(LANE_COUNT_KEY);
      if (lc === '7') this._laneCount = 7;
      else this._laneCount = 6;

      const off = localStorage.getItem(OFFSET_KEY);
      if (off) this._timingOffset = Math.max(-100, Math.min(100, parseInt(off) || 0));

      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.keys6 && Array.isArray(parsed.keys6) && parsed.keys6.length === 6) {
        this._keys6 = parsed.keys6.map((k: unknown) =>
          typeof k === 'string' && k.length > 0 ? k.toLowerCase() : 's',
        );
      }
      if (parsed.keys7 && Array.isArray(parsed.keys7) && parsed.keys7.length === 7) {
        this._keys7 = parsed.keys7.map((k: unknown) =>
          typeof k === 'string' && k.length > 0 ? k.toLowerCase() : 'a',
        );
      }
    } catch { /* corrupt data — keep defaults */ }
  }
}

export const keyConfig = new KeyConfig();
