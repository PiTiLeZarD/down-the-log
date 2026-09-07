import axios from "axios";
import { Platform } from "react-native";

export const TIMEOUT_MS = 12000;

// POTA and SOTA both answer with `access-control-allow-origin: *`, so they're called directly on
// every platform. ParksnPeaks serves no CORS header at all, so anything running in a browser engine
// — the web build and the Tauri shell alike — has to go through a relay.
//
// The free relays are mostly useless against that host: the ones that proxy from a data centre get
// refused or time out. jina.ai is the one that answers reliably, so it leads, with the other two
// behind it in case that changes. Only public spot data crosses them, never credentials — an
// operator who'd rather not involve a third party at all can point `spotsProxy` at their own relay
// (see scripts/cors-worker.js), which is then tried first.
const relays = [
    (url: string) => `https://r.jina.ai/${url}`,
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

export const applyProxy = (template: string, url: string) =>
    template.includes("{url}")
        ? template.replace("{url}", encodeURIComponent(url))
        : `${template}${encodeURIComponent(url)}`;

export const relayedSources = (url: string, proxy?: string): string[] => {
    if (Platform.OS !== "web") return [url];
    const chain = relays.map((relay) => relay(url));
    return proxy ? [applyProxy(proxy, url), ...chain] : chain;
};

// Relays disagree about how much they wrap the payload — some hand back the raw body, jina.ai
// prefixes it with markdown headers. The spot array is the only JSON any of them carry, so it's cut
// out by its brackets rather than by trusting the envelope.
export const parseArray = <T>(body: unknown): T[] | undefined => {
    if (Array.isArray(body)) return body as T[];
    if (typeof body !== "string") return undefined;
    const start = body.indexOf("[");
    const end = body.lastIndexOf("]");
    if (start < 0 || end < start) return undefined;
    try {
        const parsed = JSON.parse(body.slice(start, end + 1));
        return Array.isArray(parsed) ? (parsed as T[]) : undefined;
    } catch {
        return undefined;
    }
};

// The cache-buster isn't optional: a relay's failure response was coming back out of the browser's
// disk cache, so one stale 408 answered every retry for as long as it lived.
export const bustCache = (url: string) => `${url}${url.includes("?") ? "&" : "?"}_=${Date.now()}`;

export const fetchJsonArray = async <T>(url: string, proxy?: string): Promise<T[]> => {
    for (const source of relayedSources(bustCache(url), proxy)) {
        try {
            const { data } = await axios.get(source, { timeout: TIMEOUT_MS });
            const parsed = parseArray<T>(data);
            if (parsed) return parsed;
        } catch {
            // A dead relay is the normal case rather than the exception: fall through to the next.
        }
    }
    throw new Error(`no source answered for ${url}`);
};
