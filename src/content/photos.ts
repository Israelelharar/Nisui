import type { Photo } from './types';
import { client } from '../client';

/**
 * The client's photos: `clients/<slug>/photos/<file>.webp` plus a small
 * `<file>-sm.webp`, listed with captions in the client's content. One opens
 * every day, in this order (lib/photoOfDay.ts).
 */
const files = import.meta.glob<string>('@client/photos/*.{webp,jpg,jpeg,png}', { eager: true, query: '?url', import: 'default' });
const byName = new Map(Object.entries(files).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1).replace(/\.\w+$/, ''), url]));

export const photos: Photo[] = (client.content.photos ?? []).flatMap((p) => {
  const file = p.file ?? p.id;
  const src = byName.get(file);
  if (!src) {
    if (import.meta.env.DEV) console.warn(`[photos] missing file for "${p.id}" (${file})`);
    return [];
  }
  const { file: _file, ...rest } = p;
  return [{ ...rest, src, srcSmall: byName.get(`${file}-sm`) ?? src }];
});

export const photoById = (id: string) => photos.find((p) => p.id === id);
