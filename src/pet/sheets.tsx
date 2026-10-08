import { useState } from 'react';
import { Lock, Mic } from 'lucide-react';
import { motion } from 'motion/react';
import { answer, canHear, chatTopics, hearOnce, speak } from './chat';
import { EndFriend } from '../components/Friends';
import { legendOf, legendReady, stepValue } from './quests';
import { Sheet } from '../components/Sheet';
import { tap } from '../lib/haptics';
import { achievements, COIN, CROWN_PITY, foods, items, LUCKY_CROWN, milestones, rooms, skins, wheel, type Slot, type WheelSlice } from './catalog';
import { PetIcon, PotionBottle, type IconName } from './icons';
import { ageDays, buy, claimMilestone, claimTask, feed, owns, setSkin, spin, stageOf, talkTo, tasksFor, wear, type Notice, type PetState } from './engine';
import { LuckyCrown, PigSvg } from './PigSvg';
import { coin } from './sound';
import { species } from './species';
import { p } from '../lib/he';

export type Run = <R>(fn: (p: PetState, out: Notice[]) => R) => R | undefined;
type Props = { open: boolean; onClose: () => void; pet: PetState; run: Run; fail: (msg: string) => void };

const Coins = ({ n }: { n: number }) => (
  <span className="inline-flex items-center gap-1 font-bold tabular-nums">
    {n.toLocaleString('he-IL')} <span aria-hidden>{COIN}</span>
  </span>
);

function Bar({ value, max, color = 'bg-accent' }: { value: number; max: number; color?: string }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-line">
      <div className={`h-full rounded-full ${color} transition-[width] duration-500`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
    </div>
  );
}

/* ───────────── Food drawer ───────────── */

