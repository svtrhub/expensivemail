import { useState, useEffect } from 'react';

/**
 * Hook that detects whether the user prefers reduced motion.
 * Returns `true` when `prefers-reduced-motion: reduce` is active.
 *
 * Usage:
 *   const prefersReducedMotion = useReducedMotion();
 *   const transition = prefersReducedMotion
 *     ? { duration: 0 }
 *     : { type: 'spring', stiffness: 300, damping: 25 };
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}
