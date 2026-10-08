import { forwardRef } from 'react';
import { Face } from './Face';
import { partner } from '../client';

/**
 * The partner as a farmer: straw hat with a rose ribbon, their face (a
 * ponytail for her), blue overalls over a cream shirt, little boots. Faces right; the parent flips
 * it. data-state: idle, run, cheer.
 */
export const Farmer = forwardRef<HTMLDivElement, { size?: number }>(function Farmer({ size = 58 }, ref) {
  const line = '#2E2226';
  return (
    <div ref={ref} data-state="idle" className="farmer pointer-events-none absolute top-0 left-0 will-change-transform" style={{ width: size, height: size * 1.62 }}>
      <svg viewBox="0 0 60 98" className="h-full w-full overflow-visible" aria-hidden>
        <g className="farmer-body">
          {/* back arm */}
          <g className="farmer-arm farmer-arm-b">
            <path d="M24 44l-5 14" stroke={line} strokeWidth="7.5" strokeLinecap="round" />
            <path d="M24 44l-5 14" stroke="#E9D2B0" strokeWidth="5" strokeLinecap="round" />
            <circle cx="19" cy="59" r="3.2" fill="#F0C7A8" stroke={line} strokeWidth="1.4" />
          </g>
          {/* legs */}
          <g className="farmer-leg farmer-leg-a">
            <path d="M25 68v16" stroke={line} strokeWidth="8.5" strokeLinecap="round" />
            <path d="M25 68v16" stroke="#4A67A8" strokeWidth="6" strokeLinecap="round" />
            <path d="M21 86h9a3 3 0 0 1 3 3H21z" fill="#6B4430" stroke={line} strokeWidth="1.5" strokeLinejoin="round" />
          </g>
          <g className="farmer-leg farmer-leg-b">
            <path d="M35 68v16" stroke={line} strokeWidth="8.5" strokeLinecap="round" />
            <path d="M35 68v16" stroke="#5B7FC8" strokeWidth="6" strokeLinecap="round" />
            <path d="M31 86h9a3 3 0 0 1 3 3H31z" fill="#7A5038" stroke={line} strokeWidth="1.5" strokeLinejoin="round" />
          </g>
          {/* torso: shirt, then overalls with a bib and straps */}
          <path d="M18 44q12-6 24 0l2 26H16z" fill="#E9D2B0" stroke={line} strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M19 54h22l2 18H17z" fill="#5B7FC8" stroke={line} strokeWidth="1.8" strokeLinejoin="round" />
          <rect x="23" y="49" width="14" height="10" rx="2" fill="#5B7FC8" stroke={line} strokeWidth="1.6" />
          <path d="M23 50l-3-6M37 50l3-6" stroke="#4A67A8" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="24.5" cy="52" r="1.1" fill="#F2C27A" />
          <circle cx="35.5" cy="52" r="1.1" fill="#F2C27A" />
          <path d="M27 55h6" stroke="#3E5A99" strokeWidth="1.4" strokeLinecap="round" />
          {/* ponytail swinging behind */}
          {partner.gender === 'f' && <path className="farmer-tail" d="M16 26q-9 4-7 16 4-3 6-9 1 6 4 8-1-8 2-13z" fill="#4A2E22" stroke={line} strokeWidth="1.4" strokeLinejoin="round" />}
          {/* head */}
          <circle cx="30" cy="27" r="13.6" fill={line} />
          <clipPath id="farmer-face">
            <circle cx="30" cy="27" r="12.4" />
          </clipPath>
          <Face who="partner" cx={30} cy={27} r={12.4} clip="farmer-face" />
          {/* straw hat */}
          <g className="farmer-hat">
            <ellipse cx="30" cy="17" rx="21" ry="5.2" fill="#E8C27A" stroke={line} strokeWidth="1.8" />
            <path d="M19 16q1-12 11-12t11 12z" fill="#F0CF8E" stroke={line} strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M19.5 13.5q10.5 3 21 0l.5 2.5q-11 3-22 0z" fill="#C2385A" />
            <path d="M14 18q16 3 32 0M22 8q8-2 16 0" stroke="#C9A160" strokeWidth="1" fill="none" opacity=".8" />
          </g>
          {/* front arm */}
          <g className="farmer-arm farmer-arm-a">
            <path d="M37 44l6 14" stroke={line} strokeWidth="7.5" strokeLinecap="round" />
            <path d="M37 44l6 14" stroke="#F1DEC0" strokeWidth="5" strokeLinecap="round" />
            <circle cx="43" cy="59" r="3.2" fill="#F0C7A8" stroke={line} strokeWidth="1.4" />
          </g>
        </g>
      </svg>
    </div>
  );
});
