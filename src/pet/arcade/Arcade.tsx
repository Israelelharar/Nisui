import { motion } from 'motion/react';
import { X } from 'lucide-react';
import { tap } from '../../lib/haptics';
import { tick } from '../sound';
import type { PetState } from '../engine';
import { ArcadeIcon } from './icons';
import { GAMES, SHELVES, gameOfTheDay, type GameInfo } from './registry';

const TILTS = [-2.5, 1.5, -1, 2.5, -2, 1, -1.5, 2];
const HEIGHTS = [148, 134, 156, 140, 150, 132, 144];

/**
 * חדר המשחקים: a warm wooden games cupboard. The game of the day stands big at
 * the top; the rest are game boxes leaning on three shelves, each with her record.
 */
export function Arcade({ pet, day, onPlay, onClose }: { pet: PetState; day: number; onPlay: (id: string) => void; onClose: () => void }) {
  const today = gameOfTheDay(day);
  const best = (g: GameInfo) => pet.counters[`best:${g.id}`] ?? 0;
  const lvl = (g: GameInfo) => pet.counters[`lvl:${g.id}`] ?? 0;
  const play = (id: string) => {
    tap(8);
    tick();
    onPlay(id);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[45] overflow-y-auto overscroll-contain bg-[#3A2418]"
      style={{
        backgroundImage:
          'repeating-linear-gradient(90deg, rgb(255 255 255 / 0.025) 0 2px, transparent 2px 64px), radial-gradient(120% 70% at 50% 0%, #6A4128 0%, #3A2418 70%)',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      dir="rtl"
    >
      <div className="mx-auto max-w-[480px] px-4 pt-[max(14px,env(safe-area-inset-top))] pb-16 text-[#FFF3E4]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-[30px] leading-none font-medium">חדר המשחקים</h1>
            <p className="mt-1 font-hand text-[14px] text-[#FFF3E4]/70">{GAMES.length} משחקים, וכולם נהיים קשים יותר ככל שמתקדמים</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="סגירה"
            className="flex size-11 items-center justify-center rounded-full bg-[#FFF3E4]/12 ring-1 ring-[#FFF3E4]/15 transition-transform active:scale-90"
          >
            <X size={21} />
          </button>
        </div>

        {/* the game of the day: the big one */}
        <motion.button
          type="button"
          onClick={() => play(today.id)}
          className="relative mb-7 flex w-full items-center gap-4 overflow-hidden rounded-[26px] p-4 text-right text-ink shadow-[0_22px_40px_-20px_rgb(0_0_0/0.8)]"
          style={{ background: `linear-gradient(140deg, ${today.color}, #FFF6EC 120%)`, rotate: '-1deg' }}
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          whileTap={{ scale: 0.97 }}
        >
          <span className="tape absolute -top-1 left-8 h-5 w-16 rotate-[-6deg] bg-[#FFF6EC]/70" />
          <span className="arcade-float flex size-[86px] shrink-0 items-center justify-center rounded-[22px] bg-white/60 shadow-[inset_0_-4px_0_rgb(0_0_0/0.06)]">
            <ArcadeIcon name={today.icon} size={64} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-hand text-[13px] font-bold text-accent">המשחק של היום</span>
            <span className="block font-serif text-[23px] leading-tight font-medium">{today.name}</span>
            <span className="mt-0.5 block text-[13px] leading-snug text-ink/70">{today.desc}</span>
            <span className="mt-2 inline-block rounded-full bg-accent px-4 py-1.5 text-[14px] font-bold text-white">לשחק</span>
          </span>
        </motion.button>

        {SHELVES.map((shelf, si) => (
          <section key={shelf.id} className="mb-7">
            <div className="mb-1 flex items-baseline gap-2 px-1">
              <h2 className="font-serif text-[21px] font-medium">{shelf.name}</h2>
              <span className="font-hand text-[13px] text-[#FFF3E4]/60">{shelf.line}</span>
            </div>
            <div className="relative">
              <div className="-mx-4 flex snap-x items-end gap-3 overflow-x-auto px-4 pt-3 pb-4 [scrollbar-width:none]">
                {GAMES.filter((g) => g.shelf === shelf.id).map((g, i) => {
                  const b = best(g);
                  const l = lvl(g);
                  const h = HEIGHTS[(i + si * 2) % HEIGHTS.length];
                  return (
                    <motion.button
                      key={g.id}
                      type="button"
                      onClick={() => play(g.id)}
                      className="relative flex w-[112px] shrink-0 snap-start flex-col items-center justify-end rounded-[16px] px-2 pt-3 pb-2.5 text-center text-ink shadow-[0_14px_18px_-12px_rgb(0_0_0/0.85),inset_0_-5px_0_rgb(0_0_0/0.08),inset_0_2px_0_rgb(255_255_255/0.5)]"
                      style={{ background: g.color, height: h, rotate: `${TILTS[(i + si) % TILTS.length]}deg`, transformOrigin: '50% 100%' }}
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.05 * i + si * 0.08 }}
                      whileTap={{ scale: 0.94, rotate: 0 }}
                    >
                      {g.hearts && (
                        <span className="absolute top-1.5 left-1.5 flex gap-px" aria-label="3 לבבות">
                          {[0, 1, 2].map((k) => (
                            <svg key={k} viewBox="0 0 24 24" width={9} height={9}>
                              <path
                                d="M12 21s-7.5-4.6-9.4-9.3C1.2 8.3 3.4 5 6.8 5c2 0 3.6 1.1 5.2 3 1.6-1.9 3.2-3 5.2-3 3.4 0 5.6 3.3 4.2 6.7C19.5 16.4 12 21 12 21z"
                                fill="#E53950"
                              />
                            </svg>
                          ))}
                        </span>
                      )}
                      <ArcadeIcon name={g.icon} size={50} className="mb-1 drop-shadow-[0_3px_2px_rgb(0_0_0/0.18)]" />
                      <span className="text-[13px] leading-[1.15] font-bold">{g.name}</span>
                      <span className="mt-1 rounded-full bg-white/55 px-2 py-0.5 text-[10.5px] font-bold text-ink/70 tabular-nums">
                        {g.keepsLevel && l ? `שלב ${l}` : b ? `שיא ${b}` : 'חדש!'}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
              {/* the wooden shelf they stand on */}
              <div className="pointer-events-none absolute inset-x-[-16px] bottom-1 h-4 rounded-sm bg-[linear-gradient(#B07A4E,#7E5233)] shadow-[0_8px_12px_-4px_rgb(0_0_0/0.6)]" />
            </div>
          </section>
        ))}
      </div>
    </motion.div>
  );
}
