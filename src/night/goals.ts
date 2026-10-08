/**
 * Goals for tomorrow. At night she writes what she wants to do tomorrow; the
 * next night the page first asks "did you do them?" (a tick for each), then
 * asks for the next day's. Kept on her phone, keyed by the content day they
 * belong to.
 */
export interface Goal {
  text: string;
  done: boolean;
}
interface Day {
  goals: Goal[];
  /** She went through them and said how it went. */
  reviewed?: boolean;
}
type Store = Record<string, Day>;

const KEY = 'idw:goals';
export const MAX_GOALS = 5;

function read(): Store {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}
function write(s: Store) {
  try {
    // keep two months, that's plenty
    const keys = Object.keys(s).sort();
    for (const k of keys.slice(0, Math.max(0, keys.length - 60))) delete s[k];
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode */
  }
}

export const nextDate = (iso: string) => new Date(Date.parse(`${iso}T12:00:00Z`) + 86_400_000).toISOString().slice(0, 10);

export const goalsFor = (date: string): Day | null => read()[date] ?? null;

export function setGoals(date: string, texts: string[]) {
  const s = read();
  const old = s[date]?.goals ?? [];
  s[date] = { goals: texts.map((text) => ({ text, done: old.find((g) => g.text === text)?.done ?? false })) };
  write(s);
}

export function review(date: string, done: boolean[]) {
  const s = read();
  const d = s[date];
  if (!d) return;
  d.goals = d.goals.map((g, i) => ({ ...g, done: !!done[i] }));
  d.reviewed = true;
  write(s);
}

/** Days in a row (ending yesterday or today) where she did every goal she set. */
export function streak(today: string) {
  const s = read();
  let n = 0;
  let d = today;
  if (!s[d]?.reviewed) d = new Date(Date.parse(`${d}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  while (s[d]?.reviewed && s[d].goals.length && s[d].goals.every((g) => g.done)) {
    n++;
    d = new Date(Date.parse(`${d}T12:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  }
  return n;
}
