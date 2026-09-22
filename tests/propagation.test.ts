import { DateTime } from "luxon";
import { describe, expect, test } from "vitest";
import {
    aIndex,
    bandScore,
    conditionLabel,
    estimatePropagation,
    geomagneticLatitude,
    kpToAp,
    radioBlackout,
    sunPosition,
    takeaway,
    xrayFlux,
} from "../src/lib/utils/propagation";

const brisbane = { latitude: -27.47, longitude: 153.03 };
const seattle = { latitude: 47.6, longitude: -122.33 };

const localTime = (iso: string, zone: string) => DateTime.fromISO(iso, { zone });
const brisbaneAt = (iso: string) => localTime(iso, "Australia/Brisbane");

const find = (bands: ReturnType<typeof estimatePropagation>["bands"], band: string) =>
    bands.find((b) => b.band === band)!;

describe("sunPosition", () => {
    // The whole point of the estimator is that it knows where the operator's sun is, so the angles
    // are checked against the real ones rather than against themselves.
    test("puts the equinox sun overhead the equator", () => {
        const { declination } = sunPosition(DateTime.fromISO("2026-09-23T12:00:00Z"), brisbane);
        expect(Math.abs(declination)).toBeLessThan(0.5);
    });

    test("gets Brisbane's noon elevation at the equinox", () => {
        // 90° minus the latitude, with the sun on the equator.
        const { elevation } = sunPosition(brisbaneAt("2026-09-23T11:52"), brisbane);
        expect(elevation).toBeGreaterThan(61);
        expect(elevation).toBeLessThan(63);
    });

    test("finds the horizon at sunrise and sunset", () => {
        // Geometric, so these sit a couple of minutes inside the published times, which are taken
        // at the upper limb and allow for refraction.
        expect(sunPosition(brisbaneAt("2026-09-23T05:41"), brisbane).elevation).toBeCloseTo(0, 0);
        expect(sunPosition(brisbaneAt("2026-09-23T17:40"), brisbane).elevation).toBeCloseTo(0, 0);
        expect(sunPosition(brisbaneAt("2026-09-23T05:30"), brisbane).elevation).toBeLessThan(0);
        expect(sunPosition(brisbaneAt("2026-09-23T17:50"), brisbane).elevation).toBeLessThan(0);
    });

    test("puts the sun under the operator's feet at local midnight", () => {
        expect(sunPosition(brisbaneAt("2026-09-23T00:00"), brisbane).elevation).toBeLessThan(-55);
    });

    test("knows the hemispheres run opposite seasons", () => {
        const solstice = "2026-12-21T12:00";
        expect(sunPosition(brisbaneAt(solstice), brisbane).elevation).toBeGreaterThan(80);
        expect(sunPosition(localTime(solstice, "America/Los_Angeles"), seattle).elevation).toBeLessThan(20);
    });
});

describe("geomagneticLatitude", () => {
    // This is the number that decides whether a K index of 6 is the operator's problem or somebody
    // else's, and it is nowhere near the geographic one.
    test("keeps VK4 well clear of the auroral zone", () => {
        expect(geomagneticLatitude(brisbane)).toBeCloseTo(-33.8, 0);
    });

    test("drags the US and European mid-latitudes towards the pole", () => {
        expect(geomagneticLatitude(seattle)).toBeGreaterThan(50);
        expect(geomagneticLatitude({ latitude: 51.5, longitude: -0.1 })).toBeGreaterThan(50);
    });
});

describe("indices", () => {
    test("converts Kp to ap on the standard table", () => {
        expect(kpToAp(0)).toBe(0);
        expect(kpToAp(4)).toBe(27);
        expect(kpToAp(5)).toBe(48);
        expect(kpToAp(9)).toBe(400);
    });

    test("averages a day of ap into the A index", () => {
        expect(aIndex([2, 2, 2, 2, 2, 2, 2, 2])).toBe(kpToAp(2));
        // Only the last eight readings — a day — count, whatever the series holds.
        expect(aIndex([9, 9, 9, 9, 9, 9, 9, 9, 9, 0, 0, 0, 0, 0, 0, 0, 0])).toBe(0);
    });

    test("has nothing to say without readings", () => {
        expect(aIndex([])).toBeUndefined();
    });

    test("reads NOAA's X-ray classes as flux", () => {
        expect(xrayFlux("B5.3")).toBeCloseTo(5.3e-7);
        expect(xrayFlux("M1")).toBeCloseTo(1e-5);
        expect(xrayFlux("X2.5")).toBeCloseTo(2.5e-4);
        expect(xrayFlux("nonsense")).toBeUndefined();
        expect(xrayFlux(undefined)).toBeUndefined();
    });

    test("puts the R scale at the flare classes NOAA does", () => {
        expect(radioBlackout("B5.3").scale).toBe(0);
        expect(radioBlackout("C9.9").scale).toBe(0);
        expect(radioBlackout("M1.0").scale).toBe(1);
        expect(radioBlackout("M5.0").scale).toBe(2);
        expect(radioBlackout("X1.0").scale).toBe(3);
        expect(radioBlackout(undefined).scale).toBe(0);
    });
});

