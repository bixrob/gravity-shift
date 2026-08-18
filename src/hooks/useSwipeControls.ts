import { useEffect, useRef } from 'react';
import type { Direction } from '../game/engine/types';

interface SwipeOptions {
  /** Minimum drag distance (px) before it counts as a swipe, not a tap. */
  threshold?: number;
  enabled?: boolean;
}

/**
 * Attaches touch (and mouse, for desktop testing) swipe detection to the
 * given element ref. Fires onDirection once per completed swipe gesture,
 * choosing whichever axis moved further.
 */
export function useSwipeControls(
  targetRef: React.RefObject<HTMLElement | null>,
  onDirection: (dir: Direction) => void,
  { threshold = 30, enabled = true }: SwipeOptions = {}
) {
  const startRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = targetRef.current;
    if (!el || !enabled) return;

    function resolveDirection(dx: number, dy: number): Direction | null {
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (Math.max(absX, absY) < threshold) return null;
      if (absX > absY) return dx > 0 ? 'right' : 'left';
      return dy > 0 ? 'down' : 'up';
    }

    function onTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      startRef.current = { x: t.clientX, y: t.clientY };
    }

    function onTouchEnd(e: TouchEvent) {
      const start = startRef.current;
      startRef.current = null;
      if (!start) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      const dir = resolveDirection(dx, dy);
      if (dir) onDirection(dir);
    }

    // Mouse drag support so swipes are also testable with a trackpad/mouse
    // during desktop development.
    function onMouseDown(e: MouseEvent) {
      startRef.current = { x: e.clientX, y: e.clientY };
    }

    function onMouseUp(e: MouseEvent) {
      const start = startRef.current;
      startRef.current = null;
      if (!start) return;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const dir = resolveDirection(dx, dy);
      if (dir) onDirection(dir);
    }

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('mouseup', onMouseUp);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('mouseup', onMouseUp);
    };
  }, [targetRef, onDirection, threshold, enabled]);
}
