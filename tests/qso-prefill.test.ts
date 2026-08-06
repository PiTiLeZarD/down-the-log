import { DateTime } from "luxon";
import { describe, expect, test } from "vitest";
import {
    QSO,
    allEvents,
    carryOver,
    createQso,
    duration,
    extrapolate,
    findMatchingQso,
    findMatchingQsos,
    hasEvent,
    prefillLocation,
    prefillMyStation,
    prefillOperating,
    prefillSameCallsign,
    qsosByCallsign,
} from "../app/lib/components/qso";

const at = (iso: string) => DateTime.fromISO(iso, { zone: "utc" });
const qso = (fields: Partial<QSO> = {}): QSO => ({
    id: "q",
    date: at("2024-01-01T10:00:00Z"),
    callsign: "VK4ALE",
    ...fields,
});

describe("createQso", () => {
    test("stamps an id, the current time and an empty honeypot", () => {
        const q = createQso("VK4ALE");
        expect(q.callsign).toBe("VK4ALE");
        expect(q.id).toBeTruthy();
        expect(q.honeypot).toEqual({});
        expect(q.date.isValid).toBe(true);
    });

    test("gives each QSO its own id", () => {
        expect(createQso("A").id).not.toBe(createQso("A").id);
    });
});

describe("allEvents / hasEvent", () => {
    test("lists every reference on the QSO, mine and theirs", () => {
        expect(allEvents(qso({ myPota: "VK-0001", wwff: "VKFF-0002" }))).toEqual(["VK-0001", "VKFF-0002"]);
    });

    test("is empty for a plain QSO", () => {
        expect(allEvents(qso())).toEqual([]);
        expect(hasEvent(qso())).toBe(false);
        expect(hasEvent(qso({ mySota: "VK4/SE-114" }))).toBe(true);
    });
});

describe("duration", () => {
    test("is empty without an end time", () => {
        expect(duration(qso())).toBe("");
    });

    test("reads the QSO's own end time", () => {
        expect(duration(qso({ dateOff: at("2024-01-01T10:12:00Z") }))).toBe("12 min");
    });

    test("falls back to the end time it is handed", () => {
        expect(duration(qso(), at("2024-01-01T10:00:30Z"))).toBe("30 s");
    });
});

describe("carryOver", () => {
    test("copies only the fields asked for", () => {
        const previous = qso({ band: "40m", mode: "CW", myRig: "FT-891" });
        const next = carryOver(createQso("G4ABC"), previous, ["band", "mode"]);
        expect(next).toMatchObject({ band: "40m", mode: "CW" });
        expect(next.myRig).toBeUndefined();
    });

    test("overwrites what the new QSO already has", () => {
        const next = carryOver(qso({ band: "20m" }), qso({ band: "40m" }), ["band"]);
        expect(next.band).toBe("40m");
    });

    test("leaves a field the previous QSO doesn't have alone", () => {
        const next = carryOver(qso({ band: "20m" }), qso({}), ["band"]);
        expect(next.band).toBe("20m");
    });

    test("carries nothing when no fields are configured", () => {
        expect(carryOver(createQso("A"), qso({ band: "40m" }), []).band).toBeUndefined();
    });
});

test("carryOver keeps values in their own type", () => {
    expect(carryOver(createQso("A"), qso({ power: 5, frequency: 14.2 }), ["power", "frequency"])).toMatchObject({
        power: 5,
        frequency: 14.2,
    });
    expect(carryOver(createQso("A"), qso({ lotw_sent: false }), ["lotw_sent"]).lotw_sent).toBe(false);
});

describe("prefillSameCallsign", () => {
    test("copies what we already knew about that operator", () => {
        const previous = qso({ name: "Jono", qth: "Brisbane", country: "AUS", state: "QLD", locator: "QG62nl" });
        expect(prefillSameCallsign(createQso("VK4ALE"), previous)).toMatchObject({
            name: "Jono",
            qth: "Brisbane",
            country: "AUS",
            state: "QLD",
            locator: "QG62nl",
        });
    });

    test("copies the numeric zones untouched", () => {
        const filled = prefillSameCallsign(createQso("VK4ALE"), qso({ dxcc: 150, cqzone: 30, ituzone: 55 }));
        expect(filled).toMatchObject({ dxcc: 150, cqzone: 30, ituzone: 55 });
    });

    test("does not copy the operating fields", () => {
        const filled = prefillSameCallsign(createQso("VK4ALE"), qso({ band: "40m", mode: "CW", rst_sent: "599" }));
        expect(filled.band).toBeUndefined();
        expect(filled.mode).toBeUndefined();
        expect(filled.rst_sent).toBeUndefined();
    });

    test("keeps what the operator already typed when the previous QSO has nothing", () => {
        expect(prefillSameCallsign(qso({ name: "Jono" }), qso({})).name).toBe("Jono");
    });
});

