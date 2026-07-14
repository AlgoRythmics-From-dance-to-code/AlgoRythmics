'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from '@payloadcms/ui';
import { useLocale } from '../../i18n/LocaleProvider';
import {
  Sparkles,
  Loader2,
  Globe,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

const customExamples = {
  hu: [
    {
      label: 'Selection Sort (Kezdő)',
      description: 'Egy kezdő kurzus a Selection Sort (minimumkereséses rendezés) algoritmusról.',
      steps: [
        'Bevezetés a Selection Sort működésébe, egyszerű hétköznapi példával (pl. kártyák sorba rendezése).',
        'Az algoritmus vizuális működésének bemutatása animáción keresztül, lépésről lépésre.',
        'Egy interaktív kvíz, ami teszteli, hogy a tanuló megértette-e a minimumkeresés és csere elvét.',
        'Kód kiegészítő feladat (gap-fill), ahol a tanulónak ki kell választania a megfelelő kódrészleteket a minimumkereséshez.',
        'Összegzés és végső kihívás a rendezési lépések helyes sorrendbe rakásáról.',
      ],
    },
    {
      label: 'Bubble Sort (Középhaladó)',
      description:
        'Közép-haladó Bubble Sort kurzus a rendezés hatékonyságára és optimalizációjára fókuszálva.',
      steps: [
        'A Bubble Sort elméleti alapjainak bemutatása, összehasonlítások és cserék magyarázata.',
        'Kód hibakeresési (debug) feladat, ahol egy rosszul megírt bubble sort kódot kell kijavítani (pl. rossz ciklushatár).',
        'Interaktív szimulációs feladat, ahol a tanulónak manuálisan kell cserélnie az elemeket lépésenként.',
        'Rövid kvíz az optimalizált bubble sortról (pl. a swapped flag használata inaktivitás megelőzésére).',
      ],
    },
  ],
  en: [
    {
      label: 'Selection Sort (Beginner)',
      description:
        'A beginner level course introducing Selection Sort algorithm and its key concepts.',
      steps: [
        'Introduction to Selection Sort with a simple real-world card sorting analogy.',
        'Step-by-step visual animation demonstrating how the minimum element is selected and swapped.',
        "Interactive quiz checking the student's understanding of minimum index searching.",
        'Code gap-fill exercise to complete the nested loop condition of selection sort.',
        'A final sorting challenge to order the steps of the algorithm correctly.',
      ],
    },
    {
      label: 'Bubble Sort (Intermediate)',
      description: 'An intermediate course on Bubble Sort focusing on code optimization.',
      steps: [
        'Theory of Bubble Sort, explaining adjacent element comparison and swapping.',
        'Code debugging task to fix an off-by-one error in a bubble sort loop.',
        'Interactive simulation where the student manually performs sorting swaps.',
        'Quiz testing the purpose of the boolean swapped flag optimization.',
      ],
    },
  ],
  ro: [
    {
      label: 'Selection Sort (Începător)',
      description: 'Un curs de nivel începător care introduce algoritmul Selection Sort.',
      steps: [
        'Introducere în Selection Sort cu o analogie simplă din lumea reală.',
        'Animație vizuală pas cu pas care arată cum elementul minim este selectat și schimbat.',
        'Chestionar interactiv pentru verificarea înțelegerii căutării indexului minim.',
        'Exercițiu de completare a codului (gap-fill) pentru buclele selection sort.',
        'O provocare finală pentru ordonarea corectă a pașilor algoritmului.',
      ],
    },
  ],
};

const loadingSteps = {
  hu: [
    'OpenRouter kapcsolat inicializálása...',
    'Téma és lépések elemzése...',
    'Tanulási fázisok párhuzamos fordítása mindhárom nyelvre (hu, en, ro)...',
    'Háromnyelvű interaktív kvízek generálása...',
    'Kabala üdvözlő és streak üzenetek megfogalmazása mindhárom nyelven...',
    'Háromnyelvű kódszerkesztő és gap-fill feladatok előkészítése...',
    'Payload localized űrlap mezők kitöltése...',
  ],
  en: [
    'Initializing OpenRouter request...',
    'Analyzing topic and planned steps...',
    'Translating and generating phases in all 3 languages (hu, en, ro) simultaneously...',
    'Generating localized interactive quizzes...',
    'Writing mascot prompts and streak messages in all 3 languages...',
    'Preparing localized code editors and gap-fill data...',
    'Populating Payload localized form state...',
  ],
  ro: [
    'Inițializarea conexiunii OpenRouter...',
    'Analizarea temei și a pașilor planificați...',
    'Traducerea și generarea fazelor în toate cele 3 limbi (hu, en, ro) simultan...',
    'Generarea chestionarelor interactive localizate...',
    'Configurarea mesajelor mascotei în toate cele 3 limbi...',
    'Pregătirea editorului de cod și a exercițiilor gap-fill...',
    'Completarea câmpurilor localizate din Payload...',
  ],
};

export default function AIGeneratorField() {
  const { locale } = useLocale();
  const {
    dispatchFields,
    addFieldRow: _addFieldRow,
    removeFieldRow: _removeFieldRow,
    getData: _getData,
  } = useForm();
  const formDispatch = dispatchFields;

  const [generalDescription, setGeneralDescription] = useState('');
  const [stepsList, setStepsList] = useState<string[]>(['', '', '']);
  const [model, setModel] = useState('openrouter/free');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);
  const [saveWarning, setSaveWarning] = useState<string | null>(null);

  const activeLocale = locale === 'hu' || locale === 'en' || locale === 'ro' ? locale : 'en';
  const examples = customExamples[activeLocale] || customExamples['en'];
  const steps = loadingSteps[activeLocale] || loadingSteps['en'];

  const loadingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Keep loadingRef in sync with loading state
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  // Prevent browser tab close or reload when generating
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (loading) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [loading]);

  const modalText = {
    hu: {
      title: 'Kurzus generálása folyamatban',
      description:
        'Kérjük, ne válts tabot és ne zárd be a böngészőablakot, különben a folyamat megszakad.',
      cancel: 'Megszakítás és képernyő feloldása',
    },
    en: {
      title: 'Course Generation in Progress',
      description:
        'Please do not switch tabs or close this browser window. Doing so will cancel the generation.',
      cancel: 'Cancel & Unblock Screen',
    },
    ro: {
      title: 'Generare curs în desfășurare',
      description:
        'Vă rugăm să nu schimbați taburile și să nu închideți fereastra, altfel procesul se va întrerupe.',
      cancel: 'Anulează și deblochează ecranul',
    },
  };
  const activeModalText = modalText[activeLocale] || modalText['en'];

  // Rotate loading steps for visual progress feedback
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % steps.length);
      }, 2000);
    } else {
      setCurrentStep(0);
    }
    return () => clearInterval(interval);
  }, [loading, steps.length]);

  const handleAddStep = () => {
    setStepsList([...stepsList, '']);
  };

  const handleRemoveStep = (index: number) => {
    const updated = stepsList.filter((_, i) => i !== index);
    setStepsList(updated.length > 0 ? updated : ['']);
  };

  const handleStepChange = (index: number, val: string) => {
    const updated = [...stepsList];
    updated[index] = val;
    setStepsList(updated);
  };

  const handleExampleClick = (ex: (typeof examples)[number]) => {
    setGeneralDescription(ex.description);
    setStepsList(ex.steps);
  };

  const handleGenerate = async () => {
    if (!generalDescription.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    // Combine description and outline steps into a structured prompt
    const combinedPrompt = `
Topic and General Description:
${generalDescription}

Course Outline / Phases:
${stepsList
  .map((s, i) => {
    const val = s.trim();
    if (val === '') {
      return `Step ${i + 1}: [EMPTY - AI must invent a creative, unique educational phase or interactive task (e.g. debugging, gap-fill, or quiz) that fits logically here]`;
    }
    return `Step ${i + 1}: ${val}`;
  })
  .join('\n')}
`;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/ai/generate-course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: combinedPrompt, model }),
        signal: controller.signal,
      });

      const rawData = await response.json();

      if (!response.ok) {
        throw new Error(rawData.error || 'Failed to generate course');
      }

      // Check if the user cancelled the process during the fetch request
      if (!loadingRef.current) {
        console.log('[AI Course Generation] Process cancelled by the user.');
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = rawData as any;

      // New server-side save flow: the API now saves the course directly via Payload
      if (data.success && data.courseId) {
        // Course was successfully saved with all 3 languages
        setCreatedCourseId(data.courseId);
        setSaveWarning(null);
        setSuccess(true);
      } else if (data.success === false && data.saveError) {
        // Generation succeeded but Payload save failed (e.g. duplicate slug)
        setSaveWarning(data.saveError);
        setCreatedCourseId(null);
        setSuccess(true);
      } else if (!data.error) {
        // Legacy format fallback (backwards compatible): populate form fields
        if (!formDispatch) {
          throw new Error(
            'Form dispatch context not available. Ensure this field is mounted in a Payload form.',
          );
        }

        // Helper to dispatch form update
        const updateField = (path: string, val: unknown) => {
          formDispatch({
            type: 'UPDATE',
            path,
            value: val,
            initialValue: val,
          });
        };

        // Helper to extract localized string
        const getLocVal = (val: string | Record<string, string> | null | undefined) => {
          if (val && typeof val === 'object' && ('hu' in val || 'en' in val || 'ro' in val)) {
            return val[activeLocale] || val.en || val.hu || '';
          }
          return val;
        };

        if (data.title) updateField('title', getLocVal(data.title));
        if (data.slug) updateField('slug', data.slug);
        if (data.summary) updateField('summary', getLocVal(data.summary));
        setSaveWarning(null);
        setCreatedCourseId(null);
        setSuccess(true);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('[AI Course Generation] Request aborted by user.');
        return;
      }
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: '8px',
        padding: '24px',
        backgroundColor: 'var(--theme-elevation-50)',
        marginBottom: '30px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
        <div
          style={{
            backgroundColor: '#269984',
            color: '#ffffff',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 10px rgba(38, 153, 132, 0.3)',
          }}
        >
          <Sparkles size={16} />
        </div>
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 700,
              color: 'var(--theme-elevation-900)',
            }}
          >
            OpenRouter Multi-Language Course Generator
          </h3>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--theme-elevation-500)' }}>
            Design course outlines and dynamically generate translations for Hungarian, English, and
            Romanian simultaneously.
          </p>
        </div>
      </div>

      {/* Model Selector */}
      <div style={{ marginTop: '16px', marginBottom: '16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <label
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 'bold',
              color: 'var(--theme-elevation-600)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: 0,
            }}
          >
            OpenRouter Model / Modell név
          </label>
          <a
            href="https://openrouter.ai/collections/free-models"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '11px',
              color: '#269984',
              textDecoration: 'underline',
              fontWeight: '500',
            }}
          >
            Free Models / Ingyenes modellek
          </a>
        </div>
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={loading}
          placeholder="Enter a model ID or leave as openrouter/free (e.g. meta-llama/llama-3.3-70b-instruct:free)"
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '4px',
            border: '1px solid var(--theme-elevation-200)',
            backgroundColor: 'var(--theme-elevation-0)',
            color: 'var(--theme-elevation-900)',
            fontSize: '13px',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#269984';
            e.target.style.boxShadow = '0 0 0 2px rgba(38, 153, 132, 0.15)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--theme-elevation-200)';
            e.target.style.boxShadow = 'none';
          }}
        />

        {/* Model Presets */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
          {[
            { id: 'openrouter/free', label: 'Random Free' },
            { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
            { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini' },
            { id: 'anthropic/claude-3.5-haiku', label: 'Claude 3.5 Haiku' },
          ].map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => !loading && setModel(preset.id)}
              disabled={loading}
              style={{
                cursor: loading ? 'not-allowed' : 'pointer',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                border:
                  '1px solid ' + (model === preset.id ? '#269984' : 'var(--theme-elevation-200)'),
                backgroundColor: model === preset.id ? 'rgba(38, 153, 132, 0.1)' : 'transparent',
                color: model === preset.id ? '#269984' : 'var(--theme-elevation-600)',
                fontWeight: model === preset.id ? 'bold' : 'normal',
                transition: 'all 0.15s ease',
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* General Description */}
      <div style={{ marginTop: '16px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 'bold',
            color: 'var(--theme-elevation-600)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '8px',
          }}
        >
          Topic & General Description / Kurzusz téma és leírás
        </label>
        <textarea
          value={generalDescription}
          onChange={(e) => setGeneralDescription(e.target.value)}
          disabled={loading}
          placeholder="Describe what the course is about (e.g. A beginner introduction to Selection Sort and how it differs from Bubble Sort)..."
          style={{
            width: '100%',
            minHeight: '80px',
            padding: '10px 14px',
            borderRadius: '4px',
            border: '1px solid var(--theme-elevation-200)',
            backgroundColor: 'var(--theme-elevation-0)',
            color: 'var(--theme-elevation-900)',
            fontSize: '13px',
            outline: 'none',
            resize: 'vertical',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#269984';
            e.target.style.boxShadow = '0 0 0 2px rgba(38, 153, 132, 0.15)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--theme-elevation-200)';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>

      {/* Dynamic Steps List Builder */}
      <div style={{ marginTop: '20px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 'bold',
            color: 'var(--theme-elevation-600)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '8px',
          }}
        >
          Course Outline Steps / Kurzus lépések és fázisok leírása
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {stepsList.map((step, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: 'var(--theme-elevation-500)',
                  minWidth: '55px',
                  textTransform: 'uppercase',
                }}
              >
                Step {index + 1}
              </span>
              <input
                type="text"
                value={step}
                onChange={(e) => handleStepChange(index, e.target.value)}
                disabled={loading}
                placeholder={`One-sentence content description for step ${index + 1}...`}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid var(--theme-elevation-200)',
                  backgroundColor: 'var(--theme-elevation-0)',
                  color: 'var(--theme-elevation-900)',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#269984';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--theme-elevation-200)';
                }}
              />
              <button
                type="button"
                onClick={() => handleRemoveStep(index)}
                disabled={loading}
                style={{
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid var(--theme-elevation-200)',
                  backgroundColor: 'transparent',
                  color: 'var(--theme-error-500)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = 'rgba(235, 87, 87, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(235, 87, 87, 0.2)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'var(--theme-elevation-200)';
                  }
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={handleAddStep}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '12px',
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px dashed #269984',
            backgroundColor: 'transparent',
            color: '#269984',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = 'rgba(38, 153, 132, 0.05)';
          }}
          onMouseLeave={(e) => {
            if (!loading) e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <Plus size={12} />
          <span>Add Step / Új lépés hozzáadása</span>
        </button>
      </div>

      {/* Example Presets */}
      <div style={{ marginTop: '20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 'bold',
            color: 'var(--theme-elevation-600)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '8px',
          }}
        >
          <Lightbulb size={12} style={{ color: '#269984' }} />
          <span>💡 Suggestions / Sablonok</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {examples.map((ex, index) => (
            <button
              key={index}
              type="button"
              onClick={() => !loading && handleExampleClick(ex)}
              disabled={loading}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                border: '1px dashed var(--theme-elevation-200)',
                backgroundColor: 'transparent',
                color: 'var(--theme-elevation-700)',
                fontSize: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.borderColor = '#269984';
                  e.currentTarget.style.backgroundColor = 'var(--theme-elevation-100)';
                  e.currentTarget.style.color = '#269984';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.borderColor = 'var(--theme-elevation-200)';
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--theme-elevation-700)';
                }
              }}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Footer controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid var(--theme-elevation-150)',
        }}
      >
        {/* Language Information */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={14} style={{ color: 'var(--theme-elevation-400)' }} />
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--theme-elevation-600)' }}>
            Generating localized fields in:{' '}
            <strong style={{ color: 'var(--theme-elevation-900)' }}>
              Hungarian, English, Romanian
            </strong>
          </span>
        </div>

        {/* Generate Button */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || !generalDescription.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '4px',
            backgroundColor:
              loading || !generalDescription.trim() ? 'var(--theme-elevation-200)' : '#269984',
            color: loading || !generalDescription.trim() ? 'var(--theme-elevation-400)' : '#ffffff',
            border: 'none',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: loading || !generalDescription.trim() ? 'not-allowed' : 'pointer',
            boxShadow:
              loading || !generalDescription.trim() ? 'none' : '0 2px 6px rgba(38, 153, 132, 0.25)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            if (!loading && generalDescription.trim()) {
              e.currentTarget.style.backgroundColor = '#1e7b69';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && generalDescription.trim()) {
              e.currentTarget.style.backgroundColor = '#269984';
              e.currentTarget.style.transform = 'translateY(0)';
            }
          }}
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles size={14} />
              <span>Generate 3-Language Course</span>
            </>
          )}
        </button>
      </div>

      {/* Fullscreen Loading Overlay Modal */}
      {loading && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--theme-elevation-100)',
              color: 'var(--theme-elevation-900)',
              borderRadius: '12px',
              padding: '40px',
              maxWidth: '500px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
              border: '1px solid var(--theme-elevation-200)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
            }}
          >
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Loader2 size={48} className="animate-spin" style={{ color: '#269984' }} />
              <Sparkles
                size={20}
                style={{
                  position: 'absolute',
                  color: '#269984',
                  animation: 'pulse 1.5s infinite ease-in-out',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>
                {activeModalText.title}
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--theme-elevation-500)' }}>
                {activeModalText.description}
              </p>
            </div>

            {/* Current Loading Step */}
            <div
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: 'var(--theme-elevation-50)',
                borderRadius: '8px',
                border: '1px solid var(--theme-elevation-150)',
                fontSize: '13px',
                fontWeight: '500',
                color: '#269984',
                minHeight: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {steps[currentStep]}
            </div>

            <button
              type="button"
              onClick={() => {
                abortControllerRef.current?.abort();
                setLoading(false);
              }}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid var(--theme-elevation-200)',
                backgroundColor: 'transparent',
                color: 'var(--theme-elevation-600)',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--theme-elevation-150)';
                e.currentTarget.style.color = 'var(--theme-elevation-900)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--theme-elevation-600)';
              }}
            >
              {activeModalText.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: 'rgba(235, 87, 87, 0.08)',
            border: '1px solid rgba(235, 87, 87, 0.2)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            color: 'var(--theme-error-500)',
          }}
        >
          <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Generation Failed</span>
            <span style={{ fontSize: '11px', color: 'var(--theme-elevation-700)' }}>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setError(null);
              handleGenerate();
            }}
            disabled={loading || !generalDescription.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid rgba(235, 87, 87, 0.3)',
              backgroundColor: 'transparent',
              color: 'var(--theme-error-500)',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(235, 87, 87, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <RefreshCw size={12} />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Success message */}
      {success && (
        <div
          style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: 'rgba(38, 153, 132, 0.08)',
            border: '1px solid rgba(38, 153, 132, 0.2)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--theme-success-500)',
          }}
        >
          <CheckCircle size={16} style={{ flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            {createdCourseId ? (
              <>
                <span style={{ fontSize: '12px', fontWeight: 500 }}>
                  ✅ Course created with Hungarian, English, and Romanian translations!
                </span>
                <a
                  href={`/admin/collections/courses/${createdCourseId}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#269984',
                    textDecoration: 'underline',
                    marginTop: '2px',
                  }}
                >
                  <ExternalLink size={12} />
                  Open created course for review
                </a>
              </>
            ) : saveWarning ? (
              <>
                <span style={{ fontSize: '12px', fontWeight: 500 }}>
                  ⚠️ Course generated but could not be saved automatically:
                </span>
                <span style={{ fontSize: '11px', color: 'var(--theme-elevation-600)' }}>
                  {saveWarning}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--theme-elevation-500)' }}>
                  The form fields have been populated. Please adjust and save manually.
                </span>
              </>
            ) : (
              <span style={{ fontSize: '12px', fontWeight: 500 }}>
                Course fields populated for Hungarian, English, and Romanian simultaneously! Review
                the other tabs and click &apos;Create&apos; or &apos;Save&apos;.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
