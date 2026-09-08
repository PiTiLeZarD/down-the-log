import axios from "axios";
import { EventType } from "../event-rules";
import { Settings } from "../store";
import { TIMEOUT_MS } from "./fetch";
import { PnpCredentials, pnpSpotClasses, postPnpSpot } from "./parksnpeaks";
import { SelfSpotTarget } from "./types";

export const POTA_SPOT_POST_API = "https://api.pota.app/spot";

export const selfSpotTargets: SelfSpotTarget[] = ["pota", "pnp"];

export type SpotRequest = {
    // Who is on air. Not necessarily the operator: a chaser spotting the activator they just worked
    // is the commoner kind of spot, and both networks model the two callsigns separately.
    callsign: string;
    spotter: string;
    programme: EventType;
    reference: string;
    // MHz, as everywhere else in the app.
    frequency: number;
    mode: string;
    comments: string;
};

export type SpotResult = { target: SelfSpotTarget; ok: boolean; error?: string };

// pota.app takes kHz, as a number rather than the string it hands back.
const mhz2khz = (frequency: number) => Math.round(frequency * 1000);

const postPotaSpot = async (request: SpotRequest): Promise<void> => {
    if (request.programme !== "pota")
        throw new Error("POTA only takes spots for a POTA reference — start a POTA session or set one.");
    const { data, status } = await axios.post(
        POTA_SPOT_POST_API,
        {
            activator: request.callsign,
            spotter: request.spotter,
            frequency: String(mhz2khz(request.frequency)),
            reference: request.reference,
            mode: request.mode,
            source: "Down the Log",
            comments: request.comments,
        },
        { timeout: TIMEOUT_MS, headers: { "content-type": "application/json" }, validateStatus: () => true },
    );
    // Their API is the one part of this that couldn't be verified without posting a real spot from a
    // real activation, so the server's own words are passed straight through rather than guessed at.
    if (status >= 400) throw new Error(`pota.app answered ${status}: ${JSON.stringify(data).slice(0, 200)}`);
};

const pnpCredentials = (settings: Settings): PnpCredentials => {
    if (!settings.pnpUserId || !settings.pnpApiKey)
        throw new Error("ParksnPeaks needs your user name and API key — see the cog on the Spots page.");
    return { userID: settings.pnpUserId, apiKey: settings.pnpApiKey };
};

// ParksnPeaks has no spotter field: the account the key belongs to is the spotter, and actCallsign
// is whoever is being spotted.
const postToPnp = async (request: SpotRequest, settings: Settings): Promise<void> => {
    const actClass = pnpSpotClasses[request.programme];
    if (!actClass) throw new Error(`ParksnPeaks doesn't take ${request.programme.toUpperCase()} spots from the API.`);
    await postPnpSpot(
        {
            actClass,
            actCallsign: request.callsign,
            actSite: request.reference,
            mode: request.mode,
            freq: String(request.frequency),
            comments: request.comments,
        },
        pnpCredentials(settings),
        settings.spotsProxy,
    );
};

const posters: Record<SelfSpotTarget, (request: SpotRequest, settings: Settings) => Promise<void>> = {
    pota: (request) => postPotaSpot(request),
    pnp: postToPnp,
};

/**
 * Posts to each network independently and reports on each: half a spot is still worth having, and an
 * operator standing on a summit needs to know which half made it rather than one blanket "failed".
 */
export const postSpot = async (
    targets: SelfSpotTarget[],
    request: SpotRequest,
    settings: Settings,
): Promise<SpotResult[]> =>
    Promise.all(
        targets.map(async (target) => {
            try {
                await posters[target](request, settings);
                return { target, ok: true };
            } catch (error) {
                return { target, ok: false, error: error instanceof Error ? error.message : String(error) };
            }
        }),
    );
