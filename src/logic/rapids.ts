import { CLASS_RAPIDS, FINALE_TOLL_ATTENTION, FINALE_TOLL_CRYPTO, RAPIDS_ROUND_MS } from './balance.ts';
import { mulberry32, randomInt } from './rng.ts';
import type { GameState, PlayerClass, RapidsObstacle, RapidsSession } from './types.ts';
import { crypto, health, scrolls } from './types.ts';
import { TRAIL_LENGTH_SCROLLS } from '../config.ts';

export function startRapids(state: GameState): GameState {
  const session: RapidsSession = {
    elapsedMs: 0,
    x: 140,
    hits: 0,
    cleanStreakMs: 0,
    ended: false,
    capsize: false,
    obstacles: [],
  };
  return { ...state, scene: 'rapids', rapids: session };
}

export interface RapidsInput {
  steerLeft: boolean;
  steerRight: boolean;
}

function spawnObstacle(state: GameState, session: RapidsSession): { session: RapidsSession; rng: number } {
  const playerClass = state.playerClass ?? 'tech_bro';
  const cfg = CLASS_RAPIDS[playerClass];
  const roll = mulberry32(state.rngState);
  const kinds: RapidsObstacle['kind'][] = ['rage_bait', 'bot_swarm', 'trending_whirlpool'];
  const kind = kinds[Math.floor(roll.value * kinds.length)] ?? 'rage_bait';
  const xRoll = randomInt(roll.next, 40, 240);
  const telegraph = cfg.telegraphMs > 0 ? session.elapsedMs + cfg.telegraphMs : 0;
  const obs: RapidsObstacle = {
    id: session.obstacles.length + 1,
    x: xRoll.value,
    y: 0,
    kind,
    telegraphUntilMs: telegraph,
  };
  return {
    session: { ...session, obstacles: [...session.obstacles, obs] },
    rng: xRoll.next,
  };
}

export function stepRapids(state: GameState, input: RapidsInput, dtMs: number): GameState {
  let session = state.rapids;
  if (!session) {
    return state;
  }
  if (session.ended) {
    return finishRapids(state);
  }
  let rng = state.rngState;
  const playerClass = state.playerClass ?? 'tech_bro';
  const cfg = CLASS_RAPIDS[playerClass];

  session = { ...session, elapsedMs: session.elapsedMs + dtMs };

  let x = session.x;
  if (input.steerLeft) {
    x -= dtMs * 0.15;
  }
  if (input.steerRight) {
    x += dtMs * 0.15;
  }
  x = Math.max(20, Math.min(260, x));
  session = { ...session, x };

  const spawnInterval = 1200 / cfg.densityMult;
  if (session.elapsedMs % spawnInterval < dtMs) {
    const spawned = spawnObstacle({ ...state, rngState: rng }, session);
    session = spawned.session;
    rng = spawned.rng;
  }

  let hitThisFrame = false;
  const raftX = session.x;
  session = {
    ...session,
    obstacles: session.obstacles
      .map((o) => ({ ...o, y: o.y + dtMs * 0.12 }))
      .filter((o) => {
        if (o.y > 170 && o.y < 190 && Math.abs(o.x - raftX) < 18) {
          hitThisFrame = true;
          return false;
        }
        return o.y < 220;
      }),
  };

  if (hitThisFrame) {
    session = { ...session, hits: session.hits + 1, cleanStreakMs: 0 };
  } else {
    session = { ...session, cleanStreakMs: session.cleanStreakMs + dtMs };
  }

  if (session.hits >= cfg.hitsToCapsize) {
    session = { ...session, ended: true, capsize: true };
  } else if (session.elapsedMs >= RAPIDS_ROUND_MS) {
    session = { ...session, ended: true };
  }

  if (session.ended) {
    return finishRapids({ ...state, rngState: rng, rapids: session });
  }

  return { ...state, rngState: rng, rapids: session };
}

function finishRapids(state: GameState): GameState {
  const session = state.rapids;
  if (!session) {
    return state;
  }
  if (session.capsize) {
    const alive = state.party.filter((m) => m.alive);
    const roll = mulberry32(state.rngState);
    const victim = alive[Math.floor(roll.value * alive.length)];
    const party = state.party.map((m) =>
      m.name === victim?.name ? { ...m, alive: false, health: health(0) } : m,
    );
    return {
      ...state,
      rngState: roll.next,
      party,
      rapids: null,
      scene: state.party.filter((m) => m.alive).length > 0 ? 'travel' : 'suspended',
      messages: [...state.messages, 'Capsized in the Feed Rapids!'],
    };
  }
  const heal = session.cleanStreakMs > 5000 ? 10 : 5;
  const party = state.party.map((m) =>
    m.alive ? { ...m, health: health(m.health + heal) } : m,
  );
  return {
    ...state,
    party,
    rapids: null,
    distance: scrolls(TRAIL_LENGTH_SCROLLS),
    scene: 'score',
    messages: [...state.messages, 'Logged Off Valley reached!'],
  };
}

export function takeTollRoad(state: GameState): GameState {
  const playerClass = state.playerClass ?? 'tech_bro';
  const cfg = CLASS_RAPIDS[playerClass];
  if (!cfg.tollAllowed) {
    return {
      ...state,
      messages: [...state.messages, 'Prove-you-are-human check failed. Toll road blocked.'],
    };
  }
  if (state.supplies.crypto < FINALE_TOLL_CRYPTO || state.supplies.attentionSpan < FINALE_TOLL_ATTENTION) {
    return { ...state, messages: [...state.messages, 'Cannot afford Premium Toll Road.'] };
  }
  return {
    ...state,
    supplies: {
      ...state.supplies,
      crypto: crypto(state.supplies.crypto - FINALE_TOLL_CRYPTO),
      attentionSpan: state.supplies.attentionSpan - FINALE_TOLL_ATTENTION,
    },
    tollRoadTaken: true,
    distance: scrolls(TRAIL_LENGTH_SCROLLS),
    scene: 'score',
    messages: [...state.messages, 'Premium Toll Road: safe arrival.'],
  };
}
