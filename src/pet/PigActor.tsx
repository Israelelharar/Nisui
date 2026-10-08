import { useCallback, useEffect, useImperativeHandle, useRef, useState, type CSSProperties, type PointerEvent, type Ref } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { faceY, PigSvg, type Face } from './PigSvg';
import type { AnimStyle } from './engine';
import type { TrickId } from './catalog';
import { boing, crunch, dizzySound, flop, giggle, purr, slapSound, sneeze, snore, sob, sparkle, splash, tada, tone, whoosh, yawnSound } from './sound';
import { species, type SpeciesId } from './species';

/**
 * The guinea pig brought to life: he breathes, blinks, twitches his ears,
 * follows her finger with his eyes, wanders around the room, popcorns when
 * he's happy, purrs when petted and eats in little bites. How he moves
 * depends on the animation style she picks (one of four).
 */
export const animStyles: { id: AnimStyle; name: string; emoji: string; desc: string }[] = [
  { id: 'alive', name: 'חי ומציאותי', emoji: '🐾', desc: 'מסתובב בחדר, מרחרח, עוקב אחרי האצבע שלך עם העיניים ומפהק כשהוא עייף' },
  { id: 'bouncy', name: 'קופצני', emoji: '🎈', desc: `עשוי ג׳לי, ומרוב שמחה ${species.happyMove}` },
  { id: 'soft', name: 'רך וחלומי', emoji: '☁️', desc: 'מתנדנד לאט, נושם עמוק ומפזר לבבות קטנים באוויר' },
  { id: 'magic', name: 'קסום', emoji: '🔮', desc: 'מרחף באוויר, זוהר בצבעים, וניצוצות מסתובבים סביבו' },
];

export type Action = 'popcorn' | 'hop' | 'shake' | 'wiggle' | 'spin' | 'squish';
export type BurstKind = 'hearts' | 'stars' | 'drops' | 'crumbs' | 'sparkles' | 'notes' | 'float' | 'zzz';

export interface ActorApi {
  play: (a: Action) => void;
  /** Particles from a point given in % of the pig's box (default: his middle). */
  burst: (kind: BurstKind, n?: number, at?: { x: number; y: number }) => void;
  /** He holds the food at his mouth and eats it in bites. */
  feed: (emoji: string) => void;
  /** Where his mouth is on screen right now, and how close food must come to be eaten. */
  mouth: () => { x: number; y: number; reach: number } | null;
}

const DURATION: Record<Action, number> = { popcorn: 900, hop: 500, shake: 900, wiggle: 900, spin: 1100, squish: 450 };

/** How long each secret trick takes (the slap includes three seconds of crying). */
const TRICK_MS: Record<TrickId, number> = { jump: 950, flip: 1150, slap: 3400, pancake: 1150, dizzy: 2700, sneeze: 1100, tickle: 1600, dance: 2400, hug: 1800 };
const TRICK_FACE: Record<TrickId, Face> = { jump: 'happy', flip: 'happy', slap: 'cry', pancake: 'dizzy', dizzy: 'dizzy', sneeze: 'sneeze', tickle: 'laugh', dance: 'happy', hug: 'happy' };

const KIND: Record<BurstKind, { e: string[]; size: [number, number]; d: [number, number]; fall?: boolean }> = {
  hearts: { e: ['💗', '💕', '🧡', '💖'], size: [18, 26], d: [0.9, 1.3] },
  stars: { e: ['⭐', '✨', '🌟'], size: [16, 26], d: [0.9, 1.4] },
  drops: { e: ['💧'], size: [12, 20], d: [0.8, 1.1], fall: true },
  crumbs: { e: ['•', '•', '·'], size: [16, 22], d: [0.6, 0.9], fall: true },
  sparkles: { e: ['✦', '✧', '✦'], size: [14, 24], d: [1, 1.6] },
  notes: { e: ['♪', '♫', '♪'], size: [18, 26], d: [1.4, 2] },
  float: { e: ['💗', '🤍', '💕'], size: [14, 20], d: [2.6, 3.4] },
  zzz: { e: ['z', 'Z'], size: [16, 24], d: [1.4, 1.8] },
};
const SPARKLE_COLORS = ['#FFB3E1', '#B9A6FF', '#FFE07A', '#8FD3FF'];
const CRUMB_COLORS = ['#E89B4A', '#8DBF5A', '#D9A955'];

