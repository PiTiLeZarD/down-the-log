import { DateTime } from "luxon";
import { describe, expect, test } from "vitest";
import {
    alertKey,
    matchesSpotAlert,
    newSpotAlerts,
    rememberSpots,
    spotAlertNotification,
} from "../src/lib/utils/spots/alerts";
import { applySpotFilter } from "../src/lib/utils/spots/filter";
import { LABEL_HEIGHT, layoutBandMap } from "../src/lib/utils/spots/band-map";
import { parseClusterLine } from "../src/lib/utils/spots/cluster";
import { parseDxSpot } from "../src/lib/utils/spots/dx";
import { clusterSpotCommand } from "../src/lib/utils/spots/self-spot";
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
            actId: 2796652,
            actTime: "2026-09-07 06:59:24",
            actCallsign: "VK5DG",
            actMode: "SSB",
            actFreq: "7.144",
            actClass: "SHIRES",
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

    test("a HamQTH cluster line is kHz, UTC and a mode fished out of the comment", () => {
        const parsed = parseDxSpot("SV8SXD^7026.0^I1MMR^ft8, tnx^0107 2026-10-20^^^EU^40M^Greece^20")!;
        expect(parsed.source).toBe("dx");
        expect(parsed.programme).toBeUndefined();
        expect(parsed.frequency).toBe(7.026);
        expect(parsed.band).toBe("40m");
        expect(parsed.mode).toBe("FT8");
        expect(parsed.date.toISO()).toBe("2026-10-20T01:07:00.000Z");
        expect(parsed.spotter).toBe("I1MMR");
        expect(parseDxSpot("W5ART^21075.2^PY2FZ^^0109 2026-10-20^L^^SA^15M^Brazil^108")!.mode).toBe("FT8");
        expect(parseDxSpot("W5ART^21025.2^PY2FZ^^0109 2026-10-20^L^^SA^15M^Brazil^108")!.mode).toBeUndefined();
        expect(parseDxSpot("")).toBeUndefined();
    });
});

