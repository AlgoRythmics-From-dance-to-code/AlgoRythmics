'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from '../i18n/LocaleProvider';

export default function TealSection() {
  const { t } = useLocale();

  const cards = [
    {
      title: t('nav.algorithms'),
      href: '/algorithms',
      illustration: '/assets/group_65.svg',
      width: 206,
      height: 203,
    },
    {
      title: t('nav.courses'),
      href: '/courses',
      illustration: '/assets/group_70.svg',
      width: 246,
      height: 166,
    },
    {
      title: t('nav.profil'),
      href: '/profil',
      illustration: '/assets/group_71.svg',
      width: 197,
      height: 202,
    },
    {
      title: t('nav.contact'),
      href: '/contact',
      illustration: '/assets/group_75.svg',
      width: 215,
      height: 198,
    },
  ];

  return (
    <>
      {/* Wave Transition from White section to Teal section */}
      <div className="w-full bg-white dark:bg-[#0a0a0a] -mb-1">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
          preserveAspectRatio="none"
        >
          <path
            d="M0 120L1440 120L1440 0C1440 0 1080 120 720 120C360 120 0 0 0 0L0 120Z"
            fill="#269984"
          />
        </svg>
      </div>

      <section className="w-full bg-[#269984] pt-20">
        <div className="mx-auto px-6" style={{ maxWidth: '1300px' }}>
          {/* Stacked Folder Container */}
          <div className="relative flex flex-row flex-wrap lg:flex-nowrap items-center justify-center gap-10 lg:gap-0 lg:-space-x-12">
            {cards.map((card, index) => (
              <Link
                key={card.href}
                href={card.href}
                className={`
                  relative w-full max-w-[310px] aspect-[4/5] 
                  bg-white dark:bg-[#1a1a1a] 
                  rounded-br-[24px] rounded-bl-[20px] rounded-tr-[24px]
                  transition-all duration-500 ease-in-out
                  hover:z-50 hover:-translate-y-8 hover:-translate-x-4 hover:rotate-0
                  group shadow-2xl overflow-visible
                  ${index % 2 === 0 ? 'lg:rotate-[-3deg]' : 'lg:rotate-[3deg]'}
                  flex flex-col
                `}
                style={{
                  zIndex: index + 1,
                }}
              >
                {/* Folder Tab */}
                <div className="absolute top-0 left-0 -translate-y-[20px] w-1/2 h-7 bg-white dark:bg-[#1a1a1a] rounded-t-[14px] flex items-center px-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#269984]/30 group-hover:bg-[#269984] transition-colors" />
                </div>

                {/* Title Section */}
                <div className="p-7 pb-3">
                  <h3
                    className="font-montserrat font-black text-[#269984] dark:text-white uppercase tracking-tighter"
                    style={{ fontSize: 'clamp(18px, 1.8vw, 22px)' }}
                  >
                    {card.title}
                  </h3>
                  <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {t('algorithm_card.read_more')} &rarr;
                  </p>
                </div>

                {/* Illustration Body */}
                <div className="flex-1 flex items-center justify-center p-5 relative overflow-hidden">
                  {/* Decorative Background for Illustration */}
                  <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <svg
                      className="w-full h-full"
                      viewBox="0 0 100 100"
                      fill="none"
                      stroke="currentColor"
                    >
                      <pattern
                        id={`pattern-${index}`}
                        width="10"
                        height="10"
                        patternUnits="userSpaceOnUse"
                      >
                        <circle cx="2" cy="2" r="1" />
                      </pattern>
                      <rect width="100" height="100" fill={`url(#pattern-${index})`} />
                    </svg>
                  </div>

                  <Image
                    src={card.illustration}
                    alt={`Visual representation of ${card.title}`}
                    width={card.width}
                    height={card.height}
                    sizes="(max-width: 768px) 250px, 200px"
                    className="relative z-10 w-full h-auto pointer-events-none select-none transition-transform duration-500 group-hover:scale-110 group-hover:rotate-2 dark:invert dark:hue-rotate-180"
                    style={{ maxWidth: '200px', width: '85%', height: 'auto' }}
                  />
                </div>

                {/* Visual Depth Bar */}
                <div className="h-4 w-full bg-neutral-100 dark:bg-neutral-800/50 rounded-b-[20px] transition-colors group-hover:bg-[#269984]/5" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
