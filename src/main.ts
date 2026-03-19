import { Game } from './engine/game';
import { AudioManager } from './engine/audio';
import { renderTitleScreen } from './screens/title';
import { renderSongSelectScreen, type SongEntry } from './screens/songSelect';
import { renderGameplayScreen } from './screens/gameplay';
import { renderResultsScreen } from './screens/results';
import { createDemoBeatmap, createEasyDemoBeatmap } from './beatmaps/demo';
import { loadCustomBeatmap } from './beatmaps/customLoader';
import type { GameState } from './engine/types';
import './style.css';

class App {
  private container: HTMLElement;
  private game: Game | null = null;
  private songs: SongEntry[] = [];
  private demoAudioBuffer: AudioBuffer | null = null;
  private currentSong: SongEntry | null = null;

  constructor() {
    this.container = document.querySelector<HTMLDivElement>('#app')!;
    this.init();
  }

  private async init(): Promise<void> {
    // Pre-generate demo audio
    const tempAudio = new AudioManager();
    this.demoAudioBuffer = tempAudio.generateDemoSong();

    // Create demo songs
    this.songs = [
      { beatmap: createDemoBeatmap(), audioBuffer: this.demoAudioBuffer },
      { beatmap: createEasyDemoBeatmap(), audioBuffer: this.demoAudioBuffer },
    ];

    this.showTitle();
  }

  private showTitle(): void {
    renderTitleScreen(this.container, () => this.showSongSelect());
  }

  private showSongSelect(): void {
    renderSongSelectScreen(
      this.container,
      this.songs,
      (entry) => this.startGame(entry),
      () => this.handleCustomLoad(),
    );
  }

  private async startGame(entry: SongEntry): Promise<void> {
    this.currentSong = entry;
    const canvas = renderGameplayScreen(this.container);

    this.game = new Game(canvas);

    await this.game.loadBeatmap(entry.beatmap, entry.audioBuffer);

    // Pause button
    const pauseBtn = this.container.querySelector('#btn-pause');
    pauseBtn?.addEventListener('click', () => this.game?.togglePause());

    // ESC to pause
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.game?.togglePause();
      }
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
      () => {
        if (this.currentSong) this.startGame(this.currentSong);
      },
      () => this.showSongSelect(),
    );
  }

  private async handleCustomLoad(): Promise<void> {
    const result = await loadCustomBeatmap();
    if (!result) return;

    // Decode the audio file
    const ctx = new AudioContext();
    const arrayBuf = await result.audioFile.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuf);

    const entry: SongEntry = {
      beatmap: result.beatmap,
      audioBuffer,
    };

    this.songs.push(entry);
    this.showSongSelect();
  }
}

new App();
