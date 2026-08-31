/**
 * TransitionPanel — animated tab/step content switcher.
 * Based on motion-primitives by ibelick.
 * Uses AnimatePresence with directional slide + fade for tab crossfading.
 */
import React from 'react';
import {
  motion,
  AnimatePresence,
  type Variants,
  type Transition,
} from 'motion/react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface TransitionPanelProps {
  /** Index of the currently active child panel */
  activeIndex: number;
  children: React.ReactNode[];
  className?: string;
  transition?: Transition;
  variants?: {
    enter: Record<string, any>;
    center: Record<string, any>;
    exit: Record<string, any>;
  };
}

const defaultVariants = {
  enter: { opacity: 0, y: 6, filter: 'blur(2px)' },
  center: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -6, filter: 'blur(2px)' },
};

export const TransitionPanel: React.FC<TransitionPanelProps> = ({
  activeIndex,
  children,
  className,
  transition = { duration: 0.2, ease: [0.23, 1, 0.32, 1] },
  variants = defaultVariants,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const childArray = React.Children.toArray(children);
  const activeChild = childArray[activeIndex];

  if (!activeChild) return null;

  // If reduced motion, render without animation
  if (prefersReducedMotion) {
    return <div className={className}>{activeChild}</div>;
  }

  return (
    <div className={className} style={{ position: 'relative' }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={activeIndex}
          initial={variants.enter}
          animate={variants.center}
          exit={variants.exit}
          transition={transition}
        >
          {activeChild}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
