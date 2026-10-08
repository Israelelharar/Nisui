import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useApp } from '../hooks/useApp';
import { tap } from '../lib/haptics';
import { track } from '../lib/events';
import { burstHeart } from '../components/HeartBurst';
import { Sheet } from '../components/Sheet';
import { COIN, foods, growth, items, lines, milestonesFor, nameIdeas, pick, skins, tricks, type TrickId } from '../pet/catalog';
import { TricksSheet } from '../pet/tricks';
import {
  adopt,
  ageDays,
  bathe,
  breathe,
  buy,
  feed,
  tasksFor,
  checkAchievements,
  canPlay,
  claimVisit,
  cleanPoop,
  finishGame,
  moodOf,
  openGift,
  pet as petAction,
  rollDay,
  stageOf,
  tick,
  toggleSleep,
  trick as trickAction,
  xpForNext,
  type Gift,
  type Notice,
  type PetState,
  type AnimStyle,
} from '../pet/engine';
import { act, listBackups, resync, restoreBackup, sendGift, setPet, usePet, type Backup } from '../pet/usePet';
import { PigSvg, type Face } from '../pet/PigSvg';
import { PigActor, animStyles, type ActorApi } from '../pet/PigActor';
import type { GameResult } from '../pet/arcade/kit';
import { GAMES, gameById, type GameId } from '../pet/arcade/registry';
import { Arcade } from '../pet/arcade/Arcade';
import { GameScreen } from '../pet/arcade/GameScreen';
import { AchievementsSheet, FoodSheet, JourneySheet, ShopSheet, TasksSheet, WheelSheet, type Run } from '../pet/sheets';
import { babble, ceremony, chirp, click, coin as coinSound, fanfare, pop, setSoundOn, shutter, squeak } from '../pet/sound';
import { RoomWeather } from '../pet/scene';
import { CloudBubble } from '../pet/ui';
import { RoomBackdrop, ROOMS, type RoomId } from '../pet/rooms';
import { BathTray, BedTray, CoinPill, FoodTray, LevelRing, MenuButton, MenuDrawer, MenuHead, NeedButton, PlayTray, SideButton } from '../pet/hud';
import { capture, savePhoto, type PhotoMeta } from '../pet/album';
import { AlbumSheet } from '../pet/AlbumSheet';
import { ShowerRain } from '../pet/ShowerRain';
import { PetIcon, type IconName } from '../pet/icons';
import { MusicBox } from '../pet/music';
import { personalLine, personalityOf, visitHour } from '../pet/personality';
import { CareSheet, KnowSheet, Breathing } from '../pet/care';
import { AdventureSheet } from '../pet/adventure';
import { LegendGuide } from '../pet/guide';
import { claimPlan, ensurePlan, planComplete, planDoneCount } from '../pet/quests';
import { useSearchParams } from 'react-router';
import { PeekFriend } from '../components/Friends';
import { species } from '../pet/species';
import { A, P, a, p } from '../lib/he';
import { client } from '../client';

/** Her drawing studio, opened straight to the gallery from the menu. */
const Studio = lazy(() => import('../pet/arcade/DrawGame').then((m) => ({ default: m.DrawGame })));

/**
 * "the pet room": the partner's pet to raise for a year. He gets hungry,
 * dirty, sleepy and lonely in real time, grows up, earns and spends
 * sunflower seeds, plays games, and collects hats, skins and rooms.
 */
type SheetId =
  | 'chat'
  | 'tricks'
  | 'plan'
  | 'guide'
  | 'care'
  | 'know'
  | 'album'
  | 'style'
  | 'food'
  | 'shop'
  | 'wardrobe'
  | 'tasks'
  | 'achievements'
  | 'journey'
  | 'wheel'
  | 'games'
  | 'settings'
  | 'gift'
  | 'send'
  | null;

/** The friend who comes over on the days they are together. */
/** The admin's pet friend that visits on days they're together: another animal in a bow tie. */
const ADMIN_PET = { skin: 'choco', neck: 'bowtie', species: species.id === 'dog' ? ('cat' as const) : ('dog' as const) };


export function PetPage() {
  const { pet, gifts, mirror, synced, failed } = usePet();
  // Wait for the server's copy first, so an old copy on this device never overwrites a newer one.
  if (!synced)
    return (
      <div className="flex justify-center pt-32">
        <PigSvg skin="classic" mood="asleep" className="w-[120px] animate-pulse opacity-60" />
      </div>
    );
  // Couldn't reach the server and nothing on this phone: never offer to adopt a new one
  // (the pet is safe on the server), just try again.
  if (!pet && failed)
    return (
      <div className="px-6 pt-28 text-center text-[#F6E9DA]">
        <PigSvg skin="classic" mood="asleep" className="mx-auto mb-5 w-[130px] opacity-80" />
        <h1 className="mb-2 font-serif text-[26px]">ה{species.name} נמנם רגע</h1>
        <p className="mb-6 text-[15px] leading-relaxed text-[#E9D6C2]/75">לא הצלחתי להגיע אליו עכשיו. הוא בסדר גמור ושמור, רק צריך לנסות שוב.</p>
        <button type="button" onClick={resync} className="rounded-full bg-accent px-8 py-3.5 text-[17px] font-bold text-white">
          לנסות שוב
        </button>
      </div>
    );
  if (!pet)
    return (
      <div className="px-5 pt-7 pb-[120px]">
        <Adopt mirror={mirror} />
      </div>
    );
  return <PetHome pet={pet} gifts={gifts} mirror={mirror} />;
}

/* ───────────────────────── Adoption ───────────────────────── */

function Adopt({ mirror }: { mirror: boolean }) {
  const starters = skins.filter((s) => s.starter);
  const [skin, setSkin] = useState(starters[0].id);
  const [step, setStep] = useState<'hello' | 'pick' | 'name'>('hello');
  const [name, setName] = useState('');
  const suggested = client.pet?.suggestedName ?? species.names[0];

  const done = () => {
    const n = name.trim() || suggested;
    setPet(adopt(n, skin));
    if (!mirror) track('pet_adopted', { name: n });
    burstHeart();
    fanfare();
  };

  return (
    <div className="pt-4 text-center text-[#F6E9DA]">
      {mirror && <MirrorBanner text={`${P} עוד לא ${p('אימץ', 'אימצה')} ${species.name}. מה ש${a('תעשה', 'תעשי')} פה נשאר רק אצלך.`} />}
      {step === 'hello' && (
        <>
          <div className="mx-auto mb-4 w-[190px]">
            <PigActor look={{ skin: 'classic', head: 'bow' }} style="bouncy" mood="happy" walk={false} />
          </div>
          <h1 className="mb-2 font-serif text-[30px] leading-tight">יש פה מישהו שמחכה לך</h1>
          <p className="mb-6 text-[16px] leading-relaxed text-[#E9D6C2]/75">
            {species.small} צריך בית, אוכל, ליטופים והרבה אהבה.
            <br />
            {p('תגדל', 'תגדלי')} אותו שנה שלמה, והוא יגדל איתך.
          </p>
          <button type="button" onClick={() => setStep('pick')} className="rounded-full bg-accent px-8 py-3.5 text-[18px] font-bold text-white shadow-paper">
            לאמץ אותו 💛
          </button>
        </>
      )}
      {step === 'pick' && (
        <>
          <h1 className="mb-1 font-serif text-[26px]">איזה מהם?</h1>
          <p className="mb-5 text-[#E9D6C2]/75">אחר כך אפשר לקנות לו עוד המון צבעים</p>
          <div className="mb-6 grid grid-cols-3 gap-3">
            {starters.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  tap(6);
                  chirp();
                  setSkin(s.id);
                }}
                className={`rounded-3xl bg-paper p-2 shadow-soft transition-transform ${skin === s.id ? 'scale-105 ring-3 ring-accent' : ''}`}
              >
                <PigSvg skin={s.id} mood={skin === s.id ? 'happy' : 'normal'} className={`w-full ${skin === s.id ? 'pig--bouncy' : 'pig--alive'}`} />
                <span className="mt-1 block text-[14px] font-bold text-[#3A2A20]">{s.name}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setStep('name')} className="rounded-full bg-accent px-8 py-3.5 text-[17px] font-bold text-white">
            זה! ←
          </button>
        </>
      )}
      {step === 'name' && (
        <>
          <div className="mx-auto mb-3 w-[150px]">
            <PigActor look={{ skin }} style="alive" mood="happy" walk={false} />
          </div>
          <h1 className="mb-4 font-serif text-[26px]">איך קוראים לו?</h1>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 18))}
            placeholder={suggested}
            className="mb-3 w-full rounded-2xl border-2 border-white/20 bg-white/90 text-[#3A2A20] px-4 py-3.5 text-center text-[20px] font-bold outline-none focus:border-accent"
            autoFocus
          />
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {nameIdeas.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setName(n)}
                className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[14px] font-bold"
              >
                {n}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={done}
            disabled={!name.trim()}
            className="rounded-full bg-accent px-8 py-3.5 text-[18px] font-bold text-white disabled:opacity-40"
          >
            ברוך הבא הביתה{name.trim() ? `, ${name.trim()}` : ''} 🏡
          </button>
        </>
      )}
    </div>
  );
}

