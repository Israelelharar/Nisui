import type { ReactNode } from 'react';

/** Paper card with a washi-tape strip: the diary's basic surface. */
export function Paper({ children, className = '', tape = true, tilt = '-rotate-[0.6deg]' }: { children: ReactNode; className?: string; tape?: boolean; tilt?: string }) {
  return (
    <div className={`relative rounded-[14px] bg-paper shadow-paper ${tilt} ${className}`}>
      {tape && <span aria-hidden className="absolute -top-[11px] left-1/2 -ml-[46px] h-[22px] w-[92px] -rotate-3 rounded-[2px] bg-soft/90" />}
      {children}
    </div>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between">
      <h2 className="font-serif text-[21px] font-medium">{children}</h2>
      {aside}
    </div>
  );
}

export const tintClass = {
  peach: 'bg-peach',
  sky: 'bg-sky',
  butter: 'bg-butter',
  soft: 'bg-soft',
} as const;
