import { DateTime } from "luxon";
import type { QSO } from "../../components/qso";
import potawwfflinks from "../../data/potawwfflinks.json";
import { baseCallsign } from "../callsign";
import { eventDataMap } from "../event-rules";
import { maidenDistance, normalise } from "../locator";
import { Spot } from "./types";

const links = potawwfflinks as Record<string, string>;

// The reference fields on the *other* station's side of a QSO. A spot is only new if none of these
// has ever held it.
const referenceFields: (keyof QSO)[] = ["pota", "wwff", "sota", "iota", "sigInfo"];

type LogIndex = {
    references: Set<string>;
    callsigns: Set<string>;
    // `callsign|band|mode|utc day`, which is what makes a second contact a dupe rather than a catch.
    dupes: Set<string>;
};

const dupeKey = (callsign: string, band?: string, mode?: string, date?: DateTime) =>
    `${baseCallsign(callsign) || callsign.toUpperCase()}|${band || ""}|${mode || ""}|${date?.toUTC().toFormat("yyyyMMdd") || ""}`;

// Keyed on the array identity, the same trick `qsosByCallsign` uses: the store never mutates its
// arrays, so a new log means a new reference and a rebuilt index. Without this every spot row would
// walk the whole log on every render.
const indexes = new WeakMap<QSO[], LogIndex>();

export const logIndex = (qsos: QSO[]): LogIndex => {
    const cached = indexes.get(qsos);
    if (cached) return cached;
    const index: LogIndex = { references: new Set(), callsigns: new Set(), dupes: new Set() };
    qsos.forEach((qso) => {
        referenceFields.forEach((field) => {
            const value = qso[field] as string | undefined;
            if (value) index.references.add(value.toUpperCase());
        });
        const base = baseCallsign(qso.callsign) || qso.callsign.toUpperCase();
        index.callsigns.add(base);
        index.dupes.add(dupeKey(qso.callsign, qso.band, qso.mode, qso.date));
    });
    indexes.set(qsos, index);
    return index;
};

export type SpotStatus = {
    // Nothing in the log has ever worked this reference — the one thing a hunter is scanning for.
    newReference: boolean;
    workedBefore: boolean;
    // Already worked on this band and mode today, so chasing it again scores nothing.
    dupe: boolean;
};

// A park spotted as US-0119 is the same park the log knows as KFF-0119, and calling it new because
// the other network's name for it is missing would be a lie in the one column that matters.
const referenceAliases = (reference: string): string[] => {
    const upper = reference.toUpperCase();
    const linked = links[upper];
    const reversed = Object.keys(links).find((pota) => links[pota] === upper);
    return [upper, ...(linked ? [linked.toUpperCase()] : []), ...(reversed ? [reversed.toUpperCase()] : [])];
};

export const spotStatus = (spot: Spot, qsos: QSO[]): SpotStatus => {
    const index = logIndex(qsos);
    const base = baseCallsign(spot.callsign) || spot.callsign.toUpperCase();
    return {
        newReference: !!spot.reference && !referenceAliases(spot.reference).some((ref) => index.references.has(ref)),
        workedBefore: index.callsigns.has(base),
        dupe: index.dupes.has(dupeKey(spot.callsign, spot.band, spot.mode, DateTime.utc())),
    };
};

// Spots don't all carry a gridsquare — ParksnPeaks carries none at all — but the app already ships
// the locator of every park and summit, so the reference itself answers where it is.
export const spotLocator = (spot: Spot): string | undefined => {
    if (spot.locator) return normalise(spot.locator);
    if (!spot.reference) return undefined;
    const data = eventDataMap[spot.programme]?.[spot.reference];
    return data?.locator ? normalise(data.locator) : undefined;
};

export const spotDistance = (spot: Spot, myLocator?: string, imperial?: boolean): number | undefined => {
    const locator = spotLocator(spot);
    const mine = normalise(myLocator);
    if (!locator || !mine) return undefined;
    return maidenDistance(mine, locator, imperial);
};
