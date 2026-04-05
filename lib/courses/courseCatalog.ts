export type CoursePhaseKind =
  | 'motivation'
  | 'guided-visualization'
  | 'code-building'
  | 'analysis'
  | 'final-challenge';

export type CourseSourceView = 'video' | 'animation' | 'control' | 'create' | 'alive' | 'quiz' | 'info';

export type CourseDiagramChoice = {
  label: string;
  explanation: string;
  impact: string;
  correct?: boolean;
};

export type CourseQuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type CoursePhase = {
  phaseId: string;
  title: string;
  kind: CoursePhaseKind;
  sourceView: CourseSourceView;
  sourceAlgorithmId: string;
  summary: string;
  objective: string;
  durationMinutes: number;
  confidencePrompt: string;
  mascotLine: string;
  taskTitle: string;
  taskPrompt: string;
  successCopy: string;
  hintCopy: string;
  rewardLabel: string;
  tips: string[];
  quiz?: CourseQuizQuestion[];
  infoContent?: string;
};

export type CourseMascot = {
  name: string;
  preset: string;
  asset: string;
  accentColor: string;
  idleTriggerSeconds: number;
  mistakeTriggerCount: number;
  summonLabel: string;
  idlePrompt: string;
  mistakePrompt: string;
  confidencePrompt: string;
  welcomeMessages: string[];
  idleHelpMessages: string[];
  mistakeHelpMessages: string[];
  overconfidentMessages: string[];
  streakMessages: string[];
};

export type CourseConfidenceLearning = {
  enabled: boolean;
  promptLabel: string;
  praiseText: string;
  correctionText: string;
  rewardBadge: string;
  idleCheckProbability: number;
};

export type CourseComplexity = {
  timeComplexity: string;
  spaceComplexity: string;
  bestCase: string;
  averageCase: string;
  worstCase: string;
  diagramChoices: CourseDiagramChoice[];
  mistakeImpacts: { label: string; impact: string }[];
};

export type CourseFinalChallenge = {
  title: string;
  debuggingPrompt: string;
  quizPrompt: string;
  mentorPolicy: string;
  badge: string;
};

export type CourseBlueprint = {
  slug: string;
  title: string;
  algorithmId: string;
  summary: string;
  heroTagline: string;
  icon: string;
  accentColor: string;
  illustrationAsset: string;
  estimatedMinutes: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  featuredReason: string;
  learningModes: string[];
  mascot: CourseMascot;
  confidenceLearning: CourseConfidenceLearning;
  complexity: CourseComplexity;
  phases: CoursePhase[];
  finalChallenge: CourseFinalChallenge;
  nextSteps: string[];
};

export type CourseCollectionDoc = Partial<CourseBlueprint> & {
  id?: string;
  slug?: string;
};

const DEFAULT_ACCENT = '#269984';

function humanizeSlug(slug: string) {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function toStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        const candidate = record.tip || record.value || record.label || record.text;
        if (typeof candidate === 'string') return candidate;
      }
      return '';
    })
    .filter((item) => item.trim().length > 0);
}

function toPhases(value: unknown): CoursePhase[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((phase, index): CoursePhase | null => {
      if (!phase || typeof phase !== 'object') return null;
      const current = phase as Partial<CoursePhase>;
      const phaseId = current.phaseId || `phase-${index + 1}`;

      return {
        phaseId,
        title: current.title || humanizeSlug(phaseId),
        kind: current.kind || 'motivation',
        sourceView: current.sourceView || defaultSourceViewForKind(current.kind || 'motivation'),
        sourceAlgorithmId: current.sourceAlgorithmId || 'bubble-sort',
        summary: current.summary || '',
        objective: current.objective || '',
        durationMinutes: Number(current.durationMinutes || 0),
        confidencePrompt: current.confidencePrompt || '',
        mascotLine: current.mascotLine || '',
        taskTitle: current.taskTitle || '',
        taskPrompt: current.taskPrompt || '',
        successCopy: current.successCopy || '',
        hintCopy: current.hintCopy || '',
        rewardLabel: current.rewardLabel || '',
        tips: toStrings(current.tips),
        quiz: Array.isArray(current.quiz) ? (current.quiz as CourseQuizQuestion[]) : undefined,
        infoContent: current.infoContent,
      };
    })
    .filter((phase): phase is CoursePhase => phase !== null);
}

