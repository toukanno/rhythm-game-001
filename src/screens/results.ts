import type { GameState, Judgment } from '../engine/types';
import { JUDGMENT_LABELS, JUDGMENT_COLORS, ALL_JUDGMENTS } from '../engine/types';

function getRank(state: GameState): { rank: string; stars: number } {
  const total = Object.values(state.judgments).reduce((a, b) => a + b, 0);
  if (total === 0) return { rank: 'D', stars: 0 };
  const topRate = (state.judgments.marvelous + state.judgments.perfect + state.judgments.great) / total;
  const lateCount = state.judgments.late;
  if (lateCount === 0 && topRate >= 0.98) return { rank: 'SS', stars: 5 };
  if (lateCount === 0 && topRate >= 0.9) return { rank: 'S', stars: 4 };
  if (topRate >= 0.85) return { rank: 'A', stars: 3 };
  if (topRate >= 0.7) return { rank: 'B', stars: 2 };
  if (topRate >= 0.5) return { rank: 'C', stars: 1 };
  return { rank: 'D', stars: 0 };
}

export function renderResultsScreen(
  container: HTMLElement,
  state: GameState,
  songTitle: string,
  onRetry: () => void,
  onBack: () => void,
): void {
  const { rank, stars } = getRank(state);
  const total = Object.values(state.judgments).reduce((a, b) => a + b, 0);
  const starDisplay = '\u2605'.repeat(stars) + '\u2606'.repeat(5 - stars);

  // Check for Full Combo / All Perfect
  const missCount = state.judgments.bad + state.judgments.safe + state.judgments.late;
  const isFullCombo = missCount === 0 && total > 0;
  const isAllPerfect = isFullCombo && state.judgments.good === 0 && state.judgments.great === 0;

  let bannerHtml = '';
  if (isAllPerfect) {
    bannerHtml = '<div class="result-banner result-banner--ap">ALL PERFECT</div>';
  } else if (isFullCombo) {
    bannerHtml = '<div class="result-banner result-banner--fc">FULL COMBO</div>';
  }

  const judgmentRows = ALL_JUDGMENTS
    .map(j => {
      const count = state.judgments[j];
      const pct = total > 0 ? (count / total) * 100 : 0;
      return `
      <div class="result-judgment">
        <div class="rj-bar" style="width:${pct}%;background:${JUDGMENT_COLORS[j]}"></div>
        <span class="rj-label" style="color:${JUDGMENT_COLORS[j]}">${JUDGMENT_LABELS[j]}</span>
        <span class="rj-count">${count}</span>
      </div>
    `;
    }).join('');

  container.innerHTML = `
    <div class="screen results-screen">
      <h2 class="screen-title">\u30EA\u30B6\u30EB\u30C8</h2>
      <p class="result-song">${songTitle}</p>

      <div class="result-rank rank-${rank.toLowerCase()}">${rank}</div>
      <div class="result-stars">${starDisplay}</div>

      ${bannerHtml}

      <div class="result-score">${state.score.toLocaleString()}</div>
      <p class="result-label">\u30B9\u30B3\u30A2</p>

      <div class="result-stats">
        <div class="result-stat">
          <span class="stat-val">${state.maxCombo}</span>
          <span class="stat-label">\u6700\u5927\u30B3\u30F3\u30DC</span>
        </div>
        <div class="result-stat">
          <span class="stat-val">${total}</span>
          <span class="stat-label">\u7DCF\u30CE\u30FC\u30C4</span>
        </div>
      </div>

      <div class="result-judgments">
        ${judgmentRows}
      </div>

      <div class="result-actions">
        <button class="btn btn-primary" id="btn-retry">\u3082\u3046\u4E00\u5EA6</button>
        <button class="btn btn-secondary" id="btn-back">\u66F2\u9078\u629E\u3078</button>
      </div>
    </div>
  `;

  container.querySelector('#btn-retry')?.addEventListener('click', onRetry);
  container.querySelector('#btn-back')?.addEventListener('click', onBack);
}
