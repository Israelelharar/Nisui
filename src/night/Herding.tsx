import { quest } from '../lib/quest';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { Meadow } from './Meadow';
import { Sheep, type SheepKind } from './Sheep';
import { Farmer } from './Farmer';
import { bleat, chime, gate as gateSound } from './sfx';
import { tap } from '../lib/haptics';
import { p } from '../lib/he';

/**
 * The farmer game. The farmer (the partner) runs where the finger points; the sheep flock
 * (boids: stay apart, stay together, follow the others) and flee. The player
 * steers them through the gate into the pen, then shuts it. If the gate is open
 * they can wander right back out.
 */
const FLOCK: { kind: SheepKind; cap?: boolean }[] = [
  { kind: 'white' },
  { kind: 'admin' },
  { kind: 'white', cap: true },
  { kind: 'partner' },
  { kind: 'black' },
  { kind: 'white' },
  { kind: 'admin', cap: true },
  { kind: 'partner' },
];
const S = 62; // sheep size
const SR = 15; // sheep radius for the fence
const FEET_S = S * 0.82 * (75 / 82);
const F = 52; // farmer size
const FEET_F = F * 1.62 * (89 / 98);
const BEST = 'idw:herd:best';

interface Agent {
  x: number;
  y: number;
  vx: number;
  vy: number;
  inside: boolean;
  face: number;
  scaredAt: number;
  grazeUntil: number;
  wander: number;
}

