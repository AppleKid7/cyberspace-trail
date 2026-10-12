import { CLASS_CONFIG } from './balance.ts';
import { averageHealth, livingCount } from './state.ts';
import type { GameState, PlayerClass } from './types.ts';

export function healthBand(healthValue: number): 'good' | 'fair' | 'poor' | 'very_poor' {
  if (healthValue > 75) {
    return 'good';
  }
  if (healthValue > 50) {
    return 'fair';
  }
  if (healthValue > 25) {
    return 'poor';
  }
  return 'very_poor';
}

const SURVIVOR_POINTS: Record<string, number> = {
  good: 500,
  fair: 400,
  poor: 300,
  very_poor: 200,
};

export function computeScore(state: GameState): number {
  const playerClass = state.playerClass ?? 'tech_bro';
  const mult = CLASS_CONFIG[playerClass].scoreMultiplier;
  let base = 0;
  for (const member of state.party) {
    if (!member.alive) {
      continue;
    }
    base += SURVIVOR_POINTS[healthBand(member.health)] ?? 200;
  }
  base += Math.floor(state.supplies.bandwidthMbps / 10) * 40;
  base += (state.supplies.ethernetCable + state.supplies.router + state.supplies.vpnKey) * 2;
  const thick = state.party.reduce((s, m) => s + m.thickSkinLayers, 0);
  base += thick * 2;
  base += Math.floor(state.supplies.attentionSpan / 50);
  base += Math.floor((state.supplies.hotTakePacks * 20) / 50);
  base += Math.floor(state.supplies.crypto / 5);
  return Math.floor(base * mult);
}

export function titleTier(score: number): string {
  if (score >= 5000) {
    return 'Touched Grass Legend';
  }
  if (score >= 3500) {
    return 'Influencer';
  }
  if (score >= 2000) {
    return 'Poster';
  }
  return 'Lurker';
}

export function classLabel(playerClass: PlayerClass): string {
  return CLASS_CONFIG[playerClass].label;
}

export function isVictory(state: GameState): boolean {
  return state.scene === 'score' && livingCount(state) > 0;
}

export function summaryLine(state: GameState): string {
  const avg = averageHealth(state);
  return `Day ${state.day} · ${state.distance} scrolls · Party ${livingCount(state)}/5 · ${avg.toFixed(0)}% avg health`;
}
