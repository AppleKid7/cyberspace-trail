import './styles.css';
import { GAME_TITLE } from './config.ts';
import type { GameState } from './logic/types.ts';
import { seed } from './logic/types.ts';
import { freshMetaState } from './logic/state.ts';
import { canvasContext, createGameCanvas } from './render/canvas.ts';
import { renderFarmingScene, renderRapidsScene, renderTravelScene } from './render/travelScene.ts';
import { renderScene } from './scenes/ui.ts';
import { LocalStorageSaveStore, maybeAutosave } from './persistence/saveStore.ts';
import { unlockAudio } from './audio/sfx.ts';
import { runFarmingLoop, runRapidsLoop, type MinigameRunner } from './minigames/runner.ts';

document.title = GAME_TITLE;

const saveStore = new LocalStorageSaveStore();
let state: GameState = freshMetaState(Number(seed(Date.now())));
let minigameRunner: MinigameRunner | null = null;

const app = document.querySelector('#app');
if (!app) {
  throw new Error('#app missing');
}

const canvasWrap = document.createElement('div');
canvasWrap.className = 'canvas-wrap';
app.appendChild(canvasWrap);
const canvas = createGameCanvas(canvasWrap);

const uiRoot = document.createElement('div');
uiRoot.className = 'ui-root';
app.appendChild(uiRoot);

const ctx = canvasContext(canvas);

const handlers = {
  getState: () => state,
  setState: (next: GameState) => {
    state = next;
    maybeAutosave(state, saveStore);
    syncMinigame();
    draw();
    renderScene(uiRoot, state, handlers);
  },
  loadSave: () => saveStore.load('main'),
};

function draw(): void {
  if (state.scene === 'farming') {
    renderFarmingScene(ctx, state);
    return;
  }
  if (state.scene === 'rapids') {
    renderRapidsScene(ctx, state);
    return;
  }
  renderTravelScene(ctx, state);
}

function syncMinigame(): void {
  if (minigameRunner) {
    minigameRunner.stop();
    minigameRunner = null;
  }
  if (state.scene === 'farming') {
    minigameRunner = runFarmingLoop(() => state, handlers.setState, canvas);
  }
  if (state.scene === 'rapids') {
    minigameRunner = runRapidsLoop(() => state, handlers.setState, canvas);
  }
}

document.body.addEventListener(
  'pointerdown',
  () => {
    unlockAudio();
  },
  { once: true },
);

draw();
renderScene(uiRoot, state, handlers);
