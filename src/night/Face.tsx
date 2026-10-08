import { client } from '../client';

/**
 * One of the two faces for the night games (the sheep, the farmer, the road).
 * The client's own round face photo when there is one (`client.faces`),
 * otherwise a small drawn face in the same hand: skin, hair by gender, rosy
 * cheeks, a smile. Draw it inside an SVG that has already clipped the area
 * to (cx, cy) with radius r.
 */
export function Face({ who, cx, cy, r, clip }: { who: 'admin' | 'partner'; cx: number; cy: number; r: number; clip: string }) {
  const photo = client.faces?.[who];
  if (photo) return <image href={photo} x={cx - r * 1.5} y={cy - r * 1.5} width={r * 3} height={r * 3} clipPath={`url(#${clip})`} preserveAspectRatio="xMidYMid slice" />;
  const f = (who === 'admin' ? client.admin : client.partner).gender === 'f';
  const hair = who === 'admin' ? '#3B2418' : '#5A3220';
  const k = r / 12;
  const t = (x: number, y: number) => `${cx + x * k} ${cy + y * k}`;
  return (
    <g clipPath={`url(#${clip})`}>
      <rect x={cx - r * 1.5} y={cy - r * 1.5} width={r * 3} height={r * 3} fill={f ? '#F3CDB4' : '#EDC3A4'} />
      {/* hair: a soft fringe; longer at the sides for her */}
      <path d={`M${t(-14, -2)} Q${t(-13, -15)} ${t(0, -15)} Q${t(13, -15)} ${t(14, -2)} Q${t(6, -9)} ${t(-2, -8)} Q${t(-9, -8)} ${t(-14, -2)} Z`} fill={hair} />
      {f && <path d={`M${t(-14, -3)} Q${t(-15, 8)} ${t(-10, 14)} L${t(-8, 2)} Z M${t(14, -3)} Q${t(15, 8)} ${t(10, 14)} L${t(8, 2)} Z`} fill={hair} />}
      <circle cx={cx - 4.2 * k} cy={cy + 0.5 * k} r={1.5 * k} fill="#2E2226" />
      <circle cx={cx + 4.2 * k} cy={cy + 0.5 * k} r={1.5 * k} fill="#2E2226" />
      <circle cx={cx - 3.7 * k} cy={cy - 0.1 * k} r={0.5 * k} fill="#fff" />
      <circle cx={cx + 4.7 * k} cy={cy - 0.1 * k} r={0.5 * k} fill="#fff" />
      <ellipse cx={cx - 7 * k} cy={cy + 4.5 * k} rx={2.4 * k} ry={1.5 * k} fill="#F08A9C" opacity="0.55" />
      <ellipse cx={cx + 7 * k} cy={cy + 4.5 * k} rx={2.4 * k} ry={1.5 * k} fill="#F08A9C" opacity="0.55" />
      <path d={`M${t(-3, 5)} Q${t(0, 8.5)} ${t(3, 5)}`} stroke="#7A2E3A" strokeWidth={1.3 * k} fill="none" strokeLinecap="round" />
    </g>
  );
}
