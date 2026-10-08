import { photos } from '../content/photos';
import type { Photo } from '../content/types';
import { pickDaily } from './daily';

/**
 * One new photo a day, in the order of `photos`, from the launch date.
 * The gallery only holds what has been opened so far, so it grows daily.
 * Once all are out, an older one comes back as "מהארכיון".
 */
export function photosFor(dayIndex: number, launchDay: number): { today: Photo; rerun: boolean; released: Photo[]; remaining: number } {
  const day = Math.max(0, dayIndex - launchDay);
  if (day < photos.length) {
    const released = photos.slice(0, day + 1);
    return { today: photos[day], rerun: false, released, remaining: photos.length - released.length };
  }
  return { today: pickDaily(photos, dayIndex, 'photo-rerun'), rerun: true, released: photos, remaining: 0 };
}
