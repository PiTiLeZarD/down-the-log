import { DateTime } from "luxon";
import { freq2band } from "../../data/bands";
import { resolveMode } from "../../data/modes";
import { fetchJsonArray } from "./fetch";
import { Spot } from "./types";

// What pota.app hands back from /spot/activator: the current spot per activator, worldwide. Every
// spot is public and the endpoint answers with `access-control-allow-origin: *`, so no relay.
type RawPotaSpot = {
    spotId: number;
    activator: string;
    frequency: string;
    mode: string;
    reference: string;
    parkName: string | null;
    spotTime: string;
    spotter: string;
    comments: string | null;
    source: string;
    invalid: boolean | null;
    name: string | null;
    locationDesc: string | null;
    grid4: string | null;
    grid6: string | null;
    latitude: number | null;
    longitude: number | null;
};

export const POTA_SPOTS_API = "https://api.pota.app/spot/activator";

// POTA quotes kHz as a string; every other source in the app talks MHz.
const khz2mhz = (frequency: string): number | undefined => {
    const parsed = +frequency;
    return parsed && !isNaN(parsed) ? parsed / 1000 : undefined;
};

export const parsePotaSpot = (raw: RawPotaSpot): Spot => {
    const frequency = khz2mhz(raw.frequency);
    return {
        id: `pota-${raw.spotId}`,
        source: "pota",
        programme: "pota",
        // Their timestamps are UTC, spelled without a zone.
        date: DateTime.fromISO(raw.spotTime, { zone: "utc" }),
        callsign: raw.activator,
        frequency,
        band: freq2band(frequency) || undefined,
        mode: resolveMode(raw.mode),
        reference: raw.reference,
        referenceName: raw.name || raw.parkName || undefined,
        locator: raw.grid6 || raw.grid4 || undefined,
        spotter: raw.spotter,
        comments: raw.comments || undefined,
        // "RBN" is the skimmer network relayed into POTA; anything else came from a person.
        automatic: raw.source === "RBN",
    };
};

export const fetchPotaSpots = async (): Promise<Spot[]> => {
    const raw = await fetchJsonArray<RawPotaSpot>(POTA_SPOTS_API);
    // POTA flags spots its users have reported as wrong rather than deleting them.
    return raw.filter((spot) => !spot.invalid).map(parsePotaSpot);
};
