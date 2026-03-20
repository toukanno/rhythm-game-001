import type { Beatmap } from '../engine/types';
import { DIFFICULTY_LABELS } from '../engine/types';
import { keyConfig } from '../engine/keyConfig';

export interface SongEntry {
  beatmap: Beatmap;
  audioBuffer?: AudioBuffer;
}

/** A song grouped by audio file, with entries per difficulty. */
interface SongGroup {
  title: string;
  artist: string;
  audioFile: string;
  bpm: number;
  entries: Record<string, SongEntry>; // key = 'EASY' | 'NORMAL' | 'HARD'
}

function artGradient(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  const h1 = Math.abs(hash % 360);
  const h2 = (h1 + 40) % 360;
  return `linear-gradient(135deg, hsl(${h1},70%,55%), hsl(${h2},80%,45%))`;
}

function groupSongs(songs: SongEntry[]): SongGroup[] {
  const map = new Map<string, SongGroup>();
  for (const entry of songs) {
    const key = entry.beatmap.audioFile;
    if (!map.has(key)) {
      map.set(key, {
        title: entry.beatmap.title,
        artist: entry.beatmap.artist,
        audioFile: entry.beatmap.audioFile,
        bpm: entry.beatmap.bpm,
        entries: {},
      });
    }
    map.get(key)!.entries[entry.beatmap.difficulty] = entry;
  }
  return Array.from(map.values());
}

export function renderSongSelectScreen(
  container: HTMLElement,
  songs: SongEntry[],
  onSelect: (entry: SongEntry) => void,
  onCustomLoad: () => void,
  onBack?: () => void,
): void {
  const groups = groupSongs(songs);

  container.innerHTML = `
    <div class="screen song-select-screen">
      <div class="screen-header">
        ${onBack ? '<button class="btn-back-nav" id="btn-back-nav">← 戻る</button>' : ''}
        <h2 class="screen-title">曲を選ぶ</h2>
      </div>
      <div class="song-list" id="song-list"></div>
      <div class="custom-load-section">
        <button class="btn btn-secondary" id="btn-custom">+ カスタム譜面を読み込む</button>
        <p class="hint">JSON譜面ファイルと音楽ファイルを選択</p>
      </div>

      <!-- Difficulty selection modal -->
      <div class="diff-overlay" id="diff-overlay" style="display:none">
        <div class="diff-modal">
          <button class="btn-back-nav diff-back" id="diff-back">← 戻る</button>
          <div class="diff-art" id="diff-art"></div>
          <h3 class="diff-song-title" id="diff-title"></h3>
          <p class="diff-song-artist" id="diff-artist"></p>
          <p class="diff-bpm" id="diff-bpm"></p>
          <div class="diff-buttons" id="diff-buttons"></div>
        </div>
      </div>
    </div>
  `;

  const listEl = container.querySelector('#song-list') as HTMLElement;
  const overlay = container.querySelector('#diff-overlay') as HTMLElement;

  // Render song cards (one per song)
  groups.forEach((group, idx) => {
    const art = artGradient(group.title);
    const diffCount = Object.keys(group.entries).length;
    const card = document.createElement('div');
    card.className = 'song-card';
    card.dataset.idx = String(idx);
    card.innerHTML = `
      <div class="song-art" style="background:${art}"></div>
      <div class="song-info">
        <h3 class="song-title">${group.title}</h3>
        <p class="song-artist">${group.artist}</p>
        <p class="song-bpm-info">${group.bpm} BPM · ${diffCount}難易度</p>
      </div>
      <div class="song-chevron">▶</div>
    `;
    listEl.appendChild(card);
  });

  // Click song card → show difficulty modal
  listEl.addEventListener('click', (e) => {
    const card = (e.target as HTMLElement).closest('.song-card') as HTMLElement;
    if (!card) return;
    const idx = parseInt(card.dataset.idx || '0');
    showDifficultyModal(groups[idx]);
  });

  function showDifficultyModal(group: SongGroup): void {
    const art = artGradient(group.title);
    (container.querySelector('#diff-art') as HTMLElement).style.background = art;
    (container.querySelector('#diff-title') as HTMLElement).textContent = group.title;
    (container.querySelector('#diff-artist') as HTMLElement).textContent = group.artist;
    (container.querySelector('#diff-bpm') as HTMLElement).textContent = `${group.bpm} BPM`;

    const btnsEl = container.querySelector('#diff-buttons') as HTMLElement;
    btnsEl.innerHTML = '';

    const diffs: Array<{ key: string; label: string; cssClass: string }> = [
      { key: 'EASY', label: 'イージー', cssClass: 'diff-btn-easy' },
      { key: 'NORMAL', label: 'ノーマル', cssClass: 'diff-btn-normal' },
      { key: 'HARD', label: 'ハード', cssClass: 'diff-btn-hard' },
    ];

    const defaultDiff = keyConfig.defaultDifficulty;

    for (const d of diffs) {
      const entry = group.entries[d.key];
      if (!entry) continue;
      const noteCount = entry.beatmap.notes.length;
      const isDefault = d.key === defaultDiff;
      const btn = document.createElement('button');
      btn.className = `diff-btn ${d.cssClass} ${isDefault ? 'diff-btn--default' : ''}`;
      btn.innerHTML = `
        <span class="diff-btn-label">${d.label}</span>
        <span class="diff-btn-notes">${noteCount}ノーツ</span>
      `;
      btn.addEventListener('click', () => {
        overlay.style.display = 'none';
        onSelect(entry);
      });
      btnsEl.appendChild(btn);
    }

    overlay.style.display = 'flex';
  }

  // Difficulty modal back button
  container.querySelector('#diff-back')?.addEventListener('click', () => {
    overlay.style.display = 'none';
  });

  // Also close on overlay background click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.style.display = 'none';
  });

  container.querySelector('#btn-custom')?.addEventListener('click', onCustomLoad);
  container.querySelector('#btn-back-nav')?.addEventListener('click', () => onBack?.());
}
