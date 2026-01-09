const CACHE_NAME = 'portfolio-sop-v3';
const DYNAMIC_CACHE_NAME = 'portfolio-dynamic-v3';

// ✅ Only STATIC, SAFE files
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/admin.html',
  '/css/main.css',
  '/css/admin.css',
  '/manifest.json',
  '/assets/og-default.png'
];

// ---------- INSTALL ----------
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ---------- ACTIVATE ----------
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => 
          (k !== CACHE_NAME && k !== DYNAMIC_CACHE_NAME) ? caches.delete(k) : null
        )
      )
    )
  );
  self.clients.claim();
});

// ---------- FETCH ----------
self.addEventListener('fetch', event => {
  const { request } = event;

  // 🚫 Ignore favicon completely
  if (request.url.includes('favicon.ico')) return;

  // 🚫 Ignore Firebase & CDN requests for dynamic data
  if (
    request.url.includes('firebase') ||
    request.url.includes('googleapis') ||
    request.url.includes('chart.js') ||
    request.url.includes('cdn.jsdelivr.net')
  ) {
    return;
  }

  // ✅ Cache-first for navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request)
          .then(response => {
            // Cache the navigation response for future use
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
            return response;
          })
          .catch(() => caches.match('/index.html'));
      })
    );
    return;
  }

  // ✅ Stale-while-revalidate for static assets
  if (request.destination === 'style' || request.destination === 'script') {
    event.respondWith(
      caches.match(request).then(cached => {
        const fetchPromise = fetch(request)
          .then(response => {
            // Update cache with fresh response
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
            return response;
          })
          .catch(() => cached);
        
        return cached || fetchPromise;
      })
    );
    return;
  }

  // ✅ Cache-first for images with dynamic cache fallback
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request)
          .then(response => {
            // Cache images in dynamic cache for future offline use
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE_NAME).then(cache => {
              cache.put(request, responseToCache);
            });
            return response;
          })
          .catch(() => {
            // Return a placeholder image if both cache and network fail
            return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#e0e0e0"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#9e9e9e" font-family="Arial, sans-serif" font-size="14">Image Not Available</text></svg>', {
              headers: { 'Content-Type': 'image/svg+xml' }
            });
          });
      })
    );
    return;
  }

  // ✅ Cache-first for other static assets
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;

      // If not in cache, try to fetch from network and cache dynamically
      return fetch(request)
        .then(response => {
          // Cache dynamic content for future use
          const responseToCache = response.clone();
          caches.open(DYNAMIC_CACHE_NAME).then(cache => {
            cache.put(request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If network fails, return appropriate fallback based on request type
          if (request.destination === 'document') {
            return caches.match('/index.html');
          }
          return new Response(null, { status: 503, statusText: 'Service Unavailable' });
        });
    })
  );
});

// ---------- BACKGROUND SYNC (for contact form submissions) ----------
self.addEventListener('sync', event => {
  if (event.tag === 'sync-contact-form') {
    event.waitUntil(syncContactForm());
  }
});

// Function to sync contact form submissions when back online
async function syncContactForm() {
  const formSubmissions = await getPendingFormSubmissions();
  for (const submission of formSubmissions) {
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submission)
      });
      await removePendingFormSubmission(submission.id);
    } catch (error) {
      console.error('Failed to sync contact form:', error);
    }
  }
}

// Helper functions for background sync (would need to be implemented in main app)
function getPendingFormSubmissions() {
  return new Promise((resolve) => {
    // This would typically retrieve from IndexedDB
    resolve([]);
  });
}

function removePendingFormSubmission(id) {
  return new Promise((resolve) => {
    // This would typically remove from IndexedDB
    resolve();
  });
}
