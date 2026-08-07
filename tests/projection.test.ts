import { describe, expect, it } from "vitest";
import {
    MAX_LATITUDE,
    TILE_SIZE,
    boundsOf,
    geodesicPoints,
    project,
    unproject,
    unwrapLongitudes,
    zoomToFit,
} from "../app/lib/components/osm-map/projection";

const BRISBANE = { latitude: -27.47, longitude: 153.03 };

describe("project", () => {
    it("puts the null island at the centre of the zoom 0 tile", () => {
        const { x, y } = project({ latitude: 0, longitude: 0 });
        expect(x).toBeCloseTo(TILE_SIZE / 2, 6);
        expect(y).toBeCloseTo(TILE_SIZE / 2, 6);
    });

    it("maps the antimeridian to the tile edges", () => {
        expect(project({ latitude: 0, longitude: -180 }).x).toBeCloseTo(0, 6);
        expect(project({ latitude: 0, longitude: 180 }).x).toBeCloseTo(TILE_SIZE, 6);
    });

    it("clamps the poles to the mercator limit", () => {
        expect(project({ latitude: 90, longitude: 0 }).y).toBeCloseTo(project({ latitude: MAX_LATITUDE, longitude: 0 }).y, 6);
        expect(project({ latitude: -90, longitude: 0 }).y).toBeCloseTo(
            project({ latitude: -MAX_LATITUDE, longitude: 0 }).y,
            6,
        );
    });

    it("does not wrap longitudes past the antimeridian", () => {
        expect(project({ latitude: 0, longitude: 190 }).x).toBeGreaterThan(TILE_SIZE);
    });

    it("round trips through unproject", () => {
        const back = unproject(project(BRISBANE));
        expect(back.latitude).toBeCloseTo(BRISBANE.latitude, 6);
        expect(back.longitude).toBeCloseTo(BRISBANE.longitude, 6);
    });
});

describe("unwrapLongitudes", () => {
    it("leaves a path that does not cross the antimeridian alone", () => {
        const points = [
            { latitude: 0, longitude: -10 },
            { latitude: 0, longitude: 10 },
        ];
        expect(unwrapLongitudes(points)).toEqual(points);
    });

    it("takes the short way across the antimeridian", () => {
        const unwrapped = unwrapLongitudes([
            { latitude: 0, longitude: 170 },
            { latitude: 0, longitude: -170 },
        ]);
        expect(unwrapped[1].longitude).toBe(190);
    });

    it("accumulates the offset along the path", () => {
        const unwrapped = unwrapLongitudes([
            { latitude: 0, longitude: 170 },
            { latitude: 0, longitude: -170 },
            { latitude: 0, longitude: -10 },
        ]);
        expect(unwrapped.map((p) => p.longitude)).toEqual([170, 190, 350]);
    });
});

describe("geodesicPoints", () => {
    it("keeps the endpoints", () => {
        const points = geodesicPoints({ latitude: 0, longitude: 0 }, BRISBANE, 8);
        expect(points).toHaveLength(9);
        expect(points[0].latitude).toBeCloseTo(0, 6);
        expect(points[8].latitude).toBeCloseTo(BRISBANE.latitude, 6);
        expect(points[8].longitude).toBeCloseTo(BRISBANE.longitude, 6);
    });

    it("bows away from the straight line on an east-west leg", () => {
        const [from, to] = [
            { latitude: 50, longitude: -60 },
            { latitude: 50, longitude: 60 },
        ];
        const middle = geodesicPoints(from, to, 8)[4];
        expect(middle.longitude).toBeCloseTo(0, 6);
        expect(middle.latitude).toBeGreaterThan(50);
    });

    it("degenerates to the two points when they are identical", () => {
        expect(geodesicPoints(BRISBANE, BRISBANE)).toEqual([BRISBANE, BRISBANE]);
    });
});

describe("zoomToFit", () => {
    it("falls back when the bounds are a single point", () => {
        const bounds = boundsOf([project(BRISBANE)])!;
        expect(zoomToFit(bounds, 640, 400, 32, 11)).toBe(11);
    });

    it("is fractional so the caller can scale the tiles to fill the viewport", () => {
        expect(zoomToFit({ min: { x: 0, y: 0 }, max: { x: 6, y: 6 } }, 512, 512, 0)).toBeCloseTo(Math.log2(512 / 6), 6);
    });

    it("drops a whole zoom step when the span doubles", () => {
        const wide = { min: { x: 0, y: 0 }, max: { x: 8, y: 8 } };
        const wider = { min: { x: 0, y: 0 }, max: { x: 16, y: 16 } };
        expect(zoomToFit(wide, 512, 512, 0) - zoomToFit(wider, 512, 512, 0)).toBe(1);
    });

    it("never goes below zoom 0", () => {
        expect(zoomToFit({ min: { x: 0, y: 0 }, max: { x: TILE_SIZE, y: TILE_SIZE } }, 64, 64, 0)).toBe(0);
    });
});

describe("boundsOf", () => {
    it("is null without points", () => {
        expect(boundsOf([])).toBeNull();
    });

    it("covers every point", () => {
        const bounds = boundsOf([
            { x: 5, y: 20 },
            { x: 1, y: 30 },
            { x: 9, y: 10 },
        ]);
        expect(bounds).toEqual({ min: { x: 1, y: 10 }, max: { x: 9, y: 30 } });
    });
});
