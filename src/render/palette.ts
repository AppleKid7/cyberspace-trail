export const PALETTE = {
  black: '#000000',
  purple: '#a855f7',
  orange: '#ff6b35',
  green: '#33ff57',
  white: '#f5f5f5',
  blue: '#3b82f6',
} as const;

export type PaletteKey = keyof typeof PALETTE;

export const PALETTE_ORDER: PaletteKey[] = ['black', 'purple', 'orange', 'green', 'white', 'blue'];
