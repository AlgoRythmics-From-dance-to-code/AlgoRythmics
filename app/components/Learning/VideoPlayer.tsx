'use client';

import React, { useState } from 'react';

interface VideoPlayerProps {
  youtubeId: string;
  title?: string;
}

export default function VideoPlayer({ youtubeId, title }: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);

  // If youtubeId is a placeholder, show a message instead of a broken iframe
  const isPlaceholder = youtubeId.startsWith('placeholder_');

  return (
    <div className="w-full max-w-[1000px] mx-auto overflow-hidden rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 bg-black aspect-video relative group">
      {isPlaceholder ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-neutral-900 p-8 text-center">
          <div className="w-16 h-16 mb-4 rounded-full bg-[#269984] flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </div>
          <h3 className="font-montserrat font-bold text-xl mb-2">Video Placeholder</h3>
          <p className="font-montserrat text-gray-400 text-sm max-w-md">
            The YouTube video for{' '}
            <span className="text-[#269984] font-bold">{title || 'this algorithm'}</span> is not yet
            linked. Once the URL is added to the constants, it will appear here.
          </p>
          <div className="mt-4 text-xs text-[#269984] font-mono p-2 bg-black/30 rounded">
            ID: {youtubeId}
          </div>
        </div>
      ) : (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
              <div className="w-10 h-10 border-4 border-[#269984] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
          <iframe
            src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0&modestbranding=1`}
            title={title || 'Algorithm Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
            onLoad={() => setIsLoading(false)}
          ></iframe>
        </>
      )}
    </div>
  );
}
