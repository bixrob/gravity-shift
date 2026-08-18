import type { Board, GameObject, LevelDefinition, ObjectType, TerrainType } from './types';

/**
 * Converts a LevelDefinition's ASCII grid into a Board.
 *
 * Legend:
 *   # = Wall
 *   . = Empty
 *   O = Target Orb (movable)
 *   B = Block (movable)
 *   X = Goal
 *   C = Crystal (movable, optional collectible)
 */
export function parseLevel(level: LevelDefinition): Board {
  const rows = level.grid.length;
  const cols = level.grid[0]?.length ?? 0;

  for (const row of level.grid) {
    if (row.length !== cols) {
      throw new Error(
        `Level ${level.id} ("${level.name}") has inconsistent row widths.`
      );
    }
  }

  const terrain: TerrainType[][] = [];
  const objects: GameObject[] = [];
  let objectCounter = 0;

  for (let r = 0; r < rows; r++) {
    const terrainRow: TerrainType[] = [];
    for (let c = 0; c < cols; c++) {
      const ch = level.grid[r][c];
      let cellTerrain: TerrainType = 'empty';
      let objectType: ObjectType | null = null;

      switch (ch) {
        case '#':
          cellTerrain = 'wall';
          break;
        case '.':
          cellTerrain = 'empty';
          break;
        case 'X':
          cellTerrain = 'goal';
          break;
        case 'O':
          cellTerrain = 'empty';
          objectType = 'orb';
          break;
        case 'B':
          cellTerrain = 'empty';
          objectType = 'block';
          break;
        case 'C':
          cellTerrain = 'empty';
          objectType = 'crystal';
          break;
        default:
          throw new Error(
            `Level ${level.id} ("${level.name}") has unknown symbol "${ch}" at (${r},${c}).`
          );
      }

      terrainRow.push(cellTerrain);
      if (objectType) {
        objects.push({
          id: `${objectType}-${objectCounter++}`,
          type: objectType,
          row: r,
          col: c,
        });
      }
    }
    terrain.push(terrainRow);
  }

  return { rows, cols, terrain, objects };
}

/** Deep-clones a board so engine functions never mutate their input. */
export function cloneBoard(board: Board): Board {
  return {
    rows: board.rows,
    cols: board.cols,
    terrain: board.terrain.map((row) => [...row]),
    objects: board.objects.map((o) => ({ ...o })),
  };
}
