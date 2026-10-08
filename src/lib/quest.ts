/**
 * Tells the guinea pig's quests that something happened on the site (a letter
 * was opened, a sheep game finished…). Loaded lazily so pages that never touch
 * the pig don't carry him.
 */
export function quest(key: string, by = 1) {
  void import('../pet/usePet').then((m) => m.record(key, by)).catch(() => {});
}
