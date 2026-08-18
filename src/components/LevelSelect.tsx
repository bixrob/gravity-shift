import { useGameStore } from '../game/state/store';
import { LEVELS } from '../game/levels/levels';
import { sfx } from '../utils/sfx';

export function LevelSelect() {
  const { goTo, startLevel, completedLevels, unlockedLevel, muted, bestMoves } = useGameStore();

  return (
    <div className="h-full w-full flex flex-col px-6 py-8 max-w-md mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => {
            sfx.click(muted);
            goTo('menu');
          }}
          className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 flex items-center justify-center"
          aria-label="Back"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-slate-100">
            <path d="M15 4 L7 12 L15 20 Z" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold">Select Level</h2>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {LEVELS.map((level) => {
          const completed = completedLevels.includes(level.id);
          const unlocked = level.id <= unlockedLevel;
          const best = bestMoves[level.id];

          let colorClass = 'bg-slate-800 text-slate-600';
          if (completed) colorClass = 'bg-emerald-600 text-white hover:bg-emerald-500';
          else if (unlocked) colorClass = 'bg-blue-600 text-white hover:bg-blue-500';

          return (
            <button
              key={level.id}
              disabled={!unlocked}
              onClick={() => {
                sfx.click(muted);
                startLevel(level.id);
              }}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center font-semibold transition-all active:scale-95 disabled:pointer-events-none ${colorClass}`}
              title={level.name}
            >
              <span className="text-lg">{level.id}</span>
              {best !== undefined && <span className="text-[10px] opacity-80">{best} mv</span>}
              {!unlocked && (
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-slate-500 mt-0.5">
                  <path d="M6 10 V8 a6 6 0 0 1 12 0 v2 h1 a1 1 0 0 1 1 1 v9 a1 1 0 0 1-1 1 H5 a1 1 0 0 1-1-1 v-9 a1 1 0 0 1 1-1 Z M8 10 h8 V8 a4 4 0 0 0-8 0 Z" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
