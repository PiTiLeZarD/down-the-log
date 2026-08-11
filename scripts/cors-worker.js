/**
 * Optional CORS relay for the ParksnPeaks spots plugin.
 *
 * ParksnPeaks serves no `access-control-allow-origin`, so the web build can't call it from the
 * browser. The plugin falls back to public relays, but those are unreliable against this host —
 * most of them proxy from a data centre and get refused or time out. Running this instead gives a
 * relay that answers every time and involves nobody but you.
 *
 * Deploy (free tier is far more than enough for one request a minute):
 *
 *     npx wrangler deploy scripts/cors-worker.js --name dtl-spots --compatibility-date 2024-01-01
 *
 * Then paste the worker URL into Settings > APIs > Spots relay, as:
 *
 *     https://dtl-spots.<your-subdomain>.workers.dev/?url={url}
 *
 * Only the allowlisted host can be fetched, so this can't be turned into an open proxy.
 */

const ALLOWED_HOSTS = ["parksnpeaks.org", "www.parksnpeaks.org"];

const cors = {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, OPTIONS",
};

export default {
    async fetch(request) {
        if (request.method === "OPTIONS") return new Response(null, { headers: cors });

        const target = new URL(request.url).searchParams.get("url");
        if (!target) return new Response("missing url parameter", { status: 400, headers: cors });

        let host;
        try {
            host = new URL(target).hostname;
        } catch {
            return new Response("malformed url parameter", { status: 400, headers: cors });
        }
        if (!ALLOWED_HOSTS.includes(host)) return new Response("host not allowed", { status: 403, headers: cors });

        const upstream = await fetch(target, { headers: { accept: "application/json" } });
        return new Response(upstream.body, {
            status: upstream.status,
            headers: { ...cors, "content-type": "application/json", "cache-control": "no-store" },
        });
    },
};
