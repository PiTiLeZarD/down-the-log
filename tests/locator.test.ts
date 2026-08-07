import { describe, expect, test } from "vitest";
import {
    LatLng,
    corners2Path,
    distance,
    fixLatLngForMercator,
    latlong2Maidenhead,
    maidenDistance,
    maidenhead2Corners,
    maidenhead2Latlong,
    normalise,
} from "../app/lib/utils/locator";

const BRISBANE: LatLng = { latitude: -27.47, longitude: 153.03 };
const LONDON: LatLng = { latitude: 51.5, longitude: -0.13 };

describe("latlong2Maidenhead", () => {
    test("encodes known positions", () => {
        expect(latlong2Maidenhead(BRISBANE)).toBe("QG62mm");
        expect(latlong2Maidenhead(LONDON)).toBe("IO91wm");
    });

    test("encodes the origin of the grid", () => {
        expect(latlong2Maidenhead({ latitude: -90, longitude: -180 })).toBe("AA00aa");
    });

    test("rejects out of bounds coordinates", () => {
        expect(() => latlong2Maidenhead({ latitude: 91, longitude: 0 })).toThrow(/out of bounds/);
        expect(() => latlong2Maidenhead({ latitude: 0, longitude: -181 })).toThrow(/out of bounds/);
    });
});

describe("maidenhead2Latlong", () => {
    test("returns the centre of a 6 character subsquare", () => {
        const pos = maidenhead2Latlong("QG62nl");
        expect(pos.latitude).toBeCloseTo(-27.5208, 3);
        expect(pos.longitude).toBeCloseTo(153.125, 3);
    });

    test("returns the centre of a 4 character square", () => {
        expect(maidenhead2Latlong("QG62")).toEqual({ latitude: -27.5, longitude: 153 });
    });

    test("is case insensitive", () => {
        expect(maidenhead2Latlong("qg62NL")).toEqual(maidenhead2Latlong("QG62nl"));
    });

    test("round trips with latlong2Maidenhead", () => {
        ["QG62nl", "IO91wm", "FN31pr", "JJ00aa"].forEach((grid) =>
            expect(latlong2Maidenhead(maidenhead2Latlong(grid))).toBe(grid),
        );
    });
});

describe("maidenhead2Corners", () => {
    test("gives the subsquare box at precision 6", () => {
        const [topLeft, bottomRight] = maidenhead2Corners("QG62nl", 6);
        expect(topLeft.latitude).toBeCloseTo(-27.5417, 3);
        expect(topLeft.longitude).toBeCloseTo(153.0833, 3);
        expect(bottomRight.latitude).toBeCloseTo(-27.5, 3);
        expect(bottomRight.longitude).toBeCloseTo(153.1667, 3);
    });

    test("gives a 1 by 2 degree box at precision 4", () => {
        expect(maidenhead2Corners("QG62", 4)).toEqual([
            { latitude: -28, longitude: 152 },
            { latitude: -27, longitude: 154 },
        ]);
    });

    test("gives a 10 by 20 degree box at precision 2", () => {
        expect(maidenhead2Corners("QG", 2)).toEqual([
            { latitude: -30, longitude: 140 },
            { latitude: -20, longitude: 160 },
        ]);
    });

    test("contains the centre the other direction gives back", () => {
        const [topLeft, bottomRight] = maidenhead2Corners("QG62nl", 6);
        const centre = maidenhead2Latlong("QG62nl");
        expect(centre.latitude).toBeGreaterThan(topLeft.latitude);
        expect(centre.latitude).toBeLessThan(bottomRight.latitude);
        expect(centre.longitude).toBeGreaterThan(topLeft.longitude);
        expect(centre.longitude).toBeLessThan(bottomRight.longitude);
    });
});

describe("corners2Path", () => {
    test("closes the box back onto its first corner", () => {
        const path = corners2Path({ latitude: 0, longitude: 0 }, { latitude: 1, longitude: 2 });
        expect(path).toEqual([
            { latitude: 0, longitude: 0 },
            { latitude: 0, longitude: 2 },
            { latitude: 1, longitude: 2 },
            { latitude: 1, longitude: 0 },
            { latitude: 0, longitude: 0 },
        ]);
    });
});

describe("distance", () => {
    test("is zero between a point and itself", () => {
        expect(distance(BRISBANE, BRISBANE)).toBe(0);
    });

    test("is symmetric", () => {
        expect(distance(BRISBANE, LONDON)).toBe(distance(LONDON, BRISBANE));
    });

    test("matches the known great circle distance in km", () => {
        expect(distance(BRISBANE, LONDON)).toBeCloseTo(16528, -2);
    });

    test("converts to miles when asked", () => {
        expect(distance(BRISBANE, LONDON, true)).toBeCloseTo(distance(BRISBANE, LONDON) / 1.6, 1);
    });

    test("is rounded to two decimals", () => {
        expect(distance(BRISBANE, LONDON)).toBe(Math.round(distance(BRISBANE, LONDON) * 100) / 100);
    });
});

describe("maidenDistance", () => {
    test("measures between grid centres", () => {
        expect(maidenDistance("QG62nl", "IO91wm")).toBe(
            distance(maidenhead2Latlong("QG62nl"), maidenhead2Latlong("IO91wm")),
        );
    });

    test("passes the imperial flag through", () => {
        expect(maidenDistance("QG62nl", "IO91wm", true)).toBeCloseTo(maidenDistance("QG62nl", "IO91wm") / 1.6, 1);
    });

    test("is zero for the same grid", () => {
        expect(maidenDistance("QG62nl", "QG62nl")).toBe(0);
    });
});

describe("fixLatLngForMercator", () => {
    test("pulls the poles back to what a Mercator tile can show", () => {
        expect(fixLatLngForMercator({ latitude: 90, longitude: 10 })).toEqual({ latitude: 85, longitude: 10 });
        expect(fixLatLngForMercator({ latitude: -90, longitude: 10 })).toEqual({ latitude: -85, longitude: 10 });
    });

    test("leaves everything else alone", () => {
        expect(fixLatLngForMercator(BRISBANE)).toBe(BRISBANE);
    });
});

describe("normalise", () => {
    test("upper cases the field, lower cases the subsquare", () => {
        expect(normalise("qg62NL")).toBe("QG62nl");
        expect(normalise("QG62NL")).toBe("QG62nl");
    });

    test("handles a 4 character grid", () => {
        expect(normalise("qg62")).toBe("QG62");
    });

    test("passes undefined through", () => {
        expect(normalise(undefined)).toBeUndefined();
        expect(normalise("")).toBeUndefined();
    });
});
