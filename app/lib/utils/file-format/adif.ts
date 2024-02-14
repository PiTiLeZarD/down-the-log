import { QSO } from "../../components/qso";
import {
    Header,
    Honeypot,
    QSORecord,
    RecordField,
    RecordMassageFn,
    allFields,
    header,
    qso2record,
    sanitize,
    unsanitize,
} from "./common";

const adifField = (label: string, value?: string | number): string =>
    typeof value !== "undefined" && value !== null
        ? `<${label.toUpperCase()}:${sanitize(String(value)).length}>${sanitize(String(value))}`
        : "";
const parseAdifField = (adif: string): string[] => {
    let remaining = adif.trim();
    const regexp = /[<]([^:]+)[:]([0-9]+)([:]([^<]+))?[>]/;
    const match = remaining.match(regexp);
    if (!match) {
        console.error("Error while parsing line");
        console.error(remaining);
        return [];
    }
    const [, tagName, tagLength, , tagType] = match;

    remaining = remaining.slice(`<${tagName}:${tagLength}${tagType ? `:${tagType}` : ""}>`.length);
    const value = remaining.slice(0, +tagLength);
    const nextIndex = remaining.search(regexp);
    remaining = remaining.slice(nextIndex == -1 ? +tagLength : nextIndex).trim();
    return [remaining, tagName.toLowerCase(), unsanitize(value)];
};

export const record2adif = (record: QSORecord): string =>
    Object.entries(record)
        .filter(([k, v]) => v !== undefined)
        .map(([k, v]) =>
            k == "honeypot"
                ? Object.entries(v as Honeypot).map(([hpk, hpv]) => adifField(hpk, hpv))
                : adifField(k, v as string | undefined),
        )
        .flat()
        .join(" ") + "<EOR>";

export const adif2Record = (adif: string): QSORecord => {
    const record = {
        honeypot: {},
    } as QSORecord;
    let tagName: string, value: string;
    let remaining = adif.trim();

    while (remaining.length && remaining.toUpperCase() !== "<EOR>") {
        const field = parseAdifField(remaining);
        if (field.length === 0) {
            remaining = "";
            continue;
        }

        [remaining, tagName, value] = field;
        if (allFields.includes(tagName as any)) record[tagName as RecordField] = value;
        else record.honeypot[tagName] = value;
    }
    return record;
};

const headerToAdif = (header: Header) =>
    [
        header.note,
        ...(header.fields ? Object.entries(header.fields).map(([k, v]) => adifField(k, v)) : [""]),
        "<EOH>",
        "",
        "",
    ].join("\n");

export const qsos2Adif = (qsos: QSO[], massage: RecordMassageFn = (r) => r): string =>
    [headerToAdif(header()), ...qsos.map((q) => record2adif(massage(qso2record(q))))].join("\n");

export const adifFileToRecordList = (adif: string): QSORecord[] => {
    let lines = adif.replace(/(?:\\[r]|[\r]+)+/g, "").split("\n");
    if (!lines[0].startsWith("<")) {
        lines = lines.splice(lines.findIndex((v) => v.toUpperCase().startsWith("<EOH>")) + 1);
    }
    return lines
        .reduce<string[][]>((records, line) => {
            const lastRecord = records.length ? records.splice(records.length - 1, 1)[0] : [];
            if (!line.toUpperCase().includes("<EOR>")) {
                lastRecord.push(line);
                return [...records, lastRecord];
            }
            const [last, next] = line.split(/<[eE][oO][rR]>/);
            return [...records, [...lastRecord, last], next.length ? [next] : []];
        }, [])
        .filter((record) => record.filter((l) => Boolean(l)).length > 0)
        .map((record) => adif2Record(record.join("\n")));
};
