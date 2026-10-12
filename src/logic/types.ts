export type Health = number & { readonly __brand: 'Health' };
export type Scrolls = number & { readonly __brand: 'Scrolls' };
export type Crypto = number & { readonly __brand: 'Crypto' };
export type Seed = number & { readonly __brand: 'Seed' };
export type Day = number & { readonly __brand: 'Day' };

export function health(value: number): Health {
  if (!Number.isFinite(value)) {
    throw new Error('health must be finite');
  }
  return Math.max(0, Math.min(100, Math.round(value))) as Health;
}

export function scrolls(value: number): Scrolls {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('scrolls must be non-negative');
  }
  return Math.round(value) as Scrolls;
}

export function crypto(value: number): Crypto {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error('crypto must be non-negative');
  }
  return Math.round(value * 100) / 100 as Crypto;
}

export function seed(value: number): Seed {
  if (!Number.isInteger(value)) {
    throw new Error('seed must be an integer');
  }
  return value as Seed;
}

export function day(value: number): Day {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error('day must be a non-negative integer');
  }
  return value as Day;
}

export type PlayerClass = 'ai_bro' | 'tech_bro' | 'content_creator';

export type JoinDate = 'slow_news' | 'meme_season' | 'discourse_season';

export type Pace = 'lurking' | 'posting' | 'terminally_online';

export type ScreenTime = 'touch_grass' | 'moderate' | 'doomscrolling';

export type Vibe = 'chill' | 'spicy' | 'toxic' | 'unhinged';

export type Ailment =
  | 'cringe'
  | 'doomscroll_fever'
  | 'brain_rot'
  | 'burnout'
  | 'got_ratioed'
  | 'carpal_tunnel';

export type SparePartKind = 'ethernet_cable' | 'router' | 'vpn_key';

export type Scene =
  | 'title'
  | 'class_select'
  | 'party'
  | 'join_date'
  | 'store'
  | 'travel'
  | 'event'
  | 'landmark'
  | 'crossing'
  | 'farming'
  | 'finale_choice'
  | 'rapids'
  | 'score'
  | 'suspended';

export interface PartyMember {
  name: string;
  health: Health;
  ailment: Ailment | null;
  thickSkinLayers: number;
  alive: boolean;
}

export interface Supplies {
  crypto: Crypto;
  bandwidthMbps: number;
  attentionSpan: number;
  hotTakePacks: number;
  ethernetCable: number;
  router: number;
  vpnKey: number;
}

export interface PendingEvent {
  id: string;
  title: string;
  body: string;
}

export interface PendingCrossing {
  id: string;
  name: string;
  depth: number;
}

export interface PendingLandmark {
  id: string;
  name: string;
  body: string;
}

export interface FarmingSession {
  elapsedMs: number;
  sus: number;
  haul: number;
  hotTakesSpent: number;
  lastReplyMs: number;
  ended: boolean;
  failedRatio: boolean;
  posts: FarmingPost[];
}

export interface FarmingPost {
  id: number;
  lane: 0 | 1 | 2;
  y: number;
  kind: 'cat' | 'meme' | 'hot_take' | 'ai_topic';
  hit: boolean;
}

export interface RapidsSession {
  elapsedMs: number;
  x: number;
  hits: number;
  cleanStreakMs: number;
  ended: boolean;
  capsize: boolean;
  obstacles: RapidsObstacle[];
}

export interface RapidsObstacle {
  id: number;
  x: number;
  y: number;
  kind: 'rage_bait' | 'bot_swarm' | 'trending_whirlpool';
  telegraphUntilMs: number;
}

export interface GameState {
  version: 1;
  seed: Seed;
  rngState: number;
  scene: Scene;
  day: Day;
  distance: Scrolls;
  playerClass: PlayerClass | null;
  joinDate: JoinDate | null;
  party: PartyMember[];
  supplies: Supplies;
  pace: Pace;
  screenTime: ScreenTime;
  todayVibe: Vibe | null;
  regionIndex: number;
  farmsThisRegion: number;
  consecutiveFarmDays: number;
  restDaysRemaining: number;
  pendingEvent: PendingEvent | null;
  pendingLandmark: PendingLandmark | null;
  pendingCrossing: PendingCrossing | null;
  currentStoreRegion: number | null;
  tradeOffer: TradeOffer | null;
  farming: FarmingSession | null;
  rapids: RapidsSession | null;
  tollRoadTaken: boolean;
  messages: string[];
  epitaphs: Record<string, string>;
}

export interface TradeOffer {
  give: string;
  receive: string;
  apply: 'gain_attention' | 'gain_crypto' | 'lose_bandwidth';
}
