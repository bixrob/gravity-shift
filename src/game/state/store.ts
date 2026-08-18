import { create } from 'zustand';
import { applyGravity, checkWin, serializeBoard } from '../engine/engine';
import { parseLevel } from '../engine/parseLevel';
import { getLevel, LEVELS } from '../levels/levels';
import type { Board, BoardSnapshot, Direction, MoveTrail } from '../engine/types';

const STORAGE_KEY = 'gravity-shift-progress-v1';

interface Progress {
  unlockedLevel: number;
  completedLevels: number[];
  bestMoves: Record<number, number>;
  muted: boolean;
}

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw);
    return {
      unlockedLevel: parsed.unlockedLevel ?? 1,
      completedLevels: parsed.completedLevels ?? [],
      bestMoves: parsed.bestMoves ?? {},
      muted: parsed.muted ?? false,
    };
  } catch {
    return defaultProgress();
  }
}

function defaultProgress(): Progress {
  return { unlockedLevel: 1, completedLevels: [], bestMoves: {}, muted: false };
}

function saveProgress(p: Progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    // localStorage unavailable (private browsing, quota, etc.) — fail silently.
  }
}

export type Screen = 'menu' | 'levelSelect' | 'game';

interface Store {
  screen: Screen;
  currentLevel: number;
  moveCount: number;
  board: Board;
  history: BoardSnapshot[];
  completedLevels: number[];
  unlockedLevel: number;
  bestMoves: Record<number, number>;
  muted: boolean;
  won: boolean;
  lastTrails: MoveTrail[];
  lastMoveId: number;

  goTo: (screen: Screen) => void;
  startLevel: (id: number) => void;
  move: (direction: Direction) => void;
  undo: () => void;
  restart: () => void;
  nextLevel: () => void;
  resetProgress: () => void;
  toggleMute: () => void;
}

const firstLevel = LEVELS[0];
const initialProgress = loadProgress();

export const useGameStore = create<Store>((set, get) => ({
  screen: 'menu',
  currentLevel: firstLevel.id,
  moveCount: 0,
  board: parseLevel(firstLevel),
  history: [],
  completedLevels: initialProgress.completedLevels,
  unlockedLevel: initialProgress.unlockedLevel,
  bestMoves: initialProgress.bestMoves,
  muted: initialProgress.muted,
  won: false,
  lastTrails: [],
  lastMoveId: 0,

  goTo: (screen) => set({ screen }),

  startLevel: (id) => {
    const def = getLevel(id);
    if (!def) return;
    set({
      screen: 'game',
      currentLevel: id,
      moveCount: 0,
      board: parseLevel(def),
      history: [],
      won: false,
      lastTrails: [],
    });
  },

  move: (direction) => {
    const state = get();
    if (state.won) return;

    const before = state.board;
    const result = applyGravity(direction, before);
    if (!result.moved) return; // no-op move, nothing slid

    const snapshot: BoardSnapshot = { objects: before.objects, moveCount: state.moveCount };
    const newHistory = [...state.history, snapshot];
    const newMoveCount = state.moveCount + 1;
    const won = checkWin(result.board);

    set({
      board: result.board,
      moveCount: newMoveCount,
      history: newHistory,
      lastTrails: result.trails,
      lastMoveId: state.lastMoveId + 1,
      won,
    });

    if (won) {
      const level = state.currentLevel;
      const completed = state.completedLevels.includes(level)
        ? state.completedLevels
        : [...state.completedLevels, level];
      const prevBest = state.bestMoves[level];
      const bestMoves = {
        ...state.bestMoves,
        [level]: prevBest === undefined ? newMoveCount : Math.min(prevBest, newMoveCount),
      };
      const unlockedLevel = Math.max(state.unlockedLevel, level + 1);

      set({ completedLevels: completed, bestMoves, unlockedLevel });
      saveProgress({
        completedLevels: completed,
        bestMoves,
        unlockedLevel,
        muted: state.muted,
      });
    }
  },

  undo: () => {
    const state = get();
    if (state.history.length === 0) return;
    const prev = state.history[state.history.length - 1];
    const restoredBoard: Board = {
      ...state.board,
      objects: prev.objects,
    };
    set({
      board: restoredBoard,
      moveCount: prev.moveCount,
      history: state.history.slice(0, -1),
      won: false,
      lastTrails: [],
    });
  },

  restart: () => {
    const def = getLevel(get().currentLevel);
    if (!def) return;
    set({
      board: parseLevel(def),
      moveCount: 0,
      history: [],
      won: false,
      lastTrails: [],
    });
  },

  nextLevel: () => {
    const next = get().currentLevel + 1;
    const def = getLevel(next);
    if (!def) {
      set({ screen: 'levelSelect' });
      return;
    }
    get().startLevel(next);
  },

  resetProgress: () => {
    const fresh = defaultProgress();
    set({
      completedLevels: fresh.completedLevels,
      unlockedLevel: fresh.unlockedLevel,
      bestMoves: fresh.bestMoves,
    });
    saveProgress({ ...fresh, muted: get().muted });
  },

  toggleMute: () => {
    const muted = !get().muted;
    set({ muted });
    saveProgress({
      completedLevels: get().completedLevels,
      bestMoves: get().bestMoves,
      unlockedLevel: get().unlockedLevel,
      muted,
    });
  },
}));

// Exported for tests / debugging without needing to touch the store internals.
export function boardKey(board: Board): string {
  return serializeBoard(board);
}
