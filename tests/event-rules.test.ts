import { DateTime } from "luxon";
import { describe, expect, test } from "vitest";
import { QSO } from "../src/lib/components/qso";
import {
    EventType,
    allReferencesActivated,
    capitalise,
    eventDataMap,
    eventDataMassageMap,
    eventFileNameMap,
    events,
    getActivations,
    rules,
} from "../src/lib/utils/event-rules";
import { QSORecord } from "../src/lib/utils/file-format/common";

let counter = 0;
const qso = (iso: string, fields: Partial<QSO> = {}): QSO => ({
    id: `q${counter++}`,
    date: DateTime.fromISO(iso, { zone: "utc" }),
    callsign: "VK4ALE",
    ...fields,
});
const qsoCount = (n: number, iso: string, fields: Partial<QSO> = {}): QSO[] =>
    Array.from({ length: n }, (_, i) =>
        qso(DateTime.fromISO(iso, { zone: "utc" }).plus({ minutes: i }).toISO()!, fields),
    );

const record = (fields: Partial<Record<string, string>>): QSORecord =>
    ({ honeypot: {}, ...fields }) as unknown as QSORecord;

test("capitalise upper cases the first letter only", () => {
    expect(capitalise("pota")).toBe("Pota");
    expect(capitalise("")).toBe("");
});

describe("allReferencesActivated", () => {
    test("groups the QSOs by the reference we activated", () => {
        const qsos = [
            qso("2024-01-01T01:00:00Z", { myPota: "VK-0001" }),
            qso("2024-01-01T02:00:00Z", { myPota: "VK-0001" }),
            qso("2024-01-01T03:00:00Z", { myPota: "VK-0002" }),
        ];
        const grouped = allReferencesActivated(qsos, "pota");
        expect(Object.keys(grouped).sort()).toEqual(["VK-0001", "VK-0002"]);
        expect(grouped["VK-0001"]).toHaveLength(2);
    });

    test("ignores QSOs without a my-reference, and the ones we only worked", () => {
        const qsos = [qso("2024-01-01T01:00:00Z", { pota: "VK-0009" }), qso("2024-01-01T02:00:00Z")];
        expect(allReferencesActivated(qsos, "pota")).toEqual({});
    });

    test("reads the right field per event", () => {
        const qsos = [qso("2024-01-01T01:00:00Z", { myWwff: "VKFF-0001", mySota: "VK4/SE-114" })];
        expect(Object.keys(allReferencesActivated(qsos, "wwff"))).toEqual(["VKFF-0001"]);
        expect(Object.keys(allReferencesActivated(qsos, "sota"))).toEqual(["VK4/SE-114"]);
    });
});

describe("rules", () => {
    test("POTA needs 10 QSOs", () => {
        expect(rules.pota(qsoCount(9, "2024-01-01T00:00:00Z"))).toBe("Incomplete");
        expect(rules.pota(qsoCount(10, "2024-01-01T00:00:00Z"))).toBe("Activated");
    });

    test("SOTA needs 4 QSOs", () => {
        expect(rules.sota(qsoCount(3, "2024-01-01T00:00:00Z"))).toBe("WIP");
        expect(rules.sota(qsoCount(4, "2024-01-01T00:00:00Z"))).toBe("Activated");
    });

    test("WWFF needs 44 QSOs by default", () => {
        expect(rules.wwff(qsoCount(43, "2024-01-01T00:00:00Z"))).toBe("WIP");
        expect(rules.wwff(qsoCount(44, "2024-01-01T00:00:00Z"))).toBe("Activated");
    });

    test("WWFF takes a per-program target", () => {
        expect(rules.wwff(qsoCount(10, "2024-01-01T00:00:00Z"), 10)).toBe("Activated");
        expect(rules.wwff(qsoCount(10, "2024-01-01T00:00:00Z"), 25)).toBe("WIP");
    });

    test("IOTA and SIG have no target", () => {
        expect(rules.iota([])).toBe("Activated");
        expect(rules.sig([])).toBe("Activated");
    });
});

