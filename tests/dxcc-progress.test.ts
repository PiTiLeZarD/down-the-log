import { DateTime } from "luxon";
import { describe, expect, test } from "vitest";
import { QSO } from "../src/lib/components/qso";
import {
    dxccSummary,
    entityLogs,
    entityStatus,
    milestones,
    modeGroupOf,
    totalEntities,
} from "../src/lib/utils/dxcc-progress";

let counter = 0;
const qso = (fields: Partial<QSO> = {}): QSO => ({
    id: `q${counter++}`,
    date: DateTime.fromISO("2024-04-27T10:00:00", { zone: "utc" }),
    callsign: "VK4ALE",
    ...fields,
});

describe("modeGroupOf", () => {
    test("splits CW, digital and the rest", () => {
        expect(modeGroupOf("CW")).toBe("CW");
        expect(modeGroupOf("FT8")).toBe("Data");
        expect(modeGroupOf("SSB")).toBe("Phone");
        expect(modeGroupOf(undefined)).toBe("Phone");
    });
});

describe("entityLogs", () => {
    test("counts current entities only", () => {
        // 150 Australia is current; 229 (German Democratic Republic) is deleted.
        const logs = entityLogs([qso({ dxcc: 150 }), qso({ dxcc: 229 }), qso({})]);
        expect([...logs.keys()]).toEqual([150]);
    });

    test("merges QSOs into one slot per band and mode group", () => {
        const logs = entityLogs([
            qso({ dxcc: 150, band: "20m", mode: "SSB" }),
            qso({ dxcc: 150, band: "20m", mode: "FM" }),
            qso({ dxcc: 150, band: "20m", mode: "FT8", lotw_received: true }),
        ]);
        const log = logs.get(150);
        expect(log?.qsos).toBe(3);
        expect(log?.slots).toEqual([
            { band: "20m", mode: "Phone", confirmed: false },
            { band: "20m", mode: "Data", confirmed: true },
        ]);
    });

    test("accepts the entity as a string", () => {
        expect(entityLogs([qso({ dxcc: "150" as unknown as number })]).has(150)).toBe(true);
    });
});

describe("entityStatus", () => {
    const logs = entityLogs([
        qso({ dxcc: 150, band: "20m", mode: "SSB" }),
        qso({ dxcc: 150, band: "40m", mode: "CW", eqsl_received: true }),
    ]);
    const vk = logs.get(150);

    test("confirmed by either LoTW or eQSL", () => {
        expect(entityStatus(vk)).toBe("confirmed");
    });

    test("follows the filter", () => {
        expect(entityStatus(vk, { modes: ["Phone"] })).toBe("worked");
        expect(entityStatus(vk, { bands: ["40m"] })).toBe("confirmed");
        expect(entityStatus(vk, { bands: ["10m"] })).toBe("missing");
        expect(entityStatus(undefined)).toBe("missing");
    });
});

describe("dxccSummary", () => {
    test("counts worked and confirmed entities against the current total", () => {
        const logs = entityLogs([qso({ dxcc: 150, lotw_received: true }), qso({ dxcc: 291 }), qso({ dxcc: 291 })]);
        expect(dxccSummary(logs)).toEqual({ worked: 2, confirmed: 1, total: totalEntities });
    });
});

describe("milestones", () => {
    test("end on Honor Roll", () => {
        expect(milestones(340).at(-1)).toBe(331);
    });
});
