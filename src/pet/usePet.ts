import { useSyncExternalStore } from 'react';
import { lateNotices, normalize, tick, type Gift, type Notice, type PetState } from './engine';
import { bump, ensurePlan, findFriend, planDue, type FriendId } from './quests';

/**
 * The guinea pig lives on the server (api/pet.ts) so he follows the partner to
 * any phone; localStorage is the fast first paint and the offline copy.
 * The admin sees the pet as it is. Whatever the admin does to it stays on their screen
 * (a sandbox), so he can never mess up hers.
 */
const KEY = 'idw:pet';
const listeners = new Set<() => void>();

interface Snap {
  pet: PetState | null;
  gifts: Gift[];
  /** The admin looking at the partner's pet: nothing is saved. */
  mirror: boolean;
  synced: boolean;
  /** The server couldn't be reached and this device has no copy: never offer a new adoption then. */
  failed: boolean;
}

function loadLocal(): PetState | null {
  try {
    return normalize(JSON.parse(localStorage.getItem(KEY) ?? 'null'));
  } catch {
    return null;
  }
}

let snap: Snap = { pet: loadLocal(), gifts: [], mirror: false, synced: false, failed: false };
let started = false;
let saveTimer: number | undefined;
let dirty = false;

const emit = () => listeners.forEach((l) => l());
const set = (patch: Partial<Snap>) => {
  snap = { ...snap, ...patch };
  emit();
};

function saveLocal(p: PetState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* private mode: the server still has it */
  }
}

function pushNow() {
  window.clearTimeout(saveTimer);
  if (!dirty || snap.mirror || !snap.pet) return;
  dirty = false;
  fetch('/api/pet', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pet: snap.pet }),
    keepalive: true,
  })
    .then(async (r) => {
      // Another device saved a newer copy: that one wins.
      if (r.status === 409) {
        const srv = normalize(((await r.json()) as { pet?: unknown }).pet);
        if (srv) {
          saveLocal(srv);
          set({ pet: srv });
        }
      }
    })
    .catch(() => {
      dirty = true;
    });
}

function schedulePush() {
  dirty = true;
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(pushNow, 1500);
}

function start() {
  if (started) return;
  started = true;
  window.addEventListener('pagehide', pushNow);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && pushNow());
  load();
}

/** Tries the server again (the "try again" button when it couldn't be reached). */
export function resync() {
  set({ synced: false, failed: false });
  load();
}

function load() {
  // Never leave the page waiting on a slow server: after 8s the local copy is used.
  fetch('/api/pet', { signal: AbortSignal.timeout(8000) })
    // In local dev there is no API at all: play on this device.
    .then((r) => (r.ok && r.headers.get('content-type')?.includes('json') ? r.json() : import.meta.env.DEV ? { pet: null, store: false } : null))
    .then((srv: { pet: unknown; gifts?: Gift[]; store?: boolean; mine?: boolean } | null) => {
      if (!srv) return set({ synced: true, failed: !snap.pet });
      const remote = normalize(srv.pet);
      if (srv.store && srv.mine === false) return set({ pet: remote, gifts: srv.gifts ?? [], mirror: true, synced: true });
      const local = snap.pet;
      // The server's pig wins if it is newer, or if this device holds a different pig altogether.
      if (remote && (!local || remote.adoptedAt !== local.adoptedAt || remote.savedAt > local.savedAt)) {
        saveLocal(remote);
        set({ pet: remote, gifts: srv.gifts ?? [], synced: true });
      } else {
        set({ gifts: srv.gifts ?? [], synced: true });
        if (local && srv.store && (!remote || local.savedAt > remote.savedAt)) schedulePush();
      }
    })
    .catch(() => set({ synced: true, failed: !snap.pet }));
}

/* ───── Quests from anywhere on the site ───── */

/** Things that happened before the pig was loaded on this device. */
const waiting: [string, number][] = [];

function announce(notices: Notice[]) {
  // The last one is the one worth reading (a finished step beats the coins line).
  const n = [...notices].reverse().find((x) => x.big) ?? notices[notices.length - 1];
  if (n) window.dispatchEvent(new CustomEvent('pet:notice', { detail: n.text }));
}

/** Counts a site-wide quest event (a letter opened, a sheep game finished…). Silent for the admin. */
export function record(key: string, by = 1) {
  start();
  if (snap.mirror) return;
  if (!snap.pet) {
    waiting.push([key, by]);
    return;
  }
  announce(act((p, out) => bump(p, key, by, out)).notices);
}

/** She found one of the hidden friends. Returns false if it was already found. */
export function recordFind(id: FriendId) {
  if (snap.mirror || !snap.pet) return false;
  const { result, notices } = act((p, out) => findFriend(p, id, out));
  announce(notices);
  return !!result;
}

/** Hands out a new daily adventure when one is due (only on her side). */
export function ensureTodayPlan(today: string) {
  if (snap.mirror || !snap.pet || !today || !planDue(snap.pet, today)) return;
  act((p) => ensurePlan(p, today));
}

function flushWaiting() {
  if (!snap.pet || snap.mirror || !waiting.length) return;
  const all = waiting.splice(0);
  announce(act((p, out) => all.forEach(([k, by]) => bump(p, k, by, out))).notices);
}
listeners.add(flushWaiting);

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  start();
  return () => listeners.delete(cb);
};

/** Runs one change on a fresh copy of the pig (time advanced first), then saves it. */
export function act<R>(fn: (p: PetState, out: Notice[]) => R): { result: R | undefined; notices: Notice[] } {
  const out: Notice[] = [];
  if (!snap.pet) return { result: undefined, notices: out };
  const p = structuredClone(snap.pet);
  tick(p);
  const result = fn(p, out);
  out.push(...lateNotices.splice(0));
  p.savedAt = Date.now();
  if (!snap.mirror) {
    saveLocal(p);
    schedulePush();
  }
  set({ pet: p });
  return { result, notices: out };
}

export function setPet(p: PetState) {
  if (!snap.mirror) {
    saveLocal(p);
    schedulePush();
  }
  set({ pet: p });
}

/** Admin only: a gift that waits in the pet's room until she opens it. */
export async function sendGift(gift: { coins: number; note?: string; food?: string }) {
  const r = await fetch('/api/pet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ gift }) });
  if (!r.ok) throw new Error(String(r.status));
  const { gifts } = (await r.json()) as { gifts: Gift[] };
  set({ gifts });
}

export interface Backup {
  date: string;
  level: number;
  coins: number;
  name: string;
}

/** Admin only: the daily snapshots of the pet. */
export async function listBackups(): Promise<Backup[]> {
  const r = await fetch('/api/pet?backups=1');
  return r.ok ? ((await r.json()) as { backups: Backup[] }).backups : [];
}

/** Admin only: brings the pet back to how it was on that day. */
export async function restoreBackup(date: string) {
  const r = await fetch('/api/pet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ restore: date }) });
  if (!r.ok) throw new Error(String(r.status));
  const pet = normalize(((await r.json()) as { pet: unknown }).pet);
  if (pet) set({ pet });
}

export const usePet = () => useSyncExternalStore(subscribe, () => snap);
