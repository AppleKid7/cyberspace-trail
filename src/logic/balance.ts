import type { JoinDate, PlayerClass, Vibe } from './types.ts';

export const CLASS_CONFIG: Record<
  PlayerClass,
  { startCrypto: number; contentSkill: number; scoreMultiplier: number; susMultiplier: number; label: string }
> = {
  ai_bro: {
    startCrypto: 1600,
    contentSkill: 1,
    scoreMultiplier: 1,
    susMultiplier: 1.3,
    label: 'AI Bro',
  },
  tech_bro: {
    startCrypto: 800,
    contentSkill: 2,
    scoreMultiplier: 2,
    susMultiplier: 1.0,
    label: 'Tech Bro',
  },
  content_creator: {
    startCrypto: 400,
    contentSkill: 3,
    scoreMultiplier: 3,
    susMultiplier: 0.8,
    label: 'Content Creator',
  },
};

export const CONTENT_SKILL_FARMING_MULT: Record<number, number> = {
  1: 0.75,
  2: 1.0,
  3: 1.25,
};

export const STORE_PRICES = {
  bandwidthPer10Mbps: 40,
  attentionPerUnit: 0.2,
  thickSkinPerLayer: 10,
  hotTakePer20: 2,
  sparePart: 10,
};

export const SUGGESTED_START = {
  bandwidthMbps: 40,
  attentionSpan: 800,
  thickSkinPerPerson: 2,
  hotTakePacks: 10,
  ethernetCable: 1,
  router: 1,
  vpnKey: 1,
};

export const PACE_DISTANCE: Record<string, number> = {
  lurking: 10,
  posting: 15,
  terminally_online: 20,
};

export const PACE_HEALTH_COST: Record<string, number> = {
  lurking: 0,
  posting: 2,
  terminally_online: 5,
};

export const SCREEN_TIME_ATTENTION: Record<string, number> = {
  touch_grass: 1,
  moderate: 2,
  doomscrolling: 3,
};

export const SCREEN_TIME_HEALTH: Record<string, number> = {
  touch_grass: 2,
  moderate: 0,
  doomscrolling: -2,
};

export const SCREEN_TIME_DISTANCE_MULT: Record<string, number> = {
  touch_grass: 0.8,
  moderate: 1.0,
  doomscrolling: 1.2,
};

export const VIBE_TOXIC_DAMAGE = 5;
export const VIBE_UNHINGED_DAMAGE = 10;

export const BASE_AILMENT_CHANCE = 0.02;

export const AILMENT_EXTRA_LOSS: Record<string, number> = {
  cringe: 4,
  doomscroll_fever: 5,
  brain_rot: 3,
  burnout: 3,
  got_ratioed: 6,
  carpal_tunnel: 2,
};

export const JOIN_DATE_VIBE_WEIGHTS: Record<JoinDate, Record<Vibe, number>> = {
  slow_news: { chill: 50, spicy: 30, toxic: 15, unhinged: 5 },
  meme_season: { chill: 25, spicy: 35, toxic: 25, unhinged: 15 },
  discourse_season: { chill: 15, spicy: 25, toxic: 35, unhinged: 25 },
};

export const REGION_VIBE_WEIGHTS: Record<number, Record<Vibe, number>> = {
  0: { chill: 40, spicy: 35, toxic: 20, unhinged: 5 },
  1: { chill: 30, spicy: 35, toxic: 25, unhinged: 10 },
  2: { chill: 25, spicy: 30, toxic: 30, unhinged: 15 },
  3: { chill: 20, spicy: 30, toxic: 30, unhinged: 20 },
  4: { chill: 10, spicy: 25, toxic: 35, unhinged: 30 },
};

export const FARMING_ROUND_MS = 30_000;
export const FARMING_MAX_HAUL = 100;
export const FARMING_MAX_PER_REGION = 2;
export const RAPIDS_ROUND_MS = 45_000;

export const FINALE_TOLL_CRYPTO = 50;
export const FINALE_TOLL_ATTENTION = 80;

export const CLASS_RAPIDS: Record<
  PlayerClass,
  { tollAllowed: boolean; hitsToCapsize: number; densityMult: number; telegraphMs: number }
> = {
  ai_bro: { tollAllowed: false, hitsToCapsize: 2, densityMult: 1.5, telegraphMs: 0 },
  tech_bro: { tollAllowed: true, hitsToCapsize: 3, densityMult: 1.0, telegraphMs: 0 },
  content_creator: { tollAllowed: true, hitsToCapsize: 3, densityMult: 0.8, telegraphMs: 500 },
};

export function storePriceMultiplier(regionIndex: number): number {
  return 1 + regionIndex * 0.25;
}
