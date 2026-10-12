import type { PaletteKey } from '../palette.ts';

export interface Sprite {
  width: number;
  height: number;
  rows: string[];
}

const CHAR_FOR: Record<PaletteKey, string> = {
  black: 'k',
  purple: 'p',
  orange: 'o',
  green: 'g',
  white: 'w',
  blue: 'b',
};

function fill(w: number, h: number, sky: PaletteKey, ground: PaletteKey): Sprite {
  const skyCh = CHAR_FOR[sky];
  const groundCh = CHAR_FOR[ground];
  const groundStart = Math.floor(h * 0.65);
  const rows: string[] = [];
  for (let y = 0; y < h; y++) {
    const ch = y >= groundStart ? groundCh : skyCh;
    rows.push(ch.repeat(w));
  }
  return { width: w, height: h, rows };
}

export const BACKDROPS: Record<string, Sprite> = {
  reddit: fill(280, 192, 'black', 'orange'),
  tiktok: fill(280, 192, 'purple', 'black'),
  linkedin: fill(280, 192, 'blue', 'white'),
  youtube: fill(280, 192, 'black', 'green'),
  x: fill(280, 192, 'black', 'white'),
  default: fill(280, 192, 'black', 'blue'),
};

export const PARTY_GLYPH: Sprite = {
  width: 8,
  height: 8,
  rows: [
    '..ww....',
    '.wwww...',
    '..ww....',
    '..gg....',
    '..gg....',
    '.bbbb...',
    '.bbbb...',
    '........',
  ],
};

const COLOR_MAP: Record<string, PaletteKey | null> = {
  '.': null,
  b: 'blue',
  g: 'green',
  w: 'white',
  o: 'orange',
  p: 'purple',
  k: 'black',
};

export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite,
  ox: number,
  oy: number,
  scale: number,
  colors: Record<PaletteKey, string>,
): void {
  for (let y = 0; y < sprite.height; y++) {
    const row = sprite.rows[y] ?? '';
    for (let x = 0; x < sprite.width; x++) {
      const ch = row[x] ?? '.';
      const key = COLOR_MAP[ch];
      if (!key) {
        continue;
      }
      ctx.fillStyle = colors[key];
      ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
    }
  }
}
