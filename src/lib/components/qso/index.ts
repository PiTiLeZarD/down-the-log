import humanize from "humanize-duration";
import { DateTime, Interval } from "luxon";
import { useMemo } from "react";
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
import type { Session } from "../../utils/session";
import { Settings, useStore } from "../../utils/store";

// sort() is in-place, so sorting the array zustand handed us would reorder the store itself.
// Copy first, and memoise so every consumer doesn't re-sort the whole log on each render.
export const useQsos = (): QSO[] => {
    const qsos = useStore((state) => state.qsos);
    return useMemo(() => [...qsos].sort((q1, q2) => (q1.date <= q2.date ? 1 : -1)), [qsos]);
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
    // Which operating session logged this. See utils/session.
    sessionId?: string;
    contestId?: string;
    // Contest exchange. The serials are the numbered ones; the strings carry anything else — a
    // section, a zone, an age — and either pair may be used on its own.
    stx?: number;
    srx?: number;
    stxString?: string;
    srxString?: string;
    // `field:code` keys of the data issues the operator has decided are fine on this QSO. See qso-issues.
    ignoredIssues?: string[];
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

// Values are copied as they are: running them through String() turned a carried power or frequency
// into "5" / "14.2", which then no longer matched the number the rest of the QSO type expects.
export const carryOver = (qso: QSO, previousQSO: QSO, carryOver: (keyof QSO)[] = []): QSO => ({
    ...qso,
    ...Object.fromEntries(carryOver.map((f) => [f, previousQSO[f]]).filter(([, v]) => v !== undefined)),
});

/**
 * Stamps the running session onto a QSO.
 *
 * "override" is the reset path: the session is the authority for the fields it holds, so it runs
 * after `carryOver` and beats whatever the last QSO dragged in. "fill" is the log path — by then the
 * operator may have deliberately changed one of those fields on this QSO and that has to survive, so
 * only blanks are patched. Either way the QSO comes out stamped with the session id.
 */
export const prefillSession = (qso: QSO, session?: Session, mode: "override" | "fill" = "override"): QSO => {
    if (!session) return qso;

    const defaults = Object.fromEntries(
        Object.entries(session.defaults).filter(
            ([field, value]) =>
                value !== undefined && value !== "" && (mode === "override" || qso[field as keyof QSO] === undefined),
        ),
    );

    return {
        ...qso,
        ...defaults,
        sessionId: session.id,
        ...(session.contest
            ? {
                  contestId: session.contest.contestId || qso.contestId,
                  stxString: session.contest.exchangeSent || qso.stxString,
              }
            : {}),
    };
};

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

// What the settings know about the operator, in the shape prefillMyStation wants. Everything else on
// the station — rig, antenna, QTH, country — only ever comes from the previous QSO's carry-over, so
// the first QSO of a log has them empty and MyStation flags that.
export const myStationFromSettings = (settings: Settings, currentLocation?: string) => ({
    myCallsign: settings.myCallsign,
    myLocator: settings.myGridsquare || currentLocation,
    // Which country the operator is licensed in is the best guess available for where they're
    // transmitting from, and it's right until they take the callsign abroad.
    myCountry: getCallsignData(settings.myCallsign)?.iso3,
});

export const prefillOperating = (
    qso: QSO,
    operating: Partial<{
        frequency: number;
        mode: Mode;
        band: Band;
    }>,
): QSO => {
    // The report scale follows whatever mode the QSO ends up on, not what the caller passed as the
    // operating default: a carried-over mode wins over it, and reading `operating.mode` here logged
    // FT8 QSOs with a 59.
    const mode = qso.mode || operating.mode;
    const defaultRst = isDigital(mode) ? "-1" : "59";
    return {
        ...qso,
        frequency: qso.frequency || operating.frequency || band2freq(operating.band),
        mode,
        band: qso.band || operating.band || freq2band(operating.frequency) || "20m",
        // The ternary needs the parens: || binds tighter, so without them an already-filled
        // report would make the whole condition truthy and get overwritten with "-1".
        rst_received: qso.rst_received || defaultRst,
        rst_sent: qso.rst_sent || defaultRst,
    };
};

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

export const extrapolate = (qso: QSO, qsos: QSO[], carryOverFields: (keyof QSO)[], session?: Session): QSO => {
    if (qsos.length) qso = carryOver(qso, qsos[0], carryOverFields);

    const lastQsoWithCallsign = qsos.filter((q) => baseCallsign(q.callsign) === baseCallsign(qso.callsign));
    if (lastQsoWithCallsign.length) qso = prefillSameCallsign(qso, lastQsoWithCallsign[0]);

    // Last, and only filling blanks. The form was already reset with the session's values in
    // "override" mode, so anything different in here is something the operator typed on purpose;
    // this pass is what stamps the session id and catches fields the carry-over left empty.
    qso = prefillSession(qso, session, "fill");

    return prefillLocation(qso);
};

const dt2mn = (dt1: DateTime, dt2: DateTime) => Math.abs(dt1.diff(dt2, ["minutes"]).toObject().minutes as number);

// Callers like the duplicate filter and ADIF import ask for matches once per QSO, which used to
// scan the whole log every time. Bucket by base callsign instead, keyed on the array identity so
// the index is built once per log. The store never mutates its arrays in place, so a new log means
// a new reference and a fresh index.
const callsignIndexes = new WeakMap<QSO[], Map<string | undefined, QSO[]>>();

export const qsosByCallsign = (qsos: QSO[]): Map<string | undefined, QSO[]> => {
    const cached = callsignIndexes.get(qsos);
    if (cached) return cached;

    const index = new Map<string | undefined, QSO[]>();
    // Unparseable callsigns all land in the undefined bucket, which keeps the old
    // baseCallsign(a) === baseCallsign(b) behaviour of matching each other.
    qsos.forEach((q) => {
        const key = baseCallsign(q.callsign);
        const bucket = index.get(key);
        if (bucket) bucket.push(q);
        else index.set(key, [q]);
    });
    callsignIndexes.set(qsos, index);
    return index;
};

export const findMatchingQsos = (qsos: QSO[], data: QSO, threshold: number = 20): QSO[] =>
    (qsosByCallsign(qsos).get(baseCallsign(data.callsign)) || []).filter((q) => dt2mn(q.date, data.date) < threshold);

export const findMatchingQso = (qsos: QSO[], data: QSO): QSO | null =>
    findMatchingQsos(qsos, data).sort((qa, qb) => dt2mn(qa.date, data.date) - dt2mn(qb.date, data.date))[0] || null;
