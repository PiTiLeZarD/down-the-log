import { describe, expect, test } from "vitest";
import { allocationFor, disallowedSegments } from "../src/lib/data/allocations";

describe("allocations", () => {
    const vk = allocationFor("VK4ALE");

    test("VK 80m shades the gap and everything above 3.8", () =>
        expect(disallowedSegments(vk, "80m", [3.5, 4.0])).toEqual([
            [3.7, 3.776],
            [3.8, 4.0],
        ]));

    test("VK 60m is shaded whole", () => expect(disallowedSegments(vk, "60m", [5.06, 5.45])).toEqual([[5.06, 5.45]]));

    test("no data, no shading", () => expect(disallowedSegments(allocationFor("G4XYZ"), "60m", [5.06, 5.45])).toEqual([]));
});
