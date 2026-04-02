import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useLocale } from '../../i18n/LocaleProvider';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
}) => {
  const { t } = useLocale();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-white dark:bg-[#1a1a1a] rounded-[2.5rem] p-8 shadow-2xl border border-gray-100 dark:border-white/5 animate-in zoom-in-95 slide-in-from-bottom-5 duration-500"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
        >
          <X className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-3xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-6 rotate-3">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
          </div>

          <h3 className="font-montserrat font-bold text-2xl text-black dark:text-white mb-3">
            {title}
          </h3>

          <p className="font-montserrat text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed px-2">
            {message}
          </p>

          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="w-full py-4 rounded-2xl bg-[#269984] hover:bg-[#1e7a69] text-white font-montserrat font-bold shadow-lg shadow-[#269984]/20 transition-all active:scale-[0.98]"
            >
              {t('common.restart')}
            </button>
            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl font-montserrat font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
