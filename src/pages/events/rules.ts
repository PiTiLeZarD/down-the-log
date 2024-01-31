import { DateTime } from "luxon";
import iotaData from "../../data/iota.json";
import potaData from "../../data/pota.json";
import wwffData from "../../data/wwff.json";
import { RecordMassageFn } from "../../utils/adif";
import { groupBy, unique } from "../../utils/arrays";
import { QSO } from "../../utils/qso";

export const events = ["wwff", "pota", "sota", "iota", "sig"] as const;
export type EventType = (typeof events)[number];
export type EventStatus = "None" | "Activated" | "WIP";
export type EventRule = (qsos: QSO[], reference: string) => EventStatus;

export const wwff: EventRule = (qsos, reference) => {
    const countRef = qsos.filter((q) => q.myWwff === reference).length;
    if (countRef === 0) return "None";
    if (countRef >= 44) return "Activated";
    return "WIP";
};

export const pota: EventRule = (qsos, reference) => {
    const activations = groupBy(
        qsos.filter((q) => q.myPota === reference),
        (q) => q.date.toFormat("yyyyMMdd"),
    );
    if (Object.keys(activations).length === 0) return "None";
    if (
        Object.values(activations)
            .map((qs) => qs.length)
            .some((n) => n >= 10)
    )
        return "Activated";
    return "WIP";
};

export const sota: EventRule = (qsos, reference) => {
    const countRef = qsos.filter((q) => q.mySota === reference).length;
    if (countRef === 0) return "None";
    if (countRef >= 4) return "Activated";
    return "WIP";
};

export const iota: EventRule = (qsos, reference) => {
    const countRef = qsos.filter((q) => q.myIota === reference).length;
    if (countRef === 0) return "None";
    return "Activated";
};

export const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const qsosForReference = (qsos: QSO[], event: EventType, reference: string): QSO[] =>
    qsos.filter((q) => reference === (q[`my${capitalise(event)}` as keyof QSO] as string));

export const allReferencesActivated = (qsos: QSO[], type: EventType): string[] =>
    unique(qsos.map((q) => q[`my${capitalise(type)}` as keyof QSO] as string).filter((r) => !!r && !!r.trim())).sort();

export const eventRuleMap: Record<EventType, EventRule> = {
    wwff,
    pota,
    sota,
    iota,
    sig: () => "None",
};

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
