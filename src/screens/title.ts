import { keyConfig } from '../engine/keyConfig';

function createParticles(count: number): string {
  const notes = ['♪', '♫', '♩', '♬', '★', '✦'];
  let html = '';
  for (let i = 0; i < count; i++) {
    const left = Math.random() * 100;
    const delay = Math.random() * 10;
    const duration = 8 + Math.random() * 10;
    const char = notes[Math.floor(Math.random() * notes.length)];
    const size = 10 + Math.random() * 16;
    const opacity = 0.15 + Math.random() * 0.25;
    html += `<div class="float-particle" style="left:${left}%;animation-delay:${delay}s;animation-duration:${duration}s;font-size:${size}px;opacity:${opacity};">${char}</div>`;
  }
  return html;
}

export function renderTitleScreen(
  container: HTMLElement,
  onStart: () => void,
  onSettings: () => void,
): void {
  container.innerHTML = `
    <div class="screen title-screen liminality-home">
      <!-- Nav bar -->
      <nav class="home-nav">
        <div class="home-nav-logo">Rhythm Striker</div>
        <div class="home-nav-links">
          <a href="#" id="nav-play" class="nav-link active">プレイ</a>
          <a href="#" id="nav-songs" class="nav-link">楽曲リスト</a>
          <a href="#" id="nav-settings" class="nav-link">設定</a>
        </div>
      </nav>

      <!-- Hero section -->
      <div class="home-hero">
        <div class="hero-bg"></div>
        <div class="hero-particles">${createParticles(25)}</div>
        <div class="hero-content">
          <h1 class="hero-title">
            <span class="hero-title-main">Rhythm Striker</span>
            <span class="hero-title-sub">リズムストライカー</span>
          </h1>
          <p class="hero-tagline">音楽に合わせて、リズムを刻もう</p>
          <div class="hero-actions">
            <button class="btn btn-hero-primary" id="btn-start">
              <span class="btn-icon">▶</span>
              <span>ゲームスタート</span>
            </button>
          </div>
          <div class="hero-info">
            <div class="hero-info-item">
              <span class="hero-info-number">${keyConfig.laneCount}</span>
              <span class="hero-info-label">レーン</span>
            </div>
            <div class="hero-info-divider"></div>
            <div class="hero-info-item">
              <span class="hero-info-number">200+</span>
              <span class="hero-info-label">楽曲</span>
            </div>
            <div class="hero-info-divider"></div>
            <div class="hero-info-item">
              <span class="hero-info-number">3</span>
              <span class="hero-info-label">難易度</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="home-footer">
        <p>楽曲提供: <a href="https://www.tandess.com/music/" target="_blank">Tandess</a> / <a href="https://maou.audio/" target="_blank">魔王魂</a></p>
        <p class="home-footer-version">v2.0 • キーボード: ${keyConfig.labels.join(' ')}</p>
      </div>
    </div>
  `;

  container.querySelector('#btn-start')!.addEventListener('click', onStart);
  container.querySelector('#nav-play')!.addEventListener('click', (e) => { e.preventDefault(); onStart(); });
  container.querySelector('#nav-songs')!.addEventListener('click', (e) => { e.preventDefault(); onStart(); });
  container.querySelector('#nav-settings')!.addEventListener('click', (e) => { e.preventDefault(); onSettings(); });

  const handler = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      window.removeEventListener('keydown', handler);
      onStart();
    }
  };
  window.addEventListener('keydown', handler);
}
