'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Clock, CheckCircle2, AlertTriangle, Zap, Lightbulb, Brain } from 'lucide-react';

interface KpiData {
  activeLearnersCount: number;
  totalHoursSpent: number;
  totalAlgorithmsCompleted: number;
  globalErrorRate: number;
  pesSlowdownPercentage: number;
  hintSuccessRate: number;
  avgThinkingTimeSeconds: number;
}

interface StatKpiGridProps {
  kpis: KpiData;
}

export default function StatKpiGrid({ kpis }: StatKpiGridProps) {
  const cards = [
    {
      id: 'learners',
      label: 'Aktív Diákok & Tanulók',
      value: kpis.activeLearnersCount.toLocaleString('hu-HU'),
      unit: 'fő',
      subtext: 'Regisztrált profilok',
      icon: Users,
      color: 'border-blue-500/30 text-blue-500 dark:text-blue-400',
      bgGlow: 'from-blue-500/10 via-cyan-500/5 to-transparent',
      badge: 'Aktív',
      badgeColor: 'bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/30',
      trend: '+14% ezen a héten',
      trendUp: true,
      sparkline: 'M 0,20 Q 20,12 40,16 T 80,6 T 100,2',
      sparkColor: '#3b82f6',
    },
    {
      id: 'hours',
      label: 'Tanulási Időtartam',
      value: kpis.totalHoursSpent.toLocaleString('hu-HU'),
      unit: 'óra',
      subtext: 'Gyakorlás & elmélet',
      icon: Clock,
      color: 'border-teal-500/30 text-teal-500 dark:text-teal-400',
      bgGlow: 'from-teal-500/10 via-emerald-500/5 to-transparent',
      badge: 'Elköteleződés',
      badgeColor: 'bg-teal-500/10 text-teal-500 dark:text-teal-400 border-teal-500/30',
      trend: 'Átl. 28 perc / diák',
      trendUp: true,
      sparkline: 'M 0,18 Q 25,18 50,10 T 80,8 T 100,3',
      sparkColor: '#14b8a6',
    },
    {
      id: 'completed',
      label: 'Befejezett Kurzusok',
      value: kpis.totalAlgorithmsCompleted.toLocaleString('hu-HU'),
      unit: 'db',
      subtext: '100%-os modulok',
      icon: CheckCircle2,
      color: 'border-purple-500/30 text-purple-500 dark:text-purple-400',
      bgGlow: 'from-purple-500/10 via-indigo-500/5 to-transparent',
      badge: 'Befejezve',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      trend: '78% befejezési ráta',
      trendUp: true,
      sparkline: 'M 0,22 Q 30,16 60,12 T 90,6 T 100,1',
      sparkColor: '#a855f7',
    },
    {
      id: 'errorRate',
      label: 'Globális Hibaarány',
      value: `${kpis.globalErrorRate}%`,
      unit: '',
      subtext: 'Összes döntésből',
      icon: AlertTriangle,
      color: 'border-amber-500/30 text-amber-500 dark:text-amber-400',
      bgGlow: 'from-amber-500/10 via-rose-500/5 to-transparent',
      badge: kpis.globalErrorRate < 25 ? 'Optimális' : 'Nehéz',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      trend: '-3.2% csökkenés',
      trendUp: true,
      sparkline: 'M 0,4 Q 30,8 60,14 T 90,18 T 100,20',
      sparkColor: '#f59e0b',
    },
    {
      id: 'pes',
      label: 'PES Lelassulási Index',
      value: `+${kpis.pesSlowdownPercentage}%`,
      unit: '',
      subtext: 'Megfontoltság hiba után',
      icon: Zap,
      color: 'border-yellow-500/30 text-yellow-500 dark:text-yellow-400',
      bgGlow: 'from-yellow-500/10 via-orange-500/5 to-transparent',
      badge: 'Post-Error',
      badgeColor: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      trend: 'Egészséges önkontroll',
      trendUp: true,
      sparkline: 'M 0,16 Q 25,12 50,18 T 80,6 T 100,8',
      sparkColor: '#eab308',
    },
    {
      id: 'hintSuccess',
      label: 'Hint Sikerességi Ráta',
      value: `${kpis.hintSuccessRate}%`,
      unit: '',
      subtext: 'Segítség utáni siker',
      icon: Lightbulb,
      color: 'border-pink-500/30 text-pink-500 dark:text-pink-400',
      bgGlow: 'from-pink-500/10 via-rose-500/5 to-transparent',
      badge: 'Hatékony',
      badgeColor: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
      trend: 'Magas pedagógiai haszon',
      trendUp: true,
      sparkline: 'M 0,20 Q 30,14 60,10 T 80,4 T 100,2',
      sparkColor: '#ec4899',
    },
    {
      id: 'thinkingTime',
      label: 'Átl. Döntési Idő',
      value: `${kpis.avgThinkingTimeSeconds}`,
      unit: 'mp',
      subtext: 'Lépésenkénti idő',
      icon: Brain,
      color: 'border-sky-500/30 text-sky-500 dark:text-sky-400',
      bgGlow: 'from-sky-500/10 via-blue-500/5 to-transparent',
      badge: 'Feldolgozás',
      badgeColor: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
      trend: 'Normál kognitív tempó',
      trendUp: true,
      sparkline: 'M 0,12 Q 25,16 50,8 T 80,14 T 100,10',
      sparkColor: '#0ea5e9',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3.5 sm:gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.04 }}
            className={`relative overflow-hidden rounded-3xl border ${card.color} bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 sm:p-5 shadow-lg flex flex-col justify-between group hover:shadow-xl hover:scale-[1.02] transition-all`}
          >
            {/* Background Ambient Glow */}
            <div
              className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${card.bgGlow} pointer-events-none rounded-full blur-2xl`}
            />

            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${card.badgeColor}`}
                >
                  {card.badge}
                </span>
              </div>

              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 line-clamp-1">
                {card.label}
              </p>

              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                  {card.value}
                </span>
                {card.unit && (
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {card.unit}
                  </span>
                )}
              </div>
            </div>

            {/* Sparkline & Trend Footer */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                {card.trend}
              </span>
              <svg className="w-12 h-5 overflow-visible shrink-0" viewBox="0 0 100 24">
                <path
                  d={card.sparkline}
                  fill="none"
                  stroke={card.sparkColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
