import { unique } from "../arrays";
import { roundTo } from "../math";
import { FileFormatAPI, QSORecord, qso2record } from "./common";

const pad = (s: string | undefined, l: number, d: "LEFT" | "RIGHT" = "LEFT") =>
    (s || "")[d === "LEFT" ? "padEnd" : "padStart"](l, " ");

const parseLine = (s: string): { key: string; line: string; values: string[] } => {
    const [_, key, line] = s.split(/^([^:]+): (.*)/);
    return { key, line, values: line.split(/\s{1,}/) };
};

const tag = (tagName: string, value: string = "") => `${tagName.toUpperCase()}: ${value}`;

export const CabrilloAPI: FileFormatAPI = {
    fromRecord: (record) =>
        tag(
            "QSO",
            [
                pad(record.freq ? String(roundTo(+record.freq, 3) * 1000) : "", 5, "RIGHT"),
                record.mode,
                record.qso_date,
                record.time_on,
                pad(record.operator, 13),
                pad(record.rst_sent, 3, "RIGHT"),
                pad(record.my_sig_info, 6),
                pad(record.call, 13),
                pad(record.rst_rcvd, 3, "RIGHT"),
                pad(record.sig_info, 6),
                "0",
            ].join(" "),
        ),

    toRecord: (from) => {
        const { values } = parseLine(from as string);
        return {
            freq: values[0],
            mode: values[1],
            qso_date: values[2],
            time_on: values[3],
            operator: values[4],
            rst_sent: values[5],
            my_sig_info: values[6],
            call: values[7],
            rst_rcvd: values[8],
            sig_info: values[9],
            honeypot: {},
        } as QSORecord;
    },

    parseFile: (fileContent) => {
        const metadata: Record<string, string> = {};
        const records: QSORecord[] = [];

        fileContent.split("\n").forEach((tagline) => {
            const { key, line } = parseLine(tagline);
            if (key === "QSO") records.push(CabrilloAPI.toRecord(tagline));
            else metadata[key] = line;
        });

        return records;
    },
    generateFile: (qsos, header, massage = (r) => r) =>
        [
            tag("START-OF-LOG", "3.0"),
            ...(qsos[0].sig ? [tag("CONTEST", qsos[0].sig)] : []),
            tag("callsign", qsos[0].myCallsign),
            tag("CATEGORY-BAND", unique(qsos.map((q) => q.band)).filter((e) => !!e).length > 1 ? "ALL" : qsos[0].band),
            tag(
                "CATEGORY-MODE",
                unique(qsos.map((q) => q.mode)).filter((e) => !!e).length > 1 ? "MIXED" : qsos[0].mode,
            ),
            tag(
                "CATEGORY-POWER",
                ((power) => {
                    if (!power || power >= 100) return "HIGH";
                    if (power <= 5) return "QRP";
                    return "LOW";
                })(
                    qsos
                        .filter((q) => !!q.power)
                        .map((q) => q.power)
                        .sort()
                        .pop(),
                ),
            ),
            tag("GRID-LOCATOR", qsos[0].myLocator),
            tag(
                "CATEGORY-OPERATOR",
                unique(qsos.map((q) => q.myCallsign)).filter((e) => !!e).length > 1 ? "MULTI-OP" : "SINGLE-OP",
            ),
            tag("OPERATORS", unique(qsos.map((q) => q.myCallsign).filter((e) => !!e)).join(", ")),
            ...(header.fields?.programid
                ? [tag("CREATED-BY", `${header.fields.programid} ${header.fields.programversion || ""}`)]
                : []),
            ...(header.note ? header.note.split("\n").map((l) => tag("SOAPBOX", l)) : []),
            ...qsos.map((q) => CabrilloAPI.fromRecord(massage(qso2record(q)))),
            tag("END-OF-LOG"),
        ].join("\n"),
};
