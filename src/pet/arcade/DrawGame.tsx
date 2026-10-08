import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Eraser, Heart, PaintBucket, Paintbrush, Pencil, Redo2, Sparkles, Star, Trash2, Undo2, Rainbow } from 'lucide-react';
import { tap } from '../../lib/haptics';
import { A, a, p } from '../../lib/he';
import { pop, sparkle, tada, tick } from '../sound';
import { Stage, type GameProps } from './kit';
import { dedicateArt, deleteArt, listArt, saveArt, type Art } from './artStore';

const W = 600;
const H = 800;
const PAPER = '#FFFDF8';
const COLORS = ['#2B1B17', '#E53950', '#FF8FB0', '#F08A2C', '#F6C455', '#8FD06A', '#2E9E6A', '#7EC8F2', '#3F6FB5', '#9B6FE0', '#B5784A', '#FFFFFF'];
const SIZES = [4, 11, 24];
type Tool = 'pencil' | 'brush' | 'glow' | 'rainbow' | 'eraser' | 'fill' | 'heart' | 'star';
const TOOLS: { id: Tool; label: string; Icon: typeof Pencil }[] = [
  { id: 'pencil', label: 'עיפרון', Icon: Pencil },
  { id: 'brush', label: 'מכחול', Icon: Paintbrush },
  { id: 'glow', label: 'זוהר', Icon: Sparkles },
  { id: 'rainbow', label: 'קשת', Icon: Rainbow },
  { id: 'fill', label: 'דלי', Icon: PaintBucket },
  { id: 'heart', label: 'לבבות', Icon: Heart },
  { id: 'star', label: 'כוכבים', Icon: Star },
  { id: 'eraser', label: 'מחק', Icon: Eraser },
];

/**
 * הסטודיו לציור: paper, crayons-like tools, undo, and a little gallery. Any
 * drawing can be dedicated to the admin: it waits and greets them, once, on
 * the next visit.
 */
export function DrawGame({ onClose, startTab = 'draw' }: GameProps & { startTab?: 'draw' | 'gallery' }) {
  const [tab, setTab] = useState<'draw' | 'gallery'>(startTab);
  const [art, setArt] = useState<Art[] | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [view, setView] = useState<Art | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const reload = useCallback(() => listArt().then(setArt), []);
  useEffect(() => {
    void reload();
  }, [reload]);
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  return (
    <Stage title="הסטודיו לציור" onClose={onClose} bg="linear-gradient(#FBF1E4, #F6E6D3)">
      <div className="flex h-full flex-col">
        <div className="mx-auto mb-2 flex rounded-full bg-[#EAD7C0] p-1 text-[14px] font-bold">
          {(['draw', 'gallery'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                tick();
                setTab(t);
              }}
              className={`rounded-full px-5 py-1.5 transition-colors ${tab === t ? 'bg-paper text-ink shadow-soft' : 'text-ink/60'}`}
            >
              {t === 'draw' ? 'לצייר' : `הגלריה שלי${art?.length ? ` (${art.length})` : ''}`}
            </button>
          ))}
        </div>
        <div className="relative min-h-0 flex-1">
          {/* the easel stays put while she peeks at the gallery, so the drawing waits for her */}
          <div className={tab === 'draw' ? 'h-full' : 'hidden'}>
            <Easel onSave={(img) => setSaving(img)} />
          </div>
          {tab === 'gallery' && <Gallery art={art} onOpen={setView} onDraw={() => setTab('draw')} />}
        </div>
      </div>

      <AnimatePresence>
        {saving && (
          <SaveSheet
            img={saving}
            onCancel={() => setSaving(null)}
            onSave={async (title, dedicate, note) => {
              const saved = await saveArt(saving, title, dedicate, note);
              setSaving(null);
              tada();
              tap(14);
              setToast(dedicate ? `הוקדש ל${A}! ${a('הוא יראה', 'היא תראה')} אותו בפעם הבאה ש${a('ייכנס', 'תיכנס')} לאתר 💌` : 'נשמר בגלריה שלך ✨');
              setArt((cur) => [saved, ...(cur ?? [])]);
            }}
          />
        )}
        {view && (
          <Viewer
            art={view}
            onClose={() => setView(null)}
            onDedicate={async (note) => {
              if (await dedicateArt(view.id, note)) {
                tada();
                setToast(`הוקדש ל${A}! ${a('הוא יראה', 'היא תראה')} אותו בפעם הבאה ש${a('ייכנס', 'תיכנס')} לאתר 💌`);
                setArt((cur) => cur?.map((a) => (a.id === view.id ? { ...a, dedicated: Date.now(), note } : a)) ?? null);
                setView(null);
              } else setToast('לא הצלחתי לשלוח. ננסה שוב עוד רגע?');
            }}
            onDelete={async () => {
              await deleteArt(view.id);
              setArt((cur) => cur?.filter((a) => a.id !== view.id) ?? null);
              setView(null);
            }}
          />
        )}
        {toast && (
          <motion.div
            key="toast"
            className="absolute inset-x-6 bottom-6 z-30 rounded-2xl bg-ink px-4 py-3 text-center text-[15px] font-bold text-white shadow-paper"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </Stage>
  );
}