function defaultSourceViewForKind(kind: CoursePhaseKind): CourseSourceView {
  switch (kind) {
    case 'motivation':
      return 'video';
    case 'guided-visualization':
      return 'animation';
    case 'code-building':
      return 'control';
    case 'analysis':
      return 'create';
    case 'final-challenge':
      return 'alive';
  }
}

function normalizeCourse(doc: CourseCollectionDoc): CourseBlueprint {
  const slug = doc.slug || 'bubble-sort';

  const phases = toPhases(doc.phases);

  return {
    slug,
    title: doc.title || humanizeSlug(slug),
    algorithmId: doc.algorithmId || slug,
    summary:
      doc.summary || 'A structured course blueprint for learning the algorithm through practice.',
    heroTagline: doc.heroTagline || 'Learn by predicting, building, debugging, and reflecting.',
    icon: doc.icon || '📘',
    accentColor: doc.accentColor || DEFAULT_ACCENT,
    illustrationAsset: doc.illustrationAsset || 'algo_group_109.svg',
    estimatedMinutes: Number(doc.estimatedMinutes || 0),
    difficulty: doc.difficulty || 'Beginner',
    featuredReason:
      doc.featuredReason || 'Built as a reusable learning blueprint for future algorithm courses.',
    learningModes: toStrings(doc.learningModes),
    mascot: {
      name: doc.mascot?.name || 'Guide',
      preset: doc.mascot?.preset || 'default',
      asset: doc.mascot?.asset || 'algo_group_109.svg',
      accentColor: doc.mascot?.accentColor || DEFAULT_ACCENT,
      idleTriggerSeconds: Number(doc.mascot?.idleTriggerSeconds || 30),
      mistakeTriggerCount: Number(doc.mascot?.mistakeTriggerCount || 2),
      summonLabel: doc.mascot?.summonLabel || 'Summon guide',
      idlePrompt: doc.mascot?.idlePrompt || 'Need a hint?',
      mistakePrompt: doc.mascot?.mistakePrompt || 'Let us slow down and inspect the rule again.',
      confidencePrompt: doc.mascot?.confidencePrompt || 'How sure are you?',
      welcomeMessages: toStrings(doc.mascot?.welcomeMessages),
      idleHelpMessages: toStrings(doc.mascot?.idleHelpMessages),
      mistakeHelpMessages: toStrings(doc.mascot?.mistakeHelpMessages),
      overconfidentMessages: toStrings(doc.mascot?.overconfidentMessages),
      streakMessages: toStrings(doc.mascot?.streakMessages),
    },
    confidenceLearning: {
      enabled: doc.confidenceLearning?.enabled ?? true,
      promptLabel: doc.confidenceLearning?.promptLabel || 'Confidence check',
      praiseText:
        doc.confidenceLearning?.praiseText ||
        'Great reasoning. The confidence check matched your answer.',
      correctionText:
        doc.confidenceLearning?.correctionText ||
        'That is a common first guess. Let us inspect the rule once more.',
      rewardBadge: doc.confidenceLearning?.rewardBadge || 'Confidence Builder',
      idleCheckProbability: Number(doc.confidenceLearning?.idleCheckProbability || 0.25),
    },
    complexity: {
      timeComplexity: doc.complexity?.timeComplexity || 'O(n^2)',
      spaceComplexity: doc.complexity?.spaceComplexity || 'O(1)',
      bestCase:
        doc.complexity?.bestCase ||
        'O(n) with an early-exit flag when the array is already sorted.',
      averageCase:
        doc.complexity?.averageCase ||
        'O(n^2) because adjacent comparisons still dominate the passes.',
      worstCase: doc.complexity?.worstCase || 'O(n^2) on a reversed array with many swaps.',
      diagramChoices: doc.complexity?.diagramChoices?.length
        ? doc.complexity.diagramChoices
        : bubbleSortCourseBlueprint.complexity.diagramChoices,
      mistakeImpacts: doc.complexity?.mistakeImpacts?.length
        ? doc.complexity.mistakeImpacts
        : bubbleSortCourseBlueprint.complexity.mistakeImpacts,
    },
    phases: phases.length ? phases : bubbleSortCourseBlueprint.phases,
    finalChallenge: {
      title: doc.finalChallenge?.title || 'Final Challenge',
      debuggingPrompt:
        doc.finalChallenge?.debuggingPrompt ||
        'Debug the near-correct implementation and explain the bug in one sentence.',
      quizPrompt:
        doc.finalChallenge?.quizPrompt ||
        'Answer the final check on complexity, memory usage, and practical use cases.',
      mentorPolicy:
        doc.finalChallenge?.mentorPolicy ||
        'The mascot stays in the background unless repeated syntax or infinite-loop mistakes appear.',
      badge: doc.finalChallenge?.badge || 'Learning Complete',
    },
    nextSteps:
      toStrings(doc.nextSteps).length > 0
        ? toStrings(doc.nextSteps)
        : [
            'Create a new course blueprint from the same schema',
            'Tune mascot triggers per topic',
            'Add phase-specific quizzes and coding drills',
          ],
  };
}

