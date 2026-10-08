import type { CSSProperties, ReactNode } from 'react';
import { RoomScene } from './scene';
import { species } from './species';

/**
 * His house: five painted rooms, drawn tall for a phone held upright. The
 * floor line sits at y≈470 of a 400×720 scene that is anchored to the bottom
 * of the screen, so he always stands on the floor whatever the phone's height.
 *
 *  - home:    the living room (or the room theme she bought for it)
 *  - kitchen: where he eats; food is dragged to his mouth
 *  - bath:    where he gets scrubbed and rinsed
 *  - play:    the playroom, with his games
 *  - bed:     the bedroom; the lamp is his bedtime
 */
export type RoomId = 'home' | 'kitchen' | 'bath' | 'play' | 'bed';
export const ROOMS: RoomId[] = ['home', 'kitchen', 'bath', 'play', 'bed'];

const Scene = ({ children }: { children: ReactNode }) => (
  <svg data-scene viewBox="0 0 400 720" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 size-full" aria-hidden>
    {children}
  </svg>
);

/** Perspective floor boards / tile lines converging on a point above the floor. */
function FloorLines({ color, opacity = 0.45, rows = true }: { color: string; opacity?: number; rows?: boolean }) {
  const xs = [-280, -180, -90, 0, 80, 160, 240, 320, 400, 480, 570, 680];
  return (
    <g stroke={color} strokeWidth="1.6" opacity={opacity}>
      {xs.map((x) => (
        <line key={x} x1={200 + (x - 200) * 0.42} y1="470" x2={x} y2="720" />
      ))}
      {rows && [492, 522, 562, 614, 680].map((y) => <line key={y} x1="0" y1={y} x2="400" y2={y} />)}
    </g>
  );
}

const Vignette = ({ id, strength = 0.45 }: { id: string; strength?: number }) => (
  <>
    <defs>
      <radialGradient id={id} cx="0.5" cy="0.45" r="0.8">
        <stop offset="0.55" stopColor="#1E0F07" stopOpacity="0" />
        <stop offset="1" stopColor="#1E0F07" stopOpacity={strength} />
      </radialGradient>
    </defs>
    <rect width="400" height="720" fill={`url(#${id})`} />
  </>
);

/* ───────────── living room ───────────── */

const BOOKS = ['#B5523B', '#3F6F8F', '#D9A955', '#6C8A4A', '#8A4A6A', '#E0C9A0', '#C9773F', '#4E5F86'];
function Books({ y, seed, x0 = 20, x1 = 106 }: { y: number; seed: number; x0?: number; x1?: number }) {
  let x = x0;
  const out = [];
  for (let i = 0; x < x1; i++) {
    const w = 7 + ((seed * 7 + i * 5) % 6);
    const h = 30 + ((seed * 11 + i * 13) % 16);
    const tilt = (seed + i) % 5 === 0 ? -9 : 0;
    out.push(
      <g key={i} transform={`rotate(${tilt} ${x + w / 2} ${y})`}>
        <rect x={x} y={y - h} width={w} height={h} rx="1.2" fill={BOOKS[(seed + i * 3) % BOOKS.length]} />
        <rect x={x + 1.5} y={y - h + 5} width={w - 3} height="2" fill="#fff" opacity="0.35" />
        <rect x={x} y={y - h} width="1.6" height={h} fill="#000" opacity="0.15" />
      </g>,
    );
    x += w + (tilt ? 4 : 1);
  }
  return <g>{out}</g>;
}