describe("merging", () => {
    test("rows stay newest first across callsigns, with each callsign's spots in its own row", () => {
        const rows = mergeSpots([
            spot({ id: "a1", callsign: "VK2AAA", frequency: 14.2, date: at("2024-01-01T10:00:00Z") }),
            spot({ id: "b1", callsign: "VK3BBB", frequency: 7.1, date: at("2024-01-01T10:05:00Z") }),
            spot({ id: "a2", callsign: "VK2AAA/P", frequency: 14.2, date: at("2024-01-01T10:10:00Z") }),
        ]);
        expect(rows.map((row) => row.sources.map((s) => s.id))).toEqual([["a2", "a1"], ["b1"]]);
    });

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

    test("the same park on two networks merges however far apart it was spotted; a guess doesn't", () => {
        const pnp = spot({ id: "pnp-1", source: "pnp", programme: "wwff", reference: "VKFF-4610", frequency: 7.144 });
        const pota = { reference: "AU-4063", frequency: 7.144, date: at("2024-01-01T10:23:00Z") };
        expect(mergeSpots([pnp, spot({ id: "pota-1", ...pota })])).toHaveLength(1);
        expect(mergeSpots([pnp, spot({ id: "pota-1", ...pota, reference: "AU-0001" })])).toHaveLength(2);
    });

    test("a cluster re-spotting a station on its frequency is one row however far apart", () => {
        const dx = { source: "dx" as const, programme: undefined, callsign: "IT9FJC", frequency: 7.15 };
        const rows = mergeSpots([
            spot({ id: "dx-1", ...dx, date: at("2024-01-01T11:30:00Z") }),
            spot({ id: "dx-2", ...dx, frequency: 7.1495, date: at("2024-01-01T10:00:00Z") }),
        ]);
        expect(rows).toHaveLength(1);
        expect(rows[0].id).toBe("dx-1");
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

    test("a cluster spot of a park activator joins the park's row and takes its programme", () => {
        const rows = mergeSpots([
            spot({ id: "pota-1", date: at("2024-01-01T09:55:00Z"), reference: "VK-0123", frequency: 14.244 }),
            spot({ id: "dx-1", source: "dx", programme: undefined, frequency: 14.244 }),
        ]);
        expect(rows).toHaveLength(1);
        expect(rows[0].id).toBe("dx-1");
        expect(rows[0].programme).toBe("pota");
        expect(rows[0].reference).toBe("VK-0123");
        expect(spotReferences(rows[0])).toEqual({ pota: "VK-0123" });
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

    test("a programme filter hides cluster spots, which have none", () => {
        const dx = merged({ id: "d", source: "dx", programme: undefined, band: "20m" });
        const ids = (filter = defaultSpotFilter) =>
            applySpotFilter([dx], filter, ["dx"], [], now).map((s) => s.id);
        expect(ids()).toEqual(["d"]);
        expect(ids({ ...defaultSpotFilter, programmes: ["pota"] })).toEqual([]);
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

    test("a callsign list narrows the list, not just the alerts", () => {
        const mixed = [
            merged({ id: "vk", callsign: "VK6MB/P" }),
            merged({ id: "zl", callsign: "ZL1ABC" }),
            merged({ id: "k", callsign: "K1ABC" }),
        ];
        const filter = { ...defaultSpotFilter, watch: ["ZL*", "VK*"] };
        expect(applySpotFilter(mixed, filter, ["pota"], [], now).map((s) => s.id)).toEqual(["vk", "zl"]);
    });

    test("continent comes from the callsign, portable prefix included", () => {
        const mixed = [
            merged({ id: "vk", callsign: "VK6MB" }),
            merged({ id: "zl", callsign: "ZL1ABC" }),
            merged({ id: "k", callsign: "K1ABC" }),
            merged({ id: "g-in-vk", callsign: "VK/G4XYZ" }),
            merged({ id: "vk-in-g", callsign: "G/VK6MB" }),
        ];
        const filter = { ...defaultSpotFilter, continents: ["OC" as const] };
        expect(applySpotFilter(mixed, filter, ["pota"], [], now).map((s) => s.id)).toEqual(["vk", "zl", "g-in-vk"]);
    });
});

describe("settings from before the two filters were one", () => {
    const alert = {
        enabled: true,
        programmes: [],
        bands: ["40m" as const],
        modeGroups: [],
        newOnly: false,
        hideAutomatic: true,
        watch: ["VK*", "ZL*"],
    };

    test("alert rules that were on become the filter, and the switch survives", () => {
        const settings = fixSettings({
            spotFilter: { ...defaultSpotFilter, bands: ["20m"], hideQrt: true, maxAgeMinutes: 30, search: "x" },
            spotAlerts: alert,
        } as never);
        expect(settings.spotFilter).toEqual({
            ...defaultSpotFilter,
            bands: ["40m"],
            watch: ["VK*", "ZL*"],
            hideAutomatic: true,
            hideQrt: true,
            maxAgeMinutes: 30,
        });
        expect(settings.spotAlertsEnabled).toBe(true);
        expect("spotAlerts" in settings).toBe(false);
    });

    test("alert rules that were off leave the page filter as it was", () => {
        const settings = fixSettings({
            spotFilter: { ...defaultSpotFilter, bands: ["20m"] },
            spotAlerts: { ...alert, enabled: false },
        } as never);
        expect(settings.spotFilter.bands).toEqual(["20m"]);
        expect(settings.spotFilter.watch).toEqual([]);
        expect(settings.spotAlertsEnabled).toBe(false);
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

describe("alerts", () => {
    const on = defaultSpotFilter;
    const now = at("2024-01-01T10:05:00Z");

    test("an empty filter announces every spot", () => {
        expect(matchesSpotAlert(merged({ band: "40m", mode: "CW" }), on, [])).toBe(true);
    });

    test("a station that has said QRT is never announced, even with QRT shown on the page", () => {
        expect(matchesSpotAlert(merged({ comments: "QRT thanks all" }), on, [])).toBe(false);
    });

    test("every row is an AND: the band has to match and so does the mode", () => {
        const alert = { ...on, bands: ["40m" as const], modeGroups: ["CW" as const] };
        expect(matchesSpotAlert(merged({ band: "40m", mode: "CW" }), alert, [])).toBe(true);
        expect(matchesSpotAlert(merged({ band: "20m", mode: "CW" }), alert, [])).toBe(false);
        expect(matchesSpotAlert(merged({ band: "40m", mode: "FT8" }), alert, [])).toBe(false);
    });

    test("the watchlist matches the base call, so /P and a prefix still count", () => {
        const alert = { ...on, watch: ["VK6MB"] };
        expect(matchesSpotAlert(merged({ callsign: "VK6MB/P" }), alert, [])).toBe(true);
        expect(matchesSpotAlert(merged({ callsign: "VK6ABC" }), alert, [])).toBe(false);
    });

    test("a watchlist wildcard matches a prefix, on the base call or the full one", () => {
        const alert = { ...on, watch: ["ZL*", "VK*"] };
        expect(matchesSpotAlert(merged({ callsign: "ZL1ABC" }), alert, [])).toBe(true);
        expect(matchesSpotAlert(merged({ callsign: "VK6MB/P" }), alert, [])).toBe(true);
        expect(matchesSpotAlert(merged({ callsign: "VK/G4XYZ" }), alert, [])).toBe(true);
        expect(matchesSpotAlert(merged({ callsign: "G4XYZ" }), alert, [])).toBe(false);
        expect(matchesSpotAlert(merged({ callsign: "AZL1ABC" }), alert, [])).toBe(false);
    });

    test("hiding RBN needs every source behind the row to be automatic", () => {
        const alert = { ...on, hideAutomatic: true };
        const relayed = mergeSpots([spot({ automatic: true, frequency: 7.032 })])[0];
        const heard = mergeSpots([
            spot({ id: "pota-1", automatic: true, frequency: 7.032 }),
            spot({ id: "pnp-1", source: "pnp", programme: "wwff", frequency: 7.032 }),
        ])[0];
        expect(matchesSpotAlert(relayed, alert, [])).toBe(false);
        expect(matchesSpotAlert(heard, alert, [])).toBe(true);
    });

    test("newOnly asks the log, and a worked reference stops the alert", () => {
        const alert = { ...on, newOnly: true };
        const worked = [{ callsign: "VK9XYZ", pota: "US-0001" } as QSO];
        expect(matchesSpotAlert(merged({ reference: "US-0001" }), alert, [])).toBe(true);
        expect(matchesSpotAlert(merged({ reference: "US-0001" }), alert, worked)).toBe(false);
    });

    test("the same activation re-spotted on the same band is announced once, a band change again", () => {
        const first = merged({ reference: "US-0001", band: "40m" });
        const reSpot = merged({ id: "pota-2", reference: "US-0001", band: "40m", date: at("2024-01-01T10:04:00Z") });
        const moved = merged({ id: "pota-3", reference: "US-0001", band: "20m", date: at("2024-01-01T10:04:00Z") });

        const seen = rememberSpots(new Set(), [first]);
        expect(newSpotAlerts([reSpot], on, [], seen, now)).toEqual([]);
        expect(newSpotAlerts([moved], on, [], seen, now)).toHaveLength(1);
    });

    test("a spot older than the window is history, not news", () => {
        const stale = merged({ date: at("2024-01-01T09:00:00Z") });
        expect(newSpotAlerts([stale], on, [], new Set(), now)).toEqual([]);
    });

    test("the seen set holds spots the rules rejected, so widening them later announces nothing old", () => {
        const quiet = merged({ band: "20m" });
        const seen = rememberSpots(new Set(), [quiet]);
        expect(seen.has(alertKey(quiet))).toBe(true);
        expect(newSpotAlerts([quiet], { ...on, bands: [] }, [], seen, now)).toEqual([]);
    });

    test("the notification says who, where on the dial and what the reference is", () => {
        const notification = spotAlertNotification(
            merged({ frequency: 7.032, mode: "CW", reference: "US-0001", referenceName: "Acadia" }),
        );
        expect(notification.title).toBe("VK6MB · 7.032 MHz · CW");
        expect(notification.body).toBe("US-0001 Acadia");
    });
});

describe("bandmap layout", () => {
    test("labels sit on their frequency, top of the band first, and only the band's own spots", () => {
        const { labels, height } = layoutBandMap(
            [
                merged({ id: "low", frequency: 7.01 }),
                merged({ id: "high", frequency: 7.2 }),
                merged({ id: "other", frequency: 14.2 }),
                merged({ id: "none" }),
            ],
            "40m",
            2,
        );
        expect(labels.map((l) => l.spot.id)).toEqual(["high", "low"]);
        expect(labels[0].anchor).toBe(200);
        expect(labels[0].top).toBe(200 - LABEL_HEIGHT / 2);
        expect(height).toBe(600);
    });

    test("crowded labels are pushed down rather than drawn over each other", () => {
        const { labels } = layoutBandMap(
            [merged({ id: "a", frequency: 7.0255 }), merged({ id: "b", frequency: 7.025 })],
            "40m",
            2,
        );
        expect(labels[1].anchor - labels[0].anchor).toBe(1);
        expect(labels[1].top).toBeGreaterThanOrEqual(labels[0].top + LABEL_HEIGHT);
    });

    test("ticks are spaced for the zoom", () => {
        expect(layoutBandMap([], "40m", 2).ticks.map((t) => t.khz)).toEqual([7000, 7050, 7100, 7150, 7200, 7250, 7300]);
        expect(layoutBandMap([], "40m", 16).ticks[1].khz - layoutBandMap([], "40m", 16).ticks[0].khz).toBe(5);
    });
});

describe("telnet cluster", () => {
    const now = at("2026-10-20T01:30:00Z");

    test("a spot line is spotter, kHz, call, comment and a UTC time of day", () => {
        const spot = parseClusterLine("DX de W3LPL-#:   14025.0  k1abc        CW 25 dB 22 WPM CQ sked 0500Z  0123Z FN20", now)!;
        expect(spot.spotter).toBe("W3LPL-#");
        expect(spot.callsign).toBe("K1ABC");
        expect(spot.frequency).toBe(14.025);
        expect(spot.band).toBe("20m");
        expect(spot.mode).toBe("CW");
        expect(spot.comments).toBe("CW 25 dB 22 WPM CQ sked 0500Z");
        expect(spot.date.toISO()).toBe("2026-10-20T01:23:00.000Z");
        expect(spot.automatic).toBe(true);
    });

    test("a time later than now was yesterday, and a bare spot still parses", () => {
        const spot = parseClusterLine("DX de VK2ABC:     7144.0  VK3XYZ                                       2355Z", now)!;
        expect(spot.date.toISO()).toBe("2026-10-19T23:55:00.000Z");
        expect(spot.comments).toBeUndefined();
        expect(spot.automatic).toBe(false);
    });

    test("the same spot from two linked clusters has one id, and chatter isn't a spot", () => {
        const a = parseClusterLine("DX de VK2ABC: 7144.0 VK3XYZ hello 0120Z", now)!;
        const b = parseClusterLine("DX de VK2ABC:  7144.0  VK3XYZ  hello  0120Z  QF56", now)!;
        expect(a.id).toBe(b.id);
        expect(parseClusterLine("To ALL de VK2ABC: anyone on 40m?", now)).toBeUndefined();
        // FT8 spots rarely say so; the frequency does.
        expect(parseClusterLine("DX de N0YO:       7074.9  F4JCU                                       0350Z", now)!.mode).toBe("FT8");
        expect(parseClusterLine("VK2ABC de CLUSTER 20-Oct-2026 0130Z dxspider >", now)).toBeUndefined();
    });

    test("a spot to the cluster carries the reference in front of the comment", () => {
        const request = {
            callsign: "VK2ABC",
            spotter: "VK2ABC",
            programme: "pota" as const,
            reference: "VK-0123",
            frequency: 14.244,
            mode: "SSB",
            comments: "QRV",
        };
        expect(clusterSpotCommand(request)).toBe("DX 14244.0 VK2ABC POTA VK-0123 SSB QRV");
        expect(clusterSpotCommand({ ...request, programme: "qrp", reference: "near Bathurst", comments: "" })).toBe(
            "DX 14244.0 VK2ABC SSB",
        );
    });
});
