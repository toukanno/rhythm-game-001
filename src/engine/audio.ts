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

  /**
   * Generate a simple demo song (120 BPM, ~60 seconds).
   * Uses basic oscillator tones so we need zero external files.
   */
  generateDemoSong(): AudioBuffer {
    const sampleRate = 44100;
    const duration = 65; // seconds
    const buf = this.ctx.createBuffer(2, sampleRate * duration, sampleRate);
    const left = buf.getChannelData(0);
    const right = buf.getChannelData(1);

    const bpm = 150;
    const beatLen = 60 / bpm;

    // Simple synth patterns
    for (let i = 0; i < left.length; i++) {
      const t = i / sampleRate;
      const beat = t / beatLen;
      const beatFrac = beat % 1;

      // Kick on every beat
      let sample = 0;
      if (beatFrac < 0.08) {
        const kickT = beatFrac / 0.08;
        const kickFreq = 150 * (1 - kickT * 0.7);
        sample += Math.sin(2 * Math.PI * kickFreq * beatFrac) * (1 - kickT) * 0.4;
      }

      // Hi-hat on offbeats
      if (beat % 1 > 0.45 && beat % 1 < 0.55) {
        sample += (Math.random() * 2 - 1) * 0.08;
      }
      // Extra hi-hat on every beat
      if (beatFrac < 0.02) {
        sample += (Math.random() * 2 - 1) * 0.1;
      }

      // Bass line — simple pattern repeating every 4 beats
      const measure = Math.floor(beat / 4);
      const beatInMeasure = beat % 4;
      const bassNotes = [130.81, 146.83, 164.81, 146.83]; // C3, D3, E3, D3
      const bassFreq = bassNotes[Math.floor(beatInMeasure)] * (1 + (measure % 4 === 3 ? 0.5 : 0));
      sample += Math.sin(2 * Math.PI * bassFreq * t) * 0.15;

      // Melody — pentatonic scale pattern
      const melodyNotes = [523.25, 587.33, 659.25, 783.99, 880.00, 783.99, 659.25, 587.33];
      const melodyBeat = Math.floor(beat * 2) % melodyNotes.length;
      const melodyFreq = melodyNotes[melodyBeat];
      const melodyEnv = Math.max(0, 1 - (beat * 2 % 1) * 2);
      sample += Math.sin(2 * Math.PI * melodyFreq * t) * 0.1 * melodyEnv;

      // Chord pad
      const chordRoot = measure % 2 === 0 ? 261.63 : 293.66;
      sample += Math.sin(2 * Math.PI * chordRoot * t) * 0.04;
      sample += Math.sin(2 * Math.PI * chordRoot * 1.25 * t) * 0.03;
      sample += Math.sin(2 * Math.PI * chordRoot * 1.5 * t) * 0.03;

      left[i] = sample;
      right[i] = sample;
    }

    return buf;
  }

  getContext(): AudioContext {
    return this.ctx;
  }
}
