import { useMemo, type CSSProperties } from 'react';
import { rooms } from './catalog';

/**
 * The pig's rooms. The cozy room (the default, and the "together" room) is a
 * painted scene: bookshelf, window with sunlight, a painting, a plant, a teddy
 * bear and his little house on a wooden floor. The other rooms are lit and
 * shaded versions of their emoji sets.
 */
export function RoomScene({ room, together = false }: { room: string; together?: boolean }) {
  if (room === 'cozy' || together) return <CozyRoom together={together} />;
  return <EmojiRoom room={room} />;
}

const BOOKS = ['#B5523B', '#3F6F8F', '#D9A955', '#6C8A4A', '#8A4A6A', '#E0C9A0', '#C9773F', '#4E5F86'];

function Shelf({ y, seed }: { y: number; seed: number }) {
  let x = 22;
  const out = [];
  for (let i = 0; x < 104; i++) {
    const w = 7 + ((seed * 7 + i * 5) % 6);
    const h = 30 + ((seed * 11 + i * 13) % 16);
    const tilt = (seed + i) % 5 === 0 ? -9 : 0;
    out.push(
      <g key={i} transform={`rotate(${tilt} ${x + w / 2} ${y})`}>
        <rect x={x} y={y - h} width={w} height={h} rx="1.2" fill={BOOKS[(seed + i * 3) % BOOKS.length]} />
        <rect x={x + 1.5} y={y - h + 5} width={w - 3} height="2" fill="#fff" opacity="0.35" />
        <rect x={x} y={y - h} width="1.6" height={h} fill="#000" opacity="0.15" />
      </g>,
    );
    x += w + (tilt ? 4 : 1);
  }
  return <g>{out}</g>;
}

