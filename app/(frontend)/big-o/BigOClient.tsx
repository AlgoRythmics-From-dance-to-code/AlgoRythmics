'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  Play,
  Pause,
  RotateCcw,
  Activity,
  Lightbulb,
  CheckCircle,
  Sliders,
  Shuffle,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useLocale } from '../../i18n/LocaleProvider';
import { ALGORITHMS } from '../../../lib/constants';
import { getAlgorithm } from '../../../lib/algorithms/registry';
import type { SortStep, SortItem } from '../../../lib/algorithms/bubbleSortSteps';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Define sorting algorithms available for the race
const RACING_ALGORITHMS = [
  { id: 'bubble-sort', nameKey: 'algorithms.list.bubble-sort.name', complexity: 'O(n²)' },
  { id: 'insertion-sort', nameKey: 'algorithms.list.insertion-sort.name', complexity: 'O(n²)' },
  { id: 'selection-sort', nameKey: 'algorithms.list.selection-sort.name', complexity: 'O(n²)' },
  { id: 'shell-sort', nameKey: 'algorithms.list.shell-sort.name', complexity: 'O(n log n)' },
  { id: 'merge-sort', nameKey: 'algorithms.list.merge-sort.name', complexity: 'O(n log n)' },
  { id: 'quick-sort', nameKey: 'algorithms.list.quick-sort.name', complexity: 'O(n log n)' },
  { id: 'heap-sort', nameKey: 'algorithms.list.heap-sort.name', complexity: 'O(n log n)' },
  { id: 'bogosort', nameKey: 'algorithms.list.bogosort.name', complexity: 'O(n! · n)' },
];

