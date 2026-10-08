import { quest } from '../lib/quest';
import { EndFriend } from '../components/Friends';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Flame } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { timeline, places, futurePlans, words, phrases, easterEggs, todayLines, chapterMemories, ourWords, storyInWords, wordsOrigin } from '../content/story';
import { Translator } from '../components/Translator';
import { photoById } from '../content/photos';
import { photosFor } from '../lib/photoOfDay';
import type { Photo, PhotoCategory } from '../content/types';
import { pickDaily, pickManyDaily } from '../lib/daily';
import { Paper, SectionTitle } from '../components/Paper';
import { PhotoImg } from '../components/PhotoImg';
import { Lightbox } from '../components/Lightbox';
import { Sheet } from '../components/Sheet';
import { daysSince, nextMilestone } from '../lib/specialDays';
import { PlacesMap } from '../components/PlacesMap';
import { Playlist } from '../components/Playlist';
import { BookCard } from '../components/BookCard';
import { MessageClock } from '../components/MessageClock';
import { LettersTab } from './LettersTab';
import { client, has } from '../client';
import { A, P, a, p } from '../lib/he';

const ALL_TABS = [
  { id: 'story', label: 'הסיפור', on: has('story') },
  { id: 'letters', label: `מה ש${A} ${a('כתב', 'כתבה')} לי`, wide: true, on: has('letters') || has('surprises') || has('openWhen') || has('vouchers') },
  { id: 'gallery', label: 'גלריה', on: has('gallery') },
  { id: 'places', label: 'מקומות', on: has('places') },
  { id: 'music', label: 'השירים שלנו', on: has('music') },
  { id: 'future', label: 'עוד נעשה', on: has('future') },
  { id: 'words', label: 'המילון', on: has('words') },
] as const;
type Tab = (typeof ALL_TABS)[number]['id'];
/** Only the tabs this client has. */
export const TABS = ALL_TABS.filter((t) => t.on);
/** "אנחנו" has something to show at all (else it's left out of the menu). */
export const hasUsPage = TABS.length > 0;

