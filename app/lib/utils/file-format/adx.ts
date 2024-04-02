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

const adxField = (label: string, value?: string | number): string =>
    typeof value !== "undefined" && value !== null
        ? `<${label.toUpperCase()}>${sanitize(String(value))}</${label.toUpperCase()}>`
        : "";
const parseAdxField = (adx: ChildNode) => {
    return [adx.nodeName.toLocaleLowerCase(), unsanitize((adx.textContent || "").trim())];
};
const headerToAdx = (header: Header) =>
    `<HEADER>${adxField("NOTE", header.note)}${adxField("adif_ver", "3.1.4")}${Object.entries(header.fields || {})
        .map(([k, v]) => adxField(k, v))
        .join("")}</HEADER>`;

export const AdxAPI: FileFormatAPI = {
    toRecord: (from) => {
        const record = {
            honeypot: {},
        } as QSORecord;
        Array.from((from as Element).childNodes).forEach((n) => {
            const [tagName, value] = parseAdxField(n);
            if (tagName === "#text") return;
            if (allFields.includes(tagName as any)) record[tagName as RecordField] = value;
            else record.honeypot[tagName] = value;
        });
        return record;
    },
    fromRecord: (record) =>
        `<RECORD>${Object.entries(record)
            .filter(([k, v]) => v !== undefined)
            .map(([k, v]) =>
                k == "honeypot"
                    ? Object.entries(v as Honeypot).map(([hpk, hpv]) => adxField(hpk, hpv))
                    : adxField(k, v as string | undefined),
            )
            .flat()
            .join("")}</RECORD>`,

    parseFile: (fileContent) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(fileContent, "text/xml");
        return Array.from(doc.getElementsByTagName("RECORD")).map((n) => AdxAPI.toRecord(n));
    },
    generateFile: (qsos, header, massage = (r) => r) =>
        `<?xml version="1.0" encoding="UTF-8"?><ADX>${headerToAdx(header)}<RECORDS>${qsos
            .map((q) => AdxAPI.fromRecord(massage(qso2record(q))))
            .join("")}</RECORDS></ADX>`,
};
