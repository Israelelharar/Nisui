import { useId, useState } from 'react';
import { Send } from 'lucide-react';
import { whatsappLink } from '../lib/contact';
import { track } from '../lib/events';
import { A, a } from '../lib/he';

/** The answer to a daily question. Goes only to the admin (on WhatsApp). */
export function AnswerBox({ question, dark }: { question: string; dark?: boolean }) {
  const id = useId();
  const [text, setText] = useState('');
  const href = whatsappLink(`${question}\n${text.trim()}`);
  return (
    <div className="mt-3">
      <label htmlFor={id} className={`text-xs ${dark ? 'text-white/70' : 'text-muted'}`}>
        התשובה שלך תגיע רק ל{A}
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id={id}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`לכתוב ל${a('ו', 'ה')}…`}
          className={`h-12 min-w-0 flex-1 rounded-xl border-[1.5px] px-3.5 text-[15px] outline-none focus:border-accent ${
            dark ? 'border-white/15 bg-white/5 text-white placeholder:text-white/50' : 'border-line bg-bg'
          }`}
        />
        <a
          href={text.trim() && href ? href : undefined}
          aria-disabled={!text.trim() || !href}
          onClick={() => text.trim() && track('message', { kind: 'answer' })}
          target="_blank"
          rel="noreferrer"
          aria-label={`לשלוח ל${A}`}
          className={`flex size-12 items-center justify-center rounded-xl bg-accent text-white ${text.trim() && href ? '' : 'pointer-events-none opacity-40'}`}
        >
          <Send size={19} className="-scale-x-100" />
        </a>
      </div>
    </div>
  );
}
