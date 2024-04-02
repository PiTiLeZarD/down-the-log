import {
    FileFormatAPI,
    Header,
    Honeypot,
    QSORecord,
    RecordField,
    allFields,
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
const headerToAdif = (header: Header) =>
    [
        header.note,
        adifField("adif_ver", "3.1.4"),
        ...(header.fields ? Object.entries(header.fields).map(([k, v]) => adifField(k, v)) : [""]),
        "<EOH>",
        "",
        "",
    ].join("\n");

export const AdifAPI: FileFormatAPI = {
    toRecord: (from) => {
        const record = {
            honeypot: {},
        } as QSORecord;
        let tagName: string, value: string;
        let remaining = (from as string).trim();

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
    },
    fromRecord: (record) =>
        Object.entries(record)
            .filter(([k, v]) => v !== undefined)
            .map(([k, v]) =>
                k == "honeypot"
                    ? Object.entries(v as Honeypot).map(([hpk, hpv]) => adifField(hpk, hpv))
                    : adifField(k, v as string | undefined),
            )
            .flat()
            .join(" ") + "<EOR>",

    parseFile: (fileContent) => {
        let lines = fileContent.replace(/(?:\\[r]|[\r]+)+/g, "").split("\n");
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
            .map((record) => AdifAPI.toRecord(record.join("\n")));
    },
    generateFile: (qsos, header, massage = (r) => r) =>
        [headerToAdif(header), ...qsos.map((q) => AdifAPI.fromRecord(massage(qso2record(q))))].join("\n"),
};
