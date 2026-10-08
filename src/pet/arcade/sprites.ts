/**
 * Hand-drawn canvas sprites for the arcade, in the same sticker style as the pet's
 * icons: a warm brown outline, flat fills and one white highlight. Everything is
 * drawn around (0, 0) with radius `r`, so games can place and scale them freely.
 */
const INK = '#3B2216';

type Ctx = CanvasRenderingContext2D;

function at(ctx: Ctx, x: number, y: number, r: number, rot: number, draw: () => void) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(r / 20, r / 20);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  draw();
  ctx.restore();
}

const hi = (ctx: Ctx, path: () => void) => {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  path();
  ctx.stroke();
  ctx.restore();
};

export function carrot(ctx: Ctx, x: number, y: number, r: number, rot = 0) {
  at(ctx, x, y, r, rot, () => {
    ctx.strokeStyle = '#3E7A3A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.quadraticCurveTo(-6, -20, -9, -19);
    ctx.moveTo(0, -12);
    ctx.quadraticCurveTo(1, -21, 3, -22);
    ctx.moveTo(0, -12);
    ctx.quadraticCurveTo(6, -18, 10, -17);
    ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-8, -12);
    ctx.quadraticCurveTo(0, -16, 8, -12);
    ctx.quadraticCurveTo(6, 4, 0, 20);
    ctx.quadraticCurveTo(-6, 4, -8, -12);
    ctx.fillStyle = '#F08A2C';
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-5, -4);
    ctx.lineTo(-1, -3);
    ctx.moveTo(2, 4);
    ctx.lineTo(5, 3);
    ctx.lineWidth = 1.6;
    ctx.stroke();
    hi(ctx, () => {
      ctx.moveTo(-4, -9);
      ctx.quadraticCurveTo(-4, 0, -1, 8);
    });
  });
}

export function strawberry(ctx: Ctx, x: number, y: number, r: number, rot = 0) {
  at(ctx, x, y, r, rot, () => {
    ctx.beginPath();
    ctx.moveTo(0, 18);
    ctx.bezierCurveTo(-16, 8, -17, -10, -8, -12);
    ctx.quadraticCurveTo(0, -14, 8, -12);
    ctx.bezierCurveTo(17, -10, 16, 8, 0, 18);
    ctx.fillStyle = '#EE4A5A';
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#FFE7A0';
    for (const [sx, sy] of [
      [-6, -4],
      [2, -6],
      [7, 0],
      [-3, 4],
      [3, 9],
      [-8, 3],
    ])
      ctx.fillRect(sx - 1, sy - 1.5, 2, 3);
    ctx.beginPath();
    ctx.moveTo(-9, -12);
    ctx.lineTo(-3, -15);
    ctx.lineTo(0, -20);
    ctx.lineTo(3, -15);
    ctx.lineTo(9, -12);
    ctx.lineTo(2, -10);
    ctx.lineTo(-2, -10);
    ctx.closePath();
    ctx.fillStyle = '#4FA34A';
    ctx.fill();
    ctx.stroke();
    hi(ctx, () => {
      ctx.moveTo(-10, -4);
      ctx.quadraticCurveTo(-9, 4, -4, 9);
    });
  });
}

export function lettuce(ctx: Ctx, x: number, y: number, r: number, rot = 0) {
  at(ctx, x, y, r, rot, () => {
    // a leafy head: outer ruffled leaves, then lighter ones folding in, a pale heart
    const leaf = (cx: number, cy: number, lr: number, a: number, fill: string) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(0, lr);
      ctx.bezierCurveTo(-lr * 1.1, lr * 0.6, -lr * 1.05, -lr * 0.7, -lr * 0.35, -lr);
      ctx.quadraticCurveTo(-lr * 0.15, -lr * 0.75, 0, -lr * 1.05);
      ctx.quadraticCurveTo(lr * 0.15, -lr * 0.75, lr * 0.35, -lr);
      ctx.bezierCurveTo(lr * 1.05, -lr * 0.7, lr * 1.1, lr * 0.6, 0, lr);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    };
    leaf(-8, 2, 11, -0.9, '#6DBB52');
    leaf(8, 2, 11, 0.9, '#6DBB52');
    leaf(0, -3, 13, 0, '#8FD06A');
    leaf(-4, 4, 9, -0.35, '#B5E48C');
    leaf(4, 4, 9, 0.35, '#B5E48C');
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.lineTo(0, -8);
    ctx.moveTo(0, 2);
    ctx.lineTo(-4, -3);
    ctx.moveTo(0, 6);
    ctx.lineTo(4, 1);
    ctx.stroke();
  });
}

