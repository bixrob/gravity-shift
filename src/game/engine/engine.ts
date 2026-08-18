import { cloneBoard } from './parseLevel';
import type { Board, Direction, GravityResult, MoveTrail } from './types';

const DELTA: Record<Direction, { dr: number; dc: number }> = {
  up: { dr: -1, dc: 0 },
  down: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
  right: { dr: 0, dc: 1 },
};

function key(row: number, col: number): string {
  return `${row},${col}`;
}

function inBounds(board: Board, row: number, col: number): boolean {
  return row >= 0 && row < board.rows && col >= 0 && col < board.cols;
}

/**
 * Order in which objects should resolve their slide so that objects nearer
 * the direction of travel settle first, letting followers stack behind them.
 * This is what makes the movement feel "simultaneous."
 */
function resolutionOrder(board: Board, direction: Direction) {
  const objs = [...board.objects];
  switch (direction) {
    case 'right':
      return objs.sort((a, b) => b.col - a.col);
    case 'left':
      return objs.sort((a, b) => a.col - b.col);
    case 'down':
      return objs.sort((a, b) => b.row - a.row);
    case 'up':
      return objs.sort((a, b) => a.row - b.row);
  }
}

/**
 * Applies gravity in a direction: every movable object slides simultaneously
 * until it hits a wall, the board edge, another (now-stopped) object, or —
 * for the Target Orb only — the Goal tile.
 *
 * Pure function: does not mutate the input board.
 */
export function applyGravity(direction: Direction, board: Board): GravityResult {
  const next = cloneBoard(board);
  const { dr, dc } = DELTA[direction];
  const order = resolutionOrder(next, direction);

  const occupied = new Set(next.objects.map((o) => key(o.row, o.col)));
  const trails: MoveTrail[] = [];
  let moved = false;

  for (const obj of order) {
    const from = { row: obj.row, col: obj.col };
    occupied.delete(key(obj.row, obj.col));

    let row = obj.row;
    let col = obj.col;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const nr = row + dr;
      const nc = col + dc;

      if (!inBounds(next, nr, nc)) break;
      if (next.terrain[nr][nc] === 'wall') break;
      if (occupied.has(key(nr, nc))) break;

      row = nr;
      col = nc;

      // Only the Target Orb is stopped by the Goal tile.
      if (obj.type === 'orb' && next.terrain[row][col] === 'goal') break;
    }

    obj.row = row;
    obj.col = col;
    occupied.add(key(row, col));

    if (row !== from.row || col !== from.col) {
      moved = true;
      trails.push({ objectId: obj.id, from, to: { row, col } });
    }
  }

  return { board: next, trails, moved };
}

/** True when the Target Orb currently occupies the Goal tile. */
export function checkWin(board: Board): boolean {
  return board.objects.some(
    (o) => o.type === 'orb' && board.terrain[o.row][o.col] === 'goal'
  );
}

/**
 * Deterministic string representation of a board's object layout.
 * Useful for tests, memoization, and detecting "no-op" moves.
 */
export function serializeBoard(board: Board): string {
  const sorted = [...board.objects].sort((a, b) => a.id.localeCompare(b.id));
  return sorted.map((o) => `${o.id}:${o.row}:${o.col}`).join('|');
}

/**
 * Resolves collisions for a board that already contains objects mid-slide.
 * Exposed separately from applyGravity for testability / future reuse
 * (e.g. resolving a board after an external mutation).
 */
export function resolveCollisions(board: Board): Board {
  const next = cloneBoard(board);
  const occupied = new Set<string>();
  const seen = new Set<string>();

  for (const obj of next.objects) {
    let k = key(obj.row, obj.col);
    // If two objects illegally share a cell, nudge duplicates isn't valid
    // gameplay — this only guards against malformed level data.
    if (occupied.has(k)) {
      seen.add(obj.id);
    }
    occupied.add(k);
  }

  if (seen.size > 0) {
    throw new Error(
      `Board has overlapping objects: ${[...seen].join(', ')}. Check level data.`
    );
  }

  return next;
}
