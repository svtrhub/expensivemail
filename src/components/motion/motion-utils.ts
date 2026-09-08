import React from 'react';
import { motion } from 'motion/react';

// Global cache for motion-wrapped components to guarantee 100% stable component identity across re-renders
const motionComponentCache = new Map<any, any>();

export function getMotionComponent(Component: React.ElementType = 'div') {
  if (Component === 'div') return motion.div;
  if (Component === 'span') return motion.span;
  if (Component === 'section') return motion.section;
  if (Component === 'article') return motion.article;
  if (Component === 'p') return motion.p;
  if (Component === 'header') return motion.header;
  if (Component === 'footer') return motion.footer;
  if (Component === 'ul') return motion.ul;
  if (Component === 'ol') return motion.ol;
  if (Component === 'li') return motion.li;

  let cached = motionComponentCache.get(Component);
  if (!cached) {
    cached = motion.create(Component as any);
    motionComponentCache.set(Component, cached);
  }
  return cached;
}
