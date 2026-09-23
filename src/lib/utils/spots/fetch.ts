import axios from "axios";
import { Platform } from "react-native";

export const TIMEOUT_MS = 12000;

// POTA and SOTA both answer with `access-control-allow-origin: *`, so they're called directly on
// every platform. ParksnPeaks, LoTW and eQSL serve no CORS header at all, so anything running in a
// browser engine — the web build and the Tauri shell alike — has to go through a relay.
//
// This is scripts/cors-worker.js, deployed to Cloudflare. It only forwards to those hosts, and
// only for the app's own origins.
const RELAY = "https://cors.jadami.com/?url=";

/** Where a request for a host without CORS headers should actually go on this platform. */
export const relayed = (url: string): string =>
    Platform.OS === "web" ? `${RELAY}${encodeURIComponent(url)}` : url;

// The worker hands the upstream body back untouched, but ParksnPeaks labels its JSON as text/html,
// so the array can arrive either already parsed or as a string.
export const parseArray = <T>(body: unknown): T[] | undefined => {
    if (Array.isArray(body)) return body as T[];
    if (typeof body !== "string") return undefined;
    try {
        const parsed = JSON.parse(body);
        return Array.isArray(parsed) ? (parsed as T[]) : undefined;
    } catch {
        return undefined;
    }
};

// The cache-buster isn't optional: a relay's failure response was coming back out of the browser's
// disk cache, so one stale 408 answered every retry for as long as it lived.
export const bustCache = (url: string) => `${url}${url.includes("?") ? "&" : "?"}_=${Date.now()}`;

/** Fetches a JSON array. `relay` routes it through the CORS relay on web, for hosts that need one. */
export const fetchJsonArray = async <T>(url: string, relay = false): Promise<T[]> => {
    const busted = bustCache(url);
    const { data } = await axios.get(relay ? relayed(busted) : busted, { timeout: TIMEOUT_MS });
    const parsed = parseArray<T>(data);
    if (!parsed) throw new Error(`${url} didn't answer with a list`);
    return parsed;
};
