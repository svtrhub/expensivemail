/**
 * AnimatedNumber — spring-interpolated number counter.
 * Based on motion-primitives by ibelick.
 * Uses motion's useSpring + useTransform for GPU-efficient number animation.
 */
import React, { useEffect, useRef } from 'react';
import {
  useSpring,
  useTransform,
  motion,
  type SpringOptions,
} from 'motion/react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface AnimatedNumberProps {
  value: number;
  springOptions?: SpringOptions;
  as?: React.ElementType;
  className?: string;
  /** Format function applied to the animated value (e.g. formatCurrency) */
  format?: (value: number) => string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  springOptions = { stiffness: 200, damping: 30, mass: 1 },
  as: Component = 'span',
  className,
  format,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);

  const spring = useSpring(
    0,
    prefersReducedMotion ? { duration: 0 } : springOptions
  );
  const display = useTransform(spring, (current) =>
    format ? format(Math.round(current)) : Math.round(current).toLocaleString()
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  useEffect(() => {
    const unsubscribe = display.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = latest;
      }
    });
    return unsubscribe;
  }, [display]);

  // Set initial value immediately
  const initialDisplay = format
    ? format(Math.round(value))
    : Math.round(value).toLocaleString();

  return (
    <motion.span ref={ref} className={className}>
      {initialDisplay}
    </motion.span>
  );
};
