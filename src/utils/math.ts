export const roundTo = (n: number, p = 2): number => Math.round(n * Math.pow(10, p)) / Math.pow(10, p);
export const rad = (n: number): number => n * (Math.PI / 180);
