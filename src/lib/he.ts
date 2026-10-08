import { admin, partner } from '../client';

/**
 * Hebrew is gendered, so every UI string that talks to or about one of the
 * two goes through these. `p` follows the partner (who the site is for),
 * `a` follows the admin (who made it):
 *
 *   `${A} ${a('כתב', 'כתבה')} לך`      → "יואב כתב לך"
 *   `אני ${p('צריך', 'צריכה')} כוח`     → "אני צריכה כוח"
 */
export const A = admin.name;
export const P = partner.name;
export const p = (m: string, f: string) => (partner.gender === 'f' ? f : m);
export const a = (m: string, f: string) => (admin.gender === 'f' ? f : m);

/** "את" / "אתה" for the partner. */
export const you = () => p('אתה', 'את');
/** "עלייך" / "עליך", "אלייך" / "אליך": the possessive forms that differ in spelling. */
export const yourSfx = () => p('ך', 'ייך');
