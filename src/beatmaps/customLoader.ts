import type { Beatmap, BeatmapNote } from '../engine/types';

/**
 * Custom beatmap loader.
 * Mode 1: JSON + Audio file
 * Mode 2: MP3 only — auto-generates beatmap from audio analysis
 */
export async function loadCustomBeatmap(): Promise<{ beatmap: Beatmap; audioFile: File } | null> {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <h3>楽曲の読み込み</h3>

        <div class="load-tabs">
          <button class="load-tab load-tab-active" id="tab-mp3">🎵 MP3から自動生成</button>
          <button class="load-tab" id="tab-json">📄 譜面ファイル読み込み</button>
        </div>

        <!-- MP3 only mode -->
        <div id="mode-mp3" class="load-mode">
          <p style="font-size:12px;color:#999;margin-bottom:12px;">MP3/OGGファイルを選ぶだけで自動的に譜面が生成されます</p>
          <div class="file-group">
            <label>音楽ファイル (MP3/OGG/WAV)</label>
            <input type="file" id="mp3-file" accept="audio/*,.mp3,.ogg,.wav,.m4a,.flac" />
          </div>
          <div class="file-group">
            <label>難易度</label>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-sm diff-select diff-active" data-diff="EASY">イージー</button>
              <button class="btn btn-sm diff-select" data-diff="NORMAL">ノーマル</button>
              <button class="btn btn-sm diff-select" data-diff="HARD">ハード</button>
            </div>
          </div>
          <div id="mp3-status" style="font-size:11px;color:#FF69B4;margin-top:8px;display:none;"></div>
        </div>

        <!-- JSON mode -->
        <div id="mode-json" class="load-mode" style="display:none;">
          <div class="file-group">
            <label>譜面ファイル (Beatmap JSON)</label>
            <input type="file" id="beatmap-file" accept=".json" />
          </div>
          <div class="file-group">
            <label>音楽ファイル (Audio)</label>
            <input type="file" id="audio-file" accept="audio/*" />
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn btn-primary" id="btn-load" disabled>読み込み</button>
          <button class="btn btn-secondary" id="btn-cancel">キャンセル</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    let currentMode = 'mp3';
    let selectedDiff = 'NORMAL';
    let beatmapData: Beatmap | null = null;
    let audioFile: File | null = null;
    let mp3File: File | null = null;

    const loadBtn = modal.querySelector('#btn-load') as HTMLButtonElement;
    const cancelBtn = modal.querySelector('#btn-cancel') as HTMLButtonElement;
    const statusEl = modal.querySelector('#mp3-status') as HTMLElement;

    // Tab switching
    modal.querySelector('#tab-mp3')!.addEventListener('click', () => {
      currentMode = 'mp3';
      modal.querySelector('#mode-mp3')!.style.display = 'block';
      modal.querySelector('#mode-json')!.style.display = 'none';
      modal.querySelector('#tab-mp3')!.classList.add('load-tab-active');
      modal.querySelector('#tab-json')!.classList.remove('load-tab-active');
      loadBtn.disabled = !mp3File;
    });
    modal.querySelector('#tab-json')!.addEventListener('click', () => {
      currentMode = 'json';
      modal.querySelector('#mode-mp3')!.style.display = 'none';
      modal.querySelector('#mode-json')!.style.display = 'block';
      modal.querySelector('#tab-json')!.classList.add('load-tab-active');
      modal.querySelector('#tab-mp3')!.classList.remove('load-tab-active');
      loadBtn.disabled = !(beatmapData && audioFile);
    });

    // Difficulty selection
    modal.querySelectorAll('.diff-select').forEach(btn => {
      btn.addEventListener('click', () => {
        modal.querySelectorAll('.diff-select').forEach(b => b.classList.remove('diff-active'));
        btn.classList.add('diff-active');
        selectedDiff = (btn as HTMLElement).dataset.diff || 'NORMAL';
      });
    });

    // MP3 file selection
    modal.querySelector('#mp3-file')!.addEventListener('change', (e) => {
      mp3File = (e.target as HTMLInputElement).files?.[0] || null;
      if (currentMode === 'mp3') loadBtn.disabled = !mp3File;
    });

    // JSON mode inputs
    const beatmapInput = modal.querySelector('#beatmap-file') as HTMLInputElement;
    const audioInput = modal.querySelector('#audio-file') as HTMLInputElement;

    beatmapInput?.addEventListener('change', async () => {
      const file = beatmapInput.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        beatmapData = JSON.parse(text) as Beatmap;
        if (currentMode === 'json') loadBtn.disabled = !(beatmapData && audioFile);
      } catch { alert('JSONファイルの形式が正しくありません'); }
    });

    audioInput?.addEventListener('change', () => {
      audioFile = audioInput.files?.[0] || null;
      if (currentMode === 'json') loadBtn.disabled = !(beatmapData && audioFile);
    });

    loadBtn.addEventListener('click', async () => {
      if (currentMode === 'mp3' && mp3File) {
        statusEl.style.display = 'block';
        statusEl.textContent = '🎵 音声を解析中...';
        loadBtn.disabled = true;

        try {
          const generatedBeatmap = await generateBeatmapFromAudio(mp3File, selectedDiff);
          modal.remove();
          resolve({ beatmap: generatedBeatmap, audioFile: mp3File });
        } catch (e) {
          statusEl.textContent = '❌ 解析に失敗しました: ' + (e as Error).message;
          loadBtn.disabled = false;
        }
      } else if (currentMode === 'json' && beatmapData && audioFile) {
        modal.remove();
        resolve({ beatmap: beatmapData, audioFile });
      }
    });

    cancelBtn.addEventListener('click', () => { modal.remove(); resolve(null); });
  });
}

