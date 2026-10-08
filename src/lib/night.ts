/**
 * The night page's small engines: tonight's real moon and the heart of stars she
 * lights one good night at a time. The sounds and games live in src/night/.
 */

// ── The moon ──────────────────────────────────────────────────────────────────
const SYNODIC = 29.530588853;
const NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // a known new moon

export interface Moon {
  /** 0 = new, 0.5 = full, back to 1. */
  phase: number;
  /** Lit fraction of the disc, 0..1. */
  lit: number;
  name: string;
  /** Whole days until the next full moon (0 = tonight). */
  toFull: number;
}

export function moonAt(ms = Date.now()): Moon {
  const age = (((ms - NEW_MOON) / 86_400_000) % SYNODIC + SYNODIC) % SYNODIC;
  const phase = age / SYNODIC;
  const lit = (1 - Math.cos(2 * Math.PI * phase)) / 2;
  const name =
    phase < 0.03 || phase > 0.97
      ? 'מולד'
      : phase < 0.22
        ? 'סהר עולה'
        : phase < 0.28
          ? 'חצי ירח'
          : phase < 0.47
            ? 'ירח הולך ומתמלא'
            : phase < 0.53
              ? 'ירח מלא'
              : phase < 0.72
                ? 'ירח הולך וקטן'
                : phase < 0.78
                  ? 'חצי ירח'
                  : 'סהר יורד';
  const toFull = Math.round((((0.5 - phase + 1) % 1) * SYNODIC) % SYNODIC);
  return { phase, lit, name, toFull };
}

/** SVG path of the lit part of a moon of radius r centered on (cx, cy), as seen from Israel. */
export function moonPath(phase: number, cx: number, cy: number, r: number) {
  const rx = Math.abs(Math.cos(2 * Math.PI * phase)) * r;
  const top = `${cx} ${cy - r}`;
  const bottom = `${cx} ${cy + r}`;
  const waxing = phase < 0.5;
  const crescent = phase < 0.25 || phase > 0.75;
  // Outer limb on the lit side, then the terminator back to the top.
  const outer = waxing ? 1 : 0;
  const term = waxing ? (crescent ? 0 : 1) : crescent ? 1 : 0;
  return `M${top} A${r} ${r} 0 0 ${outer} ${bottom} A${rx} ${r} 0 0 ${term} ${top}Z`;
}

// ── The heart of stars ───────────────────────────────────────────────────────
export const HEART_STARS = 21;
const KEY = 'idw:night:stars';

export function litNights(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((d) => typeof d === 'string') : [];
  } catch {
    return [];
  }
}

export function lightTonight(date: string): string[] {
  const all = litNights();
  if (all.includes(date)) return all;
  const next = [...all, date];
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode: tonight still glows, it just won't be remembered */
  }
  return next;
}

/** Points of a heart, evenly spaced along its outline, in a 0..100 box. Starts at the bottom tip. */
export function heartPoints(n = HEART_STARS) {
  const raw: [number, number][] = [];
  const steps = 400;
  for (let i = 0; i <= steps; i++) {
    const t = Math.PI + (i / steps) * 2 * Math.PI; // bottom tip first
    const x = 16 * Math.sin(t) ** 3;
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    raw.push([x, y]);
  }
  const len = [0];
  for (let i = 1; i < raw.length; i++) len.push(len[i - 1] + Math.hypot(raw[i][0] - raw[i - 1][0], raw[i][1] - raw[i - 1][1]));
  const total = len[len.length - 1];
  const pts: { x: number; y: number }[] = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const want = (k / n) * total;
    while (len[j + 1] < want) j++;
    const [x, y] = raw[j];
    // a hand-placed feel: tiny, stable wobble per star
    const wob = Math.sin(k * 12.9898) * 0.9;
    pts.push({ x: 50 + x * 2.7 + wob, y: 48 + y * 2.7 - wob });
  }
  return pts;
}