function HomeRoom({ together }: { together: boolean }) {
  return (
    <Scene>
      <defs>
        <linearGradient id="hm-wall" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0" stopColor={together ? '#EBC6B8' : '#E6C7A0'} />
          <stop offset="1" stopColor={together ? '#C99282' : '#BE9064'} />
        </linearGradient>
        <radialGradient id="hm-sun" cx="0.82" cy="0.22" r="0.7">
          <stop offset="0" stopColor="#FFF4D2" stopOpacity="0.9" />
          <stop offset="0.5" stopColor="#FFE2A8" stopOpacity="0.25" />
          <stop offset="1" stopColor="#FFE2A8" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hm-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#A86B3E" />
          <stop offset="1" stopColor="#5E351D" />
        </linearGradient>
        <linearGradient id="hm-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#CFE9F7" />
          <stop offset="1" stopColor="#FFF1D2" />
        </linearGradient>
        <linearGradient id="hm-ray" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF6DA" stopOpacity="0.5" />
          <stop offset="1" stopColor="#FFF6DA" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="hm-leaf" cx="0.3" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#7DBA5E" />
          <stop offset="1" stopColor="#2F6B2E" />
        </radialGradient>
        <radialGradient id="hm-bear" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#C68A52" />
          <stop offset="1" stopColor="#7E4F27" />
        </radialGradient>
      </defs>
      <rect width="400" height="470" fill="url(#hm-wall)" />
      {/* wood panelling under a chair rail */}
      <rect y="352" width="400" height="118" fill="#9A6A44" opacity="0.35" />
      {[30, 110, 190, 270, 350].map((x) => (
        <rect key={x} x={x} y="366" width="64" height="92" rx="3" fill="none" stroke="#7A4A2C" strokeOpacity="0.35" strokeWidth="2" />
      ))}
      <rect y="346" width="400" height="8" fill="#8A5432" opacity="0.7" />
      <rect width="400" height="470" fill="url(#hm-sun)" />

      {/* window */}
      <rect x="250" y="44" width="150" height="7" rx="3.5" fill="#7A4A2C" />
      <rect x="268" y="70" width="118" height="236" rx="4" fill="#F3E5CF" />
      <rect x="277" y="79" width="100" height="218" fill="url(#hm-sky)" />
      <path d="M277 250 Q300 222 322 236 Q346 212 377 232 V297 H277Z" fill="#9CC98A" opacity="0.85" />
      <path d="M327 79 V297 M277 186 H377" stroke="#F3E5CF" strokeWidth="6" />
      <rect x="262" y="302" width="130" height="10" rx="3" fill="#E9D6B6" />
      <path d="M262 52 Q278 170 266 318 L248 318 Q258 170 246 52Z" fill="#F0DFC4" />
      <path d="M254 60 Q264 170 258 312" stroke="#D8C2A0" strokeWidth="2" fill="none" />

      {/* painting, hung a touch crooked */}
      <g transform="rotate(-2 186 160)">
        <rect x="138" y="118" width="96" height="78" rx="3" fill="#8A5A2E" />
        <rect x="145" y="125" width="82" height="64" fill="#BFE0F0" />
        <circle cx="204" cy="142" r="8" fill="#FFD66B" />
        <path d="M145 172 Q168 150 190 166 Q206 154 227 164 V189 H145Z" fill="#7DAA55" />
        <path d="M145 180 Q176 168 227 182 V189 H145Z" fill="#5E8E3E" />
      </g>
      <path d="M186 104 L160 120 M186 104 L212 120" stroke="#5A3018" strokeWidth="1.2" />

      {/* bookshelf */}
      <rect x="6" y="140" width="112" height="330" rx="4" fill="#7E4A2A" />
      <rect x="14" y="148" width="96" height="316" fill="#4A2A16" />
      {[218, 290, 362, 434].map((y) => (
        <rect key={y} x="10" y={y} width="104" height="7" rx="2" fill="#9A6038" />
      ))}
      <Books y={218} seed={1} />
      <Books y={290} seed={4} x0={58} />
      <g>
        <rect x="20" y="252" width="32" height="36" fill="#FFFBF3" transform="rotate(-4 36 270)" />
        <rect x="24" y="256" width="24" height="22" fill="#F2B880" transform="rotate(-4 36 270)" />
      </g>
      <Books y={362} seed={7} />
      <ellipse cx="62" cy="434" rx="14" ry="4" fill="#B5523B" />
      <path d="M52 432 q10 -34 20 0" fill="#7DBA5E" />
      <Books y={434} seed={3} x0={80} />
      <path d="M38 140 q10 -18 22 0z" fill="#5E9A48" />
      <rect x="42" y="132" width="14" height="10" rx="2" fill="#C26B3E" />

      {together && (
        <g>
          <path d="M0 40 Q100 76 200 52 T400 44" stroke="#C98A6A" strokeWidth="1.6" fill="none" />
          {[30, 80, 130, 180, 230, 280, 330, 375].map((x, i) => (
            <path
              key={x}
              transform={`translate(${x} ${50 + Math.sin(i) * 8}) scale(0.9)`}
              d="M0 6 C-8 -2 -14 6 0 16 C14 6 8 -2 0 6Z"
              fill={i % 2 ? '#F28BA8' : '#E5577A'}
            />
          ))}
        </g>
      )}

      {/* floor */}
      <rect y="466" width="400" height="254" fill="url(#hm-floor)" />
      <FloorLines color="#4A2814" />
      <rect y="462" width="400" height="8" fill="#6A3E22" />
      <polygon className="cz-ray" points="277,80 377,80 300,720 40,720" fill="url(#hm-ray)" />
      {/* rug */}
      <ellipse cx="200" cy="600" rx="178" ry="52" fill="#B5523B" opacity="0.92" />
      <ellipse cx="200" cy="600" rx="150" ry="40" fill="none" stroke="#F0C78A" strokeWidth="3" strokeDasharray="2 7" />
      <ellipse cx="200" cy="600" rx="118" ry="30" fill="#C9683F" />

      {/* plant */}
      <g className="decor-sway" style={{ transformOrigin: '360px 470px', '--dur': '7s' } as CSSProperties}>
        {[
          [358, 400, -40, 50],
          [342, 382, -15, 56],
          [372, 378, 15, 58],
          [386, 404, 45, 48],
          [330, 414, -65, 44],
          [360, 362, 0, 52],
        ].map(([x, y, r, h], i) => (
          <ellipse key={i} cx={x} cy={y} rx="12" ry={h / 2} transform={`rotate(${r} ${x} ${y + h / 2})`} fill="url(#hm-leaf)" />
        ))}
      </g>
      <path d="M334 430 h52 l-7 50 h-38z" fill="#C2653A" />
      <rect x="330" y="424" width="60" height="11" rx="3" fill="#D67B48" />

      {/* his little house */}
      <ellipse cx="62" cy="530" rx="58" ry="12" fill="#1E0F07" opacity="0.3" />
      <rect x="10" y="510" width="104" height="18" rx="7" fill="#6AA04A" />
      <rect x="20" y="470" width="82" height="46" fill="#F4E6CC" />
      <path d="M10 474 L61 434 L112 474Z" fill="#C4473A" />
      <path d="M10 474 L61 434 L112 474" fill="none" stroke="#9E3328" strokeWidth="3" strokeLinejoin="round" />
      <rect x="51" y="488" width="18" height="28" rx="8" fill="#7A4A2C" />
      <rect x="28" y="482" width="13" height="12" fill="#9CC8E8" stroke="#fff" strokeWidth="1.5" />
      <rect x="80" y="482" width="13" height="12" fill="#9CC8E8" stroke="#fff" strokeWidth="1.5" />

      {/* teddy */}
      <ellipse cx="352" cy="548" rx="36" ry="8" fill="#1E0F07" opacity="0.3" />
      <ellipse cx="352" cy="526" rx="25" ry="23" fill="url(#hm-bear)" />
      <ellipse cx="352" cy="530" rx="12" ry="12" fill="#E2B784" />
      <ellipse cx="330" cy="540" rx="9" ry="7" fill="url(#hm-bear)" />
      <ellipse cx="374" cy="540" rx="9" ry="7" fill="url(#hm-bear)" />
      <circle cx="336" cy="482" r="7" fill="url(#hm-bear)" />
      <circle cx="368" cy="482" r="7" fill="url(#hm-bear)" />
      <circle cx="352" cy="496" r="19" fill="url(#hm-bear)" />
      <ellipse cx="352" cy="502" rx="8" ry="6" fill="#E2B784" />
      <circle cx="345" cy="493" r="2.2" fill="#1a0d06" />
      <circle cx="359" cy="493" r="2.2" fill="#1a0d06" />
      <ellipse cx="352" cy="499" rx="2.6" ry="2" fill="#1a0d06" />
      {together && <path d="M352 518 c-6 -6 -14 2 0 12 c14 -10 6 -18 0 -12z" fill="#E5577A" />}

      <Vignette id="hm-vig" />
    </Scene>
  );
}