/**
 * Generate a beatmap from audio using Web Audio API beat detection.
 */
async function generateBeatmapFromAudio(file: File, difficulty: string): Promise<Beatmap> {
  const ctx = new AudioContext();
  const arrayBuf = await file.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuf);
  ctx.close();

  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0);
  const duration = audioBuffer.duration;

  // Estimate BPM using autocorrelation on energy envelope
  const hopSize = Math.floor(sampleRate * 0.01); // 10ms hops
  const frameSize = Math.floor(sampleRate * 0.02); // 20ms frames
  const energyEnvelope: number[] = [];

  for (let i = 0; i < channelData.length - frameSize; i += hopSize) {
    let energy = 0;
    for (let j = 0; j < frameSize; j++) {
      energy += channelData[i + j] ** 2;
    }
    energyEnvelope.push(Math.sqrt(energy / frameSize));
  }

  // Onset detection: find peaks in energy derivative
  const onsets: number[] = [];
  const threshold = difficulty === 'EASY' ? 0.15 : difficulty === 'NORMAL' ? 0.08 : 0.04;
  const minGap = difficulty === 'EASY' ? 0.4 : difficulty === 'NORMAL' ? 0.2 : 0.1; // seconds

  for (let i = 2; i < energyEnvelope.length - 2; i++) {
    const diff = energyEnvelope[i] - energyEnvelope[i - 2];
    const timeSec = (i * hopSize) / sampleRate;

    if (diff > threshold && energyEnvelope[i] > 0.01) {
      if (onsets.length === 0 || timeSec - onsets[onsets.length - 1] > minGap) {
        onsets.push(timeSec);
      }
    }
  }

  // Estimate BPM from onset intervals
  const intervals: number[] = [];
  for (let i = 1; i < Math.min(onsets.length, 200); i++) {
    intervals.push(onsets[i] - onsets[i - 1]);
  }
  const avgInterval = intervals.length > 0 ? intervals.reduce((a, b) => a + b) / intervals.length : 0.5;
  const bpm = Math.round(60 / avgInterval);

  // Generate notes from onsets
  const laneCount = 6;
  const notes: BeatmapNote[] = [];
  let prevLane = Math.floor(laneCount / 2);

  // Energy-based section detection
  const avgEnergy = energyEnvelope.reduce((a, b) => a + b) / energyEnvelope.length;

  for (let i = 0; i < onsets.length; i++) {
    const time = Math.round(onsets[i] * 1000);
    if (time < 500 || time > (duration - 0.5) * 1000) continue;

    // Get local energy for this onset
    const frameIdx = Math.floor((onsets[i] * sampleRate) / hopSize);
    const localEnergy = frameIdx < energyEnvelope.length ? energyEnvelope[frameIdx] : 0;
    const isChorus = localEnergy > avgEnergy * 1.3;

    // Lane assignment: follow a pattern, spread more in chorus
    let lane: number;
    if (isChorus) {
      // Spread across all lanes in chorus
      lane = i % laneCount;
    } else {
      // Gradual movement in verse
      const maxJump = difficulty === 'EASY' ? 1 : 2;
      const direction = Math.random() > 0.5 ? 1 : -1;
      lane = prevLane + direction * (1 + Math.floor(Math.random() * maxJump));
      lane = Math.max(0, Math.min(laneCount - 1, lane));
    }
    prevLane = lane;

    // Note type based on energy and difficulty
    let type: 'tap' | 'hold' | 'flick' = 'tap';
    if (difficulty !== 'EASY') {
      if (localEnergy > avgEnergy * 1.8 && Math.random() > 0.6) {
        type = 'flick';
      } else if (localEnergy > avgEnergy * 1.2 && Math.random() > 0.7 && i < onsets.length - 1) {
        type = 'hold';
      }
    }

    const note: BeatmapNote = { lane, time, type };
    if (type === 'hold') {
      note.duration = Math.min(500, Math.round((onsets[Math.min(i + 1, onsets.length - 1)] - onsets[i]) * 500));
    }
    notes.push(note);
  }

  // Clean filename for title
  const title = file.name.replace(/\.(mp3|ogg|wav|m4a|flac)$/i, '').replace(/[_-]/g, ' ');

  return {
    title,
    artist: 'カスタム楽曲',
    difficulty: difficulty as 'EASY' | 'NORMAL' | 'HARD',
    bpm: Math.max(60, Math.min(300, bpm)),
    audioFile: '',
    offset: 0,
    notes,
  };
}
