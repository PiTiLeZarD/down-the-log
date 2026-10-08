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
//
// A LoTW record is told by any APP_LoTW_* field, not by APP_LoTW_OWNCALL in particular: LoTW leaves
// that one out of a report asked for one callsign (qso_owncall), which is how the pull asks, and
// keying on it read every pulled confirmation as "nothing to confirm". QSL_RCVD is what says the
// record is a confirmation; a report of plain QSOs carries the same fields with QSL_RCVD:N.
//
// A LoTW confirmation also carries the other station's STATE, as they certified it — which is what
// WAS counts, and what the log is most often missing for a US contact. It fills an empty state and
// never overwrites one, and it's taken from any confirmation, not only a new one, so re-downloading
// a period fills in the QSOs that were confirmed before this was read.
export const confirmQso = (target: QSO, record: QSO): QSO | null => {
    const honeypot = record.honeypot || {};
    const lotwConfirmation =
        Object.keys(honeypot).some((k) => k.startsWith("app_lotw_")) && honeypot.qsl_rcvd?.toUpperCase() !== "N";
    const lotw = lotwConfirmation && !target.lotw_received;
    const eqsl = "app_eqsl_ag" in honeypot && !target.eqsl_received;
    const state = lotwConfirmation && !target.state?.trim() ? record.state?.trim().toUpperCase() : undefined;
    if (!lotw && !eqsl && !state) return null;
    return {
        ...target,
        ...(lotw ? { lotw_received: true } : {}),
        ...(eqsl ? { eqsl_received: true } : {}),
        ...(state ? { state } : {}),
    };
};

// A record the operator has told the importer to stop asking about. Real values are QSO ids, which
// are uuids, so the sentinel can't collide with one.
export const QSL_IGNORED = "ignored";

// What the importer couldn't place: the parsed record, plus the key its answer is remembered under.
export type UnmatchedQsl = { key: string; record: QSO };
