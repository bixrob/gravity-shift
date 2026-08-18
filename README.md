# Gravity Shift

A mobile-first puzzle game prototype. Tilt the world — every movable object
slides simultaneously in the chosen direction — and guide the Target Orb to
the Goal tile.

## Stack

React + TypeScript + Vite + Zustand + Tailwind CSS + HTML5 Canvas rendering.

## Getting started

```bash
npm install
npm run dev       # start the dev server
npm run build     # production build -> dist/
npm run test      # run the Vitest engine test suite (npx vitest run)
```

## Project structure

```
src/
  components/     React UI (menu, level select, gameplay screen, board, controls)
  game/
    engine/       Pure functions: parseLevel, applyGravity, checkWin, serializeBoard
    levels/       20 handcrafted, BFS-verified levels (levels.ts)
    rendering/    Canvas drawing functions (walls, goal, orb, block)
    state/        Zustand store + localStorage persistence
  hooks/          useKeyboardControls (arrows/WASD)
  utils/          Placeholder WebAudio SFX
  tests/          Vitest unit tests for the engine and level pack
```

## Design notes

- The engine is fully decoupled from React — `applyGravity`, `checkWin`,
  `resolveCollisions`, and `serializeBoard` are pure functions operating on
  a `Board` value, enabling the automated level-solvability tests.
- All 20 levels were generated and BFS-solved by a scripted verifier to
  guarantee: exactly one orb, exactly one goal, an 8x8 grid, and an optimal
  solution length ≤ 12 moves (see `optimalMoves` on each `LevelDefinition`).
- Progress (unlocked level, completed levels, best move counts, mute state)
  persists to `localStorage` under the key `gravity-shift-progress-v1`.
- No backend, no accounts, no online features — matches the MVP scope.
