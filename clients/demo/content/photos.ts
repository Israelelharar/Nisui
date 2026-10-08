import type { PhotoEntry } from '../../../src/client/schema';

/**
 * One opens every day, in this order. Files are in ../photos/<id>.webp plus a
 * small <id>-sm.webp. (The demo's are drawn; a real client sends photos.)
 */
const p = (id: string, alt: string, caption: string, categories: PhotoEntry['categories'], takenOn?: string): PhotoEntry => ({ id, alt, caption, categories, takenOn, width: 900, height: 1125 });

export const photos: PhotoEntry[] = [
  p('sunset-beach', 'שנינו על החוף בשקיעה', 'השקיעה הראשונה שלנו. את אמרת שזה הכי יפה שראית, ואני הסתכלתי עלייך.', ['us', 'moments'], '2023-07-14'),
  p('selfie', 'סלפי של שנינו מחייכים', 'הסלפי שצילמנו 14 פעמים עד שיצא. זה ה־15.', ['us', 'funny']),
  p('cafe', 'שתי כוסות קפה על שולחן', 'הקפה שלך, הקפה שלי, והוויכוח מי מזמין.', ['moments']),
  p('picnic', 'פיקניק מתחת לעץ', 'הפיקניק שתכננת שבוע, והנמלים תכננו יותר.', ['moments', 'funny']),
  p('rain-umbrella', 'שנינו מתחת למטרייה בגשם', 'מטרייה אחת, שני אנשים, ואף אחד לא נשאר יבש.', ['us', 'moments']),
  p('ferris-wheel', 'שנינו מול גלגל ענק', 'את פחדת מהגובה. אני העמדתי פנים שלא.', ['us', 'funny']),
  p('hike', 'שנינו על הר בזריחה', 'קמנו ב־4:30 בשביל הזריחה הזאת. שווה כל דקה של שינה.', ['us', 'moments']),
  p('movie-night', 'ערב סרט על הספה', 'ערב סרט. ראית 20 דקות. אני ראיתי אותך ישנה.', ['funny', 'moments']),
  p('birthday-cake', 'עוגת יום הולדת עם נרות', 'העוגה שאפיתי לך. נכון, היא קצת עקומה. נכון, אכלת שתי פרוסות.', ['moments']),
  p('rooftop-stars', 'שנינו על גג תחת כוכבים', 'ספרנו כוכבים עד שאיבדנו את הספירה. אז התחלנו לספור נשיקות.', ['us', 'moments']),
  p('cooking', 'מחבת על הכיריים', 'הפסטה השרופה, גרסה 2. הפעם רק קצת שרופה.', ['funny']),
  p('snow-walk', 'שנינו הולכים בשלג', 'החרמון. את רצית לבנות איש שלג, יצא לנו איש בוץ.', ['us', 'funny']),
];
