'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Sun, Moon, Sunrise, Sparkles } from 'lucide-react';

export interface HeatmapDayData {
  day: string;
  slots: {
    slotId: string;
    slotLabel: string;
    intensity: number;
    sessionCount: number;
  }[];
}

interface HourlyActivityHeatmapProps {
  data: HeatmapDayData[];
}

const SLOT_ICONS: Record<string, React.ReactNode> = {
  morning: <Sunrise className="w-3.5 h-3.5 text-amber-500" />,
  afternoon: <Sun className="w-3.5 h-3.5 text-orange-500" />,
  evening: <Moon className="w-3.5 h-3.5 text-indigo-400" />,
  night: <Moon className="w-3.5 h-3.5 text-purple-400" />,
};

export default function HourlyActivityHeatmap({ data }: HourlyActivityHeatmapProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const slots = data[0].slots;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-7 shadow-xl space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-sm">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Heti Tanulási Idősáv Hőtérkép (Activity Heatmap)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Mely napokon és idősávokban a legaktívabbak a diákok a felületen
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <span>Alacsony</span>
          <div className="flex gap-1">
            <span className="w-3.5 h-3.5 rounded-md bg-teal-500/20 border border-teal-500/30" />
            <span className="w-3.5 h-3.5 rounded-md bg-teal-500/50 border border-teal-500/60" />
            <span className="w-3.5 h-3.5 rounded-md bg-teal-500 border border-teal-400" />
          </div>
          <span>Magas</span>
        </div>
      </div>

      {/* Heatmap Matrix Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[540px] space-y-2">
          {/* Header Row (Slots) */}
          <div className="grid grid-cols-5 gap-2 text-center text-xs font-bold text-slate-500 pb-1">
            <div className="text-left font-black text-slate-400 pl-2">Napok</div>
            {slots.map((s) => (
              <div key={s.slotId} className="flex items-center justify-center gap-1.5 line-clamp-1">
                {SLOT_ICONS[s.slotId]}
                <span>{s.slotLabel.split('(')[0]}</span>
              </div>
            ))}
          </div>

          {/* Day Rows */}
          {data.map((dayData) => (
            <div key={dayData.day} className="grid grid-cols-5 gap-2 items-center">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 pl-2">
                {dayData.day}
              </div>
              {dayData.slots.map((slot) => {
                const intensity = slot.intensity;
                const bgStyle =
                  intensity >= 75
                    ? 'bg-teal-500 text-white font-black shadow-md shadow-teal-500/20'
                    : intensity >= 50
                      ? 'bg-teal-500/60 text-white dark:text-teal-100 font-bold'
                      : intensity >= 30
                        ? 'bg-teal-500/30 text-teal-800 dark:text-teal-300 font-semibold'
                        : 'bg-teal-500/10 text-slate-500 dark:text-slate-400';

                return (
                  <div
                    key={slot.slotId}
                    className={`p-3 rounded-2xl border border-teal-500/20 flex flex-col items-center justify-center text-xs transition-all hover:scale-[1.03] cursor-pointer ${bgStyle}`}
                    title={`${dayData.day} - ${slot.slotLabel}: ${slot.sessionCount} munkamenet (${slot.intensity}% intenzitás)`}
                  >
                    <span className="text-sm font-black">{slot.sessionCount}</span>
                    <span className="text-[10px] opacity-80">menet</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2.5 font-semibold">
        <Sparkles className="w-5 h-5 shrink-0 text-amber-500" />
        <span>
          Csúcsidőszak: Hétköznap késő délután (16:00 - 20:00) és vasárnap este tapasztalható a
          legnagyobb feladatmegoldási és szinkron multiplayer aktivitás.
        </span>
      </div>
    </motion.div>
  );
}
