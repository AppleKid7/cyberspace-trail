import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../config.ts';

export function createGameCanvas(container: HTMLElement): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  canvas.className = 'game-canvas';
  canvas.setAttribute('aria-label', 'Cyberspace Trail pixel view');
  container.prepend(canvas);
  fitCanvas(canvas);
  window.addEventListener('resize', () => fitCanvas(canvas));
  return canvas;
}

export function fitCanvas(canvas: HTMLCanvasElement): void {
  const maxW = window.innerWidth - 24;
  const maxH = window.innerHeight * 0.45;
  const scaleX = Math.floor(maxW / CANVAS_WIDTH);
  const scaleY = Math.floor(maxH / CANVAS_HEIGHT);
  const scale = Math.max(1, Math.min(scaleX, scaleY, 4));
  canvas.style.width = `${CANVAS_WIDTH * scale}px`;
  canvas.style.height = `${CANVAS_HEIGHT * scale}px`;
}

export function canvasContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2d context unavailable');
  }
  ctx.imageSmoothingEnabled = false;
  return ctx;
}
