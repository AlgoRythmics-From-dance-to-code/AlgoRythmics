'use client';

import { useLocale } from '../../../i18n/LocaleProvider';
import Link from 'next/link';

export default function TermsPage() {
  const { t, getRaw } = useLocale();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] pt-24 pb-20 px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-montserrat font-black text-[#269984] dark:text-white mb-8">
          {t('terms_page.title')}
        </h1>

        <div className="prose prose-lg dark:prose-invert max-w-none font-montserrat text-gray-700 dark:text-gray-300 space-y-6">
          <section>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              {t('terms_page.intro_title')}
            </h2>
            <p>{t('terms_page.intro_text')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              {t('terms_page.license_title')}
            </h2>
            <p>{t('terms_page.license_text')}</p>
            <ul className="list-disc pl-6 space-y-2">
              {((getRaw('terms_page.license_list') as string[]) || []).map((item, id) => (
                <li key={id}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              {t('terms_page.disclaimer_title')}
            </h2>
            <p>{t('terms_page.disclaimer_text')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              {t('terms_page.limitations_title')}
            </h2>
            <p>{t('terms_page.limitations_text')}</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-black dark:text-white mb-4">
              {t('terms_page.law_title')}
            </h2>
            <p>{t('terms_page.law_text')}</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#269984] font-bold hover:underline"
          >
            &larr; {t('terms_page.back_home')}
          </Link>
        </div>
      </div>
    </div>
  );
}
