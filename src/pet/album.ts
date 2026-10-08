import { rooms } from './catalog';

/**
 * The pig's photo album. A photo is drawn from what is on screen (the room
 * and the pig in his outfit), framed as a polaroid with his name and the day,
 * and saved on the server (api/pet.ts) so it follows her to any phone. If the
 * server can't keep it, the photo stays on this device.
 */
export interface PhotoMeta {
  id: string;
  caption: string;
  at: number;
  /** Photos kept only on this device carry their image here. */
  local?: string;
}

const LOCAL = 'idw:petPhotos';

function loadLocal(): PhotoMeta[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL) ?? '[]') as PhotoMeta[];
  } catch {
    return [];
  }
}
function saveLocal(list: PhotoMeta[]) {
  try {
    localStorage.setItem(LOCAL, JSON.stringify(list.slice(0, 30)));
  } catch {
    /* full: the newest ones win next time */
  }
}

export const photoSrc = (p: PhotoMeta) => p.local ?? `/api/pet?photo=${p.id}`;

export async function listPhotos(): Promise<PhotoMeta[]> {
  const local = loadLocal();
  try {
    const r = await fetch('/api/pet?photos=1');
    if (!r.ok) return local;
    const { photos } = (await r.json()) as { photos: PhotoMeta[] };
    return [...local, ...photos].sort((a, b) => b.at - a.at);
  } catch {
    return local;
  }
}

/** Saves to the server; falls back to this device. `keepLocal` skips the server (the admin's sandbox). */
export async function savePhoto(img: string, caption: string, keepLocal: boolean): Promise<PhotoMeta> {
  if (!keepLocal) {
    try {
      const r = await fetch('/api/pet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ photo: { img, caption } }) });
      if (r.ok) return ((await r.json()) as { photo: PhotoMeta }).photo;
    } catch {
      /* offline: keep it here */
    }
  }
  const meta: PhotoMeta = { id: `l${Date.now().toString(36)}`, caption, at: Date.now(), local: img };
  saveLocal([meta, ...loadLocal()]);
  return meta;
}

export async function deletePhoto(p: PhotoMeta) {
  if (p.local) return saveLocal(loadLocal().filter((x) => x.id !== p.id));
  await fetch(`/api/pet?photo=${p.id}`, { method: 'DELETE' });
}

function svgImage(svg: SVGSVGElement, w: number, h: number): Promise<HTMLImageElement> {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
  return new Promise((ok, fail) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = fail;
    img.src = src;
  });
}

/** Draws the room as it is on screen, the pig(s) included, into a polaroid. Returns a JPEG data URL. */
export async function capture(roomEl: HTMLElement, opts: { room: string; title: string; subtitle: string; focus?: DOMRect }): Promise<string> {
  const W = 720;
  const PAD = 36;
  const P = W - PAD * 2;
  const H = PAD + P + 150;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;

  // paper
  g.fillStyle = '#FFFBF3';
  g.fillRect(0, 0, W, H);

  const box = roomEl.getBoundingClientRect();
  const k = Math.max(P / box.width, P / box.height);
  // Centered on him (the room is tall now), but never past the room's edges.
  const fx = opts.focus ? opts.focus.left + opts.focus.width / 2 - box.left : box.width / 2;
  const fy = opts.focus ? opts.focus.top + opts.focus.height * 0.5 - box.top : box.height / 2;
  const fit = (o: number, size: number) => Math.min(PAD, Math.max(PAD + P - size * k, o));
  const ox = fit(PAD + P / 2 - fx * k, box.width);
  const oy = fit(PAD + P / 2 - fy * k, box.height);
  const place = (r: DOMRect) => ({ x: ox + (r.left - box.left) * k, y: oy + (r.top - box.top) * k, w: r.width * k, h: r.height * k });

  g.save();
  g.beginPath();
  g.rect(PAD, PAD, P, P);
  g.clip();

  // the room
  const scene = roomEl.querySelector<SVGSVGElement>('svg[data-scene]');
  if (scene) {
    const img = await svgImage(scene, box.width, box.height);
    g.drawImage(img, ox, oy, box.width * k, box.height * k);
  } else {
    const r = rooms[opts.room] ?? rooms.cozy;
    const stops = [...r.bg.matchAll(/(#[0-9a-f]{6})\s+(\d+)%/gi)];
    const grad = g.createLinearGradient(0, oy, 0, oy + box.height * k);
    for (const [, col, at] of stops) grad.addColorStop(Number(at) / 100, col);
    g.fillStyle = stops.length ? grad : '#FDE3D3';
    g.fillRect(PAD, PAD, P, P);
    g.fillStyle = r.floor;
    g.fillRect(PAD, oy + box.height * k * 0.76, P, P);
    for (const el of roomEl.querySelectorAll<HTMLElement>('[data-decor]')) {
      const p = place(el.getBoundingClientRect());
      g.font = `${p.h * 0.9}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(el.textContent ?? '', p.x + p.w / 2, p.y + p.h / 2);
    }
  }

  // the pig(s), in their outfit
  for (const svg of roomEl.querySelectorAll<SVGSVGElement>('svg.pig')) {
    const p = place(svg.getBoundingClientRect());
    g.fillStyle = 'rgb(40 20 10 / 0.25)';
    g.beginPath();
    g.ellipse(p.x + p.w / 2, p.y + p.h * 0.97, p.w * 0.32, p.h * 0.04, 0, 0, Math.PI * 2);
    g.fill();
    const img = await svgImage(svg, svg.getBoundingClientRect().width, svg.getBoundingClientRect().height);
    g.drawImage(img, p.x, p.y, p.w, p.h);
  }

  // a soft vignette, like a real little camera
  const vig = g.createRadialGradient(W / 2, PAD + P / 2, P * 0.35, W / 2, PAD + P / 2, P * 0.75);
  vig.addColorStop(0, 'rgb(0 0 0 / 0)');
  vig.addColorStop(1, 'rgb(40 20 10 / 0.35)');
  g.fillStyle = vig;
  g.fillRect(PAD, PAD, P, P);
  g.restore();

  // caption
  g.direction = 'rtl';
  g.textAlign = 'center';
  g.fillStyle = '#3A2A20';
  g.font = '600 42px "Playpen Sans Hebrew", "Assistant", sans-serif';
  g.fillText(opts.title, W / 2, PAD + P + 66);
  g.fillStyle = '#8A6F62';
  g.font = '400 26px "Assistant", sans-serif';
  g.fillText(opts.subtitle, W / 2, PAD + P + 112);

  return c.toDataURL('image/jpeg', 0.86);
}