function CozyRoom({ together }: { together: boolean }) {
  return (
    <svg data-scene viewBox="0 0 400 380" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" aria-hidden>
      <defs>
        <linearGradient id="cz-wall" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={together ? '#E9C2B4' : '#E3C29A'} />
          <stop offset="1" stopColor={together ? '#C8907E' : '#B98A5E'} />
        </linearGradient>
        <radialGradient id="cz-sun" cx="0.86" cy="0.2" r="0.75">
          <stop offset="0" stopColor="#FFF4D2" stopOpacity="0.95" />
          <stop offset="0.45" stopColor="#FFE2A8" stopOpacity="0.35" />
          <stop offset="1" stopColor="#FFE2A8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cz-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A86B3E" />
          <stop offset="1" stopColor="#6E4024" />
        </linearGradient>
        <linearGradient id="cz-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#CFE9F7" />
          <stop offset="1" stopColor="#FFF1D2" />
        </linearGradient>
        <linearGradient id="cz-ray" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF6DA" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFF6DA" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="cz-vig" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.6" stopColor="#2a1208" stopOpacity="0" />
          <stop offset="1" stopColor="#2a1208" stopOpacity="0.45" />
        </radialGradient>
        <linearGradient id="cz-wood" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8A5432" />
          <stop offset="1" stopColor="#6B3D22" />
        </linearGradient>
        <radialGradient id="cz-leaf" cx="0.3" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#7DBA5E" />
          <stop offset="1" stopColor="#2F6B2E" />
        </radialGradient>
        <radialGradient id="cz-bear" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#C68A52" />
          <stop offset="1" stopColor="#7E4F27" />
        </radialGradient>
        <filter id="cz-blur">
          <feGaussianBlur stdDeviation="5" />
        </filter>
      </defs>

      {/* wall + sunlight */}
      <rect width="400" height="300" fill="url(#cz-wall)" />
      <rect width="400" height="300" fill="url(#cz-sun)" />

      {/* window */}
      <g>
        <rect x="292" y="22" width="98" height="168" rx="4" fill="#F3E5CF" />
        <rect x="300" y="30" width="82" height="152" fill="url(#cz-sky)" />
        <circle cx="360" cy="62" r="22" fill="#FFF8E0" opacity="0.9" filter="url(#cz-blur)" />
        <path d="M300 150 Q320 128 340 140 Q360 120 382 136 L382 182 L300 182 Z" fill="#9CC98A" opacity="0.8" />
        <path d="M341 30 V182 M300 104 H382" stroke="#F3E5CF" strokeWidth="6" />
        <path d="M292 22 h98 v168 h-98z" fill="none" stroke="#D9C4A4" strokeWidth="2" />
        <rect x="286" y="188" width="110" height="9" rx="3" fill="#E9D6B6" />
        {/* curtain */}
        <path d="M282 14 Q296 90 286 200 L272 200 Q280 100 270 14 Z" fill="#F0DFC4" opacity="0.95" />
        <path d="M276 20 Q284 100 278 196" stroke="#D8C2A0" strokeWidth="2" fill="none" />
      </g>
      <rect x="262" y="8" width="138" height="8" rx="4" fill="#8A5432" />

      {/* painting */}
      <g>
        <rect x="160" y="64" width="92" height="70" rx="3" fill="#8A5A2E" />
        <rect x="166" y="70" width="80" height="58" fill="#BFE0F0" />
        <circle cx="222" cy="86" r="8" fill="#FFD66B" />
        <path d="M166 112 Q190 90 212 108 Q228 96 246 106 V128 H166 Z" fill="#7DAA55" />
        <path d="M166 120 Q196 108 246 122 V128 H166 Z" fill="#5E8E3E" />
        <rect x="160" y="64" width="92" height="70" rx="3" fill="none" stroke="#C9974E" strokeWidth="2" />
      </g>

      {/* bookshelf */}
      <g>
        <rect x="10" y="52" width="108" height="244" rx="4" fill="url(#cz-wood)" />
        <rect x="18" y="60" width="92" height="230" fill="#4E2C18" />
        {[110, 170, 230, 288].map((y) => (
          <rect key={y} x="14" y={y} width="100" height="7" rx="2" fill="#9A6038" />
        ))}
        <Shelf y={110} seed={1} />
        <Shelf y={170} seed={4} />
        <g>
          <rect x="24" y="196" width="40" height="32" fill="#C9974E" />
          <rect x="28" y="200" width="32" height="24" fill="#F2D9A6" />
          <path d="M28 220 l10 -10 l8 6 l6 -5 l8 9 z" fill="#6C8A4A" />
          <circle cx="52" cy="206" r="3" fill="#F29A4A" />
          <ellipse cx="88" cy="226" rx="12" ry="4" fill="#B5523B" />
          <path d="M80 226 q8 -28 16 0" fill="#7DBA5E" />
        </g>
        <Shelf y={288} seed={7} />
        <path d="M36 52 q10 -18 22 0 z" fill="#5E9A48" />
        <rect x="40" y="44" width="14" height="10" rx="2" fill="#C26B3E" />
      </g>

      {/* floor */}
      <rect x="0" y="292" width="400" height="88" fill="url(#cz-floor)" />
      <g stroke="#5A3018" strokeWidth="1.4" opacity="0.5">
        {[-120, -60, 0, 60, 120, 180, 240, 300, 360, 420, 480, 540].map((x) => (
          <line key={x} x1={x} y1="292" x2={200 + (x - 200) * 1.7} y2="380" />
        ))}
        <path d="M30 318 h50 M150 336 h60 M260 322 h70 M90 358 h80 M300 360 h70" />
      </g>
      <rect x="0" y="288" width="400" height="7" fill="#7A4A2C" />
      {/* sunlight from the window, on the wall and the floor */}
      <polygon className="cz-ray" points="300,30 382,30 250,380 90,380" fill="url(#cz-ray)" />
      <ellipse cx="200" cy="350" rx="120" ry="20" fill="#FFE7B0" opacity="0.18" />

      {together && <Garland />}

      {/* plant */}
      <g className="decor-sway" style={{ transformOrigin: '346px 300px', '--dur': '7s' } as CSSProperties}>
        {[
          [346, 230, -40, 46],
          [330, 214, -15, 52],
          [360, 210, 15, 54],
          [374, 236, 45, 44],
          [318, 246, -65, 40],
          [348, 196, 0, 48],
        ].map(([x, y, r, h], i) => (
          <ellipse key={i} cx={x} cy={y} rx="11" ry={h / 2} transform={`rotate(${r} ${x} ${y + h / 2})`} fill="url(#cz-leaf)" />
        ))}
      </g>
      <path d="M322 262 h48 l-6 42 h-36 z" fill="#C2653A" />
      <rect x="318" y="256" width="56" height="10" rx="3" fill="#D67B48" />
      <path d="M326 270 q20 6 40 0" stroke="#9E4A26" strokeWidth="2" fill="none" opacity="0.5" />

      {/* little house */}
      <g>
        <ellipse cx="58" cy="350" rx="50" ry="11" fill="#2a1208" opacity="0.3" />
        <rect x="12" y="330" width="92" height="16" rx="6" fill="#6AA04A" />
        <rect x="22" y="296" width="70" height="40" fill="#F4E6CC" />
        <path d="M14 300 L57 266 L100 300 Z" fill="#C4473A" />
        <path d="M14 300 L57 266 L100 300" fill="none" stroke="#9E3328" strokeWidth="3" strokeLinejoin="round" />
        <rect x="74" y="272" width="10" height="16" fill="#9E3328" />
        <rect x="48" y="312" width="16" height="24" rx="7" fill="#7A4A2C" />
        <rect x="28" y="306" width="12" height="11" fill="#9CC8E8" stroke="#fff" strokeWidth="1.5" />
        <rect x="72" y="306" width="12" height="11" fill="#9CC8E8" stroke="#fff" strokeWidth="1.5" />
      </g>

      {/* teddy */}
      <g>
        <ellipse cx="352" cy="364" rx="34" ry="8" fill="#2a1208" opacity="0.3" />
        <ellipse cx="352" cy="342" rx="24" ry="22" fill="url(#cz-bear)" />
        <ellipse cx="352" cy="346" rx="12" ry="12" fill="#E2B784" />
        <ellipse cx="331" cy="356" rx="9" ry="7" fill="url(#cz-bear)" />
        <ellipse cx="373" cy="356" rx="9" ry="7" fill="url(#cz-bear)" />
        <circle cx="336" cy="300" r="7" fill="url(#cz-bear)" />
        <circle cx="368" cy="300" r="7" fill="url(#cz-bear)" />
        <circle cx="352" cy="314" r="18" fill="url(#cz-bear)" />
        <ellipse cx="352" cy="320" rx="8" ry="6" fill="#E2B784" />
        <circle cx="345" cy="311" r="2.2" fill="#1a0d06" />
        <circle cx="359" cy="311" r="2.2" fill="#1a0d06" />
        <ellipse cx="352" cy="317" rx="2.6" ry="2" fill="#1a0d06" />
        {together && <path d="M352 336 c-6 -6 -14 2 0 12 c14 -10 6 -18 0 -12z" fill="#E5577A" />}
      </g>

      <rect width="400" height="380" fill="url(#cz-vig)" />
    </svg>
  );
}