/** A little swirl of guinea pig poop, with stink lines and a fly doing laps. */
function Poop() {
  return (
    <svg viewBox="0 0 44 44" width="48" height="48" overflow="visible" className="drop-shadow-[0_0_3px_rgb(255_240_220/0.9)]" aria-hidden>
      <g className="poop-stink" fill="none" stroke="#9BB06A" strokeWidth="1.8" strokeLinecap="round" opacity="0.8">
        <path d="M14 12 q-3 -4 0 -7 q3 -3 0 -6" />
        <path d="M24 10 q-3 -4 0 -7 q3 -3 0 -6" style={{ animationDelay: '0.5s' }} />
      </g>
      <ellipse cx="22" cy="41" rx="15" ry="3" fill="rgb(40 20 10 / 0.25)" />
      <path d="M6 39 Q4 31 12 30 Q38 30 37 38 Q37 41 30 41 H12 Q6 41 6 39 Z" fill="#7A4A2A" />
      <path d="M10 31 Q9 23 17 23 Q32 23 32 30 Q32 32 28 32 H14 Q10 32 10 31 Z" fill="#8A5631" />
      <path d="M14 24 Q14 16 21 16 Q27 16 27 22 Q27 24 24 24 H17 Q14 24 14 24 Z" fill="#9A6239" />
      <path d="M19 17 Q20 11 25 12 Q22 14 23 17 Z" fill="#9A6239" />
      <path d="M12 33 Q18 35 26 33 M15 26 Q20 27 25 26" stroke="#5E361C" strokeWidth="1" fill="none" opacity="0.6" />
      <ellipse cx="16" cy="19.5" rx="2.2" ry="1.3" fill="#fff" opacity="0.45" />
      <g className="poop-fly">
        <ellipse cx="36" cy="10" rx="2.2" ry="1.8" fill="#2A2A2A" />
        <ellipse cx="35" cy="7.6" rx="2" ry="1.3" fill="#DDF1FF" opacity="0.85" />
        <ellipse cx="37.6" cy="7.8" rx="2" ry="1.3" fill="#DDF1FF" opacity="0.85" />
      </g>
    </svg>
  );
}

function MirrorBanner({ text }: { text: string }) {
  return <div className="mb-4 rounded-2xl border border-white/10 bg-black/35 px-4 py-2.5 text-[13px] font-bold text-white backdrop-blur">👀 {text}</div>;
}

/* ───────────────────────── Home ───────────────────────── */

