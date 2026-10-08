/**
 * "להוסיף למסך הבית". Chrome fires `beforeinstallprompt` early (often before
 * React mounts), so it is caught here at import time and kept for the button.
 */
interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') {
  if ('serviceWorker' in navigator && !import.meta.env.DEV && !import.meta.env.VITE_PREVIEW) {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    emit();
  });
}

export const isStandalone = () => typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;
export const canInstall = () => !!deferred && !isStandalone();
export const subscribeInstall = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

export async function install() {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  emit();
  return outcome === 'accepted';
}