/* ───────────────────────── the easel ───────────────────────── */

function Easel({ onSave }: { onSave: (img: string) => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('brush');
  const [color, setColor] = useState(COLORS[1]);
  const [size, setSize] = useState(1);
  const undo = useRef<ImageData[]>([]);
  const redo = useRef<ImageData[]>([]);
  const [, bump] = useState(0);
  const [blank, setBlank] = useState(true);
  const stroke = useRef<{ x: number; y: number; mx: number; my: number; t: number; hue: number; w: number } | null>(null);

  const box = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ w: 300, h: 400 });
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const bw = el.clientWidth;
      const bh = el.clientHeight;
      // the biggest 3:4 sheet that fits the space
      const w = Math.min(bw, (bh * W) / H);
      setFit({ w, h: (w * H) / W });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const ctx = () => canvas.current?.getContext('2d', { willReadFrequently: true }) ?? null;
  useEffect(() => {
    const c = ctx();
    if (!c) return;
    c.fillStyle = PAPER;
    c.fillRect(0, 0, W, H);
    // the unfinished drawing from last time, if there is one
    const draft = readDraft();
    if (!draft) return;
    const img = new Image();
    img.onload = () => {
      c.drawImage(img, 0, 0, W, H);
      setBlank(false);
    };
    img.src = draft;
  }, []);
  const keep = () => {
    const c = canvas.current;
    if (c) writeDraft(c.toDataURL('image/jpeg', 0.85));
  };

  const snapshot = () => {
    const c = ctx();
    if (!c) return;
    undo.current.push(c.getImageData(0, 0, W, H));
    if (undo.current.length > 15) undo.current.shift();
    redo.current = [];
    bump((n) => n + 1);
  };
  const point = (e: React.PointerEvent) => {
    const r = canvas.current!.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };

  const down = (e: React.PointerEvent) => {
    const c = ctx();
    if (!c) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    snapshot();
    setBlank(false);
    const p = point(e);
    if (tool === 'fill') {
      floodFill(c, Math.round(p.x), Math.round(p.y), color);
      pop();
      tap(8);
      return;
    }
    if (tool === 'heart' || tool === 'star') {
      stamp(c, tool, p.x, p.y, SIZES[size] * 1.6 + 8, color);
      pop();
      tap(6);
      stroke.current = { ...p, mx: p.x, my: p.y, t: performance.now(), hue: 0, w: 0 };
      return;
    }
    stroke.current = { ...p, mx: p.x, my: p.y, t: performance.now(), hue: Math.random() * 360, w: SIZES[size] };
    dot(c, p.x, p.y);
  };

  const style = (c: CanvasRenderingContext2D, w: number) => {
    const s = stroke.current!;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.shadowBlur = 0;
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    if (tool === 'eraser') {
      c.strokeStyle = PAPER;
      c.fillStyle = PAPER;
      c.lineWidth = w * 1.6;
    } else if (tool === 'rainbow') {
      s.hue = (s.hue + 4) % 360;
      c.strokeStyle = c.fillStyle = `hsl(${s.hue} 85% 62%)`;
      c.lineWidth = w;
    } else if (tool === 'glow') {
      c.strokeStyle = c.fillStyle = color;
      c.shadowColor = color;
      c.shadowBlur = w * 1.4;
      c.lineWidth = w * 0.8;
    } else if (tool === 'pencil') {
      c.strokeStyle = c.fillStyle = color;
      c.globalAlpha = 0.85;
      c.lineWidth = Math.max(2, w * 0.45);
    } else {
      c.strokeStyle = c.fillStyle = color;
      c.lineWidth = w;
    }
  };

  const dot = (c: CanvasRenderingContext2D, x: number, y: number) => {
    const s = stroke.current!;
    style(c, s.w);
    c.beginPath();
    c.arc(x, y, c.lineWidth / 2, 0, Math.PI * 2);
    c.fill();
  };

  const move = (e: React.PointerEvent) => {
    const s = stroke.current;
    const c = ctx();
    if (!s || !c) return;
    const p = point(e);
    if (tool === 'heart' || tool === 'star') {
      if (Math.hypot(p.x - s.x, p.y - s.y) > SIZES[size] * 2.4 + 18) {
        stamp(c, tool, p.x, p.y, SIZES[size] * 1.6 + 8, color);
        s.x = p.x;
        s.y = p.y;
      }
      return;
    }
    if (tool === 'fill') return;
    // the brush thins a little when she moves fast, like real paint
    const now = performance.now();
    const speed = Math.hypot(p.x - s.x, p.y - s.y) / Math.max(1, now - s.t);
    const target = tool === 'brush' ? SIZES[size] * Math.max(0.45, Math.min(1.25, 1.25 - speed * 0.35)) : SIZES[size];
    s.w += (target - s.w) * 0.35;
    s.t = now;
    style(c, s.w);
    const mx = (s.x + p.x) / 2;
    const my = (s.y + p.y) / 2;
    c.beginPath();
    c.moveTo(s.mx, s.my);
    c.quadraticCurveTo(s.x, s.y, mx, my);
    c.stroke();
    s.mx = mx;
    s.my = my;
    s.x = p.x;
    s.y = p.y;
  };
  const up = () => {
    stroke.current = null;
    const c = ctx();
    if (c) {
      c.shadowBlur = 0;
      c.globalAlpha = 1;
    }
    keep();
  };

  const doUndo = () => {
    const c = ctx();
    const last = undo.current.pop();
    if (!c || !last) return;
    redo.current.push(c.getImageData(0, 0, W, H));
    c.putImageData(last, 0, 0);
    keep();
    tick();
    bump((n) => n + 1);
  };
  const doRedo = () => {
    const c = ctx();
    const n = redo.current.pop();
    if (!c || !n) return;
    undo.current.push(c.getImageData(0, 0, W, H));
    c.putImageData(n, 0, 0);
    keep();
    tick();
    bump((x) => x + 1);
  };
  const clear = () => {
    const c = ctx();
    if (!c) return;
    snapshot();
    c.fillStyle = PAPER;
    c.fillRect(0, 0, W, H);
    setBlank(true);
    writeDraft(null);
    tick();
  };

  return (
    <div className="flex h-full flex-col items-center px-3 pb-[max(10px,env(safe-area-inset-bottom))]">
      <div ref={box} className="relative flex min-h-0 w-full flex-1 items-center justify-center">
        <div className="relative" style={{ width: fit.w, height: fit.h }}>
          <span className="absolute -top-2 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rotate-[2deg] bg-[#F7D9A8]/80 shadow-sm" />
          <canvas
            ref={canvas}
            width={W}
            height={H}
            dir="ltr"
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            className="size-full touch-none rounded-[6px] shadow-[0_18px_30px_-16px_rgb(90_50_20/0.55),0_0_0_1px_rgb(90_50_20/0.06)]"
            style={{ cursor: 'crosshair' }}
            aria-label="דף ציור"
          />
          {blank && (
            <p className="pointer-events-none absolute inset-x-0 top-[42%] text-center font-hand text-[18px] text-ink/30">מציירים פה עם האצבע</p>
          )}
        </div>
      </div>

      {/* tools */}
      <div className="mt-2 flex w-full gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
        {TOOLS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              tick();
              tap(4);
              setTool(id);
            }}
            className={`flex min-w-[54px] flex-col items-center gap-0.5 rounded-2xl px-1.5 py-1.5 text-[11px] font-bold transition-all ${
              tool === id ? '-translate-y-1 bg-paper text-accent shadow-soft' : 'text-ink/65'
            }`}
            aria-pressed={tool === id}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}
      </div>

      {/* paints */}
      <div className="mt-1 flex w-full items-center gap-2">
        <div className="flex flex-1 gap-1.5 overflow-x-auto py-1.5 [scrollbar-width:none]">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                tap(4);
                tick();
                setColor(c);
                if (tool === 'eraser') setTool('brush');
              }}
              aria-label={`צבע ${c}`}
              className="size-8 shrink-0 rounded-full transition-transform"
              style={{
                background: c,
                transform: color === c ? 'scale(1.18)' : undefined,
                boxShadow: color === c ? `0 0 0 3px #FFF, 0 0 0 5px ${c === '#FFFFFF' ? '#D9C7B5' : c}` : 'inset 0 -3px 0 rgb(0 0 0 / 0.15), 0 0 0 1px rgb(0 0 0 / 0.08)',
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-full bg-[#EAD7C0] px-2 py-1">
          {SIZES.map((s, i) => (
            <button key={s} type="button" onClick={() => setSize(i)} aria-label={`עובי ${i + 1}`} className="flex size-7 items-center justify-center">
              <span className="rounded-full bg-ink transition-all" style={{ width: 4 + i * 5, height: 4 + i * 5, opacity: size === i ? 1 : 0.3 }} />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-2 flex w-full items-center gap-2">
        <button type="button" onClick={doUndo} disabled={!undo.current.length} aria-label="ביטול" className="flex size-11 items-center justify-center rounded-full bg-paper shadow-soft disabled:opacity-35">
          <Undo2 size={19} />
        </button>
        <button type="button" onClick={doRedo} disabled={!redo.current.length} aria-label="שחזור" className="flex size-11 items-center justify-center rounded-full bg-paper shadow-soft disabled:opacity-35">
          <Redo2 size={19} />
        </button>
        <button type="button" onClick={clear} aria-label="דף חדש" className="flex size-11 items-center justify-center rounded-full bg-paper shadow-soft">
          <Trash2 size={18} />
        </button>
        <button
          type="button"
          disabled={blank}
          onClick={() => {
            sparkle();
            onSave(canvas.current!.toDataURL('image/jpeg', 0.86));
          }}
          className="h-11 flex-1 rounded-full bg-accent font-bold text-white shadow-[0_10px_20px_-10px_rgb(194_56_90/0.9)] transition-transform active:scale-[0.98] disabled:opacity-40"
        >
          לשמור בגלריה
        </button>
      </div>
    </div>
  );
}

/** Her unfinished drawing, kept on this phone so it survives the gallery, closing the studio, or a reload. */
const DRAFT = 'idw:draw-draft';
function readDraft() {
  try {
    return localStorage.getItem(DRAFT);
  } catch {
    return null;
  }
}
function writeDraft(img: string | null) {
  try {
    if (img) localStorage.setItem(DRAFT, img);
    else localStorage.removeItem(DRAFT);
  } catch {
    /* full or blocked: the easel still holds it while the studio is open */
  }
}

function stamp(c: CanvasRenderingContext2D, kind: 'heart' | 'star', x: number, y: number, r: number, color: string) {
  c.save();
  c.translate(x, y);
  c.rotate((Math.random() - 0.5) * 0.6);
  c.fillStyle = color;
  c.strokeStyle = 'rgba(0,0,0,0.12)';
  c.lineWidth = 2;
  c.beginPath();
  if (kind === 'heart') {
    const k = r / 10;
    c.moveTo(0, 9 * k);
    c.bezierCurveTo(-6 * k, 5 * k, -11 * k, 1 * k, -11 * k, -3.5 * k);
    c.bezierCurveTo(-11 * k, -8 * k, -7.5 * k, -10.5 * k, -4.5 * k, -10.5 * k);
    c.bezierCurveTo(-2.5 * k, -10.5 * k, -1 * k, -9.5 * k, 0, -7.5 * k);
    c.bezierCurveTo(1 * k, -9.5 * k, 2.5 * k, -10.5 * k, 4.5 * k, -10.5 * k);
    c.bezierCurveTo(7.5 * k, -10.5 * k, 11 * k, -8 * k, 11 * k, -3.5 * k);
    c.bezierCurveTo(11 * k, 1 * k, 6 * k, 5 * k, 0, 9 * k);
  } else {
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const rr = i % 2 ? r * 0.45 : r;
      c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    c.closePath();
  }
  c.fill();
  c.stroke();
  c.restore();
}

/** A paint-bucket fill: spreads her color over the touching area of (nearly) the same color. */
function floodFill(c: CanvasRenderingContext2D, x: number, y: number, hex: string) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const img = c.getImageData(0, 0, W, H);
  const d = img.data;
  const i0 = (y * W + x) * 4;
  const [r0, g0, b0] = [d[i0], d[i0 + 1], d[i0 + 2]];
  const n = parseInt(hex.slice(1), 16);
  const [r1, g1, b1] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  if (Math.abs(r0 - r1) + Math.abs(g0 - g1) + Math.abs(b0 - b1) < 10) return;
  const same = (i: number) => Math.abs(d[i] - r0) + Math.abs(d[i + 1] - g0) + Math.abs(d[i + 2] - b0) < 90;
  const seen = new Uint8Array(W * H);
  const stack = [x, y];
  while (stack.length) {
    const py = stack.pop()!;
    let px = stack.pop()!;
    while (px >= 0 && same((py * W + px) * 4) && !seen[py * W + px]) px--;
    px++;
    let up = false;
    let dn = false;
    while (px < W && !seen[py * W + px] && same((py * W + px) * 4)) {
      const k = py * W + px;
      seen[k] = 1;
      d[k * 4] = r1;
      d[k * 4 + 1] = g1;
      d[k * 4 + 2] = b1;
      d[k * 4 + 3] = 255;
      if (py > 0) {
        const u = k - W;
        if (!seen[u] && same(u * 4)) {
          if (!up) {
            stack.push(px, py - 1);
            up = true;
          }
        } else up = false;
      }
      if (py < H - 1) {
        const dd = k + W;
        if (!seen[dd] && same(dd * 4)) {
          if (!dn) {
            stack.push(px, py + 1);
            dn = true;
          }
        } else dn = false;
      }
      px++;
    }
  }
  c.putImageData(img, 0, 0);
}

/* ───────────────────────── saving ───────────────────────── */

function SaveSheet({ img, onCancel, onSave }: { img: string; onCancel: () => void; onSave: (title: string, dedicate: boolean, note: string) => Promise<void> }) {
  const [title, setTitle] = useState('');
  const [dedicate, setDedicate] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <motion.div className="absolute inset-0 z-20 flex items-end bg-ink/35 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onCancel}>
      <motion.div
        className="w-full rounded-t-[28px] bg-bg px-5 pt-5 pb-[max(20px,env(safe-area-inset-bottom))]"
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        exit={{ y: 300 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-4">
          <img src={img} alt="" className="w-[92px] rotate-[-3deg] rounded-[4px] bg-white p-1.5 pb-4 shadow-paper" />
          <div className="min-w-0 flex-1">
            <label className="mb-1 block text-[13px] font-bold text-muted" htmlFor="art-title">
              איך נקרא הציור?
            </label>
            <input
              id="art-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={60}
              placeholder="למשל: אנחנו בים"
              className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-[16px] outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={() => {
                tap(8);
                setDedicate((d) => !d);
              }}
              aria-pressed={dedicate}
              className={`mt-2.5 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-right text-[15px] font-bold transition-colors ${dedicate ? 'bg-accent text-white' : 'bg-soft text-ink'}`}
            >
              <Heart size={18} fill={dedicate ? '#fff' : 'none'} />
              להקדיש ל{A}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {dedicate && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={200}
                rows={2}
                placeholder={`כמה מילים ל${A} (לא חובה)`}
                className="mt-3 w-full resize-none rounded-xl border border-line bg-paper px-3 py-2.5 font-hand text-[16px] outline-none focus:border-accent"
              />
              <p className="mt-1 text-[12.5px] text-muted">{A} {a('יראה', 'תראה')} את הציור פעם אחת, בפעם הבאה ש{a('ייכנס', 'תיכנס')} לאתר.</p>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onCancel} className="h-12 flex-1 rounded-full bg-paper font-bold shadow-soft">
            עוד לא
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await onSave(title.trim(), dedicate, note.trim());
            }}
            className="h-12 flex-[2] rounded-full bg-accent font-bold text-white disabled:opacity-60"
          >
            {busy ? p('שומר…', 'שומרת…') : dedicate ? 'לשמור ולהקדיש 💌' : 'לשמור'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ───────────────────────── the gallery ───────────────────────── */

const fmt = (t: number) => new Date(t).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: '2-digit' });

function Gallery({ art, onOpen, onDraw }: { art: Art[] | null; onOpen: (a: Art) => void; onDraw: () => void }) {
  if (!art) return <p className="pt-16 text-center font-hand text-[16px] text-muted">פותחים את הגלריה…</p>;
  if (!art.length)
    return (
      <div className="flex flex-col items-center px-8 pt-14 text-center">
        <div className="relative mb-4 h-[130px] w-[110px] rotate-[-4deg] rounded-[4px] bg-white p-2 pb-6 shadow-paper">
          <div className="size-full rounded-[2px] border-2 border-dashed border-line" />
        </div>
        <h3 className="font-serif text-[22px]">הקיר עוד ריק</h3>
        <p className="mt-1 text-[15px] text-muted">הציור הראשון שלך יקבל פה מקום של כבוד.</p>
        <button type="button" onClick={onDraw} className="mt-4 h-11 rounded-full bg-accent px-6 font-bold text-white">
          לצייר משהו
        </button>
      </div>
    );
  return (
    <div className="h-full overflow-y-auto px-4 pt-2 pb-8">
      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        {art.map((a, i) => (
          <motion.button
            key={a.id}
            type="button"
            onClick={() => {
              tick();
              onOpen(a);
            }}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(0.4, i * 0.04) }}
            className="relative rounded-[3px] bg-white p-2 pb-3 text-right shadow-[0_12px_20px_-12px_rgb(90_50_20/0.55)]"
            style={{ rotate: `${[-3, 2, -1.5, 3, -2.5, 1][i % 6]}deg`, marginTop: i % 2 ? 14 : 0 }}
          >
            <span className="absolute -top-2 left-1/2 h-4 w-12 -translate-x-1/2 rotate-[-4deg] bg-[#F7D9A8]/80" />
            <img src={a.src} alt={a.title} loading="lazy" className="aspect-[3/4] w-full rounded-[2px] object-cover" />
            <div className="mt-1.5 truncate font-hand text-[14px] font-bold">{a.title}</div>
            <div className="text-[11px] text-muted">{fmt(a.at)}</div>
            {a.dedicated && (
              <span className="absolute -top-3 -left-3 flex size-9 -rotate-12 items-center justify-center rounded-full bg-accent text-white shadow-soft" title={`הוקדש ל${A}`}>
                <Heart size={16} fill="#fff" />
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function Viewer({ art, onClose, onDedicate, onDelete }: { art: Art; onClose: () => void; onDedicate: (note: string) => void; onDelete: () => void }) {
  const [note, setNote] = useState('');
  const [asking, setAsking] = useState(false);
  const [sure, setSure] = useState(false);
  return (
    <motion.div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-ink/70 px-6 backdrop-blur-[3px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div initial={{ scale: 0.85, rotate: -4 }} animate={{ scale: 1, rotate: -1 }} className="w-full max-w-[320px] rounded-[4px] bg-white p-3 pb-4 shadow-paper" onClick={(e) => e.stopPropagation()}>
        <img src={art.src} alt={art.title} className="aspect-[3/4] w-full rounded-[2px] object-cover" />
        <div className="mt-2 font-hand text-[18px] font-bold">{art.title}</div>
        <div className="text-[12px] text-muted">
          {fmt(art.at)}
          {art.dedicated ? ` · הוקדש ל${A} ❤️` : ''}
        </div>
        {art.note && <p className="mt-1 font-hand text-[14px] text-ink/80">״{art.note}״</p>}
        {asking && (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={200}
            placeholder={`כמה מילים ל${A} (לא חובה)`}
            className="mt-2 w-full resize-none rounded-xl border border-line px-3 py-2 font-hand text-[15px] outline-none focus:border-accent"
          />
        )}
        <div className="mt-3 flex gap-2">
          {!art.dedicated && (
            <button
              type="button"
              onClick={() => (asking ? onDedicate(note.trim()) : setAsking(true))}
              className="h-10 flex-[2] rounded-full bg-accent text-[14px] font-bold text-white"
            >
              {asking ? `לשלוח ל${A} 💌` : `להקדיש ל${A}`}
            </button>
          )}
          <button
            type="button"
            onClick={() => (sure ? onDelete() : setSure(true))}
            className={`h-10 flex-1 rounded-full text-[14px] font-bold ${sure ? 'bg-[#E25A6A] text-white' : 'bg-paper text-ink shadow-soft'}`}
          >
            {sure ? 'בטוח למחוק?' : 'מחיקה'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
