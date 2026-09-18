import { DateTime } from "luxon";
import type { QSO } from "../../components/qso";
import { Mode, isDigital } from "../../data/modes";
import { baseCallsign, getCallsignData } from "../callsign";
import type { EventType } from "../event-rules";
import { spotStatus } from "./status";
import { MergedSpot, SpotFilter, SpotModeGroup, SpotSource, isQrt } from "./types";

export const modeGroup = (mode?: Mode): SpotModeGroup | undefined =>
    !mode ? undefined : mode === "CW" ? "CW" : isDigital(mode) ? "Data" : "Phone";

// Everything the operator can narrow the list with, so the page can say "3 filters on" without
// listing the fields twice. Age isn't counted: there is always one, and it hides nothing surprising.
export const activeFilterCount = (filter: SpotFilter): number =>
    (filter.programmes.length ? 1 : 0) +
    (filter.bands.length ? 1 : 0) +
    (filter.modeGroups.length ? 1 : 0) +
    (filter.continents.length ? 1 : 0) +
    (filter.watch.length ? 1 : 0) +
    (filter.newOnly ? 1 : 0) +
    (filter.hideQrt ? 1 : 0) +
    (filter.hideAutomatic ? 1 : 0);

// "VK*" or "ZL?ABC": * is any run of characters, ? exactly one. Everything else is literal, so the
// / in a portable call can't turn into regexp syntax.
const globToRegExp = (pattern: string): RegExp =>
    new RegExp(
        `^${pattern
            .replace(/[.+^${}()|[\]\\/-]/g, "\\$&")
            .replace(/\*/g, ".*")
            .replace(/\?/g, ".")}$`,
    );

const watched = (spot: MergedSpot, watch: string[]): boolean => {
    const full = spot.callsign.toUpperCase();
    const base = baseCallsign(spot.callsign) || full;
    return watch.some((entry) => {
        const call = entry.toUpperCase().trim();
        // A pattern is tried against both: "VK*" should catch ZL1ABC operating as VK/ZL1ABC as well
        // as VK6MB/P, and the base call alone would miss the first.
        if (/[*?]/.test(call)) {
            const glob = globToRegExp(call);
            return glob.test(base) || glob.test(full);
        }
        return (baseCallsign(call) || call) === base;
    });
};

// A merged row is kept when *any* of the spots behind it passes the programme test: a park spotted
// as both WWFF and POTA belongs in either list rather than only in the one its newest spot came from.
const matchesProgramme = (spot: MergedSpot, programmes: EventType[]): boolean =>
    !programmes.length || spot.sources.some((source) => programmes.includes(source.programme));

const matchesSource = (spot: MergedSpot, sources: SpotSource[]): boolean =>
    spot.sources.some((source) => sources.includes(source.source));

/** Every rule but age, which the page and the alerts each measure against their own window. */
export const matchesSpotFilter = (spot: MergedSpot, filter: SpotFilter, qsos: QSO[]): boolean => {
    if (!matchesProgramme(spot, filter.programmes)) return false;
    if (filter.bands.length && !(spot.band && filter.bands.includes(spot.band))) return false;
    if (filter.modeGroups.length) {
        const group = modeGroup(spot.mode);
        if (!group || !filter.modeGroups.includes(group)) return false;
    }
    // The callsign's entity, not the reference: a park reference says the same thing, but not every
    // spot has one, and the portable prefix already puts VK/G4XYZ in Oceania.
    if (filter.continents.length) {
        const continent = getCallsignData(spot.callsign)?.ctn;
        if (!continent || !filter.continents.includes(continent)) return false;
    }
    if (filter.watch.length && !watched(spot, filter.watch)) return false;
    // Only the head spot decides these: the QRT is what the operator last said, and an RBN
    // decode behind a human spot doesn't make the row automatic.
    if (filter.hideQrt && isQrt(spot)) return false;
    if (filter.hideAutomatic && spot.sources.every((source) => source.automatic)) return false;
    // Last, because it walks the log: everything cheap has already had its chance to say no.
    if (filter.newOnly && !spotStatus(spot, qsos).newReference) return false;
    return true;
};

export const applySpotFilter = (
    spots: MergedSpot[],
    filter: SpotFilter,
    sources: SpotSource[],
    qsos: QSO[],
    now: DateTime = DateTime.utc(),
): MergedSpot[] => {
    const cutoff = now.minus({ minutes: filter.maxAgeMinutes });
    return spots.filter(
        (spot) =>
            // An unparseable time can't be shown to be recent, so it goes with the stale ones.
            spot.date.isValid &&
            spot.date >= cutoff &&
            matchesSource(spot, sources) &&
            matchesSpotFilter(spot, filter, qsos),
    );
};
