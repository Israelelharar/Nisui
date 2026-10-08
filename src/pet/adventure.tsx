import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';
import {
  AudioLines,
  Bath,
  CalendarHeart,
  Carrot,
  Check,
  ChevronLeft,
  Cloud,
  Fence,
  FerrisWheel,
  Gamepad2,
  Gift,
  GlassWater,
  Hand,
  Image,
  Images,
  Laugh,
  ListChecks,
  Mail,
  MessageCircleHeart,
  Moon,
  Search,
  Shirt,
  Smile,
  Sparkles,
  Sprout,
  WandSparkles,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Sheet } from '../components/Sheet';
import { useApp } from '../hooks/useApp';
import { tap } from '../lib/haptics';
import { COIN } from './catalog';
import { PLAN_REWARD, planComplete, planDoneCount, planSteps, stepProgress, type Plan, type PlanStepDef } from './quests';
import { ensureTodayPlan, usePet } from './usePet';
import { species } from './species';
import { p } from '../lib/he';

const ICON: Record<string, LucideIcon> = {
  mood: Smile,
  letter: Mail,
  reach: MessageCircleHeart,
  photo_day: Image,
  joke: Laugh,
  gallery: Images,
  dates: CalendarHeart,
  find: Search,
  feeds: Carrot,
  pets: Hand,
  baths: Bath,
  games: Gamepad2,
  care: Sprout,
  water: GlassWater,
  dress: Shirt,
  spins: FerrisWheel,
  goodnight: Moon,
  sound: AudioLines,
  goals_set: ListChecks,
  sheep: Cloud,
  pouch: Gift,
  farm_play: Fence,
  wish: Sparkles,
  tricks: WandSparkles,
  combos: Zap,
};

export const StepIcon = ({ k, size = 18 }: { k: string; size?: number }) => {
  const I = ICON[k] ?? Sparkles;
  return <I size={size} strokeWidth={2.2} aria-hidden />;
};

/** The trail: one stop per step, done ones filled, the next one breathing. */
function Trail({ plan }: { plan: Plan }) {
  const steps = planSteps(plan);
  const reduce = useReducedMotion();
  const next = steps.findIndex((d) => stepProgress(plan, d) < d.target);
  return (
    <div className="relative flex items-center justify-between px-1" aria-hidden>
      <div className="absolute inset-x-3 top-1/2 h-0 border-t-2 border-dashed border-accent/35" />
      {steps.map((d, i) => {
        const done = stepProgress(plan, d) >= d.target;
        return (
          <span
            key={d.key}
            className={`relative flex size-8 items-center justify-center rounded-full border-2 transition-colors ${done ? 'border-accent bg-accent text-white' : i === next ? 'border-accent bg-paper text-accent' : 'border-line bg-paper text-muted'}`}
          >
            {i === next && !reduce && (
              <motion.span className="absolute inset-0 rounded-full border-2 border-accent" animate={{ scale: [1, 1.5], opacity: [0.7, 0] }} transition={{ duration: 1.8, repeat: Infinity }} />
            )}
            {done ? <Check size={15} strokeWidth={3} /> : <StepIcon k={d.key} size={14} />}
          </span>
        );
      })}
    </div>
  );
}

function GoButton({ d, onGo }: { d: PlanStepDef; onGo?: () => void }) {
  const nav = useNavigate();
  return (
    <button
      type="button"
      onClick={() => {
        tap(8);
        onGo?.();
        nav(d.route);
      }}
      className="flex shrink-0 items-center gap-0.5 rounded-full bg-accent px-3 py-1.5 text-[13px] font-bold text-white shadow-soft active:scale-95"
    >
      {p('קח אותי', 'קחי אותי')}
      <ChevronLeft size={15} strokeWidth={2.6} />
    </button>
  );
}

