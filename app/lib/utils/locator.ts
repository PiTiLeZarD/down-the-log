import { rad, roundTo } from "./math";

const EARTH_RADIUS = 6371;
const upper: string = "ABCDEFGHIJKLMNOPQRSTUVWX";
const lower: string = upper.toLowerCase();

export type LatLng = {
    latitude: number;
    longitude: number;
};

export const latlong2Maidenhead = (pos: LatLng): string => {
    if (Math.abs(pos.longitude) > 180 || Math.abs(pos.latitude) > 90) {
        throw new Error(`Value error lat:${pos.latitude} or long:${pos.longitude} are out of bounds`);
    }

    const longitude = pos.longitude + 180;
    const latitude = pos.latitude + 90;

    return (
        upper[Math.trunc(longitude / 20)] +
        upper[Math.trunc(latitude / 10)] +
        Math.trunc((longitude / 2) % 10) +
        Math.trunc(latitude % 10) +
        lower[Math.trunc((longitude % 2) * 12)] +
        lower[Math.trunc((latitude % 1) * 24)]
    );
};

export const maidenhead2Latlong = (maidenhead: string): LatLng => {
    const latlng: LatLng = {
        latitude: maidenhead.length == 6 ? 0.5 / 24 : 0.5,
        longitude: maidenhead.length == 6 ? 1 / 24 : 1,
    };

    maidenhead
        .substring(0, 6)
        .split("")
        .map((char: string, i: number) => {
            let pos = String(upper.indexOf(char.toUpperCase()));
            if (pos === "-1") pos = char;

            const key = ["longitude", "latitude"][i % 2] as keyof LatLng;
            const coef = [
                (x: number, d: number): number => x * (20 / d) - 180 / d,
                (x: number, d: number): number => x * (2 / d),
                (x: number, d: number): number => (x * (2 / d)) / 24,
            ][Math.trunc(i / 2)];

            latlng[key] += coef(parseFloat(pos), (i % 2) + 1);
        });

    return latlng;
};

export const fixLatLngForStaticMaps = (latlng: LatLng): LatLng =>
    Math.abs(latlng.latitude) == 90
        ? {
              latitude: latlng.latitude > 0 ? 85 : -85,
              longitude: latlng.longitude,
          }
        : latlng;
export const maidenhead2Corners = (maidenhead: string, precision: number = 4): LatLng[] => {
    const gs = (i: number): number => upper.indexOf(maidenhead.charAt(i).toUpperCase());
    const gi = (i: number): number => parseInt(maidenhead.charAt(i));

    let lat: number = gs(1) * 10 - 90;
    let long: number = gs(0) * 20 - 180;

    if (precision > 2) {
        lat += gi(3);
        long += gi(2) * 2;
    }

    if (precision > 4)
        return [
            { latitude: lat + gs(5) / 24, longitude: long + gs(4) / 12 },
            { latitude: lat + (gs(5) + 1) / 24, longitude: long + (gs(4) + 1) / 12 },
        ];

    const c = precision == 4 ? 1 : 10;
    return [
        { latitude: lat, longitude: long },
        { latitude: lat + c, longitude: long + c * 2 },
    ];
};

export const corners2Path = (topleft: LatLng, bottomRight: LatLng): LatLng[] => [
    topleft,
    { latitude: topleft.latitude, longitude: bottomRight.longitude },
    bottomRight,
    { latitude: bottomRight.latitude, longitude: topleft.longitude },
    topleft,
];

export const distance = (l1: LatLng, l2: LatLng, imperial?: boolean): number => {
    const d_lat = rad(l2.latitude) - rad(l1.latitude);
    const d_long = rad(l2.longitude) - rad(l1.longitude);

    const a =
        Math.sin(d_lat / 2) * Math.sin(d_lat / 2) +
        Math.cos(rad(l1.latitude)) * Math.cos(rad(l2.latitude)) * Math.sin(d_long / 2) * Math.sin(d_long / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return roundTo((EARTH_RADIUS * c) / (imperial ? 1.6 : 1), 2);
};

export const maidenDistance = (m1: string, m2: string, imperial?: boolean): number =>
    distance(maidenhead2Latlong(m1), maidenhead2Latlong(m2), imperial);

export const normalise = (grid: string | undefined) =>
    grid ? grid.substring(0, 2).toUpperCase() + grid.substring(2).toLocaleLowerCase() : undefined;
