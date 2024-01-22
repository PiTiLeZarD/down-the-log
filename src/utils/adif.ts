import { DateTime } from "luxon";
import { Band, bands, freq2band } from "../data/bands";
import { Continent, continents } from "../data/callsigns";
import { Mode, modes } from "../data/modes";
import { normalise } from "./locator";
import { QSO, newQsoID, qsoLocationFill } from "./qso";

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
    "lotw_qsl_send",
    "comment",
] as const;

type RecordField = (typeof allFields)[number];

type QSORecord = Record<RecordField, string | undefined>;

const int = (v?: string) => (v !== undefined ? +v : undefined);
const string = (v?: number) => (v !== undefined ? String(v) : undefined);
const castAs: <T>(values: T[], input?: string) => T | undefined = (values, input) => {
    if (input === undefined) return undefined;
    const cleanInput = input.toUpperCase().trim();
    return values.includes(cleanInput as any) ? (cleanInput as (typeof values)[0]) : undefined;
};

const adifField = (label: string, value?: string | number): string =>
    typeof value !== "undefined" && value !== null ? `<${label.toUpperCase()}:${("" + value).length}>${value}` : "";
const parseField = (adif: string): string[] => {
    let remaining = adif.trim();
    const match = remaining.match(/[<]([^:]+)[:]([0-9]+)([:]([^<]+))?[>]/);
    if (!match) {
        console.error("Error while parsing line");
        console.error(remaining);
        return [];
    }
    const [, tagName, tagLength, , tagType] = match;

    remaining = remaining.slice(`<${tagName}:${tagLength}${tagType ? `:${tagType}` : ""}>`.length);
    const value = remaining.slice(0, +tagLength);
    remaining = remaining.slice(+tagLength).trim();
    return [remaining, tagName.toLowerCase(), value];
};

export const qso2record = (qso: QSO): QSORecord => {
    return {
        qso_date: qso.date && qso.date.toFormat("yyyyMMdd"),
        time_on: qso.date && qso.date.toFormat("HHmmss"),
        band: qso.band,
        freq: string(qso.frequency),
        mode: qso.mode,
        tx_pwr: String(qso.power),
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
        lotw_qsl_send: qso.lotw_sent ? "Y" : "N",
        comment: qso.note,
    };
};

export const record2qso = (record: QSORecord): QSO => ({
    id: newQsoID(),
    date: DateTime.fromFormat(`${record.qso_date} ${record.time_on}`, "yyyyMMdd HHmmss"),
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
    lotw_sent: record.lotw_qsl_send === "Y",
});

export const record2adif = (record: QSORecord): string =>
    Object.entries(record)
        .filter(([k, v]) => v !== undefined)
        .map(([k, v]) => adifField(k, v))
        .join(" ") + "<EOR>";

export const adif2Record = (adif: string): QSORecord => {
    const record = {} as QSORecord;
    let tagName: string, value: string;
    let remaining = adif.trim();

    while (remaining.length && remaining.toUpperCase() !== "<EOR>") {
        const field = parseField(remaining);
        if (field.length === 0) {
            remaining = "";
            continue;
        }

        [remaining, tagName, value] = field;
        if (allFields.includes(tagName as any)) record[tagName as RecordField] = value;
    }
    return record;
};

const header = (): string[] => [
    "ADIF Export from down-the-log by VK4ALE",
    "for further info visit: https://github.com/PiTiLeZarD/down-the-log",
    "",
    adifField("adif_ver", "3.1.4"),
    adifField("created_timestamp", DateTime.utc().toFormat("yyyyMMdd HHmmss")),
    adifField("programid", "down-the-log"),
    adifField("programversion", "0.0.1"),
    "<EOH>",
    "",
    "",
];

export const qsos2Adif = (qsos: QSO[]): string =>
    [...header(), ...qsos.map((q) => record2adif(qso2record(q)))].join("\n");

export const adifLine2Qso = (adif: string, currentLocation?: string, myCallsign?: string): QSO | null => {
    const qso = record2qso(adif2Record(adif));

    if (!qso.myLocator) qso.myLocator = currentLocation;
    if (!qso.myCallsign) qso.myCallsign = myCallsign;

    return qsoLocationFill(qso);
};

export const adifFileToRecordList = (adif: string): string[] => {
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
        .map((record) => record.join("\n"));
};

export const downloadQsos = (title: string, qsos: QSO[]) =>
    Object.assign(document.createElement("a"), {
        href: `data:text/plain, ${encodeURIComponent(qsos2Adif(qsos))}`,
        download: title,
    }).click();
