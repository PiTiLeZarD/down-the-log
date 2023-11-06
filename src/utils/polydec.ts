import { roundTo } from './math';
import { Coord } from './polygon';

const DEFAULT_PRECISION: number = 5;

export const encodeValue = (cur: number, prev: number = 0, precision: number = DEFAULT_PRECISION): string => {
    const factor = Math.pow(10, precision);
    const cur_val = roundTo(cur * factor, 0);
    const prev_val = roundTo(prev * factor, 0);
    let coord = cur_val - prev_val;
    coord <<= 1;
    coord = coord >= 0 ? coord : ~coord;

    let enc = '';
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

export const encode = (coordinates: Coord[], precision: number = DEFAULT_PRECISION): string =>
    coordinates.reduce(
        (acc, cur, i, arr) =>
            (acc += cur.reduce(
                (jacc, jcur, j) => (jacc += encodeValue(jcur, i > 0 ? arr[i - 1][j] : 0, precision)),
                ''
            )),
        ''
    );

export const decode = (s: string, precision: number = DEFAULT_PRECISION): Coord[] => {
    const coordinates: Coord[] = [];
    let [index, lat, lng, t] = [0, 0, 0, 0];
    while (index < s.length) {
        [t, index] = decodeValue(s, index, precision);
        lat += t;
        [t, index] = decodeValue(s, index, precision);
        lng += t;
        coordinates.push([lat, lng]);
    }
    return coordinates;
};
