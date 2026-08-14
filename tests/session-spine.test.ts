import { describe, expect, test } from "vitest";
import { SpineRow, sameSpine, sessionSpines } from "../src/lib/utils/session-spine";

// The log as the list renders it, newest first: a date header followed by its QSOs. `s` is the
// session a QSO was logged in, undefined for one logged outside a session.
const header = (key: string): SpineRow => ({ key, qso: false });
const qso = (key: string, sessionId?: string): SpineRow => ({ key, qso: true, sessionId });

const kinds = (rows: SpineRow[]) =>
    Object.fromEntries(Object.entries(sessionSpines(rows)).map(([key, spine]) => [key, spine.kind]));

describe("sessionSpines", () => {
    test("brackets a run of QSOs from the same session", () => {
        const rows = [header("h1"), qso("a", "s1"), qso("b", "s1"), qso("c", "s1")];
        expect(kinds(rows)).toEqual({ a: "start", b: "middle", c: "end" });
    });

    test("leaves QSOs logged outside a session alone", () => {
        expect(kinds([header("h1"), qso("a"), qso("b")])).toEqual({});
    });

    test("marks a session with one QSO in the list", () => {
        expect(kinds([header("h1"), qso("a"), qso("b", "s1"), qso("c")])).toEqual({ b: "single" });
    });

    test("carries the bracket across a date header, the UTC+11 case", () => {
        const rows = [header("h1"), qso("a", "s1"), qso("b", "s1"), header("h2"), qso("c", "s1"), qso("d", "s1")];
        expect(kinds(rows)).toEqual({ a: "start", b: "middle", h2: "middle", c: "middle", d: "end" });
    });

    test("does not carry it across a header that ends the session", () => {
        const rows = [header("h1"), qso("a", "s1"), qso("b", "s1"), header("h2"), qso("c", "s2")];
        expect(kinds(rows)).toEqual({ a: "start", b: "end", c: "single" });
    });

    test("breaks the run where the list has something else in between", () => {
        const rows = [qso("a", "s1"), qso("b", "s1"), qso("c", "s2"), qso("d", "s1"), qso("e", "s1")];
        expect(kinds(rows)).toEqual({ a: "start", b: "end", c: "single", d: "start", e: "end" });
    });

    test("alternates the colour so back-to-back sessions read as two brackets", () => {
        const spines = sessionSpines([qso("a", "s1"), qso("b", "s1"), qso("c", "s2"), qso("d", "s2")]);
        expect(spines.a.variant).toBe(spines.b.variant);
        expect(spines.c.variant).toBe(spines.d.variant);
        expect(spines.a.variant).not.toBe(spines.c.variant);
    });

    test("keeps a session's colour when it comes back later in the list", () => {
        const spines = sessionSpines([qso("a", "s1"), qso("b", "s2"), qso("c", "s1")]);
        expect(spines.c.variant).toBe(spines.a.variant);
    });
});

describe("sameSpine", () => {
    test("compares by value, so a rebuilt row list doesn't repaint the log", () => {
        const spine = { kind: "middle" as const, variant: "primary" as const, sessionId: "s1" };
        expect(sameSpine(spine, { ...spine })).toBe(true);
        expect(sameSpine(spine, { ...spine, kind: "end" })).toBe(false);
        expect(sameSpine(spine, { ...spine, sessionId: "s2" })).toBe(false);
        expect(sameSpine(undefined, undefined)).toBe(true);
        expect(sameSpine(spine, undefined)).toBe(false);
    });
});
