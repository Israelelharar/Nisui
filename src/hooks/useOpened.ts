import { useCallback, useSyncExternalStore } from 'react';
import { track, type EventType } from '../lib/events';
import type { Note } from '../content/types';

/**
 * Which notes she has opened ("הפתקים שלי"), plus the one-off notes the admin
 * wrote for a specific day, so they stay after that day ends. Kept on the
 * server (api/opened.ts) so her collection follows her to any browser or
 * phone; localStorage is only a fast first paint and an offline fallback.
 */
const KEY = 'idw:opened';
const CUSTOM_KEY = 'idw:customNotes';
const listeners = new Set<() => void>();
let cache: { ids: string[]; custom: Note[] } | null = null;
let synced = false;
/** the admin's view: shows only what she opened; his own taps are not kept. */
let mirror = false;

function load<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '') as T;
  } catch {
    return fallback;
  }
}
function read() {
  if (!cache) cache = { ids: load<string[]>(KEY, []), custom: load<Note[]>(CUSTOM_KEY, []) };
  return cache;
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache!.ids));
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(cache!.custom));
  } catch {
    /* private mode: the server still has it */
  }
}
const emit = () => listeners.forEach((l) => l());

const push = (ids: string[], notes: Note[] = []) =>
  fetch('/api/opened', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, notes }),
    keepalive: true,
  }).catch(() => {
    /* offline: sent again on the next sync */
  });

/** Merges the server's collection with this device's, and uploads what the server is missing. */
function sync() {
  if (synced) return;
  synced = true;
  fetch('/api/opened')
    .then((r) => (r.ok ? r.json() : null))
    .then((srv: { ids: string[]; custom: Note[]; store?: boolean; mine?: boolean } | null) => {
      if (!srv) return;
      if (srv.store && srv.mine === false) {
        mirror = true;
        cache = { ids: srv.ids, custom: srv.custom };
        try {
          localStorage.removeItem(KEY);
          localStorage.removeItem(CUSTOM_KEY);
        } catch {
          /* nothing stored */
        }
        emit();
        return;
      }
      const cur = read();
      const ids = [...new Set([...srv.ids, ...cur.ids])];
      const custom = [...srv.custom, ...cur.custom.filter((n) => !srv.custom.some((s) => s.id === n.id))];
      if (srv.store) {
        const missingIds = cur.ids.filter((id) => !srv.ids.includes(id));
        const missingNotes = cur.custom.filter((n) => !srv.custom.some((s) => s.id === n.id));
        if (missingIds.length || missingNotes.length) push(missingIds, missingNotes);
      }
      cache = { ids, custom };
      save();
      emit();
    })
    .catch(() => {
      synced = false;
    });
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  sync();
  return () => listeners.delete(cb);
};

export function useOpened() {
  const state = useSyncExternalStore(subscribe, read);
  const markOpened = useCallback((id: string, title?: string, customNote?: Note, event: EventType = 'letter_opened') => {
    const cur = read();
    if (mirror || cur.ids.includes(id)) return;
    cache = { ids: [...cur.ids, id], custom: customNote ? [customNote, ...cur.custom] : cur.custom };
    save();
    push([id], customNote ? [customNote] : []);
    track(event, { title: title ?? id });
    emit();
  }, []);
  return { isOpened: (id: string) => state.ids.includes(id), customNotes: state.custom, markOpened };
}
