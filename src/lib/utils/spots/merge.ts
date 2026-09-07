import potawwfflinks from "../../data/potawwfflinks.json";
import { baseCallsign } from "../callsign";
import { MergedSpot, Spot, spotProgrammeLabel } from "./types";

// The same activation is routinely spotted on two networks at once — a VK park goes up on
// ParksnPeaks as WWFF and on pota.app as POTA within seconds — and listing it twice is what makes an
// aggregated feed harder to read than the single-source one it replaced.
const MERGE_WINDOW_MINUTES = 20;
// 5 kHz apart is the same station having nudged the VFO; further than that is a band change worth
// its own row.
const MERGE_MHZ = 0.005;

const links = potawwfflinks as Record<string, string>;
let reverseLinks: Record<string, string> | undefined;
// Built on first use rather than at import: 31k entries inverted for a screen nobody may open.
const wwff2pota = (reference: string): string | undefined =>
    (reverseLinks ??= Object.fromEntries(Object.entries(links).map(([pota, wwff]) => [wwff, pota])))[reference];

// A park with both a POTA and a WWFF reference is one park, and the two networks each know it by
// their own name — the link table names the ones we know about, and the rest are taken on trust when
// the award differs, because a callsign on one frequency is one operator whatever each network calls
// the place.
//
// Two references for the *same* award are the exception: that's a twofer, one operator standing in
// two parks, and it stays two rows because the log can only hold one reference per award and the
// operator has to be able to see and pick the second one.
const sameReference = (a: Spot, b: Spot): boolean => {
    if (!a.reference || !b.reference) return true;
    if (a.reference === b.reference) return true;
    if (a.programme !== b.programme) return true;
    const [x, y] = [a.reference, b.reference];
    return links[x] === y || links[y] === x || wwff2pota(x) === y || wwff2pota(y) === x;
};

const sameFrequency = (a?: number, b?: number): boolean => !a || !b || Math.abs(a - b) <= MERGE_MHZ;

const sameCallsign = (a: string, b: string): boolean =>
    (baseCallsign(a) || a.toUpperCase()) === (baseCallsign(b) || b.toUpperCase());

export const sameActivation = (a: Spot, b: Spot): boolean =>
    sameCallsign(a.callsign, b.callsign) &&
    sameFrequency(a.frequency, b.frequency) &&
    sameReference(a, b) &&
    Math.abs(a.date.diff(b.date, "minutes").minutes) <= MERGE_WINDOW_MINUTES;

// The newest spot leads the row, and the others fill in whatever it doesn't carry: ParksnPeaks knows
// nothing about gridsquares, POTA knows nothing about shires, and between them the row usually has
// everything. Only blanks are filled — a POTA reference never overwrites the WWFF one being shown.
const fold = (head: Spot, rest: Spot[]): Spot =>
    rest.reduce(
        (spot, other) => ({
            ...spot,
            frequency: spot.frequency ?? other.frequency,
            band: spot.band ?? other.band,
            mode: spot.mode ?? other.mode,
            reference: spot.reference ?? other.reference,
            referenceName: spot.referenceName ?? other.referenceName,
            locator: spot.locator ?? other.locator,
            spotter: spot.spotter ?? other.spotter,
            comments: spot.comments || other.comments,
        }),
        head,
    );

export const mergeSpots = (spots: Spot[]): MergedSpot[] => {
    const clusters: Spot[][] = [];
    // Newest first, so the spot that leads each row is the current one and the older duplicates fall
    // in behind it.
    [...spots]
        .sort((a, b) => b.date.toMillis() - a.date.toMillis())
        .forEach((spot) => {
            const cluster = clusters.find((c) => c.some((member) => sameActivation(member, spot)));
            if (cluster) cluster.push(spot);
            else clusters.push([spot]);
        });
    return clusters.map(([head, ...rest]) => ({ ...fold(head, rest), sources: [head, ...rest] }));
};

// What the row badges: one entry per distinct programme, in the order the networks reported them.
export const spotBadges = (spot: MergedSpot): { label: string; programme: string }[] => {
    const seen = new Set<string>();
    return spot.sources.flatMap((source) => {
        const label = spotProgrammeLabel(source);
        if (seen.has(label)) return [];
        seen.add(label);
        return [{ label, programme: source.programme }];
    });
};
