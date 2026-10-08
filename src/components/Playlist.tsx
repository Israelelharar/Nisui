import { useState } from 'react';
import { client } from '../client';
import { a, p } from '../lib/he';
import { Paper } from './Paper';

/** "השירים שלנו": the playlist they share on Spotify, playable right here. */
export function Playlist() {
  const [loaded, setLoaded] = useState(false);
  const id = client.spotifyPlaylist;
  return (
    <div className="flex flex-col gap-4">
      <Paper className="px-5 pt-6 pb-5">
        <p className="text-xs font-bold tracking-[2px] text-accent">הפלייליסט שלנו</p>
        <p className="mt-2 font-serif text-[20px] leading-snug">השירים ששנינו שומעים. {p('תלחץ', 'תלחצי')} על שיר, {p('ותחשוב', 'ותחשבי')} עליי. (אני כבר {a('חושב', 'חושבת')} {p('עליך', 'עלייך')}.)</p>
      </Paper>
      <div className="relative overflow-hidden rounded-[14px] bg-night shadow-paper">
        {!loaded && <div className="absolute inset-0 flex items-center justify-center text-sm text-white/60">טוען את השירים…</div>}
        <iframe
          title="הפלייליסט שלנו בספוטיפיי"
          src={`https://open.spotify.com/embed/playlist/${id}?utm_source=generator`}
          width="100%"
          height="480"
          loading="lazy"
          onLoad={() => setLoaded(true)}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          className="relative block border-0"
        />
      </div>
      <a
        href={`https://open.spotify.com/playlist/${id}`}
        target="_blank"
        rel="noreferrer"
        className="flex h-12 items-center justify-center rounded-full bg-[#1DB954] font-bold text-white no-underline"
      >
        לפתוח בספוטיפיי
      </a>
    </div>
  );
}
