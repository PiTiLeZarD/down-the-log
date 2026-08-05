import { DateTime } from "luxon";
import { QSO, newQsoID } from "../../components/qso";
import { Band, bands, freq2band } from "../../data/bands";
import { Continent, continents } from "../../data/callsigns";
import { resolveMode } from "../../data/modes";
import { normalise } from "../locator";

export type Honeypot = Record<string, string>;

export const allFields = [
    "qso_date",
    "time_on",
    "qso_date_off",
    "time_off",
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
    "operator",
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
    "my_country",
    "my_state",
] as const;

export type RecordField = (typeof allFields)[number];

export type QSORecord = Record<RecordField, string | undefined> & Record<"honeypot", Honeypot>;
export type RecordMassageFn = (r: QSORecord) => QSORecord;

export const int = (v?: string) => (v !== undefined ? +v : undefined);
export const castAs: <T>(values: T[], input?: string) => T | undefined = (values, input) => {
    if (input === undefined) return undefined;
    const cleanInput = input.toUpperCase().trim();
    return values.includes(cleanInput as any) ? (cleanInput as (typeof values)[0]) : undefined;
};

export const sanitize = (v: string) =>
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

export const unsanitize = (v: string) =>
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

/**
 * One row per ADIF field, driving both directions. `qso2record` and `record2qso` used to be two
 * hand-maintained mirrors and they drifted (COUNTRY was written as our iso3 but read back as-is),
 * so there is deliberately no second list to keep in sync: a field is defined once, here.
 *
 * `to` and `from` both see the raw value including undefined, so a codec can decide what an
 * absent value means (the QSL flags export "N" rather than nothing, for instance).
 * The handful of fields that aren't 1:1 — the dates, OPERATOR, the submode stashing — stay
 * explicit in the two functions below.
 */
export type FieldCodec<K extends keyof QSO> = {
    to?: (value: QSO[K], qso: QSO) => string | undefined;
    from?: (value: string | undefined, record: QSORecord) => QSO[K];
};

type FieldDescriptor = {
    qsoKey: keyof QSO;
    adifKey: RecordField;
    // Erased: each row is checked against QSO[K] by `field()` on the way in, but the array itself
    // holds a mix of value types and can't stay generic.
    to: (value: any, qso: QSO) => string | undefined;
    from: (value: string | undefined, record: QSORecord) => any;
};

const defaultTo = (value: unknown) => (value === undefined || value === null ? undefined : String(value));
const defaultFrom = (value: string | undefined) => value;

const field = <K extends keyof QSO>(qsoKey: K, adifKey: RecordField, codec: FieldCodec<K> = {}): FieldDescriptor =>
    ({ qsoKey, adifKey, to: codec.to || defaultTo, from: codec.from || defaultFrom }) as FieldDescriptor;

const number = { from: (v?: string) => int(v) };
const boolean = { to: (v?: boolean) => (v ? "Y" : "N"), from: (v?: string) => v === "Y" };

