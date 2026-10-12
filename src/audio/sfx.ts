import { loadMuted, saveMuted } from '../persistence/settings.ts';

export type SfxName =
  | 'menu_blip'
  | 'travel_tick'
  | 'event_alert'
  | 'death_dirge'
  | 'crossing_splash'
  | 'ratio_alarm'
  | 'victory_jingle';

let ctx: AudioContext | null = null;
let unlocked = false;
let muted = loadMuted();

function ensureContext(): AudioContext | null {
  if (muted) {
    return null;
  }
  if (!ctx) {
    ctx = new AudioContext();
  }
  return ctx;
}

export function unlockAudio(): void {
  const audio = ensureContext();
  if (audio && audio.state === 'suspended') {
    void audio.resume();
  }
  unlocked = true;
}

export function toggleMute(): boolean {
  muted = !muted;
  saveMuted(muted);
  return muted;
}

export function isMuted(): boolean {
  return muted;
}

function beep(freq: number, duration: number, type: OscillatorType = 'square'): void {
  if (!unlocked || muted) {
    return;
  }
  const audio = ensureContext();
  if (!audio) {
    return;
  }
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = 0.08;
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start();
  osc.stop(audio.currentTime + duration);
}

function noiseBurst(duration: number): void {
  if (!unlocked || muted) {
    return;
  }
  const audio = ensureContext();
  if (!audio) {
    return;
  }
  const bufferSize = audio.sampleRate * duration;
  const buffer = audio.createBuffer(1, bufferSize, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.2;
  }
  const source = audio.createBufferSource();
  source.buffer = buffer;
  const gain = audio.createGain();
  gain.gain.value = 0.05;
  source.connect(gain);
  gain.connect(audio.destination);
  source.start();
}

export function playSfx(name: SfxName): void {
  switch (name) {
    case 'menu_blip':
      beep(880, 0.08);
      break;
    case 'travel_tick':
      beep(440, 0.05);
      break;
    case 'event_alert':
      beep(660, 0.12);
      beep(550, 0.12);
      break;
    case 'death_dirge':
      beep(392, 0.2);
      beep(330, 0.2);
      beep(262, 0.35);
      break;
    case 'crossing_splash':
      noiseBurst(0.15);
      beep(220, 0.1);
      break;
    case 'ratio_alarm':
      beep(988, 0.08);
      beep(740, 0.08);
      break;
    case 'victory_jingle':
      beep(523, 0.1);
      beep(659, 0.1);
      beep(784, 0.15);
      break;
    default:
      break;
  }
}
