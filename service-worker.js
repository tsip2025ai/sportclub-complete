const CACHE_NAME = "sportclub-v2.0";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json"
];

// Install
self.addEventListener("install", (e) => {
  console.log("[SW] Installing...");
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Caching assets");
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate
self.addEventListener("activate", (e) => {
  console.log("[SW] Activating...");
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch
self.addEventListener("fetch", (e) => {
  // Network first for Firebase
  if (e.request.url.includes("firebase") || e.request.url.includes("gstatic")) {
    e.respondWith(fetch(e.request));
    return;
  }
  
  // Cache first for static assets
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request).then((fetchResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, fetchResponse.clone());
          return fetchResponse;
        });
      });
    }).catch(() => {
      if (e.request.destination === 'document') {
        return caches.match('./index.html');
      }
    })
  );
});

// Background Sync
self.addEventListener('sync', (e) => {
  console.log("[SW] Background sync:", e.tag);
  
  if (e.tag === 'sync-data') {
    e.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    const data = await getLocalData();
    
    if (!data || !data.sync || !data.sync.syncCode) {
      console.log("[SW] No sync code available");
      return;
    }
    
    const response = await fetch(
      `https://sportclub-7b155-default-rtdb.europe-west1.firebasedatabase.app/sync/${data.sync.syncCode}.json`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }
    );
    
    if (response.ok) {
      console.log("[SW] Sync successful!");
      
      // Notify all clients
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'SYNC_COMPLETE',
          timestamp: Date.now()
        });
      });
    }
  } catch (error) {
    console.error("[SW] Sync failed:", error);
    throw error; // Retry
  }
}

async function getLocalData() {
  const clients = await self.clients.matchAll();
  if (clients.length === 0) return null;
  
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = (event) => {
      resolve(event.data);
    };
    
    clients[0].postMessage({ type: 'GET_DATA' }, [channel.port2]);
    
    setTimeout(() => resolve(null), 1000);
  });
}

// Push Notifications
self.addEventListener('push', (e) => {
  console.log("[SW] Push received");
  
  const data = e.data ? e.data.json() : {};
  const title = data.title || '🏆 SportClub';
  const options = {
    body: data.body || 'Νέα ενημέρωση!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      { action: 'open', title: 'Άνοιγμα' },
      { action: 'close', title: 'Κλείσιμο' }
    ]
  };
  
  e.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (e) => {
  console.log("[SW] Notification clicked");
  e.notification.close();
  
  if (e.action === 'open' || !e.action) {
    e.waitUntil(
      clients.openWindow('/')
    );
  }