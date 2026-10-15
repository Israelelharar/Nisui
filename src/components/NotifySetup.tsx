import { Copy } from 'lucide-react';
import { useApp } from '../hooks/useApp';
import { tap } from '../lib/haptics';
import { a, P, p } from '../lib/he';

/**
 * Notifications come through ntfy, a free phone app. Each site has its own secret channel
 * (api/_lib/notify.ts), so the admin only subscribes once: nothing to set up anywhere else.
 */
export function NotifySetup({ topic }: { topic?: string }) {
  const { showToast } = useApp();
  if (!topic) return <p className="text-sm text-muted">ההתראות מופעלות באתר החי.</p>;
  const copy = async () => {
    tap(6);
    try {
      await navigator.clipboard.writeText(topic);
      showToast('הועתק 📋');
    } catch {
      showToast('לא הצלחתי להעתיק, אפשר לסמן ידנית');
    }
  };
  return (
    <div className="rounded-[18px] bg-paper p-4 shadow-paper">
      <p className="text-[14px] leading-relaxed">
        כש{P} {p('נכנס', 'נכנסת')}, {p('פותח', 'פותחת')} פתק או {p('כותב', 'כותבת')} ביומן, {a('תקבל', 'תקבלי')} התראה לטלפון. פעם אחת בלבד:
      </p>
      <ol className="mt-2 flex list-decimal flex-col gap-1.5 pr-5 text-[14px] leading-relaxed">
        <li>
          להוריד את האפליקציה החינמית{' '}
          <a href="https://ntfy.sh/app" target="_blank" rel="noreferrer" className="font-bold text-accent">
            ntfy
          </a>
          .
        </li>
        <li>ללחוץ על + (Subscribe) ולהדביק את הערוץ:</li>
      </ol>
      <div className="mt-2 flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2">
        <code dir="ltr" className="min-w-0 flex-1 truncate text-[13px]">
          {topic}
        </code>
        <button type="button" onClick={copy} aria-label="להעתיק את הערוץ" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-line/60">
          <Copy size={16} aria-hidden />
        </button>
      </div>
    </div>
  );
}
