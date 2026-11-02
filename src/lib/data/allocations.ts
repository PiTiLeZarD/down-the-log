import { getCallsignData } from "../utils/callsign";
import { Band } from "./bands";

/**
 * Where a licence lets the operator transmit: [low, high] MHz segments per band. A band missing from
 * an entry has no allocation at all. `bands` says which band a frequency is on anywhere in the world;
 * this says whether *you* may use it, so the two are kept apart. An entity with no entry gets no
 * overlay rather than a guess: ITU region tables would claim 60m for countries that never granted it.
 */
export type Allocation = Partial<Record<Band, [number, number][]>>;

// ACMA Radiocommunications (Amateur Stations) Class Licence 2023 (F2023L01648), Schedule 2 table C:
// the Advanced licence. Foundation and Standard are narrower subsets of it. No 60m in Australia.
const acmaAdvanced: Allocation = {
    "2.2km": [[0.1357, 0.1378]],
    "630m": [[0.472, 0.479]],
    "160m": [[1.8, 1.875]],
    "80m": [
        [3.5, 3.7],
        [3.776, 3.8],
    ],
    "40m": [[7.0, 7.3]],
    "30m": [[10.1, 10.15]],
    "20m": [[14.0, 14.35]],
    "17m": [[18.068, 18.168]],
    "15m": [[21.0, 21.45]],
    "12m": [[24.89, 24.99]],
    "10m": [[28.0, 29.7]],
    "6m": [[50.0, 54.0]],
    "2m": [[144.0, 148.0]],
    "70cm": [[430.0, 450.0]],
    "23cm": [[1240.0, 1300.0]],
    "13cm": [
        [2300.0, 2302.0],
        [2400.0, 2450.0],
    ],
    // 3.4-3.6 GHz is also excluded around a list of areas (Schedule 3), which this doesn't model.
    "9cm": [[3300.0, 3600.0]],
    "6cm": [[5650.0, 5850.0]],
    "3cm": [[10000.0, 10500.0]],
    "12mm": [[24000.0, 24250.0]],
    "6mm": [[47000.0, 47200.0]],
    "4mm": [[76000.0, 81000.0]],
};

// By DXCC entity: Australia and the external territories, which all operate under the ACMA licence.
const allocations: Record<number, Allocation> = Object.fromEntries(
    [150, 147, 153, 38, 35, 111, 303, 189].map((dxcc) => [dxcc, acmaAdvanced]),
);

export const allocationFor = (callsign?: string): Allocation | undefined => {
    const dxcc = callsign ? getCallsignData(callsign)?.dxcc : undefined;
    return dxcc ? allocations[dxcc] : undefined;
};

// No allocation known means no opinion, so everything is allowed.
export const isAllowed = (allocation: Allocation | undefined, frequency?: number): boolean =>
    !allocation ||
    !frequency ||
    Object.values(allocation).some((segments) => segments.some(([low, high]) => frequency >= low && frequency <= high));

// The parts of [low, high] the allocation doesn't cover, for shading on the bandmap.
export const disallowedSegments = (
    allocation: Allocation | undefined,
    band: Band,
    [low, high]: [number, number],
): [number, number][] => {
    if (!allocation) return [];
    const gaps: [number, number][] = [];
    let from = low;
    [...(allocation[band] || [])]
        .sort((a, b) => a[0] - b[0])
        .forEach(([start, end]) => {
            if (start > from) gaps.push([from, Math.min(start, high)]);
            from = Math.max(from, end);
        });
    if (from < high) gaps.push([from, high]);
    return gaps;
};
