'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
}

/**
 * A premium, full-screen loading overlay with glassmorphism and smooth animations.
 */
export default function LoadingOverlay({ isVisible, message }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md"
        >
          <div className="relative">
            {/* Outer spinning ring with gradient-like effect */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
              className="w-20 h-20 rounded-full border-4 border-t-[#269984] border-r-transparent border-b-[#36D6BA] border-l-transparent shadow-[0_0_25px_-5px_rgba(38,153,132,0.4)]"
            />

            {/* Secondary spinning ring (opposite direction) */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 w-20 h-20 rounded-full border-[1px] border-[#269984]/20 border-t-transparent border-b-transparent"
            />

            {/* Inner pulsing logo fallback icon */}
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.8, 1, 0.8],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-[#269984] to-[#36D6BA] rounded-xl shadow-lg flex items-center justify-center overflow-hidden">
                <div className="w-5 h-5 border-b-2 border-r-2 border-white rounded-sm rotate-45 -translate-y-0.5" />
              </div>
            </motion.div>
          </div>

          {message && (
            <motion.div
              initial={{ y: 6, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="mt-6 flex flex-col items-center"
            >
              <p className="font-montserrat font-black text-[#269984] dark:text-[#36D6BA] tracking-[0.2em] uppercase text-[10px] sm:text-xs">
                {message}
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