/** On the home page: today's adventure at a glance, and the way to the next step. */
export function AdventureCard() {
  const { pet, mirror } = usePet();
  const { clock } = useApp();
  const nav = useNavigate();
  const today = clock.contentDate;
  useEffect(() => ensureTodayPlan(today), [today, pet?.adoptedAt]);
  const plan = pet?.plan;
  if (!pet || !plan) return null;
  const steps = planSteps(plan);
  const next = steps.find((d) => stepProgress(plan, d) < d.target);
  const done = planDoneCount(plan);
  const waited = plan.date < today && !plan.claimed;

  return (
    <section className="rounded-[24px] bg-paper px-4 pt-4 pb-4 shadow-soft">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="font-serif text-[20px]">ההרפתקה של היום</h2>
        <span className="text-[13px] font-bold text-muted tabular-nums">
          {plan.claimed ? 'הושלמה' : `${done}/${steps.length}`}
        </span>
      </div>
      <Trail plan={plan} />
      <div className="mt-3.5 flex items-center gap-3">
        {plan.claimed ? (
          <p className="text-[14px] text-muted">סיימת את ההרפתקה. מחר בבוקר מחכה חדשה.</p>
        ) : next ? (
          <>
            <p className="min-w-0 flex-1 text-[15px] leading-snug">
              {waited && <span className="block text-[12px] text-muted">ההרפתקה חיכתה לך מאתמול</span>}
              {next.text}
              {next.target > 1 && (
                <span className="ms-1 text-[13px] text-muted tabular-nums">
                  ({stepProgress(plan, next)}/{next.target})
                </span>
              )}
            </p>
            {!mirror && <GoButton d={next} />}
          </>
        ) : (
          <>
            <p className="min-w-0 flex-1 text-[15px] font-bold">כל השלבים הושלמו! הפרס מחכה.</p>
            {!mirror && (
              <button type="button" onClick={() => nav('/pet?open=plan')} className="shrink-0 rounded-full bg-gold px-3.5 py-1.5 text-[13px] font-bold text-ink shadow-soft active:scale-95">
                לקחת {PLAN_REWARD} {COIN}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/** In the pig's menu: the whole adventure, step by step. */
export function AdventureSheet({ open, onClose, plan, onClaim, mirror }: { open: boolean; onClose: () => void; plan: Plan | undefined; onClaim: () => void; mirror: boolean }) {
  return (
    <Sheet open={open} onClose={onClose} title={plan ? `הרפתקה מס׳ ${plan.n}` : 'ההרפתקה של היום'}>
      {plan && (
        <div className="flex flex-col gap-3 pb-5">
          <p className="-mt-2 text-[14px] text-muted">
            שבעה שלבים בכל האתר. אין לחץ: אם לא סיימת היום, היא מחכה לך מחר. בסוף: {PLAN_REWARD} {COIN}, וכל שבע הרפתקאות פותחות את {species.name} היהלום.
          </p>
          <Trail plan={plan} />
          <ol className="mt-1 flex flex-col gap-2">
            {planSteps(plan).map((d) => {
              const v = stepProgress(plan, d);
              const done = v >= d.target;
              return (
                <li key={d.key} className={`flex items-center gap-3 rounded-2xl px-3.5 py-3 ${done ? 'bg-soft' : 'bg-paper shadow-soft'}`}>
                  <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${done ? 'bg-accent text-white' : 'bg-soft text-accent'}`}>
                    {done ? <Check size={17} strokeWidth={3} /> : <StepIcon k={d.key} />}
                  </span>
                  <span className={`min-w-0 flex-1 text-[15px] leading-snug ${done ? 'text-muted line-through decoration-accent/50' : ''}`}>
                    {d.text}
                    {d.target > 1 && !done && <span className="ms-1 text-[13px] text-muted tabular-nums">({v}/{d.target})</span>}
                  </span>
                  {!done && !mirror && <GoButton d={d} onGo={onClose} />}
                </li>
              );
            })}
          </ol>
          {plan.claimed ? (
            <p className="py-2 text-center font-hand text-[16px] text-accent">הושלמה. הרפתקה חדשה מחכה מחר בבוקר.</p>
          ) : (
            <button
              type="button"
              disabled={!planComplete(plan) || mirror}
              onClick={onClaim}
              className="h-13 rounded-2xl bg-accent text-[16px] font-bold text-white shadow-soft disabled:opacity-45 active:scale-[0.98]"
            >
              {planComplete(plan) ? `לקחת את הפרס · ${PLAN_REWARD} ${COIN}` : `עוד ${planSteps(plan).length - planDoneCount(plan)} שלבים לפרס`}
            </button>
          )}
        </div>
      )}
    </Sheet>
  );
}

