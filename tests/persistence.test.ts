import { DateTime } from "luxon";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { QSO } from "../src/lib/components/qso";
import type { Backend, StoredState, WriteBatch } from "../src/lib/utils/persistence/types";

// The persistence module reads the log once per run and keeps what it saved in module state, so each
// test gets a fresh copy of it and of the store.
const fresh = async () => {
    vi.resetModules();
    const persistence = await import("../src/lib/utils/persistence");
    const { useStore } = await import("../src/lib/utils/store");
    return { ...persistence, useStore };
};

const qso = (id: string, minute = 0): QSO =>
    ({ id, callsign: "VK2ABC", date: DateTime.fromISO(`2026-10-23T10:${String(minute).padStart(2, "0")}:00Z`) }) as QSO;

const memory = (stored: StoredState = { qsos: [] }) => {
    const writes: WriteBatch[] = [];
    let failNext = false;
    const backend: Backend = {
        load: async () => stored,
        write: async (batch) => {
            if (failNext) {
                failNext = false;
                throw new Error("disk full");
            }
            writes.push(batch);
        },
    };
    return { backend, writes, failNextWrite: () => (failNext = true) };
};

describe("persistence", () => {
    beforeEach(() => vi.restoreAllMocks());

    test("a log that can't be read is never written over", async () => {
        const { loadStore, usePersistence, useStore, save } = await fresh();
        const write = vi.fn();
        await loadStore({ load: async () => Promise.reject(new Error("row too big")), write });

        expect(usePersistence.getState()).toMatchObject({ status: "failed", error: "row too big" });
        useStore.getState().setCurrentLocation("QF56");
        useStore.getState().log(qso("a"));
        await save();
        expect(write).not.toHaveBeenCalled();
    });

    test("loading writes nothing, and a new QSO writes only itself", async () => {
        const { loadStore, useStore, save, toStorable } = await fresh();
        const { backend, writes } = memory({
            meta: { settings: { myCallsign: "VK2ABC" } },
            qsos: [toStorable(qso("a")), toStorable(qso("b", 1))],
        });
        await loadStore(backend);
        await save();
        expect(writes).toHaveLength(0);
        expect(useStore.getState().settings.myCallsign).toBe("VK2ABC");
        expect(DateTime.isDateTime(useStore.getState().qsos[0].date)).toBe(true);

        useStore.getState().log(qso("c", 2));
        await save();
        expect(writes).toHaveLength(1);
        expect(writes[0].put.map((p) => p.id)).toEqual(["c"]);
        expect(writes[0].remove).toEqual([]);
        expect(writes[0].meta).toBeUndefined();
    });

    test("a deleted QSO is removed and a changed setting rewrites only the meta", async () => {
        const { loadStore, useStore, save } = await fresh();
        const { backend, writes } = memory();
        await loadStore(backend);
        useStore.getState().log(qso("a"));
        await save();

        useStore.getState().deleteLog(useStore.getState().qsos[0]);
        await save();
        expect(writes.at(-1)).toMatchObject({ put: [], remove: ["a"] });

        useStore.getState().updateSetting("myCallsign", "VK4ALE");
        await save();
        expect(writes.at(-1)?.put).toEqual([]);
        expect((writes.at(-1)?.meta?.settings as { myCallsign: string }).myCallsign).toBe("VK4ALE");
    });

    test("a failed write is reported and its QSO goes again with the next save", async () => {
        const { loadStore, usePersistence, useStore, save } = await fresh();
        const { backend, writes, failNextWrite } = memory();
        await loadStore(backend);

        failNextWrite();
        useStore.getState().log(qso("a"));
        await save();
        expect(usePersistence.getState().writeError).toBe("disk full");
        expect(writes).toHaveLength(0);

        useStore.getState().log(qso("b", 1));
        await save();
        expect(writes[0].put.map((p) => p.id).sort()).toEqual(["a", "b"]);
        expect(usePersistence.getState().writeError).toBeUndefined();
    });
});
