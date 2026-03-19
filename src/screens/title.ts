/**
 * Title screen with animated background.
 */
export function renderTitleScreen(
  container: HTMLElement,
  onStart: () => void,
): void {
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
        <p class="title-hint">Desktop: S D F Space J K L</p>
      </div>
    </div>
  `;

  const btn = container.querySelector('#btn-start') as HTMLButtonElement;
  btn.addEventListener('click', onStart);
  // Also allow any key to start
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      window.removeEventListener('keydown', handler);
      onStart();
    }
  };
  window.addEventListener('keydown', handler);
}
