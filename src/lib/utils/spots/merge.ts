import potawwfflinks from "../../data/potawwfflinks.json";
import { baseCallsign } from "../callsign";
import type { EventType } from "../event-rules";
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
const samePark = (a: Spot, b: Spot): boolean => {
    const [x, y] = [a.reference, b.reference];
    if (!x || !y) return false;
    return x === y || links[x] === y || links[y] === x || wwff2pota(x) === y || wwff2pota(y) === x;
};

const sameReference = (a: Spot, b: Spot): boolean =>
    !a.reference || !b.reference || a.programme !== b.programme || samePark(a, b);

const sameFrequency = (a?: number, b?: number): boolean => !a || !b || Math.abs(a - b) <= MERGE_MHZ;

const callsignKey = (callsign: string): string => baseCallsign(callsign) || callsign.toUpperCase();

const sameCallsign = (a: string, b: string): boolean => callsignKey(a) === callsignKey(b);

// The time window is for guesses. Two spots naming the same park are the same activation however far
// apart they were posted: ParksnPeaks and pota.app are often spotted by different people, half an
// hour apart. Two naming no park at all are a station holding a frequency, which a cluster re-spots
// all evening; the window only exists to keep one operator's next park apart from the last.
//
// The same park is also the same activation on any frequency: one operator in one park has moved,
// and the newest spot says where to. ParksnPeaks keeps every spot since its Oct 2026 rebuild, so
// without this each QSY left a row behind at the old frequency.
export const sameActivation = (a: Spot, b: Spot): boolean =>
    sameCallsign(a.callsign, b.callsign) &&
    sameReference(a, b) &&
    (samePark(a, b) ||
        (sameFrequency(a.frequency, b.frequency) &&
            ((!a.reference && !b.reference) ||
                Math.abs(a.date.diff(b.date, "minutes").minutes) <= MERGE_WINDOW_MINUTES)));

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
            // A cluster spot of a park activator leads with no programme; the park spot behind it has one.
            programme: spot.programme ?? other.programme,
            programmeLabel: spot.programme ? spot.programmeLabel : other.programmeLabel,
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
    // Only spots of one callsign can be one activation, so each spot is compared with its own
    // callsign's rows rather than every row: a two-hour cluster feed made the full scan quadratic.
    const byCallsign = new Map<string, Spot[][]>();
    // Newest first, so the spot that leads each row is the current one and the older duplicates fall
    // in behind it.
    [...spots]
        .sort((a, b) => b.date.toMillis() - a.date.toMillis())
        .forEach((spot) => {
            const key = callsignKey(spot.callsign);
            const rows = byCallsign.get(key) || [];
            const cluster = rows.find((c) => c.some((member) => sameActivation(member, spot)));
            if (cluster) cluster.push(spot);
            else {
                clusters.push([spot]);
                rows.push(clusters[clusters.length - 1]);
                byCallsign.set(key, rows);
            }
        });
    return clusters.map(([head, ...rest]) => ({ ...fold(head, rest), sources: [head, ...rest] }));
};

// What the row badges: one entry per distinct programme, in the order the networks reported them.
export const spotBadges = (spot: MergedSpot): { label: string; programme?: EventType }[] => {
    const seen = new Set<string>();
    return spot.sources.flatMap((source) => {
        const label = spotProgrammeLabel(source);
        if (seen.has(label)) return [];
        seen.add(label);
        return [{ label, programme: source.programme }];
    });
};
