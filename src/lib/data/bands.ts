import { roundTo } from "../utils/math";
import { Mode } from "./modes";

export const bands = {
    "2.2km": [0.135, 0.138],
    "630m": [0.472, 0.479],
    "160m": [1.8, 1.875],
    "80m": [3.5, 3.8],
    "60m": [5.325, 5.425],
    "40m": [7.0, 7.3],
    "30m": [10.1, 10.15],
    "20m": [14.0, 14.35],
    "17m": [18.068, 18.168],
    "15m": [21.0, 21.45],
    "12m": [24.89, 24.99],
    "10m": [28.0, 29.7],
    "6m": [50.0, 54.0],
    "4m": [70.0, 70.5],
    "2m": [144.0, 148.0],
    "1.25m": [220.0, 225.0],
    "70cm": [420.0, 450.0],
    "23cm": [1240.0, 1300.0],
    "13cm": [2300.0, 2450.0],
    "9cm": [3300.0, 3600.0],
    "6cm": [5650.0, 5850.0],
    "3cm": [10000.0, 10500.0],
    "12mm": [24000.0, 24250.0],
    "6mm": [47000.0, 47200.0],
    "4mm": [76000.0, 81000.0],
};

// The usual watering holes per mode (WSJT-X / JS8Call defaults, the common PSK31 frequencies), so
// picking a band lands on the right dial frequency instead of the middle of the band. Region
// differences exist; these are the ones the software ships with.
export const modeBandMap: Partial<Record<Mode, Partial<Record<Band, number>>>> = {
    FT8: {
        "160m": 1.84,
        "80m": 3.573,
        "60m": 5.357,
        "40m": 7.074,
        "30m": 10.136,
        "20m": 14.074,
        "17m": 18.1,
        "15m": 21.074,
        "12m": 24.915,
        "10m": 28.074,
        "6m": 50.313,
        "4m": 70.1,
        "2m": 144.174,
    },
    FT4: {
        "80m": 3.575,
        "40m": 7.0475,
        "30m": 10.14,
        "20m": 14.08,
        "17m": 18.104,
        "15m": 21.14,
        "12m": 24.919,
        "10m": 28.18,
        "6m": 50.318,
        "2m": 144.17,
    },
    JS8: {
        "160m": 1.842,
        "80m": 3.578,
        "40m": 7.078,
        "30m": 10.13,
        "20m": 14.078,
        "17m": 18.104,
        "15m": 21.078,
        "12m": 24.922,
        "10m": 28.078,
        "6m": 50.318,
        "2m": 144.178,
    },
    JT65: {
        "160m": 1.838,
        "80m": 3.57,
        "40m": 7.076,
        "30m": 10.138,
        "20m": 14.076,
        "17m": 18.102,
        "15m": 21.076,
        "12m": 24.917,
        "10m": 28.076,
        "6m": 50.31,
    },
    JT9: {
        "160m": 1.8395,
        "80m": 3.572,
        "40m": 7.078,
        "30m": 10.14,
        "20m": 14.078,
        "17m": 18.104,
        "15m": 21.078,
        "12m": 24.919,
        "10m": 28.078,
        "6m": 50.312,
    },
    // 60m WSPR (5.2872) sits below the 60m range above, so it's left out rather than mis-banded.
    WSPR: {
        "2.2km": 0.136,
        "630m": 0.4742,
        "160m": 1.8366,
        "80m": 3.5686,
        "40m": 7.0386,
        "30m": 10.1387,
        "20m": 14.0956,
        "17m": 18.1046,
        "15m": 21.0946,
        "12m": 24.9246,
        "10m": 28.1246,
        "6m": 50.293,
        "2m": 144.489,
    },
    PSK: {
        "80m": 3.58,
        "40m": 7.07,
        "30m": 10.142,
        "20m": 14.07,
        "17m": 18.1,
        "15m": 21.07,
        "12m": 24.92,
        "10m": 28.12,
    },
};

export type Band = keyof typeof bands;

// ADIF writes the band enumeration in whatever case the logger felt like ("20M", "20m"), and the
// table above is keyed lower case, so the comparison has to ignore case or an import silently
// loses the band. Mirrors `resolveMode`.
export const resolveBand = (value?: string): Band | undefined =>
    value ? (Object.keys(bands) as Band[]).find((b) => b.toUpperCase() === value.toUpperCase().trim()) : undefined;

export const band2freq = (band?: Band, mode?: Mode): number | undefined => {
    if (!band) return undefined;
    const mibBand = roundTo((bands[band][0] + bands[band][1]) / 2, 3);
    if (!mode) return mibBand;
    if (mode in modeBandMap && band in (modeBandMap[mode] || [])) return modeBandMap[mode]![band] || undefined;
    return mibBand;
};
export const freq2band = (freq?: number): Band | null =>
    freq
        ? Object.entries(bands).reduce<Band | null>(
              (acc: Band | null, [band, [low, high]]) => acc || (freq >= low && freq <= high ? (band as Band) : acc),
              null,
          )
        : null;

export const sortBands = (b1: string | Band, b2: string | Band) =>
    Object.keys(bands).indexOf(b1 as Band) - Object.keys(bands).indexOf(b2 as Band);
