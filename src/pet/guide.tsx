import { useNavigate } from 'react-router';
import { Check, ChevronLeft, Lock } from 'lucide-react';
import { Sheet } from '../components/Sheet';
import { FriendArt } from '../components/Friends';
import { tap } from '../lib/haptics';
import { COIN, skins } from './catalog';
import type { PetState } from './engine';
import { PigSvg } from './PigSvg';
import { FRIENDS, LEGENDS, legendReady, stepDone, stepValue } from './quests';
import { species } from './species';
import { P, a, p } from '../lib/he';

/**
 * The "?" in the shop: the five coveted pigs, what each one asks for, and the
 * riddles for the hidden friends. Written to her, like a little treasure map.
 */
export function LegendGuide({ open, onClose, pet, mirror }: { open: boolean; onClose: () => void; pet: PetState; mirror: boolean }) {
  const nav = useNavigate();
  const go = (route: string) => {
    tap(8);
    onClose();
    nav(route);
  };
  const found = pet.found ?? [];

  return (
    <Sheet open={open} onClose={onClose} title={`ה${species.plural} הנחשקים`}>
      <div className="flex flex-col gap-4 pb-6">
        <p className="-mt-2 text-[15px] leading-relaxed text-muted">
          חמישה {species.plural} שלא נמכרים סתם. כל אחד חי: האור זז עליו, יש לו ניצוצות, אש או לבבות. כל אחד נפתח רק אחרי המשימה שלו, ואז אפשר לקנות אותו בחנות. המשימות מפוזרות בכל
          האתר, אז ה{species.name} שולח אותך לטייל.
        </p>

        {LEGENDS.map((l) => {
          const sk = skins.find((s) => s.id === l.skin)!;
          const ready = legendReady(pet, l.skin);
          const owned = pet.owned.includes(l.skin);
          return (
            <section key={l.skin} className="overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,#FFFDF9,#F8EEE4)] shadow-[0_10px_24px_-14px_rgb(90_50_20/0.55),inset_0_1px_0_#fff]">
              <div className="flex items-center gap-3 px-4 pt-4">
                <div className="relative size-[86px] shrink-0">
                  <div className="absolute inset-x-3 bottom-1 h-3 rounded-[50%] bg-[#6B4430]/20 blur-[3px]" />
                  <PigSvg skin={l.skin} mood={ready ? 'happy' : 'normal'} className={`relative size-full ${ready ? 'shop-breathe' : 'brightness-[0.35] saturate-0'}`} />
                  {!ready && (
                    <span className="absolute inset-0 flex items-center justify-center text-white">
                      <Lock size={22} strokeWidth={2.6} />
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-bold tracking-[1.5px] text-[#B98316]">{l.title}</p>
                  <h3 className="font-serif text-[22px] leading-tight">{sk.name}</h3>
                  <p className="mt-0.5 text-[13px] leading-snug text-muted">{l.story}</p>
                </div>
              </div>
              <ul className="mt-3 flex flex-col gap-1.5 px-4 pb-4">
                {l.steps.map((st) => {
                  const v = Math.min(st.target, stepValue(pet, st.key));
                  const done = stepDone(pet, st);
                  return (
                    <li key={st.key} className="flex items-center gap-2.5 rounded-xl bg-white/70 px-3 py-2">
                      <span className={`flex size-6 shrink-0 items-center justify-center rounded-full ${done ? 'bg-accent text-white' : 'border-2 border-line'}`}>{done && <Check size={14} strokeWidth={3} />}</span>
                      <span className={`min-w-0 flex-1 text-[14px] leading-snug ${done ? 'text-muted line-through decoration-accent/50' : ''}`}>{st.text}</span>
                      <span className="shrink-0 text-[12px] font-bold text-muted tabular-nums">
                        {v}/{st.target}
                      </span>
                      {!done && st.route && !mirror && (
                        <button type="button" aria-label={p('קח אותי', 'קחי אותי')} onClick={() => go(st.route!)} className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                          <ChevronLeft size={16} strokeWidth={2.6} />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className={`px-4 py-2.5 text-center text-[13px] font-bold ${owned ? 'bg-accent text-white' : ready ? 'bg-[linear-gradient(180deg,#FFE07A,#F2B530)] text-[#5A3A06]' : 'bg-[#EFE4D6] text-[#8B7A68]'}`}>
                {owned ? 'שלך ✓' : ready ? `נפתח! מחכה בחנות · ${sk.price.toLocaleString('he-IL')} ${COIN}` : `נעול · אחרי המשימה: ${sk.price.toLocaleString('he-IL')} ${COIN}`}
              </div>
            </section>
          );
        })}

        <section className="mt-2">
          <h3 className="font-serif text-[22px]">החברים המתחבאים</h3>
          {mirror && <p className="mb-1 rounded-xl bg-ink px-3 py-1.5 text-[12.5px] font-bold text-white">👀 רק {a('אתה רואה', 'את רואה')} את התשובות. אצל {P} יש צללית וחצי רמז.</p>}
          <p className="mb-3 text-[14px] text-muted">
            {found.length}/{FRIENDS.length} נמצאו · כל אחד נתפס בנגיעה, קופץ משמחה, ונעלם לתמיד. כל חבר שווה 25 {COIN}. כולם ביחד פותחים את החד־קרן.
          </p>
          <ul className="grid grid-cols-2 gap-2.5">
            {FRIENDS.map((f) => {
              const got = found.includes(f.id);
              return (
                <li key={f.id} className={`flex flex-col rounded-2xl p-3 ${got ? 'bg-butter' : 'bg-paper shadow-soft'}`}>
                  <div className="relative mx-auto mb-2 size-[72px]">
                    <FriendArt id={f.id} still={!got} className={`size-full ${got || mirror ? '' : 'opacity-25 blur-[1.5px] brightness-0'}`} />
                    {!got && !mirror && <span className="absolute inset-0 flex items-center justify-center font-serif text-[30px] text-ink/70">?</span>}
                  </div>
                  <p className="text-center text-[14px] font-bold">{got || mirror ? f.name : '???'}</p>
                  <p className="mt-1 text-[12.5px] leading-snug text-muted">{got ? 'נמצא ✓' : mirror ? `${f.page}: ${f.hint}` : f.half}</p>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-2xl bg-soft px-4 py-3 text-[14px] leading-relaxed">
          <p className="font-bold">ועוד דבר</p>
          <p className="text-muted">
            כל בוקר מחכה הרפתקה חדשה: שבעה שלבים בכל האתר. אם לא הספקת, היא מחכה לך למחר. שבע הרפתקאות פותחות את {species.name} היהלום.
          </p>
        </section>
      </div>
    </Sheet>
  );
}
