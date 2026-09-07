import { DateTime } from "luxon";
import type { QSO } from "../../components/qso";
import { Mode, isDigital } from "../../data/modes";
import type { EventType } from "../event-rules";
import { spotStatus } from "./status";
import { MergedSpot, SpotFilter, SpotModeGroup, SpotSource, isQrt } from "./types";

export const modeGroup = (mode?: Mode): SpotModeGroup | undefined =>
    !mode ? undefined : mode === "CW" ? "CW" : isDigital(mode) ? "Data" : "Phone";

// Everything the operator can hide behind a chip, so the page can say "3 filters on" and offer to
// clear them without listing the fields twice.
export const activeFilterCount = (filter: SpotFilter): number =>
    (filter.programmes.length ? 1 : 0) +
    (filter.bands.length ? 1 : 0) +
    (filter.modeGroups.length ? 1 : 0) +
    (filter.newOnly ? 1 : 0) +
    (filter.hideQrt ? 1 : 0) +
    (filter.hideAutomatic ? 1 : 0) +
    (filter.search ? 1 : 0);

const matchesSearch = (spot: MergedSpot, search: string): boolean => {
    const wanted = search.trim().toUpperCase();
    if (!wanted) return true;
    return [spot.callsign, spot.reference, spot.referenceName, spot.spotter]
        .filter(Boolean)
        .some((value) => (value as string).toUpperCase().includes(wanted));
};

// A merged row is kept when *any* of the spots behind it passes the programme test: a park spotted
// as both WWFF and POTA belongs in either list rather than only in the one its newest spot came from.
const matchesProgramme = (spot: MergedSpot, programmes: EventType[]): boolean =>
    !programmes.length || spot.sources.some((source) => programmes.includes(source.programme));

const matchesSource = (spot: MergedSpot, sources: SpotSource[]): boolean =>
    spot.sources.some((source) => sources.includes(source.source));

export const applySpotFilter = (
    spots: MergedSpot[],
    filter: SpotFilter,
    sources: SpotSource[],
    qsos: QSO[],
    now: DateTime = DateTime.utc(),
): MergedSpot[] => {
    const cutoff = now.minus({ minutes: filter.maxAgeMinutes });
    return spots.filter((spot) => {
        // An unparseable time can't be shown to be recent, so it goes with the stale ones.
        if (!spot.date.isValid || spot.date < cutoff) return false;
        if (!matchesSource(spot, sources)) return false;
        if (!matchesProgramme(spot, filter.programmes)) return false;
        if (filter.bands.length && !(spot.band && filter.bands.includes(spot.band))) return false;
        if (filter.modeGroups.length) {
            const group = modeGroup(spot.mode);
            if (!group || !filter.modeGroups.includes(group)) return false;
        }
        // Only the head spot decides these: the QRT is what the operator last said, and an RBN
        // decode behind a human spot doesn't make the row automatic.
        if (filter.hideQrt && isQrt(spot)) return false;
        if (filter.hideAutomatic && spot.sources.every((source) => source.automatic)) return false;
        if (!matchesSearch(spot, filter.search)) return false;
        if (filter.newOnly && !spotStatus(spot, qsos).newReference) return false;
        return true;
    });
};
