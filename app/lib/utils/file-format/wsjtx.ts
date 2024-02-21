import { DateTime } from "luxon";
import { QSO } from "../../components/qso";
import { freq2band } from "../../data/bands";
import { parseCallsign } from "../callsign";
import { normalise } from "../locator";
import { Honeypot, QSORecord, RecordMassageFn, allFields, qso2record } from "./common";

export const record2wsjtx = (record: QSORecord): string =>
    [
        DateTime.fromFormat(record.qso_date as string, "yyyyMMdd").toFormat("yyyy-MM-dd"),
        DateTime.fromFormat(record.time_on as string, "HHmmss").toFormat("HH:mm:ss"),
        DateTime.fromFormat((record.qso_date_off || record.qso_date) as string, "yyyyMMdd").toFormat("yyyy-MM-dd"),
        DateTime.fromFormat((record.time_off || record.qso_date) as string, "HHmmss").toFormat("HH:mm:ss"),
        record.call,
        normalise(record.gridsquare)?.substring(0, 4),
        record.freq,
        record.mode,
        record.rst_sent,
        record.rst_rcvd,
        record.tx_pwr,
        record.comment,
        record.name,
        "",
    ].join(",");

export const wsjtx2Record = (wsjtx: string): QSORecord => {
    const [
        qso_date,
        time_on,
        qso_date_off,
        time_off,
        call,
        grid,
        freq,
        mode,
        rst_sent,
        rst_rcvd,
        tx_pwr,
        comment,
        name,
        _,
    ] = wsjtx.split(",");
    const parsed = parseCallsign(call);
    return {
        ...Object.fromEntries(Array.from(allFields).map((f) => [f, undefined])),
        qso_date: DateTime.fromFormat(qso_date, "yyyy-MM-dd").toFormat("yyyyMMdd"),
        time_on: DateTime.fromFormat(time_on, "HH:mm:ss").toFormat("HHmmss"),
        qso_date_off: DateTime.fromFormat(qso_date_off, "yyyy-MM-dd").toFormat("yyyyMMdd"),
        time_off: DateTime.fromFormat(time_off, "HH:mm:ss").toFormat("HHmmss"),
        call,
        pfx: parsed?.prefix,
        gridsquare: normalise(grid),
        freq,
        band: freq2band(+freq),
        mode,
        rst_rcvd,
        rst_sent,
        tx_pwr,
        comment,
        name,
        honeypot: {
            qso_date_off,
            time_off,
        } as Honeypot,
    } as QSORecord;
};

export const qsos2Wsjtx = (qsos: QSO[], massage: RecordMassageFn = (r) => r): string =>
    qsos.map((q) => record2wsjtx(massage(qso2record(q)))).join("\n");

export const wsjtxFileToRecordList = (wsjtx: string): QSORecord[] => wsjtx.split("\n").map((l) => wsjtx2Record(l));
