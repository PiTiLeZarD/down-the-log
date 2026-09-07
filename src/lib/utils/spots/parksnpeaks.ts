import axios from "axios";
import { DateTime } from "luxon";
import { Platform } from "react-native";
import { freq2band } from "../../data/bands";
import { resolveMode } from "../../data/modes";
import { EventType } from "../event-rules";
import { TIMEOUT_MS, applyProxy, fetchJsonArray } from "./fetch";
import { Spot } from "./types";

// What ParksnPeaks actually returns from /api/ALL. Everything is a string, including the
// frequency, and `actSpoter` really is spelled that way on their side.
type RawPnpSpot = {
    actID: string;
    actTime: string;
    actCallsign: string;
    actMode: string;
    actFreq: string;
    actClass: string;
    altClass: string;
    actSiteID: string;
    actLocation: string;
    altLocation: string;
    actComments: string;
    actSpoter: string;
    WWFFid: string;
};

export const PNP_SPOTS_API = "https://parksnpeaks.org/api/ALL";
export const PNP_SPOT_POST_API = "https://parksnpeaks.org/api/SPOT";

// ParksnPeaks carries a dozen award schemes. The three the app models get their own programme; the
// rest — shires, silos, ZLOTA — land in `sig`, which is where the QSO type keeps them too, and
// carry their own name so the badge still says where they came from.
const programmes: Record<string, EventType> = {
    WWFF: "wwff",
    WWFFDX: "wwff",
    VKFF: "wwff",
    SOTA: "sota",
    POTA: "pota",
    IOTA: "iota",
};

export const parsePnpSpot = (raw: RawPnpSpot): Spot => {
    const frequency = raw.actFreq ? +raw.actFreq : undefined;
    const rawClass = raw.actClass || raw.altClass;
    const programme = programmes[rawClass?.toUpperCase()];
    return {
        id: `pnp-${raw.actID}`,
        source: "pnp",
        programme: programme || "sig",
        programmeLabel: programme ? undefined : rawClass || undefined,
        // Spot times are UTC, spelled without a zone.
        date: DateTime.fromFormat(raw.actTime, "yyyy-MM-dd HH:mm:ss", { zone: "utc" }),
        callsign: raw.actCallsign,
        frequency: frequency && !isNaN(frequency) ? frequency : undefined,
        band: freq2band(frequency) || undefined,
        mode: resolveMode(raw.actMode),
        reference: raw.actSiteID || raw.WWFFid || undefined,
        referenceName: raw.actLocation || raw.altLocation || undefined,
        spotter: raw.actSpoter || undefined,
        comments: raw.actComments || undefined,
    };
};

export const fetchPnpSpots = async (proxy?: string): Promise<Spot[]> =>
    (await fetchJsonArray<RawPnpSpot>(PNP_SPOTS_API, proxy)).map(parsePnpSpot);

// The award schemes ParksnPeaks will accept a spot for, as their API spells them.
export const pnpSpotClasses: Partial<Record<EventType, string>> = {
    wwff: "WWFF",
    sota: "SOTA",
    pota: "POTA",
};

export type PnpSpotRequest = {
    actClass: string;
    actCallsign: string;
    actSite: string;
    mode: string;
    freq: string;
    comments: string;
};

export type PnpCredentials = { userID: string; apiKey: string };

/**
 * Posting needs the operator's own ParksnPeaks user name and the API key from their user options
 * page, which is why this is opt-in in settings rather than something the app can do on its own.
 *
 * The relay chain used for reading is no help here — those services only proxy GETs — so on web this
 * needs the operator's own worker, which passes POSTs through to the one allowlisted host. Without
 * one configured the browser's CORS check kills the request, and saying so up front beats a network
 * error with no explanation.
 */
export const postPnpSpot = async (
    request: PnpSpotRequest,
    credentials: PnpCredentials,
    proxy?: string,
): Promise<void> => {
    if (Platform.OS === "web" && !proxy)
        throw new Error(
            "ParksnPeaks can't be posted to from a browser without your own relay — see Spots relay in settings.",
        );
    const url = Platform.OS === "web" ? applyProxy(proxy as string, PNP_SPOT_POST_API) : PNP_SPOT_POST_API;
    const { data } = await axios.post(
        url,
        { ...request, userID: credentials.userID, APIKey: credentials.apiKey },
        { timeout: TIMEOUT_MS, headers: { "content-type": "application/json" } },
    );
    // Their API answers 200 with a body describing the failure rather than an HTTP status, so the
    // body is what decides whether the spot landed.
    const body = typeof data === "string" ? data : JSON.stringify(data);
    if (/error|invalid|not authorised|not authorized|denied/i.test(body)) throw new Error(body.slice(0, 200));
};
