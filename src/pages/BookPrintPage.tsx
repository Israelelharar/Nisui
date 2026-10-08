import { useEffect } from 'react';
import { Link, Navigate } from 'react-router';
import { ArrowRight, Printer } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { book, bookParts } from '../content/book';
import { heNum } from '../lib/book';
import { Block, BOOK_PAPER, Ornament } from './BookPage';
import { A, P, p } from '../lib/he';
import { client } from '../client';

/**
 * The whole book as a printable A5 volume (admin only, so the partner doesn't get
 * tomorrow's chapters early): cover, dedication, contents, part pages, and
 * every chapter on a fresh page. "Save as PDF" from the print dialog makes
 * the file; any print shop can bind it.
 */
const PRINT_CSS = `
@page { size: A5; margin: 17mm 15mm 18mm; @bottom-center { content: counter(page); font: 10pt 'Frank Ruhl Libre', serif; color: #7a5f63; } }
@page cover { margin: 0; @bottom-center { content: none; } }
@page front { @bottom-center { content: none; } }
@media print {
  html, body { background: #fff !important; }
  .no-print { display: none !important; }
  .pb-cover { page: cover; height: 210mm; width: 148mm; }
  .pb-front { page: front; }
  .pb-page { break-before: page; }
  .pb-avoid { break-inside: avoid; }
  .pb-book { padding: 0 !important; max-width: none !important; }
  .pb-book figure, .pb-book blockquote { box-shadow: none !important; transform: none !important; }
  /* Quotes stay whole; long chats and letters may continue on the next page, but never mid-bubble or mid-line. */
  .pb-book blockquote, .pb-book figure > div > div, .pb-book figcaption { break-inside: avoid; }
  .pb-book p { orphans: 3; widows: 3; }
}
.pb-book * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
`;

/** "2024 · 2025 · 2026": every year from the first one they share to now. */
const first = Number((client.dates.met ?? client.dates.together).slice(0, 4));
const years = Array.from({ length: Math.min(8, new Date().getFullYear() - first + 1) }, (_, i) => first + i).join(' · ');

