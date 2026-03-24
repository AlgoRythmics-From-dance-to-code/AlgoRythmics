'use client';

import Image from 'next/image';

export default function BottomBanner() {
  return (
    <section className="w-full overflow-hidden bg-white dark:bg-[#0a0a0a]">
      <div
        className="mx-auto px-6 py-6 md:py-10 flex items-center justify-center"
        style={{ maxWidth: '1400px' }}
      >
        <Image
          src="/assets/illustration_no_bg.png"
          alt="AlgoRythmics illustration"
          width={2866}
          height={1080}
          sizes="(max-width: 768px) 100vw, 1100px"
          className="w-full h-auto object-contain pointer-events-none select-none dark:invert dark:hue-rotate-180"
          style={{ maxWidth: '1100px', width: '100%', height: 'auto' }}
        />
      </div>
    </section>
  );
}
