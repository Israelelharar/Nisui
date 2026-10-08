import { Sheet } from './Sheet';
import { Paper } from './Paper';
import type { Note } from '../content/types';
import { A, p } from '../lib/he';

export const KIND_LABEL: Record<Note['kind'], string> = { letter: 'מכתב', note: 'פתק', song: 'שיר', message: 'הודעה' };
const SIGN: Record<Note['author'], string> = { admin: `— ${A}`, partner: `— ${p('אתה', 'את')}, ל${A}`, both: '— שנינו' };

export function NoteSheet({ note, onClose }: { note: Note | null; onClose: () => void }) {
  return (
    <Sheet open={!!note} onClose={onClose} title={note?.title ?? ''}>
      {note && (
        <Paper className="mb-4 px-5 pt-8 pb-6">
          <p className="mb-3 text-xs text-muted">
            {KIND_LABEL[note.kind]}
            {note.writtenOn && ` · ${new Date(note.writtenOn).toLocaleDateString('he-IL')}`}
          </p>
          <p className="font-serif text-[19px] leading-[1.75] whitespace-pre-line">{note.body}</p>
          <p className="mt-4 font-hand text-base text-accent">{SIGN[note.author]}</p>
        </Paper>
      )}
    </Sheet>
  );
}
