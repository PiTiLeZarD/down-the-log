import { DateTime } from "luxon";
import { describe, expect, test } from "vitest";
import { applySpotFilter } from "../src/lib/utils/spots/filter";
import { mergeSpots, sameActivation, spotBadges } from "../src/lib/utils/spots/merge";
import { parsePnpSpot } from "../src/lib/utils/spots/parksnpeaks";
import { parsePotaSpot } from "../src/lib/utils/spots/pota";
import { spotDistance, spotLocator, spotStatus } from "../src/lib/utils/spots/status";
import { qsoFromSpot, spotReferences } from "../src/lib/utils/spots/to-qso";
import { MergedSpot, Spot, defaultSpotFilter, isQrt } from "../src/lib/utils/spots/types";
import { QSO } from "../src/lib/components/qso";
import { fixSettings } from "../src/lib/utils/store";

const at = (iso: string) => DateTime.fromISO(iso, { zone: "utc" });

const spot = (fields: Partial<Spot> = {}): Spot => ({
    id: "s1",
    source: "pota",
    programme: "pota",
    date: at("2024-01-01T10:00:00Z"),
    callsign: "VK6MB",
    ...fields,
});

const merged = (fields: Partial<Spot> = {}): MergedSpot => {
    const head = spot(fields);
    return { ...head, sources: [head] };
};

describe("parsing", () => {
    test("POTA quotes kHz as a string and everything else in MHz", () => {
        const parsed = parsePotaSpot({
            spotId: 1,
            activator: "F8NUH/P",
            frequency: "7008.0",
            mode: "CW",
            reference: "FR-16006",
            parkName: null,
            spotTime: "2026-09-07T07:20:40",
            spotter: "DF1RL",
            comments: "mci et 44",
            source: "Web",
            invalid: null,
            name: "Etangs des dames",
            locationDesc: "FR-ARA",
            grid4: "JN25",
            grid6: "JN25no",
            latitude: 45.5,
            longitude: 5.1,
        } as Parameters<typeof parsePotaSpot>[0]);
        expect(parsed.frequency).toBe(7.008);
        expect(parsed.band).toBe("40m");
        expect(parsed.mode).toBe("CW");
        expect(parsed.locator).toBe("JN25no");
        expect(parsed.date.toISO()).toBe(at("2026-09-07T07:20:40Z").toISO());
        expect(parsed.automatic).toBe(false);
    });

    test("an RBN relay is marked automatic so it can be filtered out on its own", () => {
        const parsed = parsePotaSpot({
            spotId: 2,
            activator: "W3DFP",
            frequency: "7074.0",
            mode: "FT8",
            reference: "US-1566",
            spotTime: "2026-09-07T06:51:38",
            spotter: "WA7LNW-#",
            comments: "RBN -14 dB",
            source: "RBN",
        } as Parameters<typeof parsePotaSpot>[0]);
        expect(parsed.automatic).toBe(true);
    });

    test("ParksnPeaks classes we don't model keep their own name", () => {
        const parsed = parsePnpSpot({
            actID: "2796652",
            actTime: "2026-09-07 06:59:24",
            actCallsign: "VK5DG",
            actMode: "SSB",
            actFreq: "7.144",
            actClass: "SHIRES",
            altClass: "",
            actSiteID: "AS3",
            actLocation: "Onkaparinga",
            altLocation: "",
            actComments: "QRT. Tnx all.",
            actSpoter: "VK5DG",
            WWFFid: "",
        });
        expect(parsed.programme).toBe("sig");
        expect(parsed.programmeLabel).toBe("SHIRES");
        expect(parsed.frequency).toBe(7.144);
        expect(isQrt(parsed)).toBe(true);
    });
});

describe("merging", () => {
    test("the same activation spotted on two networks is one row carrying both badges", () => {
        const rows = mergeSpots([
            spot({ id: "pnp-1", source: "pnp", programme: "wwff", reference: "VKFF-0981", frequency: 14.244 }),
            spot({ id: "pota-1", source: "pota", programme: "pota", reference: "VK-0123", frequency: 14.2445 }),
        ]);
        expect(rows).toHaveLength(1);
        expect(spotBadges(rows[0]).map((badge) => badge.label)).toEqual(["WWFF", "POTA"]);
    });

    test("a park's POTA and WWFF references name the same park", () => {
        expect(
            sameActivation(
                spot({ reference: "US-0119", frequency: 14.25 }),
                spot({ id: "s2", source: "pnp", programme: "wwff", reference: "KFF-0119", frequency: 14.25 }),
            ),
        ).toBe(true);
    });

    test("a twofer stays two rows: one award can't hold two references", () => {
        const rows = mergeSpots([
            spot({ id: "a", reference: "US-0001", frequency: 14.244 }),
            spot({ id: "b", reference: "US-0002", frequency: 14.244 }),
        ]);
        expect(rows).toHaveLength(2);
    });

    test("the same callsign two bands apart stays two rows", () => {
        const rows = mergeSpots([spot({ frequency: 14.244 }), spot({ id: "s2", frequency: 7.144 })]);
        expect(rows).toHaveLength(2);
    });

    test("the newest spot leads the row and the older ones fill its blanks", () => {
        const rows = mergeSpots([
            spot({ id: "old", date: at("2024-01-01T09:55:00Z"), frequency: 14.244, locator: "OF88ab", mode: "SSB" }),
            spot({ id: "new", date: at("2024-01-01T10:00:00Z"), frequency: 14.244, comments: "up 5" }),
        ]);
        expect(rows[0].id).toBe("new");
        expect(rows[0].locator).toBe("OF88ab");
        expect(rows[0].mode).toBe("SSB");
        expect(rows[0].sources).toHaveLength(2);
    });
});

