import { keyConfig } from '../engine/keyConfig';

export function renderLobbyScreen(
  container: HTMLElement,
  onStart: () => void,
  onSettings: () => void,
  onBack: () => void,
): void {
  const diffLabels = ['イージー', 'ノーマル', 'ハード'];
  const currentDiff = keyConfig.defaultDifficulty || 'normal';
  const diffIndex = currentDiff === 'easy' ? 0 : currentDiff === 'hard' ? 2 : 1;

  container.innerHTML = `
    <div class="screen lobby-screen">
      <div class="lobby-header">
        <button class="btn btn-back" id="lobby-back">← 戻る</button>
        <h2 class="lobby-title">🎮 ロビー</h2>
      </div>
      <div class="lobby-content">
        <div class="lobby-section">
          <h3>プレイヤー名</h3>
          <input type="text" class="lobby-input" id="lobby-name" value="${localStorage.getItem('rhythmPlayerName') || 'プレイヤー'}" placeholder="名前を入力">
        </div>

        <div class="lobby-section">
          <h3>デフォルト難易度</h3>
          <div class="lobby-toggle" id="lobby-diff">
            ${diffLabels.map((label, i) => `
              <button class="toggle-btn ${i === diffIndex ? 'active' : ''}" data-diff="${['easy', 'normal', 'hard'][i]}">${label}</button>
            `).join('')}
          </div>
        </div>

        <div class="lobby-section">
          <h3>レーン数</h3>
          <div class="lobby-toggle" id="lobby-lanes">
            <button class="toggle-btn ${keyConfig.laneCount === 6 ? 'active' : ''}" data-lanes="6">6レーン</button>
            <button class="toggle-btn ${keyConfig.laneCount === 7 ? 'active' : ''}" data-lanes="7">7レーン</button>
          </div>
        </div>

        <div class="lobby-section">
          <h3>ノーツ速度</h3>
          <div class="lobby-slider-row">
            <input type="range" class="lobby-slider" id="lobby-speed" min="0.5" max="3.0" step="0.1" value="${localStorage.getItem('rhythmNoteSpeed') || '1.0'}">
            <span class="lobby-slider-value" id="lobby-speed-val">${localStorage.getItem('rhythmNoteSpeed') || '1.0'}x</span>
          </div>
        </div>

        <div class="lobby-section">
          <h3>音量</h3>
          <div class="lobby-slider-row">
            <input type="range" class="lobby-slider" id="lobby-volume" min="0" max="100" step="5" value="${localStorage.getItem('rhythmVolume') || '80'}">
            <span class="lobby-slider-value" id="lobby-volume-val">${localStorage.getItem('rhythmVolume') || '80'}%</span>
          </div>
        </div>

        <div class="lobby-section">
          <h3>タイミングオフセット</h3>
          <div class="lobby-slider-row">
            <input type="range" class="lobby-slider" id="lobby-offset" min="-100" max="100" step="5" value="${keyConfig.timingOffset || 0}">
            <span class="lobby-slider-value" id="lobby-offset-val">${keyConfig.timingOffset || 0}ms</span>
          </div>
        </div>

        <div class="lobby-actions">
          <button class="btn btn-secondary" id="lobby-settings">⚙ 詳細設定</button>
          <button class="btn btn-primary btn-lg pulse" id="lobby-start">🎵 曲を選ぶ</button>
        </div>
      </div>
    </div>
  `;

  // Event listeners
  container.querySelector('#lobby-back')!.addEventListener('click', onBack);
  container.querySelector('#lobby-start')!.addEventListener('click', () => {
    // Save settings
    const name = (container.querySelector('#lobby-name') as HTMLInputElement).value;
    localStorage.setItem('rhythmPlayerName', name);
    onStart();
  });
  container.querySelector('#lobby-settings')!.addEventListener('click', onSettings);

  // Difficulty toggle
  container.querySelectorAll('#lobby-diff .toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('#lobby-diff .toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const diff = (btn as HTMLElement).dataset.diff || 'normal';
      keyConfig.defaultDifficulty = diff;
      keyConfig.save();
    });
  });

  // Lane count toggle
  container.querySelectorAll('#lobby-lanes .toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('#lobby-lanes .toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const lanes = parseInt((btn as HTMLElement).dataset.lanes || '6');
      keyConfig.laneCount = lanes;
      keyConfig.save();
    });
  });

  // Speed slider
  const speedSlider = container.querySelector('#lobby-speed') as HTMLInputElement;
  const speedVal = container.querySelector('#lobby-speed-val')!;
  speedSlider?.addEventListener('input', () => {
    speedVal.textContent = `${speedSlider.value}x`;
    localStorage.setItem('rhythmNoteSpeed', speedSlider.value);
  });

  // Volume slider
  const volSlider = container.querySelector('#lobby-volume') as HTMLInputElement;
  const volVal = container.querySelector('#lobby-volume-val')!;
  volSlider?.addEventListener('input', () => {
    volVal.textContent = `${volSlider.value}%`;
    localStorage.setItem('rhythmVolume', volSlider.value);
  });

  // Offset slider
  const offSlider = container.querySelector('#lobby-offset') as HTMLInputElement;
  const offVal = container.querySelector('#lobby-offset-val')!;
  offSlider?.addEventListener('input', () => {
    offVal.textContent = `${offSlider.value}ms`;
    keyConfig.timingOffset = parseInt(offSlider.value);
    keyConfig.save();
  });
}
