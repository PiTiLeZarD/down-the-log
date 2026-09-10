import { describe, expect, test } from "vitest";
import { stateRegexps } from "../src/lib/data/callsigns";
import { dxccEntities, dxccName } from "../src/lib/data/cty";
import {
    baseCallsign,
    collapseCallsign,
    findCountry,
    getCallsignData,
    parseCallsign,
    withState,
} from "../src/lib/utils/callsign";

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
        expect(getCallsignData("VK4ALE")).toMatchObject({ iso3: "AUS", dxcc: 150, ctn: "OC" });
        expect(getCallsignData("W1AW")).toMatchObject({ iso3: "USA", ctn: "NA" });
    });

    test("resolves on the base callsign, so a suffix doesn't change the country", () => {
        expect(getCallsignData("VK4ALE/P")?.iso3).toBe("AUS");
    });

    // Longest prefix wins, so the external territories come out on their own without the entity
    // list needing a lookahead written by hand to keep VK9 away from VK.
    test("the Australian external territories aren't swallowed by AUS", () => {
        expect(getCallsignData("VK4ALE")?.dxcc).toBe(150);
        expect(getCallsignData("VK9PH")?.iso3).toBe("NFK");
        expect(getCallsignData("VK9XY")?.iso3).toBe("CXR");
        expect(getCallsignData("VK9CE")?.dxcc).toBe(38); // Cocos (Keeling)
        expect(getCallsignData("VK9LA")?.dxcc).toBe(147); // Lord Howe
    });

    // Madeira and the Azores are Portugal to ISO but their own DXCC entities, so they share PRT and
    // are told apart by the digit.
    test("Madeira and the Azores resolve to their own DXCC under PRT", () => {
        expect(getCallsignData("CT1ABC")).toMatchObject({ iso3: "PRT", dxcc: 272 });
        expect(getCallsignData("CS7ABC")).toMatchObject({ iso3: "PRT", dxcc: 272 });
        expect(getCallsignData("CT3MD")).toMatchObject({ iso3: "PRT", dxcc: 256 });
        expect(getCallsignData("CQ9K")).toMatchObject({ iso3: "PRT", dxcc: 256 });
        expect(getCallsignData("CU2AA")).toMatchObject({ iso3: "PRT", dxcc: 149 });
        expect(getCallsignData("CT8AA")).toMatchObject({ iso3: "PRT", dxcc: 149 });
    });

    // A row of entities the hand-written table had no way to reach: it was keyed by ISO country and
    // could only name one DXCC entity per country, so all of these came back as their parent.
    test("sub-entities of a country resolve to their own DXCC", () => {
        expect(getCallsignData("EA8ABC")).toMatchObject({ iso3: "ESP", dxcc: 29 }); // Canary Is.
        expect(getCallsignData("EA6ABC")).toMatchObject({ iso3: "ESP", dxcc: 21 }); // Balearic Is.
        expect(getCallsignData("EA9ABC")).toMatchObject({ iso3: "ESP", dxcc: 32 }); // Ceuta & Melilla
        expect(getCallsignData("EA4ABC")).toMatchObject({ iso3: "ESP", dxcc: 281 }); // Spain
        expect(getCallsignData("GM4ABC")).toMatchObject({ iso3: "GBR", dxcc: 279 }); // Scotland
        expect(getCallsignData("GW4ABC")).toMatchObject({ iso3: "GBR", dxcc: 294 }); // Wales
        expect(getCallsignData("GI4ABC")).toMatchObject({ iso3: "GBR", dxcc: 265 }); // Northern Ireland
        expect(getCallsignData("G4ABC")).toMatchObject({ iso3: "GBR", dxcc: 223 }); // England
        expect(getCallsignData("KL7AA")).toMatchObject({ iso3: "USA", dxcc: 6 }); // Alaska
        expect(getCallsignData("KH6J")).toMatchObject({ iso3: "USA", dxcc: 110 }); // Hawaii
        expect(getCallsignData("SV9ABC")).toMatchObject({ iso3: "GRC", dxcc: 40 }); // Crete
        expect(getCallsignData("IS0ABC")).toMatchObject({ iso3: "ITA", dxcc: 225 }); // Sardinia
        expect(getCallsignData("TK5ABC")).toMatchObject({ iso3: "FRA", dxcc: 214 }); // Corsica
        expect(getCallsignData("UA2FZ")).toMatchObject({ iso3: "RUS", dxcc: 126 }); // Kaliningrad
    });

    // Sicily is a cty.dat split rather than a DXCC entity of its own: the entity stays Italy, but
    // the zones and continent it carries are the ones the prefix says.
    test("a contest-only split keeps its zones and its parent entity", () => {
        expect(getCallsignData("IT9ABC")).toMatchObject({ dxcc: 248, cq: 15, itu: 28 });
        expect(getCallsignData("IG9A")).toMatchObject({ dxcc: 248, ctn: "AF" });
    });

    test("carries the CQ and ITU zones of the prefix, not of the entity", () => {
        expect(getCallsignData("K6ABC")).toMatchObject({ cq: 3, itu: 6 });
        expect(getCallsignData("W1AW")).toMatchObject({ cq: 5, itu: 8 });
        expect(getCallsignData("RA1ABC")).toMatchObject({ dxcc: 54, cq: 16 });
        expect(getCallsignData("RA0FF")).toMatchObject({ dxcc: 15, ctn: "AS" });
    });

    // A location prefix says where the operator is, and that beats everything the home callsign
    // says — including an exception the table holds for it.
    test("a location prefix wins over the home callsign", () => {
        expect(getCallsignData("F5/DL1ABC")?.iso3).toBe("FRA");
        expect(getCallsignData("EA8/DL1ABC")?.dxcc).toBe(29);
        expect(getCallsignData("DL1ABC")?.iso3).toBe("DEU");
    });

    test("derives the state from the call area where the entity defines states", () => {
        expect(getCallsignData("VK2XYZ")?.state).toBe("NSW");
        expect(getCallsignData("VK4ALE")?.state).toBe("QLD");
    });

    test("leaves state undefined for entities without state regexps", () => {
        expect(getCallsignData("F1ABC")?.state).toBeUndefined();
    });

    test("returns undefined for an empty callsign", () => {
        expect(getCallsignData("")).toBeUndefined();
    });

    test("returns undefined for a callsign no prefix covers", () => {
        expect(getCallsignData("12345")).toBeUndefined();
    });
});