function PetHome({ pet, gifts, mirror }: { pet: PetState; gifts: Gift[]; mirror: boolean }) {
  const { clock, showToast } = useApp();
  const reduce = useReducedMotion();
  const [sheet, setSheet] = useState<SheetId>(null);
  const [notes, setNotes] = useState<(Notice & { id: number })[]>([]);
  const noteId = useRef(0);
  const [now, setNow] = useState(() => Date.now());
  const [bath, setBath] = useState<number | null>(null);
  const [bubbles, setBubbles] = useState<{ id: number; x: number; y: number; r: number }[]>([]);
  const [game, setGame] = useState<GameId | null>(null);
  const [arcade, setArcade] = useState(false);
  const [gallery, setGallery] = useState(false);
  const [result, setResult] = useState<(GameResult & { game: GameId; won: number }) | null>(null);
  const [openedGift, setOpenedGift] = useState<Gift | null>(null);
  const [confetti, setConfetti] = useState(0);
  const [breathing, setBreathing] = useState(false);
  // Which of his rooms we're in, and which way the last move went (for the slide).
  const [room, setRoom] = useState<RoomId>(() => (pet.asleep ? 'bed' : 'home'));
  const [dir, setDir] = useState(1);
  const [menu, setMenu] = useState(false);
  const closeMenu = useCallback(() => setMenu(false), []);
  /** Food is being held near his mouth. */
  const [expect, setExpect] = useState(false);
  const actorBox = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number; t: number } | null>(null);
  const [moment, setMoment] = useState<{ id: number; text: string } | null>(null);
  const endMoment = useCallback(() => setMoment(null), []);
  const roomRef = useRef<HTMLDivElement>(null);
  const actor = useRef<ActorApi>(null);
  const coinBadge = useRef<HTMLButtonElement>(null);
  const [coinFly, setCoinFly] = useState<{ id: number; x: number; y: number; dx: number; dy: number; delay: number }[]>([]);
  const [coinBump, setCoinBump] = useState(0);
  const [flash, setFlash] = useState(0);
  const [lastPhoto, setLastPhoto] = useState<{ meta: PhotoMeta; img: string } | null>(null);
  const [albumKey, setAlbumKey] = useState(0);
  const box = useRef<MusicBox | null>(null);

  useEffect(() => setSoundOn(pet.sound), [pet.sound]);

  const notify = useCallback((list: Notice[]) => {
    if (!list.length) return;
    const withIds = list.map((n) => ({ ...n, id: noteId.current++ }));
    const big = withIds.find((n) => n.big);
    // The big one gets its own moment on stage; the rest go up as small notes.
    setNotes((cur) => [...cur, ...withIds.filter((n) => n !== big)].slice(-4));
    if (big) {
      ceremony();
      tap(30);
      setMoment({ id: big.id, text: big.text });
      setConfetti((c) => c + 1);
      actor.current?.play('spin');
      actor.current?.burst('stars', 8, { x: 50, y: 40 });
    } else if (list.some((n) => n.text.includes(COIN))) coinSound();
    // Seeds fly from him to the counter.
    const earned = list.reduce((a, n) => a + Number(n.text.match(new RegExp(`\\+(\\d+) ${COIN}`))?.[1] ?? 0), 0);
    const from = roomRef.current?.getBoundingClientRect();
    const to = coinBadge.current?.getBoundingClientRect();
    if (earned > 0 && from && to) {
      const n = Math.min(10, Math.max(2, Math.ceil(earned / 6)));
      const sx = from.left + from.width / 2;
      const sy = from.top + from.height * 0.62;
      const made = Array.from({ length: n }, (_, i) => ({
        id: noteId.current++,
        x: sx + (Math.random() - 0.5) * 60,
        y: sy + (Math.random() - 0.5) * 30,
        dx: 0,
        dy: 0,
        delay: i * 0.06,
      })).map((c) => ({ ...c, dx: to.left + to.width / 2 - c.x, dy: to.top + to.height / 2 - c.y }));
      setCoinFly((cur) => [...cur, ...made]);
      window.setTimeout(() => setCoinBump((b) => b + 1), 850);
      window.setTimeout(() => setCoinFly((cur) => cur.filter((c) => !made.includes(c))), 1000 + n * 60);
    }
    for (const n of withIds) window.setTimeout(() => setNotes((cur) => cur.filter((x) => x.id !== n.id)), n.big ? 3600 : 2400);
  }, []);

  const run: Run = useCallback(
    (fn) => {
      const { result, notices } = act(fn);
      notify(notices);
      return result;
    },
    [notify],
  );
  const fail = useCallback((msg: string) => showToast(msg), [showToast]);

  // No pull-to-refresh in his room: a flick down on him is a trick, not a reload.
  useEffect(() => {
    const el = document.documentElement;
    const before = el.style.overscrollBehaviorY;
    el.style.overscrollBehaviorY = 'none';
    document.body.style.overscrollBehaviorY = 'none';
    return () => {
      el.style.overscrollBehaviorY = before;
      document.body.style.overscrollBehaviorY = '';
    };
  }, []);

  // A new day (05:00): reset tasks, count the streak, pay the visit bonus.
  useEffect(() => {
    run((p, out) => {
      rollDay(p, clock.contentDate);
      claimVisit(p, out);
      visitHour(p, new Date().getHours(), out);
      ensurePlan(p, clock.contentDate);
    });
  }, [clock.contentDate, run]);

  // Sent here from elsewhere on the site ("take me there"): open the right drawer.
  const [params, setParams] = useSearchParams();
  useEffect(() => {
    const o = params.get('open');
    if (o === 'plan' || o === 'guide' || o === 'shop' || o === 'tricks') {
      setSheet(o);
      setParams({}, { replace: true });
    }
  }, [params, setParams]);

  // Live stats, without saving every few seconds.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 20_000);
    return () => window.clearInterval(id);
  }, []);
  const view = useMemo(() => {
    const c = structuredClone(pet);
    tick(c, Math.max(now, pet.tickedAt));
    return c;
  }, [pet, now]);
  // A potion's spell, while it lasts; re-render when it wears off.
  const [, setPotionTick] = useState(0);
  const potionFx = view.potion && view.potion.until > Date.now() ? view.potion.fx : null;
  useEffect(() => {
    if (!view.potion) return;
    const left = view.potion.until - Date.now();
    if (left <= 0) return;
    const t = window.setTimeout(() => setPotionTick((n) => n + 1), left + 50);
    return () => window.clearTimeout(t);
  }, [view.potion]);
  // Some spells keep sparkling while they last.
  useEffect(() => {
    if (potionFx !== 'love' && potionFx !== 'energy' && potionFx !== 'full') return;
    const kind = potionFx === 'love' ? 'hearts' : 'sparkles';
    const id = window.setInterval(() => actor.current?.burst(kind, 3, { x: 30 + Math.random() * 40, y: 30 + Math.random() * 20 }), 1300);
    return () => window.clearInterval(id);
  }, [potionFx]);

  // He missed her if she was away for a while.
  const [missed] = useState(() => Date.now() - pet.tickedAt > 10 * 3_600_000);
  const mood = moodOf(view);
  const [line, setLine] = useState('');
  useEffect(() => {
    if (missed && !line) return setLine(pick(lines.missed));
    const night = clock.hour >= 22 || clock.hour < 5;
    const own = mood === 'ok' || mood === 'happy' ? personalLine(pet, clock.hour) : null;
    const pool = mood === 'ok' ? (night ? lines.night : lines.happy) : lines[mood];
    setLine(own ?? pick(pool));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood]);

  // He says each new line out loud, in his own little language.
  useEffect(() => {
    if (line && !view.asleep) babble(line);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line]);

  const days = ageDays(view);
  const stage = stageOf(days);
  const face: Face =
    mood === 'asleep' ? 'asleep' : mood === 'sick' ? 'sick' : mood === 'sad' ? 'sad' : mood === 'happy' ? 'smile' : 'normal';
  const need = { hungry: '🥕', dirty: '🫧', sleepy: '💤', sick: '🤒', sad: '🥺' }[mood as string] ?? null;
  const hour = clock.hour;
  const tint = hour >= 21 || hour < 6 ? 'rgb(20 16 60 / 0.28)' : hour >= 18 ? 'rgb(255 140 80 / 0.14)' : hour < 8 ? 'rgb(255 200 150 / 0.12)' : null;
  const pending = mirror ? [] : gifts.filter((g) => !view.gifts.includes(g.id));

  // The days they are together: the room becomes a room for two (only that day).
  const { weekend, settings } = useApp();
  const together =
    new URLSearchParams(window.location.search).has('together') ||
    settings.nextMeeting?.date === clock.date ||
    ((weekend === 'togetherHome' || weekend === 'togetherHotel') && (clock.weekday === 5 || clock.weekday === 6));
  useEffect(() => {
    if (together) setLine(`היום אתם ביחד! גם אני הבאתי חבר 💞`);
  }, [together]);

  // The music box: plays while music and sound are on, rests while he listens to her.
  const nightTune = hour >= 21 || hour < 6;
  const musicOn = view.music && view.sound;
  useEffect(() => {
    box.current ??= new MusicBox();
    if (!musicOn) return box.current.stop();
    box.current.start(nightTune);
    // Browsers keep audio locked until the first tap; any tap wakes it.
    const wake = () => box.current?.start(nightTune);
    window.addEventListener('pointerdown', wake, { once: true });
    return () => window.removeEventListener('pointerdown', wake);
  }, [musicOn, nightTune]);
  useEffect(() => () => box.current?.stop(), []);

  /* ── interactions ── */

  const openGiftNow = (g: Gift) => {
    tap(12);
    run((p, out) => openGift(p, g, out));
    setOpenedGift(g);
    setSheet('gift');
  };

  const toggleMusic = () => {
    const on = !view.music;
    run((p) => {
      p.music = on;
      if (on) p.sound = true;
    });
    setLine(on ? 'שמתי לנו מוזיקה 🎶' : 'שקט. גם זה נעים 🤫');
  };

  const toggleMute = () => {
    click();
    const on = !view.sound;
    run((p) => void (p.sound = on));
    if (!on) {
      setLine('בסדר בסדר, אני בשקט 🤐');
    } else setLine(`${species.sound} חזרתי 🔊`);
  };

  const snap = async () => {
    if (!roomRef.current) return;
    shutter();
    tap(15);
    setFlash((f) => f + 1);
    try {
      const subtitle = `יום ${days + 1} · ${new Date().toLocaleDateString('he-IL')}`;
      const title = together ? `${view.name} והחבר 💞` : view.name;
      const pigs = [...roomRef.current.querySelectorAll('svg.pig')].map((el) => el.getBoundingClientRect());
      const focus = pigs.length
        ? DOMRect.fromRect({
            x: Math.min(...pigs.map((r) => r.left)),
            y: Math.min(...pigs.map((r) => r.top)) - 30,
            width: Math.max(...pigs.map((r) => r.right)) - Math.min(...pigs.map((r) => r.left)),
            height: Math.max(...pigs.map((r) => r.bottom)) - Math.min(...pigs.map((r) => r.top)) + 60,
          })
        : undefined;
      const img = await capture(roomRef.current, { room: together ? 'cozy' : view.wear.room, title, subtitle, focus });
      const meta = await savePhoto(img, `${title} · ${subtitle}`, mirror);
      setLastPhoto({ meta, img });
      setAlbumKey((k) => k + 1);
      window.setTimeout(() => setLastPhoto((l) => (l?.meta.id === meta.id ? null : l)), 3200);
      run((p, out) => {
        p.counters.photos = (p.counters.photos ?? 0) + 1;
        out.push({ text: '📸 נשמר באלבום' });
        checkAchievements(p, out);
      });
    } catch {
      fail('הצילום לא הצליח 🙈');
    }
  };

  /** What he says after each secret trick. */
  const TRICK_LINES: Record<TrickId, string[]> = {
    jump: ['ראית כמה גבוה?! 🦘', 'עוד קצת ואני נוגע בתקרה', 'יוהו!'],
    flip: ['סלטה! עשר מהשופטים 🤸', `אל ${p('תנסה', 'תנסי')} את זה בבית. רק אני.`, 'הראש שלי עוד באוויר'],
    slap: ['אאוו… 😭 למה?!', 'זה כאב לי בלב 💔', `אני מספר ל${A}!!`],
    pancake: ['אני פנקייק 🥞', 'פלאף.', 'עכשיו אני שטוח ויפה'],
    dizzy: ['הכל מסתובב… 😵‍💫', `כמה ${P} יש פה?`, 'איפה הרצפה?'],
    sneeze: ['אפצ׳י! סליחה 🤧', 'משהו נכנס לי לאף', 'לבריאות לי'],
    tickle: ['חחחח די!! זה מדגדג 🤭', 'לא בבטן!! חחח', 'אני נכנע!'],
    dance: [`${p('זוז', 'זוזי')} איתי! 💃`, 'יש לי קצב, נכון?', 'צעד ימינה, צעד שמאלה'],
    hug: ['חיבוק… עוד שנייה 🥹', 'הכי בטוח לי פה', `אל ${p('תעזוב', 'תעזבי')}`],
  };
  const onTrick = (t: TrickId) => {
    tap(t === 'slap' ? 40 : 12);
    run((p, out) => trickAction(p, t, out));
    setLine(pick(TRICK_LINES[t]));
    if (t === 'slap') window.setTimeout(() => setLine('טוב… אני סולח. אבל ליטוף עכשיו 🥺'), 3500);
  };
  // The first visits: he lets her in on the secret.
  useEffect(() => {
    if (mirror || view.tricks.length) return;
    try {
      if (sessionStorage.getItem('idw:trickTip')) return;
      sessionStorage.setItem('idw:trickTip', '1');
    } catch {
      return;
    }
    const t = window.setTimeout(() => setLine(`פסס… יש לי ${tricks.length} טריקים סודיים. ${p('נסה', 'נסי')} לגעת בי בכל מיני צורות 🎩`), 7000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPet = (strong: boolean) => {
    if (bath !== null) return;
    tap(strong ? 6 : 3);
    if (strong && Math.random() < 0.35 && !view.asleep) squeak();
    run((p, out) => petAction(p, out));
    if (strong && Math.random() < 0.18) setLine(pick(view.asleep ? lines.asleep : lines.happy));
  };

  const onFed = (id: string, emoji: string) => {
    const potion = foods.find((f) => f.id === id)?.potion;
    if (potion) {
      actor.current?.feed(emoji);
      actor.current?.burst('sparkles', 10, { x: 50, y: 40 });
      chirp();
      return;
    }
    const traits = personalityOf(view);
    if (id === traits.dislike) {
      // A sniff, a turned head, a little shake. He eats a bit anyway.
      actor.current?.play('shake');
      setLine(pick(['איכס. לא. בשום אופן 🙅', `הממ… ${p('אתה בטוח', 'את בטוחה')}? 😑`, 'אני אוכל רק בגלל שאני אוהב אותך']));
      return;
    }
    actor.current?.feed(emoji);
    chirp();
    if (id === traits.favorite) {
      window.setTimeout(() => actor.current?.play('popcorn'), 1500);
      window.setTimeout(() => actor.current?.burst('hearts', 8, { x: 50, y: 45 }), 1500);
      setLine(pick(['זה!!! זה המאכל הכי טוב בעולם 🤩', 'איך ידעת?! 🥹', 'אני אוהב אותך. ואת זה.']));
      return;
    }
    setLine(pick(['יאמי!! 😋', 'הכי טעים בעולם', 'עוד! עוד!', 'מממממ', `תודה ${P} 🧡`]));
  };

  /* ── moving between his rooms ── */

  const roomLine = (r: RoomId) => {
    const st = view.stats;
    if (view.asleep && r !== 'bed') return 'ששש… הוא ישן 💤';
    if (r === 'kitchen') return st.hunger < 60 ? pick(['מטבח!! 😋 מה יש לאכול?', 'אני מריח משהו טעים…', 'הבטן שלי כבר יודעת שהגענו למטבח']) : 'אני לא רעב, אבל לטעום אפשר 😇';
    if (r === 'bath') return st.clean <= 92 || view.poops.length ? 'אמבטיה? רק אם יש הרבה קצף 🫧' : 'אני כבר נקי ומבריק ✨';
    if (r === 'play') return st.energy < 12 ? 'אני עייף מדי לשחק 😴' : pick([`${p('בוא', 'בואי')} נשחק!! 🎮`, 'חדר משחקים!!! 🤸', 'מי ראשון למנהרה?']);
    if (r === 'bed') return st.energy < 35 ? 'סוף סוף מיטה… 🥱' : 'עוד לא עייף! אבל המיטה רכה';
    return 'חזרנו הביתה 🏡';
  };
  const go = (r: RoomId) => {
    if (r === room) return;
    const from = ROOMS.indexOf(room);
    const to = ROOMS.indexOf(r);
    setDir(to > from ? 1 : -1);
    setRoom(r);
    setExpect(false);
    if (bath !== null && r !== 'bath') {
      setBath(null);
      setRinse(null);
      setTool(null);
      setBubbles([]);
    }
    setLine(roomLine(r));
    window.setTimeout(() => actor.current?.play('hop'), 260);
  };
  // A sideways swipe on the room moves to the next one (not when it starts on him or a button).
  const swipeStart = (e: PointerEvent) => {
    const t = e.target as HTMLElement;
    swipe.current = t.closest('.pig-actor, button, [data-tray]') || bath !== null ? null : { x: e.clientX, y: e.clientY, t: Date.now() };
  };
  const swipeEnd = (e: PointerEvent) => {
    const s0 = swipe.current;
    swipe.current = null;
    if (!s0) return;
    const dx = e.clientX - s0.x;
    const dy = e.clientY - s0.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.8 || Date.now() - s0.t > 700) return;
    // Right to left like the buttons: dragging the room to the right brings in the next one.
    const i = ROOMS.indexOf(room) + (dx > 0 ? 1 : -1);
    if (i >= 0 && i < ROOMS.length) go(ROOMS[i]);
  };

  /** Food dropped on his mouth. Buys it on the way if there is none left. Returns false if it didn't work. */
  const dropFood = (id: string, emoji: string) => {
    const f = foods.find((x) => x.id === id)!;
    const err = run((p, out) => {
      if (p.asleep) return `ששש… ${p.name} ישן 💤`;
      if (id !== 'vitamin' && !f.potion && p.stats.hunger >= 97) return `${p.name} מפוצץ! אין מקום אפילו לעלה 🫃`;
      if (f.price > 0 && !(p.food[id] > 0)) {
        const no = buy(p, id, out);
        if (no) return no;
      }
      return feed(p, id, out);
    });
    if (err) {
      fail(err);
      actor.current?.play('shake');
      return false;
    }
    tap(12);
    onFed(id, emoji);
    return true;
  };

  /* ── the bath: drag the soap all over him (about ten seconds of scrubbing), then the shower to rinse ── */
  const SOAP_MS = 10_000;
  const RINSE_MS = 3_500;
  const [rinse, setRinse] = useState<number | null>(null);
  const [tool, setTool] = useState<{ kind: 'soap' | 'shower'; x: number; y: number; on: boolean } | null>(null);
  const bathRef = useRef({ soap: 0, rinse: 0, last: 0, lx: 0, ly: 0, foamAt: 0 });

  const grab = (kind: 'soap' | 'shower', e: { clientX: number; clientY: number }) => {
    if (view.asleep) return fail(`ששש… ${view.name} ישן 💤`);
    if (kind === 'soap' && bath === null) {
      if (view.stats.clean > 92 && !view.poops.length) return fail(`${view.name} כבר נקי ומבריק ✨`);
      bathRef.current.soap = 0;
      setBath(0);
      setLine(view.known.includes('bath') && personalityOf(view).bath === 'loves' ? `אמבטיה!!! 🫧 ${p('תסבן', 'תסבני')} אותי כולי` : `אמבטיה?! טוב… רק בגלל ש${p('זה אתה', 'זו את')} 🫧`);
    }
    if (kind === 'shower') {
      bathRef.current.rinse = rinse ?? 0;
      setRinse(rinse ?? 0);
    }
    tap(8);
    Object.assign(bathRef.current, { last: performance.now(), lx: e.clientX, ly: e.clientY });
    setTool({ kind, x: e.clientX, y: e.clientY, on: false });
  };

  useEffect(() => {
    if (!tool) return;
    const kind = tool.kind;
    const move = (e: globalThis.PointerEvent) => {
      const st = bathRef.current;
      const now = performance.now();
      const dt = Math.min(80, now - st.last);
      const moved = Math.hypot(e.clientX - st.lx, e.clientY - st.ly);
      Object.assign(st, { last: now, lx: e.clientX, ly: e.clientY });
      const pig = actorBox.current?.querySelector('svg.pig')?.getBoundingClientRect();
      const room = roomRef.current?.getBoundingClientRect();
      let on = false;
      if (pig && room) {
        if (kind === 'soap') {
          on = e.clientX > pig.left && e.clientX < pig.right && e.clientY > pig.top && e.clientY < pig.bottom;
          if (on && moved > 1.5 && st.soap < SOAP_MS) {
            st.soap = Math.min(SOAP_MS, st.soap + dt);
            setBath((st.soap / SOAP_MS) * 100);
            if (now - st.foamAt > 45) {
              st.foamAt = now;
              const id = Date.now() + Math.random();
              setBubbles((b) => [...b.slice(-48), { id, x: e.clientX - room.left + (Math.random() - 0.5) * 30, y: e.clientY - room.top + (Math.random() - 0.5) * 30, r: 9 + Math.random() * 16 }]);
              if (Math.random() < 0.18) pop();
            }
          }
        } else {
          // the shower head is above him and over him: the water falls on him
          on = e.clientX > pig.left - 20 && e.clientX < pig.right + 20 && e.clientY < pig.top + pig.height * 0.55;
          if (on && st.rinse < 100) {
            st.rinse = Math.min(100, st.rinse + (dt / RINSE_MS) * 100);
            setRinse(st.rinse);
          }
        }
      }
      setTool((t) => (t ? { ...t, x: e.clientX, y: e.clientY, on } : t));
    };
    const up = () => setTool(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [tool?.kind]); // eslint-disable-line react-hooks/exhaustive-deps

  // All soaped up: time for the shower.
  const soaped = bath !== null && bath >= 100;
  useEffect(() => {
    if (!soaped) return;
    tap(20);
    setTool(null);
    setLine(`כולי מסובן! 🫧 עכשיו הדוש: ${p('גרור', 'גררי')} אותו מעליי`);
  }, [soaped]);
  // Rinsed: clean, a shake, and the rewards.
  const rinsed = rinse !== null && rinse >= 100;
  useEffect(() => {
    if (!rinsed) return;
    setTool(null);
    tap(20);
    run((p, out) => {
      bathe(p, out);
      out.unshift({ text: `🛁 ${p.name} נקי ומבריק!` });
    });
    setLine(personalityOf(view).bath === 'loves' ? 'אני מריח כמו פרחים 🌸 עוד פעם?' : 'טוב. נקי. אפשר לצאת עכשיו? 😤');
    setBubbles([]);
    setBath(null);
    setRinse(null);
    actor.current?.play('shake');
    actor.current?.burst('drops', 14, { x: 50, y: 45 });
    window.setTimeout(() => actor.current?.burst('sparkles', 8, { x: 50, y: 40 }), 700);
  }, [rinsed]); // eslint-disable-line react-hooks/exhaustive-deps

  const sleep = () => {
    const err = run((p) => toggleSleep(p));
    if (err) fail(err);
    else {
      setLine(view.asleep ? 'בוקר טוב!! ☀️' : pick(lines.asleep));
      if (view.asleep) window.setTimeout(() => actor.current?.play('popcorn'), 200);
    }
  };

  const play = (g: GameId) => {
    // The games he plays with her need him awake and rested; her arcade games don't.
    const err = gameById(g)?.care ? canPlay(view) : null;
    if (err) return fail(err);
    setSheet(null);
    setResult(null);
    setGame(g);
  };
  const endGame = useCallback(
    (r: GameResult) => {
      if (!game) return;
      const info = gameById(game);
      const won =
        run((p, out) => {
          if (r.perfect && game === 'memory') p.counters.memoryPerfect = 1;
          return finishGame(p, game, r.score, r.coins, out, { light: !info?.care, level: info?.keepsLevel ? r.level : undefined });
        }) ?? 0;
      setResult({ ...r, game, won });
    },
    [run, game],
  );
  const look = { skin: view.skin, head: view.wear.head, face: view.wear.face, neck: view.wear.neck };

  const xpNeed = xpForNext(view.level);
  const doneTasks = view.daily.claimed.length;
  const claimable = tasksFor(view.daily.date).some((t) => !view.daily.claimed.includes(t.id) && (view.daily.counters[t.counter] ?? 0) >= t.target);
  const planReady = !!view.plan && !view.plan.claimed && planComplete(view.plan);
  const menuDot = !view.daily.spun || claimable || claimableMilestone(view) || planReady;

  // Where things stand, measured up from the bottom of the screen: the site's nav, then
  // his needs buttons, then the room's tray, then him.
  const NAV = 'calc(88px + env(safe-area-inset-bottom))';
  const hasTray = room !== 'home';
  const lift = hasTray ? 234 : 184;
  const feet = `calc(${lift}px + env(safe-area-inset-bottom))`;
  // He is the big one on the screen: as wide as the room allows, never into the top bar.
  const size = growth(days);
  const pigWidth = `min(${92 * size.size}%, calc((100dvh - ${lift}px - env(safe-area-inset-bottom) - 178px) * 0.88))`;
  const top = `calc(env(safe-area-inset-top) + ${mirror ? 52 : 14}px)`;
  const healthFace: IconName = mood === 'happy' || mood === 'ok' ? 'smile' : mood === 'sick' || mood === 'sad' ? 'frown' : 'meh';

  // What he says floats just above his head, and moves with him from room to room.
  const bubble = (
    <AnimatePresence>
      {line && bath === null && (
        <motion.div
          key={line}
          initial={{ opacity: 0, y: 8, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          className="pointer-events-none absolute bottom-[calc(100%-22px)] left-1/2 z-10 flex w-[min(290px,calc(100vw-128px))] -translate-x-1/2 justify-center"
        >
          <CloudBubble>{line}</CloudBubble>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="pet-page relative h-dvh w-full overflow-hidden text-[#F6E9DA] select-none">
      {/* the stage: his rooms, him, and what's on the floor */}
      <div
        ref={roomRef}
        className="absolute inset-0 touch-pan-y overflow-hidden"
        onPointerDown={swipeStart}
        onPointerUp={swipeEnd}
      >
        <AnimatePresence initial={false} custom={dir}>
          <motion.div
            key={room}
            custom={dir}
            className="absolute inset-0"
            variants={{
              enter: (d: number) => ({ x: d > 0 ? '-100%' : '100%' }),
              center: { x: 0 },
              exit: (d: number) => ({ x: d > 0 ? '100%' : '-100%' }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 260, damping: 32 }}
          >
            <RoomBackdrop room={room} theme={view.wear.room} together={together} lamp={!view.asleep} />
          </motion.div>
        </AnimatePresence>
        {!reduce && room === 'home' && <RoomWeather room={together ? 'together' : view.wear.room} />}
        {tint && <div className="pointer-events-none absolute inset-0 z-[4] mix-blend-multiply" style={{ background: tint }} />}

        {/* him (and on together days, at home, his friend) */}
        {together && room === 'home' ? (
          <div ref={actorBox} className="absolute left-1/2 z-[5] flex w-[92%] -translate-x-1/2 items-end justify-center" style={{ bottom: feet }}>
            {bubble}
            <div className="w-1/2">
              <div className="nuzzle-l">
                <PigActor
                  ref={actor}
                  look={look}
                  style={view.anim}
                  mood={face}
                  asleep={view.asleep}
                  sleepy={view.stats.energy < 35}
                  idle={bath === null}
                  interactive={bath === null}
                  walk={false}
                  onPet={onPet}
                />
              </div>
              <NameTag>{view.name}</NameTag>
            </div>
            <div className="w-[46%]">
              <div className="nuzzle-r">
                <PigActor look={ADMIN_PET} style={view.anim} mood="smile" walk={false} interactive={false} />
              </div>
              <NameTag>{`החבר של ${A}`}</NameTag>
            </div>
          </div>
        ) : (
          <div
            className="absolute left-1/2 z-[5] -translate-x-1/2 transition-[bottom,width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            ref={actorBox}
            style={{ bottom: feet, width: pigWidth }}
            aria-label={`ללטף את ${view.name}`}
          >
            {bubble}
            <PigActor
              ref={actor}
              look={look}
              style={view.anim}
              mood={face}
              asleep={view.asleep}
              sleepy={view.stats.energy < 35}
              idle={bath === null && !expect}
              interactive={bath === null}
              walk={room === 'home' && !pending.length}
              need={bath === null && room === 'home' ? need : null}
              expect={expect}
              onPet={onPet}
              onTrick={onTrick}
              grown={size.grown}
              potion={potionFx}
            />
          </div>
        )}

        {/* poops, wherever he is: drawn so nobody wonders what they are, and gone with a tap */}
        <AnimatePresence>
          {view.poops.map((p, i) => (
            <motion.button
              key={p.id}
              type="button"
              aria-label="לנקות את הקקי"
              onPointerDown={(e) => {
                e.stopPropagation();
                tap(6);
                run((s, out) => cleanPoop(s, p.id, out));
              }}
              initial={{ scale: 0, y: 6 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.2, y: -18, opacity: 0, rotate: 25, transition: { duration: 0.28 } }}
              transition={{ type: 'spring', stiffness: 420, damping: 18 }}
              className="absolute z-[6] -translate-x-1/2 p-1.5 leading-none"
              style={{ left: `${p.x}%`, bottom: `calc(${feet} - 12px)` }}
            >
              <Poop />
              {i === 0 && (view.counters.poops ?? 0) < 3 && !mirror && (
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-1 -translate-x-1/2 rounded-full bg-white/95 px-2.5 py-1 text-[12px] font-bold whitespace-nowrap text-[#6B4226] shadow-[0_4px_10px_rgb(0_0_0/0.25)]">
                  אופס! נגיעה לנקות
                </span>
              )}
            </motion.button>
          ))}
        </AnimatePresence>

        {/* gifts from the admin wait in the living room */}
        {room === 'home' &&
          pending.slice(0, 1).map((g) => (
            <motion.button
              key={g.id}
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation();
                openGiftNow(g);
              }}
              animate={reduce ? {} : { rotate: [-6, 6, -6] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="absolute right-[5%] z-[7] leading-none"
              style={{ bottom: `calc(${feet} - 10px)` }}
              aria-label={`מתנה מ${A}`}
            >
              <PetIcon name="gift" size={58} className="drop-shadow-[0_8px_6px_rgb(40_20_10/0.4)]" />
            </motion.button>
          ))}

        {/* night */}
        {view.asleep && (
          <div className="pointer-events-none absolute inset-0 z-[8] bg-[#14103A]/40">
            {[
              [12, 14],
              [30, 8],
              [52, 18],
              [74, 10],
              [88, 24],
              [20, 32],
              [64, 30],
            ].map(([x, y], i) => (
              <span
                key={i}
                className="decor-twinkle absolute text-[12px] text-[#FFF3B0]"
                style={{ left: `${x}%`, top: `${y}%`, '--delay': `${-i * 0.7}s` } as CSSProperties}
              >
                ✦
              </span>
            ))}
          </div>
        )}

        {/* foam while she scrubs; it melts away under the shower */}
        {bath !== null && (
          <div className="pointer-events-none absolute inset-0 z-[9] transition-[opacity,translate] duration-300" style={{ opacity: 1 - (rinse ?? 0) / 100, translate: `0 ${(rinse ?? 0) * 0.4}px` }}>
            {bubbles.map((b) => (
              <span
                key={b.id}
                className="absolute rounded-full border-2 border-white/90 bg-white/45 shadow-[inset_-3px_-3px_6px_rgb(150_200_230/0.5)]"
                style={{ left: b.x - b.r, top: b.y - b.r, width: b.r * 2, height: b.r * 2 }}
              />
            ))}
          </div>
        )}

        {/* the soap or the shower, in her hand */}
        {tool?.kind === 'shower' && <ShowerRain at={{ x: tool.x, y: tool.y }} pouring={tool.on} pig={actorBox} />}
        {tool && (
          <div className="pointer-events-none fixed z-[60]" style={{ left: tool.x, top: tool.y }}>
            {tool.kind === 'soap' ? (
              <div className={`-translate-x-1/2 -translate-y-1/2 transition-transform duration-150 ${tool.on ? 'scale-110 -rotate-12' : ''}`}>
                <PetIcon name="soap" size={64} className="drop-shadow-[0_8px_8px_rgb(0_0_0/0.35)]" />
              </div>
            ) : (
              <svg viewBox="-40 -30 80 300" width="80" height="300" className="-translate-x-1/2 -translate-y-[30px] drop-shadow-[0_6px_8px_rgb(0_0_0/0.3)]" aria-hidden>
                {/* a soft mist under the head while it pours; the drops themselves are the canvas below */}
                <path d="M-20 14 L-52 230 H52 L20 14Z" fill="#DDF2FF" opacity={tool.on ? 0.18 : 0} style={{ transition: 'opacity .3s' }} />
                <rect x="-6" y="-30" width="12" height="26" rx="5" fill="#B7C2C7" stroke="#3B2216" strokeWidth="2" />
                <path d="M-24 -4 h48 l-6 18 h-36z" fill="#D5DEE2" stroke="#3B2216" strokeWidth="2" strokeLinejoin="round" />
                <path d="M-14 4 h20" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
              </svg>
            )}
          </div>
        )}

        {flash > 0 && <div key={flash} className="camera-flash pointer-events-none absolute inset-0 z-[30] bg-white" />}
      </div>

      {/* ── HUD ── */}

      {mirror && (
        <div className="absolute top-[calc(env(safe-area-inset-top)+12px)] right-3 z-20 max-w-[60%] rounded-full bg-black/45 px-3 py-1.5 text-[11.5px] font-bold text-white backdrop-blur">
          ה{species.name} של {P} · מה ש{a('תעשה', 'תעשי')} פה לא נשמר אצל{p('ו', 'ה')}
        </div>
      )}

      {/* top left: level and seeds; under them her things and his tools */}
      <div dir="ltr" className="pointer-events-none absolute left-3 z-20 flex flex-col items-start gap-2.5" style={{ top }}>
        <div className="flex items-center gap-2">
          <LevelRing level={view.level} xp={view.xp} need={xpNeed} onClick={() => setSheet('journey')} />
          <motion.span key={coinBump} initial={coinBump ? { scale: 1.25 } : false} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 12 }}>
            <CoinPill ref={coinBadge} coins={view.coins} onClick={() => setSheet('shop')}>
              <CountUp value={view.coins} />
            </CoinPill>
          </motion.span>
        </div>
        <div className="flex flex-col gap-2 ps-2">
          <SideButton label={`גם ${p('אתה', 'את')}`} onClick={() => setSheet('care')} alert={!mirror && view.daily.care.length === 0}>
            <PetIcon name="sprout" size={28} />
          </SideButton>
          <SideButton label="לצלם לאלבום" onClick={snap}>
            <PetIcon name="camera" size={26} />
          </SideButton>
          <SideButton label={view.sound ? 'להשתיק' : 'להפעיל צלילים'} onClick={toggleMute}>
            <PetIcon name={view.sound ? 'speaker' : 'muted'} size={26} />
          </SideButton>
        </div>
      </div>

      {/* top right: the menu, and today's wheel and tasks */}
      <div className="pointer-events-none absolute right-3 z-20 flex flex-col items-end gap-2.5" style={{ top }}>
        <MenuButton onClick={() => setMenu(true)} dot={menuDot} />
        <div className="flex flex-col gap-2 pe-0.5">
          <SideButton label="הגלגל היומי" onClick={() => setSheet('wheel')} alert={!view.daily.spun}>
            <PetIcon name="wheel" size={28} />
          </SideButton>
          <SideButton label={`משימות ${doneTasks}/3`} onClick={() => setSheet('tasks')} alert={claimable}>
            <PetIcon name="clipboard" size={26} />
          </SideButton>
          {view.plan && (
            <SideButton label={`הרפתקה ${planDoneCount(view.plan)}/${view.plan.steps.length}`} onClick={() => setSheet('plan')} alert={planReady}>
              <PetIcon name="map" size={26} />
            </SideButton>
          )}
        </div>
      </div>

      {/* the room's tray */}
      <div data-tray className="pointer-events-none absolute inset-x-0 z-20 [&>*]:pointer-events-auto" style={{ bottom: `calc(${NAV} + 78px)` }}>
        <AnimatePresence mode="wait">
          {room === 'kitchen' && (
            <motion.div key="kitchen" exit={{ opacity: 0, y: 20 }}>
              <FoodTray
                pet={view}
                mouth={() => actor.current?.mouth() ?? null}
                onNear={setExpect}
                onFeed={dropFood}
                onShop={() => setSheet('food')}
                onHint={(id) => {
                  const f = foods.find((x) => x.id === id);
                  setLine(f?.potion ? `${f.name}: ${f.note}. ${p('גרור', 'גררי')} אותו לפה שלי 🧪` : `${p('גרור', 'גררי')} את האוכל עד הפה שלי 👄`);
                }}
              />
            </motion.div>
          )}
          {room === 'play' && (
            <motion.div key="play" exit={{ opacity: 0, y: 20 }}>
              <PlayTray pet={view} day={clock.dayIndex} onPlay={play} onArcade={() => setArcade(true)} />
            </motion.div>
          )}
          {room === 'bath' && (
            <motion.div key="bath" exit={{ opacity: 0, y: 20 }}>
              <BathTray bath={bath} rinse={rinse} shiny={view.stats.clean > 92 && !view.poops.length} onGrab={grab} />
            </motion.div>
          )}
          {room === 'bed' && (
            <motion.div key="bed" exit={{ opacity: 0, y: 20 }}>
              <BedTray asleep={view.asleep} energy={view.stats.energy} onToggle={sleep} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* needs: also the doors between his rooms */}
      <nav aria-label="החדרים שלו" className="pointer-events-none absolute inset-x-0 z-20 flex items-end justify-around px-2" style={{ bottom: NAV }}>
        <NeedButton icon={<PetIcon name={healthFace} size={32} />} label="סלון" value={view.stats.health} color="#3FD07A" active={room === 'home'} onClick={() => go('home')} />
        <NeedButton icon={<PetIcon name="carrot" size={32} />} label="מטבח" value={view.stats.hunger} color="#FF9A3C" active={room === 'kitchen'} onClick={() => go('kitchen')} />
        <NeedButton icon={<PetIcon name="tub" size={32} />} label="מקלחת" value={view.poops.length >= 4 ? Math.min(view.stats.clean, 25) : view.stats.clean} color="#3FA9FF" active={room === 'bath'} onClick={() => go('bath')} />
        <NeedButton icon={<PetIcon name="ball" size={32} />} label="משחקים" value={view.stats.happy} color="#FF4F6D" active={room === 'play'} onClick={() => go('play')} />
        <NeedButton icon={<PetIcon name="moon" size={32} />} label="שינה" value={view.stats.energy} color="#FFC23C" active={room === 'bed'} onClick={() => go('bed')} />
      </nav>

      {lastPhoto && (
        <motion.button
          type="button"
          onClick={() => setSheet('album')}
          initial={{ opacity: 0, scale: 1.6, rotate: -14, y: -40 }}
          animate={{ opacity: 1, scale: 1, rotate: 6, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 16 }}
          className="absolute right-4 z-[31] w-[30%] bg-[#FFFBF3] p-1.5 pb-4 shadow-[0_10px_24px_rgb(0_0_0/0.4)]"
          style={{ bottom: `calc(${NAV} + 170px)` }}
          aria-label="לאלבום"
        >
          <img src={lastPhoto.img} alt="" className="w-full" />
        </motion.button>
      )}

      <MenuDrawer
        open={menu}
        onClose={closeMenu}
        head={<MenuHead pet={view} days={days} stage={`${stage.name} · ${size.cm} ס״מ`} onName={() => setSheet('settings')} />}
        sections={[
          {
            title: 'היום',
            big: true,
            rows: [
              { icon: 'sprout', label: `גם ${p('אתה', 'את')}`, meta: view.daily.care.length ? `${view.daily.care.length} דברים טובים` : 'לדאוג לעצמך', onClick: () => setSheet('care') },
              { icon: 'clipboard', label: 'משימות', meta: `${doneTasks}/3`, dot: claimable, onClick: () => setSheet('tasks') },
              ...(view.plan
                ? [{ icon: 'map' as IconName, label: 'ההרפתקה של היום', meta: view.plan.claimed ? 'הושלמה' : `${planDoneCount(view.plan)}/${view.plan.steps.length}`, dot: planReady, onClick: () => setSheet('plan') }]
                : []),
              { icon: 'wheel', label: 'הגלגל היומי', meta: view.daily.spun ? 'מחר שוב' : 'מחכה לך', dot: !view.daily.spun, onClick: () => setSheet('wheel') },
            ],
          },
          {
            title: 'שלך',
            rows: [
              { icon: 'ball', label: 'חדר המשחקים', meta: `${GAMES.length} משחקים`, onClick: () => setArcade(true) },
              { icon: 'brush' as IconName, label: 'הגלריה שלי', meta: 'ציורים', onClick: () => setGallery(true) },
            ],
          },
          {
            title: 'שלו',
            rows: [
              { icon: 'bag', label: 'חנות', onClick: () => setSheet('shop') },
              { icon: 'medal', label: `ה${species.plural} הנחשקים`, meta: `${view.legends?.length ?? 0}/5`, onClick: () => setSheet('guide') },
              { icon: 'hanger', label: 'ארון בגדים', onClick: () => setSheet('wardrobe') },
              { icon: 'polaroid', label: 'אלבום', onClick: () => setSheet('album') },
              { icon: 'wand' as IconName, label: 'ספר הטריקים', meta: `${view.tricks.length}/${tricks.length}`, onClick: () => setSheet('tricks') },
              { icon: 'magnifier', label: 'מי הוא בכלל?', meta: `${view.known.length}/6`, onClick: () => setSheet('know') },
              ...(mirror
                ? [{ icon: 'gift' as IconName, label: 'לשלוח לו מתנה', onClick: () => setSheet('send') }]
                : pending.length
                  ? [{ icon: 'gift' as IconName, label: `מתנה מ${A}`, dot: true, onClick: () => openGiftNow(pending[0]) }]
                  : []),
            ],
          },
          {
            title: 'עוד',
            rows: [
              { icon: 'medal', label: 'הישגים', meta: `${view.achievements.length}`, onClick: () => setSheet('achievements') },
              { icon: 'map', label: 'המסע', dot: claimableMilestone(view), onClick: () => setSheet('journey') },
              { icon: 'wand', label: 'איך הוא זז', onClick: () => setSheet('style') },
              { icon: view.music ? 'note' : 'noteOff', label: 'תיבת נגינה', meta: view.music ? 'מנגנת' : 'כבויה', onClick: toggleMusic },
              { icon: 'gear', label: 'הגדרות', onClick: () => setSheet('settings') },
            ],
          },
        ]}
      />

      <AlbumSheet key={albumKey} open={sheet === 'album'} onClose={() => setSheet(null)} name={view.name} canDelete={!mirror} />
      <CareSheet
        open={sheet === 'care'}
        onClose={() => setSheet(null)}
        pet={view}
        run={run}
        onBreathe={() => {
          setSheet(null);
          setBreathing(true);
        }}
        onReact={(text, kind) => {
          setLine(text);
          if (kind === 'drink') actor.current?.burst('drops', 5, { x: 50, y: 50 });
          else actor.current?.play('popcorn');
        }}
      />
      <KnowSheet open={sheet === 'know'} onClose={() => setSheet(null)} pet={view} />
      <StyleSheet open={sheet === 'style'} onClose={() => setSheet(null)} pet={view} run={run} />
      {/* sheets */}
      <FoodSheet open={sheet === 'food'} onClose={() => setSheet(null)} pet={view} run={run} fail={fail} onFed={onFed} />
      <ShopSheet open={sheet === 'shop'} onClose={() => setSheet(null)} pet={view} run={run} fail={fail} mineOnly={false} onGuide={() => setSheet('guide')} />
      <TricksSheet open={sheet === 'tricks'} onClose={() => setSheet(null)} pet={view} mirror={mirror} />
      <LegendGuide open={sheet === 'guide'} onClose={() => setSheet(null)} pet={view} mirror={mirror} />
      {room === 'kitchen' && <PeekFriend id="shocked" side="left" size={118} bottom={300} weekly />}
      <AdventureSheet open={sheet === 'plan'} onClose={() => setSheet(null)} plan={view.plan} mirror={mirror} onClaim={() => run((p, out) => claimPlan(p, clock.contentDate, out))} />
      <ShopSheet open={sheet === 'wardrobe'} onClose={() => setSheet(null)} pet={view} run={run} fail={fail} mineOnly />
      <TasksSheet open={sheet === 'tasks'} onClose={() => setSheet(null)} pet={view} run={run} fail={fail} />
      <AchievementsSheet open={sheet === 'achievements'} onClose={() => setSheet(null)} pet={view} run={run} fail={fail} />
      <JourneySheet open={sheet === 'journey'} onClose={() => setSheet(null)} pet={view} run={run} fail={fail} />
      <WheelSheet open={sheet === 'wheel'} onClose={() => setSheet(null)} pet={view} run={run} fail={fail} />
      <SettingsSheet open={sheet === 'settings'} onClose={() => setSheet(null)} pet={view} run={run} mirror={mirror} />
      <Sheet open={sheet === 'gift'} onClose={() => setSheet(null)} title={`מתנה מ${A} 🎁`}>
        {openedGift && (
          <div className="pb-6 text-center">
            <div className="mb-3 text-[64px]">💌</div>
            {openedGift.note && <p className="mb-4 font-hand text-[19px] leading-relaxed whitespace-pre-line">{openedGift.note}</p>}
            <p className="text-[15px] font-bold">
              {openedGift.coins > 0 && `+${openedGift.coins} ${COIN} `}
              {openedGift.food && `+3 ${foods.find((f) => f.id === openedGift.food)?.emoji ?? ''}`}
            </p>
          </div>
        )}
      </Sheet>
      {mirror && <SendGiftSheet open={sheet === 'send'} onClose={() => setSheet(null)} gifts={gifts} hersOpened={pet.gifts} />}

      {createPortal(
        <>
          {/* notices */}
          <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-16 z-50 flex flex-col items-center gap-1.5 px-4">
            {notes.map((n) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: -10, scale: 0.94, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                className="rounded-full border border-[#E9C98A]/35 bg-[#2B1D17]/80 px-4 py-2 text-[14px] font-bold text-[#FFF3E4] shadow-[0_10px_30px_rgb(0_0_0/0.35),inset_0_1px_0_rgb(255_255_255/0.12)] backdrop-blur-xl"
              >
                {n.text}
              </motion.div>
            ))}
          </div>
          <AnimatePresence>{moment && <Moment key={moment.id} text={moment.text} onDone={endMoment} />}</AnimatePresence>
          {confetti > 0 && <MiniConfetti key={confetti} />}
          <AnimatePresence>
            {breathing && (
              <Breathing
                look={look}
                name={view.name}
                onClose={() => setBreathing(false)}
                onDone={() => {
                  run((p, out) => breathe(p, out));
                  setLine('איזה רוגע… תודה שנשמת איתי 🫧');
                }}
              />
            )}
          </AnimatePresence>
          {coinFly.map((c) => (
            <span
              key={c.id}
              className="coin-fly-x text-[22px]"
              style={{ left: c.x - 11, top: c.y - 11, '--dx': `${c.dx}px`, '--delay': `${c.delay}s` } as CSSProperties}
            >
              <span className="coin-fly-y" style={{ '--dy': `${c.dy}px`, '--delay': `${c.delay}s` } as CSSProperties}>
                {COIN}
              </span>
            </span>
          ))}

          {/* games */}
          <AnimatePresence>
            {arcade && !game && <Arcade pet={view} day={clock.dayIndex} onPlay={play} onClose={() => setArcade(false)} />}
          </AnimatePresence>
          {gallery && (
            <Suspense fallback={null}>
              <Studio look={look} level={1} startTab="gallery" onEnd={() => {}} onClose={() => setGallery(false)} />
            </Suspense>
          )}
          {game && <GameScreen id={game} look={look} level={view.counters[`lvl:${game}`] ?? 1} onEnd={endGame} onClose={() => setGame(null)} />}
          {game && result && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/45 px-6 backdrop-blur-[3px]">
              <motion.div
                initial={{ scale: 0.8, opacity: 0, rotate: -3 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="w-full max-w-[340px] rounded-[28px] bg-bg p-6 text-center shadow-paper"
              >
                <div className="mx-auto mb-1 w-[104px]">
                  <PigSvg {...look} mood="happy" className="w-full" />
                </div>
                <div className="font-hand text-[14px] text-muted">{gameById(result.game)?.name}</div>
                <h2 className="font-serif text-[27px] leading-tight">
                  {gameById(result.game)?.keepsLevel ? `שלב ${result.score} הושלם!` : result.score > 0 ? 'כל הכבוד!' : 'כמעט!'}
                </h2>
                {!gameById(result.game)?.keepsLevel && (
                  <p className="mt-1 text-[16px]">
                    ניקוד: <b className="tabular-nums">{result.score}</b>
                    {result.level && result.level > 1 ? ` · הגעת לשלב ${result.level}` : ''}
                    {' · '}שיא: {view.counters[`best:${result.game}`] ?? result.score}
                  </p>
                )}
                <p className="mt-2 mb-5 text-[21px] font-bold text-accent">
                  +{result.won} {COIN}
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const g = result.game;
                      setGame(null);
                      window.setTimeout(() => play(g), 30);
                    }}
                    className="w-full rounded-full bg-accent py-3 font-bold text-white transition-transform active:scale-[0.98]"
                  >
                    {gameById(result.game)?.keepsLevel ? 'לשלב הבא' : 'עוד פעם'}
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setGame(null);
                        setResult(null);
                        setArcade(true);
                      }}
                      className="flex-1 rounded-full bg-paper py-2.5 font-bold shadow-soft transition-transform active:scale-[0.98]"
                    >
                      לחדר המשחקים
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGame(null);
                        setResult(null);
                        setArcade(false);
                      }}
                      className="flex-1 rounded-full bg-paper py-2.5 font-bold shadow-soft transition-transform active:scale-[0.98]"
                    >
                      סיימתי
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </>,
        document.body,
      )}
    </div>
  );
}

function NameTag({ children }: { children: string }) {
  return (
    <div className="mx-auto mt-1 w-max max-w-full truncate rounded-full border border-white/40 bg-white/70 px-2.5 py-0.5 text-center text-[11px] font-bold text-[#3A2A20] backdrop-blur">
      {children}
    </div>
  );
}

const claimableMilestone = (p: PetState) => {
  const d = ageDays(p);
  return milestonesFor(d).some((m) => d >= m.day && !p.milestones.includes(m.day));
};

function MiniConfetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        dur: 2 + Math.random() * 1.5,
        drift: (Math.random() - 0.5) * 120,
        spin: (Math.random() > 0.5 ? 1 : -1) * 540,
        e: [species.coin, '💗', '⭐', '🥕', '✨'][i % 5],
      })),
    [],
  );
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece absolute top-[-30px] text-[20px]"
          style={
            {
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
              '--drift': `${p.drift}px`,
              '--spin': `${p.spin}deg`,
            } as CSSProperties
          }
        >
          {p.e}
        </span>
      ))}
    </div>
  );
}