export const bubbleSortCourseBlueprint: CourseBlueprint = {
  slug: 'bubble-sort',
  title: 'Bubble Sort Confidence Course',
  algorithmId: 'bubble-sort',
  summary:
    'A five-phase path that turns bubble sort into a guided, confidence-aware learning journey.',
  heroTagline:
    'Predict, test, code, and debug your way through bubble sort with a mascot that adapts to your confidence.',
  icon: '🫧',
  accentColor: '#269984',
  illustrationAsset: 'algo_group_109.svg',
  estimatedMinutes: 58,
  difficulty: 'Beginner',
  featuredReason:
    'Bubble sort is the first fully authored course, designed as a reusable template for future algorithms and topics.',
  learningModes: [
    'Video intuition',
    'Prediction quiz',
    'Drag-and-drop code building',
    'Edge-case simulation',
    'Debugging challenge',
  ],
  mascot: {
    name: 'Bubi',
    preset: 'bubble-mentor',
    asset: 'bubble_dragon.png',
    accentColor: '#269984',
    idleTriggerSeconds: 30,
    mistakeTriggerCount: 2,
    summonLabel: 'Hívd Bubit',
    idlePrompt:
      'Elakadtál? Szeretnéd, hogy megmutassam a következő lépést vagy elmagyarázzam a szabályt?',
    mistakePrompt:
      'Hoppá! Úgy tűnik, itt egy kicsit belezavarodtunk. Nézd meg újra az aktív párt, és figyeld a szabályt.',
    confidencePrompt: 'Mennyire vagy biztos a megoldásodban?',
    welcomeMessages: [
      'Szia! Bubi vagyok, a mentorod. Készen állsz a mai kihívásra?',
      'Alig vártam, hogy folytassuk! Vágjunk is bele.',
      'Szia! Ne feledd, a hibákból tanulunk a legtöbbet. Itt vagyok, ha kell segítség!',
    ],
    idleHelpMessages: [
      'Nézd, a Bubble Sort lényege, hogy mindig a szomszédokat hasonlítjuk össze.',
      'Ha a bal oldali nagyobb, mint a jobb oldali, akkor csere! Próbáld ki.',
      'Segítsek? A legnagyobb elemeket keressük, amik jobbra vándorolnak.',
    ],
    mistakeHelpMessages: [
      'Semmi baj! Ezt elsőre mindenki elvéti. Figyeld csak: a kisebb számokat próbáld balra terelni, a nagyobbakat pedig jobbra.',
      'Ne csüggedj! A programozás is a hibákból indul. Gondolj úgy erre, mint egy mérlegre: hasonlítsd össze a két elemet, és csak ha szükséges, cserélj!',
      'Vegyünk egy mély levegőt! Itt egy kis segítség: mindig azt nézzük, hogy a bal oldali elem nagyobb-e a jobbnál. Ha igen, mehet is a csere.',
      'Látom, ez most egy kicsit kifogott rajtunk, de sebaj! Nézzük át újra a szabályt együtt: csak a szomszédokat hasonlítjuk, és a nagyobb "buborékol" jobbra.',
    ],
    overconfidentMessages: [
      'Hűha, néha a túl nagy önbizalom becsapós lehet! Nézzük át együtt még egyszer a logikát.',
      'Azt hittük, megvan, de a részletekben bújt el a kisördög. Ne csüggedj, fussunk neki újra!',
    ],
    streakMessages: [
      'Ez az! Már 3-at eltaláltál zsinórban! Igazi profi vagy.',
      'Dübörög a szekér! Elképesztő a haladásod, csak így tovább!',
      'Szuper vagy! Látom, már teljesen érzed a ritmust.',
    ],
  },
  confidenceLearning: {
    enabled: true,
    promptLabel: 'Confidence-based Learning',
    praiseText: 'Remek intuíció. A válaszod és az önértékelésed is erős jel volt.',
    correctionText:
      'Sokan itt tévednek elsőre. Nem a kész eredményt, hanem az aktuális passz szabályát kell nézni.',
    rewardBadge: 'Tökéletes Látnok',
    idleCheckProbability: 0.28,
  },
  complexity: {
    timeComplexity: 'O(n^2)',
    spaceComplexity: 'O(1)',
    bestCase: 'O(n) if the implementation stops early when no swap happens in a pass.',
    averageCase: 'O(n^2) because every pass still compares neighboring pairs.',
    worstCase: 'O(n^2) on a reversed array, which creates the maximum number of swaps.',
    diagramChoices: [
      {
        label: 'Two nested loops over adjacent items',
        explanation: 'This is the bubble sort shape: a repeated pass across the array.',
        impact: 'Matches bubble sort exactly.',
        correct: true,
      },
      {
        label: 'Divide, recurse, and merge halves',
        explanation: 'That diagram belongs to merge sort, not bubble sort.',
        impact: 'Wrong mental model for this course.',
      },
      {
        label: 'Heap tree with extract-max steps',
        explanation: 'Heap sort relies on a tree structure and root extraction.',
        impact: 'Does not match the adjacent-swap strategy.',
      },
      {
        label: 'Single linear scan with no restart',
        explanation: 'A scan like this cannot fully sort an unsorted array by itself.',
        impact: 'Underestimates the required passes.',
      },
    ],
    mistakeImpacts: [
      {
        label: 'Missing swapped flag',
        impact:
          'The algorithm keeps making extra passes, so best-case behavior falls back toward O(n^2).',
      },
      {
        label: 'Wrong inner loop bound',
        impact: 'You may skip the last adjacent pair or even create an out-of-bounds bug.',
      },
      {
        label: 'Swapping before comparison',
        impact:
          'The logic breaks immediately; the runtime may still look quadratic, but the result is invalid.',
      },
      {
        label: 'No early exit on already sorted input',
        impact:
          'The asymptotic complexity stays O(n^2), but the best-case experience becomes much slower.',
      },
    ],
  },
  phases: [
    {
      phaseId: 'motivation-intro',
      title: 'Bevezetés',
      kind: 'motivation',
      sourceView: 'info',
      sourceAlgorithmId: 'bubble-sort',
      summary: 'Ismerd meg a Bubble Sort erejét és azt, hogy miért fontos neked ez az algoritmus.',
      objective: 'Megérteni a rendezési problémák alapjait.',
      durationMinutes: 3,
      confidencePrompt: '',
      mascotLine: 'Üdvözöllek! Most megtanuljuk az egyik legtöbbet emlegetett algoritmust.',
      taskTitle: 'Olvasd el az alapokat',
      taskPrompt: '',
      successCopy: 'Remek kezdés!',
      hintCopy: '',
      rewardLabel: 'Alapozó Mester',
      tips: ['A Bubble Sort egy egyszerű, de tanulságos algoritmus.'],
      infoContent:
        'A Bubble Sort neve onnan ered, hogy a nagyobb értékek úgy "buborékolnak" fel a lista végére, mint a buborékok a víz felszínére. Bár nem a leghatékonyabb nagy adathalmazokon, tökéletes arra, hogy megértsd a szomszédos elemek cseréjén alapuló rendezési logikát.',
    },
    {
      phaseId: 'motivation-video',
      title: 'Vizuális Bevezető',
      kind: 'motivation',
      sourceView: 'video',
      sourceAlgorithmId: 'bubble-sort',
      summary: 'Nézzük meg tánccal és animációval, hogyan mozdulnak az elemek!',
      objective: 'Vizuális intuíció kialakítása.',
      durationMinutes: 7,
      confidencePrompt: 'Sikerült elkapnod a ritmust?',
      mascotLine: 'Figyeld meg a lábakat: a nagyobb szám mindig jobbra tart a csere után.',
      taskTitle: 'Nézd végig a videót',
      taskPrompt: '',
      successCopy: 'Most már látod a mintát!',
      hintCopy: 'Koncentrálj arra a párra, ahol a sárga fény villan fel.',
      rewardLabel: 'Vizuális Zseni',
      tips: ['A táncosok sorrendje pontosan az algoritmust követi.'],
    },
    {
      phaseId: 'warmup-quiz',
      title: 'Bemelegítő Kvíz',
      kind: 'motivation',
      sourceView: 'quiz',
      sourceAlgorithmId: 'bubble-sort',
      summary: 'Teszteld le, mennyire figyeltél meg a videót!',
      objective: 'Az alapfogalmak rögzítése.',
      durationMinutes: 5,
      confidencePrompt: 'Mennyire vagy biztos ebben a válaszban?',
      mascotLine: 'Egy kis agytorna, mielőtt a mélyvízbe ugrunk.',
      taskTitle: 'Válaszolj a kérdésre',
      taskPrompt: '',
      successCopy: 'Pontosan! Jól megértetted a lényeget.',
      hintCopy: 'Gondolj a "buborékolás" szóra.',
      rewardLabel: 'Gyors Észjárás',
      tips: ['A legnagyobb elem mindig a végére kerül.'],
      quiz: [
        {
          question: 'Mi a Bubble Sort fő célja egy-egy menet (pass) során?',
          options: [
            'A legkisebb elem kiválasztása és az elejére rakása.',
            'A lista kettévágása és külön-külön rendezése.',
            'Szomszédos elemek cseréjével a legnagyobb elem "buborékoltatása" a végére.',
            'A tömb elemeinek véletlenszerű megkeverése.',
          ],
          correctIndex: 2,
          explanation:
            'A Bubble Sort szomszédos elemeket hasonlít össze, és ha rossz sorrendben vannak, felcseréli őket. Így a legnagyobb elem fokozatosan a végére kerül.',
        },
      ],
    },
    {
      phaseId: 'guided-visualization',
      title: 'Irányított Vizualizáció',
      kind: 'guided-visualization',
      sourceView: 'animation',
      sourceAlgorithmId: 'bubble-sort',
      summary: 'Most nézd meg az algoritmust lépésről lépésre, interaktív magyarázatokkal.',
      objective: 'A belső működés alapos megismerése.',
      durationMinutes: 10,
      confidencePrompt: 'Már látod a következő lépést magad előtt?',
      mascotLine: 'Most én is segítek: nézd, ahogy a sárga mutatók végigmennek.',
      taskTitle: 'Figyeld az animációt',
      taskPrompt: '',
      successCopy: 'Ez az! Már érted a folyamatot.',
      hintCopy: '',
      rewardLabel: 'Analitikus Megfigyelő',
      tips: ['Minden menet után egy-egy elem "fixálódik" a helyén.'],
    },
    {
      phaseId: 'prediction-drill',
      title: 'Jósolj: Lépés Kvíz',
      kind: 'guided-visualization',
      sourceView: 'control',
      sourceAlgorithmId: 'bubble-sort',
      summary: 'Légy te az algoritmus! Jelöld ki te a következő cserélendő elemeket.',
      objective: 'Aktív részvétel a logikában.',
      durationMinutes: 12,
      confidencePrompt: 'Biztos vagy benne, hogy ez a következő pár?',
      mascotLine: 'Na, nézzük, te mit lépnél most!',
      taskTitle: 'Válaszd ki a következő párt',
      taskPrompt:
        'Kattints arra a két szomszédos oszlopra, amelyeknek a szabály szerint most következniük kell.',
      successCopy: 'Nagyszerű! Pontosan ezt csinálja a gép is.',
      hintCopy: 'Mindig balról jobbra haladunk a még nem rendezett részen.',
      rewardLabel: 'Látnok',
      tips: ['Csak szomszédos elemeket választhatsz.', 'Figyeld, ha az előző pár már rendezett volt.'],
    },
    {
      phaseId: 'logic-sequence',
      title: 'Kód felépítése: Rakd sorba!',
      kind: 'code-building',
      sourceView: 'quiz',
      sourceAlgorithmId: 'bubble-sort',
      summary: 'A vizuális logika és a kód összekötése.',
      objective: 'A programkód logikai sorrendjének megértése.',
      durationMinutes: 8,
      confidencePrompt: 'Biztos a logikai lánc?',
      mascotLine: 'A kód nem más, mint a gondolataid lefordítása parancsokra.',
      taskTitle: 'Válaszd ki a helyes sorrendet',
      taskPrompt: '',
      successCopy: 'Ez a helyes algoritmus vázlat!',
      hintCopy: 'Előbb mindig a külső ciklus kell, ami a meneteket számolja.',
      rewardLabel: 'Logika Építész',
      tips: ['Ciklus -> Ciklus -> Feltétel -> Csere.'],
      quiz: [
        {
          question: 'Melyik a helyes logikai felépítése a Bubble Sort-nak?',
          options: [
            'Csere a tömb végén -> Ciklus -> Ha nagyobb -> Kész',
            'Külső ciklus (menetek) -> Belső ciklus (szomszédok) -> Ha nagyobb -> Csere',
            'Véletlenszerű választás -> Összehasonlítás az elsővel -> Csere',
            'Egyetlen ciklus a tömb közepéig -> Csere ha bizonytalan',
          ],
          correctIndex: 1,
          explanation:
            'Kell egy külső ciklus, ami annyiszor fut le, ahány elem van, és egy belső, ami a szomszédos elemeket hasonlítja össze a maradék rendezetlen részen.',
        },
      ],
    },
    {
      phaseId: 'logic-fill',
      title: 'Kód felépítése: Töltsd ki!',
      kind: 'code-building',
      sourceView: 'create',
      sourceAlgorithmId: 'bubble-sort',
      summary: 'Egészítsd ki a kódot a hiányzó operátorokkal és változókkal.',
      objective: 'A szintaxis alapos ismerete.',
      durationMinutes: 10,
      confidencePrompt: 'Melyik operátor illik a feltételhez?',
      mascotLine: 'Figyelj oda a kacsacsőrre: merre kell állnia a cseréhez?',
      taskTitle: 'Töltsd ki az üres helyeket',
      taskPrompt: '',
      successCopy: 'Tökéletes kód! Most már futtathatod is.',
      hintCopy: 'Akkor cserélünk, ha a bal oldali elem nagyobb, mint a jobb oldali.',
      rewardLabel: 'Kódmester',
      tips: ['Az indexelésnél vigyázz az i+1-re!'],
    },
    {
      phaseId: 'analysis-quiz',
      title: 'Elemzés: Szituációs Kvíz',
      kind: 'analysis',
      sourceView: 'quiz',
      sourceAlgorithmId: 'bubble-sort',
      summary: 'Hogyan teljesít az algoritmus különböző helyzetekben?',
      objective: 'Az időbonyolultság és hatékonyság árnyalt ismerete.',
      durationMinutes: 8,
      confidencePrompt: 'Ez egy trükkös kérdés, mennyire vagy biztos?',
      mascotLine: 'A mérnökök mindig azt kérdezik: Mi van, ha...?',
      taskTitle: 'Válaszolj a szituációs kérdésre',
      taskPrompt: '',
      successCopy: 'Remek elemző képesség!',
      hintCopy: 'Ha nem kell cserélni, az algoritmus megállhat-e korábban?',
      rewardLabel: 'Hatékonyság Hőse',
      tips: ['A legrosszabb eset a fordított sorrend.'],
      quiz: [
        {
          question: 'Mi történik a Bubble Sort-tal, ha a tömb már eleve rendezett?',
          options: [
            'Ugyanolyan lassú marad (O(n^2)).',
            'Azonnal leáll az első elem után.',
            'Egyetlen passz után leáll, ha használunk "swapped" flag-et (O(n)).',
            'Összeomlik a rendszer.',
          ],
          correctIndex: 2,
          explanation:
            'Ha egy teljes passz során egyetlen csere sem történik, akkor tudjuk, hogy a tömb már rendezett, így korábban befejezhetjük a futást.',
        },
      ],
    },
    {
      phaseId: 'edge-cases',
      title: 'Határesetek: Futtatás',
      kind: 'analysis',
      sourceView: 'create',
      sourceAlgorithmId: 'bubble-sort',
      summary: 'Futtasd le a legrosszabb esetet és figyeld meg az eredményt.',
      objective: 'A gyakorlati tapasztalat megszerzése extrém bemenetnél.',
      durationMinutes: 6,
      confidencePrompt: '',
      mascotLine: 'Látod? Ha fordítva van, minden egyes lépésnél cserélnie kell.',
      taskTitle: 'Simuláció futtatása',
      taskPrompt: 'Kattints a futtatás gombra a fordított tömb rendezéséhez.',
      successCopy: 'Ez volt a leglassabb menet, de sikerült!',
      hintCopy: '',
      rewardLabel: 'Stressz-tesztelő',
      tips: ['A fordított sorrend a rémálma ennek az algoritmusnak.'],
    },
    {
      phaseId: 'final-debug',
      title: 'Végső Vizsga: Hibakeresés',
      kind: 'final-challenge',
      sourceView: 'alive',
      sourceAlgorithmId: 'bubble-sort',
      summary: 'Keresd meg az elrejtett hibát a kódban!',
      objective: 'Magas szintű hibajavítási készség bizonyítása.',
      durationMinutes: 12,
      confidencePrompt: 'Biztos vagy benne, hogy ez a hibás sor?',
      mascotLine: 'Most csak te vagy és a kód. Én itt vagyok a háttérben, ha nagyon elakadnál.',
      taskTitle: 'Javítsd ki a bugot',
      taskPrompt: 'Egy apró elírás miatt nem rendez jól a kód. Találd meg!',
      successCopy: 'Zseniális! Megtaláltad a "tű a szénakazalban" hibát.',
      hintCopy: 'Nézd meg a ciklus határait vagy az indexeket.',
      rewardLabel: 'Hibavadász Pro',
      tips: ['Sokszor csak egy operátor iránya a hiba.'],
    },
    {
      phaseId: 'final-exam',
      title: 'Végső Vizsga: Összegzés',
      kind: 'final-challenge',
      sourceView: 'quiz',
      sourceAlgorithmId: 'bubble-sort',
      summary: 'Az egész kurzust lezáró elméleti és gyakorlati összefoglaló.',
      objective: 'A teljes tudásanyag validálása.',
      durationMinutes: 10,
      confidencePrompt: 'Ez az utolsó lépés a kitűzőhöz!',
      mascotLine: 'Büszke vagyok rád, bármi is legyen az eredmény.',
      taskTitle: 'Záró kérdéssor',
      taskPrompt: '',
      successCopy: 'Gratulálok! Sikeresen elvégezted a kurzust!',
      hintCopy: '',
      rewardLabel: 'Okleveles Buborékoltató',
      tips: ['Gondold át a memóriaigényt is.'],
      quiz: [
        {
          question: 'Mennyi a Bubble Sort extra memóriahasználata (Space Complexity)?',
          options: ['O(n) - sokat másol', 'O(1) - helyben rendez (in-place)', 'O(log n)', 'O(n^2)'],
          correctIndex: 1,
          explanation:
            'A Bubble Sort helyben rendezi a tömböt, csak egy-két segédváltozó kell a cseréhez, függetlenül a tömb méretétől.',
        },
      ],
    },
  ],
  finalChallenge: {
    title: 'Final Challenge',
    debuggingPrompt:
      'A near-correct implementation hides a classical off-by-one bug or an infinite-loop risk. Find it by coding, not by guesswork.',
    quizPrompt:
      'Answer 3-5 questions about complexity, memory, and when bubble sort is still a sensible choice.',
    mentorPolicy:
      'The mascot stays in the background unless repeated runs keep producing syntax or loop errors.',
    badge: 'Tökéletes Kódoló',
  },
  nextSteps: [
    'Reuse the same schema for insertion sort or selection sort',
    'Swap in a course-specific mascot asset and color palette',
    'Add more quiz and code challenge variants per phase',
  ],
};

