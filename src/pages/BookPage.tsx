import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Link, useSearchParams } from 'react-router';
import { ChevronLeft, Lock, Printer, X } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { useOpened } from '../hooks/useOpened';
import { book, bookParts, type BookBlock, type BookChapter } from '../content/book';
import { chaptersOpen, heNum, minutesToRead } from '../lib/book';
import { getNote } from '../lib/noteById';
import { tap } from '../lib/haptics';
import { KIND_LABEL } from '../components/NoteSheet';
import { A, P } from '../lib/he';

/**
 * "הספר שלנו": the story in chapters, one more every morning. Like a
 * serialized novel (Serial Reader's daily installments): a cover for today's
 * chapter, a real table of contents, a countdown to the next one.
 */
const NAME = { admin: A, partner: P } as const;
/** The book is always cream paper with dark ink, whatever skin the site wears today. */
export const BOOK_PAPER = {
  '--color-ink': '#3a2228',
  '--color-muted': '#7a5f63',
  '--color-accent': '#c2385a',
  '--color-accent-deep': '#a32c4a',
  '--color-paper': '#ffffff',
  '--color-line': '#eedfd5',
  '--color-soft': '#fbe1e6',
  colorScheme: 'light',
} as CSSProperties;
const key = (c: BookChapter) => `book:${c.id}`;

/** Minutes until 05:00 tomorrow, when the next chapter opens. */
function untilNext(hour: number, minute: number) {
  const now = hour * 60 + minute;
  const at = (5 + 24) * 60;
  const left = (at - now) % (24 * 60) || 24 * 60;
  const h = Math.floor(left / 60);
  return h >= 1 ? `בעוד ${h === 1 ? 'שעה' : h === 2 ? 'שעתיים' : `${h} שעות`}` : `בעוד ${left} דקות`;
}