export function BookPrintPage() {
  const { viewer } = useApp();
  useEffect(() => {
    const t = document.title;
    document.title = `הסיפור שלנו · ${A} ו${P}`;
    return () => void (document.title = t);
  }, []);
  if (viewer.role === 'partner') return <Navigate to="/book" replace />;

  return (
    <div className="min-h-dvh bg-[#e9dfd3] print:bg-white" style={BOOK_PAPER}>
      <style>{PRINT_CSS}</style>
      <div className="no-print sticky top-0 z-10 flex items-center justify-between gap-2 bg-[#3a2228] px-4 py-3 text-[#f6e7c8]">
        <Link to="/book" className="flex min-h-10 items-center gap-1.5 text-[14px] text-[#f6e7c8] no-underline">
          <ArrowRight size={17} aria-hidden /> לספר
        </Link>
        <button type="button" onClick={() => window.print()} className="flex h-10 items-center gap-2 rounded-full bg-[#f6e7c8] px-4 text-[14px] font-bold text-[#3a2228]">
          <Printer size={16} aria-hidden /> להדפיס / לשמור PDF
        </button>
      </div>
      <p className="no-print mx-auto max-w-[560px] px-5 pt-4 text-[13.5px] text-[#5a4247]">
        בחלון ההדפסה בוחרים ״שמירה כ־PDF״ וגודל דף A5. את הקובץ אפשר לשלוח לכל דפוס ולקבל ספר כרוך אמיתי.
      </p>

      <article className="pb-book mx-auto max-w-[560px] px-4 pb-16 text-ink print:text-[#3a2228]">
        {/* cover */}
        <section className="pb-cover relative mt-4 flex aspect-[148/210] flex-col items-center justify-center overflow-hidden bg-[#6e1a2e] text-center text-[#f2dfb4] print:mt-0 print:aspect-auto">
          <div aria-hidden className="absolute inset-[7%] rounded-[3px] border-[1.5px] border-[#d9b56a]/80" />
          <div aria-hidden className="absolute inset-[8.4%] rounded-[2px] border border-[#d9b56a]/45" />
          <p className="font-hand text-[17px] text-[#e8c98a]">{A} ו{P}</p>
          <h1 className="mt-3 font-serif text-[46px] leading-none font-medium">הסיפור שלנו</h1>
          <svg aria-hidden viewBox="0 0 120 14" className="mt-5 h-3.5 w-28 text-[#d9b56a]">
            <path d="M2 7 H48 M72 7 H118" stroke="currentColor" strokeWidth="1" />
            <path d="M60 2.5c-1.6-2-5-1.2-5 1.6 0 2.6 3.2 4.3 5 6.2 1.8-1.9 5-3.6 5-6.2 0-2.8-3.4-3.6-5-1.6z" fill="currentColor" />
          </svg>
          <p className="mt-5 font-serif text-[15px] text-[#e8c98a]">{years}</p>
        </section>

        {/* dedication */}
        <section className="pb-page pb-front flex min-h-[70vh] flex-col items-center justify-center bg-white px-8 py-16 text-center shadow-paper print:min-h-[170mm] print:shadow-none mt-4 print:mt-0">
          <p className="font-serif text-[22px] leading-relaxed">ל{P},</p>
          <p className="mt-2 font-serif text-[18px] leading-relaxed">{p('הגיבור', 'הגיבורה')} של כל עמוד כאן.</p>
          <p className="mt-6 font-hand text-[18px] text-accent">באהבה, {A}</p>
        </section>

        {/* contents */}
        <section className="pb-page pb-front bg-white px-8 py-10 shadow-paper print:px-0 print:py-0 print:shadow-none mt-4 print:mt-0">
          <h2 className="text-center font-serif text-[24px]">תוכן העניינים</h2>
          {bookParts.map((part) => (
            <div key={part.n} className="pb-avoid mt-5">
              <p className="font-serif text-[16px] text-accent-deep">
                חלק {heNum(part.n)} · {part.title}
              </p>
              <ol className="mt-1">
                {book
                  .filter((c) => c.part === part.n)
                  .map((c) => (
                    <li key={c.id} className="flex items-baseline gap-2 py-0.5 font-serif text-[14.5px]">
                      <span className="w-7 shrink-0 text-muted">{heNum(book.indexOf(c) + 1)}</span>
                      <span>{c.title}</span>
                      <span aria-hidden className="flex-1 translate-y-[-3px] border-b border-dotted border-muted/40" />
                      <span className="shrink-0 text-[12px] text-muted">{c.when}</span>
                    </li>
                  ))}
              </ol>
            </div>
          ))}
        </section>

        {bookParts.map((part) => (
          <div key={part.n}>
            <section className="pb-page flex min-h-[60vh] flex-col items-center justify-center bg-white px-8 py-16 text-center shadow-paper print:min-h-[170mm] print:shadow-none mt-4 print:mt-0">
              <p className="font-serif text-[16px] text-muted">חלק {heNum(part.n)}</p>
              <h2 className="mt-2 font-serif text-[30px] leading-tight text-accent-deep">{part.title}</h2>
              <p className="mt-2 font-hand text-[16px] text-muted">{part.line}</p>
              <Ornament />
            </section>
            {book
              .filter((c) => c.part === part.n)
              .map((c) => (
                <section key={c.id} className="pb-page bg-white px-7 py-10 shadow-paper print:px-0 print:py-0 print:shadow-none mt-4 print:mt-0">
                  <header className="pb-avoid mb-6 text-center">
                    <p className="font-serif text-[15px] text-[#c2385a]">פרק {heNum(book.indexOf(c) + 1)}</p>
                    <h3 className="mt-1 font-serif text-[27px] leading-tight">{c.title}</h3>
                    <p className="mt-1 font-hand text-[14.5px] text-muted">{c.when}</p>
                    <Ornament />
                  </header>
                  <div className="flex flex-col gap-4">
                    {c.blocks.map((b, i) => (
                      <Block key={i} block={b} first={i === 0} full />
                    ))}
                  </div>
                </section>
              ))}
          </div>
        ))}

        <section className="pb-page flex min-h-[50vh] flex-col items-center justify-center bg-white px-8 py-16 text-center shadow-paper print:min-h-[170mm] print:shadow-none mt-4 print:mt-0">
          <p className="font-serif text-[22px]">המשך יבוא</p>
          <p className="mt-2 font-hand text-[16px] text-muted">את הפרקים הבאים כותבים ביחד.</p>
          <Ornament />
        </section>
      </article>
    </div>
  );
}
