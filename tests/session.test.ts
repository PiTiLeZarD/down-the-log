import { DateTime } from "luxon";
import { describe, expect, test } from "vitest";
import { QSO } from "../src/lib/components/qso";
import { targets } from "../src/lib/utils/event-rules";
import {
    Session,
    activationProgress,
    newSession,
    resumedSession,
    sessionChipLabel,
    sessionDupeKey,
    sessionDupeKeys,
    sessionLabel,
    sessionLabels,
    sessionName,
    sessionQsos,
    templateRefField,
    templates,
} from "../src/lib/utils/session";

const at = (iso: string) => DateTime.fromISO(iso, { zone: "utc" });
const qso = (fields: Partial<QSO> = {}): QSO => ({
    id: "q",
    date: at("2024-01-01T10:00:00Z"),
    callsign: "VK4ALE",
    ...fields,
});

describe("newSession", () => {
    test("seeds its field list and behaviour from the template", () => {
        const session = newSession("pota", { myPota: "VK-0001" });
        expect(session.template).toBe("pota");
        expect(session.fields).toEqual(templates.pota.fields);
        expect(session.defaults).toEqual({ myPota: "VK-0001" });
        expect(session.quickLog).toBe(false);
        expect(session.contest).toBeUndefined();
    });

    test("copies the field list rather than sharing the template's", () => {
        const session = newSession("pota");
        session.fields.push("note");
        expect(templates.pota.fields).not.toContain("note");
    });

    test("a contest starts on serial 1, quick-logging, with plain reports", () => {
        const session = newSession("contest");
        expect(session.contest).toEqual({ serial: 1 });
        expect(session.quickLog).toBe(true);
        expect(session.plainRst).toBe(true);
    });

    test("gives each session its own id", () => {
        expect(newSession("casual").id).not.toBe(newSession("casual").id);
    });
});

describe("resumedSession", () => {
    const ended: Session = {
        ...newSession("contest", { power: 100 }),
        name: "CQ WW",
        endedAt: at("2024-01-01T18:00:00Z"),
        contest: { contestId: "CQ-WW-SSB", serial: 142 },
    };

    test("keeps the settings but starts a new activation", () => {
        const resumed = resumedSession(ended);
        expect(resumed.id).not.toBe(ended.id);
        expect(resumed.endedAt).toBeUndefined();
        expect(resumed.name).toBe("CQ WW");
        expect(resumed.defaults).toEqual({ power: 100 });
    });

    test("rewinds the serial rather than carrying the old count on", () => {
        expect(resumedSession(ended).contest).toEqual({ contestId: "CQ-WW-SSB", serial: 1 });
    });
});

describe("sessionName", () => {
    test("uses what the operator typed", () => {
        expect(sessionName({ ...newSession("pota", { myPota: "VK-0001" }), name: "Mt Buffalo" })).toBe("Mt Buffalo");
    });

    test("falls back to the reference being activated", () => {
        expect(sessionName(newSession("pota", { myPota: "VK-0001" }))).toBe("VK-0001");
        expect(sessionName(newSession("sota", { mySota: "VK4/SE-114" }))).toBe("VK4/SE-114");
    });

    test("falls back to the contest, then to the template", () => {
        const contest = newSession("contest");
        expect(sessionName({ ...contest, contest: { contestId: "CQ-WW-SSB", serial: 1 } })).toBe("CQ-WW-SSB");
        expect(sessionName(contest)).toBe("Contest");
        expect(sessionName(newSession("casual"))).toBe("Casual");
    });
});

describe("templateRefField", () => {
    test("points at the operator's own side of the reference", () => {
        expect(templateRefField("pota")).toBe("myPota");
        expect(templateRefField("wwff")).toBe("myWwff");
        expect(templateRefField("contest")).toBeUndefined();
    });
});

