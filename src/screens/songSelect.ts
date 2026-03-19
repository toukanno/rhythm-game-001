import type { Beatmap } from '../engine/types';

export interface SongEntry {
  beatmap: Beatmap;
  audioBuffer?: AudioBuffer;  // For procedurally generated audio
}

export function renderSongSelectScreen(
  container: HTMLElement,
  songs: SongEntry[],
  onSelect: (entry: SongEntry) => void,
  onCustomLoad: () => void,
): void {
  container.innerHTML = `
    <div class="screen song-select-screen">
      <h2 class="screen-title">SELECT SONG</h2>
      <div class="song-list" id="song-list"></div>
      <div class="custom-load-section">
        <button class="btn btn-secondary" id="btn-custom">+ カスタム譜面を読み込む</button>
        <p class="hint">Load a custom beatmap (JSON + audio file)</p>
      </div>
    </div>
  `;

  const listEl = container.querySelector('#song-list') as HTMLElement;

  songs.forEach((entry, idx) => {
    const card = document.createElement('div');
    card.className = 'song-card';
    card.innerHTML = `
      <div class="song-info">
        <h3 class="song-title">${entry.beatmap.title}</h3>
        <p class="song-artist">${entry.beatmap.artist}</p>
        <div class="song-meta">
          <span class="song-diff">${entry.beatmap.difficulty}</span>
          <span class="song-bpm">${entry.beatmap.bpm} BPM</span>
          <span class="song-notes">${entry.beatmap.notes.length} notes</span>
        </div>
      </div>
      <button class="btn btn-play" data-idx="${idx}">PLAY ▶</button>
    `;
    listEl.appendChild(card);
  });

  listEl.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.btn-play') as HTMLElement;
    if (btn) {
      const idx = parseInt(btn.dataset.idx || '0');
      onSelect(songs[idx]);
    }
  });

  container.querySelector('#btn-custom')?.addEventListener('click', onCustomLoad);
}
