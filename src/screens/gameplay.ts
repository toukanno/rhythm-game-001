/**
 * Gameplay screen with canvas, pause button, and pause modal overlay.
 */
export function renderGameplayScreen(container: HTMLElement): {
  canvas: HTMLCanvasElement;
  showPause: () => void;
  hidePause: () => void;
  onResume: (cb: () => void) => void;
  onQuitToSelect: (cb: () => void) => void;
  onQuitToTitle: (cb: () => void) => void;
} {
  container.innerHTML = `
    <div class="screen gameplay-screen">
      <canvas id="game-canvas"></canvas>
      <button class="btn-pause-icon" id="btn-pause">❚❚</button>

      <div class="pause-overlay" id="pause-overlay" style="display:none">
        <div class="pause-modal">
          <h2 class="pause-title">一時停止</h2>
          <div class="pause-actions">
            <button class="btn btn-primary pause-btn" id="btn-resume">つづける</button>
            <button class="btn btn-secondary pause-btn" id="btn-quit-select">曲選択に戻る</button>
            <button class="btn btn-secondary pause-btn" id="btn-quit-title">やめる</button>
          </div>
        </div>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#game-canvas') as HTMLCanvasElement;
  const gameplayDiv = container.querySelector('.gameplay-screen') as HTMLElement;
  const overlay = container.querySelector('#pause-overlay') as HTMLElement;

  const resize = () => {
    canvas.style.width = `${gameplayDiv.clientWidth}px`;
    canvas.style.height = `${gameplayDiv.clientHeight}px`;
  };
  resize();
  window.addEventListener('resize', resize);

  let resumeCb: (() => void) | null = null;
  let quitSelectCb: (() => void) | null = null;
  let quitTitleCb: (() => void) | null = null;

  container.querySelector('#btn-resume')?.addEventListener('click', () => resumeCb?.());
  container.querySelector('#btn-quit-select')?.addEventListener('click', () => quitSelectCb?.());
  container.querySelector('#btn-quit-title')?.addEventListener('click', () => quitTitleCb?.());

  return {
    canvas,
    showPause: () => { overlay.style.display = 'flex'; },
    hidePause: () => { overlay.style.display = 'none'; },
    onResume: (cb) => { resumeCb = cb; },
    onQuitToSelect: (cb) => { quitSelectCb = cb; },
    onQuitToTitle: (cb) => { quitTitleCb = cb; },
  };
}
