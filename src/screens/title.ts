import { keyConfig } from '../engine/keyConfig';

function createStarParticles(count: number): string {
  let stars = '';
  for (let i = 0; i < count; i++) {
    const left = Math.random() * 100;
    const delay = Math.random() * 8;
    const duration = 6 + Math.random() * 6;
    const size = 2 + Math.random() * 4;
    stars += `<div class="star" style="left:${left}%;animation-delay:${delay}s;animation-duration:${duration}s;width:${size}px;height:${size}px;"></div>`;
  }
  return stars;
}

export function renderTitleScreen(
  container: HTMLElement,
  onStart: () => void,
  onSettings: () => void,
): void {
  const keyHint = keyConfig.labels.join(' ');

  container.innerHTML = `
    <div class="screen title-screen">
      <div class="title-bg"></div>
      <div class="star-bg">${createStarParticles(30)}</div>
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
