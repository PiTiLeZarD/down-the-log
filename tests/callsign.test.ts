import { describe, expect, test } from "vitest";
import { callsigns } from "../app/lib/data/callsigns";
import {
    baseCallsign,
    collapseCallsign,
    findCountry,
    getCallsignData,
    parseCallsign,
    withState,
} from "../app/lib/utils/callsign";

describe("parseCallsign", () => {
    test("splits a plain callsign into prefix / index / delineation", () => {
        expect(parseCallsign("VK4ALE")).toMatchObject({ prefix: "VK", index: "4", delineation: "ALE", suffix: "" });
    });

    test("keeps the operating suffix apart", () => {
        expect(parseCallsign("G4ABC/M")).toMatchObject({ prefix: "G", index: "4", delineation: "ABC", suffix: "M" });
        expect(parseCallsign("VK4ALE-P")).toMatchObject({ prefix: "VK", index: "4", delineation: "ALE", suffix: "P" });
    });

    test("reads a numbered location prefix", () => {
        expect(parseCallsign("EA8/DL1ABC")).toMatchObject({
            locPrefix: "EA",
            locIndex: "8",
            prefix: "DL",
            index: "1",
            delineation: "ABC",
        });
    });

    test("handles a digit inside the prefix", () => {
        expect(parseCallsign("9A1AA")).toMatchObject({ prefix: "9A", index: "1", delineation: "AA" });
        expect(parseCallsign("3D2AB")).toMatchObject({ prefix: "3D", index: "2", delineation: "AB" });
    });

    test("returns undefined for empty or unparseable input", () => {
        expect(parseCallsign("")).toBeUndefined();
        expect(parseCallsign("12345")).toBeUndefined();
    });
});

describe("baseCallsign", () => {
    test("drops the operating suffix", () => {
        expect(baseCallsign("VK4ALE/P")).toBe("VK4ALE");
        expect(baseCallsign("VK4ALE/QRP")).toBe("VK4ALE");
        expect(baseCallsign("G4ABC-M")).toBe("G4ABC");
    });

    test("drops the location prefix, so the same operator matches across countries", () => {
        expect(baseCallsign("EA8/DL1ABC")).toBe("DL1ABC");
        expect(baseCallsign("DL1ABC")).toBe("DL1ABC");
    });

    test("returns undefined rather than throwing on junk", () => {
        expect(baseCallsign("12345")).toBeUndefined();
    });

    test("is memoised, so repeated calls keep answering the same thing", () => {
        expect(baseCallsign("VK4ALE/P")).toBe(baseCallsign("VK4ALE/P"));
        expect(baseCallsign("12345")).toBeUndefined();
    });
});

test("baseCallsign sees an unnumbered location prefix too", () => {
    expect(baseCallsign("F/VK4ALE/P")).toBe("VK4ALE");
    expect(baseCallsign("PA/G4ABC")).toBe("G4ABC");
    expect(parseCallsign("F/VK4ALE/P")).toMatchObject({ locPrefix: "F", prefix: "VK", index: "4", suffix: "P" });
});

describe("collapseCallsign", () => {
    test("is the base callsign when there is no location prefix", () => {
        expect(collapseCallsign("VK4ALE/P")).toBe("VK4ALE");
        expect(collapseCallsign("9A1AA")).toBe("9A1AA");
    });

    test("keeps the location prefix over the home one", () => {
        expect(collapseCallsign("EA8/DL1ABC")).toBe("EA8ABC");
    });

    test("borrows the home call area when the location prefix has no digit", () => {
        expect(collapseCallsign("F/VK4ALE/P")).toBe("F4ALE");
    });

    test("falls back to the input when it can't be parsed", () => {
        expect(collapseCallsign("12345")).toBe("12345");
    });
});

