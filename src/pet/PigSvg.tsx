import { useId, type ReactNode } from 'react';
import { skinById, type Skin } from './catalog';
import { species as siteSpecies, type SpeciesId } from './species';

export type Face = 'normal' | 'smile' | 'happy' | 'asleep' | 'sad' | 'sick' | 'eating' | 'yawn' | 'open' | 'cry' | 'dizzy' | 'sneeze' | 'laugh';

const INK = '#3a2228';
const LINE = '#4a2a20';

/** Mixes a #rrggbb color toward white (t > 0) or black (t < 0). */
export function shade(hex: string, t: number) {
  const n = parseInt(hex.slice(1), 16);
  const to = t > 0 ? 255 : 0;
  const k = Math.abs(t);
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (to - v) * k));
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** His big round plush head, cheeks a little fuller at the bottom. Eyes at (70,120) and (130,120), top at y 58. */
const HEAD = 'M100 58 C142 58 171 86 170 120 C169 154 142 179 100 179 C58 179 31 154 30 120 C29 86 58 58 100 58 Z';
/** The plump upright body, like a soft egg he sits up in, a little wider than the head. */
const BODY = 'M100 112 C138 112 162 140 162 174 C162 202 150 219 126 219 L74 219 C50 219 38 202 38 174 C38 140 62 112 100 112 Z';

/**
 * Where the head sits: it (with everything on it) is drawn in its own coordinates and set on top of
 * the body, a little smaller when he's grown, so he sits up tall like the plush.
 */
function headFit(grown: number) {
  const g = Math.max(0, Math.min(1, grown));
  const k = 0.86 + 0.1 * (1 - g);
  return { k, ty: 222 - 82 * (0.76 + 0.24 * g) - 179 * k };
}

/** A point on his face (head coordinates, e.g. the mouth at y 152), as a fraction of the drawing's height. */
export const faceY = (grown: number, y: number) => {
  const { k, ty } = headFit(grown);
  return (ty + k * y) / 225;
};

/**
 * The pet: a soft plush, a big round head on a chubby body, huge glossy eyes
 * and pink toes, drawn so every skin, hat and pair of glasses fits. The same
 * puppet becomes a guinea pig, a cat, a dog or a bunny (`species`): only the
 * ears, the nose and muzzle, the whiskers and the tail change.
 * Eyes at (70,120) and (130,120), top of the head at y 58, feet at y 214.
 *
 * It is a little puppet: feet, body, ears, face, whiskers and nose are
 * separate groups (classes `pig-*`) that the CSS in styles/index.css moves.
 * `look` turns the face and the pupils (-1…1), `blush` warms the cheeks,
 * `talk` (0…1) opens the mouth while he speaks.
 */
