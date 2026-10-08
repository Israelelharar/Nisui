import { forwardRef, useId } from 'react';
import { Face } from './Face';

export type SheepKind = 'white' | 'black' | 'admin' | 'partner';

const WOOL = [
  [50, 38, 17],
  [36, 40, 14],
  [64, 40, 14],
  [43, 28, 13],
  [58, 28, 13],
  [74, 33, 11],
  [30, 32, 11],
  [52, 50, 13],
  [38, 51, 11],
  [66, 50, 11],
  [80, 42, 9],
] as const;

/**
 * A sheep, facing left, drawn as a fluffy cloud of wool on four little legs.
 * Some have one of the couple's faces (night/Face.tsx). The parent moves it around with a
 * transform; `data-state` on the root picks the animation:
 * walk (legs trot), air (legs tucked), idle (stand, breathe), shake (head shake).
 */
export const Sheep = forwardRef<HTMLDivElement, { kind: SheepKind; cap?: boolean; size?: number; className?: string; style?: React.CSSProperties }>(
  function Sheep({ kind, cap, size = 96, className = '', style }, ref) {
    const id = useId().replace(/:/g, '');
    const dark = kind === 'black';
    const wool = dark ? '#4B4248' : '#F6F1E8';
    const woolShade = dark ? '#3A3237' : '#E4DCCF';
    const line = '#2E2226';
    const face = kind === 'admin' || kind === 'partner' ? kind : null;
    return (
      <div ref={ref} data-state="walk" className={`sheep pointer-events-none absolute top-0 left-0 will-change-transform ${className}`} style={{ width: size, height: size * 0.82, ...style }}>
        <svg viewBox="0 0 100 82" className="h-full w-full overflow-visible" aria-hidden>
          {/* legs */}
          <g className="sheep-legs" stroke={line} strokeWidth="5" strokeLinecap="round">
            <line className="leg leg-a" x1="34" y1="54" x2="33" y2="74" />
            <line className="leg leg-b" x1="44" y1="56" x2="44" y2="75" />
            <line className="leg leg-b" x1="62" y1="56" x2="62" y2="75" />
            <line className="leg leg-a" x1="72" y1="54" x2="73" y2="74" />
          </g>
          <g className="sheep-body">
            {/* tail */}
            <circle className="sheep-tail" cx="88" cy="36" r="6" fill={wool} stroke={line} strokeWidth="2.4" />
            {/* wool: outline pass, then fill pass, so the cloud reads as one shape */}
            {WOOL.map(([x, y, r], i) => (
              <circle key={`o${i}`} cx={x} cy={y} r={r + 1.2} fill={line} />
            ))}
            {WOOL.map(([x, y, r], i) => (
              <circle key={`f${i}`} cx={x} cy={y} r={r} fill={wool} />
            ))}
            {/* a little shading and curl texture */}
            <path d="M34 56q16 6 36 0" stroke={woolShade} strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M46 30q3-3 6 0M58 40q3-3 6 0M38 42q3-3 6 0" stroke={woolShade} strokeWidth="1.8" fill="none" strokeLinecap="round" />
          </g>
          {/* head */}
          <g className="sheep-head">
            <ellipse cx="13" cy="30" rx="6" ry="3.6" transform="rotate(-25 13 30)" fill={face ? '#E9B9A0' : dark ? '#1E1719' : '#3B2A2E'} stroke={line} strokeWidth="1.6" className="sheep-ear" />
            <ellipse cx="33" cy="28" rx="6" ry="3.6" transform="rotate(25 33 28)" fill={face ? '#E9B9A0' : dark ? '#1E1719' : '#3B2A2E'} stroke={line} strokeWidth="1.6" className="sheep-ear sheep-ear-b" />
            {face ? (
              <>
                <defs>
                  <clipPath id={`f${id}`}>
                    <ellipse cx="22" cy="40" rx="15" ry="17.5" />
                  </clipPath>
                </defs>
                <ellipse cx="22" cy="40" rx="16.2" ry="18.7" fill={line} />
                <Face who={face} cx={22} cy={40} r={15.3} clip={`f${id}`} />
              </>
            ) : (
              <>
                <ellipse cx="23" cy="40" rx="11" ry="14" fill={dark ? '#1E1719' : '#3B2A2E'} stroke={line} strokeWidth="1.6" />
                <g className="sheep-eyes" fill="#F6E9DA">
                  <circle cx="18.5" cy="37" r="1.9" />
                  <circle cx="27" cy="37" r="1.9" />
                </g>
                <ellipse cx="22.5" cy="47" rx="3.2" ry="1.6" fill="#E59AA8" opacity=".55" />
              </>
            )}
            {/* tuft of wool on top of the head */}
            <circle cx="18" cy="25" r="5" fill={line} />
            <circle cx="25" cy="23" r="5.5" fill={line} />
            <circle cx="30" cy="27" r="4" fill={line} />
            <circle cx="18" cy="25" r="4" fill={wool} />
            <circle cx="25" cy="23" r="4.5" fill={wool} />
            <circle cx="30" cy="27" r="3" fill={wool} />
            {cap && (
              <g className="sheep-cap">
                <path d="M12 24q11-10 23 0l-2-4q-4-14-16-14-6 6 3 3-12 2-8 15z" fill="#5B7FC8" stroke={line} strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M15 12l12 3M14 17l15 3" stroke="#F6E9DA" strokeWidth="2.2" opacity=".85" />
                <path d="M11 24q12-5 25 0" stroke={line} strokeWidth="5" strokeLinecap="round" fill="none" />
                <path d="M11 24q12-5 25 0" stroke="#F6E9DA" strokeWidth="3" strokeLinecap="round" fill="none" />
                <circle cx="9" cy="6" r="4" fill="#F6E9DA" stroke={line} strokeWidth="1.4" />
              </g>
            )}
          </g>
        </svg>
      </div>
    );
  },
);

/** Its shadow on the grass. Shrinks and fades as the sheep goes up. */
export const SheepShadow = forwardRef<HTMLDivElement, { size?: number }>(function SheepShadow({ size = 96 }, ref) {
  return <div ref={ref} aria-hidden className="pointer-events-none absolute top-0 left-0 rounded-[50%] bg-black/35 blur-[2px] will-change-transform" style={{ width: size * 0.7, height: size * 0.12 }} />;
});
