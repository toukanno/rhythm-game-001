/**
 * Audio manager — handles loading & playback via Web Audio API.
 * Also generates a simple demo song procedurally.
 */
export class AudioManager {
  private ctx: AudioContext;
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gainNode: GainNode;
  private startedAt = 0;
  private pausedAt = 0;
  private _playing = false;

  constructor() {
    this.ctx = new AudioContext();
    this.gainNode = this.ctx.createGain();
    this.gainNode.connect(this.ctx.destination);
    this.gainNode.gain.value = 0.7;
  }

  get currentTime(): number {
    if (!this._playing) return this.pausedAt;
    return (this.ctx.currentTime - this.startedAt) * 1000;
  }

  get playing(): boolean {
    return this._playing;
  }

  async loadFromUrl(url: string): Promise<void> {
    const resp = await fetch(url);
    const arrayBuf = await resp.arrayBuffer();
    this.buffer = await this.ctx.decodeAudioData(arrayBuf);
  }

  async loadBuffer(buf: AudioBuffer): Promise<void> {
    this.buffer = buf;
  }

  play(offsetMs = 0): void {
    if (!this.buffer) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    this.stop();
    this.source = this.ctx.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.connect(this.gainNode);

    const offsetSec = Math.max(0, offsetMs / 1000);
    this.source.start(0, offsetSec);
    this.startedAt = this.ctx.currentTime - offsetSec;
    this.pausedAt = 0;
    this._playing = true;

    this.source.onended = () => {
      this._playing = false;
    };
  }

  pause(): void {
    if (!this._playing) return;
    this.pausedAt = this.currentTime;
    this.source?.stop();
    this._playing = false;
  }

  resume(): void {
    if (this._playing || this.pausedAt === 0) return;
    this.play(this.pausedAt);
  }

  stop(): void {
    try { this.source?.stop(); } catch { /* ignore */ }
    this.source = null;
    this._playing = false;
    this.pausedAt = 0;
  }

  setVolume(v: number): void {
    this.gainNode.gain.value = Math.max(0, Math.min(1, v));
  }

  getContext(): AudioContext {
    return this.ctx;
  }
}
