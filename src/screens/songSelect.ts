import type { Beatmap } from '../engine/types';
import { keyConfig, type DifficultyOption } from '../engine/keyConfig';

export interface SongEntry {
  beatmap: Beatmap;
  audioBuffer?: AudioBuffer;
}

interface SongGroup {
  title: string;
  artist: string;
  audioFile: string;
  bpm: number;
  entries: Record<string, SongEntry>;
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

function estimateLevel(beatmap: Beatmap): number {
  const noteCount = beatmap.notes.length;
  if (noteCount === 0) return 1;
  const lastNote = beatmap.notes[beatmap.notes.length - 1];
  const durationSec = Math.max((lastNote.time + (lastNote.duration || 0)) / 1000, 10);
  const nps = noteCount / durationSec;
  const level = Math.round(1 + (nps / 8) * 19);
  return Math.max(1, Math.min(26, level));
}

function starRating(level: number): string {
  const stars = Math.min(5, Math.ceil(level / 5));
  return '★'.repeat(stars) + '☆'.repeat(5 - stars);
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

const DIFF_META: Array<{ key: DifficultyOption; label: string; color: string; iconClass: string }> = [
  { key: 'EASY', label: 'EASY', color: '#4FC3F7', iconClass: 'diff-easy' },
  { key: 'NORMAL', label: 'NORMAL', color: '#66BB6A', iconClass: 'diff-normal' },
  { key: 'HARD', label: 'HARD', color: '#FF9800', iconClass: 'diff-hard' },
];

// Add EXPERT as alias for HARD with higher threshold
const CATEGORIES = ['すべて', 'ボーカル', 'インスト', 'お気に入り'];

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
  let selectedCategory = 0;

  container.innerHTML = `
    <div class="screen garupa-select">
      <!-- Top bar -->
      <div class="gs-topbar">
        <button class="gs-back-btn" id="gs-back">◀</button>
        <div class="gs-topbar-label">フリーライブ</div>
        <div class="gs-topbar-title">楽曲選択</div>
        <div class="gs-topbar-right">
          <button class="gs-filter-btn" id="gs-filter">絞り込み</button>
        </div>
      </div>

      <div class="gs-main">
        <!-- Left: Categories -->
        <div class="gs-categories" id="gs-categories">
          ${CATEGORIES.map((cat, i) => `
            <button class="gs-cat-btn ${i === 0 ? 'gs-cat-active' : ''}" data-cat="${i}">${cat}</button>
          `).join('')}
          <button class="gs-cat-btn gs-cat-custom" id="gs-custom-btn">＋ カスタム</button>
        </div>

        <!-- Center: Song list -->
        <div class="gs-songlist" id="gs-songlist"></div>

        <!-- Right: Detail panel -->
        <div class="gs-detail">
          <div class="gs-jacket" id="gs-jacket"></div>
          <div class="gs-info-panel">
            <div class="gs-score-row">
              <span class="gs-score-label">ハイスコアレーティング</span>
              <span class="gs-score-val" id="gs-score">—</span>
            </div>
            <div class="gs-score-row">
              <span class="gs-score-label">ハイスコア</span>
              <span class="gs-score-val" id="gs-hiscore">0</span>
            </div>
            <div class="gs-score-row">
              <span class="gs-score-label">楽曲レベル</span>
              <span class="gs-score-val gs-level" id="gs-level">—</span>
            </div>
          </div>

          <!-- Difficulty buttons -->
          <div class="gs-diff-row" id="gs-diffs"></div>

          <!-- Bottom actions -->
          <div class="gs-actions">
            <button class="gs-random-btn" id="gs-random">🔀 ランダム<br>選曲</button>
            <button class="gs-decide-btn" id="gs-decide">決定</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const listEl = container.querySelector('#gs-songlist') as HTMLElement;

  // Render song list
  function renderList(): void {
    listEl.innerHTML = '';
    groups.forEach((group, idx) => {
      const maxLv = Math.max(...Object.values(group.entries).map(e => estimateLevel(e.beatmap)));
      const stars = starRating(maxLv);
      const isActive = idx === selectedIndex;

      const item = document.createElement('div');
      item.className = 'gs-song-item' + (isActive ? ' gs-song-active' : '');
      item.dataset.idx = String(idx);
      item.innerHTML = `
        <div class="gs-song-stars">${stars}</div>
        <div class="gs-song-title">${group.title}</div>
        ${group.artist ? `<div class="gs-song-artist">${group.artist}</div>` : ''}
      `;
      listEl.appendChild(item);
    });
  }

  function updateDetail(): void {
    if (groups.length === 0) return;
    const group = groups[selectedIndex];
    const art = artGradient(group.title);
    const icon = artIcon(group.title);

    // Jacket
    const jacketEl = container.querySelector('#gs-jacket') as HTMLElement;
    jacketEl.style.background = art;
    jacketEl.innerHTML = `<div class="gs-jacket-icon">${icon}</div><div class="gs-jacket-title">${group.title}</div>`;

    // Score info
    const entry = group.entries[selectedDiff] || Object.values(group.entries)[0];
    const lv = entry ? estimateLevel(entry.beatmap) : 0;
    const noteCount = entry ? entry.beatmap.notes.length : 0;

    (container.querySelector('#gs-level') as HTMLElement).textContent = String(lv);
    (container.querySelector('#gs-score') as HTMLElement).textContent = String(noteCount);

    // Difficulty buttons
    const diffsEl = container.querySelector('#gs-diffs') as HTMLElement;
    diffsEl.innerHTML = '';
    for (const dm of DIFF_META) {
      const e = group.entries[dm.key];
      if (!e) continue;
      const isActive = dm.key === selectedDiff;
      const btn = document.createElement('button');
      btn.className = 'gs-diff-btn ' + dm.iconClass + (isActive ? ' gs-diff-active' : '');
      btn.dataset.diff = dm.key;
      btn.innerHTML = `<span class="gs-diff-label">${dm.label}</span>`;
      btn.addEventListener('click', () => {
        selectedDiff = dm.key;
        updateDetail();
      });
      diffsEl.appendChild(btn);
    }

    // Highlight active list item
    listEl.querySelectorAll('.gs-song-item').forEach((el, i) => {
      el.classList.toggle('gs-song-active', i === selectedIndex);
    });
    const activeItem = listEl.querySelector('.gs-song-active');
    if (activeItem) activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  // Events
  listEl.addEventListener('click', (e) => {
    const item = (e.target as HTMLElement).closest('.gs-song-item') as HTMLElement;
    if (!item) return;
    selectedIndex = parseInt(item.dataset.idx || '0');
    updateDetail();
  });

  container.querySelector('#gs-decide')!.addEventListener('click', () => {
    if (groups.length === 0) return;
    const group = groups[selectedIndex];
    const entry = group.entries[selectedDiff] || Object.values(group.entries)[0];
    if (entry) onSelect(entry);
  });

  container.querySelector('#gs-random')!.addEventListener('click', () => {
    if (groups.length === 0) return;
    selectedIndex = Math.floor(Math.random() * groups.length);
    updateDetail();
  });

  container.querySelector('#gs-back')?.addEventListener('click', () => onBack?.());
  container.querySelector('#gs-custom-btn')?.addEventListener('click', onCustomLoad);

  // Category buttons
  container.querySelectorAll('.gs-cat-btn[data-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.gs-cat-btn').forEach(b => b.classList.remove('gs-cat-active'));
      btn.classList.add('gs-cat-active');
    });
  });

  // Keyboard
  const keyHandler = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') { e.preventDefault(); selectedIndex = Math.max(0, selectedIndex - 1); updateDetail(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); selectedIndex = Math.min(groups.length - 1, selectedIndex + 1); updateDetail(); }
    else if (e.key === 'ArrowLeft') {
      const avail = DIFF_META.filter(d => groups[selectedIndex]?.entries[d.key]);
      const ci = avail.findIndex(d => d.key === selectedDiff);
      if (ci > 0) { selectedDiff = avail[ci - 1].key; updateDetail(); }
    } else if (e.key === 'ArrowRight') {
      const avail = DIFF_META.filter(d => groups[selectedIndex]?.entries[d.key]);
      const ci = avail.findIndex(d => d.key === selectedDiff);
      if (ci < avail.length - 1) { selectedDiff = avail[ci + 1].key; updateDetail(); }
    } else if (e.key === 'Enter') {
      const group = groups[selectedIndex];
      if (group) { const entry = group.entries[selectedDiff] || Object.values(group.entries)[0]; if (entry) onSelect(entry); }
    } else if (e.key === 'Escape') { cleanup(); onBack?.(); }
  };
  const cleanup = () => window.removeEventListener('keydown', keyHandler);
  window.addEventListener('keydown', keyHandler);

  renderList();
  updateDetail();
}
