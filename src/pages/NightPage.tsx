import { ParadeFriend, PopFriend, useTripleTap } from '../components/Friends';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, Square } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { greetings, dailyQuestions } from '../content/daily';
import { openWhen } from '../content/openWhen';
import { pickDaily } from '../lib/daily';
import { OpenWhenSheet, useOpenWhen } from '../components/OpenWhen';
import { AnswerBox } from '../components/AnswerBox';
import { Sheet } from '../components/Sheet';
import { track } from '../lib/events';
import { tap } from '../lib/haptics';
import { bell } from '../pet/sound';
import { HEART_STARS, heartPoints, lightTonight, litNights, moonAt, moonPath } from '../lib/night';
import { NightIcon, type NightIconName } from '../night/icons';
import { SoundSheet, useSoundscape } from '../night/SoundSheet';
import { GoalsSheet, pendingReview } from '../night/GoalsSheet';
import { SOUNDS, soundscape } from '../night/sounds';
import { A, a, p } from '../lib/he';
import { phrases } from '../content/story';

const SheepCount = lazy(() => import('../night/SheepCount').then((m) => ({ default: m.SheepCount })));
const Crossing = lazy(() => import('../night/Crossing').then((m) => ({ default: m.Crossing })));
const Herding = lazy(() => import('../night/Herding').then((m) => ({ default: m.Herding })));

const GOLD = '#F2C27A';

