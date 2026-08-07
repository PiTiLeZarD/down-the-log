// Service worker for the exported web build.
//
// Everything is resolved from `registration.scope` rather than hard-coded paths: the export is
// served from /down-the-log/ on GitHub Pages but from the bundle root under Tauri, so a literal
// "/index.html" would be wrong in one of the two.
//
// Nothing here is generated at build time. Expo hashes every filename under _expo/static, so a
// precache list would have to be regenerated on each export; runtime cache-first over those
// immutable URLs gets the same offline result with no build step.

// scripts/pwa.mjs stamps the release version here on export, so every release lands under a fresh
// cache name and `activate` drops the previous one. Left as-is when served straight out of public/.
const CACHE = "down-the-log-__CACHE_VERSION__";

const scope = self.registration.scope;
const shell = new URL("./", scope).href;
const precache = [shell, "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png"].map(
    (path) => new URL(path, scope).href,
);

// Content-hashed output: the URL changes whenever the bytes do, so a hit can never be stale.
const isImmutable = (pathname) => pathname.includes("/_expo/static/") || pathname.includes("/assets/");

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(CACHE)
            .then((cache) => cache.addAll(precache))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
            .then(() => self.clients.claim()),
    );
});

const cacheable = (response) => response && response.status === 200 && response.type === "basic";

const put = async (request, response) => {
    if (!cacheable(response)) return response;
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
    return response;
};

const cacheFirst = async (request) => {
    const hit = await caches.match(request);
    if (hit) return hit;
    return put(request, await fetch(request));
};

// The app is `output: "single"`, so every route is the same document. Prefer the network so a
// deploy is picked up on the next load, and fall back to the cached shell when offline.
const shellFirst = async (request) => {
    try {
        return await put(new Request(shell), await fetch(request));
    } catch {
        const hit = await caches.match(shell);
        if (hit) return hit;
        throw new Error("offline and no cached shell");
    }
};

const staleWhileRevalidate = async (request) => {
    const hit = await caches.match(request);
    const fresh = fetch(request)
        .then((response) => put(request, response))
        .catch(() => undefined);
    return hit || (await fresh) || Response.error();
};

self.addEventListener("fetch", (event) => {
    const request = event.request;
    if (request.method !== "GET") return;

    const url = new URL(request.url);
    // hamqth, the NOAA solar feed, the geocoder and the OSM tiles are all cross-origin and either
    // change constantly or return opaque responses. Leave them to the network.
    if (url.origin !== self.location.origin) return;

    if (request.mode === "navigate") {
        event.respondWith(shellFirst(request));
    } else if (isImmutable(url.pathname)) {
        event.respondWith(cacheFirst(request));
    } else {
        event.respondWith(staleWhileRevalidate(request));
    }
});

self.addEventListener("message", (event) => {
    if (event.data === "SKIP_WAITING") self.skipWaiting();
});
