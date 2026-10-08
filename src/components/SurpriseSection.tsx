import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Gift } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { surprises } from '../content/surprises';
import { openWhen } from '../content/openWhen';
import { photoById } from '../content/photos';
import { pickDaily } from '../lib/daily';
import { tap } from '../lib/haptics';
import { track } from '../lib/events';
import { Paper, SectionTitle } from './Paper';
import { PhotoImg } from './PhotoImg';
import { OpenWhenCard, OpenWhenSheet, useOpenWhen } from './OpenWhen';
import { burstHeart } from './HeartBurst';
import { has } from '../client';
import { A, p } from '../lib/he';

/** The daily surprise and "open when…" cards, part of the letters tab. */
export function SurpriseSection() {
  const { clock } = useApp();
  const reduce = useReducedMotion();
  const key = `idw:surprise:${clock.contentDate}`;
  const [revealed, setRevealed] = useState(() => {
    try {
      return localStorage.getItem(key) === '1';
    } catch {
      return false;
    }
  });
  const s = surprises.length ? pickDaily(surprises, clock.dayIndex, 'surprise') : null;
  const photo = s?.photoId ? photoById(s.photoId) : undefined;
  const ow = useOpenWhen();

  const reveal = () => {
    if (!s) return;
    tap(14);
    burstHeart();
    setRevealed(true);
    track('letter_opened', { title: `ההפתעה של היום: ${s.title}` });
    try {
      localStorage.setItem(key, '1');
    } catch {
      /* fine */
    }
  };

  return (
    <>
      {has('surprises') && s && (
      <section id="surprise" aria-live="polite" className="scroll-mt-6">
        <SectionTitle aside={<span className="text-sm text-muted">מחר עוד אחת</span>}>ההפתעה של היום</SectionTitle>
        {!revealed ? (
          <button
            type="button"
            onClick={reveal}
            className="flex h-[170px] w-full flex-col items-center justify-center gap-3 rounded-[28px] bg-accent text-white shadow-paper transition-transform active:scale-[0.98]"
          >
            <Gift size={44} strokeWidth={1.4} aria-hidden />
            <span className="font-serif text-2xl">ההפתעה של היום</span>
            <span className="font-hand text-sm text-white/85">{p('לחץ', 'לחצי')} לפתוח</span>
          </button>
        ) : (
          <motion.div initial={reduce ? false : { opacity: 0, scale: 0.96, filter: 'blur(6px)' }} animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }} transition={{ duration: 0.5 }}>
            <Paper className={`px-5 pt-7 pb-5 ${s.kind === 'coupon' ? 'border-2 border-dashed border-accent/50' : ''}`}>
              <p className="text-xs font-bold tracking-[2px] text-accent">{s.kind === 'coupon' ? 'שובר' : 'היום'}</p>
              <h2 className="mt-1 font-serif text-[24px]">{s.title}</h2>
              {photo && <PhotoImg photo={photo} className="mt-3 w-full rounded-xl" />}
              <p className="mt-2 text-[16px] leading-relaxed">{s.body}</p>
              {s.kind === 'coupon' && <p className="mt-3 font-hand text-sm text-muted">להציג ל{A}. בתוקף לנצח.</p>}
            </Paper>
          </motion.div>
        )}
      </section>
      )}

      {has('openWhen') && (
      <section id="open-when" className="scroll-mt-6">
        <SectionTitle>{p('פתח', 'פתחי')} כש…</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5">
          {openWhen.map((c, i) => (
            <OpenWhenCard key={c.id} card={c} onOpen={ow.open} wide tilt={i % 2 ? 0.8 : -0.8} />
          ))}
        </div>
      </section>
      )}

      <OpenWhenSheet card={ow.card} onClose={ow.close} />
    </>
  );
}
