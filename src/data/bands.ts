import { roundTo } from "../utils/math";

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

export type Band = keyof typeof bands;

export const band2freq = (band?: Band): number | null =>
    band ? roundTo((bands[band][0] + bands[band][0]) / 2, 3) : null;

export const freq2band = (freq?: number): Band | null =>
    freq
        ? Object.entries(bands).reduce<Band | null>(
              (acc: Band | null, [band, [low, high]]) => acc || (freq >= low && freq <= high ? (band as Band) : acc),
              null,
          )
        : null;
