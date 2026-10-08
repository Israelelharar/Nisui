import { client } from '../client';

/**
 * The five looks the site can wear. Each day wears the next one (from the
 * client's `skins`, default all), unless one is pinned: by the client's
 * `skin`, or by the admin from the admin page. The colors themselves live in
 * index.css under html[data-skin=…].
 */
export type SkinId = 'rose' | 'cocoa' | 'sea' | 'sunset' | 'lavender';
export type SkinSetting = SkinId | 'auto';

export interface Skin {
  id: SkinId;
  name: string;
  desc: string;
  dark: boolean;
  /** Browser bar color. */
  theme: string;
  /** Background, accent, ink: for the little preview in admin. */
  swatch: [string, string, string];
}

export const SKINS: Skin[] = [
  { id: 'rose', name: 'ורוד חלבי', desc: 'השמנת והוורוד, עם כרטיסי נייר', dark: false, theme: '#FFF7F1', swatch: ['#FBE1E6', '#C2385A', '#3A2228'] },
  { id: 'cocoa', name: 'קקאו וזכוכית', desc: 'קקאו חם, זכוכית חלבית ואור של מנורה', dark: true, theme: '#3A2820', swatch: ['#5A3E30', '#FFB765', '#F6E9DA'] },
  { id: 'sea', name: 'ים בלילה', desc: 'כחול עמוק ואור של מגדלור', dark: true, theme: '#12303F', swatch: ['#1F4E63', '#7FE0D6', '#E4F3F5'] },
  { id: 'sunset', name: 'שקיעה על הים', desc: 'אפרסק, ורוד ושזיף מהטיילת', dark: true, theme: '#B9536F', swatch: ['#D2705E', '#FFE2A8', '#FFF4EC'] },
  { id: 'lavender', name: 'לבנדר וערב', desc: 'סגול אפרפר, רך ושקט', dark: false, theme: '#E4DEF0', swatch: ['#C5B7E3', '#7A5BB0', '#33284A'] },
];

export const isSkin = (v: unknown): v is SkinId => SKINS.some((s) => s.id === v);

const ROTATION = SKINS.filter((s) => !client.skins?.length || client.skins.includes(s.id));

/** Which look a given content day wears. */
export function skinFor(setting: SkinSetting | undefined, dayIndex: number): Skin {
  const s = setting ?? client.skin;
  if (s && s !== 'auto') {
    const pinned = SKINS.find((x) => x.id === s);
    if (pinned) return pinned;
  }
  return ROTATION[((dayIndex % ROTATION.length) + ROTATION.length) % ROTATION.length];
}
