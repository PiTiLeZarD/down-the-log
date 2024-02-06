export const roundTo = (n: number, p = 2): number => Math.round(n * Math.pow(10, p)) / Math.pow(10, p);
export const rad = (n: number): number => n * (Math.PI / 180);
export const isNumber = (v: string) => String(+v) === v;
export const average = (...nb: number[]) => nb.reduce((acc, n) => n + acc, 0) / nb.length;
