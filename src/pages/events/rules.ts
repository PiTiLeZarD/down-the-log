import { DateTime } from "luxon";
import iotaData from "../../data/iota.json";
import potaData from "../../data/pota.json";
import wwffData from "../../data/wwff.json";
import { RecordMassageFn } from "../../utils/adif";
import { clusterByDate, groupBy } from "../../utils/arrays";
import { QSO } from "../../utils/qso";

export const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const events = ["wwff", "pota", "sota", "iota", "sig"] as const;
export type EventType = (typeof events)[number];
export type EventStatus = "None" | "Activated" | "WIP";
export type EventActivation = { status: EventStatus; qsos: QSO[] };
export type EventActivations = Record<string, Record<string, EventActivation>>;

export const allReferencesActivated = (qsos: QSO[], event: EventType): Record<string, QSO[]> => {
    const key = `my${capitalise(event)}` as keyof QSO;
    return groupBy(
        qsos.filter((q) => !!q[key]),
        (q) => q[key] as string,
    );
};

const dtFormat = "yyyyMMdd";
const groupByDate = (qsos: QSO[]): Record<string, QSO[]> =>
    Object.fromEntries(
        clusterByDate(qsos, (o) => o.date, 1000 * 60 * 30).map((group) => [group[0].date.toFormat(dtFormat), group]),
    );
const groupByUtcDay = (qsos: QSO[]): Record<string, QSO[]> => groupBy(qsos, (q) => q.date.toFormat(dtFormat));

const grouping = {
    wwff: groupByDate,
    pota: groupByUtcDay,
    sota: groupByDate,
    iota: groupByDate,
    sig: groupByDate,
};

export type EventRule = (qsos: QSO[]) => EventStatus;
const rules: Record<EventType, EventRule> = {
    wwff: (qsos: QSO[]) => (qsos.length >= 44 ? "Activated" : "WIP"),
    pota: (qsos: QSO[]) => (qsos.length >= 10 ? "Activated" : "WIP"),
    sota: (qsos: QSO[]) => (qsos.length >= 4 ? "Activated" : "WIP"),
    iota: (qsos: QSO[]) => (qsos.length >= 10 ? "Activated" : "WIP"),
    sig: (qsos: QSO[]) => (qsos.length >= 10 ? "Activated" : "WIP"),
};

export const getActivations = (event: EventType, qsos: QSO[]): EventActivations =>
    Object.fromEntries(
        Object.entries(allReferencesActivated(qsos, event)).map(([ref, refQsos]) => [
            ref,
            Object.fromEntries(
                Object.entries(grouping[event](refQsos)).map(([date, refDateQsos]) => [
                    date,
                    {
                        status: rules[event](refDateQsos),
                        qsos: refDateQsos,
                    },
                ]),
            ),
        ]),
    );

export const eventDataMap: Record<EventType, Record<string, { name: string; locator?: string }>> = {
    wwff: wwffData,
    pota: potaData,
    sota: {},
    iota: iotaData,
    sig: {},
};

export type EventNameFn = (qsos: QSO[]) => string;
export const eventFileNameMap: Record<EventType, EventNameFn> = {
    wwff: (qsos) => `${qsos[0].myCallsign} @ ${qsos[0].myWwff} ${DateTime.local().toFormat("yyyyMMdd")}.adif`,
    pota: (qsos) => `${qsos[0].myCallsign}@${qsos[0].myPota}_${DateTime.local().toFormat("yyyyMMdd")}.adif`,
    sota: (qsos) => `${qsos[0].myCallsign}@${qsos[0].mySota}_${DateTime.local().toFormat("yyyyMMdd")}.adif`,
    iota: (qsos) => `${qsos[0].myCallsign}@${qsos[0].myIota}_${DateTime.local().toFormat("yyyyMMdd")}.adif`,
    sig: (qsos) => `sig_${DateTime.local().toFormat("yyyyMMdd")}.adif`,
};

export const eventDataMassageMap: Record<EventType, RecordMassageFn> = {
    wwff: (r) => {
        if (r.my_wwff_ref) {
            r.my_sig = "WWFF";
            r.my_sig_info = r.my_wwff_ref;
        }
        if (r.wwff_ref) {
            r.sig = "WWFF";
            r.sig_info = r.wwff_ref;
        }
        return r;
    },
    pota: (r) => {
        if (r.my_pota_ref) {
            r.my_sig = "POTA";
            r.my_sig_info = r.my_pota_ref;
        }
        if (r.pota_ref) {
            r.sig = "POTA";
            r.sig_info = r.pota_ref;
        }
        return r;
    },
    sota: (r) => r,
    iota: (r) => r,
    sig: (r) => r,
};
