import type { ReactNode } from 'react';
import { PetIcon } from '../icons';

/** The arcade's game icons, in the pet page's sticker style (brown outline, flat fill, one highlight). */
const INK = '#3B2216';
const HI = 'rgb(255 255 255 / 0.6)';

const D: Record<string, ReactNode> = {
  quiz: (
    <>
      <path d="M10 12a5 5 0 0 1 5-5h18a5 5 0 0 1 5 5v15a5 5 0 0 1-5 5H22l-8 7v-7a5 5 0 0 1-4-5Z" fill="#FF8FA8" />
      <path d="M20 15.5c0-2.5 2-4 4.3-4 2.4 0 4.2 1.6 4.2 3.7 0 3.3-4.3 3.4-4.3 6.3" strokeWidth={3} stroke="#fff" />
      <circle cx="24.2" cy="26" r="1.8" fill="#fff" stroke="none" />
      <path d="M13 13c0-2 1-3 3-3" stroke={HI} />
    </>
  ),
  brush: (
    <>
      <path d="M33 6l9 9-15 15-9-9Z" fill="#F6C455" />
      <path d="M29 10l9 9" />
      <path d="M18 21l9 9c-2 6-7 10-14 11-3 0-5-1-6-2 4-1 5-4 5-7 0-6 2-9 6-11Z" fill="#E8577A" />
      <path d="M11 37c1-2 1-4 1-6" stroke={HI} />
    </>
  ),
  puzzle: (
    <>
      <path d="M9 9h12a4 4 0 1 1 6 0h12v12a4 4 0 1 0 0 6v12H27a4 4 0 1 0-6 0H9V27a4 4 0 1 1 0-6Z" fill="#8FD06A" />
      <path d="M24 9v30M9 24h30" strokeWidth={1.8} strokeDasharray="2 3" />
      <path d="M12 13c0-1.5 1-2 2.5-2" stroke={HI} />
    </>
  ),
  letters: (
    <>
      <rect x="6" y="14" width="16" height="18" rx="3.5" fill="#FFD3B0" transform="rotate(-8 14 23)" />
      <rect x="26" y="14" width="16" height="18" rx="3.5" fill="#FFE9B8" transform="rotate(7 34 23)" />
      <path d="M10 19h8M14 19v9M11 28h7" transform="rotate(-8 14 23)" strokeWidth={2.6} />
      <path d="M30 19h7v9M30 28" transform="rotate(7 34 23)" strokeWidth={2.6} />
      <path d="M18 38c3 2 9 2 12 0" />
    </>
  ),
  rocket: (
    <>
      <path d="M24 5c8 6 10 15 7 25H17c-3-10-1-19 7-25Z" fill="#F2EEF8" />
      <path d="M17 30l-6 6 1-9 5-3M31 30l6 6-1-9-5-3" fill="#E25A7A" />
      <circle cx="24" cy="17" r="4.5" fill="#7EC8F2" />
      <path d="M20 30c0 5 2 9 4 12 2-3 4-7 4-12" fill="#FFB347" />
      <path d="M20 9c-2 3-3 7-3 11" stroke={HI} />
    </>
  ),
  wing: (
    <>
      <path d="M8 30c4-10 13-17 26-19-3 4-4 7-3 9 3-1 6-1 9 1-4 3-6 5-6 8 2 0 4 1 5 3-9 6-23 6-31-2Z" fill="#A9DDF7" />
      <path d="M15 28c6-3 11-7 15-12M19 33c6-2 11-5 15-9" strokeWidth={1.8} />
      <path d="M12 28c2-4 5-8 9-11" stroke={HI} />
    </>
  ),
  shoe: (
    <>
      <path d="M7 31c0-6 1-12 3-17 5 1 8 3 10 7 4 2 9 3 14 3 5 0 8 3 8 7v3H7Z" fill="#FF8A6B" />
      <path d="M7 34h35v4H7Z" fill="#fff" />
      <path d="M17 21l3-3M20 24l3-3M23 26l3-3" strokeWidth={1.8} />
      <path d="M10 17c0 4 0 8-1 11" stroke={HI} />
      <path d="M3 22h5M2 27h4" strokeWidth={2} />
    </>
  ),
  knife: (
    <>
      <path d="M8 38l18-18 4 4-18 18c-2 1-4-2-4-4Z" fill="#D8DEE6" />
      <path d="M26 20l6-6c2-2 4-2 6 0s2 4 0 6l-6 6Z" fill="#B5784A" />
      <circle cx="33" cy="20" r="1" fill={INK} />
      <path d="M12 35l12-12" stroke={HI} />
      <path d="M38 34c2 2 2 5 0 7-2-1-3-3-3-5" fill="#FF5E6E" />
    </>
  ),
  bricks: (
    <>
      <rect x="6" y="8" width="16" height="8" rx="2" fill="#F9A8C6" />
      <rect x="26" y="8" width="16" height="8" rx="2" fill="#FFD3B0" />
      <rect x="14" y="19" width="16" height="8" rx="2" fill="#BFE3FF" />
      <rect x="14" y="38" width="20" height="4" rx="2" fill="#E25A7A" />
      <circle cx="26" cy="32" r="3" fill="#FFE08A" />
    </>
  ),
  moon: (
    <>
      <path d="M30 7a17 17 0 1 0 11 27A14 14 0 0 1 30 7Z" fill="#FFE08A" />
      <circle cx="20" cy="20" r="2.5" fill="#F0C75C" stroke="none" />
      <circle cx="16" cy="30" r="1.8" fill="#F0C75C" stroke="none" />
      <path d="M13 15c2-3 5-5 8-6" stroke={HI} />
      <path d="M38 12l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5Z" fill="#fff" strokeWidth={1.4} />
    </>
  ),
  balloon: (
    <>
      <path d="M24 6c8 0 13 6 13 13 0 8-7 14-13 15-6-1-13-7-13-15 0-7 5-13 13-13Z" fill="#FF8FB0" />
      <path d="M22 34h4l-2 3Z" fill="#FF8FB0" />
      <path d="M24 37c-3 3 3 5 0 8" strokeWidth={1.8} />
      <path d="M17 13c1-2 3-3 5-3" stroke={HI} strokeWidth={3} />
    </>
  ),
  piano: (
    <>
      <rect x="6" y="11" width="36" height="27" rx="3" fill="#FFFDF7" />
      <path d="M15 11v27M24 11v27M33 11v27" strokeWidth={1.8} />
      <rect x="12" y="11" width="5" height="15" rx="1" fill={INK} />
      <rect x="21" y="11" width="5" height="15" rx="1" fill={INK} />
      <rect x="30" y="11" width="5" height="15" rx="1" fill={INK} />
    </>
  ),
  train: (
    <>
      <rect x="6" y="18" width="14" height="13" rx="4" fill="#BDE8B0" />
      <rect x="22" y="14" width="20" height="17" rx="5" fill="#E8B48A" />
      <circle cx="30" cy="21" r="1.6" fill={INK} stroke="none" />
      <circle cx="37" cy="21" r="1.6" fill={INK} stroke="none" />
      <path d="M31 26c1.5 1 3.5 1 5 0" strokeWidth={1.8} />
      <circle cx="11" cy="34" r="3" fill="#fff" />
      <circle cx="27" cy="34" r="3" fill="#fff" />
      <circle cx="37" cy="34" r="3" fill="#fff" />
      <path d="M20 25h2" />
    </>
  ),
  basket: (
    <>
      <path d="M8 22h32l-4 17H12Z" fill="#D9A15F" />
      <path d="M14 22c0-8 4-13 10-13s10 5 10 13" />
      <path d="M12 28h24M13 33h22" strokeWidth={1.8} />
      <circle cx="20" cy="19" r="4" fill="#EE4A5A" />
      <path d="M27 20l3-7 3 7" fill="#F08A2C" />
    </>
  ),
  cake: (
    <>
      <rect x="9" y="30" width="30" height="9" rx="2.5" fill="#F7B9C8" />
      <rect x="12" y="21" width="24" height="9" rx="2.5" fill="#FFE08A" />
      <rect x="15" y="12" width="18" height="9" rx="2.5" fill="#BFE3FF" />
      <path d="M24 12V7" />
      <path d="M24 3c2 2 2 3 0 4-2-1-2-2 0-4Z" fill="#FFB347" />
      <path d="M13 33c4 2 8-2 12 0s8 2 11 0" strokeWidth={1.8} stroke="#fff" />
    </>
  ),
  grid: (
    <>
      <rect x="7" y="7" width="34" height="34" rx="6" fill="#E9D3B0" />
      <rect x="11" y="11" width="12" height="12" rx="3" fill="#8FD06A" />
      <rect x="25" y="11" width="12" height="12" rx="3" fill="#F08A2C" />
      <rect x="11" y="25" width="12" height="12" rx="3" fill="#FFF6EC" />
      <rect x="25" y="25" width="12" height="12" rx="3" fill="#EE4A5A" />
      <path d="M28 31h6M31 28v6" stroke="#fff" strokeWidth={2.4} />
    </>
  ),
  tubes: (
    <>
      <path d="M9 8h9v27a4.5 4.5 0 0 1-9 0Z" fill="#fff" />
      <path d="M9 22h9v13a4.5 4.5 0 0 1-9 0Z" fill="#7EC8F2" />
      <path d="M20 8h9v27a4.5 4.5 0 0 1-9 0Z" fill="#fff" />
      <path d="M20 16h9v19a4.5 4.5 0 0 1-9 0Z" fill="#FF8FA8" />
      <path d="M31 8h9v27a4.5 4.5 0 0 1-9 0Z" fill="#fff" />
      <path d="M31 27h9v8a4.5 4.5 0 0 1-9 0Z" fill="#8FD06A" />
      <path d="M7 8h13M18 8h13M29 8h13" strokeWidth={2.6} />
    </>
  ),
  discs: (
    <>
      <rect x="6" y="8" width="36" height="32" rx="5" fill="#5A8BD6" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2].map((c) => (
          <circle
            key={`${r}${c}`}
            cx={14 + c * 10}
            cy={16 + r * 9}
            r="3.6"
            fill={(r + c) % 3 === 0 ? '#FF5E6E' : (r * c) % 2 ? '#FFD45C' : '#EAF2FF'}
            strokeWidth={1.6}
          />
        )),
      )}
    </>
  ),
  glass: (
    <>
      <circle cx="20" cy="20" r="12" fill="#D7E7FF" />
      <path d="M29 29l11 11" strokeWidth={5} />
      <path d="M29 29l11 11" strokeWidth={2.4} stroke="#B5784A" />
      <path d="M13 17c1-3 3-5 6-6" stroke={HI} strokeWidth={3} />
      <circle cx="20" cy="22" r="4" fill="#E8B48A" />
    </>
  ),
};

/** A game's icon: the arcade's own, or one of the pet page's for the classic games. */
export function ArcadeIcon({ name, size = 44, className = '' }: { name: string; size?: number; className?: string }) {
  if (name === 'cards' || name === 'box' || name === 'xylophone') return <PetIcon name={name} size={size} className={className} />;
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke={INK}
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {D[name] ?? D.quiz}
    </svg>
  );
}
