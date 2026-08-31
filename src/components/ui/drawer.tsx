import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import {
  springDrawer,
  backdropTransition,
  getTransition,
} from '../motion/spring-presets';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  position?: 'right' | 'left' | 'bottom';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
}) => {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const slideVariants = {
    right: { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } },
    left: { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' } },
    bottom: { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } },
  };

  const positionClasses = {
    right: 'right-0 top-0 bottom-0 w-full sm:w-110 border-l',
    left: 'left-0 top-0 bottom-0 w-full sm:w-110 border-r',
    bottom: 'bottom-0 left-0 right-0 max-h-[90vh] rounded-t-2xl border-t',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={getTransition(backdropTransition, prefersReducedMotion)}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs"
          />

          <motion.div
            initial={slideVariants[position].initial}
            animate={slideVariants[position].animate}
            exit={slideVariants[position].exit}
            transition={getTransition(
              { type: 'spring', ...springDrawer },
              prefersReducedMotion
            )}
            className={`fixed ${positionClasses[position]} z-10 flex flex-col bg-[#081B2E]/95 backdrop-blur-2xl border-white/15 shadow-[0_16px_48px_rgba(0,0,0,0.6)] text-slate-100`}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
              {title && (
                <h2 className="text-lg font-bold font-editorial">{title}</h2>
              )}
              <button
                onClick={onClose}
                aria-label="Close drawer"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
