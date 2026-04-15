'use client';

import { useState, useEffect } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLocale } from '../i18n/LocaleProvider';
import { Download, X, Smartphone, AlertTriangle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PWAInstallPrompt() {
  const { install, canInstall, isIOS, isStandalone } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const { t } = useLocale();

  useEffect(() => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const dismissed = localStorage.getItem('pwa_dismissed') === 'true';
    const alreadyInstalled = localStorage.getItem('pwa_installed') === 'true';

    // Show immediately when on mobile, canInstall is true (or iOS), and conditions are met
    if (isMobile && (canInstall || isIOS) && !dismissed && !alreadyInstalled && !isStandalone) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [canInstall, isStandalone, isIOS, t]);

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

  if (!canInstall && !isIOS) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
           layout
           initial={{ y: 100, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           exit={{ y: 100, opacity: 0 }}
           className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-md antialiased"
        >
          <div className="font-montserrat bg-white/95 dark:bg-slate-900 shadow-2xl rounded-[2rem] border border-white/20 dark:border-slate-800 p-6 flex flex-col gap-5 overflow-hidden backdrop-blur-md">
            
            {!isConfirming ? (
              <motion.div 
                key="prompt"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-emerald-500/10 p-3.5 rounded-2xl flex-shrink-0">
                    <Smartphone className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="flex-1 pr-4">
                    <h3 className="font-montserrat font-black text-[#0f172a] dark:text-white text-lg leading-tight uppercase tracking-tight opacity-100">
                      {t('pwa.install_title')}
                    </h3>
                    <p className="font-montserrat font-medium text-slate-600 dark:text-slate-400 text-sm mt-1.5 leading-relaxed opacity-100">
                      {isIOS ? t('pwa.ios_instructions') : t('pwa.install_desc')}
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsConfirming(true)}
                    className="p-1 -mt-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors group"
                  >
                    <X className="w-5 h-5 text-slate-400 group-hover:text-slate-600" />
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsConfirming(true)}
                    className="flex-1 px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs hover:bg-slate-50 transition-all uppercase tracking-wider"
                  >
                    {t('pwa.dismiss_btn')}
                  </button>
                  {!isIOS ? (
                    <button
                      onClick={handleInstall}
                      className="flex-[2] px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] uppercase tracking-wider"
                    >
                      <Download className="w-5 h-5" />
                      {t('pwa.install_btn')}
                    </button>
                  ) : (
                    <div className="flex-[2] px-6 py-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-[10px] flex items-center justify-center text-center uppercase tracking-widest leading-tight">
                      {t('pwa.ios_instructions')}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-6"
              >
                <div className="flex items-start gap-4">
                  <div className="bg-amber-500/10 p-3.5 rounded-2xl flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-montserrat font-black text-[#0f172a] dark:text-white text-lg leading-tight uppercase tracking-tight">
                      {t('pwa.confirm_title')}
                    </h3>
                    <p className="font-montserrat font-medium text-slate-600 dark:text-slate-400 text-sm mt-1.5 leading-relaxed">
                      {t('pwa.confirm_desc')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsConfirming(false)}
                    className="flex-1 px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-black text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t('pwa.cancel_btn')}
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="flex-1 px-4 py-3.5 rounded-2xl bg-slate-900 dark:bg-slate-700 text-white font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-black/10 active:scale-[0.98] uppercase tracking-wider"
                  >
                    {t('pwa.confirm_btn')}
                  </button>
                </div>
              </motion.div>
            )}
            
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
