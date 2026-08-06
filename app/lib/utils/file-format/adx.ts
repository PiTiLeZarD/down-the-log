import { XMLParser } from "fast-xml-parser";
import { FileFormatAPI, Header, Honeypot, QSORecord, RecordField, allFields, qso2record, sanitize } from "./common";

/**
 * `DOMParser` only exists on web, so the import silently died on native. `fast-xml-parser` is pure
 * JS and runs everywhere. Tag names are lowercased on the way in (ADX spells them uppercase, we key
 * on lowercase), values are kept as strings so a date like 20240101 doesn't come back as a number,
 * and the parser decodes the XML entities that `unsanitize` used to handle by hand.
 */
const parser = new XMLParser({
    ignoreAttributes: true,
    parseTagValue: false,
    trimValues: true,
    transformTagName: (name) => name.toLowerCase(),
    isArray: (name) => name === "record",
});

type AdxNode = Record<string, unknown>;

/** First text value of a tag: duplicates and nested elements can't land in a flat QSO field. */
const textValue = (value: unknown): string => {
    const first = [value].flat()[0];
    return first === null || first === undefined || typeof first === "object" ? "" : String(first);
};

/** Depth agnostic, the way `getElementsByTagName("RECORD")` was: RECORDS wrappers vary in the wild. */
const collectRecords = (node: unknown): AdxNode[] => {
    if (Array.isArray(node)) return node.flatMap(collectRecords);
    if (node === null || typeof node !== "object") return [];
    return Object.entries(node as AdxNode).flatMap(([tagName, value]) =>
        tagName === "record" ? ([value].flat() as AdxNode[]) : collectRecords(value),
    );
};

const adxField = (label: string, value?: string | number): string =>
    typeof value !== "undefined" && value !== null
        ? `<${label.toUpperCase()}>${sanitize(String(value))}</${label.toUpperCase()}>`
        : "";
const headerToAdx = (header: Header) =>
    `<HEADER>${adxField("NOTE", header.note)}${adxField("adif_ver", "3.1.4")}${Object.entries(header.fields || {})
        .map(([k, v]) => adxField(k, v))
        .join("")}</HEADER>`;

export const AdxAPI: FileFormatAPI = {
    toRecord: (from) => {
        const record = {
            honeypot: {},
        } as QSORecord;
        Object.entries(from as AdxNode).forEach(([tagName, raw]) => {
            const value = textValue(raw);
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

    parseFile: (fileContent) => collectRecords(parser.parse(fileContent)).map((n) => AdxAPI.toRecord(n)),
    generateFile: (qsos, header, massage = (r) => r) =>
        `<?xml version="1.0" encoding="UTF-8"?><ADX>${headerToAdx(header)}<RECORDS>${qsos
            .map((q) => AdxAPI.fromRecord(massage(qso2record(q))))
            .join("")}</RECORDS></ADX>`,
};
