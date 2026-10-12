import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { advanceDay } from '../src/logic/advanceDay.ts';
import { newGame } from '../src/logic/state.ts';
import type { GameState, PlayerClass } from '../src/logic/types.ts';
import { scrolls } from '../src/logic/types.ts';
import { startRapids, stepRapids, takeTollRoad } from '../src/logic/rapids.ts';
import { TRAIL_LENGTH_SCROLLS } from '../src/config.ts';

const RUNS = 1000;
const CLASSES: PlayerClass[] = ['ai_bro', 'tech_bro', 'content_creator'];

function autoResolve(state: GameState): GameState {
  let s = state;
  if (s.scene === 'event') {
    s = { ...s, scene: 'travel', pendingEvent: null };
  }
  if (s.scene === 'landmark') {
    s = { ...s, scene: 'travel', pendingLandmark: null };
  }
  if (s.scene === 'crossing') {
    s = { ...s, scene: 'travel', pendingCrossing: null, supplies: { ...s.supplies, vpnKey: s.supplies.vpnKey + 1 } };
    s = { ...s, scene: 'travel', pendingCrossing: null };
  }
  if (s.scene === 'store') {
    s = { ...s, scene: 'travel', currentStoreRegion: null };
  }
  return s;
}

function simulateRapids(state: GameState, skill: number): boolean {
  let s = startRapids(state);
  for (let i = 0; i < 3000; i++) {
    const steerLeft = skill > 0.5 ? i % 20 < 10 : i % 5 < 2;
    const steerRight = !steerLeft;
    s = stepRapids(s, { steerLeft, steerRight }, 16);
    if (s.scene !== 'rapids') {
      break;
    }
  }
  return s.scene === 'score';
}

function runClass(playerClass: PlayerClass, seedBase: number, skill: number): { reachedX: boolean; cleared: boolean; day: number } {
  let state = newGame(playerClass, ['A', 'B', 'C', 'D', 'E'], 'slow_news', seedBase);
  state.scene = 'travel';
  let reachedX = false;
  for (let step = 0; step < 200; step++) {
    state = autoResolve(state);
    if (state.scene === 'finale_choice') {
      reachedX = true;
      if (playerClass === 'tech_bro' && state.supplies.crypto >= 50) {
        state = takeTollRoad(state);
        return { reachedX, cleared: state.scene === 'score', day: state.day };
      }
      const cleared = simulateRapids(state, skill);
      return { reachedX, cleared, day: state.day };
    }
    if (state.scene === 'travel') {
      state = advanceDay(state).state;
    }
    if (state.distance >= scrolls(TRAIL_LENGTH_SCROLLS - 100)) {
      reachedX = true;
    }
    if (state.scene === 'score' || state.scene === 'suspended') {
      break;
    }
  }
  return { reachedX, cleared: state.scene === 'score', day: state.day };
}

const skillByClass: Record<PlayerClass, number> = {
  ai_bro: 0.35,
  tech_bro: 0.65,
  content_creator: 0.8,
};

const rows: string[] = ['class,run,reached_x,cleared_rapids,day'];

for (const playerClass of CLASSES) {
  let reached = 0;
  let cleared = 0;
  for (let i = 0; i < RUNS; i++) {
    const result = runClass(playerClass, 10_000 + i, skillByClass[playerClass]);
    if (result.reachedX) {
      reached += 1;
    }
    if (result.cleared) {
      cleared += 1;
    }
    rows.push(`${playerClass},${i},${result.reachedX ? 1 : 0},${result.cleared ? 1 : 0},${result.day}`);
  }
  const reachRate = ((reached / RUNS) * 100).toFixed(1);
  const clearRate = ((cleared / RUNS) * 100).toFixed(1);
  console.log(`${playerClass}: reach X ${reachRate}% · clear ${clearRate}%`);
}

const outDir = path.join(import.meta.dir, '..', 'balance');
mkdirSync(outDir, { recursive: true });
const file = path.join(outDir, `results-${Date.now()}.csv`);
writeFileSync(file, rows.join('\n'));
console.log(`Wrote ${file}`);
