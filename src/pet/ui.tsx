import type { CSSProperties, ReactNode } from 'react';
import { tap } from '../lib/haptics';
import { tick } from './sound';

/** Every press is felt and heard, a beat before the click lands. */
const press = () => {
  tap(6);
  tick();
};

/**
 * The pig page's own look (dark cocoa, glass and light): glass test tubes for
 * the stats, chunky 3D buttons, a cloud speech bubble and round glass icons.
 */

/** A glass tube filled with glowing liquid, a swirl inside, bubbles rising, and a score badge (0–10). */
export function GlassTube({ value, color, icon, label }: { value: number; color: string; icon: ReactNode; label: string }) {
  const v = Math.max(0, Math.min(100, value));
  const low = v < 30;
  const c = low ? '#FF5A6E' : color;
  return (
    <div className="flex flex-col items-center gap-1.5" title={`${label} ${Math.round(v)}%`}>
      <span className="leading-none drop-shadow-[0_2px_3px_rgb(0_0_0/0.3)]">{icon}</span>
      <div className="relative">
        <div className="relative h-[86px] w-[30px] overflow-hidden rounded-t-[7px] rounded-b-[16px] border border-white/35 bg-white/[0.07] shadow-[inset_0_0_10px_rgb(255_255_255/0.12)]">
          <div
            className="tube-liquid absolute inset-x-0 bottom-0 transition-[height] duration-1000 ease-out"
            style={{ height: `${Math.max(6, v)}%`, '--c': c, boxShadow: `0 0 16px ${c}` } as CSSProperties}
          >
            <span className="tube-swirl" />
            <span className="tube-bubble" style={{ left: '30%', animationDelay: '0s' }} />
            <span className="tube-bubble" style={{ left: '62%', animationDelay: '-1.2s' }} />
            <span className="tube-bubble" style={{ left: '45%', animationDelay: '-2.1s' }} />
          </div>
          {/* glass shine */}
          <span className="absolute top-1.5 bottom-3 left-[5px] w-[4px] rounded-full bg-white/45" />
          <span className="absolute top-2 right-[5px] h-4 w-[2px] rounded-full bg-white/25" />
        </div>
        <span
          className={`absolute -right-2 -bottom-1.5 flex size-[22px] items-center justify-center rounded-full border border-white/60 text-[12px] font-bold text-white ${low ? 'animate-pulse' : ''}`}
          style={{
            background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${c} 55%, #fff), ${c} 60%, color-mix(in srgb, ${c} 70%, #000))`,
            boxShadow: `0 0 10px ${c}`,
          }}
        >
          {Math.round(v / 10)}
        </span>
      </div>
      <span className={`text-[12px] font-bold ${low ? 'text-[#FF8C98]' : 'text-[#F3E3D0]/85'}`}>{label}</span>
    </div>
  );
}

const TONES = {
  orange: { face: 'linear-gradient(180deg,#F6A55A 0%,#E07B2E 100%)', edge: '#A9531C', text: '#fff' },
  blue: { face: 'linear-gradient(180deg,#9AD4F2 0%,#5BA6D8 100%)', edge: '#3576A6', text: '#fff' },
  slate: { face: 'linear-gradient(180deg,#6E6662 0%,#46403D 100%)', edge: '#2A2523', text: '#fff' },
  cream: { face: 'linear-gradient(180deg,#F4E8D4 0%,#D9C6A6 100%)', edge: '#A99270', text: '#3A2A20' },
  rose: { face: 'linear-gradient(180deg,#F7A9BC 0%,#E06C8A 100%)', edge: '#A9405C', text: '#fff' },
  glass: { face: 'linear-gradient(180deg,rgb(255 255 255/0.16) 0%,rgb(255 255 255/0.06) 100%)', edge: 'rgb(0 0 0/0.35)', text: '#F6E9DA' },
} as const;
export type Tone = keyof typeof TONES;

