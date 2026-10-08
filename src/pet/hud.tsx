import { useEffect, useRef, useState, type PointerEvent as RPointerEvent, type ReactNode, type Ref } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { tap } from '../lib/haptics';
import { COIN, foods, foodById } from './catalog';
import type { PetState } from './engine';
import { ArcadeIcon } from './arcade/icons';
import { GAMES, gameById, gameOfTheDay } from './arcade/registry';
import { PetIcon, PotionBottle, type IconName } from './icons';
import { PigSvg } from './PigSvg';
import { bell, tick } from './sound';
import { species } from './species';
import { p } from '../lib/he';

/**
 * Everything that sits on top of his rooms, Talking-Tom style: the level ring
 * and seeds up top, round needs buttons along the bottom that also take him
 * from room to room, a tray per room (food to drag to his mouth, his games,
 * soap, the lamp) and the side menu behind the three lines.
 */

const press = () => {
  tap(6);
  tick();
};

/* ───────────── top: level ring + seeds ───────────── */

export function LevelRing({ level, xp, need, onClick }: { level: number; xp: number; need: number; onClick: () => void }) {
  const r = 24;
  const c = 2 * Math.PI * r;
  const k = Math.max(0, Math.min(1, xp / need));
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={press}
      aria-label={`רמה ${level}, ${xp} מתוך ${need} נקודות`}
      className="pointer-events-auto relative size-[62px] shrink-0 rounded-full transition-transform active:scale-95"
    >
      <svg viewBox="0 0 60 60" className="absolute inset-0 size-full -rotate-90" aria-hidden>
        <circle cx="30" cy="30" r="28.5" fill="#2B1D17" opacity="0.55" />
        <circle cx="30" cy="30" r={r} fill="none" stroke="rgb(255 255 255 / 0.18)" strokeWidth="6" />
        <circle
          cx="30"
          cy="30"
          r={r}
          fill="none"
          stroke="#F2C46B"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${c * k} ${c}`}
          style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <span
        className="absolute inset-[11px] flex items-center justify-center overflow-hidden rounded-full font-serif text-[22px] leading-none font-bold text-[#5A3A10]"
        style={{ background: 'radial-gradient(circle at 35% 28%, #FFF4D2 0%, #F2C46B 55%, #C98A2E 100%)' }}
      >
        {level}
        <span className="foil absolute inset-0" />
      </span>
    </button>
  );
}

export function CoinPill({ ref, coins, onClick, children }: { ref?: Ref<HTMLButtonElement>; coins: number; onClick: () => void; children: ReactNode }) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      onPointerDown={press}
      aria-label={`${coins} ${species.coinName}. לחנות`}
      className="pointer-events-auto relative flex h-[36px] items-center gap-1.5 overflow-hidden rounded-full border border-[#E9C98A]/40 bg-[#2B1D17]/55 ps-2.5 pe-3 text-[17px] font-bold text-[#FFF3E4] shadow-[inset_0_1px_0_rgb(255_255_255/0.15),0_6px_16px_rgb(0_0_0/0.25)] backdrop-blur-md active:scale-95"
    >
      <span className="foil absolute inset-0" />
      <span className="text-[18px]">{COIN}</span>
      {children}
      <span className="ms-0.5 flex size-[18px] items-center justify-center rounded-full bg-[#F2C46B] text-[14px] leading-none text-[#5A3A10]">+</span>
    </button>
  );
}

/** Three lines, top right: the rest of his world. */
export function MenuButton({ onClick, dot }: { onClick: () => void; dot: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={press}
      aria-label="תפריט"
      className="pointer-events-auto relative flex size-[50px] items-center justify-center rounded-[18px] border border-white/25 bg-[#2B1D17]/50 shadow-[0_6px_16px_rgb(0_0_0/0.3)] backdrop-blur-md active:scale-95"
    >
      <span className="flex w-[22px] flex-col gap-[5px]" aria-hidden>
        <span className="h-[3px] rounded-full bg-[#FFF3E4]" />
        <span className="h-[3px] w-[17px] rounded-full bg-[#FFF3E4]" />
        <span className="h-[3px] rounded-full bg-[#FFF3E4]" />
      </span>
      {dot && <span className="absolute -top-1 -left-1 size-3.5 rounded-full border-2 border-[#2B1D17] bg-[#FF5A6E]" />}
    </button>
  );
}

/** A round glass button for the side columns, with an optional "!" like a notification. */
export function SideButton({ label, onClick, active, alert, children }: { label: string; onClick: () => void; active?: boolean; alert?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={press}
      aria-label={label}
      aria-pressed={active}
      className={`pointer-events-auto relative flex size-[46px] items-center justify-center rounded-full border-[2.5px] border-white/85 shadow-[0_5px_12px_rgb(0_0_0/0.3)] transition-transform active:scale-90 ${
        active ? 'bg-[#F6A55A]' : 'bg-[#FFF8EE]/90'
      }`}
    >
      {children}
      {alert && (
        <span className="absolute -top-1.5 -left-1.5 flex size-[18px] items-center justify-center rounded-full border-2 border-white bg-[#E8364E] text-[11px] font-black text-white">!</span>
      )}
    </button>
  );
}

/* ───────────── bottom: needs, which are also the doors ───────────── */

export function NeedButton({
  icon,
  label,
  value,
  color,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  const v = Math.max(0, Math.min(100, value));
  const low = v < 30;
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={press}
      aria-label={`${label} ${Math.round(v)}%`}
      aria-current={active ? 'page' : undefined}
      className="group pointer-events-auto flex flex-col items-center gap-1"
    >
      <motion.span
        animate={{ y: active ? -7 : 0, scale: active ? 1.08 : 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 22 }}
        className={`relative flex size-[56px] items-center justify-center overflow-hidden rounded-full border-[3px] shadow-[0_6px_14px_rgb(0_0_0/0.35)] ${
          active ? 'border-[#FFE3A3]' : 'border-white/90'
        } ${low ? 'need-low' : ''}`}
        style={{ background: '#FFF8EE' }}
      >
        {/* the level of the need, like a glass filling */}
        <span
          className="absolute inset-x-0 bottom-0 transition-[height] duration-1000 ease-out"
          style={{ height: `${v}%`, background: `linear-gradient(180deg, color-mix(in srgb, ${low ? '#FF6B6B' : color} 70%, #fff), ${low ? '#E8364E' : color})` }}
        />
        <span className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/40 to-transparent" />
        <span className="relative drop-shadow-[0_1px_0_rgb(255_255_255/0.6)] transition-transform group-active:scale-90">{icon}</span>
        {low && <span className="absolute top-0.5 left-1/2 size-2 -translate-x-1/2 rounded-full bg-[#E8364E]" />}
      </motion.span>
      <span className={`text-[11px] leading-none font-bold ${active ? 'text-[#FFE3A3]' : 'text-[#FFF3E4]/85'} [text-shadow:0_1px_4px_rgb(0_0_0/0.6)]`}>{label}</span>
    </button>
  );
}

/* ───────────── kitchen: drag the food to his mouth ───────────── */

type Mouth = { x: number; y: number; reach: number } | null;

export function FoodTray({
  pet,
  mouth,
  onNear,
  onFeed,
  onShop,
  onHint,
}: {
  pet: PetState;
  mouth: () => Mouth;
  onNear: (near: boolean) => void;
  /** Returns false when it didn't work out (asleep, no seeds…): the food flies back. */
  onFeed: (id: string, emoji: string) => boolean;
  onShop: () => void;
  onHint: (id: string) => void;
}) {
  const g = useRef<{ id: string; e: string; sx: number; sy: number; on: boolean; near: boolean; from: DOMRect } | null>(null);
  const ghostId = useRef('');
  const [ghost, setGhost] = useState<{ e: string; x: number; y: number; near: boolean } | null>(null);
  const [back, setBack] = useState<{ key: number; e: string; x: number; y: number; tx: number; ty: number } | null>(null);
  // Two shelves on the counter: food, and the potion corner.
  const [shelf, setShelf] = useState<'food' | 'potions'>('food');
  const list = [...foods].filter((f) => (shelf === 'potions') === !!f.potion).sort((a, b) => Number((pet.food[b.id] ?? 0) > 0 || b.price === 0) - Number((pet.food[a.id] ?? 0) > 0 || a.price === 0));

  useEffect(() => () => onNear(false), [onNear]);

  const down = (e: RPointerEvent<HTMLButtonElement>, id: string, emoji: string) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    g.current = { id, e: emoji, sx: e.clientX, sy: e.clientY, on: false, near: false, from: e.currentTarget.getBoundingClientRect() };
    ghostId.current = id;
  };
  const move = (e: RPointerEvent<HTMLButtonElement>) => {
    const d = g.current;
    if (!d) return;
    if (!d.on) {
      if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 9) return;
      d.on = true;
      tap(5);
      bell(1320, 0, 0.025, 0.2);
    }
    const m = mouth();
    const near = !!m && Math.hypot(e.clientX - m.x, e.clientY - m.y) < m.reach;
    if (near !== d.near) {
      d.near = near;
      onNear(near);
      if (near) tap(8);
    }
    setGhost({ e: d.e, x: e.clientX, y: e.clientY, near });
  };
  const up = (e: RPointerEvent<HTMLButtonElement>) => {
    const d = g.current;
    g.current = null;
    if (!d) return;
    if (!d.on) return onHint(d.id);
    onNear(false);
    setGhost(null);
    if (d.near && onFeed(d.id, d.e)) return;
    setBack({ key: Date.now(), e: d.e, x: e.clientX, y: e.clientY, tx: d.from.left + d.from.width / 2, ty: d.from.top + d.from.height / 2 });
  };
  const cancel = () => {
    if (g.current?.on) onNear(false);
    g.current = null;
    setGhost(null);
  };

  return (
    <>
      <Tray>
        <div className="flex justify-center gap-1.5 px-2 pt-1.5" role="tablist">
          {(
            [
              ['food', 'אוכל'],
              ['potions', 'פינת השיקויים'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={shelf === k}
              onClick={() => {
                tap(6);
                setShelf(k);
              }}
              className={`rounded-full px-3 py-0.5 text-[11.5px] font-bold transition-colors ${shelf === k ? 'bg-[#FFF3E4] text-[#5A3418]' : 'text-[#FFF3E4]/75'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="no-scrollbar flex snap-x gap-1.5 overflow-x-auto px-2 py-1.5">
          {list.map((f) => {
            const n = f.price === 0 ? Infinity : (pet.food[f.id] ?? 0);
            return (
              <button
                key={f.id}
                type="button"
                onPointerDown={(e) => down(e, f.id, f.emoji)}
                onPointerMove={move}
                onPointerUp={up}
                onPointerCancel={cancel}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onFeed(f.id, f.emoji);
                  }
                }}
                aria-label={`${f.name}${n === Infinity ? '' : n ? `, יש ${n}` : `, ${f.price} ${species.coinName}`}. לגרור לפה שלו`}
                className="relative flex w-[62px] shrink-0 snap-start flex-col items-center"
                style={{ touchAction: 'pan-x' }}
              >
                <span className="relative flex size-[54px] items-center justify-center">
                  <span className="absolute bottom-0.5 h-[14px] w-[50px] rounded-[50%] bg-[#FFFBF3] shadow-[0_3px_0_#D9C3A0,0_6px_8px_rgb(0_0_0/0.25)]" />
                  {f.potion ? (
                    <PotionBottle color={f.color!} size={40} className="potion-wobble relative -mt-4 drop-shadow-[0_3px_2px_rgb(0_0_0/0.3)]" />
                  ) : (
                    <span className={`relative text-[34px] leading-none drop-shadow-[0_3px_2px_rgb(0_0_0/0.25)] ${n === 0 ? 'opacity-55 grayscale-[0.4]' : ''}`}>{f.emoji}</span>
                  )}
                </span>
                {f.potion && <span className="-mt-0.5 mb-0.5 text-center text-[9.5px] leading-tight font-bold whitespace-nowrap text-[#FFF3E4]/90">{f.name.replace('שיקוי ', '')}</span>}
                {n === Infinity ? (
                  <span className="text-[10.5px] font-bold text-[#FFF3E4]/80">חינם</span>
                ) : n > 0 ? (
                  <span className="rounded-full bg-[#FFF8EE] px-1.5 text-[11px] leading-[16px] font-bold text-[#3B2216] tabular-nums">×{n}</span>
                ) : (
                  <span className="-rotate-3 rounded-[4px] bg-[#F2C46B] px-1 text-[10.5px] leading-[16px] font-bold text-[#5A3A10] tabular-nums">
                    {f.price} {COIN}
                  </span>
                )}
              </button>
            );
          })}
          <button type="button" onClick={onShop} onPointerDown={press} className="flex w-[58px] shrink-0 flex-col items-center justify-center gap-0.5" aria-label="עוד אוכל בחנות">
            <PetIcon name="plus" size={34} />
            <span className="text-[10.5px] font-bold text-[#FFF3E4]/80">עוד</span>
          </button>
        </div>
      </Tray>
      {createPortal(
        <>
          {ghost && (
            <span
              className="pointer-events-none fixed z-[80] leading-none"
              style={{
                left: ghost.x,
                top: ghost.y,
                fontSize: 54,
                transform: `translate(-50%, -60%) scale(${ghost.near ? 1.12 : 1}) rotate(${ghost.near ? -8 : 0}deg)`,
                transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                filter: 'drop-shadow(0 10px 8px rgb(0 0 0 / 0.35))',
              }}
            >
              {foodById(ghostId.current)?.potion ? <PotionBottle color={foodById(ghostId.current)!.color!} size={48} /> : ghost.e}
            </span>
          )}
          <AnimatePresence>
            {back && (
              <motion.span
                key={back.key}
                className="pointer-events-none fixed z-[80] leading-none"
                style={{ fontSize: 54, translate: '-50% -60%' }}
                initial={{ left: back.x, top: back.y, opacity: 1, scale: 1 }}
                animate={{ left: back.tx, top: back.ty, opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                onAnimationComplete={() => setBack(null)}
              >
                {foodById(ghostId.current)?.potion ? <PotionBottle color={foodById(ghostId.current)!.color!} size={48} /> : back.e}
              </motion.span>
            )}
          </AnimatePresence>
        </>,
        document.body,
      )}
    </>
  );
}

/** A wooden counter strip the room's things sit on. */
function Tray({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 30, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="relative mx-3 rounded-[20px] border border-[#E9C98A]/30 shadow-[0_10px_24px_rgb(0_0_0/0.35)]"
      style={{ background: 'linear-gradient(180deg, rgb(150 98 62 / 0.92), rgb(110 66 40 / 0.94))' }}
    >
      <span className="pointer-events-none absolute inset-x-4 top-[3px] h-px bg-[#FFE1B8]/40" />
      {children}
    </motion.div>
  );
}

/* ───────────── playroom: his games, as toys ───────────── */

export function PlayTray({ pet, day, onPlay, onArcade, onTalk }: { pet: PetState; day: number; onPlay: (g: string) => void; onArcade: () => void; onTalk: () => void }) {
  const quick = [gameOfTheDay(day), gameById('trivia')!, gameById('draw')!].filter((g, i, a) => a.findIndex((x) => x.id === g.id) === i).slice(0, 3);
  return (
    <Tray>
      {/* his happiness fills when she talks to him */}
      <button
        type="button"
        onClick={onTalk}
        onPointerDown={press}
        className="mx-2 mt-2 flex w-[calc(100%-16px)] items-center gap-2.5 rounded-2xl bg-[#FFF3E4]/12 px-3 py-1.5 text-right transition-transform active:scale-[0.98]"
      >
        <span className="listening-soft flex size-9 shrink-0 items-center justify-center rounded-full bg-[#FFF3E4]">
          <PetIcon name="mic" size={24} />
        </span>
        <span className="min-w-0 text-[#FFF3E4]">
          <span className="block text-[14px] leading-tight font-bold">לדבר איתו</span>
          <span className="block text-[11px] leading-tight text-[#FFF3E4]/75">כל משפט ש{p('תגיד', 'תגידי')} לו ממלא לו את השמחה</span>
        </span>
      </button>
      <div className="flex items-end justify-around px-1 pt-2 pb-1.5">
        {quick.map((g, i) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onPlay(g.id)}
            onPointerDown={press}
            className="flex w-[74px] flex-col items-center gap-0.5 transition-transform active:scale-95"
          >
            <span style={{ rotate: `${[-5, 4, -3][i]}deg` }}>
              <ArcadeIcon name={g.icon} size={42} className="drop-shadow-[0_4px_3px_rgb(0_0_0/0.35)]" />
            </span>
            <span className="text-center text-[11.5px] leading-tight font-bold text-[#FFF3E4]">{g.name}</span>
            <span className="text-[10px] text-[#FFE3A3]/80 tabular-nums">
              {i === 0 ? 'של היום' : pet.counters[`best:${g.id}`] ? `שיא ${pet.counters[`best:${g.id}`]}` : 'חדש'}
            </span>
          </button>
        ))}
        {/* the whole games cupboard */}
        <button
          type="button"
          onClick={onArcade}
          onPointerDown={press}
          className="flex w-[84px] flex-col items-center gap-0.5 transition-transform active:scale-95"
        >
          <span className="relative flex h-[42px] w-[60px] items-center justify-center">
            {['rocket', 'cake', 'balloon'].map((n, k) => (
              <span key={n} className="absolute" style={{ transform: `translateX(${(k - 1) * 15}px) rotate(${(k - 1) * 12}deg)`, zIndex: k === 1 ? 2 : 1 }}>
                <ArcadeIcon name={n} size={k === 1 ? 40 : 32} className="drop-shadow-[0_4px_3px_rgb(0_0_0/0.35)]" />
              </span>
            ))}
          </span>
          <span className="text-center text-[11.5px] leading-tight font-bold text-[#FFE3A3]">כל המשחקים</span>
          <span className="rounded-full bg-[#FFE3A3] px-1.5 text-[10px] font-bold text-[#5A3A20] tabular-nums">{GAMES.length}</span>
        </button>
      </div>
    </Tray>
  );
}

/* ───────────── bathroom: soap, scrub, rinse ───────────── */

export function BathTray({
  bath,
  rinse,
  shiny,
  onGrab,
}: {
  bath: number | null;
  rinse: number | null;
  shiny: boolean;
  /** She picked up the soap or the shower: it follows her finger from here. */
  onGrab: (kind: 'soap' | 'shower', e: { clientX: number; clientY: number }) => void;
}) {
  const soaped = bath !== null && bath >= 100;
  const kind = soaped ? 'shower' : 'soap';
  const progress = soaped ? (rinse ?? 0) : (bath ?? 0);
  return (
    <Tray>
      <div className="flex items-center gap-3 px-4 py-2.5">
        <button
          type="button"
          onPointerDown={(e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            onGrab(kind, e);
          }}
          style={{ touchAction: 'none' }}
          className={`shrink-0 transition-transform active:scale-90 ${bath === null && !shiny ? 'bath-beckon' : ''}`}
          aria-label={soaped ? 'לגרור את הדוש מעליו' : 'לגרור את הסבון עליו'}
        >
          {soaped ? <ShowerHead /> : <PetIcon name="soap" size={50} className="drop-shadow-[0_4px_3px_rgb(0_0_0/0.35)]" />}
        </button>
        {bath === null ? (
          <div className="text-[#FFF3E4]">
            <div className="font-serif text-[18px] leading-tight">{shiny ? 'נקי ומבריק ✨' : 'זמן מקלחת'}</div>
            <div className="text-[12px] text-[#FFF3E4]/75">{shiny ? 'כשהוא יתלכלך קצת, הסבון מחכה פה' : 'גוררים את הסבון עליו ומסבנים אותו כולו'}</div>
          </div>
        ) : (
          <div className="min-w-0 flex-1 text-[#FFF3E4]">
            <div className="mb-1.5 flex justify-between text-[13px] font-bold">
              <span>{soaped ? 'עכשיו הדוש: לגרור אותו מעליו 🚿' : 'לסבן אותו עם הסבון 🫧'}</span>
              <span className="tabular-nums">{Math.round(progress)}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-black/25">
              <div
                className={`h-full rounded-full transition-[width] duration-200 ${soaped ? 'bg-gradient-to-l from-[#9FE3FF] to-[#2F8FD8]' : 'bg-gradient-to-l from-[#FFFFFF] to-[#F7B6C8]'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Tray>
  );
}

function ShowerHead() {
  return (
    <svg viewBox="0 0 48 48" width="50" height="50" className="drop-shadow-[0_4px_3px_rgb(0_0_0/0.35)]" aria-hidden>
      <rect x="20" y="2" width="8" height="16" rx="3" fill="#B7C2C7" stroke="#3B2216" strokeWidth="2.2" />
      <path d="M8 18 h32 l-4 12 h-24z" fill="#D5DEE2" stroke="#3B2216" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M15 34 l-2 6 M24 34 v7 M33 34 l2 6" stroke="#6FC3F2" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

/* ───────────── bedroom: the lamp ───────────── */

export function BedTray({ asleep, energy, onToggle }: { asleep: boolean; energy: number; onToggle: () => void }) {
  return (
    <Tray>
      <div className="flex items-center gap-3 px-4 py-2.5">
        <button
          type="button"
          onClick={onToggle}
          onPointerDown={press}
          className={`flex shrink-0 items-center justify-center rounded-full p-1.5 transition-transform active:scale-90 ${asleep ? 'bg-black/20' : 'bg-[#FFE3A3]/25 shadow-[0_0_24px_#FFD98A]'}`}
          aria-label={asleep ? 'להדליק את האור ולהעיר אותו' : 'לכבות את האור'}
        >
          <PetIcon name={asleep ? 'sun' : 'lamp'} size={44} />
        </button>
        <div className="text-[#FFF3E4]">
          <div className="font-serif text-[18px] leading-tight">{asleep ? 'ששש… הוא ישן' : energy < 35 ? 'הוא ממש עייף' : 'עוד לא עייף'}</div>
          <div className="text-[12px] text-[#FFF3E4]/75">{asleep ? 'לוחצים על השמש כדי להעיר אותו' : 'מכבים את המנורה והוא נרדם'}</div>
        </div>
      </div>
    </Tray>
  );
}

/* ───────────── the side menu ───────────── */

export interface MenuRow {
  icon: IconName;
  label: string;
  meta?: string;
  dot?: boolean;
  onClick: () => void;
}

export function MenuDrawer({ open, onClose, head, sections }: { open: boolean; onClose: () => void; head: ReactNode; sections: { title: string; big?: boolean; rows: MenuRow[] }[] }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[45]" role="dialog" aria-label="תפריט">
          <motion.div className="absolute inset-0 bg-[#1E140F]/55 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.nav
            className="paper-grain absolute inset-y-0 right-0 flex w-[min(320px,84vw)] flex-col overflow-y-auto rounded-l-[28px] bg-[#FFF8EE] pb-[110px] text-[#3B2216] shadow-[-20px_0_40px_rgb(0_0_0/0.35)]"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
          >
            <div className="px-5 pt-[max(18px,env(safe-area-inset-top))]">{head}</div>
            {sections.map((s) => (
              <div key={s.title} className="px-3 pt-3">
                <div className="mb-1 px-2 font-hand text-[13px] text-[#9A7A62]">{s.title}</div>
                {s.rows.map((r) => (
                  <button
                    key={r.label}
                    type="button"
                    onPointerDown={press}
                    onClick={() => {
                      onClose();
                      r.onClick();
                    }}
                    className={`relative flex w-full items-center gap-3 rounded-2xl px-2 text-right transition-colors active:bg-[#F3E2CC] ${s.big ? 'py-2.5' : 'py-2'}`}
                  >
                    <PetIcon name={r.icon} size={s.big ? 36 : 30} />
                    <span className={`flex-1 font-bold ${s.big ? 'text-[16.5px]' : 'text-[15px]'}`}>{r.label}</span>
                    {r.meta && <span className="text-[12.5px] text-[#9A7A62] tabular-nums">{r.meta}</span>}
                    {r.dot && <span className="size-2.5 rounded-full bg-[#E8364E]" />}
                  </button>
                ))}
                <div className="mx-2 mt-2 border-b border-dashed border-[#E2CDB2]" />
              </div>
            ))}
          </motion.nav>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** The little portrait at the top of the menu. */
export function MenuHead({ pet, days, stage, onName }: { pet: PetState; days: number; stage: string; onName: () => void }) {
  return (
    <button type="button" onClick={onName} className="flex w-full items-center gap-3 text-right">
      <span className="w-[58px] shrink-0 rotate-[-3deg] rounded-[6px] bg-white p-1 pb-2.5 shadow-[0_4px_10px_rgb(80_50_20/0.2)]">
        <span className="block rounded-[3px] bg-[#F3E2CC]">
          <PigSvg skin={pet.skin} head={pet.wear.head} face={pet.wear.face} neck={pet.wear.neck} mood="smile" className="w-full" />
        </span>
      </span>
      <span className="min-w-0">
        <span className="block truncate font-serif text-[24px] leading-tight">{pet.name}</span>
        <span className="text-[12.5px] text-[#9A7A62]">
          {stage} · יום {days + 1} · רמה {pet.level}
        </span>
      </span>
    </button>
  );
}
