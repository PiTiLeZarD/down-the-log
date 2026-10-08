import { DateTime } from "luxon";
import { describe, expect, test } from "vitest";
import { QSO } from "../src/lib/components/qso";
import { awardSummary, modeGroupOf, unitLogs, unitStatus } from "../src/lib/utils/award-progress";
import { awards, vkCallAreaOf, wasStateOf } from "../src/lib/utils/awards";

let counter = 0;
const qso = (fields: Partial<QSO> = {}): QSO => ({
    id: `q${counter++}`,
    date: DateTime.fromISO("2024-04-27T10:00:00", { zone: "utc" }),
    callsign: "VK4ALE",
    ...fields,
});
const dxccOf = awards.dxcc.unitOf;

describe("modeGroupOf", () => {
    test("splits CW, digital and the rest", () => {
        expect(modeGroupOf("CW")).toBe("CW");
        expect(modeGroupOf("FT8")).toBe("Data");
        expect(modeGroupOf("SSB")).toBe("Phone");
        expect(modeGroupOf(undefined)).toBe("Phone");
    });
});

describe("unitLogs", () => {
    test("counts current DXCC entities only", () => {
        // 150 Australia is current; 229 (German Democratic Republic) is deleted.
        const logs = unitLogs([qso({ dxcc: 150 }), qso({ dxcc: 229 }), qso({})], dxccOf);
        expect([...logs.keys()]).toEqual(["150"]);
    });

    test("merges QSOs into one slot per band and mode group", () => {
        const logs = unitLogs(
            [
                qso({ dxcc: 150, band: "20m", mode: "SSB" }),
                qso({ dxcc: 150, band: "20m", mode: "FM" }),
                qso({ dxcc: 150, band: "20m", mode: "FT8", lotw_received: true }),
            ],
            dxccOf,
        );
        const log = logs.get("150");
        expect(log?.qsos).toBe(3);
        expect(log?.slots).toEqual([
            { band: "20m", mode: "Phone", confirmed: false },
            { band: "20m", mode: "Data", confirmed: true },
        ]);
    });

    test("accepts the entity as a string", () => {
        expect(unitLogs([qso({ dxcc: "150" as unknown as number })], dxccOf).has("150")).toBe(true);
    });
});

describe("unitStatus", () => {
    const logs = unitLogs(
        [
            qso({ dxcc: 150, band: "20m", mode: "SSB" }),
            qso({ dxcc: 150, band: "40m", mode: "CW", eqsl_received: true }),
        ],
        dxccOf,
    );
    const vk = logs.get("150");

    test("confirmed by either LoTW or eQSL", () => {
        expect(unitStatus(vk)).toBe("confirmed");
    });

    test("follows the filter", () => {
        expect(unitStatus(vk, { modes: ["Phone"] })).toBe("worked");
        expect(unitStatus(vk, { bands: ["40m"] })).toBe("confirmed");
        expect(unitStatus(vk, { bands: ["10m"] })).toBe("missing");
        expect(unitStatus(undefined)).toBe("missing");
    });
});

describe("awardSummary", () => {
    test("counts worked and confirmed units against the total", () => {
        const logs = unitLogs(
            [qso({ dxcc: 150, lotw_received: true }), qso({ dxcc: 291 }), qso({ dxcc: 291 })],
            dxccOf,
        );
        expect(awardSummary(logs, 340)).toEqual({ worked: 2, confirmed: 1, total: 340 });
    });
});

describe("awards", () => {
    test("DXCC ends its ticks on Honor Roll", () => {
        expect(awards.dxcc.milestones.at(-1)).toBe(awards.dxcc.units.length - 9);
    });

    test("WAS is the fifty states", () => {
        expect(awards.was.units).toHaveLength(50);
        expect(awards.was.units.map((u) => u.id)).not.toContain("DC");
    });

    test("WAVKCA is VK0 to VK9", () => {
        expect(awards.wavkca.units.map((u) => u.id)).toEqual([
            "VK0",
            "VK1",
            "VK2",
            "VK3",
            "VK4",
            "VK5",
            "VK6",
            "VK7",
            "VK8",
            "VK9",
        ]);
    });
});

describe("wasStateOf", () => {
    test("reads the state off US QSOs", () => {
        expect(wasStateOf(qso({ dxcc: 291, state: "tx" }))).toBe("TX");
        expect(wasStateOf(qso({ country: "USA", state: "CA" }))).toBe("CA");
    });

    test("Alaska and Hawaii count without a state", () => {
        expect(wasStateOf(qso({ dxcc: 6 }))).toBe("AK");
        expect(wasStateOf(qso({ dxcc: 110 }))).toBe("HI");
    });

    test("skips DC, territories, unknown states and other countries", () => {
        expect(wasStateOf(qso({ dxcc: 291, state: "DC" }))).toBeUndefined();
        expect(wasStateOf(qso({ dxcc: 291, state: "PR" }))).toBeUndefined();
        expect(wasStateOf(qso({ dxcc: 291 }))).toBeUndefined();
        expect(wasStateOf(qso({ dxcc: 150, state: "QLD" }))).toBeUndefined();
    });
});

describe("vkCallAreaOf", () => {
    test("reads the digit after an Australian prefix", () => {
        expect(vkCallAreaOf({ callsign: "VK4ALE", dxcc: 150 })).toBe("VK4");
        expect(vkCallAreaOf({ callsign: "vk2abc" })).toBe("VK2");
        expect(vkCallAreaOf({ callsign: "AX3ABC", dxcc: 150 })).toBe("VK3");
        expect(vkCallAreaOf({ callsign: "VI5ANZAC", dxcc: 150 })).toBe("VK5");
        expect(vkCallAreaOf({ callsign: "VK9NA", dxcc: 189 })).toBe("VK9");
        expect(vkCallAreaOf({ callsign: "VK0EK", dxcc: 13 })).toBe("VK0");
    });

    test("a portable digit moves the station", () => {
        expect(vkCallAreaOf({ callsign: "VK4ALE/3", dxcc: 150 })).toBe("VK3");
        expect(vkCallAreaOf({ callsign: "VK4ALE/P", dxcc: 150 })).toBe("VK4");
    });

    test("ignores VK calls signing from abroad and everyone else", () => {
        expect(vkCallAreaOf({ callsign: "DL/VK4ALE", dxcc: 230 })).toBeUndefined();
        expect(vkCallAreaOf({ callsign: "ZL2ABC", dxcc: 170 })).toBeUndefined();
    });
});
