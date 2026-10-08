import { content } from '../client';

/** "ההפתעה של היום". Small, real, redeemable. */
export interface Surprise {
  id: string;
  kind: 'coupon' | 'fact' | 'photo';
  title: string;
  body: string;
  photoId?: string;
}

export const surprises: Surprise[] = content.surprises ?? [];
