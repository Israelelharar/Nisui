import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useApp } from '../hooks/useApp';
import { useOpened } from '../hooks/useOpened';
import { tap } from '../lib/haptics';
import { tada } from '../pet/sound';
import { Sheet } from './Sheet';
import { SectionTitle } from './Paper';
import { content } from '../client';
import type { Voucher } from '../client/schema';
import { A, P, a, p } from '../lib/he';

/**
 * "פנקס השוברים": promises from the admin (the client's `vouchers`; the first
 * one is the big ticket). The partner tears one off when they want it; the
 * admin gets a message and sees it stamped (the redemption lives in the
 * "opened" set on the server, so it follows them).
 */
const [BIG, ...MORE] = content.vouchers ?? [];

const key = (v: Voucher) => `voucher:${v.id}`;

export function Vouchers() {
  const { viewer, showToast } = useApp();
  const isAdmin = viewer.role === 'admin';
  const { isOpened, markOpened } = useOpened();
  const [asking, setAsking] = useState<Voucher | null>(null);
  const [justUsed, setJustUsed] = useState<string | null>(null);

  if (!BIG) return null;
  const pick = (v: Voucher) => {
    tap(8);
    if (isOpened(key(v))) return showToast('השובר הזה כבר מומש 💛');
    if (isAdmin) return showToast(`את השוברים רק ${P} ${p('יכול', 'יכולה')} לממש 😉`);
    setAsking(v);
  };
  const redeem = () => {
    if (!asking) return;
    markOpened(key(asking), asking.title, undefined, 'voucher');
    tap(20);
    tada();
    setJustUsed(asking.id);
    setAsking(null);
    showToast(`מומש! ${A} כבר ${a('קיבל', 'קיבלה')} הודעה 🎟️`);
  };

  return (
    <section>
      <SectionTitle aside={<span className="text-xs text-muted">ממני, לתלוש מתי שבא לך</span>}>פנקס השוברים</SectionTitle>
      {BIG && <Ticket v={BIG} big used={isOpened(key(BIG))} fresh={justUsed === BIG.id} onPick={() => pick(BIG)} />}
      <div className="mt-3 grid grid-cols-2 gap-3">
        {MORE.map((v, i) => (
          <div key={v.id} className={i === 0 || i === MORE.length - 1 ? 'col-span-2' : ''} style={{ rotate: `${[0.6, -0.8, 0.5, -0.4, 0.9, -0.6][i]}deg` }}>
            <Ticket v={v} used={isOpened(key(v))} fresh={justUsed === v.id} onPick={() => pick(v)} tint={['bg-sky', 'bg-peach', 'bg-soft', 'bg-butter', 'bg-paper', 'bg-sky'][i]} />
          </div>
        ))}
      </div>

      <Sheet open={!!asking} onClose={() => setAsking(null)} title={`${p('בטוח שאתה רוצה', 'בטוחה שאת רוצה')} לתלוש?`}>
        {asking && (
          <div className="pb-4 text-center">
            <p className="font-serif text-[26px]">{asking.title}</p>
            <p className="mt-1 text-muted">{asking.line}</p>
            <p className="mt-4 text-[15px]">אחרי שתולשים, השובר נשאר תלוש. {A} {a('יקבל', 'תקבל')} הודעה {a('ויצטרך', 'ותצטרך')} לקיים. 😌</p>
            <button type="button" onClick={redeem} className="mt-5 h-12 w-full rounded-full bg-accent font-bold text-white active:scale-[0.98]">
              כן, {p('בטוח', 'בטוחה')}. לתלוש!
            </button>
            <button type="button" onClick={() => setAsking(null)} className="mt-2 h-11 w-full text-muted">
              לא, אשמור אותו לפעם אחרת
            </button>
          </div>
        )}
      </Sheet>
    </section>
  );
}

function Ticket({ v, big, used, fresh, tint = 'bg-butter', onPick }: { v: Voucher; big?: boolean; used: boolean; fresh: boolean; tint?: string; onPick: () => void }) {
  const reduce = useReducedMotion();
  return (
    <button
      type="button"
      onClick={onPick}
      aria-label={`${v.title}${used ? ', מומש' : ''}`}
      className={`ticket relative block w-full overflow-hidden text-right transition-transform active:scale-[0.98] ${tint} ${big ? 'rounded-[18px] px-6 py-5' : 'rounded-[14px] px-4 py-3.5'} ${used ? 'opacity-75' : ''}`}
    >
      {big && !used && <span aria-hidden className="foil absolute inset-0" />}
      <span className={`block font-serif leading-tight ${big ? 'text-[28px]' : 'text-[17px] font-bold'}`}>{v.title}</span>
      <span className={`mt-1 block ${big ? 'text-[15px]' : 'text-[13px]'} text-ink/80`}>{v.line}</span>
      <span aria-hidden className="mt-3 block border-t-2 border-dashed border-ink/15" />
      <span className="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted">
        <span className="font-hand text-[13px]">{v.from}</span>
        {!used && <span className="shrink-0">בתוקף: לתמיד</span>}
      </span>
      {used && (
        <motion.span
          aria-hidden
          initial={fresh && !reduce ? { scale: 2.2, opacity: 0, rotate: -30 } : false}
          animate={{ scale: 1, opacity: 1, rotate: -12 }}
          transition={{ type: 'spring', stiffness: 380, damping: 18 }}
          className={`absolute top-1/2 left-4 -translate-y-1/2 rounded-md border-[3px] border-accent/80 px-2 py-0.5 font-serif font-bold text-accent/90 ${big ? 'text-[26px]' : 'text-[16px]'}`}
        >
          מומש ✓
        </motion.span>
      )}
    </button>
  );
}
