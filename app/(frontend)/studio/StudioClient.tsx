'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { useLocale } from '../../i18n/LocaleProvider';
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
  Bot,
  Columns,
  Palette,
  FileText,
  Volume2,
  Award,
  Zap,
} from 'lucide-react';
import { ROUTES, ROLES } from '../../../lib/constants';
import { lexicalToMarkdown } from '@/lib/courses/lexicalConverter';

type SupportedLang = 'hu' | 'en' | 'ro';

export interface LocalizedTextObj {
  hu: string;
  en: string;
  ro: string;
}

const ASSET_OPTIONS = [
  { label: 'Bubi Kabala (Zöld)', value: 'algo_group_109.svg' },
  { label: 'Bubi Kabala (Kék)', value: 'algo_group_119.svg' },
  { label: 'Bubi Kabala (Sárga)', value: 'algo_group_132.svg' },
  { label: 'Bubi Kabala (Lila)', value: 'algo_group_142.svg' },
  { label: 'Kabala Robot A', value: 'algo_group_166.svg' },
  { label: 'Kabala Robot B', value: 'algo_group_167.svg' },
  { label: 'Kabala Robot C', value: 'algo_group_168.svg' },
  { label: 'Kabala Karakter', value: 'algo_group_170.svg' },
  { label: 'Sárkány (Dragon)', value: 'bubble_dragon.png' },
  { label: 'Algoritmus Kereső', value: 'algo_binary_search.svg' },
  { label: 'Algoritmus Rendező', value: 'algo_sorting_icon.svg' },
  { label: 'Kódoló Diák', value: 'Login_girl_phone_illu.svg' },
  { label: 'Illusztráció Modern', value: 'illustration_no_bg.png' },
  { label: 'Tanulási Csoport', value: 'group_20.svg' },
  { label: 'Elméleti Csoport', value: 'group_28.svg' },
  { label: 'Interaktív Csoport', value: 'group_34.svg' },
];

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
  option: LocalizedTextObj | string;
}

interface QuizItemDraft {
  question: LocalizedTextObj | string;
  options: QuizOptionDraft[];
  correctIndex: number;
  explanation?: LocalizedTextObj | string;
}

interface PhaseDraft {
  phaseId: string;
  title: LocalizedTextObj | string;
  sourceAlgorithmId?: string;
  sourceView: string;
  summary: LocalizedTextObj | string;
  maxPoints?: number;
  customVideoId?: string;
  quiz?: QuizItemDraft[];
  matching?: Array<{ left: LocalizedTextObj | string; right: LocalizedTextObj | string }>;
  ordering?: Array<{ text: LocalizedTextObj | string }>;
  debugCode?: string;
  expectedCode?: string;
  gapFillContent?: LocalizedTextObj | string;
  gapFillOptions?: Array<{ option: LocalizedTextObj | string }>;
  gapFillSolutions?: Array<{ solution: LocalizedTextObj | string }>;
  gapFillDecoys?: Array<{ decoy: LocalizedTextObj | string }>;
  infoContent?: LocalizedTextObj | string;
  hintCopy?: LocalizedTextObj | string;
  mascotLine?: LocalizedTextObj | string;
  mascotMistakeLine?: LocalizedTextObj | string;
  idleHelp?: LocalizedTextObj | string;
  askConfidence?: boolean;
  isGenerated?: boolean;
  isGenerating?: boolean;
  customAiInstruction?: string;
  isEditing?: boolean;
}

export type MascotMode = 'disabled' | 'ai-only' | 'ai-fallback' | 'manual-only';

export const MASCOT_MODES: Array<{
  id: MascotMode;
  label: string;
  badge?: string;
  desc: string;
  icon: string;
}> = [
  {
    id: 'disabled',
    label: 'Sose legyen kabala',
    desc: 'A kabala teljesen ki van kapcsolva ennél a kurzusnál.',
    icon: '🚫',
  },
  {
    id: 'ai-only',
    label: 'Csak AI kabala',
    badge: 'Élő AI',
    desc: 'Valós idejű mesterséges intelligencia válaszol és segít a feladatoknál.',
    icon: '🤖',
  },
  {
    id: 'ai-fallback',
    label: 'AI kabala manuális fallbackkel',
    badge: 'Hibrid mód',
    desc: 'Elsődlegesen az AI válaszol, hiba esetén manuális szövegek ugranak be.',
    icon: '⚡',
  },
  {
    id: 'manual-only',
    label: 'Csak manuális kabala',
    badge: 'Klasszikus',
    desc: 'Csak a tanár által manuálisan megadott üzenetek és szabályok működnek.',
    icon: '✍️',
  },
];

interface MascotFormState {
  enabled: boolean;
  mode: MascotMode;
  name: LocalizedTextObj;
  asset: string;
  accentColor: string;
  idleTriggerSeconds: number;
  mistakeTriggerCount: number;
  summonLabel: LocalizedTextObj;
  idlePrompt: LocalizedTextObj;
  mistakePrompt: LocalizedTextObj;
  welcomeMessages: Array<{ text: LocalizedTextObj }>;
  overconfidentMessages: Array<{ text: LocalizedTextObj }>;
  streakMessages: Array<{ text: LocalizedTextObj }>;
}

export function getLocalizedStr(val: unknown, lang: SupportedLang = 'hu'): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    const obj = val as Record<string, unknown>;
    const target = obj[lang];
    if (typeof target === 'string' && target.trim()) return target;
    // Fallback: hu -> en -> ro -> any non-empty
    if (typeof obj.hu === 'string' && obj.hu.trim()) return obj.hu;
    if (typeof obj.en === 'string' && obj.en.trim()) return obj.en;
    if (typeof obj.ro === 'string' && obj.ro.trim()) return obj.ro;
    return '';
  }
  return '';
}

export function setLocalizedStr(val: unknown, lang: SupportedLang, newText: string): LocalizedTextObj {
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    const obj = val as Record<string, unknown>;
    return {
      hu: lang === 'hu' ? newText : String(obj.hu || ''),
      en: lang === 'en' ? newText : String(obj.en || ''),
      ro: lang === 'ro' ? newText : String(obj.ro || ''),
    };
  }
  const s = typeof val === 'string' ? val : '';
  return {
    hu: lang === 'hu' ? newText : s,
    en: lang === 'en' ? newText : s,
    ro: lang === 'ro' ? newText : s,
  };
}

export function ensureLocalized(val: unknown, defaultText = ''): LocalizedTextObj {
  if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
    const obj = val as Record<string, unknown>;
    const anyAvailable =
      (typeof obj.hu === 'string' && obj.hu.trim() ? obj.hu.trim() : '') ||
      (typeof obj.en === 'string' && obj.en.trim() ? obj.en.trim() : '') ||
      (typeof obj.ro === 'string' && obj.ro.trim() ? obj.ro.trim() : '') ||
      defaultText;
    const hu = typeof obj.hu === 'string' && obj.hu.trim() ? obj.hu : anyAvailable;
    const en = typeof obj.en === 'string' && obj.en.trim() ? obj.en : anyAvailable;
    const ro = typeof obj.ro === 'string' && obj.ro.trim() ? obj.ro : anyAvailable;
    return { hu, en, ro };
  }
  const s = typeof val === 'string' ? val : defaultText;
  return { hu: s, en: s, ro: s };
}

function getLocalizedHu(val: unknown): string {
  return getLocalizedStr(val, 'hu');
}

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getViewBadge(sourceView: string) {
  switch (sourceView) {
    case 'quiz':
      return { label: 'Kvíz', icon: '❓', color: 'amber' };
    case 'gap-fill':
      return { label: 'Hiánypótlás', icon: '🧩', color: 'blue' };
    case 'debug':
      return { label: 'Hibakeresés', icon: '🐞', color: 'rose' };
    case 'match':
      return { label: 'Párosítás', icon: '🔗', color: 'blue' };
    case 'order':
      return { label: 'Sorrendezés', icon: '🔢', color: 'indigo' };
    case 'info':
      return { label: 'Elmélet', icon: '📖', color: 'cyan' };
    case 'video':
      return { label: 'Videó', icon: '🎬', color: 'red' };
    case 'control':
    case 'alive':
    case 'animation':
      return { label: 'Szimuláció', icon: '🕹️', color: 'purple' };
    default:
      return { label: 'Általános', icon: '📘', color: 'teal' };
  }
}

