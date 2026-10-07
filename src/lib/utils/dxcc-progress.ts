import type { QSO } from "../components/qso";
import { entities } from "../data/cty";
import { Mode, isDigital } from "../data/modes";

/**
 * DXCC progress, the way an award counts it: one tick per current entity, worked once it's in the
 * log and confirmed once any QSO with it came back through LoTW or eQSL. Deleted entities are left
 * out of every count, so an old QSO with one doesn't push the total past what can be worked today.
 */

export type ModeGroup = "CW" | "Data" | "Phone";
export const modeGroups: ModeGroup[] = ["Phone", "CW", "Data"];
export const modeGroupOf = (mode?: Mode): ModeGroup => (mode === "CW" ? "CW" : isDigital(mode) ? "Data" : "Phone");

export const isConfirmed = (qso: QSO): boolean => !!(qso.lotw_received || qso.eqsl_received);

/** Each band and mode group an entity was worked on, and whether that pairing is confirmed. */
export type Slot = { band: string; mode: ModeGroup; confirmed: boolean };
export type EntityLog = { dxcc: number; qsos: number; slots: Slot[] };

export const totalEntities = Object.keys(entities).length;

/**
 * Folds the log down to its slots per entity once, so every filter the screens apply afterwards —
 * a band, a mode group, a column of the detailed view — reads a few dozen slots rather than the
 * whole log again.
 */
export const entityLogs = (qsos: QSO[]): Map<number, EntityLog> => {
    const logs = new Map<number, EntityLog>();
    const slots = new Map<string, Slot>();
    for (const qso of qsos) {
        // Imported logs have been known to carry the entity as a string.
        const dxcc = Number(qso.dxcc);
        if (!dxcc || !entities[dxcc]) continue;
        let log = logs.get(dxcc);
        if (!log) {
            log = { dxcc, qsos: 0, slots: [] };
            logs.set(dxcc, log);
        }
        log.qsos++;
        const band = String(qso.band);
        const mode = modeGroupOf(qso.mode);
        const key = `${dxcc}|${band}|${mode}`;
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

export const matchingSlots = (log: EntityLog | undefined, { bands, modes }: SlotFilter = {}): Slot[] =>
    (log?.slots || []).filter(
        (s) => (!bands?.length || bands.includes(s.band)) && (!modes?.length || modes.includes(s.mode)),
    );

export type EntityStatus = "confirmed" | "worked" | "missing";

export const entityStatus = (log: EntityLog | undefined, filter?: SlotFilter): EntityStatus => {
    const slots = matchingSlots(log, filter);
    if (slots.some((s) => s.confirmed)) return "confirmed";
    return slots.length ? "worked" : "missing";
};

export type DxccSummary = { worked: number; confirmed: number; total: number };

export const dxccSummary = (logs: Map<number, EntityLog>, filter?: SlotFilter): DxccSummary => {
    let worked = 0;
    let confirmed = 0;
    for (const log of logs.values()) {
        const status = entityStatus(log, filter);
        if (status !== "missing") worked++;
        if (status === "confirmed") confirmed++;
    }
    return { worked, confirmed, total: totalEntities };
};

/**
 * Where the progress bars put a tick: the DXCC award starts at 100 confirmed and endorses every 50
 * after that, and Honor Roll sits within nine of everything current.
 */
export const milestones = (total: number = totalEntities): number[] => [50, 100, 150, 200, 250, 300, total - 9];
