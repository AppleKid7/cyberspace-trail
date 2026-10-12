import { stepFarming, type FarmingInput } from '../logic/farming.ts';
import { stepRapids, type RapidsInput } from '../logic/rapids.ts';
import type { GameState } from '../logic/types.ts';
import { playSfx } from '../audio/sfx.ts';

export type MinigameRunner = {
  stop: () => void;
};

export function runFarmingLoop(
  getState: () => GameState,
  setState: (s: GameState) => void,
  canvas: HTMLCanvasElement,
): MinigameRunner {
  let lane: 0 | 1 | 2 = 1;
  let reply = false;
  let running = true;
  let last = performance.now();

  const onKey = (e: KeyboardEvent) => {
    if (e.code === 'ArrowLeft') {
      lane = 0;
    }
    if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
      lane = 1;
    }
    if (e.code === 'ArrowRight') {
      lane = 2;
    }
    if (e.code === 'Space') {
      reply = true;
      e.preventDefault();
    }
  };
  const onClick = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    if (x < canvas.width / 3) {
      lane = 0;
    } else if (x < (canvas.width * 2) / 3) {
      lane = 1;
    } else {
      lane = 2;
    }
    reply = true;
  };

  window.addEventListener('keydown', onKey);
  canvas.addEventListener('click', onClick);

  const tick = (now: number) => {
    if (!running) {
      return;
    }
    const dt = now - last;
    last = now;
    const input: FarmingInput = { lane, reply, nowMs: now };
    reply = false;
    const next = stepFarming(getState(), input, dt);
    if (next.farming?.sus && next.farming.sus >= 70 && (getState().farming?.sus ?? 0) < 70) {
      playSfx('ratio_alarm');
    }
    setState(next);
    if (next.scene !== 'farming') {
      running = false;
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  return {
    stop: () => {
      running = false;
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('click', onClick);
    },
  };
}

export function runRapidsLoop(
  getState: () => GameState,
  setState: (s: GameState) => void,
  canvas: HTMLCanvasElement,
): MinigameRunner {
  let steerLeft = false;
  let steerRight = false;
  let running = true;
  let last = performance.now();

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      steerLeft = true;
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      steerRight = true;
    }
  };
  const onKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
      steerLeft = false;
    }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') {
      steerRight = false;
    }
  };

  const pointerSteer = (clientX: number) => {
    const rect = canvas.getBoundingClientRect();
    const mid = rect.left + rect.width / 2;
    steerLeft = clientX < mid;
    steerRight = clientX >= mid;
  };

  const onPointerDown = (e: PointerEvent) => pointerSteer(e.clientX);
  const onPointerMove = (e: PointerEvent) => {
    if (e.buttons) {
      pointerSteer(e.clientX);
    }
  };
  const onPointerUp = () => {
    steerLeft = false;
    steerRight = false;
  };

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerUp);

  const tick = (now: number) => {
    if (!running) {
      return;
    }
    const dt = now - last;
    last = now;
    const input: RapidsInput = { steerLeft, steerRight };
    const next = stepRapids(getState(), input, dt);
    setState(next);
    if (next.scene !== 'rapids') {
      running = false;
      return;
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  return {
    stop: () => {
      running = false;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerUp);
    },
  };
}
