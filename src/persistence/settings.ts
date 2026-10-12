import { SAVE_ID } from '../config.ts';

const MUTE_KEY = `${SAVE_ID}:mute`;

export function loadMuted(): boolean {
  return localStorage.getItem(MUTE_KEY) === '1';
}

export function saveMuted(muted: boolean): void {
  localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
}
