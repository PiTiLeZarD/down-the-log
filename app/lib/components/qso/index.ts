import humanize from "humanize-duration";
import { DateTime, Interval } from "luxon";
import uuid from "react-native-uuid";
import { Band, band2freq, freq2band } from "../../data/bands";
import { Continent } from "../../data/callsigns";
import cqzones from "../../data/cqzones.json";
import dxcc from "../../data/dxcc.json";
import ituzones from "../../data/ituzones.json";
import { Mode, isDigital } from "../../data/modes";
import { baseCallsign, getCallsignData, parseCallsign } from "../../utils/callsign";
import { maidenDistance, maidenhead2Latlong } from "../../utils/locator";
import { findZone } from "../../utils/polydec";
import { useStore } from "../../utils/store";

export const useQsos = (): QSO[] => {
    const qsos = useStore((state) => state.qsos);
    return qsos.sort((q1, q2) => (q1.date <= q2.date ? 1 : -1));
};

export type QSO = {
    id: string;
    position?: number;
    date: DateTime;
    dateOff?: DateTime;
    callsign: string;
    distance?: number;
    country?: string;
    dxcc?: number;
    prefix?: string;
    cqzone?: number;
    ituzone?: number;
    continent?: Continent;
    state?: string;
    rst_sent?: string;
    rst_received?: string;
    name?: string;
    frequency?: number;
    band?: Band;
    mode?: Mode;
    power?: number;
    myQth?: string;
    myLocator?: string;
    myCallsign?: string;
    qth?: string;
    locator?: string;
    note?: string;
    eqsl_received?: boolean;
    eqsl_sent?: boolean;
    lotw_received?: boolean;
    lotw_sent?: boolean;
    pota?: string;
    myPota?: string;
    wwff?: string;
    myWwff?: string;
    sota?: string;
    mySota?: string;
    iota?: string;
    myIota?: string;
    sig?: string;
    mySig?: string;
    sigInfo?: string;
    mySigInfo?: string;
    myRig?: string;
    myAntenna?: string;
    myState?: string;
    myCountry?: string;
    honeypot?: Record<string, string>;
};

export const duration = (qso: QSO, dateOff?: DateTime): string =>
    qso.dateOff || dateOff
        ? humanize(
              Interval.fromDateTimes(qso.date, (qso.dateOff || dateOff) as DateTime)
                  .toDuration()
                  .valueOf(),
              {
                  largest: 2,
                  round: true,
                  language: "shortEn",
                  // @ts-ignore
                  languages: {
                      shortEn: {
                          y: () => "y",
                          mo: () => "mo",
                          w: () => "w",
                          d: () => "d",
                          h: () => "h",
                          m: () => "min",
                          s: () => "s",
                          ms: () => "ms",
                      },
                  },
              },
          )
        : "";

export const allEvents = (qso: QSO) =>
    [qso.pota, qso.myPota, qso.wwff, qso.myWwff, qso.sota, qso.mySota, qso.sig, qso.mySig, qso.iota, qso.myIota].filter(
        Boolean,
    );

export const hasEvent = (qso: QSO): boolean => allEvents(qso).length > 0;

export const newQsoID = () => uuid.v4() as string;

export const createQso = (callsign: string): QSO => ({
    id: newQsoID(),
    date: DateTime.utc(),
    callsign,
    honeypot: {},
});

export const carryOver = (qso: QSO, previousQSO: QSO, carryOver: (keyof QSO)[] = []): QSO => ({
    ...qso,
    ...Object.fromEntries(
        carryOver
            .map((f) => [
                f,
                previousQSO[f as keyof QSO] !== undefined ? String(previousQSO[f as keyof QSO]) : undefined,
            ])
            .filter(([k, v]) => v !== undefined),
    ),
});

