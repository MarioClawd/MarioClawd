import { useState, useEffect, useRef, useCallback } from 'react';

interface ScrollProgressOptions {
  smoothing?: number;
  threshold?: number;
  onComplete?: () => void;
  completeAt?: number;
}

interface ScrollProgressState {
  progress: number;
  velocity: number;
  isScrolling: boolean;
  isComplete: boolean;
  direction: 'up' | 'down' | 'idle';
}

export function useScrollProgress(
  options: ScrollProgressOptions = {}
): ScrollProgressState {
  const {
    smoothing = 0.08,
    threshold = 0.001,
    onComplete,
    completeAt = 0.99,
  } = options;

  const [state, setState] = useState<ScrollProgressState>({
    progress: 0,
    velocity: 0,
    isScrolling: false,
    isComplete: false,
    direction: 'idle',
  });

  const rawProgress = useRef(0);
  const smoothProgress = useRef(0);
  const prevProgress = useRef(0);
  const completeFired = useRef(false);
  const rafId = useRef<number | null>(null);

  const onWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY / 5000;
      rawProgress.current = Math.max(
        0,
        Math.min(1, rawProgress.current + delta)
      );
    },
    []
  );

  useEffect(() => {
    window.addEventListener('wheel', onWheel, { passive: false });

    const tick = () => {
      smoothProgress.current +=
        (rawProgress.current - smoothProgress.current) * smoothing;

      const velocity = smoothProgress.current - prevProgress.current;
      const isScrolling = Math.abs(velocity) > threshold;
      const direction =
        velocity > threshold
          ? 'down'
          : velocity < -threshold
            ? 'up'
            : 'idle';

      const isComplete = smoothProgress.current >= completeAt;

      if (isComplete && !completeFired.current) {
        completeFired.current = true;
        onComplete?.();
      }

      setState({
        progress: smoothProgress.current,
        velocity,
        isScrolling,
        isComplete,
        direction,
      });

      prevProgress.current = smoothProgress.current;
      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('wheel', onWheel);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [smoothing, threshold, completeAt, onComplete, onWheel]);

  return state;
}
