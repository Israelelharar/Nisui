# איך מחזירים את האתר לחיים (ספר ההפעלה)

> מסמך לבעל השירות (לא נשלח ללקוחות). אם משהו קרה לאתר של לקוח: לוקחים את הקוד מהריפו הפרטי שלך,
> ואת התוכן והנתונים מקובץ הגיבוי שהלקוח הוריד מעמוד הניהול. אפשר לפתוח שיחה עם Claude על הריפו, לצרף את הקובץ,
> ולכתוב: **"תחזיר את האתר של הלקוח הזה מהגיבוי, לפי docs/RECOVERY.md."**

---

## מה יש בקובץ הגיבוי

| נתיב בתוך ה־zip | מה זה |
|---|---|
| `READ-ME-FIRST.md` | הסבר קצר ללקוח (`docs/BACKUP-README.md`) |
| `backup-manifest.json` | מתי נבנה הגיבוי, מאיזה commit ולאיזה לקוח (`client`) |
| `content/` | התיקייה של הלקוח בלבד (`clients/<slug>/`): הטקסטים, התמונות והמכתבים. **הקוד לא נמצא בגיבוי, בכוונה:** הוא שלך |
| `data/site-data.json` | כל מה ששמור בשרת ביום הגיבוי: החיה, האלבום, הציורים, הפתקים שנפתחו, השוברים, הפרקים שנקראו, היומן, ההגדרות |

**מה לא נמצא בגיבוי, בכוונה:** סיסמאות, `SESSION_SECRET` ומפתחות ההתראות. הם נשמרים רק בוורסל. בשחזור בוחרים חדשים.

---

## For the AI doing the restore (step by step)

Stack: React 19 + TypeScript + Tailwind 4 + motion + react-router, built with Vite. Hosted on **Vercel**. Server functions live in `api/` (Vercel Functions, Web `Request`/`Response`). `middleware.ts` gates every path behind a signed session cookie. Data lives in **Upstash Redis** through its REST API (`api/_lib/store.ts`).

The repo is a template for many couples: each couple is a folder in `clients/<slug>/`, picked at build time by the `CLIENT` env var. `backup-manifest.json` says which one this is.

1. **Code + content.** The client's backup zip holds only their content (`content/` = `clients/<slug>/`) and data, never the code. Take the code from the owner's repo, copy the zip's `content/` into `clients/<slug>/`, and check that `CLIENT=<slug> npm install && CLIENT=<slug> npm run build` passes (it type-checks too).
2. **GitHub.** Use the owner's private repo (one repo for all clients).
3. **Vercel.** One project for all couples: Add New → Project → import the repo. Framework **Vite** (auto-detected), build `npm run build`, output `dist`. Each couple is at `/<slug>/`.
4. **Upstash Redis.** Vercel project → Storage → Marketplace → **Upstash for Redis** (Free) → connect. This sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
5. **Environment variables** (Settings → Environment Variables), then **Redeploy**:

   | Name | Required | Value |
   |---|---|---|
   | `SESSION_SECRET` | yes | random string, ≥ 24 chars (`openssl rand -base64 32`) |
   | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | yes | set by the Upstash integration |

6. **Restore the data.** From the repo root:
   ```bash
   KV_REST_API_URL=... KV_REST_API_TOKEN=... KV_PREFIX=<slug>: node scripts/restore-data.mjs ../data/site-data.json
   ```
7. **Check** `/<slug>/login.html`. Log in with her first name: today's notes, the pet with its name and items, the chapters already read. Log in with his first name and check `/admin`.

Vercel's Hobby plan allows 12 functions per deployment and the middleware is one of them, so `api/` keeps **at most 11** top-level files.

Local development: `CLIENT=<slug> npm run dev`. There is no server in dev, so `/api/*` fails and the site falls back to local defaults. Add `?at=2026-10-20T08:00` to see another day.

---

## How the site works (map for whoever edits it next)

- **`CLAUDE.md`**: standing rules (web-polish skill, build before push, the 11-function limit).
- **Roles.** `admin` (the buyer) sees everything, including future content, and never triggers notifications. `partner` gets content unlocked day by day, and meaningful actions notify the admin (`src/lib/events.ts` writes the text, `api/event.ts` passes it to `api/_lib/notify.ts`).
- **The client** (`clients/<slug>/`): `profile.json` (names, genders, title), `index.ts` (dates, modules, pet, content), `content/*.ts`, `photos/`. Types: `src/client/schema.ts`. Modules a client turned off, or that have no content, disappear from the menu and pages.
- **Hebrew genders**: `src/lib/he.ts` (`p()` follows the partner, `a()` the admin).
- **The daily clock** (`src/lib/time.ts`): a content day starts at **05:00**. `launchDay` is the partner's first login (stored by `api/me.ts`).
- **The pet** (`src/pet/`): one puppet (`PigSvg.tsx`) drawn as a guinea pig, cat, dog or bunny (`src/pet/species/`). Saved through `api/pet.ts`.
- **Server keys** (Upstash, under `<slug>:` per site): `settings`, `launch`, `opened`, `opened:custom`, `journal`, `pet:*`, `art:*`, `day:<date>` + `days`.
