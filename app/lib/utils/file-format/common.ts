import { DateTime } from "luxon";
import { QSO, newQsoID } from "../../components/qso";
import { Band, bands, freq2band } from "../../data/bands";
import { Continent, continents } from "../../data/callsigns";
import { Mode, modes } from "../../data/modes";
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
export const string = (v?: number) => (v !== undefined ? String(v) : undefined);
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

export const qso2record = (qso: QSO): QSORecord => ({
    qso_date: qso.date && qso.date.toFormat("yyyyMMdd"),
    time_on: qso.date && qso.date.toFormat("HHmmss"),
    qso_date_off: qso.dateOff && qso.dateOff.toFormat("yyyyMMdd"),
    time_off: qso.dateOff && qso.dateOff.toFormat("HHmmss"),
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
    operator: qso.myCallsign,
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
    my_country: qso.myCountry,
    my_state: qso.myState,
    honeypot: qso.honeypot || {},
});

export const record2qso = (record: QSORecord): QSO => ({
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
    callsign: record.call as string,
    prefix: record.pfx,
    dxcc: int(record.dxcc),
    cqzone: int(record.cqz),
    ituzone: int(record.ituz),
    country: record.country,
    continent: castAs<Continent>(Object.keys(continents) as Continent[], record.cont),
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
    myCallsign: record.station_callsign || record.operator,
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
    myCountry: record.my_country,
    myState: record.my_state,
    honeypot: record.honeypot,
});

export type Header = {
    note?: string;
    fields?: Honeypot;
};
export const header = (): Header => ({
    note: "ADIF Export from down-the-log by VK4ALE\nfor further info visit: https://github.com/PiTiLeZarD/down-the-log",
    fields: {
        adif_ver: "3.1.4",
        created_timestamp: DateTime.utc().toFormat("yyyyMMdd HHmmss"),
        programid: "down-the-log",
        programversion: "0.0.1",
    },
});
