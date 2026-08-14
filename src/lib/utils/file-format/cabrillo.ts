import { unique } from "../arrays";
import { roundTo } from "../math";
import { FileFormatAPI, QSORecord, qso2record } from "./common";

const pad = (s: string | undefined, l: number, d: "LEFT" | "RIGHT" = "LEFT") =>
    (s || "")[d === "LEFT" ? "padEnd" : "padStart"](l, " ");

const parseLine = (s: string): { key: string; line: string; values: string[] } => {
    const [, key, line] = s.split(/^([^:]+): (.*)/);
    return { key, line, values: line.split(/\s{1,}/) };
};

const tag = (tagName: string, value: string = "") => `${tagName.toUpperCase()}: ${value}`;

// The exchange columns. A contest session fills the real ADIF exchange fields; an activation logged
// before those existed — or exported to Cabrillo for a QSO party — still has only its reference, so
// that stays as the fallback rather than leaving the column blank.
const exchange = (serial?: string, string?: string, sigInfo?: string) =>
    [serial ? serial.padStart(3, "0") : undefined, string || (serial ? undefined : sigInfo)].filter(Boolean).join(" ");

// The QSO line is positional and the exchange is whatever the contest says it is, so its width has
// to be worked out from the line: six fixed fields at the front, the transmitter id at the back, and
// a callsign and a report between the two exchanges. Both stations send the same shape of exchange,
// which is what makes the remainder divisible in two.
const exchangeWidth = (values: string[]) => Math.max(1, Math.floor((values.length - 9) / 2));

// A serial leads the exchange when there is one; anything after it is the rest of it.
const splitExchange = (parts: string[]) => {
    const [first, ...rest] = parts;
    const serial = /^\d+$/.test(first || "") ? first : undefined;
    const string = (serial ? rest : parts).join(" ");
    return { serial, string: string || undefined };
};

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
                pad(exchange(record.stx, record.stx_string, record.my_sig_info), 6),
                pad(record.call, 13),
                pad(record.rst_rcvd, 3, "RIGHT"),
                pad(exchange(record.srx, record.srx_string, record.sig_info), 6),
                "0",
            ].join(" "),
        ),

    toRecord: (from) => {
        const { values } = parseLine(from as string);
        const width = exchangeWidth(values);
        const sent = splitExchange(values.slice(6, 6 + width));
        const received = splitExchange(values.slice(6 + width + 2, 6 + width + 2 + width));
        return {
            freq: values[0],
            mode: values[1],
            qso_date: values[2],
            time_on: values[3],
            operator: values[4],
            rst_sent: values[5],
            stx: sent.serial,
            // A one-token exchange that isn't a serial is the reference an activation exported, which
            // is where it came from and where it has to go back.
            ...(width === 1 && !sent.serial ? { my_sig_info: sent.string } : { stx_string: sent.string }),
            call: values[6 + width],
            rst_rcvd: values[6 + width + 1],
            srx: received.serial,
            ...(width === 1 && !received.serial ? { sig_info: received.string } : { srx_string: received.string }),
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
            ...((contest) => (contest ? [tag("CONTEST", contest)] : []))(qsos[0].contestId || qsos[0].sig),
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
