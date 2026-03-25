'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useLocale, Locale } from '../i18n/LocaleProvider';
import ThemeToggle from './ThemeToggle';
import { User as UserIcon } from 'lucide-react';

export default function Header({
  isAuthenticated,
  userImage,
}: {
  isAuthenticated?: boolean;
  userImage?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const { locale, setLocale, t } = useLocale();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // ... (keep logic same)
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const languages: { code: Locale; label: string; flag: string }[] = [
    { code: 'en', label: 'EN', flag: '/flags/gb.png' },
    { code: 'hu', label: 'HU', flag: '/flags/hu.png' },
    { code: 'ro', label: 'RO', flag: '/flags/ro.png' },
  ];

  const currentLang = languages.find((l) => l.code === locale) || languages[0];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-[var(--header-height)] bg-[#269984]">
      <div className="max-w-[1400px] mx-auto h-full flex items-center justify-between px-6 lg:px-12">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/assets/group_20.svg"
            alt="AlgoRythmics Logo"
            width={294}
            height={57}
            sizes="(max-width: 768px) 150px, 200px"
            className="pointer-events-none select-none"
            style={{
              filter: 'brightness(0) invert(1)',
              height: 'clamp(40px, 4vw, 48px)',
              width: 'auto',
            }}
          />
        </Link>

        {/* Desktop Nav — centre links */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-8">
          {isAuthenticated && (
            <>
              <NavLink href="/" label={t('nav.home')} active={pathname === '/'} />
              <NavLink
                href="/algorithms"
                label={t('nav.algorithms')}
                active={pathname?.startsWith('/algorithms') ?? false}
              />
              <NavLink href="/courses" label={t('nav.courses')} active={pathname === '/courses'} />
            </>
          )}
        </nav>

        {/* Right actions (Desktop) */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6">
          {!isAuthenticated && (
            <>
              <button
                onClick={() => router.push('/register')}
                className="font-montserrat text-white hover:text-white/80 transition-colors text-sm lg:text-base"
              >
                {t('nav.register')}
              </button>
              <button
                onClick={() => router.push('/login')}
                className="font-montserrat text-white hover:text-white/80 transition-colors text-sm lg:text-base"
              >
                {t('nav.login')}
              </button>
            </>
          )}
          <ThemeToggle />

          {/* Language Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity p-2"
            >
              <Image
                src={currentLang.flag}
                alt={currentLang.code}
                width={20}
                height={15}
                className="rounded-sm"
                style={{ width: '20px', height: '15px', objectFit: 'cover' }}
              />
              <span className="font-montserrat text-white text-sm lg:text-base uppercase">
                {currentLang.code}
              </span>
              <Image
                src="/assets/path_1568.svg"
                alt=""
                width={10}
                height={10}
                style={{
                  width: 'auto',
                  height: 'auto',
                  filter: 'brightness(0) invert(1)',
                  transform: langDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }}
              />
            </button>

            {/* Language Selection Menu */}
            {langDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-lg shadow-xl overflow-hidden py-1 border border-gray-100">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLocale(lang.code);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors ${
                      locale === lang.code
                        ? 'bg-gray-50 font-bold text-[var(--brand-teal)]'
                        : 'text-gray-700'
                    }`}
                  >
                    <Image
                      src={lang.flag}
                      alt={lang.code}
                      width={20}
                      height={15}
                      className="rounded-sm"
                      style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                    />
                    <span className="font-montserrat text-sm uppercase">{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Profile Dropdown (Far Right) */}
          {isAuthenticated && (
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-white/20 hover:border-white/50 transition-colors overflow-hidden bg-white/10"
              >
                {userImage ? (
                  <Image
                    src={userImage}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                    style={{ width: 'auto', height: 'auto' }}
                  />
                ) : (
                  <UserIcon className="w-6 h-6 text-white" />
                )}
              </button>

              {profileDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl overflow-hidden py-2 border border-blue-50/50 transform origin-top-right transition-all animate-in fade-in zoom-in duration-200">
                  <Link
                    href="/profil"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-blue-50/50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <UserIcon className="w-4 h-4 text-[#269984]" />
                    </div>
                    <span className="font-montserrat text-sm font-semibold">Profil</span>
                  </Link>
                  <div className="h-px bg-gray-100 my-1 mx-4" />
                  <button
                    onClick={async () => {
                      setProfileDropdownOpen(false);
                      await axios.post('/api/auth/logout');
                      router.push('/login');
                      router.refresh();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                    </div>
                    <span className="font-montserrat text-sm font-bold uppercase tracking-wider">
                      Logout
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span
            className={`block w-6 h-0.5 bg-white transition-transform ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}
          />
          <span
            className={`block w-6 h-0.5 bg-white transition-opacity ${menuOpen ? 'opacity-0' : ''}`}
          />
          <span
            className={`block w-6 h-0.5 bg-white transition-transform ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden absolute top-[var(--header-height)] left-0 right-0 bg-[#269984] shadow-lg border-t border-white/20">
          <nav className="flex flex-col p-6 gap-4">
            {isAuthenticated && (
              <>
                <Link
                  href="/"
                  className="font-montserrat text-white text-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  {t('nav.home')}
                </Link>
                <Link
                  href="/algorithms"
                  className="font-montserrat text-white text-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  {t('nav.algorithms')}
                </Link>
                <Link
                  href="/courses"
                  className="font-montserrat text-white text-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  {t('nav.courses')}
                </Link>
              </>
            )}
            <Link
              href="/contact"
              className="font-montserrat text-white text-lg"
              onClick={() => setMenuOpen(false)}
            >
              {t('nav.contact')}
            </Link>

            <div className="border-t border-white/20 pt-4 mt-2">
              <p className="text-white/60 text-sm font-montserrat mb-2">Language</p>
              <div className="flex gap-4">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => setLocale(lang.code)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${
                      locale === lang.code
                        ? 'bg-white text-[#269984] border-white'
                        : 'text-white border-white/30'
                    }`}
                  >
                    <Image
                      src={lang.flag}
                      alt={lang.code}
                      width={20}
                      height={15}
                      className="rounded-sm"
                      style={{ width: '20px', height: '15px', objectFit: 'cover' }}
                    />
                    <span className="font-montserrat text-sm uppercase font-bold">{lang.code}</span>
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-white/20" />
            {!isAuthenticated ? (
              <>
                <Link
                  href="/register"
                  className="font-montserrat text-white text-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  {t('nav.register')}
                </Link>
                <Link
                  href="/login"
                  className="font-montserrat text-white text-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  {t('nav.login')}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/profil"
                  className="flex items-center gap-3 font-montserrat text-white text-lg"
                  onClick={() => setMenuOpen(false)}
                >
                  <div className="w-8 h-8 rounded-full border border-white/30 overflow-hidden bg-white/10 flex items-center justify-center">
                    {userImage ? (
                      <Image
                        src={userImage}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                        style={{ width: 'auto', height: 'auto' }}
                      />
                    ) : (
                      <UserIcon className="w-5 h-5 flex-shrink-0" />
                    )}
                  </div>
                  Profile
                </Link>
                <button
                  onClick={async () => {
                    setMenuOpen(false);
                    await axios.post('/api/auth/logout');
                    router.push('/login');
                    router.refresh();
                  }}
                  className="font-montserrat text-white text-lg text-left font-bold"
                >
                  Logout
                </button>
              </>
            )}

            <div className="flex items-center gap-2 text-white">
              <ThemeToggle />
              <span className="font-montserrat">Switch Theme</span>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`font-montserrat transition-colors text-sm lg:text-[17px] ${
        active ? 'text-white font-bold' : 'text-white/90 hover:text-white'
      }`}
    >
      {label}
    </Link>
  );
}
