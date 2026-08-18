// Core type definitions for Gravity Shift

export type Direction = 'up' | 'down' | 'left' | 'right';

/** Static terrain painted on a grid cell (never moves). */
export type TerrainType = 'empty' | 'wall' | 'goal';

/** A movable entity that slides across the board. */
export type ObjectType = 'orb' | 'block' | 'crystal';

export interface GameObject {
  id: string;
  type: ObjectType;
  row: number;
  col: number;
}

export interface Board {
  rows: number;
  cols: number;
  /** terrain[row][col] */
  terrain: TerrainType[][];
  objects: GameObject[];
}

export interface LevelDefinition {
  id: number;
  name: string;
  /** ASCII grid: '#'=wall '.'=empty 'O'=orb 'B'=block 'X'=goal 'C'=crystal(optional) */
  grid: string[];
  /** Optional designer-authored optimal move count, used for star ratings / hints. */
  optimalMoves?: number;
}

export interface BoardSnapshot {
  objects: GameObject[];
  moveCount: number;
}

export interface GameState {
  currentLevel: number;
  moveCount: number;
  board: Board;
  history: BoardSnapshot[];
  completedLevels: number[];
}

export interface MoveTrail {
  objectId: string;
  from: { row: number; col: number };
  to: { row: number; col: number };
}

export interface GravityResult {
  board: Board;
  trails: MoveTrail[];
  moved: boolean;
}
