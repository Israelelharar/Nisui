import { PeekFriend, PopFriend, useTripleTap } from '../components/Friends';
import { AdventureCard } from '../pet/adventure';
import { quest } from '../lib/quest';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useApp, useEgg } from '../hooks/useApp';
import { greetings, dailyLines, dailyQuestions, weekendCopy } from '../content/daily';
import { timeline, words, easterEggs } from '../content/story';
import { openWhen } from '../content/openWhen';
import { pickDaily, pickManyDaily } from '../lib/daily';
import { Paper, SectionTitle } from '../components/Paper';
import { PhotoImg } from '../components/PhotoImg';
import { Lightbox } from '../components/Lightbox';
import { NeedButtons } from '../components/NeedButtons';
import { OpenWhenCard, OpenWhenSheet, useOpenWhen } from '../components/OpenWhen';
import { AnswerBox } from '../components/AnswerBox';
import { TodayNotes } from '../components/TodayNotes';
import { specialDay } from '../lib/specialDays';
import { photosFor } from '../lib/photoOfDay';
import { SpecialMessage } from '../components/SpecialMessage';
import type { Photo } from '../content/types';
import { track } from '../lib/events';
import { Countdown, daysToMeeting } from '../components/Countdown';
import { Confetti } from '../components/Confetti';
import { InstallCard } from '../components/InstallCard';
import { NewDateCard } from '../components/NewDateCard';
import { BookCard } from '../components/BookCard';
import { JournalNudge } from '../components/MeetingJournal';
import { OnThisDay } from '../components/OnThisDay';
import { UsDrawing } from '../components/UsDrawing';
import { A, a, p } from '../lib/he';
import { content, has } from '../client';
import { adminNotes } from '../content/notes';

const MOODS = [
  { id: 'missing', label: p('מתגעגע', 'מתגעגעת'), emoji: '🥹', reply: 'גם אני. ממש עכשיו.' },
  { id: 'love', label: p('מאוהב', 'מאוהבת'), emoji: '❤️', reply: 'אני יותר. (זה לא ויכוח, זאת עובדה.)' },
  { id: 'tired', label: p('עייף', 'עייפה'), emoji: '😴', reply: 'אז היום מותר לך לא להתאמץ. אני גאה בך.' },
  { id: 'happy', label: p('שמח', 'שמחה'), emoji: '😂', reply: `זה החיוך ש${a('אני הכי אוהב', 'אני הכי אוהבת')}. ${p('תשמור', 'תשמרי')} לי אותו.` },
  { id: 'strength', label: p('צריך כוח', 'צריכה כוח'), emoji: '💪', reply: '' },
] as const;

const JOKES = content.jokes ?? [];

type Featured =
  | { type: 'memory'; chapter: (typeof timeline)[number] }
  | { type: 'question'; question: string };

