import { QSO } from "../components/qso";
import { generateQsos } from "./file-format";
import { isTauri } from "./notify";

// LoTW upload on the desktop build, through the operator's own TQSL install — see
// src-tauri/src/tqsl.rs. The browser and the phones have no way to reach TQSL, so they keep the
// ADIF download and sign it by hand.

/** A Station Location as TQSL saved it in its station_data file. */
export type TqslLocation = { name: string; call?: string; dxcc?: number; grid?: string };

type UploadResult = { code: number; output: string };

export const tqslAvailable = isTauri;

// Imported on demand, like the notification plugin: the web build bundles this module too.
const invoke = async <T>(cmd: string, args?: Record<string, unknown>): Promise<T> =>
    (await import("@tauri-apps/api/core")).invoke<T>(cmd, args);

export const fetchTqslLocations = () => invoke<TqslLocation[]>("tqsl_locations");

// TQSL's batch exit codes. 8 and 9 are the duplicates and out-of-range QSOs `-a compliant` skipped:
// already on LoTW from an earlier upload, so as sent as they'll ever be.
const SENT_CODES = [0, 8, 9];
const CODE_MESSAGES: Record<number, string> = {
    1: "cancelled in TQSL",
    2: "rejected by LoTW",
    3: "LoTW gave an unexpected answer",
    4: "TQSL error",
    5: "TQSL library error",
    6: "TQSL could not open the log",
    10: "TQSL did not understand the command",
    11: "could not reach LoTW",
};

const callOf = (q: QSO) => q.myCallsign?.trim().toUpperCase();

/**
 * The location each callsign signs with: the one picked in settings while TQSL still has it, else the
 * first one saved for that callsign. Grid and state come from each QSO anyway (`-f update`), so for
 * most operators any location with the right callsign will do.
 */
export const locationFor = (
    call: string,
    locations: TqslLocation[],
    picked?: Record<string, string>,
): TqslLocation | undefined => {
    const own = locations.filter((l) => l.call?.toUpperCase() === call);
    return own.find((l) => l.name === picked?.[call]) || own[0];
};

export type TqslUploadResult = {
    sent: QSO[];
    /** QSOs whose callsign has no Station Location in TQSL, by callsign. */
    unplaced: Record<string, number>;
    problems: string[];
};

/** One TQSL run per callsign, one after the other: TQSL refuses to run two copies at once. */
export const uploadWithTqsl = async (
    qsos: QSO[],
    locations: TqslLocation[],
    picked: Record<string, string> | undefined,
    markSent: (sent: QSO[]) => void,
): Promise<TqslUploadResult> => {
    const groups = new Map<string, QSO[]>();
    const unplaced: Record<string, number> = {};
    for (const q of qsos) {
        const call = callOf(q) || "no callsign";
        if (!callOf(q) || !locationFor(call, locations, picked)) {
            unplaced[call] = (unplaced[call] || 0) + 1;
            continue;
        }
        groups.set(call, [...(groups.get(call) || []), q]);
    }

    const sent: QSO[] = [];
    const problems: string[] = [];
    for (const [call, group] of groups) {
        const location = locationFor(call, locations, picked)!;
        try {
            const result = await invoke<UploadResult>("tqsl_upload", {
                adif: generateQsos(group),
                location: location.name,
                callsign: call,
            });
            if (SENT_CODES.includes(result.code)) {
                sent.push(...group);
                markSent(group);
                if (result.code === 9) problems.push(`${call}: some were already on LoTW`);
            } else {
                const what = CODE_MESSAGES[result.code] || `TQSL exited with ${result.code}`;
                problems.push(`${call}: ${what}${result.output ? `\n${lastLines(result.output)}` : ""}`);
            }
        } catch (e) {
            problems.push(`${call}: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    return { sent, unplaced, problems };
};

// TQSL is chatty; the reason it gave up is at the end.
const lastLines = (text: string, count = 6) => text.split(/\r?\n/).slice(-count).join("\n");
