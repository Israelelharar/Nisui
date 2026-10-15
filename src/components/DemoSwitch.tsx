import { setDemoView } from '../lib/site';
import { tap } from '../lib/haptics';
import { A, P } from '../lib/he';

/**
 * The demo site only: a little tag on top that says it's an example, and a switch between
 * what she sees and what he gets (the admin page). Nothing here can be changed or saved.
 */
export function DemoSwitch({ admin }: { admin: boolean }) {
  const go = (v: 'admin' | 'partner') => {
    if ((v === 'admin') === admin) return;
    tap(8);
    setDemoView(v);
  };
  return (
    <div className="fixed left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full bg-ink/90 p-1 text-[12px] font-bold text-white shadow-soft backdrop-blur" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 92px)' }}>
      <span className="rounded-full bg-accent px-2.5 py-1">דוגמה</span>
      <button type="button" aria-pressed={!admin} onClick={() => go('partner')} className={`rounded-full px-2.5 py-1 transition-colors ${!admin ? 'bg-white text-ink' : 'text-white/80'}`}>
        האתר של {P}
      </button>
      <button type="button" aria-pressed={admin} onClick={() => go('admin')} className={`rounded-full px-2.5 py-1 transition-colors ${admin ? 'bg-white text-ink' : 'text-white/80'}`}>
        הניהול של {A}
      </button>
    </div>
  );
}
