/**
 * OpenScroll service worker.
 *
 * App shell: cache-first with a background refresh, so launches are instant.
 * Scripture data: cache-first and never revalidated — every file under /data/
 * is immutable, which is what makes the whole Bible usable offline.
 */
const SHELL = 'openscroll-shell-v1'
const DATA = 'openscroll-data-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(caches.open(SHELL))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== SHELL && k !== DATA).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  const isData = url.pathname.includes('/data/')

  event.respondWith(
    caches.open(isData ? DATA : SHELL).then(async (cache) => {
      const hit = await cache.match(request)
      if (hit) {
        if (!isData) {
          // Refresh the shell quietly for the next launch.
          fetch(request)
            .then((res) => res.ok && cache.put(request, res.clone()))
            .catch(() => undefined)
        }
        return hit
      }
      try {
        const res = await fetch(request)
        if (res.ok) cache.put(request, res.clone())
        return res
      } catch (err) {
        // Offline with nothing cached: fall back to the app shell for
        // navigations so the reader still gets the interface.
        if (request.mode === 'navigate') {
          const shell = await caches.match('./')
          if (shell) return shell
        }
        throw err
      }
    })
  )
})
