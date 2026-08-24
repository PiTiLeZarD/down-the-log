import { DateTime } from "luxon";
import uuid from "react-native-uuid";
// Type only: the QSO module pulls the store in behind it, and the store imports this file.
import type { QSO } from "../components/qso";
import type { IconName } from "../ui/icon";
import { freq2band } from "../data/bands";
import { baseCallsign } from "./callsign";
import {
    EventStatus,
    EventType,
    allReferencesActivated,
    capitalise,
    rules,
    sessionGrouping,
    targets,
} from "./event-rules";

/**
 * A session is one outing: a park activation, a summit, a contest, or just an afternoon at the desk.
 * It owns a set of QSO fields — the park reference, the power, the rig — and stamps them onto every
 * QSO logged while it runs, so the operator sets them once instead of trusting `settings.carryOver`
 * not to drift. It replaces the old `settings.contestMode` boolean, whose two behaviours now live on
 * the session as `quickLog` and `plainRst`.
 */
export type SessionTemplate = "pota" | "wwff" | "sota" | "iota" | "contest" | "casual";

export type SessionContest = {
    contestId?: string;
    // The serial the *next* QSO will send. Bumped as each QSO is logged.
    serial: number;
    exchangeSent?: string;
};

export type Session = {
    id: string;
    name: string;
    template: SessionTemplate;
    startedAt: DateTime;
    endedAt?: DateTime;
    // What gets written onto each QSO.
    defaults: Partial<QSO>;
    // Which of those the session bar shows as chips, in order. Kept apart from `defaults` so a field
    // can be offered for editing before it has a value.
    fields: (keyof QSO)[];
    // No detail page after logging — the contest behaviour, useful for any run of quick QSOs.
    quickLog: boolean;
    // Type the report rather than picking it apart in the Signal modal.
    plainRst: boolean;
    contest?: SessionContest;
};

export type TemplateDef = {
    label: string;
    icon: IconName;
    // Which activation program the session counts towards, if any. Drives the progress readout.
    event?: EventType;
    fields: (keyof QSO)[];
    quickLog: boolean;
    plainRst: boolean;
    contest: boolean;
};

// Frequency, not band: the session holds what the radio is set to, and the band reads off it.
const station: (keyof QSO)[] = ["power", "myRig", "myAntenna", "frequency", "mode"];

export const templates: Record<SessionTemplate, TemplateDef> = {
    pota: {
        label: "POTA",
        icon: "leaf",
        event: "pota",
        fields: ["myPota", "myQth", "myLocator", ...station],
        quickLog: false,
        plainRst: false,
        contest: false,
    },
    wwff: {
        label: "WWFF",
        icon: "flower",
        event: "wwff",
        fields: ["myWwff", "myQth", "myLocator", ...station],
        quickLog: false,
        plainRst: false,
        contest: false,
    },
    sota: {
        label: "SOTA",
        icon: "triangle",
        event: "sota",
        fields: ["mySota", "myQth", "myLocator", ...station],
        quickLog: false,
        plainRst: false,
        contest: false,
    },
    iota: {
        label: "IOTA",
        icon: "boat",
        event: "iota",
        fields: ["myIota", "myQth", "myLocator", "power", "myRig", "myAntenna"],
        quickLog: false,
        plainRst: false,
        contest: false,
    },
    contest: {
        label: "Contest",
        icon: "trophy",
        fields: ["contestId", "frequency", "mode", "power", "myLocator", "myCallsign"],
        quickLog: true,
        plainRst: true,
        contest: true,
    },
    casual: {
        label: "Casual",
        icon: "home",
        fields: ["power", "myRig", "myAntenna"],
        quickLog: false,
        plainRst: false,
        contest: false,
    },
};

export const sessionTemplates = Object.keys(templates) as SessionTemplate[];

// The reference field a template's activation hangs off, e.g. pota -> myPota.
export const templateRefField = (template: SessionTemplate): keyof QSO | undefined => {
    const { event } = templates[template];
    return event ? (`my${capitalise(event)}` as keyof QSO) : undefined;
};

