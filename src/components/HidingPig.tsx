import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { easterEggs } from '../content/story';
import { useEgg } from '../hooks/useApp';
import { tap } from '../lib/haptics';
import { mama, squeak, toot } from '../pet/sound';
import { PigSvg } from '../pet/PigSvg';
import { usePet } from '../pet/usePet';
import { species } from '../pet/species';
import { P } from '../lib/he';

/**
 * The pet hides behind the site's cards and buttons and peeks out over their
 * top edge, whole head out, never over another button or over text. Tap him
 * and he does one of his tricks (shuffled, so the order changes), then runs
 * off to hide somewhere else:
 *   run   . just bolts, with one of his lines
 *   mama  . screams "אמאאאאא" in a tiny bubble
 *   toot  . a very small toot, and a white trail that fades in 2.5s
 * He wears his own fur and outfit from the pet room.
 */
const W = 76;
const H = Math.round((W * 225) / 200);
/** How much of him stays below the edge while peeking: the head (≈ top 58%) is out. */
const PEEK = 0.42;
type Trick = 'run' | 'mama' | 'toot';
type P = { x: number; y: number };
interface Spot {
  el: HTMLElement;
  /** Offset of his left edge from the element's left edge. */
  dx: number;
}
interface Runner {
  id: number;
  from: P;
  to: P;
  kind: 'pig';
  ms: number;
}

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
const shuffle = <T,>(a: T[]) => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const INTERACTIVE = 'button, a, input, textarea, select, label, [role="button"], [role="tab"], nav, [data-pig]';
/** Below the screen: the same rule, checked against the rectangles of nearby buttons and letters. */
function offscreenClear(card: HTMLElement, left: number, edge: number) {
  const head = { l: left, r: left + W, t: edge - H * (1 - PEEK), b: edge - 2 };
  const hits = (r: DOMRect) => r.right > head.l && r.left < head.r && r.bottom > head.t && r.top < head.b;
  const main = document.querySelector('main')!;
  for (const el of main.querySelectorAll(INTERACTIVE + ', img, svg')) if (!card.contains(el) && !el.contains(card) && hits(el.getBoundingClientRect())) return false;
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (!n.textContent?.trim() || card.contains(n)) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) if (hits(r)) return false;
  }
  return true;
}