export function apple(ctx: Ctx, x: number, y: number, r: number, rot = 0, color = '#E8434F') {
  at(ctx, x, y, r, rot, () => {
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.bezierCurveTo(-8, -16, -18, -10, -17, 1);
    ctx.bezierCurveTo(-16, 12, -7, 19, 0, 15);
    ctx.bezierCurveTo(7, 19, 16, 12, 17, 1);
    ctx.bezierCurveTo(18, -10, 8, -16, 0, -10);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.quadraticCurveTo(1, -16, 3, -19);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(7, -16, 5, 2.6, -0.5, 0, Math.PI * 2);
    ctx.fillStyle = '#5DB04F';
    ctx.fill();
    ctx.stroke();
    hi(ctx, () => {
      ctx.moveTo(-11, -4);
      ctx.quadraticCurveTo(-12, 3, -8, 8);
    });
  });
}

export function watermelon(ctx: Ctx, x: number, y: number, r: number, rot = 0) {
  at(ctx, x, y, r, rot, () => {
    ctx.beginPath();
    ctx.moveTo(-19, -6);
    ctx.arc(0, -6, 19, 0, Math.PI);
    ctx.closePath();
    ctx.fillStyle = '#4E9E45';
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-15, -6);
    ctx.arc(0, -6, 15, 0, Math.PI);
    ctx.closePath();
    ctx.fillStyle = '#FF5E6E';
    ctx.fill();
    ctx.fillStyle = INK;
    for (const [sx, sy] of [
      [-7, -1],
      [0, 3],
      [7, -1],
      [-3, -3],
      [4, -3],
    ]) {
      ctx.beginPath();
      ctx.ellipse(sx, sy, 1.2, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

export function onion(ctx: Ctx, x: number, y: number, r: number, rot = 0) {
  at(ctx, x, y, r, rot, () => {
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.bezierCurveTo(4, -10, 17, -6, 15, 6);
    ctx.bezierCurveTo(13, 16, -13, 16, -15, 6);
    ctx.bezierCurveTo(-17, -6, -4, -10, 0, -18);
    ctx.fillStyle = '#C98BC9';
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.quadraticCurveTo(-8, 0, -4, 14);
    ctx.moveTo(0, -16);
    ctx.quadraticCurveTo(8, 0, 4, 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-4, 15);
    ctx.lineTo(-5, 19);
    ctx.moveTo(0, 15);
    ctx.lineTo(0, 20);
    ctx.moveTo(4, 15);
    ctx.lineTo(5, 19);
    ctx.stroke();
    // angry little face: it's the bad one
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(-5, 3, 1.6, 0, Math.PI * 2);
    ctx.arc(5, 3, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-8, -1);
    ctx.lineTo(-3, 1);
    ctx.moveTo(8, -1);
    ctx.lineTo(3, 1);
    ctx.stroke();
  });
}

export function coinSprite(ctx: Ctx, x: number, y: number, r: number, spin = 0) {
  const sx = Math.max(0.15, Math.abs(Math.cos(spin)));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(sx, 1);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  const g = ctx.createLinearGradient(-r, -r, r, r);
  g.addColorStop(0, '#FFE69A');
  g.addColorStop(0.5, '#F2C14E');
  g.addColorStop(1, '#C98A1E');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#8A5A12';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(138,90,18,0.55)';
  ctx.stroke();
  ctx.restore();
}

/** A round little alien in one of a few colors, its antenna bobbing with `t`. */
export function alien(ctx: Ctx, x: number, y: number, r: number, kind: number, t: number) {
  const colors = ['#8BD67B', '#B48CF0', '#7EC8F2', '#F59AC0', '#F6C455'];
  const c = colors[kind % colors.length];
  at(ctx, x, y, r, Math.sin(t * 3 + kind) * 0.08, () => {
    const bob = Math.sin(t * 6 + kind) * 2;
    ctx.beginPath();
    ctx.moveTo(-6, -12);
    ctx.lineTo(-9, -19 + bob);
    ctx.moveTo(6, -12);
    ctx.lineTo(9, -19 - bob);
    ctx.stroke();
    ctx.fillStyle = '#FFE38A';
    ctx.beginPath();
    ctx.arc(-9, -19 + bob, 2.6, 0, Math.PI * 2);
    ctx.arc(9, -19 - bob, 2.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, 17, 14, 0, 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();
    ctx.stroke();
    // little legs
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 7, 12);
      ctx.lineTo(i * 8 + Math.sin(t * 10 + i) * 2, 17);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(0, -2, 7, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(Math.sin(t * 2 + kind) * 2, -1, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(Math.sin(t * 2 + kind) * 2 + 1.2, -2.4, 1.1, 0, Math.PI * 2);
    ctx.fill();
    hi(ctx, () => {
      ctx.arc(-6, -4, 10, Math.PI * 1.05, Math.PI * 1.4);
    });
  });
}

export function balloon(ctx: Ctx, x: number, y: number, r: number, color: string, t = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = 'rgba(59,34,22,0.55)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(0, r * 1.15);
  ctx.bezierCurveTo(Math.sin(t * 3) * 6, r * 1.6, -Math.sin(t * 3) * 6, r * 2, 0, r * 2.4);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.88, r, 0, 0, Math.PI * 2);
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.1);
  g.addColorStop(0, 'rgba(255,255,255,0.75)');
  g.addColorStop(0.25, color);
  g.addColorStop(1, color);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-3, r * 0.98);
  ctx.lineTo(3, r * 0.98);
  ctx.lineTo(0, r * 1.16);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

/** A round black bomb with a sparkling fuse. */
export function bomb(ctx: Ctx, x: number, y: number, r: number, t = 0) {
  at(ctx, x, y, r, 0, () => {
    ctx.beginPath();
    ctx.arc(0, 3, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#3A3340';
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#6A6270';
    ctx.fillRect(-4, -15, 8, 5);
    ctx.strokeRect(-4, -15, 8, 5);
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.quadraticCurveTo(5, -21, 9, -19);
    ctx.strokeStyle = '#B98A55';
    ctx.stroke();
    const s = 3 + Math.sin(t * 30) * 1.5;
    ctx.fillStyle = '#FFD45C';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      const rr = i % 2 ? s * 0.5 : s * 1.4;
      ctx.lineTo(9 + Math.cos(a) * rr, -19 + Math.sin(a) * rr);
    }
    ctx.fill();
    hi(ctx, () => {
      ctx.arc(0, 3, 10, Math.PI * 1.1, Math.PI * 1.5);
    });
  });
}

/** A soft cloud of overlapping circles. */
export function cloud(ctx: Ctx, x: number, y: number, w: number, alpha = 0.9) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#FFFFFF';
  const h = w * 0.32;
  ctx.beginPath();
  ctx.arc(x - w * 0.25, y, h * 0.7, 0, Math.PI * 2);
  ctx.arc(x, y - h * 0.35, h, 0, Math.PI * 2);
  ctx.arc(x + w * 0.27, y, h * 0.75, 0, Math.PI * 2);
  ctx.rect(x - w * 0.25, y, w * 0.52, h * 0.7);
  ctx.fill();
  ctx.restore();
}

/** The fruit she slices: one of these, chosen by `kind`. */
export const FRUITS = [
  (ctx: Ctx, x: number, y: number, r: number, rot: number) => apple(ctx, x, y, r, rot),
  (ctx: Ctx, x: number, y: number, r: number, rot: number) => watermelon(ctx, x, y, r, rot),
  (ctx: Ctx, x: number, y: number, r: number, rot: number) => strawberry(ctx, x, y, r, rot),
  (ctx: Ctx, x: number, y: number, r: number, rot: number) => carrot(ctx, x, y, r, rot),
  (ctx: Ctx, x: number, y: number, r: number, rot: number) => apple(ctx, x, y, r, rot, '#9BD45A'),
  (ctx: Ctx, x: number, y: number, r: number, rot: number) => lettuce(ctx, x, y, r, rot),
];
export const FRUIT_JUICE = ['#E8434F', '#FF5E6E', '#EE4A5A', '#F08A2C', '#9BD45A', '#8FD06A'];

/** A round rounded-rect helper. */
export function rrect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
