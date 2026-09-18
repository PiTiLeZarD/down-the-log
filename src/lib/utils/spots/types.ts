import { DateTime } from "luxon";
// Types only: `event-rules` reaches the park and summit tables, and this module is pulled in by the
// store, which every screen imports. The heavy end of the spots code lives behind ./status.
import type { Band } from "../../data/bands";
import type { Continent } from "../../data/callsigns";
import type { Mode } from "../../data/modes";
import type { EventType } from "../event-rules";

// Where a spot was read from, which is not the same question as what it counts towards: ParksnPeaks
// carries WWFF, SOTA and shire spots alike, and the same activation is often spotted on two of these
// networks at once. `programme` answers "what is being activated", `source` answers "who told us".
export const spotSources = ["pota", "pnp", "sota"] as const;
export type SpotSource = (typeof spotSources)[number];

// Only the two networks that will take a spot from an app without an account-wide OAuth dance.
// SOTAwatch needs a SOTA SSO token and the API approval described in ./sota.
export type SelfSpotTarget = Extract<SpotSource, "pota" | "pnp">;

export const spotSourceLabels: Record<SpotSource, string> = {
    pota: "POTA",
    pnp: "ParksnPeaks",
    sota: "SOTAwatch",
};

export type Spot = {
    // Source-prefixed, so ids from two networks can never collide in a list key.
    id: string;
    source: SpotSource;
    programme: EventType;
    // What the source called the programme when it isn't one we model — SHIRES, ZLOTA, SIOTA. Only
    // set alongside `programme: "sig"`, and shown in place of the generic badge.
    programmeLabel?: string;
    date: DateTime;
    callsign: string;
    frequency?: number;
    band?: Band;
    mode?: Mode;
    reference?: string;
    referenceName?: string;
    locator?: string;
    spotter?: string;
    comments?: string;
    // Posted by a skimmer rather than an ear — POTA relays RBN decodes. They're accurate about the
    // frequency and useless about everything else, so they can be filtered out on their own.
    automatic?: boolean;
};

// One row of the list: the spot itself, plus every spot that turned out to be the same activation
// seen from another network. `sources` always contains at least the head spot.
export type MergedSpot = Spot & { sources: Spot[] };

export const spotProgrammeLabel = (spot: Pick<Spot, "programme" | "programmeLabel">): string =>
    spot.programmeLabel || spot.programme.toUpperCase();

// A spot whose comment says the operator has packed up is worth hiding rather than chasing.
export const isQrt = (spot: Spot): boolean => /\bq\s?r\s?t\b/i.test(spot.comments || "");

// Modes are filtered in the three groups an operator actually thinks in, rather than as 40 separate
// chips: the question is "can I work this right now with what's plugged in".
export const spotModeGroups = ["CW", "Phone", "Data"] as const;
export type SpotModeGroup = (typeof spotModeGroups)[number];

// One filter, read by the Spots page, the spots bar and the alerts alike. There used to be two — a
// page filter and a separate set of alert rules — and an operator who set up VK* and ZL* in the
// alert rules reasonably expected the list to follow. Alerts now just say whether a new spot that
// passes this filter is worth a notification.
//
// Every field is an AND, and an empty list means "no opinion" rather than "nothing": a filter
// nobody has touched shouldn't hide a network the operator just enabled.
export type SpotFilter = {
    programmes: EventType[];
    bands: Band[];
    modeGroups: SpotModeGroup[];
    // Where the activator is, from the callsign's DXCC entity — so VK/G4XYZ is Oceania.
    continents: Continent[];
    // Callsigns to show, compared on the base call so a /P or a DL/ prefix still matches. * and ?
    // are wildcards, so VK* is every VK station.
    watch: string[];
    // Only references the log has never worked.
    newOnly: boolean;
    hideQrt: boolean;
    // Drop RBN-relayed spots, which are frequency-accurate and otherwise uninformative.
    hideAutomatic: boolean;
    maxAgeMinutes: number;
};

export const defaultSpotFilter: SpotFilter = {
    programmes: [],
    bands: [],
    modeGroups: [],
    continents: [],
    watch: [],
    newOnly: false,
    hideQrt: false,
    hideAutomatic: false,
    maxAgeMinutes: 60,
};

// The old alert rules, kept only so `fixSettings` can fold a stored copy into the filter.
export type LegacySpotAlert = {
    enabled: boolean;
    programmes: EventType[];
    bands: Band[];
    modeGroups: SpotModeGroup[];
    newOnly: boolean;
    hideAutomatic: boolean;
    watch: string[];
};

/**
 * Settings from before the two filters became one carry both. The alert rules win when alerts were
 * on — that's the one the operator set up deliberately, with every band on offer — and the page
 * filter's otherwise. Age and QRT only ever lived on the page filter, and the search box is gone:
 * the callsign list does its job.
 */
export const migrateSpotFilter = (
    filter: Partial<SpotFilter> & { search?: string } = {},
    alert?: Partial<LegacySpotAlert>,
): SpotFilter => {
    const { search: _search, ...rest } = filter;
    const merged = { ...defaultSpotFilter, ...rest };
    if (!alert?.enabled) return merged;
    return {
        ...merged,
        programmes: alert.programmes || merged.programmes,
        bands: alert.bands || merged.bands,
        modeGroups: alert.modeGroups || merged.modeGroups,
        newOnly: alert.newOnly ?? merged.newOnly,
        hideAutomatic: alert.hideAutomatic ?? merged.hideAutomatic,
        watch: alert.watch || merged.watch,
    };
};
