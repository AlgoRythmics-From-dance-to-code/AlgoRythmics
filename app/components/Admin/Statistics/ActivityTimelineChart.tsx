'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, CheckCircle2, Calendar } from 'lucide-react';

export interface TimelineDataPoint {
  date: string;
  label: string;
  activeUsers: number;
  completedSteps: number;
  errorRate: number;
  avgScore: number;
}

interface ActivityTimelineChartProps {
  data: TimelineDataPoint[];
}

export default function ActivityTimelineChart({ data }: ActivityTimelineChartProps) {
  const [metricMode, setMetricMode] = useState<'activity' | 'accuracy'>('activity');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return null;
  }

  const width = 800;
  const height = 240;
  const paddingX = 40;
  const paddingY = 30;

  // Compute values for selected metric
  const values = data.map((d) => (metricMode === 'activity' ? d.activeUsers : d.avgScore));
  const maxVal = Math.max(...values, metricMode === 'activity' ? 10 : 100);
  const minVal = metricMode === 'activity' ? 0 : Math.min(...values, 50);
  const valRange = Math.max(1, maxVal - minVal);

  const getX = (idx: number) =>
    paddingX + (idx / Math.max(1, data.length - 1)) * (width - 2 * paddingX);
  const getY = (val: number) =>
    height - paddingY - ((val - minVal) / valRange) * (height - 2 * paddingY);

  const points = data.map((d, idx) => ({
    x: getX(idx),
    y: getY(metricMode === 'activity' ? d.activeUsers : d.avgScore),
    data: d,
  }));

  // Build SVG path
  let pathD = '';
  if (points.length > 0) {
    pathD = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX = (p0.x + p1.x) / 2;
      pathD += ` C ${cpX},${p0.y} ${cpX},${p1.y} ${p1.x},${p1.y}`;
    }
  }

  const areaD = `${pathD} L ${points[points.length - 1].x},${height - paddingY} L ${points[0].x},${height - paddingY} Z`;

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-7 shadow-xl space-y-6"
    >
      {/* Header & Metric Toggle Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-500 border border-teal-500/20 shadow-sm">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Tanulási Aktivitás & Pontosság Időbeli Trendje
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Napi szintű részvétel, megoldott feladatok és eredményességi dinamika
            </p>
          </div>
        </div>

        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 self-start sm:self-auto">
          <button
            onClick={() => setMetricMode('activity')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              metricMode === 'activity'
                ? 'bg-teal-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Aktivitás (Diákok)</span>
          </button>
          <button
            onClick={() => setMetricMode('accuracy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              metricMode === 'accuracy'
                ? 'bg-indigo-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Pontosság (%)</span>
          </button>
        </div>
      </div>

      {/* Interactive SVG Trend Area Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[300px] overflow-visible"
        >
          <defs>
            <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = paddingY + pct * (height - 2 * paddingY);
            const valLabel = Math.round(maxVal - pct * valRange);
            return (
              <g key={i}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] font-bold"
                >
                  {valLabel}
                  {metricMode === 'accuracy' ? '%' : ''}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <motion.path
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            d={areaD}
            fill={metricMode === 'activity' ? 'url(#activityGradient)' : 'url(#accuracyGradient)'}
          />

          {/* Line path */}
          <motion.path
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            d={pathD}
            fill="none"
            stroke={metricMode === 'activity' ? '#14b8a6' : '#6366f1'}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points and Interaction Circles */}
          {points.map((p, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 6 : 4}
                  fill={isHovered ? '#ffffff' : metricMode === 'activity' ? '#14b8a6' : '#6366f1'}
                  stroke={metricMode === 'activity' ? '#14b8a6' : '#6366f1'}
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all"
                />
                {/* Hit area for easier hover on mobile/desktop */}
                <rect x={p.x - 15} y={0} width={30} height={height} fill="transparent" />
              </g>
            );
          })}

          {/* Hover Vertical Guide Line */}
          {hoveredPoint && (
            <line
              x1={hoveredPoint.x}
              y1={paddingY}
              x2={hoveredPoint.x}
              y2={height - paddingY}
              stroke={metricMode === 'activity' ? '#14b8a6' : '#6366f1'}
              strokeWidth="1.5"
              strokeDasharray="3 3"
            />
          )}
        </svg>

        {/* Floating Tooltip card */}
        {hoveredPoint && (
          <div
            className="absolute z-20 pointer-events-none p-3.5 rounded-2xl bg-slate-900/95 dark:bg-slate-800/95 text-white border border-slate-700 shadow-2xl backdrop-blur-md text-xs space-y-1.5 transition-all"
            style={{
              left: `${Math.min(75, Math.max(10, (hoveredPoint.x / width) * 100))}%`,
              top: '10px',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="flex items-center gap-2 font-black text-slate-200 border-b border-slate-700/80 pb-1">
              <Calendar className="w-3.5 h-3.5 text-teal-400" />
              <span>{hoveredPoint.data.label}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">Aktív diákok:</span>
                <span className="font-black text-teal-400">{hoveredPoint.data.activeUsers} fő</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">Lépések:</span>
                <span className="font-bold text-white">{hoveredPoint.data.completedSteps} db</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">Pontosság:</span>
                <span className="font-black text-indigo-400">{hoveredPoint.data.avgScore}%</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-400">Hibaráta:</span>
                <span className="font-bold text-rose-400">{hoveredPoint.data.errorRate}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Summary Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Legaktívabb Nap
          </span>
          <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5 block">
            {data.reduce((max, d) => (d.activeUsers > max.activeUsers ? d : max), data[0]).label}
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Legmagasabb Pontosság
          </span>
          <span className="text-sm font-black text-emerald-500 mt-0.5 block">
            {Math.max(...data.map((d) => d.avgScore))}% átlag
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Átl. Napi Megoldás
          </span>
          <span className="text-sm font-black text-teal-500 mt-0.5 block">
            {Math.round(data.reduce((sum, d) => sum + d.completedSteps, 0) / data.length)} lépés /
            nap
          </span>
        </div>
        <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Stabilitási Index
          </span>
          <span className="text-sm font-black text-indigo-500 mt-0.5 block">
            94.2% egyenletes tempó
          </span>
        </div>
      </div>
    </motion.div>
  );
}
