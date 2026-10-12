import { CLASS_CONFIG, STORE_PRICES, storePriceMultiplier } from './balance.ts';
import type { GameState, PlayerClass } from './types.ts';
import { crypto } from './types.ts';

export type StoreItem =
  | 'bandwidth_10'
  | 'attention_100'
  | 'thick_skin'
  | 'hot_takes'
  | 'ethernet'
  | 'router'
  | 'vpn';

export function priceFor(item: StoreItem, regionIndex: number): number {
  const mult = storePriceMultiplier(regionIndex);
  switch (item) {
    case 'bandwidth_10':
      return STORE_PRICES.bandwidthPer10Mbps * mult;
    case 'attention_100':
      return STORE_PRICES.attentionPerUnit * 100 * mult;
    case 'thick_skin':
      return STORE_PRICES.thickSkinPerLayer * mult;
    case 'hot_takes':
      return STORE_PRICES.hotTakePer20 * mult;
    case 'ethernet':
    case 'router':
    case 'vpn':
      return STORE_PRICES.sparePart * mult;
    default:
      return 0;
  }
}

export function buyItem(state: GameState, item: StoreItem): GameState {
  const region = state.currentStoreRegion ?? state.regionIndex;
  const cost = priceFor(item, region);
  if (state.supplies.crypto < cost) {
    return {
      ...state,
      messages: [...state.messages, 'Not enough crypto.'],
    };
  }
  const supplies = { ...state.supplies, crypto: crypto(state.supplies.crypto - cost) };
  switch (item) {
    case 'bandwidth_10':
      supplies.bandwidthMbps += 10;
      break;
    case 'attention_100':
      supplies.attentionSpan += 100;
      break;
    case 'thick_skin':
      state.party.forEach((m) => {
        if (m.alive) {
          m.thickSkinLayers += 1;
        }
      });
      break;
    case 'hot_takes':
      supplies.hotTakePacks += 1;
      break;
    case 'ethernet':
      supplies.ethernetCable += 1;
      break;
    case 'router':
      supplies.router += 1;
      break;
    case 'vpn':
      supplies.vpnKey += 1;
      break;
    default:
      break;
  }
  return {
    ...state,
    supplies,
    party: [...state.party],
    messages: [...state.messages, `Bought ${item} for $${cost.toFixed(0)}.`],
  };
}

export function leaveStore(state: GameState): GameState {
  return {
    ...state,
    scene: 'travel',
    currentStoreRegion: null,
  };
}

export function classSkillCheckSuccess(playerClass: PlayerClass, rngValue: number): boolean {
  const skill = CLASS_CONFIG[playerClass].contentSkill;
  const threshold = skill === 1 ? 0.3 : skill === 2 ? 0.55 : 0.8;
  return rngValue < threshold;
}
