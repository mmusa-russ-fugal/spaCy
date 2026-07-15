/*
 * Kill-switch service worker.
 *
 * The site previously registered a next-pwa (Workbox) service worker that
 * precached pages and assets. next-pwa was removed from the build, but
 * returning visitors still have the old service worker installed, and it
 * would keep serving stale cached content forever. Browsers re-fetch the
 * script at this URL (/sw.js) on navigation, so shipping this file at the
 * same path replaces the old worker with one that cleans up after it:
 *
 *   1. install:  skipWaiting() — activate immediately, don't wait for the
 *      old worker's clients to close.
 *   2. activate: delete ALL caches, unregister this registration, then
 *      reload every open client so it loads fresh content straight from
 *      the network, uncontrolled by any service worker.
 *
 * IMPORTANT: this file must remain deployed for as long as stale clients
 * may return (6-12 months minimum), unless a future phase replaces it with
 * a real service worker at the same URL. Do not delete it early — visitors
 * who haven't returned since the next-pwa removal would keep a permanently
 * stale cache.
 */

self.addEventListener('install', () => {
    self.skipWaiting()
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            const cacheKeys = await caches.keys()
            await Promise.all(cacheKeys.map((key) => caches.delete(key)))
            await self.registration.unregister()
            const clients = await self.clients.matchAll({ type: 'window' })
            await Promise.all(
                clients.map((client) => client.navigate(client.url).catch(() => undefined))
            )
        })()
    )
})
