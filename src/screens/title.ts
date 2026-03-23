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
        <!-- Mascot character -->
        <div class="title-mascot">
          <svg width="120" height="160" viewBox="0 0 120 160" xmlns="http://www.w3.org/2000/svg">
            <!-- Hair -->
            <ellipse cx="60" cy="45" rx="38" ry="40" fill="#FFB6C1"/>
            <ellipse cx="25" cy="55" rx="12" ry="30" fill="#FFB6C1"/>
            <ellipse cx="95" cy="55" rx="12" ry="30" fill="#FFB6C1"/>
            <path d="M22 45 Q30 20 60 10 Q90 20 98 45" fill="#FF69B4"/>
            <!-- Face -->
            <ellipse cx="60" cy="48" rx="30" ry="28" fill="#FFF0E8"/>
            <!-- Eyes -->
            <ellipse cx="47" cy="47" rx="7" ry="8" fill="#8B5CF6"/>
            <ellipse cx="73" cy="47" rx="7" ry="8" fill="#8B5CF6"/>
            <ellipse cx="49" cy="45" rx="3" ry="3.5" fill="#fff"/>
            <ellipse cx="75" cy="45" rx="3" ry="3.5" fill="#fff"/>
            <!-- Blush -->
            <ellipse cx="38" cy="56" rx="6" ry="3" fill="#FFB6C1" opacity="0.6"/>
            <ellipse cx="82" cy="56" rx="6" ry="3" fill="#FFB6C1" opacity="0.6"/>
            <!-- Mouth -->
            <path d="M53 60 Q60 66 67 60" stroke="#FF69B4" stroke-width="1.5" fill="none"/>
            <!-- Hair accessories -->
            <circle cx="30" cy="28" r="5" fill="#FFD700"/>
            <circle cx="90" cy="28" r="5" fill="#FFD700"/>
            <text x="28" y="31" font-size="6" fill="#fff" text-anchor="middle">\u2605</text>
            <text x="88" y="31" font-size="6" fill="#fff" text-anchor="middle">\u2605</text>
            <!-- Body -->
            <path d="M40 75 Q60 72 80 75 L85 120 Q60 125 35 120 Z" fill="#FF69B4"/>
            <path d="M40 75 Q60 72 80 75 L75 95 Q60 98 45 95 Z" fill="#FF87C0"/>
            <!-- Guitar -->
            <ellipse cx="85" cy="105" rx="15" ry="10" fill="#8B5CF6" transform="rotate(-15 85 105)"/>
            <rect x="83" y="80" width="4" height="30" rx="2" fill="#7C4DFF" transform="rotate(-15 85 95)"/>
            <!-- Arms -->
            <path d="M40 80 Q25 95 30 110" stroke="#FFF0E8" stroke-width="6" fill="none" stroke-linecap="round"/>
            <path d="M80 80 Q90 90 85 100" stroke="#FFF0E8" stroke-width="6" fill="none" stroke-linecap="round"/>
            <!-- Skirt -->
            <path d="M35 118 Q60 130 85 118 L90 145 Q60 155 30 145 Z" fill="#8B5CF6"/>
            <!-- Legs -->
            <line x1="45" y1="142" x2="42" y2="158" stroke="#FFF0E8" stroke-width="5" stroke-linecap="round"/>
            <line x1="75" y1="142" x2="78" y2="158" stroke="#FFF0E8" stroke-width="5" stroke-linecap="round"/>
          </svg>
        </div>
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
