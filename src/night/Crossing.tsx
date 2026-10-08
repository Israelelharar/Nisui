import { quest } from '../lib/quest';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { client, partner } from '../client';
import { A, a, p } from '../lib/he';
import { boing, chime, honk, pouch as pouchSound, screech, splash, step } from './sfx';
import { tap } from '../lib/haptics';

/**
 * "בדרך ל…": the partner, seen from above, hops across roads and rivers to
 * reach the admin waiting at the gate. Nobody ever gets hurt: a car that would
 * hit slams the brakes just in time, skids, and an old driver leans out of the
 * window to yell something funny. A heart is lost and the player hops back, startled.
 * On the way: relationship pouches with silly tips inside.
 */

// ── tuning ──────────────────────────────────────────────────────────────────
const COLS = 7;
const LANES = 28;
const SPAN = COLS + 6; // objects live on [-3, COLS + 3)
const HOP_MS = 150;

type Kind = 'start' | 'grass' | 'road' | 'river' | 'finish';
interface Car {
  x: number;
  len: number;
  color: string;
  type: 'car' | 'bus' | 'truck' | 'mini';
}
interface Log {
  x: number;
  len: number;
}
interface Lane {
  kind: Kind;
  dir: 1 | -1;
  speed: number;
  cars: Car[];
  logs: Log[];
  trees: Set<number>;
  pouches: Set<number>;
  halted: boolean;
  /** stopped for her without a scene; moves on when she leaves */
  quiet?: boolean;
  /** index of the car that braked, while the lane is halted */
  braked: number;
  duck: number;
  deco: { x: number; y: number; c: string }[];
}

const CAR_COLORS = ['#E2574C', '#3E8ED0', '#F2A93B', '#48B07A', '#8E6BD1', '#F27BA0', '#F4F1E8', '#2F3B52'];

const DRIVER_LINES = [
  p('היי ילד, תסתכל לאן שאתה הולך!!', 'היי ילדה, תסתכלי לאן שאת הולכת!!'),
  'נו באמת! יש מעבר חציה!',
  'בגילי אני לא צריך את הלחץ הזה!',
  'אני נוהג פה מ־1974, אף אחד לא קפץ לי ככה!',
  p('אתה מאוהב או מה? תסתכל על הכביש!', 'את מאוהבת או מה? תסתכלי על הכביש!'),
  'וואי וואי, כמעט עשית לי התקף לב!',
  'שמאל, ימין, שמאל! מה לימדו אתכם?',
  `${p('תגיד', 'תגידי')} ל${a('חבר', 'חברה')} שלך ש${a('יבוא', 'תבוא')} לאסוף אותך!`,
  `יאללה, ${p('רוץ', 'רוצי')} ל${A} שלך, רק לאט!`,
  'ראיתי את זה בטלוויזיה, ככה זה מתחיל!',
  `מה ${p('אתה', 'את')} בטלפון כל הזמן?!`,
  'אצלנו בדור שלנו הסתכלו פעמיים!',
];
const SIDE_LINES = [`${p('אתה נכנס', 'את נכנסת')} בי?! יש לי פח חדש!`, `${p('אדוני', 'גברת')}, אני עומד פה! ${p('אתה נכנס', 'את נכנסת')} בי!`, 'איזה מזל שאני חונה, אחרת…'];
const RIVER_LINES = ['קוואק! זה לא בריכה, מותק!', 'קוואק! הדגים שלי ברחו בגללך!', 'קוואק קוואק! עם בגדים?!'];
const POUCH_LINES = [
  `פאוץ׳ זוגיות: מותר לגנוב ל${a('ו', 'ה')} צ׳יפס מהצלחת`,
  'קופון: חיבוק של 10 דקות, בלי טלפון',
  `פאוץ׳ זוגיות: "אני לא ${p('רעב', 'רעבה')}" = ${a('תן', 'תני')} לי מהשניצל שלך`,
  'פאוץ׳ זוגיות: נשיקה במצח שווה כפול',
  `קופון: ${A} ${a('שוטף', 'שוטפת')} כלים הערב`,
  'פאוץ׳ זוגיות: מי שמכין קפה בבוקר מקבל נשיקה',
  'פאוץ׳ זוגיות: "נו?" אחרי 3 דקות בלי תשובה זה חוקי',
  `קופון: ${A} ${a('בוחר', 'בוחרת')} סרט, ${p('אתה נרדם', 'את נרדמת')} באמצע`,
  'פאוץ׳ זוגיות: מי שמתגעגע ראשון מנצח',
  'קופון: עיסוי כתפיים של 5 דקות',
];

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

function makeLevel(): Lane[] {
  const lanes: Lane[] = [];
  const base = (kind: Kind): Lane => ({ kind, dir: Math.random() < 0.5 ? 1 : -1, speed: 0, cars: [], logs: [], trees: new Set(), pouches: new Set(), halted: false, braked: -1, duck: Math.random() * COLS, deco: [] });
  let i = 0;
  const push = (l: Lane) => {
    // grass gets little flowers
    if (l.kind === 'grass' || l.kind === 'start' || l.kind === 'finish')
      l.deco = Array.from({ length: 6 }, () => ({ x: Math.random() * COLS, y: Math.random(), c: pick(['#FFE36E', '#FF9BB3', '#FFFFFF', '#C8A7FF']) }));
    lanes.push(l);
    i++;
  };
  push(base('start'));
  push(base('start'));
  let lastDir: 1 | -1 = 1;
  while (i < LANES - 1) {
    const t = i / LANES;
    const roll = Math.random();
    if (roll < 0.48 || i < 3) {
      // a road of 1-3 lanes, alternating directions like a real one
      const n = Math.min(LANES - 1 - i, 1 + Math.floor(Math.random() * (t < 0.3 ? 2 : 3)));
      for (let k = 0; k < n; k++) {
        const l = base('road');
        l.dir = k % 2 ? (-lastDir as 1 | -1) : lastDir;
        l.speed = 1.3 + t * 2.1 + rnd(0, 0.6);
        const count = 2 + (Math.random() < 0.4 + t * 0.4 ? 1 : 0);
        for (let c = 0; c < count; c++) {
          const type = pick<Car['type']>(t > 0.3 && Math.random() < 0.25 ? ['bus', 'truck'] : ['car', 'car', 'mini']);
          const len = type === 'bus' ? 2.6 : type === 'truck' ? 2.2 : type === 'mini' ? 1.1 : 1.4;
          l.cars.push({ x: (c / count) * SPAN - 3 + rnd(0, 1.2), len, color: type === 'bus' ? '#F4F1E8' : pick(CAR_COLORS), type });
        }
        if (Math.random() < 0.25) l.pouches.add(Math.floor(Math.random() * COLS));
        push(l);
      }
      lastDir = -lastDir as 1 | -1;
    } else if (roll < 0.75 || i < 5) {
      const l = base('grass');
      const trees = Math.floor(rnd(0, 3.5));
      for (let k = 0; k < trees; k++) l.trees.add(Math.floor(Math.random() * COLS));
      if (Math.random() < 0.55) {
        const free = [...Array(COLS).keys()].filter((c) => !l.trees.has(c));
        l.pouches.add(pick(free));
      }
      push(l);
    } else {
      // a river of 1-2 lanes, logs drifting opposite ways
      const n = Math.min(LANES - 1 - i, Math.random() < 0.5 ? 1 : 2);
      for (let k = 0; k < n; k++) {
        const l = base('river');
        l.dir = k % 2 ? -1 : 1;
        l.speed = 0.7 + t * 0.9 + rnd(0, 0.3);
        const count = 3;
        for (let c = 0; c < count; c++) l.logs.push({ x: (c / count) * SPAN - 3 + rnd(0, 0.6), len: rnd(2.2, 3.1) });
        push(l);
      }
      // a safe bank after every river
      if (i < LANES - 1) push(base('grass'));
    }
  }
  push(base('finish'));
  return lanes;
}

