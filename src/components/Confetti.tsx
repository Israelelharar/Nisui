import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useReducedMotion } from 'motion/react';

const COLORS = ['#c2385a', '#d9a955', '#f29bb0', '#fbefc9', '#a32c4a', '#ffffff'];
const SHAPES = ['rounded-[2px]', 'rounded-full', 'heart'] as const;

/**
 * A short burst of confetti for big days (birthday, anniversaries, every 100
 * days, the day they meet). Once per day per device, so it stays special.
 */
export function Confetti({ id }: { id: string }) {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const key = `idw:confetti:${id}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
    } catch {
      /* private mode: show it anyway */
    }
    setShow(true);
    const t = window.setTimeout(() => setShow(false), 6500);
    return () => window.clearTimeout(t);
  }, [id]);

  const pieces = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 1.6,
        duration: 3.2 + Math.random() * 2.4,
        size: 7 + Math.random() * 8,
        drift: (Math.random() - 0.5) * 140,
        spin: (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 540),
        color: COLORS[i % COLORS.length],
        shape: SHAPES[i % SHAPES.length],
      })),
    [],
  );

  if (!show || reduce) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`confetti-piece absolute top-[-24px] block ${p.shape === 'heart' ? '' : p.shape}`}
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.shape === 'rounded-[2px]' ? p.size * 0.5 : p.size,
              background: p.shape === 'heart' ? 'none' : p.color,
              color: p.color,
              fontSize: p.size * 1.4,
              lineHeight: 1,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              '--drift': `${p.drift}px`,
              '--spin': `${p.spin}deg`,
            } as CSSProperties
          }
        >
          {p.shape === 'heart' ? '♥' : null}
        </span>
      ))}
    </div>
  );
}