interface Particle {
  id: number;
  e: string;
  x: number;
  y: number;
  dx: number;
  dy: number;
  rot: number;
  size: number;
  d: number;
  fall?: boolean;
  color?: string;
}

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const clamp = (v: number) => Math.max(-1, Math.min(1, v));

/** Idle behaviours each style picks from, with weights, and how often. */
type Idle = 'look' | 'walk' | 'popcorn' | 'hop' | 'wiggle' | 'spin' | 'yawn' | 'float' | 'sparkles' | 'notes';
const IDLE: Record<AnimStyle, { every: [number, number]; pool: [Idle, number][] }> = {
  alive: {
    every: [2800, 6000],
    pool: [
      ['walk', 5],
      ['look', 4],
      ['hop', 1],
      ['popcorn', 1],
      ['wiggle', 1],
      ['notes', 1],
      ['yawn', 1],
    ],
  },
  bouncy: {
    every: [2000, 4200],
    pool: [
      ['popcorn', 5],
      ['hop', 4],
      ['walk', 3],
      ['wiggle', 2],
      ['look', 1],
    ],
  },
  soft: {
    every: [3500, 7000],
    pool: [
      ['float', 5],
      ['look', 3],
      ['wiggle', 1],
      ['yawn', 1],
    ],
  },
  magic: {
    every: [3000, 6000],
    pool: [
      ['sparkles', 5],
      ['spin', 3],
      ['look', 2],
      ['float', 1],
    ],
  },
};

