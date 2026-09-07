import { describe, expect, test } from "vitest";
import { groupBy, unique } from "../src/lib/utils/arrays";

describe("groupBy", () => {
    const qsos = [
        { call: "VK4ALE", band: "20m" },
        { call: "G4ABC", band: "40m" },
        { call: "VK2XYZ", band: "20m" },
    ];

    test("groups by the key the callback returns, in first-seen order", () => {
        expect(Object.keys(groupBy(qsos, (q) => q.band))).toEqual(["20m", "40m"]);
        expect(groupBy(qsos, (q) => q.band)["20m"]).toEqual([qsos[0], qsos[2]]);
    });

    test("files an element under every key when the callback returns several", () => {
        const groups = groupBy(qsos, (q) => [q.band, q.call]);
        expect(groups["20m"]).toEqual([qsos[0], qsos[2]]);
        expect(groups["G4ABC"]).toEqual([qsos[1]]);
    });

    test("keeps the elements themselves, not copies", () => {
        expect(groupBy(qsos, (q) => q.band)["40m"][0]).toBe(qsos[1]);
    });

    test("returns nothing for an empty array", () => {
        expect(groupBy([] as { band: string }[], (q) => q.band)).toEqual({});
    });
});

describe("unique", () => {
    test("drops repeats and keeps first-seen order", () => {
        expect(unique(["20m", "40m", "20m", "10m", "40m"])).toEqual(["20m", "40m", "10m"]);
    });

    test("compares by identity for objects", () => {
        const a = { call: "VK4ALE" };
        expect(unique([a, { call: "VK4ALE" }, a])).toHaveLength(2);
    });
});