export const fields: FieldDescriptor[] = [
    field("band", "band", {
        from: (v, record) =>
            castAs<Band>(Object.keys(bands) as Band[], v) ||
            (record.freq ? freq2band(+(record.freq as string)) : undefined) ||
            undefined,
    }),
    field("frequency", "freq", number),
    field("mode", "mode", { from: (v) => resolveMode(v) }),
    field("power", "tx_pwr", number),
    field("rst_sent", "rst_sent"),
    field("rst_received", "rst_rcvd"),
    field("callsign", "call"),
    field("prefix", "pfx"),
    field("country", "country"),
    field("state", "state"),
    field("name", "name"),
    field("distance", "distance", number),
    // myCallsign owns two ADIF fields. Both rows resolve it the same way, so whichever runs last
    // wins with the same answer, and each still writes its own tag.
    field("myCallsign", "station_callsign", { from: (v, record) => v || record.operator }),
    field("myCallsign", "operator", { from: (v, record) => record.station_callsign || v }),
    field("myQth", "my_city"),
    field("myLocator", "my_gridsquare", { from: (v) => normalise(v) }),
    field("qth", "qth"),
    field("locator", "gridsquare", { from: (v) => normalise(v) }),
    field("continent", "cont", { from: (v) => castAs<Continent>(Object.keys(continents) as Continent[], v) }),
    field("dxcc", "dxcc", number),
    field("cqzone", "cqz", number),
    field("ituzone", "ituz", number),
    field("eqsl_received", "eqsl_qsl_rcvd", boolean),
    field("eqsl_sent", "eqsl_qsl_sent", boolean),
    field("lotw_received", "lotw_qsl_rcvd", boolean),
    field("lotw_sent", "lotw_qsl_sent", boolean),
    field("note", "comment"),
    field("pota", "pota_ref"),
    field("myPota", "my_pota_ref"),
    field("wwff", "wwff_ref"),
    field("myWwff", "my_wwff_ref"),
    field("sota", "sota_ref"),
    field("mySota", "my_sota_ref"),
    field("iota", "iota"),
    field("myIota", "my_iota"),
    field("sig", "sig"),
    field("mySig", "my_sig"),
    field("sigInfo", "sig_info"),
    field("mySigInfo", "my_sig_info"),
    field("myRig", "my_rig"),
    field("myAntenna", "my_antenna"),
    field("myCountry", "my_country"),
    field("myState", "my_state"),
];

export const qso2record = (qso: QSO): QSORecord =>
    ({
        qso_date: qso.date && qso.date.toFormat("yyyyMMdd"),
        time_on: qso.date && qso.date.toFormat("HHmmss"),
        qso_date_off: qso.dateOff && qso.dateOff.toFormat("yyyyMMdd"),
        time_off: qso.dateOff && qso.dateOff.toFormat("HHmmss"),
        ...Object.fromEntries(fields.map(({ qsoKey, adifKey, to }) => [adifKey, to(qso[qsoKey], qso)])),
        honeypot: qso.honeypot || {},
    }) as QSORecord;

export const record2qso = (record: QSORecord): QSO => {
    const mode = resolveMode(record.mode);
    // MODE held a submode (FT4, USB, PSK31...): keep the original around so an export doesn't lose it
    const submode = mode && record.mode?.toUpperCase().trim() !== mode ? record.mode?.toUpperCase().trim() : undefined;

    return {
        ...Object.fromEntries(fields.map(({ qsoKey, adifKey, from }) => [qsoKey, from(record[adifKey], record)])),
        id: newQsoID(),
        date: DateTime.fromFormat(
            `${record.qso_date} ${record.time_on}`,
            record.time_on?.length === 6 ? "yyyyMMdd HHmmss" : "yyyyMMdd HHmm",
        ),
        dateOff:
            record.qso_date_off && record.time_off && record.time_off != record.time_on
                ? DateTime.fromFormat(
                      `${record.qso_date_off} ${record.time_off}`,
                      record.time_off?.length === 6 ? "yyyyMMdd HHmmss" : "yyyyMMdd HHmm",
                  )
                : undefined,
        honeypot: submode && !record.honeypot?.submode ? { ...record.honeypot, submode } : record.honeypot,
    } as QSO;
};

export type Header = {
    note?: string;
    fields?: Honeypot;
};
export const header = (): Header => ({
    note: "ADIF Export from down-the-log by VK4ALE\nfor further info visit: https://github.com/PiTiLeZarD/down-the-log",
    fields: {
        created_timestamp: DateTime.utc().toFormat("yyyyMMdd HHmmss"),
        programid: "down-the-log",
        programversion: "0.0.1",
    },
});

export type FileFormatAPI = {
    toRecord: (from: unknown) => QSORecord;
    fromRecord: (record: QSORecord) => string;
    parseFile: (fileContent: string) => QSORecord[];
    generateFile: (qsos: QSO[], header: Header, massage?: RecordMassageFn) => string;
};