/** Hearts on a string across the room, for the days they are together. */
function Garland() {
  const pts = Array.from({ length: 11 }, (_, i) => {
    const t = i / 10;
    return { x: 120 + t * 170, y: 30 + Math.sin(t * Math.PI) * 34 };
  });
  return (
    <g>
      <path d={`M120 30 Q205 98 290 30`} stroke="#7A4A2C" strokeWidth="1.5" fill="none" />
      {pts.slice(1, -1).map((p, i) => (
        <g key={i} className="decor-sway" style={{ transformOrigin: `${p.x}px ${p.y}px`, '--delay': `${-i * 0.4}s`, '--dur': '3s' } as CSSProperties}>
          <path d={`M${p.x} ${p.y + 14} c-12 -8 -10 -18 0 -13 c10 -5 12 5 0 13z`} fill={i % 2 ? '#F29AB0' : '#E5577A'} stroke="#fff" strokeWidth="0.8" />
        </g>
      ))}
    </g>
  );
}

/** Other rooms: their emoji set, lit and shaded so they sit in the same world. */
function EmojiRoom({ room }: { room: string }) {
  const r = rooms[room] ?? rooms.cozy;
  return (
    <div className="absolute inset-0" style={{ background: r.bg }}>
      <div
        className="absolute inset-x-0 bottom-0 h-[24%]"
        style={{ background: `linear-gradient(180deg, ${r.floor}, color-mix(in srgb, ${r.floor} 70%, #000))` }}
      >
        <div className="absolute inset-x-0 top-0 h-1.5 bg-black/15" />
      </div>
      {r.decor.map((d, i) => (
        <span
          key={i}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 leading-none drop-shadow-[0_6px_6px_rgb(40_20_10/0.3)]"
          style={{ left: `${d.x}%`, top: `${d.y}%`, fontSize: d.s * 1.15, transform: `rotate(${d.r ?? 0}deg)` }}
        >
          <span data-decor className={`block ${decorMotion(d.e)}`} style={{ '--delay': `${-i * 1.3}s`, '--dur': `${4 + (i % 3) * 1.5}s` } as CSSProperties}>
            {d.e}
          </span>
        </span>
      ))}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 78% 12%, rgb(255 244 210 / 0.45), transparent 55%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, transparent 58%, rgb(42 18 8 / 0.42))' }} />
    </div>
  );
}

