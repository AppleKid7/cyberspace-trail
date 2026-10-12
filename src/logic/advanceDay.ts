import {
  AILMENT_EXTRA_LOSS,
  BASE_AILMENT_CHANCE,
  JOIN_DATE_VIBE_WEIGHTS,
  PACE_HEALTH_COST,
  REGION_VIBE_WEIGHTS,
  SCREEN_TIME_ATTENTION,
  SCREEN_TIME_HEALTH,
  VIBE_TOXIC_DAMAGE,
  VIBE_UNHINGED_DAMAGE,
} from './balance.ts';
import {
  crossingDistance,
  landmarkDistance,
  REGIONS,
  regionAtDistance,
  storeDistance,
} from './regions.ts';
import { mulberry32, pickWeighted, randomInt } from './rng.ts';
import { dismissEvent, maybeTriggerEvent, travelDistanceForDay } from './events.ts';
import { livingCount, deathMessage } from './state.ts';
import type { Ailment, GameState, Vibe } from './types.ts';
import { day, health, scrolls } from './types.ts';
import { TRAIL_LENGTH_SCROLLS } from '../config.ts';

function rollVibe(state: GameState): { vibe: Vibe; next: number } {
  const joinWeights = state.joinDate ? JOIN_DATE_VIBE_WEIGHTS[state.joinDate] : JOIN_DATE_VIBE_WEIGHTS.slow_news;
  const regionWeights = REGION_VIBE_WEIGHTS[state.regionIndex] ?? REGION_VIBE_WEIGHTS[0]!;
  const vibes: Vibe[] = ['chill', 'spicy', 'toxic', 'unhinged'];
  const items = vibes.map((v) => ({
    vibe: v,
    weight: (joinWeights[v] + regionWeights[v]) / 2,
  }));
  const picked = pickWeighted(state.rngState, items);
  if (!picked) {
    return { vibe: 'chill', next: state.rngState };
  }
  return { vibe: picked.item.vibe, next: picked.next };
}

function applyVibeDamage(state: GameState, vibe: Vibe): GameState {
  if (vibe !== 'toxic' && vibe !== 'unhinged') {
    return state;
  }
  const damage = vibe === 'toxic' ? VIBE_TOXIC_DAMAGE : VIBE_UNHINGED_DAMAGE;
  const party = state.party.map((m) => {
    if (!m.alive) {
      return m;
    }
    if (m.thickSkinLayers > 0) {
      return m;
    }
    return { ...m, health: health(m.health - damage) };
  });
  return { ...state, party };
}

function consumeAttention(state: GameState): GameState {
  const perPerson = SCREEN_TIME_ATTENTION[state.screenTime] ?? 2;
  const alive = livingCount(state);
  const total = perPerson * alive;
  const supplies = { ...state.supplies, attentionSpan: Math.max(0, state.supplies.attentionSpan - total) };
  return { ...state, supplies };
}

function attentionStarvation(state: GameState): GameState {
  if (state.supplies.attentionSpan > 0) {
    return state;
  }
  const party = state.party.map((m) =>
    m.alive ? { ...m, health: health(m.health - 8) } : m,
  );
  return { ...state, party };
}

function paceHealthCost(state: GameState): GameState {
  const cost = PACE_HEALTH_COST[state.pace] ?? 0;
  if (cost === 0) {
    return state;
  }
  const party = state.party.map((m) =>
    m.alive ? { ...m, health: health(m.health - cost) } : m,
  );
  return { ...state, party };
}

function screenTimeHealth(state: GameState): GameState {
  const delta = SCREEN_TIME_HEALTH[state.screenTime] ?? 0;
  if (delta === 0) {
    return state;
  }
  const party = state.party.map((m) =>
    m.alive ? { ...m, health: health(m.health + delta) } : m,
  );
  return { ...state, party };
}

function processAilments(state: GameState): GameState {
  const party = state.party.map((m) => {
    if (!m.alive || !m.ailment) {
      return m;
    }
    const extra = AILMENT_EXTRA_LOSS[m.ailment] ?? 0;
    return { ...m, health: health(m.health - extra) };
  });
  return { ...state, party };
}

function rollNewAilments(state: GameState): GameState {
  let rng = state.rngState;
  const party = state.party.map((m) => {
    if (!m.alive || m.ailment) {
      return m;
    }
    let chance = BASE_AILMENT_CHANCE;
    if (m.health < 50) {
      chance += 0.02;
    }
    if (state.pace === 'terminally_online') {
      chance += 0.01;
    }
    const roll = mulberry32(rng);
    rng = roll.next;
    if (roll.value < chance) {
      const region = REGIONS[state.regionIndex];
      const signature = region?.signatureAilment;
      const ailment: Ailment =
        signature === 'got_ratioed' ||
        signature === 'brain_rot' ||
        signature === 'cringe' ||
        signature === 'burnout'
          ? signature
          : 'cringe';
      return { ...m, ailment };
    }
    return m;
  });
  return { ...state, party, rngState: rng };
}

