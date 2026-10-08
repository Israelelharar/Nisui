/**
 * Meaningful events only. No page views, no scroll, no dwell time. The
 * partner's events become a WhatsApp / e-mail / push message to the admin
 * (api/event.ts passes the text on). The admin's own browsing never notifies.
 */
import { quest } from './quest';
import { P, p } from './he';

export type EventType = 'visit' | 'letter_opened' | 'strength' | 'missing_you' | 'call_request' | 'message' | 'mood' | 'pet_adopted' | 'goodnight' | 'wish' | 'goals' | 'goals_set' | 'chapter_read' | 'voucher';

/** The message the admin gets, in the partner's name and gender. */
const MESSAGES: Record<EventType, (m: Record<string, string>) => string> = {
  visit: () => `❤️ ${P} ${p('נכנס', 'נכנסה')} לאתר`,
  letter_opened: (m) => `💌 ${P} ${p('פתח', 'פתחה')}: ${m.title ?? 'פתק'}`,
  strength: (m) => `🥹 ${P} ${p('לחץ', 'לחצה')} "אני ${p('צריך', 'צריכה')} כוח"${m.label ? ` (${m.label})` : ''}`,
  missing_you: () => `❤️ ${P} ${p('מתגעגע', 'מתגעגעת')}`,
  call_request: () => `📞 ${P} ${p('ביקש', 'ביקשה')} לדבר איתך`,
  message: () => `💬 ${P} ${p('שלח', 'שלחה')} לך הודעה`,
  pet_adopted: (m) => `🐾 ${P} ${p('אימץ', 'אימצה')} חבר קטן ${p('וקרא', 'וקראה')} לו ${m.name ?? 'בשם'}`,
  goodnight: (m) => `🌙 ${P} ${p('אמר', 'אמרה')} לילה טוב ${p('והדליק', 'והדליקה')} כוכב ${m.n ?? ''} בלב שלכם`,
  wish: (m) => `🌠 ${P} ${p('תפס', 'תפסה')} כוכב נופל ${p('וביקש', 'וביקשה')}: "${m.text ?? ''}"`,
  goals: (m) => `✅ ${P} ${p('עמד', 'עמדה')} ב-${m.done ?? '?'} מתוך ${m.total ?? '?'} המטרות להיום`,
  goals_set: (m) => `📝 ${P} ${p('הציב', 'הציבה')} ${m.n ?? ''} מטרות למחר`,
  chapter_read: (m) => `📖 ${P} ${p('קרא', 'קראה')} פרק בספר שלכם: ${m.title ?? ''}`,
  voucher: (m) => `🎟️ ${P} ${p('מימש', 'מימשה')} שובר: ${m.title ?? ''}. הגיע הזמן לקיים!`,
  mood: (m) => `${m.emoji ?? '💭'} ${P} ${p('מרגיש', 'מרגישה')} היום: ${m.label ?? ''}`,
};

/** Which quest counter each event moves (pet/quests.ts). */
const QUEST: Partial<Record<EventType, string>> = {
  letter_opened: 'letter',
  mood: 'mood',
  missing_you: 'reach',
  message: 'reach',
  call_request: 'reach',
  goodnight: 'goodnight',
  wish: 'wish',
  goals_set: 'goals_set',
};

let viewer: 'admin' | 'partner' | null = null;
export const setViewer = (v: typeof viewer) => {
  viewer = v;
};

export function track(type: EventType, meta?: Record<string, string>) {
  if (viewer === 'admin') return;
  const q = QUEST[type];
  if (q) quest(q);
  const clean = Object.fromEntries(Object.entries(meta ?? {}).map(([k, v]) => [k, String(v).slice(0, 80)]));
  const text = MESSAGES[type](clean);
  if (import.meta.env.DEV) console.debug('[event]', type, text);
  fetch('/api/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, text }),
    keepalive: true,
  }).catch(() => {
    /* offline or local dev: nothing to do */
  });
}
