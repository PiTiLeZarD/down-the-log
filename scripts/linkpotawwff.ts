import { distance as editDistance } from "fastest-levenshtein";
import { readFileSync, writeFileSync } from "node:fs";
import { ReferenceDatum } from "../app/lib/components/reference-info";
import { LatLng, distance, maidenhead2Latlong } from "../app/lib/utils/locator";

const MAX_KM = 25; // parks further apart than this are never the same park
const MIN_SCORE = 0.6; // name similarity below this is a coincidence, not a match
const CELL = 0.5; // spatial bucket size in degrees

const pota: Record<string, ReferenceDatum> = JSON.parse(readFileSync("./app/lib/data/pota.json", "utf8"));
const wwff: Record<string, ReferenceDatum> = JSON.parse(readFileSync("./app/lib/data/wwff.json", "utf8"));

/** maidenhead2Latlong assumes a well formed locator and silently returns NaN otherwise, so
 * validate first. The wwff feed prefixes some locators with "-" or a space ("-Gj01pn",
 * " Km71ks") and uses a bare "-" for unknown, all of which have to be dealt with here. */
const locatorToLatLng = (locator?: string): LatLng | undefined => {
    const cleaned = (locator ?? "").replace(/[^a-z0-9]/gi, "").toUpperCase();
    return /^[A-R]{2}[0-9]{2}([A-X]{2})?$/.test(cleaned) ? maidenhead2Latlong(cleaned) : undefined;
};

// Generic words shared by most park names: they inflate similarity between unrelated parks,
// so they are stripped as whole words (never as substrings, "Parker" must not become "er").
const GENERIC = new RegExp(
    "\\b(" +
        [
            "national",
            "nationale",
            "nacional",
            "naturel",
            "naturelle",
            "naturale",
            "naturali",
            "natural",
            "nature",
            "natura",
            "state",
            "provincial",
            "regional",
            "county",
            "municipal",
            "park",
            "parc",
            "parque",
            "parkway",
            "forest",
            "forêt",
            "foret",
            "reserve",
            "reserva",
            "réserve",
            "riserva",
            "rezerwat",
            "orientata",
            "speciale",
            "statale",
            "parziale",
            "integrale",
            "preserve",
            "conservation",
            "protected",
            "wildlife",
            "sanctuary",
            "refuge",
            "recreation",
            "recreational",
            "historic",
            "historical",
            "heritage",
            "memorial",
            "memoral",
            "monument",
            "site",
            "scenic",
            "trail",
            "country",
            "landscape",
            "area",
            "wetland",
            "wetlands",
            "ecological",
            "biosphere",
            "management",
            "wma",
            "np",
            "sp",
            "the",
            "of",
            "and",
            "de",
            "du",
            "des",
            "la",
            "le",
            "les",
            "el",
            "los",
            "das",
            "dos",
            "der",
            "die",
            "und",
        ].join("|") +
        ")\\b",
    "g",
);

const normalise = (name: string) =>
    name
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "") // strip diacritics so "Forêt" matches "Foret"
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const cleanParkName = (name: string) => {
    const normalised = normalise(name);
    const cleaned = normalised.replace(GENERIC, " ").replace(/\s+/g, " ").trim();
    // Names made only of generic words ("National Park") would otherwise clean to "" and
    // match every other such name perfectly.
    return cleaned || normalised;
};

/** 0 to 1, where 1 is identical. Combines edit distance with token overlap so that
 * word reorderings ("Lake Superior" / "Superior Lake") still score highly. */
const similarity = (a: string, b: string): number => {
    if (a === b) return 1;
    const editSimilarity = 1 - editDistance(a, b) / Math.max(a.length, b.length);
    const tokensA = new Set(a.split(" "));
    const tokensB = new Set(b.split(" "));
    const shared = [...tokensA].filter((t) => tokensB.has(t)).length;
    const tokenSimilarity = (2 * shared) / (tokensA.size + tokensB.size);
    return Math.max(editSimilarity, tokenSimilarity);
};

type Indexed = { ref: string; exact: string; clean: string; position?: LatLng };

const index = (data: Record<string, ReferenceDatum>): Indexed[] =>
    Object.entries(data).map(([ref, datum]) => ({
        ref,
        exact: normalise(datum.name),
        clean: cleanParkName(datum.name),
        position: locatorToLatLng(datum.locator),
    }));

const potaIndexed = index(pota);
const wwffIndexed = index(wwff);

type Candidate = { potaRef: string; wwffRef: string; score: number; exact: boolean; km: number };
const candidates: Candidate[] = [];

// Pass 1: identical names. Only when the name is unique on both sides, otherwise the dozens
// of parks called "Central Park" would pair off arbitrarily. No distance check: a large park
// such as Kodiak National Wildlife Refuge is given centre points 100km apart by the two
// projects, and several references carry an unusable locator ("-").
const byExactName = (entries: Indexed[]) => {
    const map = new Map<string, Indexed | null>();
    entries.forEach((entry) => map.set(entry.exact, map.has(entry.exact) ? null : entry));
    return map;
};
const potaByName = byExactName(potaIndexed);
const wwffByName = byExactName(wwffIndexed);
potaByName.forEach((potaEntry, name) => {
    const wwffEntry = wwffByName.get(name);
    if (!potaEntry || !wwffEntry) return;
    candidates.push({ potaRef: potaEntry.ref, wwffRef: wwffEntry.ref, score: 1, exact: true, km: 0 });
});

// Pass 2: similar names that are also physically close. Bucket the wwff side into coarse
// lat/lon cells so each pota park only compares against the 3x3 block of cells around it
// rather than against all 67k references.
const cellKey = ({ latitude, longitude }: LatLng) => `${Math.floor(latitude / CELL)}|${Math.floor(longitude / CELL)}`;
const buckets = new Map<string, Indexed[]>();
wwffIndexed.forEach((entry) => {
    if (!entry.position) return;
    const key = cellKey(entry.position);
    const bucket = buckets.get(key);
    if (bucket) bucket.push(entry);
    else buckets.set(key, [entry]);
});

potaIndexed.forEach(({ ref: potaRef, clean, position }) => {
    if (!position) return;
    for (let dLat = -1; dLat <= 1; dLat++) {
        for (let dLon = -1; dLon <= 1; dLon++) {
            const cell = { latitude: position.latitude + dLat * CELL, longitude: position.longitude + dLon * CELL };
            const bucket = buckets.get(cellKey(cell));
            if (!bucket) continue;
            for (const other of bucket) {
                const km = distance(position, other.position!);
                if (km > MAX_KM) continue;
                const score = similarity(clean, other.clean);
                if (score >= MIN_SCORE) candidates.push({ potaRef, wwffRef: other.ref, score, exact: false, km });
            }
        }
    }
});

// Greedy one-to-one assignment, most confident pairs first. The links file is used in both
// directions (park-reference-input.tsx flips it), so a wwff reference must not be claimed by
// many pota references — only one of them would survive the flip anyway.
candidates.sort((a, b) => b.score - a.score || Number(b.exact) - Number(a.exact) || a.km - b.km);
const links: Record<string, string> = {};
const takenWwff = new Set<string>();
candidates.forEach(({ potaRef, wwffRef }) => {
    if (potaRef in links || takenWwff.has(wwffRef)) return;
    links[potaRef] = wwffRef;
    takenWwff.add(wwffRef);
});

console.log(
    `${Object.keys(links).length} links from ${potaIndexed.length} pota / ${wwffIndexed.length} wwff ` +
        `references (${candidates.length} candidate pairs)`,
);

writeFileSync("./app/lib/data/potawwfflinks.json", JSON.stringify(links));
