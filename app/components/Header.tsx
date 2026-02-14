"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useLocale, Locale } from "../i18n/LocaleProvider";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const { locale, setLocale, t } = useLocale();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ... (keep logic same)
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const languages: { code: Locale; label: string; flag: string }[] = [
    { code: "en", label: "EN", flag: "https://flagcdn.com/w40/gb.png" },
    { code: "hu", label: "HU", flag: "https://flagcdn.com/w40/hu.png" },
    { code: "ro", label: "RO", flag: "https://flagcdn.com/w40/ro.png" },
  ];

  const currentLang = languages.find(l => l.code === locale) || languages[0];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50"
      style={{ height: "85px", backgroundColor: "#269984" }}
    >
      <div className="max-w-[1400px] mx-auto h-full flex items-center justify-between px-6 lg:px-12">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/assets/group_20.svg"
            alt="AlgoRythmics Logo"
            width={0}
            height={0}
            sizes="100vw"
            className="h-10 sm:h-11 md:h-12 w-auto"
            style={{ filter: "brightness(0) invert(1)", width: "auto", height: "auto" }}
          />
        </Link>
        
        {/* Desktop Nav — centre links */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-8">
          <NavLink href="/" label={t("nav.home")} active={pathname === "/"} />
          <NavLink href="/algorithms" label={t("nav.algorithms")} active={pathname?.startsWith("/algorithms") ?? false} />
          <NavLink href="/courses" label={t("nav.courses")} active={pathname === "/courses"} />
        </nav>

        {/* Right actions (Desktop) */}
        <div className="hidden md:flex items-center gap-4 lg:gap-6">
          <button onClick={() => router.push("/register")} className="font-montserrat text-white hover:text-white/80 transition-colors text-sm lg:text-base">
            Register
          </button>
          <button onClick={() => router.push("/login")} className="font-montserrat text-white hover:text-white/80 transition-colors text-sm lg:text-base">
            Login
          </button>
          
          <ThemeToggle />
          
          {/* Language Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setLangDropdownOpen(!langDropdownOpen)} 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity p-2"
            >
              <Image src={currentLang.flag} alt={currentLang.code} width={20} height={15} className="w-5 h-auto rounded-sm object-cover" />
              <span className="font-montserrat text-white text-sm lg:text-base uppercase">{currentLang.code}</span>
              <Image 
                src="/assets/path_1568.svg" 
                alt="" 
                width={10}
                height={10}
                style={{ 
                  width: "10px", 
                  height: "auto", 
                  filter: "brightness(0) invert(1)",
                  transform: langDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s"
                }} 
              />
            </button>

            {/* Dropdown Menu */}
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
                      locale === lang.code ? "bg-gray-50 font-bold text-[var(--brand-teal)]" : "text-gray-700"
                    }`}
                  >
                    <Image src={lang.flag} alt={lang.code} width={20} height={15} className="w-5 h-auto rounded-sm object-cover" />
                    <span className="font-montserrat text-sm uppercase">{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search */}
          <button className="hover:opacity-80 transition-opacity">
            <Image src="/assets/group_500.svg" alt="Search" width={0} height={0} sizes="100vw" className="w-8 h-8 lg:w-9 lg:h-9" style={{ filter: "brightness(0) invert(1)", width: "auto", height: "auto" }} />
          </button>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden flex flex-col gap-1.5 p-2" onClick={() => setMenuOpen(!menuOpen)}>
          <span className={`block w-6 h-0.5 bg-white transition-transform ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block w-6 h-0.5 bg-white transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
          <span className={`block w-6 h-0.5 bg-white transition-transform ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden absolute top-[85px] left-0 right-0 bg-[#269984] shadow-lg border-t border-white/20">
          <nav className="flex flex-col p-6 gap-4">
            <Link href="/" className="font-montserrat text-white text-lg" onClick={() => setMenuOpen(false)}>{t("nav.home")}</Link>
            <Link href="/algorithms" className="font-montserrat text-white text-lg" onClick={() => setMenuOpen(false)}>{t("nav.algorithms")}</Link>
            <Link href="/courses" className="font-montserrat text-white text-lg" onClick={() => setMenuOpen(false)}>{t("nav.courses")}</Link>
            <Link href="/contact" className="font-montserrat text-white text-lg" onClick={() => setMenuOpen(false)}>{t("nav.contact")}</Link>
            
            <div className="border-t border-white/20 pt-4 mt-2">
              <p className="text-white/60 text-sm font-montserrat mb-2">Language</p>
              <div className="flex gap-4">
                {languages.map((lang) => (
                   <button 
                    key={lang.code}
                    onClick={() => setLocale(lang.code)} 
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md border ${
                      locale === lang.code 
                        ? "bg-white text-[#269984] border-white" 
                        : "text-white border-white/30"
                    }`}
                   >
                      <Image src={lang.flag} alt={lang.code} width={20} height={15} className="w-5 h-auto rounded-sm object-cover" />
                      <span className="font-montserrat text-sm uppercase font-bold">{lang.code}</span>
                   </button>
                ))}
              </div>
            </div>

            <hr className="border-white/20" />
            <Link href="/register" className="font-montserrat text-white text-lg" onClick={() => setMenuOpen(false)}>Register</Link>
            <Link href="/login" className="font-montserrat text-white text-lg" onClick={() => setMenuOpen(false)}>Login</Link>
            
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
        active ? "text-white font-bold" : "text-white/90 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}