describe("prefillMyStation", () => {
    test("fills the empty station fields", () => {
        const filled = prefillMyStation(createQso("A"), {
            myCallsign: "VK4ALE",
            myLocator: "QG62nl",
            myRig: "FT-891",
        });
        expect(filled).toMatchObject({ myCallsign: "VK4ALE", myLocator: "QG62nl", myRig: "FT-891" });
    });

    test("never overwrites what the QSO already carries", () => {
        const filled = prefillMyStation(qso({ myCallsign: "VK4ALE/P" }), { myCallsign: "VK4ALE" });
        expect(filled.myCallsign).toBe("VK4ALE/P");
    });

    test("leaves the rest of the QSO alone", () => {
        expect(prefillMyStation(qso({ band: "40m" }), {}).band).toBe("40m");
    });
});

describe("prefillOperating", () => {
    test("fills band, frequency and mode from what we are running", () => {
        expect(prefillOperating(createQso("A"), { mode: "SSB", band: "40m" })).toMatchObject({
            mode: "SSB",
            band: "40m",
            frequency: 7.15,
        });
    });

    test("derives the band from the frequency", () => {
        expect(prefillOperating(createQso("A"), { frequency: 14.074 }).band).toBe("20m");
    });

    test("falls back to 20m when it has nothing to go on", () => {
        expect(prefillOperating(createQso("A"), {}).band).toBe("20m");
    });

    test("defaults the reports to 59 on phone", () => {
        expect(prefillOperating(createQso("A"), { mode: "SSB" })).toMatchObject({ rst_sent: "59", rst_received: "59" });
    });

    test("defaults the reports to -1 on the digital modes", () => {
        expect(prefillOperating(createQso("A"), { mode: "FT8" })).toMatchObject({ rst_sent: "-1", rst_received: "-1" });
    });

    test("keeps reports the operator already entered", () => {
        const filled = prefillOperating(qso({ rst_sent: "599", rst_received: "339" }), { mode: "FT8" });
        expect(filled).toMatchObject({ rst_sent: "599", rst_received: "339" });
    });

    test("keeps the band and mode the QSO already carries", () => {
        const filled = prefillOperating(qso({ band: "40m", mode: "CW", frequency: 7.03 }), {
            band: "20m",
            mode: "SSB",
        });
        expect(filled).toMatchObject({ band: "40m", mode: "CW", frequency: 7.03 });
    });
});

describe("prefillLocation", () => {
    test("fills country, continent, state and prefix from the callsign", () => {
        expect(prefillLocation(createQso("VK4ALE"))).toMatchObject({
            country: "AUS",
            continent: "OC",
            state: "QLD",
            prefix: "VK4",
            dxcc: 150,
        });
    });

    test("uses the country's reference grid when the QSO has no locator", () => {
        expect(prefillLocation(createQso("VK4ALE")).locator).toBe("PF26gj");
    });

    test("keeps a locator the operator entered", () => {
        expect(prefillLocation(qso({ locator: "QG62nl" })).locator).toBe("QG62nl");
    });

    test("works out the distance once both grids are known", () => {
        const filled = prefillLocation(qso({ locator: "QG62nl", myLocator: "IO91wm" }));
        expect(filled.distance).toBeCloseTo(16535, 0);
    });

    test("leaves the distance out when we don't know where we are", () => {
        expect(prefillLocation(qso({ locator: "QG62nl" })).distance).toBeUndefined();
    });

    test("fills the CQ and ITU zones from the locator", () => {
        const filled = prefillLocation(qso({ locator: "QG62nl" }));
        expect(filled.cqzone).toBe(30);
        expect(filled.ituzone).toBe(55);
    });

    test("never overwrites what the operator entered", () => {
        const filled = prefillLocation(
            qso({ locator: "QG62nl", country: "XXX", state: "NSW", dxcc: 1, cqzone: 1, ituzone: 1, distance: 42 }),
        );
        expect(filled).toMatchObject({ country: "XXX", state: "NSW", dxcc: 1, cqzone: 1, ituzone: 1, distance: 42 });
    });

    test("survives a callsign it cannot resolve", () => {
        const filled = prefillLocation(createQso("12345"));
        expect(filled.country).toBeUndefined();
        expect(filled.prefix).toBeUndefined();
    });
});