function SettingsSheet({ open, onClose, pet, run, mirror }: { open: boolean; onClose: () => void; pet: PetState; run: Run; mirror: boolean }) {
  const [name, setName] = useState(pet.name);
  useEffect(() => setName(pet.name), [pet.name, open]);
  const owned = items.filter((i) => pet.owned.includes(i.id)).length + pet.owned.filter((id) => skins.some((s) => s.id === id)).length;
  return (
    <Sheet open={open} onClose={onClose} title="הגדרות">
      <label className="mb-1.5 block text-[14px] font-bold">השם שלו</label>
      <div className="mb-5 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 18))}
          className="min-w-0 flex-1 rounded-2xl border-2 border-line bg-paper px-4 py-3 text-[17px] outline-none focus:border-accent"
        />
        <button
          type="button"
          disabled={!name.trim() || name.trim() === pet.name}
          onClick={() => {
            run((p, out) => {
              p.name = name.trim();
              out.push({ text: `מעכשיו קוראים לו ${p.name} 🐾` });
            });
          }}
          className="rounded-2xl bg-accent px-4 font-bold text-white disabled:opacity-40"
        >
          לשמור
        </button>
      </div>
      <button
        type="button"
        onClick={() => run((p) => void (p.sound = !p.sound))}
        className="mb-5 flex w-full items-center justify-between rounded-2xl bg-paper px-4 py-3.5 shadow-soft"
      >
        <span className="font-bold">צלילים</span>
        <span className="text-[20px]">{pet.sound ? '🔊' : '🔇'}</span>
      </button>
      <div className="mb-6 grid grid-cols-3 gap-2 text-center">
        <Fact n={pet.counters.feeds ?? 0} label="ארוחות" />
        <Fact n={pet.counters.pets ?? 0} label="ליטופים" />
        <Fact n={pet.counters.games ?? 0} label="משחקים" />
        <Fact n={pet.counters.baths ?? 0} label="אמבטיות" />
        <Fact n={pet.counters.earned ?? 0} label={`${COIN} הורווחו`} />
        <Fact n={owned} label="פריטים" />
      </div>
      {mirror && <Backups />}
    </Sheet>
  );
}

