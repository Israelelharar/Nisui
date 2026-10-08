import { useMemo } from 'react';
import { places } from '../content/story';

/**
 * "המפה שלנו": a hand-drawn map of Israel with a heart on every place of
 * theirs. No map service, no tracking, city-level pins only. Tapping a heart
 * jumps to that place's card (and its photos) below.
 */

// Rough outline (lng, lat), smoothed into a hand-drawn shape. Not for navigation.
const OUTLINE: [number, number][] = [
  [35.105, 33.09], [35.08, 32.93], [35.07, 32.84], [34.99, 32.83], [34.955, 32.83], [34.94, 32.7], [34.9, 32.52],
  [34.87, 32.45], [34.85, 32.33], [34.8, 32.17], [34.76, 32.07], [34.72, 31.95], [34.64, 31.8], [34.55, 31.67],
  [34.47, 31.57], [34.37, 31.45], [34.25, 31.32], [34.3, 31.15], [34.43, 30.88], [34.55, 30.5], [34.72, 30.05],
  [34.87, 29.62], [34.9, 29.5], [34.96, 29.55], [35.0, 29.75], [35.08, 30.0], [35.15, 30.3], [35.2, 30.55],
  [35.32, 30.9], [35.4, 31.1], [35.47, 31.4], [35.53, 31.75], [35.55, 32.1], [35.57, 32.4], [35.58, 32.65],
  [35.65, 32.68], [35.78, 32.72], [35.85, 32.95], [35.88, 33.15], [35.82, 33.3], [35.62, 33.26], [35.57, 33.28],
  [35.52, 33.12], [35.4, 33.07], [35.2, 33.09],
];

const K = 100; // px per degree of latitude
const COS = Math.cos((31.5 * Math.PI) / 180);
const LNG0 = 34.15;
const LAT0 = 33.45;
const project = (lng: number, lat: number) => ({ x: (lng - LNG0) * COS * K, y: (LAT0 - lat) * K });

/** Closed Catmull-Rom spline through the points, as SVG cubic curves. */
function smoothPath(pts: { x: number; y: number }[]) {
  const n = pts.length;
  const at = (i: number) => pts[(i + n) % n];
  let d = `M${at(0).x.toFixed(1)},${at(0).y.toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C${c1.x.toFixed(1)},${c1.y.toFixed(1)} ${c2.x.toFixed(1)},${c2.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return `${d}Z`;
}

const HEART = 'M0 5.5C-1.8 4.2-6 1.3-6-2.2-6-4.3-4.5-5.8-2.7-5.8-1.5-5.8-.6-5.1 0-4.2.6-5.1 1.5-5.8 2.7-5.8 4.5-5.8 6-4.3 6-2.2 6 1.3 1.8 4.2 0 5.5Z';

interface Pin {
  ids: string[];
  names: string[];
  x: number;
  y: number;
}

export function PlacesMap({ onPick, picked }: { onPick: (ids: string[]) => void; picked: string[] | null }) {
  const land = useMemo(() => smoothPath(OUTLINE.map(([lng, lat]) => project(lng, lat))), []);
  const kinneret = project(35.59, 32.82);
  const deadSea = project(35.48, 31.5);

  // Places a few km apart share one heart (e.g. three towns along the same stretch of coast).
  const pins = useMemo(() => {
    const out: Pin[] = [];
    for (const p of places) {
      const pt = project(p.lng, p.lat);
      const near = out.find((q) => Math.hypot(q.x - pt.x, q.y - pt.y) < 14);
      if (near) {
        near.ids.push(p.id);
        if (!near.names.includes(p.name)) near.names.push(p.name);
      } else out.push({ ids: [p.id], names: [p.name], ...pt });
    }
    return out;
  }, []);

  const w = (35.95 - LNG0) * COS * K;
  const h = (LAT0 - 29.35) * K;

  return (
    <figure className="m-0 overflow-hidden rounded-[22px] bg-sky/70 px-2 pt-3 pb-2 shadow-soft">
      <svg viewBox={`-112 0 ${w + 124} ${h}`} className="mx-auto block h-auto w-full max-w-[330px]" role="img" aria-label="מפה של המקומות שלנו">
        <text x={-60} y={h * 0.62} fontSize="11" fill="#3f6fb5" opacity=".55" transform={`rotate(-90 -60 ${h * 0.62})`} textAnchor="middle" fontStyle="italic">
          הים התיכון
        </text>
        <path d={land} fill="#fbefc9" stroke="#d9a955" strokeWidth="1.6" strokeLinejoin="round" />
        <path d={land} fill="none" stroke="#d9a955" strokeWidth=".8" strokeDasharray="2 4" transform="translate(2.5 2.5)" opacity=".5" />
        <ellipse cx={kinneret.x} cy={kinneret.y} rx="4" ry="7" fill="#ddebfa" stroke="#3f6fb5" strokeOpacity=".3" />
        <ellipse cx={deadSea.x} cy={deadSea.y} rx="4.5" ry="20" fill="#ddebfa" stroke="#3f6fb5" strokeOpacity=".3" />

        {pins.map((pin) => {
          const on = !!picked && pin.ids.some((id) => picked.includes(id));
          return (
            <g
              key={pin.ids[0]}
              role="button"
              tabIndex={0}
              aria-label={pin.names.join(', ')}
              onClick={() => onPick(pin.ids)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onPick(pin.ids)}
              className="cursor-pointer outline-none"
            >
              <circle cx={pin.x} cy={pin.y} r="16" fill="transparent" />
              <g transform={`translate(${pin.x} ${pin.y}) scale(${on ? 1.5 : 1.15})`} className="transition-transform">
                <path d={HEART} fill={on ? '#a32c4a' : '#c2385a'} stroke="#fff" strokeWidth="1.2" />
              </g>
              <text x={pin.x - 11} y={pin.y + 4 - (pin.names.length - 1) * 6.5} fontSize="12" fill="#3a2228" fontWeight={on ? 700 : 500} style={{ direction: 'rtl' }} textAnchor="start">
                {pin.names.map((n, i) => (
                  <tspan key={n} x={pin.x - 11} dy={i ? 13 : 0}>
                    {n}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="pb-1 text-center font-hand text-sm text-muted">כל לב זה מקום שהיינו בו ביחד. עוד נוסיף הרבה.</figcaption>
    </figure>
  );
}