describe("extrapolate", () => {
    test("carries the configured fields over from the latest QSO", () => {
        const previous = qso({ band: "40m", mode: "CW", myPota: "VK-0001" });
        expect(extrapolate(createQso("G4ABC"), [previous], ["band", "mode", "myPota"])).toMatchObject({
            band: "40m",
            mode: "CW",
            myPota: "VK-0001",
        });
    });

    test("pulls what we knew about this operator from the last time we worked them", () => {
        const previous = qso({ callsign: "VK4ALE/P", name: "Jono", qth: "Brisbane" });
        const filled = extrapolate(
            createQso("VK4ALE"),
            [qso({ callsign: "G4ABC", name: "Someone else" }), previous],
            [],
        );
        expect(filled).toMatchObject({ name: "Jono", qth: "Brisbane" });
    });

    test("still fills the location on an empty log", () => {
        expect(extrapolate(createQso("VK4ALE"), [], [])).toMatchObject({ country: "AUS", continent: "OC" });
    });
});

describe("qsosByCallsign", () => {
    test("buckets the log by base callsign", () => {
        const qsos = [
            qso({ id: "a", callsign: "VK4ALE" }),
            qso({ id: "b", callsign: "VK4ALE/P" }),
            qso({ id: "c", callsign: "G4ABC" }),
        ];
        const index = qsosByCallsign(qsos);
        expect(index.get("VK4ALE")?.map((q) => q.id)).toEqual(["a", "b"]);
        expect(index.get("G4ABC")?.map((q) => q.id)).toEqual(["c"]);
    });

    test("keeps the unparseable callsigns together", () => {
        const qsos = [qso({ id: "a", callsign: "12345" }), qso({ id: "b", callsign: "67890" })];
        expect(
            qsosByCallsign(qsos)
                .get(undefined)
                ?.map((q) => q.id),
        ).toEqual(["a", "b"]);
    });

    test("is cached per log, so the same array gives back the same index", () => {
        const qsos = [qso()];
        expect(qsosByCallsign(qsos)).toBe(qsosByCallsign(qsos));
        expect(qsosByCallsign([...qsos])).not.toBe(qsosByCallsign(qsos));
    });
});

describe("findMatchingQsos", () => {
    const log = [
        qso({ id: "a", callsign: "VK4ALE", date: at("2024-01-01T10:00:00Z") }),
        qso({ id: "b", callsign: "VK4ALE/P", date: at("2024-01-01T10:10:00Z") }),
        qso({ id: "c", callsign: "VK4ALE", date: at("2024-01-01T12:00:00Z") }),
        qso({ id: "d", callsign: "G4ABC", date: at("2024-01-01T10:05:00Z") }),
    ];

    test("matches the same operator inside the time window", () => {
        const found = findMatchingQsos(log, qso({ callsign: "VK4ALE", date: at("2024-01-01T10:05:00Z") }));
        expect(found.map((q) => q.id).sort()).toEqual(["a", "b"]);
    });

    test("takes the window as a parameter", () => {
        const data = qso({ callsign: "VK4ALE", date: at("2024-01-01T10:00:00Z") });
        expect(findMatchingQsos(log, data, 5).map((q) => q.id)).toEqual(["a"]);
        expect(
            findMatchingQsos(log, data, 130)
                .map((q) => q.id)
                .sort(),
        ).toEqual(["a", "b", "c"]);
    });

    test("finds nothing for an operator we haven't worked", () => {
        expect(findMatchingQsos(log, qso({ callsign: "W1AW" }))).toEqual([]);
    });

    test("findMatchingQso returns the closest in time, or null", () => {
        const data = qso({ callsign: "VK4ALE", date: at("2024-01-01T10:09:00Z") });
        expect(findMatchingQso(log, data)?.id).toBe("b");
        expect(findMatchingQso(log, qso({ callsign: "W1AW" }))).toBeNull();
    });
});
