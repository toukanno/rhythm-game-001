import { keyConfig, type LaneCountOption } from '../engine/keyConfig';
import { LANE_COLORS } from '../engine/types';

/**
 * Settings screen — lane count toggle and key binding customisation.
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

  const laneRows = Array.from({ length: laneCount }, (_, i) => {
    const color = LANE_COLORS[i] ?? LANE_COLORS[i % LANE_COLORS.length];
    return `
      <div class="key-row" data-lane="${i}">
        <span class="key-lane-num" style="color:${color}">Lane ${i + 1}</span>
        <button class="key-btn" data-lane="${i}" style="border-color:${color}" id="key-btn-${i}">
          ${labels[i]}
        </button>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div class="screen settings-screen">
      <h2 class="screen-title">SETTINGS</h2>

      <div class="settings-section">
        <h3 class="settings-section-title">レーン数 / Lane Count</h3>
        <div class="lane-toggle">
          <button class="lane-toggle-btn ${laneCount === 6 ? 'lane-toggle-btn--active' : ''}" id="btn-6lane">6 Lanes</button>
          <button class="lane-toggle-btn ${laneCount === 7 ? 'lane-toggle-btn--active' : ''}" id="btn-7lane">7 Lanes</button>
        </div>
        <p class="settings-note">6-lane default: S D F J K L &nbsp;|&nbsp; 7-lane default: A S D F J K L</p>
      </div>

      <div class="settings-section">
        <h3 class="settings-section-title">キーバインド / Key Bindings</h3>
        <div class="key-grid">
          ${laneRows}
        </div>
        <p class="settings-inst" id="settings-inst">
          Click a key button, then press the new key.
        </p>
      </div>

      <div class="settings-actions">
        <button class="btn btn-secondary" id="btn-reset">デフォルトに戻す (Reset)</button>
        <button class="btn btn-primary" id="btn-back">戻る (Back)</button>
      </div>
    </div>
  `;

  // --- Lane count toggle ---
  container.querySelector('#btn-6lane')?.addEventListener('click', () => {
    if (keyConfig.laneCount !== 6) {
      keyConfig.setLaneCount(6);
      render(container, onBack); // re-render with new lane count
    }
  });
  container.querySelector('#btn-7lane')?.addEventListener('click', () => {
    if (keyConfig.laneCount !== 7) {
      keyConfig.setLaneCount(7);
      render(container, onBack);
    }
  });

  // --- Key binding ---
  let listeningLane: number | null = null;

  for (let i = 0; i < laneCount; i++) {
    const btn = container.querySelector(`#key-btn-${i}`) as HTMLButtonElement;
    btn.addEventListener('click', () => {
      container.querySelectorAll('.key-btn').forEach(b => b.classList.remove('key-btn--active'));
      btn.classList.add('key-btn--active');
      listeningLane = i;
      const inst = container.querySelector('#settings-inst') as HTMLElement;
      inst.textContent = `Press a key for Lane ${i + 1}…`;
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
      inst.textContent = 'Click a key button, then press the new key.';
      inst.classList.remove('settings-inst--listening');
      return;
    }

    const newKey = e.key.length === 1 ? e.key : e.key;
    const success = keyConfig.setKey(listeningLane, newKey, laneCount);

    if (!success) {
      const inst = container.querySelector('#settings-inst') as HTMLElement;
      inst.textContent = `"${newKey.toUpperCase()}" is already assigned to another lane.`;
      return;
    }

    const btn = container.querySelector(`#key-btn-${listeningLane}`) as HTMLButtonElement;
    btn.textContent = keyConfig.labelsFor(laneCount)[listeningLane];
    btn.classList.remove('key-btn--active');

    listeningLane = null;
    const inst = container.querySelector('#settings-inst') as HTMLElement;
    inst.textContent = 'Key updated!';
    inst.classList.remove('settings-inst--listening');
  };
  window.addEventListener('keydown', keyHandler);

  // Reset
  container.querySelector('#btn-reset')?.addEventListener('click', () => {
    keyConfig.resetKeys(laneCount);
    const newLabels = keyConfig.labelsFor(laneCount);
    for (let i = 0; i < laneCount; i++) {
      const btn = container.querySelector(`#key-btn-${i}`) as HTMLButtonElement;
      if (btn) btn.textContent = newLabels[i];
    }
    listeningLane = null;
    container.querySelectorAll('.key-btn').forEach(b => b.classList.remove('key-btn--active'));
    const inst = container.querySelector('#settings-inst') as HTMLElement;
    inst.textContent = `Reset to defaults.`;
    inst.classList.remove('settings-inst--listening');
  });

  // Back
  container.querySelector('#btn-back')?.addEventListener('click', () => {
    window.removeEventListener('keydown', keyHandler);
    onBack();
  });
}
