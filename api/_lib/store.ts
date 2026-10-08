/**
 * Tiny key-value store on Upstash Redis (REST API, no SDK). Vercel's Upstash
 * integration sets KV_REST_API_URL / KV_REST_API_TOKEN automatically.
 */
const url = () => process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = () => process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

export const hasStore = () => !!(url() && token());

/**
 * Several client sites can share one Upstash database: each sets its own
 * KV_PREFIX (e.g. "noa:"), and every key it touches lives under that prefix.
 */
const PREFIX = () => process.env.KV_PREFIX ?? '';
export const k = (key: string) => PREFIX() + key;
const unk = (key: string) => (PREFIX() && key.startsWith(PREFIX()) ? key.slice(PREFIX().length) : key);

async function cmd<T = unknown>(...args: (string | number)[]): Promise<T> {
  const res = await fetch(url()!, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`store ${args[0]} failed: ${res.status}`);
  return ((await res.json()) as { result: T }).result;
}

export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await cmd<string | null>('GET', k(key));
  return raw ? (JSON.parse(raw) as T) : null;
}
export const setJSON = (key: string, value: unknown) => cmd('SET', k(key), JSON.stringify(value));
export const del = (key: string) => cmd('DEL', k(key));
export const addToSet = (key: string, member: string) => cmd('SADD', k(key), member);
export const removeFromSet = (key: string, member: string) => cmd('SREM', k(key), member);
export const setMembers = (key: string) => cmd<string[]>('SMEMBERS', k(key));
/** Sets the key only if it does not exist yet. */
export const setIfAbsent = (key: string, value: string) => cmd('SET', k(key), value, 'NX');
export const getString = (key: string) => cmd<string | null>('GET', k(key));

/**
 * Several commands in one round trip (Upstash REST pipeline). Each entry is { result } or { error }.
 * The second element of every command is a key and gets the prefix.
 */
export async function pipeline(cmds: (string | number)[][]): Promise<{ result?: unknown; error?: string }[]> {
  if (!cmds.length) return [];
  const res = await fetch(`${url()}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmds.map(([c, key, ...rest]) => (key === undefined ? [c] : [c, k(String(key)), ...rest]))),
  });
  if (!res.ok) throw new Error(`store pipeline failed: ${res.status}`);
  return (await res.json()) as { result?: unknown; error?: string }[];
}

/** Every key of this site (without the prefix). */
export async function allKeys(): Promise<string[]> {
  const keys: string[] = [];
  let cursor = '0';
  for (let i = 0; i < 200; i++) {
    const [next, batch] = await cmd<[string, string[]]>('SCAN', cursor, 'MATCH', `${PREFIX()}*`, 'COUNT', 1000);
    keys.push(...batch.map(unk));
    cursor = String(next);
    if (cursor === '0') break;
  }
  return keys;
}
