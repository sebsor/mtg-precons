const CACHE = 'mtg-precons-v7';
const SHELL = ['/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always network-first for the HTML page itself — ensures updates are seen immediately
  if (url.pathname === '/' || url.pathname.endsWith('/index.html')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Network-first for external data (deck list, Scryfall)
  if (url.hostname.includes('githubusercontent.com') || url.hostname.includes('scryfall.com') || url.hostname.includes('svgs.scryfall.io')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for manifest only; icons should also be network-first so they update
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
