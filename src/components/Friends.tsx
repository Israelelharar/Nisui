import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { tap } from '../lib/haptics';
import { useApp } from '../hooks/useApp';
import { recordFind, usePet } from '../pet/usePet';
import { isFound, type FriendId } from '../pet/quests';
import { PigSvg, type Face } from '../pet/PigSvg';
import type { SpeciesId } from '../pet/species';
import { has } from '../client';
import { p } from '../lib/he';

/**
 * The hidden friends (pet/quests.ts): little characters that hide around the
 * site. Each is caught with a tap, does a happy jump, and never comes back.
 * They only exist once there is a pet (that's where the finds are kept).
 *
 * They are drawn with the pet's own puppet, as other animals in their own fur
 * and outfits, so they match the site's hand-drawn look.
 */
interface Look {
  species: SpeciesId;
  skin: string;
  head?: string;
  face?: string;
  neck?: string;
  mood?: Face;
  anim: string;
  /** Three of them in a row (the dancers). */
  trio?: boolean;
}

export const FRIEND_ART: Record<FriendId, Look> = {
  cat: { species: 'cat', skin: 'gray', mood: 'happy', anim: 'friend-dance' },
  angora: { species: 'guineaPig', skin: 'caramel', mood: 'smile', anim: 'friend-tilt' },
  kid: { species: 'bunny', skin: 'cloud', head: 'party', mood: 'happy', anim: 'friend-dance' },
  shocked: { species: 'dog', skin: 'oreo', mood: 'open', anim: 'friend-tilt' },
  goat: { species: 'cat', skin: 'cinnamon', head: 'bow', anim: 'friend-tilt' },
  girl: { species: 'dog', skin: 'choco', head: 'beanie', mood: 'asleep', anim: 'friend-tilt' },
  curly: { species: 'bunny', skin: 'peach', head: 'flowers', mood: 'smile', anim: 'friend-dance' },
  penguins: { species: 'guineaPig', skin: 'oreo', neck: 'bowtie', mood: 'happy', anim: 'friend-waddle', trio: true },
  hamster: { species: 'guineaPig', skin: 'honey', mood: 'dizzy', anim: 'friend-tilt' },
};

/**
 * Two days a week, picked anew each week (the same two for everyone that week):
 * for the shy friends that shouldn't be there every day.
 */
