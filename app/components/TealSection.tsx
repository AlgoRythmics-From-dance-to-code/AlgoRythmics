"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "../i18n/LocaleProvider";

export default function TealSection() {
  const { t } = useLocale();

  const cards = [
    { title: t("nav.algorithms"), href: "/algorithms", illustration: "/assets/group_65.svg" },
    { title: t("nav.courses"),    href: "/courses",    illustration: "/assets/group_70.svg" },
    { title: t("nav.profil"),     href: "/profil",     illustration: "/assets/group_71.svg" },
    { title: t("nav.contact"),    href: "/contact",    illustration: "/assets/group_75.svg" },
  ];

  return (
    <section className="w-full" style={{ backgroundColor: "#269984" }}>
      <div
        className="mx-auto px-6 py-10 md:py-14"
        style={{ maxWidth: "1200px" }}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white dark:bg-[#1a1a1a] rounded-[12px] overflow-hidden transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl flex flex-col group border border-transparent dark:border-white/10"
              style={{
                boxShadow: "0px 3px 6px rgba(0,0,0,0.16)",
              }}
            >
              {/* Title + accent bar */}
              <div className="px-4 pt-4 pb-2">
                <h3
                  className="font-montserrat font-bold text-black dark:text-white"
                  style={{ fontSize: "clamp(14px, 1.2vw, 20px)" }}
                >
                  {card.title}
                </h3>
                <div
                  className="mt-2 rounded-sm bg-black dark:bg-white"
                  style={{ width: "80px", height: "3px" }}
                />
              </div>

              {/* Illustration */}
              <div className="flex-1 flex items-center justify-center p-4 pt-1">
                <Image
                  src={card.illustration}
                  alt={card.title}
                  width={0}
                  height={0}
                  sizes="100vw"
                  className="w-full h-auto pointer-events-none select-none dark:invert dark:hue-rotate-180"
                  style={{ maxWidth: "180px", width: "100%", height: "auto" }}
                />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
