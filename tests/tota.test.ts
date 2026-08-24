import { DateTime } from "luxon";
import { describe, expect, test } from "vitest";
import { QSO } from "../src/lib/components/qso";
import { QSORecord, qso2record, record2qso } from "../src/lib/utils/file-format/common";
import {
    activationKey,
    getTotaActivations,
    markUploaded,
    uploadedAt,
    isQrpActivation,
    isQsoUploadable,
    isUploadable,
    qsosMissingTile,
    totaCutoff,
    tileOf,
    totaFileName,
    totaMassage,
} from "../src/lib/utils/tota";

let counter = 0;
const qso = (iso: string, fields: Partial<QSO> = {}): QSO => ({
    id: `q${counter++}`,
    date: DateTime.fromISO(iso, { zone: "utc" }),
    callsign: "VK4ALE",
    myCallsign: "F4XYZ",
    myLocator: "IN78rj",
    ...fields,
});

const record = (fields: Partial<Record<string, string>>): QSORecord =>
    ({ honeypot: {}, ...fields }) as unknown as QSORecord;

describe("tileOf", () => {
    test("is the 6-character square of our own locator, in conventional case", () => {
        expect(tileOf(qso("2026-01-01T01:00:00Z", { myLocator: "in78RJ" }))).toBe("IN78rj");
    });

    test("trims a longer locator down to the tile", () => {
        expect(tileOf(qso("2026-01-01T01:00:00Z", { myLocator: "IN78rj37" }))).toBe("IN78rj");
    });

    test("has no answer for a locator too coarse to name a tile", () => {
        expect(tileOf(qso("2026-01-01T01:00:00Z", { myLocator: "IN78" }))).toBeUndefined();
        expect(tileOf(qso("2026-01-01T01:00:00Z", { myLocator: undefined }))).toBeUndefined();
    });
});

describe("getTotaActivations", () => {
    test("groups by tile and UTC day, newest first", () => {
        const activations = getTotaActivations([
            qso("2026-01-01T09:00:00Z"),
            qso("2026-01-01T09:30:00Z"),
            qso("2026-01-02T09:00:00Z"),
            qso("2026-01-02T10:00:00Z", { myLocator: "IN78ri" }),
        ]);

        expect(activations.map((a) => [a.tile, a.date, a.qsos.length])).toEqual([
            ["IN78ri", "20260102", 1],
            ["IN78rj", "20260102", 1],
            ["IN78rj", "20260101", 2],
        ]);
    });

    test("splits an outing that runs over UTC midnight, the way their uploader does", () => {
        const activations = getTotaActivations([qso("2026-01-01T23:50:00Z"), qso("2026-01-02T00:10:00Z")]);

        expect(activations.map((a) => a.date)).toEqual(["20260102", "20260101"]);
    });

    test("orders the QSOs of an activation by time", () => {
        const [activation] = getTotaActivations([qso("2026-01-01T10:00:00Z"), qso("2026-01-01T09:00:00Z")]);

        expect(activation.qsos.map((q) => q.date.toFormat("HH:mm"))).toEqual(["09:00", "10:00"]);
    });

    test("leaves out the QSOs with no tile, and qsosMissingTile finds them", () => {
        const qsos = [qso("2026-01-01T09:00:00Z"), qso("2026-01-01T09:30:00Z", { myLocator: "IN78" })];

        expect(getTotaActivations(qsos).map((a) => a.qsos.length)).toEqual([1]);
        expect(qsosMissingTile(qsos)).toHaveLength(1);
    });
});

describe("isQrpActivation", () => {
    const activation = (qsos: QSO[]) => ({ tile: "IN78rj", date: "20260101", qsos });

    test("needs 10W or less and an HF contact", () => {
        expect(isQrpActivation(activation([qso("2026-01-01T09:00:00Z", { power: 5, band: "40m" })]))).toBe(true);
    });

    test("is not claimed for a 5W handheld on VHF", () => {
        expect(isQrpActivation(activation([qso("2026-01-01T09:00:00Z", { power: 5, band: "2m" })]))).toBe(false);
    });

    test("is not claimed when one QSO of the activation ran more power", () => {
        expect(
            isQrpActivation(
                activation([
                    qso("2026-01-01T09:00:00Z", { power: 5, band: "40m" }),
                    qso("2026-01-01T09:30:00Z", { power: 100, band: "20m" }),
                ]),
            ),
        ).toBe(false);
    });

    test("is not claimed when we don't know the power", () => {
        expect(isQrpActivation(activation([qso("2026-01-01T09:00:00Z", { band: "40m" })]))).toBe(false);
    });
});

