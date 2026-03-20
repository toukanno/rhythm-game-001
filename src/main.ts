import { Game } from './engine/game';
import { keyConfig } from './engine/keyConfig';
import { renderTitleScreen } from './screens/title';
import { renderSongSelectScreen, type SongEntry } from './screens/songSelect';
import { renderGameplayScreen } from './screens/gameplay';
import { renderResultsScreen } from './screens/results';
import { renderSettingsScreen } from './screens/settings';
import { loadCustomBeatmap } from './beatmaps/customLoader';
import type { Beatmap, GameState } from './engine/types';
import './style.css';

/** Resolve a path relative to Vite's base URL. */
function baseUrl(path: string): string {
  return import.meta.env.BASE_URL + path;
}

class App {
  private container: HTMLElement;
  private game: Game | null = null;
  private currentSong: SongEntry | null = null;
  private loadedSongs: SongEntry[] = [];

  constructor() {
    this.container = document.querySelector<HTMLDivElement>('#app')!;
    this.init();
  }

  private async init(): Promise<void> {
    // Show title immediately, load songs in background
    this.showTitle();
    this.loadSongList();
  }

  private async loadSongList(): Promise<void> {
    try {
      const resp = await fetch(baseUrl('beatmaps/songlist.json'));
      const list: Array<{ easy?: string; normal?: string; hard?: string }> = await resp.json();

      // Collect all paths to fetch
      const paths: string[] = [];
      for (const entry of list) {
        for (const [, path] of Object.entries(entry)) {
          if (path) paths.push(path);
        }
      }

      // Fetch all beatmaps in parallel (much faster than sequential)
      const results = await Promise.allSettled(
        paths.map(async (path) => {
          const bmResp = await fetch(baseUrl(path));
          const bm: Beatmap = await bmResp.json();
          bm.audioFile = baseUrl(bm.audioFile);
          return bm;
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          this.loadedSongs.push({ beatmap: result.value });
        }
      }
    } catch (e) {
      console.warn('songlist.jsonの読み込みに失敗しました', e);
    }
  }

  private buildSongList(): SongEntry[] {
    const lc = keyConfig.laneCount;
    const songs = this.loadedSongs.map(entry => {
      // Clone to avoid mutating originals on lane clamp
      const cloned = { ...entry, beatmap: { ...entry.beatmap, notes: entry.beatmap.notes.map(n => ({ ...n })) } };
      for (const note of cloned.beatmap.notes) {
        if (note.lane >= lc) note.lane = lc - 1;
      }
      return cloned;
    });
    return songs;
  }

  private showTitle(): void {
    renderTitleScreen(
      this.container,
      () => this.showSongSelect(),
      () => this.showSettings(),
    );
  }

  private showSettings(): void {
    renderSettingsScreen(this.container, () => this.showTitle());
  }

  private showSongSelect(): void {
    const songs = this.buildSongList();
    renderSongSelectScreen(
      this.container,
      songs,
      (entry) => this.startGame(entry),
      () => this.handleCustomLoad(songs),
    );
  }

  private async startGame(entry: SongEntry): Promise<void> {
    this.currentSong = entry;
    const canvas = renderGameplayScreen(this.container);

    this.game = new Game(canvas);
    await this.game.loadBeatmap(entry.beatmap, entry.audioBuffer);

    const pauseBtn = this.container.querySelector('#btn-pause');
    pauseBtn?.addEventListener('click', () => this.game?.togglePause());

    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') this.game?.togglePause();
    };
    window.addEventListener('keydown', escHandler);

    this.game.start((state: GameState) => {
      window.removeEventListener('keydown', escHandler);
      this.showResults(state);
    });
  }

  private showResults(state: GameState): void {
    const title = this.currentSong?.beatmap.title || 'Unknown';
    renderResultsScreen(
      this.container,
      state,
      title,
      () => { if (this.currentSong) this.startGame(this.currentSong); },
      () => this.showSongSelect(),
    );
  }

  private async handleCustomLoad(songs: SongEntry[]): Promise<void> {
    const result = await loadCustomBeatmap();
    if (!result) return;

    const ctx = new AudioContext();
    const arrayBuf = await result.audioFile.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuf);

    const lc = keyConfig.laneCount;
    for (const note of result.beatmap.notes) {
      if (note.lane >= lc) note.lane = lc - 1;
    }

    songs.push({ beatmap: result.beatmap, audioBuffer });
    renderSongSelectScreen(
      this.container,
      songs,
      (entry) => this.startGame(entry),
      () => this.handleCustomLoad(songs),
    );
  }
}

new App();