export const newSession = (template: SessionTemplate, defaults: Partial<QSO> = {}): Session => {
    const def = templates[template];
    return {
        id: uuid.v4() as string,
        name: "",
        template,
        startedAt: DateTime.utc(),
        defaults,
        fields: [...def.fields],
        quickLog: def.quickLog,
        plainRst: def.plainRst,
        ...(def.contest ? { contest: { serial: 1 } } : {}),
    };
};

// A session started from a previous one keeps what it was set up with, not where it got to: a fresh
// id so the QSOs don't merge into the old activation, and a serial back at 1.
export const resumedSession = (session: Session): Session => ({
    ...session,
    id: uuid.v4() as string,
    startedAt: DateTime.utc(),
    endedAt: undefined,
    ...(session.contest ? { contest: { ...session.contest, serial: 1 } } : {}),
});

// What the bar and the sessions list call it: whatever the operator typed, else the reference it's
// activating or the contest it's in, else just the template.
export const sessionName = (session: Session): string => {
    if (session.name) return session.name;
    const refField = templateRefField(session.template);
    const ref = refField ? (session.defaults[refField] as string | undefined) : undefined;
    return ref || session.contest?.contestId || templates[session.template].label;
};

// Name plus start date. The filter list shows the values it matches on, so a session has to be
// identifiable from the string alone — a raw id isn't, and a bare name repeats across outings.
export const sessionLabel = (session: Session): string =>
    `${sessionName(session)} ${session.startedAt.toFormat("dd/MM/yy")}`;

// Built once per sessions array, the way the callsign index is: the QSO filter asks for a label per
// QSO and a scan of the sessions each time would be quadratic over a long log.
const labelIndexes = new WeakMap<Session[], Record<string, string>>();

export const sessionLabels = (sessions: Session[]): Record<string, string> => {
    const cached = labelIndexes.get(sessions);
    if (cached) return cached;

    const index = Object.fromEntries(sessions.map((s) => [s.id, sessionLabel(s)]));
    labelIndexes.set(sessions, index);
    return index;
};

export const sessionQsos = (qsos: QSO[], session?: Session): QSO[] =>
    session ? qsos.filter((q) => q.sessionId === session.id) : [];

export type SessionProgress = { count: number; target?: number; status?: EventStatus };

export const activationProgress = (session: Session, qsos: QSO[]): SessionProgress => {
    const sessionsQsos = sessionQsos(qsos, session);
    const { event } = templates[session.template];
    if (!event) return { count: sessionsQsos.length };
    return { count: sessionsQsos.length, target: targets[event], status: rules[event](sessionsQsos) };
};

/**
 * Every past activation that predates sessions, turned into one.
 *
 * Sessions arrived after years of logging, so the old outings are only visible as clusters of QSOs
 * sharing a reference — the Events screen works them out on the fly. This walks the same clusters
 * and gives each one a real session, so it shows up on the sessions list and can be exported or
 * resumed like anything logged since.
 *
 * A QSO already carrying a `sessionId` is left alone, and one that qualifies under two programs at
 * once — a park inside a WWFF reference — is claimed by the first template that sees it rather than
 * split across two sessions. Nothing is written here: the caller gets the new sessions and the QSOs
 * to store back, so an empty result costs nothing.
 */
export const backfillSessions = (qsos: QSO[]): { sessions: Session[]; qsos: QSO[] } => {
    const claimedBy = new Map<string, string>();
    const sessions: Session[] = [];

    for (const template of sessionTemplates) {
        const { event, fields } = templates[template];
        if (!event) continue;

        for (const refQsos of Object.values(allReferencesActivated(qsos, event))) {
            for (const group of Object.values(sessionGrouping[event](refQsos))) {
                const orphans = group
                    .filter((q) => !q.sessionId && !claimedBy.has(q.id))
                    .sort((q1, q2) => q1.date.toMillis() - q2.date.toMillis());
                if (!orphans.length) continue;

                // The outing's own clock, not now: a backfilled session sorts and reads as the day
                // it happened. The first QSO stands in for the setup, being the only record of it.
                const defaults = Object.fromEntries(
                    fields
                        .map((field) => [field, orphans[0][field]] as const)
                        .filter(([, value]) => value !== undefined && value !== ""),
                ) as Partial<QSO>;
                const session: Session = {
                    ...newSession(template, defaults),
                    startedAt: orphans[0].date,
                    endedAt: orphans[orphans.length - 1].date,
                };

                sessions.push(session);
                orphans.forEach((q) => claimedBy.set(q.id, session.id));
            }
        }
    }

    return {
        sessions,
        qsos: qsos.filter((q) => claimedBy.has(q.id)).map((q) => ({ ...q, sessionId: claimedBy.get(q.id) })),
    };
};

