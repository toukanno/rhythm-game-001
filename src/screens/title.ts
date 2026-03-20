import { keyConfig } from '../engine/keyConfig';

/**
 * タイトル画面
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
        <p class="title-sub">${keyConfig.laneCount}レーン リズムゲーム</p>
        <button class="btn btn-primary pulse" id="btn-start">スタート</button>
        <p class="title-hint">キーボード: ${keyHint}</p>
        <button class="btn btn-secondary btn-settings" id="btn-settings">設定</button>
        <p class="title-credit">楽曲提供: <a href="https://www.tandess.com/music/" target="_blank">Tandess / Trial &amp; Error</a></p>
      </div>
    </div>
  `;

  container.querySelector('#btn-start')!.addEventListener('click', onStart);
  container.querySelector('#btn-settings')!.addEventListener('click', onSettings);

  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      window.removeEventListener('keydown', handler);
      onStart();
    }
  };
  window.addEventListener('keydown', handler);
}
