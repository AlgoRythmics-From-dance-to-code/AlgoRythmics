'use client';

import { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLocale } from '../i18n/LocaleProvider';
import { Download, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAInstallPrompt() {
  const { install, canInstall, isIOS, isStandalone } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useLocale();

  useEffect(() => {
    // Small delay to let the page load
    const timer = setTimeout(() => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const dismissed = localStorage.getItem('pwa_dismissed');
      const alreadyInstalled = localStorage.getItem('pwa_installed') === 'true';

      // Show if we can install, it's a mobile device, not dismissed and not already installed
      if (canInstall && isMobile && !dismissed && !alreadyInstalled && !isStandalone) {
        setIsVisible(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [canInstall, isStandalone, t]);

  const handleDismiss = () => {
    localStorage.setItem('pwa_dismissed', 'true');
    setIsVisible(false);
  };

  const handleInstall = async () => {
    const outcome = await install();
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
  };

  // If it's iOS, we can't trigger the native prompt, 
  // but we could show instructions. However, the requirement 
  // mentions "if rejected, don't show", which fits better with the native prompt interaction.
  // For now, let's focus on the promptable devices (Android/Chrome).

  if (!canInstall && !isIOS) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md"
        >
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-800/50 rounded-2xl p-5 shadow-2xl shadow-emerald-500/10 flex flex-col gap-4">
            <div className="flex items-start gap-4">
              <div className="bg-emerald-500/10 p-3 rounded-xl">
                <Smartphone className="w-6 h-6 text-emerald-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">
                  {t('pwa.install_title')}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                  {t('pwa.install_desc')}
                </p>
              </div>
              <button 
                onClick={handleDismiss}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                aria-label={t('common.cancel')}
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="flex gap-3 mt-1">
              <button
                onClick={handleDismiss}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                {t('pwa.dismiss_btn')}
              </button>
              <button
                onClick={handleInstall}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                {t('pwa.install_btn')}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
