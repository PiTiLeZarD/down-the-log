import { DateTime } from "luxon";
import { describe, expect, test } from "vitest";
import { QSO } from "../app/lib/components/qso";
import {
    getQsoIssues,
    hasIgnoredIssues,
    hasIssues,
    hasOpenIssues,
    ignoreIssue,
    issueKey,
    resolveCountry,
    restoreIssue,
} from "../app/lib/utils/qso-issues";

let counter = 0;
const qso = (fields: Partial<QSO> = {}): QSO => ({
    id: `q${counter++}`,
    date: DateTime.fromISO("2024-04-27T10:00:00", { zone: "utc" }),
    callsign: "VK4ALE",
    ...fields,
});
const fields = (q: QSO) => getQsoIssues(q).map((i) => i.field);

describe("resolveCountry", () => {
    test("accepts our iso3", () => expect(resolveCountry("AUS")).toBe("AUS"));
    test("accepts the entity name an ADIF import leaves behind", () =>
        expect(resolveCountry("australia")).toBe("AUS"));
    test("gives up on anything else", () => expect(resolveCountry("Freedonia")).toBeUndefined());
});

describe("country, continent, dxcc and locator", () => {
    test("a consistent QSO has no issues", () =>
        expect(hasIssues(qso({ country: "AUS", continent: "OC", dxcc: 150, locator: "QG62" }))).toBe(false));

    test("an imported entity name is not a mismatch", () =>
        expect(hasIssues(qso({ country: "Australia", continent: "OC" }))).toBe(false));

    test("country not matching the callsign", () =>
        expect(fields(qso({ callsign: "VK4ALE", country: "FRA" }))).toContain("country"));

    test("unknown country", () => expect(fields(qso({ country: "Freedonia" }))).toContain("country"));

    test("continent not matching the country", () =>
        expect(fields(qso({ callsign: "F4ABC", country: "FRA", continent: "OC" }))).toContain("continent"));

    test("dxcc not matching the country", () =>
        expect(fields(qso({ country: "AUS", continent: "OC", dxcc: 227 }))).toContain("dxcc"));

    // ~100 DXCC entities are islands ISO gives no code to, so they sit in no row of the table. We
    // can't place them, which is not the same as knowing they're wrong.
    test("a dxcc we can't place is not called a mismatch", () =>
        expect(fields(qso({ callsign: "EA6ABC", country: "ESP", continent: "EU", dxcc: 21 }))).not.toContain("dxcc"));

    // The form hands back whatever was typed, so a QSO edited on screen carries strings in the
    // numeric fields. 170 and "170" are the same DXCC.
    test("a dxcc typed into the form still matches", () =>
        expect(hasIssues(qso({ callsign: "ZL3JAS", country: "NZL", continent: "OC", dxcc: "170" as never }))).toBe(
            false,
        ));

    test("a frequency typed into the form is still range checked", () => {
        expect(hasIssues(qso({ band: "20m", frequency: "14.074" as never }))).toBe(false);
        expect(fields(qso({ band: "20m", frequency: "7.074" as never }))).toContain("frequency");
    });

    test("malformed locator", () => expect(fields(qso({ locator: "nope" }))).toContain("locator"));

    test("locator on the wrong side of the planet", () =>
        expect(fields(qso({ callsign: "F4ABC", country: "FRA", continent: "EU", locator: "QG62" }))).toContain(
            "locator",
        ));

    test("an iso3 spanning several entities accepts any of them", () => {
        // European Russia is DXCC 54/EU, Asiatic Russia 15/AS, both under RUS.
        expect(hasIssues(qso({ callsign: "RV6FT", country: "RUS", continent: "EU", dxcc: 54 }))).toBe(false);
        expect(hasIssues(qso({ callsign: "RA0FF", country: "RUS", continent: "AS", dxcc: 15 }))).toBe(false);
    });

    test("a dxcc belonging to no entity of the country is still caught", () =>
        expect(fields(qso({ callsign: "RV6FT", country: "RUS", continent: "EU", dxcc: 291 }))).toContain("dxcc"));

    test("Antarctic grids are not distance checked", () =>
        expect(hasIssues(qso({ callsign: "RI1ANE", country: "ATA", continent: "AN", locator: "MC80eo" }))).toBe(false));

    test("locator inside the entity is fine", () =>
        expect(fields(qso({ callsign: "F4ABC", country: "FRA", continent: "EU", locator: "JN18" }))).not.toContain(
            "locator",
        ));
});

