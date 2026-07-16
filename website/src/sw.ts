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
import { Serwist } from 'serwist'

declare const self: ServiceWorkerGlobalScope & {
    // Injected at build time by @serwist/next's InjectManifest transform.
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
}

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: defaultCache,
})

serwist.addEventListeners()
