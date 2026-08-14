import { roundTo } from "./math";

/**
 * The frequency box works in kHz — an operator retuning types 14210, not 14.210 — while the QSO and
 * ADIF both hold MHz. Kept out of the input itself so the conversion and the cursor rule can be
 * tested without standing a form up.
 */
export const khz = (frequency?: number): string => (frequency === undefined ? "" : String(roundTo(frequency * 1000, 3)));

export const mhz = (input: string): number => roundTo(+input / 1000, 6);

/**
 * Where the part worth retyping starts. The last three digits of a kHz value are the sub-MHz part,
 * so clicking into 14210 puts "210" under the cursor and moving up the band is three keystrokes.
 * Positional rather than worked out from the band edges, so it still does the right thing on a
 * frequency that belongs to no band at all.
 */
export const tunableFrom = (value: string): number => {
    const whole = value.split(".")[0];
    return whole.length > 3 ? whole.length - 3 : 0;
};
