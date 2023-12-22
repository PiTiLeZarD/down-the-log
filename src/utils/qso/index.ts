import { DateTime } from "luxon";
import uuid from "react-native-uuid";
import cqzones from "../../data/cqzones.json";
import dxcc from "../../data/dxcc.json";
import ituzones from "../../data/ituzones.json";
import { useStore } from "../../store";
import { findCountry, getCallsignData, parseCallsign } from "../callsign";
import { maidenhead2Latlong } from "../locator";
import { findZone } from "../polydec";

export const useQsos = (): QSO[] => {
    const qsos = useStore((state) => state.qsos);
    return qsos.sort((q1, q2) => (q1.date <= q2.date ? 1 : -1));
};

export type QSO = {
    id: string;
    position?: number;
    date: DateTime;
    callsign: string;
    dxcc?: number;
    prefix?: string;
    cqzone?: number;
    ituzone?: number;
    continent?: "NA" | "SA" | "EU" | "AF" | "OC" | "AS" | "AN";
    state?: string;
    rst_sent?: string;
    rst_received?: string;
    name?: string;
    frequency?: number;
    mode?: "SSB" | "FM" | "AM" | "CW";
    power?: number;
    myQth?: string;
    myLocator?: string;
    qth?: string;
    locator?: string;
    note?: string;
    eqsl_received?: boolean;
    eqsl_sent?: boolean;
    lotw_received?: boolean;
    lotw_sent?: boolean;
};

export const newQso = (callsign: string, qsos: QSO[], currentLocation?: string, qsoLocator?: string): QSO => {
    const parsed = parseCallsign(callsign);
    const callsignData = getCallsignData(callsign);
    const previousQsosWithCallsign = qsos.filter((q) => q.callsign === callsign);
    const locator = qsoLocator || callsignData?.gs;

    return {
        callsign,
        id: uuid.v4() as string,
        date: DateTime.now(),
        myLocator: currentLocation,
        prefix: parsed && `${parsed.prefix}${parsed.index}`,
        locator: locator,
        state: callsignData?.state,
        continent: callsignData?.ctn,
        qth: findCountry(callsignData)?.name,
        ...(locator
            ? {
                  dxcc: +(callsignData?.dxcc || findZone(dxcc, maidenhead2Latlong(locator))),
                  ituzone: +findZone(ituzones, maidenhead2Latlong(locator)),
                  cqzone: +findZone(cqzones, maidenhead2Latlong(locator)),
              }
            : { dxcc: callsignData ? +callsignData.dxcc : undefined }),
        ...(qsos.length ? { frequency: qsos[0].frequency, mode: qsos[0].mode, power: qsos[0].power } : {}),
        ...(previousQsosWithCallsign.length ? { name: previousQsosWithCallsign[0].name } : {}),
    };
};

export const findMatchingQso = (qsos: QSO[], data: QSO): QSO | null =>
    qsos.filter(
        (q) => q.callsign === data.callsign && Math.abs(q.date.diff(data.date).toObject().minutes || 100) < 10,
    )[0] || null;
