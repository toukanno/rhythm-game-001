import { keyConfig } from '../engine/keyConfig';

/**
 * Title screen with animated background.
 */
export function renderTitleScreen(
  container: HTMLElement,
  onStart: () => void,
  onSettings: () => void,
): void {
  const keyHint = keyConfig.labels.join(' ');

  container.innerHTML = `
    <div class="screen title-screen">
      <div class="title-bg"></div>
      <div class="title-content">
        <h1 class="title-logo">
          <span class="title-star">★</span>
          <span class="title-text">Rhythm<br>Striker</span>
          <span class="title-star">★</span>
        </h1>
        <p class="title-sub">7-Lane Rhythm Game</p>
        <button class="btn btn-primary pulse" id="btn-start">TAP TO START</button>
        <p class="title-hint">Desktop: ${keyHint}</p>
        <button class="btn btn-secondary btn-settings" id="btn-settings">SETTINGS</button>
      </div>
    </div>
  `;

  const btn = container.querySelector('#btn-start') as HTMLButtonElement;
  btn.addEventListener('click', onStart);

  container.querySelector('#btn-settings')?.addEventListener('click', onSettings);

  // Also allow Enter to start
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      window.removeEventListener('keydown', handler);
      onStart();
    }
  };
  window.addEventListener('keydown', handler);
}
