import { describe, expect, test } from "vitest";
import { searchReferences } from "../src/lib/utils/reference-search";

describe("searchReferences", () => {
    test("finds references by their prefix", () => {
        const matches = searchReferences("sota", "W7A/MN-0");
        expect(matches.length).toBeGreaterThan(0);
        expect(matches.every((m) => m.reference.startsWith("W7A/MN-0"))).toBe(true);
        expect(matches[0].name).toBeTruthy();
    });

    test("finds references by name, whatever the case", () => {
        const matches = searchReferences("sota", "humphreys");
        expect(matches.length).toBeGreaterThan(0);
        expect(matches.every((m) => m.name.toUpperCase().includes("HUMPHREYS"))).toBe(true);
        expect(matches.map((m) => m.reference)).toContain("W7A/AE-001");
    });

    test("says nothing about a reference that is already complete", () => {
        expect(searchReferences("sota", "W7A/MN-001")).toEqual([]);
    });

    test("waits for something to search on", () => {
        expect(searchReferences("sota", "")).toEqual([]);
        expect(searchReferences("sota", "W")).toEqual([]);
    });

    test("searches every programme that has data", () => {
        expect(searchReferences("pota", "US-00").length).toBeGreaterThan(0);
        expect(searchReferences("sig", "anything")).toEqual([]);
    });
});

describe("searchReferences with nothing to go on", () => {
    test("takes an unset field without throwing", () => {
        expect(searchReferences("sota", undefined)).toEqual([]);
    });
});
