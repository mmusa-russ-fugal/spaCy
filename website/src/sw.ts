/*
 * Service worker source (Serwist). Compiled by @serwist/next (see
 * next.config.mjs) into public/sw.js at build time, with the precache
 * manifest injected as self.__SW_MANIFEST.
 *
 * This replaces the Phase 1 kill-switch worker that previously lived at
 * public/sw.js: browsers re-fetch /sw.js on navigation, so returning
 * visitors' kill-switch workers are superseded by this one at the same URL.
 *
 * Swap seam: to replace the PWA implementation, swap this file and the
 * withSerwist() wrapper in next.config.mjs — nothing else in the site
 * depends on Serwist.
 */
import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry } from 'serwist'
import { NetworkOnly, Serwist } from 'serwist'

declare const self: ServiceWorkerGlobalScope & {
    // Injected at build time by @serwist/next's InjectManifest transform.
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
}

// Hosts the co-hosted /composer app streams its in-browser engine from: the
// Pyodide runtime (jsdelivr) and the spaCy WASM wheels (raw.githubusercontent).
// These arrive as cross-origin ES-module import()s and large WASM downloads.
// defaultCache routes every cross-origin request through a NetworkFirst with a
// 10s timeout and a 32-entry cap — replaying a module through that cache breaks
// its CORS/module validity ("Importing a module script failed") and the cap
// thrashes on the dozens of files a Pyodide load pulls. Pass them straight to
// the network, uncached, so the SW never touches the engine load.
const ENGINE_CDN_HOSTS = new Set(['cdn.jsdelivr.net', 'raw.githubusercontent.com'])

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    // Purge legacy `-precache-` caches left by the pre-Phase-1 next-pwa/workbox
    // era for stragglers the deleted kill-switch worker never reached. The
    // cleanup predicate only deletes caches whose name contains `-precache-`
    // plus this registration's scope and is not the current precache name, so
    // Serwist's own cache is never touched.
    precacheOptions: { cleanupOutdatedCaches: true },
    skipWaiting: true,
    clientsClaim: true,
    // Order matters: first match wins, so the engine-CDN passthrough must sit
    // ahead of defaultCache's catch-all cross-origin rule.
    runtimeCaching: [
        {
            matcher: ({ url }) => ENGINE_CDN_HOSTS.has(url.hostname),
            handler: new NetworkOnly(),
        },
        ...defaultCache,
    ],
})

serwist.addEventListeners()
