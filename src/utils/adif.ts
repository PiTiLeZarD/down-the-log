import { DateTime } from "luxon";
import { bands, freq2band } from "../data/bands";
import { normalise } from "./locator";
import { QSO, newQsoID, qsoLocationFill } from "./qso";

const header = (): string[] => [
    "ADIF Export from down-the-log by VK4ALE",
    "for further info visit: https://github.com/PiTiLeZarD/down-the-log",
    "",
    field("adif_ver", "3.1.4"),
    field("created_timestamp", DateTime.utc().toFormat("yyyyMMdd HHmmss")),
    field("programid", "down-the-log"),
    field("programversion", "0.0.1"),
    "<EOH>",
    "",
    "",
];

const field = (label: string, value?: string | number): string =>
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

export const qso2adif = (qso: QSO): string => {
    return (
        [
            qso.date ? field("qso_date", qso.date.toFormat("yyyyMMdd")) : null,
            qso.date ? field("time_on", qso.date.toFormat("HHmmss")) : null,

            field("band", qso.band),
            field("freq", qso.frequency),
            field("mode", qso.mode),
            field("tx_pwr", String(qso.power)),

            field("rst_sent", qso.rst_sent),
            field("rst_rcvd", qso.rst_received),

            field("call", qso.callsign),
            field("pfx", qso.prefix),
            field("country", qso.country),
            field("state", qso.state),
            field("name", qso.name),
            field("distance", qso.distance),

            field("station_callsign", qso.myCallsign),
            field("my_city", qso.myQth),
            field("my_gridsquare", qso.myLocator),

            field("qth", qso.qth),
            field("gridsquare", qso.locator),
            field("cont", qso.continent),
            field("dxcc", qso.dxcc),
            field("cqz", qso.cqzone),
            field("ituz", qso.ituzone),

            field("eqsl_qsl_rcvd", qso.eqsl_received ? "Y" : "N"),
            field("eqsl_qsl_sent", qso.eqsl_sent ? "Y" : "N"),
            field("lotw_qsl_rcvd", qso.lotw_received ? "Y" : "N"),
            field("lotw_qsl_send", qso.lotw_sent ? "Y" : "N"),

            field("comment", qso.note),
        ]
            .filter((v) => !!v)
            .join(" ") + "<EOR>"
    );
};

export const qsos2Adif = (qsos: QSO[]): string => [...header(), ...qsos.map(qso2adif)].join("\n");

export const adifLine2Qso = (adif: string, currentLocation?: string, myCallsign?: string): QSO | null => {
    const qsoData: Record<string, string> = {};
    let tagName: string, value: string;
    let remaining = adif.trim();

    while (remaining.length && remaining.toUpperCase() !== "<EOR>") {
        const field = parseField(remaining);
        if (field.length === 0) {
            remaining = "";
            continue;
        }

        [remaining, tagName, value] = field;
        qsoData[tagName] = value;
    }

    const int = (v?: string) => (v !== undefined ? +v : undefined);
    const band = (b?: string, f?: string) => (Object.keys(bands).includes(b || "") ? b : f ? freq2band(+f) : undefined);

    const adifQso = {
        id: newQsoID(),
        date: DateTime.fromFormat(`${qsoData.qso_date} ${qsoData.time_on}`, "yyyyMMdd HHmmss"),
        callsign: qsoData.call,
        prefix: qsoData.prefix,
        dxcc: int(qsoData.dxcc),
        cqzone: int(qsoData.cqz),
        ituzone: int(qsoData.ituz),
        country: qsoData.country,
        continent: qsoData.cont,
        distance: int(qsoData.distance),
        frequency: int(qsoData.freq),
        band: band(qsoData.band, qsoData.freq),
        mode: qsoData.mode,
        power: int(qsoData.tx_pwr),
        name: qsoData.name,
        state: qsoData.state,
        locator: normalise(qsoData.gridsquare),
        qth: qsoData.qth,
        myQth: qsoData.my_city,
        myCallsign: qsoData.station_callsign || myCallsign,
        myLocator: normalise(qsoData.my_gridsquare || currentLocation),
        note: qsoData.comment,
        rst_sent: qsoData.rst_sent,
        rst_received: qsoData.rst_rcvd,
        eqsl_received: qsoData.eqsl_qsl_rcvd === "Y",
        eqsl_sent: qsoData.eqsl_qsl_sent === "Y",
        lotw_received: qsoData.lotw_qsl_rcvd === "Y",
        lotw_sent: qsoData.lotw_qsl_send === "Y",
    };

    return qsoLocationFill(Object.fromEntries(Object.entries(adifQso).filter(([k, v]) => v !== undefined)) as QSO);
};

export const splitAdifInRecords = (adif: string): string[] => {
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
