import { useGameStore } from '../game/state/store';
import { LEVELS } from '../game/levels/levels';
import { sfx } from '../utils/sfx';

export function CompletionModal() {
  const { currentLevel, moveCount, bestMoves, restart, nextLevel, goTo, muted } = useGameStore();
  const hasNext = currentLevel < LEVELS.length;
  const best = bestMoves[currentLevel];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-6">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-700 animate-[fadeIn_0.2s_ease-out]">
        <div className="text-emerald-400 text-4xl mb-2">✓</div>
        <h2 className="text-2xl font-bold mb-1">Level Complete</h2>
        <p className="text-slate-400 mb-5">
          {moveCount} moves
          {best !== undefined && best < moveCount ? ` · best: ${best}` : ' · new best!'}
        </p>

        <div className="flex flex-col gap-3">
          {hasNext && (
            <button
              onClick={() => {
                sfx.click(muted);
                nextLevel();
              }}
              className="py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all font-semibold"
            >
              Next Level
            </button>
          )}
          <button
            onClick={() => {
              sfx.click(muted);
              restart();
            }}
            className="py-3 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 transition-all font-medium"
          >
            Replay
          </button>
          <button
            onClick={() => {
              sfx.click(muted);
              goTo('menu');
            }}
            className="py-2 text-sm text-slate-400 hover:text-slate-200"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
