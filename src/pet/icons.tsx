import type { ReactNode } from 'react';

/**
 * The pig page's own icons, drawn for it (no emoji): sticker-like objects with
 * a warm brown outline, flat fills and one highlight, like the props in his room.
 */
const INK = '#3B2216';
const HI = 'rgb(255 255 255 / 0.55)';

function Icon({ children, size, className = '' }: { children: ReactNode; size: number; className?: string }) {
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
      {children}
    </svg>
  );
}

const D: Record<string, ReactNode> = {
  carrot: (
    <>
      <path d="M30 9c-2 4-1 7 1 8M33 8c0 4 2 6 5 6M27 13c3 0 5 1 6 4" stroke="#3E7A3A" fill="none" strokeWidth={3} />
      <path d="M31.5 17.5c3 3 2.5 6.5-.5 10L14 42c-2.5 2-5-.5-3-3l13-18c3-3.5 6.5-4.5 7.5-3.5Z" fill="#F08A2C" />
      <path d="M20 29l3 2M17 34l2.5 1.5M24 24l2.5 2" strokeWidth={1.8} />
      <path d="M27 21c-3 3-6 7-8 10" stroke={HI} strokeWidth={2.6} />
    </>
  ),
  tub: (
    <>
      <circle cx="16" cy="12" r="3.5" fill="#BFE6FF" />
      <circle cx="24" cy="8" r="2.5" fill="#BFE6FF" />
      <circle cx="30" cy="14" r="3" fill="#BFE6FF" />
      <path d="M6 22h36v4c0 7-5 12-12 12H18C11 38 6 33 6 26v-4Z" fill="#F7F3EC" />
      <path d="M5 22h38" strokeWidth={3} />
      <path d="M13 38l-2 4M35 38l2 4" />
      <path d="M11 27c1 4 3 6 7 7" stroke="#9FCBE8" strokeWidth={2.4} />
    </>
  ),
  ball: (
    <>
      <circle cx="24" cy="25" r="15" fill="#E8C27A" />
      <path d="M10 22c8 2 20 2 28-1M12 32c8-3 18-3 25 1M24 10c-4 8-4 22 0 30" strokeWidth={2} />
      <path d="M15 17c2-3 5-4 8-5" stroke={HI} strokeWidth={2.8} />
    </>
  ),
  moon: (
    <>
      <path d="M31 8a16 16 0 1 0 9 26 13 13 0 0 1-9-26Z" fill="#F5D77A" />
      <path d="M36 11l1.5 3 3 1-3 1-1.5 3-1.5-3-3-1 3-1Z" fill="#FFF3C7" strokeWidth={1.6} />
      <path d="M14 21c1-4 3-7 7-9" stroke={HI} strokeWidth={2.6} />
    </>
  ),
  sun: (
    <>
      <circle cx="24" cy="24" r="9" fill="#FFC94A" />
      <path d="M24 6v5M24 37v5M6 24h5M37 24h5M11 11l3.5 3.5M33.5 33.5 37 37M37 11l-3.5 3.5M14.5 33.5 11 37" strokeWidth={3} stroke="#E99A1F" />
    </>
  ),
  stop: (
    <>
      <circle cx="24" cy="24" r="15" fill="#F2EDE6" />
      <path d="M18 18l12 12M30 18 18 30" strokeWidth={3} />
    </>
  ),
  bag: (
    <>
      <path d="M17 17v-3a7 7 0 0 1 14 0v3" />
      <path d="M10 17h28l-2 23H12Z" fill="#D9A066" />
      <circle cx="24" cy="29" r="4" fill="#FFC94A" strokeWidth={1.8} />
      <path d="M24 22v-1M24 37v-1M17 29h1M30 29h1M19 24l.7.7M28.3 33.3l.7.7M29 24l-.7.7M19.7 33.3 19 34" strokeWidth={1.8} stroke="#B9741E" />
    </>
  ),
  hanger: (
    <>
      <path d="M24 16v-2a4 4 0 1 1 4-4" />
      <path d="M24 16 6 30c-1.5 1.2-.7 3 1 3h34c1.7 0 2.5-1.8 1-3Z" fill="#C98C5A" />
      <path d="M12 30h24" stroke={HI} strokeWidth={2} />
    </>
  ),
  polaroid: (
    <>
      <rect x="9" y="8" width="30" height="34" rx="2" fill="#FFFBF3" transform="rotate(-6 24 25)" />
      <rect x="13" y="12" width="22" height="20" fill="#9CC8E8" transform="rotate(-6 24 25)" strokeWidth={1.8} />
      <path d="M14 30l6-7 5 5 3-3 6 5" transform="rotate(-6 24 25)" stroke="#5E8A4E" fill="none" strokeWidth={2} />
      <circle cx="29" cy="17" r="2.2" fill="#FFD46B" strokeWidth={1.4} transform="rotate(-6 24 25)" />
    </>
  ),
  wheel: (
    <>
      <circle cx="24" cy="24" r="16" fill="#F7E6CF" />
      <path d="M24 8a16 16 0 0 1 13.9 8L24 24Z" fill="#F08A6C" strokeWidth={1.6} />
      <path d="M37.9 32A16 16 0 0 1 24 40V24Z" fill="#7CC4A4" strokeWidth={1.6} />
      <path d="M10.1 32A16 16 0 0 1 10.1 16L24 24Z" fill="#F5C94E" strokeWidth={1.6} />
      <circle cx="24" cy="24" r="3" fill={INK} />
      <path d="M24 3v6" strokeWidth={3} stroke="#C0392B" />
    </>
  ),
  clipboard: (
    <>
      <rect x="10" y="9" width="28" height="33" rx="3" fill="#E9C99A" />
      <rect x="18" y="6" width="12" height="6" rx="2" fill="#B3B8BE" />
      <path d="M16 22l3 3 6-6M16 33l3 3 6-6" stroke="#3E7A3A" strokeWidth={2.6} />
      <path d="M29 23h4M29 34h4" strokeWidth={2} />
    </>
  ),
  medal: (
    <>
      <path d="M16 6l5 13M32 6l-5 13" strokeWidth={5} stroke="#D9534F" />
      <path d="M16 6l5 13M32 6l-5 13" strokeWidth={1.4} stroke={INK} />
      <circle cx="24" cy="29" r="11" fill="#F2C46B" />
      <path d="M24 23l1.8 3.7 4 .5-3 2.8.8 4L24 32l-3.6 2 .8-4-3-2.8 4-.5Z" fill="#FFF0C2" strokeWidth={1.4} />
    </>
  ),
  map: (
    <>
      <path d="M7 12l11-4 12 4 11-4v28l-11 4-12-4-11 4Z" fill="#F3E2BF" />
      <path d="M18 8v28M30 12v28" strokeWidth={1.6} />
      <path d="M12 30c4-2 6-8 11-8s6 6 11 3" stroke="#D9534F" strokeDasharray="2 3" strokeWidth={2} />
      <path d="M33 21l3 3M36 21l-3 3" stroke="#D9534F" strokeWidth={2.2} />
    </>
  ),
  wand: (
    <>
      <path d="M10 39 29 20" strokeWidth={5} />
      <path d="M10 39 29 20" strokeWidth={2.4} stroke="#F7EBDD" />
      <path d="M33 6l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7Z" fill="#FFD46B" strokeWidth={1.8} />
      <path d="M17 13l1 2 2 1-2 1-1 2-1-2-2-1 2-1ZM38 30l1 2 2 1-2 1-1 2-1-2-2-1 2-1Z" fill="#FFF0C2" strokeWidth={1.2} />
    </>
  ),
  magnifier: (
    <>
      <path d="M31 31l9 9" strokeWidth={5} />
      <circle cx="21" cy="21" r="12" fill="#CFE9F7" />
      <path d="M14 17c1-3 4-5 7-5" stroke={HI} strokeWidth={2.6} />
      <path d="M17 24c1 2 3 3 5 3" strokeWidth={1.6} />
      <circle cx="18" cy="20" r="1.2" fill={INK} stroke="none" />
      <circle cx="24" cy="20" r="1.2" fill={INK} stroke="none" />
    </>
  ),
  sprout: (
    <>
      <path d="M24 26v-8" stroke="#3E7A3A" strokeWidth={2.6} />
      <path d="M24 19c-2-6-8-8-12-6 1 5 6 8 12 6Z" fill="#8BC77A" strokeWidth={2} />
      <path d="M24 17c2-6 8-8 12-6-1 5-6 8-12 6Z" fill="#A8D88F" strokeWidth={2} />
      <path d="M13 26h22l-3 14H16Z" fill="#D9825B" />
      <path d="M12 26h24" strokeWidth={3} />
    </>
  ),
  speaker: (
    <>
      <path d="M8 19h7l9-7v24l-9-7H8Z" fill="#F2EDE6" />
      <path d="M30 18c2 2 2 10 0 12M35 14c4 4 4 16 0 20" />
    </>
  ),
  muted: (
    <>
      <path d="M8 19h7l9-7v24l-9-7H8Z" fill="#F2EDE6" />
      <path d="M31 19l9 10M40 19l-9 10" />
    </>
  ),
  mic: (
    <>
      <rect x="18" y="6" width="12" height="22" rx="6" fill="#F2EDE6" />
      <path d="M12 23c0 7 5 11 12 11s12-4 12-11M24 34v7M18 42h12" />
      <path d="M21 12v8" stroke={HI} strokeWidth={2.4} />
    </>
  ),
  camera: (
    <>
      <path d="M8 16h8l3-5h10l3 5h8v22H8Z" fill="#F2EDE6" />
      <circle cx="24" cy="26" r="7" fill="#7A9BB5" />
      <circle cx="22" cy="24" r="2" fill="#fff" stroke="none" />
      <circle cx="35" cy="21" r="1.4" fill="#E86A5A" stroke="none" />
    </>
  ),
  note: (
    <>
      <path d="M19 34V12l18-4v22" strokeWidth={2.6} />
      <ellipse cx="14.5" cy="34.5" rx="5.5" ry="4.5" fill="#F2EDE6" />
      <ellipse cx="32.5" cy="30.5" rx="5.5" ry="4.5" fill="#F2EDE6" />
    </>
  ),
  noteOff: (
    <>
      <path d="M19 34V12l18-4v22" strokeWidth={2.6} opacity={0.5} />
      <ellipse cx="14.5" cy="34.5" rx="5.5" ry="4.5" fill="#F2EDE6" opacity={0.6} />
      <ellipse cx="32.5" cy="30.5" rx="5.5" ry="4.5" fill="#F2EDE6" opacity={0.6} />
      <path d="M8 8l32 32" strokeWidth={3} />
    </>
  ),
  heart: (
    <>
      <path d="M24 40C10 31 6 24 6 18a9 9 0 0 1 18-3 9 9 0 0 1 18 3c0 6-4 13-18 22Z" fill="#F2667A" />
      <path d="M11 17c0-3 2-5 5-5" stroke={HI} strokeWidth={2.6} />
    </>
  ),
  bolt: (
    <>
      <path d="M27 5 11 27h11l-3 16 18-24H26Z" fill="#FFC94A" />
      <path d="M24 10l-6 9" stroke={HI} strokeWidth={2.4} />
    </>
  ),
  drop: (
    <>
      <path d="M24 6C17 16 12 22 12 29a12 12 0 0 0 24 0c0-7-5-13-12-23Z" fill="#6EC1F2" />
      <path d="M18 28c0 3 2 6 5 7" stroke={HI} strokeWidth={2.6} />
    </>
  ),
  cross: (
    <>
      <path d="M19 8h10v11h11v10H29v11H19V29H8V19h11Z" fill="#6FCB8B" />
      <path d="M22 12v8" stroke={HI} strokeWidth={2.4} />
    </>
  ),
  gift: (
    <>
      <rect x="8" y="18" width="32" height="22" rx="2" fill="#F2667A" />
      <rect x="6" y="13" width="36" height="7" rx="2" fill="#F58A99" />
      <path d="M24 13v27" strokeWidth={5} stroke="#FFD46B" />
      <path d="M24 13c-3-6-9-7-9-3s6 3 9 3c3 0 9 1 9-3s-6-3-9 3Z" fill="#FFD46B" strokeWidth={2} />
    </>
  ),
  cards: (
    <>
      <rect x="8" y="12" width="20" height="28" rx="3" fill="#F7EBDD" transform="rotate(-12 18 26)" />
      <rect x="20" y="9" width="20" height="28" rx="3" fill="#FFFBF3" transform="rotate(8 30 23)" />
      <path d="M30 19c-2-2-6 1 0 6 6-5 2-8 0-6Z" fill="#E5577A" strokeWidth={1.6} transform="rotate(8 30 23)" />
      <path d="M13 22l4 4 4-4-4-4Z" fill="#3F8FD0" strokeWidth={1.4} transform="rotate(-12 18 26)" />
    </>
  ),
  box: (
    <>
      <path d="M8 18l16-7 16 7v18l-16 7-16-7Z" fill="#D9A066" />
      <path d="M8 18l16 7 16-7M24 25v18" />
      <path d="M16 14.5 32 21.5" strokeWidth={1.8} />
      <circle cx="31" cy="31" r="3" fill="#3B2216" stroke="none" />
      <path d="M28 27c1-1 2-1 3 0M33 27c1-1 2-1 3 0" strokeWidth={1.4} />
    </>
  ),
  xylophone: (
    <>
      <path d="M8 16l32 -4M8 36l32 4" strokeWidth={2} />
      {['#E5577A', '#F29A3C', '#F5C94E', '#6BB36B', '#3F8FD0'].map((c, i) => (
        <rect key={c} x={10 + i * 6} y={14 - i * 0.6} width="5" height={24 + i * 1.2} rx="2" fill={c} strokeWidth={1.4} />
      ))}
      <path d="M30 4l-6 10" strokeWidth={2} />
      <circle cx="31" cy="3.5" r="2.5" fill="#F7EBDD" strokeWidth={1.4} />
    </>
  ),
  gear: (
    <>
      <path
        d="M24 6l3 5 6-1 1 6 5 3-3 5 3 5-5 3-1 6-6-1-3 5-3-5-6 1-1-6-5-3 3-5-3-5 5-3 1-6 6 1Z"
        fill="#E9D6C2"
      />
      <circle cx="24" cy="24" r="6" fill="#B9A08A" />
    </>
  ),
  soap: (
    <>
      <circle cx="13" cy="12" r="4" fill="#DDF2FF" strokeWidth={1.6} />
      <circle cx="22" cy="8" r="2.6" fill="#DDF2FF" strokeWidth={1.4} />
      <rect x="8" y="20" width="32" height="20" rx="9" fill="#F7B6C8" />
      <path d="M14 26c4-2 10-2 14 0" stroke={HI} strokeWidth={2.4} />
    </>
  ),
  lamp: (
    <>
      <path d="M14 8h20l6 18H8Z" fill="#FFE3A3" />
      <path d="M24 26v12M15 40h18" strokeWidth={3} />
      <path d="M17 13h6" stroke={HI} strokeWidth={2.4} />
    </>
  ),
  plus: (
    <>
      <circle cx="24" cy="24" r="16" fill="#F7EBDD" />
      <path d="M24 16v16M16 24h16" strokeWidth={3.2} />
    </>
  ),
  smile: (
    <>
      <circle cx="24" cy="24" r="17" fill="#FFD66B" />
      <circle cx="18" cy="21" r="2.4" fill={INK} stroke="none" />
      <circle cx="30" cy="21" r="2.4" fill={INK} stroke="none" />
      <path d="M16 28c4 6 12 6 16 0" strokeWidth={2.6} />
    </>
  ),
  meh: (
    <>
      <circle cx="24" cy="24" r="17" fill="#F5C66B" />
      <circle cx="18" cy="21" r="2.4" fill={INK} stroke="none" />
      <circle cx="30" cy="21" r="2.4" fill={INK} stroke="none" />
      <path d="M17 30h14" strokeWidth={2.6} />
    </>
  ),
  frown: (
    <>
      <circle cx="24" cy="24" r="17" fill="#F2A57A" />
      <circle cx="18" cy="21" r="2.4" fill={INK} stroke="none" />
      <circle cx="30" cy="21" r="2.4" fill={INK} stroke="none" />
      <path d="M16 32c4-5 12-5 16 0" strokeWidth={2.6} />
    </>
  ),
  glass: (
    <>
      <path d="M13 8h22l-3 32H16Z" fill="rgb(220 240 255 / 0.5)" />
      <path d="M14.3 20h19.4l-2 20H16.2Z" fill="#6EC1F2" strokeWidth={0} />
      <path d="M13 8h22l-3 32H16Z" />
      <path d="M17 12l1.5 22" stroke={HI} strokeWidth={2.4} />
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
};

export type IconName = keyof typeof D;

export function PetIcon({ name, size = 28, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <Icon size={size} className={className}>
      {D[name]}
    </Icon>
  );
}

/** A round potion flask with a cork, the potion's color sloshing inside and a few bubbles. */
export function PotionBottle({ color, size = 40, className = '' }: { color: string; size?: number; className?: string }) {
  const id = `pb${color.slice(1)}`;
  return (
    <svg viewBox="0 0 40 48" width={size} height={size * 1.2} className={className} aria-hidden>
      <defs>
        <clipPath id={id}>
          <circle cx="20" cy="31" r="13" />
        </clipPath>
      </defs>
      <rect x="15" y="9" width="10" height="11" rx="2" fill="#EAF6FB" stroke={INK} strokeWidth="2" />
      <circle cx="20" cy="31" r="13" fill="#EAF6FB" />
      <g clipPath={`url(#${id})`}>
        <path className="potion-slosh" d="M2 28 Q11 24 20 28 T38 28 V48 H2 Z" fill={color} />
        <circle cx="15" cy="36" r="1.8" fill="#fff" opacity="0.7" />
        <circle cx="23" cy="40" r="1.2" fill="#fff" opacity="0.6" />
        <circle cx="26" cy="33" r="1" fill="#fff" opacity="0.6" />
      </g>
      <circle cx="20" cy="31" r="13" fill="none" stroke={INK} strokeWidth="2" />
      <path d="M12 26 Q13 21 18 20" stroke={HI} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <rect x="14" y="4" width="12" height="7" rx="2" fill="#B9773F" stroke={INK} strokeWidth="2" />
    </svg>
  );
}
