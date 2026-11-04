// Guarda la pantalla de la app para que abra al instante; los datos siempre vienen de Apps Script.
const CACHE = 'avanti-v2';
const ARCHIVOS = ['./', 'index.html', 'manifest.webmanifest', 'iconos/icono-192.png', 'iconos/favicon-32.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS))); self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  // Abre con lo guardado (instantáneo) y en segundo plano trae la versión nueva para la próxima vez
  e.respondWith(caches.open(CACHE).then((c) => c.match(e.request).then((guardado) => {
    const red = fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; });
    if (guardado) { red.catch(() => {}); return guardado; }
    return red.catch(() => c.match('index.html'));
  })));
});
