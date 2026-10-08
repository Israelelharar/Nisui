import { useEffect, useRef, type RefObject } from 'react';

type Drop = { x: number; y: number; vx: number; vy: number; r: number; splash: boolean; life: number };

/**
 * Real water from the shower head in her hand: drops fall from its nozzles,
 * stretch as they speed up, and burst into little splashes where they land
 * (on his head, or on the floor). Drawn on a canvas so hundreds of drops stay smooth.
 */
export function ShowerRain({ at, pouring, pig }: { at: { x: number; y: number }; pouring: boolean; pig: RefObject<HTMLElement | null> }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const state = useRef({ at, pouring });
  state.current = { at, pouring };

  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext('2d')!;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const size = () => {
      cv.width = window.innerWidth * dpr;
      cv.height = window.innerHeight * dpr;
    };
    size();
    window.addEventListener('resize', size);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const drops: Drop[] = [];
    let last = performance.now();
    let carry = 0;
    let raf = 0;

    // Where a falling drop lands: the round top of his head, or else the floor under him.
    const ground = (x: number) => {
      const r = pig.current?.querySelector('svg.pig')?.getBoundingClientRect();
      if (!r) return window.innerHeight;
      const cx = r.left + r.width / 2;
      const half = r.width * 0.36;
      const d = (x - cx) / half;
      if (Math.abs(d) < 1) return r.top + r.height * 0.14 + d * d * r.height * 0.16;
      return r.bottom - 6;
    };

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const { at: head, pouring: on } = state.current;
      // A steady rain while it's over him, a slow drip while she carries it.
      carry += dt * (reduce ? 25 : on ? 170 : 14);
      while (carry >= 1) {
        carry -= 1;
        const nozzle = (Math.random() - 0.5) * 40;
        drops.push({
          x: head.x + nozzle,
          y: head.y + 16,
          vx: nozzle * 1.6 + (Math.random() - 0.5) * 30,
          vy: 260 + Math.random() * 160,
          r: 2.2 + Math.random() * 2,
          splash: false,
          life: 1,
        });
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.vy += (d.splash ? 1400 : 1900) * dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        if (d.splash) {
          d.life -= dt * 2.6;
          if (d.life <= 0) {
            drops.splice(i, 1);
            continue;
          }
          ctx.globalAlpha = d.life * 0.9;
          ctx.fillStyle = '#F2FBFF';
          ctx.strokeStyle = 'rgba(60, 130, 185, 0.5)';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          continue;
        }
        if (d.y >= ground(d.x)) {
          // splash: a few droplets jump out sideways and fall back
          const n = 2 + Math.floor(Math.random() * 3);
          for (let k = 0; k < n; k++)
            drops.push({ x: d.x, y: d.y - 2, vx: (Math.random() - 0.5) * 260, vy: -120 - Math.random() * 160, r: 1.2 + Math.random() * 1.6, splash: true, life: 1 });
          drops.splice(i, 1);
          continue;
        }
        if (d.y > window.innerHeight + 20) {
          drops.splice(i, 1);
          continue;
        }
        // a falling drop: stretched along its speed, bright on one side like light through water
        const len = Math.min(22, 4 + d.vy * 0.022);
        const ang = Math.atan2(d.vy, d.vx);
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(ang - Math.PI / 2);
        const g = ctx.createLinearGradient(-d.r, 0, d.r, 0);
        g.addColorStop(0, 'rgba(160, 215, 245, 0.55)');
        g.addColorStop(0.5, 'rgba(255, 255, 255, 0.95)');
        g.addColorStop(1, 'rgba(120, 190, 235, 0.6)');
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(0, -len);
        ctx.quadraticCurveTo(d.r * 1.1, -d.r * 0.4, d.r, d.r * 0.3);
        ctx.arc(0, d.r * 0.3, d.r, 0, Math.PI);
        ctx.quadraticCurveTo(-d.r * 1.1, -d.r * 0.4, 0, -len);
        ctx.fill();
        ctx.strokeStyle = 'rgba(60, 130, 185, 0.55)';
        ctx.lineWidth = 0.9;
        ctx.stroke();
        ctx.restore();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', size);
    };
  }, [pig]);

  return <canvas ref={canvas} className="pointer-events-none fixed inset-0 z-[59] size-full" aria-hidden />;
}
