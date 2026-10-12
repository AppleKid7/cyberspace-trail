import type { GameState } from './types.ts';
import { crypto, day, health, scrolls, seed } from './types.ts';

export interface SaveEnvelope {
  version: 1;
  state: GameState;
}

export function toSaveEnvelope(state: GameState): SaveEnvelope {
  return { version: 1, state };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parseSaveEnvelope(raw: unknown): SaveEnvelope | null {
  if (!isRecord(raw) || raw.version !== 1 || !isRecord(raw.state)) {
    return null;
  }
  const s = raw.state;
  if (s.version !== 1) {
    return null;
  }
  try {
    const state: GameState = {
      version: 1,
      seed: seed(Number(s.seed)),
      rngState: Number(s.rngState),
      scene: String(s.scene) as GameState['scene'],
      day: day(Number(s.day)),
      distance: scrolls(Number(s.distance)),
      playerClass: s.playerClass as GameState['playerClass'],
      joinDate: s.joinDate as GameState['joinDate'],
      party: Array.isArray(s.party)
        ? s.party.map((m) => {
            const member = m as Record<string, unknown>;
            return {
              name: String(member.name),
              health: health(Number(member.health)),
              ailment: member.ailment as GameState['party'][0]['ailment'],
              thickSkinLayers: Number(member.thickSkinLayers),
              alive: Boolean(member.alive),
            };
          })
        : [],
      supplies: isRecord(s.supplies)
        ? {
            crypto: crypto(Number(s.supplies.crypto)),
            bandwidthMbps: Number(s.supplies.bandwidthMbps),
            attentionSpan: Number(s.supplies.attentionSpan),
            hotTakePacks: Number(s.supplies.hotTakePacks),
            ethernetCable: Number(s.supplies.ethernetCable),
            router: Number(s.supplies.router),
            vpnKey: Number(s.supplies.vpnKey),
          }
        : {
            crypto: crypto(0),
            bandwidthMbps: 0,
            attentionSpan: 0,
            hotTakePacks: 0,
            ethernetCable: 0,
            router: 0,
            vpnKey: 0,
          },
      pace: s.pace as GameState['pace'],
      screenTime: s.screenTime as GameState['screenTime'],
      todayVibe: s.todayVibe as GameState['todayVibe'],
      regionIndex: Number(s.regionIndex),
      farmsThisRegion: Number(s.farmsThisRegion),
      consecutiveFarmDays: Number(s.consecutiveFarmDays),
      restDaysRemaining: Number(s.restDaysRemaining),
      pendingEvent: (s.pendingEvent as GameState['pendingEvent']) ?? null,
      pendingLandmark: (s.pendingLandmark as GameState['pendingLandmark']) ?? null,
      pendingCrossing: (s.pendingCrossing as GameState['pendingCrossing']) ?? null,
      currentStoreRegion: s.currentStoreRegion as number | null,
      tradeOffer: (s.tradeOffer as GameState['tradeOffer']) ?? null,
      farming: (s.farming as GameState['farming']) ?? null,
      rapids: (s.rapids as GameState['rapids']) ?? null,
      tollRoadTaken: Boolean(s.tollRoadTaken),
      messages: Array.isArray(s.messages) ? s.messages.map(String) : [],
      epitaphs: isRecord(s.epitaphs)
        ? Object.fromEntries(Object.entries(s.epitaphs).map(([k, v]) => [k, String(v)]))
        : {},
    };
    return { version: 1, state };
  } catch {
    return null;
  }
}

export function serializeSave(state: GameState): string {
  return JSON.stringify(toSaveEnvelope(state));
}

export function deserializeSave(json: string): GameState | null {
  try {
    const parsed = JSON.parse(json) as unknown;
    const envelope = parseSaveEnvelope(parsed);
    return envelope?.state ?? null;
  } catch {
    return null;
  }
}
