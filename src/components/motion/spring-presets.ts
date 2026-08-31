/**
 * Centralized spring physics presets following Emil Kowalski's design-engineering-pro standards.
 * Used by motion/react components throughout the app.
 *
 * These presets map to specific interaction tiers:
 *   - springSnappy: Button press, quick UI feedback (100-160ms feel)
 *   - springSmooth: Modals, popovers, content transitions (200-300ms feel)
 *   - springDrawer: iOS-style sheet/drawer pull (heavier mass for satisfying drag)
 *   - springBouncy: Rare delight moments only (achievement, onboarding)
 */

import type { Transition } from 'motion/react';

// ─── Spring Presets ────────────────────────────────────────────

/** Snappy / Button Press / UI Feedback — 100-160ms perceived */
export const springSnappy = { stiffness: 400, damping: 30, mass: 0.8 };

/** Smooth / Modals / Popovers — 200-300ms perceived */
export const springSmooth = { stiffness: 250, damping: 25, mass: 1 };

/** iOS-style Drawer / Sheet — heavier mass for satisfying pull */
export const springDrawer = { stiffness: 300, damping: 32, mass: 1.2 };

/** Bouncy / Delight — RARE actions only (onboarding, achievements) */
export const springBouncy = { stiffness: 300, damping: 15, mass: 1 };

// ─── Duration-Based Transitions ────────────────────────────────

/** Backdrop fade — 200ms ease-out */
export const backdropTransition: Transition = {
  duration: 0.2,
  ease: [0.23, 1, 0.32, 1],
};

/** Quick fade — 150ms for tooltips and small elements */
export const quickFade: Transition = {
  duration: 0.15,
  ease: [0.23, 1, 0.32, 1],
};

// ─── Stagger Presets ────────────────────────────────────────────

/** List item stagger — 30ms per item, capped at 10 items (300ms total) */
export const listStagger = {
  staggerChildren: 0.03,
  delayChildren: 0.05,
};

/** Card grid stagger — 50ms per card */
export const cardStagger = {
  staggerChildren: 0.05,
  delayChildren: 0.08,
};

// ─── Reduced Motion Fallback ────────────────────────────────────

/** Instant transition for reduced-motion users */
export const instantTransition: Transition = { duration: 0 };

/**
 * Returns the appropriate transition based on reduced motion preference.
 * @param normalTransition - The transition to use when motion is allowed
 * @param prefersReducedMotion - Whether the user prefers reduced motion
 */
export function getTransition(
  normalTransition: Transition,
  prefersReducedMotion: boolean
): Transition {
  return prefersReducedMotion ? instantTransition : normalTransition;
}
