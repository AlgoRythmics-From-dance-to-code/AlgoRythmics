"use client";

import Image from "next/image";
import { useLocale } from "../i18n/LocaleProvider";

export default function Features() {
  const { t } = useLocale();

  return (
    <section className="w-full bg-white dark:bg-[#0a0a0a] py-10 md:py-16">
      <div className="mx-auto px-6" style={{ maxWidth: "1200px" }}>
        {/* Title – matching Figma */}
        <h2
          className="font-montserrat font-bold text-center mb-10 md:mb-14 text-black dark:text-white"
          style={{ fontSize: "clamp(22px, 2.5vw, 36px)" }}
        >
          {t("features.title")}
        </h2>

        {/* 3 × 2 illustration grid – raw illustrations like in Figma */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 mx-auto"
          style={{ gap: "30px", maxWidth: "1000px" }}
        >
          <FeatureCard src="/assets/group_28.svg" alt={t("features.video")} />
          <FeatureCard src="/assets/group_34.svg" alt={t("features.animation")} />
          <FeatureCard src="/assets/group_38.svg" alt={t("features.control")} />
          <FeatureCard src="/assets/group_43.svg" alt={t("features.create_code")} />
          <FeatureCard src="/assets/group_47.svg" alt={t("features.live_code")} />
          <FeatureCard src="/assets/group_51.svg" alt={t("features.quiz")} />
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="flex items-center justify-center">
      <Image
        src={src}
        alt={alt}
        width={0}
        height={0}
        sizes="100vw"
        className="w-full h-auto pointer-events-none select-none dark:invert dark:hue-rotate-180"
        style={{ maxWidth: "280px", width: "100%", height: "auto" }}
      />
    </div>
  );
}