/** Chunky, pressable 3D tile: a lit face on a darker edge that sinks when pressed. */
export function Tile3D({
  icon,
  label,
  tone,
  onClick,
  alert,
  dot,
  small,
}: {
  icon: ReactNode;
  label: string;
  tone: Tone;
  onClick: () => void;
  alert?: boolean;
  /** A quiet "something new here" dot. */
  dot?: boolean;
  small?: boolean;
}) {
  const t = TONES[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={press}
      className={`tile3d group relative w-full rounded-[22px] ${small ? 'pb-[5px]' : 'pb-[7px]'}`}
      style={{ background: t.edge, '--edge': t.edge } as CSSProperties}
    >
      <span
        className={`relative flex flex-col items-center justify-center rounded-[20px] border border-white/30 transition-transform duration-100 group-active:translate-y-[5px] ${small ? 'gap-0.5 py-2' : 'gap-1 py-3'}`}
        style={{ background: t.face, color: t.text, boxShadow: 'inset 0 2px 0 rgb(255 255 255/0.45), inset 0 -6px 12px rgb(0 0 0/0.12)' }}
      >
        <span className={`${small ? 'text-[20px]' : 'text-[34px]'} leading-none drop-shadow-[0_3px_3px_rgb(0_0_0/0.25)]`}>{icon}</span>
        <span className={`${small ? 'text-[12px]' : 'text-[15px]'} font-bold`}>{label}</span>
        <span className="pointer-events-none absolute inset-x-1.5 top-0.5 h-[42%] rounded-t-[18px] rounded-b-[40%] bg-gradient-to-b from-white/25 to-transparent" />
      </span>
      {dot && <span className="absolute top-1 right-1.5 size-2.5 rounded-full bg-[#FF6B7E] shadow-[0_0_6px_#FF6B7E]" />}
      {alert && <span className="absolute -top-1 -right-1 size-3.5 animate-ping rounded-full bg-[#FF5A6E]" />}
    </button>
  );
}

/** A white cloud-shaped speech bubble. */
export function CloudBubble({ children }: { children: ReactNode }) {
  return (
    <div className="cloud-bubble relative rounded-[22px] bg-white/95 px-4 py-2.5 text-center font-hand text-[15px] leading-snug text-[#3A2A20] shadow-[0_8px_20px_rgb(40_20_10/0.25)]">
      <Puff className="-top-3 -left-3 w-12" />
      <Puff className="-right-4 -bottom-3 w-14" />
      <Puff className="-top-3.5 right-6 w-9 opacity-90" />
      <span className="relative">{children}</span>
      <span className="absolute -bottom-2 left-1/2 size-4 -translate-x-1/2 rotate-45 rounded-[3px] bg-white/95" />
    </div>
  );
}

function Puff({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 60 34" className={`pointer-events-none absolute ${className}`} aria-hidden>
      <path d="M10 30 Q0 30 2 21 Q4 13 13 15 Q15 4 27 6 Q35 0 43 8 Q55 7 55 18 Q60 28 50 30 Z" fill="#fff" />
      <path d="M13 26 Q8 24 10 20" stroke="#DDE6F0" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/** Small round glass button for the room's corner tools. */
export function RoundGlass({ label, onClick, active, children }: { label: string; onClick: () => void; active?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={press}
      aria-label={label}
      aria-pressed={active}
      className={`flex size-[38px] items-center justify-center rounded-full border border-white/50 text-[17px] shadow-[0_4px_12px_rgb(40_20_10/0.3)] backdrop-blur-md transition-transform active:scale-90 ${
        active ? 'bg-[#F6A55A]/90' : 'bg-white/55'
      }`}
    >
      {children}
    </button>
  );
}

/** Dark glass card. */
export function Glass({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[26px] border border-white/12 bg-white/[0.06] shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_14px_34px_rgb(0_0_0/0.25)] backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}