export const courseBlueprints: CourseBlueprint[] = [bubbleSortCourseBlueprint];

export async function getCourseCatalog(docs: CourseCollectionDoc[] = []) {
  const normalizedDocs = docs.filter(Boolean).map((doc) => {
    const slug = doc.slug || 'bubble-sort';
    const existing = courseBlueprints.find((course) => course.slug === slug);

    if (existing) {
      return normalizeCourse({ ...existing, ...doc, slug });
    }

    return normalizeCourse({ ...doc, slug });
  });

  const combined = [...courseBlueprints];

  for (const doc of normalizedDocs) {
    const existingIndex = combined.findIndex((course) => course.slug === doc.slug);
    if (existingIndex >= 0) {
      combined[existingIndex] = doc;
    } else {
      combined.push(doc);
    }
  }

  return combined.sort((left, right) => left.title.localeCompare(right.title));
}

export function findCourseBySlug(slug: string, docs: CourseCollectionDoc[] = []) {
  const normalizedDocs = docs.filter(Boolean).map((doc) => {
    const currentSlug = doc.slug || 'bubble-sort';
    const existing = courseBlueprints.find((course) => course.slug === currentSlug);

    if (existing) {
      return normalizeCourse({ ...existing, ...doc, slug: currentSlug });
    }

    return normalizeCourse({ ...doc, slug: currentSlug });
  });

  return (
    normalizedDocs.find((course) => course.slug === slug) ||
    courseBlueprints.find((course) => course.slug === slug) ||
    bubbleSortCourseBlueprint
  );
}