export function PigSvg({
  skin: skinId,
  head,
  face: faceItem,
  neck,
  mood = 'normal',
  look = { x: 0, y: 0 },
  blush = 0,
  talk = 0,
  grown = 1,
  species = siteSpecies.id,
  className = '',
}: {
  skin: string;
  head?: string;
  face?: string;
  neck?: string;
  mood?: Face;
  look?: { x: number; y: number };
  blush?: number;
  talk?: number;
  /** 0 = a tiny pup (big head, small body) … 1 = all grown up. */
  grown?: number;
  /** Which animal (defaults to this site's pet). */
  species?: SpeciesId;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const s = skinById(skinId);
  const id = (n: string) => `${n}-${uid}`;
  const url = (n: string) => `url(#${id(n)})`;
  const sick = mood === 'sick';
  const lx = Math.max(-1, Math.min(1, look.x));
  const ly = Math.max(-1, Math.min(1, look.y));
  const dark = s.pattern === 'stars';
  const g = Math.max(0, Math.min(1, grown));
  // A pup is mostly head; the body fills out as he grows.
  const sy = 0.76 + 0.24 * g;
  const bodyT = `translate(100 222) scale(${(0.84 + 0.16 * g).toFixed(3)} ${sy.toFixed(3)}) translate(-100 -222)`;
  const { k, ty } = headFit(g);
  const headT = `translate(${(100 - 100 * k).toFixed(2)} ${ty.toFixed(2)}) scale(${k.toFixed(3)})`;
  const turn = (k: number) => ({
    transform: `translate(${lx * k}px, ${ly * k * 0.45}px)`,
    transition: 'transform 0.35s var(--ease-soft)',
  });

  const whisk = dark ? '#ffffff' : '#FFFDF8';

  return (
    <svg viewBox="0 0 200 225" className={`pig ${className}`} overflow="visible" aria-hidden>
      <defs>
        <clipPath id={id('clip')}>
          <path d={HEAD} transform={headT} />
          <path d={BODY} transform={bodyT} />
        </clipPath>
        <clipPath id={id('clipH')}>
          <path d={HEAD} />
        </clipPath>
        <clipPath id={id('clipB')}>
          <path d={BODY} transform={bodyT} />
        </clipPath>
        {/* plush fur: fine noise ruffles the edge, then a grain of lighter and darker hairs over it */}
        <filter id={id('fluff')} x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="4.5" xChannelSelector="R" yChannelSelector="G" result="fur" />
          <feTurbulence type="fractalNoise" baseFrequency="0.22 0.7" numOctaves="2" seed="3" result="strands" />
          <feGaussianBlur in="strands" stdDeviation="0.35" result="hair" />
          <feColorMatrix in="hair" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0.75 0 0 0 -0.4" result="hi" />
          <feComposite in="hi" in2="fur" operator="in" result="hiIn" />
          <feColorMatrix in="hair" type="matrix" values="0 0 0 0 0.1  0 0 0 0 0.05  0 0 0 0 0.02  0 -0.45 0 0 0.22" result="lo" />
          <feComposite in="lo" in2="fur" operator="in" result="loIn" />
          <feMerge>
            <feMergeNode in="fur" />
            <feMergeNode in="hiIn" />
            <feMergeNode in="loIn" />
          </feMerge>
        </filter>
        <filter id={id('soft')} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
        <radialGradient id={id('light')} cx="0.5" cy="0.18" r="0.62">
          <stop offset="0" stopColor="#fff" stopOpacity="0.5" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('edge')} cx="0.5" cy="0.4" r="0.62">
          <stop offset="0.7" stopColor="#2a1208" stopOpacity="0" />
          <stop offset="1" stopColor="#2a1208" stopOpacity="0.42" />
        </radialGradient>
        <radialGradient id={id('ao')} cx="0.5" cy="1" r="0.55">
          <stop offset="0" stopColor="#2a1208" stopOpacity="0.4" />
          <stop offset="1" stopColor="#2a1208" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('belly')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={shade(s.belly, 0.4)} />
          <stop offset="1" stopColor={shade(s.belly, -0.08)} />
        </linearGradient>
        <radialGradient id={id('ear')} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor={shade(s.ear, 0.16)} />
          <stop offset="1" stopColor={shade(s.ear, -0.28)} />
        </radialGradient>
        <radialGradient id={id('earIn')} cx="0.55" cy="0.6" r="0.6">
          <stop offset="0" stopColor="#FFC9CF" />
          <stop offset="0.7" stopColor="#F4A3AE" />
          <stop offset="1" stopColor="#D97F8C" />
        </radialGradient>
        <radialGradient id={id('pink')} cx="0.45" cy="0.3" r="0.75">
          <stop offset="0" stopColor="#FFDCDF" />
          <stop offset="0.6" stopColor="#F7A9B2" />
          <stop offset="1" stopColor="#DC8590" />
        </radialGradient>
        <radialGradient id={id('nose')} cx="0.4" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFC7CD" />
          <stop offset="1" stopColor="#E7808E" />
        </radialGradient>
        <linearGradient id={id('iris')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#140805" />
          <stop offset="0.45" stopColor="#2E170C" />
          <stop offset="1" stopColor="#8A5530" />
        </linearGradient>
        <FurDefs s={s} uid={uid} />
        {s.fx && <FxDefs fx={s.fx} uid={uid} />}
      </defs>

      {species !== 'guineaPig' && <Tail kind={species} fur={fill(s, uid)} tip={s.belly} fluff={url('fluff')} />}
      <g className="pig-body">
        {neck === 'scarf' && <path d="M118 172 l14 40 l-16 4 l-10 -40 z" fill="#E57373" stroke={INK} strokeWidth="2" />}

        {/* the body: plump and upright, orange on the shoulders, a white belly, the head's shadow on top */}
        <g filter={url('fluff')}>
          <path d={BODY} transform={bodyT} fill={fill(s, uid)} />
          <g clipPath={url('clipB')}>
            {s.pattern === 'cap' ? (
              // like the plush: orange shoulders, the dark patches low on the sides
              <g fill={s.patch}>
                <ellipse cx="38" cy="204" rx="28" ry="30" />
                <ellipse cx="162" cy="204" rx="28" ry="30" />
              </g>
            ) : (
              <g transform="translate(0 80)">
                <Pattern s={s} />
                {s.pattern === 'stars' && <Stars />}
              </g>
            )}
            <ellipse cx="100" cy="184" rx="35" ry="40" fill={url('belly')} />
            <path d={BODY} transform={bodyT} fill={url('edge')} />
            <rect x="0" y="200" width="220" height="26" fill={url('ao')} />
            <path d={BODY} transform={bodyT} fill={url('light')} opacity="0.6" />
          </g>
        </g>
        <ellipse cx="100" cy={222 - 82 * sy + 4} rx="50" ry="9" fill="#2a1208" opacity="0.22" filter={url('soft')} />

        <g transform={headT}>
          <Ears kind={species} ear={url('ear')} earIn={url('earIn')} fluff={url('fluff')} />

          {/* the head */}
          <g filter={url('fluff')}>
            <path d={HEAD} fill={fill(s, uid)} />
            <g clipPath={url('clipH')}>
              <Pattern s={s} />
              {/* the white blaze and muzzle slide a little with the face, so turning reads as turning */}
              <g style={turn(5)}>
                <Muzzle kind={species} fill={url('belly')} />
              </g>
              {s.pattern === 'stars' && <Stars />}
              {s.pattern === 'shine' && (
                <path className="pig-shine" d="M44 118 Q60 80 96 72" stroke="#fff" strokeWidth="7" strokeLinecap="round" fill="none" opacity="0.55" />
              )}
              <path d={HEAD} fill={url('edge')} />
              <path d={HEAD} fill={url('light')} />
            </g>
          </g>
          {/* a legendary skin is alive: its light moves over the fur (kept outside the fur filter, so it stays cheap) */}
          {s.fx && (
            <g clipPath={url('clip')}>
              <FxInside fx={s.fx} uid={uid} />
            </g>
          )}
          {neck && <Neck id={neck} />}

          <g className="pig-face" style={turn(9)}>
            <g className="pig-cheeks" filter={url('soft')} style={{ opacity: 0.55 + blush * 0.4 }}>
              <ellipse cx="47" cy="142" rx={13 + blush * 3} ry={9 + blush * 2} fill={sick ? '#A8D8A0' : '#FF8FA6'} />
              <ellipse cx="153" cy="142" rx={13 + blush * 3} ry={9 + blush * 2} fill={sick ? '#A8D8A0' : '#FF8FA6'} />
            </g>
            {/* long thin whiskers, with a faint shadow so they show on white fur too (a dog has none) */}
            {species !== 'dog' && (
            <g strokeLinecap="round" fill="none">
              <g stroke="#3a2228" strokeWidth="1.2" opacity="0.14" transform="translate(0 0.8)">
                <path d="M80 142 Q52 132 22 130 M80 147 Q52 146 20 150 M81 152 Q56 158 28 168 M120 142 Q148 132 178 130 M120 147 Q148 146 180 150 M119 152 Q144 158 172 168" />
              </g>
              <g stroke={whisk} strokeWidth="0.9" opacity="0.9">
                <path className="pig-whisk pig-whisk-l" d="M80 142 Q52 132 22 130 M80 147 Q52 146 20 150 M81 152 Q56 158 28 168" />
                <path className="pig-whisk pig-whisk-r" d="M120 142 Q148 132 178 130 M120 147 Q148 146 180 150 M119 152 Q144 158 172 168" />
              </g>
            </g>
            )}

            <Eyes mood={mood} lx={lx} ly={ly} iris={url('iris')} />

            <Nose kind={species} fill={url('nose')} />
            <Mouth mood={mood} talk={talk} sick={sick} />
            {species === 'bunny' && talk < 0.04 && !['open', 'yawn', 'laugh', 'cry', 'eating'].includes(mood) && <Teeth />}
            {mood === 'sad' && <path className="pig-tear" d="M58 132 q-2 7 1 10 q3 -3 -1 -10z" fill="#8FD3FF" />}

            {faceItem && <FaceItem id={faceItem} />}
          </g>

          {head && (
            <g className="pig-hat" style={turn(6)}>
              <Head id={head} />
            </g>
          )}
        </g>

        {/* little arms, the pink paws held up in front of the chest */}
        <g transform={bodyT}>
          <Arm side="l" fur={fill(s, uid)} pink={url('pink')} fluff={url('fluff')} soft={url('soft')} />
          <Arm side="r" fur={fill(s, uid)} pink={url('pink')} fluff={url('fluff')} soft={url('soft')} />
        </g>
        {s.fx && <FxAround fx={s.fx} uid={uid} bare={!head} />}
      </g>

      {/* front paws with pink toes: they stay on the ground while the body breathes and bounces */}
      <g className="pig-foot pig-foot-l">
        <Paw cx={78} pink={url('pink')} />
      </g>
      <g className="pig-foot pig-foot-r">
        <Paw cx={122} pink={url('pink')} />
      </g>
    </svg>
  );
}

/** Mirrors a left-side shape to the right side of the 200-wide drawing. */
const MIRROR = 'translate(200 0) scale(-1 1)';

/**
 * The ears, per animal. Each side keeps the `pig-ear-l/r` class (so they
 * flick, droop when sad and flatten when petted) with a pivot at its base.
 */
function Ears({ kind, ear, earIn, fluff }: { kind: SpeciesId; ear: string; earIn: string; fluff: string }) {
  const one = (side: 'l' | 'r', origin: string, shape: ReactNode) => (
    <g key={side} className={`pig-ear pig-ear-${side}`} style={{ transformOrigin: side === 'l' ? origin : origin.replace(/^(\d+)/, (x) => String(200 - Number(x))) }}>
      <g transform={side === 'r' ? MIRROR : undefined}>{shape}</g>
    </g>
  );
  switch (kind) {
    case 'cat':
      // pointed, a little apart, soft at the tip, pink inside with a tuft
      return (
        <>
          {(['l', 'r'] as const).map((side) =>
            one(
              side,
              '60px 84px',
              <>
                <path d="M34 96 C32 74 36 52 46 34 C50 30 54 30 58 34 C68 46 78 58 86 72 C70 76 50 84 34 96 Z" fill={ear} filter={fluff} />
                <path d="M44 86 C44 72 46 58 51 46 C53 44 55 44 57 47 C63 56 69 64 74 72 C64 75 53 79 44 86 Z" fill={earIn} />
                <path d="M50 70 q2 -6 6 -9 M54 73 q3 -5 7 -7" stroke="#fff" strokeOpacity="0.7" strokeWidth="1.2" fill="none" strokeLinecap="round" />
              </>,
            ),
          )}
        </>
      );
    case 'dog':
      // long, soft and floppy, hanging down the sides of the face
      return (
        <>
          {(['l', 'r'] as const).map((side) =>
            one(
              side,
              '56px 74px',
              <>
                <path d="M62 70 C40 62 20 78 16 106 C12 132 18 156 32 162 C44 166 50 152 52 136 C54 116 58 96 70 82 Z" fill={ear} filter={fluff} />
                <path d="M54 82 C40 84 30 100 28 120 C27 134 30 146 36 152" stroke="#fff" strokeOpacity="0.18" strokeWidth="4" fill="none" strokeLinecap="round" />
              </>,
            ),
          )}
        </>
      );
    case 'bunny':
      // tall and upright, leaning out a little, pink down the middle
      return (
        <>
          {(['l', 'r'] as const).map((side) =>
            one(
              side,
              '72px 76px',
              <g transform="rotate(-12 72 76)">
                <path d="M72 80 C56 80 52 50 54 18 C56 -10 64 -26 72 -26 C80 -26 88 -10 90 18 C92 50 88 80 72 80 Z" fill={ear} filter={fluff} />
                <path d="M72 70 C63 70 61 46 62 22 C63 2 67 -12 72 -12 C77 -12 81 2 82 22 C83 46 81 70 72 70 Z" fill={earIn} />
              </g>,
            ),
          )}
        </>
      );
    default:
      // round ears, up on the corners of the head, pink inside
      return (
        <>
          {(['l', 'r'] as const).map((side) =>
            one(
              side,
              '54px 86px',
              <>
                <circle cx="47" cy="72" r="21" fill={ear} filter={fluff} />
                <circle cx="49.5" cy="74" r="13.5" fill={earIn} />
              </>,
            ),
          )}
        </>
      );
  }
}

/** The light fur of the face: a guinea pig's blaze, a cat's and a bunny's puffy cheeks, a dog's round muzzle. */
function Muzzle({ kind, fill }: { kind: SpeciesId; fill: string }) {
  switch (kind) {
    case 'cat':
    case 'bunny':
      return (
        <>
          <path d="M100 96 C96 104 94 116 94 128 L106 128 C106 116 104 104 100 96 Z" fill={fill} opacity="0.9" />
          <ellipse cx="88" cy="148" rx="17" ry="14" fill={fill} />
          <ellipse cx="112" cy="148" rx="17" ry="14" fill={fill} />
          <ellipse cx="100" cy="158" rx="12" ry="10" fill={fill} />
        </>
      );
    case 'dog':
      return (
        <>
          <path d="M100 70 C92 70 90 92 88 108 L112 108 C110 92 108 70 100 70 Z" fill={fill} />
          <ellipse cx="100" cy="148" rx="31" ry="25" fill={fill} />
        </>
      );
    default:
      return (
        <path
          d="M100 58 C94 58 92 80 90 98 C88 112 84 122 74 132 C62 144 58 162 70 174 C84 186 116 186 130 174 C142 162 138 144 126 132 C116 122 112 112 110 98 C108 80 106 58 100 58 Z"
          fill={fill}
        />
      );
  }
}

/** The nose: soft and pink for a guinea pig or a bunny, a pink triangle for a cat, a big shiny button for a dog. */
function Nose({ kind, fill }: { kind: SpeciesId; fill: string }) {
  switch (kind) {
    case 'cat':
      return (
        <>
          <path className="pig-nose" d="M93 135 Q100 132.5 107 135 Q105 140 100 143 Q95 140 93 135 Z" fill={fill} />
          <path d="M100 143 v4" stroke="#4a2a20" strokeWidth="1.3" strokeLinecap="round" />
          <ellipse cx="97.6" cy="135.4" rx="2.1" ry="1" fill="#fff" opacity="0.75" />
        </>
      );
    case 'dog':
      return (
        <>
          <path className="pig-nose" d="M88 134 Q100 127 112 134 Q112 142 100 147 Q88 142 88 134 Z" fill="#2B1B18" />
          <ellipse cx="95" cy="133" rx="4" ry="2" fill="#fff" opacity="0.55" />
          <path d="M100 147 v4" stroke="#4a2a20" strokeWidth="1.5" strokeLinecap="round" />
        </>
      );
    case 'bunny':
      return (
        <>
          <path className="pig-nose" d="M94.5 136 Q100 133 105.5 136 Q104.5 140 100 142.5 Q95.5 140 94.5 136 Z" fill={fill} />
          <path d="M100 142.5 v3.5" stroke="#4a2a20" strokeWidth="1.2" strokeLinecap="round" />
          <ellipse cx="98" cy="135.8" rx="1.8" ry="0.9" fill="#fff" opacity="0.75" />
        </>
      );
    default:
      return (
        <>
          <path className="pig-nose" d="M92 136 Q100 131.5 108 136 Q107 141 100 145 Q93 141 92 136 Z" fill={fill} />
          <ellipse cx="97.5" cy="135.6" rx="2.6" ry="1.3" fill="#fff" opacity="0.75" />
        </>
      );
  }
}

/** A bunny's two front teeth, peeking under the smile. */
function Teeth() {
  return (
    <g>
      <rect x="95.6" y="150.5" width="4.2" height="6" rx="1.2" fill="#FFFDF8" stroke={LINE} strokeWidth="0.9" />
      <rect x="100.2" y="150.5" width="4.2" height="6" rx="1.2" fill="#FFFDF8" stroke={LINE} strokeWidth="0.9" />
    </g>
  );
}

/**
 * Behind the body: a cat's long tail curling up, a dog's short one that wags
 * (`pet-tail`, styles/index.css), a bunny's cotton puff at the side.
 */
function Tail({ kind, fur, tip, fluff }: { kind: SpeciesId; fur: string; tip: string; fluff: string }) {
  if (kind === 'cat')
    return (
      <g className="pet-tail pet-tail-cat">
        <path d="M146 206 C176 204 188 180 182 152 C178 132 166 120 158 112" stroke={fur} strokeWidth="15" fill="none" strokeLinecap="round" filter={fluff} />
        <path d="M166 124 C162 118 160 116 158 112" stroke={tip} strokeWidth="13" fill="none" strokeLinecap="round" filter={fluff} />
      </g>
    );
  if (kind === 'dog')
    return (
      <g className="pet-tail pet-tail-dog">
        <path d="M144 190 C162 182 174 166 176 146" stroke={fur} strokeWidth="13" fill="none" strokeLinecap="round" filter={fluff} />
      </g>
    );
  return <circle className="pet-tail pet-tail-bunny" cx="158" cy="200" r="15" fill={tip} filter={fluff} />;
}

/** One arm, from the shoulder down to a pink paw held in front of the chest. Drawn for the left, mirrored for the right. */
function Arm({ side, fur, pink, fluff, soft }: { side: 'l' | 'r'; fur: string; pink: string; fluff: string; soft: string }) {
  return (
    <g className={`pig-hand pig-hand-${side}`}>
      <g transform={side === 'r' ? 'translate(200 0) scale(-1 1)' : undefined}>
        <path d="M52 152 C46 164 56 178 70 181 C79 182 83 174 79 169 C72 165 66 158 66 148 Z" fill="#2a1208" opacity="0.28" filter={soft} transform="translate(3 4)" />
        <path d="M52 152 C46 164 56 178 70 181 C79 182 83 174 79 169 C72 165 66 158 66 148 Z" fill={fur} filter={fluff} />
        <path d="M54 156 C52 164 58 172 66 176" stroke="#fff" strokeOpacity="0.28" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M52 154 C48 166 58 178 70 181" stroke="#2a1208" strokeOpacity="0.18" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <g transform="rotate(-16 76 178)">
          <ellipse cx="76" cy="178" rx="7.4" ry="8.8" fill={pink} />
          <path d="M71 183 q1.7 2.6 3.4 0 M74.5 184 q1.7 2.6 3.4 0 M78 183 q1.7 2.6 3.4 0" stroke="#C66E7B" strokeWidth="1" fill="none" strokeLinecap="round" />
          <ellipse cx="74" cy="173.5" rx="2.6" ry="3.2" fill="#fff" opacity="0.5" />
        </g>
      </g>
    </g>
  );
}

/** A front paw seen from the front: a plump pink pad with three little toes. */
function Paw({ cx, pink }: { cx: number; pink: string }) {
  return (
    <g>
      <ellipse cx={cx} cy="216" rx="16" ry="8" fill="#2a1208" opacity="0.12" />
      <ellipse cx={cx} cy="213.5" rx="15.5" ry="8.5" fill={pink} />
      <path
        d={`M${cx - 9} 214 q2.6 -4.4 5.2 0 M${cx - 2.6} 214.6 q2.6 -4.4 5.2 0 M${cx + 3.8} 214 q2.6 -4.4 5.2 0`}
        stroke="#C66E7B"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      <ellipse cx={cx - 3} cy="209.5" rx="6" ry="2" fill="#fff" opacity="0.45" />
    </g>
  );
}

function Mouth({ mood, talk, sick }: { mood: Face; talk: number; sick: boolean }) {
  if (talk > 0.04) return <ellipse cx="100" cy="155" rx={4 + talk * 3} ry={2 + talk * 8} fill="#7A2E3A" stroke={LINE} strokeWidth="1.2" />;
  if (mood === 'eating') return <ellipse className="pet-chomp" cx="100" cy="155" rx="6" ry="5" fill="#7A2E3A" stroke={LINE} strokeWidth="1.4" />;
  if (mood === 'yawn') return <ellipse className="pig-yawn" cx="100" cy="158" rx="9" ry="11" fill="#7A2E3A" stroke={LINE} strokeWidth="1.6" />;
  // Food is coming: mouth wide open, tongue out a little.
  if (mood === 'open')
    return (
      <g className="pig-gape">
        <ellipse cx="100" cy="158" rx="11" ry="12.5" fill="#6A2232" stroke={LINE} strokeWidth="1.6" />
        <ellipse cx="100" cy="165" rx="7" ry="4.5" fill="#F28C9A" />
        <rect x="95" y="146.5" width="10" height="5" rx="1.5" fill="#FFFDF8" stroke={LINE} strokeWidth="0.8" />
      </g>
    );
  if (mood === 'cry')
    return (
      <g>
        <path d="M86 162 Q100 146 114 162 Q100 158 86 162 Z" fill="#6A2232" stroke={LINE} strokeWidth="1.6" strokeLinejoin="round" />
        {/* the cheek that got slapped */}
        <g opacity="0.75">
          <ellipse cx="50" cy="146" rx="15" ry="11" fill="#FF4F6D" />
          <path d="M42 140 l10 10 M46 137 l10 10 M50 135 l9 9" stroke="#E0304F" strokeWidth="2" strokeLinecap="round" />
        </g>
      </g>
    );
  if (mood === 'dizzy') return <path d="M86 156 q4 -4 7 0 t7 0 t7 0 t7 0" stroke={LINE} strokeWidth="1.8" fill="none" strokeLinecap="round" />;
  if (mood === 'sneeze') return <ellipse cx="100" cy="156" rx="5" ry="4" fill="#7A2E3A" stroke={LINE} strokeWidth="1.3" />;
  if (mood === 'laugh')
    return (
      <g>
        <path d="M86 149 Q100 172 114 149 Q100 154 86 149 Z" fill="#6A2232" stroke={LINE} strokeWidth="1.6" strokeLinejoin="round" />
        <ellipse cx="100" cy="161" rx="6" ry="3.5" fill="#F28C9A" />
        <rect x="95" y="148.5" width="10" height="4.5" rx="1.5" fill="#FFFDF8" stroke={LINE} strokeWidth="0.8" />
      </g>
    );
  if (mood === 'sad' || sick) return <path d="M92 157 Q100 151 108 157" stroke={LINE} strokeWidth="1.8" fill="none" strokeLinecap="round" />;
  if (mood === 'happy' || mood === 'smile')
    return (
      <g>
        <path d="M100 145 v3" stroke={LINE} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M89 148.5 Q100 165 111 148.5 Q100 152.5 89 148.5 Z" fill="#6A2232" stroke={LINE} strokeWidth="1.4" strokeLinejoin="round" />
        <ellipse cx="100" cy="157" rx="4.6" ry="2.6" fill="#F58FA0" />
      </g>
    );
  // His resting face, like the plush: a small open smile with the tip of a pink tongue.
  return (
    <g>
      <path d="M100 145 v3" stroke={LINE} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M92.5 149 Q100 159.5 107.5 149 Q100 151.5 92.5 149 Z" fill="#6A2232" stroke={LINE} strokeWidth="1.3" strokeLinejoin="round" />
      <ellipse cx="100" cy="154.6" rx="3.2" ry="1.9" fill="#F58FA0" />
    </g>
  );
}

const fill = (s: Skin, uid: string) =>
  s.pattern === 'gradient' || s.pattern === 'rainbow' || s.pattern === 'shine' || s.pattern === 'stars' ? `url(#fur-${uid})` : s.fur;

function FurDefs({ s, uid }: { s: Skin; uid: string }) {
  if (s.pattern === 'gradient')
    return (
      <linearGradient id={`fur-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={s.fur} />
        <stop offset="1" stopColor={s.patch} />
      </linearGradient>
    );
  if (s.pattern === 'rainbow')
    return (
      <linearGradient id={`fur-${uid}`} x1="0" y1="0" x2="1" y2="1">
        {['#FF8FA3', '#FFB86B', '#FFE57A', '#9BE59B', '#8FD3FF', '#C7A2FF'].map((c, i) => (
          <stop key={c} offset={i / 5} stopColor={c} />
        ))}
      </linearGradient>
    );
  if (s.pattern === 'shine')
    return (
      <radialGradient id={`fur-${uid}`} cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#FFF1B8" />
        <stop offset="0.5" stopColor={s.fur} />
        <stop offset="1" stopColor={s.patch} />
      </radialGradient>
    );
  if (s.pattern === 'stars')
    return (
      <radialGradient id={`fur-${uid}`} cx="0.5" cy="0.35" r="0.8">
        <stop offset="0" stopColor={s.patch} />
        <stop offset="1" stopColor={s.fur} />
      </radialGradient>
    );
  return null;
}

const SPOTS = [
  [48, 110, 9],
  [70, 88, 6],
  [140, 96, 8],
  [154, 128, 10],
  [40, 150, 7],
  [160, 170, 7],
  [56, 182, 8],
  [134, 190, 6],
  [120, 80, 5],
] as const;

/** Tiger stripes: tapered strokes on the flanks and the top of the head. */
const STRIPES: [string, number][] = [
  ['M30 108 Q46 112 54 128', 6],
  ['M26 136 Q44 140 52 156', 6.5],
  ['M30 166 Q46 168 56 182', 6],
  ['M170 108 Q154 112 146 128', 6],
  ['M174 136 Q156 140 148 156', 6.5],
  ['M170 166 Q154 168 144 182', 6],
  ['M84 70 Q90 80 88 92', 5],
  ['M116 70 Q110 80 112 92', 5],
  ['M100 66 L100 84', 5],
  ['M60 82 Q66 92 64 102', 4.5],
  ['M140 82 Q134 92 136 102', 4.5],
];

const SPRINKLES = [
  [48, 96, 30], [64, 84, -40], [80, 76, 70], [124, 76, -20], [140, 86, 45], [154, 100, -60],
  [40, 116, 80], [160, 118, 10], [58, 108, -10], [144, 110, 60], [92, 72, 15], [110, 72, -70],
] as const;
const SPRINKLE_COLORS = ['#FF4F7E', '#FFD23F', '#45B8F2', '#6CD36B', '#A98BFF', '#FFFFFF'];

function Pattern({ s }: { s: Skin }) {
  if (s.pattern === 'cap')
    return (
      <g fill={s.patch}>
        <ellipse cx="50" cy="96" rx="34" ry="30" />
        <ellipse cx="150" cy="96" rx="34" ry="30" />
        <ellipse cx="100" cy="64" rx="30" ry="12" />
        <ellipse cx="34" cy="170" rx="18" ry="26" opacity="0.55" />
      </g>
    );
  if (s.pattern === 'patches')
    return (
      <g fill={s.patch}>
        <ellipse cx="52" cy="112" rx="40" ry="42" />
        <ellipse cx="156" cy="182" rx="38" ry="28" />
        <ellipse cx="150" cy="86" rx="22" ry="16" />
      </g>
    );
  if (s.pattern === 'spots')
    return (
      <g fill={s.patch}>
        {SPOTS.map(([x, y, r]) => (
          <ellipse key={`${x}-${y}`} cx={x} cy={y} rx={r} ry={r * 0.8} />
        ))}
      </g>
    );
  if (s.pattern === 'stripes')
    return (
      <g stroke={s.patch} strokeLinecap="round" fill="none">
        {STRIPES.map(([d, w], i) => (
          <path key={i} d={d} strokeWidth={w} />
        ))}
      </g>
    );
  if (s.pattern === 'rosettes')
    return (
      <g>
        {SPOTS.map(([x, y, r]) => (
          <g key={`${x}-${y}`}>
            <ellipse cx={x} cy={y} rx={r * 1.15} ry={r * 0.95} fill={shade(s.fur, -0.14)} />
            <ellipse cx={x} cy={y} rx={r * 1.15} ry={r * 0.95} fill="none" stroke={s.patch} strokeWidth="3.2" strokeDasharray="7 4" strokeLinecap="round" />
          </g>
        ))}
      </g>
    );
  if (s.pattern === 'sprinkles')
    return (
      <g>
        {/* frosting drips over the top, sprinkles on it */}
        <path d="M20 128 C40 60 160 60 180 128 Q170 140 160 128 Q150 146 138 128 Q126 142 112 126 Q98 144 86 126 Q72 142 62 128 Q50 144 40 128 Q30 140 20 128 Z" fill={s.patch} opacity="0.55" />
        {SPRINKLES.map(([x, y, r], i) => (
          <rect key={i} x={x - 4} y={y - 1.6} width="8" height="3.2" rx="1.6" fill={SPRINKLE_COLORS[i % SPRINKLE_COLORS.length]} transform={`rotate(${r} ${x} ${y})`} />
        ))}
      </g>
    );
  if (s.pattern === 'hearts')
    return (
      <g fill={s.patch} opacity="0.85">
        {SPOTS.map(([x, y, r]) => (
          <path key={`${x}-${y}`} d={heart(x, y, r * 1.3)} />
        ))}
      </g>
    );
  return null;
}

function Stars() {
  return (
    <g fill="#fff">
      {SPOTS.map(([x, y, r], i) => (i % 2 ? <circle key={i} cx={x} cy={y} r={1.6} opacity="0.9" /> : <path key={i} d={star(x, y, r * 0.7)} opacity="0.85" />))}
      <circle cx="100" cy="186" r="1.4" />
      <circle cx="84" cy="200" r="1.2" />
      <circle cx="118" cy="204" r="1.4" />
    </g>
  );
}

const heart = (x: number, y: number, r: number) =>
  `M${x} ${y + r * 0.9} C${x - r * 1.4} ${y - r * 0.1} ${x - r * 0.6} ${y - r * 1.1} ${x} ${y - r * 0.35} C${x + r * 0.6} ${y - r * 1.1} ${x + r * 1.4} ${y - r * 0.1} ${x} ${y + r * 0.9} Z`;

function star(x: number, y: number, r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
}

function Eyes({ mood, lx, ly, iris }: { mood: Face; lx: number; ly: number; iris: string }) {
  if (mood === 'cry' || mood === 'sneeze')
    return (
      <g stroke={LINE} strokeWidth="3.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M60 113 L78 121 L60 128" />
        <path d="M140 113 L122 121 L140 128" />
        {mood === 'cry' && (
          <g className="pig-streams" stroke="#7CC8F2" strokeWidth="5" opacity="0.9">
            <path d="M62 128 Q58 146 60 170" strokeDasharray="6 8" />
            <path d="M138 128 Q142 146 140 170" strokeDasharray="6 8" />
          </g>
        )}
      </g>
    );
  if (mood === 'dizzy')
    return (
      <g stroke={LINE} strokeWidth="2.6" fill="none" strokeLinecap="round">
        {[70, 130].map((cx) => (
          <path
            key={cx}
            className="pig-spiral"
            style={{ transformOrigin: `${cx}px 120px` }}
            d={`M${cx} 120 m0 -1 a1.5 1.5 0 1 1 -1.5 2 a4 4 0 1 1 5 -3 a7 7 0 1 1 -9.5 6 a10 10 0 1 1 14 -9`}
          />
        ))}
      </g>
    );
  if (mood === 'happy' || mood === 'laugh')
    return (
      <g stroke={LINE} strokeWidth="3.4" fill="none" strokeLinecap="round">
        <path d="M59 124 Q70 110 81 124" />
        <path d="M119 124 Q130 110 141 124" />
      </g>
    );
  if (mood === 'asleep' || mood === 'yawn')
    return (
      <g stroke={LINE} strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M59 119 Q70 129 81 119" />
        <path d="M119 119 Q130 129 141 119" />
        <path d="M60 121 l-3 3 M80 121 l3 3 M120 121 l-3 3 M140 121 l3 3" strokeWidth="1.6" />
      </g>
    );
  // Huge glossy eyes, like the plush: a dark iris that warms to brown at the
  // bottom follows her finger; the big shine stays where the light is.
  const open = (cx: number) => (
    <g key={cx} className="pet-blink" style={{ transformOrigin: `${cx}px 120px` }}>
      <ellipse cx={cx} cy="122" rx="17.5" ry="17.5" fill="#2a1208" opacity="0.16" />
      <circle cx={cx} cy="120" r="16" fill="#0E0604" />
      <g
        style={{
          transform: `translate(${lx * 2.8}px, ${ly * 2.4}px)`,
          transition: 'transform 0.25s ease-out',
        }}
      >
        <circle cx={cx} cy="120.6" r="14" fill={iris} />
        <circle cx={cx} cy="120.4" r="7.6" fill="#050201" />
        <path d={`M${cx - 10} ${126} Q${cx} ${134} ${cx + 10} ${126}`} stroke="#C08A5C" strokeWidth="1.6" fill="none" opacity="0.5" strokeLinecap="round" />
      </g>
      <ellipse cx={cx + 5} cy="113" rx="5.6" ry="5" fill="#fff" />
      <circle cx={cx - 6} cy="127" r="2.2" fill="#fff" opacity="0.85" />
      <circle cx={cx + 8} cy="122.5" r="1.1" fill="#fff" opacity="0.7" />
    </g>
  );
  return (
    <g>
      {open(70)}
      {open(130)}
      {mood === 'sick' && (
        <g fill="#C98A5E" stroke={LINE} strokeWidth="1.2">
          <path d="M56 120 Q70 104 84 120 Z" />
          <path d="M116 120 Q130 104 144 120 Z" />
        </g>
      )}
      {mood === 'sad' && (
        <g stroke={LINE} strokeWidth="2.6" strokeLinecap="round">
          <path d="M58 101 L78 97" />
          <path d="M142 101 L122 97" />
        </g>
      )}
    </g>
  );
}

function Head({ id }: { id: string }) {
  const g = (children: ReactNode) => (
    <g stroke={INK} strokeWidth="2.2" strokeLinejoin="round">
      {children}
    </g>
  );
  switch (id) {
    case 'bow':
      return g(
        <>
          <path d="M138 80 L116 66 L118 94 Z" fill="#F06292" />
          <path d="M138 80 L160 64 L160 92 Z" fill="#F06292" />
          <circle cx="138" cy="80" r="6" fill="#EC407A" />
        </>,
      );
    case 'party':
    case 'bdayhat':
      return g(
        <>
          <path d="M100 8 L76 78 L124 78 Z" fill={id === 'party' ? '#8FD3FF' : '#F7A8C4'} />
          <path d="M88 43 L112 43 M83 60 L117 60" stroke={id === 'party' ? '#3F6FB5' : '#fff'} strokeWidth="4" />
          {id === 'party' ? (
            <circle cx="100" cy="8" r="7" fill="#FFD54F" />
          ) : (
            <>
              <rect x="97" y="-8" width="6" height="14" fill="#fff" />
              <path d="M100 -18 q6 6 0 10 q-6 -4 0 -10z" fill="#FFB300" />
            </>
          )}
        </>,
      );
    case 'beanie':
      return g(
        <>
          <path d="M48 90 Q50 30 100 28 Q150 30 152 90 Z" fill="#C2385A" />
          <rect x="44" y="78" width="112" height="16" rx="8" fill="#A32C4A" />
          <circle cx="100" cy="24" r="12" fill="#FFE0E8" />
        </>,
      );
    case 'flowers':
      return (
        <g>
          {[50, 68, 86, 104, 122, 140, 156].map((x, i) => {
            const y = 78 + ((x - 103) / 53) ** 2 * 10 - 6;
            const c = ['#F48FB1', '#FFE082', '#FFFFFF', '#CE93D8'][i % 4];
            return (
              <g key={x} stroke={INK} strokeWidth="1.2">
                {[0, 72, 144, 216, 288].map((a) => (
                  <circle key={a} cx={x + Math.cos((a * Math.PI) / 180) * 6} cy={y + Math.sin((a * Math.PI) / 180) * 6} r="5" fill={c} />
                ))}
                <circle cx={x} cy={y} r="3.5" fill="#FFB300" />
              </g>
            );
          })}
        </g>
      );
    case 'chef':
      return g(
        <>
          <circle cx="76" cy="44" r="20" fill="#fff" />
          <circle cx="124" cy="44" r="20" fill="#fff" />
          <circle cx="100" cy="32" r="25" fill="#fff" />
          <rect x="72" y="52" width="56" height="26" rx="4" fill="#fff" />
        </>,
      );
    case 'bunny':
      return g(
        <>
          <ellipse cx="78" cy="38" rx="13" ry="38" transform="rotate(-14 78 38)" fill="#fff" />
          <ellipse cx="122" cy="38" rx="13" ry="38" transform="rotate(14 122 38)" fill="#fff" />
          <ellipse cx="78" cy="40" rx="6" ry="26" transform="rotate(-14 78 40)" fill="#F8BBD0" stroke="none" />
          <ellipse cx="122" cy="40" rx="6" ry="26" transform="rotate(14 122 40)" fill="#F8BBD0" stroke="none" />
          <path d="M56 84 Q100 58 144 84" fill="none" stroke="#F06292" strokeWidth="6" />
        </>,
      );
    case 'witch':
      return g(
        <>
          <ellipse cx="100" cy="78" rx="56" ry="11" fill="#5B3A8C" />
          <path d="M72 76 L104 6 Q114 0 118 14 L128 76 Z" fill="#6E4AA6" />
          <rect x="74" y="62" width="52" height="10" fill="#FFD54F" />
        </>,
      );
    case 'strawhat':
      return g(
        <>
          <path d="M56 88 Q56 30 100 30 Q144 30 144 88 Z" fill="#E53950" />
          {[
            [78, 52],
            [100, 46],
            [122, 52],
            [70, 72],
            [92, 66],
            [112, 66],
            [132, 72],
          ].map(([x, y]) => (
            <ellipse key={`${x}${y}`} cx={x} cy={y} rx="2" ry="3.2" fill="#FFE57A" stroke="none" />
          ))}
          <path d="M100 34 L84 22 L96 26 L100 12 L104 26 L116 22 Z" fill="#43A047" />
        </>,
      );
    case 'cowboy':
      return g(
        <>
          <path d="M66 74 Q64 30 84 34 Q100 44 116 34 Q136 30 134 74 Z" fill="#A0683C" />
          <path d="M66 66 Q100 74 134 66 L134 74 Q100 82 66 74 Z" fill="#6D4325" />
          <path d="M26 80 Q100 58 174 80 Q100 98 26 80 Z" fill="#B97A47" />
        </>,
      );
    case 'headphones':
      return g(
        <>
          <path d="M36 112 Q38 34 100 34 Q162 34 164 112" fill="none" strokeWidth="9" stroke={INK} />
          <rect x="22" y="96" width="24" height="38" rx="10" fill="#C2385A" />
          <rect x="154" y="96" width="24" height="38" rx="10" fill="#C2385A" />
        </>,
      );
    case 'grad':
      return g(
        <>
          <path d="M70 62 L70 80 Q100 92 130 80 L130 62 Z" fill="#2B2B2B" />
          <path d="M100 38 L162 56 L100 74 L38 56 Z" fill="#3A3A3A" />
          <path d="M100 56 L150 60 L152 90" fill="none" stroke="#F2C14E" strokeWidth="3" />
          <circle cx="152" cy="92" r="4" fill="#F2C14E" />
        </>,
      );
    case 'halo':
      return <ellipse className="animate-floaty" cx="100" cy="44" rx="40" ry="10" fill="none" stroke="#F2C14E" strokeWidth="7" opacity="0.95" />;
    case 'crown':
      return g(
        <>
          <path d="M62 80 L56 36 L80 58 L100 28 L120 58 L144 36 L138 80 Z" fill="#F2C14E" />
          <circle cx="56" cy="36" r="5" fill="#E53950" />
          <circle cx="100" cy="28" r="6" fill="#3F6FB5" />
          <circle cx="144" cy="36" r="5" fill="#E53950" />
          <circle cx="100" cy="68" r="5" fill="#E53950" />
        </>,
      );
    case 'luckycrown':
      return <LuckyCrown />;
    default:
      return null;
  }
}

const WHEEL_GEMS = ['#FF6F91', '#45B8F2', '#6CD36B', '#A98BFF', '#FF9F43', '#FFD23F'];

/** The crown from the lucky wheel: tall gold points with a gem on each, a little spinning wheel set in front. */
export function LuckyCrown() {
  const tips = [
    [58, 40],
    [79, 30],
    [100, 20],
    [121, 30],
    [142, 40],
  ];
  return (
    <g stroke={INK} strokeWidth="2" strokeLinejoin="round">
      <path d={`M60 84 L${tips.map(([x, y], i) => `${x} ${y} L${i < 4 ? `${(x + tips[i + 1][0]) / 2} ${62}` : '140 84'}`).join(' L')} Q100 92 60 84 Z`} fill="#F2C14E" />
      <path d="M66 70 L72 56 M88 62 L94 46 M112 62 L106 46 M134 70 L128 56" stroke="#FFF3C4" strokeWidth="2.4" strokeLinecap="round" opacity="0.8" />
      <path d="M60 78 Q100 88 140 78 L140 86 Q100 96 60 86 Z" fill="#D9A22A" />
      {tips.map(([x, y], i) => (
        <circle key={x} cx={x} cy={y} r={i === 2 ? 6 : 5} fill={WHEEL_GEMS[i]} />
      ))}
      <g className="lucky-wheel" style={{ transformOrigin: '100px 72px' }}>
        <circle cx="100" cy="72" r="10.5" fill="#fff" />
        {WHEEL_GEMS.map((c, i) => {
          const a0 = (i / 6) * Math.PI * 2;
          const a1 = ((i + 1) / 6) * Math.PI * 2;
          return (
            <path
              key={c}
              d={`M100 72 L${100 + Math.cos(a0) * 9} ${72 + Math.sin(a0) * 9} A9 9 0 0 1 ${100 + Math.cos(a1) * 9} ${72 + Math.sin(a1) * 9} Z`}
              fill={c}
              stroke="none"
            />
          );
        })}
        <circle cx="100" cy="72" r="2.6" fill="#F2C14E" strokeWidth="1.2" />
      </g>
      <g fill="#FFF6C8" stroke="none">
        <path className="fx-twinkle" d={sparkle(48, 30, 5)} />
        <path className="fx-twinkle" d={sparkle(152, 26, 6)} style={{ animationDelay: '0.8s' }} />
        <path className="fx-twinkle" d={sparkle(100, 6, 4.5)} style={{ animationDelay: '1.5s' }} />
      </g>
    </g>
  );
}

function FaceItem({ id }: { id: string }) {
  switch (id) {
    case 'round':
      return (
        <g stroke={INK} strokeWidth="3" fill="#fff" fillOpacity="0.18">
          <circle cx="70" cy="120" r="17" />
          <circle cx="130" cy="120" r="17" />
          <path d="M87 118 Q100 110 113 118" fill="none" />
        </g>
      );
    case 'sun':
      return (
        <g stroke={INK} strokeWidth="2.5">
          <rect x="50" y="108" width="40" height="26" rx="9" fill="#1E1A1C" />
          <rect x="110" y="108" width="40" height="26" rx="9" fill="#1E1A1C" />
          <path d="M90 116 L110 116" fill="none" />
          <path d="M58 114 L68 114 M118 114 L128 114" stroke="#fff" strokeWidth="2.5" opacity="0.6" />
        </g>
      );
    case 'hearts':
      return (
        <g stroke={INK} strokeWidth="2" fill="#E53950" fillOpacity="0.92">
          <path d={heart(70, 120, 17)} />
          <path d={heart(130, 120, 17)} />
          <path d="M86 116 L114 116" fill="none" />
        </g>
      );
    case 'mustache':
      return <path d="M100 152 C90 143 72 147 64 160 C78 155 88 157 100 154 C112 157 122 155 136 160 C128 147 110 143 100 152 Z" fill={INK} />;
    case 'stars':
      return (
        <g fill="#FFD54F" stroke={INK} strokeWidth="1.2">
          <path d={star(54, 146, 9)} />
          <path d={star(146, 146, 9)} />
        </g>
      );
    default:
      return null;
  }
}

function Neck({ id }: { id: string }) {
  switch (id) {
    case 'bowtie':
      return (
        <g stroke={INK} strokeWidth="2" fill="#3F6FB5">
          <path d="M100 172 L78 160 L78 184 Z" />
          <path d="M100 172 L122 160 L122 184 Z" />
          <rect x="94" y="166" width="12" height="12" rx="3" fill="#2E5A99" />
        </g>
      );
    case 'bell':
      return (
        <g>
          <path d="M50 162 Q100 190 150 162" stroke="#C2385A" strokeWidth="8" fill="none" strokeLinecap="round" />
          <circle cx="100" cy="184" r="9" fill="#F2C14E" stroke={INK} strokeWidth="2" />
          <path d="M100 186 v6" stroke={INK} strokeWidth="2" />
        </g>
      );
    case 'scarf':
      return <path d="M46 158 Q100 192 154 158 L154 172 Q100 206 46 172 Z" fill="#E57373" stroke={INK} strokeWidth="2" />;
    case 'heartchain':
      return (
        <g>
          <path d="M54 160 Q100 188 146 160" stroke="#D9A955" strokeWidth="2.5" fill="none" />
          <path d={heart(100, 182, 9)} fill="#E53950" stroke={INK} strokeWidth="1.6" />
        </g>
      );
    case 'pearls':
      return (
        <g fill="#FFFDF7" stroke="#C9B9A6" strokeWidth="1">
          {Array.from({ length: 13 }, (_, i) => {
            const t = i / 12;
            const x = 54 + t * 92;
            const y = 160 + Math.sin(t * Math.PI) * 22;
            return <circle key={i} cx={x} cy={y} r="4.6" />;
          })}
        </g>
      );
    default:
      return null;
  }
}

/* ───── The five legendary skins: light, fire, stars, glints and hearts that move ───── */

function FxDefs({ fx, uid }: { fx: NonNullable<Skin['fx']>; uid: string }) {
  const g = (n: string) => `${n}-${uid}`;
  return (
    <>
      <linearGradient id={g('fx-band')} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="120" y2="40" spreadMethod="reflect">
        {(fx === 'holo' ? ['#FFB3D9', '#FFE9A8', '#B8F5D0', '#A8D8FF', '#D9B8FF'] : ['#ffffff00', '#ffffffcc', '#ffffff00']).map((c, i, a) => (
          <stop key={i} offset={i / (a.length - 1)} stopColor={c.slice(0, 7)} stopOpacity={c.length > 7 ? parseInt(c.slice(7), 16) / 255 : 1} />
        ))}
      </linearGradient>
      <radialGradient id={g('fx-warm')} cx="0.5" cy="1" r="0.75">
        <stop offset="0" stopColor="#FFF3A8" stopOpacity="0.95" />
        <stop offset="0.45" stopColor="#FFB53D" stopOpacity="0.5" />
        <stop offset="1" stopColor="#FF5A2A" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={g('fx-pink')} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#FF7AD9" stopOpacity="0.85" />
        <stop offset="1" stopColor="#FF7AD9" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={g('fx-cyan')} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#5CE1FF" stopOpacity="0.75" />
        <stop offset="1" stopColor="#5CE1FF" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={g('fx-gold')} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FFF4C2" />
        <stop offset="0.5" stopColor="#F2C14E" />
        <stop offset="1" stopColor="#C98A12" />
      </linearGradient>
    </>
  );
}

function FxInside({ fx, uid }: { fx: NonNullable<Skin['fx']>; uid: string }) {
  const u = (n: string) => `url(#${n}-${uid})`;
  if (fx === 'holo')
    return (
      <g className="fx-sweep" style={{ mixBlendMode: 'multiply' }}>
        <rect x="-260" y="50" width="720" height="180" fill={u('fx-band')} opacity="0.55" />
      </g>
    );
  if (fx === 'fire')
    return (
      <>
        <rect className="fx-flicker" x="0" y="60" width="200" height="160" fill={u('fx-warm')} />
        <g className="fx-glint">
          <rect x="40" y="40" width="26" height="200" fill="#FFF6C8" opacity="0.35" transform="rotate(22 53 140)" />
        </g>
      </>
    );
  if (fx === 'nebula')
    return (
      <>
        <g className="fx-orbit">
          <ellipse cx="62" cy="120" rx="58" ry="44" fill={u('fx-pink')} />
          <ellipse cx="142" cy="170" rx="62" ry="46" fill={u('fx-cyan')} />
          <ellipse cx="128" cy="96" rx="30" ry="24" fill={u('fx-pink')} opacity="0.7" />
        </g>
        <g fill="#fff">
          {SPOTS.map(([x, y], i) => (
            <circle key={i} className="fx-twinkle" cx={x + 6} cy={y - 8} r={1.4 + (i % 3) * 0.5} style={{ animationDelay: `${(i * 0.37) % 2.4}s` }} />
          ))}
        </g>
      </>
    );
  if (fx === 'diamond')
    return (
      <>
        <g fill="#fff" opacity="0.28">
          <path d="M30 120 L62 90 L70 132 Z" />
          <path d="M138 90 L170 120 L130 132 Z" />
          <path d="M44 170 L72 150 L80 196 Z" opacity="0.7" />
          <path d="M156 170 L128 150 L120 196 Z" opacity="0.7" />
        </g>
        <g className="fx-glint">
          <rect x="40" y="30" width="22" height="220" fill="#fff" opacity="0.7" transform="rotate(24 51 140)" />
          <rect x="70" y="30" width="7" height="220" fill="#fff" opacity="0.6" transform="rotate(24 73 140)" />
        </g>
      </>
    );
  return <rect className="fx-flicker" x="0" y="60" width="200" height="160" fill="#FFD6E3" opacity="0.35" />;
}

/** Four-pointed sparkle centered on (x, y). */
const sparkle = (x: number, y: number, r: number) => `M${x} ${y - r} Q${x + r * 0.18} ${y - r * 0.18} ${x + r} ${y} Q${x + r * 0.18} ${y + r * 0.18} ${x} ${y + r} Q${x - r * 0.18} ${y + r * 0.18} ${x - r} ${y} Q${x - r * 0.18} ${y - r * 0.18} ${x} ${y - r} Z`;

const AROUND = [
  [22, 92, 8],
  [180, 112, 7],
  [14, 176, 6],
  [188, 186, 9],
  [150, 50, 6],
] as const;

function FxAround({ fx, uid, bare }: { fx: NonNullable<Skin['fx']>; uid: string; bare: boolean }) {
  const u = (n: string) => `url(#${n}-${uid})`;
  const delay = (i: number) => ({ animationDelay: `${i * 0.55}s` });
  if (fx === 'fire')
    return (
      <>
        {bare && (
          <g>
            <path className="fx-flame" d="M86 72 C80 58 88 50 90 40 C96 50 100 58 96 72 Z" fill="#FFB53D" />
            <path className="fx-flame" d="M96 70 C90 52 100 40 102 26 C110 42 114 56 106 70 Z" fill="#FF7A2A" style={{ animationDelay: '0.25s' }} />
            <path className="fx-flame" d="M106 72 C104 60 110 52 114 44 C118 56 118 64 112 72 Z" fill="#FFD25C" style={{ animationDelay: '0.5s' }} />
          </g>
        )}
        {AROUND.map(([x, y, r], i) => (
          <circle key={i} className="fx-rise" cx={x} cy={y + 20} r={r * 0.45} fill={i % 2 ? '#FFB53D' : '#FF6A2A'} style={delay(i)} />
        ))}
      </>
    );
  if (fx === 'love')
    return (
      <g>
        {AROUND.map(([x, y, r], i) => (
          <path key={i} className="fx-rise" d={heart(x, y + 10, r * 1.2)} fill={i % 2 ? '#FF7FA0' : '#C2385A'} style={delay(i)} />
        ))}
      </g>
    );
  // holo, nebula, diamond: sparkles around him, and the unicorn gets its horn
  return (
    <>
      {fx === 'holo' && bare && (
        <g>
          <path d="M92 72 L101 22 L110 72 Z" fill={u('fx-gold')} stroke="#B98316" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M94 62 L108 56 M95.5 52 L106.5 46 M97.5 42 L104.5 37" stroke="#B98316" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M70 76 q-4 -14 8 -18 q-2 10 6 14" fill="#FFB3D9" />
          <path d="M130 76 q4 -14 -8 -18 q2 10 -6 14" fill="#B8D8FF" />
        </g>
      )}
      <g fill={fx === 'nebula' ? '#E7D7FF' : fx === 'diamond' ? '#FFFFFF' : '#FFE7A8'} stroke={fx === 'diamond' ? '#9FD8F5' : 'none'} strokeWidth="0.8">
        {AROUND.map(([x, y, r], i) => (
          <path key={i} className="fx-twinkle" d={sparkle(x, y, r)} style={delay(i)} />
        ))}
      </g>
    </>
  );
}
