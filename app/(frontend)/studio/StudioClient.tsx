'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  GraduationCap,
  Sparkles,
  Plus,
  Search,
  BookOpen,
  Copy,
  Trash2,
  Edit3,
  ExternalLink,
  Globe,
  Lock,
  Unlock,
  Users,
  CheckCircle2,
  Clock,
  Layers,
  BarChart3,
  RefreshCw,
  X,
  Play,
  Save,
  Wand2,
  Lightbulb,
  ShieldAlert,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Settings,
  HelpCircle,
  Code2,
  CheckSquare,
  RotateCcw,
  Pause,
  Eye,
  Check,
  AlertCircle,
} from 'lucide-react';
import { ROUTES, ROLES } from '../../../lib/constants';

interface CourseItem {
  id: string | number;
  slug: string;
  title: string;
  summary: string;
  difficulty: string;
  estimatedMinutes: number;
  phasesCount: number;
  visibility: 'public' | 'private';
  isOfficial: boolean;
  instructorId: string | null;
  instructorName: string;
  enrolledCount: number;
  completedCount: number;
  updatedAt?: string;
}

interface QuizOptionDraft {
  option: string | { hu: string; en?: string; ro?: string };
}

interface QuizItemDraft {
  question: string | { hu: string; en?: string; ro?: string };
  options: QuizOptionDraft[];
  correctIndex: number;
  explanation?: string | { hu: string; en?: string; ro?: string };
}

interface PhaseDraft {
  phaseId: string;
  title: string | { hu: string; en?: string; ro?: string };
  sourceAlgorithmId?: string;
  sourceView: string;
  summary: string | { hu: string; en?: string; ro?: string };
  maxPoints?: number;
  customVideoId?: string;
  quiz?: QuizItemDraft[];
  matching?: Array<{ left: string | { hu: string }; right: string | { hu: string } }>;
  ordering?: Array<{ text: string | { hu: string } }>;
  debugCode?: string;
  expectedCode?: string;
  gapFillContent?: string | { hu: string; en?: string; ro?: string };
  gapFillOptions?: Array<{ option: string | { hu: string } }>;
  gapFillSolutions?: Array<{ solution: string | { hu: string } }>;
  gapFillDecoys?: Array<{ decoy: string | { hu: string } }>;
  infoContent?: string | { hu: string; en?: string; ro?: string };
  hintCopy?: string | { hu: string };
  mascotLine?: string | { hu: string };
  idleHelp?: string | { hu: string };
  isGenerated?: boolean;
  isGenerating?: boolean;
  customAiInstruction?: string;
  isEditing?: boolean;
}