export function BookPage() {
  const { viewer, clock } = useApp();
  const isAdmin = viewer.role === 'admin';
  const open = chaptersOpen(clock.dayIndex, isAdmin);
  const hers = chaptersOpen(clock.dayIndex, false);
  const { isOpened, markOpened } = useOpened();
  const [params, setParams] = useSearchParams();
  const asked = book.find((c) => c.id === params.get('ch'));
  const reading = asked && book.indexOf(asked) < open ? asked : null;
  const today = book[hers - 1];
  const readCount = book.filter((c) => isOpened(key(c))).length;

  const openChapter = (c: BookChapter) => {
    const i = book.indexOf(c);
    if (i >= open) return;
    tap(10);
    setParams({ ch: c.id });
    if (!isAdmin) markOpened(key(c), c.title, undefined, 'chapter_read');
  };
  const close = () => setParams({}, { replace: true });

  return (
    <div className="flex flex-col gap-6">
      <header className="relative">
        <h1 className="font-serif text-[32px] leading-none font-medium">הספר שלנו</h1>
        <p className="mt-2 font-hand text-[15px] text-muted">{A} ו{P} · סיפור בהמשכים · פרק חדש כל בוקר</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-line" aria-hidden>
            <div className="h-full rounded-full bg-accent transition-[width] duration-700" style={{ width: `${(Math.min(open, book.length) / book.length) * 100}%` }} />
          </div>
          <span className="text-xs text-muted tabular-nums">
            {isAdmin ? `${book.length} פרקים · אצל ${P} נפתחו ${hers}` : `${open} מתוך ${book.length}`}
          </span>
        </div>
        {isAdmin && (
          <Link to="/book/print" className="mt-2 inline-flex min-h-9 items-center gap-1.5 text-[13.5px] font-bold text-accent no-underline">
            <Printer size={15} aria-hidden /> הספר כולו, להדפסה או ל־PDF
          </Link>
        )}
      </header>

      <TodayCover chapter={today} isAdmin={isAdmin} read={isOpened(key(today))} onOpen={() => openChapter(today)} />

      {!isAdmin && open < book.length && (
        <p className="-mt-3 text-center font-hand text-sm text-muted">
          הפרק הבא ייפתח {untilNext(clock.hour, clock.minute)} ✨
        </p>
      )}

      <nav aria-label="תוכן העניינים" className="relative rounded-[18px] bg-[#fffaf3] px-5 pt-5 pb-3 text-ink shadow-paper" style={BOOK_PAPER}>
        <div aria-hidden className="paper-grain pointer-events-none absolute inset-0 rounded-[18px]" />
        <h2 className="relative text-center font-serif text-[22px]">תוכן העניינים</h2>
        <p className="relative mb-2 text-center text-xs text-muted">{readCount > 0 ? `${readCount} פרקים כבר נקראו` : 'עוד לא נקרא אף פרק'}</p>
        {bookParts.map((part) => (
          <section key={part.n} className="relative mt-4">
            <h3 className="font-serif text-[17px] text-accent-deep">
              חלק {heNum(part.n)} · {part.title}
            </h3>
            <p className="text-xs text-muted">{part.line}</p>
            <ol className="mt-1.5">
              {book
                .filter((c) => c.part === part.n)
                .map((c) => {
                  const i = book.indexOf(c);
                  const locked = i >= open;
                  const notForHerYet = isAdmin && i >= hers;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => openChapter(c)}
                        disabled={locked}
                        aria-label={locked ? `${c.title}, נפתח בעוד ${i - open + 1} ימים` : c.title}
                        className="group flex min-h-11 w-full items-baseline gap-2 py-1.5 text-right disabled:cursor-default"
                      >
                        <span className="w-8 shrink-0 font-serif text-[15px] text-muted">{heNum(i + 1)}</span>
                        <span className={`min-w-0 font-serif text-[16.5px] leading-snug ${locked ? 'text-muted/70' : 'group-hover:text-accent'}`}>
                          {c.title}
                          {notForHerYet && <span className="mr-1.5 align-middle font-sans text-[11px] text-muted">(עוד לא אצל {P})</span>}
                        </span>
                        <span aria-hidden className="mx-1 min-w-4 flex-1 translate-y-[-3px] border-b border-dotted border-muted/40" />
                        <span className="shrink-0 text-xs text-muted">
                          {locked ? (
                            <span className="inline-flex items-center gap-1">
                              <Lock size={12} aria-hidden /> {i - open + 1 === 1 ? 'מחר' : `בעוד ${i - open + 1}`}
                            </span>
                          ) : isOpened(key(c)) ? (
                            <span className="text-accent">נקרא ✓</span>
                          ) : (
                            `${minutesToRead(c)} דק׳`
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
            </ol>
          </section>
        ))}
      </nav>

      <Reader chapter={reading} open={open} onClose={close} onGo={openChapter} />
    </div>
  );
}

/** Today's chapter as a book cover: the one big thing on the page. */
function TodayCover({ chapter, isAdmin, read, onOpen }: { chapter: BookChapter; isAdmin: boolean; read: boolean; onOpen: () => void }) {
  const n = book.indexOf(chapter) + 1;
  const first = chapter.blocks.find((b): b is Extract<BookBlock, { t: 'p' }> => b.t === 'p')?.text ?? '';
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative block w-full -rotate-[0.7deg] overflow-hidden rounded-[6px_18px_18px_6px] bg-[#7b2338] p-0 text-right text-white shadow-[0_18px_40px_-18px_rgb(80_10_30/0.7)] transition-transform active:scale-[0.98]"
    >
      <span aria-hidden className="cocoa-grain absolute inset-0" />
      <span aria-hidden className="absolute inset-y-0 right-0 w-3 bg-gradient-to-l from-black/30 to-transparent" />
      <span aria-hidden className="absolute inset-3 rounded-[4px_14px_14px_4px] border border-[#e9c88a]/45" />
      <span className="relative block px-7 pt-7 pb-6">
        <span className="block font-hand text-[14px] text-[#f3d9a4]">
          {isAdmin ? `הפרק שנפתח ל${P} היום` : read ? 'הפרק של היום · קראת ✓' : 'הפרק של היום'}
        </span>
        <span className="mt-3 block font-serif text-[15px] text-[#f3d9a4]/90">פרק {heNum(n)}</span>
        <span className="block font-serif text-[30px] leading-tight">{chapter.title}</span>
        <span className="mt-1 block text-[13px] text-white/70">{chapter.when}</span>
        <span className="mt-4 line-clamp-3 block font-serif text-[15.5px] leading-relaxed text-white/85">{first}</span>
        <span className="mt-5 inline-flex h-11 items-center gap-1.5 rounded-full bg-[#f3d9a4] px-5 text-[15px] font-bold text-[#5c1426]">
          {read ? 'לקרוא שוב' : 'לפתוח את הפרק'} <ChevronLeft size={17} aria-hidden />
        </span>
        <span className="mr-3 align-middle text-xs text-white/60">{minutesToRead(chapter)} דקות קריאה</span>
      </span>
    </button>
  );
}

function Reader({ chapter, open, onClose, onGo }: { chapter: BookChapter | null; open: number; onClose: () => void; onGo: (c: BookChapter) => void }) {
  const reduce = useReducedMotion();
  const scroller = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const i = chapter ? book.indexOf(chapter) : -1;
  const next = i >= 0 ? book[i + 1] : undefined;
  const part = chapter ? bookParts.find((p) => p.n === chapter.part) : undefined;

  useEffect(() => {
    if (!chapter) return;
    scroller.current?.scrollTo({ top: 0 });
    setProgress(0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [chapter, onClose]);

  const onScroll = () => {
    const el = scroller.current;
    if (!el) return;
    const p = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
    setProgress(p);
  };

  return createPortal(
    <AnimatePresence>
      {chapter && (
        <motion.div
          key="reader"
          role="dialog"
          aria-modal="true"
          aria-label={chapter.title}
          className="fixed inset-0 z-50 flex justify-center bg-[#2b1a1e]/40 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative flex h-full w-full max-w-[480px] flex-col bg-[#fbf5ec] text-ink"
            style={BOOK_PAPER}
            initial={reduce ? { opacity: 0 } : { y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
          >
            <div aria-hidden className="paper-grain pointer-events-none absolute inset-0" />
            <div className="relative z-10 flex items-center justify-between border-b border-[#ead9c4] bg-[#fbf5ec]/95 px-4 pt-[max(env(safe-area-inset-top),10px)] pb-2.5 backdrop-blur">
              <button type="button" onClick={onClose} aria-label="לסגור את הספר" className="flex size-11 items-center justify-center rounded-full active:bg-black/5">
                <X size={22} aria-hidden />
              </button>
              <span className="truncate px-2 font-serif text-[14px] text-muted">{part?.title}</span>
              <span className="w-11 text-center font-serif text-[14px] text-muted">{heNum(i + 1)}</span>
              <span aria-hidden className="absolute inset-x-0 bottom-0 h-[2px] origin-right bg-accent/70" style={{ transform: `scaleX(${progress})` }} />
            </div>

            <div ref={scroller} onScroll={onScroll} className="relative flex-1 overflow-y-auto overscroll-contain px-6 pb-[calc(env(safe-area-inset-bottom)+40px)]">
              <header className="pt-10 pb-6 text-center">
                <p className="font-serif text-[15px] text-[#c2385a]">פרק {heNum(i + 1)}</p>
                <h2 className="mt-1 font-serif text-[31px] leading-tight font-medium">{chapter.title}</h2>
                <p className="mt-1.5 font-hand text-[14px] text-muted">{chapter.when}</p>
                <Ornament />
              </header>

              <article className="flex flex-col gap-5">
                {chapter.blocks.map((b, k) => (
                  <Block key={k} block={b} first={k === chapter.blocks.findIndex((x) => x.t === 'p')} />
                ))}
              </article>

              <footer className="mt-10 mb-4 text-center">
                <Ornament />
                {chapter.pending && <p className="mt-3 text-sm text-muted">הפרק הזה עוד יגדל.</p>}
                {next ? (
                  i + 1 < open ? (
                    <button
                      type="button"
                      onClick={() => onGo(next)}
                      className="mt-5 inline-flex h-12 items-center gap-1.5 rounded-full bg-accent px-6 font-bold text-white active:scale-[0.97]"
                    >
                      לפרק הבא: {next.title} <ChevronLeft size={18} aria-hidden />
                    </button>
                  ) : (
                    <p className="mt-5 font-hand text-[17px] text-accent-deep">הפרק הבא, "{next.title}", מחכה למחר בבוקר 🌅</p>
                  )
                ) : (
                  <p className="mt-5 font-hand text-[17px] text-accent-deep">סוף. כלומר, בינתיים. ❤️</p>
                )}
                <button type="button" onClick={onClose} className="mt-3 block w-full py-2 text-sm text-muted">
                  חזרה לתוכן העניינים
                </button>
              </footer>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function Ornament() {
  return (
    <svg aria-hidden viewBox="0 0 120 14" className="mx-auto mt-4 h-3.5 w-28 text-accent/60">
      <path d="M2 7 H48 M72 7 H118" stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" />
      <path d="M60 2.5c-1.6-2-5-1.2-5 1.6 0 2.6 3.2 4.3 5 6.2 1.8-1.9 5-3.6 5-6.2 0-2.8-3.4-3.6-5-1.6z" fill="currentColor" />
    </svg>
  );
}

export function Block({ block, first, full }: { block: BookBlock; first: boolean; full?: boolean }) {
  switch (block.t) {
    case 'p':
      return (
        <p className={`font-serif text-[18.5px] leading-[1.8] text-ink ${first ? 'first-letter:float-right first-letter:ml-2 first-letter:font-serif first-letter:text-[52px] first-letter:leading-[0.9] first-letter:text-accent' : ''}`}>
          {block.text}
        </p>
      );
    case 'quote':
      return (
        <blockquote className="relative mx-1 rounded-[14px] bg-white/70 px-5 pt-6 pb-4 shadow-soft">
          <span aria-hidden className="absolute -top-3 right-4 font-serif text-[46px] leading-none text-accent/50">
            ”
          </span>
          <p className="font-serif text-[17.5px] leading-[1.75] whitespace-pre-line">{block.text}</p>
          <footer className="mt-2 font-hand text-[15px] text-accent">— {NAME[block.by]}</footer>
        </blockquote>
      );
    case 'aside':
      return (
        <p className="mx-4 rotate-[-1.2deg] border-t border-dashed border-muted/40 pt-3 font-hand text-[15px] leading-relaxed text-muted">{block.text}</p>
      );
    case 'chat':
      return <ChatBlock lines={block.lines} time={block.time} />;
    case 'note':
      return <LetterBlock id={block.id} full={full} />;
  }
}

function ChatBlock({ lines, time }: { lines: { from: 'admin' | 'partner'; text: string }[]; time?: string }) {
  return (
    <figure className="mx-auto w-full rounded-[18px] bg-[#efe3d3] px-3 py-3">
      {time && <figcaption className="mb-2 text-center text-[11px] text-muted tabular-nums">{time}</figcaption>}
      <div className="flex flex-col gap-1">
        {lines.map((l, k) => {
          const mine = l.from === 'admin';
          const newSpeaker = k === 0 || lines[k - 1].from !== l.from;
          return (
            <div key={k} className={`flex flex-col ${mine ? 'items-start' : 'items-end'} ${newSpeaker && k ? 'mt-1.5' : ''}`}>
              {newSpeaker && <span className="mb-0.5 px-1 text-[11px] text-muted">{NAME[l.from]}</span>}
              <span
                className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-[15.5px] leading-snug whitespace-pre-line shadow-[0_1px_0_rgb(0_0_0/0.06)] ${
                  mine ? 'rounded-tr-md bg-white' : 'rounded-tl-md bg-[#fbd9e1]'
                }`}
              >
                {l.text}
              </span>
            </div>
          );
        })}
      </div>
    </figure>
  );
}

const LONG = 1100;

/** A letter tucked between the pages: its own paper, tape, and handwriting for the signature. */
function LetterBlock({ id, full }: { id: string; full?: boolean }) {
  const note = getNote(id);
  const [more, setMore] = useState(false);
  const long = !full && (note?.body.length ?? 0) > LONG;
  const body = useMemo(() => (note && long && !more ? `${note.body.slice(0, LONG).replace(/\s+\S*$/, '')}…` : note?.body), [note, long, more]);
  if (!note) return null;
  const by = note.author === 'partner' ? P : note.author === 'both' ? 'שניהם' : A;
  return (
    <figure className="relative mx-1 mt-3 rotate-[0.5deg] rounded-[6px] bg-white px-5 pt-7 pb-5 shadow-paper">
      <span aria-hidden className="absolute -top-[10px] right-8 h-[20px] w-[78px] -rotate-6 rounded-[2px] bg-soft/90" />
      <p className="text-[12px] text-muted">
        {KIND_LABEL[note.kind]} של {by}
        {note.writtenOn && ` · ${new Date(`${note.writtenOn}T12:00:00Z`).toLocaleDateString('he-IL')}`}
      </p>
      <p className="mt-0.5 font-serif text-[19px] font-medium">{note.title}</p>
      <p className="mt-3 font-serif text-[17px] leading-[1.75] whitespace-pre-line">{body}</p>
      {long && (
        <button type="button" onClick={() => setMore((m) => !m)} className="mt-2 min-h-11 text-[15px] font-bold text-accent">
          {more ? 'לקצר' : 'להמשיך לקרוא את המכתב'}
        </button>
      )}
    </figure>
  );
}
