import { DateTime } from "luxon";
import { describe, expect, test } from "vitest";
import { confirmQso, qslRecordKey } from "../src/lib/components/qsl";
import { QSO } from "../src/lib/components/qso";
import { QSORecord } from "../src/lib/utils/file-format/common";

let counter = 0;
const qso = (fields: Partial<QSO> = {}): QSO => ({
    id: `q${counter++}`,
    date: DateTime.fromISO("2024-04-27T10:00:00", { zone: "utc" }),
    callsign: "VK4ALE",
    ...fields,
});
const record = (honeypot: Record<string, string>): QSO => qso({ honeypot });
const lotw = { app_lotw_owncall: "VK4ALE" };
const eqsl = { app_eqsl_ag: "Y" };

describe("qslRecordKey", () => {
    const rec = (fields: Partial<QSORecord>) => ({ honeypot: {}, ...fields }) as QSORecord;

    test("is who and when", () =>
        expect(qslRecordKey(rec({ call: "VK4ALE", qso_date: "20240427", time_on: "100000" }))).toBe(
            "VK4ALE|20240427|100000",
        ));

    test("ignores the operating suffix, like the matcher does", () =>
        expect(qslRecordKey(rec({ call: "VK4ALE/P", qso_date: "20240427", time_on: "100000" }))).toBe(
            qslRecordKey(rec({ call: "VK4ALE", qso_date: "20240427", time_on: "100000" })),
        ));

    test("survives a missing callsign", () =>
        expect(qslRecordKey(rec({ qso_date: "20240427", time_on: "100000" }))).toBe("|20240427|100000"));
});

describe("confirmQso", () => {
    test("flags LoTW from the service's own field", () =>
        expect(confirmQso(qso(), record(lotw))).toMatchObject({ lotw_received: true }));

    test("flags eQSL from the service's own field", () =>
        expect(confirmQso(qso(), record(eqsl))).toMatchObject({ eqsl_received: true }));

    test("leaves the other service alone", () =>
        expect(confirmQso(qso(), record(lotw))?.eqsl_received).toBeUndefined());

    // The point of the null: the persist layer diffs QSOs by identity, so a copy of an unchanged
    // QSO is a write. Re-importing the same download has to cost nothing.
    test("says nothing to do when the flag is already set", () =>
        expect(confirmQso(qso({ lotw_received: true }), record(lotw))).toBeNull());

    test("says nothing to do when the record carries no confirmation", () =>
        expect(confirmQso(qso(), record({}))).toBeNull());

    test("never takes a confirmation back", () =>
        expect(confirmQso(qso({ lotw_received: true }), record(eqsl))).toMatchObject({
            lotw_received: true,
            eqsl_received: true,
        }));

    test("folds onto a running copy, so one QSO keeps both services", () => {
        const target = qso();
        const first = confirmQso(target, record(lotw));
        expect(confirmQso(first as QSO, record(eqsl))).toMatchObject({
            id: target.id,
            lotw_received: true,
            eqsl_received: true,
        });
    });

    test("copies rather than editing the stored QSO", () => {
        const target = qso();
        confirmQso(target, record(lotw));
        expect(target.lotw_received).toBeUndefined();
    });
});
