import { baseCallsign } from "../../utils/callsign";
import { QSORecord } from "../../utils/file-format/common";
import { QSO } from "../qso";

// Who was worked and when — the same triple the services key their downloads on, and the same one
// the log's own duplicate check uses. It has to be stable across downloads: a manual match is
// remembered against this key, so a second download of the same period has to produce the key the
// first one did.
// An unparseable callsign keys on the raw string rather than on the word "undefined", which is
// what baseCallsign returns for one: two different unreadable calls at the same minute are not the
// same record.
export const qslRecordKey = (record: QSORecord): string =>
    `${baseCallsign(record.call || "") || record.call || ""}|${record.qso_date}|${record.time_on}`;

// Confirmations only ever go one way. A record that doesn't carry the service's field says nothing
// about the QSO — it is not a retraction — so nothing is ever set back to false, which is what
// makes replaying a download safe.
//
// null means "already says this", and it matters: the persist layer diffs QSOs by object identity
// (see qsoOps in utils/store), so handing back a fresh copy of an unchanged QSO costs a write per
// matched QSO on every re-import of the same file.
export const confirmQso = (target: QSO, record: QSO): QSO | null => {
    const honeypot = record.honeypot || {};
    const lotw = "app_lotw_owncall" in honeypot && !target.lotw_received;
    const eqsl = "app_eqsl_ag" in honeypot && !target.eqsl_received;
    if (!lotw && !eqsl) return null;
    return { ...target, ...(lotw ? { lotw_received: true } : {}), ...(eqsl ? { eqsl_received: true } : {}) };
};

// A record the operator has told the importer to stop asking about. Real values are QSO ids, which
// are uuids, so the sentinel can't collide with one.
export const QSL_IGNORED = "ignored";

// What the importer couldn't place: the parsed record, plus the key its answer is remembered under.
export type UnmatchedQsl = { key: string; record: QSO };
