import { DateTime } from "luxon";
import { freq2band } from "../../data/bands";
import { parseCallsign } from "../callsign";
import { normalise } from "../locator";
import { FileFormatAPI, Honeypot, QSORecord, allFields, qso2record } from "./common";

export const WsjtxAPI: FileFormatAPI = {
    toRecord: (from) => {
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
        ] = (from as string).split(",");
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
    },
    fromRecord: (record) =>
        [
            DateTime.fromFormat(record.qso_date as string, "yyyyMMdd").toFormat("yyyy-MM-dd"),
            DateTime.fromFormat(record.time_on as string, "HHmmss").toFormat("HH:mm:ss"),
            DateTime.fromFormat((record.qso_date_off || record.qso_date) as string, "yyyyMMdd").toFormat("yyyy-MM-dd"),
            // Falls back to time_on, mirroring qso_date_off || qso_date above: most QSOs have no
            // dateOff, so qso2record emits no time_off, and a yyyyMMdd date read as HHmmss is an
            // invalid time — which is what used to land in this column.
            DateTime.fromFormat((record.time_off || record.time_on) as string, "HHmmss").toFormat("HH:mm:ss"),
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
        ].join(","),

    // Blank lines are dropped before parsing: every text file ends in a newline, and an empty line
    // destructures to undefined for every field but the first, which used to arrive as a phantom QSO
    // with no callsign and an unsortable date.
    parseFile: (fileContent) =>
        fileContent
            .split("\n")
            .filter((l) => l.trim().length > 0)
            .map((l) => WsjtxAPI.toRecord(l)),
    generateFile: (qsos, header, massage = (r) => r) =>
        qsos.map((q) => WsjtxAPI.fromRecord(massage(qso2record(q)))).join("\n"),
};
