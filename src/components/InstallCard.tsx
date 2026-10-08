import { useSyncExternalStore } from 'react';
import { Smartphone } from 'lucide-react';
import { canInstall, install, subscribeInstall } from '../lib/install';
import { useApp } from '../hooks/useApp';

/** Offers to put the site on her home screen, like an app. Only shows when the browser allows it. */
export function InstallCard() {
  const show = useSyncExternalStore(subscribeInstall, canInstall);
  const { showToast } = useApp();
  if (!show) return null;
  return (
    <button
      type="button"
      onClick={async () => (await install()) && showToast('עכשיו אנחנו תמיד במסך הבית שלך ❤️')}
      className="flex w-full items-center gap-3 rounded-[22px] border-[1.5px] border-dashed border-accent/50 bg-paper px-4 py-3 text-right"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-soft text-accent">
        <Smartphone size={22} />
      </span>
      <span>
        <span className="block font-bold">להוסיף את העולם שלנו למסך הבית</span>
        <span className="block text-sm text-muted">ככה הכל תמיד במרחק לחיצה אחת.</span>
      </span>
    </button>
  );
}
