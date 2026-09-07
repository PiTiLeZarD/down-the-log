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
    const [, tagName, tagLength] = match;

    // The match can start anywhere — a stray comment or a partially-consumed value ahead of the
    // first tag is not unheard of in third-party exports. Cutting a fixed tag-width off position 0
    // instead of cutting from the match shifted every following field by the length of that text,
    // which broke the next match and dropped the whole record with only a console.error to show.
    remaining = remaining.slice((match.index ?? 0) + match[0].length);
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

    // Grouping used to rebuild the whole accumulator array on every line (`[...records, record]`),
    // which is quadratic in the number of QSOs: fine for a club log, minutes for a contest-sized
    // one. Same grouping, done by pushing into the array we already have.
    parseFile: (fileContent) => {
        let lines = fileContent.replace(/(?:\\[r]|[\r]+)+/g, "").split("\n");
        const eoh = lines.findIndex((v) => v.toUpperCase().includes("<EOH>"));
        if (eoh !== -1) lines = lines.slice(eoh + 1);

        const records: string[][] = [];
        let current: string[] = [];
        lines.forEach((line) => {
            if (!line.toUpperCase().includes("<EOR>")) {
                current.push(line);
                return;
            }
            // A line can hold several records, or end one and start the next.
            const parts = line.split(/<[eE][oO][rR]>/);
            parts.forEach((part, i) => {
                current.push(part);
                if (i < parts.length - 1) {
                    records.push(current);
                    current = [];
                }
            });
        });
        records.push(current);

        return records
            .filter((record) => record.some((l) => Boolean(l)))
            .map((record) => AdifAPI.toRecord(record.join("\n")));
    },
    generateFile: (qsos, header, massage = (r) => r) =>
        [headerToAdif(header), ...qsos.map((q) => AdifAPI.fromRecord(massage(qso2record(q))))].join("\n"),
};
