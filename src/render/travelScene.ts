import { REGIONS } from '../logic/regions.ts';
import type { GameState } from '../logic/types.ts';
import { PALETTE } from './palette.ts';
import { BACKDROPS, drawSprite, PARTY_GLYPH } from './sprites/backdrops.ts';

export function renderTravelScene(ctx: CanvasRenderingContext2D, state: GameState): void {
  const region = REGIONS[state.regionIndex];
  const backdrop = BACKDROPS[region?.id ?? 'default'] ?? BACKDROPS.default;
  ctx.fillStyle = PALETTE.black;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  if (backdrop) {
    drawSprite(ctx, backdrop, 0, 0, 1, PALETTE);
  }
  const progress = state.distance / 2000;
  const x = Math.floor(20 + progress * 220);
  drawSprite(ctx, PARTY_GLYPH, x, 150, 2, PALETTE);
  ctx.fillStyle = PALETTE.white;
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillText(region?.name ?? 'Trail', 8, 12);
  if (state.todayVibe) {
    ctx.fillText(`Vibe: ${state.todayVibe}`, 8, 24);
  }
}

export function renderFarmingScene(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.fillStyle = PALETTE.black;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = PALETTE.white;
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillText('Engagement Farming', 8, 12);
  const session = state.farming;
  if (!session) {
    return;
  }
  ctx.fillText(`Sus: ${Math.floor(session.sus)}`, 8, 24);
  ctx.fillText(`Haul: ${session.haul}`, 8, 36);
  for (const post of session.posts) {
    const laneX = 60 + post.lane * 70;
    ctx.fillStyle = post.kind === 'ai_topic' ? PALETTE.orange : PALETTE.blue;
    ctx.fillRect(laneX, post.y, 40, 12);
  }
  ctx.fillStyle = PALETTE.green;
  ctx.fillRect(130, 160, 20, 8);
}

export function renderRapidsScene(ctx: CanvasRenderingContext2D, state: GameState): void {
  ctx.fillStyle = PALETTE.blue;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const session = state.rapids;
  if (!session) {
    return;
  }
  ctx.fillStyle = PALETTE.white;
  ctx.fillRect(session.x - 8, 170, 16, 20);
  for (const obs of session.obstacles) {
    ctx.fillStyle = obs.kind === 'rage_bait' ? PALETTE.orange : PALETTE.purple;
    ctx.fillRect(obs.x, obs.y, 14, 14);
  }
  ctx.fillStyle = PALETTE.white;
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillText(`Hits ${session.hits}`, 8, 12);
}
