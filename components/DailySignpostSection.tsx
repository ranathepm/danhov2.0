'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const TEACHINGS: { text: string; category: string }[] = [
  // Love
  { text: 'Love is the absence of judgment.', category: 'Love' },
  { text: 'Listening is love. When I listen fully, I am loving.', category: 'Love' },
  { text: 'Nature of love has no boundaries.', category: 'Love' },
  // Oneness
  { text: 'The wave never left the ocean. You are the wave. The universe is always alive — and so are you.', category: 'Oneness' },
  { text: 'We are already whole — wholly healing, perfect.', category: 'Oneness' },
  { text: 'E = mc². Nothing dies.', category: 'Oneness' },
  { text: 'You are here to enable the divine purpose of the universe to unfold.', category: 'Oneness' },
  // Peace & Silence
  { text: 'Silence breaks the violence.', category: 'Peace & Silence' },
  { text: 'Transform expectation to acceptance.', category: 'Peace & Silence' },
  { text: 'You must lose everything to see the light.', category: 'Peace & Silence' },
  { text: 'The biggest liar in the world is our fears.', category: 'Peace & Silence' },
  // Ego & Thinking
  { text: 'Become a creator, not just a creation.', category: 'The Ego & Thinking' },
  { text: 'Take thinking as a movie. Watch it — do not become it.', category: 'The Ego & Thinking' },
  { text: 'When you understand the self, you will know what God is.', category: 'The Ego & Thinking' },
  { text: 'From darkness and pain we got consciousness. Without pain we would not know what light is.', category: 'The Ego & Thinking' },
  // Forgiveness
  { text: 'It is not the person you need to detach from. It is the pain. Let go of the pain and you let go of the person.', category: 'Forgiveness & Letting Go' },
  { text: 'Forgiving every thought is peace and love.', category: 'Forgiveness & Letting Go' },
  { text: 'Every moment you spend with those you love is quality time — because you know nothing lasts forever.', category: 'Forgiveness & Letting Go' },
  // Life & Abundance
  { text: 'When you enter life, you are entering uncertainty. Love and be the form you are at this moment.', category: 'Life & Abundance' },
  { text: 'When you serve humans, wealth flows.', category: 'Life & Abundance' },
  { text: 'Life is so precious. It is so abundant.', category: 'Life & Abundance' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function DailySignpostSection() {
  const [teaching, setTeaching] = useState<{ text: string; category: string } | null>(null);
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((today.getTime() - start.getTime()) / 86400000);
    setTeaching(TEACHINGS[dayOfYear % TEACHINGS.length]);
    setDateStr(`${MONTHS[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`);
  }, []);

  return (
    <section className="signpost-section">
      <span className="signpost-label">Today&apos;s Signpost</span>
      {teaching && (
        <span className="signpost-category">{teaching.category}</span>
      )}
      <p className="signpost-quote">{teaching ? `"${teaching.text}"` : ' '}</p>
      <p className="signpost-attribution">— Jack Hovsepian, Founder</p>
      <p className="signpost-date">{dateStr}</p>
      <div className="signpost-ctas">
        <Link href="/ring-builder" className="signpost-cta signpost-cta--primary">
          Find Your Ring
        </Link>
        <Link href="/life-path" className="signpost-cta signpost-cta--secondary">
          Create Yours
        </Link>
      </div>
    </section>
  );
}
