'use client';

import Image from 'next/image';
import { useLocale } from '../i18n/LocaleProvider';

export default function Hero() {
  const { t } = useLocale();

  return (
    <>
      {/* ━━━ HERO SECTION ━━━ */}
      <section className="w-full relative overflow-hidden bg-white dark:bg-[#0a0a0a]">
        {/* ── TELJES SZÉLESSÉGŰ RÉTEG A GRAFIKÁNAK ── */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-10 hidden md:block">
          <Image
            src="/assets/hero_ground_path.svg"
            alt="AlgoRythmics visualization of sorting algorithms"
            width={818}
            height={744}
            priority
            sizes="(max-width: 1920px) 35vw, 600px"
            className="absolute dark:invert dark:hue-rotate-180"
            style={{
              bottom: '-1px',
              right: '8%',
              width: '35.2%',
              height: 'auto',
            }}
          />
        </div>

        {/* Content wrapper – 1920 based layout */}
        <div className="relative mx-auto" style={{ maxWidth: '1920px' }}>
          <div className="hidden md:block" style={{ height: '655px' }} />

          {/* ── Decorative vine/dots (top-left) ── */}
          <Image
            src="/assets/group_23.svg"
            alt="Decorative algorithmic pattern"
            width={186}
            height={361}
            sizes="200px"
            aria-hidden={true}
            className="absolute pointer-events-none select-none hidden md:block dark:invert dark:hue-rotate-180"
            style={{ left: '420px', width: '200px', top: '-7px', height: 'auto' }}
          />

          {/* ── Text block (left side) ── */}
          <div
            className="absolute hidden md:block"
            style={{ top: '250px', left: '90px', width: '440px' }}
          >
            <h1
              className="font-montserrat font-bold leading-[1.12] text-black dark:text-white"
              style={{ fontSize: '55px' }}
            >
              {t('hero.title_line1')}
              <br />
              {t('hero.title_line2')}
              <br />
              {t('hero.title_line3')}
            </h1>
            <p
              className="font-montserrat mt-5 text-black dark:text-white"
              style={{ fontSize: '17px', lineHeight: '1.7em' }}
            >
              {t('hero.description')}
            </p>
          </div>

          {/* Mobile fallback marad változatlanul */}
          <div className="md:hidden flex flex-col items-center px-6 py-12 gap-8 z-20 relative">
            <Image
              src="/assets/group_21.svg"
              alt="AlgoRythmics visualization mobile"
              width={818}
              height={744}
              priority
              sizes="(max-width: 768px) 80vw, 400px"
              className="max-w-[400px] pointer-events-none select-none dark:invert dark:hue-rotate-180"
              style={{ width: '80%', height: 'auto' }}
            />
            <div className="text-center">
              <h1 className="font-montserrat font-bold text-3xl leading-[1.15] mb-4 text-black dark:text-white">
                {t('hero.title_line1')}
                <br />
                {t('hero.title_line2')}
                <br />
                {t('hero.title_line3')}
              </h1>
              <p
                className="font-montserrat text-sm mx-auto text-black dark:text-white"
                style={{ lineHeight: '1.7em', maxWidth: '340px' }}
              >
                {t('hero.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ TRANSITION: group_25.svg ━━━ */}
      <div className="w-full bg-white dark:bg-[#0a0a0a]">
        <Image
          src="/assets/group_25.svg"
          alt=""
          width={2454}
          height={632}
          sizes="100vw"
          aria-hidden={true}
          className="w-full h-auto pointer-events-none select-none dark:invert dark:hue-rotate-180"
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />
      </div>
    </>
  );
}
