'use client';

import { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLocale } from '../i18n/LocaleProvider';
import { Download, X, Smartphone, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAInstallPrompt() {
  const { install, canInstall, isIOS, isStandalone } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [view, setView] = useState<'prompt' | 'confirm_dismiss'>('prompt');
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

  const initiateDismiss = () => {
    setView('confirm_dismiss');
  };

  const finalDismiss = () => {
    localStorage.setItem('pwa_dismissed', 'true');
    setIsVisible(false);
  };

  const handleInstall = async () => {
    const outcome = await install();
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
  };

  if (!canInstall && !isIOS) return null;

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key={view}
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md"
        >
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/20 dark:border-slate-800/50 rounded-[2.5rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex flex-col gap-5">
            {view === 'prompt' ? (
              <>
                <div className="flex items-start gap-4">
                  <div className="bg-emerald-500/10 p-4 rounded-2xl flex-shrink-0">
                    <Smartphone className="w-7 h-7 text-emerald-500" />
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="font-montserrat font-black text-slate-900 dark:text-white text-xl leading-tight">
                      {t('pwa.install_title')}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-base font-medium mt-1">
                      {t('pwa.install_desc')}
                    </p>
                  </div>
                  <button 
                    onClick={initiateDismiss}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    aria-label={t('common.cancel')}
                  >
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={initiateDismiss}
                    className="flex-1 px-6 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-base hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-[0.98]"
                  >
                    {t('pwa.dismiss_btn')}
                  </button>
                  <button
                    onClick={handleInstall}
                    className="flex-1 px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/30 active:scale-[0.98]"
                  >
                    <Download className="w-5 h-5" />
                    {t('pwa.install_btn')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-4">
                  <div className="bg-blue-500/10 p-4 rounded-2xl flex-shrink-0">
                    <Info className="w-7 h-7 text-blue-500" />
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="font-montserrat font-black text-slate-900 dark:text-white text-xl leading-tight">
                      {t('pwa.confirm_dismiss_title')}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm font-medium mt-1">
                      {t('pwa.confirm_dismiss_desc')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={finalDismiss}
                  className="w-full px-6 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-base transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/10"
                >
                  {t('pwa.confirm_dismiss_btn')}
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