/** Tonight's real moon, lit the way it actually is over Israel. */
function MoonDisc({ phase, size = 84 }: { phase: number; size?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden
      className="shrink-0 overflow-visible"
      animate={reduce ? undefined : { y: [0, -3, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
    >
      <defs>
        <radialGradient id="moon-glow">
          <stop offset="0.45" stopColor="#FFE3A8" stopOpacity="0.35" />
          <stop offset="1" stopColor="#FFE3A8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="moon-face" cx="0.4" cy="0.35">
          <stop offset="0" stopColor="#FFF6DE" />
          <stop offset="1" stopColor="#F0CF8E" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill="url(#moon-glow)" />
      <circle cx="50" cy="50" r="30" fill="#FFFFFF" opacity="0.06" />
      <path d={moonPath(phase, 50, 50, 30)} fill="url(#moon-face)" />
      {/* a few soft maria */}
      <g fill="#C9A66A" opacity="0.18">
        <circle cx="42" cy="40" r="5" />
        <circle cx="58" cy="56" r="7" />
        <circle cx="46" cy="62" r="3.5" />
      </g>
    </motion.svg>
  );
}

function Sparkle({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  return <path d={`M${x} ${y - s}Q${x} ${y} ${x + s} ${y}Q${x} ${y} ${x} ${y + s}Q${x} ${y} ${x - s} ${y}Q${x} ${y} ${x} ${y - s}Z`} fill={fill} />;
}

/** One star a night, one good night at a time, until the heart is whole. */
function HeartOfStars({ shown, fresh, whole }: { shown: number; fresh: boolean; whole: boolean }) {
  const pts = useMemo(() => heartPoints(), []);
  const reduce = useReducedMotion();
  const lit = pts.slice(0, shown);
  return (
    <svg viewBox="0 0 100 100" className="mx-auto block w-full max-w-[260px] overflow-visible" aria-hidden>
      <defs>
        <radialGradient id="star-glow">
          <stop offset="0" stopColor="#FFE9BE" stopOpacity="0.9" />
          <stop offset="1" stopColor="#FFE9BE" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="heart-fill" cx="0.5" cy="0.45">
          <stop offset="0" stopColor="#F29AB0" stopOpacity="0.28" />
          <stop offset="1" stopColor="#F29AB0" stopOpacity="0" />
        </radialGradient>
      </defs>
      {whole && <motion.ellipse cx="50" cy="55" rx="42" ry="40" fill="url(#heart-fill)" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 2 }} />}
      {lit.length > 1 && (
        <polyline
          points={(whole ? [...lit, lit[0]] : lit).map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={GOLD}
          strokeOpacity="0.4"
          strokeWidth="0.45"
          strokeDasharray="1.2 1.4"
          strokeLinecap="round"
        />
      )}
      {pts.map((p, i) => {
        const on = i < shown;
        const isNew = fresh && i === shown - 1;
        if (!on) return <circle key={i} cx={p.x} cy={p.y} r="1.1" fill="#F4F0FF" opacity="0.32" />;
        const big = i % 5 === 0 ? 3.2 : 2.4;
        return (
          <motion.g
            key={i}
            style={{ transformOrigin: `${p.x}px ${p.y}px`, transformBox: 'view-box' }}
            initial={isNew && !reduce ? { scale: 0, opacity: 0 } : false}
            animate={isNew && !reduce ? { scale: [0, 1.8, 1], opacity: 1 } : undefined}
            transition={{ duration: 1.2, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <circle cx={p.x} cy={p.y} r={big * 2.2} fill="url(#star-glow)" opacity="0.55" />
            <Sparkle x={p.x} y={p.y} s={big} fill={i === shown - 1 ? '#FFF6DE' : '#FFE3A8'} />
          </motion.g>
        );
      })}
    </svg>
  );
}

type Open = null | 'sounds' | 'goals' | 'sheep' | 'farm' | 'road';

/** One tile on the night shelf: a drawn icon on a soft disc, a name, and sometimes a badge. */
function ShelfTile({ icon, label, sub, badge, tilt, onClick, wide }: { icon: NightIconName; label: string; sub?: string; badge?: number; tilt: number; onClick: () => void; wide?: boolean }) {
  return (
    <motion.button
      type="button"
      onClick={() => {
        tap(8);
        onClick();
      }}
      whileTap={{ scale: 0.93, rotate: 0 }}
      style={{ rotate: tilt }}
      className={`relative flex items-center gap-3 rounded-[22px] border border-white/8 bg-night-paper/75 px-3 py-3 text-right backdrop-blur-[2px] ${wide ? 'col-span-2' : ''}`}
    >
      <span className="flex size-[50px] shrink-0 items-center justify-center rounded-full bg-white/[0.06] shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]">
        <NightIcon name={icon} size={38} />
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] leading-tight font-semibold">{label}</span>
        {sub && <span className="mt-0.5 block text-[11.5px] leading-tight text-white/50">{sub}</span>}
      </span>
      {!!badge && (
        <span className="absolute top-2 left-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#F29AB0] px-1.5 text-[11px] font-bold text-[#2A1A1E] tabular-nums">{badge}</span>
      )}
    </motion.button>
  );
}

/** A game: a wide card with its own colors, the icon big at the side. */
function GameCard({ icon, title, line, bg, onClick }: { icon: NightIconName; title: string; line: string; bg: string; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={() => {
        tap(8);
        onClick();
      }}
      whileTap={{ scale: 0.97 }}
      className="relative flex items-center gap-3.5 overflow-hidden rounded-[24px] border border-white/10 px-4 py-3.5 text-right shadow-[0_10px_30px_-12px_rgb(0_0_0/0.6)]"
      style={{ background: bg }}
    >
      <span className="flex size-16 shrink-0 items-center justify-center rounded-[20px] bg-white/10 shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]">
        <NightIcon name={icon} size={48} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-serif text-[19px] leading-tight">{title}</span>
        <span className="mt-0.5 block text-[13px] leading-snug text-white/65">{line}</span>
      </span>
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden className="shrink-0 text-white/50">
        <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </motion.button>
  );
}

/** The only dark screen: a real night sky to wind down under before the call and sleep. */
export function NightPage() {
  const { clock, nickname, showToast } = useApp();
  const g = pickDaily(greetings.night, clock.dayIndex, 'night-page');
  const question = pickDaily(dailyQuestions, clock.dayIndex, 'night-question');
  const bedtime = openWhen.find((c) => c.id === 'bedtime') ?? null;
  const ow = useOpenWhen();
  const [open, setOpen] = useState<Open>(null);
  const moon = useMemo(() => moonAt(), []);
  const { current: sound, left } = useSoundscape();
  const [pending, setPending] = useState(() => pendingReview(clock.contentDate));

  // the heart
  const [nights, setNights] = useState(litNights);
  const [fresh, setFresh] = useState(false);
  const tonight = nights.includes(clock.contentDate);
  const total = nights.length;
  const whole = tonight && total > 0 && total % HEART_STARS === 0;
  const shown = whole ? HEART_STARS : total % HEART_STARS;
  const heartNo = Math.floor((total - (whole ? 1 : 0)) / HEART_STARS) + 1;

  const sayGoodnight = () => {
    if (tonight) return;
    tap(14);
    const next = lightTonight(clock.contentDate);
    setNights(next);
    setFresh(true);
    [659, 784, 988, 1319].forEach((f, i) => bell(f, i * 0.16, 0.05, 2.4));
    track('goodnight', { n: String(((next.length - 1) % HEART_STARS) + 1) });
    const done = next.length % HEART_STARS === 0;
    showToast(done ? 'הלב שלם. 21 לילות טובים' : `שלחתי ל${a('ו', 'ה')} לילה טוב. ועכשיו ${p('תסתכל', 'תסתכלי')} למעלה…`);
    // a little gift from the sky
    window.setTimeout(() => window.dispatchEvent(new Event('night:shoot')), 2600);
  };

  // wishes on shooting stars
  const [wishing, setWishing] = useState(false);
  const [wish, setWish] = useState('');
  useEffect(() => {
    const onWish = () => {
      tap(20);
      [1047, 1319, 1568].forEach((f, i) => bell(f, i * 0.09, 0.05, 1.8));
      setWish('');
      setWishing(true);
    };
    window.addEventListener('night:wish', onWish);
    return () => window.removeEventListener('night:wish', onWish);
  }, []);
  const sendWish = (toHim: boolean) => {
    if (toHim && wish.trim()) track('wish', { text: wish.trim() });
    setWishing(false);
    showToast(toHim ? `המשאלה בדרך ${a('אליו', 'אליה')}` : `נשמר בסוד. רק ${p('אתה', 'את')} והכוכב יודעים.`);
  };

  const playing = SOUNDS.find((s) => s.id === sound);
  const moonKnock = useTripleTap();

  return (
    <div className="flex flex-col gap-5 text-white">
      <header className="flex items-start justify-between gap-3 pt-4">
        <div className="min-w-0">
          <h1 className="font-serif text-[32px] leading-tight text-balance">{g.title.replace('{n}', nickname)}</h1>
          <p className="mt-1 text-[15px] text-white/75">{g.sub}</p>
          <p className="mt-3 font-hand text-[13px] text-[#F2C27A]/90">
            {moon.name} · {Math.round(moon.lit * 100)}% מואר
            <span className="text-white/55"> · אותו ירח מעל שנינו</span>
          </p>
        </div>
        <div className="relative shrink-0" onClick={moonKnock.onTap}>
          <MoonDisc phase={moon.phase} />
          <PopFriend id="hamster" open={moonKnock.open} onClose={moonKnock.close} size={96} className="top-[70px] -left-2" />
        </div>
      </header>
      <ParadeFriend id="penguins" size={110} bottom={92} />

      {/* the ritual: a heart of stars, one per good night */}
      <section className="relative overflow-hidden rounded-[30px] border border-white/10 bg-gradient-to-b from-[#2A1C33]/45 to-night-paper/70 px-5 pt-5 pb-5">
        <div className="flex items-baseline justify-between">
          <p className="text-xs font-bold tracking-[2px] text-[#F29AB0]">הלב שלנו בשמיים</p>
          <p className="font-hand text-xs text-white/55 tabular-nums">
            {heartNo > 1 ? `לב ${heartNo} · ` : ''}
            {shown}/{HEART_STARS}
          </p>
        </div>
        <div className="my-2">
          <HeartOfStars shown={shown} fresh={fresh} whole={whole} />
        </div>
        <p className="text-center text-sm text-white/70">
          {whole
            ? 'הלב שלם. 21 לילות טובים. מחר מתחילים לב חדש.'
            : tonight
              ? 'הכוכב של הלילה דולק. נתראה מחר בלילה.'
              : 'כל לילה טוב מדליק עוד כוכב. 21 כוכבים, והלב שלם.'}
        </p>
        <motion.button
          type="button"
          onClick={sayGoodnight}
          disabled={tonight}
          whileTap={{ scale: 0.96 }}
          className="mt-4 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#F2C27A] font-bold text-[#2A1A1E] shadow-[0_8px_30px_rgb(242_194_122/0.25)] disabled:bg-white/8 disabled:text-white/60 disabled:shadow-none"
        >
          {tonight ? (
            <>
              <Check size={18} aria-hidden /> אמרת ל{a('ו', 'ה')} לילה טוב
            </>
          ) : (
            `לילה טוב, ${A}`
          )}
        </motion.button>
      </section>

      {/* the shelf: the quiet things for the night */}
      <section aria-label="המדף של הלילה">
        <p className="mb-2.5 px-1 text-xs font-bold tracking-[2px] text-[#9DBBE3]">המדף של הלילה</p>
        <div className="grid grid-cols-2 gap-2.5">
          <ShelfTile wide icon="sounds" label="צלילים להירדם" sub={playing ? 'מתנגן עכשיו' : 'ים, גשם, אח, צרצרים…'} tilt={-0.6} onClick={() => setOpen('sounds')} />
          <ShelfTile icon="goals" label="מטרות" sub={pending ? 'לסמן את היום' : 'למחר'} badge={pending} tilt={0.7} onClick={() => setOpen('goals')} />
          {bedtime && <ShelfTile icon="note" label="פתק" sub="לפני השינה" tilt={-0.5} onClick={() => ow.open(bedtime)} />}
        </div>
      </section>

      {/* games: three cards, each with its own little world */}
      <section aria-label="משחקים">
        <p className="mb-2.5 px-1 text-xs font-bold tracking-[2px] text-[#F2C27A]">משחקים לפני השינה</p>
        <div className="flex flex-col gap-2.5">
          <GameCard icon="road" title={`בדרך ל${A}`} line={`לחצות כבישים ונהרות, לאסוף פאוצ׳ים, ולהגיע ${a('אליו', 'אליה')}`} bg="linear-gradient(120deg,#2E4A3A,#3D5C46 60%,#4B4D57)" onClick={() => setOpen('road')} />
          <GameCard icon="sheep" title="לספור כבשים" line="חמישה סיבובים, ובכל אחד טריק" bg="linear-gradient(120deg,#1E2340,#2B2F55)" onClick={() => setOpen('sheep')} />
          <GameCard icon="farm" title={p('החוואי', 'החוואית')} line="להכניס את כל העדר לדיר ולסגור את השער" bg="linear-gradient(120deg,#22303F,#26402F)" onClick={() => setOpen('farm')} />
        </div>
      </section>

      <section className="rounded-3xl bg-night-paper px-5 py-5">
        <p className="text-xs font-bold tracking-[2px] text-[#9DBBE3]">שאלה לפני השינה</p>
        <p className="mt-2 font-serif text-[20px] leading-snug">{question}</p>
        <AnswerBox question={question} dark />
      </section>

      <div className="flex flex-col items-center gap-1 pt-2 text-center">
        {phrases[0] && <p dir="ltr" className="font-hand text-white/70">{phrases[0].text}</p>}
        <p className="text-xs text-white/40">ראית כוכב נופל? מהר, {p('לחץ', 'לחצי')} עליו.</p>
      </div>

      {/* now playing, floating above the nav */}
      <AnimatePresence>
        {playing && open !== 'sounds' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] z-30 mx-auto flex w-fit items-center gap-2 rounded-full border border-white/12 bg-[#1E2340]/90 py-1.5 ps-1.5 pe-2 shadow-[0_10px_30px_rgb(0_0_0/0.4)] backdrop-blur"
          >
            <button type="button" onClick={() => setOpen('sounds')} className="flex items-center gap-2">
              <NightIcon name={playing.id} size={30} />
              <span className="text-sm font-semibold">{playing.name}</span>
              <span className="text-xs text-white/55 tabular-nums">{left} דק׳</span>
            </button>
            <button type="button" aria-label="לעצור" onClick={() => soundscape.stop(true)} className="flex size-8 items-center justify-center rounded-full bg-white/12">
              <Square size={12} fill="currentColor" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <OpenWhenSheet card={ow.card} onClose={ow.close} />
      <SoundSheet open={open === 'sounds'} onClose={() => setOpen(null)} />
      <GoalsSheet
        open={open === 'goals'}
        onClose={() => {
          setOpen(null);
          setPending(pendingReview(clock.contentDate));
        }}
      />
      <Suspense fallback={null}>
        {open === 'sheep' && <SheepCount onClose={() => setOpen(null)} onFarm={() => setOpen('farm')} />}
        {open === 'farm' && <Herding onClose={() => setOpen(null)} />}
        {open === 'road' && <Crossing onClose={() => setOpen(null)} />}
      </Suspense>

      <Sheet open={wishing} onClose={() => setWishing(false)} title="תפסת כוכב נופל">
        <form
          className="flex flex-col gap-3 pb-4"
          onSubmit={(e) => {
            e.preventDefault();
            sendWish(true);
          }}
        >
          <p className="text-[15px] text-muted">יש לך משאלה אחת. מה {p('אתה מבקש', 'את מבקשת')}?</p>
          <label htmlFor="wish" className="sr-only">
            המשאלה
          </label>
          <input
            id="wish"
            value={wish}
            maxLength={80}
            onChange={(e) => setWish(e.target.value)}
            placeholder={`אני ${p('מבקש', 'מבקשת')} ש…`}
            className="h-12 rounded-xl border-[1.5px] border-line bg-paper px-3.5 text-[15px] outline-none focus:border-accent"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={!wish.trim()} className="h-12 flex-1 rounded-xl bg-accent font-bold text-white disabled:opacity-50">
              לספר ל{A}
            </button>
            <button type="button" onClick={() => sendWish(false)} className="h-12 flex-1 rounded-xl border-[1.5px] border-line font-bold text-muted">
              לשמור בסוד
            </button>
          </div>
        </form>
      </Sheet>

    </div>
  );
}
