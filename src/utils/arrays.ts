import { isNumber } from "./math";

export const groupBy = <T extends object, K extends string>(a: T[], f: (o: T) => K | K[]): Record<K, T[]> =>
    a.reduce<Record<K, T[]>>(
        (groups, elt) => ({
            ...groups,
            ...((vs) => Object.fromEntries(vs.map((v) => [v, [...(groups[v] || []), elt]])))(
                ((v) => (Array.isArray(v) ? v : [v]))(f(elt)),
            ),
        }),
        {} as Record<K, T[]>,
    );

export const unique: <T>(a: Array<T>) => Array<T> = (a) => a.filter((v, i, aa) => aa.indexOf(v) === i);

export const sortNumsAndAlpha = (r1: string, r2: string) => {
    if (isNumber(r1) && isNumber(r2)) return +r1 - +r2;
    return r1 < r2 ? -1 : r1 === r2 ? 0 : 1;
};