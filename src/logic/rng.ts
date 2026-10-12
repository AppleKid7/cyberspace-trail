import type { Seed } from './types.ts';

export function mulberry32(state: number): { value: number; next: number } {
  let t = (state + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, next: t >>> 0 };
}

export function seedToRngState(seed: Seed): number {
  return seed >>> 0;
}

export function randomInt(state: number, min: number, max: number): { value: number; next: number } {
  const roll = mulberry32(state);
  const value = min + Math.floor(roll.value * (max - min + 1));
  return { value, next: roll.next };
}

export function pickWeighted<T extends { weight: number }>(
  state: number,
  items: T[],
): { item: T; next: number } | null {
  if (items.length === 0) {
    return null;
  }
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = mulberry32(state);
  let target = roll.value * total;
  for (const item of items) {
    target -= item.weight;
    if (target <= 0) {
      return { item, next: roll.next };
    }
  }
  const last = items[items.length - 1];
  if (!last) {
    return null;
  }
  return { item: last, next: roll.next };
}