export default function BigOClient() {
  const { t } = useLocale();
  const { status } = useSession();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash;
      const el = document.querySelector(hash);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // --- Graph State ---
  const [nValue, setNValue] = useState<number>(10);
  const [selectedAlgo, setSelectedAlgo] = useState<string>('quick-sort');
  const [hiddenCurves, setHiddenCurves] = useState<string[]>([]);
  const [hoveredCurve, setHoveredCurve] = useState<string | null>(null);

  // --- Race State ---
  const [algoLeft, setAlgoLeft] = useState<string>('quick-sort');
  const [algoRight, setAlgoRight] = useState<string>('bubble-sort');
  const [arraySize, setArraySize] = useState<number>(25);
  const [arrayType, setArrayType] = useState<'random' | 'reversed' | 'nearly_sorted'>('random');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(30); // steps per second

  // Arrays and steps
  const [stepsLeft, setStepsLeft] = useState<SortStep[]>([]);
  const [stepsRight, setStepsRight] = useState<SortStep[]>([]);
  const [currentStepLeft, setCurrentStepLeft] = useState<number>(0);
  const [currentStepRight, setCurrentStepRight] = useState<number>(0);
  const currentOpsLeftRef = useRef<number>(0);
  const currentOpsRightRef = useRef<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const stepLeftRef = useRef<number>(0);
  const stepRightRef = useRef<number>(0);

  // Sync refs with state updates
  useEffect(() => {
    stepLeftRef.current = currentStepLeft;
  }, [currentStepLeft]);

  useEffect(() => {
    stepRightRef.current = currentStepRight;
  }, [currentStepRight]);

  // Math Helper for graph values: Stirling's approximation to ensure a smooth, continuous factorial curve
  const factorial = (num: number): number => {
    if (num <= 1) return 1;
    const e = Math.E;
    const pi = Math.PI;
    return Math.sqrt(2 * pi * num) * Math.pow(num / e, num);
  };

  const complexityClasses = useMemo(
    () => [
      {
        id: 'O(1)',
        label: 'O(1)',
        color: '#10b981',
        formula: (_n: number) => 1,
        descKey: 'big_o.classes.o1',
      },
      {
        id: 'O(log n)',
        label: 'O(log n)',
        color: '#06b6d4',
        formula: (n: number) => Math.log2(n),
        descKey: 'big_o.classes.ologn',
      },
      {
        id: 'O(n)',
        label: 'O(n)',
        color: '#84cc16',
        formula: (n: number) => n,
        descKey: 'big_o.classes.on',
      },
      {
        id: 'O(n log n)',
        label: 'O(n log n)',
        color: '#f59e0b',
        formula: (n: number) => n * Math.log2(n),
        descKey: 'big_o.classes.onlogn',
      },
      {
        id: 'O(n2)',
        label: 'O(n²)',
        color: '#f97316',
        formula: (n: number) => n * n,
        descKey: 'big_o.classes.on2',
      },
      {
        id: 'O(2n)',
        label: 'O(2ⁿ)',
        color: '#ef4444',
        formula: (n: number) => Math.pow(2, n),
        descKey: 'big_o.classes.o2n',
      },
      {
        id: 'O(n!)',
        label: 'O(n!)',
        color: '#ec4899',
        formula: (n: number) => factorial(n),
        descKey: 'big_o.classes.onfact',
      },
    ],
    [],
  );

  // Set selected algorithm complexity
  const getAlgoComplexityClass = (algoId: string) => {
    const algo = ALGORITHMS.find((a) => a.id === algoId);
    if (!algo) return 'O(n2)';
    const comp = algo.complexity;
    if (comp === 'O(n²)') return 'O(n2)';
    if (comp === 'O(n log n)') return 'O(n log n)';
    if (comp === 'O(log n)') return 'O(log n)';
    if (comp === 'O(n)') return 'O(n)';
    if (comp === 'O(n!)' || comp.includes('O(n!')) return 'O(n!)';
    return 'O(1)';
  };

  const highlightedCurve = useMemo(() => {
    return getAlgoComplexityClass(selectedAlgo);
  }, [selectedAlgo]);

  // Select matching algorithm when a complexity curve is clicked
  const selectComplexityCurve = (curveId: string) => {
    const matchingAlgo = ALGORITHMS.find((algo) => {
      const comp = algo.complexity;
      if (curveId === 'O(n2)' && comp === 'O(n²)') return true;
      if (curveId === 'O(n log n)' && comp === 'O(n log n)') return true;
      if (curveId === 'O(log n)' && comp === 'O(log n)') return true;
      if (curveId === 'O(n)' && comp === 'O(n)') return true;
      if (curveId === 'O(n!)' && (comp === 'O(n!)' || comp.includes('O(n!'))) return true;
      return false;
    });
    if (matchingAlgo) {
      setSelectedAlgo(matchingAlgo.id);
    }
  };

  // Graph plotting coordinates setup
  const graphWidth = 750;
  const graphHeight = 480;
  const padding = 65;

  const plotXDomain = 60; // max N plotted
  const plotYDomain = 500; // max Y plotted

  const getSvgX = (n: number) => {
    return padding + (n / plotXDomain) * (graphWidth - 2 * padding);
  };

  const getSvgY = (yVal: number) => {
    const safeY = Math.min(yVal, plotYDomain * 10);
    return graphHeight - padding - (safeY / plotYDomain) * (graphHeight - 2 * padding);
  };

  const graphPaths = useMemo(() => {
    return complexityClasses.map((cClass) => {
      let pathString = '';
      for (let n = 1; n <= plotXDomain; n += 0.1) {
        const yVal = cClass.formula(n);
        const x = getSvgX(n);
        const y = getSvgY(yVal);
        if (n === 1) {
          pathString += `M ${x} ${y}`;
        } else {
          pathString += ` L ${x} ${y}`;
        }
      }
      return {
        id: cClass.id,
        path: pathString,
        color: cClass.color,
        label: cClass.label,
        descKey: cClass.descKey,
      };
    });
  }, [complexityClasses]);

  // Generate dataset for race mode
  const generateRaceArray = useCallback(() => {
    const size = arraySize;
    const arr: number[] = [];
    if (arrayType === 'random') {
      for (let i = 0; i < size; i++) {
        arr.push(Math.floor(Math.random() * 85) + 15);
      }
    } else if (arrayType === 'reversed') {
      for (let i = size; i > 0; i--) {
        arr.push(Math.floor((i / size) * 85) + 15);
      }
    } else {
      // nearly sorted
      for (let i = 0; i < size; i++) {
        arr.push(Math.floor((i / size) * 80) + 15);
      }
      // swap a few elements
      for (let i = 0; i < Math.max(1, Math.floor(size / 6)); i++) {
        const idx1 = Math.floor(Math.random() * size);
        const idx2 = Math.floor(Math.random() * size);
        const tmp = arr[idx1];
        arr[idx1] = arr[idx2];
        arr[idx2] = tmp;
      }
    }

    // Generate steps
    const algoLDef = getAlgorithm(algoLeft);
    const algoRDef = getAlgorithm(algoRight);

    const sL = algoLDef ? algoLDef.generateSteps([...arr]) : [];
    const sR = algoRDef ? algoRDef.generateSteps([...arr]) : [];

    setStepsLeft(sL);
    setStepsRight(sR);
    setCurrentStepLeft(0);
    setCurrentStepRight(0);
    currentOpsLeftRef.current = 0;
    currentOpsRightRef.current = 0;
    setIsRunning(false);
  }, [algoLeft, algoRight, arraySize, arrayType]);

  // Generate initial race array on component load or changes in size/type/algos
  useEffect(() => {
    generateRaceArray();
  }, [generateRaceArray]);

  // Playback timer loop (Operation-paced)
  useEffect(() => {
    if (isRunning) {
      const intervalMs = 1000 / playbackSpeed;
      timerRef.current = setInterval(() => {
        const finalL = stepsLeft[stepsLeft.length - 1];
        const finalR = stepsRight[stepsRight.length - 1];
        const totalOpsL = (finalL?.comparisons || 0) + (finalL?.swapCount || 0);
        const totalOpsR = (finalR?.comparisons || 0) + (finalR?.swapCount || 0);

        const hasLeftMore = currentOpsLeftRef.current < totalOpsL;
        const hasRightMore = currentOpsRightRef.current < totalOpsR;

        if (!hasLeftMore && !hasRightMore) {
          setIsRunning(false);
          return;
        }

        if (hasLeftMore) {
          currentOpsLeftRef.current += 1;
          const targetOps = currentOpsLeftRef.current;
          let idx = stepsLeft.length - 1;
          for (let i = 0; i < stepsLeft.length; i++) {
            const ops = (stepsLeft[i].comparisons || 0) + (stepsLeft[i].swapCount || 0);
            if (ops >= targetOps) {
              idx = i;
              break;
            }
          }
          if (targetOps >= totalOpsL) idx = stepsLeft.length - 1;
          setCurrentStepLeft(idx);
        }

        if (hasRightMore) {
          currentOpsRightRef.current += 1;
          const targetOps = currentOpsRightRef.current;
          let idx = stepsRight.length - 1;
          for (let i = 0; i < stepsRight.length; i++) {
            const ops = (stepsRight[i].comparisons || 0) + (stepsRight[i].swapCount || 0);
            if (ops >= targetOps) {
              idx = i;
              break;
            }
          }
          if (targetOps >= totalOpsR) idx = stepsRight.length - 1;
          setCurrentStepRight(idx);
        }
      }, intervalMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, stepsLeft, stepsRight, playbackSpeed]);

  const resetRace = () => {
    setIsRunning(false);
    setCurrentStepLeft(0);
    setCurrentStepRight(0);
    currentOpsLeftRef.current = 0;
    currentOpsRightRef.current = 0;
  };

  // Get active step info
  const activeLeftStepObj = stepsLeft[currentStepLeft] || {
    array: [],
    activeIndices: [],
    swapping: false,
    comparisons: 0,
    swapCount: 0,
    sortedIndices: [],
  };
  const activeRightStepObj = stepsRight[currentStepRight] || {
    array: [],
    activeIndices: [],
    swapping: false,
    comparisons: 0,
    swapCount: 0,
    sortedIndices: [],
  };

  const isLeftFinished = currentStepLeft === stepsLeft.length - 1 && stepsLeft.length > 0;
  const isRightFinished = currentStepRight === stepsRight.length - 1 && stepsRight.length > 0;

  // Race results summary
  const showResults = isLeftFinished && isRightFinished;
  const raceSummary = useMemo(() => {
    if (!showResults) return null;
    const finalL = stepsLeft[stepsLeft.length - 1];
    const finalR = stepsRight[stepsRight.length - 1];

    const totalOpsL = (finalL?.comparisons || 0) + (finalL?.swapCount || 0);
    const totalOpsR = (finalR?.comparisons || 0) + (finalR?.swapCount || 0);

    const nameL = t(`algorithms.list.${algoLeft}.name`);
    const nameR = t(`algorithms.list.${algoRight}.name`);

    if (totalOpsL === totalOpsR) {
      return {
        tie: true,
        text:
          t('big_o.tie_msg') ||
          'Tie! Both algorithms executed the exact same number of operations.',
      };
    }

    const winner = totalOpsL < totalOpsR ? nameL : nameR;
    const loser = totalOpsL < totalOpsR ? nameR : nameL;
    const winnerOps = totalOpsL < totalOpsR ? totalOpsL : totalOpsR;
    const loserOps = totalOpsL < totalOpsR ? totalOpsR : totalOpsL;
    const ratio = (loserOps / Math.max(1, winnerOps)).toFixed(1);

    return {
      tie: false,
      winner,
      loser,
      ratio,
      winnerOps,
      loserOps,
    };
  }, [showResults, stepsLeft, stepsRight, algoLeft, algoRight, t]);

  const selectedAlgoObj = useMemo(() => {
    return ALGORITHMS.find((a) => a.id === selectedAlgo);
  }, [selectedAlgo]);

  const activeClass = useMemo(() => {
    const isCurClass = getAlgoComplexityClass(selectedAlgo);
    return complexityClasses.find((c) => c.id === isCurClass);
  }, [selectedAlgo, complexityClasses]);

  // Format operations count nicely (numeric with separators or scientific notation if huge)
  const formattedOperations = useMemo(() => {
    if (!activeClass) return 'N/A';
    const ops = activeClass.formula(nValue);
    if (ops >= 1e21) {
      return ops.toExponential(2).replace('e+', ' × 10^');
    }
    return Math.round(ops).toLocaleString();
  }, [activeClass, nValue]);

  // Scale comparison key when N is very large
  const scaleComparisonKey = useMemo(() => {
    if (!activeClass) return null;
    const ops = activeClass.formula(nValue);
    if (ops >= 1e80) return 'big_o.compare.universe';
    if (ops >= 1e50) return 'big_o.compare.earth_atoms';
    if (ops >= 1e26) return 'big_o.compare.nanoseconds';
    if (ops >= 1e23) return 'big_o.compare.ocean_drops';
    if (ops >= 1e18) return 'big_o.compare.sand_grains';
    if (ops >= 1e9) return 'big_o.compare.earth_population';
    return null;
  }, [activeClass, nValue]);

  const toggleCurveVisibility = (curveId: string) => {
    if (hiddenCurves.includes(curveId)) {
      setHiddenCurves(hiddenCurves.filter((c) => c !== curveId));
    } else {
      setHiddenCurves([...hiddenCurves, curveId]);
    }
  };

  if (!mounted || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#269984] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white dark:bg-[#0a0a0a] min-h-screen text-black dark:text-white pt-24 pb-20">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 flex flex-col gap-16">
        <div className="text-center mb-2">
          <h1 className="font-montserrat font-black text-3xl sm:text-4xl uppercase tracking-tight text-[#269984]">
            {t('big_o.title') || 'Big O Complexity & Race'}
          </h1>
        </div>

        {/* Section 1: Interactive Complexity Graph */}
        <section id="graph" className="scroll-mt-28 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Interactive SVG Chart */}
          <div className="lg:col-span-8 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-montserrat font-bold text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#269984]" />
                  {t('big_o.graph_title') || 'Interactive Complexity Graph (Average Case)'}
                </h3>
                <div className="flex items-center gap-2 text-xs font-montserrat text-gray-500">
                  <span>Max N: {plotXDomain}</span>
                  <span>|</span>
                  <span>Max Steps: {plotYDomain}</span>
                </div>
              </div>

              {/* SVG Chart Container */}
              <div className="relative w-full overflow-hidden flex justify-center bg-white dark:bg-black/25 rounded-2xl border border-gray-100 dark:border-white/5 py-4">
                <svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${graphWidth} ${graphHeight}`}
                  className="w-full max-w-[760px] h-auto select-none"
                >
                  <defs>
                    <clipPath id="graph-clip">
                      <rect
                        x={padding}
                        y={padding}
                        width={graphWidth - 2 * padding}
                        height={graphHeight - 2 * padding}
                      />
                    </clipPath>
                  </defs>

                  {/* Gridlines */}
                  <line
                    x1={padding}
                    y1={padding}
                    x2={padding}
                    y2={graphHeight - padding}
                    stroke="currentColor"
                    strokeWidth={1.5}
                    className="text-gray-300 dark:text-gray-700"
                  />
                  <line
                    x1={padding}
                    y1={graphHeight - padding}
                    x2={graphWidth - padding}
                    y2={graphHeight - padding}
                    stroke="currentColor"
                    strokeWidth={1.5}
                    className="text-gray-300 dark:text-gray-700"
                  />

                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = padding + ratio * (graphHeight - 2 * padding);
                    const val = Math.round(plotYDomain - ratio * plotYDomain);
                    return (
                      <g key={`grid-y-${idx}`}>
                        <line
                          x1={padding}
                          y1={y}
                          x2={graphWidth - padding}
                          y2={y}
                          stroke="currentColor"
                          strokeDasharray="4 4"
                          strokeOpacity={0.3}
                          className="text-gray-300 dark:text-gray-700"
                        />
                        <text
                          x={padding - 10}
                          y={y + 4}
                          textAnchor="end"
                          className="fill-gray-400 dark:fill-gray-500 font-montserrat font-bold text-[10px]"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {[0.2, 0.4, 0.6, 0.8, 1].map((ratio, idx) => {
                    const x = padding + ratio * (graphWidth - 2 * padding);
                    const val = Math.round(ratio * plotXDomain);
                    return (
                      <g key={`grid-x-${idx}`}>
                        <line
                          x1={x}
                          y1={padding}
                          x2={x}
                          y2={graphHeight - padding}
                          stroke="currentColor"
                          strokeDasharray="4 4"
                          strokeOpacity={0.3}
                          className="text-gray-300 dark:text-gray-700"
                        />
                        <text
                          x={x}
                          y={graphHeight - padding + 18}
                          textAnchor="middle"
                          className="fill-gray-400 dark:fill-gray-500 font-montserrat font-bold text-[10px]"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Y-axis label */}
                  <text
                    x={15}
                    y={graphHeight / 2}
                    transform={`rotate(-90 15 ${graphHeight / 2})`}
                    textAnchor="middle"
                    className="fill-gray-400 dark:fill-gray-500 font-montserrat font-black uppercase text-[10px] tracking-widest"
                  >
                    {t('big_o.operations') || 'Operations'}
                  </text>

                  {/* X-axis label */}
                  <text
                    x={graphWidth / 2}
                    y={graphHeight - 15}
                    textAnchor="middle"
                    className="fill-gray-400 dark:fill-gray-500 font-montserrat font-black uppercase text-[10px] tracking-widest"
                  >
                    {t('big_o.n_elements') || 'Elements (N)'}
                  </text>

                  {/* Plotting Curves */}
                  {graphPaths.map((curve) => {
                    const isHidden = hiddenCurves.includes(curve.id);
                    const isHighlighted = highlightedCurve === curve.id;
                    const isHovered = hoveredCurve === curve.id;

                    const opacity = isHidden
                      ? 0
                      : isHovered
                        ? 1
                        : highlightedCurve
                          ? isHighlighted
                            ? 1
                            : 0.25
                          : 0.85;

                    const strokeWidth = isHovered ? 5 : isHighlighted ? 4 : 2;

                    return (
                      <path
                        key={curve.id}
                        d={curve.path}
                        clipPath="url(#graph-clip)"
                        fill="none"
                        stroke={curve.color}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={opacity}
                        shapeRendering="geometricPrecision"
                        className="transition-all duration-200 cursor-pointer"
                        onMouseEnter={() => setHoveredCurve(curve.id)}
                        onMouseLeave={() => setHoveredCurve(null)}
                        onClick={() => selectComplexityCurve(curve.id)}
                      />
                    );
                  })}

                  {/* Glowing points on curves at active N */}
                  {complexityClasses.map((cClass) => {
                    const isHidden = hiddenCurves.includes(cClass.id);
                    if (isHidden) return null;

                    const val = cClass.formula(nValue);
                    if (val > plotYDomain + 50) return null; // off chart

                    const isHighlighted = highlightedCurve === cClass.id;
                    const isHovered = hoveredCurve === cClass.id;
                    const opacity = isHovered
                      ? 1
                      : highlightedCurve
                        ? isHighlighted
                          ? 1
                          : 0.2
                        : 0.9;
                    const r = isHovered ? 7 : isHighlighted ? 6 : 4;

                    return (
                      <g
                        key={`dot-${cClass.id}`}
                        opacity={opacity}
                        className="transition-all duration-200 cursor-pointer"
                        onMouseEnter={() => setHoveredCurve(cClass.id)}
                        onMouseLeave={() => setHoveredCurve(null)}
                        onClick={() => selectComplexityCurve(cClass.id)}
                      >
                        <circle cx={getSvgX(nValue)} cy={getSvgY(val)} r={r} fill={cClass.color} />
                        {(isHighlighted || isHovered) && (
                          <circle
                            cx={getSvgX(nValue)}
                            cy={getSvgY(val)}
                            r={r + 4}
                            fill="none"
                            stroke={cClass.color}
                            strokeWidth={1.5}
                            opacity={0.6}
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* SVG Tooltip on Hover */}
                {hoveredCurve && (
                  <div className="absolute top-4 right-4 bg-black/80 text-white text-xs px-3 py-1.5 rounded-xl border border-white/10 font-montserrat shadow-lg pointer-events-none backdrop-blur-md">
                    <span className="font-bold">{hoveredCurve}</span>
                    <span className="opacity-75 font-normal ml-2">
                      ({t(complexityClasses.find((c) => c.id === hoveredCurve)?.descKey || '')})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Slider input & Operations details */}
            <div className="mt-8 bg-white dark:bg-[#1a1a1a] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-montserrat font-bold text-xs uppercase text-gray-500 tracking-wider">
                    {t('big_o.n_elements') || 'Number of elements (N)'}:
                  </span>
                  <span className="font-montserrat font-black text-2xl text-[#269984]">
                    {nValue}
                  </span>
                </div>

                {/* Operations Display */}
                <div className="flex flex-col gap-1 items-end">
                  <div className="flex items-center gap-2 text-xs font-montserrat bg-[#269984]/10 dark:bg-[#269984]/20 px-3.5 py-2 rounded-xl border border-[#269984]/20">
                    <span className="text-gray-500 dark:text-gray-400 font-bold">
                      {selectedAlgoObj ? t(`algorithms.list.${selectedAlgoObj.id}.name`) : ''}{' '}
                      {t('big_o.operations').toLowerCase() || 'operations'}:
                    </span>
                    <span className="font-mono font-black text-sm text-[#269984]">
                      {formattedOperations}
                    </span>
                  </div>
                </div>
              </div>

              {/* Optional Scale Comparison badge */}
              {scaleComparisonKey && (
                <div className="mb-4 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/20 px-3.5 py-2 rounded-xl text-amber-700 dark:text-amber-300 font-montserrat font-semibold text-xs flex items-center gap-2">
                  <span>{t(scaleComparisonKey)}</span>
                </div>
              )}

              <div className="relative mt-2">
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={nValue}
                  onChange={(e) => setNValue(parseInt(e.target.value))}
                  className="w-full accent-[#269984] h-2 bg-gray-100 dark:bg-white/10 rounded-lg appearance-none cursor-pointer focus:outline-none transition-all duration-300"
                />
                <div className="flex justify-between text-[10px] font-montserrat font-bold text-gray-400 mt-1 px-0.5">
                  <span>N = 1</span>
                  <span>N = 60</span>
                </div>
              </div>
              <p className="font-montserrat text-[10px] text-gray-400 mt-3">
                {t('big_o.graph_desc') ||
                  'The chart above illustrates the theoretical growth of steps as a function of elements N. Drag the slider to change N!'}
              </p>
            </div>
          </div>

          {/* Sidebar: Details and Controls */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Algorithm Selector */}
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 p-6 rounded-3xl shadow-md">
              <h3 className="font-montserrat font-bold text-sm uppercase tracking-wider text-gray-500 mb-4">
                {t('big_o.algo_select') || 'Select Algorithm'}
              </h3>
              <div className="grid grid-cols-1 gap-2.5 max-h-[210px] overflow-y-auto pr-1">
                {ALGORITHMS.map((algo) => {
                  const isActive = selectedAlgo === algo.id;
                  const complexity = algo.complexity;
                  return (
                    <button
                      key={algo.id}
                      onClick={() => setSelectedAlgo(algo.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl font-montserrat text-xs flex items-center justify-between border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#269984]/15 border-[#269984] text-[#269984] font-bold shadow-sm'
                          : 'bg-white dark:bg-[#1a1a1a]/40 border-gray-200/50 dark:border-white/5 text-[#555] dark:text-gray-400 hover:border-[#269984]/35 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      <span>{t(`algorithms.list.${algo.id}.name`)}</span>
                      <span className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/5 text-[10px] font-mono">
                        {complexity}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Algorithm Details Card */}
            {(() => {
              const realLife = t(`algorithms.list.${selectedAlgo}.real_life`);

              return (
                <motion.div
                  key={selectedAlgo}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 p-6 rounded-3xl shadow-md flex-1 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: activeClass?.color }}
                      />
                      <h3 className="font-montserrat font-black text-xl">
                        {selectedAlgoObj
                          ? t(`algorithms.list.${selectedAlgoObj.id}.name`)
                          : selectedAlgo}
                      </h3>
                    </div>

                    <div className="flex gap-4 mb-4 text-xs font-montserrat">
                      <div>
                        <span className="block text-gray-500 font-bold">
                          {t('big_o.complexity') || 'Complexity'}:
                        </span>
                        <span className="font-mono text-sm font-bold text-[#269984]">
                          {selectedAlgoObj?.complexity}
                        </span>
                      </div>
                      <div>
                        <span className="block text-gray-500 font-bold">
                          {t('big_o.formula') || 'Formula'}:
                        </span>
                        <span className="font-mono text-sm font-bold text-[#269984]">
                          {activeClass?.id === 'O(1)'
                            ? '1'
                            : activeClass?.id === 'O(log n)'
                              ? 'log₂ N'
                              : activeClass?.id === 'O(n)'
                                ? 'N'
                                : activeClass?.id === 'O(n log n)'
                                  ? 'N log₂ N'
                                  : activeClass?.id === 'O(n2)'
                                    ? 'N²'
                                    : activeClass?.id === 'O(2n)'
                                      ? '2ᴺ'
                                      : 'N!'}
                        </span>
                      </div>
                    </div>

                    {/* Real Life Usage Case */}
                    {realLife && realLife !== `algorithms.list.${selectedAlgo}.real_life` && (
                      <div className="bg-white dark:bg-[#1a1a1a] p-4.5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm mt-4">
                        <div className="flex items-center gap-2 mb-2 text-[#269984]">
                          <Lightbulb className="w-4 h-4" />
                          <span className="font-montserrat font-bold text-xs uppercase tracking-wider">
                            {t('algorithms.detail.real_life_title') || 'Where is this used?'}
                          </span>
                        </div>
                        <p className="font-montserrat text-xs text-[#555] dark:text-gray-300 leading-relaxed">
                          {realLife}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Complexity Legend Checkboxes */}
                  <div className="border-t border-gray-200/50 dark:border-white/5 pt-4 mt-6">
                    <h4 className="font-montserrat font-bold text-[10px] uppercase tracking-wider text-gray-500 mb-3">
                      {t('big_o.complexity_curves_toggle') || 'Complexity curves toggle'}:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {complexityClasses.map((cClass) => {
                        const isHidden = hiddenCurves.includes(cClass.id);
                        return (
                          <button
                            key={cClass.id}
                            onClick={() => toggleCurveVisibility(cClass.id)}
                            className={`px-3 py-1.5 rounded-xl font-montserrat text-[11px] font-bold border flex items-center gap-2 transition-all cursor-pointer ${
                              !isHidden
                                ? 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10 shadow-sm text-gray-800 dark:text-gray-200 hover:border-[#269984]/40'
                                : 'opacity-40 bg-gray-100 dark:bg-white/5 border-transparent text-gray-400 line-through'
                            }`}
                          >
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: cClass.color }}
                            />
                            <span>{cClass.label}</span>
                            <span className="ml-0.5">
                              {isHidden ? (
                                <EyeOff className="w-3.5 h-3.5 text-red-400 opacity-70" />
                              ) : (
                                <Eye className="w-3.5 h-3.5 text-gray-400 opacity-70" />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              );
            })()}
          </div>
        </section>

        {/* Section 2: Race Mode */}
        <section
          id="race"
          className="scroll-mt-28 flex flex-col gap-8 border-t border-gray-200/60 dark:border-white/10 pt-12"
        >
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-6 h-6 text-[#269984]" />
            <h2 className="font-montserrat font-black text-2xl uppercase tracking-tight">
              {t('big_o.tab_race') || 'Race Mode'}
            </h2>
          </div>
          {/* Settings bar */}
          <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 p-6 rounded-3xl shadow-lg">
            <h3 className="font-montserrat font-bold text-sm uppercase tracking-wider text-gray-500 mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#269984]" />
              {t('big_o.race_settings') || 'Race Settings'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Left Algorithm Selector */}
              <div>
                <label className="block font-montserrat font-bold text-xs text-gray-500 mb-2">
                  {t('big_o.algo1_left') || 'Algorithm 1 (Left)'}
                </label>
                <select
                  value={algoLeft}
                  onChange={(e) => setAlgoLeft(e.target.value)}
                  className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 px-4 py-2.5 rounded-xl font-montserrat text-sm outline-none focus:border-[#269984]"
                >
                  {RACING_ALGORITHMS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {t(a.nameKey)} ({a.complexity})
                    </option>
                  ))}
                </select>
              </div>

              {/* Right Algorithm Selector */}
              <div>
                <label className="block font-montserrat font-bold text-xs text-gray-500 mb-2">
                  {t('big_o.algo2_right') || 'Algorithm 2 (Right)'}
                </label>
                <select
                  value={algoRight}
                  onChange={(e) => setAlgoRight(e.target.value)}
                  className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 px-4 py-2.5 rounded-xl font-montserrat text-sm outline-none focus:border-[#269984]"
                >
                  {RACING_ALGORITHMS.map((a) => (
                    <option key={a.id} value={a.id}>
                      {t(a.nameKey)} ({a.complexity})
                    </option>
                  ))}
                </select>
              </div>

              {/* Array size */}
              <div>
                <label className="block font-montserrat font-bold text-xs text-gray-500 mb-2">
                  {t('big_o.array_size') || 'Array Size'}
                </label>
                <div className="flex gap-2">
                  {[10, 25, 45].map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setArraySize(sz)}
                      className={`flex-1 py-2 rounded-xl font-montserrat font-bold text-xs border transition-all cursor-pointer ${
                        arraySize === sz
                          ? 'bg-[#269984] border-[#269984] text-white shadow-sm'
                          : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10 text-gray-500 hover:text-black dark:hover:text-white'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              {/* Initial state type */}
              <div>
                <label className="block font-montserrat font-bold text-xs text-gray-500 mb-2">
                  {t('big_o.array_type') || 'Initial State'}
                </label>
                <select
                  value={arrayType}
                  onChange={(e) =>
                    setArrayType(e.target.value as 'random' | 'reversed' | 'nearly_sorted')
                  }
                  className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 px-4 py-2.5 rounded-xl font-montserrat text-sm outline-none focus:border-[#269984]"
                >
                  <option value="random">{t('big_o.random') || 'Random'}</option>
                  <option value="reversed">{t('big_o.reversed') || 'Reversed'}</option>
                  <option value="nearly_sorted">
                    {t('big_o.nearly_sorted') || 'Nearly Sorted'}
                  </option>
                </select>
              </div>
            </div>

            {/* Control Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-200/50 dark:border-white/5 pt-6 mt-6 gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsRunning(!isRunning)}
                  className={`px-8 py-3.5 rounded-2xl font-montserrat font-bold text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
                    isRunning
                      ? 'bg-amber-600 text-white shadow-amber-600/20'
                      : 'bg-[#269984] text-white hover:bg-[#1f7a6a] shadow-[#269984]/20'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-4 h-4 fill-white" />
                      {t('big_o.pause') || 'Pause'}
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      {t('big_o.start_race') || 'Start Race'}
                    </>
                  )}
                </button>
                <button
                  onClick={resetRace}
                  className="px-5 py-3.5 rounded-2xl font-montserrat font-bold text-sm bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  {t('big_o.reset') || 'Reset'}
                </button>
                <button
                  onClick={generateRaceArray}
                  className="px-5 py-3.5 rounded-2xl font-montserrat font-bold text-sm bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Shuffle className="w-4 h-4 text-[#269984]" />
                  {t('big_o.shuffle') || 'Keverés'}
                </button>
              </div>

              {/* Playback speed slider */}
              <div className="flex items-center gap-4 w-full sm:max-w-[280px]">
                <span className="font-montserrat text-xs font-bold text-gray-500 whitespace-nowrap">
                  {t('big_o.speed') || 'Speed'}: {playbackSpeed}{' '}
                  {t('big_o.steps_per_sec') || 'steps/sec'}
                </span>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(parseInt(e.target.value))}
                  className="w-full accent-[#269984] h-1.5 bg-gray-200 dark:bg-white/10 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Side-by-Side Visualizers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column Visualizer */}
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 p-6 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden">
              {isLeftFinished && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 z-10 font-montserrat font-bold text-[10px] uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4" />
                  <span>{t('big_o.finished') || 'Finished'}</span>
                </div>
              )}

              <div>
                <div className="mb-5">
                  <h4 className="font-montserrat font-black text-xl uppercase tracking-tight text-[#269984] mb-1">
                    {t(`algorithms.list.${algoLeft}.name`)}
                  </h4>
                  <span className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/5 text-xs font-mono">
                    {t('big_o.complexity') || 'Complexity'}:{' '}
                    {RACING_ALGORITHMS.find((a) => a.id === algoLeft)?.complexity}
                  </span>
                </div>

                {/* Bar visualization area with Framer Motion layout */}
                <div className="h-64 bg-white dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 flex items-end justify-center gap-1 p-6 overflow-hidden relative shadow-inner">
                  {activeLeftStepObj.array.map((item: SortItem, idx: number) => {
                    const isActive = activeLeftStepObj.activeIndices.includes(idx);
                    const isSorted = activeLeftStepObj.sortedIndices.includes(idx);
                    const isSwapping = isActive && activeLeftStepObj.swapping;
                    const isPivot = activeLeftStepObj.pivotIndex === idx;

                    let color = 'bg-gray-200 dark:bg-white/10';
                    if (isSwapping) color = 'bg-amber-500';
                    else if (isPivot) color = 'bg-purple-500';
                    else if (isActive) color = 'bg-[#269984]';
                    else if (isSorted) color = 'bg-emerald-500 dark:bg-emerald-400';

                    const heightPercent = `${(item.val / 100) * 85 + 10}%`;

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                        className={`flex-1 min-w-[3px] rounded-t-sm ${color}`}
                        style={{ height: heightPercent }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Left Stats */}
              <div className="grid grid-cols-3 gap-4 border-t border-gray-200/50 dark:border-white/5 pt-4 mt-6 text-center font-montserrat">
                <div>
                  <span className="block text-[10px] text-gray-500 font-bold uppercase">
                    {t('big_o.comparisons') || 'Comparisons'}
                  </span>
                  <span className="text-lg font-black text-[#269984]">
                    {currentStepLeft === 0 ? '-' : activeLeftStepObj.comparisons || 0}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-500 font-bold uppercase">
                    {t('big_o.swaps_writes') || 'Swaps / Writes'}
                  </span>
                  <span className="text-lg font-black text-[#269984]">
                    {currentStepLeft === 0 ? '-' : activeLeftStepObj.swapCount || 0}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-500 font-bold uppercase">
                    {t('big_o.total_steps') || 'Total Steps'}
                  </span>
                  <span className="text-lg font-black text-[#269984]">
                    {currentStepLeft === 0
                      ? '-'
                      : (activeLeftStepObj.comparisons || 0) +
                        (activeLeftStepObj.swapCount || 0)}{' '}
                    /{' '}
                    {(stepsLeft[stepsLeft.length - 1]?.comparisons || 0) +
                      (stepsLeft[stepsLeft.length - 1]?.swapCount || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column Visualizer */}
            <div className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 p-6 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden">
              {isRightFinished && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 z-10 font-montserrat font-bold text-[10px] uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4" />
                  <span>{t('big_o.finished') || 'Finished'}</span>
                </div>
              )}

              <div>
                <div className="mb-5">
                  <h4 className="font-montserrat font-black text-xl uppercase tracking-tight text-[#269984] mb-1">
                    {t(`algorithms.list.${algoRight}.name`)}
                  </h4>
                  <span className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/5 text-xs font-mono">
                    {t('big_o.complexity') || 'Complexity'}:{' '}
                    {RACING_ALGORITHMS.find((a) => a.id === algoRight)?.complexity}
                  </span>
                </div>

                {/* Bar visualization area with Framer Motion layout */}
                <div className="h-64 bg-white dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 flex items-end justify-center gap-1 p-6 overflow-hidden relative shadow-inner">
                  {activeRightStepObj.array.map((item: SortItem, idx: number) => {
                    const isActive = activeRightStepObj.activeIndices.includes(idx);
                    const isSorted = activeRightStepObj.sortedIndices.includes(idx);
                    const isSwapping = isActive && activeRightStepObj.swapping;
                    const isPivot = activeRightStepObj.pivotIndex === idx;

                    let color = 'bg-gray-200 dark:bg-white/10';
                    if (isSwapping) color = 'bg-amber-500';
                    else if (isPivot) color = 'bg-purple-500';
                    else if (isActive) color = 'bg-[#269984]';
                    else if (isSorted) color = 'bg-emerald-500 dark:bg-emerald-400';

                    const heightPercent = `${(item.val / 100) * 85 + 10}%`;

                    return (
                      <motion.div
                        key={item.id}
                        layout
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                        className={`flex-1 min-w-[3px] rounded-t-sm ${color}`}
                        style={{ height: heightPercent }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Right Stats */}
              <div className="grid grid-cols-3 gap-4 border-t border-gray-200/50 dark:border-white/5 pt-4 mt-6 text-center font-montserrat">
                <div>
                  <span className="block text-[10px] text-gray-500 font-bold uppercase">
                    {t('big_o.comparisons') || 'Comparisons'}
                  </span>
                  <span className="text-lg font-black text-[#269984]">
                    {currentStepRight === 0 ? '-' : activeRightStepObj.comparisons || 0}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-500 font-bold uppercase">
                    {t('big_o.swaps_writes') || 'Swaps / Writes'}
                  </span>
                  <span className="text-lg font-black text-[#269984]">
                    {currentStepRight === 0 ? '-' : activeRightStepObj.swapCount || 0}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] text-gray-500 font-bold uppercase">
                    {t('big_o.total_steps') || 'Total Steps'}
                  </span>
                  <span className="text-lg font-black text-[#269984]">
                    {currentStepRight === 0
                      ? '-'
                      : (activeRightStepObj.comparisons || 0) +
                        (activeRightStepObj.swapCount || 0)}{' '}
                    /{' '}
                    {(stepsRight[stepsRight.length - 1]?.comparisons || 0) +
                      (stepsRight[stepsRight.length - 1]?.swapCount || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Race Summary Result Board */}
          <AnimatePresence>
            {showResults && raceSummary && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="bg-gradient-to-br from-[#269984]/15 via-[#269984]/10 to-emerald-500/10 border border-[#269984]/30 p-8 rounded-3xl text-center max-w-2xl mx-auto shadow-lg relative overflow-hidden backdrop-blur-sm"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <Sparkles className="w-24 h-24 text-[#269984]" />
                </div>
                <h4 className="font-montserrat font-black text-2xl uppercase tracking-tight text-[#269984] mb-3 flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-amber-500" />
                  {t('big_o.race_summary_title') || '🏁 Race Summary'}
                </h4>
                <p className="font-montserrat text-sm sm:text-base leading-relaxed max-w-xl mx-auto font-medium">
                  {raceSummary.tie
                    ? raceSummary.text
                    : t('big_o.winner_msg')
                        .replace('{winner}', raceSummary.winner || '')
                        .replace('{steps}', String(raceSummary.winnerOps))
                        .replace('{loser}', raceSummary.loser || '')
                        .replace('{loserSteps}', String(raceSummary.loserOps))
                        .replace('{ratio}', raceSummary.ratio || '')}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
}