describe("bandScore", () => {
    test("peaks just under the MUF", () => {
        expect(bandScore(9, 10, 2)).toBe(100);
        expect(bandScore(9, 10, 2)).toBeGreaterThan(bandScore(3, 10, 2));
    });

    test("drops off a cliff above the MUF", () => {
        expect(conditionLabel(bandScore(10.5, 10, 2))).toBe("Poor");
        expect(bandScore(14, 10, 2)).toBe(0);
    });

    test("absorbs everything under the LUF", () => {
        expect(bandScore(1.8, 25, 6)).toBeLessThan(bandScore(7.1, 25, 6));
        expect(conditionLabel(bandScore(1.8, 25, 6))).toBe("Closed");
    });
});

describe("estimatePropagation", () => {
    const quiet = { sfi: 105, kp: 2, xray: "B5.3" };

    test("opens the high bands by day and the low bands by night", () => {
        const noon = estimatePropagation({ ...quiet, at: brisbaneAt("2026-09-23T12:00"), location: brisbane });
        const night = estimatePropagation({ ...quiet, at: brisbaneAt("2026-09-23T02:00"), location: brisbane });

        expect(noon.daylight).toBe("day");
        expect(night.daylight).toBe("night");
        expect(find(noon.bands, "15m").scores.dx).toBeGreaterThan(find(night.bands, "15m").scores.dx);
        expect(find(night.bands, "80m").scores.dx).toBeGreaterThan(find(noon.bands, "80m").scores.dx);
    });

    test("calls the hour either side of the horizon grey line", () => {
        const dusk = estimatePropagation({ ...quiet, at: brisbaneAt("2026-09-23T17:55"), location: brisbane });
        expect(dusk.daylight).toBe("greyline");
        expect(takeaway(dusk)).toContain("grey line");
    });

    test("keeps 40m working close in through the day and shuts it at night", () => {
        // The band a VK park activation actually lives on: daytime NVIS, dead by the small hours.
        const noon = estimatePropagation({ ...quiet, at: brisbaneAt("2026-09-23T12:00"), location: brisbane });
        const night = estimatePropagation({ ...quiet, at: brisbaneAt("2026-09-23T02:00"), location: brisbane });
        expect(find(noon.bands, "40m").labels.local).toBe("Good");
        expect(find(night.bands, "40m").labels.local).toBe("Closed");
        expect(find(night.bands, "80m").labels.local).toBe("Good");
    });

    test("a geomagnetic storm is a high-latitude problem, not a VK4 one", () => {
        const at = DateTime.fromISO("2026-09-23T02:00:00Z");
        const storm = { sfi: 105, kp: 7, xray: "B5.3" };
        const calm = { sfi: 105, kp: 1, xray: "B5.3" };

        const vkStorm = estimatePropagation({ ...storm, at, location: brisbane });
        const vkCalm = estimatePropagation({ ...calm, at, location: brisbane });
        const usStorm = estimatePropagation({ ...storm, at, location: seattle });
        const usCalm = estimatePropagation({ ...calm, at, location: seattle });

        expect(vkStorm.auroralImpact).toBeLessThan(0.15);
        expect(usStorm.auroralImpact).toBeGreaterThan(0.5);
        expect(vkStorm.muf.dx / vkCalm.muf.dx).toBeGreaterThan(0.95);
        expect(usStorm.muf.dx / usCalm.muf.dx).toBeLessThan(0.9);
    });

    test("a flare only blacks out the sunlit side", () => {
        const flare = { sfi: 105, kp: 2, xray: "X1.5" };
        const day = estimatePropagation({ ...flare, at: brisbaneAt("2026-09-23T12:00"), location: brisbane });
        const night = estimatePropagation({ ...flare, at: brisbaneAt("2026-09-23T02:00"), location: brisbane });
        const calmDay = estimatePropagation({ sfi: 105, kp: 2, at: brisbaneAt("2026-09-23T12:00"), location: brisbane });
        const calmNight = estimatePropagation({ sfi: 105, kp: 2, at: brisbaneAt("2026-09-23T02:00"), location: brisbane });

        expect(day.blackout.scale).toBe(3);
        expect(day.luf.dx).toBeGreaterThan(calmDay.luf.dx);
        expect(night.luf.dx).toBe(calmNight.luf.dx);
    });

    test("lifts the MUF with the solar flux", () => {
        const at = brisbaneAt("2026-09-23T12:00");
        const low = estimatePropagation({ sfi: 70, kp: 2, at, location: brisbane });
        const high = estimatePropagation({ sfi: 200, kp: 2, at, location: brisbane });
        expect(high.muf.dx).toBeGreaterThan(low.muf.dx);
        expect(find(low.bands, "10m").labels.dx).toBe("Closed");
        expect(find(high.bands, "10m").labels.dx).toBe("Good");
    });

    test("still answers with no space weather at all", () => {
        const blind = estimatePropagation({ at: brisbaneAt("2026-09-23T12:00"), location: brisbane });
        expect(blind.bands).toHaveLength(10);
        expect(blind.foF2).toBeGreaterThan(0);
        expect(takeaway(blind)).toMatch(/\.$/);
    });

    test("names a band to try on each path length", () => {
        const noon = estimatePropagation({ ...quiet, at: brisbaneAt("2026-09-23T12:00"), location: brisbane });
        expect(noon.best.local?.band).toBe("40m");
        expect(takeaway(noon)).toContain("40m locally");
        expect(takeaway(noon)).toContain("for distance");
    });
});
