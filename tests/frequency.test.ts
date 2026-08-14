import { describe, expect, test } from "vitest";
import { khz, mhz, tunableFrom } from "../src/lib/utils/frequency";

describe("khz", () => {
    test("shows the frequency the way an operator says it", () => {
        expect(khz(14.21)).toBe("14210");
        expect(khz(7.032)).toBe("7032");
    });

    test("doesn't leak the float", () => {
        expect(khz(14.021)).toBe("14021");
    });

    test("an unset frequency is an empty box, not a zero", () => {
        expect(khz(undefined)).toBe("");
    });
});

describe("mhz", () => {
    test("reads the box back", () => {
        expect(mhz("14210")).toBe(14.21);
        expect(mhz("7032")).toBe(7.032);
    });

    test("keeps the fractional kHz an out-of-band contact might be on", () => {
        expect(mhz("14210.5")).toBe(14.2105);
    });
});

describe("tunableFrom", () => {
    // The MHz stay put and the kHz are what changes, so the cursor lands on the last three digits
    // whatever the band's width — no lookup, nothing to keep in step with the band table.
    test("offers up the kHz and leaves the MHz alone", () => {
        expect(tunableFrom("14210")).toBe(2);
        expect(tunableFrom("7032")).toBe(1);
        expect(tunableFrom("50313")).toBe(2);
        expect(tunableFrom("144300")).toBe(3);
    });

    test("selects the lot when there's no MHz part to keep", () => {
        expect(tunableFrom("475")).toBe(0);
        expect(tunableFrom("")).toBe(0);
    });

    test("counts from the whole part, not the fraction", () => {
        expect(tunableFrom("14210.5")).toBe(2);
    });
});
