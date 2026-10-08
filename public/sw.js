// Minimal service worker: makes the site installable and shows a kind page when offline.
// Nothing is cached, so her content is always fresh and private.
const OFFLINE = `<!doctype html><html lang="he" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>העולם שלנו</title><body style="margin:0;min-height:100dvh;display:flex;align-items:center;justify-content:center;background:#FFF7F1;color:#3a2228;font-family:system-ui;text-align:center;padding:24px">
<div><div style="font-size:56px">💌</div><h1 style="font-weight:500">אין אינטרנט כרגע</h1><p>הפתקים מחכים לך. תנסי שוב כשתהיה קליטה ❤️</p>
<button onclick="location.reload()" style="margin-top:12px;height:48px;padding:0 24px;border:0;border-radius:999px;background:#C2385A;color:#fff;font-size:16px">לנסות שוב</button></div></body></html>`;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return;
  e.respondWith(fetch(e.request).catch(() => new Response(OFFLINE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })));
});
