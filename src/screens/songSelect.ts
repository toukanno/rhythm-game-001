import type { Beatmap } from '../engine/types';
import { keyConfig, type DifficultyOption } from '../engine/keyConfig';

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
  const h3 = (h1 + 120) % 360;
  return `linear-gradient(135deg, hsl(${h1},70%,45%), hsl(${h2},80%,35%), hsl(${h3},60%,30%))`;
}

function artIcon(title: string): string {
  const icons = ['🎵', '🎶', '🎸', '🎹', '🎤', '🎧', '🎼', '🎺', '🥁', '🎻', '🎷', '🪗'];
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  return icons[Math.abs(hash) % icons.length];
}

/** Estimate a difficulty level (1-20) from note count & BPM */
function estimateLevel(beatmap: Beatmap): number {
  const noteCount = beatmap.notes.length;
  if (noteCount === 0) return 1;
  const lastNote = beatmap.notes[beatmap.notes.length - 1];
  const durationSec = Math.max((lastNote.time + (lastNote.duration || 0)) / 1000, 10);
  const nps = noteCount / durationSec;
  const level = Math.round(1 + (nps / 8) * 19);
  return Math.max(1, Math.min(20, level));
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

function getMaxLevel(group: SongGroup): number {
  let max = 0;
  for (const entry of Object.values(group.entries)) {
    max = Math.max(max, estimateLevel(entry.beatmap));
  }
  return max;
}

const DIFF_META: Array<{ key: DifficultyOption; label: string; color: string }> = [
  { key: 'EASY', label: 'イージー', color: '#4FC3F7' },
  { key: 'NORMAL', label: 'ノーマル', color: '#66BB6A' },
  { key: 'HARD', label: 'エキスパート', color: '#EF5350' },
];

export function renderSongSelectScreen(
  container: HTMLElement,
  songs: SongEntry[],
  onSelect: (entry: SongEntry) => void,
  onCustomLoad: () => void,
  onBack?: () => void,
): void {
  const groups = groupSongs(songs);
  let selectedIndex = 0;
  let selectedDiff: DifficultyOption = keyConfig.defaultDifficulty || 'HARD';

  container.innerHTML = `
    <div class="screen ss2">
      <div class="ss2-bg"></div>

      <!-- Left panel: song list -->
      <div class="ss2-left">
        <div class="ss2-left-header">
          ${onBack ? '<button class="ss2-back" id="ss2-back">\u2190</button>' : ''}
          <span class="ss2-header-title">\u697D\u66F2\u9078\u629E</span>
        </div>
        <div class="ss2-list" id="ss2-list"></div>
        <div class="ss2-list-footer">
          <button class="ss2-footer-btn" id="ss2-custom" title="\u30AB\u30B9\u30BF\u30E0\u8B5C\u9762\u3092\u8AAD\u307F\u8FBC\u3080">\uFF0B \u30AB\u30B9\u30BF\u30E0</button>
        </div>
      </div>

      <!-- Right panel: detail -->
      <div class="ss2-right" id="ss2-right">
        <div class="ss2-detail-top">
          <div class="ss2-jacket" id="ss2-jacket"></div>
          <div class="ss2-meta" id="ss2-meta"></div>
        </div>
        <div class="ss2-detail-bottom">
          <div class="ss2-diffs" id="ss2-diffs"></div>
          <button class="ss2-play-btn" id="ss2-play">PLAY</button>
        </div>
      </div>
    </div>
  `;

  const listEl = container.querySelector('#ss2-list') as HTMLElement;

  // Render song list items
  groups.forEach((group, idx) => {
    const art = artGradient(group.title);
    const maxLv = getMaxLevel(group);
    const item = document.createElement('div');
    item.className = 'ss2-item' + (idx === selectedIndex ? ' ss2-item--active' : '');
    item.dataset.idx = String(idx);
    const icon = artIcon(group.title);
    item.innerHTML = `
      <div class="ss2-item-art" style="background:${art}"><span class="ss2-art-icon">${icon}</span></div>
      <div class="ss2-item-info">
        <span class="ss2-item-title">${group.title}</span>
        <span class="ss2-item-artist">${group.artist}</span>
      </div>
      <span class="ss2-item-bpm">${group.bpm}</span>
      <span class="ss2-item-lv">Lv.${maxLv}</span>
    `;
    listEl.appendChild(item);
  });

  function updateDetail(): void {
    if (groups.length === 0) return;
    const group = groups[selectedIndex];
    const art = artGradient(group.title);

    // Jacket
    const jacketEl = container.querySelector('#ss2-jacket') as HTMLElement;
    jacketEl.style.background = art;
    const icon = artIcon(group.title);
    jacketEl.innerHTML = `<div class="ss2-jacket-icon">${icon}</div><div class="ss2-jacket-title">${group.title}</div><div class="ss2-jacket-artist">${group.artist}</div>`;

    // Meta info
    const metaEl = container.querySelector('#ss2-meta') as HTMLElement;
    metaEl.innerHTML = `
      <div class="ss2-meta-row"><span class="ss2-meta-label">HI-SCORE</span><span class="ss2-meta-val">\u2014</span></div>
      <div class="ss2-meta-row"><span class="ss2-meta-label">COMBO</span><span class="ss2-meta-val">0</span></div>
      <div class="ss2-meta-row"><span class="ss2-meta-label">BPM</span><span class="ss2-meta-val">${group.bpm}</span></div>
      <div class="ss2-meta-row"><span class="ss2-meta-label">Composer</span><span class="ss2-meta-val">${group.artist}</span></div>
    `;

    // If selected diff doesn't exist, select first available
    const availableDiffs = DIFF_META.filter(d => group.entries[d.key]);
    if (!group.entries[selectedDiff] && availableDiffs.length > 0) {
      selectedDiff = availableDiffs[availableDiffs.length - 1].key;
    }

    // Difficulty buttons
    const diffsEl = container.querySelector('#ss2-diffs') as HTMLElement;
    diffsEl.innerHTML = '';
    for (const dm of DIFF_META) {
      const entry = group.entries[dm.key];
      if (!entry) continue;
      const lv = estimateLevel(entry.beatmap);
      const noteCount = entry.beatmap.notes.length;
      const isActive = dm.key === selectedDiff;
      const btn = document.createElement('button');
      btn.className = 'ss2-diff-btn' + (isActive ? ' ss2-diff-btn--active' : '');
      btn.style.setProperty('--diff-color', dm.color);
      btn.dataset.diff = dm.key;
      btn.innerHTML = `
        <span class="ss2-diff-label">${dm.label}</span>
        <span class="ss2-diff-lv">${lv}</span>
        <span class="ss2-diff-notes">${noteCount}ノーツ</span>
      `;
      btn.addEventListener('click', () => {
        selectedDiff = dm.key;
        updateDetail();
      });
      diffsEl.appendChild(btn);
    }

    // Highlight active list item
    listEl.querySelectorAll('.ss2-item').forEach((el, i) => {
      el.classList.toggle('ss2-item--active', i === selectedIndex);
    });

    // Scroll active item into view
    const activeItem = listEl.querySelector('.ss2-item--active');
    if (activeItem) activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // Click song list item
  listEl.addEventListener('click', (e) => {
    const item = (e.target as HTMLElement).closest('.ss2-item') as HTMLElement;
    if (!item) return;
    selectedIndex = parseInt(item.dataset.idx || '0');
    updateDetail();
  });

  // Play button
  container.querySelector('#ss2-play')!.addEventListener('click', () => {
    if (groups.length === 0) return;
    const group = groups[selectedIndex];
    const entry = group.entries[selectedDiff] || Object.values(group.entries)[0];
    if (entry) onSelect(entry);
  });

  // Custom load
  container.querySelector('#ss2-custom')?.addEventListener('click', onCustomLoad);

  // Back
  container.querySelector('#ss2-back')?.addEventListener('click', () => onBack?.());

  // Keyboard navigation
  const keyHandler = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(0, selectedIndex - 1);
      updateDetail();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(groups.length - 1, selectedIndex + 1);
      updateDetail();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const avail = DIFF_META.filter(d => groups[selectedIndex]?.entries[d.key]);
      const ci = avail.findIndex(d => d.key === selectedDiff);
      if (ci > 0) { selectedDiff = avail[ci - 1].key; updateDetail(); }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const avail = DIFF_META.filter(d => groups[selectedIndex]?.entries[d.key]);
      const ci = avail.findIndex(d => d.key === selectedDiff);
      if (ci < avail.length - 1) { selectedDiff = avail[ci + 1].key; updateDetail(); }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const group = groups[selectedIndex];
      if (group) {
        const entry = group.entries[selectedDiff] || Object.values(group.entries)[0];
        if (entry) onSelect(entry);
      }
    } else if (e.key === 'Escape') {
      cleanup();
      onBack?.();
    }
  };

  const cleanup = () => window.removeEventListener('keydown', keyHandler);
  window.addEventListener('keydown', keyHandler);

  // Initial render
  updateDetail();
}
