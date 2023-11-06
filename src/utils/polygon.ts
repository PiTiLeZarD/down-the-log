import { LatLng } from './locator';

export type Coord = number[];

export const coord2latlng = (c: Coord): LatLng => ({ longitude: c[1], latitude: c[0] });
const offset = (p1: number, p2: number, m: number): number =>
    m - Math.abs(p2 - p1) < m / 2 ? m * ((p2 - p1) / Math.abs(p2 - p1)) : 0;

export const fixDateline = (pos: LatLng, ref: LatLng): LatLng => ({
    latitude: pos.latitude + offset(pos.latitude, ref.latitude, 180),
    longitude: pos.longitude + offset(pos.longitude, ref.longitude, 360),
});

export const intersectProjection = (pos: LatLng, from: LatLng, to: LatLng): boolean =>
    from.longitude > pos.longitude != to.longitude > pos.longitude &&
    pos.latitude <
        ((to.latitude - from.latitude) * (pos.longitude - from.longitude)) / (to.longitude - from.longitude) +
            from.latitude;

export const includes = (coords: Coord[], pos: LatLng): boolean => {
    if (coords.length === 0) return false;

    const posFixed = fixDateline(pos, coord2latlng(coords[0]));

    return coords.reduce(
        (acc, curr, i, arr) =>
            intersectProjection(posFixed, coord2latlng(curr), coord2latlng(arr[i > 0 ? i - 1 : arr.length - 1]))
                ? !acc
                : acc,
        false
    );
};
