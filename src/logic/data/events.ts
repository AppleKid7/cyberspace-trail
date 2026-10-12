import type { Ailment } from '../types.ts';

export type EventEffect =
  | { type: 'lose_days'; days: number }
  | { type: 'gain_attention'; amount: number }
  | { type: 'lose_crypto'; amount: number }
  | { type: 'lose_bandwidth'; amount: number }
  | { type: 'heal_party'; amount: number }
  | { type: 'ailment_outbreak'; ailment: Ailment }
  | { type: 'breakdown'; part: 'ethernet_cable' | 'router' }
  | { type: 'speed_boost'; days: number; mult: number }
  | { type: 'gain_crypto'; amount: number };

export interface GameEventDef {
  id: string;
  title: string;
  body: string;
  weight: number;
  regions: string[] | 'any';
  minRegion?: number;
  effects: EventEffect[];
}

export const GAME_EVENTS: GameEventDef[] = [
  {
    id: 'well_actually',
    title: 'Well, actually…',
    body: 'A thread turns into a 400-comment correction spiral. You lose a day.',
    weight: 8,
    regions: ['reddit'],
    effects: [{ type: 'lose_days', days: 1 }],
  },
  {
    id: 'rabbit_hole',
    title: 'Rabbit hole',
    body: 'You fell into r/AmItheAsshole archives. Three days, gone.',
    weight: 5,
    regions: ['reddit'],
    effects: [{ type: 'lose_days', days: 3 }],
  },
  {
    id: 'karma_gift',
    title: 'Karma gift',
    body: 'A wholesome award shower drops free supplies.',
    weight: 6,
    regions: ['reddit'],
    effects: [{ type: 'gain_attention', amount: 120 }],
  },
  {
    id: 'trend_wave',
    title: 'Trend wave',
    body: 'You ride a trend. +30% speed for 3 days.',
    weight: 7,
    regions: ['tiktok'],
    effects: [{ type: 'speed_boost', days: 3, mult: 1.3 }],
  },
  {
    id: 'agree_storm',
    title: 'Agree? post storm',
    body: 'Thought leadership hail. Cringe outbreak.',
    weight: 8,
    regions: ['linkedin'],
    effects: [{ type: 'ailment_outbreak', ailment: 'cringe' }],
  },
  {
    id: 'unskippable_ad',
    title: 'Unskippable ad',
    body: 'Mid-roll hell costs a travel day.',
    weight: 7,
    regions: ['youtube'],
    effects: [{ type: 'lose_days', days: 1 }],
  },
  {
    id: 'sponsor_segment',
    title: 'Sponsor segment',
    body: 'You read the ad copy. Crypto trickles in.',
    weight: 6,
    regions: ['youtube'],
    effects: [{ type: 'gain_crypto', amount: 25 }],
  },
  {
    id: 'account_hacked',
    title: 'Account hacked',
    body: 'Someone bought NFTs with your wallet.',
    weight: 4,
    regions: 'any',
    effects: [{ type: 'lose_crypto', amount: 40 }],
  },
  {
    id: 'router_overheated',
    title: 'Router overheated',
    body: 'Your router gave up the ghost.',
    weight: 4,
    regions: 'any',
    effects: [{ type: 'breakdown', part: 'router' }],
  },
  {
    id: 'throttled',
    title: 'Throttled',
    body: 'ISP says you used too much truth. Bandwidth drops.',
    weight: 5,
    regions: 'any',
    effects: [{ type: 'lose_bandwidth', amount: 10 }],
  },
  {
    id: 'meme_stash',
    title: 'Found a meme stash',
    body: 'Rare templates restore Attention Span.',
    weight: 5,
    regions: 'any',
    effects: [{ type: 'gain_attention', amount: 80 }],
  },
  {
    id: 'old_post',
    title: 'Old post resurfaces',
    body: 'Your 2014 hot take is trending again.',
    weight: 4,
    regions: 'any',
    effects: [{ type: 'ailment_outbreak', ailment: 'cringe' }],
  },
  {
    id: 'wholesome_thread',
    title: 'Wholesome thread',
    body: 'Pure vibes. Everyone feels a little better.',
    weight: 5,
    regions: 'any',
    effects: [{ type: 'heal_party', amount: 8 }],
  },
  {
    id: 'lost_in_comments',
    title: 'Lost in the comments',
    body: 'You replied to a reply to a reply. A day vanishes.',
    weight: 5,
    regions: 'any',
    effects: [{ type: 'lose_days', days: 1 }],
  },
  {
    id: 'main_character',
    title: 'Main character of the day',
    body: 'One of you is trending for the wrong reason.',
    weight: 8,
    regions: ['x'],
    minRegion: 4,
    effects: [{ type: 'ailment_outbreak', ailment: 'cringe' }],
  },
  {
    id: 'bot_swarm',
    title: 'Bot swarm',
    body: 'Reply bots steal your Attention Span.',
    weight: 7,
    regions: ['x'],
    minRegion: 4,
    effects: [{ type: 'gain_attention', amount: -100 }],
  },
  {
    id: 'viral_moment',
    title: 'Viral moment',
    body: 'The algorithm blesses you with a free travel day.',
    weight: 5,
    regions: ['x'],
    minRegion: 4,
    effects: [{ type: 'lose_days', days: -1 }],
  },
];
