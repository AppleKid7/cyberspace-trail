import { describe, expect, test } from 'bun:test';
import { advanceDay } from '../src/logic/advanceDay.ts';
import { computeScore, titleTier } from '../src/logic/score.ts';
import { newGame } from '../src/logic/state.ts';
import { deserializeSave, serializeSave } from '../src/logic/serialize.ts';
import { startFarming, stepFarming } from '../src/logic/farming.ts';
import { startRapids, stepRapids, takeTollRoad } from '../src/logic/rapids.ts';
import type { GameState } from '../src/logic/types.ts';
import { health, scrolls } from '../src/logic/types.ts';

describe('determinism', () => {
  test('same seed produces same first travel day vibe sequence', () => {
    const a = newGame('tech_bro', ['A', 'B', 'C', 'D', 'E'], 'slow_news', 42);
    const b = newGame('tech_bro', ['A', 'B', 'C', 'D', 'E'], 'slow_news', 42);
    let sa: GameState = { ...a, scene: 'travel' };
    let sb: GameState = { ...b, scene: 'travel' };
    for (let i = 0; i < 5; i++) {
      sa = advanceDay(sa).state;
      sb = advanceDay(sb).state;
    }
    expect(sa.day).toBe(sb.day);
    expect(sa.distance).toBe(sb.distance);
    expect(sa.rngState).toBe(sb.rngState);
  });
});

describe('scoring', () => {
  test('content creator multiplier increases score', () => {
    const base = newGame('content_creator', ['A', 'B', 'C', 'D', 'E'], 'slow_news', 1);
    base.scene = 'score';
    base.distance = scrolls(2000);
    const score = computeScore(base);
    expect(score).toBeGreaterThan(1000);
    expect(titleTier(score)).toBeTruthy();
  });
});

describe('save round-trip', () => {
  test('serialize and deserialize preserves version', () => {
    const game = newGame('ai_bro', ['A', 'B', 'C', 'D', 'E'], 'meme_season', 99);
    game.scene = 'travel';
    const json = serializeSave(game);
    const loaded = deserializeSave(json);
    expect(loaded?.seed).toBe(game.seed);
    expect(loaded?.party.length).toBe(5);
    expect(loaded?.supplies.crypto).toBe(game.supplies.crypto);
  });

  test('rejects invalid save version', () => {
    const loaded = deserializeSave(JSON.stringify({ version: 2, state: {} }));
    expect(loaded).toBe(null);
  });
});

describe('minigames', () => {
  test('farming ends after duration', () => {
    let state = newGame('tech_bro', ['A', 'B', 'C', 'D', 'E'], 'slow_news', 7);
    state.scene = 'travel';
    state = startFarming(state);
    for (let i = 0; i < 200; i++) {
      state = stepFarming(state, { lane: 1, reply: false, nowMs: i * 200 }, 200);
    }
    expect(state.scene).toBe('travel');
  });

  test('ai bro cannot take toll road', () => {
    const state = newGame('ai_bro', ['A', 'B', 'C', 'D', 'E'], 'slow_news', 3);
    state.scene = 'finale_choice';
    const next = takeTollRoad(state);
    expect(next.scene).not.toBe('score');
  });

  test('rapids capsizes after hit limit for ai bro', () => {
    let state = newGame('ai_bro', ['A', 'B', 'C', 'D', 'E'], 'slow_news', 11);
    state = startRapids(state);
    state.rapids = {
      elapsedMs: 0,
      x: 140,
      hits: 2,
      cleanStreakMs: 0,
      ended: true,
      capsize: true,
      obstacles: [],
    };
    state = stepRapids(state, { steerLeft: false, steerRight: false }, 16);
    expect(state.messages.some((m) => m.includes('Capsized'))).toBe(true);
  });
});

describe('health constructor', () => {
  test('clamps health', () => {
    expect(Number(health(150))).toBe(100);
    expect(Number(health(-3))).toBe(0);
  });
});

describe('smoke simulation', () => {
  test('bot travel reaches increasing distance', () => {
    let state = newGame('tech_bro', ['A', 'B', 'C', 'D', 'E'], 'slow_news', 12345);
    state.scene = 'travel';
    let maxDist = 0;
    for (let i = 0; i < 80 && state.scene === 'travel'; i++) {
      if (state.pendingEvent) {
        state = { ...state, scene: 'travel', pendingEvent: null };
      }
      if (state.scene === 'landmark') {
        state = { ...state, scene: 'travel', pendingLandmark: null };
      }
      if (state.scene === 'crossing') {
        state = { ...state, scene: 'travel', pendingCrossing: null };
      }
      if (state.scene === 'store') {
        state = { ...state, scene: 'travel', currentStoreRegion: null };
      }
      const result = advanceDay(state);
      state = result.state;
      maxDist = Math.max(maxDist, state.distance);
    }
    expect(maxDist).toBeGreaterThan(40);
  });
});
