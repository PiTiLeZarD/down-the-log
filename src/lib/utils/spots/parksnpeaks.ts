import axios from "axios";
import { DateTime } from "luxon";
import { freq2band } from "../../data/bands";
import { resolveMode } from "../../data/modes";
import { EventType } from "../event-rules";
import { TIMEOUT_MS, fetchJsonArray, relayed } from "./fetch";
import { Spot } from "./types";

// What ParksnPeaks actually returns from /api/ALL, the legacy feed the Oct 2026 rebuild kept. Everything
// but the ID is a string, including the frequency, and `actSpoter` really is spelled that way on their side.
type RawPnpSpot = {
    actId: number;
    actTime: string;
    actCallsign: string;
    actMode: string;
    actFreq: string;
    actClass: string;
    actSiteID: string;
    actLocation: string;
    altLocation: string;
    actComments: string;
    actSpoter: string;
    WWFFid: string;
};

export const PNP_SPOTS_API = "https://parksnpeaks.org/api/ALL";
export const PNP_SPOT_POST_API = "https://parksnpeaks.org/api/spots";

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
    const rawClass = raw.actClass;
    const programme = programmes[rawClass?.toUpperCase()];
    return {
        id: `pnp-${raw.actId}`,
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

export const fetchPnpSpots = async (): Promise<Spot[]> =>
    (await fetchJsonArray<RawPnpSpot>(PNP_SPOTS_API, true)).map(parsePnpSpot);

// POST /api/spots as documented at parksnpeaks.org/api. There is no award class any more: they work it
// out from the reference, and a free (QRP) activation sends its position as the reference instead.
export type PnpSpotRequest = {
    activator: string;
    spotter: string;
    reference: string;
    // kHz, unlike the MHz in the feed.
    frequency: string;
    mode: string;
    comments: string;
};

export type PnpCredentials = { userID: string; apiKey: string };

/**
 * Posting needs the operator's own ParksnPeaks user name and the API key from their user options
 * page, which is why this is opt-in in settings rather than something the app can do on its own.
 *
 * On web this goes through the same relay as reading, which passes POSTs through too.
 */
export const postPnpSpot = async (
    request: PnpSpotRequest,
    credentials: PnpCredentials,
): Promise<void> => {
    const fields = { ...request, userID: credentials.userID, APIKey: credentials.apiKey };
    const { data } = await axios.post(
        relayed(PNP_SPOT_POST_API),
        // Form fields, as their docs post them.
        Object.entries(fields)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join("&"),
        { timeout: TIMEOUT_MS, headers: { "content-type": "application/x-www-form-urlencoded" } },
    );
    // Their API answers 200 with `{ success: false, message }` rather than an HTTP status.
    if (data?.success !== true) throw new Error(String(data?.message || JSON.stringify(data)).slice(0, 200));
};