describe("events", () => {
    test("known references pass", () =>
        expect(hasIssues(qso({ pota: "US-0001", myWwff: "3AFF-0001" }))).toBe(false));

    test("unknown reference", () => expect(fields(qso({ pota: "XX-9999" }))).toContain("pota"));

    test("unknown reference on my side", () => expect(fields(qso({ myPota: "XX-9999" }))).toContain("myPota"));

    test("sig info with no matching reference", () =>
        expect(fields(qso({ sig: "POTA", sigInfo: "US-0001" }))).toContain("pota"));

    test("sig info disagreeing with the reference", () =>
        expect(fields(qso({ pota: "US-0001", sig: "POTA", sigInfo: "US-0002" }))).toContain("sigInfo"));

    test("matching sig info passes", () =>
        expect(hasIssues(qso({ pota: "US-0001", sig: "POTA", sigInfo: "US-0001" }))).toBe(false));

    test("a plain sig is not checked against anything", () =>
        expect(hasIssues(qso({ sig: "GMA", sigInfo: "DA/BW-001" }))).toBe(false));
});

describe("bands", () => {
    test("frequency inside the band", () =>
        expect(hasIssues(qso({ band: "20m", frequency: 14.074 }))).toBe(false));

    test("frequency outside the band", () =>
        expect(fields(qso({ band: "20m", frequency: 7.074 }))).toContain("frequency"));

    test("unknown band", () =>
        expect(fields(qso({ band: "11m" as QSO["band"], frequency: 27.5 }))).toContain("band"));

    test("frequency with no band is not checked", () => expect(hasIssues(qso({ frequency: 7.074 }))).toBe(false));
});

describe("ignoring issues", () => {
    const flagged = () => qso({ callsign: "ZL3JAS", country: "NZL", continent: "OC", dxcc: 150, locator: "RR73" });

    test("an ignored issue is still reported, flagged", () => {
        const q = flagged();
        const ignored = ignoreIssue(undefined, getQsoIssues(q)[0]);
        const q2 = { ...q, ignoredIssues: ignored };

        expect(getQsoIssues(q2)).toHaveLength(getQsoIssues(q).length);
        expect(getQsoIssues(q2).filter((i) => i.ignored)).toHaveLength(1);
    });

    test("a fully dismissed QSO still has issues, just no open ones", () => {
        const q = flagged();
        const q2 = { ...q, ignoredIssues: getQsoIssues(q).map(issueKey) };

        expect(hasOpenIssues(q)).toBe(true);
        expect(hasOpenIssues(q2)).toBe(false);
        expect(hasIssues(q2)).toBe(true);
        expect(hasIgnoredIssues(q2)).toBe(true);
    });

    test("ignoring one issue leaves the others alone", () => {
        const q = flagged();
        const dxccIssue = getQsoIssues(q).find((i) => i.field === "dxcc")!;
        const q2 = { ...q, ignoredIssues: ignoreIssue(undefined, dxccIssue) };

        expect(hasOpenIssues(q2)).toBe(true);
        expect(fields(q2).filter((f) => f === "dxcc")).toHaveLength(1);
        expect(getQsoIssues(q2).filter((i) => !i.ignored).map((i) => i.field)).toContain("locator");
    });

    test("the key survives the value changing, so a fix doesn't resurrect a dismissal", () => {
        const q = flagged();
        const issue = getQsoIssues(q).find((i) => i.field === "dxcc")!;
        const ignoredIssues = ignoreIssue(undefined, issue);

        // Same wrong DXCC, different everything else the description quotes.
        const q2 = { ...q, callsign: "ZL2ABC", locator: "RE78", ignoredIssues };
        expect(getQsoIssues(q2).find((i) => i.field === "dxcc")?.ignored).toBe(true);
    });

    test("restoring removes just that key", () => {
        const q = flagged();
        const [first, second] = getQsoIssues(q);
        const both = ignoreIssue(ignoreIssue(undefined, first), second);

        expect(restoreIssue(both, first)).toEqual([issueKey(second)]);
    });

    test("ignoring twice doesn't duplicate the key", () => {
        const issue = getQsoIssues(flagged())[0];
        expect(ignoreIssue(ignoreIssue(undefined, issue), issue)).toHaveLength(1);
    });
});

test("issues are cached against the QSO", () => {
    const q = qso({ country: "Freedonia" });
    expect(getQsoIssues(q)).toBe(getQsoIssues(q));
});
