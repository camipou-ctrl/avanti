// La pantalla de la app siempre se pide nueva (así cada cambio aparece al abrir).
// Si no hay internet o tarda mucho, abre la copia guardada. Los datos vienen de Apps Script.
const CACHE = 'avanti-v3';
const ARCHIVOS = ['./', 'index.html', 'manifest.webmanifest', 'iconos/icono-192.png', 'iconos/favicon-32.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS.map((u) => new Request(u, { cache: 'reload' })))));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

function deRed(url, c, clave) {
  return fetch(url, { cache: 'no-store' }).then((r) => { if (r.ok) c.put(clave, r.clone()); return r; });
}

self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  const pantalla = e.request.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('index.html');
  if (u.pathname.endsWith('version.json')) return; // siempre de la red
  if (pantalla) {
    // Red primero (sin caché del navegador); si en 4 s no responde, la copia guardada
    e.respondWith(caches.open(CACHE).then((c) => new Promise((ok) => {
      let listo = false;
      const fin = (r) => { if (!listo && r) { listo = true; ok(r); } };
      deRed(u.href, c, 'index.html').then(fin).catch(() => c.match('index.html').then((g) => fin(g || Response.error())));
      setTimeout(() => c.match('index.html').then(fin), 4000);
    })));
    return;
  }
  // Íconos y manifiesto: lo guardado, y se refresca en segundo plano
  e.respondWith(caches.open(CACHE).then((c) => c.match(e.request).then((g) => {
    const red = fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; });
    if (g) { red.catch(() => {}); return g; }
    return red;
  })));
});
