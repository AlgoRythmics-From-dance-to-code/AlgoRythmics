import type { CollectionConfig } from 'payload';

import { ROLES } from '../lib/constants';
import { bubbleSortCourseBlueprint } from '../lib/courses/courseCatalog';

const difficultyOptions = [
  { label: 'Beginner', value: 'Beginner' },
  { label: 'Intermediate', value: 'Intermediate' },
  { label: 'Advanced', value: 'Advanced' },
];

const phaseKindOptions = [
  { label: 'Motivation', value: 'motivation' },
  { label: 'Guided visualization', value: 'guided-visualization' },
  { label: 'Code building', value: 'code-building' },
  { label: 'Analysis', value: 'analysis' },
  { label: 'Final challenge', value: 'final-challenge' },
];

const coursePresetOptions = [
  { label: 'Bubble Sort starter template', value: 'bubble-sort' },
  { label: 'Custom course', value: 'custom' },
];

const sourceViewOptions = [
  { label: 'Video', value: 'video' },
  { label: 'Animation', value: 'animation' },
  { label: 'Control', value: 'control' },
  { label: 'Create', value: 'create' },
  { label: 'Alive', value: 'alive' },
];

export const Courses: CollectionConfig = {
  slug: 'courses',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'algorithmId', 'difficulty', 'updatedAt'],
    group: 'Learning',
    description:
      'Reusable course blueprints with phases, mascot behavior, confidence prompts, and complexity guidance.',
  },
  access: {
    read: () => true,
    create: ({ req: { user } }) => user?.role === ROLES.ADMIN,
    update: ({ req: { user } }) => user?.role === ROLES.ADMIN,
    delete: ({ req: { user } }) => user?.role === ROLES.ADMIN,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (!data) return data;

        if (data.preset === 'bubble-sort') {
          return {
            ...bubbleSortCourseBlueprint,
            ...data,
            mascot: {
              ...bubbleSortCourseBlueprint.mascot,
              ...(data.mascot || {}),
            },
            confidenceLearning: {
              ...bubbleSortCourseBlueprint.confidenceLearning,
              ...(data.confidenceLearning || {}),
            },
            complexity: {
              ...bubbleSortCourseBlueprint.complexity,
              ...(data.complexity || {}),
            },
            finalChallenge: {
              ...bubbleSortCourseBlueprint.finalChallenge,
              ...(data.finalChallenge || {}),
            },
            phases: Array.isArray(data.phases)
              ? data.phases.map((phase, index) => ({
                  ...bubbleSortCourseBlueprint.phases[index],
                  ...(phase || {}),
                  tips: Array.isArray((phase as { tips?: unknown[] })?.tips)
                    ? (phase as { tips: unknown[] }).tips
                    : bubbleSortCourseBlueprint.phases[index]?.tips || [],
                }))
              : bubbleSortCourseBlueprint.phases,
            nextSteps:
              Array.isArray(data.nextSteps) && data.nextSteps.length > 0
                ? data.nextSteps
                : bubbleSortCourseBlueprint.nextSteps,
          };
        }

        return data;
      },
    ],
  },
  fields: [
    {
      name: 'preset',
      type: 'select',
      defaultValue: 'bubble-sort',
      options: coursePresetOptions,
      required: true,
      admin: {
        description: 'Pick the bubble sort starter template or start from a blank custom course.',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        description: 'Used in the public URL, for example bubble-sort.',
      },
    },
    {
      name: 'algorithmId',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'The canonical algorithm or topic id that the course teaches.',
      },
    },
    {
      name: 'summary',
      type: 'textarea',
      required: true,
    },
    {
      name: 'heroTagline',
      type: 'text',
      admin: {
        description: 'A short line used on the course landing page hero.',
      },
    },
    {
      name: 'icon',
      type: 'text',
      defaultValue: '📘',
      admin: {
        description: 'Emoji or short icon token for the course card.',
      },
    },
    {
      name: 'accentColor',
      type: 'text',
      defaultValue: '#269984',
      admin: {
        description: 'Primary accent color used in cards and buttons.',
      },
    },
    {
      name: 'illustrationAsset',
      type: 'text',
      defaultValue: 'algo_group_109.svg',
      admin: {
        description: 'Asset filename from /public/assets.',
      },
    },
    {
      name: 'estimatedMinutes',
      type: 'number',
      required: true,
      min: 1,
      admin: {
        description: 'Approximate total learning time in minutes.',
      },
    },
    {
      name: 'difficulty',
      type: 'select',
      defaultValue: 'Beginner',
      options: difficultyOptions,
      required: true,
    },
    {
      name: 'featuredReason',
      type: 'textarea',
      admin: {
        description: 'Why this course deserves a featured card on the course index.',
      },
    },
    {
      name: 'learningModes',
      type: 'text',
      hasMany: true,
      admin: {
        description: 'Short labels such as Video intuition, Drag-and-drop, or Debugging.',
      },
    },
    {
      name: 'mascot',
      type: 'group',
      admin: {
        description: 'Per-course mascot configuration and trigger copy.',
      },
      fields: [
        { name: 'name', type: 'text', required: true, defaultValue: 'Guide' },
        {
          name: 'preset',
          type: 'text',
          admin: {
            description: 'Preset key for course-specific mascot styling.',
          },
        },
        { name: 'asset', type: 'text', defaultValue: 'algo_group_109.svg' },
        { name: 'accentColor', type: 'text', defaultValue: '#269984' },
        {
          name: 'idleTriggerSeconds',
          type: 'number',
          defaultValue: 30,
        },
        {
          name: 'mistakeTriggerCount',
          type: 'number',
          defaultValue: 2,
        },
        {
          name: 'summonLabel',
          type: 'text',
          defaultValue: 'Summon guide',
        },
        {
          name: 'idlePrompt',
          type: 'textarea',
          admin: {
            description: 'Message used when the learner stalls for a while.',
          },
        },
        {
          name: 'mistakePrompt',
          type: 'textarea',
          admin: {
            description: 'Message used after repeated wrong attempts.',
          },
        },
        {
          name: 'confidencePrompt',
          type: 'text',
          defaultValue: 'How sure are you?',
        },
      ],
    },
    {
      name: 'confidenceLearning',
      type: 'group',
      admin: {
        description: 'Confidence-based learning copy and reward configuration.',
      },
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: true },
        { name: 'promptLabel', type: 'text', defaultValue: 'Confidence check' },
        {
          name: 'praiseText',
          type: 'textarea',
          defaultValue: 'Great reasoning. The confidence check matched your answer.',
        },
        {
          name: 'correctionText',
          type: 'textarea',
          defaultValue: 'That is a common first guess. Let us inspect the rule once more.',
        },
        { name: 'rewardBadge', type: 'text', defaultValue: 'Confidence Builder' },
        {
          name: 'idleCheckProbability',
          type: 'number',
          defaultValue: 0.25,
          admin: {
            description: 'Probability of occasionally prompting a confidence check.',
          },
        },
      ],
    },
    {
      name: 'complexity',
      type: 'group',
      admin: {
        description: 'Complexity notes, diagrams, and mistake impact details.',
      },
      fields: [
        { name: 'timeComplexity', type: 'text', defaultValue: 'O(n^2)' },
        { name: 'spaceComplexity', type: 'text', defaultValue: 'O(1)' },
        { name: 'bestCase', type: 'textarea' },
        { name: 'averageCase', type: 'textarea' },
        { name: 'worstCase', type: 'textarea' },
        {
          name: 'diagramChoices',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'explanation', type: 'textarea', required: true },
            { name: 'impact', type: 'textarea', required: true },
            { name: 'correct', type: 'checkbox', defaultValue: false },
          ],
        },
        {
          name: 'mistakeImpacts',
          type: 'array',
          fields: [
            { name: 'label', type: 'text', required: true },
            { name: 'impact', type: 'textarea', required: true },
          ],
        },
      ],
    },
    {
      name: 'phases',
      type: 'array',
      admin: {
        description: 'Ordered course phases; these are the main building blocks of the course.',
      },
      fields: [
        { name: 'phaseId', type: 'text', required: true },
        { name: 'title', type: 'text', required: true },
        { name: 'kind', type: 'select', required: true, options: phaseKindOptions },
        {
          name: 'sourceView',
          type: 'select',
          required: true,
          options: sourceViewOptions,
          admin: {
            description: 'Which existing algorithm learning view this phase should embed.',
          },
        },
        {
          name: 'sourceAlgorithmId',
          type: 'text',
          defaultValue: 'bubble-sort',
          admin: {
            description: 'Algorithm id to pull the learning step from, such as bubble-sort.',
          },
        },
        { name: 'summary', type: 'textarea', required: true },
        { name: 'objective', type: 'textarea', required: true },
        { name: 'durationMinutes', type: 'number', required: true, min: 1 },
        {
          name: 'confidencePrompt',
          type: 'text',
          admin: {
            description: 'Prompt shown after the learner answers or before a checkpoint.',
          },
        },
        { name: 'mascotLine', type: 'textarea' },
        { name: 'taskTitle', type: 'text', required: true },
        { name: 'taskPrompt', type: 'textarea', required: true },
        { name: 'successCopy', type: 'textarea', required: true },
        { name: 'hintCopy', type: 'textarea', required: true },
        { name: 'rewardLabel', type: 'text', required: true },
        {
          name: 'tips',
          type: 'array',
          fields: [{ name: 'tip', type: 'text', required: true }],
        },
      ],
    },
    {
      name: 'finalChallenge',
      type: 'group',
      admin: {
        description: 'Final debugging and quiz challenge configuration.',
      },
      fields: [
        { name: 'title', type: 'text', defaultValue: 'Final Challenge' },
        { name: 'debuggingPrompt', type: 'textarea', required: true },
        { name: 'quizPrompt', type: 'textarea', required: true },
        { name: 'mentorPolicy', type: 'textarea', required: true },
        { name: 'badge', type: 'text', defaultValue: 'Learning Complete' },
      ],
    },
    {
      name: 'nextSteps',
      type: 'text',
      hasMany: true,
      admin: {
        description: 'Optional authoring notes for the next course blueprint.',
      },
    },
  ],
};