/**
 * Admin only: every day the pet is saved aside on the server (45 days back).
 * If something ever goes wrong, he can bring it back to how it was on a given day.
 */
function Backups() {
  const [list, setList] = useState<Backup[] | null>(null);
  const [busy, setBusy] = useState('');
  const { showToast } = useApp();
  useEffect(() => {
    listBackups()
      .then(setList)
      .catch(() => setList([]));
  }, []);
  const restore = async (b: Backup) => {
    const when = b.date === 'before-restore' ? 'למצב שלפני השחזור האחרון' : `ליום ${new Date(b.date).toLocaleDateString('he-IL')}`;
    if (!window.confirm(`להחזיר את ה${species.name} של ${P} ${when}? (מה שיש עכשיו יישמר בצד)`)) return;
    setBusy(b.date);
    try {
      await restoreBackup(b.date);
      showToast('שוחזר ✓');
      setList(await listBackups());
    } catch {
      showToast('השחזור לא הצליח');
    } finally {
      setBusy('');
    }
  };
  return (
    <section className="pb-6">
      <h3 className="mb-1 font-serif text-[19px]">גיבויים</h3>
      <p className="mb-3 text-[13px] text-muted">כל יום ה{species.name} של {P} נשמר בצד בשרת. רק {a('אתה רואה', 'את רואה')} את זה.</p>
      {list === null ? (
        <p className="text-[13px] text-muted">טוען…</p>
      ) : list.length === 0 ? (
        <p className="text-[13px] text-muted">עוד אין גיבויים. הראשון יישמר בפעם הבאה ש{P} {p('ישחק', 'תשחק')}.</p>
      ) : (
        <ul className="flex max-h-[220px] flex-col gap-1.5 overflow-y-auto">
          {list.map((b) => (
            <li key={b.date} className="flex items-center gap-2 rounded-xl bg-paper px-3 py-2 shadow-soft">
              <span className="flex-1 text-[14px]">
                {b.date === 'before-restore' ? 'לפני השחזור האחרון' : new Date(b.date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                <span className="ms-2 text-[12px] text-muted">
                  רמה {b.level} · {b.coins} {COIN}
                </span>
              </span>
              <button type="button" disabled={!!busy} onClick={() => restore(b)} className="rounded-full bg-soft px-3 py-1 text-[12.5px] font-bold disabled:opacity-40">
                {busy === b.date ? '…' : 'לשחזר'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const Fact = ({ n, label }: { n: number; label: string }) => (
  <div className="rounded-2xl bg-paper py-2.5 shadow-soft">
    <div className="text-[19px] font-bold tabular-nums">{n.toLocaleString('he-IL')}</div>
    <div className="text-[12px] text-muted">{label}</div>
  </div>
);

/** the admin's side: a gift box (seeds, a treat, a note) that waits in the pet's room. */
function SendGiftSheet({ open, onClose, gifts, hersOpened }: { open: boolean; onClose: () => void; gifts: Gift[]; hersOpened: string[] }) {
  const { showToast } = useApp();
  const [coins, setCoins] = useState(100);
  const [food, setFood] = useState<string>('strawberry');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    try {
      await sendGift({ coins, food: food || undefined, note: note.trim() || undefined });
      showToast(`המתנה מחכה ל${P} בחדר של ה${species.name} 🎁`);
      setNote('');
      onClose();
    } catch {
      showToast('לא הצלחתי לשלוח. אולי אין חיבור לשרת?');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet open={open} onClose={onClose} title={`מתנה ל${species.name} 🎁`}>
      <label className="mb-1.5 block text-[14px] font-bold">כמה {COIN}?</label>
      <div className="mb-4 flex flex-wrap gap-2">
        {[0, 50, 100, 250, 500].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCoins(c)}
            className={`rounded-full px-4 py-2 font-bold ${coins === c ? 'bg-accent text-white' : 'bg-paper shadow-soft'}`}
          >
            {c}
          </button>
        ))}
      </div>
      <label className="mb-1.5 block text-[14px] font-bold">פינוק (×3)</label>
      <div className="mb-4 flex flex-wrap gap-2">
        {['', 'strawberry', 'watermelon', 'carrot', 'pepper', 'cake'].map((f) => (
          <button
            key={f || 'none'}
            type="button"
            onClick={() => setFood(f)}
            className={`rounded-full px-3.5 py-2 text-[18px] ${food === f ? 'bg-accent text-white' : 'bg-paper shadow-soft'}`}
          >
            {f ? foods.find((x) => x.id === f)!.emoji : 'בלי'}
          </button>
        ))}
      </div>
      <label className="mb-1.5 block text-[14px] font-bold">פתק בפנים</label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 200))}
        rows={3}
        placeholder={`ה${species.name} ביקש שאגיד לך…`}
        className="mb-4 w-full rounded-2xl border-2 border-line bg-paper px-4 py-3 text-[16px] outline-none focus:border-accent"
      />
      <button
        type="button"
        disabled={busy || (!coins && !food && !note.trim())}
        onClick={send}
        className="mb-5 w-full rounded-full bg-accent py-3.5 text-[17px] font-bold text-white disabled:opacity-40"
      >
        {busy ? a('שולח…', 'שולחת…') : 'לשלוח'}
      </button>
      {gifts.length > 0 && (
        <>
          <h3 className="mb-2 font-bold">מתנות ששלחת</h3>
          <ul className="space-y-1.5 pb-6 text-[14px]">
            {gifts.slice(0, 10).map((g) => (
              <li key={g.id} className="flex justify-between rounded-xl bg-paper px-3 py-2 shadow-soft">
                <span className="truncate">
                  {new Date(g.at).toLocaleDateString('he-IL')} · {g.coins ? `${g.coins} ${COIN}` : ''} {g.food ? foods.find((f) => f.id === g.food)?.emoji : ''}{' '}
                  {g.note ? '💌' : ''}
                </span>
                <span className="shrink-0 text-muted">{hersOpened.includes(g.id) ? 'נפתחה ✓' : 'מחכה'}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </Sheet>
  );
}

/**
 * A big moment (level up, a milestone, an achievement) gets the stage: the
 * page dims, warm light turns slowly behind a gold medallion, then it settles.
 */
function Moment({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => {
    const id = window.setTimeout(onDone, 3200);
    return () => window.clearTimeout(id);
  }, [onDone]);
  const [, icon = '✨', rest = text] = text.match(/^(\p{Extended_Pictographic}\uFE0F?)\s*(.*)$/u) ?? [];
  return (
    <motion.button
      type="button"
      onClick={onDone}
      aria-live="assertive"
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center px-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }}
    >
      <div className="absolute inset-0 bg-[#1E140F]/80 backdrop-blur-[6px]" />
      <span className="moment-rays absolute size-[150vmax]" />
      <motion.div
        className="relative flex size-[132px] items-center justify-center rounded-full text-[64px]"
        style={{
          background: 'radial-gradient(circle at 35% 28%, #FFF4D2 0%, #F2C46B 38%, #C98A2E 72%, #8A5A1C 100%)',
          boxShadow: '0 0 0 6px rgb(255 236 190 / 0.25), 0 0 60px rgb(242 196 107 / 0.65), inset 0 -8px 18px rgb(90 50 10 / 0.45)',
        }}
        initial={{ scale: 0.2, rotate: -25 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 13, delay: 0.08 }}
      >
        <span className="drop-shadow-[0_4px_6px_rgb(90_50_10/0.45)]">{icon}</span>
        <span className="foil absolute inset-0 rounded-full" />
      </motion.div>
      <motion.p
        className="relative mt-6 max-w-[320px] text-center font-serif text-[26px] leading-snug text-[#FFF3E4] [text-shadow:0_2px_18px_rgb(0_0_0/0.5)]"
        initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        {rest}
      </motion.p>
      <motion.span
        className="relative mt-3 text-[12px] tracking-wide text-[#E9D6C2]/55"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        נגיעה כדי להמשיך
      </motion.span>
    </motion.button>
  );
}

/** Number that rolls to its new value. */
function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    if (start === value) return;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / 700);
      const v = Math.round(start + (value - start) * (1 - (1 - k) ** 3));
      setShown(v);
      from.current = v;
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span className="tabular-nums">{shown.toLocaleString('he-IL')}</span>;
}

/** The four animation styles, each shown alive, to pick from. */
function StyleSheet({ open, onClose, pet, run }: { open: boolean; onClose: () => void; pet: PetState; run: Run }) {
  const look = { skin: pet.skin, head: pet.wear.head, face: pet.wear.face, neck: pet.wear.neck };
  const choose = (id: AnimStyle) => {
    tap(8);
    run((p, out) => {
      if (p.anim === id) return;
      p.anim = id;
      out.push({ text: `🎬 ${animStyles.find((a) => a.id === id)!.name}` });
    });
  };
  return (
    <Sheet open={open} onClose={onClose} title="איך הוא זז? 🎬">
      <p className="-mt-2 mb-4 text-[14px] text-muted">ארבעה סגנונות אנימציה. אפשר להחליף מתי שרוצים</p>
      <div className="grid grid-cols-2 gap-3 pb-6">
        {animStyles.map((a) => {
          const on = pet.anim === a.id;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => choose(a.id)}
              className={`flex flex-col items-center rounded-3xl p-3 text-center transition-transform active:scale-[0.97] ${on ? 'bg-soft ring-3 ring-accent' : 'bg-paper shadow-soft'}`}
            >
              <div className="relative mb-2 flex aspect-square w-full items-end justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-sky to-butter px-[18%] pb-[8%]">
                {open && <PigActor look={look} style={a.id} mood="smile" walk={false} interactive={false} />}
              </div>
              <span className="text-[16px] font-bold">
                {a.emoji} {a.name}
              </span>
              <span className="mt-0.5 text-[12px] leading-snug text-muted">{a.desc}</span>
              {on && <span className="mt-1.5 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-white">נבחר ✓</span>}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}
