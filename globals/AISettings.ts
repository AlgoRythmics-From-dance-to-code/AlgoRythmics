import type { GlobalConfig } from 'payload';
import { ROLES } from '../lib/constants';

export const AISettings: GlobalConfig = {
  slug: 'ai-settings',
  label: 'AI Beállítások (OpenRouter)',
  admin: {
    group: 'Beállítások',
    hidden: ({ user }) => user?.role !== ROLES.ADMIN,
  },
  access: {
    read: ({ req: { user } }) => user?.role === ROLES.ADMIN || user?.role === ROLES.EDITOR,
    update: ({ req: { user } }) => user?.role === ROLES.ADMIN,
  },
  fields: [
    {
      name: 'model',
      type: 'text',
      required: true,
      defaultValue: 'google/gemini-2.5-flash',
      label: 'OpenRouter Modell',
      admin: {
        description:
          'Az AI tananyag generáláshoz használt OpenRouter modell (pl. google/gemini-2.5-flash, openai/gpt-4o-mini, anthropic/claude-3.5-haiku, openrouter/free).',
        placeholder: 'google/gemini-2.5-flash',
      },
    },
    {
      name: 'apiKey',
      type: 'text',
      required: false,
      label: 'OpenRouter API Kulcs',
      access: {
        read: ({ req: { user } }) => user?.role === ROLES.ADMIN,
        update: ({ req: { user } }) => user?.role === ROLES.ADMIN,
      },
      admin: {
        description:
          'Az OpenRouter hozzáférési kulcs (sk-or-v1-...). Kizárólag a rendszergazdák szerkeszthetik.',
        placeholder: 'sk-or-v1-...',
      },
    },
  ],
};
