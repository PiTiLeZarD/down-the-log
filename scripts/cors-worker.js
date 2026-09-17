/**
 * Optional CORS relay for the ParksnPeaks spots plugin and for LoTW confirmations.
 *
 * ParksnPeaks serves no `access-control-allow-origin`, so the web build can't call it from the
 * browser. The plugin falls back to public relays, but those are unreliable against this host —
 * most of them proxy from a data centre and get refused or time out. Running this instead gives a
 * relay that answers every time and involves nobody but you.
 *
 * POSTs are forwarded too, which is what lets the web build spot itself on ParksnPeaks: the public
 * relays only ever forward reads. The API key travels in the body of that POST, so use your own
 * worker rather than somebody else's if you spot yourself from a browser.
 *
 * Deploy (free tier is far more than enough for one request a minute):
 *
 *     npx wrangler deploy scripts/cors-worker.js --name dtl-spots --compatibility-date 2024-01-01
 *
 * Then paste the worker URL into Settings > APIs > Spots relay, as:
 *
 *     https://dtl-spots.<your-subdomain>.workers.dev/?url={url}
 *
 * The same worker serves Settings > API's > LoTW relay, which the web and desktop builds need for
 * the same reason — lotw.arrl.org sends no CORS header either. That request carries your LoTW
 * password in the query string, so only ever point the LoTW relay setting at a worker you run
 * yourself; the app deliberately refuses to fall back to the public relays for it.
 *
 * Only the allowlisted hosts can be fetched, so this can't be turned into an open proxy.
 */

const ALLOWED_HOSTS = ["parksnpeaks.org", "www.parksnpeaks.org", "lotw.arrl.org"];

const cors = {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
};

export default {
    async fetch(request) {
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
