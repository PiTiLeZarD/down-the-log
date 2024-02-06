import { DateTime } from "luxon";
import { QSO } from "../components/qso";
import { ReferenceDatum } from "../components/reference-info";
import iotaData from "../data/iota.json";
import potaData from "../data/pota.json";
import sotaData from "../data/sota.json";
import wwffData from "../data/wwff.json";
import { RecordMassageFn } from "./adif";
import { clusterByDate, groupBy } from "./arrays";

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

export const dtFormat = "yyyyMMdd";
export type EventGrouping = (qsos: QSO[]) => Record<string, QSO[]>;
const groupByActivation: EventGrouping = (qsos) =>
    clusterByDate(qsos, (o) => o.date, 1000 * 60 * 60 * 5).reduce(
        (groups, qsos) => ({
            ...groups,
            [qsos[0].date.toFormat(dtFormat)]: [
                ...(groups[qsos[0].date.toFormat(dtFormat) as keyof typeof groups] || []),
                ...qsos,
            ],
        }),
        {},
    );
const groupByUtcDay: EventGrouping = (qsos) => groupBy(qsos, (q) => q.date.toFormat(dtFormat));
const groupAllQsos: EventGrouping = (qsos) => ({ all: qsos });

const grouping = {
    wwff: groupByActivation,
    pota: groupByUtcDay,
    sota: groupByActivation,
    iota: groupAllQsos,
    sig: groupByActivation,
};

export type EventRule = (qsos: QSO[], max?: number) => EventStatus;
export const rules: Record<EventType, EventRule> = {
    wwff: (qsos: QSO[], max = 44) => (qsos.length >= max ? "Activated" : "WIP"),
    pota: (qsos: QSO[]) => (qsos.length >= 10 ? "Activated" : "WIP"),
    sota: (qsos: QSO[]) => (qsos.length >= 4 ? "Activated" : "WIP"),
    iota: (qsos: QSO[]) => (qsos.length >= 0 ? "Activated" : "WIP"),
    sig: (qsos: QSO[]) => (qsos.length >= 0 ? "Activated" : "WIP"),
};

export const getActivations = (event: EventType, qsos: QSO[], max?: number): EventActivations =>
    Object.fromEntries(
        Object.entries(allReferencesActivated(qsos, event)).map(([ref, refQsos]) => [
            ref,
            Object.fromEntries(
                Object.entries(grouping[event](refQsos)).map(([date, refDateQsos]) => [
                    date,
                    {
                        status: rules[event](refDateQsos, max),
                        qsos: refDateQsos,
                    },
                ]),
            ),
        ]),
    );

export const eventDataMap: Record<EventType, Record<string, ReferenceDatum>> = {
    wwff: wwffData as Record<string, ReferenceDatum>,
    pota: potaData as Record<string, ReferenceDatum>,
    sota: sotaData as Record<string, ReferenceDatum>,
    iota: iotaData as Record<string, ReferenceDatum>,
    sig: {} as Record<string, ReferenceDatum>,
};

export type EventNameFn = (qsos: QSO[]) => string;
export const eventFileNameMap: Record<EventType, EventNameFn> = {
    wwff: (qsos) => `${qsos[0].myCallsign} @ ${qsos[0].myWwff} ${DateTime.local().toFormat("yyyyMMdd")}.adif`,
    pota: (qsos) => `${qsos[0].myCallsign}@${qsos[0].myPota}_${DateTime.local().toFormat("yyyyMMdd")}.adif`,
    sota: (qsos) => `${qsos[0].myCallsign}@${qsos[0].mySota}_${DateTime.local().toFormat("yyyyMMdd")}.adif`,
    iota: (qsos) => `${qsos[0].myCallsign}@${qsos[0].myIota}_${DateTime.local().toFormat("yyyyMMdd")}.adif`,
    sig: () => `sig_${DateTime.local().toFormat("yyyyMMdd")}.adif`,
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
