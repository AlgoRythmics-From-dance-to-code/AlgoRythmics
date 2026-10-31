'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMascotScreen } from './MascotScreenContext';

interface AnchorRect {
  anchorId: string;
  top: number;
  left: number;
  width: number;
  height: number;
  effect: 'frame' | 'underline' | 'pointer' | 'pulse';
  badgeText?: string;
}

export default function MascotAnnotationOverlay({
  accentColor = '#269984',
}: {
  accentColor?: string;
}) {
  const { activeAnnotations, clearAnnotations } = useMascotScreen();
  const [rects, setRects] = useState<AnchorRect[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const updateRects = useCallback(() => {
    if (activeAnnotations.length === 0) {
      setRects((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    const calculated: AnchorRect[] = [];
    activeAnnotations.forEach((anno) => {
      const el = document.querySelector(`[data-mascot-anchor="${anno.targetAnchor}"]`);
      if (el) {
        const domRect = el.getBoundingClientRect();
        // Only render if visible in viewport
        if (
          domRect.width > 0 &&
          domRect.height > 0 &&
          domRect.bottom > 0 &&
          domRect.top < window.innerHeight
        ) {
          calculated.push({
            anchorId: anno.targetAnchor,
            top: domRect.top,
            left: domRect.left,
            width: domRect.width,
            height: domRect.height,
            effect: anno.effect,
            badgeText: anno.badgeText,
          });
        }
      }
    });

    setRects((prev) => {
      if (
        prev.length === calculated.length &&
        prev.every(
          (p, i) =>
            p.anchorId === calculated[i].anchorId &&
            Math.abs(p.top - calculated[i].top) < 1 &&
            Math.abs(p.left - calculated[i].left) < 1 &&
            Math.abs(p.width - calculated[i].width) < 1 &&
            Math.abs(p.height - calculated[i].height) < 1 &&
            p.effect === calculated[i].effect &&
            p.badgeText === calculated[i].badgeText,
        )
      ) {
        return prev;
      }
      return calculated;
    });
  }, [activeAnnotations]);

  // Synchronize on scroll and resize only when annotations are active
  useEffect(() => {
    if (activeAnnotations.length === 0) {
      setRects((prev) => (prev.length === 0 ? prev : []));
      return;
    }

    updateRects();

    const handleScrollOrResize = () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = requestAnimationFrame(updateRects);
    };

    window.addEventListener('scroll', handleScrollOrResize, { passive: true, capture: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [activeAnnotations, updateRects]);

  // If student clicks on the target element, clear the annotation smoothly
  useEffect(() => {
    if (activeAnnotations.length === 0) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const clickedAnchor = target.closest('[data-mascot-anchor]');
      if (clickedAnchor) {
        clearAnnotations();
      }
    };

    window.addEventListener('click', handleClick, { capture: true });
    return () => window.removeEventListener('click', handleClick, true);
  }, [activeAnnotations, clearAnnotations]);

  if (rects.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[55] pointer-events-none overflow-hidden">
      <AnimatePresence>
        {rects.map((rect) => {
          const padding = 6;
          const top = rect.top - padding;
          const left = rect.left - padding;
          const width = rect.width + padding * 2;
          const height = rect.height + padding * 2;

          return (
            <React.Fragment key={`${rect.anchorId}-${rect.effect}`}>
              {/* 1. FRAME EFFECT (Bekeretezés) */}
              {rect.effect === 'frame' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  style={{
                    position: 'absolute',
                    top,
                    left,
                    width,
                    height,
                    borderColor: accentColor,
                    boxShadow: `0 0 0 2px ${accentColor}25, 0 0 16px ${accentColor}30`,
                  }}
                  className="rounded-2xl border-2 border-dashed pointer-events-none"
                >
                  {rect.badgeText && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -top-3.5 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase text-white shadow-lg flex items-center gap-1"
                      style={{ backgroundColor: accentColor }}
                    >
                      <span>✨</span>
                      <span>{rect.badgeText}</span>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* 2. UNDERLINE EFFECT (Aláhúzás) */}
              {rect.effect === 'underline' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute',
                    top: rect.top + rect.height + 2,
                    left: rect.left,
                    width: rect.width,
                    height: 16,
                  }}
                  className="pointer-events-none"
                >
                  <svg
                    width="100%"
                    height="100%"
                    viewBox={`0 0 ${rect.width} 16`}
                    preserveAspectRatio="none"
                  >
                    <motion.path
                      d={`M 0,8 Q ${rect.width * 0.25},2 ${rect.width * 0.5},8 T ${rect.width},8`}
                      fill="none"
                      stroke={accentColor}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                  </svg>
                  {rect.badgeText && (
                    <div
                      className="absolute top-5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md text-[9px] font-black uppercase text-white shadow-md whitespace-nowrap"
                      style={{ backgroundColor: accentColor }}
                    >
                      {rect.badgeText}
                    </div>
                  )}
                </motion.div>
              )}

              {/* 3. POINTER EFFECT (Rámutató nyíl) */}
              {rect.effect === 'pointer' && (
                <motion.div
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: [0, -8, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute',
                    top: rect.top + rect.height / 2 - 18,
                    left: Math.max(10, rect.left - 48),
                  }}
                  className="pointer-events-none flex items-center gap-1.5"
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white shadow-xl"
                    style={{ backgroundColor: accentColor }}
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M5 13h11.86l-5.43 5.43 1.42 1.42L21.14 12l-8.29-8.29-1.42 1.42 5.43 5.43H5v2.44z" />
                    </svg>
                  </div>
                  {rect.badgeText && (
                    <span
                      className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase text-white shadow-md whitespace-nowrap"
                      style={{ backgroundColor: accentColor }}
                    >
                      {rect.badgeText}
                    </span>
                  )}
                </motion.div>
              )}

              {/* 4. PULSE EFFECT (Figyelemfelkeltő kiemelés - villogás nélkül) */}
              {rect.effect === 'pulse' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute',
                    top,
                    left,
                    width,
                    height,
                  }}
                  className="rounded-2xl pointer-events-none"
                >
                  <span
                    className="absolute inset-0 rounded-2xl border-2 shadow-lg"
                    style={{ borderColor: accentColor, boxShadow: `0 0 16px ${accentColor}40` }}
                  />
                </motion.div>
              )}
            </React.Fragment>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
