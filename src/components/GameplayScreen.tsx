import { useCallback, useEffect, useRef } from 'react';
import { useGameStore } from '../game/state/store';
import { LEVELS, getLevel } from '../game/levels/levels';
import { GameBoard } from './GameBoard';
import { CompletionModal } from './CompletionModal';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { useSwipeControls } from '../hooks/useSwipeControls';
import { sfx } from '../utils/sfx';
import type { Direction } from '../game/engine/types';

export function GameplayScreen() {
  const {
    board,
    currentLevel,
    moveCount,
    history,
    won,
    lastTrails,
    lastMoveId,
    move,
    undo,
    restart,
    goTo,
    muted,
  } = useGameStore();

  const levelDef = getLevel(currentLevel);
  const swipeAreaRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (dir: Direction) => {
      const before = useGameStore.getState().moveCount;
      move(dir);
      const after = useGameStore.getState().moveCount;
      if (after > before) sfx.move(muted);
      if (useGameStore.getState().won) {
        setTimeout(() => sfx.levelComplete(muted), 150);
      }
    },
    [move, muted]
  );

  useKeyboardControls(handleMove, !won);
  useSwipeControls(swipeAreaRef, handleMove, { enabled: !won });

  // Escape returns to menu for keyboard users.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') goTo('menu');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goTo]);

  const levelIndex = LEVELS.findIndex((l) => l.id === currentLevel) + 1;

  return (
    <div className="h-full w-full flex flex-col">
      {/* Top HUD */}
      <div className="flex items-center justify-between px-4 py-3 gap-2">
        <button
          onClick={() => goTo('levelSelect')}
          className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center shrink-0"
          aria-label="Back"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-slate-100">
            <path d="M15 4 L7 12 L15 20 Z" />
          </svg>
        </button>

        <div className="text-center flex-1 min-w-0">
          <div className="text-xs text-slate-500">
            Level {levelIndex} / {LEVELS.length}
          </div>
          <div className="font-semibold truncate">{levelDef?.name}</div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-xs text-slate-500">Moves</div>
          <div className="font-mono font-semibold">{moveCount}</div>
        </div>
      </div>

      {/* Swipeable board area */}
      <div
        ref={swipeAreaRef}
        className="flex-1 min-h-0 px-4 py-2 touch-none select-none"
      >
        <GameBoard board={board} trails={lastTrails} moveId={lastMoveId} />
      </div>

      <p className="text-center text-xs text-slate-500 -mt-1 mb-2">
        Swipe anywhere on the board to tilt the world
      </p>

      {/* Bottom controls */}
      <div className="px-4 pb-6 pt-2 flex items-center justify-center gap-3">
        <button
          onClick={() => {
            sfx.click(muted);
            undo();
          }}
          disabled={history.length === 0}
          className="px-5 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-sm font-medium flex items-center gap-1.5"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-slate-100">
            <path d="M12 5 V2 L6 7 l6 5 V9 c3.3 0 6 2.7 6 6 s-2.7 6-6 6 s-6-2.7-6-6 H4 c0 4.4 3.6 8 8 8 s8-3.6 8-8 s-3.6-8-8-8 Z" />
          </svg>
          Undo
        </button>
        <button
          onClick={() => {
            sfx.click(muted);
            restart();
          }}
          className="px-5 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium flex items-center gap-1.5"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-slate-100">
            <path d="M17.65 6.35 A8 8 0 1 0 19.8 15 h-2.1 a6 6 0 1 1-1.4-6.4 L13 12 h7 V5 Z" />
          </svg>
          Restart
        </button>
      </div>

      {won && <CompletionModal />}
    </div>
  );
}
