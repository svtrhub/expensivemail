import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { springSnappy, getTransition } from '../motion/spring-presets';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

export interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  const prefersReducedMotion = useReducedMotion();

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-red-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
  };

  const borders = {
    success:
      'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/90 dark:bg-emerald-950/80',
    error:
      'border-red-200 dark:border-red-800/60 bg-red-50/90 dark:bg-red-950/80',
    warning:
      'border-amber-200 dark:border-amber-800/60 bg-amber-50/90 dark:bg-amber-950/80',
    info: 'border-blue-200 dark:border-blue-800/60 bg-blue-50/90 dark:bg-blue-950/80',
  };

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={getTransition(
              { type: 'spring', ...springSnappy },
              prefersReducedMotion
            )}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md text-slate-900 dark:text-slate-100 ${borders[toast.type]}`}
          >
            {icons[toast.type]}
            <div className="flex-1">
              <h4 className="text-sm font-semibold">{toast.title}</h4>
              {toast.message && (
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {toast.message}
                </p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