// Band and mode are part of the key: the same station worked again on another band isn't a dupe in
// any contest that scores per band.
export const sessionDupeKey = (qso: Pick<QSO, "callsign" | "band" | "mode">): string =>
    `${baseCallsign(qso.callsign) || qso.callsign.toUpperCase()}|${qso.band || ""}|${qso.mode || ""}`;

export const sessionDupeKeys = (qsos: QSO[]): Set<string> => new Set(qsos.map(sessionDupeKey));

// Fields a session can hold defaults for. Same list as the carry-over setting — a session is the
// same idea made explicit and time-boxed — plus what only a contest needs. No `band`: it isn't a
// field anyone sets, it's what the frequency works out to.
export const sessionFields: (keyof QSO)[] = [
    "frequency",
    "mode",
    "power",
    "myQth",
    "myLocator",
    "myCallsign",
    "myPota",
    "myWwff",
    "mySota",
    "myIota",
    "mySig",
    "mySigInfo",
    "myRig",
    "myAntenna",
    "myState",
    "myCountry",
    "contestId",
    "stxString",
];

/**
 * The fields that only mean anything while one particular session runs: the reference it activates,
 * the contest it's in, and the SIG pair those go out in. Everything else a session holds — rig,
 * antenna, power, band, QTH — is ambient and outlives the outing, so it keeps carrying over.
 */
export const sessionActivityFields: (keyof QSO)[] = [
    "myPota",
    "myWwff",
    "mySota",
    "myIota",
    "mySig",
    "mySigInfo",
    "contestId",
    "stxString",
];

// Carry-over minus the activity fields when the QSO being copied from belongs to a session this one
// doesn't: ending a POTA activation and logging the next QSO used to leave it in the same park.
export const carryOverFields = (
    fields: (keyof QSO)[],
    previousQso?: Pick<QSO, "sessionId">,
    session?: Session,
): (keyof QSO)[] =>
    previousQso?.sessionId && previousQso.sessionId !== session?.id
        ? fields.filter((f) => !sessionActivityFields.includes(f))
        : fields;

export const sessionFieldLabels: Partial<Record<keyof QSO, string>> = {
    frequency: "Frequency",
    band: "Band",
    mode: "Mode",
    power: "Power",
    myQth: "My QTH",
    myLocator: "My Gridsquare",
    myCallsign: "My Callsign",
    myPota: "My POTA",
    myWwff: "My WWFF",
    mySota: "My SOTA",
    myIota: "My IOTA",
    mySig: "My SIG",
    mySigInfo: "My SIG Info",
    myRig: "My Rig",
    myAntenna: "My Antenna",
    myState: "My State",
    myCountry: "My Country",
    contestId: "Contest",
    stxString: "Exchange sent",
};

export const sessionFieldLabel = (field: keyof QSO): string => sessionFieldLabels[field] || field;

// Short enough to sit on a chip: the value alone where it speaks for itself, with a unit where it
// doesn't. An unset field shows its name so the chip is still something to press.
export const sessionChipLabel = (field: keyof QSO, value: unknown): string => {
    if (value === undefined || value === "") return sessionFieldLabel(field);
    if (field === "power") return `${value}W`;
    // Both halves on the one chip, since the band no longer has a chip of its own to sit on.
    if (field === "frequency") return `${freq2band(value as number) || "?"} ${value}MHz`;
    return String(value);
};
