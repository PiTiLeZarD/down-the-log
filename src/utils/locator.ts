const EARTH_RADIUS = 6371;

export const latlong2Maidenhead = (lat: number, long: number): string => {
    if (long >= 180 || long <= -180 || lat >= 90 || lat <= -90) {
        throw new Error('Value error');
    }

    const longitude = long + 180;
    const latitude = lat + 90;

    let locator = String.fromCharCode('A'.charCodeAt(0) + Math.trunc(longitude / 20));
    locator += String.fromCharCode('A'.charCodeAt(0) + Math.trunc(latitude / 10));
    locator += String.fromCharCode('0'.charCodeAt(0) + Math.trunc((longitude % 20) / 2));
    locator += String.fromCharCode('0'.charCodeAt(0) + Math.trunc(latitude % 10));
    locator += String.fromCharCode(
        'a'.charCodeAt(0) + Math.trunc((longitude - Math.trunc(longitude / 2) * 2) / (2 / 24))
    );
    locator += String.fromCharCode('a'.charCodeAt(0) + Math.trunc((latitude - Math.trunc(latitude)) / (1 / 24)));
    return locator;
};

export const maidenhead2Latlong = (maidenhead: string): number[] => {
    let longitude = (maidenhead.charCodeAt(0) - 'A'.charCodeAt(0)) * 20 - 180;
    let latitude = (maidenhead.charCodeAt(1) - 'A'.charCodeAt(0)) * 10 - 90;
    longitude += (maidenhead.charCodeAt(2) - '0'.charCodeAt(0)) * 2;
    latitude += maidenhead.charCodeAt(3) - '0'.charCodeAt(0);

    if (maidenhead.length == 6) {
        longitude += (maidenhead.charCodeAt(4) - 'a'.charCodeAt(0)) * (2 / 24);
        latitude += (maidenhead.charCodeAt(5) - 'a'.charCodeAt(0)) * (1 / 24);
    } else {
        longitude += 1;
        latitude += 0.5;
    }
    return [latitude, longitude];
};

const rad = (n: number): number => n * (Math.PI / 180);

export const distance = (m1: string, m2: string): number => {
    const [lat1, long1] = maidenhead2Latlong(m1);
    const [lat2, long2] = maidenhead2Latlong(m2);

    const d_lat = rad(lat2) - rad(lat1);
    const d_long = rad(long2) - rad(long1);

    const a =
        Math.sin(d_lat / 2) * Math.sin(d_lat / 2) +
        Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(d_long / 2) * Math.sin(d_long / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS * c;
};