function markDeaths(state: GameState): GameState {
  const messages = [...state.messages];
  const party = state.party.map((m) => {
    if (m.alive && m.health <= 0) {
      messages.push(deathMessage(m.name));
      return { ...m, alive: false, health: health(0) };
    }
    return m;
  });
  return { ...state, party, messages };
}

function checkWorldTriggers(state: GameState): GameState {
  let next = state;
  const dist = next.distance;

  for (let i = 0; i < REGIONS.length - 1; i++) {
    if (dist === storeDistance(i) && next.scene === 'travel') {
      next = {
        ...next,
        scene: 'store',
        currentStoreRegion: i,
        messages: [...next.messages, `Arrived at ${REGIONS[i]?.storeName}.`],
      };
      break;
    }
  }

  for (let i = 0; i < REGIONS.length; i++) {
    if (dist === landmarkDistance(i) && next.scene === 'travel') {
      next = {
        ...next,
        scene: 'landmark',
        pendingLandmark: {
          id: `landmark_${i}`,
          name: REGIONS[i]?.landmarkName ?? 'Landmark',
          body: 'You rest and take in the views. Autosave checkpoint.',
        },
      };
      break;
    }
  }

  for (const crossing of [
    { after: 0, name: 'Repost River' },
    { after: 1, name: 'Rebrand River' },
    { after: 2, name: 'Algorithm River' },
  ]) {
    if (dist === crossingDistance(crossing.after) && next.scene === 'travel') {
      const depthRoll = randomInt(next.rngState, 1, 5);
      next = {
        ...next,
        rngState: depthRoll.next,
        scene: 'crossing',
        pendingCrossing: {
          id: `cross_${crossing.after}`,
          name: crossing.name,
          depth: depthRoll.value,
        },
      };
      break;
    }
  }

  if (dist >= scrolls(TRAIL_LENGTH_SCROLLS - 200) && dist < scrolls(TRAIL_LENGTH_SCROLLS) && next.regionIndex === 4) {
    if (dist === scrolls(TRAIL_LENGTH_SCROLLS - 100) && next.scene === 'travel') {
      next = {
        ...next,
        scene: 'finale_choice',
        pendingLandmark: {
          id: 'last_post_bluff',
          name: 'Last Post Bluff',
          body: 'Ride the Feed Rapids or pay the Premium Toll Road?',
        },
      };
    }
  }

  if (dist >= scrolls(TRAIL_LENGTH_SCROLLS)) {
    next = { ...next, scene: 'score' };
  }

  if (livingCount(next) === 0) {
    next = { ...next, scene: 'suspended' };
  }

  return next;
}

export interface AdvanceDayResult {
  state: GameState;
  log: string[];
}

export function advanceDay(state: GameState, options?: { skipTravel?: boolean }): AdvanceDayResult {
  const log: string[] = [];
  if (state.scene !== 'travel' && !options?.skipTravel) {
    return { state, log };
  }

  let next: GameState = { ...state, day: day(state.day + 1) };

  if (next.restDaysRemaining > 0) {
    next = { ...next, restDaysRemaining: next.restDaysRemaining - 1 };
    next = screenTimeHealth({ ...next, screenTime: 'touch_grass' });
    next = consumeAttention(next);
    next = processAilments(next);
    next = markDeaths(next);
    return { state: checkWorldTriggers(next), log: ['Resting…'] };
  }

  const vibeRoll = rollVibe(next);
  next = { ...next, todayVibe: vibeRoll.vibe, rngState: vibeRoll.next };
  log.push(`Vibe: ${vibeRoll.vibe}`);

  next = applyVibeDamage(next, vibeRoll.vibe);
  next = consumeAttention(next);
  next = attentionStarvation(next);
  next = paceHealthCost(next);
  next = screenTimeHealth(next);
  next = processAilments(next);
  next = rollNewAilments(next);
  next = markDeaths(next);

  if (!options?.skipTravel) {
    const dist = travelDistanceForDay(next);
    const newDistance = scrolls(Math.min(TRAIL_LENGTH_SCROLLS, next.distance + dist));
    next = {
      ...next,
      distance: newDistance,
      regionIndex: regionAtDistance(newDistance),
    };
    log.push(`Traveled ${dist.toFixed(1)} scrolls`);
  }

  next = checkWorldTriggers(next);

  if (next.scene === 'travel') {
    const eventChance = next.joinDate === 'meme_season' ? 0.22 : next.joinDate === 'discourse_season' ? 0.18 : 0.12;
    next = maybeTriggerEvent(next, eventChance);
  }

  return { state: next, log };
}

export function continueTravelFromPending(state: GameState): GameState {
  if (state.pendingEvent) {
    return dismissEvent(state);
  }
  return state;
}