describe("getActivations", () => {
    test("counts POTA per UTC day, whatever the gap between QSOs", () => {
        const qsos = [
            qso("2024-01-01T01:00:00Z", { myPota: "VK-0001" }),
            qso("2024-01-01T23:00:00Z", { myPota: "VK-0001" }),
            qso("2024-01-02T01:00:00Z", { myPota: "VK-0001" }),
        ];
        const activations = getActivations("pota", qsos);
        expect(Object.keys(activations["VK-0001"]).sort()).toEqual(["20240101", "20240102"]);
        expect(activations["VK-0001"]["20240101"].qsos).toHaveLength(2);
        expect(activations["VK-0001"]["20240101"].status).toBe("Incomplete");
    });

    test("splits WWFF on a gap of more than five hours, not on the UTC day", () => {
        const qsos = [
            qso("2024-01-01T20:00:00Z", { myWwff: "VKFF-0001" }),
            qso("2024-01-01T23:00:00Z", { myWwff: "VKFF-0001" }),
            qso("2024-01-02T01:00:00Z", { myWwff: "VKFF-0001" }),
        ];
        const activations = getActivations("wwff", qsos, 3);
        expect(Object.keys(activations["VKFF-0001"])).toEqual(["20240101"]);
        expect(activations["VKFF-0001"]["20240101"].qsos).toHaveLength(3);
        expect(activations["VKFF-0001"]["20240101"].status).toBe("Activated");
    });

    test("starts a new WWFF activation after a long break", () => {
        const qsos = [
            qso("2024-01-01T01:00:00Z", { myWwff: "VKFF-0001" }),
            qso("2024-01-03T01:00:00Z", { myWwff: "VKFF-0001" }),
        ];
        expect(Object.keys(getActivations("wwff", qsos)["VKFF-0001"]).sort()).toEqual(["20240101", "20240103"]);
    });

    test("keeps IOTA as one running total", () => {
        const qsos = [
            qso("2024-01-01T01:00:00Z", { myIota: "OC-001" }),
            qso("2024-06-01T01:00:00Z", { myIota: "OC-001" }),
        ];
        expect(Object.keys(getActivations("iota", qsos)["OC-001"])).toEqual(["all"]);
    });

    test("keeps references apart", () => {
        const qsos = [
            qso("2024-01-01T01:00:00Z", { myPota: "VK-0001" }),
            qso("2024-01-01T02:00:00Z", { myPota: "VK-0002" }),
        ];
        expect(Object.keys(getActivations("pota", qsos)).sort()).toEqual(["VK-0001", "VK-0002"]);
    });

    test("is empty when nothing was activated", () => {
        expect(getActivations("pota", [qso("2024-01-01T01:00:00Z")])).toEqual({});
    });

    test("does not reorder the caller's log", () => {
        const qsos = [
            qso("2024-01-02T01:00:00Z", { myWwff: "VKFF-0001" }),
            qso("2024-01-01T01:00:00Z", { myWwff: "VKFF-0001" }),
        ];
        const order = qsos.map((q) => q.id);
        getActivations("wwff", qsos);
        expect(qsos.map((q) => q.id)).toEqual(order);
    });
});

describe("eventFileNameMap", () => {
    test("names the file after the station, reference and day", () => {
        const wwff = [qso("2024-01-01T01:00:00Z", { myCallsign: "VK4ALE", myWwff: "VKFF-0001" })];
        expect(eventFileNameMap.wwff(wwff)).toBe("VK4ALE @ VKFF-0001 20240101.adif");
        const pota = [qso("2024-01-01T01:00:00Z", { myCallsign: "VK4ALE", myPota: "VK-0001" })];
        expect(eventFileNameMap.pota(pota)).toBe("VK4ALE@VK-0001-20240101.adi");
    });
});

describe("eventDataMassageMap", () => {
    test("POTA export mirrors the references into SIG / SIG_INFO", () => {
        const massaged = eventDataMassageMap.pota(record({ my_pota_ref: "VK-0001", pota_ref: "VK-0002" }));
        expect(massaged).toMatchObject({
            my_sig: "POTA",
            my_sig_info: "VK-0001",
            sig: "POTA",
            sig_info: "VK-0002",
        });
    });

    test("WWFF export mirrors the references into SIG / SIG_INFO", () => {
        const massaged = eventDataMassageMap.wwff(record({ my_wwff_ref: "VKFF-0001" }));
        expect(massaged).toMatchObject({ my_sig: "WWFF", my_sig_info: "VKFF-0001" });
        expect(massaged.sig).toBeUndefined();
    });

    test("leaves a record without references alone", () => {
        expect(eventDataMassageMap.pota(record({ call: "VK4ALE" })).sig).toBeUndefined();
        expect(eventDataMassageMap.sota(record({ call: "VK4ALE" })).call).toBe("VK4ALE");
    });
});

test("every event type has a rule, a grouping, a filename and a data map", () => {
    events.forEach((event: EventType) => {
        expect(typeof rules[event], event).toBe("function");
        expect(typeof eventFileNameMap[event], event).toBe("function");
        expect(typeof eventDataMassageMap[event], event).toBe("function");
        expect(eventDataMap[event], event).toBeTruthy();
    });
});
