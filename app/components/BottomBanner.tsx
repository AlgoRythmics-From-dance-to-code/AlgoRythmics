'use client';

import Image from 'next/image';

export default function BottomBanner() {
  return (
    <section className="w-full overflow-hidden bg-[#269984]">
      <div
        className="mx-auto px-2 py-2 md:py-2 flex items-center justify-center opacity-90"
        style={{ maxWidth: '1400px' }}
      >
        <Image
          src="/assets/illustration_no_bg.png"
          alt="AlgoRythmics visualization footer banner"
          width={2866}
          height={1080}
          sizes="(max-width: 768px) 100vw, 1100px"
          className="w-full h-auto object-contain pointer-events-none select-none brightness-0 invert"
          style={{ maxWidth: '1100px', width: '100%', height: 'auto' }}
        />
      </div>
    </section>
  );
}