export function HomePage() {
  const { clock, slot, nickname, weekend, openSheet, showToast, day, launchDay, settings } = useApp();
  const d = clock.dayIndex;
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const special = specialDay(clock);
  const ow = useOpenWhen();
  const [mood, setMood] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`idw:mood:${clock.contentDate}`);
    } catch {
      return null;
    }
  });
  const sticker = content.homeSticker && easterEggs[content.homeSticker.egg] ? content.homeSticker : null;
  const playSticker = useEgg(sticker ? easterEggs[sticker.egg].lines : ['']);

  const today = useMemo(() => {
    const g = pickDaily(greetings[slot], d, `greet:${slot}`);
    const memories = has('story') ? timeline.filter((c) => !c.future && c.body && !c.chat) : [];
    // Rotate the kind of "something left for you" so every day feels different.
    const featured: Featured | null =
      memories.length && (d % 2 === 0 || !has('mood'))
        ? { type: 'memory', chapter: pickDaily(memories, d, 'home-memory') }
        : has('mood')
          ? { type: 'question', question: pickDaily(dailyQuestions, d, 'question') }
          : null;
    return {
      title: (day?.greeting ?? g.title).replace('{n}', nickname),
      sub: g.sub,
      line: day?.line ?? pickDaily(dailyLines, d, 'line').text,
      featured,
      photo: has('gallery') ? photosFor(d, launchDay) : null,
      cards: has('openWhen') ? pickManyDaily(openWhen.filter((c) => !c.locked), d, 'home-ow', 3) : [],
      joke: JOKES.length ? pickDaily(JOKES, d, 'joke') : null,
      word: has('words') ? pickDaily(words, d, 'word') : null,
    };
  }, [d, slot, nickname, day, launchDay]);

  const jokeEgg = useEgg(today.joke?.egg && easterEggs[today.joke.egg] ? easterEggs[today.joke.egg].lines : ['🥹']);
  const catKnock = useTripleTap();

  const chooseMood = (m: (typeof MOODS)[number]) => {
    if (m.id === 'strength') return openSheet('strength');
    if (m.id !== mood) track('mood', { emoji: m.emoji, label: m.label });
    setMood(m.id);
    showToast(m.reply);
    try {
      localStorage.setItem(`idw:mood:${clock.contentDate}`, m.id);
    } catch {
      /* fine */
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <UsDrawing />

      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[13px] text-muted">{clock.label}</p>
          <h1 className="font-serif text-[30px] leading-tight font-medium">{today.title}</h1>
          <p className="mt-1 text-[15px] text-muted">{today.sub}</p>
        </div>
        {sticker && (
          <button type="button" onClick={playSticker} className="shrink-0 rotate-[4deg] rounded-[14px] bg-butter px-3 py-1.5 font-hand text-[13px]">
            {sticker.label}
          </button>
        )}
      </header>

      {day?.special && <SpecialMessage special={day.special} dayKey={clock.contentDate} />}

      <Countdown />
      <JournalNudge />

      <BookCard />
      <NewDateCard />
      <OnThisDay />
      {(special || daysToMeeting(settings.nextMeeting?.date, clock.dayIndex) === 0) && <Confetti id={clock.contentDate} />}

      {special && (
        <section className="rounded-[22px] bg-butter px-5 py-4">
          <h2 className="font-serif text-[22px]">{special.title}</h2>
          <p className="mt-1 text-[15px]">{special.sub}</p>
        </section>
      )}

      {weekend && (
        <section className="rounded-[22px] bg-accent px-5 py-4 text-white">
          <h2 className="font-serif text-[22px]">{weekendCopy[weekend].title}</h2>
          <p className="mt-1 text-[15px] text-white/90">{weekendCopy[weekend].sub}</p>
        </section>
      )}

      <Paper className="px-5 pt-6 pb-4">
        <p className="text-xs font-bold tracking-[2px] text-accent">היום {A} רוצה להזכיר לך…</p>
        <p className="mt-2 font-serif text-[21px] leading-snug">{today.line}</p>
        <p className="mt-2 font-hand text-sm text-muted">— {A}</p>
      </Paper>

      <NeedButtons />

      {has('pet') && <AdventureCard />}
      <PeekFriend id="angora" side="bottom" size={130} bottom={64} />

      <InstallCard />

      {has('letters') && adminNotes.length > 0 && (
        <section>
          <SectionTitle aside={<Link to="/us?tab=letters" className="text-sm font-bold no-underline">הפתקים שלי</Link>}>
            {A} {a('השאיר', 'השאירה')} לך משהו
          </SectionTitle>
          <TodayNotes />
        </section>
      )}

      {today.photo && (
      <section>
        <SectionTitle aside={<Link to="/us?tab=gallery" className="text-sm font-bold no-underline">הגלריה</Link>}>
          {today.photo.rerun ? 'מהארכיון שלנו' : 'התמונה של היום'}
        </SectionTitle>
        <button type="button" onClick={() => {
            setLightbox(today.photo!.today);
            quest('photo_day');
          }} className="block w-full text-right">
          <Paper tilt="rotate-[0.8deg]" className="p-3 pb-4">
            <PhotoImg photo={today.photo.today} className="w-full rounded-lg" />
            <p className="mt-3 px-1 font-serif text-[16px] leading-relaxed">{today.photo.today.caption}</p>
          </Paper>
        </button>
      </section>
      )}

      {today.featured && (
        <section>
          <SectionTitle>ועוד משהו קטן</SectionTitle>
          <FeaturedCard featured={today.featured} />
        </section>
      )}

      {today.cards.length > 0 && (
      <section>
        <SectionTitle aside={has('letters') ? <Link to="/us?tab=letters#open-when" className="text-sm font-bold no-underline">עוד</Link> : undefined}>{p('פתח', 'פתחי')} כש…</SectionTitle>
        <div className="no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto px-5 py-1">
          {today.cards.map((c, i) => (
            <OpenWhenCard key={c.id} card={c} onOpen={ow.open} tilt={[-1.5, 1, -1][i]} />
          ))}
        </div>
      </section>
      )}

      {today.joke && (
      <section aria-label="בדיחה פרטית" className="flex flex-col gap-1.5">
        {today.joke.bubbles.map((b, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              jokeEgg();
              quest('joke');
            }}
            className={`max-w-[80%] px-3.5 py-2 text-[15px] ${
              b.from === 'admin'
                ? 'self-start rounded-[18px_18px_18px_6px] bg-paper shadow-soft'
                : 'self-end rounded-[18px_18px_6px_18px] bg-accent font-semibold text-white'
            }`}
          >
            {b.text}
          </button>
        ))}
      </section>
      )}

      {has('mood') && (
      <section>
        <SectionTitle>מה מצב הלב שלך היום?</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {MOODS.filter((m) => m.id !== 'strength' || has('strength')).map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={mood === m.id}
              onClick={() => chooseMood(m)}
              className={`flex h-11 items-center gap-1.5 rounded-full border-[1.5px] px-4 text-[15px] transition-colors ${
                mood === m.id ? 'border-accent bg-soft font-bold' : 'border-line bg-paper'
              }`}
            >
              <span aria-hidden>{m.emoji}</span>
              {m.label}
            </button>
          ))}
        </div>
      </section>
      )}

      {today.word && (
      <section onClick={catKnock.onTap} className="relative flex items-baseline gap-3 rounded-2xl border-[1.5px] border-dashed border-line px-4 py-3">
        <PopFriend id="cat" open={catKnock.open} onClose={catKnock.close} size={116} className="-top-[118px] left-3" />
        <span className="shrink-0 text-xs text-muted">המילה של היום</span>
        <span dir="ltr" className="font-serif text-2xl font-bold text-blue">
          {today.word.word}
        </span>
        <span className="text-[15px]">= {today.word.meaning}</span>
      </section>
      )}

      <OpenWhenSheet card={ow.card} onClose={ow.close} />
      <Lightbox photo={lightbox} onClose={() => setLightbox(null)} />
    </div>
  );
}

function FeaturedCard({ featured }: { featured: Featured }) {
  switch (featured.type) {
    case 'memory':
      return (
        <Link to="/us" className="block text-ink no-underline">
          <Paper className="flex items-center gap-4 px-5 pt-6 pb-5">
            <span aria-hidden className="text-4xl">{featured.chapter.icon}</span>
            <span>
              <span className="block text-xs font-bold tracking-[2px] text-accent">זיכרון של היום</span>
              <span className="block font-serif text-xl">{featured.chapter.title}</span>
              <span className="block text-[15px] text-muted">{featured.chapter.body}</span>
            </span>
          </Paper>
        </Link>
      );
    case 'question':
      return (
        <Paper className="px-5 pt-6 pb-5">
          <p className="text-xs font-bold tracking-[2px] text-blue">השאלה של היום</p>
          <p className="mt-2 font-serif text-[20px] leading-snug">{featured.question}</p>
          <AnswerBox question={featured.question} />
        </Paper>
      );
  }
}
