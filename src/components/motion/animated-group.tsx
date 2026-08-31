/**
 * AnimatedGroup — staggered entrance/exit for child elements.
 * Based on motion-primitives by ibelick.
 * Applies container orchestration with per-item variants.
 */
import React from 'react';
import {
  motion,
  type Variants,
  type Transition,
  AnimatePresence,
} from 'motion/react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface AnimatedGroupProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  preset?: 'fade' | 'slide' | 'scale' | 'blur-slide';
  variants?: {
    container?: Variants;
    item?: Variants;
  };
  /** Max number of items to stagger (performance cap) */
  staggerCap?: number;
}

const presetVariants: Record<string, { container: Variants; item: Variants }> =
  {
    fade: {
      container: {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.03, delayChildren: 0.05 },
        },
      },
      item: {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] },
        },
      },
    },
    slide: {
      container: {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.03, delayChildren: 0.05 },
        },
      },
      item: {
        hidden: { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { type: 'spring', stiffness: 300, damping: 24 },
        },
      },
    },
    scale: {
      container: {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.04, delayChildren: 0.06 },
        },
      },
      item: {
        hidden: { opacity: 0, scale: 0.95 },
        visible: {
          opacity: 1,
          scale: 1,
          transition: { type: 'spring', stiffness: 300, damping: 24 },
        },
      },
    },
    'blur-slide': {
      container: {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.03, delayChildren: 0.06 },
        },
      },
      item: {
        hidden: { opacity: 0, y: 16, filter: 'blur(4px)' },
        visible: {
          opacity: 1,
          y: 0,
          filter: 'blur(0px)',
          transition: { type: 'spring', stiffness: 250, damping: 22 },
        },
      },
    },
  };

export const AnimatedGroup: React.FC<AnimatedGroupProps> = ({
  children,
  className,
  as: Component = 'div',
  preset = 'slide',
  variants,
  staggerCap = 10,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const MotionComponent = motion.create(Component as any);
  const resolvedVariants =
    variants || presetVariants[preset] || presetVariants.slide;

  // If reduced motion, render children immediately without animation
  if (prefersReducedMotion) {
    return <Component className={className}>{children}</Component>;
  }

  const childArray = React.Children.toArray(children);

  return (
    <MotionComponent
      initial="hidden"
      animate="visible"
      variants={resolvedVariants.container}
      className={className}
    >
      {childArray.map((child, index) => (
        <motion.div
          key={(child as any).key || index}
          variants={index < staggerCap ? resolvedVariants.item : undefined}
          initial={index < staggerCap ? undefined : false}
        >
          {child}
        </motion.div>
      ))}
    </MotionComponent>
  );
};
