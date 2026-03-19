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
import type { GameState } from './engine/types';
import './style.css';

class App {
  private container: HTMLElement;
  private game: Game | null = null;
  private demoAudioBuffer: AudioBuffer | null = null;
  private currentSong: SongEntry | null = null;

  constructor() {
    this.container = document.querySelector<HTMLDivElement>('#app')!;
    this.init();
  }

  private async init(): Promise<void> {
    const tempAudio = new AudioManager();
    this.demoAudioBuffer = tempAudio.generateDemoSong();
    this.showTitle();
  }

  /** Build song list based on current lane count setting. */
  private buildSongList(): SongEntry[] {
    const lc = keyConfig.laneCount;
    const songs: SongEntry[] = [
      { beatmap: createDemoBeatmap(lc), audioBuffer: this.demoAudioBuffer! },
      { beatmap: createEasyDemoBeatmap(lc), audioBuffer: this.demoAudioBuffer! },
    ];
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

    // Clamp custom beatmap lanes to current lane count
    const lc = keyConfig.laneCount;
    for (const note of result.beatmap.notes) {
      if (note.lane >= lc) note.lane = lc - 1;
    }

    songs.push({ beatmap: result.beatmap, audioBuffer });
    // Re-render song select with updated list
    renderSongSelectScreen(
      this.container,
      songs,
      (entry) => this.startGame(entry),
      () => this.handleCustomLoad(songs),
    );
  }
}

new App();
