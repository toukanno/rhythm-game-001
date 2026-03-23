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

function createNoteParticles(count: number): string {
  const notes = ['\u266A', '\u266B', '\u2669', '\u266C'];
  let html = '';
  for (let i = 0; i < count; i++) {
    const left = Math.random() * 100;
    const delay = Math.random() * 12;
    const duration = 10 + Math.random() * 8;
    const note = notes[Math.floor(Math.random() * notes.length)];
    const size = 14 + Math.random() * 12;
    html += `<div class="note-particle" style="left:${left}%;animation-delay:${delay}s;animation-duration:${duration}s;font-size:${size}px;">${note}</div>`;
  }
  return html;
}

function createSparkles(count: number): string {
  let html = '';
  for (let i = 0; i < count; i++) {
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const delay = Math.random() * 4;
    const duration = 1.5 + Math.random() * 2;
    const size = 3 + Math.random() * 4;
    html += `<div class="sparkle" style="left:${left}%;top:${top}%;animation-delay:${delay}s;animation-duration:${duration}s;width:${size}px;height:${size}px;"></div>`;
  }
  return html;
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
      <div class="star-bg">${createStarParticles(40)}${createNoteParticles(10)}${createSparkles(15)}</div>
      <div class="title-content">
        <h1 class="title-logo">
          <span class="title-star">\u2605</span>
          <span class="title-text">Rhythm<br>Striker</span>
          <span class="title-star">\u2605</span>
        </h1>
        <p class="title-subtitle">Girls Band Party!</p>
        <p class="title-sub">${keyConfig.laneCount}\u30EC\u30FC\u30F3 \u30EA\u30BA\u30E0\u30B2\u30FC\u30E0</p>
        <button class="btn btn-primary pulse" id="btn-start">\u30B9\u30BF\u30FC\u30C8</button>
        <p class="title-hint">\u30AD\u30FC\u30DC\u30FC\u30C9: ${keyHint}</p>
        <button class="btn btn-secondary btn-settings" id="btn-settings">\u8A2D\u5B9A</button>
        <p class="title-version">v1.0 \u2022 ${keyConfig.laneCount} Lanes</p>
        <p class="title-credit">\u697D\u66F2\u63D0\u4F9B: <a href="https://www.tandess.com/music/" target="_blank">Tandess / Trial &amp; Error</a></p>
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
