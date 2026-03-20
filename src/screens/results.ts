import type { GameState, Judgment } from '../engine/types';
import { JUDGMENT_LABELS } from '../engine/types';

function getRank(state: GameState): string {
  const total = Object.values(state.judgments).reduce((a, b) => a + b, 0);
  if (total === 0) return 'D';
  const perfRate = (state.judgments.perfect + state.judgments.great) / total;
  if (state.judgments.miss === 0 && perfRate >= 0.95) return 'S';
  if (perfRate >= 0.9) return 'A';
  if (perfRate >= 0.8) return 'B';
  if (perfRate >= 0.6) return 'C';
  return 'D';
}

export function renderResultsScreen(
  container: HTMLElement,
  state: GameState,
  songTitle: string,
  onRetry: () => void,
  onBack: () => void,
): void {
  const rank = getRank(state);
  const total = Object.values(state.judgments).reduce((a, b) => a + b, 0);

  const judgmentRows = (['perfect', 'great', 'good', 'bad', 'miss'] as Judgment[])
    .map(j => `
      <div class="result-judgment">
        <span class="rj-label ${j}">${JUDGMENT_LABELS[j]}</span>
        <span class="rj-count">${state.judgments[j]}</span>
      </div>
    `).join('');

  container.innerHTML = `
    <div class="screen results-screen">
      <h2 class="screen-title">リザルト</h2>
      <p class="result-song">${songTitle}</p>

      <div class="result-rank rank-${rank.toLowerCase()}">${rank}</div>

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
