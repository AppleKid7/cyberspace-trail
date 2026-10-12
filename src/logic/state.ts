import { CLASS_CONFIG, SUGGESTED_START } from './balance.ts';
import { seedToRngState } from './rng.ts';
import type {
  GameState,
  JoinDate,
  PartyMember,
  PlayerClass,
  Seed,
  Supplies,
} from './types.ts';
import { crypto, day, health, scrolls, seed } from './types.ts';

export function defaultPartyNames(): string[] {
  return ['You', 'Alex', 'Sam', 'Jordan', 'Riley'];
}

export function newSuppliesForClass(playerClass: PlayerClass): Supplies {
  const cfg = CLASS_CONFIG[playerClass];
  return {
    crypto: crypto(cfg.startCrypto),
    bandwidthMbps: SUGGESTED_START.bandwidthMbps,
    attentionSpan: SUGGESTED_START.attentionSpan,
    hotTakePacks: SUGGESTED_START.hotTakePacks,
    ethernetCable: SUGGESTED_START.ethernetCable,
    router: SUGGESTED_START.router,
    vpnKey: SUGGESTED_START.vpnKey,
  };
}

export function newParty(names: string[]): PartyMember[] {
  return names.slice(0, 5).map((name) => ({
    name,
    health: health(100),
    ailment: null,
    thickSkinLayers: SUGGESTED_START.thickSkinPerPerson,
    alive: true,
  }));
}

export function newGame(
  playerClass: PlayerClass,
  partyNames: string[],
  joinDate: JoinDate,
  gameSeed: number,
): GameState {
  const s = seed(gameSeed);
  return {
    version: 1,
    seed: s,
    rngState: seedToRngState(s),
    scene: 'store',
    day: day(0),
    distance: scrolls(0),
    playerClass,
    joinDate,
    party: newParty(partyNames),
    supplies: newSuppliesForClass(playerClass),
    pace: 'posting',
    screenTime: 'moderate',
    todayVibe: null,
    regionIndex: 0,
    farmsThisRegion: 0,
    consecutiveFarmDays: 0,
    restDaysRemaining: 0,
    pendingEvent: null,
    pendingLandmark: null,
    pendingCrossing: null,
    currentStoreRegion: 0,
    tradeOffer: null,
    farming: null,
    rapids: null,
    tollRoadTaken: false,
    messages: ['Welcome to the Starter Pack store. The Mod recommends a balanced loadout.'],
    epitaphs: {},
  };
}

export function freshMetaState(gameSeed: number): GameState {
  const s = seed(gameSeed);
  return {
    version: 1,
    seed: s,
    rngState: seedToRngState(s),
    scene: 'title',
    day: day(0),
    distance: scrolls(0),
    playerClass: null,
    joinDate: null,
    party: [],
    supplies: {
      crypto: crypto(0),
      bandwidthMbps: 0,
      attentionSpan: 0,
      hotTakePacks: 0,
      ethernetCable: 0,
      router: 0,
      vpnKey: 0,
    },
    pace: 'posting',
    screenTime: 'moderate',
    todayVibe: null,
    regionIndex: 0,
    farmsThisRegion: 0,
    consecutiveFarmDays: 0,
    restDaysRemaining: 0,
    pendingEvent: null,
    pendingLandmark: null,
    pendingCrossing: null,
    currentStoreRegion: null,
    tradeOffer: null,
    farming: null,
    rapids: null,
    tollRoadTaken: false,
    messages: [],
    epitaphs: {},
  };
}

export function livingCount(state: GameState): number {
  return state.party.filter((m) => m.alive).length;
}

export function averageHealth(state: GameState): number {
  const alive = state.party.filter((m) => m.alive);
  if (alive.length === 0) {
    return 0;
  }
  return alive.reduce((sum, m) => sum + m.health, 0) / alive.length;
}

export function partyHealthLabel(state: GameState): string {
  const avg = averageHealth(state);
  if (avg > 75) {
    return 'Good';
  }
  if (avg > 50) {
    return 'Fair';
  }
  if (avg > 25) {
    return 'Poor';
  }
  return 'Very Poor';
}

export function deathMessage(name: string): string {
  return `${name} has died of cringe.`;
}