export function twiceAWeek(dayIndex: number, salt: string) {
  const week = Math.floor((dayIndex + 3) / 7);
  let h = 2166136261;
  for (const c of `${salt}:${week}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const a = (h >>> 0) % 7;
  const b = (a + 1 + ((h >>> 8) % 6)) % 7;
  const day = (((dayIndex + 3) % 7) + 7) % 7;
  return day === a || day === b;
}

/** Should this friend be on the page at all? */
function useHiding(id: FriendId) {
  const { pet } = usePet();
  return has('friends') && !!pet && !isFound(pet, id);
}

/** The friend itself, with its own little dance. */
export function FriendArt({ id, className = '', still = false }: { id: FriendId; className?: string; still?: boolean }) {
  const a = FRIEND_ART[id];
  const one = (k = 0) => <PigSvg key={k} species={a.species} skin={k === 1 ? 'zebra' : k === 2 ? 'gray' : a.skin} head={a.head} face={a.face} neck={a.neck} mood={a.mood} className="block h-full w-auto" />;
  return (
    <span className={`flex items-end justify-center ${still ? '' : a.anim} ${className}`}>
      {a.trio ? [0, 1, 2].map((k) => <span key={k} className="block h-[78%]">{one(k)}</span>) : one()}
    </span>
  );
}

/** The happy jump when one is caught: a spin, a pop and a ring of hearts. */
function Caught({ id, size }: { id: FriendId; size: number }) {
  return (
    <motion.div className="pointer-events-none relative" initial={{ scale: 1 }} animate={{ scale: [1, 1.35, 0], rotate: [0, -12, 20], y: [0, -30, -50] }} transition={{ duration: 0.9, times: [0, 0.4, 1] }} style={{ width: size, height: size }}>
      <FriendArt id={id} still className="size-full" />
      {Array.from({ length: 8 }, (_, i) => (
        <motion.span
          key={i}
          className="absolute top-1/2 left-1/2 text-accent"
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
          animate={{ x: Math.cos((i / 8) * Math.PI * 2) * size * 0.8, y: Math.sin((i / 8) * Math.PI * 2) * size * 0.8, opacity: 0, scale: 1.2 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden>
            <path d="M12 21s-7.5-4.6-9.4-9.3C1.2 8.3 3.4 5 6.8 5c2 0 3.6 1.1 5.2 3 1.6-1.9 3.2-3 5.2-3 3.4 0 5.6 3.3 4.2 6.7C19.5 16.4 12 21 12 21z" />
          </svg>
        </motion.span>
      ))}
    </motion.div>
  );
}

function useCatch(id: FriendId) {
  const [caught, setCaught] = useState(false);
  // Once the hearts are over it is gone for good, so nothing invisible is left lying over the page.
  const [gone, setGone] = useState(false);
  const grab = () => {
    if (caught) return;
    tap(18);
    recordFind(id);
    setCaught(true);
    window.setTimeout(() => setGone(true), 1000);
  };
  return { caught, grab, gone };
}

/**
 * Peeks in from the edge of the screen about every half minute, for a few
 * seconds. `side` is where it comes from.
 */
export function PeekFriend({
  id,
  side,
  size = 110,
  bottom = 140,
  every = 30_000,
  weekly = false,
}: {
  id: FriendId;
  side: 'left' | 'right' | 'bottom';
  size?: number;
  bottom?: number;
  every?: number;
  /** Only on two days a week. */
  weekly?: boolean;
}) {
  const { clock } = useApp();
  const today = !weekly || twiceAWeek(clock.dayIndex, id);
  const hiding = useHiding(id) && today;
  const [out, setOut] = useState(false);
  const { caught, grab, gone } = useCatch(id);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!hiding || caught) return;
    let t: number;
    const plan = (first: boolean) => {
      t = window.setTimeout(
        () => {
          setOut(true);
          t = window.setTimeout(() => {
            setOut(false);
            plan(false);
          }, 3600);
        },
        first ? 9000 + Math.random() * 8000 : every * (0.8 + Math.random() * 0.4),
      );
    };
    plan(true);
    return () => window.clearTimeout(t);
  }, [hiding, caught, every]);
  if (gone || (!hiding && !caught)) return null;

  const hidden = side === 'bottom' ? { y: size * 1.1 } : { x: side === 'right' ? size * 1.1 : -size * 1.1 };
  const shown = side === 'bottom' ? { y: size * 0.18 } : { x: side === 'right' ? size * 0.28 : -size * 0.28, rotate: side === 'right' ? -14 : 14 };
  return (
    // Clipped to the screen: in a right-to-left page anything poking out on the left would scroll sideways.
    <div
      className={`pointer-events-none fixed inset-x-0 flex overflow-hidden ${side === 'bottom' ? 'z-20 justify-center' : side === 'right' ? 'z-40 justify-end' : 'z-40 justify-start'}`}
      dir="ltr"
      style={{ bottom: `calc(env(safe-area-inset-bottom) + ${bottom}px)`, height: size * 1.15 }}
    >
      <AnimatePresence>
        {(out || caught) && (
          <motion.button
            type="button"
            aria-label="מישהו מציץ!"
            onClick={grab}
            className="pointer-events-auto block self-end"
            style={{ width: size, height: size }}
            initial={reduce ? { opacity: 0 } : hidden}
            animate={reduce ? { opacity: 1 } : shown}
            exit={reduce ? { opacity: 0 } : hidden}
            transition={{ type: 'spring', stiffness: 240, damping: 20 }}
          >
            {caught ? <Caught id={id} size={size} /> : <FriendArt id={id} className="size-full" />}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Walks across the bottom of the screen now and then (the dancers). */
export function ParadeFriend({ id, size = 120, bottom = 96, every = 30_000 }: { id: FriendId; size?: number; bottom?: number; every?: number }) {
  const hiding = useHiding(id);
  const [run, setRun] = useState(0);
  const { caught, grab, gone } = useCatch(id);
  useEffect(() => {
    if (!hiding || caught) return;
    let t: number;
    const next = (first: boolean) => {
      t = window.setTimeout(
        () => {
          setRun((r) => r + 1);
          next(false);
        },
        first ? 8000 + Math.random() * 6000 : every * (0.8 + Math.random() * 0.4),
      );
    };
    next(true);
    return () => window.clearTimeout(t);
  }, [hiding, caught, every]);
  if (gone || (!hiding && !caught)) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 z-40 overflow-hidden" style={{ bottom: `calc(env(safe-area-inset-bottom) + ${bottom}px)`, height: size * 1.3 }}>
      <AnimatePresence>
        {run > 0 && (
          <motion.button
            key={caught ? 'caught' : run}
            type="button"
            aria-label="מישהו עובר פה!"
            onClick={grab}
            className="pointer-events-auto absolute bottom-0"
            style={{ width: size * 1.5, height: size }}
            initial={{ left: '-45%' }}
            animate={caught ? undefined : { left: '110%' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 6.5, ease: 'linear' }}
            onAnimationComplete={() => !caught && setRun(0)}
          >
            {caught ? <Caught id={id} size={size} /> : <FriendArt id={id} className="size-full" />}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Counts taps on something (a title, the moon); on the third quick tap the
 * friend pops out. Put `<PopFriend>` inside a relatively positioned parent.
 */
export function useTripleTap() {
  const [open, setOpen] = useState(false);
  const taps = useRef<number[]>([]);
  const onTap = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 1200), now];
    if (taps.current.length >= 3) {
      taps.current = [];
      setOpen(true);
    }
  };
  return { open, onTap, close: () => setOpen(false) };
}

export function PopFriend({ id, open, onClose, size = 120, className = '' }: { id: FriendId; open: boolean; onClose: () => void; size?: number; className?: string }) {
  const hiding = useHiding(id);
  const { caught, grab, gone } = useCatch(id);
  useEffect(() => {
    if (!open || caught) return;
    // Not caught in time: back into hiding (knocking again brings it back).
    const t = window.setTimeout(onClose, 7000);
    return () => window.clearTimeout(t);
  }, [open, caught, onClose]);
  if (gone || (!hiding && !caught)) return null;
  return (
    <AnimatePresence>
      {(open || caught) && (
        <motion.button
          type="button"
          aria-label={p('תפוס אותי!', 'תפסי אותי!')}
          onClick={grab}
          className={`absolute z-30 ${className}`}
          style={{ width: size, height: size }}
          initial={{ scale: 0, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0, y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 16 }}
        >
          {caught ? <Caught id={id} size={size} /> : <FriendArt id={id} className="size-full" />}
        </motion.button>
      )}
    </AnimatePresence>
  );
}

/** Waits at the very end of a page, and stands up when the page is scrolled all the way down. */
export function EndFriend({ id, size = 110, children }: { id: FriendId; size?: number; children?: ReactNode }) {
  const hiding = useHiding(id);
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  const { caught, grab, gone } = useCatch(id);
  useEffect(() => {
    const el = ref.current;
    if (!el || !hiding) return;
    const io = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.9 });
    io.observe(el);
    return () => io.disconnect();
  }, [hiding]);
  if (gone || (!hiding && !caught)) return null;
  return (
    <div ref={ref} className="relative flex h-[110px] items-end justify-start overflow-hidden" aria-hidden={!seen}>
      {children}
      <motion.button
        type="button"
        aria-label="מישהו מחכה פה"
        onClick={grab}
        className="relative ms-3"
        style={{ width: size, height: size }}
        initial={{ y: size }}
        animate={{ y: seen || caught ? size * 0.12 : size }}
        transition={{ type: 'spring', stiffness: 200, damping: 18, delay: seen ? 0.4 : 0 }}
      >
        {caught ? <Caught id={id} size={size} /> : <FriendArt id={id} className="size-full" />}
      </motion.button>
    </div>
  );
}
