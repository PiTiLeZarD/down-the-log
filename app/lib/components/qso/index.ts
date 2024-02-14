import { DateTime } from "luxon";
import uuid from "react-native-uuid";
import { Band } from "../../data/bands";
import { Continent } from "../../data/callsigns";
import cqzones from "../../data/cqzones.json";
import dxcc from "../../data/dxcc.json";
import ituzones from "../../data/ituzones.json";
import { Mode } from "../../data/modes";
import { CsDataType, baseCallsign, getCallsignData, parseCallsign } from "../../utils/callsign";
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

export const allEvents = (qso: QSO) =>
    [qso.pota, qso.myPota, qso.wwff, qso.myWwff, qso.sota, qso.mySota, qso.sig, qso.mySig, qso.iota, qso.myIota].filter(
        Boolean,
    );

export const hasEvent = (qso: QSO): boolean => allEvents(qso).length > 0;

export const newQsoID = () => uuid.v4() as string;

export const newQso = (
    callsign: string,
    qsos: QSO[],
    myLocator?: string,
    qsoLocator?: string,
    myCallsign?: string,
    carryOver: (keyof QSO)[] = [],
): QSO => {
    const parsed = parseCallsign(callsign);
    const callsignData = getCallsignData(callsign);
    const previousQsosWithCallsign = qsos.filter((q) => q.callsign === callsign);
    const locator = qsoLocator || callsignData?.gs;

    return qsoLocationFill(
        {
            callsign,
            id: newQsoID(),
            date: DateTime.utc(),
            prefix: parsed && `${parsed.prefix}${parsed.index}`,
            locator,
            myLocator,
            myCallsign,
            rst_received: "59",
            rst_sent: "59",
            honeypot: {},
            ...(qsos.length
                ? Object.fromEntries(
                      carryOver.map((f) => [
                          f,
                          qsos[0][f as keyof QSO] !== undefined ? String(qsos[0][f as keyof QSO]) : undefined,
                      ]),
                  )
                : {}),
            ...(previousQsosWithCallsign.length
                ? { name: previousQsosWithCallsign[0].name, qth: previousQsosWithCallsign[0].qth }
                : {}),
        },
        callsignData,
    );
};

export const qsoLocationFill = (qso: QSO, callsignDataProvided?: CsDataType) => {
    const callsignData = callsignDataProvided || getCallsignData(qso.callsign);

    return {
        ...qso,
        state: qso.state || callsignData?.state,
        continent: qso.continent || callsignData?.ctn,
        country: qso.country || callsignData?.iso3,
        ...(qso.myLocator && qso.locator
            ? {
                  distance: qso.distance || maidenDistance(qso.myLocator, qso.locator),
              }
            : {}),
        ...(qso.locator
            ? {
                  dxcc: qso.dxcc || +(callsignData?.dxcc || findZone(dxcc, maidenhead2Latlong(qso.locator))),
                  ituzone: qso.ituzone || +findZone(ituzones, maidenhead2Latlong(qso.locator)),
                  cqzone: qso.cqzone || +findZone(cqzones, maidenhead2Latlong(qso.locator)),
              }
            : { dxcc: qso.dxcc || (callsignData ? +callsignData.dxcc : undefined) }),
    };
};

const dt2mn = (dt1: DateTime, dt2: DateTime) => Math.abs(dt1.diff(dt2, ["minutes"]).toObject().minutes as number);

export const findMatchingQso = (qsos: QSO[], data: QSO): QSO | null =>
    qsos
        .filter((q) => baseCallsign(q.callsign) === baseCallsign(data.callsign) && dt2mn(q.date, data.date) < 20)
        .sort((qa, qb) => dt2mn(qa.date, data.date) - dt2mn(qb.date, data.date))[0] || null;