/** Is there an actual letter under this point (not just the empty end of a paragraph's box)? */
function letterAt(el: Element, x: number, y: number) {
  for (const n of el.childNodes) {
    if (n.nodeType !== 3 || !n.textContent?.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    for (const r of range.getClientRects()) {
      if (x > r.left - 6 && x < r.right + 6 && y > r.top - 4 && y < r.bottom + 4) return true;
    }
  }
  return false;
}

/** Would his head, standing on this edge, cover nothing she needs (no button, no text)? */
function clearAbove(card: HTMLElement, left: number, edge: number) {
  const top = edge - H * (1 - PEEK);
  if (left < 6 || left + W > window.innerWidth - 6 || top < 70) return false;
  // below the screen we can't look; scroll there and check in place
  if (edge > window.innerHeight - 90) return offscreenClear(card, left, edge);
  for (const fx of [0.1, 0.3, 0.5, 0.7, 0.9]) {
    for (const fy of [0.05, 0.35, 0.65, 0.95]) {
      const x = left + W * fx;
      const y = top + (edge - 3 - top) * fy;
      const hit = document.elementFromPoint(x, y);
      if (!hit) continue;
      if (card.contains(hit) || hit.closest(INTERACTIVE) || letterAt(hit, x, y)) return false;
      const t = hit.tagName;
      if (t === 'IMG' || t === 'svg' || t === 'path' || t === 'CANVAS' || t === 'VIDEO') return false;
    }
  }
  return true;
}

/** On screen if possible; otherwise somewhere further down the page (she'll find him when she scrolls). */
function findSpot(avoid?: HTMLElement | null): Spot | null {
  return findSpotIn(avoid, window.innerHeight - 130) ?? findSpotIn(avoid, window.innerHeight * 2.5);
}

function findSpotIn(avoid: HTMLElement | null | undefined, maxTop: number): Spot | null {
  const main = document.querySelector('main');
  if (!main) return null;
  const cands = shuffle(
    [...main.querySelectorAll<HTMLElement>('section, button, a, [class*="rounded"]')].filter((el) => {
      if (el === avoid || el.closest('[data-pig]')) return false;
      const r = el.getBoundingClientRect();
      return r.width >= 120 && r.height >= 44 && r.top > 110 && r.top < maxTop;
    }),
  ).slice(0, 50);
  for (const el of cands) {
    const r = el.getBoundingClientRect();
    for (const dx of shuffle([12, 0.25, 0.5, 0.75, r.width - W - 12].map((v) => (v < 1 ? (r.width - W) * v : v)))) {
      if (dx >= 6 && clearAbove(el, r.left + dx, r.top)) return { el, dx };
    }
  }
  return null;
}

/** Where his box sits on the page (document coordinates), from the element he hides behind. */
const place = (s: Spot) => {
  const r = s.el.getBoundingClientRect();
  return { left: r.left + window.scrollX + s.dx, top: r.top + window.scrollY - H };
};

export function HidingPig() {
  const { pathname } = useLocation();
  const reduce = !!useReducedMotion();
  const say = useEgg(easterEggs.pet?.lines ?? [species.sound]);
  const { pet } = usePet();
  const look = { skin: pet?.skin ?? 'classic', head: pet?.wear?.head, face: pet?.wear?.face, neck: pet?.wear?.neck };
  const [spot, setSpot] = useState<Spot | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const [mode, setMode] = useState<'hidden' | 'peek' | 'out'>('hidden');
  const [bubble, setBubble] = useState<string | null>(null);
  const [runner, setRunner] = useState<Runner | null>(null);
  const [trail, setTrail] = useState<{ id: number; d: string; ms: number } | null>(null);
  const busy = useRef(false);
  const bag = useRef<Trick[]>([]);

  const nextTrick = (): Trick => {
    if (!bag.current.length) bag.current = shuffle(['run', 'mama', 'toot'] as Trick[]);
    let t = bag.current.shift()!;
    const forced = import.meta.env.DEV ? (new URLSearchParams(location.search).get('pigtrick') as Trick | null) : null;
    if (forced) t = forced;
    return t;
  };

  const hideAt = useCallback((s: Spot | null) => {
    setSpot(s);
    setPos(s ? place(s) : null);
    setMode('hidden');
    if (s) window.setTimeout(() => setMode('peek'), 60);
  }, []);

  // Arrive on a page: wait a moment, then find somewhere to hide. No spot yet? Try again after she scrolls.
  useEffect(() => {
    hideAt(null);
    busy.current = false;
    let tries = 0;
    let timer = 0;
    const attempt = () => {
      if (busy.current) return;
      const s = findSpot();
      if (s) {
        hideAt(s);
        window.removeEventListener('scroll', onScroll);
      } else if (++tries < 4) timer = window.setTimeout(attempt, 1500);
    };
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(attempt, 700);
    };
    timer = window.setTimeout(attempt, reduce ? 300 : 2200);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [pathname, reduce, hideAt]);

  // Keep him glued to his card when the page around it moves (images load, sections open).
  useEffect(() => {
    if (!spot) return;
    const update = () => {
      if (!spot.el.isConnected) return hideAt(null);
      setPos(place(spot));
    };
    const ro = new ResizeObserver(update);
    ro.observe(document.body);
    window.addEventListener('resize', update);
    const iv = window.setInterval(update, 1000);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
      window.clearInterval(iv);
    };
  }, [spot, hideAt]);

  /** The middle of his head on screen right now. */
  const headNow = (): P | null => (pos ? { x: pos.left - window.scrollX + W / 2, y: pos.top - window.scrollY + H * 0.45 } : null);

  const runTo = async (from: P, kind: Runner['kind'], withTrail: boolean) => {
    const next = findSpot(spot?.el);
    if (!next) {
      // nowhere else to go on this screen: back behind the same card
      setRunner(null);
      if (spot) hideAt(spot);
      return;
    }
    const r = next.el.getBoundingClientRect();
    const to = { x: r.left + next.dx + W / 2, y: r.top - H * (1 - PEEK) / 2 };
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const ms = reduce ? 0 : Math.min(1100, 380 + dist * 1.1);
    setSpot(null);
    setPos(null);
    setMode('hidden');
    if (withTrail) {
      const mx = (from.x + to.x) / 2;
      const my = Math.min(from.y, to.y) - 40;
      setTrail({ id: Date.now(), d: `M ${from.x} ${from.y + H * 0.35} Q ${mx} ${my + H * 0.35} ${to.x} ${to.y + H * 0.35}`, ms });
      window.setTimeout(() => setTrail(null), ms + 2500);
    }
    setRunner({ id: Date.now(), from, to, kind, ms });
    await wait(ms);
    setRunner(null);
    hideAt(next);
  };

  const onTap = async () => {
    if (busy.current || mode !== 'peek') return;
    busy.current = true;
    tap(10);
    const trick = nextTrick();
    const from = headNow();
    if (!from) return void (busy.current = false);
    setMode('out');
    if (trick === 'mama') {
      mama();
      setBubble('אמאאאאא');
      await wait(1500);
      setBubble(null);
      await runTo(headNow() ?? from, 'pig', false);
    } else if (trick === 'toot') {
      await wait(220);
      toot();
      tap(25);
      await wait(380);
      await runTo(headNow() ?? from, 'pig', true);
    } else {
      squeak();
      say();
      await wait(320);
      await runTo(headNow() ?? from, 'pig', false);
    }
    busy.current = false;
  };

  return createPortal(
    <>
      {pos && (
        <div data-pig className="pointer-events-none absolute z-[15] overflow-hidden" style={{ left: pos.left, top: pos.top, width: W, height: H }}>
          <motion.button
            type="button"
            aria-label={`ה${species.name} של ${P} מציץ`}
            onClick={onTap}
            initial={{ y: '102%' }}
            animate={mode === 'hidden' ? { y: '102%' } : mode === 'out' ? { y: '24%', rotate: [0, -6, 6, 0] } : { y: `${PEEK * 100}%`, rotate: reduce ? 0 : [0, -5, 0, 4, 0] }}
            transition={
              mode === 'peek' && !reduce
                ? { y: { type: 'spring', stiffness: 160, damping: 15 }, rotate: { duration: 2.4, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' } }
                : reduce
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 260, damping: 16 }
            }
            className="pointer-events-auto absolute inset-0 block origin-bottom"
          >
            <PigSvg {...look} mood="smile" className="h-full w-full drop-shadow-[0_4px_10px_rgb(42_26_20/0.25)]" />
          </motion.button>
        </div>
      )}

      <AnimatePresence>
        {bubble && pos && (
          <motion.div
            key="bubble"
            data-pig
            initial={{ opacity: 0, scale: 0.4, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotate: [-3, 3, -3] }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 420, damping: 14, rotate: { duration: 0.25, repeat: Infinity } }}
            className="pointer-events-none absolute z-[16] rounded-2xl bg-white px-3 py-1 text-[19px] font-extrabold whitespace-nowrap text-[#3a2228] shadow-paper"
            style={{ left: pos.left + W / 2, top: pos.top - 26, translateX: '-50%', colorScheme: 'light' }}
          >
            {bubble}
            <span aria-hidden className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 bg-white" />
          </motion.div>
        )}
      </AnimatePresence>

      {trail && (
        <svg data-pig aria-hidden className="pointer-events-none fixed inset-0 z-[14] h-full w-full">
          {/* a soft grey shadow under the white, so the trail shows on cream cards too */}
          {[
            { w: 13, c: 'rgb(90 60 80 / 0.28)', blur: 3 },
            { w: 8, c: 'white', blur: 0.8 },
          ].map((l, i) => (
            <motion.path
              key={`${trail.id}-${i}`}
              d={trail.d}
              fill="none"
              stroke={l.c}
              strokeWidth={l.w}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 1 }}
              animate={{ pathLength: 1, opacity: [1, 1, 0] }}
              transition={{ pathLength: { duration: trail.ms / 1000, ease: 'easeOut' }, opacity: { duration: (trail.ms + 2500) / 1000, times: [0, trail.ms / (trail.ms + 2500), 1] } }}
              style={{ filter: `blur(${l.blur}px)` }}
            />
          ))}
        </svg>
      )}

      {runner && <RunnerSprite key={runner.id} r={runner} reduce={reduce} look={look} />}
    </>,
    document.body,
  );
}

/** Him dashing across the screen between hiding places, leaning into the run. */
function RunnerSprite({ r, reduce, look }: { r: Runner; reduce: boolean; look: { skin: string; head?: string; face?: string; neck?: string } }) {
  const right = r.to.x > r.from.x;
  return (
    <motion.div
      data-pig
      aria-hidden
      className="pointer-events-none fixed z-[17]"
      style={{ width: W, height: H, marginLeft: -W / 2, marginTop: -H * 0.45 }}
      initial={{ left: r.from.x, top: r.from.y }}
      animate={{ left: r.to.x, top: r.to.y }}
      transition={{ duration: r.ms / 1000, ease: [0.45, 0.05, 0.4, 1] }}
    >
      <motion.div
        className="h-full w-full drop-shadow-[0_6px_10px_rgb(42_26_20/0.25)]"
        animate={reduce ? { y: 0 } : { y: [0, -14, 0], rotate: right ? 10 : -10 }}
        transition={{ duration: 0.24, repeat: Infinity }}
      >
        <PigSvg {...look} mood="happy" className="h-full w-full" />
      </motion.div>
    </motion.div>
  );
}
