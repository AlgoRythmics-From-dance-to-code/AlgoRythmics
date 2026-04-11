import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { useLocale } from '../../i18n/LocaleProvider';

interface RestartCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export default function RestartCourseModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
}: RestartCourseModalProps) {
  const { t } = useLocale();
  const displayTitle = title || t('course.restart_title');
  const displayMessage = message || t('course.restart_message');
  const displayConfirmLabel = confirmLabel || t('course.restart_confirm');
  const displayCancelLabel = cancelLabel || t('course.cancel_continue');

  if (!isOpen) return null;

  return (
    <motion.div
      key="restart-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 shadow-2xl border border-[#269984]/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center">
          <div className="h-20 w-20 bg-amber-100 dark:bg-amber-900/30 rounded-[1.5rem] flex items-center justify-center mb-6">
            <RotateCcw className="h-10 w-10 text-amber-500" />
          </div>
          <h3 className="text-2xl font-black text-black dark:text-white uppercase tracking-tight mb-4 text-balance">
            {displayTitle}
          </h3>
          <p className="text-neutral-500 dark:text-neutral-400 mb-8 font-medium">
            {displayMessage}
          </p>
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={onConfirm}
              className="w-full py-4 bg-[#269984] hover:bg-[#1f7a6a] text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
            >
              {displayConfirmLabel}
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-2xl font-bold uppercase tracking-widest transition-all"
            >
              {displayCancelLabel}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
