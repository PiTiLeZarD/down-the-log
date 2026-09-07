import { DateTime } from "luxon";
import { isNumber } from "./math";

// Filled in place rather than by spreading the accumulator: the copying version spread the whole
// groups object and rebuilt the target array once per element, which is the shape that makes the
// Stats and Tiles pages freeze on a six-figure log. Groups still come out in first-seen order, and
// an element listed under several keys is still shared, not copied.
export const groupBy = <T extends object, K extends string>(
    a: T[],
    f: (o: T, i: number, a: T[]) => K | K[],
): Record<K, T[]> => {
    const groups = {} as Record<K, T[]>;
    a.forEach((elt, i) => {
        const value = f(elt, i, a);
        (Array.isArray(value) ? value : [value]).forEach((v) => {
            if (!groups[v]) groups[v] = [];
            groups[v].push(elt);
        });
    });
    return groups;
};

// A Set round trip rather than an indexOf scan per element, for the same reason: unique runs over
// the whole log on the export and filter paths.
export const unique: <T>(a: Array<T>) => Array<T> = (a) => Array.from(new Set(a));

export const sortNumsAndAlpha = (r1: string, r2: string) => {
    if (isNumber(r1) && isNumber(r2)) return +r1 - +r2;
    return r1 < r2 ? -1 : r1 === r2 ? 0 : 1;
};

export const clusterByDate: <T>(objects: T[], cb: (o: T) => DateTime, interval?: number) => T[][] = (
    objects,
    cb,
    interval = 60 * 60000,
) =>
    objects
        .sort((o1, o2) => cb(o1).toMillis() - cb(o2).toMillis())
        .reduce<(typeof objects)[]>((clusters, obj) => {
            const lastCluster = clusters[clusters.length - 1];
            if (!lastCluster || cb(obj).toMillis() - cb(lastCluster[lastCluster.length - 1]).toMillis() > interval)
                clusters.push([obj]);
            else lastCluster.push(obj);
            return clusters;
        }, []);
