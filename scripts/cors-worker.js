/**
 * CORS relay for ParksnPeaks spots and LoTW confirmations, deployed at cors.jadami.com.
 *
 * Neither parksnpeaks.org nor lotw.arrl.org serves `access-control-allow-origin`, so the web build
 * and the Tauri shell can't call them from the webview. They come through here instead; iOS and
 * Android call both directly.
 *
 * POSTs are forwarded too, which is what lets the web build spot itself on ParksnPeaks. The API key
 * travels in that POST's body and the LoTW password in the report's query string; both are passed
 * straight through and nothing is stored or logged here.
 *
 * Deploy (free tier is far more than enough for one request a minute):
 *
 *     cd scripts && npx wrangler deploy
 *
 * Only the allowlisted hosts can be fetched, so this can't be turned into an open proxy, and only
 * the app's own origins are answered, so other sites can't spend its quota from their visitors'
 * browsers. The Origin check is a browser-level fence, not authentication: anything outside a browser
 * can send whatever Origin it likes.
 */

const ALLOWED_HOSTS = ["parksnpeaks.org", "www.parksnpeaks.org", "lotw.arrl.org"];

const ALLOWED_ORIGINS = [
    // The web demo on GitHub Pages.
    "https://pitilezard.github.io",
    // The Tauri shell: macOS and Linux serve the app from tauri://, Windows from https://tauri.localhost.
    "tauri://localhost",
    "https://tauri.localhost",
];

// Any port, so `pnpm start:web` and `pnpm start:tauri` work against the deployed relay.
const isAllowedOrigin = (origin) =>
    ALLOWED_ORIGINS.includes(origin) || /^http:\/\/localhost(:\d+)?$/.test(origin);

const corsFor = (origin) => ({
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    vary: "origin",
});

export default {
    async fetch(request) {
        const origin = request.headers.get("origin") || "";
        if (!isAllowedOrigin(origin)) return new Response("origin not allowed", { status: 403 });
        const cors = corsFor(origin);

        if (request.method === "OPTIONS") return new Response(null, { headers: cors });
        if (request.method !== "GET" && request.method !== "POST")
            return new Response("method not allowed", { status: 405, headers: cors });

        const target = new URL(request.url).searchParams.get("url");
        if (!target) return new Response("missing url parameter", { status: 400, headers: cors });

        let host;
        try {
            host = new URL(target).hostname;
        } catch {
            return new Response("malformed url parameter", { status: 400, headers: cors });
        }
        if (!ALLOWED_HOSTS.includes(host)) return new Response("host not allowed", { status: 403, headers: cors });

        const upstream = await fetch(target, {
            method: request.method,
            headers: {
                accept: request.headers.get("accept") || "application/json",
                ...(request.method === "POST" ? { "content-type": "application/json" } : {}),
            },
            ...(request.method === "POST" ? { body: await request.text() } : {}),
        });
        // Upstream's own content type is carried through rather than overwritten: the spot feeds
        // answer JSON, but the LoTW report is ADIF text, and telling the client it was JSON made
        // axios hand back a parse error instead of the file.
        return new Response(upstream.body, {
            status: upstream.status,
            headers: {
                ...cors,
                "content-type": upstream.headers.get("content-type") || "application/json",
                "cache-control": "no-store",
            },
        });
    },
};
