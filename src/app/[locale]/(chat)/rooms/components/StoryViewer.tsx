'use client';
import React, { useEffect, useState } from 'react';

export default function StoryViewer({ story, onClose }: { story: any, onClose: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          onClose();
          return 100;
        }
        return prev + 1; // 100 ticks × 100ms = 10 seconds total
      });
    }, 100);
    return () => clearInterval(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center">
      {/* Progress Bar */}
      <div className="absolute top-4 left-4 right-4 h-1 bg-white/30 rounded-full z-10">
        <div
          className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Header with author name */}
      <div className="absolute top-8 left-4 flex items-center gap-3 z-10">
        <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold text-xs">
          {story.authorName?.[0]?.toUpperCase() || '?'}
        </div>
        <p className="text-white font-bold text-sm">{story.authorName}</p>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-8 right-4 text-white text-3xl z-10 hover:scale-110 transition-transform"
        aria-label="Close story"
      >
        ✕
      </button>

      {/* Story image */}
      <img
        src={story.imageUrl}
        alt="Story"
        className="max-w-full max-h-[80vh] object-contain"
      />
    </div>
  );
}