describe("withState", () => {
    const france = { dxcc: 227, name: "France", iso3: "FRA", ctn: "EU" as const, cq: 14, itu: 27, gs: "JN16aa" };

    test("returns undefined when there is no callsign data", () => {
        expect(withState("VK4ALE", undefined)).toBeUndefined();
    });

    test("adds no state when the entity has no state map", () => {
        expect(withState("F1ABC", france)).toMatchObject({ iso3: "FRA" });
        expect(withState("F1ABC", france)?.state).toBeUndefined();
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
test("no state regexp is global", () => {
    Object.entries(stateRegexps).forEach(([dxcc, states]) =>
        Object.entries(states).forEach(([state, re]) => expect(re.global, `${dxcc} ${state} regexp`).toBe(false)),
    );
});

describe("the entity table", () => {
    test("covers every current DXCC entity", () => {
        expect(dxccEntities.length).toBe(340);
    });

    test("names deleted entities too, so an imported QSO doesn't read as a bare number", () => {
        expect(dxccName(230)).toBe("Federal Republic of Germany");
        expect(dxccName(154)).toBeTruthy(); // Yemen Arab Republic, deleted in 1990
        expect(dxccName(undefined)).toBeUndefined();
    });

    test("every entity has a reference gridsquare and zones", () => {
        dxccEntities.forEach((e) => {
            expect(e.gs, e.name).toMatch(/^[A-R]{2}[0-9]{2}[a-x]{2}$/);
            expect(e.cq, e.name).toBeGreaterThan(0);
            expect(e.itu, e.name).toBeGreaterThan(0);
        });
    });
});
