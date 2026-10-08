# Couple-site template

A generic, configurable version of a private couple site, sold to clients. One codebase, one folder per
couple in `clients/<slug>/`, one Vercel project per couple (env `CLIENT=<slug>`).

Built with:
- Hebrew, RTL.
- React 19, TypeScript, Tailwind 4, motion and react-router.
- Vite, deployed on Vercel. Server functions live in `api/` and use an Upstash KV store.

## Always
- **Nothing personal from the original private site goes in here.** Generic code, the demo couple (made up), and
  client folders only. Run `npm run check:leaks` before every push.
- **For any UI or visual work, follow `.claude/skills/web-polish/SKILL.md`.** Premium and handmade, never
  "AI slop": research first, no emoji as icons, no uniform grids, juice on every interaction, and
  screenshots before shipping.
- When the owner has to choose between designs, publish a picker page with live phone mockups to tap and
  choose (web-polish §1b).
- **Every string that talks to or about one of the couple goes through `src/lib/he.ts`** (`p()` = the
  partner, `a()` = the admin/buyer). Names come from `client.admin` / `client.partner`, never literals.
- **Modules are optional.** Anything a client can turn off (`features` in `src/client/schema.ts`) or leave
  without content must hide itself cleanly. `npm run check:clients` builds every client, including the
  photos-only test client.
- Run `npm run build` (it typechecks) before every push.
- **Vercel Hobby allows 12 functions per deployment, and `middleware.ts` counts as one.** So `api/` may hold
  at most **11** top-level `.ts` files (`api/_lib/` doesn't count). New endpoints go into an existing
  function as a query (e.g. `/api/event?journal`).
- The server never knows the couple: notification texts are written by the site (`src/lib/events.ts`).

## Adding a client
See `docs/NEW-CLIENT.md`. Client content is written in the buyer's voice, in the right genders, warm and
specific (their real details), never generic marketing lines.
