'use client';

import { useEffect, useState } from 'react';

const TEACHINGS = [
  'Light enters from the cracks of the darkness.',
  'There is no darkness — only an absence of light.',
  'The pain I feel reminds me that I am breathing.',
  'We are exactly where we need to be.',
  'Love is complete acceptance with no judgment.',
  'We are already whole.',
  'Marriage is one of the best practices of love.',
  'Be the watcher.',
  'There is nothing to know — knowing is ego.',
  'The present moment is all there is.',
  'Self love is the foundation of all love.',
  'Waves are the ocean.',
  'Silence breaks the violence.',
  'In silence, I realized the oneness of the universe. The Swirl Love Ring was messaged.',
  'Self love.',
  'You are never alone.',
  'If you feel alone — it means you are not in good company with yourself.',
  'The way out is to go in.',
  'The longest journey of a human is only 12 inches — from the mind to the heart.',
  'Presence is a present.',
  'Time is life, not money.',
  'Being never created wars — but doers do.',
  'The mind does not exist in now.',
  'Mindlessness — not mindfulness.',
  'You are the universe.',
  'The rest are illusion.',
  'We do not create. Creation has already been done. Some of us see it — in silence.',
  'Just accept the flow — no force.',
  'You can see your own design in silence. We can make it.',
  'There is no death. It is an illusion — and a fear.',
  'You attract what you are.',
  'Loneliness is a beggar.',
  'We are not separate. There is no emptiness between us.',
  'We were not created to work. We were created to be.',
  'Guru: gu means darkness, ru means light. We are all gurus.',
  'A candle lit in a dark room does not fight the darkness. It simply makes us see.',
  'The diamond was created in the dark. Now it sparkles.',
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function DailySignpostSection() {
  const [quote, setQuote] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((today.getTime() - start.getTime()) / 86400000);
    setQuote(TEACHINGS[dayOfYear % TEACHINGS.length]);
    setDateStr(`${MONTHS[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`);
  }, []);

  return (
    <section className="signpost-section">
      <span className="signpost-label">Today&apos;s Signpost</span>
      <p className="signpost-quote">{quote ? `“${quote}”` : ' '}</p>
      <p className="signpost-date">{dateStr}</p>
    </section>
  );
}
