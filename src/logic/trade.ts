import { mulberry32 } from './rng.ts';
import type { GameState, TradeOffer } from './types.ts';
import { crypto } from './types.ts';

const OFFERS: TradeOffer[] = [
  { give: '50 Attention Span', receive: '$15 crypto', apply: 'gain_crypto' },
  { give: '$10 crypto', receive: '80 Attention Span', apply: 'gain_attention' },
  { give: '10 Mbps bandwidth', receive: '60 Attention Span', apply: 'lose_bandwidth' },
];

export function rollTradeOffer(state: GameState): GameState {
  const roll = mulberry32(state.rngState);
  const index = Math.floor(roll.value * OFFERS.length);
  const offer = OFFERS[index] ?? OFFERS[0];
  return {
    ...state,
    rngState: roll.next,
    tradeOffer: offer ?? null,
  };
}

export function acceptTrade(state: GameState): GameState {
  const offer = state.tradeOffer;
  if (!offer) {
    return state;
  }
  const supplies = { ...state.supplies };
  switch (offer.apply) {
    case 'gain_crypto':
      supplies.crypto = crypto(supplies.crypto + 15);
      supplies.attentionSpan = Math.max(0, supplies.attentionSpan - 50);
      break;
    case 'gain_attention':
      supplies.crypto = crypto(Math.max(0, supplies.crypto - 10));
      supplies.attentionSpan += 80;
      break;
    case 'lose_bandwidth':
      supplies.bandwidthMbps = Math.max(0, supplies.bandwidthMbps - 10);
      supplies.attentionSpan += 60;
      break;
    default:
      break;
  }
  return {
    ...state,
    supplies,
    tradeOffer: null,
    messages: [...state.messages, `Trade complete: ${offer.give} → ${offer.receive}`],
  };
}

export function declineTrade(state: GameState): GameState {
  return { ...state, tradeOffer: null };
}
