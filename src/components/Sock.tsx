import { useLocation } from 'react-router';
import { useApp, useEgg } from '../hooks/useApp';
import { easterEggs } from '../content/story';

/** Her socks show up everywhere. So does this one, on some days, on some pages. */
export function Sock() {
  const { clock } = useApp();
  const { pathname } = useLocation();
  const say = useEgg(easterEggs.sock.lines);
  const pages = ['/', '/us', '/book', '/dates'];
  if (pages[clock.dayIndex % 5] !== pathname) return null; // one page a day, one day in five off
  const left = 12 + ((clock.dayIndex * 37) % 60);
  return (
    <button
      type="button"
      onClick={say}
      aria-label="גרב"
      className="absolute bottom-[96px] rotate-[18deg] opacity-80 transition-transform hover:rotate-[8deg]"
      style={{ left: `${left}%` }}
    >
      <svg width="30" height="36" viewBox="0 0 30 36" aria-hidden>
        <path d="M9 2h10v17c0 2 1 3 3 4l3 2c3 2 3 7-1 9-2 1-4 1-6 0L8 28c-3-2-4-4-4-7V2z" fill="#DDEBFA" stroke="#3F6FB5" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M9 7h10M9 11h10" stroke="#C2385A" strokeWidth="1.6" />
      </svg>
    </button>
  );
}
