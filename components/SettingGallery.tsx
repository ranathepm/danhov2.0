'use client';

import { useState } from 'react';
import Image from 'next/image';

type Props = {
  images: string[];
  name: string;
};

export default function SettingGallery({ images, name }: Props) {
  const thumbs = images.slice(0, 4);
  const hero = thumbs[0];
  const [active, setActive] = useState(0);

  if (!hero) {
    return (
      <div className="sd-gallery">
        <div className="sd-main-img">
          <div className="sd-img-placeholder">
            <svg viewBox="0 0 80 80" fill="none" aria-hidden="true">
              <circle cx="40" cy="40" r="28" stroke="#c9b8ad" strokeWidth="1" />
              <circle cx="40" cy="40" r="16" stroke="#c9b8ad" strokeWidth="0.6" />
              <circle cx="40" cy="12" r="4" fill="#c9b8ad" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  const shown = thumbs[active] ?? hero;

  return (
    <div className="sd-gallery">
      <div className="sd-main-img">
        <Image
          src={shown}
          alt={name}
          fill
          sizes="(max-width: 880px) 100vw, 580px"
          style={{ objectFit: 'contain' }}
          priority
          draggable={false}
        />
      </div>

      {thumbs.length > 1 && (
        <div className="sd-thumbs">
          {thumbs.map((src, idx) => (
            <button
              key={src}
              type="button"
              className={`sd-thumb${active === idx ? ' is-active' : ''}`}
              onClick={() => setActive(idx)}
              aria-label={idx === 0 ? `View ${name} — main photo` : `View ${name} — angle ${idx + 1}`}
              aria-pressed={active === idx}
            >
              <Image src={src} alt="" fill sizes="140px" style={{ objectFit: 'contain' }} loading="lazy" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
