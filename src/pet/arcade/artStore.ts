/**
 * Her gallery. On the real site it lives on the server (api/art.ts) so it
 * follows her to any phone, and so a dedication reaches the admin. Without a
 * server (a preview, or no store) it falls back to this browser.
 */
export interface Art {
  id: string;
  title: string;
  at: number;
  dedicated?: number;
  note?: string;
  /** Where to load the picture from. */
  src: string;
}

const LOCAL = 'idw:art';
type LocalArt = Omit<Art, 'src'> & { img: string };

const readLocal = (): LocalArt[] => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL) ?? '[]') as LocalArt[];
  } catch {
    return [];
  }
};
const writeLocal = (a: LocalArt[]) => {
  try {
    localStorage.setItem(LOCAL, JSON.stringify(a.slice(0, 24)));
  } catch {
    /* full: the newest still shows this session */
  }
};
const fromLocal = (a: LocalArt): Art => ({ id: a.id, title: a.title, at: a.at, dedicated: a.dedicated, note: a.note, src: a.img });
const fromServer = (a: Omit<Art, 'src'>): Art => ({ ...a, src: `/api/art?img=${a.id}` });

let server: boolean | null = null;

export async function listArt(): Promise<Art[]> {
  try {
    const r = await fetch('/api/art?list=1');
    if (r.ok && (r.headers.get('content-type') ?? '').includes('json')) {
      server = true;
      const { art } = (await r.json()) as { art: Omit<Art, 'src'>[] };
      return [...art.map(fromServer), ...readLocal().map(fromLocal)];
    }
  } catch {
    /* offline or preview */
  }
  server = false;
  return readLocal().map(fromLocal);
}

export async function saveArt(img: string, title: string, dedicate: boolean, note: string): Promise<Art> {
  if (server !== false) {
    try {
      const r = await fetch('/api/art', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ art: { img, title, dedicate, note } }) });
      if (r.ok) return fromServer(((await r.json()) as { art: Omit<Art, 'src'> }).art);
    } catch {
      /* fall back */
    }
  }
  const a: LocalArt = { id: `l${Date.now().toString(36)}`, title: title || 'ציור', at: Date.now(), img, dedicated: dedicate ? Date.now() : undefined, note: note || undefined };
  writeLocal([a, ...readLocal()]);
  return fromLocal(a);
}

export async function dedicateArt(id: string, note: string): Promise<boolean> {
  if (id.startsWith('l')) {
    writeLocal(readLocal().map((a) => (a.id === id ? { ...a, dedicated: Date.now(), note: note || a.note } : a)));
    return true;
  }
  try {
    const r = await fetch('/api/art', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dedicate: { id, note } }) });
    return r.ok;
  } catch {
    return false;
  }
}

export async function deleteArt(id: string) {
  if (id.startsWith('l')) return writeLocal(readLocal().filter((a) => a.id !== id));
  await fetch(`/api/art?id=${id}`, { method: 'DELETE' }).catch(() => {});
}

/** Admin: drawings she dedicated that he hasn't seen yet. */
export async function unseenGifts(): Promise<Art[]> {
  try {
    const r = await fetch('/api/art?gifts=1');
    if (!r.ok) return [];
    const { gifts } = (await r.json()) as { gifts: Omit<Art, 'src'>[] };
    return gifts.map(fromServer);
  } catch {
    return [];
  }
}

export async function markSeen(id: string) {
  await fetch('/api/art', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ seen: id }) }).catch(() => {});
}
