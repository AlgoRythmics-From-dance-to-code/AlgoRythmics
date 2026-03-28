import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLocale } from '../../i18n/LocaleProvider';
import { VIDEOS } from '../../../lib/constants';

export default function VideosPage() {
  const { t } = useLocale();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const filtered =
    activeFilter === 'all' ? VIDEOS : VIDEOS.filter((v) => v.categoryId === activeFilter);

  return (
    <div className="w-full bg-white dark:bg-[#0a0a0a]">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-6 py-14 md:py-20 bg-[#F0FBF9] dark:bg-[#112220]">
        <h1 className="font-montserrat font-bold text-black dark:text-white text-3xl sm:text-4xl lg:text-5xl mb-4 text-center">
          {t('videos.hero_title')}
        </h1>
        <p className="font-montserrat text-center text-base sm:text-lg text-[#666] dark:text-gray-400">
          {t('videos.hero_description')}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-3 sm:gap-4 justify-center px-4 py-8">
        {['all', 'sorting', 'searching'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`font-montserrat font-bold transition-all capitalize px-5 sm:px-8 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base cursor-pointer border ${
              activeFilter === filter
                ? 'bg-[#269984] text-white border-[#269984]'
                : 'bg-white dark:bg-[#1a1a1a] text-[#666] dark:text-gray-400 border-[#E0E0E0] dark:border-neutral-700 hover:border-[#269984] dark:hover:border-[#269984]'
            }`}
          >
            {t(`videos.filters.${filter}`)}
          </button>
        ))}
      </div>

      {/* Video Grid */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filtered.map((video) => {
            const title = t(`videos.list.${video.id}`);
            const categoryLabel = t(`videos.filters.${video.categoryId}`);

            return (
              <Link
                key={video.id}
                href={`/videos/${video.id}`}
                className="group rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border border-[#F0F0F0] dark:border-gray-800 bg-white dark:bg-[#1a1a1a]"
              >
                {/* Thumbnail */}
                <div className="relative bg-[#F8F8F8] dark:bg-[#0f0f0f] aspect-[4/3] flex items-center justify-center">
                  <Image
                    src={`/assets/${video.thumbnail}`}
                    alt={title}
                    width={280}
                    height={280}
                    className="w-3/4 max-w-[280px] h-auto object-contain dark:opacity-80"
                    style={{ width: 'auto', height: 'auto' }}
                  />
                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-all">
                    <div className="flex items-center justify-center rounded-full bg-white/90 group-hover:bg-white shadow-lg transition-all group-hover:scale-110 w-14 h-14 sm:w-16 sm:h-16">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#269984">
                        <polygon points="5,3 19,12 5,21" />
                      </svg>
                    </div>
                  </div>
                  {/* Duration */}
                  <div
                    className="absolute bottom-3 right-3 font-montserrat font-bold text-white text-xs px-2.5 py-1 rounded"
                    style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
                  >
                    {video.duration}
                  </div>
                </div>
                {/* Info */}
                <div className="p-4 sm:p-5">
                  <h3 className="font-montserrat font-bold text-base sm:text-lg text-black dark:text-white mb-2">
                    {title}
                  </h3>
                  <div className="flex items-center justify-between">
                    <span className="font-montserrat text-xs sm:text-sm text-[#999] dark:text-gray-500">
                      {video.views} {t('videos.views')}
                    </span>
                    <span className="font-montserrat font-bold text-xs px-3 py-1 rounded-full bg-[#F0FBF9] dark:bg-[#112220] text-[#269984]">
                      {categoryLabel}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
