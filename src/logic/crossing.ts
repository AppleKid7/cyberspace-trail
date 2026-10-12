import { mulberry32, randomInt } from './rng.ts';
import type { GameState } from './types.ts';
import { crypto, scrolls } from './types.ts';

export type CrossingChoice = 'migrate' | 'vpn' | 'verified' | 'wait';

export function resolveCrossing(state: GameState, choice: CrossingChoice): GameState {
  const crossing = state.pendingCrossing;
  if (!crossing) {
    return state;
  }
  let next = { ...state, supplies: { ...state.supplies }, party: state.party.map((m) => ({ ...m })) };
  const depth = crossing.depth;

  switch (choice) {
    case 'wait':
      return {
        ...next,
        day: (next.day + 1) as typeof next.day,
        pendingCrossing: { ...crossing, depth: Math.max(1, depth - 1) },
        messages: [...next.messages, 'Waiting for drama to cool down. Depth -1.'],
      };
    case 'vpn':
      if (next.supplies.vpnKey <= 0) {
        return { ...next, messages: [...next.messages, 'No VPN key.'] };
      }
      next.supplies.vpnKey -= 1;
      next = { ...next, scene: 'travel', pendingCrossing: null, messages: [...next.messages, 'VPN tunnel crossed safely.'] };
      break;
    case 'verified': {
      const costRoll = randomInt(next.rngState, 5, 15);
      next.rngState = costRoll.next;
      const queueDays = randomInt(next.rngState, 1, 3);
      next.rngState = queueDays.next;
      if (next.supplies.crypto < costRoll.value) {
        return { ...next, messages: [...next.messages, 'Verification fee too high.'] };
      }
      next.supplies.crypto = crypto(next.supplies.crypto - costRoll.value);
      next = {
        ...next,
        day: (next.day + queueDays.value) as typeof next.day,
        scene: 'travel',
        pendingCrossing: null,
        messages: [...next.messages, `Verified crossing ($${costRoll.value}, ${queueDays.value}d queue).`],
      };
      break;
    }
    case 'migrate':
    default: {
      const roll = mulberry32(next.rngState);
      next.rngState = roll.next;
      if (depth <= 2 || roll.value > 0.35) {
        next = { ...next, scene: 'travel', pendingCrossing: null, messages: [...next.messages, 'Migration succeeded.'] };
      } else {
        next.supplies.attentionSpan = Math.max(0, next.supplies.attentionSpan - 50);
        next = { ...next, scene: 'travel', pendingCrossing: null, messages: [...next.messages, 'Deep discourse! Lost supplies in the replies.'] };
      }
      break;
    }
  }

  next.farmsThisRegion = 0;
  return next;
}

export function skipCrossing(state: GameState): GameState {
  return { ...state, scene: 'travel', pendingCrossing: null };
}
