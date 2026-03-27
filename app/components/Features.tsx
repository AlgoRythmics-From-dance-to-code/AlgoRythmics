'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useLocale } from '../i18n/LocaleProvider';

export default function Features() {
  const { t } = useLocale();

  const features = [
    {
      id: 'video',
      src: '/assets/group_28.svg',
      gifSrc: '/assets/design/gifs/steps/Video_turquoise.gif',
      alt: t('features.video'),
      label: t('features.video'),
      width: 330,
      height: 330,
    },
    {
      id: 'animation',
      src: '/assets/group_34.svg',
      gifSrc: '/assets/design/gifs/steps/Animation_turquoise.gif',
      alt: t('features.animation'),
      label: t('features.animation'),
      width: 330,
      height: 330,
    },
    {
      id: 'control',
      src: '/assets/group_38.svg',
      gifSrc: '/assets/design/gifs/steps/Control_turquoise.gif',
      alt: t('features.control'),
      label: t('features.control'),
      width: 330,
      height: 330,
    },
    {
      id: 'create_code',
      src: '/assets/group_43.svg',
      gifSrc: '/assets/design/gifs/steps/Create_code_turquoise.gif',
      alt: t('features.create_code'),
      label: t('features.create_code'),
      width: 330,
      height: 330,
    },
    {
      id: 'live_code',
      src: '/assets/group_47.svg',
      gifSrc: '/assets/design/gifs/steps/Live_code_turquoise.gif',
      alt: t('features.live_code'),
      label: t('features.live_code'),
      width: 331,
      height: 331,
    },
    {
      id: 'quiz',
      src: '/assets/group_51.svg',
      gifSrc: '/assets/design/gifs/steps/Quiz_turquoise.gif',
      alt: t('features.quiz'),
      label: t('features.quiz'),
      width: 331,
      height: 331,
    },
  ];

  return (
    <section className="w-full bg-white dark:bg-[#0a0a0a] py-10 md:py-16">
      <div className="mx-auto px-6" style={{ maxWidth: '1200px' }}>
        <h2
          className="font-montserrat font-bold text-center mb-10 md:mb-14 text-black dark:text-white"
          style={{ fontSize: 'clamp(22px, 2.5vw, 36px)' }}
        >
          {t('features.title')}
        </h2>

        <div
          className="grid grid-cols-2 sm:grid-cols-3 mx-auto"
          style={{ gap: '30px', maxWidth: '1000px' }}
        >
          {features.map((feature) => (
            <Link key={feature.id} href="/algorithms">
              <FeatureCard
                src={feature.src}
                gifSrc={feature.gifSrc}
                alt={feature.alt}
                label={feature.label}
                width={feature.width}
                height={feature.height}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  src,
  gifSrc,
  alt,
  label,
  width,
  height,
}: {
  src: string;
  gifSrc: string;
  alt: string;
  label: string;
  width: number;
  height: number;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="flex items-center justify-center relative cursor-pointer group h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative w-full aspect-square max-w-[280px] flex items-center justify-center overflow-hidden">
        {/* Base Static Illustration */}
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes="(max-width: 768px) 100vw, 280px"
          className="w-full h-auto pointer-events-none select-none transition-all duration-300 ease-out dark:invert dark:hue-rotate-180 group-hover:opacity-20 group-hover:blur-md group-hover:scale-90"
          style={{ maxWidth: '280px', width: '100%', height: 'auto' }}
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] opacity-0 invisible group-hover:opacity-100 group-hover:visible">
          {/* Label above GIF */}
          <span className="font-montserrat font-bold text-[#269984] text-sm md:text-base mb-3 uppercase tracking-widest drop-shadow-sm transform transition-all duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
            {label}
          </span>

          <div className="relative w-4/5 aspect-square transition-all duration-300 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] scale-75 group-hover:scale-100 drop-shadow-[0_0_20px_rgba(38,153,132,0.2)]">
            {isHovered && <Image src={gifSrc} alt="" fill unoptimized className="object-contain" />}
          </div>
        </div>
      </div>
    </div>
  );
}
