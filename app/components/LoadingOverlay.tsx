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
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl"
        >
          <div className="relative">
            {/* Outer spinning ring with gradient-like effect */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 rounded-full border-4 border-t-[#269984] border-r-transparent border-b-[#36D6BA] border-l-transparent shadow-[0_0_25px_-5px_rgba(38,153,132,0.4)]"
            />
            
            {/* Secondary spinning ring (opposite direction) */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 w-24 h-24 rounded-full border-[1px] border-[#269984]/20 border-t-transparent border-b-transparent"
            />

            {/* Inner pulsing logo fallback icon */}
            <motion.div
              animate={{ 
                scale: [1, 1.15, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-[#269984] to-[#36D6BA] rounded-xl shadow-lg flex items-center justify-center overflow-hidden">
                <div className="w-6 h-6 border-b-2 border-r-2 border-white rounded-sm rotate-45 -translate-y-0.5" />
              </div>
            </motion.div>
          </div>
          
          {message && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-8 flex flex-col items-center gap-2"
            >
              <p className="font-montserrat font-black text-[#269984] dark:text-[#36D6BA] tracking-[0.3em] uppercase text-[10px] sm:text-xs">
                {message}
              </p>
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1 h-1 bg-[#269984] rounded-full"
                  />
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
