import { keyConfig, type LaneCountOption, type DifficultyOption } from '../engine/keyConfig';
import { LANE_COLORS } from '../engine/types';

/**
 * 設定画面 — レーン数、キーバインド、タイミングオフセット
 */
export function renderSettingsScreen(
  container: HTMLElement,
  onBack: () => void,
): void {
  render(container, onBack);
}

function render(container: HTMLElement, onBack: () => void): void {
  const laneCount = keyConfig.laneCount;
  const labels = keyConfig.labelsFor(laneCount);
  const offset = keyConfig.timingOffset;
  const defaultDiff = keyConfig.defaultDifficulty;

  const laneRows = Array.from({ length: laneCount }, (_, i) => {
    const color = LANE_COLORS[i] ?? LANE_COLORS[i % LANE_COLORS.length];
    return `
      <div class="key-row" data-lane="${i}">
        <span class="key-lane-num" style="color:${color}">レーン ${i + 1}</span>
        <button class="key-btn" data-lane="${i}" style="border-color:${color}" id="key-btn-${i}">
          ${labels[i]}
        </button>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="screen settings-screen">
      <h2 class="screen-title">設定</h2>

      <div class="settings-section">
        <h3 class="settings-section-title">レーン数</h3>
        <div class="lane-toggle">
          <button class="lane-toggle-btn ${laneCount === 6 ? 'lane-toggle-btn--active' : ''}" id="btn-6lane">6レーン</button>
          <button class="lane-toggle-btn ${laneCount === 7 ? 'lane-toggle-btn--active' : ''}" id="btn-7lane">7レーン</button>
        </div>
      </div>

      <div class="settings-section">
        <h3 class="settings-section-title">キーバインド</h3>
        <div class="key-grid">
          ${laneRows}
        </div>
        <p class="settings-inst" id="settings-inst">
          ボタンをクリックして、新しいキーを押してください
        </p>
      </div>

      <div class="settings-section">
        <h3 class="settings-section-title">タイミング調整</h3>
        <div class="offset-control">
          <input type="range" id="offset-slider" min="-100" max="100" value="${offset}" step="5" />
          <span class="offset-value" id="offset-value">${offset >= 0 ? '+' : ''}${offset}ms</span>
        </div>
        <p class="settings-note">ノーツが早い場合は＋、遅い場合はーに調整</p>
      </div>

      <div class="settings-section">
        <h3 class="settings-section-title">デフォルト難易度</h3>
        <div class="lane-toggle">
          <button class="lane-toggle-btn ${defaultDiff === 'EASY' ? 'lane-toggle-btn--active' : ''}" id="btn-diff-easy">イージー</button>
          <button class="lane-toggle-btn ${defaultDiff === 'NORMAL' ? 'lane-toggle-btn--active' : ''}" id="btn-diff-normal">ノーマル</button>
          <button class="lane-toggle-btn ${defaultDiff === 'HARD' ? 'lane-toggle-btn--active' : ''}" id="btn-diff-hard">ハード</button>
        </div>
      </div>

      <div class="settings-section">
        <h3 class="settings-section-title">画面モード</h3>
        <div class="lane-toggle">
          <button class="lane-toggle-btn ${(localStorage.getItem('rhythmOrientation') || 'auto') === 'auto' ? 'lane-toggle-btn--active' : ''}" id="btn-orient-auto">自動</button>
          <button class="lane-toggle-btn ${localStorage.getItem('rhythmOrientation') === 'landscape' ? 'lane-toggle-btn--active' : ''}" id="btn-orient-landscape">横画面</button>
          <button class="lane-toggle-btn ${localStorage.getItem('rhythmOrientation') === 'portrait' ? 'lane-toggle-btn--active' : ''}" id="btn-orient-portrait">縦画面</button>
        </div>
        <p class="settings-note">横画面はPC・タブレット向け、縦画面はスマホ向け</p>
      </div>

      <div class="settings-actions">
        <button class="btn btn-secondary" id="btn-reset">リセット</button>
        <button class="btn btn-primary" id="btn-back">戻る</button>
      </div>
    </div>
  `;

  // Lane count toggle
  container.querySelector('#btn-6lane')?.addEventListener('click', () => {
    if (keyConfig.laneCount !== 6) {
      keyConfig.setLaneCount(6);
      render(container, onBack);
    }
  });
  container.querySelector('#btn-7lane')?.addEventListener('click', () => {
    if (keyConfig.laneCount !== 7) {
      keyConfig.setLaneCount(7);
      render(container, onBack);
    }
  });

  // Timing offset slider
  const slider = container.querySelector('#offset-slider') as HTMLInputElement;
  const offsetLabel = container.querySelector('#offset-value') as HTMLElement;
  slider?.addEventListener('input', () => {
    const v = parseInt(slider.value);
    keyConfig.setTimingOffset(v);
    offsetLabel.textContent = `${v >= 0 ? '+' : ''}${v}ms`;
  });

  // Key binding
  let listeningLane: number | null = null;

  for (let i = 0; i < laneCount; i++) {
    const btn = container.querySelector(`#key-btn-${i}`) as HTMLButtonElement;
    btn.addEventListener('click', () => {
      container.querySelectorAll('.key-btn').forEach(b => b.classList.remove('key-btn--active'));
      btn.classList.add('key-btn--active');
      listeningLane = i;
      const inst = container.querySelector('#settings-inst') as HTMLElement;
      inst.textContent = `レーン ${i + 1} のキーを押してください…`;
      inst.classList.add('settings-inst--listening');
    });
  }

  const keyHandler = (e: KeyboardEvent) => {
    if (listeningLane === null) return;
    e.preventDefault();

    if (e.key === 'Escape') {
      listeningLane = null;
      container.querySelectorAll('.key-btn').forEach(b => b.classList.remove('key-btn--active'));
      const inst = container.querySelector('#settings-inst') as HTMLElement;
      inst.textContent = 'ボタンをクリックして、新しいキーを押してください';
      inst.classList.remove('settings-inst--listening');
      return;
    }

    const newKey = e.key.length === 1 ? e.key : e.key;
    const success = keyConfig.setKey(listeningLane, newKey, laneCount);

    if (!success) {
      const inst = container.querySelector('#settings-inst') as HTMLElement;
      inst.textContent = `「${newKey.toUpperCase()}」は他のレーンで使用中です`;
      return;
    }

    const btn = container.querySelector(`#key-btn-${listeningLane}`) as HTMLButtonElement;
    btn.textContent = keyConfig.labelsFor(laneCount)[listeningLane];
    btn.classList.remove('key-btn--active');

    listeningLane = null;
    const inst = container.querySelector('#settings-inst') as HTMLElement;
    inst.textContent = 'キーを変更しました';
    inst.classList.remove('settings-inst--listening');
  };
  window.addEventListener('keydown', keyHandler);

  // Default difficulty toggle
  const diffBtns: Array<{ id: string; val: DifficultyOption }> = [
    { id: '#btn-diff-easy', val: 'EASY' },
    { id: '#btn-diff-normal', val: 'NORMAL' },
    { id: '#btn-diff-hard', val: 'HARD' },
  ];
  for (const { id, val } of diffBtns) {
    container.querySelector(id)?.addEventListener('click', () => {
      keyConfig.setDefaultDifficulty(val);
      // Update active state visually
      for (const { id: bid, val: bval } of diffBtns) {
        const b = container.querySelector(bid);
        b?.classList.toggle('lane-toggle-btn--active', bval === val);
      }
    });
  }

  // Orientation mode
  const orientBtns: Array<{ id: string; val: string }> = [
    { id: '#btn-orient-auto', val: 'auto' },
    { id: '#btn-orient-landscape', val: 'landscape' },
    { id: '#btn-orient-portrait', val: 'portrait' },
  ];
  for (const { id, val } of orientBtns) {
    container.querySelector(id)?.addEventListener('click', () => {
      localStorage.setItem('rhythmOrientation', val);
      for (const { id: bid, val: bval } of orientBtns) {
        const b = container.querySelector(bid);
        b?.classList.toggle('lane-toggle-btn--active', bval === val);
      }
      // Apply orientation class to body
      document.body.classList.remove('force-landscape', 'force-portrait');
      if (val === 'landscape') document.body.classList.add('force-landscape');
      else if (val === 'portrait') document.body.classList.add('force-portrait');
    });
  }

  // Reset
  container.querySelector('#btn-reset')?.addEventListener('click', () => {
    keyConfig.resetKeys(laneCount);
    keyConfig.setTimingOffset(0);
    keyConfig.setDefaultDifficulty('NORMAL');
    render(container, onBack);
  });

  // Back
  container.querySelector('#btn-back')?.addEventListener('click', () => {
    window.removeEventListener('keydown', keyHandler);
    onBack();
  });
}