export function Herding({ onClose }: { onClose: () => void }) {
  const stage = useRef<HTMLDivElement>(null);
  const sheepEls = useRef<(HTMLDivElement | null)[]>([]);
  const alertEls = useRef<(HTMLDivElement | null)[]>([]);
  const farmerEl = useRef<HTMLDivElement>(null);
  const gateEl = useRef<SVGGElement>(null);
  const dustLayer = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [inPen, setInPen] = useState(0);
  const [open, setOpen] = useState(true);
  const [won, setWon] = useState<null | { secs: number; best: number | null }>(null);
  const [hint, setHint] = useState(true);
  const openRef = useRef(true);
  const target = useRef<{ x: number; y: number } | null>(null);
  const started = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const pen = box && {
    L: box.w * 0.12,
    R: box.w * 0.88,
    T: box.h * 0.2,
    B: box.h * 0.4,
    gx: box.w / 2,
    gh: 50,
  };

  useEffect(() => {
    if (!box || !pen) return;
    const { w, h } = box;
    const minY = h * 0.15;
    const maxY = h - 26;
    const sheep: Agent[] = FLOCK.map((_, i) => ({
      x: w * (0.18 + 0.64 * Math.random()),
      y: h * (0.55 + 0.35 * Math.random()),
      vx: 0,
      vy: 0,
      inside: false,
      face: i % 2 ? 1 : -1,
      scaredAt: 0,
      grazeUntil: 0,
      wander: Math.random() * Math.PI * 2,
    }));
    const farmer: Agent = { x: w / 2, y: h * 0.86, vx: 0, vy: 0, inside: false, face: 1, scaredAt: 0, grazeUntil: 0, wander: 0 };
    let last = performance.now();
    let raf = 0;
    let lastBleat = 0;
    let lastDust = 0;
    let finished = false;
    let count = -1;

    const doorway = (x: number, y: number, r: number) => openRef.current && Math.abs(x - pen.gx) < pen.gh - r * 0.6 && y > pen.B - r * 2.2 && y < pen.B + r * 2.2;

    /** Keep an agent on the right side of the fence (or in the doorway). */
    const fence = (a: Agent, r: number) => {
      if (doorway(a.x, a.y, r)) {
        a.inside = a.y < pen.B;
        // the gateposts: stay inside the opening while passing through
        const lo = pen.gx - pen.gh + r * 0.6;
        const hi = pen.gx + pen.gh - r * 0.6;
        if (a.x < lo) a.x = lo;
        if (a.x > hi) a.x = hi;
        return;
      }
      if (a.inside) {
        if (a.x < pen.L + r) (a.x = pen.L + r), (a.vx = Math.abs(a.vx) * 0.3);
        if (a.x > pen.R - r) (a.x = pen.R - r), (a.vx = -Math.abs(a.vx) * 0.3);
        if (a.y < pen.T + r) (a.y = pen.T + r), (a.vy = Math.abs(a.vy) * 0.3);
        if (a.y > pen.B - r * 0.6) (a.y = pen.B - r * 0.6), (a.vy = -Math.abs(a.vy) * 0.3);
      } else if (a.x > pen.L - r && a.x < pen.R + r && a.y > pen.T - r && a.y < pen.B + r * 0.8) {
        // push out the shortest way
        const dl = a.x - (pen.L - r);
        const dr = pen.R + r - a.x;
        const dt = a.y - (pen.T - r);
        const db = pen.B + r * 0.8 - a.y;
        const m = Math.min(dl, dr, dt, db);
        if (m === db) (a.y = pen.B + r * 0.8), (a.vy = Math.abs(a.vy) * 0.3);
        else if (m === dt) (a.y = pen.T - r), (a.vy = -Math.abs(a.vy) * 0.3);
        else if (m === dl) (a.x = pen.L - r), (a.vx = -Math.abs(a.vx) * 0.3);
        else (a.x = pen.R + r), (a.vx = Math.abs(a.vx) * 0.3);
      }
    };

    const dust = (x: number, y: number, dir: number) => {
      const layer = dustLayer.current;
      if (!layer) return;
      const d = document.createElement('span');
      d.className = 'dust-puff absolute rounded-full bg-[#C9B48A]/50';
      const s = 8 + Math.random() * 8;
      d.style.cssText += `left:${x - s / 2}px;top:${y - s}px;width:${s}px;height:${s}px;--dx:${-dir * (3 + Math.random() * 4)}px`;
      layer.appendChild(d);
      window.setTimeout(() => d.remove(), 650);
    };

    const frame = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      // ── farmer
      const tgt = target.current;
      let fs = 0;
      if (tgt && !finished) {
        const dx = tgt.x - farmer.x;
        const dy = tgt.y - farmer.y;
        const d = Math.hypot(dx, dy);
        if (d > 6) {
          const sp = Math.min(230, d * 5);
          farmer.vx = (dx / d) * sp;
          farmer.vy = (dy / d) * sp;
        } else farmer.vx = farmer.vy = 0;
      } else farmer.vx = farmer.vy = 0;
      farmer.x += farmer.vx * dt;
      farmer.y += farmer.vy * dt;
      farmer.x = Math.max(16, Math.min(w - 16, farmer.x));
      farmer.y = Math.max(minY, Math.min(maxY, farmer.y));
      fence(farmer, 16);
      fs = Math.hypot(farmer.vx, farmer.vy);
      if (Math.abs(farmer.vx) > 8) farmer.face = farmer.vx > 0 ? 1 : -1;
      if (fs > 60 && now - lastDust > 90) {
        lastDust = now;
        dust(farmer.x, farmer.y, farmer.face);
      }

      // ── sheep
      let inside = 0;
      sheep.forEach((a, i) => {
        let ax = 0;
        let ay = 0;
        let cx = 0,
          cy = 0,
          cn = 0,
          avx = 0,
          avy = 0;
        for (let j = 0; j < sheep.length; j++) {
          if (j === i) continue;
          const b = sheep[j];
          if (b.inside !== a.inside) continue;
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d = Math.hypot(dx, dy) || 0.01;
          if (d < 36) {
            ax += (dx / d) * (36 - d) * 9;
            ay += (dy / d) * (36 - d) * 9;
          }
          if (d < 150) {
            cx += b.x;
            cy += b.y;
            avx += b.vx;
            avy += b.vy;
            cn++;
          }
        }
        if (cn) {
          ax += (cx / cn - a.x) * 0.55;
          ay += (cy / cn - a.y) * 0.55;
          ax += (avx / cn - a.vx) * 0.6;
          ay += (avy / cn - a.vy) * 0.6;
        }
        // flee the farmer
        const fdx = a.x - farmer.x;
        const fdy = a.y - farmer.y;
        const fd = Math.hypot(fdx, fdy) || 0.01;
        const scared = !a.inside || doorway(a.x, a.y, SR) ? fd < 130 : fd < 70;
        if (scared) {
          const k = ((130 - fd) / 130) * 900;
          ax += (fdx / fd) * k;
          ay += (fdy / fd) * k;
          if (now - a.scaredAt > 2500) {
            a.scaredAt = now;
            const al = alertEls.current[i];
            if (al) {
              al.classList.remove('sheep-alert');
              void al.offsetWidth;
              al.classList.add('sheep-alert');
            }
            if (now - lastBleat > 700) {
              lastBleat = now;
              bleat(0.9 + (i % 4) * 0.12, 0.08);
            }
          }
        } else {
          // a lazy wander, and in the pen a gentle pull to the middle
          a.wander += (Math.random() - 0.5) * 0.3;
          ax += Math.cos(a.wander) * 14;
          ay += Math.sin(a.wander) * 14;
          if (a.inside) {
            ax += ((pen.L + pen.R) / 2 - a.x) * 0.25;
            ay += ((pen.T + pen.B) / 2 - 10 - a.y) * 0.4;
          }
        }
        // walls
        if (a.x < 30) ax += (30 - a.x) * 12;
        if (a.x > w - 30) ax -= (a.x - (w - 30)) * 12;
        if (a.y < minY + 10) ay += (minY + 10 - a.y) * 12;
        if (a.y > maxY - 10) ay -= (a.y - (maxY - 10)) * 12;

        a.vx = (a.vx + ax * dt) * 0.94;
        a.vy = (a.vy + ay * dt) * 0.94;
        const sp = Math.hypot(a.vx, a.vy);
        const max = scared ? 150 : 34;
        if (sp > max) {
          a.vx = (a.vx / sp) * max;
          a.vy = (a.vy / sp) * max;
        }
        a.x += a.vx * dt;
        a.y += a.vy * dt;
        a.x = Math.max(14, Math.min(w - 14, a.x));
        a.y = Math.max(minY, Math.min(maxY, a.y));
        fence(a, SR);
        if (a.inside && a.y < pen.B - 4) inside++;

        const el = sheepEls.current[i];
        if (el) {
          const speed = Math.hypot(a.vx, a.vy);
          if (Math.abs(a.vx) > 6) a.face = a.vx < 0 ? 1 : -1; // the sheep art faces left
          let state = speed > 75 ? 'run' : speed > 12 ? 'walk' : 'idle';
          if (state === 'idle') {
            if (now > a.grazeUntil && Math.random() < 0.004) a.grazeUntil = now + 1800 + Math.random() * 2500;
            if (now < a.grazeUntil) state = 'graze';
          }
          if (finished) state = 'idle';
          if (el.dataset.state !== state) el.dataset.state = state;
          el.style.transform = `translate(${a.x - S / 2}px, ${a.y - FEET_S}px) scaleX(${a.face})`;
          el.style.zIndex = String(Math.round(a.y));
          const al = alertEls.current[i];
          if (al) al.style.transform = `translate(${a.x - 6}px, ${a.y - FEET_S - 18}px)`;
        }
      });

      const fe = farmerEl.current;
      if (fe) {
        const st = finished ? 'cheer' : fs > 20 ? 'run' : 'idle';
        if (fe.dataset.state !== st) fe.dataset.state = st;
        fe.style.transform = `translate(${farmer.x - F / 2}px, ${farmer.y - FEET_F}px) scaleX(${farmer.face})`;
        fe.style.zIndex = String(Math.round(farmer.y));
      }

      if (inside !== count) {
        count = inside;
        setInPen(inside);
      }
      if (!finished && !openRef.current && inside === sheep.length) {
        finished = true;
        const secs = Math.round((now - (started.current ?? now)) / 1000);
        let best: number | null = null;
        try {
          best = Number(localStorage.getItem(BEST)) || null;
          if (!best || secs < best) localStorage.setItem(BEST, String(secs));
        } catch {
          /* fine */
        }
        quest('farm');
        window.setTimeout(() => {
          chime([523, 659, 784, 1047, 1319, 1568]);
          bleat(1.2, 0.1);
          setWon({ secs, best });
        }, 500);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [box?.w, box?.h]);

  const point = (e: React.PointerEvent) => {
    const r = stage.current!.getBoundingClientRect();
    target.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    if (started.current == null) quest('farm_play');
    started.current ??= performance.now();
    if (hint) setHint(false);
  };

  const toggleGate = () => {
    tap(14);
    gateSound();
    openRef.current = !openRef.current;
    setOpen(openRef.current);
  };

  const total = FLOCK.length;
  const all = inPen === total;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex justify-center bg-[#0F1430]" dir="rtl" role="dialog" aria-modal="true" aria-label={`${p('החוואי', 'החוואית')} והכבשים`}>
      <div
        ref={stage}
        className="relative h-full w-full max-w-[520px] touch-none overflow-hidden text-white select-none"
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          point(e);
        }}
        onPointerMove={(e) => e.buttons && point(e)}
      >
        <Meadow ground={0.15} top />
        {box && pen && <Pen pen={pen} open={open} gateRef={gateEl} />}
        <div ref={dustLayer} className="pointer-events-none absolute inset-0" style={{ zIndex: 5 }} />
        {FLOCK.map((s, i) => (
          <Sheep key={i} ref={(el) => void (sheepEls.current[i] = el)} kind={s.kind} cap={s.cap} size={S} />
        ))}
        {FLOCK.map((_, i) => (
          <div key={`a${i}`} ref={(el) => void (alertEls.current[i] = el)} className="pointer-events-none absolute top-0 left-0" style={{ zIndex: 2000 }}>
            <span className="block font-serif text-lg font-bold text-[#F2C27A] opacity-0 [text-shadow:0_1px_0_#2E2226]">!</span>
          </div>
        ))}
        <Farmer ref={farmerEl} size={F} />

        {/* top bar */}
        <div className="absolute inset-x-0 top-0 z-[3000] flex items-center justify-between px-4 pt-[max(14px,env(safe-area-inset-top))]" onPointerDown={(e) => e.stopPropagation()}>
          <button type="button" onClick={onClose} aria-label="סגירה" className="flex size-11 items-center justify-center rounded-full bg-white/10 backdrop-blur active:scale-90">
            <X size={20} />
          </button>
          <motion.p key={inPen} initial={{ scale: 1.25 }} animate={{ scale: 1 }} className="rounded-full bg-black/30 px-4 py-1.5 font-bold tabular-nums backdrop-blur">
            בדיר {inPen}/{total}
          </motion.p>
        </div>

        {/* the gate button */}
        <div className="absolute inset-x-0 bottom-[max(18px,env(safe-area-inset-bottom))] z-[3000] flex justify-center px-6" onPointerDown={(e) => e.stopPropagation()}>
          {!won && (
            <motion.button
              type="button"
              onClick={toggleGate}
              animate={all && open ? { scale: [1, 1.07, 1] } : { scale: 1 }}
              transition={all && open ? { duration: 0.9, repeat: Infinity } : {}}
              className={`h-13 rounded-full px-7 font-bold shadow-[0_8px_24px_rgb(0_0_0/0.35)] active:scale-95 ${all && open ? 'bg-[#F2C27A] text-[#2A1A1E]' : 'bg-[#1B1830]/80 text-white backdrop-blur'}`}
            >
              {open ? (all ? 'כולן בפנים! לסגור את השער' : 'לסגור את השער') : 'לפתוח את השער'}
            </motion.button>
          )}
        </div>

        <AnimatePresence>
          {hint && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-x-6 top-[48%] z-[3000] rounded-[24px] bg-[#1B1830]/85 p-4 text-center backdrop-blur"
            >
              <p className="font-serif text-xl">{p('אתה החוואי', 'את החוואית')}</p>
              <p className="mt-1 text-[15px] text-white/75">{p('גרור', 'גררי')} את האצבע, {p('ואתה רץ', 'ואת רצה')} לשם. הכבשים בורחות ממך, אז {p('תעקוף', 'תעקפי')} אותן {p('ותדחוף', 'ותדחפי')} אותן לשער. כשכולן בפנים, סגרי אותו.</p>
            </motion.div>
          )}
          {won && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
              className="absolute inset-x-4 bottom-[max(20px,env(safe-area-inset-bottom))] z-[3000] rounded-[28px] border border-white/12 bg-[#1B1830]/90 p-5 text-center backdrop-blur-xl"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <h2 className="font-serif text-[26px] leading-tight">כל הכבשים בבית</h2>
              <p className="mt-1 text-[15px] text-white/75">
                {won.secs} שניות.{' '}
                {won.best && won.secs < won.best ? 'שיא חדש!' : won.best ? `השיא שלך: ${won.best} שניות.` : p('החוואי הכי טוב בעמק.', 'החוואית הכי טובה בעמק.')}
              </p>
              <p className="mt-2 font-hand text-[#F2C27A]">עכשיו כולן ישנות, וגם {p('אתה', 'את')}. לילה טוב, {p('חוואי', 'חוואית')}</p>
              <button type="button" onClick={onClose} className="mt-4 h-13 w-full rounded-2xl bg-[#F2C27A] font-bold text-[#2A1A1E] active:scale-[0.97]">
                לילה טוב
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        {won && <Hearts />}
      </div>
    </div>,
    document.body,
  );
}

/** The pen: back and side fences behind the sheep, the front fence and the gate in front of them. */
function Pen({ pen, open, gateRef }: { pen: { L: number; R: number; T: number; B: number; gx: number; gh: number }; open: boolean; gateRef: React.RefObject<SVGGElement | null> }) {
  const { L, R, T, B, gx, gh } = pen;
  const W = R - L;
  const posts = (x1: number, x2: number) => {
    const n = Math.max(2, Math.round((x2 - x1) / 34));
    return Array.from({ length: n + 1 }, (_, i) => x1 + ((x2 - x1) * i) / n);
  };
  const line = '#2E2226';
  const rail = (x1: number, x2: number, y: number) => (
    <g key={`${x1}-${y}`}>
      <rect x={x1} y={y} width={x2 - x1} height="6" rx="2" fill="#A97A52" stroke={line} strokeWidth="1.6" />
      <path d={`M${x1 + 2} ${y + 2}H${x2 - 2}`} stroke="#E2B98C" strokeWidth="1" opacity=".5" />
    </g>
  );
  const post = (x: number, top: number, h = 34) => <path key={`p${x}-${top}`} d={`M${x - 4} ${top + h}V${top + 4}l4-5 4 5v${h - 4}z`} fill="#C08A5C" stroke={line} strokeWidth="1.6" strokeLinejoin="round" />;
  return (
    <>
      {/* straw on the floor of the pen */}
      <div className="pointer-events-none absolute rounded-[10px]" style={{ left: L, top: T, width: W, height: B - T, zIndex: 1, background: 'repeating-linear-gradient(-30deg, #6E6A3A 0 3px, #5E5A30 3px 7px)', opacity: 0.55 }} />
      {/* back + sides */}
      <svg className="pointer-events-none absolute top-0 left-0 overflow-visible" style={{ zIndex: Math.round(T) - 30 }} width="1" height="1" aria-hidden>
        {rail(L, R, T - 26)}
        {rail(L, R, T - 14)}
        {posts(L, R).map((x) => post(x, T - 34))}
        {/* sides, drawn as a run of posts going down */}
        {posts(T - 4, B - 20).map((y) => post(L, y - 30, 30))}
        {posts(T - 4, B - 20).map((y) => post(R, y - 30, 30))}
      </svg>
      {/* front fence with the gap and the gate */}
      <svg className="pointer-events-none absolute top-0 left-0 overflow-visible" style={{ zIndex: Math.round(B) + 6 }} width="1" height="1" aria-hidden>
        {rail(L, gx - gh, B - 26)}
        {rail(L, gx - gh, B - 14)}
        {rail(gx + gh, R, B - 26)}
        {rail(gx + gh, R, B - 14)}
        {[...posts(L, gx - gh), ...posts(gx + gh, R)].map((x) => post(x, B - 34))}
        {/* gate posts, a bit taller, with lanterns */}
        {[gx - gh, gx + gh].map((x) => (
          <g key={`g${x}`}>
            <path d={`M${x - 5} ${B}V${B - 40}l5-6 5 6v40z`} fill="#B07E52" stroke={line} strokeWidth="1.8" strokeLinejoin="round" />
            <circle cx={x} cy={B - 52} r="5" fill="#FFE3A8" />
            <circle cx={x} cy={B - 52} r="14" fill="#FFE3A8" opacity=".18" />
          </g>
        ))}
        {/* the gate swings from the right post */}
        <g ref={gateRef} style={{ transform: `rotate(${open ? 78 : 0}deg)`, transformOrigin: `${gx + gh - 4}px ${B - 14}px`, transition: 'transform 0.55s cubic-bezier(.3,1.5,.5,1)' }}>
          <rect x={gx - gh + 4} y={B - 30} width={gh * 2 - 8} height="6" rx="2" fill="#C99A68" stroke={line} strokeWidth="1.6" />
          <rect x={gx - gh + 4} y={B - 16} width={gh * 2 - 8} height="6" rx="2" fill="#C99A68" stroke={line} strokeWidth="1.6" />
          <path d={`M${gx - gh + 8} ${B - 12}L${gx + gh - 8} ${B - 28}`} stroke="#B07E52" strokeWidth="5" strokeLinecap="round" />
          <path d={`M${gx - gh + 8} ${B - 12}L${gx + gh - 8} ${B - 28}`} stroke={line} strokeWidth="1.2" strokeLinecap="round" opacity=".5" />
          <rect x={gx - gh + 2} y={B - 34} width="7" height="28" rx="2" fill="#B07E52" stroke={line} strokeWidth="1.6" />
        </g>
      </svg>
    </>
  );
}

/** Hearts drifting up when the gate shuts on a full pen. */
function Hearts() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[2500] overflow-hidden" aria-hidden>
      {Array.from({ length: 16 }, (_, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 24 24"
          width={14 + (i % 4) * 6}
          className="absolute"
          style={{ left: `${(i * 37) % 100}%`, bottom: -30 }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: -700 - (i % 5) * 60, opacity: [0, 1, 1, 0], x: [0, (i % 2 ? 1 : -1) * 20, 0] }}
          transition={{ duration: 3.4 + (i % 4) * 0.5, delay: i * 0.12, ease: 'easeOut' }}
        >
          <path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11z" fill={i % 3 ? '#F29AB0' : '#F2C27A'} />
        </motion.svg>
      ))}
    </div>
  );
}
