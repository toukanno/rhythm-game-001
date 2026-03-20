import type { Beatmap } from '../engine/types';
import { DIFFICULTY_LABELS, LANE_COLORS } from '../engine/types';

export interface SongEntry {
  beatmap: Beatmap;
  audioBuffer?: AudioBuffer;
}

// Generate a gradient color for album art placeholder based on song title
function artGradient(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  const h1 = Math.abs(hash % 360);
  const h2 = (h1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${h1},70%,55%), hsl(${h2},80%,45%))`;
}

export function renderSongSelectScreen(
  container: HTMLElement,
  songs: SongEntry[],
  onSelect: (entry: SongEntry) => void,
  onCustomLoad: () => void,
): void {
  container.innerHTML = `
    <div class="screen song-select-screen">
      <h2 class="screen-title">曲を選ぶ</h2>
      <div class="song-list" id="song-list"></div>
      <div class="custom-load-section">
        <button class="btn btn-secondary" id="btn-custom">+ カスタム譜面を読み込む</button>
        <p class="hint">JSON譜面ファイルと音楽ファイルを選択</p>
      </div>
    </div>
  `;

  const listEl = container.querySelector('#song-list') as HTMLElement;

  songs.forEach((entry, idx) => {
    const diffLabel = DIFFICULTY_LABELS[entry.beatmap.difficulty] || entry.beatmap.difficulty;
    const diffClass = entry.beatmap.difficulty.toLowerCase();
    const art = artGradient(entry.beatmap.title);
    const card = document.createElement('div');
    card.className = 'song-card';
    card.innerHTML = `
      <div class="song-art" style="background:${art}"></div>
      <div class="song-info">
        <h3 class="song-title">${entry.beatmap.title}</h3>
        <p class="song-artist">${entry.beatmap.artist}</p>
        <div class="song-meta">
          <span class="song-diff diff-${diffClass}">${diffLabel}</span>
          <span class="song-bpm">${entry.beatmap.bpm} BPM</span>
          <span class="song-notes">${entry.beatmap.notes.length}ノーツ</span>
        </div>
      </div>
      <button class="btn btn-play" data-idx="${idx}">プレイ ▶</button>
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
