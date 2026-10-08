# העולם שלנו: אתר זוגי לכל זוג

תבנית לאתר זוגי אישי שנמכר ללקוחות. מי שמזמין מקבל עמוד ניהול, ומי שהאתר מיועד לו או לה נכנס/ת עם סיסמה משלו/ה:
פתק חדש כל בוקר, תמונה של היום, הספר שלהם בפרקים, יומן פגישות, עמוד לילה, וחיה וירטואלית (שרקן, חתול, כלבלב או ארנבון).

React 19 + TypeScript + Tailwind 4 + Motion, נבנה עם Vite ורץ על Vercel עם Upstash Redis.

```bash
npm install
npm run dev                 # הזוג לדוגמה (clients/demo)
CLIENT=<slug> npm run dev   # לקוח אחר
npm run build               # בודק טיפוסים ובונה
npm run check:leaks         # שום פרט מהאתר המקורי לא דלף לתבנית
npm run check:clients       # בונה את כל הלקוחות
```

- **לקוח חדש:** [`docs/NEW-CLIENT.md`](docs/NEW-CLIENT.md): השאלון, החלקים, בניית התיקייה וההעלאה ל־Vercel.
- **כל לקוח** הוא תיקייה ב־`clients/<slug>/` (`profile.json`, `index.ts`, `content/`, `photos/`). הסכמה: `src/client/schema.ts`.
- **עברית לפי מגדר:** `src/lib/he.ts`. כל טקסט שפונה לאחד מהם עובר דרך `p()` (מי שהאתר בשבילו/ה) או `a()` (המזמין/ה).
- **החיה:** `src/pet/`. ציור אחד (`PigSvg.tsx`) שמשתנה לפי `src/pet/species/`.
- **גיבוי ושחזור:** [`docs/RECOVERY.md`](docs/RECOVERY.md).
- לראות את האתר בשעה אחרת: `?at=2026-09-25T06:00`.