describe("getCallsignData", () => {
    test("resolves the country of a plain callsign", () => {
        expect(getCallsignData("VK4ALE")).toMatchObject({ iso3: "AUS", dxcc: "150", ctn: "OC" });
        expect(getCallsignData("W1AW")).toMatchObject({ iso3: "USA", ctn: "NA" });
    });

    test("resolves on the base callsign, so a suffix doesn't change the country", () => {
        expect(getCallsignData("VK4ALE/P")?.iso3).toBe("AUS");
    });

    // The list is alphabetical and the first match wins, so the broad AUS row sits well above the
    // external territories it would otherwise swallow.
    test("the Australian external territories aren't swallowed by AUS", () => {
        expect(getCallsignData("VK4ALE")?.iso3).toBe("AUS");
        expect(getCallsignData("VK9PH")?.iso3).toBe("NFK");
        expect(getCallsignData("VK9XY")?.iso3).toBe("CXR");
        expect(getCallsignData("VK0AB")?.iso3).toBe("ATA");
    });

    // Madeira and the Azores are Portugal to ISO but their own DXCC entities, so they share PRT and
    // are told apart by the digit.
    test("Madeira and the Azores resolve to their own DXCC under PRT", () => {
        expect(getCallsignData("CT1ABC")).toMatchObject({ iso3: "PRT", dxcc: "272" });
        expect(getCallsignData("CS7ABC")).toMatchObject({ iso3: "PRT", dxcc: "272" });
        expect(getCallsignData("CT3MD")).toMatchObject({ iso3: "PRT", dxcc: "256" });
        expect(getCallsignData("CQ9K")).toMatchObject({ iso3: "PRT", dxcc: "256" });
        expect(getCallsignData("CU2AA")).toMatchObject({ iso3: "PRT", dxcc: "149" });
        expect(getCallsignData("CT8AA")).toMatchObject({ iso3: "PRT", dxcc: "149" });
    });

    // On its own it answers for the home callsign; callers that care where the operator actually
    // is (CallsignAutofill, the issue checker) collapse first. Both directions are pinned here so
    // neither drifts.
    test("resolves the home country of a portable callsign", () => {
        expect(getCallsignData("F5/DL1ABC")?.iso3).toBe("DEU");
    });

    test("resolves the visited country once the callsign is collapsed", () => {
        expect(getCallsignData(collapseCallsign("F5/DL1ABC"))?.iso3).toBe("FRA");
    });

    test("derives the state from the call area where the country defines states", () => {
        expect(getCallsignData("VK2XYZ")?.state).toBe("NSW");
        expect(getCallsignData("VK4ALE")?.state).toBe("QLD");
    });

    test("leaves state undefined for countries without state regexps", () => {
        expect(getCallsignData("F1ABC")?.state).toBeUndefined();
    });

    test("returns undefined for an empty callsign", () => {
        expect(getCallsignData("")).toBeUndefined();
    });
});

describe("withState", () => {
    test("returns undefined when there is no callsign data", () => {
        expect(withState("VK4ALE", undefined)).toBeUndefined();
    });

    test("adds no state when the entry has no state map", () => {
        expect(withState("F1ABC", { iso3: "FRA", dxcc: "227", regexp: /^F.*/, gs: "IN95", ctn: "EU" })).toMatchObject({
            iso3: "FRA",
            state: undefined,
        });
    });
});

describe("findCountry", () => {
    test("maps callsign data to a country entry", () => {
        expect(findCountry(getCallsignData("VK4ALE"))).toBeTruthy();
    });

    test("is undefined without callsign data", () => {
        expect(findCountry(undefined)).toBeUndefined();
    });
});

// A stateful (`/g`) regexp in the table would make `.test()` alternate true/false on repeated
// calls, which is exactly the kind of bug that only shows up on the second lookup.
test("no callsign regexp is global", () => {
    callsigns.forEach((cs) => {
        expect(cs.regexp.global, `${cs.iso3} regexp`).toBe(false);
        Object.entries(cs.states || {}).forEach(([state, re]) =>
            expect(re.global, `${cs.iso3} ${state} regexp`).toBe(false),
        );
    });
});
