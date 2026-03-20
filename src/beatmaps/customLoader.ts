import type { Beatmap } from '../engine/types';

/**
 * Custom beatmap loader.
 * Opens file pickers for a JSON beatmap and an audio file.
 */
export async function loadCustomBeatmap(): Promise<{ beatmap: Beatmap; audioFile: File } | null> {
  return new Promise((resolve) => {
    // Create a modal dialog for file selection
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal">
        <h3>カスタム譜面の読み込み</h3>
        <p>JSONファイルと音楽ファイルを選んでください</p>
        <div class="file-inputs">
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
          <button class="btn btn-primary" id="btn-load" disabled>読み込み (Load)</button>
          <button class="btn btn-secondary" id="btn-cancel">キャンセル</button>
        </div>
        <div class="beatmap-format-hint">
          <details>
            <summary>譜面フォーマット (Format Reference)</summary>
            <pre>{
  "title": "Song Title",
  "artist": "Artist Name",
  "difficulty": "HARD",
  "bpm": 120,
  "audioFile": "",
  "offset": 0,
  "notes": [
    { "lane": 3, "time": 1000, "type": "tap" },
    { "lane": 1, "time": 2000, "type": "hold", "duration": 500 },
    { "lane": 5, "time": 3000, "type": "flick" }
  ]
}</pre>
          </details>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const beatmapInput = modal.querySelector('#beatmap-file') as HTMLInputElement;
    const audioInput = modal.querySelector('#audio-file') as HTMLInputElement;
    const loadBtn = modal.querySelector('#btn-load') as HTMLButtonElement;
    const cancelBtn = modal.querySelector('#btn-cancel') as HTMLButtonElement;

    let beatmapData: Beatmap | null = null;
    let audioFile: File | null = null;

    const checkReady = () => {
      loadBtn.disabled = !(beatmapData && audioFile);
    };

    beatmapInput.addEventListener('change', async () => {
      const file = beatmapInput.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        beatmapData = JSON.parse(text) as Beatmap;
        checkReady();
      } catch (e) {
        alert('Invalid JSON beatmap file');
      }
    });

    audioInput.addEventListener('change', () => {
      audioFile = audioInput.files?.[0] || null;
      checkReady();
    });

    loadBtn.addEventListener('click', () => {
      modal.remove();
      if (beatmapData && audioFile) {
        resolve({ beatmap: beatmapData, audioFile });
      } else {
        resolve(null);
      }
    });

    cancelBtn.addEventListener('click', () => {
      modal.remove();
      resolve(null);
    });
  });
}
