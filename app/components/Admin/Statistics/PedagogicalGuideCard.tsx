'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, Brain, Zap, Target, GraduationCap, Sparkles } from 'lucide-react';

const GUIDE_SECTIONS = [
  {
    id: 'bloom',
    title: '1. Bloom-Taxonómia & A 4 Tanulási Szakasz',
    icon: GraduationCap,
    color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    summary: 'A megismeréstől a valódi alkotásig vezető 4 szintű módszertan.',
    content: `
Az AlgoRythmics pedagógiai struktúrája a Bloom-taxonómia kognitív szintjeit követi, hogy az absztrakt algoritmusokat lépésről lépésre sajátítsák el a diákok:
- **Táncos Videó (Megismerés & Érzelmi bevonódás)**: A ritmus és a térbeli tánclépések vizuális metaforaként horgonyozzák le az algoritmus lényegét az epizodikus memóriában.
- **Interaktív Animáció (Megértés & Szemléltetés)**: A vizuális lejátszó segít felismerni az invariánsokat, a csere- és összehasonlítási szabályokat.
- **Irányított Gyakorlás / Control (Alkalmazás & Döntéshozatal)**: A tanuló lépésről lépésre maga választja ki a cserélendő elemeket, azonnali visszajelzést kapva.
- **Kódkiegészítés / Create & Alive (Elemzés, Értékelés & Alkotás)**: A szintaktikai és strukturális kódhiányok pótlása, valódi futtatható algoritmus-implementáció.
    `,
  },
  {
    id: 'cognitive',
    title: '2. Kognitív Terhelés Elmélet (Sweller Cognitive Load)',
    icon: Brain,
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
    summary: 'Hogyan segít a lépésenkénti gondolkodási idő a nehézségek feltárásában?',
    content: `
A **Kognitív Terhelés Elmélet (Cognitive Load Theory)** szerint a munkamemória kapacitása korlátozott. A platform három terhelési típust mér:
- **Alapvető (Intrinsic) terhelés**: Maga az algoritmus belső komplexitása (pl. Gyorsrendezés pivot particionálása vagy N-Királynő visszalépéses fa-bejárása). A magas hezitálási idő (>10 mp) ezt jelzi.
- **Külső (Extraneous) terhelés**: A felület és a feladat megértésének nehézsége. Ezt a letisztult UI és a lépésenkénti vizualizáció minimálisra csökkenti.
- **Érdemi (Germane) terhelés**: Az új mentális sémák felépítésére fordított energia. A 5-10 másodperces mérlegelési idő jelzi az optimális mély tanulási állapotot.
    `,
  },
  {
    id: 'pes',
    title: '3. Post-Error Slowing (PES Index) & Hibakorrekció',
    icon: Zap,
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    summary: 'A tévedés utáni reflexív megállás és a megfontolt javítás jelentősége.',
    content: `
A **Post-Error Slowing (PES)** a kognitív pszichológiában a hibát követő döntési idő megnövekedését jelenti.
- **Pozitív PES (+25% - +60%)**: A tanuló megáll, értelmezi a tévedést, és nem kapkodva, hanem megfontoltan választ új lépést. Ez 98%-os sikerrátát eredményez a 3. javítási kísérletre.
- **Kapkodó ismételt hiba (Impulsive retry)**: Ha a diák reakcióideje nem nő hiba után, az impulzív próbálkozást és félreértést jelez. Ilyenkor a Kabala automatikus hint-javaslatot tesz.
    `,
  },
  {
    id: 'metacognition',
    title: '4. Metakognitív Kalibráció & 2x2 Mátrix',
    icon: Target,
    color: 'text-teal-500 bg-teal-500/10 border-teal-500/20',
    summary: 'A tanulói önértékelés (magabiztosság) és a valós helyesség kapcsolata.',
    content: `
A **Metakogníció** a saját tudásról való gondolkodás. A 2x2-es mátrix 4 tanulói állapotot azonosít:
- **Valódi Tudás (Mastery)**: Magas önbizalom + Helyes döntés. A diák magabiztos és kompetens.
- **Tévképzet (Overconfident / Dunning-Kruger)**: Magas önbizalom + Hibás döntés. Ez a legkritikusabb pedagógiai terület! A diák azt hiszi, tudja, miközben konceptuális tévedésben van.
- **Bizonytalan Tudás (Hesitant)**: Alacsony önbizalom + Helyes döntés. Megerősítést és pozitív visszacsatolást igényel.
- **Felismert Hiányosság (Aware Gap)**: Alacsony önbizalom + Hibás döntés. Reális önértékelés, azonnal fogadja a magyarázatot.
    `,
  },
];

export default function PedagogicalGuideCard() {
  const [openSection, setOpenSection] = useState<string>('bloom');

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.25 }}
      className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 shadow-xl space-y-6"
    >
      <div className="flex items-center gap-3.5 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 shadow-sm">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
              Pedagógiai Útmutató & Módszertani Értelmezés
            </h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">
              Tanári Kézikönyv
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            A statisztikai metrikák hátterében álló tanuláselméleti és kognitív pszichológiai
            modellek
          </p>
        </div>
      </div>

      {/* Expandable Accordion Sections */}
      <div className="space-y-3">
        {GUIDE_SECTIONS.map((section) => {
          const Icon = section.icon;
          const isOpen = openSection === section.id;

          return (
            <div
              key={section.id}
              className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenSection(isOpen ? '' : section.id)}
                className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`p-2.5 rounded-xl border ${section.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                      {section.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {section.summary}
                    </p>
                  </div>
                </div>

                <div
                  className={`p-1.5 rounded-xl bg-slate-200/60 dark:bg-slate-700/60 text-slate-500 transition-transform ${
                    isOpen ? 'rotate-180 text-indigo-500' : ''
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                      {section.content
                        .trim()
                        .split('\n')
                        .map((paragraph, pIdx) => {
                          const trimmed = paragraph.trim();
                          if (!trimmed) return null;
                          if (trimmed.startsWith('-')) {
                            return (
                              <div key={pIdx} className="flex items-start gap-2 pl-2">
                                <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-1" />
                                <span
                                  dangerouslySetInnerHTML={{
                                    __html: trimmed
                                      .replace(/^-\s*/, '')
                                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                                  }}
                                />
                              </div>
                            );
                          }
                          return (
                            <p
                              key={pIdx}
                              dangerouslySetInnerHTML={{
                                __html: trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
                              }}
                            />
                          );
                        })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
