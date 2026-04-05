'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from '../i18n/LocaleProvider';

export default function Footer() {
  const { t } = useLocale();
  return (
    <footer className="w-full" style={{ backgroundColor: '#269984' }}>
      <div
        className="mx-auto px-6 pb-4 pt-4 flex flex-col items-center gap-5"
        style={{ maxWidth: '1400px' }}
      >
        {/* Social icons */}
        <div className="flex items-center gap-10">
          <a
            href="https://www.youtube.com/@AlgoRythmics"
            className="hover:opacity-80 transition-opacity"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="relative h-7 sm:h-8 w-7 sm:w-8">
              <Image
                src="/assets/path_1.svg"
                alt="Facebook"
                fill
                className="brightness-0 invert object-contain"
              />
            </div>
          </a>
          <a
            href="https://www.youtube.com/@AlgoRythmics"
            className="hover:opacity-80 transition-opacity"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="relative h-7 sm:h-8 w-8 sm:w-9">
              <Image
                src="/assets/group_77.svg"
                alt="YouTube"
                fill
                className="brightness-0 invert object-contain"
              />
            </div>
          </a>
          <a
            href="https://www.youtube.com/@AlgoRythmics"
            className="hover:opacity-80 transition-opacity"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="relative h-7 sm:h-8 w-7 sm:w-8">
              <Image
                src="/assets/path_3.svg"
                alt="Instagram"
                fill
                className="brightness-0 invert object-contain"
              />
            </div>
          </a>
        </div>

        {/* Copyright */}
        <p className="font-montserrat text-center text-xs sm:text-sm" style={{ color: '#ffffff' }}>
          © {new Date().getFullYear()} | algorythmics.com |{' '}
          <Link href="/about" className="hover:underline">
            {t('nav.about')}
          </Link>{' '}
          |{' '}
          <Link href="/terms" className="hover:underline">
            {t('nav.terms')}
          </Link>{' '}
          |{' '}
          <Link href="/privacy" className="hover:underline">
            {t('nav.privacy')}
          </Link>
        </p>
      </div>
    </footer>
  );
}
