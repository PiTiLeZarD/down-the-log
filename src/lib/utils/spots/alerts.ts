import { DateTime } from "luxon";
import type { QSO } from "../../components/qso";
import { roundTo } from "../math";
import { baseCallsign } from "../callsign";
import type { NotifyOptions } from "../notify";
import { matchesSpotFilter } from "./filter";
import { MergedSpot, SpotFilter, isQrt, spotProgrammeLabel } from "./types";

// How many keys the seen set holds before the oldest fall out. An hour of spots from three networks
// is a few hundred, so this covers a long session without growing without bound.
const MAX_KEYS = 1000;
// A poll that lands after the laptop has been asleep sees an hour of spots at once, all of them
// unseen. Only what was posted since roughly the last poll is worth interrupting for; the rest is
// history, and the Spots page is where history belongs.
const MAX_AGE_MINUTES = 30;
// Even inside that window a wide rule can match a dozen spots in one poll. Past this they collapse
// into a single "N spots" notification, which is a nudge to look at the page rather than a stack of
// alerts nobody will read to the end of.
export const MAX_PER_POLL = 3;

// One activation, one alert. POTA re-posts a busy activation every few minutes and the merged row
// gets a new id each time, so the id can't be the key — the callsign, reference and band can. A
// band change is a genuinely new chance and does get its own alert.
export const alertKey = (spot: MergedSpot): string =>
    `${baseCallsign(spot.callsign) || spot.callsign.toUpperCase()}|${spot.reference || ""}|${spot.band || ""}`;

// Alerts have no rules of their own: a spot is worth a notification when it passes the same filter
// as the list. A station that has said it is packing up never is, whatever the filter says — the
// page may still list it, because it says the frequency is about to be free.
export const matchesSpotAlert = (spot: MergedSpot, filter: SpotFilter, qsos: QSO[]): boolean =>
    !isQrt(spot) && matchesSpotFilter(spot, filter, qsos);

export const newSpotAlerts = (
    spots: MergedSpot[],
    filter: SpotFilter,
    qsos: QSO[],
    seen: Set<string>,
    now: DateTime = DateTime.utc(),
): MergedSpot[] => {
    const cutoff = now.minus({ minutes: MAX_AGE_MINUTES });
    return spots.filter(
        (spot) =>
            spot.date.isValid &&
            spot.date >= cutoff &&
            !seen.has(alertKey(spot)) &&
            matchesSpotAlert(spot, filter, qsos),
    );
};

/**
 * Record every spot in the poll, matching or not. A rule the operator widens later must not then
 * fire for an hour of activations that were already on screen when they widened it.
 */
export const rememberSpots = (seen: Set<string>, spots: MergedSpot[]): Set<string> => {
    spots.forEach((spot) => {
        // Re-inserting a key it already holds would move it to the back of the eviction queue, and a
        // busy activation re-spotted every minute would then push everything else out.
        const key = alertKey(spot);
        if (!seen.has(key)) seen.add(key);
    });
    // A Set iterates in insertion order, so the oldest keys are the ones at the front.
    while (seen.size > MAX_KEYS) seen.delete(seen.values().next().value as string);
    return seen;
};

// Two lines with no room to explain themselves, so they carry what decides whether it is worth
// reaching for the radio: who, where on the dial, and what the reference is.
export const spotAlertNotification = (spot: MergedSpot): NotifyOptions => {
    const dial = spot.frequency ? `${roundTo(spot.frequency, 4)} MHz` : spot.band;
    const title = [spot.callsign, dial, spot.mode].filter(Boolean).join(" · ");
    const where = [spot.reference, spot.referenceName].filter(Boolean).join(" ");
    return {
        title,
        body: where || spotProgrammeLabel(spot),
        tag: alertKey(spot),
        url: "spots",
    };
};

export const spotAlertSummary = (count: number): NotifyOptions => ({
    title: `${count} new spots`,
    body: "More matched at once than is worth listing. Open the Spots page.",
    // A fixed tag, so a second busy poll replaces the summary rather than stacking another.
    tag: "spots-summary",
    url: "spots",
});