export const prefillSameCallsign = (qso: QSO, previousQSO: QSO): QSO => ({
    ...qso,
    ...Object.fromEntries(
        (["name", "qth", "country", "continent", "state", "dxcc", "cqzone", "ituzone", "locator"] as (keyof QSO)[])
            .map((f) => (previousQSO[f] ? [f, previousQSO[f]] : [f, undefined]))
            .filter(([k, v]) => !!v),
    ),
});

export const prefillMyStation = (
    qso: QSO,
    myStation: Partial<{
        myQth: string;
        myLocator: string;
        myCallsign: string;
        myRig: string;
        myAntenna: string;
        myState: string;
        myCountry: string;
    }>,
): QSO => ({
    ...qso,
    myQth: qso.myQth || myStation.myQth,
    myLocator: qso.myLocator || myStation.myLocator,
    myCallsign: qso.myCallsign || myStation.myCallsign,
    myRig: qso.myRig || myStation.myRig,
    myAntenna: qso.myAntenna || myStation.myAntenna,
    myState: qso.myState || myStation.myState,
    myCountry: qso.myCountry || myStation.myCountry,
});

export const prefillOperating = (
    qso: QSO,
    operating: Partial<{
        frequency: number;
        mode: Mode;
        band: Band;
    }>,
): QSO => ({
    ...qso,
    frequency: qso.frequency || operating.frequency || band2freq(operating.band),
    mode: qso.mode || operating.mode,
    band: qso.band || operating.band || freq2band(operating.frequency) || "20m",
    rst_received: qso.rst_received || isDigital(operating.mode) ? "-1" : "59",
    rst_sent: qso.rst_sent || isDigital(operating.mode) ? "-1" : "59",
});

export const prefillLocation = (qso: QSO) => {
    const parsed = parseCallsign(qso.callsign);
    const callsignData = getCallsignData(qso.callsign);
    const locator = qso.locator || callsignData?.gs;
    return {
        ...qso,
        locator: qso.locator || locator,
        prefix: qso.prefix || (parsed && `${parsed.prefix}${parsed.index}`),
        state: qso.state || callsignData?.state,
        continent: qso.continent || callsignData?.ctn,
        country: qso.country || callsignData?.iso3,
        ...(qso.myLocator && locator
            ? {
                  distance: qso.distance || maidenDistance(qso.myLocator, locator),
              }
            : {}),
        ...(locator
            ? {
                  dxcc: qso.dxcc || +(callsignData?.dxcc || findZone(dxcc, maidenhead2Latlong(locator))),
                  ituzone: qso.ituzone || +findZone(ituzones, maidenhead2Latlong(locator)),
                  cqzone: qso.cqzone || +findZone(cqzones, maidenhead2Latlong(locator)),
              }
            : { dxcc: qso.dxcc || (callsignData ? +callsignData.dxcc : undefined) }),
    };
};

export const extrapolate = (qso: QSO, qsos: QSO[], carryOverFields: (keyof QSO)[]): QSO => {
    if (qsos.length) qso = carryOver(qso, qsos[0], carryOverFields);

    const lastQsoWithCallsign = qsos.filter((q) => baseCallsign(q.callsign) === baseCallsign(qso.callsign));
    if (lastQsoWithCallsign.length) qso = prefillSameCallsign(qso, lastQsoWithCallsign[0]);

    return prefillLocation(qso);
};

const dt2mn = (dt1: DateTime, dt2: DateTime) => Math.abs(dt1.diff(dt2, ["minutes"]).toObject().minutes as number);

export const findMatchingQsos = (qsos: QSO[], data: QSO, threshold: number = 20): QSO[] =>
    qsos.filter(
        (q) => baseCallsign(q.callsign) === baseCallsign(data.callsign) && dt2mn(q.date, data.date) < threshold,
    );

export const findMatchingQso = (qsos: QSO[], data: QSO): QSO | null =>
    findMatchingQsos(qsos, data).sort((qa, qb) => dt2mn(qa.date, data.date) - dt2mn(qb.date, data.date))[0] || null;
