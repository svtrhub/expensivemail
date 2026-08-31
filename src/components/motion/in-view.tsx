/**
 * InView — viewport-triggered entrance animation.
 * Based on motion-primitives by ibelick.
 * Uses IntersectionObserver via motion's useInView for zero-cost off-screen elements.
 */
import React, { useRef } from 'react';
import {
  motion,
  useInView,
  type Variants,
  type Transition,
  type UseInViewOptions,
} from 'motion/react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface InViewProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  variants?: Variants;
  transition?: Transition;
  /** Only animate once (default: true) */
  once?: boolean;
  /** IntersectionObserver amount threshold (0-1, default: 0.2) */
  amount?: number;
  /** IntersectionObserver margin */
  margin?: UseInViewOptions['margin'];
}

const defaultVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export const InView: React.FC<InViewProps> = ({
  children,
  className,
  as: Component = 'div',
  variants = defaultVariants,
  transition = { type: 'spring', stiffness: 250, damping: 25, mass: 1 },
  once = true,
  amount = 0.2,
  margin,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, amount, margin });

  // If reduced motion, render immediately
  if (prefersReducedMotion) {
    return <Component className={className}>{children}</Component>;
  }

  const MotionComponent = motion.create(Component as any);

  return (
    <MotionComponent
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={variants}
      transition={transition}
      className={className}
    >
      {children}
    </MotionComponent>
  );
};
