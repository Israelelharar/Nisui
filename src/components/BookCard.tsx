import { Link } from 'react-router';
import { useApp } from '../hooks/useApp';
import { useOpened } from '../hooks/useOpened';
import { book } from '../content/book';
import { bookFinished, chaptersOpen, heNum } from '../lib/book';
import { pickDaily } from '../lib/daily';
import { has } from '../client';
import { P } from '../lib/he';

/** Home: today's chapter of "הספר שלנו", like a bookmark sticking out of the page. */
export function BookCard() {
  const { clock, viewer } = useApp();
  const { isOpened } = useOpened();
  const isAdmin = viewer.role === 'admin';
  if (!has('book')) return null;
  if (!book.length) return null;
  const again = bookFinished(clock.dayIndex);
  const c = again ? pickDaily(book, clock.dayIndex, 'book-again') : book[chaptersOpen(clock.dayIndex, false) - 1];
  const n = book.indexOf(c) + 1;
  const read = isOpened(`book:${c.id}`);
  return (
    <Link to="/book" className="relative flex items-center gap-3 overflow-hidden rounded-[22px] bg-[#7b2338] px-4 py-3.5 text-white no-underline shadow-soft">
      <span aria-hidden className="cocoa-grain absolute inset-0" />
      <span aria-hidden className="relative flex h-14 w-11 shrink-0 flex-col items-center justify-center rounded-[3px_8px_8px_3px] border border-[#e9c88a]/60 font-serif text-[17px] text-[#f3d9a4]">
        {heNum(n)}
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block text-xs font-bold text-[#f3d9a4]">
          {again ? (isAdmin ? `הפרק שחוזר היום ל${P}` : 'הספר שלנו · פרק לקרוא שוב 📖') : isAdmin ? `הפרק שנפתח ל${P} היום בספר` : read ? 'הספר שלנו · קראת את הפרק של היום ✓' : 'הספר שלנו · פרק חדש נפתח לך 📖'}
        </span>
        <span className="block truncate font-serif text-lg">{c.title}</span>
      </span>
      <span aria-hidden className="relative text-[#f3d9a4]">←</span>
    </Link>
  );
}