export function PigActor({
  ref,
  look,
  style,
  mood,
  asleep = false,
  sleepy = false,
  idle = true,
  interactive = true,
  walk = true,
  need = null,
  talk = 0,
  expect = false,
  onPet,
  onTrick,
  grown = 1,
  potion = null,
  className = '',
  css,
}: {
  ref?: Ref<ActorApi>;
  look: { skin: string; head?: string; face?: string; neck?: string; species?: SpeciesId };
  style: AnimStyle;
  mood: Face;
  asleep?: boolean;
  sleepy?: boolean;
  idle?: boolean;
  interactive?: boolean;
  walk?: boolean;
  /** Emoji of what he needs (shown in a thought bubble). */
  need?: string | null;
  /** Mouth open while he repeats her words (0…1). */
  talk?: number;
  /** Food is being held near him: he opens his mouth wide. */
  expect?: boolean;
  onPet?: (strong: boolean) => void;
  /** She found one of the secret gestures. */
  onTrick?: (t: TrickId) => void;
  /** 0 = pup … 1 = grown up (his proportions). */
  grown?: number;
  /** A potion's spell on him (giant, tiny, rainbow…): changes how he looks for a while. */
  potion?: string | null;
  className?: string;
  css?: CSSProperties;
}) {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [food, setFood] = useState<{ id: number; e: string } | null>(null);
  const [petted, setPetted] = useState(false);
  const [yawning, setYawning] = useState(false);
  const [eyes, setEyes] = useState({ x: 0, y: 0 });
  const [walkX, setWalkX] = useState(0);
  const [walking, setWalking] = useState(false);
  const lastPointer = useRef(0);
  const lastPet = useRef(0);
  const lastPurr = useRef(0);
  const timers = useRef<number[]>([]);
  const nextId = useRef(0);
  const [trick, setTrick] = useState<{ id: TrickId; dir: number } | null>(null);
  const trickUntil = useRef(0);
  /** The finger on him right now: where it started, how far and how far around it went. */
  const gest = useRef<{ x: number; y: number; t: number; moved: number; sweep: number; last: number; done: boolean } | null>(null);
  const longPress = useRef(0);
  const taps = useRef<number[]>([]);
  const bellyTaps = useRef<number[]>([]);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const play = useCallback(
    (a: Action, quiet = false) => {
      // His own little hops while idling are silent; a boing only when she made it happen.
      if (!quiet && (a === 'popcorn' || a === 'hop' || a === 'spin')) boing();
      if (a === 'shake') splash();
      setAction(null);
      later(() => setAction(a), 16);
      later(() => setAction((cur) => (cur === a ? null : cur)), DURATION[a] + 30);
    },
    [later],
  );

  const burst = useCallback(
    (kind: BurstKind, n = 6, at = { x: 50, y: 42 }) => {
      if (reduce) return;
      const k = KIND[kind];
      const made: Particle[] = Array.from({ length: n }, () => {
        const id = nextId.current++;
        const up = kind === 'float' || kind === 'notes' || kind === 'zzz';
        const angle = k.fall ? rnd(-150, -30) : up ? rnd(-115, -65) : rnd(-170, -10);
        const dist = up ? rnd(90, 150) : rnd(50, 110);
        return {
          id,
          e: k.e[Math.floor(Math.random() * k.e.length)],
          x: at.x + rnd(-6, 6),
          y: at.y + rnd(-4, 4),
          dx: k.fall ? rnd(-70, 70) : Math.cos((angle * Math.PI) / 180) * dist,
          dy: k.fall ? rnd(40, 90) : Math.sin((angle * Math.PI) / 180) * dist,
          rot: rnd(-60, 60),
          size: rnd(...k.size),
          d: rnd(...k.d),
          fall: k.fall,
          color:
            kind === 'sparkles'
              ? SPARKLE_COLORS[id % 4]
              : kind === 'crumbs'
                ? CRUMB_COLORS[id % 3]
                : kind === 'notes'
                  ? '#C2385A'
                  : kind === 'zzz'
                    ? '#fff'
                    : undefined,
        };
      });
      setParticles((p) => [...p.slice(-40), ...made]);
      const maxD = Math.max(...made.map((m) => m.d));
      later(() => setParticles((p) => p.filter((x) => !made.includes(x))), maxD * 1000 + 80);
    },
    [later, reduce],
  );

  const feed = useCallback(
    (e: string) => {
      const id = nextId.current++;
      setFood({ id, e });
      crunch();
      [450, 850, 1250].forEach((t) => later(() => burst('crumbs', 4, { x: 50, y: 74 }), t));
      later(() => {
        setFood((f) => (f?.id === id ? null : f));
        play('hop');
        burst('hearts', 4, { x: 50, y: 30 });
      }, 1800);
    },
    [burst, later, play],
  );

  const mouth = useCallback(() => {
    const svg = box.current?.querySelector('svg.pig');
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    return { x: r.left + r.width * 0.5, y: r.top + r.height * faceY(grown, 152), reach: Math.max(70, r.width * 0.42) };
  }, [grown]);

  useImperativeHandle(ref, () => ({ play, burst, feed, mouth }), [play, burst, feed, mouth]);

  // Styles that don't walk come back to the middle.
  useEffect(() => {
    if (style === 'soft' || style === 'magic') setWalkX(0);
  }, [style]);

  // Eyes follow her finger (or the mouse), then drift back to the middle.
  useEffect(() => {
    if (!interactive || reduce) return;
    let raf = 0;
    const on = (e: globalThis.PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = box.current?.getBoundingClientRect();
        if (!r) return;
        lastPointer.current = Date.now();
        setEyes({ x: clamp((e.clientX - (r.left + r.width / 2)) / (r.width * 0.8)), y: clamp((e.clientY - (r.top + r.height * 0.45)) / (r.height * 0.8)) });
      });
    };
    window.addEventListener('pointermove', on);
    window.addEventListener('pointerdown', on);
    const back = window.setInterval(() => {
      if (Date.now() - lastPointer.current > 2500) setEyes((v) => (v.x || v.y ? { x: 0, y: 0 } : v));
    }, 1000);
    return () => {
      window.removeEventListener('pointermove', on);
      window.removeEventListener('pointerdown', on);
      window.clearInterval(back);
      cancelAnimationFrame(raf);
    };
  }, [interactive, reduce]);

  // What he does on his own.
  useEffect(() => {
    if (!idle || asleep || reduce) return;
    let t = 0;
    const cfg = IDLE[style];
    const total = cfg.pool.reduce((a, [, w]) => a + w, 0);
    const tick = () => {
      t = window.setTimeout(
        () => {
          const busy = Date.now() - lastPointer.current < 1500 || Date.now() - lastPet.current < 2000 || Date.now() < trickUntil.current;
          if (!busy) {
            let r = Math.random() * total;
            const [pickd] = cfg.pool.find(([, w]) => (r -= w) < 0) ?? cfg.pool[0];
            let what = pickd;
            if (what === 'yawn' && !sleepy) what = 'look';
            if (what === 'walk' && !walk) what = 'hop';
            if (what === 'popcorn' || what === 'hop' || what === 'wiggle' || what === 'spin') play(what, true);
            if (what === 'float') burst('float', 3, { x: 50, y: 30 });
            if (what === 'sparkles') {
              sparkle();
              burst('sparkles', 8, { x: 50, y: 45 });
              burst('stars', 2, { x: 50, y: 20 });
            }
            if (what === 'notes') burst('notes', 3, { x: 62, y: 38 });
            if (what === 'yawn') {
              yawnSound();
              setYawning(true);
              later(() => setYawning(false), 1400);
            }
            if (what === 'look') {
              const s = Math.random() < 0.5 ? -1 : 1;
              setEyes({ x: 0.9 * s, y: -0.1 });
              later(() => setEyes({ x: -0.9 * s, y: 0.1 }), 900);
              later(() => setEyes({ x: 0, y: 0 }), 1900);
            }
            if (what === 'walk') {
              setWalkX((x) => {
                let next = rnd(-42, 42);
                if (Math.abs(next - x) < 18) next = x > 0 ? rnd(-42, -10) : rnd(10, 42);
                setEyes({ x: next > x ? 0.85 : -0.85, y: 0.15 });
                setWalking(true);
                return next;
              });
            }
          }
          tick();
        },
        rnd(...cfg.every),
      );
    };
    tick();
    return () => window.clearTimeout(t);
  }, [idle, asleep, sleepy, style, walk, reduce, play, burst, later]);

  // Sleeping: little z's now and then.
  useEffect(() => {
    if (!asleep || reduce) return;
    let n = 0;
    const id = window.setInterval(() => {
      burst('zzz', 1, { x: 64, y: 30 });
      if (n++ % 3 === 0) snore();
    }, 1600);
    return () => window.clearInterval(id);
  }, [asleep, reduce, burst]);

  const pet = (e: PointerEvent, strong: boolean) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    lastPet.current = Date.now();
    setPetted(true);
    later(() => Date.now() - lastPet.current >= 850 && setPetted(false), 900);
    const at = { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
    burst(asleep ? 'zzz' : 'hearts', strong ? 3 : 1, at);
    if (strong) play('squish');
    if (!asleep && Date.now() - lastPurr.current > 900) {
      lastPurr.current = Date.now();
      purr();
    }
    onPet?.(strong);
  };

  /** Plays one of the secret tricks: the move, the face, the sound and the sparkle. */
  const doTrick = (id: TrickId, dir = 1) => {
    if (asleep || !interactive || Date.now() < trickUntil.current) return;
    const ms = TRICK_MS[id];
    trickUntil.current = Date.now() + ms;
    setAction(null);
    setTrick({ id, dir });
    later(() => setTrick((t) => (t?.id === id ? null : t)), ms);
    if (id === 'jump') {
      boing();
      later(() => burst('stars', 4, { x: 50, y: 10 }), 300);
    }
    if (id === 'flip') {
      whoosh();
      later(() => burst('sparkles', 10, { x: 50, y: 30 }), 450);
      later(tada, 850);
    }
    if (id === 'slap') {
      slapSound();
      burst('stars', 4, { x: dir > 0 ? 22 : 78, y: 62 });
      later(sob, 250);
      [500, 1300, 2100, 2900].forEach((t) => later(() => burst('drops', 3, { x: 50, y: 55 }), t));
    }
    if (id === 'pancake') {
      flop();
      later(boing, 650);
    }
    if (id === 'dizzy') dizzySound();
    if (id === 'sneeze') {
      sneeze();
      later(() => burst('drops', 6, { x: 50, y: 66 }), 430);
    }
    if (id === 'tickle') {
      giggle();
      later(giggle, 700);
      burst('hearts', 3, { x: 50, y: 80 });
    }
    if (id === 'dance') {
      [523, 659, 784, 659, 523, 784].forEach((f, i) => later(() => tone(f, 0.18), i * 380));
      [0, 700, 1400].forEach((t) => later(() => burst('notes', 2, { x: 50, y: 25 }), t));
    }
    if (id === 'hug') {
      purr();
      later(purr, 700);
      burst('hearts', 8, { x: 50, y: 40 });
    }
    onTrick?.(id);
  };

  const pct = (e: PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100, cx: r.left + r.width / 2, cy: r.top + r.height * 0.55 };
  };

  const down = (e: PointerEvent) => {
    if (!interactive) return;
    // Keep following the finger even when a fast flick leaves him.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* fine */
    }
    const p = pct(e);
    const g = { x: e.clientX, y: e.clientY, t: Date.now(), moved: 0, sweep: 0, last: Math.atan2(e.clientY - p.cy, e.clientX - p.cx), done: false };
    gest.current = g;
    window.clearTimeout(longPress.current);
    longPress.current = window.setTimeout(() => {
      if (gest.current === g && g.moved < 14 && !g.done) {
        g.done = true;
        doTrick('hug');
      }
    }, 650);
    pet(e, true);
  };

  const move = (e: PointerEvent) => {
    const g = gest.current;
    if (!g || !(e.buttons & 1)) return;
    g.moved = Math.max(g.moved, Math.hypot(e.clientX - g.x, e.clientY - g.y));
    // Going round and round him: add up the angle the finger sweeps.
    const p = pct(e);
    const a = Math.atan2(e.clientY - p.cy, e.clientX - p.cx);
    let d = a - g.last;
    if (d > Math.PI) d -= 2 * Math.PI;
    if (d < -Math.PI) d += 2 * Math.PI;
    g.sweep += d;
    g.last = a;
    if (!g.done && Math.abs(g.sweep) > Math.PI * 3.6) {
      g.done = true;
      doTrick('dizzy');
    }
  };

  const up = (e: PointerEvent) => {
    const g = gest.current;
    gest.current = null;
    window.clearTimeout(longPress.current);
    if (!g || g.done || !interactive) return;
    const dt = Date.now() - g.t;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    const dist = Math.hypot(dx, dy);
    // A quick flick: across the face, up to the sky, or down onto him.
    if (dist > 55 && dt < 480) {
      if (Math.abs(dx) > Math.abs(dy) * 1.4) doTrick('slap', dx > 0 ? 1 : -1);
      else if (dy < 0) doTrick('flip');
      else doTrick('pancake');
      return;
    }
    if (dist > 14 || dt > 400) return;
    // A tap: where on him?
    const p = pct(e);
    const now = Date.now();
    if (Math.abs(p.x - 50) < 8 && Math.abs(p.y - faceY(grown, 140) * 100) < 6) return doTrick('sneeze');
    if (p.y > 90) return doTrick('dance');
    if (p.y > 76 && Math.abs(p.x - 50) < 26) {
      bellyTaps.current = [...bellyTaps.current.filter((t) => now - t < 1200), now];
      if (bellyTaps.current.length >= 3) {
        bellyTaps.current = [];
        doTrick('tickle');
      }
      return;
    }
    taps.current = [...taps.current.filter((t) => now - t < 380), now];
    if (taps.current.length >= 2) {
      taps.current = [];
      doTrick('jump');
    }
  };

  const face: Face = trick
    ? TRICK_FACE[trick.id]
    : asleep
      ? 'asleep'
      : food
        ? 'eating'
        : expect
          ? 'open'
          : yawning
            ? 'yawn'
            : petted
              ? 'happy'
              : mood;
  const svgClass = [
    `pig--${style}`,
    asleep && 'is-asleep',
    (mood === 'sad' || mood === 'sick') && !petted && 'is-sad',
    petted && !asleep && 'is-petted',
    food && 'is-eating',
    walking && 'is-walking',
  ]
    .filter(Boolean)
    .join(' ');
  const dist = Math.abs(walkX);

  return (
    <div
      className={`pig-actor style-${style} ${action && !trick ? `act-${action}` : ''} ${trick ? `trick-${trick.id}` : ''} ${potion ? `potion-${potion}` : ''} ${className}`}
      style={{ ...css, '--dir': trick?.dir ?? 1 } as CSSProperties}
    >
      <motion.div
        ref={box}
        className="relative"
        // Her finger belongs to him: no page scroll or pull-to-refresh, so flicks up and down reach him.
        style={{ touchAction: 'none' }}
        animate={{ x: `${walkX}%` }}
        transition={{ duration: walking ? 0.6 + dist / 30 : 0.4, ease: 'easeInOut' }}
        onAnimationComplete={() => setWalking(false)}
        onPointerDown={down}
        onPointerMove={(e) => {
          move(e);
          if (!interactive || !(e.buttons & 1) || Date.now() - lastPet.current < 180) return;
          // A fast flick is a trick, not a stroke: no hearts while it flies.
          const g = gest.current;
          if (g && g.moved > 24 && Date.now() - g.t < 480) return;
          pet(e, false);
        }}
        onPointerUp={up}
        onPointerCancel={() => {
          gest.current = null;
          window.clearTimeout(longPress.current);
        }}
      >
        <div className="pig-shadow" />
        {style === 'magic' && <div className="pig-aura" />}
        <div className="pig-float">
          <div className="pig-jump">
            <PigSvg {...look} mood={face} look={eyes} blush={petted || trick?.id === 'hug' ? 1 : 0} talk={talk} grown={grown} className={`w-full ${svgClass}`} />
          </div>
        </div>
        {style === 'magic' &&
          !reduce &&
          [
            { r: '58%', d: '7s', c: '#FFB3E1' },
            { r: '50%', d: '5s', c: '#FFE07A' },
            { r: '64%', d: '9s', c: '#B9A6FF' },
          ].map((o, i) => (
            <div key={i} className="pig-orbit" style={{ '--d': o.d, '--r': o.r, animationDelay: `-${i * 1.7}s` } as CSSProperties}>
              <span
                style={
                  {
                    color: o.c,
                    fontSize: 24,
                    textShadow: `0 0 8px ${o.c}, 0 0 2px #fff`,
                    '--r': `${box.current ? (box.current.clientWidth * parseFloat(o.r)) / 100 : 80}px`,
                  } as CSSProperties
                }
              >
                ✦
              </span>
            </div>
          ))}
        {trick?.id === 'dizzy' && (
          <div className="pig-dizzy-ring pointer-events-none absolute top-[4%] left-1/2 h-[14%] w-[46%]" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className="absolute top-1/2 left-1/2 text-[20px]" style={{ '--i': i } as CSSProperties}>
                ⭐
              </span>
            ))}
          </div>
        )}
        {food && (
          <span key={food.id} className="pig-food pointer-events-none absolute text-[40px] leading-none drop-shadow" style={{ left: '50%', top: `${Math.round(faceY(grown, 152) * 100)}%` }}>
            {food.e}
          </span>
        )}
        {need && !asleep && (
          <div
            className="pig-need pointer-events-none absolute -top-[8%] right-[-6%] flex items-center justify-center rounded-full bg-paper/95 text-[22px] shadow-soft"
            style={{ width: 44, height: 44 }}
          >
            {need}
            <span className="absolute -bottom-2 left-1.5 size-2.5 rounded-full bg-paper/95" />
            <span className="absolute -bottom-4 left-0 size-1.5 rounded-full bg-paper/95" />
          </div>
        )}
        {particles.map((p) => (
          <span
            key={p.id}
            className={`pfx ${p.fall ? 'pfx-fall' : ''}`}
            style={
              {
                left: `${p.x}%`,
                top: `${p.y}%`,
                fontSize: p.size,
                color: p.color,
                fontWeight: 800,
                '--dx': `${p.dx}px`,
                '--dy': `${p.dy}px`,
                '--rot': `${p.rot}deg`,
                '--d': `${p.d}s`,
              } as CSSProperties
            }
          >
            {p.e}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
