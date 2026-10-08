import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { SkinSetting } from '../lib/skins';
import type { DayOverride, Slot, WeekendMode } from '../content/types';
import { nicknames } from '../content/daily';
import { getClock, getSlot, type Clock } from '../lib/time';
import { getWeekendMode } from '../lib/weekend';
import { pickDaily } from '../lib/daily';
import { setViewer } from '../lib/events';
import { client } from '../client';

export type SheetName = 'strength' | 'contact' | null;
export type Settings = { nextMeeting?: { date: string; label?: string }; skin?: SkinSetting };
export type Viewer = {
  role: 'admin' | 'partner' | null;
  launchDate?: string | null;
  settings?: Settings;
  notify?: Record<string, boolean>;
  store?: boolean;
};

interface AppState {
  viewer: Viewer;
  /** the admin's edits for today, if any. */
  day: DayOverride | null;
  clock: Clock;
  /** Content day on which the daily notes/photos started (her first login). */
  launchDay: number;
  slot: Slot;
  nickname: string;
  weekend: WeekendMode | null;
  sheet: SheetName;
  openSheet: (s: Exclude<SheetName, null>) => void;
  closeSheet: () => void;
  toast: string | null;
  showToast: (text: string) => void;
  /** the admin's settings (next meeting…). */
  settings: Settings;
  setSettings: (s: Settings) => void;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [clock, setClock] = useState(() => getClock());
  const [sheet, setSheet] = useState<SheetName>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const [viewer, setViewerState] = useState<Viewer>({ role: null });

  // Who is looking (from the session cookie). the admin's visits never notify.
  useEffect(() => {
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : { role: null }))
      .then((v: Viewer) => {
        setViewer(v.role);
        setViewerState(v);
      })
      .catch(() => {});
  }, []);

  // the admin's edits for the current content day (a day starts at 05:00).
  const [day, setDay] = useState<DayOverride | null>(null);
  useEffect(() => {
    let alive = true;
    fetch(`/api/day?date=${clock.contentDate}`)
      .then((r) => (r.ok ? r.json() : { override: null }))
      .then((d: { date?: string; override: DayOverride | null }) => alive && setDay(d.date === clock.contentDate ? (d.override ?? null) : null))
      .catch(() => alive && setDay(null));
    return () => {
      alive = false;
    };
  }, [clock.contentDate]);

  // Re-evaluate once a minute so the greeting follows her day.
  useEffect(() => {
    const id = window.setInterval(() => setClock(getClock()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const showToast = useCallback((text: string) => {
    window.clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  const value = useMemo<AppState>(
    () => ({
      viewer,
      day,
      clock,
      launchDay: Math.floor(Date.parse(`${viewer.launchDate ?? client.launchDate ?? '2026-01-01'}T00:00:00Z`) / 86_400_000),
      slot: getSlot(clock),
      nickname: pickDaily(nicknames, clock.dayIndex, 'nickname'),
      weekend: day?.weekend ? (day.weekend === 'none' ? null : day.weekend) : getWeekendMode(clock),
      sheet,
      openSheet: setSheet,
      closeSheet: () => setSheet(null),
      toast,
      showToast,
      settings: viewer.settings ?? {},
      setSettings: (settings: Settings) => setViewerState((v) => ({ ...v, settings })),
    }),
    [viewer, day, clock, sheet, toast, showToast],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside AppProvider');
  return v;
}

/** Cycles through an easter egg's lines on each call. */
export function useEgg(lines: string[]) {
  const { showToast } = useApp();
  const i = useRef(0);
  return useCallback(() => {
    showToast(lines[i.current % lines.length]);
    i.current += 1;
  }, [lines, showToast]);
}
