/// <reference types="node" />
import type { Plugin } from 'vite';

/**
 * `npm run dev` with a working server: /api/* runs the real functions from
 * api/ (through Vite's SSR loader), and without Upstash credentials they use
 * a small in-memory store instead, so logging in, the pet, the journal and
 * the admin page all work locally. Dev passwords: admin / partner.
 * Never part of a build.
 */
export function devApi(): Plugin {
  return {
    name: 'dev-api',
    apply: 'serve',
    configureServer(server) {
      const env = process.env;
      env.SESSION_SECRET ??= 'dev-only-secret-dev-only-secret';
      env.ADMIN_PASSWORD ??= 'admin';
      env.PARTNER_PASSWORD ??= 'partner';
      if (!env.KV_REST_API_URL && !env.UPSTASH_REDIS_REST_URL) {
        env.KV_REST_API_URL = 'https://memory.kv';
        env.KV_REST_API_TOKEN = 'dev';
        const mem = new Map<string, string | string[]>();
        const run = ([c, k, ...a]: string[]): unknown => {
          const set = () => new Set((mem.get(k) as string[] | undefined) ?? []);
          switch (c) {
            case 'GET':
              return mem.get(k) ?? null;
            case 'SET':
              if (a.includes('NX') && mem.has(k)) return null;
              mem.set(k, a[0]);
              return 'OK';
            case 'DEL':
              return mem.delete(k) ? 1 : 0;
            case 'SADD': {
              const s = set();
              a.forEach((x) => s.add(x));
              mem.set(k, [...s]);
              return 1;
            }
            case 'SREM': {
              const s = set();
              a.forEach((x) => s.delete(x));
              mem.set(k, [...s]);
              return 1;
            }
            case 'SMEMBERS':
              return [...set()];
            case 'SCARD':
              return set().size;
            case 'SCAN':
              return ['0', [...mem.keys()].filter((x) => x.startsWith((a[1] ?? '*').replace('*', '')))];
            case 'TYPE':
              return mem.has(k) ? (Array.isArray(mem.get(k)) ? 'set' : 'string') : 'none';
            case 'STRLEN':
              return String(mem.get(k) ?? '').length;
            default:
              return null;
          }
        };
        const real = globalThis.fetch;
        globalThis.fetch = async (input, init) => {
          const url = String(input instanceof Request ? input.url : input);
          if (!url.startsWith('https://memory.kv')) return real(input, init);
          const body = JSON.parse(String(init?.body));
          return Response.json(url.endsWith('/pipeline') ? body.map((cmd: string[]) => ({ result: run(cmd) })) : { result: run(body) });
        };
      }

      server.middlewares.use(async (req, res, next) => {
        const m = req.url?.match(/^\/api\/([a-z]+)(\?.*)?$/);
        if (!m) return next();
        try {
          const mod = (await server.ssrLoadModule(`/api/${m[1]}.ts`)) as Record<string, (r: Request) => Promise<Response> | Response>;
          const handler = mod[req.method ?? 'GET'];
          if (!handler) return next();
          const chunks: Buffer[] = [];
          for await (const c of req) chunks.push(c as Buffer);
          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') headers.set(k, v);
          const body = chunks.length ? Buffer.concat(chunks) : undefined;
          const out = await handler(new Request(`http://${req.headers.host}${req.url}`, { method: req.method, headers, body }));
          res.statusCode = out.status;
          out.headers.forEach((v, k) => res.setHeader(k, k === 'set-cookie' ? v.replace(/; Secure/i, '') : v));
          res.end(Buffer.from(await out.arrayBuffer()));
        } catch (e) {
          server.config.logger.error(String(e));
          res.statusCode = 500;
          res.end(String(e));
        }
      });
    },
  };
}
