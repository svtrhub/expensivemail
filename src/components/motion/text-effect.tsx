/**
 * TextEffect — staggered text reveal animation (per word/char/line).
 * Based on motion-primitives by ibelick.
 * Uses motion variants with container/item stagger orchestration.
 */
import React, { useMemo } from 'react';
import {
  motion,
  type Variants,
  type Transition,
  AnimatePresence,
} from 'motion/react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface TextEffectProps {
  children: string;
  className?: string;
  as?: React.ElementType;
  /** Granularity of text segmentation */
  per?: 'word' | 'char' | 'line';
  /** Built-in animation preset */
  preset?: 'fade-in-blur' | 'fade' | 'slide' | 'scale';
  /** Delay before animation starts (seconds) */
  delay?: number;
  /** Custom variants override */
  variants?: {
    container?: Variants;
    item?: Variants;
  };
  trigger?: boolean;
}

const presetItemVariants: Record<string, Variants> = {
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  'fade-in-blur': {
    hidden: { opacity: 0, filter: 'blur(8px)' },
    visible: { opacity: 1, filter: 'blur(0px)' },
  },
  slide: {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  },
};

function splitText(text: string, per: 'word' | 'char' | 'line'): string[] {
  switch (per) {
    case 'word':
      return text.split(/(\s+)/);
    case 'char':
      return text.split('');
    case 'line':
      return text.split('\n');
    default:
      return text.split(/(\s+)/);
  }
}

export const TextEffect: React.FC<TextEffectProps> = ({
  children,
  className,
  as: Component = 'p',
  per = 'word',
  preset = 'fade-in-blur',
  delay = 0,
  variants,
  trigger = true,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const segments = useMemo(() => splitText(children, per), [children, per]);

  // If reduced motion, render text immediately
  if (prefersReducedMotion) {
    return <Component className={className}>{children}</Component>;
  }

  const itemVariants =
    variants?.item || presetItemVariants[preset] || presetItemVariants.fade;

  const staggerDuration = per === 'char' ? 0.015 : per === 'line' ? 0.1 : 0.04;

  const containerVariants: Variants = variants?.container || {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDuration,
        delayChildren: delay,
      },
    },
  };

  const MotionComponent = motion.create(Component as any);

  return (
    <AnimatePresence>
      {trigger && (
        <MotionComponent
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={containerVariants}
          className={className}
        >
          {segments.map((segment, index) => {
            // Preserve whitespace segments
            if (/^\s+$/.test(segment)) {
              return <span key={`ws-${index}`}>{segment}</span>;
            }

            return (
              <motion.span
                key={`${segment}-${index}`}
                variants={itemVariants}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                style={{ display: 'inline-block' }}
              >
                {segment}
              </motion.span>
            );
          })}
        </MotionComponent>
      )}
    </AnimatePresence>
  );
};