describe("the upload mark", () => {
    const activation = (qsos: QSO[]) => ({ tile: "IN78rj", date: "20260101", qsos });
    const at = DateTime.fromISO("2026-01-03T12:00:00Z", { zone: "utc" });

    test("goes on every QSO of the activation, and comes back off", () => {
        const marked = markUploaded(activation([qso("2026-01-01T09:00:00Z"), qso("2026-01-01T09:30:00Z")]), true, at);

        expect(marked.map((q) => q.totaUploaded)).toEqual([at.toISO(), at.toISO()]);
        expect(uploadedAt(activation(marked))).toBe(at.toISO());
        expect(markUploaded(activation(marked), false).map((q) => q.totaUploaded)).toEqual([undefined, undefined]);
    });

    test("is not claimed for an activation a later QSO joined after the upload", () => {
        const marked = markUploaded(activation([qso("2026-01-01T09:00:00Z")]), true, at);

        expect(uploadedAt(activation([...marked, qso("2026-01-01T10:00:00Z")]))).toBeUndefined();
    });

    test("reports when the outing first went up, not the latest re-upload", () => {
        const first = markUploaded(activation([qso("2026-01-01T09:00:00Z")]), true, at);
        const later = markUploaded(activation([qso("2026-01-01T09:30:00Z")]), true, at.plus({ days: 1 }));

        expect(uploadedAt(activation([...first, ...later]))).toBe(at.toISO());
    });

    test("survives a trip through an ADIF, which is why it lives on the QSO", () => {
        const marked = markUploaded(activation([qso("2026-01-01T09:00:00Z")]), true, at);
        const record = qso2record(marked[0]);

        expect(record["app_down-the-log_tota_uploaded"]).toBe(at.toISO());
        expect(record2qso(record).totaUploaded).toBe(at.toISO());
    });
});

test("activationKey names the outing rather than its QSOs", () => {
    expect(activationKey({ tile: "IN78rj", date: "20260101", qsos: [] })).toBe("IN78rj/20260101");
});

test("totaFileName names the file after the station, the tile and the day", () => {
    expect(totaFileName({ tile: "IN78rj", date: "20260101", qsos: [qso("2026-01-01T09:00:00Z")] })).toBe(
        "F4XYZ@IN78rj_20260101.adif",
    );
});

test("totaMassage sends the tile as MY_GRIDSQUARE and leaves the sig fields alone", () => {
    expect(totaMassage(record({ my_gridsquare: "IN78rj37", my_sig: "POTA", my_sig_info: "FF-0001" }))).toEqual(
        record({ my_gridsquare: "IN78rj", my_sig: "POTA", my_sig_info: "FF-0001" }),
    );
});

describe("totaCutoff", () => {
    test("is 30 days before the registration day", () => {
        expect(totaCutoff("20260201")).toBe("20260102");
    });

    test("crosses a leap day like any other", () => {
        expect(totaCutoff("20240315")).toBe("20240214");
    });
});

describe("isUploadable", () => {
    const activation = (date: string) => getTotaActivations([qso(date)])[0];

    test("takes an activation inside the backdating window", () => {
        expect(isUploadable(activation("2026-01-02T09:00:00Z"), "20260201")).toBe(true);
    });

    test("takes the cutoff day itself", () => {
        expect(isUploadable(activation("2026-01-02T00:00:00Z"), "20260201")).toBe(true);
    });

    test("refuses the day before the cutoff", () => {
        expect(isUploadable(activation("2026-01-01T23:59:00Z"), "20260201")).toBe(false);
    });

    test("takes an activation after the registration day", () => {
        expect(isUploadable(activation("2026-03-01T09:00:00Z"), "20260201")).toBe(true);
    });
});

describe("isQsoUploadable", () => {
    test("asks the same question of a QSO with no tile", () => {
        expect(isQsoUploadable(qso("2026-01-02T09:00:00Z", { myLocator: "IN78" }), "20260201")).toBe(true);
        expect(isQsoUploadable(qso("2026-01-01T09:00:00Z", { myLocator: "IN78" }), "20260201")).toBe(false);
    });
});
