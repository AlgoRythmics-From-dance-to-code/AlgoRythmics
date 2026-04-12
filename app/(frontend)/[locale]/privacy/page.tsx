'use client';

import { useLocale } from '../../../i18n/LocaleProvider';
import Link from 'next/link';

export default function PrivacyPage() {
  const { t, getRaw } = useLocale();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] pt-24 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-montserrat font-black text-[#269984] dark:text-white mb-8">
          {t('privacy_page.title')}
        </h1>

        <div className="prose prose-lg dark:prose-invert max-w-none font-montserrat text-gray-700 dark:text-gray-300 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              {t('privacy_page.gen_title')}
            </h2>
            <p>{t('privacy_page.gen_text')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              {t('privacy_page.data_title')}
            </h2>
            <p>{t('privacy_page.data_text')}</p>
            <ul className="list-disc pl-6 space-y-2">
              {((getRaw('privacy_page.data_list') as string[]) || []).map((item, id) => (
                <li key={id}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              {t('privacy_page.usage_title')}
            </h2>
            <p>{t('privacy_page.usage_text')}</p>
            <ul className="list-disc pl-6 space-y-2">
              {((getRaw('privacy_page.usage_list') as string[]) || []).map((item, id) => (
                <li key={id}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              {t('privacy_page.protection_title')}
            </h2>
            <p>{t('privacy_page.protection_text')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              {t('privacy_page.rights_title')}
            </h2>
            <p>{t('privacy_page.rights_text')}</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#269984] font-bold hover:underline"
          >
            &larr; {t('privacy_page.back_home')}
          </Link>
        </div>
      </div>
    </div>
  );
}
