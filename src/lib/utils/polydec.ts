import { LatLng } from "./locator";
import { roundTo } from "./math";
import { Coord, Polygon, coord2latlng, fixDateline, includes } from "./polygon";

const DEFAULT_PRECISION: number = 5;

export type Zones = Record<string, string>;
export type MultiZones = Record<string, string[]>;

type BoundingBox = { south: number; west: number; north: number; east: number };
type PreparedZone = { id: string; polygons: { polygon: Polygon; box: BoundingBox }[] };

const boundingBox = (polygon: Polygon): BoundingBox =>
    polygon.reduce<BoundingBox>(
        (box, [lat, lng]) => ({
            south: Math.min(box.south, lat),
            west: Math.min(box.west, lng),
            north: Math.max(box.north, lat),
            east: Math.max(box.east, lng),
        }),
        { south: 90, west: 180, north: -90, east: -180 }
    );

/**
 * Decoding is the expensive half of a lookup — the CQ zone table alone is ~700kB of encoded
 * polygons — and `findZone` used to redo all of it on every call, so an ADIF import paid for it
 * three times per QSO. The zone tables are JSON modules with a stable identity, so the decoded
 * form is cached against the object itself.
 */
const preparedZones = new WeakMap<object, PreparedZone[]>();

const prepare = (zones: Zones | MultiZones): PreparedZone[] => {
    const cached = preparedZones.get(zones);
    if (cached) return cached;

    const prepared = Object.entries(zones).map(([id, data]) => ({
        id,
        polygons: (Array.isArray(data) ? data : [data]).map((d) => {
            const polygon = decode(d);
            return { polygon, box: boundingBox(polygon) };
        }),
    }));
    preparedZones.set(zones, prepared);
    return prepared;
};

// The box test is what makes the cache pay off: a point is inside one zone and outside the
// couple of hundred others, and rejecting those on four comparisons skips the ray casting.
// It has to see the same point `includes` will, dateline shift included, or a zone across ±180
// would be rejected on coordinates that were never compared to it.
const inBox = (box: BoundingBox, polygon: Polygon, pos: LatLng): boolean => {
    if (polygon.length === 0) return false;
    const { latitude, longitude } = fixDateline(pos, coord2latlng(polygon[0]));
    return latitude >= box.south && latitude <= box.north && longitude >= box.west && longitude <= box.east;
};

export const findZone = (zones: Zones | MultiZones, pos: LatLng): keyof typeof zones =>
    (prepare(zones).find(({ polygons }) =>
        polygons.some(({ polygon, box }) => inBox(box, polygon, pos) && includes(polygon, pos))
    )?.id || "??") as keyof typeof zones;

export const encodeValue = (cur: number, prev: number = 0, precision: number = DEFAULT_PRECISION): string => {
    const factor = Math.pow(10, precision);
    const cur_val = roundTo(cur * factor, 0);
    const prev_val = roundTo(prev * factor, 0);
    let coord = cur_val - prev_val;
    coord <<= 1;
    coord = coord >= 0 ? coord : ~coord;

    let enc = "";
    while (coord >= 0x20) {
        enc += String.fromCharCode((0x20 | (coord & 0x1f)) + 63);
        coord >>= 5;
    }
    enc += String.fromCharCode(coord + 63);
    return enc;
};

export const decodeValue = (val: string, index: number = 0, precision: number = DEFAULT_PRECISION): Coord => {
    let [byte, result, shift, comp] = [-1, 0, 0, 0];

    while (byte === -1 || byte >= 0x20) {
        byte = val.charCodeAt(index) - 63;
        index += 1;
        result |= (byte & 0x1f) << shift;
        shift += 5;
        comp = result & 1;
    }

    result = comp ? ~(result >> 1) : result >> 1;

    return [result / Math.pow(10, precision), index];
};

export const encode = (polygon: Polygon, precision: number = DEFAULT_PRECISION): string =>
    polygon.reduce(
        (acc, cur, i, arr) =>
            (acc += cur.reduce(
                (jacc, jcur, j) => (jacc += encodeValue(jcur, i > 0 ? arr[i - 1][j] : 0, precision)),
                ""
            )),
        ""
    );

export const decode = (s: string, precision: number = DEFAULT_PRECISION): Polygon => {
    const polygon: Polygon = [];
    let [index, lat, lng, t] = [0, 0, 0, 0];
    while (index < s.length) {
        [t, index] = decodeValue(s, index, precision);
        lat += t;
        [t, index] = decodeValue(s, index, precision);
        lng += t;
        polygon.push([lat, lng]);
    }
    return polygon;
};
