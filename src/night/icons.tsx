import type { ReactElement } from 'react';

/**
 * Hand-drawn night icons, one family: a warm cream ink line over soft fills in
 * the night palette (gold, rose, sky). Used on the night shelf and in the sound
 * picker. No emoji.
 */
const INK = '#F6E9DA';

export type NightIconName = 'road' | 'sounds' | 'goals' | 'sheep' | 'farm' | 'note' | 'drive' | 'sea' | 'rain' | 'fire' | 'crickets' | 'heart';

const s = { stroke: INK, strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const paths: Record<NightIconName, ReactElement> = {
  road: (
    <>
      <path d="M18 58L26 6h12l8 52z" fill="#4B4D57" {...s} />
      <path d="M32 12v6M32 26v6M32 40v6" {...s} stroke="#F2C27A" />
      <path d="M8 40h48" {...s} stroke="#F6E9DA" strokeDasharray="4 4" opacity=".7" />
      <path d="M46 20s-7-4-7-9a3.5 3.5 0 0 1 7-2 3.5 3.5 0 0 1 7 2c0 5-7 9-7 9z" fill="#F29AB0" {...s} strokeWidth={1.8} />
      <circle cx="16" cy="30" r="5" fill="#C2385A" {...s} strokeWidth={1.8} />
    </>
  ),
  sounds: (
    <>
      <path d="M14 40c0-12 8-22 18-22s18 10 18 22" fill="#9DBBE3" fillOpacity=".25" {...s} />
      <rect x="9" y="36" width="10" height="16" rx="5" fill="#9DBBE3" {...s} />
      <rect x="45" y="36" width="10" height="16" rx="5" fill="#9DBBE3" {...s} />
      <path d="M26 30q3-3 6 0t6 0" {...s} strokeWidth={1.6} opacity=".8" />
    </>
  ),
  goals: (
    <>
      <path d="M16 10h28a4 4 0 0 1 4 4v38a4 4 0 0 1-4 4H16z" fill="#F2C27A" fillOpacity=".9" {...s} />
      <path d="M16 10v46" {...s} />
      <path d="M12 18h6M12 30h6M12 42h6" {...s} strokeWidth={1.8} />
      <path d="M24 22l3 3 6-7M24 36l3 3 6-7" {...s} stroke="#3A2228" />
      <path d="M36 24h6M36 38h6" {...s} stroke="#3A2228" strokeWidth={1.8} />
    </>
  ),
  sheep: (
    <>
      <path d="M14 36c-4-3-2-10 3-10 0-6 8-9 12-5 3-5 12-4 13 2 6-1 9 6 5 10 3 4-1 10-6 9-2 5-10 6-13 2-4 3-11 1-11-4-3 0-5-2-3-4z" fill="#F4EFE6" {...s} />
      <ellipse cx="49" cy="34" rx="6" ry="7.5" fill="#3B2A2E" {...s} />
      <path d="M44 29l-4-3M54 29l3-3" {...s} />
      <path d="M22 46v8M30 47v8M38 47v8" {...s} />
      <circle cx="47" cy="33" r="1" fill={INK} stroke="none" />
      <circle cx="51.5" cy="33" r="1" fill={INK} stroke="none" />
    </>
  ),
  farm: (
    <>
      <path d="M8 24h48M8 38h48" {...s} />
      <path d="M12 16v36M24 16v36M40 16v36M52 16v36" {...s} stroke="#D9A955" />
      <path d="M24 24l16 14M24 38l16-14" {...s} strokeWidth={1.8} opacity=".8" />
      <path d="M10 56q22-6 44 0" {...s} stroke="#8FBF7A" />
      <circle cx="32" cy="9" r="3" fill="#F2C27A" stroke="none" />
    </>
  ),
  note: (
    <>
      <rect x="8" y="16" width="48" height="34" rx="4" fill="#3A2A30" {...s} />
      <path d="M9 18l23 17 23-17" {...s} />
      <circle cx="32" cy="35" r="7" fill="#B8304F" stroke="none" />
      <path d="M34.5 31a4.4 4.4 0 1 0 0 8a3.5 3.5 0 1 1 0-8z" fill="#FFE3A8" />
    </>
  ),
  drive: (
    <>
      <path d="M10 40l4-12a5 5 0 0 1 5-3h26a5 5 0 0 1 5 3l4 12v8H10z" fill="#E07A5F" fillOpacity=".85" {...s} />
      <path d="M17 32h30" {...s} strokeWidth={1.6} />
      <circle cx="20" cy="48" r="5" fill="#2A1A1E" {...s} />
      <circle cx="44" cy="48" r="5" fill="#2A1A1E" {...s} />
      <path d="M50 18q4-4 8 0M52 13q6-6 12 0" {...s} strokeWidth={1.6} opacity=".7" />
    </>
  ),
  sea: (
    <>
      <path d="M6 28q6-8 13 0t13 0 13 0 13 0" {...s} stroke="#9DBBE3" />
      <path d="M6 40q6-8 13 0t13 0 13 0 13 0" {...s} stroke="#9DBBE3" opacity=".75" />
      <path d="M6 52q6-8 13 0t13 0 13 0 13 0" {...s} stroke="#9DBBE3" opacity=".5" />
      <circle cx="46" cy="14" r="5" fill="#F2C27A" stroke="none" />
    </>
  ),
  rain: (
    <>
      <path d="M16 30a10 10 0 0 1 4-19 13 13 0 0 1 24 4 8 8 0 0 1 2 15z" fill="#9DBBE3" fillOpacity=".35" {...s} />
      <path d="M20 38l-3 7M32 38l-3 7M44 38l-3 7M26 48l-3 7M38 48l-3 7" {...s} stroke="#9DBBE3" />
    </>
  ),
  fire: (
    <>
      <path d="M32 8c4 10 14 14 14 28a14 14 0 0 1-28 0c0-7 4-10 6-14 1 5 3 7 5 8 0-9 1-15 3-22z" fill="#F29A4A" fillOpacity=".85" {...s} />
      <path d="M32 50a6 6 0 0 1-6-6c0-4 3-6 4-9 2 3 8 5 8 9a6 6 0 0 1-6 6z" fill="#FFE3A8" stroke="none" />
      <path d="M14 56l36-6M14 50l36 6" {...s} stroke="#A0704A" />
    </>
  ),
  crickets: (
    <>
      <path d="M8 56q6-20 10-34M20 56q2-14 8-26M44 56q-2-16-8-30M54 56q-4-12-12-20" {...s} stroke="#8FBF7A" />
      <path d="M44 12a8 8 0 1 0 8 10 7 7 0 0 1-8-10z" fill="#F2C27A" stroke="none" />
      <circle cx="16" cy="12" r="1.4" fill={INK} stroke="none" />
      <circle cx="28" cy="7" r="1" fill={INK} stroke="none" />
    </>
  ),
  heart: (
    <>
      <path d="M32 52S10 39 10 24a11 11 0 0 1 22-3 11 11 0 0 1 22 3c0 15-22 28-22 28z" fill="#F29AB0" fillOpacity=".85" {...s} />
      <path d="M14 32h8l3-6 4 12 3-8 2 2h16" {...s} stroke="#3A2228" strokeWidth={1.8} />
    </>
  ),
};

export function NightIcon({ name, size = 44, className = '' }: { name: NightIconName; size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden className={className}>
      <g fill="none">{paths[name]}</g>
    </svg>
  );
}