type Bubble = { id: number; x: number; y: number; text: string; kind: 'driver' | 'duck' | 'side' };

export function Crossing({ onClose }: { onClose: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [hearts, setHearts] = useState(3);
  const [pouches, setPouches] = useState(0);
  const [left, setLeft] = useState(LANES - 1);
  const [bubble, setBubble] = useState<Bubble | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [phase, setPhase] = useState<'play' | 'won' | 'lost'>('play');
  const [hint, setHint] = useState(true);
  const [run, setRun] = useState(0);
  const [stats, setStats] = useState({ scares: 0, pouches: 0, total: 0 });
  const api = useRef<{ move: (dx: number, dy: number) => void } | null>(null);

  useEffect(() => {
    const cv = canvas.current!;
    const box = wrap.current!;
    const g = cv.getContext('2d')!;
    const faceD = new Image();
    if (client.faces?.partner) faceD.src = client.faces.partner;
    const faceI = new Image();
    if (client.faces?.admin) faceI.src = client.faces.admin;

    let W = 0;
    let H = 0;
    let L = 56;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      W = box.clientWidth;
      H = box.clientHeight;
      L = W / COLS;
      cv.width = W * dpr;
      cv.height = H * dpr;
      cv.style.width = `${W}px`;
      cv.style.height = `${H}px`;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(box);

    const lanes = makeLevel();
    const totalPouches = lanes.reduce((n, l) => n + l.pouches.size, 0);
    const me = {
      x: Math.floor(COLS / 2),
      lane: 0,
      from: { x: Math.floor(COLS / 2), lane: 0 },
      hopAt: -1e9,
      face: 1,
      bump: -1e9,
      back: null as null | { x: number; lane: number },
      wet: -1e9,
      scaredAt: -1e9,
    };
    let hearts = 3;
    let got = 0;
    let scares = 0;
    let cam = 0;
    let busy = false; // during a scare
    let over = false;
    let bubbleId = 0;
    let lastT = performance.now();

    const laneY = (i: number) => H * 0.74 - (i - cam) * L;

    const say = (text: string, kind: Bubble['kind'], x: number, lane: number) => {
      const b = { id: ++bubbleId, x, y: laneY(lane), text, kind };
      setBubble(b);
      window.setTimeout(() => setBubble((cur) => (cur?.id === b.id ? null : cur)), 2300);
    };

    const scare = (kind: 'car' | 'side' | 'river', carX?: number, at = me.lane) => {
      if (busy || over) return;
      busy = true;
      scares++;
      hearts--;
      setHearts(hearts);
      tap(30);
      me.scaredAt = performance.now();
      const lane = lanes[at];
      if (kind === 'river') {
        splash();
        me.wet = performance.now();
        say(pick(RIVER_LINES), 'duck', (me.x + 0.5) * L, me.lane);
      } else {
        screech();
        honk();
        say(pick(kind === 'side' ? SIDE_LINES : DRIVER_LINES), kind === 'side' ? 'side' : 'driver', ((carX ?? me.x) + 0.5) * L, at);
      }
      if (at !== me.lane) {
        // she bumped into a car's side from the lane below: no hop, just a wobble
        me.bump = performance.now();
        window.setTimeout(() => {
          lane.halted = false;
          lane.braked = -1;
          busy = false;
          if (hearts <= 0) {
            over = true;
            setStats({ scares, pouches: got, total: totalPouches });
            setPhase('lost');
          }
        }, 1600);
        return;
      }
      window.setTimeout(() => {
        // startled, she hops back to where she came from
        const back = me.back ?? { x: me.x, lane: Math.max(0, me.lane - 1) };
        // never back onto water: find dry land below
        let bl = Math.min(back.lane, kind === 'river' ? me.lane - 1 : back.lane);
        while (bl > 0 && lanes[bl].kind === 'river') bl--;
        const bx = Math.max(0, Math.min(COLS - 1, Math.round(back.x)));
        hopTo(lanes[bl].trees.has(bx) ? Math.floor(COLS / 2) : bx, Math.max(0, bl), true);
        window.setTimeout(() => {
          lane.halted = false;
          lane.braked = -1;
          busy = false;
          if (hearts <= 0) {
            over = true;
            setStats({ scares, pouches: got, total: totalPouches });
            setPhase('lost');
          }
        }, HOP_MS + 250);
      }, 1500);
    };

    const hopTo = (x: number, lane: number, silent = false) => {
      me.from = { x: me.x, lane: me.lane };
      if (!silent) me.back = { x: me.x, lane: me.lane };
      me.x = x;
      me.lane = lane;
      me.hopAt = performance.now();
      if (!silent) step();
    };

    const move = (dx: number, dy: number) => {
      if (busy || over) return;
      const now = performance.now();
      if (now - me.hopAt < HOP_MS * 0.9) return;
      setHint(false);
      if (dx) me.face = dx;
      const onRiver = lanes[me.lane].kind === 'river';
      const lane = Math.max(0, Math.min(LANES - 1, me.lane + dy));
      const target = lanes[lane];
      let x = target.kind === 'river' || (onRiver && dy === 0) ? me.x + dx : Math.round(me.x + dx);
      if (x < 0 || x > COLS - 1) {
        if (target.kind !== 'river') return;
        x = Math.max(0, Math.min(COLS - 1, x));
      }
      if (target.trees.has(Math.round(x)) && target.kind === 'grass') {
        me.bump = now;
        boing();
        tap(6);
        return;
      }
      if (lane === me.lane && dx === 0) return;
      if (target.kind === 'road') {
        // walking into the side of a car: it honks, she bounces off
        const k = target.cars.findIndex((c) => x + 0.5 > c.x - 0.02 && x + 0.5 < c.x + c.len + 0.02);
        if (k >= 0) {
          target.halted = true;
          target.braked = k;
          scare('side', target.cars[k].x + target.cars[k].len / 2 - 0.5, lane);
          return;
        }
      }
      hopTo(x, lane);
      tap(5);
      setLeft(LANES - 1 - Math.max(me.lane, 0));
    };
    api.current = { move };

    /** After a hop lands: river, road, pouch, finish. */
    const land = () => {
      const lane = lanes[me.lane];
      const col = Math.round(me.x);
      if (lane.kind === 'river') {
        const on = lane.logs.some((l) => me.x + 0.5 > l.x + 0.1 && me.x + 0.5 < l.x + l.len - 0.1);
        if (!on) scare('river');
      } else if (lane.kind === 'road') {
        const hit = lane.cars.findIndex((c) => me.x + 0.5 > c.x - 0.05 && me.x + 0.5 < c.x + c.len + 0.05);
        if (hit >= 0) {
          lane.halted = true;
          lane.braked = hit;
          scare('side', lane.cars[hit].x);
        }
      }
      if (lane.pouches.has(col) && !busy) {
        lane.pouches.delete(col);
        got++;
        setPouches(got);
        quest('pouch');
        pouchSound();
        tap(10);
        const line = pick(POUCH_LINES);
        setToast(line);
        window.setTimeout(() => setToast((t) => (t === line ? null : t)), 2600);
      }
      if (lane.kind === 'finish' && !over) {
        over = true;
        quest('road');
        chime([523, 659, 784, 1047, 1319, 1568]);
        setStats({ scares, pouches: got, total: totalPouches });
        window.setTimeout(() => setPhase('won'), 700);
      }
    };

    // ── drawing helpers ──
    const rr = (x: number, y: number, w: number, h: number, r: number) => {
      g.beginPath();
      g.roundRect(x, y, w, h, r);
    };

    const drawCar = (c: Car, y: number, dir: number, braking: boolean, lane: Lane, i: number) => {
      const x = c.x * L;
      const w = c.len * L;
      const h = L * (c.type === 'bus' || c.type === 'truck' ? 0.72 : 0.6);
      const top = y + (L - h) / 2;
      // shadow
      g.fillStyle = 'rgba(0,0,0,0.22)';
      rr(x + 3, top + 5, w, h, 9);
      g.fill();
      // skid marks behind a braking car
      if (braking) {
        g.strokeStyle = 'rgba(20,20,20,0.45)';
        g.lineWidth = 3;
        const back = dir > 0 ? x : x + w;
        for (const yy of [top + h * 0.22, top + h * 0.78]) {
          g.beginPath();
          g.moveTo(back, yy);
          g.lineTo(back - dir * L * 1.3, yy);
          g.stroke();
        }
      }
      const front = dir > 0 ? x + w : x;
      if (c.type === 'bus') {
        g.fillStyle = '#F4F1E8';
        rr(x, top, w, h, 8);
        g.fill();
        g.fillStyle = '#3E8ED0';
        g.fillRect(x + 4, top + h * 0.42, w - 8, h * 0.16);
        g.fillStyle = '#9FD3F2';
        for (let k = 0; k < 5; k++) {
          const wx = x + 10 + (k * (w - 20)) / 5;
          g.fillRect(wx, top + 3, (w - 20) / 5 - 4, h * 0.2);
          g.fillRect(wx, top + h - 3 - h * 0.2, (w - 20) / 5 - 4, h * 0.2);
        }
        g.fillStyle = '#BFD9E8';
        rr(x + w * 0.4, top + h * 0.3, w * 0.2, h * 0.4, 3);
        g.fill();
      } else if (c.type === 'truck') {
        const cab = L * 0.65;
        const cabX = dir > 0 ? x + w - cab : x;
        const boxX = dir > 0 ? x : x + cab + 3;
        g.fillStyle = '#E9E3D6';
        rr(boxX, top, w - cab - 3, h, 5);
        g.fill();
        g.strokeStyle = '#C9C0AE';
        g.lineWidth = 1.5;
        for (let k = 1; k < 4; k++) {
          const lx = boxX + (k * (w - cab - 3)) / 4;
          g.beginPath();
          g.moveTo(lx, top + 3);
          g.lineTo(lx, top + h - 3);
          g.stroke();
        }
        g.fillStyle = c.color;
        rr(cabX, top + 2, cab, h - 4, 8);
        g.fill();
        g.fillStyle = '#9FD3F2';
        rr(dir > 0 ? cabX + cab * 0.55 : cabX + cab * 0.15, top + 6, cab * 0.3, h - 12, 4);
        g.fill();
      } else {
        g.fillStyle = c.color;
        rr(x, top, w, h, c.type === 'mini' ? 12 : 10);
        g.fill();
        // bumper shade + roof
        g.fillStyle = 'rgba(0,0,0,0.14)';
        rr(x + w * 0.24, top + h * 0.14, w * 0.52, h * 0.72, 7);
        g.fill();
        g.fillStyle = c.color;
        rr(x + w * 0.28, top + h * 0.18, w * 0.44, h * 0.64, 6);
        g.fill();
        // windshield in front, rear window behind
        g.fillStyle = '#A8DBF5';
        const ws = w * 0.12;
        rr(dir > 0 ? x + w * 0.64 : x + w * 0.24, top + h * 0.2, ws, h * 0.6, 3);
        g.fill();
        g.fillStyle = '#7FBFE0';
        rr(dir > 0 ? x + w * 0.24 : x + w * 0.64, top + h * 0.24, ws * 0.8, h * 0.52, 3);
        g.fill();
        // a highlight on the roof
        g.fillStyle = 'rgba(255,255,255,0.25)';
        rr(x + w * 0.32, top + h * 0.22, w * 0.2, h * 0.12, 3);
        g.fill();
      }
      // headlights and taillights
      g.fillStyle = braking ? '#FFF6B0' : '#FFE9A0';
      for (const yy of [top + h * 0.2, top + h * 0.8]) {
        g.beginPath();
        g.arc(front - dir * 3, yy, 3, 0, Math.PI * 2);
        g.fill();
      }
      g.fillStyle = braking ? '#FF2E2E' : '#B83A3A';
      const backX = dir > 0 ? x + 2 : x + w - 2;
      for (const yy of [top + h * 0.2, top + h * 0.8]) {
        g.beginPath();
        g.arc(backX, yy, braking ? 3.6 : 2.4, 0, Math.PI * 2);
        g.fill();
        if (braking) {
          g.fillStyle = 'rgba(255,60,60,0.25)';
          g.beginPath();
          g.arc(backX, yy, 9, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = '#FF2E2E';
        }
      }
      // the grumpy old driver leans out of the window
      if (braking && lane.braked === i) {
        const hx = x + w * (dir > 0 ? 0.56 : 0.44);
        const hy = top - 4;
        const wob = Math.sin(performance.now() / 70) * 1.5;
        g.fillStyle = '#F1C9A5';
        g.strokeStyle = '#2E2226';
        g.lineWidth = 1.6;
        g.beginPath();
        g.arc(hx + wob, hy, L * 0.17, 0, Math.PI * 2);
        g.fill();
        g.stroke();
        // white tufts, glasses, angry brows
        g.fillStyle = '#FFFFFF';
        g.beginPath();
        g.arc(hx + wob - L * 0.15, hy, L * 0.06, 0, Math.PI * 2);
        g.arc(hx + wob + L * 0.15, hy, L * 0.06, 0, Math.PI * 2);
        g.fill();
        g.beginPath();
        g.arc(hx + wob - L * 0.06, hy + 1, L * 0.045, 0, Math.PI * 2);
        g.moveTo(hx + wob + L * 0.105, hy + 1);
        g.arc(hx + wob + L * 0.06, hy + 1, L * 0.045, 0, Math.PI * 2);
        g.stroke();
        g.beginPath();
        g.moveTo(hx + wob - L * 0.11, hy - L * 0.07);
        g.lineTo(hx + wob - L * 0.02, hy - L * 0.04);
        g.moveTo(hx + wob + L * 0.11, hy - L * 0.07);
        g.lineTo(hx + wob + L * 0.02, hy - L * 0.04);
        g.stroke();
        // a shaking fist
        g.fillStyle = '#F1C9A5';
        g.beginPath();
        g.arc(hx + wob + dir * L * 0.28, hy - L * 0.12 + Math.sin(performance.now() / 55) * 3, L * 0.07, 0, Math.PI * 2);
        g.fill();
        g.stroke();
      }
    };

    const drawTree = (cx: number, y: number) => {
      g.fillStyle = 'rgba(0,0,0,0.2)';
      g.beginPath();
      g.ellipse(cx + 4, y + L * 0.62, L * 0.4, L * 0.18, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#7A5236';
      g.fillRect(cx - 3, y + L * 0.35, 6, L * 0.3);
      const blobs: [number, number, number, string][] = [
        [0, 0.22, 0.34, '#3F8F4E'],
        [-0.16, 0.3, 0.22, '#3F8F4E'],
        [0.17, 0.3, 0.22, '#3F8F4E'],
        [-0.05, 0.16, 0.22, '#58AE5E'],
        [0.08, 0.12, 0.13, '#7CCB72'],
      ];
      for (const [dx, dy, r, c] of blobs) {
        g.fillStyle = c;
        g.beginPath();
        g.arc(cx + dx * L, y + dy * L, r * L, 0, Math.PI * 2);
        g.fill();
      }
    };

    const drawPouch = (cx: number, y: number, t: number) => {
      const bob = Math.sin(t / 300 + cx) * 3;
      const cy = y + L * 0.5 + bob;
      g.fillStyle = 'rgba(0,0,0,0.18)';
      g.beginPath();
      g.ellipse(cx, y + L * 0.8, L * 0.2, L * 0.07, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#F58FB0';
      g.strokeStyle = '#2E2226';
      g.lineWidth = 1.6;
      rr(cx - L * 0.2, cy - L * 0.14, L * 0.4, L * 0.32, 6);
      g.fill();
      g.stroke();
      g.beginPath();
      g.arc(cx, cy - L * 0.14, L * 0.1, Math.PI, 0);
      g.stroke();
      // heart on the pouch
      g.fillStyle = '#C2385A';
      const s = L * 0.06;
      g.beginPath();
      g.moveTo(cx, cy + s * 1.6);
      g.bezierCurveTo(cx - s * 2.2, cy, cx - s, cy - s * 1.4, cx, cy - s * 0.3);
      g.bezierCurveTo(cx + s, cy - s * 1.4, cx + s * 2.2, cy, cx, cy + s * 1.6);
      g.fill();
      // sparkle
      g.fillStyle = 'rgba(255,255,255,0.9)';
      const sp = (Math.sin(t / 200 + cx) + 1) / 2;
      g.beginPath();
      g.arc(cx + L * 0.2, cy - L * 0.2, 1.5 + sp * 1.5, 0, Math.PI * 2);
      g.fill();
    };

    const drawFace = (img: HTMLImageElement, cx: number, cy: number, r: number) => {
      g.save();
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.fillStyle = '#F1C9A5';
      g.fill();
      g.clip();
      if (img.complete && img.naturalWidth) g.drawImage(img, cx - r * 1.52, cy - r * 1.48, r * 3, r * 3);
      else {
        // no photo: a little drawn face (hair, eyes, cheeks, smile)
        g.fillStyle = '#4A2E22';
        g.beginPath();
        g.ellipse(cx, cy - r * 0.95, r * 1.15, r * 0.62, 0, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#2E2226';
        for (const s of [-1, 1]) {
          g.beginPath();
          g.arc(cx + s * r * 0.36, cy + r * 0.05, r * 0.12, 0, Math.PI * 2);
          g.fill();
        }
        g.fillStyle = 'rgba(240,138,156,0.55)';
        for (const s of [-1, 1]) {
          g.beginPath();
          g.ellipse(cx + s * r * 0.58, cy + r * 0.38, r * 0.18, r * 0.11, 0, 0, Math.PI * 2);
          g.fill();
        }
        g.strokeStyle = '#7A2E3A';
        g.lineWidth = Math.max(1, r * 0.1);
        g.beginPath();
        g.arc(cx, cy + r * 0.3, r * 0.26, 0.15 * Math.PI, 0.85 * Math.PI);
        g.stroke();
      }
      g.restore();
      g.strokeStyle = '#2E2226';
      g.lineWidth = 2;
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.stroke();
    };

    const drawPartner = (px: number, py: number, lift: number, squash: number, t: number) => {
      const cx = px;
      const base = py + L * 0.72;
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.beginPath();
      g.ellipse(cx, base, L * 0.26 * (1 - lift * 0.3), L * 0.09, 0, 0, Math.PI * 2);
      g.fill();
      const y = base - lift * L * 0.45;
      const sx = 1 + squash * 0.18;
      const sy = 1 - squash * 0.18;
      g.save();
      g.translate(cx, y);
      g.scale(sx, sy);
      // legs
      g.strokeStyle = '#2E2226';
      g.lineWidth = 5;
      g.lineCap = 'round';
      const k = lift > 0.05 ? 0.12 : 0;
      g.beginPath();
      g.moveTo(-L * 0.08, -L * 0.18);
      g.lineTo(-L * 0.09 - k * L, -L * 0.02);
      g.moveTo(L * 0.08, -L * 0.18);
      g.lineTo(L * 0.09 + k * L, -L * 0.02);
      g.stroke();
      // ponytail behind (for her)
      if (partner.gender === 'f') {
        g.fillStyle = '#4A2E22';
        g.beginPath();
        g.ellipse(-me.face * L * 0.2, -L * 0.62 + Math.sin(t / 120) * 1.5, L * 0.08, L * 0.16, me.face * 0.5, 0, Math.PI * 2);
        g.fill();
      }
      // backpack + body
      g.fillStyle = '#C2385A';
      g.strokeStyle = '#2E2226';
      g.lineWidth = 1.8;
      rr(-L * 0.2, -L * 0.42, L * 0.4, L * 0.28, 9);
      g.fill();
      g.stroke();
      g.fillStyle = '#3A3A48';
      rr(-L * 0.17, -L * 0.4, L * 0.34, L * 0.24, 8);
      g.fill();
      // arms swinging
      g.strokeStyle = '#F1C9A5';
      g.lineWidth = 4.5;
      const sw = lift > 0.05 ? -0.15 : Math.sin(t / 90) * 0.04;
      g.beginPath();
      g.moveTo(-L * 0.18, -L * 0.36);
      g.lineTo(-L * 0.26, -L * (0.22 + sw));
      g.moveTo(L * 0.18, -L * 0.36);
      g.lineTo(L * 0.26, -L * (0.22 - sw));
      g.stroke();
      g.restore();
      drawFace(faceD, cx, y - L * 0.6 * sy, L * 0.25);
      // startled sweat drops / wet drips
      const since = t - me.scaredAt;
      if (since < 1500) {
        g.fillStyle = '#8FD3FF';
        for (const d of [-1, 1]) {
          g.beginPath();
          g.ellipse(cx + d * L * 0.32, y - L * 0.75 - (since / 1500) * 6, 2.5, 4, 0, 0, Math.PI * 2);
          g.fill();
        }
      }
      if (t - me.wet < 2500) {
        // a duck ring around her
        g.strokeStyle = '#FFD54F';
        g.lineWidth = 5;
        g.beginPath();
        g.ellipse(cx, y - L * 0.25, L * 0.32, L * 0.14, 0, 0, Math.PI * 2);
        g.stroke();
      }
    };

    const drawAdmin = (cx: number, y: number, t: number) => {
      const base = y + L * 0.78;
      g.fillStyle = 'rgba(0,0,0,0.25)';
      g.beginPath();
      g.ellipse(cx, base, L * 0.3, L * 0.1, 0, 0, Math.PI * 2);
      g.fill();
      const by = base - Math.abs(Math.sin(t / 260)) * 4;
      g.strokeStyle = '#2E2226';
      g.lineWidth = 5;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(cx - L * 0.09, by - L * 0.2);
      g.lineTo(cx - L * 0.1, by - L * 0.02);
      g.moveTo(cx + L * 0.09, by - L * 0.2);
      g.lineTo(cx + L * 0.1, by - L * 0.02);
      g.stroke();
      g.fillStyle = '#2F3036';
      g.strokeStyle = '#2E2226';
      g.lineWidth = 1.8;
      rr(cx - L * 0.22, by - L * 0.48, L * 0.44, L * 0.32, 10);
      g.fill();
      g.stroke();
      // both arms waving her in
      g.strokeStyle = '#F1C9A5';
      g.lineWidth = 5;
      const wave = Math.sin(t / 160) * 0.12;
      g.beginPath();
      g.moveTo(cx - L * 0.2, by - L * 0.42);
      g.lineTo(cx - L * 0.36, by - L * (0.72 + wave));
      g.moveTo(cx + L * 0.2, by - L * 0.42);
      g.lineTo(cx + L * 0.36, by - L * (0.72 - wave));
      g.stroke();
      drawFace(faceI, cx, by - L * 0.66, L * 0.27);
      // floating hearts
      for (let k = 0; k < 3; k++) {
        const p = ((t / 1400 + k / 3) % 1 + 1) % 1;
        g.globalAlpha = 1 - p;
        g.fillStyle = '#F27BA0';
        const hx = cx + (k - 1) * L * 0.3 + Math.sin(t / 300 + k) * 4;
        const hy = by - L * 0.9 - p * L * 0.8;
        const s = 4;
        g.beginPath();
        g.moveTo(hx, hy + s * 1.6);
        g.bezierCurveTo(hx - s * 2.2, hy, hx - s, hy - s * 1.4, hx, hy - s * 0.3);
        g.bezierCurveTo(hx + s, hy - s * 1.4, hx + s * 2.2, hy, hx, hy + s * 1.6);
        g.fill();
      }
      g.globalAlpha = 1;
    };

    const drawLane = (lane: Lane, i: number, y: number, t: number) => {
      if (lane.kind === 'road') {
        g.fillStyle = '#4B4D57';
        g.fillRect(0, y, W, L);
        const prev = lanes[i - 1]?.kind === 'road';
        const next = lanes[i + 1]?.kind === 'road';
        g.fillStyle = '#E8E3D6';
        if (next) {
          for (let x = 0; x < W; x += L * 0.7) g.fillRect(x + L * 0.1, y - 1.5, L * 0.36, 3);
        } else {
          g.fillStyle = '#A9A396';
          g.fillRect(0, y - 3, W, 5);
        }
        if (!prev) {
          g.fillStyle = '#A9A396';
          g.fillRect(0, y + L - 2, W, 5);
        }
        // a few tyre-worn patches for texture
        g.fillStyle = 'rgba(255,255,255,0.04)';
        g.fillRect(0, y + L * 0.18, W, L * 0.12);
        g.fillRect(0, y + L * 0.7, W, L * 0.12);
      } else if (lane.kind === 'river') {
        g.fillStyle = '#4DB2E3';
        g.fillRect(0, y, W, L);
        g.strokeStyle = 'rgba(255,255,255,0.35)';
        g.lineWidth = 2;
        const off = ((t / 1000) * lane.speed * lane.dir * L) % (L * 1.6);
        for (let k = -2; k < COLS + 2; k++) {
          const wx = k * L * 1.6 + off;
          const wy = y + L * (0.3 + 0.4 * ((k + i) % 2));
          g.beginPath();
          g.moveTo(wx, wy);
          g.quadraticCurveTo(wx + L * 0.2, wy - 4, wx + L * 0.4, wy);
          g.stroke();
        }
        // banks
        g.fillStyle = 'rgba(0,0,0,0.12)';
        g.fillRect(0, y, W, 4);
      } else {
        g.fillStyle = i % 2 ? '#8BD27A' : '#81C971';
        if (lane.kind === 'finish') g.fillStyle = '#9BDB86';
        g.fillRect(0, y, W, L);
        for (const d of lane.deco) {
          g.fillStyle = d.c;
          g.beginPath();
          g.arc(d.x * L, y + d.y * L, 2.2, 0, Math.PI * 2);
          g.fill();
        }
      }
    };

    const drawLaneObjects = (lane: Lane, y: number, t: number) => {
      if (lane.kind === 'river') {
        for (const l of lane.logs) {
          const x = l.x * L;
          const w = l.len * L;
          g.fillStyle = 'rgba(0,0,0,0.18)';
          rr(x + 2, y + L * 0.2 + 4, w, L * 0.6, L * 0.3);
          g.fill();
          g.fillStyle = '#8A5A3A';
          rr(x, y + L * 0.18, w, L * 0.6, L * 0.3);
          g.fill();
          g.strokeStyle = '#6B4329';
          g.lineWidth = 2;
          for (let k = 1; k < 4; k++) {
            g.beginPath();
            g.moveTo(x + (w * k) / 4 - 8, y + L * 0.32);
            g.lineTo(x + (w * k) / 4 + 8, y + L * 0.32);
            g.stroke();
          }
          g.fillStyle = '#C9935F';
          g.beginPath();
          g.ellipse(x + w - L * 0.12, y + L * 0.48, L * 0.1, L * 0.24, 0, 0, Math.PI * 2);
          g.fill();
        }
        // a duck paddling along
        const dx = ((lane.duck + (t / 1000) * lane.speed * 0.5 * lane.dir) % SPAN + SPAN) % SPAN - 3;
        const dy = y + L * 0.55 + Math.sin(t / 400) * 2;
        g.fillStyle = '#FFFFFF';
        g.beginPath();
        g.ellipse(dx * L, dy, L * 0.14, L * 0.09, 0, 0, Math.PI * 2);
        g.fill();
        g.beginPath();
        g.arc(dx * L + lane.dir * L * 0.1, dy - L * 0.08, L * 0.06, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#F5A623';
        g.beginPath();
        g.moveTo(dx * L + lane.dir * L * 0.15, dy - L * 0.09);
        g.lineTo(dx * L + lane.dir * L * 0.22, dy - L * 0.07);
        g.lineTo(dx * L + lane.dir * L * 0.15, dy - L * 0.05);
        g.fill();
      }
      for (const c of lane.pouches) drawPouch((c + 0.5) * L, y, t);
      if (lane.kind === 'grass') for (const c of lane.trees) drawTree((c + 0.5) * L, y);
      if (lane.kind === 'road') lane.cars.forEach((c, k) => drawCar(c, y, lane.dir, lane.halted && (lane.braked === k || lane.quiet === true), lane, k));
      if (lane.kind === 'finish') {
        // the gate with his name, flags, and the admin waiting
        const gx = W / 2;
        g.fillStyle = '#6E7480';
        g.fillRect(gx - L * 1.6, y - L * 0.9, 6, L * 1.6);
        g.fillRect(gx + L * 1.6 - 6, y - L * 0.9, 6, L * 1.6);
        g.fillStyle = '#FFFFFF';
        g.strokeStyle = '#1F4FA8';
        g.lineWidth = 3;
        rr(gx - L * 1.25, y - L * 1.05, L * 2.5, L * 0.5, 8);
        g.fill();
        g.stroke();
        g.fillStyle = '#1F4FA8';
        g.font = `700 ${Math.round(L * 0.3)}px Assistant, sans-serif`;
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText(A, gx, y - L * 0.8);
        for (let k = 0; k < COLS; k++) {
          if (Math.abs(k + 0.5 - COLS / 2) < 2) continue;
          const fx = (k + 0.5) * L;
          g.fillStyle = '#9A9A9A';
          g.fillRect(fx - 1, y - L * 0.5, 2, L * 0.75);
          const wv = Math.sin(t / 250 + k) * 2;
          g.fillStyle = '#FFFFFF';
          g.fillRect(fx + 1, y - L * 0.5 + wv * 0.3, L * 0.34, L * 0.24);
          g.fillStyle = '#1F4FA8';
          g.fillRect(fx + 1, y - L * 0.47 + wv * 0.3, L * 0.34, 2);
          g.fillRect(fx + 1, y - L * 0.31 + wv * 0.3, L * 0.34, 2);
        }
        drawAdmin(gx, y, t);
      }
    };

    let raf = 0;
    const frame = (t: number) => {
      const dt = Math.min(0.04, (t - lastT) / 1000);
      lastT = t;

      // world motion
      for (let i = 0; i < lanes.length; i++) {
        const lane = lanes[i];
        if (lane.halted) continue;
        for (const c of lane.cars) {
          c.x += lane.dir * lane.speed * dt;
          if (lane.dir > 0 && c.x > COLS + 3) c.x -= SPAN + c.len;
          if (lane.dir < 0 && c.x + c.len < -3) c.x += SPAN + c.len;
        }
        for (const l of lane.logs) {
          l.x += lane.dir * lane.speed * dt;
          if (lane.dir > 0 && l.x > COLS + 3) l.x -= SPAN + l.len;
          if (lane.dir < 0 && l.x + l.len < -3) l.x += SPAN + l.len;
        }
      }

      const hopP = Math.min(1, (t - me.hopAt) / HOP_MS);
      const landed = hopP >= 1;
      if (landed && me.hopAt > 0 && (me as { _l?: number })._l !== me.hopAt) {
        (me as { _l?: number })._l = me.hopAt;
        if (!busy) land();
      }

      // a lane that stopped quietly for her (while she was busy being yelled at) moves on once she's gone
      lanes.forEach((l, i) => {
        if (l.quiet && i !== me.lane && hopP >= 1) {
          l.quiet = false;
          l.halted = false;
          l.braked = -1;
        }
      });

      if (landed && !over) {
        const lane = lanes[me.lane];
        if (busy) {
          // already being yelled at: other traffic in her lane just stops for her
          if (lane.kind === 'road' && !lane.halted) {
            const hit = lane.cars.some((c) => {
              const front = lane.dir > 0 ? c.x + c.len : c.x;
              const gap = lane.dir > 0 ? me.x + 0.2 - front : front - (me.x + 0.8);
              return gap > -0.6 && gap < 0.3;
            });
            if (hit) {
              lane.halted = true;
              lane.quiet = true;
            }
          }
        } else if (lane.kind === 'river') {
          const log = lane.logs.find((l) => me.x + 0.5 > l.x + 0.05 && me.x + 0.5 < l.x + l.len - 0.05);
          if (log) {
            me.x += lane.dir * lane.speed * dt;
            if (me.x < -0.4 || me.x > COLS - 0.6) scare('river');
          } else scare('river');
        } else if (lane.kind === 'road' && !lane.halted) {
          // a car about to reach her slams the brakes and stops just short
          const pad = 0.12;
          lane.cars.forEach((c, k) => {
            if (lane.halted) return;
            const mine0 = me.x + 0.2;
            const mine1 = me.x + 0.8;
            const front = lane.dir > 0 ? c.x + c.len : c.x;
            const gap = lane.dir > 0 ? mine0 - front : front - mine1;
            const overlap = c.x < mine1 && c.x + c.len > mine0;
            if ((gap >= -0.05 && gap < 0.14) || (overlap && gap > -0.6)) {
              lane.halted = true;
              lane.braked = k;
              c.x = lane.dir > 0 ? mine0 - pad - c.len : mine1 + pad;
              scare('car', c.x);
            }
          });
        }
      }

      // camera eases after her, never far behind
      const want = Math.max(0, me.lane - 1.2);
      cam += (want - cam) * Math.min(1, dt * 6);

      // draw
      g.clearRect(0, 0, W, H);
      g.fillStyle = '#81C971';
      g.fillRect(0, 0, W, H);
      const first = Math.max(0, Math.floor(cam - 4));
      const last = Math.min(lanes.length - 1, Math.ceil(cam + H / L + 2));
      for (let i = last; i >= first; i--) drawLane(lanes[i], i, laneY(i), t);
      // beyond the finish: a park
      if (laneY(lanes.length - 1) > 0) {
        g.fillStyle = '#9BDB86';
        g.fillRect(0, 0, W, laneY(lanes.length - 1));
      }
      for (let i = last; i >= first; i--) {
        drawLaneObjects(lanes[i], laneY(i), t);
        {
          if (i === me.lane) {
            const fx = me.from.x + (me.x - me.from.x) * hopP;
            const fl = me.from.lane + (me.lane - me.from.lane) * hopP;
            const lift = Math.sin(Math.PI * hopP);
            const bumpK = Math.max(0, 1 - (t - me.bump) / 200);
            const squash = landed ? Math.max(0, 1 - (t - me.hopAt - HOP_MS) / 120) * 0.8 : -lift * 0.5;
            drawPartner((fx + 0.5) * L + Math.sin((t - me.bump) / 25) * 4 * bumpK, H * 0.74 - (fl - cam) * L, lift, squash, t);
          }
        }
      }

      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const onKey = (e: KeyboardEvent) => {
      const m: Record<string, [number, number]> = { ArrowUp: [0, 1], ArrowDown: [0, -1], ArrowLeft: [-1, 0], ArrowRight: [1, 0], w: [0, 1], s: [0, -1], a: [-1, 0], d: [1, 0] };
      const d = m[e.key];
      if (d) {
        e.preventDefault();
        move(d[0], d[1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('keydown', onKey);
    };
  }, [run]);

  // swipe: up/down/left/right; a plain tap hops forward
  const start = useRef<{ x: number; y: number } | null>(null);
  const onDown = (e: React.PointerEvent) => (start.current = { x: e.clientX, y: e.clientY });
  const onUp = (e: React.PointerEvent) => {
    const s = start.current;
    start.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.hypot(dx, dy) < 18) return api.current?.move(0, 1);
    if (Math.abs(dx) > Math.abs(dy)) api.current?.move(dx > 0 ? 1 : -1, 0);
    else api.current?.move(0, dy < 0 ? 1 : -1);
  };

  const again = () => {
    setHearts(3);
    setPouches(0);
    setLeft(LANES - 1);
    setBubble(null);
    setToast(null);
    setHint(true);
    setPhase('play');
    setRun((r) => r + 1);
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex justify-center bg-[#81C971]" role="dialog" aria-modal="true" aria-label={`בדרך ל${A}`}>
      <div ref={wrap} className="relative h-full w-full max-w-[520px] touch-none overflow-hidden select-none" onPointerDown={onDown} onPointerUp={onUp}>
        <canvas ref={canvas} className="absolute inset-0" aria-hidden />

        {/* HUD */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 px-3 pt-[max(12px,env(safe-area-inset-top))]" dir="rtl">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onClick={onClose}
            aria-label="סגירה"
            className="pointer-events-auto flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-[#2E2226] bg-white/90 text-[#2E2226] shadow-[0_3px_0_#2E2226] active:translate-y-0.5 active:shadow-none"
          >
            <X size={20} />
          </button>
          <div className="flex flex-col items-center gap-1">
            <p className="rounded-xl border-2 border-[#2E2226] bg-[#1F4FA8] px-3 py-1 font-bold text-white shadow-[0_3px_0_#2E2226]">בדרך ל{A}</p>
            <p className="rounded-full bg-black/35 px-2.5 py-0.5 text-xs font-bold text-white tabular-nums">{left > 0 ? `עוד ${left} נתיבים` : 'הגעת!'}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex gap-0.5" aria-label={`${hearts} לבבות`}>
              {[0, 1, 2].map((i) => (
                <motion.svg key={i} viewBox="0 0 24 24" width="24" height="24" animate={i === hearts ? { scale: [1, 1.5, 0.8, 1] } : {}} transition={{ duration: 0.5 }}>
                  <path d="M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-3 4.5 4.5 0 0 1 8 3c0 6-8 11-8 11z" fill={i < hearts ? '#E2574C' : '#ffffff80'} stroke="#2E2226" strokeWidth="1.8" />
                </motion.svg>
              ))}
            </div>
            <motion.p key={pouches} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="flex items-center gap-1 rounded-full border-2 border-[#2E2226] bg-[#F58FB0] px-2 py-0.5 text-xs font-bold text-[#2E2226] tabular-nums">
              פאוצ׳ים {pouches}
            </motion.p>
          </div>
        </div>

        {/* speech bubble from the driver (or a duck) */}
        <AnimatePresence>
          {bubble && (
            <motion.div
              key={bubble.id}
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', stiffness: 420, damping: 18 }}
              className="pointer-events-none absolute z-20"
              style={{ left: Math.max(8, Math.min(bubble.x - 110, (wrap.current?.clientWidth ?? 400) - 228)), top: bubble.y - 108 }}
              dir="rtl"
            >
              <div className="relative w-[220px] rounded-[20px] border-[2.5px] border-[#2E2226] bg-white px-3 py-2 text-center text-[15px] leading-snug font-bold text-[#2E2226] shadow-[0_4px_0_#2E2226]">
                {bubble.text}
                <span className="absolute -bottom-[11px] left-1/2 block size-4 -translate-x-1/2 rotate-45 border-r-[2.5px] border-b-[2.5px] border-[#2E2226] bg-white" />
              </div>
              {bubble.kind !== 'duck' && <p className="mt-3 -rotate-6 text-center font-serif text-xl font-bold text-[#FFE36E] [text-shadow:0_2px_0_#2E2226,0_-1px_0_#2E2226]">חריקה!</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* a pouch's tip pops up at the bottom, small, out of the way of the road */}
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast}
              initial={{ opacity: 0, y: 40, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 420, damping: 24 }}
              className="pointer-events-none absolute inset-x-0 bottom-[max(18px,env(safe-area-inset-bottom))] z-20 flex justify-center px-5"
              dir="rtl"
            >
              <div className="flex max-w-[340px] items-center gap-2.5 rounded-2xl border-2 border-[#2E2226] bg-[#FFF3F6]/95 py-2 ps-2 pe-3.5 text-[#2E2226] shadow-[0_3px_0_#2E2226] backdrop-blur">
                <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden className="shrink-0 -rotate-6">
                  <rect x="5" y="10" width="22" height="18" rx="5" fill="#F58FB0" stroke="#2E2226" strokeWidth="2" />
                  <path d="M11 10a5 5 0 0 1 10 0" fill="none" stroke="#2E2226" strokeWidth="2" />
                  <path d="M16 24s-5-3-5-6.5a2.6 2.6 0 0 1 5-1 2.6 2.6 0 0 1 5 1C21 21 16 24 16 24z" fill="#C2385A" />
                </svg>
                <span className="min-w-0 text-right leading-tight">
                  {toast.includes(':') && <span className="block text-[11px] font-bold text-[#C2385A]">{toast.split(':')[0]}</span>}
                  <span className="block text-[14px] font-bold">{toast.includes(':') ? toast.slice(toast.indexOf(':') + 1).trim() : toast}</span>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {hint && phase === 'play' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-x-8 bottom-[max(24px,env(safe-area-inset-bottom))] z-20 rounded-2xl bg-black/45 px-4 py-3 text-center text-white backdrop-blur" dir="rtl">
              <p className="font-bold">{p('הקש', 'הקישי')} כדי לקפוץ קדימה</p>
              <p className="text-sm text-white/80">{p('החלק', 'החליקי')} לצדדים או אחורה. אוספים פאוצ׳ים, נזהרים ממכוניות, ומגיעים ל{A}.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase !== 'play' && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 240, damping: 22 }}
              className="absolute inset-x-4 bottom-[max(20px,env(safe-area-inset-bottom))] z-30 rounded-[28px] border-[3px] border-[#2E2226] bg-[#FFF8EE] p-5 text-center text-[#2E2226] shadow-[0_6px_0_#2E2226]"
              dir="rtl"
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
            >
              {phase === 'won' ? (
                <>
                  <h2 className="font-serif text-[28px] leading-tight">הגעת ל{A}!</h2>
                  <p className="mt-1 font-hand text-lg text-[#C2385A]">"סוף סוף. לקח לך שנה, אבל שווה כל שנייה"</p>
                  <p className="mt-3 text-sm">
                    אספת {stats.pouches} מתוך {stats.total} פאוצ׳ים · {stats.scares === 0 ? `ואף נהג לא צעק ${p('עליך', 'עלייך')}!` : `${stats.scares} נהגים צעקו ${p('עליך', 'עלייך')}`}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="font-serif text-[26px] leading-tight">שלוש פעמים כמעט!</h2>
                  <p className="mt-1 font-hand text-lg text-[#C2385A]">{A}: "{p('עזוב, תישאר', 'עזבי, תישארי')} שם. אני {a('בא', 'באה')} לאסוף אותך"</p>
                  <p className="mt-3 text-sm">אספת {stats.pouches} פאוצ׳ים בדרך</p>
                </>
              )}
              <div className="mt-4 flex gap-2">
                <button type="button" onClick={again} className="h-12 flex-1 rounded-2xl border-2 border-[#2E2226] bg-[#F2C27A] font-bold shadow-[0_3px_0_#2E2226] active:translate-y-0.5 active:shadow-none">
                  {phase === 'won' ? 'עוד סיבוב' : 'לנסות שוב'}
                </button>
                <button type="button" onClick={onClose} className="h-12 flex-1 rounded-2xl border-2 border-[#2E2226] bg-white font-bold shadow-[0_3px_0_#2E2226] active:translate-y-0.5 active:shadow-none">
                  סיום
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {phase === 'won' && <Confetti />}
      </div>
    </div>,
    document.body,
  );
}

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden>
      {Array.from({ length: 28 }, (_, i) => (
        <motion.span
          key={i}
          className="absolute top-[-20px] block h-3 w-2 rounded-[2px]"
          style={{ left: `${(i * 37) % 100}%`, background: ['#E2574C', '#F2C27A', '#1F4FA8', '#F58FB0', '#48B07A'][i % 5] }}
          initial={{ y: 0, rotate: 0 }}
          animate={{ y: 900, rotate: 360 * (i % 2 ? 2 : -2), x: [0, (i % 2 ? 1 : -1) * 30, 0] }}
          transition={{ duration: 2.6 + (i % 5) * 0.3, delay: (i % 7) * 0.12, ease: 'easeIn' }}
        />
      ))}
    </div>
  );
}