function getLocalizedHu(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null) {
    const obj = val as Record<string, unknown>;
    return String(obj.hu || obj.en || obj.ro || '');
  }
  return String(val);
}

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function StudioClient({ userRole }: { userRole?: string }) {
  const router = useRouter();
  const isAdmin = userRole === ROLES.ADMIN;

  const [activeTab, setActiveTab] = useState<'my_courses' | 'community' | 'course_editor'>('my_courses');
  const [loading, setLoading] = useState(true);
  const [myCourses, setMyCourses] = useState<CourseItem[]>([]);
  const [communityCourses, setCommunityCourses] = useState<CourseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  // Course Editor State
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [isSlugLocked, setIsSlugLocked] = useState(true);
  const [expandedPhaseIdx, setExpandedPhaseIdx] = useState<number | null>(0);
  const [courseForm, setCourseForm] = useState({
    title: '',
    slug: '',
    summary: '',
    difficulty: 'Beginner',
    estimatedMinutes: 20,
    visibility: 'public' as 'public' | 'private',
    icon: '📘',
  });
  const [phasesList, setPhasesList] = useState<PhaseDraft[]>([]);
  const [savingCourse, setSavingCourse] = useState(false);

  // Single-phase AI assistant state (Generate step-by-step)
  const [phaseAiModalOpen, setPhaseAiModalOpen] = useState(false);
  const [phaseAiTargetIdx, setPhaseAiTargetIdx] = useState<number | null>(null);
  const [phaseAiIsNew, setPhaseAiIsNew] = useState(false);
  const [phaseAiTopic, setPhaseAiTopic] = useState('');
  const [phaseAiView, setPhaseAiView] = useState('quiz');
  const [phaseAiCustomPrompt, setPhaseAiCustomPrompt] = useState('');
  const [isPhaseAiGenerating, setIsPhaseAiGenerating] = useState(false);
  const [aiConfig, setAiConfig] = useState<{ model: string; isConfigured: boolean } | null>(null);

  // Fetch courses
  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/studio/courses', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('Nem sikerült betölteni a kurzusokat.');
      }
      const data = await res.json();
      setMyCourses(data.myCourses || []);
      setCommunityCourses(data.communityCourses || []);
    } catch (err) {
      toast.error('Hiba történt a kurzusok betöltésekor.', {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAiSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ai-settings');
      if (res.ok) {
        const data = await res.json();
        setAiConfig({ model: data.model, isConfigured: data.isConfigured });
      }
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    fetchCourses();
    loadAiSettings();
  }, [fetchCourses, loadAiSettings]);

  // Aggregate stats
  const totalEnrolled = useMemo(() => {
    return myCourses.reduce((acc, c) => acc + (c.enrolledCount || 0), 0);
  }, [myCourses]);

  const totalCompleted = useMemo(() => {
    return myCourses.reduce((acc, c) => acc + (c.completedCount || 0), 0);
  }, [myCourses]);

  // Filtered lists
  const filteredMyCourses = useMemo(() => {
    return myCourses.filter((c) => {
      const matchSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.summary.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDiff = difficultyFilter === 'all' || c.difficulty === difficultyFilter;
      return matchSearch && matchDiff;
    });
  }, [myCourses, searchQuery, difficultyFilter]);

  const filteredCommunityCourses = useMemo(() => {
    return communityCourses.filter((c) => {
      const matchSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.instructorName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDiff = difficultyFilter === 'all' || c.difficulty === difficultyFilter;
      return matchSearch && matchDiff;
    });
  }, [communityCourses, searchQuery, difficultyFilter]);

  // Actions
  const handleToggleVisibility = async (course: CourseItem) => {
    const newVisibility = course.visibility === 'public' ? 'private' : 'public';
    try {
      const res = await fetch(`/api/studio/courses/${course.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: newVisibility }),
      });
      if (!res.ok) throw new Error('A láthatóság módosítása sikertelen.');
      
      setMyCourses((prev) =>
        prev.map((c) => (c.id === course.id ? { ...c, visibility: newVisibility } : c))
      );
      toast.success(
        newVisibility === 'public'
          ? 'Kurzus publikálva! Más tanárok mostantól láthatják a közösségi tárban.'
          : 'Kurzus elrejtve. Mostantól csak a te saját kurzusaid között érhető el.'
      );
    } catch (err) {
      toast.error('Hiba történt a láthatóság módosításakor.');
    }
  };

  const handleCloneCourse = async (course: CourseItem) => {
    const toastId = toast.loading(`"${course.title}" klónozása folyamatban...`);
    try {
      const res = await fetch(`/api/studio/courses/${course.id}/clone`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Nem sikerült leklónozni a kurzust.');
      
      await fetchCourses();
      toast.success('Kurzus sikeresen átmásolva a saját kurzusaid közé!', { id: toastId });
      setActiveTab('my_courses');
    } catch (err) {
      toast.error('Klónozási hiba történt.', { id: toastId });
    }
  };

  const handleDeleteCourse = async (course: CourseItem) => {
    if (!window.confirm(`Biztosan törölni szeretnéd a(z) "${course.title}" kurzust? Ez a lépés nem visszavonható.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/studio/courses/${course.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Nem sikerült törölni a kurzust.');
      
      setMyCourses((prev) => prev.filter((c) => c.id !== course.id));
      toast.success('Kurzus sikeresen törölve.');
    } catch (err) {
      toast.error('Hiba történt a törlés során.');
    }
  };

  const openNewCourseModal = () => {
    setEditingCourse(null);
    setIsSlugLocked(true);
    setExpandedPhaseIdx(0);
    setCourseForm({
      title: '',
      slug: '',
      summary: '',
      difficulty: 'Beginner',
      estimatedMinutes: 20,
      visibility: 'public',
      icon: '📘',
    });
    setPhasesList([
      {
        phaseId: `phase-1-${Date.now().toString(36)}`,
        title: '1. Bevezetés és alapfogalmak',
        sourceView: 'quiz',
        sourceAlgorithmId: 'general',
        summary: 'Alapvető fogalmak és tudásellenőrzés',
        maxPoints: 10,
        quiz: [
          {
            question: 'Melyik állítás írja le leginkább a témakört?',
            options: [
              { option: 'Első válaszlehetőség' },
              { option: 'Második válaszlehetőség' },
              { option: 'Harmadik válaszlehetőség' },
            ],
            correctIndex: 0,
            explanation: 'Magyarázat a helyes válaszhoz...',
          },
        ],
      },
    ]);
    setActiveTab('course_editor');
  };

  const openEditCourseModal = async (course: CourseItem) => {
    setEditingCourse(course);
    setIsSlugLocked(false);
    setExpandedPhaseIdx(0);
    setCourseForm({
      title: course.title,
      slug: course.slug,
      summary: course.summary,
      difficulty: course.difficulty,
      estimatedMinutes: course.estimatedMinutes,
      visibility: course.visibility,
      icon: '📘',
    });

    try {
      const res = await fetch(`/api/studio/courses/${course.id}`);
      if (res.ok) {
        const data = await res.json();
        setPhasesList(data.course.phases || []);
      }
    } catch {
      setPhasesList([]);
    }
    setActiveTab('course_editor');
  };

  // Phase reordering and editing helpers
  const movePhaseUp = (index: number) => {
    if (index <= 0) return;
    setPhasesList((prev) => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
    if (expandedPhaseIdx === index) setExpandedPhaseIdx(index - 1);
    else if (expandedPhaseIdx === index - 1) setExpandedPhaseIdx(index);
  };

  const movePhaseDown = (index: number) => {
    if (index >= phasesList.length - 1) return;
    setPhasesList((prev) => {
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
    if (expandedPhaseIdx === index) setExpandedPhaseIdx(index + 1);
    else if (expandedPhaseIdx === index + 1) setExpandedPhaseIdx(index);
  };

  const updatePhase = (index: number, updates: Partial<PhaseDraft>) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, ...updates } : p))
    );
  };

  const addQuizQuestion = (phaseIdx: number) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        const currentQuiz = p.quiz || [];
        return {
          ...p,
          quiz: [
            ...currentQuiz,
            {
              question: 'Új kérdés szövege...',
              options: [
                { option: 'A válaszlehetőség' },
                { option: 'B válaszlehetőség' },
                { option: 'C válaszlehetőség' },
              ],
              correctIndex: 0,
              explanation: '',
            },
          ],
        };
      })
    );
  };

  const removeQuizQuestion = (phaseIdx: number, qIdx: number) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        return {
          ...p,
          quiz: (p.quiz || []).filter((_, i) => i !== qIdx),
        };
      })
    );
  };

  const updateQuizQuestionText = (phaseIdx: number, qIdx: number, text: string) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        return {
          ...p,
          quiz: (p.quiz || []).map((q, i) => (i === qIdx ? { ...q, question: text } : q)),
        };
      })
    );
  };

  const updateQuizQuestionCorrect = (phaseIdx: number, qIdx: number, correctIdx: number) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        return {
          ...p,
          quiz: (p.quiz || []).map((q, i) => (i === qIdx ? { ...q, correctIndex: correctIdx } : q)),
        };
      })
    );
  };

  const updateQuizOptionText = (phaseIdx: number, qIdx: number, optIdx: number, text: string) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        return {
          ...p,
          quiz: (p.quiz || []).map((q, i) => {
            if (i !== qIdx) return q;
            const updatedOpts = [...q.options];
            updatedOpts[optIdx] = { option: text };
            return { ...q, options: updatedOpts };
          }),
        };
      })
    );
  };

  const addQuizOption = (phaseIdx: number, qIdx: number) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        return {
          ...p,
          quiz: (p.quiz || []).map((q, i) => {
            if (i !== qIdx) return q;
            return {
              ...q,
              options: [...q.options, { option: `Új válaszlehetőség ${q.options.length + 1}` }],
            };
          }),
        };
      })
    );
  };

  const removeQuizOption = (phaseIdx: number, qIdx: number, optIdx: number) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        return {
          ...p,
          quiz: (p.quiz || []).map((q, i) => {
            if (i !== qIdx) return q;
            if (q.options.length <= 2) {
              toast.error('Legalább 2 válaszlehetőségnek maradnia kell!');
              return q;
            }
            const updatedOpts = q.options.filter((_, oIdx) => oIdx !== optIdx);
            const newCorrect = q.correctIndex >= updatedOpts.length ? 0 : q.correctIndex;
            return { ...q, options: updatedOpts, correctIndex: newCorrect };
          }),
        };
      })
    );
  };

  const handleSaveCourseForm = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!courseForm.title.trim() || !courseForm.slug.trim()) {
      toast.error('A cím és az azonosító (slug) megadása kötelező!');
      return;
    }

    setSavingCourse(true);
    try {
      if (editingCourse) {
        // Update
        const res = await fetch(`/api/studio/courses/${editingCourse.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: courseForm.title,
            summary: courseForm.summary,
            difficulty: courseForm.difficulty,
            estimatedMinutes: courseForm.estimatedMinutes,
            visibility: courseForm.visibility,
            phases: phasesList,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Nem sikerült frissíteni a kurzust.');
        }
        toast.success('Kurzus sikeresen elmentve!');
      } else {
        // Create
        const res = await fetch('/api/studio/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...courseForm,
            phases: phasesList,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Nem sikerült létrehozni a kurzust.');
        }
        toast.success('Új kurzus sikeresen létrehozva!');
      }

      setActiveTab('my_courses');
      await fetchCourses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hiba a mentés során.');
    } finally {
      setSavingCourse(false);
    }
  };

  const getViewBadge = (view: string) => {
    switch (view) {
      case 'quiz':
        return { label: 'Kvíz', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: '❓' };
      case 'gap-fill':
        return { label: 'Hiánypótlás', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: '🧩' };
      case 'debug':
        return { label: 'Kódhibakeresés', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', icon: '🐞' };
      case 'match':
        return { label: 'Párosítás', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', icon: '🔗' };
      case 'order':
        return { label: 'Sorrendezés', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20', icon: '🔢' };
      case 'info':
        return { label: 'Elmélet', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20', icon: '📖' };
      case 'video':
      case 'video-custom':
        return { label: 'Videó', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', icon: '🎬' };
      case 'control':
        return { label: 'Szimuláció', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20', icon: '🕹️' };
      case 'animation':
        return { label: 'Animáció', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', icon: '✨' };
      case 'alive':
        return { label: 'Élő Kód', color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20', icon: '⚡' };
      default:
        return { label: view, color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20', icon: '📘' };
    }
  };

  // Granular phase helpers for phasesList
  const addPhase = () => {
    const newIdx = phasesList.length + 1;
    const newPhase: PhaseDraft = {
      phaseId: `phase-${newIdx}-${Date.now().toString(36)}`,
      title: `${newIdx}. Új Fázis`,
      sourceView: 'quiz',
      sourceAlgorithmId: 'general',
      summary: 'Gyakorlati feladat és megértés ellenőrzése',
      maxPoints: 10,
      quiz: [
        {
          question: 'Új kérdés szövege...',
          options: [{ option: 'Válasz A' }, { option: 'Válasz B' }],
          correctIndex: 0,
          explanation: '',
        },
      ],
    };
    setPhasesList((prev) => [...prev, newPhase]);
    setExpandedPhaseIdx(phasesList.length);
  };

  const deletePhase = (index: number) => {
    if (!window.confirm('Biztosan törölni szeretnéd ezt a fázist?')) return;
    setPhasesList((prev) => prev.filter((_, i) => i !== index));
    if (expandedPhaseIdx === index) setExpandedPhaseIdx(null);
  };

  const updateQuizExplanation = (phaseIdx: number, qIdx: number, text: string) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        const quiz = (p.quiz || []).map((q, i) => (i === qIdx ? { ...q, explanation: text } : q));
        return { ...p, quiz };
      })
    );
  };

  const updateMatchPair = (phaseIdx: number, mIdx: number, side: 'left' | 'right', text: string) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        const matching = (p.matching || []).map((m, i) => (i === mIdx ? { ...m, [side]: text } : m));
        return { ...p, matching };
      })
    );
  };

  const addMatchPair = (phaseIdx: number) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        const matching = [...(p.matching || []), { left: 'Új fogalom', right: 'Meghatározás' }];
        return { ...p, matching };
      })
    );
  };

  const removeMatchPair = (phaseIdx: number, mIdx: number) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        const matching = (p.matching || []).filter((_, i) => i !== mIdx);
        return { ...p, matching };
      })
    );
  };

  const updateOrderItem = (phaseIdx: number, oIdx: number, text: string) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        const ordering = (p.ordering || []).map((o, i) => (i === oIdx ? { text } : o));
        return { ...p, ordering };
      })
    );
  };

  const addOrderItem = (phaseIdx: number) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        const ordering = [...(p.ordering || []), { text: 'Új lépés...' }];
        return { ...p, ordering };
      })
    );
  };

  const removeOrderItem = (phaseIdx: number, oIdx: number) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        const ordering = (p.ordering || []).filter((_, i) => i !== oIdx);
        return { ...p, ordering };
      })
    );
  };

  const updateGapSolution = (phaseIdx: number, solIdx: number, text: string) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        const gapFillSolutions = (p.gapFillSolutions || []).map((s, i) =>
          i === solIdx ? { solution: text } : s
        );
        return { ...p, gapFillSolutions };
      })
    );
  };

  const addGapSolution = (phaseIdx: number) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        const gapFillSolutions = [...(p.gapFillSolutions || []), { solution: 'új_megoldás' }];
        return { ...p, gapFillSolutions };
      })
    );
  };

  const removeGapSolution = (phaseIdx: number, solIdx: number) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        const gapFillSolutions = (p.gapFillSolutions || []).filter((_, i) => i !== solIdx);
        return { ...p, gapFillSolutions };
      })
    );
  };

  const updateGapDecoy = (phaseIdx: number, decIdx: number, text: string) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        const gapFillDecoys = (p.gapFillDecoys || []).map((d, i) =>
          i === decIdx ? { decoy: text } : d
        );
        return { ...p, gapFillDecoys };
      })
    );
  };

  const addGapDecoy = (phaseIdx: number) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        const gapFillDecoys = [...(p.gapFillDecoys || []), { decoy: 'félrevezető_opció' }];
        return { ...p, gapFillDecoys };
      })
    );
  };

  const removeGapDecoy = (phaseIdx: number, decIdx: number) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        const gapFillDecoys = (p.gapFillDecoys || []).filter((_, i) => i !== decIdx);
        return { ...p, gapFillDecoys };
      })
    );
  };

  // Single-Phase AI Handlers (Only generate one by one)
  const openNewPhaseAiModal = () => {
    setPhaseAiIsNew(true);
    setPhaseAiTargetIdx(phasesList.length);
    setPhaseAiTopic('');
    setPhaseAiView('quiz');
    setPhaseAiCustomPrompt('');
    setPhaseAiModalOpen(true);
  };

  const openPhaseAiModal = (idx: number) => {
    const p = phasesList[idx];
    setPhaseAiIsNew(false);
    setPhaseAiTargetIdx(idx);
    setPhaseAiTopic(getLocalizedHu(p?.title) || '');
    setPhaseAiView(p?.sourceView || 'quiz');
    setPhaseAiCustomPrompt('');
    setPhaseAiModalOpen(true);
  };

  const handleGenerateSinglePhase = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveTopic = phaseAiTopic.trim() || courseForm.title.trim() || 'Új témakör';
    const targetIdx = phaseAiTargetIdx !== null ? phaseAiTargetIdx : phasesList.length;

    setIsPhaseAiGenerating(true);
    try {
      const existingPhase = !phaseAiIsNew && phaseAiTargetIdx !== null ? phasesList[phaseAiTargetIdx] : null;

      const phaseDraftPayload = {
        phaseId: existingPhase?.phaseId || `phase-${targetIdx + 1}-${Date.now().toString(36)}`,
        title: phaseAiTopic.trim() || (phaseAiIsNew ? `${targetIdx + 1}. Új Lépés` : existingPhase?.title || 'Új Lépés'),
        sourceView: phaseAiView,
        sourceAlgorithmId: existingPhase?.sourceAlgorithmId || 'general',
        summary: phaseAiTopic.trim() || existingPhase?.summary || 'Gyakorlati feladat',
      };

      const res = await fetch('/api/ai/generate-course/phase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseContext: {
            topic: courseForm.title.trim() || effectiveTopic,
            title: courseForm.title.trim() || effectiveTopic,
            difficulty: courseForm.difficulty,
            algorithmId: 'general',
          },
          phase: phaseDraftPayload,
          previousPhasesSummary: phasesList
            .filter((_, i) => i !== targetIdx)
            .map((p) => getLocalizedHu(p.title)),
          customInstruction: phaseAiCustomPrompt.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'A lépés generálása sikertelen volt.');
      }

      const data = await res.json();
      const gen = data.phase;

      const populatedPhase: PhaseDraft = {
        phaseId: phaseDraftPayload.phaseId,
        title: getLocalizedHu(gen.title || phaseDraftPayload.title),
        sourceView: phaseAiView,
        sourceAlgorithmId: 'general',
        summary: getLocalizedHu(gen.summary || phaseDraftPayload.summary),
        maxPoints: gen.maxPoints ?? existingPhase?.maxPoints ?? 10,
        quiz: gen.quiz || [],
        matching: gen.matching || [],
        ordering: gen.ordering || [],
        debugCode: gen.debugCode || '',
        expectedCode: gen.expectedCode || '',
        gapFillContent: gen.gapFillContent ? getLocalizedHu(gen.gapFillContent) : '',
        gapFillSolutions: gen.gapFillSolutions || [],
        gapFillDecoys: gen.gapFillDecoys || [],
        infoContent: gen.infoContent ? getLocalizedHu(gen.infoContent) : '',
        hintCopy: gen.hintCopy ? getLocalizedHu(gen.hintCopy) : '',
        mascotLine: gen.mascotLine ? getLocalizedHu(gen.mascotLine) : '',
        idleHelp: gen.idleHelp ? getLocalizedHu(gen.idleHelp) : '',
      };

      if (phaseAiIsNew) {
        setPhasesList((prev) => [...prev, populatedPhase]);
        setExpandedPhaseIdx(phasesList.length);
        toast.success(`✨ ${targetIdx + 1}. Lépés sikeresen hozzáadva és legenerálva!`);
      } else {
        setPhasesList((prev) =>
          prev.map((p, i) => (i === targetIdx ? { ...p, ...populatedPhase } : p))
        );
        setExpandedPhaseIdx(targetIdx);
        toast.success(`✨ ${targetIdx + 1}. Lépés sikeresen frissítve az AI által!`);
      }

      setPhaseAiModalOpen(false);
    } catch (err) {
      toast.error('Lépés generálási hiba:', {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsPhaseAiGenerating(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-[#070b0e] text-slate-900 dark:text-slate-100 font-montserrat pb-20">
      {/* ━━━ HERO SECTION (ONLY SHOWN IN COURSE LISTS) ━━━ */}
      {activeTab !== 'course_editor' && (
        <section className="relative overflow-hidden bg-gradient-to-b from-[#269984]/15 via-teal-500/5 to-transparent border-b border-teal-500/10 pt-10 pb-12 px-6 lg:px-12">
          <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
                <GraduationCap className="w-4 h-4" />
                {isAdmin ? 'Rendszergazdai & Oktatói Stúdió' : 'Tanári Munkatér & Stúdió'}
              </div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Kurzusok & Tananyag Műhely
              </h1>
              <p className="text-sm lg:text-base text-slate-600 dark:text-slate-400 mt-2 max-w-2xl leading-relaxed">
                Tervezz saját interaktív tanmenetet, készíts teszteket és feladatsorokat AI támogatással,
                vagy válogass a tanári közösség publikus mintakurzusai közül.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={openNewCourseModal}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#269984] hover:bg-[#1e7e6c] text-white font-bold text-sm shadow-lg shadow-teal-700/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Új Kurzus Létrehozása
              </button>

              <Link
                href={ROUTES.ADMIN_STATISTICS}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 font-bold text-sm transition-all"
              >
                <BarChart3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                Statisztikák
              </Link>
            </div>
          </div>

          {/* Overview Metric Cards */}
          <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-[#269984]">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Saját Kurzusaim</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{myCourses.length}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Beiratkozott Diákok</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalEnrolled}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sikeres Befejezések</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{totalCompleted}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Közösségi Tárban</p>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{communityCourses.length}</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ━━━ MAIN WORKSPACE ━━━ */}
      <main className="max-w-[1400px] mx-auto px-6 lg:px-12 mt-8">
        {/* Navigation Tabs (Only shown in course lists) */}
        {activeTab !== 'course_editor' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('my_courses')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'my_courses'
                    ? 'bg-[#269984] text-white shadow-md shadow-teal-700/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Saját Kurzusaim ({myCourses.length})
              </button>

              <button
                onClick={() => setActiveTab('community')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  activeTab === 'community'
                    ? 'bg-[#269984] text-white shadow-md shadow-teal-700/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <Globe className="w-4 h-4" />
                Közösségi Tananyag Tár ({communityCourses.length})
              </button>
            </div>

            {/* Search & Filters */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Keresés cím vagy téma szerint..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:outline-none focus:border-[#269984] w-64"
                />
              </div>

              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="py-2 px-3 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 focus:outline-none focus:border-[#269984]"
              >
                <option value="all">Minden szint</option>
                <option value="Beginner">Kezdő</option>
                <option value="Intermediate">Középhaladó</option>
                <option value="Advanced">Haladó</option>
              </select>
            </div>
          </div>
        )}

        {/* ── TAB 1: SAJÁT KURZUSAIM ── */}
        {activeTab === 'my_courses' && (
          <div className="mt-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-[#269984] mb-3" />
                <p className="text-sm">Saját kurzusaid betöltése...</p>
              </div>
            ) : filteredMyCourses.length === 0 ? (
              <div className="text-center py-20 px-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-white/10">
                <GraduationCap className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Még nincs saját kurzusod</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1 mb-6">
                  Hozz létre egy új kurzust manuálisan, generáltass egyet másodpercek alatt az AI-val, vagy válassz egyet a közösségi tár sablonjai közül!
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={openNewCourseModal}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#269984] hover:bg-[#1e7e6c] text-white text-sm font-bold shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    Új Kurzus Létrehozása
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMyCourses.map((course) => (
                  <div
                    key={course.id}
                    className="group flex flex-col justify-between rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-white/10 p-6 shadow-sm hover:shadow-xl hover:border-teal-500/40 transition-all duration-200"
                  >
                    <div>
                      {/* Top badges */}
                      <div className="flex items-center justify-between mb-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            course.difficulty === 'Beginner'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : course.difficulty === 'Intermediate'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                              : 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                          }`}
                        >
                          {course.difficulty === 'Beginner' ? 'Kezdő' : course.difficulty === 'Intermediate' ? 'Középhaladó' : 'Haladó'}
                        </span>

                        {/* Visibility Switch Badge */}
                        <button
                          onClick={() => handleToggleVisibility(course)}
                          title="Kattints a láthatóság módosításához"
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                            course.visibility === 'public'
                              ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 hover:bg-teal-100'
                              : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {course.visibility === 'public' ? (
                            <>
                              <Globe className="w-3.5 h-3.5 text-teal-600" />
                              Publikus
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              Privát
                            </>
                          )}
                        </button>
                      </div>

                      {/* Title & summary */}
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-[#269984] transition-colors leading-snug">
                        {course.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {course.summary || 'Nincs megadott összefoglaló.'}
                      </p>

                      {/* Course details */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-5 pt-4 border-t border-slate-100 dark:border-white/5">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Layers className="w-4 h-4 text-teal-600" />
                          {course.phasesCount} Fázis
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-4 h-4 text-teal-600" />
                          {course.estimatedMinutes} perc
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <Users className="w-4 h-4 text-blue-500" />
                          {course.enrolledCount} diák
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-between gap-2 mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditCourseModal(course)}
                          className="p-2 rounded-xl text-slate-600 hover:text-teal-600 hover:bg-teal-50 dark:text-slate-400 dark:hover:text-teal-300 dark:hover:bg-white/5 transition-colors"
                          title="Kurzus szerkesztése"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <Link
                          href={`/courses/${course.slug}`}
                          target="_blank"
                          className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-300 dark:hover:bg-white/5 transition-colors"
                          title="Élő kurzus előnézete új lapon"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteCourse(course)}
                          className="p-2 rounded-xl text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-400 dark:hover:text-red-300 dark:hover:bg-white/5 transition-colors"
                          title="Kurzus törlése"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => openEditCourseModal(course)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-[#269984] hover:text-white text-slate-800 dark:text-slate-200 text-xs font-bold transition-all"
                      >
                        Szerkesztés
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: KÖZÖSSÉGI TANANYAG TÁR ── */}
        {activeTab === 'community' && (
          <div className="mt-8">
            <div className="mb-6 p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-[#269984]" />
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  Ezeket a kurzusokat más pedagógusok és az AlgoRythmics fejlesztői tették közzé. 
                  Egyetlen kattintással <strong>másolatot készíthetsz belőlük</strong> a saját kurzusaid közé, amit szabadon módosíthatsz.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-[#269984] mb-3" />
                <p className="text-sm">Közösségi kurzusok betöltése...</p>
              </div>
            ) : filteredCommunityCourses.length === 0 ? (
              <div className="text-center py-20 px-6 rounded-3xl bg-white dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-white/10">
                <Globe className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Nem található publikus tananyag</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
                  Amikor a tanárok publikussá teszik saját kurzusaikat, azok azonnal itt jelennek meg!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCommunityCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex flex-col justify-between rounded-3xl bg-white dark:bg-slate-900/70 border border-slate-200/90 dark:border-white/10 p-6 shadow-sm hover:shadow-xl hover:border-purple-500/40 transition-all duration-200"
                  >
                    <div>
                      {/* Author badge */}
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300">
                          {course.isOfficial ? '🌟 Hivatalos Sablon' : `👨‍🏫 ${course.instructorName}`}
                        </span>

                        <span className="text-xs font-semibold text-slate-400">
                          {course.estimatedMinutes} perc
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
                        {course.title}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                        {course.summary || 'Kész interaktív tanfolyam.'}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-5 pt-4 border-t border-slate-100 dark:border-white/5">
                        <span className="flex items-center gap-1 font-medium">
                          <Layers className="w-4 h-4 text-purple-600" />
                          {course.phasesCount} Fázis
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Users className="w-4 h-4 text-blue-500" />
                          {course.enrolledCount} tanuló végezte eddig
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
                      <Link
                        href={`/courses/${course.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Előnézet
                      </Link>

                      <button
                        onClick={() => handleCloneCourse(course)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-700/20 transition-all hover:scale-[1.02] active:scale-95"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Másolat a sajátjaim közé
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

                {/* ── COURSE CREATION / EDITOR PAGE ── */}
        {activeTab === 'course_editor' && (
          <div className="space-y-8">
            {/* Top Header & Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-white/10 shadow-sm">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('my_courses')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 font-bold text-xs transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Vissza a kurzusaimhoz
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                      {courseForm.title ? courseForm.title : 'Új Kurzus Létrehozása'}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                      {editingCourse ? 'Szerkesztés' : 'Új kurzus'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Állítsd össze a tananyagot manuálisan vagy kérj lépésenkénti AI segítséget bármelyik témához!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveCourseForm}
                  disabled={savingCourse}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#269984] hover:bg-[#1e7e6c] disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-teal-700/20 transition-all hover:scale-[1.02] active:scale-95"
                >
                  {savingCourse ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Mentés folyamatban...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Kurzus Mentése
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Card 1: Kurzus Alapadatok */}
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-white/10 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-white/5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-[#269984]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Kurzus Alapadatok</h3>
                  <p className="text-xs text-slate-500">Cím, slug, összefoglaló és megjelenési beállítások (bármilyen tantárgy vagy témakör esetén)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Kurzus Címe *
                  </label>
                  <input
                    type="text"
                    required
                    value={courseForm.title}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setCourseForm((prev) => ({
                        ...prev,
                        title: newTitle,
                        slug: isSlugLocked ? generateSlug(newTitle) : prev.slug,
                      }));
                    }}
                    placeholder="pl. Bevezetés a Python programozásba, Webfejlesztés alapjai, Hálózatok..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Azonosító az URL-ben (Slug) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsSlugLocked(!isSlugLocked)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
                    >
                      {isSlugLocked ? (
                        <>
                          <Lock className="w-3 h-3 text-[#269984]" />
                          <span className="text-[#269984]">Auto-generált (Zárolva)</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3 text-amber-500" />
                          <span className="text-amber-500">Egyéni (Feloldva)</span>
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={courseForm.slug}
                    onChange={(e) => {
                      setIsSlugLocked(false);
                      setCourseForm({ ...courseForm, slug: e.target.value });
                    }}
                    placeholder="pl. python-alapok"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Rövid Leírás / Összefoglaló
                </label>
                <textarea
                  rows={2}
                  value={courseForm.summary}
                  onChange={(e) => setCourseForm({ ...courseForm, summary: e.target.value })}
                  placeholder="Rövid, figyelemfelkeltő leírás a kurzus tartalmáról és céljairól..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Nehézségi szint
                  </label>
                  <select
                    value={courseForm.difficulty}
                    onChange={(e) => setCourseForm({ ...courseForm, difficulty: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                  >
                    <option value="Beginner">Kezdő</option>
                    <option value="Intermediate">Középhaladó</option>
                    <option value="Advanced">Haladó</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Becsült idő (perc)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={300}
                    value={courseForm.estimatedMinutes}
                    onChange={(e) => setCourseForm({ ...courseForm, estimatedMinutes: Number(e.target.value) || 20 })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Láthatóság
                  </label>
                  <select
                    value={courseForm.visibility}
                    onChange={(e) => setCourseForm({ ...courseForm, visibility: e.target.value as 'public' | 'private' })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                  >
                    <option value="public">Publikus (Közösségi Tárban)</option>
                    <option value="private">Privát (Csak nekem)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Kurzus Ikon (Emoji)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={courseForm.icon}
                      onChange={(e) => setCourseForm({ ...courseForm, icon: e.target.value })}
                      className="w-16 text-center text-xl px-2 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                    />
                    <div className="flex gap-1">
                      {['📘', '💡', '⚡', '🚀', '🎯', '🧪', '🧠', '💻'].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setCourseForm({ ...courseForm, icon: emoji })}
                          className="p-1 text-sm hover:scale-125 transition-transform"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Tanulási Lépések (Fázisok) */}
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-white/10 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Tanulási Lépések (Fázisok) ({phasesList.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Minden lépéshez egyedi feladattípust (kvíz, hiánypótlás, hibakeresés, párosítás, elméleti szöveg) választhatsz.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={addPhase}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Új Fázis
                  </button>

                  <button
                    type="button"
                    onClick={openNewPhaseAiModal}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-600/25 transition-all hover:scale-[1.02] active:scale-95"
                    title="Új tanulási lépés kidolgozása AI segítségével"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    + Új Lépés AI-val
                  </button>
                </div>
              </div>

              {phasesList.length === 0 ? (
                <div className="text-center py-12 px-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10">
                  <Layers className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-800 dark:text-white">Még nincsenek hozzáadva lépések</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                    Kezdd el manuálisan vagy kérj AI segítséget egy-egy lépés feladatainak összeállításához!
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={addPhase}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white font-bold text-xs shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Első Fázis Hozzáadása
                    </button>
                    <button
                      type="button"
                      onClick={openNewPhaseAiModal}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm"
                    >
                      <Sparkles className="w-4 h-4" />
                      + Első Lépés AI-val
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {phasesList.map((phase, idx) => {
                    const badge = getViewBadge(phase.sourceView);
                    const isExpanded = expandedPhaseIdx === idx;

                    return (
                      <div
                        key={phase.phaseId || idx}
                        className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden transition-all"
                      >
                        {/* Phase Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-white/5">
                          <div className="flex items-center gap-2 flex-1">
                            {/* Reorder Arrows */}
                            <div className="flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => movePhaseUp(idx)}
                                disabled={idx === 0}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20"
                                title="Mozgatás felfelé"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => movePhaseDown(idx)}
                                disabled={idx === phasesList.length - 1}
                                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20"
                                title="Mozgatás lefelé"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                              {idx + 1}.
                            </span>

                            <input
                              type="text"
                              value={getLocalizedHu(phase.title)}
                              onChange={(e) => updatePhase(idx, { title: e.target.value })}
                              placeholder="Fázis címe..."
                              className="flex-1 font-bold text-sm bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-white/20 focus:border-[#269984] focus:outline-none px-1 py-0.5 text-slate-900 dark:text-white"
                            />
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {/* View selector (NO algorithm dropdown!) */}
                            <select
                              value={phase.sourceView}
                              onChange={(e) => updatePhase(idx, { sourceView: e.target.value })}
                              className="text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none"
                            >
                              <option value="quiz">❓ Kvíz teszt</option>
                              <option value="gap-fill">🧩 Szöveg / Kód hiánypótlás</option>
                              <option value="debug">🐞 Kód hibakeresés</option>
                              <option value="match">🔗 Fogalom párosítás</option>
                              <option value="order">🔢 Lépés sorrendezés</option>
                              <option value="info">📖 Tananyag / Magyarázat</option>
                              <option value="video">🎬 Videó</option>
                              <option value="control">🕹️ Szimuláció</option>
                            </select>

                            {/* ✨ AI Assistant for this single phase */}
                            <button
                              type="button"
                              onClick={() => openPhaseAiModal(idx)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 hover:bg-purple-100 text-xs font-bold border border-purple-200 dark:border-purple-800/50 transition-colors"
                              title="Kérj AI segítséget a feladatok megírásához ennél a lépésnél"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>AI Segéd</span>
                            </button>

                            {/* Delete phase */}
                            <button
                              type="button"
                              onClick={() => deletePhase(idx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-white/5 transition-colors"
                              title="Fázis törlése"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                            {/* Accordion toggle */}
                            <button
                              type="button"
                              onClick={() => setExpandedPhaseIdx(isExpanded ? null : idx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Phase Body (Expanded) */}
                        {isExpanded && (
                          <div className="p-5 space-y-4">
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                                Lépés Leírása / Célja
                              </label>
                              <input
                                type="text"
                                value={getLocalizedHu(phase.summary)}
                                onChange={(e) => updatePhase(idx, { summary: e.target.value })}
                                placeholder="pl. A téma bemutatása, gyakorlati összefüggések..."
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                              />
                            </div>

                            {/* Task editor depending on sourceView */}
                            {/* QUIZ */}
                            {phase.sourceView === 'quiz' && (
                              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-4">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                    Kvízkérdések ({(phase.quiz || []).length} kérdés)
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => addQuizQuestion(idx)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 text-xs font-bold transition-colors"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    Kérdés Hozzáadása
                                  </button>
                                </div>

                                {(phase.quiz || []).map((q, qIdx) => (
                                  <div key={qIdx} className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-800/30 space-y-3">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-extrabold text-amber-600">{qIdx + 1}.</span>
                                      <input
                                        type="text"
                                        value={getLocalizedHu(q.question)}
                                        onChange={(e) => updateQuizQuestionText(idx, qIdx, e.target.value)}
                                        placeholder="Kérdés szövege..."
                                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeQuizQuestion(idx, qIdx)}
                                        className="p-1 rounded text-slate-400 hover:text-red-600"
                                        title="Kérdés törlése"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>

                                    {/* Options */}
                                    <div className="space-y-1.5 pl-6">
                                      {q.options.map((opt, optIdx) => (
                                        <div key={optIdx} className="flex items-center gap-2">
                                          <input
                                            type="radio"
                                            name={`quiz-correct-${idx}-${qIdx}`}
                                            checked={q.correctIndex === optIdx}
                                            onChange={() => updateQuizQuestionCorrect(idx, qIdx, optIdx)}
                                            title="Jelöld meg a helyes választ"
                                            className="accent-[#269984] w-4 h-4 cursor-pointer"
                                          />
                                          <input
                                            type="text"
                                            value={getLocalizedHu(opt.option)}
                                            onChange={(e) => updateQuizOptionText(idx, qIdx, optIdx, e.target.value)}
                                            placeholder={`Válasz ${optIdx + 1}...`}
                                            className={`flex-1 px-2.5 py-1 text-xs rounded-lg border ${
                                              q.correctIndex === optIdx
                                                ? 'border-teal-500 bg-teal-50/30 dark:bg-teal-950/20 text-teal-900 dark:text-teal-200 font-medium'
                                                : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200'
                                            } focus:outline-none`}
                                          />
                                          <button
                                            type="button"
                                            onClick={() => removeQuizOption(idx, qIdx, optIdx)}
                                            className="p-1 text-slate-400 hover:text-red-500"
                                            title="Opció törlése"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ))}
                                      <button
                                        type="button"
                                        onClick={() => addQuizOption(idx, qIdx)}
                                        className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 mt-1"
                                      >
                                        <Plus className="w-3 h-3" />
                                        További válaszlehetőség
                                      </button>
                                    </div>

                                    {/* Explanation */}
                                    <div className="pl-6 pt-1">
                                      <input
                                        type="text"
                                        value={getLocalizedHu(q.explanation)}
                                        onChange={(e) => updateQuizExplanation(idx, qIdx, e.target.value)}
                                        placeholder="Magyarázat helyes/helytelen válasz esetén (opcionális)..."
                                        className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-300 focus:outline-none"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* GAP FILL */}
                            {phase.sourceView === 'gap-fill' && (
                              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-4">
                                <div>
                                  <label className="block text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-1">
                                    Szöveg vagy Kód a Hiányzó Helyekkel (használj &#123;&#123;gap&#125;&#125; jelölést)
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={getLocalizedHu(phase.gapFillContent)}
                                    onChange={(e) => updatePhase(idx, { gapFillContent: e.target.value })}
                                    placeholder="pl. A definíció szerint a {{gap}} egy olyan szerkezet, amely..."
                                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-blue-200 dark:border-blue-800/40 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                                  />
                                </div>

                                {/* Solutions */}
                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                                      Helyes Megoldások (sorrendben)
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => addGapSolution(idx)}
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                    >
                                      <Plus className="w-3 h-3" /> Új Megoldás
                                    </button>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {(phase.gapFillSolutions || []).map((sol, solIdx) => (
                                      <div key={solIdx} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800">
                                        <span className="text-[10px] font-bold text-teal-700">{solIdx + 1}.</span>
                                        <input
                                          type="text"
                                          value={getLocalizedHu(sol.solution)}
                                          onChange={(e) => updateGapSolution(idx, solIdx, e.target.value)}
                                          className="w-24 text-xs bg-transparent border-none focus:outline-none text-teal-900 dark:text-teal-200 font-mono"
                                        />
                                        <button type="button" onClick={() => removeGapSolution(idx, solIdx)} className="text-teal-600 hover:text-red-500">
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Decoys */}
                                <div>
                                  <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                      Félrevezető Válaszlehetőségek (Decoys)
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => addGapDecoy(idx)}
                                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                                    >
                                      <Plus className="w-3 h-3" /> Új Félrevezető Szó
                                    </button>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {(phase.gapFillDecoys || []).map((dec, decIdx) => (
                                      <div key={decIdx} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                        <input
                                          type="text"
                                          value={getLocalizedHu(dec.decoy)}
                                          onChange={(e) => updateGapDecoy(idx, decIdx, e.target.value)}
                                          className="w-24 text-xs bg-transparent border-none focus:outline-none text-slate-700 dark:text-slate-300 font-mono"
                                        />
                                        <button type="button" onClick={() => removeGapDecoy(idx, decIdx)} className="text-slate-400 hover:text-red-500">
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* DEBUG */}
                            {phase.sourceView === 'debug' && (
                              <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-3">
                                <div>
                                  <label className="block text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-1">
                                    Hibás Kód (amit a diáknak javítania kell)
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={phase.debugCode || ''}
                                    onChange={(e) => updatePhase(idx, { debugCode: e.target.value })}
                                    placeholder="Írd ide a hibás kódrészletet..."
                                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-rose-200 dark:border-rose-800/40 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-1">
                                    Várt, Helyes Megoldáskód
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={phase.expectedCode || ''}
                                    onChange={(e) => updatePhase(idx, { expectedCode: e.target.value })}
                                    placeholder="Írd ide a javított, várt kódot..."
                                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-rose-200 dark:border-rose-800/40 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                                  />
                                </div>
                              </div>
                            )}

                            {/* MATCHING */}
                            {phase.sourceView === 'match' && (
                              <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 space-y-3">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                                    Párosítandó Fogalmak & Meghatározások
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => addMatchPair(idx)}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                                  >
                                    <Plus className="w-3 h-3" /> Új Pár
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {(phase.matching || []).map((m, mIdx) => (
                                    <div key={mIdx} className="flex items-center gap-2">
                                      <input
                                        type="text"
                                        value={getLocalizedHu(m.left)}
                                        onChange={(e) => updateMatchPair(idx, mIdx, 'left', e.target.value)}
                                        placeholder="Bal oldal (fogalom / kifejezés)..."
                                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                                      />
                                      <span className="text-slate-400">⇄</span>
                                      <input
                                        type="text"
                                        value={getLocalizedHu(m.right)}
                                        onChange={(e) => updateMatchPair(idx, mIdx, 'right', e.target.value)}
                                        placeholder="Jobb oldal (meghatározás / leírás)..."
                                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                                      />
                                      <button type="button" onClick={() => removeMatchPair(idx, mIdx)} className="p-1 text-slate-400 hover:text-red-500">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* ORDERING */}
                            {phase.sourceView === 'order' && (
                              <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-3">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                                    Helyes Lépések Sorrendje
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => addOrderItem(idx)}
                                    className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                                  >
                                    <Plus className="w-3 h-3" /> Új Lépés
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {(phase.ordering || []).map((o, oIdx) => (
                                    <div key={oIdx} className="flex items-center gap-2">
                                      <span className="w-5 text-center text-xs font-bold text-indigo-600">{oIdx + 1}.</span>
                                      <input
                                        type="text"
                                        value={getLocalizedHu(o.text)}
                                        onChange={(e) => updateOrderItem(idx, oIdx, e.target.value)}
                                        placeholder="Lépés leírása..."
                                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                                      />
                                      <button type="button" onClick={() => removeOrderItem(idx, oIdx)} className="p-1 text-slate-400 hover:text-red-500">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* INFO / READING */}
                            {phase.sourceView === 'info' && (
                              <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                                  Tananyag / Elméleti Szöveg (Markdown formátumban)
                                </label>
                                <textarea
                                  rows={5}
                                  value={typeof phase.infoContent === 'object' ? (phase.infoContent as any).hu : (phase.infoContent || '')}
                                  onChange={(e) => updatePhase(idx, { infoContent: e.target.value })}
                                  placeholder="Írd ide a tanulók számára megjelenítendő elméleti magyarázatot, példákat, lépéseket..."
                                  className="w-full px-3 py-2 text-xs rounded-xl border border-cyan-200 dark:border-cyan-800/40 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                                />
                              </div>
                            )}

                            {/* VIDEO */}
                            {phase.sourceView === 'video' && (
                              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-2">
                                <label className="block text-xs font-bold uppercase tracking-wider text-red-700 dark:text-red-400">
                                  Videó URL vagy YouTube ID (opcionális)
                                </label>
                                <input
                                  type="text"
                                  value={phase.customVideoId || ''}
                                  onChange={(e) => updatePhase(idx, { customVideoId: e.target.value })}
                                  placeholder="pl. https://www.youtube.com/watch?v=... vagy videó azonosító"
                                  className="w-full px-3 py-2 text-xs rounded-xl border border-red-200 dark:border-red-800/40 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                                />
                              </div>
                            )}

                            {/* CONTROL / SIMULATION */}
                            {(phase.sourceView === 'control' || phase.sourceView === 'alive' || phase.sourceView === 'animation') && (
                              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 flex items-center gap-3">
                                <span className="text-lg">{badge.icon}</span>
                                <p className="text-xs text-slate-600 dark:text-slate-400">
                                  Ez a fázis egy interaktív demonstrációs felületet (<strong>{badge.label}</strong>) jelenít meg a diákoknak.
                                </p>
                              </div>
                            )}

                            {/* Mascot hint & Points */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60 dark:border-white/5">
                              <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                  Kabala Segítő Tipp (Bubi tanácsa)
                                </label>
                                <input
                                  type="text"
                                  value={getLocalizedHu(phase.hintCopy)}
                                  onChange={(e) => updatePhase(idx, { hintCopy: e.target.value })}
                                  placeholder="pl. Figyeld meg az összefüggéseket..."
                                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                  Maximális Pontszám a Fázisért
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={phase.maxPoints ?? 10}
                                  onChange={(e) => updatePhase(idx, { maxPoints: Number(e.target.value) || 10 })}
                                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add phase button at bottom */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={addPhase}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-white/20 hover:border-[#269984] text-slate-700 dark:text-slate-300 hover:text-[#269984] font-bold text-xs transition-colors w-full sm:w-auto justify-center"
                >
                  <Plus className="w-4 h-4" />
                  Új Tanulási Lépés Hozzáadása
                </button>

                <button
                  type="button"
                  onClick={openNewPhaseAiModal}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition-all"
                >
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  + Új Lépés Generálása AI-val
                </button>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-white/10 shadow-sm">
              <button
                type="button"
                onClick={() => setActiveTab('my_courses')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 font-bold text-sm transition-colors"
              >
                Mégse
              </button>

              <button
                type="button"
                onClick={handleSaveCourseForm}
                disabled={savingCourse}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#269984] hover:bg-[#1e7e6c] disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all hover:scale-[1.02] active:scale-95"
              >
                {savingCourse ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Mentés...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Kurzus Mentése
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ━━━ AI ASSISTANT: SINGLE PHASE MODAL (ONLY ONE-BY-ONE) ━━━ */}
      {phaseAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 p-6 sm:p-8 space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {phaseAiIsNew
                      ? `Új Lépés Generálása AI-val (${phasesList.length + 1}. Fázis)`
                      : `AI Segítség a(z) ${(phaseAiTargetIdx ?? 0) + 1}. Lépéshez`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Add meg a lépés témáját és típusát, az AI kidolgozza a feladatot.
                  </p>
                </div>
              </div>

              {!isPhaseAiGenerating && (
                <button
                  type="button"
                  onClick={() => setPhaseAiModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {isPhaseAiGenerating ? (
              <div className="py-8 space-y-3 text-center">
                <div className="relative w-12 h-12 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 border-t-purple-600 animate-spin" />
                  <Sparkles className="w-5 h-5 text-purple-600 absolute inset-0 m-auto" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Lépés feladatainak kidolgozása AI-val...
                </h4>
                <p className="text-xs text-purple-600 dark:text-purple-400 animate-pulse">
                  Kvízkérdések és interaktív tartalom generálása folyamatban...
                </p>
              </div>
            ) : (
              <form onSubmit={handleGenerateSinglePhase} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Lépés / Fázis témája vagy címe *
                  </label>
                  <input
                    type="text"
                    required
                    value={phaseAiTopic}
                    onChange={(e) => setPhaseAiTopic(e.target.value)}
                    placeholder="pl. Változók és típusok, Bevezető kvíz, For ciklusok..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Interaktív feladat típusa (Nézet)
                  </label>
                  <select
                    value={phaseAiView}
                    onChange={(e) => setPhaseAiView(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-purple-600 font-medium"
                  >
                    <option value="quiz">❓ Kvíz teszt (Feleletválasztós kérdések magyarázatokkal)</option>
                    <option value="gap-fill">🧩 Szöveg / Kód hiánypótlás (Hiányzó szavak kitöltése)</option>
                    <option value="debug">🐞 Kód hibakeresés (Bug javítás és helyes kód)</option>
                    <option value="match">🔗 Fogalom / Elem párosítás (Összekötendő párok)</option>
                    <option value="order">🔢 Lépés sorrendezés (Helyes sorrend felállítása)</option>
                    <option value="info">📖 Részletes tananyag / Olvasmány (Elméleti áttekintés)</option>
                    <option value="video">🎬 Oktatóvideó fázis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Egyéni instrukciók az AI-nak (Opcionális)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="pl. Készíts 3 gyakorlati kérdést a témáról részletes magyarázattal, vagy fókuszálj a leggyakoribb tévhitekre..."
                    value={phaseAiCustomPrompt}
                    onChange={(e) => setPhaseAiCustomPrompt(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-purple-600 leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setPhaseAiModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 font-bold text-xs transition-colors"
                  >
                    Mégse
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    Lépés Generálása
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
