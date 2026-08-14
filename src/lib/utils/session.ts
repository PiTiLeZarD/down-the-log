import { DateTime } from "luxon";
import uuid from "react-native-uuid";
// Type only: the QSO module pulls the store in behind it, and the store imports this file.
import type { QSO } from "../components/qso";
import type { IconName } from "../ui/icon";
import { baseCallsign } from "./callsign";
import { EventStatus, EventType, capitalise, rules, targets } from "./event-rules";

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

const station: (keyof QSO)[] = ["power", "myRig", "myAntenna", "band", "mode"];

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
        fields: ["contestId", "band", "mode", "power", "myLocator", "myCallsign"],
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

// Band and mode are part of the key: the same station worked again on another band isn't a dupe in
// any contest that scores per band.
export const sessionDupeKey = (qso: Pick<QSO, "callsign" | "band" | "mode">): string =>
    `${baseCallsign(qso.callsign) || qso.callsign.toUpperCase()}|${qso.band || ""}|${qso.mode || ""}`;

export const sessionDupeKeys = (qsos: QSO[]): Set<string> => new Set(qsos.map(sessionDupeKey));

// Fields a session can hold defaults for. Same list as the carry-over setting — a session is the
// same idea made explicit and time-boxed — plus what only a contest needs.
export const sessionFields: (keyof QSO)[] = [
    "frequency",
    "band",
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
    if (field === "frequency") return `${value}MHz`;
    return String(value);
};
