import { DateTime } from "luxon";
// Types only: `event-rules` reaches the park and summit tables, and this module is pulled in by the
// store, which every screen imports. The heavy end of the spots code lives behind ./status.
import type { Band } from "../../data/bands";
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

export type SpotFilter = {
    // Empty means "everything": a filter nobody has touched shouldn't hide a network the operator
    // just enabled.
    programmes: EventType[];
    bands: Band[];
    modeGroups: SpotModeGroup[];
    // Only references the log has never worked.
    newOnly: boolean;
    hideQrt: boolean;
    // Drop RBN-relayed spots, which are frequency-accurate and otherwise uninformative.
    hideAutomatic: boolean;
    maxAgeMinutes: number;
    // Matches callsign, reference or reference name.
    search: string;
};

export const defaultSpotFilter: SpotFilter = {
    programmes: [],
    bands: [],
    modeGroups: [],
    newOnly: false,
    hideQrt: false,
    hideAutomatic: false,
    maxAgeMinutes: 60,
    search: "",
};

// What the app is allowed to interrupt the operator for. Deliberately not the same object as
// `SpotFilter`: that one changes every time a chip on the Spots page is poked, and quietly
// rewriting the notification rules because somebody widened the list to look a callsign up is the
// kind of surprise that gets notifications switched off for good.
//
// Every field is an AND, and an empty list still means "no opinion" — same reading as the page
// filter, so `watch` with nothing else set is "only these callsigns", and nothing set at all is
// "every spot", which is what the wording on the settings screen promises.
export type SpotAlert = {
    enabled: boolean;
    programmes: EventType[];
    bands: Band[];
    modeGroups: SpotModeGroup[];
    // Only references the log has never worked.
    newOnly: boolean;
    // Drop RBN-relayed spots, which are frequency-accurate and otherwise uninformative.
    hideAutomatic: boolean;
    // Callsigns to watch for, compared on the base call so a /P or a DL/ prefix still matches.
    watch: string[];
};

export const defaultSpotAlert: SpotAlert = {
    enabled: false,
    programmes: [],
    bands: [],
    modeGroups: [],
    newOnly: false,
    hideAutomatic: true,
    watch: [],
};
