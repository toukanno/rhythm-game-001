export function renderGameplayScreen(container: HTMLElement): HTMLCanvasElement {
  container.innerHTML = `
    <div class="screen gameplay-screen">
      <canvas id="game-canvas"></canvas>
      <div class="gameplay-controls">
        <button class="btn-pause" id="btn-pause">❚❚</button>
        <button class="btn-quit-game" id="btn-quit">← 戻る</button>
      </div>
    </div>
  `;

  const canvas = container.querySelector('#game-canvas') as HTMLCanvasElement;
  const gameplayDiv = container.querySelector('.gameplay-screen') as HTMLElement;

  const resize = () => {
    canvas.style.width = `${gameplayDiv.clientWidth}px`;
    canvas.style.height = `${gameplayDiv.clientHeight}px`;
  };
  resize();
  window.addEventListener('resize', resize);

  return canvas;
}
