"use client";

export default function BottomBanner() {
  return (
    <section
      className="w-full overflow-hidden"
    >
      <div
        className="mx-auto px-6 py-6 md:py-10 flex items-center justify-center"
        style={{ maxWidth: "1400px" }}
      >
        <img
          src="/assets/illustration_no_bg.png"
          alt="AlgoRythmics illustration"
          className="w-full h-auto object-contain pointer-events-none select-none dark:invert dark:hue-rotate-180"
          style={{ maxWidth: "1100px" }}
        />
      </div>
    </section>
  );
}
