'use client';

import { useState } from 'react';
import BookingModal from '@/components/BookingModal';

type Props = {
  label: string;
  className?: string;
  productHint?: string;
};

export default function BookingButton({ label, className, productHint }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className ?? 'btn-primary'}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      <BookingModal
        open={open}
        onClose={() => setOpen(false)}
        productHint={productHint}
      />
    </>
  );
}
