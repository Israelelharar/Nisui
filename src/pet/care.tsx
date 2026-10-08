import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Sheet } from '../components/Sheet';
import { tap } from '../lib/haptics';
import { care, drink, WATER_GOAL, type PetState } from './engine';
import { PetIcon, type IconName } from './icons';
import { describe, personalityOf, traitSlots } from './personality';
import { PigSvg } from './PigSvg';
import type { Run } from './sheets';
import { bell, chirp } from './sound';
import { species } from './species';
import { A, P, p } from '../lib/he';

/* ───────────── "גם את/ה": the partner looks after themselves, the pet grows from it ───────────── */

const CHECKS: { id: string; label: string; icon: IconName; says: string }[] = [
  { id: 'outside', label: 'יצאתי קצת לאוויר', icon: 'sun', says: `${p('ספר', 'ספרי')} לי איך היה בחוץ! פה רק יש ${species.staple.name} 🌤️` },
  { id: 'meal', label: 'אכלתי ארוחה טובה', icon: 'carrot', says: `יופי! אכלנו ביחד, ${p('אתה', 'את')} ואני 🥕` },
  { id: 'move', label: 'זזתי קצת', icon: 'ball', says: `גם אני ${species.happyMove} לכבודך!` },
  { id: 'sleep', label: 'ישנתי טוב', icon: 'moon', says: `שינה זה הדבר הכי חשוב. ככה אומרים כל ה${species.plural}` },
  { id: 'joy', label: `עשיתי משהו שאני ${p('אוהב', 'אוהבת')}`, icon: 'heart', says: 'זה מה שאני הכי רוצה בשבילך 🧡' },
];

const MOODS: { id: string; label: string; mouth: string; color: string; says: string }[] = [
  { id: 'great', label: 'מעולה', mouth: 'M15 27c4 6 14 6 18 0', color: '#8FD49B', says: 'וואו! השמחה שלך מדבקת. אני קופץ! 🎉' },
  { id: 'good', label: 'טוב', mouth: 'M16 28c4 3 12 3 16 0', color: '#B9DE8A', says: 'יום טוב זה יום מצוין. נשמור עליו 🌼' },
  { id: 'meh', label: 'ככה ככה', mouth: 'M16 29h16', color: '#F2D27A', says: 'ככה ככה זה גם בסדר. אני פה איתך' },
  { id: 'low', label: 'לא משהו', mouth: 'M16 31c4-3 12-3 16 0', color: '#F2A97A', says: 'רוצה לנשום איתי רגע? זה עוזר לי תמיד 🫧' },
  { id: 'hard', label: 'קשה', mouth: 'M15 32c4-5 14-5 18 0', color: '#E98A8A', says: 'אני כאן, ולא הולך לשום מקום. חיבוק ענק 🤍' },
];

