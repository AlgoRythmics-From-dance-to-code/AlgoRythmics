import type { CollectionConfig } from 'payload';

import { ROLES } from '../lib/constants';

const difficultyOptions = [
  { label: 'Beginner', value: 'Beginner' },
  { label: 'Intermediate', value: 'Intermediate' },
  { label: 'Advanced', value: 'Advanced' },
];

const sourceViewOptions = [
  { label: 'Video (Blueprint)', value: 'video' },
  { label: 'Video (Custom)', value: 'video-custom' },
  { label: 'Animation', value: 'animation' },
  { label: 'Interactive Control', value: 'control' },
  { label: 'Code Builder (Create)', value: 'create' },
  { label: 'Live Simulation (Alive)', value: 'alive' },
  { label: 'Quiz', value: 'quiz' },
  { label: 'Matching (Connecting)', value: 'match' },
  { label: 'Ordering (Sequencing)', value: 'order' },
  { label: 'Code Debugging', value: 'debug' },
  { label: 'Gap Fill (Blanks)', value: 'gap-fill' },
  { label: 'Information', value: 'info' },
  { label: 'Final Challenge', value: 'final-challenge' },
];

export const Courses: CollectionConfig = {
  slug: 'courses',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'difficulty', 'updatedAt'],
    group: 'Learning',
    description:
      'Reusable course blueprints with phases, mascot behavior, confidence prompts, and complexity guidance.',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => user?.role === ROLES.ADMIN || user?.role === ROLES.EDITOR,
    update: ({ req: { user } }) => user?.role === ROLES.ADMIN || user?.role === ROLES.EDITOR,
    delete: ({ req: { user } }) => user?.role === ROLES.ADMIN || user?.role === ROLES.EDITOR,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'General info',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              unique: true,
              localized: true,
              admin: { description: 'A kurzus teljes neve (pl. Buborékrendezés alapjai).' },
            },
            {
              name: 'slug',
              type: 'text',
              required: true,
              unique: true,
              index: true,
              admin: {
                description: 'A kurzus azonosítója az URL-ben (pl. bubble-sort-basics).',
              },
            },
            {
              name: 'summary',
              type: 'textarea',
              required: true,
              localized: true,
              admin: {
                description: 'Rövid összefoglaló szöveg, ami a kurzuslistában jelenik meg.',
              },
            },
            {
              name: 'heroTagline',
              type: 'text',
              localized: true,
              admin: {
                description: 'Egy rövid szlogen, ami a kurzus kezdőoldalának fejlécében látható.',
              },
            },
            {
              name: 'icon',
              type: 'text',
              defaultValue: '📘',
              admin: {
                description: 'Emoji vagy ikon kód a kurzus kártyájához.',
              },
            },
            {
              name: 'accentColor',
              type: 'text',
              defaultValue: '#269984',
              admin: {
                description: 'A kurzus gombjainak és UI elemeinek elsődleges színe.',
              },
            },
            {
              name: 'illustrationAsset',
              type: 'text',
              defaultValue: 'algo_group_109.svg',
              admin: {
                description: 'A kurzus fejlécében megjelenő illusztráció fájlneve.',
                components: {
                  Field: '@/app/components/Payload/AssetSelect#IllustrationSelect',
                },
              },
            },
            {
              name: 'estimatedMinutes',
              type: 'number',
              required: true,
              min: 1,
              admin: {
                description: 'A kurzus elvégzéséhez szükséges becsült idő percekben.',
              },
            },
            {
              name: 'difficulty',
              type: 'select',
              defaultValue: 'Beginner',
              options: difficultyOptions,
              required: true,
              admin: { description: 'A kurzus nehézségi szintje.' },
            },
          ],
        },
        {
          label: 'Mascot & Mentoring',
          fields: [
            {
              name: 'mascot',
              type: 'group',
              admin: {
                description: 'Per-course mascot configuration and trigger copy.',
              },
              fields: [
                {
                  name: 'enabled',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: {
                    description: 'Ki/Bekapcsolja a kabalát a teljes kurzusra.',
                  },
                },
                {
                  name: 'name',
                  type: 'text',
                  required: true,
                  defaultValue: 'Guide',
                  localized: true,
                  admin: {
                    description:
                      'A kabala neve (pl. Bubi). Ez jelenik meg a szövegbuborékok felett.',
                  },
                },
                {
                  name: 'asset',
                  type: 'text',
                  defaultValue: 'algo_group_109.svg',
                  admin: {
                    description: 'A kabala vizuális megjelenése (választható illusztráció).',
                    components: {
                      Field: '@/app/components/Payload/AssetSelect#MascotSelect',
                    },
                  },
                },
                {
                  name: 'accentColor',
                  type: 'text',
                  defaultValue: '#269984',
                  admin: {
                    description: 'A kabala szövegbuborékainak és UI elemeinek egyedi színe.',
                  },
                },
                {
                  name: 'idleTriggerSeconds',
                  type: 'number',
                  defaultValue: 30,
                  admin: {
                    description:
                      'Hány másodperc inaktivitás után szólaljon meg a kabala automatikusan.',
                  },
                },
                {
                  name: 'mistakeTriggerCount',
                  type: 'number',
                  defaultValue: 2,
                  admin: {
                    description:
                      'Hány egymást követő rossz válasz után ajánljon fel proaktív segítséget.',
                  },
                },
                {
                  name: 'summonLabel',
                  type: 'text',
                  defaultValue: 'Summon guide',
                  localized: true,
                  admin: {
                    description:
                      'A gomb felirata, amivel a kabalát bármikor manuálisan elő lehet hívni.',
                  },
                },
                {
                  name: 'idlePrompt',
                  type: 'textarea',
                  localized: true,
                  admin: {
                    description:
                      'Rövid figyelemfelkeltő üzenet inaktivitás esetén (pl. "Segíthetek a következő lépésben?").',
                  },
                },
                {
                  name: 'mistakePrompt',
                  type: 'textarea',
                  localized: true,
                  admin: {
                    description:
                      'Rövid üzenet gyanúsan sok hiba esetén, mielőtt megnyílna a tipp-felület.',
                  },
                },
                {
                  name: 'welcomeMessages',
                  type: 'array',
                  admin: {
                    description:
                      'Üdvözlő üzenetek a kurzus indításakor (véletlenszerűen választva).',
                  },
                  fields: [{ name: 'text', type: 'text', required: true, localized: true }],
                },
                {
                  name: 'overconfidentMessages',
                  type: 'array',
                  admin: {
                    description:
                      'Üzenetek arra az esetre, ha a felhasználó magabiztos volt, de elrontotta a feladatot.',
                  },
                  fields: [{ name: 'text', type: 'text', required: true, localized: true }],
                },
                {
                  name: 'streakMessages',
                  type: 'array',
                  admin: {
                    description:
                      'Dicsérő, bíztató üzenetek sikeres válaszsorozatok (streak) esetén.',
                  },
                  fields: [{ name: 'text', type: 'text', required: true, localized: true }],
                },
              ],
            },
          ],
        },
        {
          label: 'Phases',
          fields: [
            {
              name: 'phases',
              type: 'array',
              admin: {
                description:
                  'Ordered course phases; these are the main building blocks of the course.',
              },
              fields: [
                {
                  name: 'phaseId',
                  type: 'text',
                  required: true,
                  admin: {
                    description:
                      'Egyedi technikai azonosító (pl. bubble-sort-intro). Használd a javaslat gombot!',
                    components: {
                      Field: '@/app/components/Payload/AlgorithmSelect#PhaseIdSelect',
                    },
                  },
                },
                {
                  name: 'title',
                  type: 'text',
                  required: true,
                  localized: true,
                  admin: { description: 'A fázis címe a tanuló felé.' },
                },
                {
                  name: 'sourceAlgorithmId',
                  type: 'text',
                  required: true, // Legyen kötelező a meglévő algoritmusokhoz való kapcsolódás miatt
                  admin: {
                    description:
                      'Az algoritmus technikai neve, amiből a rendszer merít (pl. bubble-sort).',
                    components: {
                      Field: '@/app/components/Payload/AlgorithmSelect#AlgorithmIdSelect',
                    },
                  },
                },
                {
                  name: 'sourceView',
                  type: 'select',
                  required: true,
                  options: sourceViewOptions,
                  admin: {
                    description: 'Az interaktív felület típusa (videó, kvíz, animáció stb.).',
                  },
                },
                {
                  name: 'summary',
                  type: 'textarea',
                  required: true,
                  localized: true,
                  admin: { description: 'Fázis leírása: miről szól ez a rész?' },
                },

                {
                  name: 'mascotLine',
                  type: 'textarea',
                  localized: true,
                  admin: {
                    description: 'Opcionális: A kabala egyedi bátorító mondata.',
                    condition: (data) => data?.mascot?.enabled,
                  },
                },
                {
                  name: 'mascotMistakeLine',
                  type: 'textarea',
                  localized: true,
                  admin: {
                    description:
                      'Opcionális: Egyedi üzenet sok hiba esetén (pl. "Látom elakadtál ennél a résznél...").',
                    condition: (data) => data?.mascot?.enabled,
                  },
                },
                {
                  name: 'hintCopy',
                  type: 'textarea',
                  localized: true,
                  admin: {
                    description: 'A konkrét szakmai segítség/tipp a fázishoz.',
                    condition: (data) => data?.mascot?.enabled,
                  },
                },
                {
                  name: 'idleHelp',
                  type: 'textarea',
                  localized: true,
                  admin: {
                    description: 'Tipp vagy bátorítás, ha sokáig nem történik semmi a fázisban.',
                    condition: (data) => data?.mascot?.enabled,
                  },
                },
                {
                  name: 'askConfidence',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: {
                    description:
                      'Legyen-e magabiztosság ellenőrzés (kérdőív) a fázis befejezése után?',
                  },
                },
                {
                  name: 'maxPoints',
                  type: 'number',
                  defaultValue: 10,
                  min: 0,
                  admin: {
                    description:
                      'A fázisért kapható maximális pontszám. A create/alive nézetben részleges pontot is kaphat a tanuló.',
                  },
                },
                {
                  name: 'infoContent',
                  type: 'textarea',
                  localized: true,
                  admin: {
                    description: 'Információs szöveg (csak info nézetnél látszik).',
                    condition: (data, siblingData) => siblingData?.sourceView === 'info',
                  },
                },
                {
                  name: 'customVideoId',
                  type: 'text',
                  admin: {
                    description: 'YouTube Video ID (pl. d995_u3q6mE). Csak egyéni videó esetén.',
                    condition: (data, siblingData) => siblingData?.sourceView === 'video-custom',
                  },
                },
                {
                  name: 'quiz',
                  type: 'array',
                  admin: {
                    description: 'Kvíz kérdések (csak kvíz nézetnél látszik).',
                    condition: (data, siblingData) => siblingData?.sourceView === 'quiz',
                  },
                  fields: [
                    {
                      name: 'question',
                      type: 'text',
                      required: true,
                      localized: true,
                    },
                    {
                      name: 'options',
                      type: 'array',
                      fields: [
                        {
                          name: 'option',
                          type: 'text',
                          required: true,
                          localized: true,
                        },
                      ],
                    },
                    {
                      name: 'correctIndex',
                      type: 'number',
                      required: true,
                    },
                    {
                      name: 'explanation',
                      type: 'textarea',
                      required: true,
                      localized: true,
                    },
                  ],
                },
                {
                  name: 'matching',
                  type: 'array',
                  admin: {
                    description: 'Párosító feladat (bal és jobb oldal összekötése).',
                    condition: (data, siblingData) => siblingData?.sourceView === 'match',
                  },
                  fields: [
                    { name: 'left', type: 'text', required: true, localized: true },
                    { name: 'right', type: 'text', required: true, localized: true },
                  ],
                },
                {
                  name: 'ordering',
                  type: 'array',
                  admin: {
                    description: 'Sorrendbe rendezés feladat.',
                    condition: (data, siblingData) => siblingData?.sourceView === 'order',
                  },
                  fields: [{ name: 'text', type: 'text', required: true, localized: true }],
                },
                {
                  name: 'debugCode',
                  type: 'textarea',
                  admin: {
                    description: 'A hibás kód, amit ki kell javítani.',
                    condition: (data, siblingData) => siblingData?.sourceView === 'debug',
                  },
                },
                {
                  name: 'expectedCode',
                  type: 'textarea',
                  admin: {
                    description: 'Az elvárt kód a javítás után.',
                    condition: (data, siblingData) => siblingData?.sourceView === 'debug',
                  },
                },
                {
                  name: 'gapFillContent',
                  type: 'textarea',
                  localized: true,
                  admin: {
                    description:
                      'A szöveg hiányzó részekkel (pl: "A buborékrendezés {{gap}} algoritmus").',
                    condition: (data, siblingData) => siblingData?.sourceView === 'gap-fill',
                  },
                },
                {
                  name: 'gapFillOptions',
                  type: 'array',
                  admin: {
                    description: 'Választható szavak a hiányzó részekhez.',
                    condition: (data, siblingData) => siblingData?.sourceView === 'gap-fill',
                  },
                  fields: [{ name: 'option', type: 'text', required: true, localized: true }],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
