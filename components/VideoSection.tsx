'use client';

import { useRef, useState } from 'react';

export default function VideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  function handleClick() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  }

  return (
    <div className="video-wrapper">
      <video
        ref={videoRef}
        className="video-player"
        src="/danhov-video.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        onClick={handleClick}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />

      {!playing && (
        <button className="video-play-btn" aria-label="Play video" onClick={handleClick}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
        </button>
      )}


    </div>
  );
}
