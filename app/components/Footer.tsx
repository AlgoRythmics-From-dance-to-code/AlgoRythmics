'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from '../i18n/LocaleProvider';

export default function Footer() {
  const { t } = useLocale();
  return (
    <footer className="w-full" style={{ backgroundColor: '#269984' }}>
      <div
        className="mx-auto px-6 py-4 flex flex-col items-center gap-5"
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
            <Image
              src="/assets/path_1.svg"
              alt="Facebook"
              width={0}
              height={0}
              sizes="100vw"
              className="h-7 sm:h-8 w-auto"
              style={{ filter: 'brightness(0) invert(1)', width: 'auto', height: 'auto' }}
            />
          </a>
          <a
            href="https://www.youtube.com/@AlgoRythmics"
            className="hover:opacity-80 transition-opacity"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/assets/group_77.svg"
              alt="YouTube"
              width={0}
              height={0}
              sizes="100vw"
              className="h-7 sm:h-8 w-auto"
              style={{ filter: 'brightness(0) invert(1)', width: 'auto', height: 'auto' }}
            />
          </a>
          <a
            href="https://www.youtube.com/@AlgoRythmics"
            className="hover:opacity-80 transition-opacity"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/assets/path_3.svg"
              alt="Instagram"
              width={0}
              height={0}
              sizes="100vw"
              className="h-7 sm:h-8 w-auto"
              style={{ filter: 'brightness(0) invert(1)', width: 'auto', height: 'auto' }}
            />
          </a>
        </div>

        {/* Copyright */}
        <p className="font-montserrat text-center text-xs sm:text-sm" style={{ color: '#ffffff' }}>
          © {new Date().getFullYear()} | algorythmics.com |{' '}
          <Link href="/about" className="hover:underline">
            {t('nav.about')}
          </Link>
        </p>
      </div>
    </footer>
  );
}
