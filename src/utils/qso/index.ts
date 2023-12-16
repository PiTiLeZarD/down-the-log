import { DateTime } from "luxon";
import uuid from "react-native-uuid";
import { useStore } from "../../store";
import { findCountry, getCallsignData } from "../callsign";

export const useQsos = (): QSO[] => {
    const qsos = useStore((state) => state.qsos);
    return qsos.sort((q1, q2) => (q1.date <= q2.date ? 1 : -1));
};

export type QSO = {
    id: string;
    date: DateTime;
    callsign: string;
    name?: string;
    frequency?: number;
    mode?: "SSB" | "FM" | "AM" | "CW";
    power?: number;
    myQth: string;
    qth?: string;
    locator?: string;
    note?: string;
};

export const newQso = (callsign: string, currentLocation: string, qsos: QSO[]): QSO => {
    const callsignData = getCallsignData(callsign);
    const previousQsosWithCallsign = qsos.filter((q) => q.callsign === callsign);

    return {
        callsign,
        id: uuid.v4() as string,
        date: DateTime.now(),
        myQth: currentLocation,
        locator: callsignData?.gs,
        qth: findCountry(callsignData)?.name,
        ...(qsos.length ? { frequency: qsos[0].frequency, mode: qsos[0].mode, power: qsos[0].power } : {}),
        ...(previousQsosWithCallsign.length ? { name: previousQsosWithCallsign[0].name } : {}),
    };
};

export const findMatchingQso = (qsos: QSO[], data: QSO): QSO | null =>
    qsos.filter(
        (q) => q.callsign === data.callsign && Math.abs(q.date.diff(data.date).toObject().minutes || 100) < 10,
    )[0] || null;
