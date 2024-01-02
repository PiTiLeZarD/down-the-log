export type Styles<T> = T | (T | undefined)[] | undefined;

export const mergeStyles = <T>(...styles: Styles<T>[]) =>
    styles.reduce<T[]>((acc, s) => [...acc, ...(Array.isArray(s) ? s : [s])] as T[], []);