describe("sessionLabel / sessionLabels", () => {
    const session = { ...newSession("pota", { myPota: "VK-0001" }), startedAt: at("2024-03-09T02:00:00Z") };

    test("names the session and when it ran, so two outings to one park are distinguishable", () => {
        expect(sessionLabel(session)).toBe("VK-0001 09/03/24");
    });

    test("indexes by id", () => {
        expect(sessionLabels([session])[session.id]).toBe("VK-0001 09/03/24");
    });

    test("returns the same index for the same array", () => {
        const sessions = [session];
        expect(sessionLabels(sessions)).toBe(sessionLabels(sessions));
    });
});

describe("sessionQsos", () => {
    const session = newSession("pota");
    const qsos = [qso({ id: "1", sessionId: session.id }), qso({ id: "2" }), qso({ id: "3", sessionId: "other" })];

    test("keeps only what the session logged", () => {
        expect(sessionQsos(qsos, session).map((q) => q.id)).toEqual(["1"]);
    });

    test("is empty without a session", () => {
        expect(sessionQsos(qsos)).toEqual([]);
    });
});

describe("activationProgress", () => {
    const session = newSession("pota", { myPota: "VK-0001" });
    const logged = (n: number) =>
        Array.from({ length: n }, (_, i) => qso({ id: String(i), sessionId: session.id }));

    test("counts towards the program's target", () => {
        expect(activationProgress(session, logged(3))).toEqual({
            count: 3,
            target: targets.pota,
            status: "Incomplete",
        });
    });

    test("flips to activated once the target is met", () => {
        expect(activationProgress(session, logged(10)).status).toBe("Activated");
    });

    test("a contest just counts — there's nothing to activate", () => {
        const contest = newSession("contest");
        expect(activationProgress(contest, [qso({ sessionId: contest.id })])).toEqual({ count: 1 });
    });
});

describe("sessionDupeKey", () => {
    test("is the same station on the same band and mode", () => {
        expect(sessionDupeKey({ callsign: "VK4ALE", band: "20m", mode: "SSB" })).toBe(
            sessionDupeKey({ callsign: "VK4ALE/P", band: "20m", mode: "SSB" }),
        );
    });

    test("another band or another mode is another QSO", () => {
        const base = sessionDupeKey({ callsign: "VK4ALE", band: "20m", mode: "SSB" });
        expect(sessionDupeKey({ callsign: "VK4ALE", band: "40m", mode: "SSB" })).not.toBe(base);
        expect(sessionDupeKey({ callsign: "VK4ALE", band: "20m", mode: "CW" })).not.toBe(base);
    });

    test("an unparseable callsign still keys on itself rather than collapsing to empty", () => {
        expect(sessionDupeKey({ callsign: "???", band: "20m", mode: "SSB" })).toContain("???");
    });

    test("indexes a log", () => {
        const keys = sessionDupeKeys([qso({ band: "20m", mode: "SSB" })]);
        expect(keys.has(sessionDupeKey({ callsign: "VK4ALE", band: "20m", mode: "SSB" }))).toBe(true);
        expect(keys.has(sessionDupeKey({ callsign: "VK4ALE", band: "40m", mode: "SSB" }))).toBe(false);
    });
});

describe("sessionChipLabel", () => {
    test("carries the unit where the number alone wouldn't say", () => {
        expect(sessionChipLabel("power", 5)).toBe("5W");
        // The band rides along on the frequency chip: it has no chip of its own to sit on now that
        // it isn't a field a session holds.
        expect(sessionChipLabel("frequency", 14.244)).toBe("20m 14.244MHz");
        expect(sessionChipLabel("frequency", 13.5)).toBe("? 13.5MHz");
    });

    test("shows the value where it speaks for itself", () => {
        expect(sessionChipLabel("myPota", "VK-0001")).toBe("VK-0001");
    });

    test("names the field when it has no value, so the chip is still worth pressing", () => {
        expect(sessionChipLabel("myRig", undefined)).toBe("My Rig");
        expect(sessionChipLabel("myRig", "")).toBe("My Rig");
    });
});
