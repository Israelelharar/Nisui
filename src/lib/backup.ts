/**
 * Everything the server stores, fetched key by key for the admin's backups
 * (the data-only file in StorageCard, and the everything-zip in ProjectBackup).
 */
export interface KeyInfo {
  key: string;
  type: string;
  bytes: number;
  group: 'photos' | 'art' | 'backups' | 'pet' | 'site';
}

/** Keep each request well under Vercel's 4.5MB response limit. */
const BATCH_BYTES = 2_500_000;

export async function fetchKeys(): Promise<KeyInfo[]> {
  const r = await fetch('/api/settings?usage=1');
  if (!r.ok) throw new Error(String(r.status));
  return ((await r.json()) as { keys?: KeyInfo[] }).keys ?? [];
}

export async function fetchAllData(keys: KeyInfo[], onProgress: (pct: number) => void) {
  const batches: string[][] = [];
  let cur: string[] = [];
  let size = 0;
  for (const k of keys) {
    if (cur.length && (size + k.bytes > BATCH_BYTES || cur.length >= 150)) {
      batches.push(cur);
      cur = [];
      size = 0;
    }
    cur.push(k.key);
    size += k.bytes;
  }
  if (cur.length) batches.push(cur);
  const values: Record<string, unknown> = {};
  for (let i = 0; i < batches.length; i++) {
    const r = await fetch(`/api/settings?raw=${batches[i].map(encodeURIComponent).join(',')}`);
    if (!r.ok) throw new Error(String(r.status));
    Object.assign(values, ((await r.json()) as { values: Record<string, unknown> }).values);
    onProgress(Math.round(((i + 1) / batches.length) * 100));
  }
  return { kind: 'idw-backup', version: 1, exportedAt: new Date().toISOString(), keys: values };
}

export const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });

export function saveFile(file: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export const mb = (b: number) => (b / 1024 / 1024 < 0.1 ? `${Math.max(1, Math.round(b / 1024))}KB` : `${(b / 1024 / 1024).toFixed(1)}MB`);
