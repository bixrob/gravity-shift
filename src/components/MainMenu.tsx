import { useGameStore } from '../game/state/store';
import { LEVELS } from '../game/levels/levels';
import { sfx } from '../utils/sfx';

export function MainMenu() {
  const { goTo, startLevel, completedLevels, resetProgress, muted, toggleMute, unlockedLevel } =
    useGameStore();

  const total = LEVELS.length;
  const done = completedLevels.length;

  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-8 px-6 text-center">
      <div>
        <h1 className="text-5xl font-bold tracking-tight text-slate-50">
          Gravity <span className="text-blue-500">Shift</span>
        </h1>
        <p className="mt-3 text-slate-400 max-w-xs mx-auto">
          Tilt the world. Slide the orb to the goal.
        </p>
      </div>

      <div className="text-sm text-slate-500">
        {done} / {total} levels completed
      </div>

      <div className="flex flex-col gap-3 w-64">
        <button
          onClick={() => {
            sfx.click(muted);
            const resumeLevel = Math.min(unlockedLevel, total);
            startLevel(resumeLevel);
          }}
          className="py-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 transition-all text-lg font-semibold shadow-lg shadow-blue-900/40"
        >
          Play
        </button>
        <button
          onClick={() => {
            sfx.click(muted);
            goTo('levelSelect');
          }}
          className="py-4 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 transition-all text-lg font-medium"
        >
          Select Level
        </button>
        <button
          onClick={() => {
            sfx.click(muted);
            if (confirm('Reset all progress? This cannot be undone.')) {
              resetProgress();
            }
          }}
          className="py-3 rounded-xl bg-transparent border border-slate-700 hover:border-red-500/60 hover:text-red-400 active:scale-95 transition-all text-sm text-slate-400"
        >
          Reset Progress
        </button>
      </div>

      <button
        onClick={() => toggleMute()}
        className="text-xs text-slate-500 hover:text-slate-300 mt-2"
      >
        Sound: {muted ? 'Off' : 'On'} (tap to toggle)
      </button>
    </div>
  );
}
