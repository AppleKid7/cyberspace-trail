import {
  CLASS_CONFIG,
  CONTENT_SKILL_FARMING_MULT,
  FARMING_MAX_HAUL,
  FARMING_MAX_PER_REGION,
  FARMING_ROUND_MS,
} from './balance.ts';
import { mulberry32, randomInt } from './rng.ts';
import type { FarmingPost, FarmingSession, GameState, PlayerClass } from './types.ts';
import { health } from './types.ts';

const POST_STATS = {
  cat: { yield: 5, sus: 0, weight: 40 },
  meme: { yield: 10, sus: 2, weight: 35 },
  hot_take: { yield: 20, sus: 5, weight: 15 },
  ai_topic: { yield: 40, sus: 20, weight: 10 },
} as const;

export function canStartFarming(state: GameState): boolean {
  if (state.scene !== 'travel') {
    return false;
  }
  if (state.farmsThisRegion >= FARMING_MAX_PER_REGION) {
    return false;
  }
  if (state.party.some((m) => m.alive && m.ailment === 'carpal_tunnel')) {
    return false;
  }
  return state.supplies.hotTakePacks > 0;
}

export function startFarming(state: GameState): GameState {
  if (!canStartFarming(state)) {
    return state;
  }
  const session: FarmingSession = {
    elapsedMs: 0,
    sus: 0,
    haul: 0,
    hotTakesSpent: 0,
    lastReplyMs: -1000,
    ended: false,
    failedRatio: false,
    posts: [],
  };
  return {
    ...state,
    scene: 'farming',
    farming: session,
    supplies: { ...state.supplies, hotTakePacks: state.supplies.hotTakePacks - 1 },
    consecutiveFarmDays: state.consecutiveFarmDays + 1,
  };
}

function spawnPost(state: GameState, session: FarmingSession): { session: FarmingSession; rng: number } {
  const progress = session.elapsedMs / FARMING_ROUND_MS;
  const kinds = Object.keys(POST_STATS) as (keyof typeof POST_STATS)[];
  const weights = kinds.map((k) => {
    let w = POST_STATS[k].weight;
    if (k === 'ai_topic') {
      w += Math.floor(progress * 30);
    }
    return { k, weight: w };
  });
  let total = 0;
  for (const w of weights) {
    total += w.weight;
  }
  const roll = mulberry32(state.rngState);
  let target = roll.value * total;
  let kind: keyof typeof POST_STATS = 'cat';
  for (const w of weights) {
    target -= w.weight;
    if (target <= 0) {
      kind = w.k;
      break;
    }
  }
  const laneRoll = randomInt(roll.next, 0, 2);
  const post: FarmingPost = {
    id: session.posts.length + 1,
    lane: laneRoll.value as 0 | 1 | 2,
    y: 0,
    kind,
    hit: false,
  };
  return {
    session: { ...session, posts: [...session.posts, post] },
    rng: laneRoll.next,
  };
}

export interface FarmingInput {
  lane: 0 | 1 | 2;
  reply: boolean;
  nowMs: number;
}

export function stepFarming(
  state: GameState,
  input: FarmingInput,
  dtMs: number,
): GameState {
  let session = state.farming;
  if (!session) {
    return state;
  }
  if (session.ended) {
    return finishFarming(state);
  }
  let rng = state.rngState;
  session = { ...session, elapsedMs: session.elapsedMs + dtMs };

  session.sus = Math.max(0, session.sus - (5 * dtMs) / 1000);

  if (session.elapsedMs % 800 < dtMs) {
    const spawned = spawnPost({ ...state, rngState: rng }, session);
    session = spawned.session;
    rng = spawned.rng;
  }

  session = {
    ...session,
    posts: session.posts
      .map((p) => ({ ...p, y: p.y + dtMs * 0.08 }))
      .filter((p) => p.y < 200 && !p.hit),
  };

  if (input.reply) {
    const playerClass = state.playerClass ?? 'tech_bro';
    const susMult = CLASS_CONFIG[playerClass].susMultiplier;
    const spam = input.nowMs - session.lastReplyMs < 400;
    const target = session.posts.find((p) => p.lane === input.lane && p.y > 140 && p.y < 175);
    if (target) {
      const stats = POST_STATS[target.kind];
      session.haul += stats.yield;
      session.sus += stats.sus * susMult;
      session.hotTakesSpent += 1;
      session.posts = session.posts.map((p) => (p.id === target.id ? { ...p, hit: true } : p));
    } else {
      session.sus += 2;
    }
    if (spam) {
      session.sus += 4;
    }
    session.lastReplyMs = input.nowMs;
  }

  if (session.sus >= 100) {
    session = { ...session, ended: true, failedRatio: true };
  } else if (session.elapsedMs >= FARMING_ROUND_MS) {
    session = { ...session, ended: true };
  }

  if (session.ended) {
    return finishFarming({ ...state, rngState: rng, farming: session });
  }

  return { ...state, rngState: rng, farming: session };
}

function finishFarming(state: GameState): GameState {
  const session = state.farming;
  if (!session) {
    return state;
  }
  const playerClass = state.playerClass ?? 'tech_bro';
  let haul = session.haul;
  if (session.failedRatio) {
    haul = 0;
    const alive = state.party.filter((m) => m.alive && !m.ailment);
    const victim = alive[0];
    if (victim) {
      victim.ailment = 'got_ratioed';
    }
    return {
      ...state,
      party: [...state.party],
      scene: 'travel',
      farming: null,
      farmsThisRegion: state.farmsThisRegion + 1,
      messages: [...state.messages, '@MainCharacterEnergy · 2.4M followers: delete your account.'],
    };
  }
  const skill = CLASS_CONFIG[playerClass].contentSkill;
  const mult = CONTENT_SKILL_FARMING_MULT[skill] ?? 1;
  haul = Math.min(FARMING_MAX_HAUL, Math.floor(haul * mult));
  const supplies = { ...state.supplies, attentionSpan: state.supplies.attentionSpan + haul };
  let party = state.party;
  if (state.consecutiveFarmDays >= 3) {
    const roll = mulberry32(state.rngState);
    if (roll.value < 0.35) {
      party = party.map((m) => (m.alive && !m.ailment ? { ...m, ailment: 'carpal_tunnel' as const } : m));
    }
  }
  return {
    ...state,
    rngState: state.rngState,
    party,
    supplies,
    scene: 'travel',
    farming: null,
    farmsThisRegion: state.farmsThisRegion + 1,
    messages: [...state.messages, `Engagement Farming haul: +${haul} Attention Span.`],
  };
}

export function farmingWarning(session: FarmingSession): 'none' | 'ratio_incoming' {
  if (session.sus >= 70) {
    return 'ratio_incoming';
  }
  return 'none';
}
