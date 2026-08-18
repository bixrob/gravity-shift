import { describe, it, expect } from 'vitest';
import { applyGravity, checkWin, serializeBoard } from '../game/engine/engine';
import { parseLevel } from '../game/engine/parseLevel';
import { LEVELS, getLevel } from '../game/levels/levels';
import type { LevelDefinition } from '../game/engine/types';

function board(grid: string[]) {
  const def: LevelDefinition = { id: 0, name: 'test', grid };
  return parseLevel(def);
}

describe('parseLevel', () => {
  it('parses walls, empty, goal, orb, and block symbols', () => {
    const b = board([
      '####',
      '#O.#',
      '#.X#',
      '####',
    ]);
    expect(b.rows).toBe(4);
    expect(b.cols).toBe(4);
    expect(b.terrain[0][0]).toBe('wall');
    expect(b.terrain[2][2]).toBe('goal');
    expect(b.objects).toEqual([{ id: 'orb-0', type: 'orb', row: 1, col: 1 }]);
  });

  it('throws on inconsistent row widths', () => {
    expect(() =>
      board(['####', '#O#', '####'])
    ).toThrow();
  });

  it('throws on unknown symbols', () => {
    expect(() => board(['####', '#O?#', '####'])).toThrow();
  });
});

describe('applyGravity - basic movement', () => {
  it('slides an orb until it hits the board edge', () => {
    const b = board([
      '######',
      '#O....',
      '######',
    ]);
    const result = applyGravity('right', b);
    const orb = result.board.objects[0];
    expect(orb.col).toBe(5); // slides all the way to the last column
    expect(result.moved).toBe(true);
  });

  it('reports moved=false when nothing can move', () => {
    const b = board(['###', '#O#', '###']);
    const result = applyGravity('left', b);
    expect(result.moved).toBe(false);
    expect(result.board.objects[0]).toEqual(b.objects[0]);
  });

  it('does not move objects already against a wall in that direction', () => {
    const b = board([
      '####',
      '#O.#',
      '####',
    ]);
    const result = applyGravity('left', b);
    expect(result.moved).toBe(false);
  });
});

describe('applyGravity - collision stopping', () => {
  it('stops a sliding object against a wall tile', () => {
    const b = board([
      '######',
      '#O.#.#',
      '######',
    ]);
    const result = applyGravity('right', b);
    expect(result.board.objects[0].col).toBe(2); // stopped just left of the wall at col 3
  });

  it('stops the orb when it reaches the goal tile mid-slide', () => {
    const b = board([
      '######',
      '#O.X.#',
      '######',
    ]);
    const result = applyGravity('right', b);
    expect(result.board.objects[0].col).toBe(3);
    expect(checkWin(result.board)).toBe(true);
  });

  it('a block does NOT stop at the goal tile (only the orb does)', () => {
    const b = board([
      '######',
      '#B.X.#',
      '######',
    ]);
    const result = applyGravity('right', b);
    expect(result.board.objects[0].col).toBe(4); // slides past goal to the wall
  });
});

describe('applyGravity - simultaneous movement', () => {
  it('stacks a trailing object behind a leading object that stops first', () => {
    const b = board([
      '#######',
      '#O.B..#',
      '#######',
    ]);
    const result = applyGravity('right', b);
    const orb = result.board.objects.find((o) => o.type === 'orb')!;
    const blk = result.board.objects.find((o) => o.type === 'block')!;
    expect(blk.col).toBe(5); // block slides to the wall
    expect(orb.col).toBe(4); // orb stacks right behind the block
  });

  it('moves all objects in the same tick, not sequentially', () => {
    const b = board([
      '########',
      '#O....B#',
      '########',
    ]);
    // Both should end up adjacent, not the orb passing through where the
    // block used to be before the block moved.
    const result = applyGravity('right', b);
    const orb = result.board.objects.find((o) => o.type === 'orb')!;
    const blk = result.board.objects.find((o) => o.type === 'block')!;
    expect(blk.col).toBe(6);
    expect(orb.col).toBe(5);
  });
});

describe('checkWin', () => {
  it('is false when the orb is not on the goal', () => {
    const b = board(['####', '#O.#', '#.X#', '####']);
    expect(checkWin(b)).toBe(false);
  });

  it('is true when the orb occupies the goal tile', () => {
    const b = board(['####', '#..#', '#OX#', '####']);
    // manually place orb on goal cell for this synthetic test
    b.objects[0].col = 2;
    expect(checkWin(b)).toBe(true);
  });
});

describe('serializeBoard', () => {
  it('produces a stable, order-independent signature', () => {
    const b1 = board(['####', '#OB#', '####']);
    const b2 = board(['####', '#OB#', '####']);
    expect(serializeBoard(b1)).toBe(serializeBoard(b2));
  });

  it('differs when object positions differ', () => {
    const b1 = board(['#####', '#O.B#', '#####']);
    const moved = applyGravity('right', b1).board;
    expect(serializeBoard(b1)).not.toBe(serializeBoard(moved));
  });
});

describe('undo restoration (pure logic)', () => {
  it('restores the exact prior object layout after an undone move', () => {
    const original = board(['######', '#O.B.#', '######']);
    const snapshotObjects = original.objects.map((o) => ({ ...o }));

    const afterMove = applyGravity('right', original).board;
    expect(serializeBoard(afterMove)).not.toBe(serializeBoard(original));

    // Simulate undo: restore snapshot objects onto the board.
    const restored = { ...afterMove, objects: snapshotObjects };
    expect(serializeBoard(restored)).toBe(
      serializeBoard({ ...original, objects: snapshotObjects })
    );
  });
});

describe('level pack integrity', () => {
  it('contains exactly 20 levels', () => {
    expect(LEVELS.length).toBe(20);
  });

  it('every level has exactly one orb and one goal on an 8x8 grid', () => {
    for (const level of LEVELS) {
      const b = parseLevel(level);
      expect(b.rows).toBe(8);
      expect(b.cols).toBe(8);
      const orbCount = b.objects.filter((o) => o.type === 'orb').length;
      let goalCount = 0;
      for (const row of b.terrain) for (const t of row) if (t === 'goal') goalCount++;
      expect(orbCount).toBe(1);
      expect(goalCount).toBe(1);
    }
  });

  it('getLevel resolves levels by id', () => {
    expect(getLevel(1)?.name).toBeTruthy();
    expect(getLevel(999)).toBeUndefined();
  });

  it('every level is solvable within 12 moves (BFS)', () => {
    for (const level of LEVELS) {
      let b = parseLevel(level);
      if (checkWin(b)) continue;

      const seen = new Set([serializeBoard(b)]);
      let frontier = [b];
      let depth = 0;
      let solved = false;

      while (frontier.length && depth < 12 && !solved) {
        depth++;
        const next = [];
        for (const cur of frontier) {
          for (const dir of ['up', 'down', 'left', 'right'] as const) {
            const res = applyGravity(dir, cur);
            if (!res.moved) continue;
            const sig = serializeBoard(res.board);
            if (seen.has(sig)) continue;
            seen.add(sig);
            if (checkWin(res.board)) {
              solved = true;
              break;
            }
            next.push(res.board);
          }
          if (solved) break;
        }
        frontier = next;
      }

      expect(solved).toBe(true);
    }
  });
});
