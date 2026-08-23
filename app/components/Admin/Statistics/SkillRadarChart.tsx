'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Info, Award } from 'lucide-react';

export interface CompetencyItem {
  subject: string;
  studentScore: number;
  benchmarkScore: number;
  fullMark: number;
  description: string;
}

interface SkillRadarChartProps {
  data: CompetencyItem[];
}

export default function SkillRadarChart({ data }: SkillRadarChartProps) {
  const [selectedSkillIndex, setSelectedSkillIndex] = useState<number>(0);

  if (!data || data.length === 0) {
    return null;
  }

  const size = 340;
  const center = size / 2;
  const radius = size * 0.38;
  const numAxes = data.length;

  // Calculate coordinates on spider chart
  const getCoordinates = (index: number, value: number, max: number) => {
    const angle = ((Math.PI * 2) / numAxes) * index - Math.PI / 2;
    const distance = (value / max) * radius;
    const x = center + distance * Math.cos(angle);
    const y = center + distance * Math.sin(angle);
    return { x, y, angle };
  };

  // Generate polygons
  const studentPoints = data
    .map((item, idx) => {
      const { x, y } = getCoordinates(idx, item.studentScore, item.fullMark);
      return `${x},${y}`;
    })
    .join(' ');

  const benchmarkPoints = data
    .map((item, idx) => {
      const { x, y } = getCoordinates(idx, item.benchmarkScore, item.fullMark);
      return `${x},${y}`;
    })
    .join(' ');

  const selectedSkill = data[selectedSkillIndex] || data[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-7 shadow-xl space-y-6 flex flex-col justify-between"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-500 border border-purple-500/20 shadow-sm">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Pedagógiai Készség-Radar (Kompetencia Térkép)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              6 dimenziós algoritmus-értési és gondolkodási készséghálózat
            </p>
          </div>
        </div>
        <span className="hidden sm:inline-flex text-xs font-bold px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 dark:text-purple-400 border border-purple-500/20">
          Spider Chart
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Interactive Radar SVG */}
        <div className="lg:col-span-6 flex items-center justify-center relative">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="w-full max-w-[340px] h-auto overflow-visible"
          >
            <defs>
              <linearGradient id="radarFillGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.25" />
              </linearGradient>
            </defs>

            {/* Concentric grid webs (25%, 50%, 75%, 100%) */}
            {[0.25, 0.5, 0.75, 1.0].map((level, i) => {
              const gridPoints = data
                .map((_, idx) => {
                  const { x, y } = getCoordinates(idx, level * 100, 100);
                  return `${x},${y}`;
                })
                .join(' ');

              return (
                <polygon
                  key={i}
                  points={gridPoints}
                  fill="none"
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeWidth="1"
                />
              );
            })}

            {/* Axis lines from center */}
            {data.map((_, idx) => {
              const { x, y } = getCoordinates(idx, 100, 100);
              return (
                <line
                  key={idx}
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeWidth="1"
                />
              );
            })}

            {/* Benchmark Polygon (Dashed outline) */}
            <polygon
              points={benchmarkPoints}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Student Score Polygon */}
            <motion.polygon
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              points={studentPoints}
              fill="url(#radarFillGrad)"
              stroke="#a855f7"
              strokeWidth="3"
              strokeLinejoin="round"
            />

            {/* Interactive Data Vertices / Nodes */}
            {data.map((item, idx) => {
              const { x, y } = getCoordinates(idx, item.studentScore, item.fullMark);
              const isSelected = selectedSkillIndex === idx;

              return (
                <g
                  key={idx}
                  onClick={() => setSelectedSkillIndex(idx)}
                  className="cursor-pointer group"
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 7 : 4.5}
                    fill={isSelected ? '#ffffff' : '#a855f7'}
                    stroke="#a855f7"
                    strokeWidth={isSelected ? 3 : 2}
                    className="transition-all"
                  />
                </g>
              );
            })}

            {/* Outer Labels */}
            {data.map((item, idx) => {
              const { x, y, angle } = getCoordinates(idx, 118, 100);
              const isSelected = selectedSkillIndex === idx;
              const textAnchor =
                Math.abs(Math.cos(angle)) < 0.15 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end';

              return (
                <text
                  key={idx}
                  x={x}
                  y={y + 4}
                  textAnchor={textAnchor}
                  onClick={() => setSelectedSkillIndex(idx)}
                  className={`text-[11px] cursor-pointer font-bold transition-all ${
                    isSelected
                      ? 'fill-purple-500 font-black'
                      : 'fill-slate-600 dark:fill-slate-400 hover:fill-slate-900 dark:hover:fill-white'
                  }`}
                >
                  {item.subject}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Right: Selected Competency Deep-Dive & Pedagogical Advice */}
        <div className="lg:col-span-6 space-y-4">
          {/* Skill Selector Pills */}
          <div className="flex flex-wrap gap-1.5">
            {data.map((item, idx) => {
              const isSelected = selectedSkillIndex === idx;
              return (
                <button
                  key={item.subject}
                  onClick={() => setSelectedSkillIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-purple-500 text-white border-transparent shadow-sm shadow-purple-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {item.subject}
                </button>
              );
            })}
          </div>

          {/* Selected Skill Card */}
          <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-500" />
                <span>{selectedSkill.subject}</span>
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Kohorsz:</span>
                <span className="text-base font-black text-purple-500">
                  {selectedSkill.studentScore}%
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedSkill.description}
            </p>

            {/* Score Comparison Bars */}
            <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs font-bold">
              <div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300 mb-1">
                  <span>Tanulói csoport eredmény:</span>
                  <span className="text-purple-500 font-black">{selectedSkill.studentScore}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all"
                    style={{ width: `${selectedSkill.studentScore}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-500 dark:text-slate-400 mb-1">
                  <span>Célzott Elvárási Benchmark:</span>
                  <span className="text-slate-400">{selectedSkill.benchmarkScore}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="bg-slate-400 dark:bg-slate-600 h-full rounded-full transition-all"
                    style={{ width: `${selectedSkill.benchmarkScore}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-700 dark:text-purple-300 flex items-center gap-2 font-medium">
            <Info className="w-4 h-4 text-purple-500 shrink-0" />
            <span>
              A készségek 80% feletti értéke biztos invariáns-értést és önálló hibamentes
              kódrekonstrukciót jelez.
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
