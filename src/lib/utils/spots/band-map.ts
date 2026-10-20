import { Band, bands } from "../../data/bands";
import { MergedSpot } from "./types";

// Pixels per kHz the operator can step through. 2 shows all of 40m on a laptop screen.
export const bandMapZooms = [0.25, 0.5, 1, 2, 4, 8, 16];
export const DEFAULT_ZOOM = 2;

// The bands a bandmap is worth drawing for: above 70cm the span is too wide to scroll and too quiet
// to be worth it.
export const bandMapBands = (Object.keys(bands) as Band[]).filter(
    (band) => bands[band][0] >= 1.8 && bands[band][1] <= 450,
);

const tickSteps = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000];
const MIN_TICK_PX = 60;

export const LABEL_HEIGHT = 30;
const LABEL_GAP = 4;

export type BandMapLabel = { spot: MergedSpot; anchor: number; top: number };
export type BandMapLayout = { height: number; ticks: { khz: number; y: number }[]; labels: BandMapLabel[] };

/**
 * Where everything goes on a vertical scale with the top of the band at the top. A label sits beside
 * its frequency when it can, and is pushed down below the one above when it can't: two stations
 * 1 kHz apart at 2px/kHz would otherwise print on top of each other. The connector from the scale
 * to the label is what keeps a pushed label readable.
 */
export const layoutBandMap = (spots: MergedSpot[], band: Band, pxPerKhz: number): BandMapLayout => {
    const [low, high] = bands[band].map((mhz) => Math.round(mhz * 1000));
    const y = (khz: number) => (high - khz) * pxPerKhz;
    const step = tickSteps.find((s) => s * pxPerKhz >= MIN_TICK_PX) || tickSteps[tickSteps.length - 1];
    const ticks: BandMapLayout["ticks"] = [];
    for (let khz = Math.ceil(low / step) * step; khz <= high; khz += step) ticks.push({ khz, y: y(khz) });

    let bottom = -LABEL_GAP;
    const labels = spots
        .filter((spot) => spot.frequency && spot.frequency * 1000 >= low && spot.frequency * 1000 <= high)
        .sort((a, b) => b.frequency! - a.frequency!)
        .map((spot) => {
            const anchor = y(spot.frequency! * 1000);
            const top = Math.max(anchor - LABEL_HEIGHT / 2, bottom + LABEL_GAP);
            bottom = top + LABEL_HEIGHT;
            return { spot, anchor, top };
        });
    // A crowded band edge can push the last labels past the end of the scale.
    return { height: Math.max(y(low), bottom), ticks, labels };
};
