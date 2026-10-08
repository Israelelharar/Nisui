import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { photos } from '../content/photos';
import { tap } from '../lib/haptics';
import { PigSvg } from './PigSvg';
import { PetIcon } from './icons';
import { bonk, chirp, coin, squeak, tone } from './sound';
import { FX, Hint, Stage, announceLevel, drawPig, rand, shuffle, useBanner, useCanvasLoop, usePigSprite, type GameProps } from './arcade/kit';
import { bomb, carrot, coinSprite, lettuce, onion, strawberry, watermelon } from './arcade/sprites';
import { species } from './species';
import { p } from '../lib/he';

export type { GameLook, GameResult } from './arcade/kit';

/* ───────────────────────── Catch the veggies ───────────────────────── */

interface Fall {
  x: number;
  y: number;
  v: number;
  rot: number;
  spin: number;
  kind: 'good' | 'treat' | 'gold' | 'bad' | 'bomb';
  look: number;
}
const BAD_LINES = [`בצל?! לא ל${species.plural}!`, 'איכס, בצל', 'רק לא בצל!'];

/**
 * תופסים ירקות: no clock. She steers him under the falling food; every 20 points
 * is a level: things fall faster and more onions join. An onion or a bomb costs a heart.
 */
export function CatchGame({ look, onEnd, onClose }: GameProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [sprite, pigNode] = usePigSprite(look, 'happy', 140);
  const [hud, setHud] = useState({ score: 0, hearts: 3, level: 1 });
  const [banner, show] = useBanner();
  const g = useRef({ x: 0.5, tx: 0.5, items: [] as Fall[], spawn: 0.6, score: 0, hearts: 3, level: 1, over: false, fx: new FX(), t: 0, munch: 0, hurt: 0 });

  useCanvasLoop(canvas, (ctx, w, h, dt) => {
    const s = g.current;
    s.t += dt;
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#CFE8FB');
    sky.addColorStop(1, '#FFF1C9');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    s.fx.pre(ctx, dt);
    // grass and a little fence far away
    ctx.fillStyle = '#A9DB8F';
    ctx.beginPath();
    ctx.moveTo(0, h - 60);
    for (let x = 0; x <= w; x += 20) ctx.lineTo(x, h - 60 + Math.sin(x * 0.05) * 6);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();
    ctx.fillStyle = '#8FCB74';
    ctx.fillRect(0, h - 24, w, 24);

    const lv = s.level;
    if (!s.over) {
      s.spawn -= dt;
      if (s.spawn <= 0) {
        s.spawn = Math.max(0.28, 0.85 - lv * 0.06) * rand(0.7, 1.2);
        const r = Math.random();
        const badShare = Math.min(0.36, 0.14 + lv * 0.025);
        const kind: Fall['kind'] = r < 0.04 ? 'gold' : r < 0.04 + badShare ? (lv >= 4 && Math.random() < 0.3 ? 'bomb' : 'bad') : r < 0.55 ? 'treat' : 'good';
        s.items.push({ x: rand(0.08, 0.92), y: -30, v: rand(150, 220) + lv * 22, rot: rand(-1, 1), spin: rand(-3, 3), kind, look: Math.floor(Math.random() * 3) });
      }
    }
    s.x += (s.tx - s.x) * Math.min(1, dt * 16);
    const px = s.x * w;
    const py = h - 70;
    for (let i = s.items.length - 1; i >= 0; i--) {
      const it = s.items[i];
      it.y += it.v * dt;
      it.rot += it.spin * dt;
      const ix = it.x * w;
      if (!s.over && it.y > py - 34 && it.y < py + 10 && Math.abs(ix - px) < 40) {
        s.items.splice(i, 1);
        if (it.kind === 'bad' || it.kind === 'bomb') {
          s.hearts -= 1;
          s.hurt = 0.6;
          s.fx.kick(it.kind === 'bomb' ? 18 : 10);
          s.fx.burst(ix, it.y, it.kind === 'bomb' ? ['#FFD45C', '#FF8A3D', '#555'] : ['#C98BC9', '#fff'], 16, 220);
          s.fx.text(px, py - 60, it.kind === 'bomb' ? 'בום!' : BAD_LINES[it.look], '#9E1F35');
          bonk();
          tap(40);
          if (s.hearts <= 0) {
            s.over = true;
            window.setTimeout(() => onEnd({ score: s.score, coins: Math.min(150, s.score * 2), level: s.level }), 800);
          }
        } else {
          const pts = it.kind === 'gold' ? 5 : it.kind === 'treat' ? 2 : 1;
          s.score += pts;
          s.munch = 0.25;
          s.fx.burst(ix, it.y, it.kind === 'gold' ? ['#FFE38A', '#F2C14E'] : ['#8FD06A', '#F08A2C', '#fff'], 10, 160, it.kind === 'gold' ? 'star' : 'dot');
          s.fx.text(ix, it.y - 20, `+${pts}`);
          if (it.kind === 'gold') coin();
          else chirp();
          tap(5);
          const nl = 1 + Math.floor(s.score / 20);
          if (nl > s.level) {
            s.level = nl;
            announceLevel(show, nl);
          }
        }
        setHud({ score: s.score, hearts: s.hearts, level: s.level });
        continue;
      }
      if (it.y > h + 40) {
        s.items.splice(i, 1);
        continue;
      }
      const r = 20;
      if (it.kind === 'bad') onion(ctx, ix, it.y, r, it.rot);
      else if (it.kind === 'bomb') bomb(ctx, ix, it.y, r, s.t);
      else if (it.kind === 'gold') coinSprite(ctx, ix, it.y, 15, s.t * 5);
      else if (it.kind === 'treat') (it.look ? strawberry : watermelon)(ctx, ix, it.y, r, it.rot);
      else (it.look ? carrot : lettuce)(ctx, ix, it.y, r, it.rot);
    }
    s.munch = Math.max(0, s.munch - dt);
    s.hurt = Math.max(0, s.hurt - dt);
    ctx.fillStyle = 'rgba(60,40,20,0.18)';
    ctx.beginPath();
    ctx.ellipse(px, h - 30, 36, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    const hop = Math.abs(Math.sin(s.t * 9)) * (Math.abs(s.tx - s.x) > 0.01 ? 6 : 1.5);
    if (!(s.hurt > 0 && Math.floor(s.t * 16) % 2)) drawPig(ctx, sprite, px, py - hop, 92, (s.tx - s.x) * -1.5, s.munch ? 0.9 : 1);
    s.fx.draw(ctx, dt);
    ctx.restore();
  });

  const steer = (e: React.PointerEvent) => {
    const r = canvas.current?.getBoundingClientRect();
    if (r) g.current.tx = Math.max(0.07, Math.min(0.93, (e.clientX - r.left) / r.width));
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') g.current.tx = Math.max(0.07, g.current.tx - 0.1);
      if (e.key === 'ArrowRight') g.current.tx = Math.min(0.93, g.current.tx + 0.1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <Stage title="תופסים ירקות" score={hud.score} hearts={hud.hearts} level={hud.level} onClose={onClose} banner={banner} bg="#CFE8FB">
      {pigNode}
      <canvas ref={canvas} dir="ltr" className="absolute inset-0 size-full touch-none" onPointerDown={steer} onPointerMove={steer} />
      <Hint show={hud.score < 3} className="top-1/3 text-ink/70">
        גוררים את האצבע. בצל מוריד לב!
      </Hint>
    </Stage>
  );
}

/* ───────────────────────── Memory with our photos ───────────────────────── */

/** Pairs on each level: 3, 4, 6, 8, 10, 12… */
const pairsFor = (level: number) => Math.min(12, [3, 4, 6, 8, 10, 12][level - 1] ?? 12);

/**
 * זיכרון של תמונות: a level is one board. Each level has more pairs, and from
 * level 4 the cards she has seen shuffle once in a while ("הקלפים מתערבבים!").
 */
export function MemoryGame({ level, onEnd, onClose }: GameProps) {
  const pairs = pairsFor(level);
  const deck = useMemo(() => {
    const pics = shuffle(photos).slice(0, pairs);
    return shuffle([...pics, ...pics].map((p, i) => ({ key: i, id: p.id, src: p.srcSmall, alt: p.alt })));
  }, [pairs]);
  const [open, setOpen] = useState<number[]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [over, setOver] = useState(false);
  const cols = pairs <= 3 ? 3 : pairs <= 8 ? 4 : 5;

  const flip = (i: number) => {
    if (over || open.length === 2 || open.includes(i) || done.includes(deck[i].id)) return;
    tap(6);
    chirp();
    const next = [...open, i];
    setOpen(next);
    if (next.length < 2) return;
    const m = moves + 1;
    setMoves(m);
    const [a, b] = next.map((k) => deck[k]);
    if (a.id === b.id) {
      const d = [...done, a.id];
      window.setTimeout(() => {
        setDone(d);
        setOpen([]);
        coin();
        if (d.length === pairs) {
          setOver(true);
          const par = pairs * 2;
          window.setTimeout(
            () => onEnd({ score: level, coins: 15 + pairs * 4 + Math.max(0, par - m) * 3, perfect: m <= pairs + 2, level: level + 1 }),
            600,
          );
        }
      }, 420);
    } else window.setTimeout(() => setOpen([]), Math.max(550, 950 - level * 60));
  };

  return (
    <Stage title="זיכרון של תמונות" level={level} score={`${moves}`} onClose={onClose}>
      <div className="h-full overflow-y-auto px-4 pb-6">
        <div className="mx-auto grid gap-2 pt-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, maxWidth: cols * 92 }}>
          {deck.map((c, i) => {
            const shown = open.includes(i) || done.includes(c.id);
            return (
              <button
                key={c.key}
                type="button"
                onClick={() => flip(i)}
                aria-label={shown ? c.alt : 'קלף סגור'}
                className="relative aspect-[3/4] [perspective:600px]"
              >
                <span
                  className="absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d]"
                  style={{ transform: shown ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
                >
                  <span className="absolute inset-0 flex items-center justify-center rounded-2xl bg-accent shadow-soft [backface-visibility:hidden]">
                    <span className="absolute inset-1.5 rounded-[12px] border-2 border-dashed border-white/35" />
                    <PetIcon name="cards" size={30} />
                  </span>
                  <span
                    className={`absolute inset-0 overflow-hidden rounded-2xl bg-paper shadow-soft [backface-visibility:hidden] [transform:rotateY(180deg)] ${done.includes(c.id) ? 'ring-4 ring-gold' : ''}`}
                  >
                    <img src={c.src} alt="" className="size-full object-cover" draggable={false} />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-center font-hand text-[15px] text-muted">
          {pairs} זוגות · כל זוג שמוצאים, עוד זיכרון שלנו 🧡
        </p>
      </div>
    </Stage>
  );
}

/* ───────────────────────── Where's the guinea pig? ───────────────────────── */

/**
 * איפה השרקן?: no clock. Tap him when he peeks; if he hides again before she taps,
 * or she taps the cat, a heart is gone. He gets quicker, and later two peek at once.
 */
export function PeekGame({ look, onEnd, onClose }: GameProps) {
  type Up = { hole: number; cat: boolean; id: number };
  const [ups, setUps] = useState<Up[]>([]);
  const upsRef = useRef<Up[]>([]);
  const [hud, setHud] = useState({ score: 0, hearts: 3, level: 1 });
  const s = useRef({ score: 0, hearts: 3, level: 1, over: false, n: 0 });
  const [banner, show] = useBanner();
  const [pops, setPops] = useState<{ id: number; hole: number; text: string }[]>([]);

  const setU = (u: Up[]) => {
    upsRef.current = u;
    setUps(u);
  };
  const lose = useCallback(() => {
    const st = s.current;
    if (st.over) return;
    st.hearts -= 1;
    bonk();
    tap(40);
    setHud((h) => ({ ...h, hearts: st.hearts }));
    if (st.hearts <= 0) {
      st.over = true;
      setU([]);
      window.setTimeout(() => onEnd({ score: st.score, coins: Math.min(150, st.score * 3), level: st.level }), 700);
    }
  }, [onEnd]);

  useEffect(() => {
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const t = window.setTimeout(() => {
        timers.delete(t);
        fn();
      }, ms);
      timers.add(t);
    };
    const spawn = () => {
      const st = s.current;
      if (st.over) return;
      const lv = st.level;
      const stay = Math.max(480, 1450 - lv * 100);
      const free = [...Array(9).keys()].filter((h) => !upsRef.current.some((u) => u.hole === h));
      const count = lv >= 4 && Math.random() < 0.35 ? 2 : 1;
      for (let k = 0; k < count && free.length; k++) {
        const hole = free.splice(Math.floor(Math.random() * free.length), 1)[0];
        const u: Up = { hole, cat: Math.random() < Math.min(0.32, 0.15 + lv * 0.02), id: st.n++ };
        setU([...upsRef.current, u]);
        later(() => {
          if (upsRef.current.some((x) => x.id === u.id)) {
            setU(upsRef.current.filter((x) => x.id !== u.id));
            // on the first level he just hides again; later a missed peek costs a heart
            if (!u.cat && s.current.level >= 2) lose();
          }
        }, stay);
      }
      later(spawn, stay * 0.55 + rand(220, 520));
    };
    later(spawn, 700);
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [lose]);

  const whack = (hole: number) => {
    const u = upsRef.current.find((x) => x.hole === hole);
    if (!u || s.current.over) return;
    setU(upsRef.current.filter((x) => x.id !== u.id));
    const id = Date.now() + hole;
    if (u.cat) {
      setPops((p) => [...p, { id, hole, text: DECOY.say }]);
      lose();
    } else {
      const st = s.current;
      st.score += 1;
      squeak();
      tap(8);
      setPops((p) => [...p, { id, hole, text: species.sound }]);
      const nl = 1 + Math.floor(st.score / 12);
      if (nl > st.level) {
        st.level = nl;
        announceLevel(show, nl);
      }
      setHud((h) => ({ ...h, score: st.score, level: st.level }));
    }
    window.setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 700);
  };

  return (
    <Stage title={`איפה ה${species.name}?`} score={hud.score} hearts={hud.hearts} level={hud.level} onClose={onClose} banner={banner} bg="linear-gradient(#DDF2CF, #B9E19E)">
      <div className="grid grid-cols-3 gap-3 px-4 pt-8">
        {Array.from({ length: 9 }, (_, i) => {
          const u = ups.find((x) => x.hole === i);
          const pop = pops.find((p) => p.hole === i);
          return (
            <button key={i} type="button" onPointerDown={() => whack(i)} aria-label={`חור ${i + 1}`} className="relative aspect-square overflow-hidden rounded-full">
              <span className="absolute inset-x-[10%] bottom-[12%] h-[36%] rounded-[50%] bg-[#5C3A25] shadow-[inset_0_8px_10px_rgb(0_0_0/0.45)]" />
              <span className="absolute inset-x-[14%] bottom-[18%] transition-transform duration-150 ease-out" style={{ transform: `translateY(${u ? '0%' : '115%'})` }}>
                {u && (u.cat ? DECOY.art : <PigSvg {...look} mood="happy" className="w-full" />)}
              </span>
              <span className="absolute inset-x-0 bottom-0 h-[19%] bg-[#9FD58C]" />
              {pop && <span className="pointer-events-none absolute inset-x-0 top-1 font-hand text-[17px] font-bold text-accent">{pop.text}</span>}
            </button>
          );
        })}
      </div>
      <p className="mt-6 text-center text-[14px] text-ink/60">{hud.level < 2 ? `${species.name} = נקודה · ${DECOY.name} = לב` : `${species.name} = נקודה · מפספסים אותו או נוגעים ב${DECOY.name} = לב`}</p>
    </Stage>
  );
}

/** Who keeps photobombing: a grumpy ginger cat, or (when the pet is a cat) a grumpy dog. */
const DECOY =
  species.id === 'cat'
    ? { name: 'כלב', say: 'הב! 😾', art: <PigSvg species="dog" skin="choco" mood="sad" className="w-full" /> }
    : { name: 'חתול', say: 'מיאו! 😾', art: <CatFace /> };

/** The ginger cat. */
function CatFace() {
  return (
    <svg viewBox="0 0 100 90" className="w-full" aria-hidden>
      <path d="M18 34 14 6l26 16M82 34l4-28-26 16" fill="#F2A65A" stroke="#3B2216" strokeWidth="3" strokeLinejoin="round" />
      <ellipse cx="50" cy="52" rx="38" ry="34" fill="#F2A65A" stroke="#3B2216" strokeWidth="3" />
      <path d="M38 30c4 4 4 8 0 12M62 30c-4 4-4 8 0 12M50 26v12" stroke="#D9853A" strokeWidth="4" strokeLinecap="round" />
      <path d="M30 50l10 3M70 50l-10 3" stroke="#3B2216" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M46 62h8l-4 4Z" fill="#E86A7A" stroke="#3B2216" strokeWidth="2" />
      <path d="M50 66c-3 5-9 5-11 2M50 66c3 5 9 5 11 2" stroke="#3B2216" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/* ───────────────────────── Simon says (the guinea pig says) ───────────────────────── */

const PADS = [
  { icon: 'carrot', bg: '#FFB86B', f: 392 },
  { icon: 'lettuce', bg: '#9BE59B', f: 494 },
  { icon: 'strawberry', bg: '#FF8FA3', f: 587 },
  { icon: 'blueberry', bg: '#8FB5FF', f: 698 },
] as const;

/** השרקן אומר: the sequence grows by one each round and plays faster; one mistake ends it. */
export function SimonGame({ onEnd, onClose }: GameProps) {
  const [seq, setSeq] = useState<number[]>(() => [Math.floor(Math.random() * 4)]);
  const [lit, setLit] = useState<number | null>(null);
  const [turn, setTurn] = useState<'watch' | 'play' | 'over'>('watch');
  const pos = useRef(0);
  const [banner, show] = useBanner();

  useEffect(() => {
    if (turn !== 'watch') return;
    let i = 0;
    let t: number;
    const step = () => {
      if (i >= seq.length) {
        setLit(null);
        pos.current = 0;
        setTurn('play');
        return;
      }
      const p = seq[i++];
      setLit(p);
      tone(PADS[p].f, 0.35);
      t = window.setTimeout(
        () => {
          setLit(null);
          t = window.setTimeout(step, Math.max(90, 180 - seq.length * 6));
        },
        Math.max(240, 540 - seq.length * 22),
      );
    };
    t = window.setTimeout(step, 750);
    return () => window.clearTimeout(t);
  }, [turn, seq]);

  const press = (p: number) => {
    if (turn !== 'play') return;
    tap(8);
    tone(PADS[p].f, 0.25);
    setLit(p);
    window.setTimeout(() => setLit(null), 180);
    if (seq[pos.current] !== p) {
      bonk();
      setTurn('over');
      const score = seq.length - 1;
      window.setTimeout(() => onEnd({ score, coins: score * 7 }), 700);
      return;
    }
    pos.current += 1;
    if (pos.current === seq.length) {
      coin();
      if (seq.length % 5 === 0) announceLevel(show, seq.length / 5 + 1, 'יותר מהר');
      setTurn('watch');
      setSeq((s) => [...s, Math.floor(Math.random() * 4)]);
    }
  };

  return (
    <Stage title={`ה${species.name} אומר`} score={seq.length - 1} onClose={onClose} banner={banner} bg="linear-gradient(#F4EBFF, #FFF7F1)">
      <p className="mt-4 mb-5 text-center font-hand text-[19px]">{turn === 'watch' ? `${p('תסתכל', 'תסתכלי')} טוב…` : turn === 'play' ? `עכשיו ${p('אתה', 'את')}!` : 'אוי!'}</p>
      <div className="mx-auto grid max-w-[340px] grid-cols-2 gap-3 px-4">
        {PADS.map((p, i) => (
          <button
            key={p.icon}
            type="button"
            onPointerDown={() => press(i)}
            aria-label={p.icon}
            className="flex aspect-square items-center justify-center rounded-[28px] shadow-[inset_0_-8px_0_rgb(0_0_0/0.12)] transition-all duration-150"
            style={{
              background: p.bg,
              opacity: lit === i ? 1 : 0.6,
              transform: lit === i ? 'scale(1.06)' : 'scale(1)',
              boxShadow: lit === i ? `0 0 0 6px ${p.bg}55, 0 0 30px ${p.bg}` : undefined,
            }}
          >
            <PadIcon kind={p.icon} />
          </button>
        ))}
      </div>
    </Stage>
  );
}

/** The four pads' fruit, drawn once onto a small canvas. */
function PadIcon({ kind }: { kind: (typeof PADS)[number]['icon'] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    c.width = 160;
    c.height = 160;
    if (kind === 'carrot') carrot(ctx, 80, 84, 56, 0.5);
    else if (kind === 'lettuce') lettuce(ctx, 80, 80, 52);
    else if (kind === 'strawberry') strawberry(ctx, 80, 84, 56);
    else {
      for (const [x, y] of [
        [62, 92],
        [98, 92],
        [80, 62],
      ]) {
        ctx.beginPath();
        ctx.arc(x, y, 24, 0, Math.PI * 2);
        ctx.fillStyle = '#4C66C9';
        ctx.fill();
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#3B2216';
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y - 6, 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }, [kind]);
  return <canvas ref={ref} className="size-[62%]" aria-hidden />;
}

