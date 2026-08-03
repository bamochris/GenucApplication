/* GENUC Service Worker — Offline-First v2.0 */

/* Le numéro de version doit changer à chaque modification de ce fichier :
 * `activate` supprime les caches dont le nom diffère, c'est le seul moyen de
 * purger les entrées posées par la version précédente. */
const CACHE_NAME = 'genuc-v3';
const OFFLINE_URL = '/offline.html';

/* Ressources critiques mises en cache immédiatement */
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/assets/logo-genuc.png',
];

/* Stratégie : Network First pour les API, Cache First pour les assets statiques */

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  /* Ignorer les schémas non-HTTP (chrome-extension, etc.) */
  if (!request.url.startsWith('http')) return;

  const url = new URL(request.url);

  /* Ne pas cacher les chunks webpack (dev HMR) — toujours réseau */
  if (
    url.pathname.includes('.chunk.') ||
    url.pathname.includes('.hot-update.') ||
    url.pathname.endsWith('.chunk.js') ||
    url.pathname.endsWith('.chunk.mjs')
  ) {
    event.respondWith(fetch(request));
    return;
  }

  /* Ne pas intercepter les requêtes API — elles ont leur propre retry.
   *
   * Le commentaire disait déjà « ne pas intercepter », mais le code le
   * faisait : il appelait respondWith(fetch(request)) et, en cas d'échec
   * réseau, fabriquait une réponse 503 « Hors ligne. Reconnectez-vous pour
   * synchroniser. ». Deux dégâts :
   *
   *  1. Le vrai motif disparaissait. Toute panne — connexion coupée par le
   *     proxy sur un téléversement trop gros (413), backend en cours de
   *     redéploiement, DNS — devenait le même 503 « Hors ligne », et le
   *     diagnostic partait vers la connectivité alors que la session était
   *     valide. Constaté le 03/08/2026 sur l'enregistrement d'université.
   *  2. Côté Axios, une panne réseau n'est plus une panne mais une RÉPONSE
   *     HTTP : la branche `!error.response` de l'intercepteur (« Impossible
   *     de contacter le serveur ») devenait inatteignable, et un 503 est
   *     rejouable — chaque GET échoué repartait donc trois fois pour rien.
   *
   * Sans respondWith, le navigateur exécute la requête lui-même : vrais
   * codes de statut, vraies erreurs réseau, et le corps multipart n'est pas
   * relayé une seconde fois à travers le worker. */
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  /* Assets statiques : Cache First */
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      }))
    );
    return;
  }

  /* Navigation (pages HTML) : Network First, fallback offline */
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then(cached => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  /* Défaut : Network First */
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

/* Sync en arrière-plan pour les notes saisies hors ligne */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notes') {
    event.waitUntil(syncOfflineNotes());
  }
  if (event.tag === 'sync-presences') {
    event.waitUntil(syncOfflinePresences());
  }
});

async function syncOfflineNotes() {
  const db = await openOfflineDB();
  const pendingNotes = await db.getAll('pending-notes');
  for (const entry of pendingNotes) {
    try {
      await fetch(entry.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': entry.token },
        body: JSON.stringify(entry.payload)
      });
      await db.delete('pending-notes', entry.id);
    } catch { /* retry au prochain sync */ }
  }
}

async function syncOfflinePresences() {
  const db = await openOfflineDB();
  const pending = await db.getAll('pending-presences');
  for (const entry of pending) {
    try {
      await fetch('/api/presences/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': entry.token },
        body: JSON.stringify(entry.data)
      });
      await db.delete('pending-presences', entry.id);
    } catch { /* retry */ }
  }
}

/* IndexedDB simple pour stockage offline */
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('genuc-offline', 1);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('pending-notes'))
        db.createObjectStore('pending-notes', { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains('pending-presences'))
        db.createObjectStore('pending-presences', { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => {
      const db = req.result;
      resolve({
        getAll: (store) => new Promise((res, rej) => {
          const tx = db.transaction(store, 'readonly');
          const req = tx.objectStore(store).getAll();
          req.onsuccess = () => res(req.result);
          req.onerror = () => rej(req.error);
        }),
        delete: (store, id) => new Promise((res, rej) => {
          const tx = db.transaction(store, 'readwrite');
          const req = tx.objectStore(store).delete(id);
          req.onsuccess = () => res();
          req.onerror = () => rej(req.error);
        })
      });
    };
    req.onerror = () => reject(req.error);
  });
}

/* Push Notifications */
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.titre || 'GENUC', {
      body: data.message || 'Nouvelle notification',
      icon: '/assets/logo-genuc.png',
      badge: '/favicon.ico',
      tag: data.tag || 'genuc-notif',
      data: { url: data.url || '/' },
      actions: [
        { action: 'open', title: 'Ouvrir' },
        { action: 'dismiss', title: 'Ignorer' }
      ]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'open' || !event.action) {
    const url = event.notification.data?.url || '/';
    event.waitUntil(clients.openWindow(url));
  }
});
