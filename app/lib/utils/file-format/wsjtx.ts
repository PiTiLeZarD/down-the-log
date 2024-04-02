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
            _,
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
        ].join(","),

    parseFile: (fileContent) => fileContent.split("\n").map((l) => WsjtxAPI.toRecord(l)),
    generateFile: (qsos, header, massage = (r) => r) =>
        qsos.map((q) => WsjtxAPI.fromRecord(massage(qso2record(q)))).join("\n"),
};
