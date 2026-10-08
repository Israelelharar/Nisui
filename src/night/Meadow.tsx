import { useMemo } from 'react';

/**
 * The meadow at night, behind both sheep games: a deep sky with stars, a low
 * moon, three layers of hills, grass that sways, and fireflies. `ground` is the
 * fraction of the height where the grass starts.
 */
export function Meadow({ ground = 0.62, top = false }: { ground?: number; top?: boolean }) {
  const stars = useMemo(() => Array.from({ length: 46 }, () => ({ x: Math.random() * 100, y: Math.random() * ground * 70, r: Math.random() < 0.15 ? 1.4 : 0.7, d: 2 + Math.random() * 4 })), [ground]);
  const flies = useMemo(
    () =>
      Array.from({ length: 9 }, () => ({
        x: 5 + Math.random() * 90,
        y: ground * 100 + Math.random() * (95 - ground * 100),
        fx: `${Math.random() * 40 - 20}px`,
        fy: `${-10 - Math.random() * 30}px`,
        fd: `${5 + Math.random() * 5}s`,
        delay: `${-Math.random() * 8}s`,
      })),
    [ground],
  );
  const tufts = useMemo(() => Array.from({ length: 22 }, (_, i) => ({ x: (i / 22) * 100 + Math.random() * 3, y: ground * 100 + 6 + Math.random() * (90 - ground * 100), s: 0.7 + Math.random() * 0.8, delay: `${-Math.random() * 3}s` })), [ground]);
  const g = ground * 100;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #0F1430 0%, #22264A 38%, #3B3560 62%, #2A2440 100%)' }} />
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-[#F4F0FF] animate-pulse"
          style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r * 2, height: s.r * 2, opacity: 0.7, animationDuration: `${s.d}s` }}
        />
      ))}
      {!top && (
        <div className="absolute rounded-full" style={{ right: '14%', top: `${g * 0.18}%`, width: 54, height: 54, background: 'radial-gradient(circle at 40% 38%, #FFF6DE, #F0CF8E 70%)', boxShadow: '0 0 60px 20px rgb(255 227 168 / 0.18)' }} />
      )}
      <svg viewBox="0 0 400 100" preserveAspectRatio="none" className="absolute inset-x-0 w-full" style={{ top: `${g - 16}%`, height: '22%' }}>
        <path d="M0 60 Q60 20 130 48 T260 38 T400 46 V100 H0Z" fill="#2B3A4E" />
        <g fill="#22303F">
          <path d="M300 44l8-22 8 22z" />
          <path d="M318 46l6-16 6 16z" />
          <path d="M60 40l7-20 7 20z" />
        </g>
        <path d="M0 78 Q90 46 190 70 T400 64 V100 H0Z" fill="#26402F" />
      </svg>
      <div className="absolute inset-x-0 bottom-0" style={{ top: `${g}%`, background: 'linear-gradient(180deg, #2F5136 0%, #24402B 45%, #1A2F20 100%)' }} />
      {tufts.map((t, i) => (
        <svg key={i} viewBox="0 0 20 14" className="grass-sway absolute" style={{ left: `${t.x}%`, top: `${t.y}%`, width: 20 * t.s, height: 14 * t.s, animationDelay: t.delay }}>
          <path d="M2 14q2-8 0-13M7 14q1-9 4-13M12 14q0-7 -2-11M16 14q1-6 3-9" stroke="#4F7A4C" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        </svg>
      ))}
      {flies.map((f, i) => (
        <span
          key={i}
          className="firefly absolute size-1.5 rounded-full bg-[#FFF3B0]"
          style={{ left: `${f.x}%`, top: `${f.y}%`, boxShadow: '0 0 10px 3px rgb(255 240 150 / 0.55)', ['--fx' as string]: f.fx, ['--fy' as string]: f.fy, ['--fd' as string]: f.fd, ['--fdelay' as string]: f.delay }}
        />
      ))}
    </div>
  );
}
