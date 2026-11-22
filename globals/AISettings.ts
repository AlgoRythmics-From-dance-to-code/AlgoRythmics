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
      name: 'mascotEnabled',
      type: 'checkbox',
      defaultValue: true,
      label: 'AI Kabala (Bubi) Globális Engedélyezése a Kurzusokban',
      admin: {
        description:
          'Főkapcsoló: ha kikapcsolod, az AI kabala egyik kurzusban sem jelenik meg a diákoknak és nem használ tokeneket. A Course Studio-ban az AI kurzusgenerálás ettől függetlenül továbbra is működik.',
      },
    },
    {
      name: 'model',
      type: 'text',
      required: true,
      defaultValue: 'google/gemini-2.5-flash',
      label: 'OpenRouter Modell',
      admin: {
        description:
          'Az AI tananyag generáláshoz és a kabalához használt OpenRouter modell (pl. google/gemini-2.5-flash, openai/gpt-4o-mini, anthropic/claude-3.5-haiku, openrouter/free).',
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
    {
      name: 'mascotMaxMessagesPerDay',
      type: 'number',
      defaultValue: 30,
      min: 1,
      max: 500,
      label: 'Napi AI Kabala Chat Limit (üzenet / felhasználó / nap)',
      admin: {
        description:
          'Egy felhasználó legfeljebb ennyi AI chat választ kérhet naponta a kabalától. A limit elérése után a kabala 0 tokenes helyi tippekre vált.',
      },
    },
    {
      name: 'mascotMaxMessagesPerPhase',
      type: 'number',
      defaultValue: 5,
      min: 1,
      max: 50,
      label: 'Lépésenkénti (Fázis) AI Chat Limit (kérdés / kurzuslépés)',
      admin: {
        description:
          'Egy adott kurzuslépésen belül legfeljebb ennyi szabad szöveges kérdést tehet fel a diák az AI kabalának.',
      },
    },
    {
      name: 'mascotCooldownSeconds',
      type: 'number',
      defaultValue: 8,
      min: 0,
      max: 120,
      label: 'Kérdések Közötti Cooldown (másodperc)',
      admin: {
        description:
          'Ennyi másodpercet kell várni két egymást követő AI kabala chat kérdés között (spam védelem).',
      },
    },
  ],
};
