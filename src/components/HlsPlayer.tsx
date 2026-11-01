'use client';

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export default function HlsPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: Hls;

    if (Hls.isSupported()) {
      hls = new Hls({
        maxBufferLength: 10, // Keep buffer small for live streams
      });
      hls.loadSource(src);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native support (Safari/iOS)
      video.src = src;
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        controls={false}
        className="w-full h-full object-contain"
      />
      <div className="absolute top-4 left-4 bg-red-600 px-2 py-1 rounded text-xs text-white font-bold animate-pulse">
        ● LIVE (Free Tier)
      </div>
    </div>
  );
}