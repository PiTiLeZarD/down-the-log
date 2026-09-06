import { describe, expect, test } from "vitest";
import { completeSotaReference, formatSotaReference } from "../src/lib/utils/sota-reference";

describe("formatSotaReference", () => {
    test("writes the separators of a reference typed as bare characters", () => {
        expect(formatSotaReference("w7amn001")).toBe("W7A/MN-001");
        expect(formatSotaReference("gmss119")).toBe("GM/SS-119");
        expect(formatSotaReference("ct3mi001")).toBe("CT3/MI-001");
    });

    test("splits an association that another association starts with", () => {
        // G is a reference and also the start of GM, so it can't be split off on its own.
        expect(formatSotaReference("g")).toBe("G");
        expect(formatSotaReference("gm")).toBe("GM");
        expect(formatSotaReference("gce001")).toBe("G/CE-001");
        expect(formatSotaReference("gmss")).toBe("GM/SS");
    });

    test("prefers the split that names a real region", () => {
        // W7 is an association too, so W7/AM would be the greedier read of the same keystrokes.
        expect(formatSotaReference("w7amn")).toBe("W7A/MN");
    });

    test("leaves a reference that is already formatted alone", () => {
        expect(formatSotaReference("W7A/MN-001")).toBe("W7A/MN-001");
        expect(formatSotaReference("w7a/mn-001")).toBe("W7A/MN-001");
    });

    test("never re-adds a separator that was just deleted", () => {
        // Backspacing has to be able to shrink the value, one character per press.
        expect(formatSotaReference("W7A/MN-0")).toBe("W7A/MN-0");
        expect(formatSotaReference("W7A/MN-")).toBe("W7A/MN-");
        expect(formatSotaReference("W7A/MN")).toBe("W7A/MN");
        expect(formatSotaReference("W7A/")).toBe("W7A/");
        expect(formatSotaReference("W7A")).toBe("W7A");
    });

    test("keeps characters that belong to no association", () => {
        expect(formatSotaReference("zz")).toBe("ZZ");
        expect(formatSotaReference("")).toBe("");
    });

    test("drops everything the format has no room for", () => {
        expect(formatSotaReference("w7a mn 001 5")).toBe("W7A/MN-001");
        expect(formatSotaReference("w7a/mn-001x")).toBe("W7A/MN-001");
    });
});

describe("completeSotaReference", () => {
    test("pads the number out to three digits", () => {
        expect(completeSotaReference("W7A/MN-1")).toBe("W7A/MN-001");
        expect(completeSotaReference("W7A/MN-15")).toBe("W7A/MN-015");
        expect(completeSotaReference("W7A/MN-150")).toBe("W7A/MN-150");
    });

    test("strips a separator left dangling", () => {
        expect(completeSotaReference("W7A/")).toBe("W7A");
        expect(completeSotaReference("W7A/MN-")).toBe("W7A/MN");
    });

    test("leaves anything else as it stands", () => {
        expect(completeSotaReference("")).toBe("");
        expect(completeSotaReference("W7A/MN-001")).toBe("W7A/MN-001");
    });
});
