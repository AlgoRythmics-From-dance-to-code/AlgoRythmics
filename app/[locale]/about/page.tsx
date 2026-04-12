'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from '../../i18n/LocaleProvider';

export default function AboutPage() {
  const { t } = useLocale();

  const teamMembers = [
    { key: 'sarah', initials: 'SC', color: '#269984' },
    { key: 'mark', initials: 'MW', color: '#36D6BA' },
    { key: 'anna', initials: 'AK', color: '#FBB03B' },
    { key: 'david', initials: 'DP', color: '#6C63FF' },
  ];

  const steps = [{ number: '01' }, { number: '02' }, { number: '03' }, { number: '04' }];

  return (
    <div className="w-full bg-white dark:bg-[#0a0a0a]">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-6 py-16 md:py-24 bg-[#F0FBF9] dark:bg-[#112220]">
        <h1 className="font-montserrat font-bold text-black dark:text-white text-3xl sm:text-4xl lg:text-[56px] mb-5 text-center">
          {t('about.title')}
        </h1>
        <p
          className="font-montserrat text-center text-base sm:text-lg lg:text-xl max-w-3xl text-[#666] dark:text-gray-400"
          style={{ lineHeight: '1.8em' }}
        >
          {t('about.subtitle')}
        </p>
      </div>

      {/* Mission */}
      <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-20">
        <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16">
          <div className="flex-1 text-center md:text-left">
            <h2 className="font-montserrat font-bold text-2xl sm:text-3xl lg:text-4xl mb-6 text-[#36D6BA]">
              {t('about.mission_title')}
            </h2>
            <p
              className="font-montserrat text-base sm:text-lg mb-5 text-[#333] dark:text-gray-300"
              style={{ lineHeight: '2em' }}
            >
              {t('about.mission_text1')}
            </p>
            <p
              className="font-montserrat text-base sm:text-lg text-[#333] dark:text-gray-300"
              style={{ lineHeight: '2em' }}
            >
              {t('about.mission_text2')}
            </p>
          </div>
          <div className="flex-shrink-0 w-60 sm:w-72 md:w-80 lg:w-96">
            <Image
              src="/assets/algo_group_166.svg"
              alt={t('about.mission_alt')}
              width={400}
              height={400}
              className="w-full h-auto dark:invert dark:hue-rotate-180"
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>
        </div>
      </div>

      {/* Team */}
      <div className="px-6 py-12 md:py-20 bg-[#FAFAFA] dark:bg-[#1a1a1a]">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="font-montserrat font-bold text-center text-2xl sm:text-3xl lg:text-4xl text-black dark:text-white mb-4">
            {t('about.team_title')}
          </h2>
          <p className="font-montserrat text-center text-base sm:text-lg mb-12 text-[#666] dark:text-gray-400">
            {t('about.team_subtitle')}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {teamMembers.map((member) => (
              <div
                key={member.key}
                className="flex flex-col items-center p-6 sm:p-8 bg-white dark:bg-[#2a2a2a] rounded-2xl shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <div
                  className="flex items-center justify-center rounded-full font-montserrat font-bold text-white mb-5 w-20 h-20 sm:w-24 sm:h-24 text-2xl sm:text-3xl"
                  style={{ backgroundColor: member.color }}
                >
                  {member.initials}
                </div>
                <h3 className="font-montserrat font-bold text-center text-base sm:text-lg text-black dark:text-white mb-2">
                  {t(`about.team.${member.key}.name`)}
                </h3>
                <p className="font-montserrat text-center text-sm text-[#666] dark:text-gray-400">
                  {t(`about.team.${member.key}.role`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-20">
        <h2 className="font-montserrat font-bold text-center text-2xl sm:text-3xl lg:text-4xl text-black dark:text-white mb-12">
          {t('about.how_it_works')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center">
              <div
                className="flex items-center justify-center rounded-full font-montserrat font-bold text-white mb-5 w-14 h-14 sm:w-16 sm:h-16 text-lg sm:text-xl"
                style={{ backgroundColor: '#269984' }}
              >
                {step.number}
              </div>
              <h3 className="font-montserrat font-bold text-lg sm:text-xl mb-3 text-[#36D6BA]">
                {t(`about.steps.${step.number}.title`)}
              </h3>
              <p
                className="font-montserrat text-sm sm:text-base text-[#666] dark:text-gray-400"
                style={{ lineHeight: '1.8em' }}
              >
                {t(`about.steps.${step.number}.desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center justify-center px-6 py-16 md:py-20 bg-[#269984] dark:bg-[#0a0a0a]">
        <h2 className="font-montserrat font-bold text-white text-2xl sm:text-3xl lg:text-4xl mb-4 text-center">
          {t('about.cta_title')}
        </h2>
        <p className="font-montserrat text-center text-base sm:text-lg mb-8 max-w-xl text-white/80">
          {t('about.cta_subtitle')}
        </p>
        <Link
          href="/register"
          className="font-montserrat font-bold text-white px-10 py-4 rounded-lg text-lg sm:text-xl hover:opacity-90 transition-all bg-[#36D6BA]"
          style={{ textDecoration: 'none' }}
        >
          {t('about.cta_btn')}
        </Link>
      </div>
    </div>
  );
}
