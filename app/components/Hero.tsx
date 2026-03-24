'use client';

import Image from 'next/image';
import { useLocale } from '../i18n/LocaleProvider';

export default function Hero() {
  const { t } = useLocale();

  return (
    <>
      {/* ━━━ HERO SECTION ━━━ WHITE background matching Figma */}
      <section className="w-full relative overflow-hidden bg-white dark:bg-[#0a0a0a]">
        {/* Content wrapper – 1920 based layout */}
        <div className="relative mx-auto" style={{ maxWidth: '1920px' }}>
          {/* ── Decorative vine/dots (top-left) ── */}
          <Image
            src="/assets/group_23.svg"
            alt=""
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

          {/* ── Hero illustration (right side) ── */}
          <Image
            src="/assets/hero_ground_path.svg"
            alt="Hero illustration"
            width={818}
            height={744}
            priority
            sizes="(max-width: 768px) 100vw, 720px"
            className="absolute pointer-events-none select-none hidden md:block dark:invert dark:hue-rotate-180 w-[450px] lg:w-[600px] xl:w-[720px]"
            style={{
              top: '0px',
              right: '100px',
              width: 'clamp(450px, 40vw, 720px)',
              height: 'auto',
              zIndex: 2,
            }}
          />

          {/* Mobile fallback */}
          <div className="md:hidden flex flex-col items-center px-6 py-12 gap-8">
            <Image
              src="/assets/group_21.svg"
              alt="Hero illustration"
              width={818}
              height={744}
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

        {/* Spacer for absolute content */}
        <div className="hidden md:block" style={{ height: '655px' }} />
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