function Face({ mouth, color }: { mouth: string; color: string }) {
  return (
    <svg viewBox="0 0 48 48" width={40} height={40} aria-hidden>
      <circle cx="24" cy="24" r="20" fill={color} stroke="#3B2216" strokeWidth="2.4" />
      <circle cx="17" cy="20" r="2.4" fill="#3B2216" />
      <circle cx="31" cy="20" r="2.4" fill="#3B2216" />
      <path d={mouth} fill="none" stroke="#3B2216" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function CareSheet({
  open,
  onClose,
  pet,
  run,
  onBreathe,
  onReact,
}: {
  open: boolean;
  onClose: () => void;
  pet: PetState;
  run: Run;
  onBreathe: () => void;
  onReact: (text: string, kind: 'drink' | 'care') => void;
}) {
  const done = (id: string) => pet.daily.care.includes(id);
  const sip = () => {
    if (pet.daily.water >= WATER_GOAL) return;
    tap(10);
    bell(880 + pet.daily.water * 90, 0, 0.05, 0.5);
    run((p, out) => drink(p, out));
    onReact(pet.daily.water + 1 >= WATER_GOAL ? `שמונה כוסות! ${p('אתה', 'את')} מעיין 💧` : 'גם אני שותה! גלוג גלוג 💧', 'drink');
  };
  const check = (id: string, says: string) => {
    if (done(id)) return;
    tap(12);
    chirp();
    run((p, out) => care(p, id, out));
    onReact(says, 'care');
  };

  return (
    <Sheet open={open} onClose={onClose} title={`גם ${p('אתה', 'את')}`}>
      <p className="-mt-2 mb-4 text-[14px] leading-snug text-muted">
        {pet.name} גדל כש{p('אתה דואג', 'את דואגת')} לעצמך. כל דבר טוב שעשית היום שווה זרעים, ומשמח גם אותו.
      </p>

      {/* water */}
      <section className="mb-4 rounded-3xl bg-[#EAF6FD] p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <h3 className="font-serif text-[19px]">מים היום</h3>
          <span className="text-[13px] font-bold text-[#2F7FB0] tabular-nums">
            {pet.daily.water}/{WATER_GOAL}
          </span>
        </div>
        <div className="flex justify-between">
          {Array.from({ length: WATER_GOAL }, (_, i) => {
            const full = i < pet.daily.water;
            return (
              <button
                key={i}
                type="button"
                onClick={sip}
                disabled={i !== pet.daily.water}
                aria-label={full ? 'כוס ששתית' : i === pet.daily.water ? 'שתיתי עוד כוס' : 'כוס ריקה'}
                className={`transition-transform active:scale-90 ${full ? '' : i === pet.daily.water ? 'animate-pulse' : 'opacity-40'}`}
              >
                <svg viewBox="0 0 30 40" width={30} height={40} aria-hidden>
                  <path d="M4 4h22l-3 32H7Z" fill="rgb(255 255 255 / 0.9)" stroke="#3B2216" strokeWidth="2" strokeLinejoin="round" />
                  {full && <path d="M5.6 14h18.8l-2.2 21H7.8Z" fill="#6EC1F2" />}
                  <path d="M8 8l1.4 22" stroke="rgb(255 255 255 / 0.8)" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            );
          })}
        </div>
      </section>

      {/* breathing */}
      <button
        type="button"
        onClick={onBreathe}
        className="mb-4 flex w-full items-center gap-3 rounded-3xl bg-[#F1ECFA] p-4 text-right active:scale-[0.99]"
      >
        <span className="breath-dot size-11 shrink-0 rounded-full bg-[#C8B6EC]" />
        <span className="flex-1">
          <span className="block font-serif text-[19px]">לנשום איתו דקה</span>
          <span className="text-[13px] text-muted">{done('breathe') ? 'נשמת היום ✓ אפשר שוב, תמיד' : `הוא מתנפח ומתכווץ, ו${p('אתה נושם', 'את נושמת')} איתו`}</span>
        </span>
      </button>

      {/* checks */}
      <section className="mb-4 flex flex-col gap-2">
        {CHECKS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => check(c.id, c.says)}
            aria-pressed={done(c.id)}
            className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-right transition-colors ${done(c.id) ? 'bg-[#E3F3E3]' : 'bg-paper shadow-soft'}`}
          >
            <PetIcon name={c.icon} size={30} />
            <span className={`flex-1 text-[15.5px] ${done(c.id) ? 'text-[#3E7A3A]' : ''}`}>{c.label}</span>
            <span
              className={`flex size-6 items-center justify-center rounded-full border-2 text-[13px] font-bold ${done(c.id) ? 'border-[#3E7A3A] bg-[#3E7A3A] text-white' : 'border-line'}`}
            >
              {done(c.id) ? '✓' : ''}
            </span>
          </button>
        ))}
      </section>

      {/* mood */}
      <section className="pb-6">
        <h3 className="mb-1 font-serif text-[19px]">איך {p('אתה מרגיש', 'את מרגישה')}?</h3>
        <p className="mb-3 text-[12.5px] text-muted">רק {pet.name} שומע. מה שבחרת לא נשמר בשום מקום.</p>
        <div className="flex justify-between">
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                tap(10);
                if (!done('mood')) run((p, out) => care(p, 'mood', out, 5));
                onReact(m.says, 'care');
                if (m.id === 'low' || m.id === 'hard') window.setTimeout(onBreathe, 1800);
                else onClose();
              }}
              className="flex flex-col items-center gap-1 transition-transform active:scale-90"
            >
              <Face mouth={m.mouth} color={m.color} />
              <span className="text-[11.5px] text-muted">{m.label}</span>
            </button>
          ))}
        </div>
      </section>
    </Sheet>
  );
}

/* ───────────── Breathing together ───────────── */

const IN = 4;
const OUT = 6;
const ROUNDS = 6;

export function Breathing({
  look,
  name,
  onClose,
  onDone,
}: {
  look: { skin: string; head?: string; face?: string; neck?: string };
  name: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const reduce = useReducedMotion();
  const [t, setT] = useState(0);
  const total = (IN + OUT) * ROUNDS;
  const finished = t >= total;
  useEffect(() => {
    if (finished) {
      onDone();
      const id = window.setTimeout(onClose, 2600);
      return () => window.clearTimeout(id);
    }
    const id = window.setTimeout(() => setT((x) => x + 1), 1000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, finished]);
  const inCycle = t % (IN + OUT);
  const inhale = inCycle < IN;
  // A soft bell at the turn of each breath.
  useEffect(() => {
    if (finished) return bell(523, 0, 0.05, 2);
    if (inCycle === 0) bell(392, 0, 0.04, 2.5);
    if (inCycle === IN) bell(330, 0, 0.035, 3);
  }, [inCycle, finished]);

  return (
    <motion.div
      className="fixed inset-0 z-[65] flex flex-col items-center justify-center px-8 text-[#F6E9DA]"
      style={{ background: 'radial-gradient(90% 60% at 50% 45%, #4A3A5E 0%, #2A2034 60%, #1C1622 100%)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.6 } }}
      role="dialog"
      aria-label="לנשום יחד"
    >
      <button type="button" onClick={onClose} className="absolute top-5 left-5 rounded-full bg-white/10 px-4 py-2 text-[14px]">
        לסיים
      </button>
      <div className="relative mb-10 flex size-[260px] items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-full bg-[#C8B6EC]/15"
          animate={reduce ? {} : { scale: finished ? 1 : inhale ? 1.12 : 0.78 }}
          transition={{ duration: inhale ? IN : OUT, ease: 'easeInOut' }}
        />
        <motion.div
          className="w-[170px]"
          animate={reduce ? {} : { scale: finished ? 1 : inhale ? 1.14 : 0.9 }}
          transition={{ duration: inhale ? IN : OUT, ease: 'easeInOut' }}
        >
          <PigSvg {...look} mood={finished ? 'happy' : 'asleep'} className="w-full" />
        </motion.div>
      </div>
      <motion.p
        key={finished ? 'done' : inhale ? 'in' : 'out'}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="font-serif text-[30px]"
      >
        {finished ? 'יופי. ככה.' : inhale ? 'שאיפה…' : 'נשיפה…'}
      </motion.p>
      <p className="mt-2 text-[14px] text-[#E9D6C2]/60">{finished ? `${name} רגוע עכשיו. גם ${p('אתה', 'את')}?` : `נושמים עם ${name}, ${ROUNDS} נשימות`}</p>
      <div className="mt-6 flex gap-2">
        {Array.from({ length: ROUNDS }, (_, i) => (
          <span key={i} className={`size-2 rounded-full ${i < Math.floor(t / (IN + OUT)) ? 'bg-[#C8B6EC]' : 'bg-white/15'}`} />
        ))}
      </div>
    </motion.div>
  );
}

/* ───────────── Who is he: what has been found out ───────────── */

export function KnowSheet({ open, onClose, pet }: { open: boolean; onClose: () => void; pet: PetState }) {
  const p = personalityOf(pet);
  const found = pet.known.length;
  const since = new Date(pet.adoptedAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <Sheet open={open} onClose={onClose} title="מי הוא בכלל?">
      {/* his hutch card */}
      <div className="relative mb-4 rotate-[-1deg] rounded-[6px] border border-[#D9C3A0] bg-[#FFF8EA] p-4 shadow-[0_6px_14px_rgb(80_50_20/0.15)]">
        <span className="absolute -top-2 left-1/2 h-4 w-14 -translate-x-1/2 rotate-[2deg] bg-[#F3E2BF]/90 shadow-sm" aria-hidden />
        <div className="flex items-center gap-3">
          <div className="w-[64px] shrink-0">
            <PigSvg skin={pet.skin} head={pet.wear.head} face={pet.wear.face} neck={pet.wear.neck} mood="smile" className="w-full" />
          </div>
          <div className="min-w-0">
            <div className="font-serif text-[24px] leading-none">{pet.name}</div>
            <div className="mt-1 text-[12.5px] text-muted">גר אצל {P} מאז {since}</div>
            <div className="mt-1 text-[12.5px] font-bold text-accent">
              גילית {found} מתוך {traitSlots.length}
            </div>
          </div>
        </div>
        <div className="mt-3 border-t border-dashed border-[#D9C3A0] pt-3">
          {traitSlots.map((slot) => {
            const known = pet.known.includes(slot.key);
            return (
              <div key={slot.key} className="flex items-start gap-2 py-1.5">
                <span className="w-[104px] shrink-0 text-[13px] text-muted">{slot.title}</span>
                {known ? (
                  <span className="text-[14.5px] font-bold">{describe(p, slot.key)}</span>
                ) : (
                  <span className="text-[13px] text-[#B49A7E] italic">??? · {slot.how}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <p className="pb-6 text-center font-hand text-[14px] text-muted">כל {species.name} נולד עם אופי משלו. אף אחד לא יודע מראש, גם לא {A}.</p>
    </Sheet>
  );
}