export function FoodSheet({ open, onClose, pet, run, fail, onFed }: Props & { onFed: (id: string, emoji: string) => void }) {
  const give = (id: string) => {
    tap(8);
    const err = run((p, out) => feed(p, id, out));
    if (err) return fail(err);
    onFed(id, foods.find((f) => f.id === id)!.emoji);
    onClose();
  };
  const purchase = (id: string) => {
    const err = run((p, out) => buy(p, id, out));
    if (err) fail(err);
    else coin();
  };
  return (
    <Sheet open={open} onClose={onClose} title={`מה ${pet.name} אוכל?`}>
      <p className="-mt-2 mb-3 text-[14px] text-muted">
        יש לך <Coins n={pet.coins} /> · {species.id === 'guineaPig' ? 'שרקנים צריכים ויטמין C, אז פלפל ופטרוזיליה הכי בריאים' : `${species.staple.name} תמיד יש, בחינם`}
      </p>
      <ul className="grid grid-cols-2 gap-2.5 pb-4">
        {foods.map((f) => {
          const have = f.price === 0 ? '∞' : (pet.food[f.id] ?? 0);
          const empty = f.price > 0 && !(pet.food[f.id] > 0);
          return (
            <li key={f.id} className="rounded-2xl bg-paper p-3 shadow-soft">
              <button type="button" onClick={() => give(f.id)} disabled={empty} className="flex w-full items-center gap-2.5 text-right disabled:opacity-45">
                {f.potion ? <PotionBottle color={f.color!} size={30} /> : <span className="text-[34px] leading-none">{f.emoji}</span>}
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{f.name}</span>
                  <span className="block text-[12px] text-muted">{f.note ?? `שובע +${f.hunger} · שמחה +${f.happy}`}</span>
                </span>
                <span className="rounded-full bg-soft px-2 py-0.5 text-[13px] font-bold">×{have}</span>
              </button>
              {f.price > 0 && (
                <button type="button" onClick={() => purchase(f.id)} className="mt-2 w-full rounded-full bg-butter py-1.5 text-[13px] font-bold">
                  לקנות עוד · {f.price} {COIN}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

/* ───────────── Shop & wardrobe ───────────── */

const TABS: { id: 'skin' | Slot; label: string }[] = [
  { id: 'skin', label: '🎨 סקינים' },
  { id: 'head', label: '🎩 כובעים' },
  { id: 'face', label: '🕶️ פנים' },
  { id: 'neck', label: '🎀 צוואר' },
  { id: 'room', label: '🏠 חדרים' },
];

/** Four-pointed sparkle for the shop. */
const Spark = ({ className = '', size = 12, delay = 0 }: { className?: string; size?: number; delay?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} className={`shop-spark pointer-events-none absolute ${className}`} style={{ animationDelay: `${delay}s` }} aria-hidden>
    <path d="M12 0 Q13.4 10.6 24 12 Q13.4 13.4 12 24 Q10.6 13.4 0 12 Q10.6 10.6 12 0Z" fill="#FFD66B" />
  </svg>
);

const BTN = 'w-full rounded-full py-[7px] text-[13px] font-bold transition-[transform,box-shadow] duration-100 active:translate-y-[2px]';
const BTN_GOLD = `${BTN} bg-[linear-gradient(180deg,#FFE27F_0%,#F6C443_55%,#EBA92A_100%)] text-[#5A3A06] shadow-[inset_0_1.5px_0_#FFF7CF,0_3px_0_#C98A12,0_7px_12px_-6px_rgb(170_110_0/0.6)] active:shadow-[inset_0_1.5px_0_#FFF7CF,0_1px_0_#C98A12]`;
const BTN_POOR = `${BTN} bg-[#EFE6DA] text-[#9B8B7A] shadow-[0_3px_0_#D9CBB8] active:shadow-[0_1px_0_#D9CBB8]`;
const BTN_WEAR = `${BTN} bg-[linear-gradient(180deg,#FFE3EA,#F8C1CF)] text-[#7A2A40] shadow-[inset_0_1.5px_0_#FFF4F7,0_3px_0_#E39AAE] active:shadow-[0_1px_0_#E39AAE]`;
const BTN_ON = `${BTN} bg-[linear-gradient(180deg,#C23B60,#8E1F3F)] text-white shadow-[inset_0_1.5px_0_rgb(255_255_255/0.25),0_3px_0_#5E1229]`;

const CARD = 'relative flex flex-col items-center rounded-[22px] bg-[linear-gradient(180deg,#FFFDF9_0%,#F9F0E6_100%)] px-2 pt-2 pb-2.5 shadow-[inset_0_1px_0_#fff,0_1px_2px_rgb(120_70_40/0.08),0_10px_20px_-12px_rgb(120_70_40/0.45)]';

export function ShopSheet({ open, onClose, pet, run, fail, mineOnly, onGuide }: Props & { mineOnly: boolean; onGuide?: () => void }) {
  const [tab, setTab] = useState<'skin' | Slot>('skin');
  const [hop, setHop] = useState<{ id: string; n: number } | null>(null);
  const purchase = (id: string, name: string) => {
    const err = run((p, out) => {
      const e = buy(p, id, out);
      if (!e) {
        // Put it on straight away: that's the fun part.
        const it = items.find((i) => i.id === id);
        if (it) wear(p, it.slot, id);
        else setSkin(p, id);
        out.unshift({ text: `🛍️ ${name} שלך!` });
      }
      return e;
    });
    if (err) fail(err);
    else {
      coin();
      setHop((h) => ({ id, n: (h?.n ?? 0) + 1 }));
    }
  };
  const toggle = (slot: 'skin' | Slot, id: string) => {
    tap(6);
    run((p) => (slot === 'skin' ? setSkin(p, id) : wear(p, slot, id)));
    setHop((h) => ({ id, n: (h?.n ?? 0) + 1 }));
  };

  const list =
    tab === 'skin'
      ? skins.filter((s) => !s.legend || mineOnly).map((s) => ({ id: s.id, name: s.name, price: s.price, exclusive: s.exclusive }))
      : items.filter((i) => i.slot === tab).map((i) => ({ id: i.id, name: i.name, price: i.price, exclusive: i.exclusive }));
  const shown = list.filter((x) => (mineOnly ? owns(pet, x.id) : !x.exclusive || owns(pet, x.id)));
  const worn = (id: string) => (tab === 'skin' ? pet.skin === id : tab === 'room' ? pet.wear.room === id : pet.wear[tab as 'head'] === id);
  const legends = skins.filter((s) => s.legend);

  const card = (x: { id: string; name: string; price: number }, i: number) => {
    const mine = owns(pet, x.id);
    const on = worn(x.id);
    const body = (
      <div className={`${CARD} h-full`}>
        {on && (
          <>
            <Spark className="top-2 right-2.5" size={13} />
            <Spark className="top-9 left-2" size={9} delay={0.8} />
            <Spark className="top-[46%] right-3" size={8} delay={1.4} />
          </>
        )}
        {tab === 'room' ? (
          <div className="relative mb-1.5 aspect-square w-full overflow-hidden rounded-2xl shadow-[inset_0_2px_6px_rgb(0_0_0/0.12)]" style={{ background: rooms[x.id].bg }}>
            <div className="absolute inset-x-0 bottom-0 h-1/4" style={{ background: rooms[x.id].floor }} />
            <span className="absolute inset-0 flex items-center justify-center text-[30px]">{items.find((it) => it.id === x.id)?.emoji}</span>
          </div>
        ) : (
          <div className="relative mb-1 aspect-square w-full">
            <div className="absolute inset-x-[22%] bottom-[7%] h-[9%] rounded-[50%] bg-[#6B4430]/22 blur-[3px]" />
            <div key={hop?.id === x.id ? hop.n : 0} className={`size-full ${hop?.id === x.id ? 'shop-hop' : ''}`}>
              <PigSvg
                skin={tab === 'skin' ? x.id : pet.skin}
                head={tab === 'head' ? x.id : undefined}
                face={tab === 'face' ? x.id : undefined}
                neck={tab === 'neck' ? x.id : undefined}
                mood={on ? 'smile' : 'normal'}
                className="shop-breathe size-full p-1"
              />
            </div>
          </div>
        )}
        <span className="mb-2 min-h-[2lh] text-center text-[13.5px] leading-tight font-bold text-[#3A2228]">{x.name}</span>
        {mine ? (
          <button type="button" onClick={() => toggle(tab, x.id)} disabled={on && (tab === 'skin' || tab === 'room')} className={on ? BTN_ON : BTN_WEAR}>
            {on ? (tab === 'skin' || tab === 'room' ? 'עכשיו ✓' : 'להוריד') : 'ללבוש'}
          </button>
        ) : (
          <button type="button" onClick={() => purchase(x.id, x.name)} className={pet.coins >= x.price ? BTN_GOLD : BTN_POOR}>
            <span className="inline-flex items-center gap-1 tabular-nums">
              <span aria-hidden>{COIN}</span>
              {x.price.toLocaleString('he-IL')}
            </span>
          </button>
        )}
      </div>
    );
    return (
      <li key={x.id} className="shop-card-in" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
        {on ? <div className="h-full rounded-[24px] bg-[linear-gradient(135deg,#FFF0B3,#E2A93B_40%,#FFE9A0_60%,#C98A12)] p-[2.5px] shadow-[0_0_18px_-4px_rgb(242_193_78/0.8)]">{body}</div> : body}
      </li>
    );
  };

  return (
    <Sheet open={open} onClose={onClose} title={mineOnly ? `הארון של ${pet.name}` : 'החנות'}>
      <div className="-mt-2 mb-3 flex items-center justify-between text-[14px]">
        <span className="text-muted">{mineOnly ? 'מה שכבר שלך. נוגעים כדי ללבוש' : 'קונים, וזה נלבש מיד'}</span>
        <span className="rounded-full bg-[#FFF6DA] px-3 py-1 shadow-[inset_0_1px_0_#fff,0_2px_6px_-2px_rgb(200_150_40/0.5)]">
          <Coins n={pet.coins} />
        </span>
      </div>
      <div className="no-scrollbar -mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pt-1 pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`relative shrink-0 rounded-full px-4 py-2 text-[14px] font-bold transition-[background,box-shadow] ${
              tab === t.id
                ? 'bg-[linear-gradient(180deg,#C23B60,#8E1F3F)] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_3px_0_#5E1229,0_8px_14px_-8px_rgb(142_31_63/0.8)]'
                : 'bg-[linear-gradient(180deg,#FFFDF9,#F6ECE1)] text-[#3A2228] shadow-[inset_0_1px_0_#fff,0_2px_0_#E6D6C4]'
            }`}
          >
            {t.label}
            {tab === t.id && <Spark className="-top-1 -left-0.5" size={11} />}
          </button>
        ))}
      </div>
      {!shown.length && <p className="py-8 text-center text-muted">עוד אין פה כלום. החנות מחכה 🛍️</p>}
      <ul className="grid grid-cols-3 gap-2.5 pb-5">{shown.map(card)}</ul>

      {tab === 'skin' && !mineOnly && (
        <section className="mb-4 overflow-hidden rounded-[26px] bg-[radial-gradient(120%_90%_at_50%_0%,#4A2440_0%,#2A1626_70%)] p-3.5 pb-4 shadow-[0_14px_30px_-16px_rgb(40_10_30/0.9)]">
          <div className="mb-3 flex items-center justify-between px-1">
            <div>
              <p className="text-[11px] font-bold tracking-[2px] text-[#F2C14E]">נפתחים רק במשימות</p>
              <h3 className="font-serif text-[22px] text-white">ה{species.plural} הנחשקים</h3>
            </div>
            <button
              type="button"
              onClick={onGuide}
              aria-label="איך פותחים אותם?"
              className="flex size-10 items-center justify-center rounded-full bg-[linear-gradient(180deg,#FFE27F,#EBA92A)] font-serif text-[22px] font-bold text-[#5A3A06] shadow-[inset_0_1.5px_0_#FFF7CF,0_3px_0_#A8700C] active:translate-y-[2px]"
            >
              ?
            </button>
          </div>
          <ul className="flex flex-wrap justify-center gap-2.5">
            {legends.map((l) => {
              const ready = legendReady(pet, l.id);
              const mine = owns(pet, l.id);
              const on = pet.skin === l.id;
              const steps = legendOf(l.id)!.steps;
              // One long step (find nine friends) reads better as its own count.
              const [done, of] =
                steps.length === 1 ? [Math.min(steps[0].target, stepValue(pet, steps[0].key)), steps[0].target] : [steps.filter((st) => stepValue(pet, st.key) >= st.target).length, steps.length];
              return (
                <li key={l.id} className="relative flex w-[calc((100%-20px)/3)] flex-col items-center rounded-[20px] bg-white/[0.07] p-2 pb-2.5 ring-1 ring-white/10">
                  <button type="button" onClick={ready ? undefined : onGuide} className="relative mb-1 aspect-square w-full" aria-label={ready ? l.name : `${l.name}: נעול`}>
                    <div key={hop?.id === l.id ? hop.n : 0} className={`size-full ${hop?.id === l.id ? 'shop-hop' : ''}`}>
                      <PigSvg skin={l.id} mood={on ? 'happy' : 'normal'} className={`size-full p-1 ${ready ? 'shop-breathe' : 'brightness-[0.28] saturate-0'}`} />
                    </div>
                    {!ready && (
                      <span className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-white">
                        <Lock size={20} strokeWidth={2.6} />
                        <span className="text-[12px] font-bold tabular-nums">
                          {done}/{of}
                        </span>
                      </span>
                    )}
                  </button>
                  <span className="mb-2 text-center text-[13.5px] leading-tight font-bold text-white">{ready ? l.name : '???'}</span>
                  {!ready ? (
                    <button type="button" onClick={onGuide} className={`${BTN} bg-white/10 text-white/80 shadow-[0_3px_0_rgb(0_0_0/0.35)]`}>
                      איך?
                    </button>
                  ) : mine ? (
                    <button type="button" onClick={() => toggle('skin', l.id)} disabled={on} className={on ? BTN_ON : BTN_WEAR}>
                      {on ? 'עכשיו ✓' : 'ללבוש'}
                    </button>
                  ) : (
                    <button type="button" onClick={() => purchase(l.id, l.name)} className={pet.coins >= l.price ? BTN_GOLD : BTN_POOR}>
                      <span className="inline-flex items-center gap-1 tabular-nums">
                        <span aria-hidden>{COIN}</span>
                        {l.price.toLocaleString('he-IL')}
                      </span>
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {tab === 'skin' && !mineOnly && <EndFriend id="kid" size={96} />}
    </Sheet>
  );
}

/* ───────────── Daily tasks ───────────── */

export function TasksSheet({ open, onClose, pet, run }: Props) {
  const tasks = tasksFor(pet.daily.date);
  return (
    <Sheet open={open} onClose={onClose} title="המשימות של היום">
      <p className="-mt-2 mb-4 text-[14px] text-muted">
        🔥 {pet.streak.count} ימים ברצף · מתחלפות כל בוקר ב-05:00 · כל השלוש = בונוס 50 {COIN}
      </p>
      <ul className="space-y-2.5 pb-5">
        {tasks.map((t) => {
          const v = Math.min(t.target, pet.daily.counters[t.counter] ?? 0);
          const claimed = pet.daily.claimed.includes(t.id);
          const ready = v >= t.target && !claimed;
          return (
            <li key={t.id} className="rounded-2xl bg-paper p-3.5 shadow-soft">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className={`font-bold ${claimed ? 'text-muted line-through' : ''}`}>{t.text}</span>
                {ready ? (
                  <button
                    type="button"
                    onClick={() => run((p, out) => claimTask(p, t.id, out))}
                    className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-[13px] font-bold text-white"
                  >
                    לקחת {t.coins} {COIN}
                  </button>
                ) : (
                  <span className="shrink-0 text-[13px] text-muted">{claimed ? '✓ בוצע' : `${v}/${t.target}`}</span>
                )}
              </div>
              <Bar value={v} max={t.target} color={claimed ? 'bg-gold' : 'bg-accent'} />
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

/* ───────────── Achievements ───────────── */

export function AchievementsSheet({ open, onClose, pet }: Props) {
  const val = (c: string) => (c === 'level' ? pet.level : c === 'streak' ? pet.streak.count : (pet.counters[c] ?? 0));
  return (
    <Sheet open={open} onClose={onClose} title={`הישגים · ${pet.achievements.length}/${achievements.length}`}>
      <ul className="grid grid-cols-2 gap-2.5 pb-5">
        {achievements.map((a) => {
          const got = pet.achievements.includes(a.id);
          return (
            <li key={a.id} className={`rounded-2xl p-3 ${got ? 'bg-butter' : 'bg-paper opacity-80'} shadow-soft`}>
              <div className={`text-[30px] leading-none ${got ? '' : 'grayscale'}`}>{a.emoji}</div>
              <div className="mt-1.5 font-bold">{a.title}</div>
              <div className="mb-2 text-[12px] text-muted">{a.desc}</div>
              {got ? (
                <span className="text-[12px] font-bold text-gold-text">
                  ✓ +{a.coins} {COIN}
                </span>
              ) : (
                <Bar value={val(a.counter)} max={a.target} color="bg-gold" />
              )}
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

/* ───────────── The year journey ───────────── */

export function JourneySheet({ open, onClose, pet, run }: Props) {
  const days = ageDays(pet);
  const stage = stageOf(days);
  return (
    <Sheet open={open} onClose={onClose} title={`המסע של ${pet.name}`}>
      <div className="mb-4 rounded-2xl bg-paper p-4 shadow-soft">
        <div className="mb-1 flex items-baseline justify-between">
          <span className="font-serif text-[20px]">{stage.name}</span>
          <span className="text-[14px] text-muted">יום {Math.min(days + 1, 365)} מתוך 365</span>
        </div>
        <Bar value={days} max={365} color="bg-gradient-to-l from-accent to-gold" />
        <p className="mt-2 text-[13px] text-muted">
          אומץ ב-{new Date(pet.adoptedAt).toLocaleDateString('he-IL')} · כל יום הוא גדל עוד קצת. בסוף השנה מחכה הפתעה 🎂
        </p>
      </div>
      <ol className="relative space-y-2 pb-6 before:absolute before:top-2 before:right-[19px] before:bottom-8 before:w-0.5 before:bg-line">
        {milestones.map((m) => {
          const reached = days >= m.day;
          const claimed = pet.milestones.includes(m.day);
          return (
            <li key={m.day} className="relative flex items-center gap-3">
              <span
                className={`z-10 flex size-10 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${claimed ? 'bg-gold text-white' : reached ? 'bg-accent text-white' : 'bg-paper text-muted shadow-soft'}`}
              >
                {m.day}
              </span>
              <div className="flex flex-1 items-center justify-between gap-2 rounded-2xl bg-paper px-3 py-2.5 shadow-soft">
                <div>
                  <div className={`font-bold ${reached ? '' : 'text-muted'}`}>{m.title}</div>
                  <div className="text-[12px] text-muted">
                    {m.coins} {COIN}
                    {m.unlock && ' + פריט מיוחד 🎁'}
                    {!reached && ` · עוד ${m.day - days} ימים`}
                  </div>
                </div>
                {reached && !claimed && (
                  <button
                    type="button"
                    onClick={() => run((p, out) => claimMilestone(p, m.day, out))}
                    className="shrink-0 rounded-full bg-accent px-3 py-1.5 text-[13px] font-bold text-white"
                  >
                    לפתוח 🎁
                  </button>
                )}
                {claimed && <span className="text-[18px]">✓</span>}
              </div>
            </li>
          );
        })}
      </ol>
    </Sheet>
  );
}

/* ───────────── Talking to him (when the microphone can't) ───────────── */

export function ChatSheet({ open, onClose, pet, run, onSaid, onEcho }: Props & { onSaid: (reply: string) => void; onEcho: () => void }) {
  const [log, setLog] = useState<{ me: string; him: string }[]>([]);
  const [hearing, setHearing] = useState(false);
  const respond = (said: string, typed: boolean) => {
    const him = answer(pet, said);
    setLog((l) => [...l.slice(-5), { me: said, him }]);
    run((p, out) => talkTo(p, out, typed));
    speak(him);
    onSaid(him);
  };
  const listen = async () => {
    if (hearing) return;
    tap(8);
    setHearing(true);
    const said = await hearOnce();
    setHearing(false);
    if (said.trim()) respond(said.trim(), false);
    else setLog((l) => [...l.slice(-5), { me: '…', him: `לא שמעתי טוב. ${p('תגיד', 'תגידי')} שוב? 👂` }]);
  };
  return (
    <Sheet open={open} onClose={onClose} title={`לדבר עם ${pet.name}`}>
      <p className="-mt-2 mb-3 text-[14px] text-muted">אפשר להגיד לו משהו בקול או ללחוץ על משפט, והוא עונה בעברית. כל משפט ממלא לו את השמחה.</p>

      {log.length > 0 && (
        <ol className="mb-3 flex flex-col gap-1.5 rounded-2xl bg-soft p-3">
          {log.map((m, i) => (
            <li key={i} className="flex flex-col gap-1">
              <span className="self-start rounded-2xl rounded-br-md bg-accent px-3 py-1.5 text-[14px] text-white">{m.me}</span>
              <motion.span
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="self-end rounded-2xl rounded-bl-md bg-paper px-3 py-1.5 text-[14px] shadow-soft"
              >
                {m.him}
              </motion.span>
            </li>
          ))}
        </ol>
      )}

      {canHear() && (
        <button
          type="button"
          onClick={listen}
          className={`mb-3 flex w-full items-center justify-center gap-2 rounded-full py-3 text-[16px] font-bold text-white transition-transform active:scale-[0.98] ${hearing ? 'listening bg-[#E0476B]' : 'bg-accent'}`}
        >
          <Mic size={20} strokeWidth={2.4} />
          {hearing ? `מקשיב… ${p('דבר', 'דברי')}` : 'להגיד לו משהו בקול'}
        </button>
      )}

      <div className="flex flex-wrap gap-2">
        {chatTopics.map((say) => (
          <button
            key={say}
            type="button"
            onClick={() => {
              tap(6);
              respond(say, true);
            }}
            className="rounded-2xl rounded-br-md bg-paper px-3.5 py-2 text-[15px] font-bold shadow-soft transition-transform active:scale-95"
          >
            {say}
          </button>
        ))}
      </div>
      <button type="button" onClick={onEcho} className="mt-4 mb-6 w-full text-center text-[13px] font-bold text-muted underline underline-offset-4">
        או שהוא יחזור {p('אחריך', 'אחרייך')} בקול מצחיק (עד 30 שניות)
      </button>
    </Sheet>
  );
}

/* ───────────── Lucky wheel ───────────── */

export function WheelSheet({ open, onClose, pet, run, fail }: Props) {
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const n = wheel.length;
  const slice = 360 / n;
  const hasCrown = pet.owned.includes(LUCKY_CROWN);
  const pity = pet.counters.crownPity ?? 0;
  const go = () => {
    if (spinning) return;
    if (pet.daily.spun) return fail('כבר סובבת היום. מחר עוד סיבוב 🎡');
    // Decide first, then animate to it; the prize shows when the wheel stops.
    let notices: Notice[] = [];
    const i = run((p, out) => {
      const r = spin(p, out);
      notices = out.splice(0);
      return r;
    });
    if (i == null) return;
    tap(12);
    setSpinning(true);
    const target = 360 * 6 + (360 - (i * slice + slice / 2));
    setAngle((a) => a - (a % 360) + target);
    window.setTimeout(() => {
      setSpinning(false);
      tap(30);
      run((_, out) => out.push(...notices));
    }, 4200);
  };
  return (
    <Sheet open={open} onClose={onClose} title="גלגל המזל">
      <p className="-mt-2 mb-4 text-[14px] text-muted">סיבוב אחד חינם כל יום. יש בו מטבעות, אוכל, יום פינוק, הפתעה לארון, ניסיון, סיבוב נוסף, ואת הכתר הכי נדיר שיש.</p>
      <div className="relative mx-auto mb-5 aspect-square w-[min(310px,82vw)]">
        <svg viewBox="-14 -6 28 22" className="absolute top-[-10px] left-1/2 z-10 w-9 -translate-x-1/2 drop-shadow-[0_3px_3px_rgb(60_20_20/0.35)]" aria-hidden>
          <path d="M-11 -3 Q0 -6 11 -3 L1.6 13 Q0 15.5 -1.6 13 Z" fill="#C2385A" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
        </svg>
        <svg
          viewBox="-104 -104 208 208"
          direction="ltr"
          className="size-full drop-shadow-lg"
          style={{ transform: `rotate(${angle}deg)`, transition: spinning ? 'transform 4s cubic-bezier(.15,.85,.2,1)' : 'none' }}
        >
          <circle r="103" fill="#6B2A3A" />
          {wheel.map((w, i) => {
            const h = (slice / 2) * (Math.PI / 180);
            const mid = (i + 0.5) * slice;
            return (
              <g key={i} transform={`rotate(${mid})`}>
                <path d={`M0 0 L${-Math.sin(h) * 94} ${-Math.cos(h) * 94} A94 94 0 0 1 ${Math.sin(h) * 94} ${-Math.cos(h) * 94} Z`} fill={w.color} stroke="#fff" strokeWidth="1.6" />
                <g transform="translate(0 -70)">
                  <WheelGlyph w={w} />
                </g>
                {/* labels on the lower half turn over, so none is upside down */}
                <text
                  y="-44"
                  transform={mid > 90 && mid < 270 ? 'rotate(180 0 -44)' : undefined}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={w.label.length > 3 ? 10.5 : 13}
                  fontWeight="800"
                  fill={w.kind === 'crown' ? '#FFE07A' : '#3a2228'}
                >
                  {w.label}
                </text>
              </g>
            );
          })}
          {/* bulbs around the rim, blinking while it turns */}
          {Array.from({ length: n * 2 }, (_, k) => {
            const a = ((k * 180) / n) * (Math.PI / 180);
            return (
              <circle
                key={k}
                className={spinning ? 'wheel-bulb' : ''}
                style={{ animationDelay: `${(k % 2) * 0.18}s` }}
                cx={Math.sin(a) * 98.5}
                cy={-Math.cos(a) * 98.5}
                r="2.6"
                fill={k % 2 ? '#FFE9A8' : '#fff'}
              />
            );
          })}
          <circle r="17" fill="#F2C14E" stroke="#fff" strokeWidth="3.5" />
          <circle r="9" fill="#C2385A" />
          <circle cx="-3" cy="-3" r="3" fill="#fff" opacity="0.7" />
        </svg>
      </div>
      <button
        type="button"
        onClick={go}
        disabled={spinning}
        className={`mb-4 w-full rounded-full py-3.5 text-[17px] font-bold transition active:scale-[0.97] ${pet.daily.spun && !spinning ? 'bg-line text-muted' : 'bg-accent text-white shadow-[0_8px_18px_-8px_rgb(194_56_90/0.7)]'}`}
      >
        {spinning ? 'מסתובב…' : pet.daily.spun ? 'נתראה מחר 🎡' : 'לסובב!'}
      </button>

      {/* the lucky crown: rare, only here, and every spin without it fills the luck meter */}
      <section className="mb-6 flex items-center gap-3 rounded-[22px] bg-[linear-gradient(160deg,#3A2238,#5B2A4A)] p-3.5 text-white shadow-[0_12px_26px_-14px_rgb(58_34_56/0.9)]">
        <svg viewBox="40 0 120 96" className="w-[74px] shrink-0 drop-shadow-[0_4px_6px_rgb(0_0_0/0.35)]" aria-hidden>
          <LuckyCrown />
        </svg>
        <div className="min-w-0 flex-1">
          <p className="font-serif text-[19px] leading-tight">כתר המזל</p>
          {hasCrown ? (
            <p className="mt-0.5 text-[13px] leading-snug text-white/75">
              כבר שלך! מעכשיו, כשהגלגל נעצר על הכתר, זה 300 {COIN}.
            </p>
          ) : (
            <>
              <p className="mt-0.5 text-[13px] leading-snug text-white/75">
                הכי נדיר שיש, ואי אפשר להשיג אותו בשום מקום אחר. כל סיבוב בלי כתר ממלא את מד המזל, וכשהוא מלא, הכתר שלך.
              </p>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-[linear-gradient(90deg,#FFE07A,#F2B530)] transition-[width] duration-700"
                  style={{ width: `${Math.max(4, Math.min(1, pity / (CROWN_PITY - 1)) * 100)}%` }}
                />
              </div>
              <p className="mt-1 text-[11.5px] font-bold text-[#FFE07A] tabular-nums">
                מד המזל {pity}/{CROWN_PITY - 1}
              </p>
            </>
          )}
        </div>
      </section>
    </Sheet>
  );
}

/** What each slice of the wheel shows: drawn, not emoji. */
function WheelGlyph({ w }: { w: WheelSlice }) {
  const icon = (name: IconName) => (
    <g transform="translate(-11 -11)">
      <PetIcon name={name} size={22} />
    </g>
  );
  switch (w.kind) {
    case 'coins':
      return (
        <g>
          <circle r="9" fill="#F2C14E" stroke="#B98316" strokeWidth="1.6" />
          <circle r="5.5" fill="none" stroke="#FFF3C4" strokeWidth="1.4" />
          <circle cx="-3" cy="-3.5" r="1.8" fill="#fff" opacity="0.8" />
        </g>
      );
    case 'food':
      return icon('carrot');
    case 'boost':
      return icon('heart');
    case 'mystery':
      return icon('gift');
    case 'xp':
      return icon('medal');
    case 'again':
      return icon('wheel');
    case 'crown':
      return (
        <g transform="scale(0.24) translate(-100 -58)">
          <LuckyCrown />
        </g>
      );
  }
}

