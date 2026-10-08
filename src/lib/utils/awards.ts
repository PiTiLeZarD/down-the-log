import type { QSO } from "../components/qso";
import { continents } from "../data/callsigns";
import { mostWanted } from "../data/clranks";
import { countries } from "../data/countries";
import { dxccEntities, entities } from "../data/cty";
import { states } from "../data/states";

/**
 * The awards the analytics screen tracks. Each is a list of units and a rule for which unit a QSO
 * counts for; everything else — worked, confirmed, the map, the list — is shared.
 */

export type AwardKey = "dxcc" | "wac" | "waz" | "itu" | "was" | "wavkca";

export type AwardUnit = {
    id: string;
    name: string;
    /** Shown ahead of the name in the list, e.g. the DXCC entity number. */
    code?: string;
    flag?: string;
    /** What the list's group filter picks out, e.g. the continent. */
    group?: string;
    /** ClubLog most-wanted rank, where there is one. */
    rank?: number;
};

export type Award = {
    key: AwardKey;
    label: string;
    title: string;
    units: AwardUnit[];
    /** What a unit is called, plural: "entities", "states", "call areas". */
    unitName: string;
    /** The list tab's name. */
    listTitle: string;
    unitOf: (qso: QSO) => string | undefined;
    /** Where the progress bars put a tick. */
    milestones: number[];
    groups?: Record<string, string>;
};

// Imported logs have been known to carry the entity as a string.
const dxccOf = (qso: QSO): number | undefined => (qso.dxcc ? Number(qso.dxcc) : undefined);

const dxcc: Award = {
    key: "dxcc",
    label: "DXCC",
    title: "DX Century Club",
    unitName: "entities",
    listTitle: "Country List",
    // Current entities only: an old QSO with a deleted one can't push the count past what's
    // workable today.
    units: dxccEntities.map((e) => ({
        id: String(e.dxcc),
        name: e.name,
        code: String(e.dxcc),
        flag: (e.iso3 && countries[e.iso3]?.flag) || undefined,
        group: e.ctn,
        rank: mostWanted(e.dxcc) || undefined,
    })),
    unitOf: (qso) => {
        const d = dxccOf(qso);
        return d && entities[d] ? String(d) : undefined;
    },
    // DXCC starts at 100 confirmed and endorses every 50 after; Honor Roll is within nine of
    // everything current.
    milestones: [50, 100, 150, 200, 250, 300, Object.keys(entities).length - 9],
    groups: continents,
};

// DC and the territories are in the state picker, but WAS is the fifty states.
const notStates = ["AS", "DC", "GU", "MP", "PR", "TT", "VI"];
const usStates = Object.entries(states.USA)
    .filter(([code]) => !notStates.includes(code))
    .sort(([, a], [, b]) => a.localeCompare(b));

/**
 * The state a QSO counts for toward WAS. Alaska and Hawaii are DXCC entities of their own, so
 * their QSOs count without a state logged; anywhere else in the US needs one.
 */
export const wasStateOf = (qso: QSO): string | undefined => {
    const d = dxccOf(qso);
    if (d === 6) return "AK";
    if (d === 110) return "HI";
    if (d !== 291 && !(d === undefined && qso.country === "USA")) return undefined;
    const state = qso.state?.trim().toUpperCase();
    return state && state in states.USA && !notStates.includes(state) ? state : undefined;
};

const was: Award = {
    key: "was",
    label: "WAS",
    title: "Worked All States",
    unitName: "states",
    listTitle: "State List",
    units: usStates.map(([code, name]) => ({ id: code, name, code })),
    unitOf: wasStateOf,
    milestones: [10, 20, 30, 40],
};

// The entities a VK prefix can be worked from: the mainland, the VK9 islands, and VK0's Heard,
// Macquarie and the Antarctic bases. A VK call signing from anywhere else isn't in a call area.
const vkEntities = [150, 35, 38, 147, 171, 189, 303, 111, 153, 13];
// Australian prefixes: VK, plus AX and the VH–VN and VZ blocks used for special events.
const vkPrefix = /^(?:AX|V[H-NZ])(\d)/;

/**
 * The call area a QSO counts for toward WAVKCA, off the callsign: the digit after an Australian
 * prefix, or a single-digit portable suffix (VK4ALE/3 is in VK3).
 */
export const vkCallAreaOf = (qso: Pick<QSO, "callsign" | "dxcc">): string | undefined => {
    const d = dxccOf(qso as QSO);
    if (d !== undefined && !vkEntities.includes(d)) return undefined;
    const parts = (qso.callsign || "").toUpperCase().split("/");
    const base = parts.find((p) => vkPrefix.test(p));
    if (!base) return undefined;
    const portable = parts.find((p) => /^\d$/.test(p));
    return `VK${portable ?? base.match(vkPrefix)![1]}`;
};

const vkAreas: [string, string][] = [
    ["VK0", "Australian Antarctic Territory"],
    ["VK1", "Australian Capital Territory"],
    ["VK2", "New South Wales"],
    ["VK3", "Victoria"],
    ["VK4", "Queensland"],
    ["VK5", "South Australia"],
    ["VK6", "Western Australia"],
    ["VK7", "Tasmania"],
    ["VK8", "Northern Territory"],
    ["VK9", "External Territories"],
];

const wavkca: Award = {
    key: "wavkca",
    label: "WAVKCA",
    title: "Worked All VK Call Areas",
    unitName: "call areas",
    listTitle: "Call Area List",
    units: vkAreas.map(([id, name]) => ({ id, name, code: id })),
    unitOf: vkCallAreaOf,
    milestones: [],
};

/**
 * The continent a QSO counts for toward WAC: the one logged, or failing that its DXCC entity's.
 * Antarctica isn't one of WAC's six.
 */
export const continentOf = (qso: QSO): string | undefined => {
    const d = dxccOf(qso);
    const continent = qso.continent || (d ? entities[d]?.ctn : undefined);
    return continent && continent !== "AN" ? continent : undefined;
};

const wac: Award = {
    key: "wac",
    label: "WAC",
    title: "Worked All Continents",
    unitName: "continents",
    listTitle: "Continent List",
    units: Object.entries(continents)
        .filter(([code]) => code !== "AN")
        .map(([code, name]) => ({ id: code, name, code })),
    unitOf: continentOf,
    milestones: [],
};

const zones = (count: number, name: string) =>
    Array.from({ length: count }, (_, i) => ({ id: String(i + 1), name: `${name} ${i + 1}`, code: String(i + 1) }));

// Zones come off the QSO alone. An entity's default zone is wrong for the big countries that span
// several (the US is in three CQ zones and six ITU ones), so it's no fallback for a missing one.
const zoneOf = (zone: number | undefined, count: number): string | undefined => {
    const n = Number(zone);
    return Number.isInteger(n) && n >= 1 && n <= count ? String(n) : undefined;
};

const waz: Award = {
    key: "waz",
    label: "WAZ",
    title: "Worked All Zones",
    unitName: "zones",
    listTitle: "Zone List",
    units: zones(40, "CQ zone"),
    unitOf: (qso) => zoneOf(qso.cqzone, 40),
    milestones: [10, 20, 30],
};

const itu: Award = {
    key: "itu",
    label: "ITU",
    title: "ITU Zones",
    unitName: "zones",
    listTitle: "Zone List",
    units: zones(90, "ITU zone"),
    unitOf: (qso) => zoneOf(qso.ituzone, 90),
    milestones: [25, 50, 75],
};

// In the picker's order: the world first, then by region.
export const awards: Record<AwardKey, Award> = { dxcc, wac, waz, itu, was, wavkca };
