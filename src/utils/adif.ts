import { DateTime } from "luxon";
import { Band, bands, freq2band } from "../data/bands";
import { Continent, continents } from "../data/callsigns";
import { Mode, modes } from "../data/modes";
import { normalise } from "./locator";
import { QSO, newQsoID } from "./qso";

export type Honeypot = Record<string, string>;

const allFields = [
    "qso_date",
    "time_on",
    "band",
    "freq",
    "mode",
    "tx_pwr",
    "rst_sent",
    "rst_rcvd",
    "call",
    "pfx",
    "country",
    "state",
    "name",
    "distance",
    "station_callsign",
    "my_city",
    "my_gridsquare",
    "qth",
    "gridsquare",
    "cont",
    "dxcc",
    "cqz",
    "ituz",
    "eqsl_qsl_rcvd",
    "eqsl_qsl_sent",
    "lotw_qsl_rcvd",
    "lotw_qsl_sent",
    "comment",
    "pota_ref",
    "my_pota_ref",
    "wwff_ref",
    "my_wwff_ref",
    "sota_ref",
    "my_sota_ref",
    "iota",
    "my_iota",
    "sig",
    "my_sig",
    "sig_info",
    "my_sig_info",
    "my_rig",
    "my_antenna",
] as const;

type RecordField = (typeof allFields)[number];

export type QSORecord = Record<RecordField, string | undefined> & Record<"honeypot", Honeypot>;
export type RecordMassageFn = (r: QSORecord) => QSORecord;

const int = (v?: string) => (v !== undefined ? +v : undefined);
const string = (v?: number) => (v !== undefined ? String(v) : undefined);
const castAs: <T>(values: T[], input?: string) => T | undefined = (values, input) => {
    if (input === undefined) return undefined;
    const cleanInput = input.toUpperCase().trim();
    return values.includes(cleanInput as any) ? (cleanInput as (typeof values)[0]) : undefined;
};

const sanitize = (v: string) =>
    v.replace(/[<>&'"”]/g, (c?: string) => {
        switch (c) {
            case "<":
                return "&lt;";
            case ">":
                return "&gt;";
            case "&":
                return "&amp;";
            case "'":
                return "&apos;";
            case '"':
            case "”":
                return "&quot;";
        }
        return "";
    });

const unsanitize = (v: string) =>
    v.replace(/([&][a-z]{2,4}[;])/g, (c?: string) => {
        switch (c) {
            case "&lt;":
                return "<";
            case "&gt;":
                return ">";
            case "&amp;":
                return "&";
            case "&apos;":
                return "'";
            case "&quot;":
                return '"';
        }
        return "";
    });

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

const adxField = (label: string, value?: string | number): string =>
    typeof value !== "undefined" && value !== null
        ? `<${label.toUpperCase()}>${sanitize(String(value))}</${label.toUpperCase()}>`
        : "";
const parseAdxField = (adx: ChildNode) => {
    return [adx.nodeName.toLocaleLowerCase(), unsanitize((adx.textContent || "").trim())];
};

export const qso2record = (qso: QSO): QSORecord => {
    return {
        qso_date: qso.date && qso.date.toFormat("yyyyMMdd"),
        time_on: qso.date && qso.date.toFormat("HHmmss"),
        band: qso.band,
        freq: string(qso.frequency),
        mode: qso.mode,
        tx_pwr: string(qso.power),
        rst_sent: qso.rst_sent,
        rst_rcvd: qso.rst_received,
        call: qso.callsign,
        pfx: qso.prefix,
        country: qso.country,
        state: qso.state,
        name: qso.name,
        distance: string(qso.distance),
        station_callsign: qso.myCallsign,
        my_city: qso.myQth,
        my_gridsquare: qso.myLocator,
        qth: qso.qth,
        gridsquare: qso.locator,
        cont: qso.continent,
        dxcc: string(qso.dxcc),
        cqz: string(qso.cqzone),
        ituz: string(qso.ituzone),
        eqsl_qsl_rcvd: qso.eqsl_received ? "Y" : "N",
        eqsl_qsl_sent: qso.eqsl_sent ? "Y" : "N",
        lotw_qsl_rcvd: qso.lotw_received ? "Y" : "N",
        lotw_qsl_sent: qso.lotw_sent ? "Y" : "N",
        comment: qso.note,
        pota_ref: qso.pota,
        my_pota_ref: qso.myPota,
        wwff_ref: qso.wwff,
        my_wwff_ref: qso.myWwff,
        sota_ref: qso.sota,
        my_sota_ref: qso.mySota,
        iota: qso.iota,
        my_iota: qso.myIota,
        sig: qso.sig,
        my_sig: qso.mySig,
        sig_info: qso.sigInfo,
        my_sig_info: qso.mySigInfo,
        my_rig: qso.myRig,
        my_antenna: qso.myAntenna,
        honeypot: qso.honeypot || {},
    };
};

