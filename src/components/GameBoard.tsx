import { useEffect, useRef } from 'react';
import type { Board, MoveTrail } from '../game/engine/types';
import {
  drawObjects,
  drawTerrain,
  easeOutCubic,
  type RenderObjectPosition,
} from '../game/rendering/render';

const ANIMATION_MS = 240;

interface GameBoardProps {
  board: Board;
  trails: MoveTrail[];
  moveId: number;
}

export function GameBoard({ board, trails, moveId }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cellSizeRef = useRef(48);
  const animRef = useRef<number | null>(null);

  // Track animated positions across renders without re-triggering React renders.
  const positionsRef = useRef<Map<string, { fromX: number; fromY: number }>>(new Map());

  useEffect(() => {
    function resize() {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const size = Math.min(container.clientWidth, container.clientHeight);
      const dpr = window.devicePixelRatio || 1;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      const ctx = canvas.getContext('2d');
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      cellSizeRef.current = size / board.cols;
      draw(1); // redraw statically at final positions on resize
    }

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board.cols, board.rows]);

  function draw(progress: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const cellSize = cellSizeRef.current;

    drawTerrain(ctx, board, cellSize);

    const eased = easeOutCubic(Math.min(1, Math.max(0, progress)));
    const positions: RenderObjectPosition[] = board.objects.map((obj) => {
      const start = positionsRef.current.get(obj.id);
      const x = start ? start.fromX + (obj.col - start.fromX) * eased : obj.col;
      const y = start ? start.fromY + (obj.row - start.fromY) * eased : obj.row;
      return { id: obj.id, type: obj.type, x, y };
    });

    drawObjects(ctx, positions, cellSize);
  }

  useEffect(() => {
    // Seed animation start positions from trails (falls back to current
    // position for objects that didn't move, so they don't "jump").
    const startMap = new Map<string, { fromX: number; fromY: number }>();
    for (const obj of board.objects) {
      const trail = trails.find((t) => t.objectId === obj.id);
      if (trail) {
        startMap.set(obj.id, { fromX: trail.from.col, fromY: trail.from.row });
      } else {
        startMap.set(obj.id, { fromX: obj.col, fromY: obj.row });
      }
    }
    positionsRef.current = startMap;

    if (animRef.current) cancelAnimationFrame(animRef.current);

    if (trails.length === 0) {
      draw(1);
      return;
    }

    const start = performance.now();
    function frame(now: number) {
      const progress = Math.min(1, (now - start) / ANIMATION_MS);
      draw(progress);
      if (progress < 1) {
        animRef.current = requestAnimationFrame(frame);
      }
    }
    animRef.current = requestAnimationFrame(frame);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moveId, board]);

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center aspect-square">
      <canvas ref={canvasRef} className="rounded-2xl shadow-2xl shadow-black/40" />
    </div>
  );
}
