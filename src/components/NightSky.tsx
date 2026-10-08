import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

/**
 * The night page's sky: stars that breathe at their own pace, a faint band of
 * haze, and now and then a shooting star. Tap one before it fades and she gets
 * to make a wish (the page listens for the "night:wish" event).
 */
export function NightSky() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const g = canvas.getContext('2d');
    if (!g) return;
    let w = 0;
    let h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    // Stars live in 0..1 space so a resize doesn't reshuffle the sky. More near the top.
    const stars = Array.from({ length: 150 }, () => ({
      x: Math.random(),
      y: Math.random() ** 1.6,
      r: Math.random() < 0.08 ? 1.5 + Math.random() : 0.4 + Math.random() * 0.9,
      speed: 0.4 + Math.random() * 1.4,
      off: Math.random() * Math.PI * 2,
      warm: Math.random() < 0.25,
    }));

    type Shot = { x: number; y: number; vx: number; vy: number; born: number; life: number };
    let shot: Shot | null = null;
    let next = performance.now() + 6000 + Math.random() * 8000;
    let raf = 0;

    const draw = (now: number) => {
      g.clearRect(0, 0, w, h);
      // a faint milky band across the sky
      const band = g.createRadialGradient(w * 0.62, h * 0.16, 0, w * 0.62, h * 0.16, Math.max(w, h) * 0.55);
      band.addColorStop(0, 'rgba(170,150,210,0.09)');
      band.addColorStop(1, 'rgba(170,150,210,0)');
      g.fillStyle = band;
      g.fillRect(0, 0, w, h);

      for (const s of stars) {
        const tw = reduce ? 0.8 : 0.55 + 0.45 * Math.sin(now / 1000 * s.speed + s.off);
        g.globalAlpha = tw * (1 - s.y * 0.55);
        g.fillStyle = s.warm ? '#FFE3B0' : '#F4F0FF';
        g.beginPath();
        g.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        g.fill();
        if (s.r > 1.4) {
          g.globalAlpha *= 0.25;
          g.fillRect(s.x * w - s.r * 3, s.y * h - 0.3, s.r * 6, 0.6);
          g.fillRect(s.x * w - 0.3, s.y * h - s.r * 3, 0.6, s.r * 6);
        }
      }
      g.globalAlpha = 1;

      if (!reduce) {
        if (!shot && now > next) {
          const fromRight = Math.random() < 0.5;
          shot = {
            x: fromRight ? w * (0.55 + Math.random() * 0.4) : w * (0.05 + Math.random() * 0.4),
            y: h * (0.04 + Math.random() * 0.3),
            vx: (fromRight ? -1 : 1) * (0.28 + Math.random() * 0.12),
            vy: 0.12 + Math.random() * 0.06,
            born: now,
            life: 1900,
          };
        }
        if (shot) {
          const t = now - shot.born;
          if (t > shot.life) {
            shot = null;
            next = now + 14000 + Math.random() * 16000;
          } else {
            const k = t / shot.life;
            const hx = shot.x + shot.vx * t;
            const hy = shot.y + shot.vy * t;
            const tail = 150;
            const a = Math.sin(Math.PI * k);
            const grad = g.createLinearGradient(hx, hy, hx - shot.vx * tail, hy - shot.vy * tail);
            grad.addColorStop(0, `rgba(255,244,220,${0.95 * a})`);
            grad.addColorStop(1, 'rgba(255,244,220,0)');
            g.strokeStyle = grad;
            g.lineWidth = 2.4;
            g.lineCap = 'round';
            g.beginPath();
            g.moveTo(hx, hy);
            g.lineTo(hx - shot.vx * tail, hy - shot.vy * tail);
            g.stroke();
            g.fillStyle = `rgba(255,250,235,${a})`;
            g.beginPath();
            g.arc(hx, hy, 2.8, 0, Math.PI * 2);
            g.fill();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    // The sky sits under the page, so catch taps on the window: a tap near the
    // shooting star's head (and not on a button) catches it.
    const catchIt = (e: PointerEvent) => {
      if (!shot) return;
      if ((e.target as HTMLElement).closest('button, a, input, textarea, [role="dialog"]')) return;
      const t = performance.now() - shot.born;
      const hx = shot.x + shot.vx * t;
      const hy = shot.y + shot.vy * t;
      const mid = { x: hx - shot.vx * 40, y: hy - shot.vy * 40 };
      if (Math.hypot(e.clientX - hx, e.clientY - hy) < 60 || Math.hypot(e.clientX - mid.x, e.clientY - mid.y) < 50) {
        shot = null;
        next = performance.now() + 20000;
        window.dispatchEvent(new CustomEvent('night:wish', { detail: { x: e.clientX, y: e.clientY } }));
      }
    };
    window.addEventListener('pointerdown', catchIt);
    // A test hook: dispatch "night:shoot" to send one across right now.
    const shootNow = () => (next = 0);
    window.addEventListener('night:shoot', shootNow);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointerdown', catchIt);
      window.removeEventListener('night:shoot', shootNow);
    };
  }, [reduce]);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 h-full w-full" />;
}