/* ───────────── kitchen ───────────── */

function KitchenRoom() {
  return (
    <Scene>
      <defs>
        <linearGradient id="kt-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F4E2BF" />
          <stop offset="1" stopColor="#D9BE90" />
        </linearGradient>
        <pattern id="kt-tile" width="34" height="17" patternUnits="userSpaceOnUse">
          <rect width="34" height="17" fill="#F7F1E6" />
          <path d="M0 16.5 H34 M17 0 V8.5 M0 8.5 H34 M0 8.5 V17 M34 8.5 V17" stroke="#D9CDB8" strokeWidth="1.2" />
        </pattern>
        <linearGradient id="kt-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D58E62" />
          <stop offset="1" stopColor="#9A5536" />
        </linearGradient>
        <linearGradient id="kt-fridge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#BFE3D3" />
          <stop offset="1" stopColor="#8CC2AC" />
        </linearGradient>
        <radialGradient id="kt-light" cx="0.55" cy="0.1" r="0.7">
          <stop offset="0" stopColor="#FFF6D8" stopOpacity="0.8" />
          <stop offset="1" stopColor="#FFF6D8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="470" fill="url(#kt-wall)" />
      {/* backsplash */}
      <rect x="120" y="196" width="280" height="190" fill="url(#kt-tile)" />
      {/* upper cabinets */}
      <rect x="130" y="62" width="270" height="128" rx="4" fill="#94B18F" />
      {[136, 226, 316].map((x) => (
        <g key={x}>
          <rect x={x} y="70" width="82" height="112" rx="3" fill="#A8C3A2" />
          <rect x={x + 8} y="78" width="66" height="96" rx="2" fill="none" stroke="#86A381" strokeWidth="2" />
          <circle cx={x + (x === 226 ? 10 : 72)} cy="164" r="3.2" fill="#E8C98A" />
        </g>
      ))}
      <rect x="126" y="186" width="278" height="8" rx="2" fill="#7E9A79" />
      {/* hanging rail: pans and a wooden spoon */}
      <rect x="160" y="212" width="200" height="4" rx="2" fill="#8E8E8E" />
      <g>
        <path d="M188 216 v18" stroke="#6E6E6E" strokeWidth="2" />
        <circle cx="188" cy="256" r="22" fill="#3D3B3A" />
        <circle cx="188" cy="256" r="16" fill="#555250" />
        <path d="M250 216 v14" stroke="#6E6E6E" strokeWidth="2" />
        <ellipse cx="250" cy="250" rx="13" ry="20" fill="#C9874F" />
        <rect x="248" y="228" width="4" height="10" fill="#C9874F" />
        <path d="M310 216 v16" stroke="#6E6E6E" strokeWidth="2" />
        <circle cx="310" cy="252" r="18" fill="#C4473A" />
        <circle cx="310" cy="252" r="12" fill="#D5604F" />
      </g>
      {/* counter */}
      <rect x="114" y="378" width="290" height="16" rx="3" fill="#C99A62" />
      <rect x="114" y="378" width="290" height="4" rx="2" fill="#E0B57E" />
      <rect x="122" y="394" width="282" height="76" fill="#94B18F" />
      {[128, 222, 316].map((x) => (
        <g key={x}>
          <rect x={x} y="400" width="86" height="64" rx="3" fill="#A8C3A2" />
          <rect x={x + 30} y="408" width="26" height="4" rx="2" fill="#E8C98A" />
        </g>
      ))}
      {/* on the counter: the seed jar (with a handwritten label), fruit, herbs */}
      <rect x="140" y="326" width="40" height="54" rx="8" fill="#E9F3F4" opacity="0.85" stroke="#B9CDD0" strokeWidth="2" />
      <rect x="140" y="346" width="40" height="34" rx="6" fill="#E8B04A" opacity="0.85" />
      <rect x="136" y="320" width="48" height="9" rx="3" fill="#B5523B" />
      <rect x="146" y="350" width="28" height="14" rx="2" fill="#FFFBF3" transform="rotate(-3 160 357)" />
      <text x="160" y="361" fontSize="9" textAnchor="middle" fill="#5A3018" fontFamily="Playpen Sans Hebrew, cursive" transform="rotate(-3 160 357)">
        {species.coinName}
      </text>
      <ellipse cx="300" cy="376" rx="38" ry="8" fill="#C4473A" />
      <path d="M262 368 Q300 400 338 368Z" fill="#E66A4F" />
      <circle cx="286" cy="360" r="11" fill="#E8463A" />
      <circle cx="304" cy="356" r="10" fill="#F2B33D" />
      <circle cx="318" cy="362" r="10" fill="#8BC34A" />
      <path d="M304 346 q2 -6 6 -6" stroke="#5E8E3E" strokeWidth="2" fill="none" />
      {[364, 384].map((x, i) => (
        <g key={x}>
          <path d={`M${x - 9} 362 h18 l-3 16 h-12z`} fill="#D9825B" />
          <path d={`M${x} 362 q-8 -16 -2 -26 M${x} 362 q6 -14 2 -24 M${x} 362 q${i ? 10 : -10} -10 ${i ? 12 : -12} -18`} stroke="#5E9A48" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      ))}

      {/* fridge, with magnets and a polaroid of the two of them */}
      <rect x="0" y="108" width="118" height="362" rx="10" fill="url(#kt-fridge)" />
      <path d="M0 236 H118" stroke="#7FB29C" strokeWidth="3" />
      <rect x="96" y="150" width="7" height="60" rx="3.5" fill="#E9F3EE" />
      <rect x="96" y="260" width="7" height="80" rx="3.5" fill="#E9F3EE" />
      <g transform="rotate(5 46 300)">
        <rect x="26" y="270" width="40" height="46" fill="#FFFBF3" />
        <rect x="30" y="274" width="32" height="30" fill="#F2B880" />
        <circle cx="40" cy="290" r="6" fill="#8A5A3A" />
        <circle cx="53" cy="290" r="6" fill="#E9A15C" />
        <circle cx="46" cy="268" r="4" fill="#E5577A" />
      </g>
      <path d="M30 160 c-5 -5 -12 2 0 10 c12 -8 5 -15 0 -10z" fill="#E5577A" />
      <circle cx="66" cy="180" r="6" fill="#F2B33D" />
      <rect x="40" y="196" width="34" height="10" rx="2" fill="#FFFBF3" transform="rotate(-6 57 201)" />
      <rect y="108" width="118" height="8" rx="4" fill="#D6EFE4" opacity="0.8" />

      {/* clock */}
      <circle cx="200" cy="34" r="20" fill="#FFFBF3" stroke="#B5523B" strokeWidth="4" />
      <path d="M200 34 V22 M200 34 L209 39" stroke="#3B2216" strokeWidth="2.4" strokeLinecap="round" />

      <rect width="400" height="470" fill="url(#kt-light)" />

      {/* floor: warm terracotta tiles */}
      <rect y="466" width="400" height="254" fill="url(#kt-floor)" />
      <FloorLines color="#F4D9BE" opacity={0.35} />
      <rect y="462" width="400" height="8" fill="#7E9A79" />
      {/* his bowl */}
      <ellipse cx="330" cy="556" rx="36" ry="9" fill="#1E0F07" opacity="0.3" />
      <path d="M296 534 Q330 566 364 534Z" fill="#F4E6CC" stroke="#C9974E" strokeWidth="2" />
      <ellipse cx="330" cy="534" rx="34" ry="8" fill="#E9D6B6" stroke="#C9974E" strokeWidth="2" />
      <path d="M330 546 c-3 -3 -7 1 0 6 c7 -5 3 -9 0 -6z" fill="#E5577A" />

      <Vignette id="kt-vig" strength={0.38} />
    </Scene>
  );
}

/* ───────────── bathroom ───────────── */

function BathRoom() {
  return (
    <Scene>
      <defs>
        <pattern id="bt-tile" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#BFE3DF" />
          <rect width="40" height="40" fill="none" stroke="#9CCBC6" strokeWidth="2" />
          <path d="M6 6 h10" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
        </pattern>
        <linearGradient id="bt-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D7E2E6" />
          <stop offset="1" stopColor="#9DB0B8" />
        </linearGradient>
        <linearGradient id="bt-tub" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#D5E0E4" />
        </linearGradient>
        <radialGradient id="bt-mirror" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#F2FBFD" />
          <stop offset="1" stopColor="#A9C8D2" />
        </radialGradient>
        <linearGradient id="bt-water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#CDEBFF" stopOpacity="0.9" />
          <stop offset="1" stopColor="#CDEBFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="400" height="470" fill="url(#bt-tile)" />
      <rect y="300" width="400" height="14" fill="#7FB8B1" />
      <rect y="0" width="400" height="470" fill="#FFFFFF" opacity="0.08" />

      {/* mirror */}
      <ellipse cx="96" cy="176" rx="56" ry="72" fill="#D9B46A" />
      <ellipse cx="96" cy="176" rx="48" ry="64" fill="url(#bt-mirror)" />
      <path d="M70 140 q10 -22 30 -26 M66 160 q4 -8 10 -12" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.7" fill="none" />
      {/* towel */}
      <rect x="16" y="314" width="96" height="6" rx="3" fill="#B9B9B9" />
      <path d="M26 318 h76 v84 q-38 10 -76 0z" fill="#F2A7B5" />
      {[336, 354, 372].map((y) => (
        <path key={y} d={`M26 ${y} h76`} stroke="#FFFFFF" strokeWidth="5" opacity="0.7" />
      ))}

      {/* shower pipe and head, right above him */}
      <path d="M200 0 V112 q0 16 16 16 h20" stroke="#B7C2C7" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M220 120 h40 l12 22 h-64z" fill="#C9D3D7" />
      <ellipse cx="240" cy="142" rx="32" ry="6" fill="#9FAEB4" />

      {/* clawfoot tub, with foam and a duck */}
      <path d="M244 380 h170 v30 q0 60 -80 66 h-30 q-60 -6 -60 -66z" fill="url(#bt-tub)" stroke="#AEC0C6" strokeWidth="2" />
      <rect x="236" y="372" width="180" height="12" rx="6" fill="#FFFFFF" stroke="#AEC0C6" strokeWidth="2" />
      {[262, 290, 318, 346, 374].map((x, i) => (
        <circle key={x} cx={x} cy={368 - (i % 2) * 6} r={14 + (i % 3) * 3} fill="#FFFFFF" opacity="0.95" />
      ))}
      <path d="M262 476 l-8 14 M380 476 l8 14" stroke="#D9B46A" strokeWidth="6" strokeLinecap="round" />
      <g transform="translate(372 340)">
        <ellipse cx="0" cy="12" rx="16" ry="11" fill="#FFD23F" />
        <circle cx="8" cy="0" r="9" fill="#FFD23F" />
        <path d="M15 1 l9 2 l-9 3z" fill="#F28C28" />
        <circle cx="10" cy="-2" r="1.6" fill="#3B2216" />
      </g>

      {/* soap on a little dish */}
      <ellipse cx="170" cy="304" rx="22" ry="5" fill="#E9F3F4" />
      <rect x="156" y="292" width="28" height="12" rx="6" fill="#F7B6C8" />

      {/* floor */}
      <rect y="466" width="400" height="254" fill="url(#bt-floor)" />
      <FloorLines color="#FFFFFF" opacity={0.6} />
      <rect y="462" width="400" height="8" fill="#7FB8B1" />
      {/* bath mat, right where he stands */}
      <rect x="66" y="560" width="268" height="66" rx="33" fill="#F2A7B5" />
      <rect x="80" y="570" width="240" height="46" rx="23" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="1 8" strokeLinecap="round" />

      <Vignette id="bt-vig" strength={0.3} />
    </Scene>
  );
}

/* ───────────── playroom ───────────── */

function PlayRoom() {
  return (
    <Scene>
      <defs>
        <pattern id="pl-wall" width="36" height="470" patternUnits="userSpaceOnUse">
          <rect width="36" height="470" fill="#F4CF6E" />
          <rect width="16" height="470" fill="#F7DA8A" />
        </pattern>
        <linearGradient id="pl-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8FC9A2" />
          <stop offset="1" stopColor="#5E9C76" />
        </linearGradient>
        <linearGradient id="pl-board" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3F6B4E" />
          <stop offset="1" stopColor="#2C4F39" />
        </linearGradient>
        <linearGradient id="pl-tunnel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6FB3E8" />
          <stop offset="1" stopColor="#3A7FB8" />
        </linearGradient>
      </defs>
      <rect width="400" height="470" fill="url(#pl-wall)" />
      {/* bunting */}
      <path d="M0 52 Q200 96 400 52" stroke="#8A5A2E" strokeWidth="2" fill="none" />
      {Array.from({ length: 11 }, (_, i) => {
        const x = 10 + i * 37;
        const y = 52 + Math.sin((x / 400) * Math.PI) * 22;
        return <path key={i} d={`M${x} ${y} l26 0 l-13 26z`} fill={['#E5577A', '#3F8FD0', '#F29A3C', '#6BB36B', '#9B6BD0'][i % 5]} />;
      })}

      {/* chalkboard, with her name for him and his doodles */}
      <rect x="30" y="122" width="236" height="190" rx="6" fill="#B9824E" />
      <rect x="40" y="132" width="216" height="170" fill="url(#pl-board)" />
      <g stroke="#F2F2EA" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
        {/* a guinea pig, the way a guinea pig would draw himself */}
        <path d="M80 250 q-6 -40 40 -42 q44 2 40 42 q-40 10 -80 0z" />
        <circle cx="104" cy="226" r="2.4" fill="#F2F2EA" />
        <circle cx="134" cy="226" r="2.4" fill="#F2F2EA" />
        <path d="M114 238 q5 4 10 0 M92 212 l-6 -10 M146 212 l6 -10" />
        <path d="M184 168 q10 -10 20 0 q10 -10 20 0 q-20 26 -40 0z" />
        <path d="M60 160 v24 M68 160 v24 M76 160 v24 M84 160 v24 M54 178 l36 -12" />
        <path d="M190 236 h12 M196 230 v12 M208 236 h10 M214 236 h10 M210 244 h18" />
      </g>
      <text x="200" y="282" fontSize="20" textAnchor="middle" fill="#F2F2EA" opacity="0.85" fontFamily="Playpen Sans Hebrew, cursive">
        {species.sound}
      </text>
      <rect x="40" y="302" width="216" height="8" fill="#9A6A3E" />
      <rect x="70" y="298" width="22" height="5" rx="2" fill="#FFFFFF" />
      <rect x="100" y="298" width="16" height="5" rx="2" fill="#F7B6C8" />

      {/* toy shelf */}
      <rect x="292" y="150" width="108" height="320" rx="4" fill="#E06E58" />
      <rect x="300" y="158" width="100" height="304" fill="#B84E3B" />
      {[244, 330, 416].map((y) => (
        <rect key={y} x="296" y={y} width="104" height="8" rx="2" fill="#F08A6E" />
      ))}
      <rect x="310" y="210" width="30" height="30" rx="3" fill="#3F8FD0" />
      <rect x="344" y="218" width="24" height="24" rx="3" fill="#F2B33D" />
      <rect x="326" y="186" width="24" height="24" rx="3" fill="#6BB36B" transform="rotate(8 338 198)" />
      <circle cx="334" cy="306" r="22" fill="#E5577A" />
      <path d="M314 300 q20 12 40 0 M334 284 q-8 22 0 44" stroke="#FFFFFF" strokeWidth="3" fill="none" opacity="0.8" />
      <rect x="364" y="292" width="30" height="36" rx="4" fill="#9B6BD0" />
      <path d="M318 392 h60 v20 h-60z" fill="#F2B33D" />
      <circle cx="330" cy="414" r="7" fill="#3B2216" />
      <circle cx="366" cy="414" r="7" fill="#3B2216" />
      <rect x="330" y="378" width="34" height="16" rx="4" fill="#3F8FD0" />

      {/* floor: soft carpet with puzzle mats */}
      <rect y="466" width="400" height="254" fill="url(#pl-floor)" />
      <rect y="462" width="400" height="8" fill="#4E8A64" />
      {[
        [70, 560, '#F29A3C'],
        [200, 560, '#3F8FD0'],
        [330, 560, '#E5577A'],
        [135, 640, '#6BB36B'],
        [265, 640, '#F2B33D'],
      ].map(([x, y, c], i) => {
        const cx = Number(x);
        const cy = Number(y);
        const k = (cx - 200) * 0.12;
        return (
          <path
            key={i}
            d={`M${cx - 62 + k} ${cy - 34} H${cx + 62 + k} L${cx + 62 - k} ${cy + 34} H${cx - 62 - k}Z`}
            fill={String(c)}
            opacity="0.85"
          />
        );
      })}
      {/* his tunnel */}
      <g>
        <ellipse cx="60" cy="526" rx="70" ry="10" fill="#1E0F07" opacity="0.25" />
        <path d="M-20 470 h96 a32 32 0 0 1 0 56 h-96z" fill="url(#pl-tunnel)" />
        {[0, 18, 36, 54].map((d) => (
          <path key={d} d={`M${-10 + d} 471 v54`} stroke="#2E6A9C" strokeWidth="3" opacity="0.5" />
        ))}
        <ellipse cx="76" cy="498" rx="16" ry="28" fill="#1F4E78" />
        <ellipse cx="76" cy="498" rx="10" ry="20" fill="#163A5A" />
      </g>
      {/* blocks and a hay ball on the floor */}
      <rect x="332" y="498" width="34" height="34" rx="4" fill="#3F8FD0" transform="rotate(-8 349 515)" />
      <rect x="364" y="508" width="28" height="28" rx="4" fill="#E5577A" transform="rotate(10 378 522)" />
      <circle cx="300" cy="520" r="16" fill="#D9B46A" />
      <path d="M288 512 q12 8 24 0 M286 522 q14 6 28 0 M292 506 q8 20 0 30" stroke="#A8823E" strokeWidth="2" fill="none" />

      <Vignette id="pl-vig" strength={0.32} />
    </Scene>
  );
}

/* ───────────── bedroom ───────────── */

function BedRoom({ lamp }: { lamp: boolean }) {
  return (
    <Scene>
      <defs>
        <linearGradient id="bd-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4A4A82" />
          <stop offset="1" stopColor="#2E2D5C" />
        </linearGradient>
        <pattern id="bd-stars" width="46" height="46" patternUnits="userSpaceOnUse">
          <path d="M12 10 l1.6 3.2 3.4 0.5 -2.5 2.4 0.6 3.4 -3.1 -1.6 -3.1 1.6 0.6 -3.4 -2.5 -2.4 3.4 -0.5z" fill="#F7E3A0" opacity="0.35" />
          <circle cx="34" cy="34" r="1.6" fill="#F7E3A0" opacity="0.35" />
        </pattern>
        <linearGradient id="bd-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1B2350" />
          <stop offset="1" stopColor="#3B4A86" />
        </linearGradient>
        <linearGradient id="bd-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7A5A4A" />
          <stop offset="1" stopColor="#3E2A22" />
        </linearGradient>
        <radialGradient id="bd-glow" cx="0.84" cy="0.5" r="0.55">
          <stop offset="0" stopColor="#FFD98A" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFD98A" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="bd-bed" cx="0.5" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#C68BC0" />
          <stop offset="1" stopColor="#7E4A86" />
        </radialGradient>
      </defs>
      <rect width="400" height="470" fill="url(#bd-wall)" />
      <rect width="400" height="470" fill="url(#bd-stars)" />

      {/* window with the moon */}
      <rect x="262" y="88" width="124" height="196" rx="60" fill="#C9B9E6" />
      <rect x="270" y="96" width="108" height="180" rx="54" fill="url(#bd-sky)" />
      <path d="M342 132 a22 22 0 1 0 14 38 a18 18 0 1 1 -14 -38z" fill="#FFF1C2" />
      {[
        [292, 150],
        [306, 214],
        [356, 236],
        [290, 248],
        [330, 120],
      ].map(([x, y], i) => (
        <circle key={i} className="decor-twinkle" style={{ '--delay': `${-i * 0.8}s` } as CSSProperties} cx={x} cy={y} r="1.8" fill="#FFF7D6" />
      ))}
      <path d="M324 96 V276 M270 186 H378" stroke="#C9B9E6" strokeWidth="5" />
      <path d="M256 78 q-12 110 4 214 h-18 q-12 -110 0 -214z" fill="#5D6FB8" />
      <path d="M392 78 q12 110 -4 214 h18 q12 -110 0 -214z" fill="#5D6FB8" />

      {/* string lights */}
      <path d="M0 40 Q100 76 200 50 T400 46" stroke="#2A2A44" strokeWidth="1.5" fill="none" />
      {Array.from({ length: 12 }, (_, i) => {
        const x = 16 + i * 33;
        const y = 40 + Math.sin((i / 11) * Math.PI * 2) * 10 + (i < 6 ? 14 : 6);
        return <circle key={i} cx={x} cy={y} r="4.5" fill={['#FFD98A', '#FFB3C7', '#B9E3FF'][i % 3]} opacity={lamp ? 0.95 : 0.6} />;
      })}

      {/* the mobile: a moon and stars on strings */}
      <g className="decor-sway" style={{ transformOrigin: '150px 0px', '--dur': '6s' } as CSSProperties}>
        <path d="M150 0 V96 M110 96 H190 M110 96 V128 M150 96 V140 M190 96 V122" stroke="#C9B9E6" strokeWidth="1.4" />
        <path d="M152 140 a14 14 0 1 0 9 24 a11 11 0 1 1 -9 -24z" fill="#FFE07A" />
        <path d="M110 128 l3 6 6.5 1 -4.7 4.6 1.1 6.4 -5.9 -3.1 -5.9 3.1 1.1 -6.4 -4.7 -4.6 6.5 -1z" fill="#FFB3C7" />
        <path d="M190 122 l3 6 6.5 1 -4.7 4.6 1.1 6.4 -5.9 -3.1 -5.9 3.1 1.1 -6.4 -4.7 -4.6 6.5 -1z" fill="#B9E3FF" />
      </g>

      {/* framed photo of them, over the bed */}
      <g transform="rotate(3 90 250)">
        <rect x="50" y="210" width="80" height="80" rx="3" fill="#E9D6B6" />
        <rect x="58" y="218" width="64" height="64" fill="#F2B880" />
        <circle cx="80" cy="250" r="12" fill="#8A5A3A" />
        <circle cx="100" cy="250" r="12" fill="#E9A15C" />
        <path d="M90 238 c-3 -3 -7 1 0 6 c7 -5 3 -9 0 -6z" fill="#E5577A" />
      </g>

      {/* nightstand and lamp */}
      <rect width="400" height="470" fill="url(#bd-glow)" opacity={lamp ? 1 : 0} style={{ transition: 'opacity 0.6s' }} />
      <rect x="300" y="396" width="94" height="74" rx="4" fill="#8A5A42" />
      <rect x="296" y="390" width="102" height="10" rx="3" fill="#A06A4E" />
      <rect x="330" y="420" width="34" height="5" rx="2.5" fill="#E8C98A" />
      <rect x="342" y="350" width="8" height="40" fill="#C9B07A" />
      <ellipse cx="346" cy="390" rx="18" ry="4" fill="#C9B07A" />
      <path d="M318 312 h56 l14 42 h-84z" fill={lamp ? '#FFE3A3' : '#B79D72'} style={{ transition: 'fill 0.4s' }} />
      <path d="M318 312 h56" stroke="#E8C98A" strokeWidth="3" />

      {/* floor */}
      <rect y="466" width="400" height="254" fill="url(#bd-floor)" />
      <FloorLines color="#2A1A12" />
      <rect y="462" width="400" height="8" fill="#3A2A4E" />
      <ellipse cx="200" cy="640" rx="190" ry="44" fill="#5D6FB8" opacity="0.55" />
      {/* his round bed */}
      <ellipse cx="200" cy="584" rx="150" ry="44" fill="#5A3060" opacity="0.6" />
      <ellipse cx="200" cy="574" rx="146" ry="40" fill="url(#bd-bed)" />
      <ellipse cx="200" cy="570" rx="112" ry="26" fill="#E2B6DA" />
      <path d="M88 568 q112 30 224 0" stroke="#FFFFFF" strokeOpacity="0.35" strokeWidth="3" fill="none" />

      {!lamp && <rect width="400" height="720" fill="#0B0A26" opacity="0.35" />}
      <Vignette id="bd-vig" strength={0.5} />
    </Scene>
  );
}

/** The room behind him. The living room wears the theme she chose in the shop. */
export function RoomBackdrop({ room, theme, together, lamp }: { room: RoomId; theme: string; together: boolean; lamp: boolean }) {
  if (room === 'kitchen') return <KitchenRoom />;
  if (room === 'bath') return <BathRoom />;
  if (room === 'play') return <PlayRoom />;
  if (room === 'bed') return <BedRoom lamp={lamp} />;
  if (theme === 'cozy' || together) return <HomeRoom together={together} />;
  return <RoomScene room={theme} />;
}