describe("status against the log", () => {
    const qso = (fields: Partial<QSO> = {}): QSO => ({
        id: "q1",
        date: DateTime.utc(),
        callsign: "VK6MB",
        ...fields,
    });

    test("a reference nothing in the log has worked is new", () => {
        expect(spotStatus(spot({ reference: "VK-0123" }), []).newReference).toBe(true);
        expect(spotStatus(spot({ reference: "VK-0123" }), [qso({ pota: "VK-0123" })]).newReference).toBe(false);
    });

    test("the log knowing a park by its WWFF name still counts as worked", () => {
        expect(spotStatus(spot({ reference: "US-0119" }), [qso({ wwff: "KFF-0119" })]).newReference).toBe(false);
    });

    test("same callsign, band and mode today is a dupe; yesterday is not", () => {
        const today = spot({ band: "20m", mode: "SSB", date: DateTime.utc() });
        expect(spotStatus(today, [qso({ band: "20m", mode: "SSB" })]).dupe).toBe(true);
        expect(spotStatus(today, [qso({ band: "20m", mode: "SSB", date: DateTime.utc().minus({ days: 1 }) })]).dupe).toBe(
            false,
        );
        expect(spotStatus(today, [qso({ band: "40m", mode: "SSB" })]).dupe).toBe(false);
    });

    test("a spot with no gridsquare borrows the one shipped with its reference", () => {
        expect(spotLocator(spot({ reference: "US-0001", locator: undefined }))).toBe("FN54vh");
        expect(spotDistance(spot({ reference: "US-0001" }), "FN54vh")).toBe(0);
    });
});

describe("filtering", () => {
    const now = at("2024-01-01T10:00:00Z");
    const spots = [
        merged({ id: "a", band: "20m", mode: "SSB", reference: "VK-0123" }),
        merged({ id: "b", band: "40m", mode: "CW", reference: "VK-0124", date: at("2024-01-01T09:50:00Z") }),
        merged({ id: "c", band: "20m", mode: "FT8", comments: "QRT thanks", automatic: true }),
    ];
    const filtered = (filter = defaultSpotFilter, qsos: QSO[] = []) =>
        applySpotFilter(spots, filter, ["pota", "pnp"], qsos, now).map((s) => s.id);

    test("an untouched filter hides nothing recent", () => {
        expect(filtered()).toEqual(["a", "b", "c"]);
    });

    test("band, mode group, QRT and RBN each narrow it", () => {
        expect(filtered({ ...defaultSpotFilter, bands: ["20m"] })).toEqual(["a", "c"]);
        expect(filtered({ ...defaultSpotFilter, modeGroups: ["CW"] })).toEqual(["b"]);
        expect(filtered({ ...defaultSpotFilter, hideQrt: true })).toEqual(["a", "b"]);
        expect(filtered({ ...defaultSpotFilter, hideAutomatic: true })).toEqual(["a", "b"]);
    });

    test("anything older than the age limit is gone", () => {
        expect(filtered({ ...defaultSpotFilter, maxAgeMinutes: 5 })).toEqual(["a", "c"]);
    });

    test("new refs only drops what the log has already worked", () => {
        const qsos: QSO[] = [{ id: "q", date: now, callsign: "VK6MB", pota: "VK-0123" }];
        expect(filtered({ ...defaultSpotFilter, newOnly: true }, qsos)).toEqual(["b"]);
    });

    test("a source switched off takes its spots with it", () => {
        expect(applySpotFilter(spots, defaultSpotFilter, ["pnp"], [], now)).toEqual([]);
    });
});

describe("logging from a spot", () => {
    const settings = fixSettings({ myCallsign: "VK3ABC", myGridsquare: "QF22ab" });

    test("every reference the row carries lands on the QSO", () => {
        const row = mergeSpots([
            spot({ id: "pnp-1", source: "pnp", programme: "wwff", reference: "VKFF-0981", frequency: 14.244 }),
            spot({ id: "pota-1", reference: "VK-0123", frequency: 14.244 }),
        ])[0];
        expect(spotReferences(row)).toEqual({ wwff: "VKFF-0981", pota: "VK-0123" });
    });

    test("the spot's frequency, mode and reference are filled, and the report follows the mode", () => {
        const qso = qsoFromSpot(merged({ frequency: 7.032, mode: "CW", reference: "US-0001" }), {
            settings,
            currentLocation: "",
        });
        expect(qso.callsign).toBe("VK6MB");
        expect(qso.frequency).toBe(7.032);
        expect(qso.band).toBe("40m");
        expect(qso.mode).toBe("CW");
        expect(qso.pota).toBe("US-0001");
        // The park's own gridsquare, since the spot didn't carry one.
        expect(qso.locator).toBe("FN54vh");
        expect(qso.myCallsign).toBe("VK3ABC");
        expect(qso.rst_sent).toBe("59");
    });

    test("a scheme with no field of its own goes to sig/sigInfo", () => {
        const qso = qsoFromSpot(merged({ programme: "sig", programmeLabel: "SHIRES", reference: "AS3" }), {
            settings,
            currentLocation: "",
        });
        expect(qso.sigInfo).toBe("AS3");
        expect(qso.sig).toBe("SHIRES");
    });
});
