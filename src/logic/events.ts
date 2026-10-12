import { REGIONS } from './regions.ts';
import { mulberry32, pickWeighted } from './rng.ts';
import { GAME_EVENTS, type EventEffect } from './data/events.ts';
import type { GameState } from './types.ts';
import { crypto, health, scrolls } from './types.ts';

export function eligibleEvents(state: GameState): typeof GAME_EVENTS {
  const region = REGIONS[state.regionIndex];
  const regionId = region?.id ?? 'reddit';
  return GAME_EVENTS.filter((event) => {
    if (event.minRegion !== undefined && state.regionIndex < event.minRegion) {
      return false;
    }
    if (event.regions === 'any') {
      return true;
    }
    return event.regions.includes(regionId);
  });
}

export function rollTravelEvent(state: GameState): { state: GameState; triggered: boolean } {
  const pool = eligibleEvents(state).map((event) => ({ ...event, weight: event.weight }));
  const picked = pickWeighted(state.rngState, pool);
  if (!picked) {
    return { state, triggered: false };
  }
  const next: GameState = {
    ...state,
    rngState: picked.next,
    scene: 'event',
    pendingEvent: {
      id: picked.item.id,
      title: picked.item.title,
      body: picked.item.body,
    },
  };
  return { state: next, triggered: true };
}

export function applyEventEffects(state: GameState, effects: EventEffect[]): GameState {
  let next = { ...state, party: state.party.map((m) => ({ ...m })), supplies: { ...state.supplies } };
  for (const effect of effects) {
    switch (effect.type) {
      case 'lose_days':
        next = { ...next, day: (next.day + effect.days) as typeof next.day };
        break;
      case 'gain_attention':
        next.supplies.attentionSpan = Math.max(0, next.supplies.attentionSpan + effect.amount);
        break;
      case 'lose_crypto':
        next.supplies.crypto = crypto(Math.max(0, next.supplies.crypto - effect.amount));
        break;
      case 'lose_bandwidth':
        next.supplies.bandwidthMbps = Math.max(0, next.supplies.bandwidthMbps - effect.amount);
        break;
      case 'heal_party':
        next.party = next.party.map((m) =>
          m.alive ? { ...m, health: health(m.health + effect.amount) } : m,
        );
        break;
      case 'ailment_outbreak': {
        const target = next.party.find((m) => m.alive && !m.ailment);
        if (target) {
          target.ailment = effect.ailment;
        }
        break;
      }
      case 'breakdown':
        if (effect.part === 'router') {
          next.supplies.router = Math.max(0, next.supplies.router - 1);
        } else {
          next.supplies.ethernetCable = Math.max(0, next.supplies.ethernetCable - 1);
        }
        break;
      case 'speed_boost':
        next.messages = [...next.messages, `Speed boost ×${effect.mult} for ${effect.days} days`];
        break;
      case 'gain_crypto':
        next.supplies.crypto = crypto(next.supplies.crypto + effect.amount);
        break;
      default:
        break;
    }
  }
  return next;
}

export function dismissEvent(state: GameState): GameState {
  const eventId = state.pendingEvent?.id;
  const def = GAME_EVENTS.find((e) => e.id === eventId);
  const applied = def ? applyEventEffects(state, def.effects) : state;
  return {
    ...applied,
    pendingEvent: null,
    scene: 'travel',
  };
}

export function maybeTriggerEvent(state: GameState, eventChance: number): GameState {
  const roll = mulberry32(state.rngState);
  if (roll.value >= eventChance) {
    return { ...state, rngState: roll.next };
  }
  const triggered = rollTravelEvent({ ...state, rngState: roll.next });
  return triggered.state;
}

export function travelDistanceForDay(state: GameState): number {
  const bwMult = Math.min(1, state.supplies.bandwidthMbps / 40);
  const paceDist = state.pace === 'lurking' ? 10 : state.pace === 'posting' ? 15 : 20;
  const screenMult =
    state.screenTime === 'touch_grass' ? 0.8 : state.screenTime === 'moderate' ? 1.0 : 1.2;
  return paceDist * bwMult * screenMult;
}

export function applyTravelDistance(state: GameState, amount: number): GameState {
  const newDist = scrolls(Math.min(2000, state.distance + amount));
  const regionIndex = REGIONS.findIndex((_, i) => {
    let start = 0;
    for (let r = 0; r < i; r++) {
      const reg = REGIONS[r];
      if (reg) {
        start += reg.length;
      }
    }
    const reg = REGIONS[i];
    return reg ? newDist >= start && newDist < start + reg.length : false;
  });
  return {
    ...state,
    distance: newDist,
    regionIndex: regionIndex >= 0 ? regionIndex : state.regionIndex,
  };
}
