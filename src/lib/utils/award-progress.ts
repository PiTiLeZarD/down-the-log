import type { QSO } from "../components/qso";
import { Mode, isDigital } from "../data/modes";

/**
 * Award progress, counted the way the awards count: a unit (a DXCC entity, a state, a call area) is
 * worked once it's in the log and confirmed once any QSO with it came back through LoTW or eQSL.
 * What a unit is, and which one a QSO counts for, is the award's business — see ./awards.ts.
 */

export type ModeGroup = "CW" | "Data" | "Phone";
export const modeGroups: ModeGroup[] = ["Phone", "CW", "Data"];
export const modeGroupOf = (mode?: Mode): ModeGroup => (mode === "CW" ? "CW" : isDigital(mode) ? "Data" : "Phone");

export const isConfirmed = (qso: QSO): boolean => !!(qso.lotw_received || qso.eqsl_received);

/** Each band and mode group a unit was worked on, and whether that pairing is confirmed. */
export type Slot = { band: string; mode: ModeGroup; confirmed: boolean };
export type UnitLog = { id: string; qsos: number; slots: Slot[] };
export type UnitLogs = Map<string, UnitLog>;

/**
 * Folds the log down to its slots per unit once, so every filter the screens apply afterwards — a
 * band, a mode group, a column of the detailed view — reads a few dozen slots rather than the whole
 * log again. `unitOf` returns nothing for a QSO the award doesn't count.
 */
export const unitLogs = (qsos: QSO[], unitOf: (qso: QSO) => string | undefined): UnitLogs => {
    const logs: UnitLogs = new Map();
    const slots = new Map<string, Slot>();
    for (const qso of qsos) {
        const id = unitOf(qso);
        if (!id) continue;
        let log = logs.get(id);
        if (!log) {
            log = { id, qsos: 0, slots: [] };
            logs.set(id, log);
        }
        log.qsos++;
        const band = String(qso.band);
        const mode = modeGroupOf(qso.mode);
        const key = `${id}|${band}|${mode}`;
        const slot = slots.get(key);
        if (slot) {
            slot.confirmed ||= isConfirmed(qso);
        } else {
            const created = { band, mode, confirmed: isConfirmed(qso) };
            slots.set(key, created);
            log.slots.push(created);
        }
    }
    return logs;
};

/** Empty or missing means "any". */
export type SlotFilter = { bands?: string[]; modes?: ModeGroup[] };

export const matchingSlots = (log: UnitLog | undefined, { bands, modes }: SlotFilter = {}): Slot[] =>
    (log?.slots || []).filter(
        (s) => (!bands?.length || bands.includes(s.band)) && (!modes?.length || modes.includes(s.mode)),
    );

export type UnitStatus = "confirmed" | "worked" | "missing";

export const unitStatus = (log: UnitLog | undefined, filter?: SlotFilter): UnitStatus => {
    const slots = matchingSlots(log, filter);
    if (slots.some((s) => s.confirmed)) return "confirmed";
    return slots.length ? "worked" : "missing";
};

export type AwardSummary = { worked: number; confirmed: number; total: number };

export const awardSummary = (logs: UnitLogs, total: number, filter?: SlotFilter): AwardSummary => {
    let worked = 0;
    let confirmed = 0;
    for (const log of logs.values()) {
        const status = unitStatus(log, filter);
        if (status !== "missing") worked++;
        if (status === "confirmed") confirmed++;
    }
    return { worked, confirmed, total };
};

export const bandsWorked = (logs: UnitLogs): string[] => [
    ...new Set([...logs.values()].flatMap((l) => l.slots.map((s) => s.band))),
];