export function UsPage() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.id === params.get('tab'))?.id ?? TABS[0]?.id ?? 'story') as Tab;
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const { clock } = useApp();
  useEffect(() => {
    if (tab === 'gallery') quest('gallery');
  }, [tab]);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-serif text-[30px] font-medium">אנחנו</h1>
        <p className="text-[15px] text-muted">הסיפור שלנו, וכל מה שעוד נכתוב.</p>
        <dl className={`mt-3 grid gap-2.5 ${client.dates.met ? 'grid-cols-2' : ''}`}>
          {client.dates.met && (
            <div className="rounded-2xl bg-paper px-4 py-3 shadow-soft">
              <dt className="text-xs text-muted">מכירים</dt>
              <dd className="m-0 font-serif text-2xl">{daysSince(client.dates.met, clock).toLocaleString('he-IL')} ימים</dd>
            </div>
          )}
          <div className="rounded-2xl bg-soft px-4 py-3">
            <dt className="text-xs text-muted">ביחד</dt>
            <dd className="m-0 font-serif text-2xl">{daysSince(client.dates.together, clock).toLocaleString('he-IL')} ימים</dd>
          </div>
        </dl>
        <p className="mt-2 text-center font-hand text-sm text-muted">
          {(() => {
            const m = nextMilestone(clock);
            return m.in === 1 ? `מחר: ${m.days.toLocaleString('he-IL')} ימים ביחד 🎉` : `עוד ${m.in} ימים נחגוג ${m.days.toLocaleString('he-IL')} ימים ביחד 🎉`;
          })()}
        </p>
      </header>

      {TABS.length > 1 && (
      <div role="tablist" aria-label="אנחנו" className="grid grid-cols-4 gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setParams(t.id === TABS[0].id ? {} : { tab: t.id }, { replace: true })}
            className={`h-10 rounded-full px-2 text-[14px] whitespace-nowrap transition-colors ${'wide' in t ? 'col-span-2' : ''} ${
              tab === t.id ? 'bg-accent font-bold text-white' : 'bg-paper shadow-soft'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      )}

      <div role="tabpanel">
        {tab === 'story' && <Story onPhoto={setLightbox} />}
        {tab === 'letters' && <LettersTab />}
        {tab === 'gallery' && <Gallery onPhoto={setLightbox} />}
        {tab === 'places' && <Places onPhoto={setLightbox} />}
        {tab === 'music' && <Playlist />}
        {tab === 'future' && <Future />}
        {tab === 'words' && <Words />}
      </div>

      <EndFriend id="girl" size={104} />

      <Lightbox photo={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}

function Story({ onPhoto }: { onPhoto: (p: Photo) => void }) {
  const [askWinner, setAskWinner] = useState(false);
  const { showToast, clock } = useApp();
  const firstFuture = timeline.findIndex((c) => c.future);
  const [flash, setFlash] = useState(false);

  // Each day: a new line for "היום", and one past chapter in the spotlight
  // (on a chapter's anniversary, that one).
  const daily = useMemo(() => {
    const mmdd = clock.contentDate.slice(5);
    const anniv = timeline.find((c) => c.date && !c.future && c.date.slice(5) === mmdd && c.date.slice(0, 4) < clock.contentDate.slice(0, 4));
    const pool = timeline.filter((c) => chapterMemories[c.id]);
    const chapter = anniv ?? (pool.length ? pickDaily(pool, clock.dayIndex, 'story-spot') : null);
    const years = anniv ? Number(clock.contentDate.slice(0, 4)) - Number(anniv.date!.slice(0, 4)) : 0;
    return {
      chapter,
      memory: chapter ? pickDaily(chapterMemories[chapter.id] ?? [chapter.body ?? ''], clock.dayIndex, 'story-mem') : '',
      label: anniv ? (years === 1 ? 'היום לפני שנה' : `היום לפני ${years} שנים`) : 'הפרק של היום',
      today: pickDaily(todayLines, clock.dayIndex, 'story-today'),
      together: daysSince(client.dates.together, clock),
    };
  }, [clock]);

  const jump = () => {
    if (!daily.chapter) return;
    document.getElementById(`ch-${daily.chapter.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFlash(true);
    setTimeout(() => setFlash(false), 2200);
  };

  return (
    <>
      {has('book') && (
        <div className="mb-6">
          <BookCard />
        </div>
      )}
      {storyInWords && (
        <Paper tilt="rotate-[0.5deg]" className="mb-6 px-5 pt-6 pb-4">
          <p className="font-hand text-[17px] leading-relaxed whitespace-pre-line">{storyInWords}</p>
          <p className="mt-2 text-xs font-bold text-accent">— {P}</p>
        </Paper>
      )}
      {daily.chapter && (
      <button type="button" onClick={jump} className="mb-6 block w-full text-right">
        <Paper tilt="-rotate-[0.6deg]" className="px-5 pt-5 pb-4">
          <p className="text-xs font-bold tracking-[2px] text-accent">{daily.label} ✨</p>
          <p className="mt-1 flex items-center gap-2 font-serif text-2xl">
            <span aria-hidden>{daily.chapter.icon}</span>
            {daily.chapter.title}
          </p>
          <p className="mt-1 font-hand text-[17px]">{daily.memory}</p>
          <p className="mt-2 text-xs text-muted">לקפוץ לפרק ←</p>
        </Paper>
      </button>
      )}
      <ol className="relative flex flex-col gap-6 border-r-2 border-line pr-6">
        {timeline.map((c, i) => (
          <li key={c.id} id={`ch-${c.id}`} className="relative scroll-mt-24">
            {i === firstFuture && <p className="mb-5 font-serif text-lg text-accent">הפרקים שעוד נכתוב…</p>}
            <span
              aria-hidden
              style={i === firstFuture ? { top: 52 } : undefined}
              className={`absolute top-0.5 -right-[43px] flex size-9 items-center justify-center rounded-full text-lg ${
                c.future ? 'border-2 border-dashed border-accent/50 bg-bg' : 'bg-paper shadow-soft'
              }`}
            >
              {c.icon}
            </span>
            <div
              className={`${c.future ? 'rounded-2xl border-[1.5px] border-dashed border-accent/40 px-4 py-3' : ''} ${
                c.id === daily.chapter?.id ? `-mx-2 rounded-2xl px-2 py-1 transition-colors duration-700 ${flash ? 'bg-soft' : 'bg-transparent'}` : ''
              }`}
            >
              {c.id === 'game' && easterEggs.firstGame ? (
                <button type="button" onClick={() => setAskWinner(true)} className="text-right">
                  <h3 className="font-serif text-xl underline decoration-accent/40 decoration-dotted underline-offset-4">{c.title}</h3>
                </button>
              ) : (
                <h3 className="font-serif text-xl">{c.title}</h3>
              )}
              {c.date && <p className="text-xs text-muted">{new Date(c.date).toLocaleDateString('he-IL')}</p>}
              {c.id === 'today' ? (
                <p className="mt-1 text-[15px]">
                  יום {daily.together.toLocaleString('he-IL')} ביחד. {daily.today}
                </p>
              ) : (
                c.body && <p className={`mt-1 text-[15px] ${c.future ? 'text-muted' : ''}`}>{c.body}</p>
              )}
              {c.chat && (
                <div className="mt-2 flex flex-col gap-1.5">
                  {c.chat.map((b, j) => (
                    <span
                      key={j}
                      className={`max-w-[80%] px-3.5 py-2 text-[15px] ${
                        b.from === 'admin'
                          ? 'self-start rounded-[18px_18px_18px_6px] bg-paper shadow-soft'
                          : 'self-end rounded-[18px_18px_6px_18px] bg-accent text-white'
                      }`}
                    >
                      {b.text}
                    </span>
                  ))}
                </div>
              )}
              {c.quote && (
                <Paper tape={false} tilt="rotate-[0.4deg]" className="mt-2 px-4 py-4">
                  <p className="font-serif text-[16px] leading-relaxed whitespace-pre-line">{c.quote.text}</p>
                  <p className="mt-2 text-xs font-bold text-accent">— {c.quote.by}</p>
                </Paper>
              )}
              {c.photoId && photoById(c.photoId) && (
                <button type="button" onClick={() => onPhoto(photoById(c.photoId!)!)} className="mt-2 block w-40">
                  <PhotoImg photo={photoById(c.photoId)!} sizes="160px" className="w-full rotate-[-2deg] rounded-lg shadow-paper" />
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>

      {has('messageClock') && (
        <div className="mt-10">
          <MessageClock />
        </div>
      )}

      <Sheet open={askWinner} onClose={() => setAskWinner(false)} title="מי ניצח במשחק הראשון?">
        <div className="grid grid-cols-2 gap-3 pb-4">
          {[A, P].map((who) => (
            <button
              key={who}
              type="button"
              onClick={() => {
                setAskWinner(false);
                const lines = easterEggs.firstGame?.lines ?? ['🤔'];
                showToast(who === A ? lines[1] ?? lines[0] : lines[0]);
              }}
              className="flex h-32 flex-col items-center justify-center gap-2 rounded-3xl bg-paper font-bold shadow-soft"
            >
              <span className="font-serif text-4xl text-accent">{who[0]}</span>
              {who}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}

const CATS: { id: PhotoCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'הכל' },
  { id: 'us', label: '📸 אנחנו' },
  { id: 'funny', label: '😂 מצחיקים' },
  { id: 'moments', label: '❤️ רגעים' },
];

function Gallery({ onPhoto }: { onPhoto: (p: Photo) => void }) {
  const { clock, launchDay } = useApp();
  const { released: photos, remaining, today } = photosFor(clock.dayIndex, launchDay);
  const [cat, setCat] = useState<PhotoCategory | 'all'>('all');
  const cats = CATS.filter((c) => c.id === 'all' || photos.some((p) => p.categories.includes(c.id as PhotoCategory)));
  const shown = cat === 'all' ? photos : photos.filter((p) => p.categories.includes(cat));
  const cols = [shown.filter((_, i) => i % 2 === 0), shown.filter((_, i) => i % 2 === 1)];

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {cats.map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={cat === c.id}
            onClick={() => setCat(c.id)}
            className={`h-9 rounded-full border-[1.5px] px-3.5 text-sm ${cat === c.id ? 'border-accent bg-soft font-bold' : 'border-line bg-paper'}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {cols.map((col, ci) => (
          <div key={ci} className="flex flex-col gap-3">
            {col.map((p, i) => (
              
              <button key={p.id} type="button" onClick={() => onPhoto(p)} className="text-right" style={{ rotate: `${(i + ci) % 2 ? 1 : -1}deg` }}>
                <figure className="m-0 rounded-xl bg-paper p-2 pb-3 shadow-paper">
                  <PhotoImg photo={p} sizes="(max-width: 480px) 50vw, 240px" className="w-full rounded-lg" />
                  {p.id === today.id && <span className="mb-1 inline-block rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-white">חדש היום</span>}
                  <figcaption className="mt-2 line-clamp-3 px-0.5 text-[13px] leading-snug">{p.caption}</figcaption>
                </figure>
              </button>
            ))}
          </div>
        ))}
      </div>
      <p className="mt-5 text-center text-sm text-muted">
        {remaining > 0 ? `כל יום נפתחת תמונה חדשה. עוד ${remaining} מחכות לך.` : 'כל יום חוזרת אחת מהן לעמוד הבית.'}
      </p>
    </>
  );
}

function Places({ onPhoto }: { onPhoto: (p: Photo) => void }) {
  const [picked, setPicked] = useState<string[] | null>(null);
  const pick = (ids: string[]) => {
    setPicked(ids);
    document.getElementById(`place-${ids[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  return (
    <>
      <PlacesMap onPick={pick} picked={picked} />
      <ul className="mt-4 flex flex-col gap-3">
        {places.map((p, i) => {
          const photos = (p.photoIds ?? []).map(photoById).filter((x): x is Photo => !!x);
          return (
            <li key={p.id} id={`place-${p.id}`} className="scroll-mt-24">
              <Paper
                tape={false}
                tilt={i % 2 ? 'rotate-[0.4deg]' : '-rotate-[0.4deg]'}
                className={`px-4 py-3.5 ${picked?.includes(p.id) ? 'outline-2 outline-offset-2 outline-accent' : ''}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-serif text-xl">{p.name}</h3>
                  <span className="text-sm text-muted">{p.detail}</span>
                </div>
                {p.note && <p className="mt-1 font-hand text-sm">{p.note}</p>}
                {photos.length > 0 && (
                  <div className="no-scrollbar mt-3 flex items-start gap-2 overflow-x-auto">
                    {photos.map((ph) => (
                      <button key={ph.id} type="button" onClick={() => onPhoto(ph)} className="shrink-0" aria-label={ph.alt}>
                        <PhotoImg photo={ph} sizes="96px" className="w-24 rounded-lg" />
                      </button>
                    ))}
                  </div>
                )}
              </Paper>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function Future() {
  const fromList = futurePlans.filter((f) => f.fromAdminsList);
  const more = futurePlans.filter((f) => !f.fromAdminsList);
  return (
    <>
      {fromList.length > 0 && <SectionTitle>עוד נעשה את זה ביחד</SectionTitle>}
      <div className="grid grid-cols-2 gap-2.5">
        {fromList.map((f, i) => (
          <FutureCard key={f.id} title={f.title} line={f.line} tint={['bg-peach', 'bg-sky', 'bg-butter', 'bg-soft'][i % 4]} tilt={i % 2 ? 1 : -1} />
        ))}
      </div>
      {fromList.length > 0 && <p className="mt-3 text-center font-hand text-sm text-muted">מתוך הרשימה ש{A} {a('כתב', 'כתבה')} ❤️‍🔥</p>}
      {fromList.length > 0 && more.length > 0 && <SectionTitle>ועוד</SectionTitle>}
      <div className="grid grid-cols-2 gap-2.5">
        {more.map((f, i) => (
          <FutureCard key={f.id} title={f.title} line={f.line} tint="bg-paper shadow-soft" tilt={i % 2 ? -1 : 1} />
        ))}
      </div>
    </>
  );
}

function FutureCard({ title, line, tint, tilt }: { title: string; line: string; tint: string; tilt: number }) {
  return (
    <div className={`${tint} flex min-h-[104px] flex-col justify-between rounded-[18px] p-3.5`} style={{ rotate: `${tilt}deg` }}>
      <Flame size={18} className="text-accent" aria-hidden />
      <div>
        <p className="text-[15px] leading-tight font-bold">{title}</p>
        <p className="mt-0.5 text-[13px] text-muted">{line}</p>
      </div>
    </div>
  );
}

function Words() {
  const { clock, showToast } = useApp();
  const quiz = useMemo(() => {
    const word = pickDaily(words, clock.dayIndex, 'quiz');
    const wrong = pickManyDaily(words.filter((w) => w.word !== word.word), clock.dayIndex, 'quiz-wrong', 2);
    const options = pickManyDaily([word, ...wrong], clock.dayIndex, 'quiz-order', 3);
    return { word, options };
  }, [clock.dayIndex]);
  const phrase = phrases.length ? pickDaily(phrases, clock.dayIndex, 'phrase') : null;

  return (
    <>
      <Paper className="mb-6 px-5 pt-6 pb-5">
        <p className="text-xs font-bold tracking-[2px] text-blue">היום לומדים מילה</p>
        <p dir="ltr" className="mt-1 text-right font-serif text-4xl font-bold">{quiz.word.word}</p>
        <p className="mt-1 text-muted">מה זה אומר?</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {quiz.options.map((o) => (
            <button
              key={o.word}
              type="button"
              onClick={() => showToast(o.word === quiz.word.word ? 'נכון! 😌' : `כמעט. ${p('נסה', 'נסי')} שוב, ${P}.`)}
              className="min-h-12 rounded-xl bg-bg px-2 text-[15px] font-semibold"
            >
              {o.meaning}
            </button>
          ))}
        </div>
      </Paper>

      <Translator />

      <SectionTitle>המילון שלנו</SectionTitle>
      {wordsOrigin && <p className="-mt-1 mb-2.5 text-sm text-muted">{wordsOrigin}</p>}
      <dl className="flex flex-col gap-2">
        {words.map((w) => (
          <div key={w.word} className="flex items-baseline justify-between rounded-xl bg-paper px-4 py-3 shadow-soft">
            <dt>
              <span dir="ltr" className="font-serif text-xl font-bold text-blue">{w.word}</span>
              {w.he && <span className="mr-2 text-sm text-muted">{w.he}</span>}
            </dt>
            <dd className="m-0 text-[15px]">{w.meaning}</dd>
          </div>
        ))}
      </dl>
      {phrase && (
        <Paper tilt="rotate-[0.6deg]" className="mt-6 px-5 pt-5 pb-4 text-center">
          <p className="text-xs font-bold tracking-[2px] text-blue">משפט של היום</p>
          <p dir="ltr" className="mt-1 font-hand text-2xl">{phrase.text}</p>
          <p className="mt-1 text-[15px] text-muted">{phrase.he}</p>
        </Paper>
      )}

      {ourWords.length > 0 && (
      <>
      <div className="mt-8" />
      <SectionTitle>המילים שגדלו לבד</SectionTitle>
      <p className="-mt-1 mb-3 text-sm text-muted">אף אחד לא המציא אותן. הן פשוט נולדו בצ׳אט, ונשארו.</p>
      <ul className="flex flex-col gap-3">
        {ourWords.map((w, i) => (
          <li key={w.word} className={`rounded-[16px] px-4 py-3 ${i % 3 === 0 ? 'bg-soft' : 'bg-paper shadow-soft'}`} style={{ rotate: `${i % 2 ? 0.4 : -0.4}deg` }}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-serif text-[20px] font-bold">{w.word}</span>
              <span className="shrink-0 text-[11px] text-muted">{w.when}</span>
            </div>
            <p className="text-[15px]">{w.meaning}</p>
            <p className="mt-1 font-hand text-[14px] text-muted">{w.origin}</p>
          </li>
        ))}
      </ul>
      </>
      )}
    </>
  );
}
