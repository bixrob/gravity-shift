import type { Board, ObjectType } from '../engine/types';

export const COLORS = {
  background: '#0F172A',
  grid: '#1E293B',
  wall: '#334155',
  goal: '#F59E0B',
  orb: '#2563EB',
  block: '#94A3B8',
  accent: '#22C55E',
};

export interface RenderObjectPosition {
  id: string;
  type: ObjectType;
  x: number; // animated pixel-space row/col (fractional)
  y: number;
}

/**
 * Draws the static terrain layer (background, grid lines, walls, goal).
 */
export function drawTerrain(ctx: CanvasRenderingContext2D, board: Board, cellSize: number) {
  const { rows, cols, terrain } = board;

  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, cols * cellSize, rows * cellSize);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellSize;
      const y = r * cellSize;
      const t = terrain[r][c];

      if (t === 'wall') {
        ctx.fillStyle = COLORS.wall;
        roundRect(ctx, x + 2, y + 2, cellSize - 4, cellSize - 4, 6);
        ctx.fill();
      } else {
        ctx.fillStyle = COLORS.grid;
        roundRect(ctx, x + 1, y + 1, cellSize - 2, cellSize - 2, 8);
        ctx.fill();

        if (t === 'goal') {
          drawGoal(ctx, x + cellSize / 2, y + cellSize / 2, cellSize * 0.32);
        }
      }
    }
  }
}

function drawGoal(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  const gradient = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
  gradient.addColorStop(0, 'rgba(245, 158, 11, 0.9)');
  gradient.addColorStop(1, 'rgba(245, 158, 11, 0.15)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = COLORS.goal;
  ctx.lineWidth = Math.max(2, radius * 0.12);
  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.62, 0, Math.PI * 2);
  ctx.stroke();
}

/**
 * Draws movable objects at their (possibly animated) positions.
 * positions are given in *cell units* (e.g. row=2.5 means halfway through
 * an animated slide), not pixels.
 */
export function drawObjects(
  ctx: CanvasRenderingContext2D,
  positions: RenderObjectPosition[],
  cellSize: number
) {
  for (const obj of positions) {
    const cx = obj.x * cellSize + cellSize / 2;
    const cy = obj.y * cellSize + cellSize / 2;

    if (obj.type === 'orb') {
      drawOrb(ctx, cx, cy, cellSize * 0.34);
    } else if (obj.type === 'block') {
      drawBlock(ctx, cx, cy, cellSize * 0.72);
    } else if (obj.type === 'crystal') {
      drawCrystal(ctx, cx, cy, cellSize * 0.28);
    }
  }
}

function drawOrb(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  ctx.save();
  ctx.shadowColor = 'rgba(37, 99, 235, 0.6)';
  ctx.shadowBlur = radius * 0.8;

  const gradient = ctx.createRadialGradient(
    cx - radius * 0.3,
    cy - radius * 0.3,
    radius * 0.1,
    cx,
    cy,
    radius
  );
  gradient.addColorStop(0, '#60A5FA');
  gradient.addColorStop(1, COLORS.orb);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBlock(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.fillStyle = COLORS.block;
  roundRect(ctx, cx - size / 2, cy - size / 2, size, size, size * 0.18);
  ctx.fill();

  ctx.strokeStyle = 'rgba(15, 23, 42, 0.35)';
  ctx.lineWidth = 2;
  roundRect(ctx, cx - size / 2 + 4, cy - size / 2 + 4, size - 8, size - 8, size * 0.12);
  ctx.stroke();
  ctx.restore();
}

function drawCrystal(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
  ctx.save();
  ctx.fillStyle = COLORS.accent;
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius);
  ctx.lineTo(cx + radius * 0.8, cy);
  ctx.lineTo(cx, cy + radius);
  ctx.lineTo(cx - radius * 0.8, cy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

/** Cubic ease-out, used for the 200-300ms slide animation. */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
