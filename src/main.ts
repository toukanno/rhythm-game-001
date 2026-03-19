import { Game } from './engine/game';
import { AudioManager } from './engine/audio';
import { keyConfig } from './engine/keyConfig';
import { renderTitleScreen } from './screens/title';
import { renderSongSelectScreen, type SongEntry } from './screens/songSelect';
import { renderGameplayScreen } from './screens/gameplay';
import { renderResultsScreen } from './screens/results';
import { renderSettingsScreen } from './screens/settings';
import { createDemoBeatmap, createEasyDemoBeatmap } from './beatmaps/demo';
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
  private demoAudioBuffer: AudioBuffer | null = null;
  private currentSong: SongEntry | null = null;
  private loadedSongs: SongEntry[] = [];

  constructor() {
    this.container = document.querySelector<HTMLDivElement>('#app')!;
    this.init();
  }

  private async init(): Promise<void> {
    // Generate demo audio
    const tempAudio = new AudioManager();
    this.demoAudioBuffer = tempAudio.generateDemoSong();

    // Load real songs from songlist
    await this.loadSongList();

    this.showTitle();
  }

  private async loadSongList(): Promise<void> {
    try {
      const resp = await fetch(baseUrl('beatmaps/songlist.json'));
      const list: Array<{ easy: string; normal: string }> = await resp.json();

      for (const entry of list) {
        for (const [diff, path] of Object.entries(entry)) {
          try {
            const bmResp = await fetch(baseUrl(path));
            const bm: Beatmap = await bmResp.json();
            // Resolve audioFile relative to base
            bm.audioFile = baseUrl(bm.audioFile);
            this.loadedSongs.push({ beatmap: bm });
          } catch (e) {
            console.warn(`Failed to load beatmap: ${path}`, e);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load songlist.json, using demo songs only', e);
    }
  }

  /** Build song list: real songs + procedural demo fallback */
  private buildSongList(): SongEntry[] {
    const lc = keyConfig.laneCount;
    const songs: SongEntry[] = [...this.loadedSongs];

    // Clamp loaded songs' lanes to current lane count
    for (const entry of songs) {
      for (const note of entry.beatmap.notes) {
        if (note.lane >= lc) note.lane = lc - 1;
      }
    }

    // Add procedural demo as fallback
    songs.push(
      { beatmap: createDemoBeatmap(lc), audioBuffer: this.demoAudioBuffer! },
      { beatmap: createEasyDemoBeatmap(lc), audioBuffer: this.demoAudioBuffer! },
    );

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
