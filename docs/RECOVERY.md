# איך מחזירים את האתר לחיים (ספר ההפעלה)

> אם משהו קרה לאתר, לוורסל או לגיטהאב, הקובץ הזה הוא כל מה שצריך.
> פותחים שיחה חדשה עם Claude (או כל בינה מלאכותית שיודעת לכתוב קוד), מצרפים את קובץ ה־zip שהורדתם מעמוד הניהול,
> וכותבים:
>
> **"זה גיבוי מלא של האתר שלנו. תקרא את READ-ME-FIRST.md ותעלה את האתר מחדש, צעד אחרי צעד, כולל הנתונים."**
>
> מכאן היא אמורה להסתדר לבד. נשאר רק לבחור סיסמאות וללחוץ על כמה כפתורים בוורסל.

---

## מה יש בקובץ הגיבוי

| נתיב בתוך ה־zip | מה זה |
|---|---|
| `READ-ME-FIRST.md` | הקובץ הזה |
| `backup-manifest.json` | מתי נבנה הגיבוי, מאיזה commit, ענף ולקוח (`client`) |
| `project/` | הקוד, והתיקייה של הלקוח הזה בלבד ב־`clients/<slug>/`: הטקסטים, התמונות והמכתבים |
| `data/site-data.json` | כל מה ששמור בשרת ביום הגיבוי: החיה, האלבום, הציורים, הפתקים שנפתחו, השוברים, הפרקים שנקראו, היומן, ההגדרות |

**מה לא נמצא בגיבוי, בכוונה:** סיסמאות, `SESSION_SECRET` ומפתחות ההתראות. הם נשמרים רק בוורסל. בשחזור בוחרים חדשים.

---

## For the AI doing the restore (step by step)

Stack: React 19 + TypeScript + Tailwind 4 + motion + react-router, built with Vite. Hosted on **Vercel**. Server functions live in `api/` (Vercel Functions, Web `Request`/`Response`). `middleware.ts` gates every path behind a signed session cookie. Data lives in **Upstash Redis** through its REST API (`api/_lib/store.ts`).

The repo is a template for many couples: each couple is a folder in `clients/<slug>/`, picked at build time by the `CLIENT` env var. `backup-manifest.json` says which one this is.

1. **Unpack** the zip and work inside `project/`. `CLIENT=<slug> npm install && CLIENT=<slug> npm run build` must pass (it type-checks too).
2. **GitHub.** Create a new **private** repo and push `project/` to it.
3. **Vercel.** Add New → Project → import the repo. Framework **Vite** (auto-detected), build `npm run build`, output `dist`.
4. **Upstash Redis.** Vercel project → Storage → Marketplace → **Upstash for Redis** (Free) → connect. This sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`.
5. **Environment variables** (Settings → Environment Variables), then **Redeploy**:

   | Name | Required | Value |
   |---|---|---|
   | `CLIENT` | yes | the folder name in `clients/` |
   | `SESSION_SECRET` | yes | random string, ≥ 24 chars (`openssl rand -base64 32`) |
   | `ADMIN_PASSWORD` | yes | the buyer's login (everything plus `/admin`). Case and spaces are ignored |
   | `PARTNER_PASSWORD` | yes | the partner's login |
   | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | yes | set by the Upstash integration |
   | `KV_PREFIX` | if the database is shared | the same prefix as before, e.g. `noa:` |
   | `SITE_TZ` | no | time zone, default `Asia/Jerusalem` |
   | `NTFY_TOPIC` | for notifications | long secret topic name, subscribed in the ntfy phone app |
   | `NOTIFY_WHATSAPP` + `CALLMEBOT_APIKEY` | optional | WhatsApp notifications through CallMeBot |
   | `NOTIFY_EMAIL` + `RESEND_API_KEY` | optional | e-mail notifications through Resend |

6. **Restore the data.** From `project/`:
   ```bash
   KV_REST_API_URL=... KV_REST_API_TOKEN=... [KV_PREFIX=...] node scripts/restore-data.mjs ../data/site-data.json
   ```
7. **Check** `/login.html`. Log in with the partner password: today's notes, the pet with its name and items, the chapters already read. Log in with the admin password and check `/admin`.

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
- **Server keys** (Upstash, under `KV_PREFIX` if set): `settings`, `launch`, `opened`, `opened:custom`, `journal`, `pet:*`, `art:*`, `day:<date>` + `days`.