export const record2qso = (record: QSORecord): QSO => ({
    id: newQsoID(),
    date: DateTime.fromFormat(
        `${record.qso_date} ${record.time_on}`,
        record.time_on?.length === 6 ? "yyyyMMdd HHmmss" : "yyyyMMdd HHmm",
    ),
    callsign: record.call as string,
    prefix: record.pfx,
    dxcc: int(record.dxcc),
    cqzone: int(record.cqz),
    ituzone: int(record.ituz),
    country: record.country,
    continent: castAs<Continent>(continents as any, record.cont),
    distance: int(record.distance),
    frequency: int(record.freq),
    band:
        castAs<Band>(Object.keys(bands) as Band[], record.band) ||
        (record.freq ? freq2band(+(record.freq as string)) : undefined) ||
        undefined,
    mode: castAs<Mode>(modes as any, record.mode),
    power: int(record.tx_pwr),
    name: record.name,
    state: record.state,
    locator: normalise(record.gridsquare),
    qth: record.qth,
    myQth: record.my_city,
    myCallsign: record.station_callsign,
    myLocator: normalise(record.my_gridsquare),
    note: record.comment,
    rst_sent: record.rst_sent,
    rst_received: record.rst_rcvd,
    eqsl_received: record.eqsl_qsl_rcvd === "Y",
    eqsl_sent: record.eqsl_qsl_sent === "Y",
    lotw_received: record.lotw_qsl_rcvd === "Y",
    lotw_sent: record.lotw_qsl_sent === "Y",
    pota: record.pota_ref,
    myPota: record.my_pota_ref,
    wwff: record.wwff_ref,
    myWwff: record.my_wwff_ref,
    sota: record.sota_ref,
    mySota: record.my_sota_ref,
    iota: record.iota,
    myIota: record.my_iota,
    sig: record.sig,
    mySig: record.my_sig,
    sigInfo: record.sig_info,
    mySigInfo: record.my_sig_info,
    myRig: record.my_rig,
    myAntenna: record.my_antenna,
    honeypot: record.honeypot,
});

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

export const adx2Record = (adx: Element): QSORecord => {
    const record = {
        honeypot: {},
    } as QSORecord;
    Array.from(adx.childNodes).forEach((n) => {
        const [tagName, value] = parseAdxField(n);
        if (tagName === "#text") return;
        if (allFields.includes(tagName as any)) record[tagName as RecordField] = value;
        else record.honeypot[tagName] = value;
    });
    return record;
};

export const record2adx = (record: QSORecord): string =>
    `<RECORD>${Object.entries(record)
        .filter(([k, v]) => v !== undefined)
        .map(([k, v]) =>
            k == "honeypot"
                ? Object.entries(v as Honeypot).map(([hpk, hpv]) => adxField(hpk, hpv))
                : adxField(k, v as string | undefined),
        )
        .flat()
        .join("")}</RECORD>`;

type Header = {
    note?: string;
    fields?: Honeypot;
};
const header = (): Header => ({
    note: "ADIF Export from down-the-log by VK4ALE\nfor further info visit: https://github.com/PiTiLeZarD/down-the-log",
    fields: {
        adif_ver: "3.1.4",
        created_timestamp: DateTime.utc().toFormat("yyyyMMdd HHmmss"),
        programid: "down-the-log",
        programversion: "0.0.1",
    },
});

const headerToAdif = (header: Header) =>
    [
        header.note,
        ...(header.fields ? Object.entries(header.fields).map(([k, v]) => adifField(k, v)) : [""]),
        "<EOH>",
        "",
        "",
    ].join("\n");

const headerToAdx = (header: Header) =>
    `<HEADER>${adxField("NOTE", header.note)}${Object.entries(header.fields || {})
        .map(([k, v]) => adxField(k, v))
        .join("")}</HEADER>`;

export const qsos2Adif = (qsos: QSO[], massage: RecordMassageFn = (r) => r): string =>
    [headerToAdif(header()), ...qsos.map((q) => record2adif(massage(qso2record(q))))].join("\n");

export const qsos2Adx = (qsos: QSO[], massage: RecordMassageFn = (r) => r): string =>
    `<?xml version="1.0" encoding="UTF-8"?><ADX>${headerToAdx(header())}<RECORDS>${qsos
        .map((q) => record2adx(massage(qso2record(q))))
        .join("")}</RECORDS></ADX>`;

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

export const adxFileToRecordList = (adx: string): QSORecord[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(adx, "text/xml");
    return Array.from(doc.getElementsByTagName("RECORD")).map((n) => adx2Record(n));
};

export const downloadQsos = (title: string, qsos: QSO[], type: "adif" | "adx" = "adif", massage?: RecordMassageFn) =>
    Object.assign(document.createElement("a"), {
        href: `data:text/plain,${encodeURIComponent(
            type === "adif" ? qsos2Adif(qsos, massage) : qsos2Adx(qsos, massage),
        )}`,
        download: title,
    }).click();
