'use client';

import React, { use, useEffect } from 'react';
import { useLocale } from '../../../i18n/LocaleProvider';
import { VIDEOS } from '../../../../lib/constants';
import LearningLayout from '../../../components/Learning/LearningLayout';
import VideoPlayer from '../../../components/Learning/VideoPlayer';
import { useRouter } from 'next/navigation';

export default function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { t } = useLocale();
  const router = useRouter();

  const video = VIDEOS.find((v) => v.id === id);

  useEffect(() => {
    if (!video) {
      router.replace('/videos');
    }
  }, [video, router]);

  if (!video) {
    return null;
  }

  const title = t(`videos.list.${video.id}`);
  const categoryLabel = t(`videos.filters.${video.categoryId}`);

  // Try to find if there's an algorithm description we can reuse
  const algoBaseId = video.id
    .replace('-dance', '')
    .replace('-folk', '')
    .replace('-waltz', '')
    .replace('-tango', '')
    .replace('-salsa', '')
    .replace('-ballet', '')
    .replace('-flamenco', '')
    .replace('-hip-hop', '')
    .replace('-swing', '');

  const description =
    t(`algorithms.list.${algoBaseId}.description`) || t('videos.hero_description');

  return (
    <LearningLayout
      title={title}
      subtitle={description}
      backHref="/videos"
      backLabel={t('videos.hero_title')}
      categoryName={categoryLabel}
      categoryIcon={video.categoryId === 'sorting' ? '📊' : '🔍'}
    >
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
        <VideoPlayer youtubeId={video.youtubeId} title={title} />

        {/* Additional Info Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-5">
          <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800">
            <h4 className="font-montserrat font-bold text-sm text-[#999] dark:text-gray-500 uppercase tracking-widest mb-3">
              {t('courses.table.duration')}
            </h4>
            <p className="font-montserrat font-bold text-2xl text-black dark:text-white">
              {video.duration}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#1a1a1a] border border-gray-100 dark:border-gray-800">
            <h4 className="font-montserrat font-bold text-sm text-[#999] dark:text-gray-500 uppercase tracking-widest mb-3">
              {t('videos.views')}
            </h4>
            <p className="font-montserrat font-bold text-2xl text-black dark:text-white">
              {video.views}
            </p>
          </div>
        </div>

        {/* Learning steps from i18n can be added here too */}
        <div className="mt-12 p-8 rounded-3xl bg-[#F0FBF9] dark:bg-[#112220] border border-[#269984]/20">
          <h3 className="font-montserrat font-bold text-xl text-black dark:text-white mb-4">
            {t('about.how_it_works')}
          </h3>
          <p className="font-montserrat text-black/70 dark:text-white/70 leading-relaxed mb-6">
            {t('about.mission_text1')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {['01', '02', '03', '04'].map((num) => (
              <div key={num} className="flex gap-4">
                <span className="font-montserrat font-bold text-[#269984] opacity-50 text-2xl">
                  {num}
                </span>
                <div>
                  <h5 className="font-montserrat font-bold text-black dark:text-white text-sm mb-1">
                    {t(`about.steps.${num}.title`)}
                  </h5>
                  <p className="font-montserrat text-xs text-[#666] dark:text-gray-400">
                    {t(`about.steps.${num}.desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </LearningLayout>
  );
}
