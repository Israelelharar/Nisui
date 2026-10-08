import type { ReactNode } from 'react';
import { Heart, MessageCircle, Mic, Phone } from 'lucide-react';
import { Sheet } from './Sheet';
import { useApp } from '../hooks/useApp';
import { hasAdminPhone, telLink, whatsappLink } from '../lib/contact';
import { track } from '../lib/events';
import { burstHeart } from './HeartBurst';
import { A, a, p } from '../lib/he';

/** "I need <admin>". Reach them in one tap, no menus. */
export function ContactSheet() {
  const { sheet, closeSheet } = useApp();
  const ready = hasAdminPhone();

  return (
    <Sheet open={sheet === 'contact'} onClose={closeSheet} title={`אני ${p('צריך', 'צריכה')} את ${A}`}>
      <div className="grid grid-cols-2 gap-3">
        <Action href={telLink()} onClick={() => track('call_request')} icon={<Phone size={24} />} label="להתקשר" primary />
        <Action href={whatsappLink()} onClick={() => track('message')} icon={<MessageCircle size={24} />} label="לשלוח הודעה" />
        <Action href={whatsappLink()} onClick={() => track('message', { kind: 'voice' })} icon={<Mic size={24} />} label="הודעה קולית" />
        <Action
          href={whatsappLink(`אני ${p('מתגעגע', 'מתגעגעת')} ❤️`)}
          onClick={() => {
            burstHeart();
            track('missing_you');
          }}
          icon={<Heart size={24} />}
          label={`אני ${p('מתגעגע', 'מתגעגעת')}`}
        />
      </div>
      {!ready && (
        <p className="mt-4 rounded-2xl bg-butter px-4 py-3 text-sm">
          {A} עוד לא {a('הוסיף', 'הוסיפה')} מספר טלפון לאתר.
        </p>
      )}
      <p className="mt-4 mb-2 text-center font-hand text-sm text-muted">{p('אתה אף פעם לא מפריע', 'את אף פעם לא מפריעה')} לי.</p>
    </Sheet>
  );
}

function Action({ href, onClick, icon, label, primary }: { href?: string; onClick: () => void; icon: ReactNode; label: string; primary?: boolean }) {
  const cls = `flex h-[92px] flex-col items-center justify-center gap-2 rounded-3xl text-[15px] font-bold transition-transform active:scale-[0.97] ${
    primary ? 'bg-accent text-white' : 'bg-paper text-ink shadow-soft'
  } ${href ? '' : 'pointer-events-none opacity-50'}`;
  return (
    <a
      href={href}
      aria-disabled={!href}
      onClick={onClick}
      target={href?.startsWith('https') ? '_blank' : undefined}
      rel="noreferrer"
      className={cls}
    >
      <span className={primary ? '' : 'text-accent'}>{icon}</span>
      {label}
    </a>
  );
}