export default function StudioClient({ userRole }: { userRole?: string }) {
  const router = useRouter();
  const isAdmin = userRole === ROLES.ADMIN;
  const { locale } = useLocale();
  const teacherLang: SupportedLang = (locale as SupportedLang) || 'hu';

  const [activeTab, setActiveTab] = useState<'my_courses' | 'community' | 'course_editor'>('my_courses');
  const [editorStep, setEditorStep] = useState<'basics' | 'phases' | 'mascot'>('basics');
  const [loading, setLoading] = useState(true);
  const [myCourses, setMyCourses] = useState<CourseItem[]>([]);
  const [communityCourses, setCommunityCourses] = useState<CourseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  // Course Editor State
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [isSlugLocked, setIsSlugLocked] = useState(true);
  const [expandedPhaseIdx, setExpandedPhaseIdx] = useState<number | null>(0);
  const [activeEditorLang, setActiveEditorLang] = useState<SupportedLang>(teacherLang);
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [isTranslatingAll, setIsTranslatingAll] = useState(false);
  const [isGeneratingMascot, setIsGeneratingMascot] = useState(false);
  const [showAdvancedMascot, setShowAdvancedMascot] = useState(false);
  const [openPhaseMascotIdx, setOpenPhaseMascotIdx] = useState<Record<number, boolean>>({});

  // Markdown view mode per phase: 'edit' | 'preview' | 'split'
  const [infoViewModes, setInfoViewModes] = useState<Record<number, 'edit' | 'preview' | 'split'>>({});

  const [courseForm, setCourseForm] = useState({
    title: { hu: '', en: '', ro: '' } as LocalizedTextObj,
    slug: '',
    summary: { hu: '', en: '', ro: '' } as LocalizedTextObj,
    heroTagline: { hu: '', en: '', ro: '' } as LocalizedTextObj,
    difficulty: 'Beginner',
    estimatedMinutes: 20,
    visibility: 'public' as 'public' | 'private',
    isOfficial: false,
    icon: '📘',
    accentColor: '#269984',
    illustrationAsset: 'algo_group_109.svg',
    mascot: {
      enabled: false,
      mode: 'disabled' as MascotMode,
      name: { hu: 'Bubi', en: 'Bubi', ro: 'Bubi' },
      asset: 'algo_group_109.svg',
      accentColor: '#269984',
      idleTriggerSeconds: 30,
      mistakeTriggerCount: 2,
      summonLabel: { hu: 'Segítség kérése', en: 'Summon guide', ro: 'Ajutor' },
      idlePrompt: {
        hu: 'Segíthetek a következő lépésben?',
        en: 'Need help with this step?',
        ro: 'Ai nevoie de ajutor cu acest pas?',
      },
      mistakePrompt: {
        hu: 'Ne aggódj a hibák miatt, együtt megoldjuk!',
        en: "Don't worry about mistakes, let's solve it together!",
        ro: 'Nu-ți face griji, rezolvăm împreună!',
      },
      welcomeMessages: [
        { text: { hu: 'Üdv a kurzuson! Jó tanulást kívánok!', en: 'Welcome to the course! Happy learning!', ro: 'Bun venit la curs! Spor la învățat!' } },
      ],
      overconfidentMessages: [
        { text: { hu: 'Nézd át újra alaposan a lépéseket!', en: 'Review the steps carefully!', ro: 'Verifică pașii cu atenție!' } },
      ],
      streakMessages: [
        { text: { hu: 'Kiváló válaszsorozat! Csak így tovább!', en: 'Great streak! Keep it up!', ro: 'Serie excelentă! Continuă așa!' } },
      ],
    } as MascotFormState,
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
    setActiveEditorLang(teacherLang);
    setEditorStep('basics');
    setCourseForm({
      title: { hu: '', en: '', ro: '' },
      slug: '',
      summary: { hu: '', en: '', ro: '' },
      heroTagline: { hu: '', en: '', ro: '' },
      difficulty: 'Beginner',
      estimatedMinutes: 20,
      visibility: 'public',
      isOfficial: false,
      icon: '📘',
      accentColor: '#269984',
      illustrationAsset: 'algo_group_109.svg',
      mascot: {
        enabled: false,
        mode: 'disabled' as MascotMode,
        name: { hu: 'Bubi', en: 'Bubi', ro: 'Bubi' },
        asset: 'algo_group_109.svg',
        accentColor: '#269984',
        idleTriggerSeconds: 30,
        mistakeTriggerCount: 2,
        summonLabel: { hu: 'Segítség kérése', en: 'Summon guide', ro: 'Ajutor' },
        idlePrompt: {
          hu: 'Segíthetek a következő lépésben?',
          en: 'Need help with this step?',
          ro: 'Ai nevoie de ajutor cu acest pas?',
        },
        mistakePrompt: {
          hu: 'Ne aggódj a hibák miatt, együtt megoldjuk!',
          en: "Don't worry about mistakes, let's solve it together!",
          ro: 'Nu-ți face griji, rezolvăm împreună!',
        },
        welcomeMessages: [
          { text: { hu: 'Üdv a kurzuson! Jó tanulást kívánok!', en: 'Welcome to the course! Happy learning!', ro: 'Bun venit la curs! Spor la învățat!' } },
        ],
        overconfidentMessages: [
          { text: { hu: 'Nézd át újra alaposan a lépéseket!', en: 'Review the steps carefully!', ro: 'Verifică pașii cu atenție!' } },
        ],
        streakMessages: [
          { text: { hu: 'Kiváló válaszsorozat! Csak így tovább!', en: 'Great streak! Keep it up!', ro: 'Serie excelentă! Continuă așa!' } },
        ],
      },
    });
    setPhasesList([
      {
        phaseId: `phase-1-${Date.now().toString(36)}`,
        title: { hu: '1. Bevezetés és alapfogalmak', en: '1. Introduction & Basics', ro: '1. Introducere și noțiuni de bază' },
        sourceView: 'info',
        sourceAlgorithmId: 'general',
        summary: {
          hu: 'Alapvető fogalmak és az elméleti háttér áttekintése.',
          en: 'Overview of fundamental concepts and theoretical background.',
          ro: 'Prezentare generală a conceptelor fundamentale și a teoriei.',
        },
        maxPoints: 10,
        askConfidence: true,
        infoContent: {
          hu: '## Üdvözlünk a kurzusban! 🚀\n\nEbben a lépésben megismerkedhetsz az alapokkal.\n\n- **Célkitűzés:** A fogalmak megértése és gyakorlati alkalmazása\n- **Követelmények:** Figyelmes olvasás és aktív részvétel\n\n```python\n# Példa kód\nprint("Sikeres tanulást kívánunk!")\n```',
          en: '## Welcome to the course! 🚀\n\nIn this step, you will learn the basics.\n\n- **Objective:** Understanding concepts and practical usage\n- **Requirements:** Careful reading and active engagement\n\n```python\n# Example code\nprint("Happy learning!")\n```',
          ro: '## Bun venit la curs! 🚀\n\nÎn acest pas vei învăța noțiunile de bază.\n\n- **Obiectiv:** Înțelegerea conceptelor și utilizarea practică\n\n```python\n# Cod exemplu\nprint("Spor la învățat!")\n```',
        },
        hintCopy: {
          hu: '💡 Olvasd el figyelmesen a fenti magyarázatot, mielőtt továbbhaladsz!',
          en: '💡 Read the explanation above carefully before moving forward!',
          ro: '💡 Citește explicația de mai sus cu atenție înainte de a continua!',
        },
        mascotLine: {
          hu: 'Nagyszerű, hogy itt vagy! Kezdjük el a közös tanulást!',
          en: "Great to have you here! Let's start learning together!",
          ro: 'Mă bucur că ești aici! Să începem să învățăm împreună!',
        },
        mascotMistakeLine: {
          hu: 'Ha valamit nem értesz, nyugodtan olvasd el újra az összefoglalót!',
          en: 'If something is unclear, feel free to reread the summary!',
          ro: 'Dacă ceva nu este clar, recitește rezumatul!',
        },
        idleHelp: {
          hu: 'Készen állsz? Kattints a következő lépésre!',
          en: 'Ready? Click to proceed to the next step!',
          ro: 'Ești gata? Fă clic pentru a trece la pasul următor!',
        },
      },
    ]);
    setActiveTab('course_editor');
  };

  const openEditCourseModal = async (course: CourseItem) => {
    setEditingCourse(course);
    setIsSlugLocked(false);
    setExpandedPhaseIdx(0);
    setActiveEditorLang(teacherLang);
    setEditorStep('basics');

    try {
      const res = await fetch(`/api/studio/courses/${course.id}`);
      if (res.ok) {
        const data = await res.json();
        const doc = data.course;

        setCourseForm({
          title: ensureLocalized(doc.title, course.title),
          slug: doc.slug || course.slug,
          summary: ensureLocalized(doc.summary, course.summary),
          heroTagline: ensureLocalized(doc.heroTagline, ''),
          difficulty: doc.difficulty || course.difficulty,
          estimatedMinutes: doc.estimatedMinutes || course.estimatedMinutes,
          visibility: doc.visibility || course.visibility,
          isOfficial: Boolean(doc.isOfficial),
          icon: doc.icon || '📘',
          accentColor: doc.accentColor || '#269984',
          illustrationAsset: doc.illustrationAsset || 'algo_group_109.svg',
          mascot: (() => {
            const rawMascotMode = doc.mascot?.mode;
            const VALID_MODES: MascotMode[] = ['disabled', 'ai-only', 'ai-fallback', 'manual-only'];
            const mascotMode: MascotMode = rawMascotMode && VALID_MODES.includes(rawMascotMode)
              ? rawMascotMode
              : (doc.mascot?.enabled ? 'manual-only' : 'disabled');
            const mascotEnabled = mascotMode !== 'disabled';

            return {
              enabled: mascotEnabled,
              mode: mascotMode,
              name: ensureLocalized(doc.mascot?.name, 'Bubi'),
              asset: doc.mascot?.asset || 'algo_group_109.svg',
              accentColor: doc.mascot?.accentColor || '#269984',
            idleTriggerSeconds: doc.mascot?.idleTriggerSeconds || 30,
            mistakeTriggerCount: doc.mascot?.mistakeTriggerCount || 2,
            summonLabel: ensureLocalized(doc.mascot?.summonLabel, 'Segítség kérése'),
            idlePrompt: ensureLocalized(doc.mascot?.idlePrompt, 'Segíthetek a következő lépésben?'),
            mistakePrompt: ensureLocalized(doc.mascot?.mistakePrompt, 'Ne aggódj a hibák miatt!'),
            welcomeMessages: Array.isArray(doc.mascot?.welcomeMessages) && doc.mascot.welcomeMessages.length > 0
              ? doc.mascot.welcomeMessages.map((m: any) => ({
                  text: ensureLocalized(typeof m === 'object' && m?.text ? m.text : m, 'Üdv a kurzuson!'),
                }))
              : [{ text: { hu: 'Üdv a kurzuson!', en: 'Welcome to the course!', ro: 'Bun venit la curs!' } }],
            overconfidentMessages: Array.isArray(doc.mascot?.overconfidentMessages) && doc.mascot.overconfidentMessages.length > 0
              ? doc.mascot.overconfidentMessages.map((m: any) => ({
                  text: ensureLocalized(typeof m === 'object' && m?.text ? m.text : m, 'Nézd át újra!'),
                }))
              : [{ text: { hu: 'Nézd át újra!', en: 'Review carefully!', ro: 'Verifică din nou!' } }],
            streakMessages: Array.isArray(doc.mascot?.streakMessages) && doc.mascot.streakMessages.length > 0
              ? doc.mascot.streakMessages.map((m: any) => ({
                  text: ensureLocalized(typeof m === 'object' && m?.text ? m.text : m, 'Kiváló válaszsorozat!'),
                }))
              : [{ text: { hu: 'Kiváló válaszsorozat!', en: 'Great streak!', ro: 'Serie excelentă!' } }],
            };
          })(),
        });

        const phases: PhaseDraft[] = (doc.phases || []).map((p: any) => {
          let infoContent = p.infoContent;
          if (infoContent) {
            if (typeof infoContent === 'object' && infoContent !== null && !infoContent.root) {
              infoContent = {
                hu: lexicalToMarkdown(infoContent.hu),
                en: lexicalToMarkdown(infoContent.en),
                ro: lexicalToMarkdown(infoContent.ro),
              };
            } else {
              const md = lexicalToMarkdown(infoContent);
              infoContent = { hu: md, en: md, ro: md };
            }
          }
          return {
            ...p,
            title: ensureLocalized(p.title),
            summary: ensureLocalized(p.summary),
            infoContent,
            hintCopy: ensureLocalized(p.hintCopy),
            mascotLine: ensureLocalized(p.mascotLine),
            mascotMistakeLine: ensureLocalized(p.mascotMistakeLine),
            idleHelp: ensureLocalized(p.idleHelp),
            askConfidence: p.askConfidence ?? true,
            maxPoints: p.maxPoints ?? 10,
            quiz: (p.quiz || []).map((q: any) => ({
              question: ensureLocalized(q.question),
              options: (q.options || []).map((opt: any) => ({
                option: ensureLocalized(typeof opt === 'object' && opt?.option ? opt.option : opt),
              })),
              correctIndex: q.correctIndex || 0,
              explanation: ensureLocalized(q.explanation),
            })),
            matching: (p.matching || []).map((m: any) => ({
              left: ensureLocalized(m.left),
              right: ensureLocalized(m.right),
            })),
            ordering: (p.ordering || []).map((o: any) => ({
              text: ensureLocalized(typeof o === 'object' && o?.text ? o.text : o),
            })),
            gapFillContent: p.gapFillContent ? ensureLocalized(p.gapFillContent) : undefined,
            gapFillSolutions: (p.gapFillSolutions || []).map((s: any) => ({
              solution: ensureLocalized(typeof s === 'object' && s?.solution ? s.solution : s),
            })),
            gapFillDecoys: (p.gapFillDecoys || []).map((d: any) => ({
              decoy: ensureLocalized(typeof d === 'object' && d?.decoy ? d.decoy : d),
            })),
          };
        });

        setPhasesList(phases);
      }
    } catch (err) {
      toast.error('Hiba történt a kurzus részleteinek betöltésekor.');
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

  // Mascot welcome messages helpers
  const addMascotWelcomeMsg = () => {
    setCourseForm((prev) => ({
      ...prev,
      mascot: {
        ...prev.mascot,
        welcomeMessages: [
          ...prev.mascot.welcomeMessages,
          { text: { hu: 'Új üdvözlő üzenet!', en: 'New welcome message!', ro: 'Mesaj nou de întâmpinare!' } },
        ],
      },
    }));
  };

  const updateMascotWelcomeMsg = (mIdx: number, text: string, lang: SupportedLang = activeEditorLang) => {
    setCourseForm((prev) => ({
      ...prev,
      mascot: {
        ...prev.mascot,
        welcomeMessages: prev.mascot.welcomeMessages.map((m, i) =>
          i === mIdx ? { text: setLocalizedStr(m.text, lang, text) } : m
        ),
      },
    }));
  };

  const removeMascotWelcomeMsg = (mIdx: number) => {
    setCourseForm((prev) => ({
      ...prev,
      mascot: {
        ...prev.mascot,
        welcomeMessages: prev.mascot.welcomeMessages.filter((_, i) => i !== mIdx),
      },
    }));
  };

  // Mascot overconfident messages helpers
  const addMascotOverconfidentMsg = () => {
    setCourseForm((prev) => ({
      ...prev,
      mascot: {
        ...prev.mascot,
        overconfidentMessages: [
          ...prev.mascot.overconfidentMessages,
          { text: { hu: 'Nézd át újra alaposan a lépéseket!', en: 'Review the steps carefully!', ro: 'Verifică pașii cu atenție!' } },
        ],
      },
    }));
  };

  const updateMascotOverconfidentMsg = (mIdx: number, text: string, lang: SupportedLang = activeEditorLang) => {
    setCourseForm((prev) => ({
      ...prev,
      mascot: {
        ...prev.mascot,
        overconfidentMessages: prev.mascot.overconfidentMessages.map((m, i) =>
          i === mIdx ? { text: setLocalizedStr(m.text, lang, text) } : m
        ),
      },
    }));
  };

  const removeMascotOverconfidentMsg = (mIdx: number) => {
    setCourseForm((prev) => ({
      ...prev,
      mascot: {
        ...prev.mascot,
        overconfidentMessages: prev.mascot.overconfidentMessages.filter((_, i) => i !== mIdx),
      },
    }));
  };

  // Mascot streak messages helpers
  const addMascotStreakMsg = () => {
    setCourseForm((prev) => ({
      ...prev,
      mascot: {
        ...prev.mascot,
        streakMessages: [
          ...prev.mascot.streakMessages,
          { text: { hu: 'Fantasztikus sorozat! Folytasd így tovább!', en: 'Fantastic streak! Keep it up!', ro: 'Serie fantastică! Continuă așa!' } },
        ],
      },
    }));
  };

  const updateMascotStreakMsg = (mIdx: number, text: string, lang: SupportedLang = activeEditorLang) => {
    setCourseForm((prev) => ({
      ...prev,
      mascot: {
        ...prev.mascot,
        streakMessages: prev.mascot.streakMessages.map((m, i) =>
          i === mIdx ? { text: setLocalizedStr(m.text, lang, text) } : m
        ),
      },
    }));
  };

  const removeMascotStreakMsg = (mIdx: number) => {
    setCourseForm((prev) => ({
      ...prev,
      mascot: {
        ...prev.mascot,
        streakMessages: prev.mascot.streakMessages.filter((_, i) => i !== mIdx),
      },
    }));
  };

  // Generate Mascot Copy with AI
  const handleGenerateMascotCopy = async () => {
    setIsGeneratingMascot(true);
    const toastId = toast.loading('🤖 Kabala üzenetek generálása a kurzus témájához...');
    try {
      const topic = getLocalizedStr(courseForm.title, 'hu') || 'Programozás és Algoritmusok';
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'mascot',
          topic,
          mascotName: getLocalizedStr(courseForm.mascot.name, 'hu') || 'Bubi',
        }),
      });
      if (!res.ok) throw new Error('Kabala generálása sikertelen');
      const data = await res.json();
      if (data.mascot) {
        setCourseForm((prev) => ({
          ...prev,
          mascot: {
            ...prev.mascot,
            name: data.mascot.name || prev.mascot.name,
            summonLabel: data.mascot.summonLabel || prev.mascot.summonLabel,
            idlePrompt: data.mascot.idlePrompt || prev.mascot.idlePrompt,
            mistakePrompt: data.mascot.mistakePrompt || prev.mascot.mistakePrompt,
            welcomeMessages: data.mascot.welcomeMessages || prev.mascot.welcomeMessages,
            overconfidentMessages: data.mascot.overconfidentMessages || prev.mascot.overconfidentMessages,
            streakMessages: data.mascot.streakMessages || prev.mascot.streakMessages,
          },
        }));
        toast.success('🤖 Kabala üzenetek sikeresen legenerálva mindhárom nyelven!', { id: toastId });
      }
    } catch (err) {
      toast.error('Hiba történt a kabala generálásakor.', { id: toastId });
    } finally {
      setIsGeneratingMascot(false);
    }
  };

  // Markdown syntax insertion helper
  const insertMarkdownSyntax = (phaseIdx: number, prefix: string, suffix = '') => {
    const currentVal = getLocalizedStr(phasesList[phaseIdx]?.infoContent, activeEditorLang);
    const updated = currentVal ? `${currentVal}\n${prefix}${suffix}` : `${prefix}${suffix}`;
    const newInfoObj = setLocalizedStr(phasesList[phaseIdx]?.infoContent, activeEditorLang, updated);
    updatePhase(phaseIdx, { infoContent: newInfoObj });
  };

  // Auto-translate all Hungarian texts to English and Romanian
  const handleAutoTranslateAll = async () => {
    const itemsToTranslate: Array<{ key: string; hu: string; context?: string }> = [];

    if (courseForm.title.hu) itemsToTranslate.push({ key: 'course.title', hu: courseForm.title.hu, context: 'Course title' });
    if (courseForm.summary.hu) itemsToTranslate.push({ key: 'course.summary', hu: courseForm.summary.hu, context: 'Course summary' });
    if (courseForm.heroTagline.hu) itemsToTranslate.push({ key: 'course.heroTagline', hu: courseForm.heroTagline.hu, context: 'Hero tagline' });

    if (courseForm.mascot.name.hu) itemsToTranslate.push({ key: 'mascot.name', hu: courseForm.mascot.name.hu, context: 'Mascot name' });
    if (courseForm.mascot.summonLabel.hu) itemsToTranslate.push({ key: 'mascot.summonLabel', hu: courseForm.mascot.summonLabel.hu, context: 'Mascot summon button label' });
    if (courseForm.mascot.idlePrompt.hu) itemsToTranslate.push({ key: 'mascot.idlePrompt', hu: courseForm.mascot.idlePrompt.hu, context: 'Mascot idle prompt' });
    if (courseForm.mascot.mistakePrompt.hu) itemsToTranslate.push({ key: 'mascot.mistakePrompt', hu: courseForm.mascot.mistakePrompt.hu, context: 'Mascot mistake prompt' });

    courseForm.mascot.welcomeMessages.forEach((msg, idx) => {
      if (msg.text.hu) itemsToTranslate.push({ key: `mascot.welcome.${idx}`, hu: msg.text.hu, context: 'Mascot welcome message' });
    });
    courseForm.mascot.overconfidentMessages.forEach((msg, idx) => {
      if (msg.text.hu) itemsToTranslate.push({ key: `mascot.overconfident.${idx}`, hu: msg.text.hu, context: 'Mascot overconfident message' });
    });
    courseForm.mascot.streakMessages.forEach((msg, idx) => {
      if (msg.text.hu) itemsToTranslate.push({ key: `mascot.streak.${idx}`, hu: msg.text.hu, context: 'Mascot streak celebration message' });
    });

    phasesList.forEach((phase, pIdx) => {
      const pTitle = getLocalizedStr(phase.title, 'hu');
      const pSummary = getLocalizedStr(phase.summary, 'hu');
      const pHint = getLocalizedStr(phase.hintCopy, 'hu');
      const pMascotLine = getLocalizedStr(phase.mascotLine, 'hu');
      const pMascotMistake = getLocalizedStr(phase.mascotMistakeLine, 'hu');
      const pIdleHelp = getLocalizedStr(phase.idleHelp, 'hu');
      const pInfo = getLocalizedStr(phase.infoContent, 'hu');
      const pGap = getLocalizedStr(phase.gapFillContent, 'hu');

      if (pTitle) itemsToTranslate.push({ key: `phase.${pIdx}.title`, hu: pTitle, context: 'Phase title' });
      if (pSummary) itemsToTranslate.push({ key: `phase.${pIdx}.summary`, hu: pSummary, context: 'Phase description' });
      if (pHint) itemsToTranslate.push({ key: `phase.${pIdx}.hintCopy`, hu: pHint, context: 'Mascot hint' });
      if (pMascotLine) itemsToTranslate.push({ key: `phase.${pIdx}.mascotLine`, hu: pMascotLine, context: 'Mascot cheering line' });
      if (pMascotMistake) itemsToTranslate.push({ key: `phase.${pIdx}.mascotMistakeLine`, hu: pMascotMistake, context: 'Mascot mistake line' });
      if (pIdleHelp) itemsToTranslate.push({ key: `phase.${pIdx}.idleHelp`, hu: pIdleHelp, context: 'Mascot idle help' });
      if (pInfo) itemsToTranslate.push({ key: `phase.${pIdx}.infoContent`, hu: pInfo, context: 'Educational markdown content' });
      if (pGap) itemsToTranslate.push({ key: `phase.${pIdx}.gapFillContent`, hu: pGap, context: 'Gap fill sentence' });

      (phase.quiz || []).forEach((q, qIdx) => {
        const qText = getLocalizedStr(q.question, 'hu');
        const qExp = getLocalizedStr(q.explanation, 'hu');
        if (qText) itemsToTranslate.push({ key: `phase.${pIdx}.quiz.${qIdx}.question`, hu: qText, context: 'Quiz question' });
        if (qExp) itemsToTranslate.push({ key: `phase.${pIdx}.quiz.${qIdx}.explanation`, hu: qExp, context: 'Quiz explanation' });
        q.options.forEach((opt, oIdx) => {
          const optText = getLocalizedStr(opt.option, 'hu');
          if (optText) itemsToTranslate.push({ key: `phase.${pIdx}.quiz.${qIdx}.opt.${oIdx}`, hu: optText, context: 'Quiz option' });
        });
      });

      (phase.matching || []).forEach((m, mIdx) => {
        const left = getLocalizedStr(m.left, 'hu');
        const right = getLocalizedStr(m.right, 'hu');
        if (left) itemsToTranslate.push({ key: `phase.${pIdx}.match.${mIdx}.left`, hu: left, context: 'Matching term' });
        if (right) itemsToTranslate.push({ key: `phase.${pIdx}.match.${mIdx}.right`, hu: right, context: 'Matching definition' });
      });

      (phase.ordering || []).forEach((o, oIdx) => {
        const txt = getLocalizedStr(o.text, 'hu');
        if (txt) itemsToTranslate.push({ key: `phase.${pIdx}.order.${oIdx}`, hu: txt, context: 'Ordering step' });
      });

      (phase.gapFillSolutions || []).forEach((s, sIdx) => {
        const sol = getLocalizedStr(s.solution, 'hu');
        if (sol) itemsToTranslate.push({ key: `phase.${pIdx}.gapSol.${sIdx}`, hu: sol, context: 'Gap solution' });
      });

      (phase.gapFillDecoys || []).forEach((d, dIdx) => {
        const dec = getLocalizedStr(d.decoy, 'hu');
        if (dec) itemsToTranslate.push({ key: `phase.${pIdx}.gapDecoy.${dIdx}`, hu: dec, context: 'Gap decoy' });
      });
    });

    if (itemsToTranslate.length === 0) {
      toast.info('Nincs lefordítandó magyar szöveg.');
      return;
    }

    setIsTranslatingAll(true);
    const toastId = toast.loading(`✨ ${itemsToTranslate.length} mező fordítása angolra és románra...`);
    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToTranslate }),
      });
      if (!res.ok) throw new Error('A fordítás nem sikerült.');
      const data = await res.json();
      const map = new Map<string, { en: string; ro: string }>();
      (data.translations || []).forEach((t: { key: string; en: string; ro: string }) => {
        map.set(t.key, { en: t.en, ro: t.ro });
      });

      // Apply translations to courseForm
      setCourseForm((prev) => {
        const cTitle = map.get('course.title');
        const cSummary = map.get('course.summary');
        const cTagline = map.get('course.heroTagline');
        const mName = map.get('mascot.name');
        const mSummon = map.get('mascot.summonLabel');
        const mIdle = map.get('mascot.idlePrompt');
        const mMistake = map.get('mascot.mistakePrompt');

        return {
          ...prev,
          title: cTitle ? { hu: prev.title.hu, en: cTitle.en, ro: cTitle.ro } : prev.title,
          summary: cSummary ? { hu: prev.summary.hu, en: cSummary.en, ro: cSummary.ro } : prev.summary,
          heroTagline: cTagline ? { hu: prev.heroTagline.hu, en: cTagline.en, ro: cTagline.ro } : prev.heroTagline,
          mascot: {
            ...prev.mascot,
            name: mName ? { hu: prev.mascot.name.hu, en: mName.en, ro: mName.ro } : prev.mascot.name,
            summonLabel: mSummon ? { hu: prev.mascot.summonLabel.hu, en: mSummon.en, ro: mSummon.ro } : prev.mascot.summonLabel,
            idlePrompt: mIdle ? { hu: prev.mascot.idlePrompt.hu, en: mIdle.en, ro: mIdle.ro } : prev.mascot.idlePrompt,
            mistakePrompt: mMistake ? { hu: prev.mascot.mistakePrompt.hu, en: mMistake.en, ro: mMistake.ro } : prev.mascot.mistakePrompt,
            welcomeMessages: prev.mascot.welcomeMessages.map((msg, idx) => {
              const tr = map.get(`mascot.welcome.${idx}`);
              return tr ? { text: { hu: msg.text.hu, en: tr.en, ro: tr.ro } } : msg;
            }),
            overconfidentMessages: prev.mascot.overconfidentMessages.map((msg, idx) => {
              const tr = map.get(`mascot.overconfident.${idx}`);
              return tr ? { text: { hu: msg.text.hu, en: tr.en, ro: tr.ro } } : msg;
            }),
            streakMessages: prev.mascot.streakMessages.map((msg, idx) => {
              const tr = map.get(`mascot.streak.${idx}`);
              return tr ? { text: { hu: msg.text.hu, en: tr.en, ro: tr.ro } } : msg;
            }),
          },
        };
      });

      // Apply translations to phasesList
      setPhasesList((prev) =>
        prev.map((phase, pIdx) => {
          const pTitle = map.get(`phase.${pIdx}.title`);
          const pSummary = map.get(`phase.${pIdx}.summary`);
          const pHint = map.get(`phase.${pIdx}.hintCopy`);
          const pMascotLine = map.get(`phase.${pIdx}.mascotLine`);
          const pMascotMistake = map.get(`phase.${pIdx}.mascotMistakeLine`);
          const pIdleHelp = map.get(`phase.${pIdx}.idleHelp`);
          const pInfo = map.get(`phase.${pIdx}.infoContent`);
          const pGap = map.get(`phase.${pIdx}.gapFillContent`);

          const updatedPhase: PhaseDraft = {
            ...phase,
            title: pTitle ? { hu: getLocalizedStr(phase.title, 'hu'), en: pTitle.en, ro: pTitle.ro } : phase.title,
            summary: pSummary ? { hu: getLocalizedStr(phase.summary, 'hu'), en: pSummary.en, ro: pSummary.ro } : phase.summary,
            hintCopy: pHint ? { hu: getLocalizedStr(phase.hintCopy, 'hu'), en: pHint.en, ro: pHint.ro } : phase.hintCopy,
            mascotLine: pMascotLine ? { hu: getLocalizedStr(phase.mascotLine, 'hu'), en: pMascotLine.en, ro: pMascotLine.ro } : phase.mascotLine,
            mascotMistakeLine: pMascotMistake ? { hu: getLocalizedStr(phase.mascotMistakeLine, 'hu'), en: pMascotMistake.en, ro: pMascotMistake.ro } : phase.mascotMistakeLine,
            idleHelp: pIdleHelp ? { hu: getLocalizedStr(phase.idleHelp, 'hu'), en: pIdleHelp.en, ro: pIdleHelp.ro } : phase.idleHelp,
            infoContent: pInfo ? { hu: getLocalizedStr(phase.infoContent, 'hu'), en: pInfo.en, ro: pInfo.ro } : phase.infoContent,
            gapFillContent: pGap ? { hu: getLocalizedStr(phase.gapFillContent, 'hu'), en: pGap.en, ro: pGap.ro } : phase.gapFillContent,
            quiz: (phase.quiz || []).map((q, qIdx) => {
              const qText = map.get(`phase.${pIdx}.quiz.${qIdx}.question`);
              const qExp = map.get(`phase.${pIdx}.quiz.${qIdx}.explanation`);
              return {
                ...q,
                question: qText ? { hu: getLocalizedStr(q.question, 'hu'), en: qText.en, ro: qText.ro } : q.question,
                explanation: qExp ? { hu: getLocalizedStr(q.explanation, 'hu'), en: qExp.en, ro: qExp.ro } : q.explanation,
                options: q.options.map((opt, oIdx) => {
                  const oTr = map.get(`phase.${pIdx}.quiz.${qIdx}.opt.${oIdx}`);
                  return oTr ? { option: { hu: getLocalizedStr(opt.option, 'hu'), en: oTr.en, ro: oTr.ro } } : opt;
                }),
              };
            }),
            matching: (phase.matching || []).map((m, mIdx) => {
              const lTr = map.get(`phase.${pIdx}.match.${mIdx}.left`);
              const rTr = map.get(`phase.${pIdx}.match.${mIdx}.right`);
              return {
                left: lTr ? { hu: getLocalizedStr(m.left, 'hu'), en: lTr.en, ro: lTr.ro } : m.left,
                right: rTr ? { hu: getLocalizedStr(m.right, 'hu'), en: rTr.en, ro: rTr.ro } : m.right,
              };
            }),
            ordering: (phase.ordering || []).map((o, oIdx) => {
              const oTr = map.get(`phase.${pIdx}.order.${oIdx}`);
              return {
                text: oTr ? { hu: getLocalizedStr(o.text, 'hu'), en: oTr.en, ro: oTr.ro } : o.text,
              };
            }),
            gapFillSolutions: (phase.gapFillSolutions || []).map((s, sIdx) => {
              const sTr = map.get(`phase.${pIdx}.gapSol.${sIdx}`);
              return {
                solution: sTr ? { hu: getLocalizedStr(s.solution, 'hu'), en: sTr.en, ro: sTr.ro } : s.solution,
              };
            }),
            gapFillDecoys: (phase.gapFillDecoys || []).map((d, dIdx) => {
              const dTr = map.get(`phase.${pIdx}.gapDecoy.${dIdx}`);
              return {
                decoy: dTr ? { hu: getLocalizedStr(d.decoy, 'hu'), en: dTr.en, ro: dTr.ro } : d.decoy,
              };
            }),
          };
          return updatedPhase;
        })
      );

      toast.success(`✨ ${map.size} szöveg sikeresen lefordítva angolra és románra!`, { id: toastId });
    } catch (err) {
      toast.error('Hiba történt az automatikus fordítás során.', { id: toastId });
    } finally {
      setIsTranslatingAll(false);
    }
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
              question: { hu: 'Új kérdés szövege...', en: 'New question text...', ro: 'Textul întrebării noi...' },
              options: [
                { option: { hu: 'A válaszlehetőség', en: 'Option A', ro: 'Opțiunea A' } },
                { option: { hu: 'B válaszlehetőség', en: 'Option B', ro: 'Opțiunea B' } },
                { option: { hu: 'C válaszlehetőség', en: 'Option C', ro: 'Opțiunea C' } },
              ],
              correctIndex: 0,
              explanation: { hu: '', en: '', ro: '' },
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
          quiz: (p.quiz || []).map((q, i) =>
            i === qIdx ? { ...q, question: setLocalizedStr(q.question, activeEditorLang, text) } : q
          ),
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
            updatedOpts[optIdx] = { option: setLocalizedStr(updatedOpts[optIdx].option, activeEditorLang, text) };
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
            const count = q.options.length + 1;
            return {
              ...q,
              options: [
                ...q.options,
                { option: { hu: `Új válaszlehetőség ${count}`, en: `New option ${count}`, ro: `Opțiune nouă ${count}` } },
              ],
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

  const updateQuizExplanation = (phaseIdx: number, qIdx: number, text: string) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        return {
          ...p,
          quiz: (p.quiz || []).map((q, i) =>
            i === qIdx ? { ...q, explanation: setLocalizedStr(q.explanation, activeEditorLang, text) } : q
          ),
        };
      })
    );
  };

  const deletePhase = (phaseIdx: number) => {
    if (phasesList.length <= 1) {
      toast.error('Legalább egy fázisnak maradnia kell a kurzusban!');
      return;
    }
    setPhasesList((prev) => prev.filter((_, idx) => idx !== phaseIdx));
    if (expandedPhaseIdx === phaseIdx) setExpandedPhaseIdx(null);
  };

  const addPhase = () => {
    const nextNumber = phasesList.length + 1;
    const newPhase: PhaseDraft = {
      phaseId: `phase-${nextNumber}-${Date.now().toString(36)}`,
      title: {
        hu: `${nextNumber}. Új lépés`,
        en: `${nextNumber}. New step`,
        ro: `${nextNumber}. Pas nou`,
      },
      sourceView: 'info',
      sourceAlgorithmId: 'general',
      summary: {
        hu: 'Rövid leírás a lépés céljáról...',
        en: 'Brief description of the step goal...',
        ro: 'Scurtă descriere a pasului...',
      },
      maxPoints: 10,
      askConfidence: true,
      infoContent: {
        hu: '## Új tananyag fejezet\n\nÍrd ide a magyarázatot...',
        en: '## New topic chapter\n\nWrite explanation here...',
        ro: '## Capitol nou de învățare\n\nScrie explicația aici...',
      },
      hintCopy: {
        hu: '💡 Tipp a lépés sikeres teljesítéséhez!',
        en: '💡 Tip for completing this step!',
        ro: '💡 Sfat pentru finalizarea pasului!',
      },
      mascotLine: {
        hu: 'Lássunk neki ennek a lépésnek!',
        en: "Let's tackle this step!",
        ro: 'Să începem acest pas!',
      },
      mascotMistakeLine: {
        hu: 'Semmi baj, próbáld újra!',
        en: "No problem, try again!",
        ro: 'Nicio problemă, încearcă din nou!',
      },
      idleHelp: {
        hu: 'Ha elakadtál, kérdezz bátran!',
        en: 'If you are stuck, feel free to ask!',
        ro: 'Dacă te-ai blocat, întreabă cu încredere!',
      },
    };
    setPhasesList((prev) => [...prev, newPhase]);
    setExpandedPhaseIdx(phasesList.length);
  };

  const addPhaseOfType = (sourceView: string) => {
    const nextNumber = phasesList.length + 1;
    const typeTitles: Record<string, LocalizedTextObj> = {
      info: { hu: `${nextNumber}. Elméleti áttekintés`, en: `${nextNumber}. Theory Overview`, ro: `${nextNumber}. Prezentare teoretică` },
      quiz: { hu: `${nextNumber}. Ellenőrző Kvíz`, en: `${nextNumber}. Knowledge Check Quiz`, ro: `${nextNumber}. Chestionar de verificare` },
      'gap-fill': { hu: `${nextNumber}. Hiánypótló feladat`, en: `${nextNumber}. Fill in the Blanks`, ro: `${nextNumber}. Completare spații libere` },
      match: { hu: `${nextNumber}. Fogalom párosítás`, en: `${nextNumber}. Concept Matching`, ro: `${nextNumber}. Asociere concepte` },
      order: { hu: `${nextNumber}. Lépések sorrendezése`, en: `${nextNumber}. Step Ordering`, ro: `${nextNumber}. Ordonarea pașilor` },
      debug: { hu: `${nextNumber}. Kód hibakeresés (Debug)`, en: `${nextNumber}. Code Debugging`, ro: `${nextNumber}. Depanare cod` },
      video: { hu: `${nextNumber}. Oktatóvideó megtekintése`, en: `${nextNumber}. Video Lesson`, ro: `${nextNumber}. Lecție video` },
      control: { hu: `${nextNumber}. Interaktív szimuláció`, en: `${nextNumber}. Interactive Simulation`, ro: `${nextNumber}. Simulare interactivă` },
    };

    const newPhase: PhaseDraft = {
      phaseId: `phase-${nextNumber}-${Date.now().toString(36)}`,
      title: typeTitles[sourceView] || { hu: `${nextNumber}. Új lépés`, en: `${nextNumber}. New step`, ro: `${nextNumber}. Pas nou` },
      sourceView,
      sourceAlgorithmId: 'general',
      summary: {
        hu: 'Rövid leírás a lépés céljáról...',
        en: 'Brief description of the step goal...',
        ro: 'Scurtă descriere a pasului...',
      },
      maxPoints: sourceView === 'info' || sourceView === 'video' ? 10 : 20,
      askConfidence: sourceView !== 'info' && sourceView !== 'video',
      infoContent: {
        hu: '## Új tananyag fejezet\n\nÍrd ide a magyarázatot...',
        en: '## New topic chapter\n\nWrite explanation here...',
        ro: '## Capitol nou de învățare\n\nScrie explicația aici...',
      },
      quiz:
        sourceView === 'quiz'
          ? [
              {
                question: { hu: '1. Kérdés szövege...', en: '1. Question text...', ro: '1. Textul întrebării...' },
                options: [
                  { option: { hu: 'Helyes válasz', en: 'Correct answer', ro: 'Răspuns corect' } },
                  { option: { hu: 'Második lehetőség', en: 'Second option', ro: 'A doua opțiune' } },
                  { option: { hu: 'Harmadik lehetőség', en: 'Third option', ro: 'A treia opțiune' } },
                ],
                correctIndex: 0,
                explanation: { hu: 'Magyarázat a helyes válaszhoz...', en: 'Explanation...', ro: 'Explicație...' },
              },
            ]
          : [],
      gapFillContent:
        sourceView === 'gap-fill'
          ? {
              hu: 'Egészítsd ki a hiányzó részt: A ciklus minden lépésben {{gap}} értékkel növeli a számlálót.',
              en: 'Fill in the blank: The loop increments the counter by {{gap}} on each step.',
              ro: 'Completează spațiul: Bucla incrementează contorul cu {{gap}} la fiecare pas.',
            }
          : undefined,
      gapFillSolutions:
        sourceView === 'gap-fill' ? [{ solution: { hu: '1', en: '1', ro: '1' } }] : [],
      gapFillDecoys:
        sourceView === 'gap-fill'
          ? [
              { decoy: { hu: '0', en: '0', ro: '0' } },
              { decoy: { hu: '-1', en: '-1', ro: '-1' } },
            ]
          : [],
      matching:
        sourceView === 'match'
          ? [
              {
                left: { hu: '1. Fogalom', en: '1. Term', ro: '1. Termen' },
                right: { hu: '1. Meghatározás', en: '1. Definition', ro: '1. Definiție' },
              },
              {
                left: { hu: '2. Fogalom', en: '2. Term', ro: '2. Termen' },
                right: { hu: '2. Meghatározás', en: '2. Definition', ro: '2. Definiție' },
              },
            ]
          : [],
      ordering:
        sourceView === 'order'
          ? [
              { text: { hu: '1. Első lépés végrehajtása', en: '1. Execute first step', ro: '1. Execută primul pas' } },
              { text: { hu: '2. Második lépés ellenőrzése', en: '2. Check second step', ro: '2. Verifică al doilea pas' } },
              { text: { hu: '3. Eredmény kiírása', en: '3. Output result', ro: '3. Afișează rezultatul' } },
            ]
          : [],
      debugCode: sourceView === 'debug' ? 'function add(a, b) {\n  return a - b; // Hiba itt!\n}' : '',
      expectedCode: sourceView === 'debug' ? 'function add(a, b) {\n  return a + b;\n}' : '',
      hintCopy: {
        hu: '💡 Tipp a lépés sikeres teljesítéséhez!',
        en: '💡 Tip for completing this step!',
        ro: '💡 Sfat pentru finalizarea pasului!',
      },
      mascotLine: {
        hu: 'Lássunk neki ennek a lépésnek!',
        en: "Let's tackle this step!",
        ro: 'Să începem acest pas!',
      },
      mascotMistakeLine: {
        hu: 'Semmi baj, próbáld újra!',
        en: 'No problem, try again!',
        ro: 'Nicio problemă, încearcă din nou!',
      },
      idleHelp: {
        hu: 'Ha elakadtál, kérdezz bátran!',
        en: 'If you are stuck, feel free to ask!',
        ro: 'Dacă te-ai blocat, întreabă cu încredere!',
      },
    };
    setPhasesList((prev) => [...prev, newPhase]);
    setExpandedPhaseIdx(phasesList.length);
  };

  const duplicatePhase = (phaseIdx: number) => {
    const source = phasesList[phaseIdx];
    if (!source) return;
    const copy: PhaseDraft = JSON.parse(JSON.stringify(source));
    copy.phaseId = `phase-${phasesList.length + 1}-${Date.now().toString(36)}`;
    copy.title = {
      hu: `${getLocalizedStr(source.title, 'hu')} (Másolat)`,
      en: `${getLocalizedStr(source.title, 'en')} (Copy)`,
      ro: `${getLocalizedStr(source.title, 'ro')} (Copie)`,
    };
    setPhasesList((prev) => {
      const next = [...prev];
      next.splice(phaseIdx + 1, 0, copy);
      return next;
    });
    setExpandedPhaseIdx(phaseIdx + 1);
    toast.success('Lépés sikeresen lemásolva!');
  };

  const applyCourseTemplate = (tpl: 'algo_classic' | 'quick_quiz' | 'code_debug') => {
    const nowId = Date.now().toString(36);
    if (tpl === 'algo_classic') {
      setCourseForm((prev) => ({
        ...prev,
        estimatedMinutes: 25,
        icon: '🚀',
      }));
      setPhasesList([
        {
          phaseId: `phase-1-${nowId}`,
          title: { hu: '1. Elméleti alapozás és működési elv', en: '1. Theory & Core Principles', ro: '1. Bazele teoretice' },
          sourceView: 'info',
          sourceAlgorithmId: 'general',
          summary: { hu: 'A témakör kulcsfogalmainak és logikájának bemutatása.', en: 'Core concepts and logic.', ro: 'Concepte cheie.' },
          maxPoints: 10,
          askConfidence: false,
          infoContent: {
            hu: '## 1. Hogyan működik?\n\nÍrd ide a legfontosabb alapfogalmakat és egy rövid példát.\n\n- **1. szabály:** Alapfeltétel\n- **2. szabály:** Ismétlődő lépés',
            en: '## 1. How does it work?\n\nWrite the core concepts here.',
            ro: '## 1. Cum funcționează?\n\nScrie conceptele de bază aici.',
          },
        },
        {
          phaseId: `phase-2-${nowId}`,
          title: { hu: '2. Kulcsfogalmak párosítása', en: '2. Concept Matching', ro: '2. Asocierea conceptelor' },
          sourceView: 'match',
          sourceAlgorithmId: 'general',
          summary: { hu: 'Kösd össze a fogalmakat a hozzájuk tartozó definícióval!', en: 'Match the concepts!', ro: 'Asociază conceptele!' },
          maxPoints: 15,
          askConfidence: true,
          matching: [
            { left: { hu: 'Időbonyolultság', en: 'Time Complexity', ro: 'Complexitate în timp' }, right: { hu: 'A lépésszám növekedése a bemenet függvényében', en: 'Growth of steps', ro: 'Creșterea numărului de pași' } },
            { left: { hu: 'Iteráció', en: 'Iteration', ro: 'Iterație' }, right: { hu: 'Utasítások ciklikus ismétlése', en: 'Cyclic repetition', ro: 'Repetare ciclică' } },
          ],
        },
        {
          phaseId: `phase-3-${nowId}`,
          title: { hu: '3. Kód / Szabály hiánypótlás', en: '3. Code Gap-Fill', ro: '3. Completare cod' },
          sourceView: 'gap-fill',
          sourceAlgorithmId: 'general',
          summary: { hu: 'Pótold a hiányzó kifejezéseket a kódban!', en: 'Fill in the missing expressions!', ro: 'Completează expresiile lipsă!' },
          maxPoints: 20,
          askConfidence: true,
          gapFillContent: {
            hu: 'for (let i = 0; i < tomb.{{gap}}; i++) {\n  console.log(tomb[i]);\n}',
            en: 'for (let i = 0; i < arr.{{gap}}; i++) {\n  console.log(arr[i]);\n}',
            ro: 'for (let i = 0; i < arr.{{gap}}; i++) {\n  console.log(arr[i]);\n}',
          },
          gapFillSolutions: [{ solution: { hu: 'length', en: 'length', ro: 'length' } }],
          gapFillDecoys: [{ decoy: { hu: 'size', en: 'size', ro: 'size' } }, { decoy: { hu: 'count', en: 'count', ro: 'count' } }],
        },
        {
          phaseId: `phase-4-${nowId}`,
          title: { hu: '4. Záró ellenőrző kvíz', en: '4. Final Quiz', ro: '4. Chestionar final' },
          sourceView: 'quiz',
          sourceAlgorithmId: 'general',
          summary: { hu: 'Teszteld a megszerzett tudásodat!', en: 'Test your knowledge!', ro: 'Testează-ți cunoștințele!' },
          maxPoints: 25,
          askConfidence: true,
          quiz: [
            {
              question: { hu: 'Melyik állítás igaz az alábbiak közül?', en: 'Which statement is true?', ro: 'Care afirmație este adevărată?' },
              options: [
                { option: { hu: 'Az első válasz (Helyes)', en: 'First option (Correct)', ro: 'Prima opțiune (Corect)' } },
                { option: { hu: 'Második válasz', en: 'Second option', ro: 'A doua opțiune' } },
                { option: { hu: 'Harmadik válasz', en: 'Third option', ro: 'A treia opțiune' } },
              ],
              correctIndex: 0,
              explanation: { hu: 'Mert ez felel meg a definíciónak.', en: 'Matches the definition.', ro: 'Corespunde definiției.' },
            },
          ],
        },
      ]);
      toast.success('🚀 Klasszikus 4-lépéses kurzussablon betöltve!');
    } else if (tpl === 'quick_quiz') {
      setCourseForm((prev) => ({
        ...prev,
        estimatedMinutes: 15,
        icon: '⚡',
      }));
      setPhasesList([
        {
          phaseId: `phase-1-${nowId}`,
          title: { hu: '1. Gyors összefoglaló (Puskázó)', en: '1. Quick Cheat-Sheet', ro: '1. Rezumat rapid' },
          sourceView: 'info',
          sourceAlgorithmId: 'general',
          summary: { hu: 'Rövid áttekintés a teszt előtt.', en: 'Short review before the quiz.', ro: 'Scurtă recapitulare.' },
          maxPoints: 10,
          askConfidence: false,
          infoContent: {
            hu: '## Fontos tudnivalók a teszthez\n\n- 1. kulcspont\n- 2. kulcspont',
            en: '## Key takeaways\n\n- Point 1\n- Point 2',
            ro: '## Idei principale\n\n- Punctul 1\n- Punctul 2',
          },
        },
        {
          phaseId: `phase-2-${nowId}`,
          title: { hu: '2. Lépések helyes sorrendje', en: '2. Step Ordering', ro: '2. Ordonarea pașilor' },
          sourceView: 'order',
          sourceAlgorithmId: 'general',
          summary: { hu: 'Állítsd helyes sorrendbe a folyamat lépéseit!', en: 'Order the steps!', ro: 'Ordonează pașii!' },
          maxPoints: 15,
          askConfidence: true,
          ordering: [
            { text: { hu: '1. Adatok bekérése és ellenőrzése', en: '1. Input & validation', ro: '1. Citirea datelor' } },
            { text: { hu: '2. Feldolgozás és számítás', en: '2. Processing', ro: '2. Procesarea datelor' } },
            { text: { hu: '3. Eredmény megjelenítése', en: '3. Display output', ro: '3. Afișarea rezultatului' } },
          ],
        },
        {
          phaseId: `phase-3-${nowId}`,
          title: { hu: '3. Tudásfelmérő Kvíz', en: '3. Assessment Quiz', ro: '3. Chestionar de evaluare' },
          sourceView: 'quiz',
          sourceAlgorithmId: 'general',
          summary: { hu: 'Válaszolj a feleletválasztós kérdésekre!', en: 'Answer the multiple-choice questions!', ro: 'Răspunde la întrebări!' },
          maxPoints: 25,
          askConfidence: true,
          quiz: [
            {
              question: { hu: '1. Ellenőrző kérdés...', en: '1. Check question...', ro: '1. Întrebare de verificare...' },
              options: [
                { option: { hu: 'A válasz (Helyes)', en: 'Option A (Correct)', ro: 'Opțiunea A (Corect)' } },
                { option: { hu: 'B válasz', en: 'Option B', ro: 'Opțiunea B' } },
                { option: { hu: 'C válasz', en: 'Option C', ro: 'Opțiunea C' } },
              ],
              correctIndex: 0,
              explanation: { hu: 'Rövid indoklás...', en: 'Short explanation...', ro: 'Scurtă explicație...' },
            },
          ],
        },
      ]);
      toast.success('⚡ Gyors 3-lépéses tudáspróba sablon betöltve!');
    } else if (tpl === 'code_debug') {
      setCourseForm((prev) => ({
        ...prev,
        estimatedMinutes: 20,
        icon: '🐞',
      }));
      setPhasesList([
        {
          phaseId: `phase-1-${nowId}`,
          title: { hu: '1. Kódolási minták és gyakori hibák', en: '1. Coding Patterns & Bugs', ro: '1. Șabloane de cod și erori' },
          sourceView: 'info',
          sourceAlgorithmId: 'general',
          summary: { hu: 'Mire figyeljünk a kód írása és javítása közben?', en: 'What to watch out for?', ro: 'La ce să fim atenți?' },
          maxPoints: 10,
          askConfidence: false,
          infoContent: {
            hu: '## Gyakori kódolási hibák\n\n```python\n# Figyelj a ciklushatárokra!\nfor i in range(len(arr)):\n    print(arr[i])\n```',
            en: '## Common coding bugs\n\n```python\nfor i in range(len(arr)):\n    print(arr[i])\n```',
            ro: '## Erori frecvente\n\n```python\nfor i in range(len(arr)):\n    print(arr[i])\n```',
          },
        },
        {
          phaseId: `phase-2-${nowId}`,
          title: { hu: '2. Kódkiegészítés (Gap-Fill)', en: '2. Code Completion', ro: '2. Completare cod' },
          sourceView: 'gap-fill',
          sourceAlgorithmId: 'general',
          summary: { hu: 'Egészítsd ki a hiányzó kulcsszót!', en: 'Fill in the missing keyword!', ro: 'Completează cuvântul cheie!' },
          maxPoints: 20,
          askConfidence: true,
          gapFillContent: {
            hu: 'function sum(a, b) {\n  {{gap}} a + b;\n}',
            en: 'function sum(a, b) {\n  {{gap}} a + b;\n}',
            ro: 'function sum(a, b) {\n  {{gap}} a + b;\n}',
          },
          gapFillSolutions: [{ solution: { hu: 'return', en: 'return', ro: 'return' } }],
          gapFillDecoys: [{ decoy: { hu: 'break', en: 'break', ro: 'break' } }],
        },
        {
          phaseId: `phase-3-${nowId}`,
          title: { hu: '3. Kód hibakeresés (Bugfix)', en: '3. Code Debugging', ro: '3. Depanare cod' },
          sourceView: 'debug',
          sourceAlgorithmId: 'general',
          summary: { hu: 'Találd meg és javítsd ki a hibát a kódban!', en: 'Find and fix the bug!', ro: 'Găsește și repară eroarea!' },
          maxPoints: 30,
          askConfidence: true,
          debugCode: 'function isEven(n) {\n  return n % 2 === 1;\n}',
          expectedCode: 'function isEven(n) {\n  return n % 2 === 0;\n}',
        },
      ]);
      toast.success('🐞 3-lépéses Kódolási & Debug sablon betöltve!');
    }
    setExpandedPhaseIdx(0);
  };

  const applyMascotPersonality = (preset: 'friendly' | 'mentor' | 'coach') => {
    if (preset === 'friendly') {
      setCourseForm((prev) => ({
        ...prev,
        mascot: {
          ...prev.mascot,
          enabled: true,
          mode: prev.mascot.mode === 'disabled' ? 'ai-fallback' : prev.mascot.mode,
          name: { hu: 'Bubi', en: 'Bubi', ro: 'Bubi' },
          asset: 'algo_group_109.svg',
          accentColor: '#269984',
          idleTriggerSeconds: 30,
          mistakeTriggerCount: 2,
          summonLabel: { hu: 'Segítség kérése Bubitól', en: 'Ask Bubi for help', ro: 'Cere ajutor lui Bubi' },
          idlePrompt: { hu: 'Elakadtál? Szívesen adok egy kis tippet!', en: 'Stuck? Happy to give you a hint!', ro: 'Te-ai blocat? Îți ofer un indiciu!' },
          mistakePrompt: { hu: 'Semmi gond, a hibákból tanulunk a legtöbbet! Próbáljuk újra!', en: "No worries, we learn from mistakes! Let's try again!", ro: 'Nicio problemă, din greșeli învățăm!' },
        },
      }));
      toast.success('🌱 Barátságos Bubi személyiség beállítva!');
    } else if (preset === 'mentor') {
      setCourseForm((prev) => ({
        ...prev,
        mascot: {
          ...prev.mascot,
          enabled: true,
          mode: prev.mascot.mode === 'disabled' ? 'ai-fallback' : prev.mascot.mode,
          name: { hu: 'Prof. Algo', en: 'Prof. Algo', ro: 'Prof. Algo' },
          asset: 'algo_group_166.svg',
          accentColor: '#2563eb',
          idleTriggerSeconds: 40,
          mistakeTriggerCount: 2,
          summonLabel: { hu: 'Szakmai tipp kérése', en: 'Request mentor hint', ro: 'Cere sfatul mentorului' },
          idlePrompt: { hu: 'Gondold végig a bemeneti feltételeket. Kérsz egy logikai támpontot?', en: 'Consider the input conditions. Need a logical clue?', ro: 'Analizează condițiile de intrare.' },
          mistakePrompt: { hu: 'Vizsgáljuk meg, hol tért el a futás a várt eredménytől.', en: 'Let us examine where the execution diverged.', ro: 'Să analizăm unde a apărut diferența.' },
        },
      }));
      toast.success('🎯 Szakmai Mentor (Prof. Algo) személyiség beállítva!');
    } else if (preset === 'coach') {
      setCourseForm((prev) => ({
        ...prev,
        mascot: {
          ...prev.mascot,
          enabled: true,
          mode: prev.mascot.mode === 'disabled' ? 'ai-fallback' : prev.mascot.mode,
          name: { hu: 'Turbo', en: 'Turbo', ro: 'Turbo' },
          asset: 'bubble_dragon.png',
          accentColor: '#ea580c',
          idleTriggerSeconds: 25,
          mistakeTriggerCount: 2,
          summonLabel: { hu: 'Gyors tipp!', en: 'Power hint!', ro: 'Indiciu rapid!' },
          idlePrompt: { hu: 'Ne állj meg, már nagyon közel vagy a megoldáshoz! Csapjunk bele!', en: "Don't stop now, you're super close!", ro: 'Nu te opri, ești foarte aproape!' },
          mistakePrompt: { hu: 'Majdnem megvolt! Rázd le magadról és mutasd meg, mit tudsz!', en: 'Almost had it! Shake it off and try again!', ro: 'Aproape ai reușit! Încearcă din nou!' },
        },
      }));
      toast.success('🔥 Motiváló Edző (Turbo) személyiség beállítva!');
    }
  };

  // Gap fill helpers
  const addGapSolution = (phaseIdx: number) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        return {
          ...p,
          gapFillSolutions: [
            ...(p.gapFillSolutions || []),
            { solution: { hu: 'megoldás', en: 'solution', ro: 'soluție' } },
          ],
        };
      })
    );
  };

  const updateGapSolution = (phaseIdx: number, solIdx: number, text: string) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        const list = [...(p.gapFillSolutions || [])];
        if (list[solIdx]) {
          list[solIdx] = { solution: setLocalizedStr(list[solIdx].solution, activeEditorLang, text) };
        }
        return { ...p, gapFillSolutions: list };
      })
    );
  };

  const removeGapSolution = (phaseIdx: number, solIdx: number) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        return {
          ...p,
          gapFillSolutions: (p.gapFillSolutions || []).filter((_, i) => i !== solIdx),
        };
      })
    );
  };

  const addGapDecoy = (phaseIdx: number) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        return {
          ...p,
          gapFillDecoys: [
            ...(p.gapFillDecoys || []),
            { decoy: { hu: 'hibás_szó', en: 'wrong_word', ro: 'cuvânt_greșit' } },
          ],
        };
      })
    );
  };

  const updateGapDecoy = (phaseIdx: number, decIdx: number, text: string) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        const list = [...(p.gapFillDecoys || [])];
        if (list[decIdx]) {
          list[decIdx] = { decoy: setLocalizedStr(list[decIdx].decoy, activeEditorLang, text) };
        }
        return { ...p, gapFillDecoys: list };
      })
    );
  };

  const removeGapDecoy = (phaseIdx: number, decIdx: number) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        return {
          ...p,
          gapFillDecoys: (p.gapFillDecoys || []).filter((_, i) => i !== decIdx),
        };
      })
    );
  };

  // Match helpers
  const addMatchPair = (phaseIdx: number) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        return {
          ...p,
          matching: [
            ...(p.matching || []),
            {
              left: { hu: 'Új fogalom', en: 'New term', ro: 'Termen nou' },
              right: { hu: 'Meghatározás', en: 'Definition', ro: 'Definiție' },
            },
          ],
        };
      })
    );
  };

  const updateMatchPair = (phaseIdx: number, mIdx: number, side: 'left' | 'right', text: string) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        const list = [...(p.matching || [])];
        if (list[mIdx]) {
          list[mIdx] = {
            ...list[mIdx],
            [side]: setLocalizedStr(list[mIdx][side], activeEditorLang, text),
          };
        }
        return { ...p, matching: list };
      })
    );
  };

  const removeMatchPair = (phaseIdx: number, mIdx: number) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        return {
          ...p,
          matching: (p.matching || []).filter((_, i) => i !== mIdx),
        };
      })
    );
  };

  // Ordering helpers
  const addOrderItem = (phaseIdx: number) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        const count = (p.ordering || []).length + 1;
        return {
          ...p,
          ordering: [
            ...(p.ordering || []),
            { text: { hu: `${count}. lépés leírása`, en: `Step ${count} description`, ro: `Descrierea pasului ${count}` } },
          ],
        };
      })
    );
  };

  const updateOrderItem = (phaseIdx: number, oIdx: number, text: string) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        const list = [...(p.ordering || [])];
        if (list[oIdx]) {
          list[oIdx] = { text: setLocalizedStr(list[oIdx].text, activeEditorLang, text) };
        }
        return { ...p, ordering: list };
      })
    );
  };

  const removeOrderItem = (phaseIdx: number, oIdx: number) => {
    setPhasesList((prev) =>
      prev.map((p, idx) => {
        if (idx !== phaseIdx) return p;
        return {
          ...p,
          ordering: (p.ordering || []).filter((_, i) => i !== oIdx),
        };
      })
    );
  };

  // Language completeness calculation
  const filledLangs = useMemo(() => {
    return (['hu', 'en', 'ro'] as SupportedLang[]).filter((l) =>
      Boolean(courseForm.title?.[l]?.trim())
    );
  }, [courseForm.title]);
  const missingLangCount = 3 - filledLangs.length;

  const handleSaveCourseForm = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    const hasAtLeastOneTitle = Boolean(
      courseForm.title?.hu?.trim() ||
      courseForm.title?.en?.trim() ||
      courseForm.title?.ro?.trim()
    );

    if (!hasAtLeastOneTitle || !courseForm.slug.trim()) {
      toast.error('Legalább egy nyelven meg kell adnod a kurzus címét és az URL azonosítót (slug)!');
      return;
    }

    setSavingCourse(true);
    try {
      const primaryLang = filledLangs[0] || activeEditorLang;
      const fallbackTitle = courseForm.title[primaryLang] || '';
      const fallbackSummary = courseForm.summary[primaryLang] || '';
      const fallbackHero = courseForm.heroTagline[primaryLang] || '';

      const payloadBody = {
        title: {
          hu: courseForm.title.hu?.trim() || fallbackTitle,
          en: courseForm.title.en?.trim() || fallbackTitle,
          ro: courseForm.title.ro?.trim() || fallbackTitle,
        },
        slug: courseForm.slug.trim(),
        summary: {
          hu: courseForm.summary.hu?.trim() || fallbackSummary,
          en: courseForm.summary.en?.trim() || fallbackSummary,
          ro: courseForm.summary.ro?.trim() || fallbackSummary,
        },
        heroTagline: {
          hu: courseForm.heroTagline.hu?.trim() || fallbackHero,
          en: courseForm.heroTagline.en?.trim() || fallbackHero,
          ro: courseForm.heroTagline.ro?.trim() || fallbackHero,
        },
        difficulty: courseForm.difficulty,
        estimatedMinutes: courseForm.estimatedMinutes,
        visibility: courseForm.visibility,
        isOfficial: courseForm.isOfficial,
        icon: courseForm.icon,
        accentColor: courseForm.accentColor,
        illustrationAsset: courseForm.illustrationAsset,
        mascot: courseForm.mascot,
        phases: phasesList,
      };

      if (editingCourse) {
        // Update
        const res = await fetch(`/api/studio/courses/${editingCourse.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadBody),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Nem sikerült frissíteni a kurzust.');
        }
        toast.success('Kurzus sikeresen elmentve mindegyik nyelven!');
      } else {
        // Create
        const res = await fetch('/api/studio/courses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadBody),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Nem sikerült létrehozni a kurzust.');
        }
        toast.success('Új kurzus sikeresen létrehozva mindegyik nyelven!');
      }

      setActiveTab('my_courses');
      await fetchCourses();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Hiba a mentés során.');
    } finally {
      setSavingCourse(false);
    }
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
    const effectiveTopic = phaseAiTopic.trim() || getLocalizedHu(courseForm.title).trim() || 'Új témakör';
    const targetIdx = phaseAiTargetIdx !== null ? phaseAiTargetIdx : phasesList.length;

    setIsPhaseAiGenerating(true);
    try {
      const existingPhase = !phaseAiIsNew && phaseAiTargetIdx !== null ? phasesList[phaseAiTargetIdx] : null;

      const phaseDraftPayload = {
        phaseId: existingPhase?.phaseId || `phase-${targetIdx + 1}-${Date.now().toString(36)}`,
        title: phaseAiTopic.trim() || (phaseAiIsNew ? `${targetIdx + 1}. Új Lépés` : getLocalizedHu(existingPhase?.title) || 'Új Lépés'),
        sourceView: phaseAiView,
        sourceAlgorithmId: existingPhase?.sourceAlgorithmId || 'general',
        summary: phaseAiTopic.trim() || getLocalizedHu(existingPhase?.summary) || 'Gyakorlati feladat',
      };

      const res = await fetch('/api/ai/generate-course/phase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseContext: {
            topic: getLocalizedHu(courseForm.title).trim() || effectiveTopic,
            title: getLocalizedHu(courseForm.title).trim() || effectiveTopic,
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

      let infoContent = gen.infoContent;
      if (infoContent) {
        if (typeof infoContent === 'object' && infoContent !== null && !infoContent.root) {
          infoContent = {
            hu: lexicalToMarkdown(infoContent.hu),
            en: lexicalToMarkdown(infoContent.en),
            ro: lexicalToMarkdown(infoContent.ro),
          };
        } else {
          const md = lexicalToMarkdown(infoContent);
          infoContent = { hu: md, en: md, ro: md };
        }
      }

      const populatedPhase: PhaseDraft = {
        phaseId: phaseDraftPayload.phaseId,
        title: ensureLocalized(gen.title, phaseDraftPayload.title),
        sourceView: phaseAiView,
        sourceAlgorithmId: 'general',
        summary: ensureLocalized(gen.summary, phaseDraftPayload.summary),
        maxPoints: gen.maxPoints ?? existingPhase?.maxPoints ?? 10,
        quiz: (gen.quiz || []).map((q: any) => ({
          question: ensureLocalized(q.question),
          options: (q.options || []).map((opt: any) => ({
            option: ensureLocalized(typeof opt === 'object' && opt?.option ? opt.option : opt),
          })),
          correctIndex: q.correctIndex || 0,
          explanation: ensureLocalized(q.explanation),
        })),
        matching: (gen.matching || []).map((m: any) => ({
          left: ensureLocalized(m.left),
          right: ensureLocalized(m.right),
        })),
        ordering: (gen.ordering || []).map((o: any) => ({
          text: ensureLocalized(typeof o === 'object' && o?.text ? o.text : o),
        })),
        debugCode: gen.debugCode || '',
        expectedCode: gen.expectedCode || '',
        gapFillContent: gen.gapFillContent ? ensureLocalized(gen.gapFillContent) : undefined,
        gapFillSolutions: (gen.gapFillSolutions || []).map((s: any) => ({
          solution: ensureLocalized(typeof s === 'object' && s?.solution ? s.solution : s),
        })),
        gapFillDecoys: (gen.gapFillDecoys || []).map((d: any) => ({
          decoy: ensureLocalized(typeof d === 'object' && d?.decoy ? d.decoy : d),
        })),
        infoContent: infoContent || '',
        hintCopy: ensureLocalized(gen.hintCopy),
        mascotLine: ensureLocalized(gen.mascotLine),
        mascotMistakeLine: ensureLocalized(gen.mascotMistakeLine),
        idleHelp: ensureLocalized(gen.idleHelp),
        askConfidence: gen.askConfidence ?? true,
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
                Tervezz saját interaktív tanmenetet, készíts teszteket és feladatsorokat AI támogatással.
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
        </section>
      )}

      {/* ━━━ MAIN WORKSPACE ━━━ */}
      <main className="max-w-[1400px] mx-auto px-6 lg:px-12 mt-8">
        {/* Course List Header with Search & Filters (Only shown when not in editor) */}
        {activeTab !== 'course_editor' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('my_courses')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  activeTab === 'my_courses'
                    ? 'bg-[#269984] text-white shadow-md shadow-teal-700/20'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Saját Kurzusaim</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  activeTab === 'my_courses'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#269984]/10 text-[#269984]'
                }`}>
                  {myCourses.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('community')}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  activeTab === 'community'
                    ? 'bg-[#269984] text-white shadow-md shadow-teal-700/20'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Közösségi Tár (Klónozható Sablonok)</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
                  activeTab === 'community'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                }`}>
                  {communityCourses.length}
                </span>
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
                  Hozz létre egy új kurzust manuálisan, vagy generáltass egyet másodpercek alatt az AI segítségével!
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
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (typeof window !== 'undefined') {
                              const url = `${window.location.origin}/courses/${course.slug}`;
                              navigator.clipboard.writeText(url);
                              toast.success(`Diák közvetlen link kimásolva: /courses/${course.slug}`);
                            }
                          }}
                          className="p-2 rounded-xl text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 dark:text-slate-400 dark:hover:text-emerald-300 dark:hover:bg-white/5 transition-colors"
                          title="Közvetlen diák URL másolása a vágólapra"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
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


        {/* ── COURSE CREATION / EDITOR PAGE ── */}
        {activeTab === 'course_editor' && (
          <div className="space-y-8">
            {/* Top Header & Actions Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-white/10 shadow-sm">
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
                      {courseForm.title?.[activeEditorLang]?.trim() || courseForm.title?.hu?.trim() || courseForm.title?.en?.trim() || courseForm.title?.ro?.trim() || 'Új Kurzus Létrehozása'}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                      {editingCourse ? 'Szerkesztés' : 'Új kurzus'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Állítsd össze a tananyagot lépésről lépésre, minimum egy nyelv kitöltésével!
                  </p>
                </div>
              </div>

              {/* Language Toolbar & Actions */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Language Selector Pills */}
                <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 shadow-inner">
                  {(
                    [
                      { code: 'hu', label: 'Magyar', flag: '🇭🇺' },
                      { code: 'en', label: 'English', flag: '🇬🇧' },
                      { code: 'ro', label: 'Română', flag: '🇷🇴' },
                    ] as const
                  ).map((l) => {
                    const isActive = activeEditorLang === l.code && !showAllLanguages;
                    const isFilled = Boolean(courseForm.title?.[l.code]?.trim());
                    return (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => {
                          setActiveEditorLang(l.code);
                          setShowAllLanguages(false);
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-[#269984] text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isFilled ? 'bg-emerald-400 ring-2 ring-emerald-300/30' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                          title={isFilled ? 'Kitöltve' : 'Még nincs kitöltve'}
                        />
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setShowAllLanguages(!showAllLanguages)}
                    title="Minden nyelv mutatása egymás alatt a közvetlen összehasonlításhoz"
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ml-1 ${
                      showAllLanguages
                        ? 'bg-[#269984] text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Összes</span>
                  </button>
                </div>

                {/* Missing Language Status Badge */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                  {missingLangCount === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Mind a 3 nyelv kitöltve
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> {filledLangs.length}/3 kitöltve ({missingLangCount} hiányzik)
                    </span>
                  )}
                </div>

                {/* AI Translate All Button */}
                <button
                  type="button"
                  onClick={handleAutoTranslateAll}
                  disabled={isTranslatingAll}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all hover:scale-[1.02] active:scale-95"
                  title="A kitöltött nyelv automatikus fordítása a hiányzó nyelvekre AI segítségével"
                >
                  {isTranslatingAll ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Fordítás...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>✨ Fordítás AI-val</span>
                    </>
                  )}
                </button>

                {/* Save Course Button */}
                <button
                  type="button"
                  onClick={handleSaveCourseForm}
                  disabled={savingCourse}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#269984] hover:bg-[#1e7e6c] disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-teal-700/20 transition-all hover:scale-[1.02] active:scale-95"
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

            {/* Stepper Navigation Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-2 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-white/10 shadow-sm">
              <button
                type="button"
                onClick={() => setEditorStep('basics')}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  editorStep === 'basics'
                    ? 'bg-teal-50/70 dark:bg-teal-950/40 border border-teal-500/30 ring-1 ring-teal-500/20'
                    : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                    editorStep === 'basics'
                      ? 'bg-[#269984] text-white shadow-sm'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  1
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                    <BookOpen className="w-3.5 h-3.5 text-[#269984]" />
                    1. Kurzus Alapadatok
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Cím, URL, leírás, nehézségi szint
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setEditorStep('mascot')}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  editorStep === 'mascot'
                    ? 'bg-amber-50/70 dark:bg-amber-950/40 border border-amber-500/30 ring-1 ring-amber-500/20'
                    : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                    editorStep === 'mascot'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  2
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                    <Bot className="w-3.5 h-3.5 text-amber-500" />
                    2. Kabala & Mentor
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        courseForm.mascot.mode === 'disabled'
                          ? 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {courseForm.mascot.mode === 'disabled'
                        ? 'Kikapcsolva'
                        : getLocalizedStr(courseForm.mascot.name, activeEditorLang) || 'Bubi'}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Segítő karakter, személyiség és viselkedés
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setEditorStep('phases')}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                  editorStep === 'phases'
                    ? 'bg-purple-50/70 dark:bg-purple-950/40 border border-purple-500/30 ring-1 ring-purple-500/20'
                    : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                    editorStep === 'phases'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  3
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                    <Layers className="w-3.5 h-3.5 text-purple-600" />
                    3. Tananyag & Lépések
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
                      {phasesList.length} fázis • {phasesList.reduce((acc, p) => acc + (p.maxPoints ?? 10), 0)} pt
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Elmélet, kvízek, interaktív feladatok felépítése
                  </p>
                </div>
              </button>
            </div>

            {/* ━━━ STEP 1: KURZUS ALAPADATOK ━━━ */}
            {editorStep === 'basics' && (
              <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-white/10 shadow-sm space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 flex items-center justify-center text-[#269984]">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">1. Kurzus Alapadatok & Sablonválasztó</h3>
                      <p className="text-xs text-slate-500">Add meg a kurzus nevét és megjelenését, vagy indulj egy előre felépített sablonból!</p>
                    </div>
                  </div>
                </div>

                {/* Quick Starter Templates + Live Preview Row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200/80 dark:border-white/10">
                  <div className="lg:col-span-7 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-[#269984] flex items-center gap-1.5">
                        <Wand2 className="w-4 h-4" />
                        Gyors Kurzus Sablonok (1 kattintásos felépítés)
                      </span>
                      <span className="text-[11px] text-slate-400">Előre elkészített lépéssorok</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => applyCourseTemplate('algo_classic')}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-[#269984] text-left transition-all group"
                      >
                        <div className="text-lg mb-1">🚀</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-[#269984]">
                          Klasszikus Tanmenet
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                          4 lépés: Elmélet → Párosítás → Hiánypótlás → Kvíz
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyCourseTemplate('quick_quiz')}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-amber-500 text-left transition-all group"
                      >
                        <div className="text-lg mb-1">⚡</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-500">
                          Gyors Tudáspróba
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                          3 lépés: Puskázó → Sorrendezés → Ellenőrző Kvíz
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => applyCourseTemplate('code_debug')}
                        className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-rose-500 text-left transition-all group"
                      >
                        <div className="text-lg mb-1">🐞</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-500">
                          Kód & Hibakereső
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                          3 lépés: Kódminták → Kódkiegészítés → Debug
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* Live Course Card Preview */}
                  <div className="lg:col-span-5 flex flex-col justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm relative overflow-hidden">
                    <div
                      className="absolute top-0 left-0 right-0 h-1.5"
                      style={{ backgroundColor: courseForm.accentColor || '#269984' }}
                    />
                    <div className="flex items-start justify-between gap-3 pt-1">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base">{courseForm.icon || '📘'}</span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                            {courseForm.difficulty === 'Beginner'
                              ? 'Kezdő'
                              : courseForm.difficulty === 'Intermediate'
                              ? 'Középhaladó'
                              : 'Haladó'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">• Élő kártya előnézet</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                          {getLocalizedStr(courseForm.title, activeEditorLang) || 'A kurzusod címe itt jelenik meg'}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {getLocalizedStr(courseForm.summary, activeEditorLang) ||
                            'Rövid leírás a kurzusról, amit a diákok a kurzuslistában látnak...'}
                        </p>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 p-1.5 flex items-center justify-center shrink-0 border border-slate-100 dark:border-white/5">
                        <Image
                          src={`/assets/${courseForm.illustrationAsset || 'algo_group_109.svg'}`}
                          alt="Preview"
                          width={38}
                          height={38}
                          className="object-contain max-h-full"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 mt-3 border-t border-slate-100 dark:border-white/5">
                      <span>📚 {phasesList.length} fázis</span>
                      <span>⏱️ ~{courseForm.estimatedMinutes} perc</span>
                      <span>
                        {courseForm.mascot.mode !== 'disabled'
                          ? `🤖 Kabala: ${getLocalizedStr(courseForm.mascot.name, activeEditorLang) || 'Bubi'}`
                          : '🚫 Kabala nélkül'}
                      </span>
                    </div>
                  </div>
                </div>

              {/* Title & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Kurzus Címe *
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-500">
                      {showAllLanguages ? 'Többnyelvű' : activeEditorLang.toUpperCase()}
                    </span>
                  </div>

                  {showAllLanguages ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold w-7 text-slate-400">HU</span>
                        <input
                          type="text"
                          required
                          value={courseForm.title.hu}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCourseForm((prev) => ({
                              ...prev,
                              title: { ...prev.title, hu: val },
                              slug: isSlugLocked ? generateSlug(val) : prev.slug,
                            }));
                          }}
                          placeholder="Kurzus címe magyarul..."
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#269984]"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold w-7 text-slate-400">EN</span>
                        <input
                          type="text"
                          value={courseForm.title.en}
                          onChange={(e) => setCourseForm((prev) => ({ ...prev, title: { ...prev.title, en: e.target.value } }))}
                          placeholder="Course title in English..."
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#269984]"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold w-7 text-slate-400">RO</span>
                        <input
                          type="text"
                          value={courseForm.title.ro}
                          onChange={(e) => setCourseForm((prev) => ({ ...prev, title: { ...prev.title, ro: e.target.value } }))}
                          placeholder="Titlul cursului în română..."
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#269984]"
                        />
                      </div>
                    </div>
                  ) : (
                    <input
                      type="text"
                      required
                      value={courseForm.title?.[activeEditorLang] || ''}
                      onChange={(e) => {
                        const newTitle = e.target.value;
                        setCourseForm((prev) => ({
                          ...prev,
                          title: setLocalizedStr(prev.title, activeEditorLang, newTitle),
                          slug: isSlugLocked ? generateSlug(newTitle) : prev.slug,
                        }));
                      }}
                      placeholder={
                        activeEditorLang === 'hu'
                          ? 'pl. Bevezetés a Python programozásba, Webfejlesztés alapjai...'
                          : activeEditorLang === 'en'
                          ? 'e.g. Introduction to Python Programming, Web Development Basics...'
                          : 'de ex. Introducere în programarea Python...'
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                    />
                  )}
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
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984] font-mono text-sm"
                  />
                </div>
              </div>

              {/* Summary */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Rövid Leírás / Összefoglaló
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-500">
                    {showAllLanguages ? 'Többnyelvű' : activeEditorLang.toUpperCase()}
                  </span>
                </div>

                {showAllLanguages ? (
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold w-7 text-slate-400 mt-2">HU</span>
                      <textarea
                        rows={2}
                        value={courseForm.summary.hu}
                        onChange={(e) => setCourseForm((prev) => ({ ...prev, summary: { ...prev.summary, hu: e.target.value } }))}
                        placeholder="Rövid leírás magyarul..."
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#269984]"
                      />
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold w-7 text-slate-400 mt-2">EN</span>
                      <textarea
                        rows={2}
                        value={courseForm.summary.en}
                        onChange={(e) => setCourseForm((prev) => ({ ...prev, summary: { ...prev.summary, en: e.target.value } }))}
                        placeholder="Summary in English..."
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#269984]"
                      />
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold w-7 text-slate-400 mt-2">RO</span>
                      <textarea
                        rows={2}
                        value={courseForm.summary.ro}
                        onChange={(e) => setCourseForm((prev) => ({ ...prev, summary: { ...prev.summary, ro: e.target.value } }))}
                        placeholder="Descriere scurtă în română..."
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#269984]"
                      />
                    </div>
                  </div>
                ) : (
                  <textarea
                    rows={2}
                    value={courseForm.summary?.[activeEditorLang] || ''}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        summary: setLocalizedStr(courseForm.summary, activeEditorLang, e.target.value),
                      })
                    }
                    placeholder="Rövid, figyelemfelkeltő leírás a kurzus tartalmáról és céljairól..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                  />
                )}
              </div>

              {/* Hero Tagline */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Hero Alcím / Szlogen (Opcionális)
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-500">
                    {showAllLanguages ? 'Többnyelvű' : activeEditorLang.toUpperCase()}
                  </span>
                </div>

                {showAllLanguages ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold w-7 text-slate-400">HU</span>
                      <input
                        type="text"
                        value={courseForm.heroTagline.hu}
                        onChange={(e) => setCourseForm((prev) => ({ ...prev, heroTagline: { ...prev.heroTagline, hu: e.target.value } }))}
                        placeholder="pl. Fedezd fel a kódolás örömét lépésről lépésre!"
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#269984]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold w-7 text-slate-400">EN</span>
                      <input
                        type="text"
                        value={courseForm.heroTagline.en}
                        onChange={(e) => setCourseForm((prev) => ({ ...prev, heroTagline: { ...prev.heroTagline, en: e.target.value } }))}
                        placeholder="e.g. Discover the joy of coding step by step!"
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#269984]"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold w-7 text-slate-400">RO</span>
                      <input
                        type="text"
                        value={courseForm.heroTagline.ro}
                        onChange={(e) => setCourseForm((prev) => ({ ...prev, heroTagline: { ...prev.heroTagline, ro: e.target.value } }))}
                        placeholder="de ex. Descoperă bucuria programării pas cu pas!"
                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#269984]"
                      />
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={courseForm.heroTagline?.[activeEditorLang] || ''}
                    onChange={(e) =>
                      setCourseForm({
                        ...courseForm,
                        heroTagline: setLocalizedStr(courseForm.heroTagline, activeEditorLang, e.target.value),
                      })
                    }
                    placeholder="pl. Fedezd fel a kódolás örömét lépésről lépésre!"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                  />
                )}
              </div>

              {/* Course Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      className="w-14 text-center text-xl px-2 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                    />
                    <div className="flex flex-wrap gap-1">
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

              {/* Visual Asset & Accent Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 border-t border-slate-100 dark:border-white/5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Kurzus Illusztráció / Kép
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 p-2 flex items-center justify-center overflow-hidden shrink-0">
                      <Image
                        src={`/assets/${courseForm.illustrationAsset || 'algo_group_109.svg'}`}
                        alt="Kurzus kép"
                        width={48}
                        height={48}
                        className="object-contain max-h-full"
                      />
                    </div>
                    <select
                      value={courseForm.illustrationAsset || 'algo_group_109.svg'}
                      onChange={(e) => setCourseForm({ ...courseForm, illustrationAsset: e.target.value })}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-[#269984]"
                    >
                      {ASSET_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Kurzus Kiemelő Szín
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={courseForm.accentColor || '#269984'}
                      onChange={(e) => setCourseForm({ ...courseForm, accentColor: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-white/10 bg-transparent p-0.5"
                    />
                    <input
                      type="text"
                      value={courseForm.accentColor || '#269984'}
                      onChange={(e) => setCourseForm({ ...courseForm, accentColor: e.target.value })}
                      className="w-28 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none"
                    />
                    <div className="flex items-center gap-1.5">
                      {['#269984', '#7c3aed', '#2563eb', '#ea580c', '#e11d48', '#059669'].map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCourseForm({ ...courseForm, accentColor: c })}
                          style={{ backgroundColor: c }}
                          className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm hover:scale-125 transition-transform"
                          title={c}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Official Toggle */}
              {isAdmin && (
                <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-white">
                      Hivatalos AlgoRythmics Sablonként Megjelölés (Admin Jogosultság)
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={courseForm.isOfficial}
                      onChange={(e) => setCourseForm({ ...courseForm, isOfficial: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              )}

                {/* Step 1 Bottom Navigation */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setActiveTab('my_courses')}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 font-bold text-xs transition-colors"
                  >
                    Mégse
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorStep('mascot')}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <span>Tovább a Kabala Kiválasztásához (2. Lépés)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* ━━━ STEP 2: KABALA & MENTOR BEÁLLÍTÁSOK ━━━ */}
            {editorStep === 'mascot' && (
              <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-white/10 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      2. Kabala & Virtuális Mentor Kiválasztása
                    </h3>
                    <p className="text-xs text-slate-500">
                      Válaszd ki egyetlen kattintással a kurzus segítő karakterét és személyiségét (mielőtt összeállítod a lépéseket)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* AI Mascot Copy Generator (available in manual or hybrid mode) */}
                  {(courseForm.mascot.mode === 'ai-fallback' || courseForm.mascot.mode === 'manual-only') && (
                    <button
                      type="button"
                      onClick={handleGenerateMascotCopy}
                      disabled={isGeneratingMascot}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-teal-600 hover:from-amber-600 hover:to-teal-700 disabled:opacity-40 text-white font-bold text-xs shadow-md shadow-teal-700/20 transition-all hover:scale-[1.02] active:scale-95"
                      title="Kabala szövegek és promptok generálása AI-val a kurzus témájához"
                    >
                      {isGeneratingMascot ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Generálás...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                          <span>Kabala Üzenetek AI-val</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Mascot 4-Option Mode Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Kabala Bekapcsolási & Működési Mód
                  </label>
                  <span className="text-[11px] font-medium text-slate-400">
                    Válassz a 4 opció közül
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {MASCOT_MODES.map((modeOpt) => {
                    const isSelected = courseForm.mascot.mode === modeOpt.id;
                    return (
                      <button
                        key={modeOpt.id}
                        type="button"
                        onClick={() => {
                          setCourseForm((prev) => ({
                            ...prev,
                            mascot: {
                              ...prev.mascot,
                              mode: modeOpt.id,
                              enabled: modeOpt.id !== 'disabled',
                            },
                          }));
                        }}
                        className={`relative p-4 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
                          isSelected
                            ? 'border-[#269984] bg-teal-50/70 dark:bg-teal-950/30 shadow-sm ring-2 ring-[#269984]/30'
                            : 'border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-2xl">{modeOpt.icon}</span>
                          {modeOpt.badge && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isSelected
                                  ? 'bg-[#269984] text-white'
                                  : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {modeOpt.badge}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span
                              className={`text-xs font-bold ${
                                isSelected ? 'text-teal-900 dark:text-teal-200' : 'text-slate-800 dark:text-white'
                              }`}
                            >
                              {modeOpt.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug">
                            {modeOpt.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {courseForm.mascot.mode === 'disabled' ? (
                <div className="py-8 px-6 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 space-y-2">
                  <span className="text-3xl block">🚫</span>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                    A kabala jelenleg ki van kapcsolva ennél a kurzusnál
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    A kurzusban a tanulók nem kapnak kabala üzeneteket, és a tanulási lépéseknél sem kell kabala szövegeket megadni. A fenti gombokkal bármikor bekapcsolhatod a kívánt módot.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Mode explanation banner */}
                  {courseForm.mascot.mode === 'ai-only' && (
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-teal-500/10 border border-purple-500/20 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        <Sparkles className="w-4 h-4 text-amber-200" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200 uppercase tracking-wider">
                          Csak AI Kabala Mód Aktív (Előkészítve)
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          A tanulók számára a kabala tanácsait, reakcióit és dicséreteit a háttérben közvetlenül a mesterséges intelligencia generálja valós időben a feladatok kontextusa és a tanuló viselkedése alapján. <strong>Manuális üzenetek megadása sem itt, sem a lépéseknél nem szükséges!</strong> Alább személyre szabhatod a kabala nevét, avatárját és kiemelési színét.
                        </p>
                      </div>
                    </div>
                  )}

                  {courseForm.mascot.mode === 'ai-fallback' && (
                    <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#269984] text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        <Zap className="w-4 h-4 text-amber-200" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-teal-900 dark:text-teal-200 uppercase tracking-wider">
                          AI Kabala Manuális Fallbackkel (Hibrid Mód)
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          Elsődlegesen a valós idejű mesterséges intelligencia látja el a mentorálást. Amennyiben az AI szolgáltatás nem elérhető vagy hiba történik, a rendszer azonnal az alább megadott manuális tartalék üzenetekhez nyúl vissza.
                        </p>
                      </div>
                    </div>
                  )}

                  {courseForm.mascot.mode === 'manual-only' && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        <Edit3 className="w-4 h-4 text-white" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                          Csak Manuális Kabala Mód
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          A kabala kizárólag a tanár által az alábbiakban és a lépéseknél megadott manuális üzenetek és szabályok szerint viselkedik a kurzus során.
                        </p>
                      </div>
                    </div>
                  )}
                  {/* 1-Click Personality Presets & Live Mascot Preview */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200/80 dark:border-white/10">
                    <div className="lg:col-span-7 space-y-3">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                        ✨ Gyors Karakter & Személyiség Sablonok (1 kattintás)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <button
                          type="button"
                          onClick={() => applyMascotPersonality('friendly')}
                          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-[#269984] text-left transition-all"
                        >
                          <div className="text-base mb-1">🌱 Barátságos Bubi</div>
                          <p className="text-[10px] text-slate-500 leading-snug">
                            Kedves, bátorító stílus kezdőknek (30 mp tétlenség után segít).
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => applyMascotPersonality('mentor')}
                          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-blue-500 text-left transition-all"
                        >
                          <div className="text-base mb-1">🎯 Prof. Algo Mentor</div>
                          <p className="text-[10px] text-slate-500 leading-snug">
                            Szakmai, logikus rávezető kérdések haladóknak.
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => applyMascotPersonality('coach')}
                          className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 hover:border-orange-500 text-left transition-all"
                        >
                          <div className="text-base mb-1">🔥 Turbo Edző</div>
                          <p className="text-[10px] text-slate-500 leading-snug">
                            Lendületes, játékos motiváció és gyors tippek.
                          </p>
                        </button>
                      </div>

                      {/* Visual Character Picker Grid */}
                      <div className="pt-2">
                        <span className="text-[11px] font-bold text-slate-500 block mb-2">
                          Válassz vizuális kabala figurát kattintással:
                        </span>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                          {ASSET_OPTIONS.slice(0, 8).map((opt) => {
                            const isCharSelected = (courseForm.mascot.asset || 'algo_group_109.svg') === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() =>
                                  setCourseForm((prev) => ({
                                    ...prev,
                                    mascot: { ...prev.mascot, asset: opt.value },
                                  }))
                                }
                                title={opt.label}
                                className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                                  isCharSelected
                                    ? 'border-2 border-[#269984] bg-teal-50/70 dark:bg-teal-950/40 scale-105 shadow-sm'
                                    : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:border-slate-300'
                                }`}
                              >
                                <Image
                                  src={`/assets/${opt.value}`}
                                  alt={opt.label}
                                  width={32}
                                  height={32}
                                  className="object-contain h-8 w-8"
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Live Mascot Speech Bubble Preview */}
                    <div className="lg:col-span-5 flex flex-col justify-center p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Élő Kabala Előnézet ({activeEditorLang.toUpperCase()})
                      </span>
                      <div className="flex items-start gap-3">
                        <div
                          className="w-14 h-14 rounded-2xl p-1.5 flex items-center justify-center shrink-0 border-2 shadow-sm"
                          style={{
                            borderColor: courseForm.mascot.accentColor || '#269984',
                            backgroundColor: `${courseForm.mascot.accentColor || '#269984'}15`,
                          }}
                        >
                          <Image
                            src={`/assets/${courseForm.mascot.asset || 'algo_group_109.svg'}`}
                            alt="Mascot Preview"
                            width={42}
                            height={42}
                            className="object-contain max-h-full"
                          />
                        </div>
                        <div className="flex-1 p-3 rounded-2xl rounded-tl-none bg-slate-100 dark:bg-slate-800 text-xs space-y-1">
                          <div
                            className="font-extrabold"
                            style={{ color: courseForm.mascot.accentColor || '#269984' }}
                          >
                            {getLocalizedStr(courseForm.mascot.name, activeEditorLang) || 'Bubi'}
                          </div>
                          <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                            “{getLocalizedStr(courseForm.mascot.welcomeMessages?.[0]?.text, activeEditorLang) ||
                              getLocalizedStr(courseForm.mascot.idlePrompt, activeEditorLang) ||
                              'Üdv a kurzuson! Készen állsz a közös tanulásra?'}”
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mascot Profile Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Mascot Name (3 languages) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Kabala Neve (3 Nyelven)
                        </label>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                          3 Nyelv
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold w-7 text-center py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                            HU
                          </span>
                          <input
                            type="text"
                            value={courseForm.mascot.name.hu}
                            onChange={(e) =>
                              setCourseForm((prev) => ({
                                ...prev,
                                mascot: { ...prev.mascot, name: { ...prev.mascot.name, hu: e.target.value } },
                              }))
                            }
                            placeholder="Kabala neve (pl. Bubi)..."
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-[#269984]"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold w-7 text-center py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shrink-0">
                            EN
                          </span>
                          <input
                            type="text"
                            value={courseForm.mascot.name.en}
                            onChange={(e) =>
                              setCourseForm((prev) => ({
                                ...prev,
                                mascot: { ...prev.mascot, name: { ...prev.mascot.name, en: e.target.value } },
                              }))
                            }
                            placeholder="Mascot name (e.g. Bubi)..."
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-[#269984]"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold w-7 text-center py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
                            RO
                          </span>
                          <input
                            type="text"
                            value={courseForm.mascot.name.ro}
                            onChange={(e) =>
                              setCourseForm((prev) => ({
                                ...prev,
                                mascot: { ...prev.mascot, name: { ...prev.mascot.name, ro: e.target.value } },
                              }))
                            }
                            placeholder="Nume mascotă (de ex. Bubi)..."
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-[#269984]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Mascot Avatar Selection */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        Kabala Karakter / Avatar
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/40 p-1 flex items-center justify-center overflow-hidden shrink-0">
                          <Image
                            src={`/assets/${courseForm.mascot.asset || 'algo_group_109.svg'}`}
                            alt="Mascot avatar"
                            width={44}
                            height={44}
                            className="object-contain max-h-full"
                          />
                        </div>
                        <select
                          value={courseForm.mascot.asset || 'algo_group_109.svg'}
                          onChange={(e) =>
                            setCourseForm((prev) => ({
                              ...prev,
                              mascot: { ...prev.mascot, asset: e.target.value },
                            }))
                          }
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-[#269984]"
                        >
                          {ASSET_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Mascot Accent Color */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                        Kabala Kiemelő Szín
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={courseForm.mascot.accentColor || '#269984'}
                          onChange={(e) =>
                            setCourseForm((prev) => ({
                              ...prev,
                              mascot: { ...prev.mascot, accentColor: e.target.value },
                            }))
                          }
                          className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 dark:border-white/10 bg-transparent p-0.5"
                        />
                        <input
                          type="text"
                          value={courseForm.mascot.accentColor || '#269984'}
                          onChange={(e) =>
                            setCourseForm((prev) => ({
                              ...prev,
                              mascot: { ...prev.mascot, accentColor: e.target.value },
                            }))
                          }
                          className="w-24 px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none"
                        />
                        <div className="flex items-center gap-1">
                          {['#269984', '#0284c7', '#7c3aed', '#ea580c', '#16a34a'].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() =>
                                setCourseForm((prev) => ({
                                  ...prev,
                                  mascot: { ...prev.mascot, accentColor: c },
                                }))
                              }
                              style={{ backgroundColor: c }}
                              className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm hover:scale-125 transition-transform"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Triggers & Timers and Summon Label (only for manual and hybrid fallback) */}
                  {(courseForm.mascot.mode === 'ai-fallback' || courseForm.mascot.mode === 'manual-only') && (
                    <div className="pt-3 border-t border-slate-100 dark:border-white/5 space-y-4">
                      {/* Collapsible Toggle for Advanced Mascot Prompts */}
                      <button
                        type="button"
                        onClick={() => setShowAdvancedMascot((v) => !v)}
                        className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 border border-slate-200 dark:border-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 text-left">
                          <Settings className="w-4 h-4 text-[#269984]" />
                          <div>
                            <div className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                              Haladó Kabala Szövegek & Triggerek Finomhangolása (3 Nyelven)
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Tétlenségi időzítő ({courseForm.mascot.idleTriggerSeconds ?? 30} mp), hiba küszöb ({courseForm.mascot.mistakeTriggerCount ?? 2} hiba), üdvözlő és dicsérő mondatok szerkesztése
                            </div>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-600 dark:text-slate-300 shrink-0">
                          {showAdvancedMascot ? (
                            <>
                              Elrejtés <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              Megnyitás <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </span>
                      </button>

                      {showAdvancedMascot && (
                        <div className="space-y-6 pt-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Tétlenségi Trigger (mp)
                      </label>
                      <p className="text-[11px] text-slate-400 mb-2">Ennyi másodperc tétlenség után ajánl fel segítséget</p>
                      <input
                        type="number"
                        min={10}
                        max={300}
                        value={courseForm.mascot.idleTriggerSeconds ?? 30}
                        onChange={(e) =>
                          setCourseForm((prev) => ({
                            ...prev,
                            mascot: { ...prev.mascot, idleTriggerSeconds: Number(e.target.value) || 30 },
                          }))
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-[#269984]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                        Hiba Trigger (darab)
                      </label>
                      <p className="text-[11px] text-slate-400 mb-2">Ennyi hibás válasz után jelenik meg vigasztaló üzenettel</p>
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={courseForm.mascot.mistakeTriggerCount ?? 2}
                        onChange={(e) =>
                          setCourseForm((prev) => ({
                            ...prev,
                            mascot: { ...prev.mascot, mistakeTriggerCount: Number(e.target.value) || 2 },
                          }))
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-[#269984]"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Hívógomb Felirat (Summon - 3 Nyelven)
                        </label>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-600">3 Nyelv</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-2">A diák által kattintható segítő gomb szövege</p>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold w-7 text-center py-0.5 rounded bg-emerald-500/10 text-emerald-600 shrink-0">HU</span>
                          <input
                            type="text"
                            value={courseForm.mascot.summonLabel.hu}
                            onChange={(e) =>
                              setCourseForm((prev) => ({
                                ...prev,
                                mascot: {
                                  ...prev.mascot,
                                  summonLabel: { ...prev.mascot.summonLabel, hu: e.target.value },
                                },
                              }))
                            }
                            placeholder="pl. Segítség kérése..."
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-[#269984]"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold w-7 text-center py-0.5 rounded bg-blue-500/10 text-blue-600 shrink-0">EN</span>
                          <input
                            type="text"
                            value={courseForm.mascot.summonLabel.en}
                            onChange={(e) =>
                              setCourseForm((prev) => ({
                                ...prev,
                                mascot: {
                                  ...prev.mascot,
                                  summonLabel: { ...prev.mascot.summonLabel, en: e.target.value },
                                },
                              }))
                            }
                            placeholder="e.g. Ask for help..."
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-[#269984]"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold w-7 text-center py-0.5 rounded bg-amber-500/10 text-amber-600 shrink-0">RO</span>
                          <input
                            type="text"
                            value={courseForm.mascot.summonLabel.ro}
                            onChange={(e) =>
                              setCourseForm((prev) => ({
                                ...prev,
                                mascot: {
                                  ...prev.mascot,
                                  summonLabel: { ...prev.mascot.summonLabel, ro: e.target.value },
                                },
                              }))
                            }
                            placeholder="de ex. Cere ajutor..."
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs font-bold focus:outline-none focus:border-[#269984]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mentoring Prompts (Idle & Mistake - 3 Nyelven) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100 dark:border-white/5">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Tétlenségi Prompt / Kérdés (3 Nyelven)
                        </label>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-600">3 Nyelv</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold w-7 text-center py-0.5 rounded bg-emerald-500/10 text-emerald-600 shrink-0">HU</span>
                          <input
                            type="text"
                            value={courseForm.mascot.idlePrompt.hu}
                            onChange={(e) =>
                              setCourseForm((prev) => ({
                                ...prev,
                                mascot: {
                                  ...prev.mascot,
                                  idlePrompt: { ...prev.mascot.idlePrompt, hu: e.target.value },
                                },
                              }))
                            }
                            placeholder="pl. Segíthetek a következő lépésben?"
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#269984]"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold w-7 text-center py-0.5 rounded bg-blue-500/10 text-blue-600 shrink-0">EN</span>
                          <input
                            type="text"
                            value={courseForm.mascot.idlePrompt.en}
                            onChange={(e) =>
                              setCourseForm((prev) => ({
                                ...prev,
                                mascot: {
                                  ...prev.mascot,
                                  idlePrompt: { ...prev.mascot.idlePrompt, en: e.target.value },
                                },
                              }))
                            }
                            placeholder="e.g. Need help with the next step?"
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#269984]"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold w-7 text-center py-0.5 rounded bg-amber-500/10 text-amber-600 shrink-0">RO</span>
                          <input
                            type="text"
                            value={courseForm.mascot.idlePrompt.ro}
                            onChange={(e) =>
                              setCourseForm((prev) => ({
                                ...prev,
                                mascot: {
                                  ...prev.mascot,
                                  idlePrompt: { ...prev.mascot.idlePrompt, ro: e.target.value },
                                },
                              }))
                            }
                            placeholder="de ex. Ai nevoie de ajutor cu pasul următor?"
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#269984]"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Hiba Utáni Prompt / Bátorítás (3 Nyelven)
                        </label>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-600">3 Nyelv</span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold w-7 text-center py-0.5 rounded bg-emerald-500/10 text-emerald-600 shrink-0">HU</span>
                          <input
                            type="text"
                            value={courseForm.mascot.mistakePrompt.hu}
                            onChange={(e) =>
                              setCourseForm((prev) => ({
                                ...prev,
                                mascot: {
                                  ...prev.mascot,
                                  mistakePrompt: { ...prev.mascot.mistakePrompt, hu: e.target.value },
                                },
                              }))
                            }
                            placeholder="pl. Ne aggódj a hibák miatt, együtt megoldjuk!"
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#269984]"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold w-7 text-center py-0.5 rounded bg-blue-500/10 text-blue-600 shrink-0">EN</span>
                          <input
                            type="text"
                            value={courseForm.mascot.mistakePrompt.en}
                            onChange={(e) =>
                              setCourseForm((prev) => ({
                                ...prev,
                                mascot: {
                                  ...prev.mascot,
                                  mistakePrompt: { ...prev.mascot.mistakePrompt, en: e.target.value },
                                },
                              }))
                            }
                            placeholder="e.g. Don't worry about mistakes, let's solve it together!"
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#269984]"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold w-7 text-center py-0.5 rounded bg-amber-500/10 text-amber-600 shrink-0">RO</span>
                          <input
                            type="text"
                            value={courseForm.mascot.mistakePrompt.ro}
                            onChange={(e) =>
                              setCourseForm((prev) => ({
                                ...prev,
                                mascot: {
                                  ...prev.mascot,
                                  mistakePrompt: { ...prev.mascot.mistakePrompt, ro: e.target.value },
                                },
                              }))
                            }
                            placeholder="de ex. Nu-ți face griji, rezolvăm împreună!"
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-[#269984]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mascot Dynamic Message Lists (Always in 3 languages: HU, EN, RO!) */}
                  <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-white/5">
                    {/* Welcome Messages */}
                    <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">👋</span>
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                            Üdvözlő Üzenetek ({courseForm.mascot.welcomeMessages.length}) — 3 Nyelven
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={addMascotWelcomeMsg}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline"
                        >
                          <Plus className="w-3.5 h-3.5" /> Új Üdvözlés
                        </button>
                      </div>

                      <div className="space-y-3">
                        {courseForm.mascot.welcomeMessages.map((msg, mIdx) => (
                          <div
                            key={mIdx}
                            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-500">#{mIdx + 1}. Üdvözlő Üzenet</span>
                              {courseForm.mascot.welcomeMessages.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeMascotWelcomeMsg(mIdx)}
                                  className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                                  title="Üzenet törlése"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 shrink-0">
                                  HU
                                </span>
                                <input
                                  type="text"
                                  value={getLocalizedStr(msg.text, 'hu')}
                                  onChange={(e) => updateMascotWelcomeMsg(mIdx, e.target.value, 'hu')}
                                  placeholder="Üdvözlés magyarul..."
                                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                                />
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 shrink-0">
                                  EN
                                </span>
                                <input
                                  type="text"
                                  value={getLocalizedStr(msg.text, 'en')}
                                  onChange={(e) => updateMascotWelcomeMsg(mIdx, e.target.value, 'en')}
                                  placeholder="Welcome in English..."
                                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                                />
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 shrink-0">
                                  RO
                                </span>
                                <input
                                  type="text"
                                  value={getLocalizedStr(msg.text, 'ro')}
                                  onChange={(e) => updateMascotWelcomeMsg(mIdx, e.target.value, 'ro')}
                                  placeholder="Bun venit în română..."
                                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Streak Messages */}
                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🔥</span>
                          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                            Sikerszéria Dicsérő Üzenetek ({courseForm.mascot.streakMessages.length}) — 3 Nyelven
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={addMascotStreakMsg}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:underline"
                        >
                          <Plus className="w-3.5 h-3.5" /> Új Dicséret
                        </button>
                      </div>

                      <div className="space-y-3">
                        {courseForm.mascot.streakMessages.map((msg, mIdx) => (
                          <div
                            key={mIdx}
                            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/40 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-amber-600">#{mIdx + 1}. Dicséret</span>
                              {courseForm.mascot.streakMessages.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeMascotStreakMsg(mIdx)}
                                  className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                                  title="Üzenet törlése"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 shrink-0">
                                  HU
                                </span>
                                <input
                                  type="text"
                                  value={getLocalizedStr(msg.text, 'hu')}
                                  onChange={(e) => updateMascotStreakMsg(mIdx, e.target.value, 'hu')}
                                  placeholder="Dicséret magyarul..."
                                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-amber-200/80 dark:border-amber-800/40 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                                />
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 shrink-0">
                                  EN
                                </span>
                                <input
                                  type="text"
                                  value={getLocalizedStr(msg.text, 'en')}
                                  onChange={(e) => updateMascotStreakMsg(mIdx, e.target.value, 'en')}
                                  placeholder="Streak praise in English..."
                                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-amber-200/80 dark:border-amber-800/40 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                                />
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 shrink-0">
                                  RO
                                </span>
                                <input
                                  type="text"
                                  value={getLocalizedStr(msg.text, 'ro')}
                                  onChange={(e) => updateMascotStreakMsg(mIdx, e.target.value, 'ro')}
                                  placeholder="Laudă în română..."
                                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-amber-200/80 dark:border-amber-800/40 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Overconfident Messages */}
                    <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-base">🧐</span>
                          <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                            Magabiztos / Óvatosságra Intő Üzenetek ({courseForm.mascot.overconfidentMessages.length}) — 3 Nyelven
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={addMascotOverconfidentMsg}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:underline"
                        >
                          <Plus className="w-3.5 h-3.5" /> Új Figyelmeztetés
                        </button>
                      </div>

                      <div className="space-y-3">
                        {courseForm.mascot.overconfidentMessages.map((msg, mIdx) => (
                          <div
                            key={mIdx}
                            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-800/40 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-indigo-500">#{mIdx + 1}. Figyelmeztetés</span>
                              {courseForm.mascot.overconfidentMessages.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeMascotOverconfidentMsg(mIdx)}
                                  className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                                  title="Üzenet törlése"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 shrink-0">
                                  HU
                                </span>
                                <input
                                  type="text"
                                  value={getLocalizedStr(msg.text, 'hu')}
                                  onChange={(e) => updateMascotOverconfidentMsg(mIdx, e.target.value, 'hu')}
                                  placeholder="Figyelmeztetés magyarul..."
                                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-indigo-200/80 dark:border-indigo-800/40 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                />
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 shrink-0">
                                  EN
                                </span>
                                <input
                                  type="text"
                                  value={getLocalizedStr(msg.text, 'en')}
                                  onChange={(e) => updateMascotOverconfidentMsg(mIdx, e.target.value, 'en')}
                                  placeholder="Warning in English..."
                                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-indigo-200/80 dark:border-indigo-800/40 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                />
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 shrink-0">
                                  RO
                                </span>
                                <input
                                  type="text"
                                  value={getLocalizedStr(msg.text, 'ro')}
                                  onChange={(e) => updateMascotOverconfidentMsg(mIdx, e.target.value, 'ro')}
                                  placeholder="Avertisment în română..."
                                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-indigo-200/80 dark:border-indigo-800/40 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2 Bottom Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
            <button
              type="button"
              onClick={() => setEditorStep('basics')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 font-bold text-xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Vissza az Alapadatokhoz (1. Lépés)</span>
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveCourseForm}
                disabled={savingCourse}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 disabled:opacity-50 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Mentés most</span>
              </button>
              <button
                type="button"
                onClick={() => setEditorStep('phases')}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#269984] hover:bg-[#1e7e6c] text-white font-bold text-xs shadow-md shadow-teal-700/20 transition-all hover:scale-[1.02] active:scale-95"
              >
                <span>Tovább a Tananyag & Lépésekhez (3. Lépés)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

            {/* ━━━ STEP 3: TANANYAG & LÉPÉSEK (FÁZISOK) ━━━ */}
            {editorStep === 'phases' && (
              <div className="p-8 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-white/10 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 flex items-center justify-center text-purple-600">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      3. Tananyag & Lépések Felépítése ({phasesList.length} lépés)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Kattints a lenti gyorstípus-gombokra egy előre felépített lépés azonnali beszúrásához, vagy generálj AI-val!
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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

              {/* ━━━ 1-CLICK QUICK-ADD PHASE TYPE TOOLBAR ━━━ */}
              <div className="p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/40 border border-slate-200/80 dark:border-white/10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1">
                    ⚡ Gyors Lépés Beszúrása:
                  </span>
                  {[
                    { view: 'info', icon: '📖', label: 'Elmélet / Szöveg', cls: 'hover:border-cyan-500 hover:text-cyan-700 dark:hover:text-cyan-300' },
                    { view: 'quiz', icon: '❓', label: 'Kvíz Kérdés', cls: 'hover:border-amber-500 hover:text-amber-700 dark:hover:text-amber-300' },
                    { view: 'gap-fill', icon: '🧩', label: 'Hiánypótlás', cls: 'hover:border-blue-500 hover:text-blue-700 dark:hover:text-blue-300' },
                    { view: 'match', icon: '🔗', label: 'Fogalom Párosítás', cls: 'hover:border-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300' },
                    { view: 'order', icon: '🔢', label: 'Sorrendezés', cls: 'hover:border-purple-500 hover:text-purple-700 dark:hover:text-purple-300' },
                    { view: 'debug', icon: '🐞', label: 'Kód Hibakeresés', cls: 'hover:border-rose-500 hover:text-rose-700 dark:hover:text-rose-300' },
                    { view: 'video', icon: '🎬', label: 'Oktatóvideó', cls: 'hover:border-red-500 hover:text-red-700 dark:hover:text-red-300' },
                    { view: 'control', icon: '🕹️', label: 'Szimuláció', cls: 'hover:border-teal-500 hover:text-teal-700 dark:hover:text-teal-300' },
                  ].map((btn) => (
                    <button
                      key={btn.view}
                      type="button"
                      onClick={() => addPhaseOfType(btn.view)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-sm transition-all hover:scale-[1.02] active:scale-95 ${btn.cls}`}
                    >
                      <span>{btn.icon}</span>
                      <span>+ {btn.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {phasesList.length === 0 ? (
                <div className="text-center py-12 px-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10">
                  <Layers className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                  <h4 className="text-base font-bold text-slate-800 dark:text-white">Még nincsenek hozzáadva lépések</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                    Kattints a fenti gyorstípus-gombok egyikére, vagy kérj AI segítséget egy lépés összeállításához!
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => addPhaseOfType('info')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white font-bold text-xs shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      📖 Elméleti Bevezető Hozzáadása
                    </button>
                    <button
                      type="button"
                      onClick={() => addPhaseOfType('quiz')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-bold text-xs shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      ❓ Kvíz Lépés Hozzáadása
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

                            <div className="flex-1 flex items-center gap-1.5">
                              <input
                                type="text"
                                value={getLocalizedStr(phase.title, activeEditorLang)}
                                onChange={(e) =>
                                  updatePhase(idx, {
                                    title: setLocalizedStr(phase.title, activeEditorLang, e.target.value),
                                  })
                                }
                                placeholder={`Fázis címe (${activeEditorLang.toUpperCase()})...`}
                                className="flex-1 font-bold text-sm bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-white/20 focus:border-[#269984] focus:outline-none px-1 py-0.5 text-slate-900 dark:text-white"
                              />
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-500">
                                {activeEditorLang.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-auto">
                            {/* View selector */}
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

                            {/* Duplicate phase */}
                            <button
                              type="button"
                              onClick={() => duplicatePhase(idx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-white/5 transition-colors"
                              title="Fázis duplikálása (másolat létrehozása)"
                            >
                              <Copy className="w-4 h-4" />
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
                          <div className="p-5 space-y-5">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                                  Lépés Leírása / Célja
                                </label>
                                <span className="text-[10px] font-bold text-slate-400">{activeEditorLang.toUpperCase()}</span>
                              </div>
                              <input
                                type="text"
                                value={getLocalizedStr(phase.summary, activeEditorLang)}
                                onChange={(e) =>
                                  updatePhase(idx, {
                                    summary: setLocalizedStr(phase.summary, activeEditorLang, e.target.value),
                                  })
                                }
                                placeholder={`pl. A téma bemutatása, gyakorlati összefüggések (${activeEditorLang.toUpperCase()})...`}
                                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                              />
                            </div>

                            {/* Task editor depending on sourceView */}
                            {/* QUIZ */}
                            {phase.sourceView === 'quiz' && (
                              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                      Kvízkérdések ({(phase.quiz || []).length} kérdés)
                                    </label>
                                    <span className="text-[10px] font-bold text-amber-600">[{activeEditorLang.toUpperCase()}]</span>
                                  </div>
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
                                        value={getLocalizedStr(q.question, activeEditorLang)}
                                        onChange={(e) => updateQuizQuestionText(idx, qIdx, e.target.value)}
                                        placeholder={`Kérdés szövege (${activeEditorLang.toUpperCase()})...`}
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
                                            value={getLocalizedStr(opt.option, activeEditorLang)}
                                            onChange={(e) => updateQuizOptionText(idx, qIdx, optIdx, e.target.value)}
                                            placeholder={`Válasz ${optIdx + 1} (${activeEditorLang.toUpperCase()})...`}
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
                                        value={getLocalizedStr(q.explanation, activeEditorLang)}
                                        onChange={(e) => updateQuizExplanation(idx, qIdx, e.target.value)}
                                        placeholder={`Magyarázat helyes/helytelen válasz esetén (${activeEditorLang.toUpperCase()})...`}
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
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                                      Szöveg vagy Kód a Hiányzó Helyekkel (használd a &#123;&#123;gap&#125;&#125; tokent)
                                    </label>
                                    <span className="text-[10px] font-bold text-blue-600">[{activeEditorLang.toUpperCase()}]</span>
                                  </div>
                                  <textarea
                                    rows={3}
                                    value={getLocalizedStr(phase.gapFillContent, activeEditorLang)}
                                    onChange={(e) =>
                                      updatePhase(idx, {
                                        gapFillContent: setLocalizedStr(phase.gapFillContent, activeEditorLang, e.target.value),
                                      })
                                    }
                                    placeholder="pl. A Pythonban a {{gap}} utasítással tudunk szöveget kiírni a képernyőre."
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
                                          value={getLocalizedStr(sol.solution, activeEditorLang)}
                                          onChange={(e) => updateGapSolution(idx, solIdx, e.target.value)}
                                          placeholder="megoldás"
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
                                          value={getLocalizedStr(dec.decoy, activeEditorLang)}
                                          onChange={(e) => updateGapDecoy(idx, decIdx, e.target.value)}
                                          placeholder="félrevezető szó"
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
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                                      Párosítandó Fogalmak & Meghatározások
                                    </label>
                                    <span className="text-[10px] font-bold text-blue-600">[{activeEditorLang.toUpperCase()}]</span>
                                  </div>
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
                                        value={getLocalizedStr(m.left, activeEditorLang)}
                                        onChange={(e) => updateMatchPair(idx, mIdx, 'left', e.target.value)}
                                        placeholder={`Bal oldal (fogalom / kifejezés) (${activeEditorLang.toUpperCase()})...`}
                                        className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none"
                                      />
                                      <span className="text-slate-400">⇄</span>
                                      <input
                                        type="text"
                                        value={getLocalizedStr(m.right, activeEditorLang)}
                                        onChange={(e) => updateMatchPair(idx, mIdx, 'right', e.target.value)}
                                        placeholder={`Jobb oldal (meghatározás / leírás) (${activeEditorLang.toUpperCase()})...`}
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
                                  <div className="flex items-center gap-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                                      Helyes Lépések Sorrendje
                                    </label>
                                    <span className="text-[10px] font-bold text-indigo-600">[{activeEditorLang.toUpperCase()}]</span>
                                  </div>
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
                                        value={getLocalizedStr(o.text, activeEditorLang)}
                                        onChange={(e) => updateOrderItem(idx, oIdx, e.target.value)}
                                        placeholder={`Lépés leírása (${activeEditorLang.toUpperCase()})...`}
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

                            {/* INFO / READING (MARKDOWN WITH VIEWER & TOOLBAR) */}
                            {phase.sourceView === 'info' && (() => {
                              const mode = infoViewModes[idx] || 'split';
                              const currentMd = getLocalizedStr(phase.infoContent, activeEditorLang);

                              return (
                                <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 space-y-3">
                                  {/* Header & Mode Switcher */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-cyan-500/20">
                                    <div className="flex items-center gap-2">
                                      <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                                      <label className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-300">
                                        Tananyag / Elméleti Szöveg (Markdown)
                                      </label>
                                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                                        {activeEditorLang.toUpperCase()}
                                      </span>
                                    </div>

                                    {/* View Mode Buttons: Szerkesztés | Előnézet | Osztott */}
                                    <div className="inline-flex items-center p-0.5 rounded-xl bg-white dark:bg-slate-900 border border-cyan-500/30 text-xs">
                                      <button
                                        type="button"
                                        onClick={() => setInfoViewModes((prev) => ({ ...prev, [idx]: 'edit' }))}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                                          mode === 'edit'
                                            ? 'bg-cyan-600 text-white shadow-sm'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-cyan-700'
                                        }`}
                                      >
                                        <Edit3 className="w-3 h-3" /> Szerkesztés
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setInfoViewModes((prev) => ({ ...prev, [idx]: 'preview' }))}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                                          mode === 'preview'
                                            ? 'bg-cyan-600 text-white shadow-sm'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-cyan-700'
                                        }`}
                                      >
                                        <Eye className="w-3 h-3" /> Előnézet
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setInfoViewModes((prev) => ({ ...prev, [idx]: 'split' }))}
                                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                                          mode === 'split'
                                            ? 'bg-cyan-600 text-white shadow-sm'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-cyan-700'
                                        }`}
                                      >
                                        <Columns className="w-3 h-3" /> Osztott
                                      </button>
                                    </div>
                                  </div>

                                  {/* Formatting Toolbar */}
                                  {mode !== 'preview' && (
                                    <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-cyan-500/20 text-xs">
                                      <span className="text-[10px] font-bold text-slate-400 px-1">Formázás:</span>
                                      <button
                                        type="button"
                                        onClick={() => insertMarkdownSyntax(idx, '## ')}
                                        className="px-2 py-0.5 rounded font-bold text-slate-700 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:text-cyan-600 border border-slate-200 dark:border-white/10"
                                        title="Címsor 2"
                                      >
                                        H2
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => insertMarkdownSyntax(idx, '### ')}
                                        className="px-2 py-0.5 rounded font-bold text-slate-700 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:text-cyan-600 border border-slate-200 dark:border-white/10"
                                        title="Címsor 3"
                                      >
                                        H3
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => insertMarkdownSyntax(idx, '**', '**')}
                                        className="px-2 py-0.5 rounded font-black text-slate-800 dark:text-slate-200 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:text-cyan-600 border border-slate-200 dark:border-white/10"
                                        title="Félkövér"
                                      >
                                        B
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => insertMarkdownSyntax(idx, '*', '*')}
                                        className="px-2 py-0.5 rounded italic font-serif text-slate-800 dark:text-slate-200 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:text-cyan-600 border border-slate-200 dark:border-white/10"
                                        title="Dőlt"
                                      >
                                        I
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => insertMarkdownSyntax(idx, '`', '`')}
                                        className="px-2 py-0.5 rounded font-mono text-[11px] text-slate-800 dark:text-slate-200 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 hover:text-cyan-600 border border-slate-200 dark:border-white/10"
                                        title="Soron belüli kód"
                                      >
                                        &lt;/&gt;
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => insertMarkdownSyntax(idx, '\n```python\n# Kódblokk ide\nprint("Hello")\n```\n')}
                                        className="px-2 py-0.5 rounded font-mono text-[11px] bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-cyan-50 hover:text-cyan-600"
                                        title="Python Kódblokk"
                                      >
                                        ``` Kódblokk
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => insertMarkdownSyntax(idx, '- ')}
                                        className="px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 hover:bg-cyan-50 hover:text-cyan-600 border border-slate-200 dark:border-white/10"
                                        title="Listaelem"
                                      >
                                        • Lista
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => insertMarkdownSyntax(idx, '> ')}
                                        className="px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 hover:bg-cyan-50 hover:text-cyan-600 border border-slate-200 dark:border-white/10"
                                        title="Kiemelt idézet / Megjegyzés"
                                      >
                                        &quot; Idézet
                                      </button>
                                    </div>
                                  )}

                                  {/* Editor and Preview Layout */}
                                  <div className={`grid gap-4 ${mode === 'split' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                                    {/* Textarea Editor */}
                                    {(mode === 'edit' || mode === 'split') && (
                                      <div className="relative">
                                        <div className="absolute top-2 right-2 text-[10px] uppercase font-bold text-slate-400 bg-white/80 dark:bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-200 dark:border-white/10 z-10">
                                          Markdown Forrás
                                        </div>
                                        <textarea
                                          rows={10}
                                          value={currentMd}
                                          onChange={(e) =>
                                            updatePhase(idx, {
                                              infoContent: setLocalizedStr(phase.infoContent, activeEditorLang, e.target.value),
                                            })
                                          }
                                          placeholder="Írd ide az elméleti tananyagot Markdown formátumban..."
                                          className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-cyan-200 dark:border-cyan-800/40 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed resize-y"
                                        />
                                      </div>
                                    )}

                                    {/* Live Markdown Preview */}
                                    {(mode === 'preview' || mode === 'split') && (
                                      <div className="relative flex flex-col">
                                        <div className="absolute top-2 right-2 text-[10px] uppercase font-bold text-cyan-600 bg-white/90 dark:bg-slate-900/90 px-1.5 py-0.5 rounded border border-cyan-500/20 z-10">
                                          Élő Előnézet
                                        </div>
                                        <div className="flex-1 p-4 rounded-xl border border-cyan-200/80 dark:border-cyan-800/30 bg-white dark:bg-slate-900 overflow-y-auto max-h-[400px]">
                                          {currentMd ? (
                                            <div className="prose dark:prose-invert max-w-none text-xs leading-relaxed break-words">
                                              <ReactMarkdown>{currentMd}</ReactMarkdown>
                                            </div>
                                          ) : (
                                            <p className="text-xs text-slate-400 italic">
                                              Még nincs tartalom. Írj a bal oldali mezőbe a formázott megjelenítéshez!
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}

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

                            {/* General Phase Evaluation & Progress (Always visible) */}
                            <div className="pt-4 border-t border-slate-200/60 dark:border-white/5 space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-white/5">
                                {/* maxPoints */}
                                <div>
                                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                    ⭐ Maximális Pontszám a Lépésért
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={phase.maxPoints ?? 10}
                                    onChange={(e) => updatePhase(idx, { maxPoints: Number(e.target.value) || 10 })}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#269984]"
                                  />
                                </div>

                                {/* askConfidence */}
                                <div className="flex items-center gap-3 pt-2 sm:pt-4">
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={phase.askConfidence ?? true}
                                      onChange={(e) => updatePhase(idx, { askConfidence: e.target.checked })}
                                      className="sr-only peer"
                                    />
                                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#269984]"></div>
                                  </label>
                                  <div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                                      Magabiztosság megkérdezése
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      Megkérdezi a diákot a válasz előtt, mennyire biztos a dolgában
                                    </span>
                                  </div>
                                </div>

                                {courseForm.mascot.mode === 'ai-only' && (
                                  <div className="sm:col-span-2 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300 font-medium">
                                    <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                    <span>🤖 <strong>Csak AI kabala aktív</strong>: A lépéshez tartozó tanácsokat és reakciókat a mesterséges intelligencia generálja valós időben (manuális szöveg megadása nem szükséges).</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Phase Mascot Guidance (Collapsible so phase cards stay compact!) */}
                            {courseForm.mascot.enabled &&
                              (courseForm.mascot.mode === 'ai-fallback' || courseForm.mascot.mode === 'manual-only') && (
                              <div className="rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-500/20 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenPhaseMascotIdx((prev) => ({ ...prev, [idx]: !prev[idx] }))
                                  }
                                  className="w-full flex items-center justify-between p-3.5 hover:bg-teal-500/10 transition-colors text-left"
                                >
                                  <div className="flex items-center gap-2">
                                    <Bot className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                                      {courseForm.mascot.mode === 'ai-fallback'
                                        ? '🛡️ Kabala Tartalék (Fallback) Szövegek Ebben a Lépésben (3 Nyelven)'
                                        : '🤖 Kabala Tanácsadás & Szövegek Ebben a Lépésben (3 Nyelven)'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600">
                                      {getLocalizedStr(courseForm.mascot.name, activeEditorLang) || 'Bubi'}
                                    </span>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-teal-500/20 text-[10px] font-bold text-teal-700 dark:text-teal-300">
                                      {openPhaseMascotIdx[idx] ? (
                                        <>
                                          Elrejtés <ChevronUp className="w-3 h-3" />
                                        </>
                                      ) : (
                                        <>
                                          Szerkesztés <ChevronDown className="w-3 h-3" />
                                        </>
                                      )}
                                    </span>
                                  </div>
                                </button>

                                {openPhaseMascotIdx[idx] && (
                                  <div className="p-4 pt-2 border-t border-teal-500/10 space-y-3">
                                    {/* hintCopy - 3 Nyelv */}
                                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-teal-200/60 dark:border-teal-800/30 space-y-1.5">
                                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                        💡 Kabala Segítő Tipp (Bubi tanácsa erre a lépésre)
                                      </label>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 shrink-0">
                                            HU
                                          </span>
                                          <input
                                            type="text"
                                            value={getLocalizedStr(phase.hintCopy, 'hu')}
                                            onChange={(e) =>
                                              updatePhase(idx, {
                                                hintCopy: setLocalizedStr(phase.hintCopy, 'hu', e.target.value),
                                              })
                                            }
                                            placeholder="Tipp magyarul..."
                                            className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                                          />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 shrink-0">
                                            EN
                                          </span>
                                          <input
                                            type="text"
                                            value={getLocalizedStr(phase.hintCopy, 'en')}
                                            onChange={(e) =>
                                              updatePhase(idx, {
                                                hintCopy: setLocalizedStr(phase.hintCopy, 'en', e.target.value),
                                              })
                                            }
                                            placeholder="Hint in English..."
                                            className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                                          />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 shrink-0">
                                            RO
                                          </span>
                                          <input
                                            type="text"
                                            value={getLocalizedStr(phase.hintCopy, 'ro')}
                                            onChange={(e) =>
                                              updatePhase(idx, {
                                                hintCopy: setLocalizedStr(phase.hintCopy, 'ro', e.target.value),
                                              })
                                            }
                                            placeholder="Indiciu în română..."
                                            className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    {/* mascotLine - 3 Nyelv */}
                                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-teal-200/60 dark:border-teal-800/30 space-y-1.5">
                                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                        👋 Kabala Kezdő / Bátorító Szöveg
                                      </label>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 shrink-0">
                                            HU
                                          </span>
                                          <input
                                            type="text"
                                            value={getLocalizedStr(phase.mascotLine, 'hu')}
                                            onChange={(e) =>
                                              updatePhase(idx, {
                                                mascotLine: setLocalizedStr(phase.mascotLine, 'hu', e.target.value),
                                              })
                                            }
                                            placeholder="Bátorítás magyarul..."
                                            className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                                          />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 shrink-0">
                                            EN
                                          </span>
                                          <input
                                            type="text"
                                            value={getLocalizedStr(phase.mascotLine, 'en')}
                                            onChange={(e) =>
                                              updatePhase(idx, {
                                                mascotLine: setLocalizedStr(phase.mascotLine, 'en', e.target.value),
                                              })
                                            }
                                            placeholder="Intro line in English..."
                                            className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                                          />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 shrink-0">
                                            RO
                                          </span>
                                          <input
                                            type="text"
                                            value={getLocalizedStr(phase.mascotLine, 'ro')}
                                            onChange={(e) =>
                                              updatePhase(idx, {
                                                mascotLine: setLocalizedStr(phase.mascotLine, 'ro', e.target.value),
                                              })
                                            }
                                            placeholder="Încurajare în română..."
                                            className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    {/* mascotMistakeLine - 3 Nyelv */}
                                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-teal-200/60 dark:border-teal-800/30 space-y-1.5">
                                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                        🩹 Kabala Szövege Hiba Esetén
                                      </label>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 shrink-0">
                                            HU
                                          </span>
                                          <input
                                            type="text"
                                            value={getLocalizedStr(phase.mascotMistakeLine, 'hu')}
                                            onChange={(e) =>
                                              updatePhase(idx, {
                                                mascotMistakeLine: setLocalizedStr(phase.mascotMistakeLine, 'hu', e.target.value),
                                              })
                                            }
                                            placeholder="Reakció hiba esetén magyarul..."
                                            className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                                          />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 shrink-0">
                                            EN
                                          </span>
                                          <input
                                            type="text"
                                            value={getLocalizedStr(phase.mascotMistakeLine, 'en')}
                                            onChange={(e) =>
                                              updatePhase(idx, {
                                                mascotMistakeLine: setLocalizedStr(phase.mascotMistakeLine, 'en', e.target.value),
                                              })
                                            }
                                            placeholder="Mistake response in English..."
                                            className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                                          />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 shrink-0">
                                            RO
                                          </span>
                                          <input
                                            type="text"
                                            value={getLocalizedStr(phase.mascotMistakeLine, 'ro')}
                                            onChange={(e) =>
                                              updatePhase(idx, {
                                                mascotMistakeLine: setLocalizedStr(phase.mascotMistakeLine, 'ro', e.target.value),
                                              })
                                            }
                                            placeholder="Reacție la greșeală în română..."
                                            className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    {/* idleHelp - 3 Nyelv */}
                                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-teal-200/60 dark:border-teal-800/30 space-y-1.5">
                                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                        ⏳ Kabala Szövege Tétlenség Esetén
                                      </label>
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 shrink-0">
                                            HU
                                          </span>
                                          <input
                                            type="text"
                                            value={getLocalizedStr(phase.idleHelp, 'hu')}
                                            onChange={(e) =>
                                              updatePhase(idx, {
                                                idleHelp: setLocalizedStr(phase.idleHelp, 'hu', e.target.value),
                                              })
                                            }
                                            placeholder="Noszogatás magyarul..."
                                            className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                                          />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 shrink-0">
                                            EN
                                          </span>
                                          <input
                                            type="text"
                                            value={getLocalizedStr(phase.idleHelp, 'en')}
                                            onChange={(e) =>
                                              updatePhase(idx, {
                                                idleHelp: setLocalizedStr(phase.idleHelp, 'en', e.target.value),
                                              })
                                            }
                                            placeholder="Idle nudge in English..."
                                            className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                                          />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 shrink-0">
                                            RO
                                          </span>
                                          <input
                                            type="text"
                                            value={getLocalizedStr(phase.idleHelp, 'ro')}
                                            onChange={(e) =>
                                              updatePhase(idx, {
                                                idleHelp: setLocalizedStr(phase.idleHelp, 'ro', e.target.value),
                                              })
                                            }
                                            placeholder="Îndemn la inactivitate în română..."
                                            className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white focus:outline-none focus:border-[#269984]"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add phase button at bottom */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => addPhaseOfType('info')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-cyan-500 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> 📖 Elmélet
                  </button>
                  <button
                    type="button"
                    onClick={() => addPhaseOfType('quiz')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-amber-500 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> ❓ Kvíz
                  </button>
                  <button
                    type="button"
                    onClick={() => addPhaseOfType('gap-fill')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-blue-500 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> 🧩 Hiánypótlás
                  </button>
                  <button
                    type="button"
                    onClick={() => addPhaseOfType('debug')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:border-rose-500 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> 🐞 Hibakeresés
                  </button>
                </div>

                <button
                  type="button"
                  onClick={openNewPhaseAiModal}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition-all"
                >
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  + Új Lépés Generálása AI-val
                </button>
              </div>

                {/* Step 3 Bottom Navigation */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => setEditorStep('mascot')}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 font-bold text-xs transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Vissza a Kabala Beállításokhoz (2. Lépés)</span>
                  </button>
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
              </div>
            )}
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
