/**
 * After a new deploy, a tab (or the home-screen app) that was already open
 * still points at the previous build's files, which no longer exist: opening
 * a page then fails and the site looks stuck. Reload once to pick up the new
 * build; the flag stops a reload loop if something else is wrong.
 */
const KEY = 'idw:staleReload';

export function reloadForNewBuild(): boolean {
  try {
    const last = Number(sessionStorage.getItem(KEY) ?? 0);
    if (Date.now() - last < 30_000) return false;
    sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

/** Vite fires this when a lazy page's file can't be loaded. */
window.addEventListener('vite:preloadError', (e) => {
  if (reloadForNewBuild()) e.preventDefault();
});
