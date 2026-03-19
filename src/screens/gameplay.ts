/**
 * Sets up the gameplay screen DOM (just the canvas container).
 * The actual Game engine handles the canvas rendering.
 */
export function renderGameplayScreen(container: HTMLElement): HTMLCanvasElement {
  container.innerHTML = `
    <div class="screen gameplay-screen">
      <canvas id="game-canvas"></canvas>
      <button class="btn-pause" id="btn-pause">❚❚</button>
    </div>
  `;

  const canvas = container.querySelector('#game-canvas') as HTMLCanvasElement;
  const gameplayDiv = container.querySelector('.gameplay-screen') as HTMLElement;

  // Fill the screen
  const resize = () => {
    canvas.style.width = `${gameplayDiv.clientWidth}px`;
    canvas.style.height = `${gameplayDiv.clientHeight}px`;
  };
  resize();
  window.addEventListener('resize', resize);

  return canvas;
}
