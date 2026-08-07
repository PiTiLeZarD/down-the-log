import { LatLng } from "../../utils/locator";
import { rad } from "../../utils/math";

export const TILE_SIZE = 256;
export const MAX_ZOOM = 19;
// Web Mercator can't represent the poles, it asymptotes at ~85.05°.
export const MAX_LATITUDE = 85.0511287798066;

const deg = (n: number): number => n * (180 / Math.PI);

// World coordinates at zoom 0: a 256x256 square covering the whole map. Multiply by 2^zoom to get
// pixels at that zoom. Longitudes are never wrapped here, so x may fall outside [0, 256] for paths
// that cross the antimeridian, which is exactly what we want when fitting and drawing them.
export type World = { x: number; y: number };

export const clampLatitude = (latitude: number): number =>
    Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, latitude));

export const project = ({ latitude, longitude }: LatLng): World => {
    const lat = rad(clampLatitude(latitude));
    return {
        x: ((longitude + 180) / 360) * TILE_SIZE,
        y: ((1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2) * TILE_SIZE,
    };
};

export const unproject = ({ x, y }: World): LatLng => ({
    latitude: deg(2 * Math.atan(Math.exp(Math.PI * (1 - (2 * y) / TILE_SIZE))) - Math.PI / 2),
    longitude: (x / TILE_SIZE) * 360 - 180,
});

// Shift each longitude by whole turns so consecutive points never take the long way round the
// globe. A VK-to-W6 path then draws across the Pacific rather than back over Europe.
export const unwrapLongitudes = (points: LatLng[]): LatLng[] =>
    points.reduce<LatLng[]>((acc, point, i) => {
        if (i === 0) return [point];
        // The offset accumulates along the path, so read back the already-unwrapped previous point.
        let longitude = point.longitude;
        while (longitude - acc[i - 1].longitude > 180) longitude -= 360;
        while (longitude - acc[i - 1].longitude < -180) longitude += 360;
        return [...acc, { ...point, longitude }];
    }, []);

// Great circle interpolation (spherical linear interpolation of the two unit vectors).
export const geodesicPoints = (from: LatLng, to: LatLng, segments = 48): LatLng[] => {
    const [lat1, lng1, lat2, lng2] = [from.latitude, from.longitude, to.latitude, to.longitude].map(rad);
    const d =
        2 *
        Math.asin(
            Math.sqrt(
                Math.sin((lat2 - lat1) / 2) ** 2 +
                    Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2,
            ),
        );

    if (!d) return [from, to];

    return Array.from({ length: segments + 1 }, (_, i) => {
        const f = i / segments;
        const a = Math.sin((1 - f) * d) / Math.sin(d);
        const b = Math.sin(f * d) / Math.sin(d);
        const x = a * Math.cos(lat1) * Math.cos(lng1) + b * Math.cos(lat2) * Math.cos(lng2);
        const y = a * Math.cos(lat1) * Math.sin(lng1) + b * Math.cos(lat2) * Math.sin(lng2);
        const z = a * Math.sin(lat1) + b * Math.sin(lat2);
        return { latitude: deg(Math.atan2(z, Math.hypot(x, y))), longitude: deg(Math.atan2(y, x)) };
    });
};

export type Bounds = { min: World; max: World };

export const boundsOf = (points: World[]): Bounds | null =>
    points.length
        ? points.reduce<Bounds>(
              (acc, p) => ({
                  min: { x: Math.min(acc.min.x, p.x), y: Math.min(acc.min.y, p.y) },
                  max: { x: Math.max(acc.max.x, p.x), y: Math.max(acc.max.y, p.y) },
              }),
              { min: { ...points[0] }, max: { ...points[0] } },
          )
        : null;

// Zoom at which the bounds exactly fill width x height, minus padding on every side. Fractional on
// purpose: the caller floors it to pick a tile level and scales the tiles by the remainder, so the
// content always fills the viewport instead of snapping down to the next whole zoom.
export const zoomToFit = (bounds: Bounds, width: number, height: number, padding: number, fallback = 11): number => {
    const usableWidth = Math.max(width - padding * 2, 1);
    const usableHeight = Math.max(height - padding * 2, 1);
    const spanX = bounds.max.x - bounds.min.x;
    const spanY = bounds.max.y - bounds.min.y;

    if (!spanX && !spanY) return fallback;

    const zoom = Math.min(
        spanX ? Math.log2(usableWidth / spanX) : MAX_ZOOM,
        spanY ? Math.log2(usableHeight / spanY) : MAX_ZOOM,
    );

    return Math.max(0, Math.min(MAX_ZOOM, zoom));
};
