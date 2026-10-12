import { SAVE_ID } from '../config.ts';
import type { GameState } from '../logic/types.ts';
import { deserializeSave, serializeSave } from '../logic/serialize.ts';

export interface SaveStore {
  load(slot: string): GameState | null;
  save(slot: string, state: GameState): void;
  clear(slot: string): void;
}

export class LocalStorageSaveStore implements SaveStore {
  private prefix = SAVE_ID;

  private key(slot: string): string {
    return `${this.prefix}:save:${slot}`;
  }

  load(slot: string): GameState | null {
    const raw = localStorage.getItem(this.key(slot));
    if (!raw) {
      return null;
    }
    return deserializeSave(raw);
  }

  save(slot: string, state: GameState): void {
    localStorage.setItem(this.key(slot), serializeSave(state));
  }

  clear(slot: string): void {
    localStorage.removeItem(this.key(slot));
  }
}

export function maybeAutosave(state: GameState, store: SaveStore): void {
  if (state.scene === 'landmark' || state.scene === 'crossing') {
    store.save('main', state);
  }
}
