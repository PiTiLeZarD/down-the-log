import { DateTime } from "luxon";
import { describe, expect, test } from "vitest";
import { QSO } from "../app/lib/components/qso";
import { getQsoIssues, hasIssues, resolveCountry } from "../app/lib/utils/qso-issues";

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

test("issues are cached against the QSO", () => {
    const q = qso({ country: "Freedonia" });
    expect(getQsoIssues(q)).toBe(getQsoIssues(q));
});
