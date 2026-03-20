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
  const starDisplay = '★'.repeat(stars) + '☆'.repeat(5 - stars);

  const judgmentRows = ALL_JUDGMENTS
    .map(j => `
      <div class="result-judgment">
        <span class="rj-label" style="color:${JUDGMENT_COLORS[j]}">${JUDGMENT_LABELS[j]}</span>
        <span class="rj-count">${state.judgments[j]}</span>
      </div>
    `).join('');

  container.innerHTML = `
    <div class="screen results-screen">
      <h2 class="screen-title">リザルト</h2>
      <p class="result-song">${songTitle}</p>

      <div class="result-rank rank-${rank.toLowerCase()}">${rank}</div>
      <div class="result-stars">${starDisplay}</div>

      <div class="result-score">${state.score.toLocaleString()}</div>
      <p class="result-label">スコア</p>

      <div class="result-stats">
        <div class="result-stat">
          <span class="stat-val">${state.maxCombo}</span>
          <span class="stat-label">最大コンボ</span>
        </div>
        <div class="result-stat">
          <span class="stat-val">${total}</span>
          <span class="stat-label">総ノーツ</span>
        </div>
      </div>

      <div class="result-judgments">
        ${judgmentRows}
      </div>

      <div class="result-actions">
        <button class="btn btn-primary" id="btn-retry">もう一度</button>
        <button class="btn btn-secondary" id="btn-back">曲選択へ</button>
      </div>
    </div>
  `;

  container.querySelector('#btn-retry')?.addEventListener('click', onRetry);
  container.querySelector('#btn-back')?.addEventListener('click', onBack);
}