/** How each decoration moves: stars twinkle, the sun turns, clouds drift, the rest sways. */
export function decorMotion(e: string) {
  if ('⭐✨❄️💎🕯️'.includes(e)) return 'decor-twinkle';
  if ('☀️🌞'.includes(e)) return 'decor-spin';
  if ('☁️⛵🦋'.includes(e)) return 'decor-drift';
  return 'decor-sway';
}

const WEATHER: Record<string, { e: string[]; n: number; size: [number, number]; color?: string; up?: boolean }> = {
  cozy: { e: ['•', '·', '•'], n: 14, size: [5, 9], color: '#FFE9A8', up: true },
  snow: { e: ['❄', '•', '❅'], n: 16, size: [8, 16] },
  garden: { e: ['🌸', '🍃'], n: 6, size: [12, 18] },
  night: { e: ['✦', '·'], n: 8, size: [8, 14], color: '#FFF3B0' },
  candy: { e: ['✨', '🫧'], n: 7, size: [10, 16] },
  castle: { e: ['✨'], n: 6, size: [10, 16] },
  beach: { e: ['🫧'], n: 5, size: [10, 14] },
  together: { e: ['💗', '•', '💕'], n: 10, size: [8, 14], color: '#FFD0DC', up: true },
};

/** Floating dust in the sunlight, snow, petals, sparkles: a little weather for each room. */
export function RoomWeather({ room }: { room: string }) {
  const w = WEATHER[room];
  const bits = useMemo(
    () =>
      w
        ? Array.from({ length: w.n }, (_, i) => ({
            e: w.e[i % w.e.length],
            left: (i * 61) % 100,
            size: w.size[0] + ((i * 7) % (w.size[1] - w.size[0] + 1)),
            dur: (w.up ? 9 : 6) + (i % 5) * 1.6,
            delay: -i * 1.1,
            drift: (i % 2 ? 1 : -1) * (10 + ((i * 13) % 40)) + 'px',
          }))
        : [],
    [w],
  );
  if (!w) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-[3] overflow-hidden" aria-hidden>
      {bits.map((b, i) => (
        <span
          key={i}
          className={`${w.up ? 'room-mote' : 'room-flake'} leading-none`}
          style={
            {
              left: `${b.left}%`,
              fontSize: b.size,
              color: w.color ?? '#fff',
              textShadow: w.up ? `0 0 6px ${w.color}` : undefined,
              '--dur': `${b.dur}s`,
              '--delay': `${b.delay}s`,
              '--drift': b.drift,
            } as CSSProperties
          }
        >
          {b.e}
        </span>
      ))}
    </div>
  );
}
