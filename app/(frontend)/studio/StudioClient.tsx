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
  Settings,
  HelpCircle,
  Code2,
  CheckSquare,
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
  hintCopy?: string | { hu: string };
  mascotLine?: string | { hu: string };
  idleHelp?: string | { hu: string };
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

  const [activeTab, setActiveTab] = useState<'my_courses' | 'community' | 'ai_generator'>('my_courses');
  const [loading, setLoading] = useState(true);
  const [myCourses, setMyCourses] = useState<CourseItem[]>([]);
  const [communityCourses, setCommunityCourses] = useState<CourseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [isSlugLocked, setIsSlugLocked] = useState(true);
  const [expandedPhaseIdx, setExpandedPhaseIdx] = useState<number | null>(null);
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

  // AI Generator state
  const [aiTopic, setAiTopic] = useState('');
  const [aiDifficulty, setAiDifficulty] = useState('Beginner');
  const [aiTargetAudience, setAiTargetAudience] = useState('Középiskolai informatika oktatás');
  const [aiPhasesCount, setAiPhasesCount] = useState(5);
  const [aiModel, setAiModel] = useState('google/gemini-2.5-flash');
  const [aiConfig, setAiConfig] = useState<{ model: string; isConfigured: boolean } | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiProgressStep, setAiProgressStep] = useState('');

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
        if (data.model) {
          setAiModel(data.model);
        }
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
        phaseId: 'phase-1',
        title: '1. Elméleti bevezető és videó',
        sourceView: 'video',
        sourceAlgorithmId: 'bubble-sort',
        summary: 'Az algoritmus célja és hétköznapi logikája',
        maxPoints: 10,
      },
      {
        phaseId: 'phase-2',
        title: '2. Interaktív szimuláció',
        sourceView: 'control',
        sourceAlgorithmId: 'bubble-sort',
        summary: 'Lépésenkénti vezérlés és elemcserék',
        maxPoints: 10,
      },
      {
        phaseId: 'phase-3',
        title: '3. Tudásellenőrző kvíz',
        sourceView: 'quiz',
        sourceAlgorithmId: 'bubble-sort',
        summary: 'Gyakorlati kérdések a megértésről',
        maxPoints: 10,
        quiz: [
          {
            question: 'Hogyan működik a buborékrendezés alapvető lépése?',
            options: [
              { option: 'A szomszédos elemeket hasonlítja össze, és ha rossz sorrendben vannak, megcseréli őket.' },
              { option: 'Véletlenszerűen rendezi át a tömb elemeit.' },
              { option: 'Kettéosztja a tömböt minden lépésben.' },
            ],
            correctIndex: 0,
            explanation: 'A buborékrendezés lényege a szomszédos elemek ismételt összehasonlítása és cseréje.',
          },
        ],
      },
    ]);
    setEditModalOpen(true);
  };

  const openEditCourseModal = async (course: CourseItem) => {
    setEditingCourse(course);
    setIsSlugLocked(false);
    setExpandedPhaseIdx(null);
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
    setEditModalOpen(true);
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

  const handleSaveCourseForm = async (e: React.FormEvent) => {
    e.preventDefault();
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

      setEditModalOpen(false);
      await fetchCourses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hiba a mentés során.');
    } finally {
      setSavingCourse(false);
    }
  };

  // AI Course Generator Trigger
  const handleGenerateCourseWithAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) {
      toast.error('Kérjük, adj meg egy algoritmus vagy programozási témakört!');
      return;
    }

    setAiGenerating(true);
    setAiProgressStep('Pedagógiai tanterv felépítése és fázisok tervezése...');

    try {
      const prompt = `Készíts egy interaktív oktatási kurzust a következő témakörben: "${aiTopic}".
Nehézségi szint: ${aiDifficulty}.
Célközönség: ${aiTargetAudience}.
Kérlek generálj pontosan ${aiPhasesCount} egymásra épülő fázist (Videó magyarázat, Animáció, Interaktív szimuláció, Kvíz kérdések, Kódhibakeresés).
A nyelv legyen magyar (hu), de a JSON struktúrában a fordítások is szerepeljenek.`;

      setTimeout(() => {
        setAiProgressStep('Interaktív kvízkérdések és magyarázatok generálása...');
      }, 5000);

      setTimeout(() => {
        setAiProgressStep('Kabala-tanácsok és hezitálási tippek megfogalmazása...');
      }, 10000);

      const res = await fetch('/api/ai/generate-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model: aiModel || 'google/gemini-2.5-flash',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Az AI generálás jelenleg nem érhető el.');
      }

      const data = await res.json();
      const generated = data.course || data.generatedData || data;

      // Extract generated fields into draft editor
      const rawTitle = typeof generated.title === 'object' ? generated.title.hu : generated.title;
      const rawSummary = typeof generated.summary === 'object' ? generated.summary.hu : generated.summary;
      const rawSlug = generated.slug || generateSlug(rawTitle || aiTopic);

      if (data.courseId && data.course) {
        setEditingCourse(data.course);
      } else {
        setEditingCourse(null);
      }
      setIsSlugLocked(false);
      setExpandedPhaseIdx(0);

      setCourseForm({
        title: rawTitle || aiTopic,
        slug: rawSlug,
        summary: rawSummary || `${aiTopic} interaktív kurzus`,
        difficulty: generated.difficulty || aiDifficulty,
        estimatedMinutes: generated.estimatedMinutes || (aiPhasesCount * 5),
        visibility: 'private',
        icon: generated.icon || '🪄',
      });

      const formattedPhases: PhaseDraft[] = Array.isArray(generated.phases)
        ? generated.phases.map((p: any, idx: number) => ({
            phaseId: p.phaseId || `phase-${idx + 1}`,
            title: typeof p.title === 'object' ? p.title.hu : p.title || `${idx + 1}. Lépés`,
            sourceView: p.sourceView || 'control',
            sourceAlgorithmId: p.sourceAlgorithmId || 'bubble-sort',
            summary: typeof p.summary === 'object' ? p.summary.hu : p.summary || '',
            maxPoints: p.maxPoints ?? 10,
            customVideoId: p.customVideoId || '',
            quiz: Array.isArray(p.quiz)
              ? p.quiz.map((q: any) => ({
                  question: typeof q.question === 'object' ? q.question.hu : q.question || '',
                  options: Array.isArray(q.options)
                    ? q.options.map((opt: any) => ({
                        option: typeof opt === 'object' && opt?.option
                          ? (typeof opt.option === 'object' ? opt.option.hu : opt.option)
                          : String(opt || ''),
                      }))
                    : [],
                  correctIndex: Number(q.correctIndex) || 0,
                  explanation: typeof q.explanation === 'object' ? q.explanation.hu : q.explanation || '',
                }))
              : undefined,
            debugCode: p.debugCode || '',
            expectedCode: p.expectedCode || '',
            gapFillContent: typeof p.gapFillContent === 'object' ? p.gapFillContent.hu : p.gapFillContent || '',
            gapFillOptions: p.gapFillOptions,
            gapFillSolutions: p.gapFillSolutions,
            matching: p.matching,
            ordering: p.ordering,
            hintCopy: typeof p.hintCopy === 'object' ? p.hintCopy.hu : p.hintCopy || '',
            mascotLine: typeof p.mascotLine === 'object' ? p.mascotLine.hu : p.mascotLine || '',
            idleHelp: typeof p.idleHelp === 'object' ? p.idleHelp.hu : p.idleHelp || '',
          }))
        : [];

      setPhasesList(formattedPhases);
      await fetchCourses();
      toast.success('Az AI sikeresen megtervezte a kurzust minden feladattal! Most átnézheted és elmentheted.');
      setEditModalOpen(true);
    } catch (err) {
      toast.error('AI Generálási hiba:', {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setAiGenerating(false);
      setAiProgressStep('');
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-[#070b0e] text-slate-900 dark:text-slate-100 font-montserrat pb-20">
      {/* ━━━ HERO SECTION ━━━ */}
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

            <button
              onClick={() => setActiveTab('ai_generator')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-lg shadow-purple-700/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              AI Tananyag Varázsló
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

      {/* ━━━ MAIN WORKSPACE ━━━ */}
      <main className="max-w-[1400px] mx-auto px-6 lg:px-12 mt-8">
        {/* Navigation Tabs */}
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

            <button
              onClick={() => setActiveTab('ai_generator')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === 'ai_generator'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-700/20'
                  : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              AI Kurzus Generátor
            </button>
          </div>

          {/* Search & Filters (for course lists) */}
          {activeTab !== 'ai_generator' && (
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
          )}
        </div>

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
                    Új Kurzus
                  </button>
                  <button
                    onClick={() => setActiveTab('ai_generator')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold shadow-md"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generálás AI-val
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

        {/* ── TAB 3: AI KURZUS GENERÁTOR ── */}
        {activeTab === 'ai_generator' && (
          <div className="mt-8 max-w-3xl mx-auto">
            {aiConfig && !aiConfig.isConfigured && (
              <div className="mb-6 p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                      OpenRouter API kulcs beállítása szükséges
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                      Az AI kurzusgeneráláshoz az adminisztrátornak meg kell adnia az OpenRouter hozzáférési kulcsot a Payload CMS adminisztrációs felületén (AI Beállítások).
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <a
                    href="/admin/globals/ai-settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shrink-0 shadow-sm transition-all"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Kulcs megadása CMS-ben
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 shadow-xl">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                      AI Tananyag Varázsló
                    </h2>
                    <p className="text-sm text-slate-500">
                      Add meg a témakört, és az OpenRouter AI másodpercek alatt felépíti a teljes interaktív óratervet.
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <a
                    href="/admin/globals/ai-settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-bold transition-all"
                    title="OpenRouter beállítások módosítása a Payload CMS-ben"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>CMS Beállítások</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <form onSubmit={handleGenerateCourseWithAI} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Algoritmus vagy Témakör *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="pl. Beszúró rendezés (Insertion Sort) alapjai, Mélységi gráfbejárás..."
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Nehézségi szint
                    </label>
                    <select
                      value={aiDifficulty}
                      onChange={(e) => setAiDifficulty(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                    >
                      <option value="Beginner">Kezdő (Alapfogalmak, hétköznapi analógiák)</option>
                      <option value="Intermediate">Középhaladó (Kódoptimalizáció, algoritmus logikája)</option>
                      <option value="Advanced">Haladó (Bonyolultság, komplex élősávok)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                      Fázisok / Feladatok száma
                    </label>
                    <select
                      value={aiPhasesCount}
                      onChange={(e) => setAiPhasesCount(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                    >
                      <option value={3}>3 lépéses gyors óravázlat</option>
                      <option value={5}>5 lépéses teljes lecke (Javasolt)</option>
                      <option value={7}>7 lépéses mély elmélyítő modul</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Célcsoport vagy Különleges Kérések
                  </label>
                  <input
                    type="text"
                    value={aiTargetAudience}
                    onChange={(e) => setAiTargetAudience(e.target.value)}
                    placeholder="pl. 9-10. osztályos középiskolások, versenyfelkészülés, játékos megközelítés..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                  />
                </div>

                {/* AI Modell Választó */}
                <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                      AI Modell (OpenRouter)
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold font-mono">
                        {aiModel}
                      </span>
                      {isAdmin && (
                        <a
                          href="/admin/globals/ai-settings"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex sm:hidden items-center gap-1 px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 text-[10px] font-bold"
                          title="OpenRouter beállítások"
                        >
                          <Settings className="w-2.5 h-2.5" />
                          CMS
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', badge: 'Ajánlott' },
                      { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', badge: 'Megbízható' },
                      { id: 'anthropic/claude-3.5-haiku', label: 'Claude 3.5 Haiku', badge: 'Kreatív' },
                      { id: 'openrouter/free', label: 'Random Free', badge: 'Ingyenes' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setAiModel(m.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          aiModel === m.id
                            ? 'bg-white dark:bg-purple-900/60 border-purple-500 shadow-sm'
                            : 'bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-white/10 hover:border-purple-300'
                        }`}
                      >
                        <div className="flex flex-col gap-1">
                          <span className={`text-xs font-bold ${aiModel === m.id ? 'text-purple-700 dark:text-purple-200' : 'text-slate-800 dark:text-slate-200'}`}>
                            {m.label}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 font-bold w-fit">
                            {m.badge}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Vagy adj meg egyedi OpenRouter modellazonosítót:
                    </label>
                    <input
                      type="text"
                      value={aiModel}
                      onChange={(e) => setAiModel(e.target.value)}
                      placeholder="pl. meta-llama/llama-3.3-70b-instruct:free..."
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-600 font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={aiGenerating}
                    className="w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-extrabold text-base shadow-lg shadow-purple-600/25 flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-95"
                  >
                    {aiGenerating ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Generálás folyamatban...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Kurzus Generálása Másodpercek Alatt</span>
                      </>
                    )}
                  </button>

                  {aiProgressStep && (
                    <div className="mt-4 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/50 dark:border-purple-800/40 text-center text-xs font-semibold text-purple-700 dark:text-purple-300 animate-pulse">
                      {aiProgressStep}
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ━━━ EDIT / CREATE COURSE MODAL ━━━ */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 my-8 overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-[#269984]">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {editingCourse ? `Kurzus Szerkesztése: ${editingCourse.title}` : 'Új Kurzus Létrehozása'}
                  </h3>
                  <p className="text-xs text-slate-500">Állítsd be a kurzus adatait és tanulási fázisait.</p>
                </div>
              </div>

              <button
                onClick={() => setEditModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSaveCourseForm} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                    placeholder="pl. Buborékrendezés Alapjai"
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
                      title={isSlugLocked ? 'Automatikus generálás bekapcsolva (Kattints a feloldáshoz)' : 'Egyéni slug (Kattints az automata zároláshoz)'}
                    >
                      {isSlugLocked ? (
                        <>
                          <Lock className="w-3 h-3 text-[#269984]" />
                          <span className="text-[#269984]">Auto-generált</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3 text-amber-500" />
                          <span className="text-amber-500">Egyéni</span>
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
                    placeholder="pl. bubble-sort-basics"
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
                  placeholder="Rövid, figyelemfelkeltő leírás a kurzuskártyához..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
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
                    value={courseForm.estimatedMinutes}
                    onChange={(e) => setCourseForm({ ...courseForm, estimatedMinutes: Number(e.target.value) })}
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
                    <option value="public">🌐 Publikus (Megosztva más tanárokkal)</option>
                    <option value="private">🔒 Privát (Csak a sajátjaim között)</option>
                  </select>
                </div>
              </div>

              {/* Phases List */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#269984]" />
                      Tanulási Fázisok ({phasesList.length})
                    </h4>
                    <p className="text-xs text-slate-500">
                      A diákok egymás után ezen a feladatsoron haladnak végig. Kattints a Részletekre a kérdések és beállítások testreszabásához.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const newIdx = phasesList.length;
                      setPhasesList((prev) => [
                        ...prev,
                        {
                          phaseId: `phase-${prev.length + 1}`,
                          title: `${prev.length + 1}. Új feladat`,
                          sourceView: 'control',
                          sourceAlgorithmId: 'bubble-sort',
                          summary: 'Lépésenkénti vezérlés és elemzés',
                          maxPoints: 10,
                        },
                      ]);
                      setExpandedPhaseIdx(newIdx);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-[#269984] hover:bg-teal-100 text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Fázis hozzáadása
                  </button>
                </div>

                <div className="space-y-3">
                  {phasesList.map((phase, idx) => {
                    const isExpanded = expandedPhaseIdx === idx;
                    const phaseTitle = typeof phase.title === 'object' ? phase.title.hu : phase.title;
                    const phaseSummary = typeof phase.summary === 'object' ? phase.summary.hu : phase.summary;

                    return (
                      <div
                        key={phase.phaseId || idx}
                        className={`rounded-2xl border transition-all duration-200 ${
                          isExpanded
                            ? 'bg-white dark:bg-slate-800/90 border-[#269984]/50 shadow-md ring-1 ring-[#269984]/30'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-white/5 hover:border-slate-300'
                        }`}
                      >
                        {/* Header bar */}
                        <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                            {/* Reorder Buttons */}
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  movePhaseUp(idx);
                                }}
                                className="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                title="Mozgatás felfelé"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === phasesList.length - 1}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  movePhaseDown(idx);
                                }}
                                className="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                title="Mozgatás lefelé"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>

                            <span className="w-7 h-7 rounded-lg bg-[#269984] text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {idx + 1}
                            </span>

                            <input
                              type="text"
                              value={phaseTitle}
                              onChange={(e) => {
                                const updatedTitle = e.target.value;
                                setPhasesList((prev) =>
                                  prev.map((p, i) => (i === idx ? { ...p, title: updatedTitle } : p))
                                );
                              }}
                              className="w-full text-sm font-bold bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#269984] focus:outline-none"
                              placeholder="Fázis címe..."
                            />
                          </div>

                          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                            <select
                              value={phase.sourceAlgorithmId || 'bubble-sort'}
                              onChange={(e) => {
                                const newAlgo = e.target.value;
                                setPhasesList((prev) =>
                                  prev.map((p, i) => (i === idx ? { ...p, sourceAlgorithmId: newAlgo } : p))
                                );
                              }}
                              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                              title="Kapcsolódó algoritmus"
                            >
                              <option value="bubble-sort">Buborék</option>
                              <option value="insertion-sort">Beszúró</option>
                              <option value="selection-sort">Kiválasztó</option>
                              <option value="merge-sort">Összefésülő</option>
                              <option value="quick-sort">Gyors</option>
                              <option value="heap-sort">Kupac</option>
                              <option value="shell-sort">Shell</option>
                              <option value="linear-search">Lineáris ker.</option>
                              <option value="binary-search">Bináris ker.</option>
                            </select>

                            <select
                              value={phase.sourceView}
                              onChange={(e) => {
                                const newView = e.target.value;
                                setPhasesList((prev) =>
                                  prev.map((p, i) => (i === idx ? { ...p, sourceView: newView } : p))
                                );
                              }}
                              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10"
                            >
                              <option value="video">🎬 Videó Magyarázat</option>
                              <option value="video-custom">📹 Egyéni YouTube Videó</option>
                              <option value="animation">✨ Animáció</option>
                              <option value="control">🕹️ Interaktív Vezérlés</option>
                              <option value="create">💻 Kódépítő (Create)</option>
                              <option value="alive">⚡ Élő Szimuláció</option>
                              <option value="quiz">🧩 Kvíz Kérdések</option>
                              <option value="debug">🐛 Kód Hibakeresés</option>
                              <option value="gap-fill">📝 Kód Kiegészítés</option>
                            </select>

                            {/* Expand / Collapse Button */}
                            <button
                              type="button"
                              onClick={() => setExpandedPhaseIdx(isExpanded ? null : idx)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors ${
                                isExpanded
                                  ? 'bg-[#269984] text-white'
                                  : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                              }`}
                              title={isExpanded ? 'Részletek elrejtése' : 'Részletek szerkesztése'}
                            >
                              {isExpanded ? (
                                <>
                                  <span>Bezár</span>
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </>
                              ) : (
                                <>
                                  <span>Részletek</span>
                                  {phase.sourceView === 'quiz' && phase.quiz?.length ? (
                                    <span className="px-1.5 py-0.2 rounded-full bg-[#269984]/20 text-[#269984] dark:text-teal-300 text-[10px]">
                                      {phase.quiz.length}
                                    </span>
                                  ) : null}
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (phasesList.length <= 1) {
                                  toast.error('Legalább egy fázisnak maradnia kell a kurzusban!');
                                  return;
                                }
                                setPhasesList((prev) => prev.filter((_, i) => i !== idx));
                                if (expandedPhaseIdx === idx) setExpandedPhaseIdx(null);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                              title="Fázis törlése"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Accordion content */}
                        {isExpanded && (
                          <div className="px-5 pb-5 pt-2 border-t border-slate-200/70 dark:border-white/10 space-y-4">
                            {/* Summary / Instruction */}
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                                Fázis leírása és célkitűzése
                              </label>
                              <textarea
                                rows={2}
                                value={phaseSummary}
                                onChange={(e) =>
                                  updatePhase(idx, { summary: e.target.value })
                                }
                                placeholder="A lépés célja, a diákoknak szóló útmutató..."
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#269984]"
                              />
                            </div>

                            {/* View-specific configurations */}
                            {phase.sourceView === 'video-custom' && (
                              <div className="p-3.5 rounded-xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800/30">
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300 mb-1">
                                  YouTube Videó Azonosító (Video ID)
                                </label>
                                <input
                                  type="text"
                                  value={phase.customVideoId || ''}
                                  onChange={(e) => updatePhase(idx, { customVideoId: e.target.value })}
                                  placeholder="pl. Ns4TPTC8whw (a https://www.youtube.com/watch?v=Ns4TPTC8whw linkből)"
                                  className="w-full px-3 py-2 text-xs rounded-lg border border-teal-200 dark:border-teal-800/50 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-mono focus:outline-none focus:border-[#269984]"
                                />
                                <p className="text-[10px] text-teal-700 dark:text-teal-400 mt-1">
                                  Csak a videó 11 karakteres azonosítóját add meg, nem a teljes linket.
                                </p>
                              </div>
                            )}

                            {phase.sourceView === 'quiz' && (
                              <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/30 space-y-4">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                                    <CheckSquare className="w-3.5 h-3.5 text-purple-600" />
                                    Kvízkérdések ({(phase.quiz || []).length})
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => addQuizQuestion(idx)}
                                    className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Új kérdés
                                  </button>
                                </div>

                                {(!phase.quiz || phase.quiz.length === 0) ? (
                                  <div className="text-center py-4 text-xs text-slate-500">
                                    Még nincsenek kérdések megadva. Kattints a fenti gombra új kérdés hozzáadásához!
                                  </div>
                                ) : (
                                  <div className="space-y-4">
                                    {phase.quiz.map((q, qIdx) => {
                                      const qText = typeof q.question === 'object' ? (q.question as any).hu : q.question;
                                      const qExpl = typeof q.explanation === 'object' ? (q.explanation as any).hu : (q.explanation || '');

                                      return (
                                        <div
                                          key={qIdx}
                                          className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-purple-200/50 dark:border-purple-900/40 space-y-2.5"
                                        >
                                          <div className="flex items-center justify-between gap-2">
                                            <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300">
                                              {qIdx + 1}. Kérdés
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => removeQuizQuestion(idx, qIdx)}
                                              className="text-slate-400 hover:text-red-500 text-xs p-1"
                                              title="Kérdés törlése"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>

                                          <input
                                            type="text"
                                            value={qText}
                                            onChange={(e) => updateQuizQuestionText(idx, qIdx, e.target.value)}
                                            placeholder="Kérdés szövege..."
                                            className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-purple-600"
                                          />

                                          <div className="space-y-1.5 pt-1">
                                            <div className="flex items-center justify-between">
                                              <span className="text-[10px] font-bold uppercase text-slate-500">
                                                Válaszlehetőségek (Jelöld be a helyes választ):
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => addQuizOption(idx, qIdx)}
                                                className="text-[10px] font-bold text-purple-600 hover:underline inline-flex items-center gap-0.5"
                                              >
                                                <Plus className="w-2.5 h-2.5" /> Opció
                                              </button>
                                            </div>

                                            {q.options.map((opt, optIdx) => {
                                              const optText = typeof opt.option === 'object' ? (opt.option as any).hu : opt.option;
                                              const isCorrect = q.correctIndex === optIdx;

                                              return (
                                                <div key={optIdx} className="flex items-center gap-2">
                                                  <input
                                                    type="radio"
                                                    name={`correct-${idx}-${qIdx}`}
                                                    checked={isCorrect}
                                                    onChange={() => updateQuizQuestionCorrect(idx, qIdx, optIdx)}
                                                    className="w-3.5 h-3.5 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                                    title="Helyes válasz kijelölése"
                                                  />
                                                  <input
                                                    type="text"
                                                    value={optText}
                                                    onChange={(e) => updateQuizOptionText(idx, qIdx, optIdx, e.target.value)}
                                                    className={`flex-1 px-2.5 py-1 text-xs rounded-md border ${
                                                      isCorrect
                                                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200 font-semibold'
                                                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                                                    }`}
                                                    placeholder={`${optIdx + 1}. Válasz...`}
                                                  />
                                                  {q.options.length > 2 && (
                                                    <button
                                                      type="button"
                                                      onClick={() => removeQuizOption(idx, qIdx, optIdx)}
                                                      className="text-slate-400 hover:text-red-500 p-1"
                                                      title="Opció törlése"
                                                    >
                                                      <X className="w-3 h-3" />
                                                    </button>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>

                                          <div>
                                            <input
                                              type="text"
                                              value={qExpl}
                                              onChange={(e) => {
                                                const text = e.target.value;
                                                setPhasesList((prev) =>
                                                  prev.map((p, i) => {
                                                    if (i !== idx) return p;
                                                    return {
                                                      ...p,
                                                      quiz: (p.quiz || []).map((qItem, qi) =>
                                                        qi === qIdx ? { ...qItem, explanation: text } : qItem
                                                      ),
                                                    };
                                                  })
                                                );
                                              }}
                                              placeholder="Magyarázat a helyes válaszhoz (miért ez a jó?)..."
                                              className="w-full px-2.5 py-1 text-[11px] rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 focus:outline-none"
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}

                            {phase.sourceView === 'debug' && (
                              <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/30 space-y-3">
                                <div>
                                  <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 mb-1">
                                    Hibás Kód (amit a diáknak javítania kell)
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={phase.debugCode || ''}
                                    onChange={(e) => updatePhase(idx, { debugCode: e.target.value })}
                                    placeholder="pl. for (let i = 0; i <= arr.length; i++) { ... }"
                                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-amber-200 dark:border-amber-800/50 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 mb-1">
                                    Várt, Javított Megoldáskód
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={phase.expectedCode || ''}
                                    onChange={(e) => updatePhase(idx, { expectedCode: e.target.value })}
                                    placeholder="pl. for (let i = 0; i < arr.length - 1; i++) { ... }"
                                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-amber-200 dark:border-amber-800/50 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                                  />
                                </div>
                              </div>
                            )}

                            {phase.sourceView === 'gap-fill' && (
                              <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/30">
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 mb-1">
                                  Kiegészítendő Szöveg vagy Kód
                                </label>
                                <textarea
                                  rows={3}
                                  value={typeof phase.gapFillContent === 'object' ? (phase.gapFillContent as any).hu : (phase.gapFillContent || '')}
                                  onChange={(e) => updatePhase(idx, { gapFillContent: e.target.value })}
                                  placeholder="pl. A rendezés során a legkisebb elemet a {{gap}} pozícióba helyezzük át."
                                  className="w-full px-3 py-2 text-xs rounded-lg border border-blue-200 dark:border-blue-800/50 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                                />
                                <p className="text-[10px] text-blue-700 dark:text-blue-400 mt-1">
                                  Használd a <code>&#123;&#123;gap&#125;&#125;</code> jelölést a kitöltendő hiányzó szavak helyén.
                                </p>
                              </div>
                            )}

                            {/* Extra metadata: hint & max points */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                  Kabala Segítő Tipp (Hint)
                                </label>
                                <input
                                  type="text"
                                  value={typeof phase.hintCopy === 'object' ? (phase.hintCopy as any).hu : (phase.hintCopy || '')}
                                  onChange={(e) => updatePhase(idx, { hintCopy: e.target.value })}
                                  placeholder="Bubi tanácsa elakadás esetén..."
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                  Maximális Pontszám
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={phase.maxPoints ?? 10}
                                  onChange={(e) => updatePhase(idx, { maxPoints: Number(e.target.value) })}
                                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 focus:outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 font-bold text-sm transition-colors"
                >
                  Mégse
                </button>

                <button
                  type="submit"
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
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
