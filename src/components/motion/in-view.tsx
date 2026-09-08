/**
 * InView — viewport-triggered entrance animation.
 * Based on motion-primitives by ibelick.
 * Uses IntersectionObserver via motion's useInView for zero-cost off-screen elements.
 */
import React from 'react';
import {
  type Variants,
  type Transition,
  type UseInViewOptions,
} from 'motion/react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getMotionComponent } from './motion-utils';

export interface InViewProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  variants?: Variants;
  transition?: Transition;
  /** Only animate once (default: true) */
  once?: boolean;
  /** IntersectionObserver amount threshold (default: 0.12 for timely trigger) */
  amount?: 'some' | 'all' | number;
  /** IntersectionObserver margin (default: '0px 0px -30px 0px') */
  margin?: UseInViewOptions['margin'];
}

const defaultVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const defaultTransition: Transition = {
  duration: 0.42,
  ease: [0.22, 1, 0.36, 1],
};

export const InView: React.FC<InViewProps> = ({
  children,
  className,
  as: Component = 'div',
  variants = defaultVariants,
  transition = defaultTransition,
  once = true,
  amount = 0.12,
  margin = '0px 0px -30px 0px',
}) => {
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <Component className={className}>{children}</Component>;
  }

  const MotionComponent = getMotionComponent(Component);

  return (
    <MotionComponent
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: amount as any, margin }}
      variants={variants}
      transition={transition}
      className={className}
    >
      {children}
    </MotionComponent>
  );
};
