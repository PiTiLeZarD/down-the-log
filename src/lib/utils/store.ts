import { DateTime } from "luxon";
import { create } from "zustand";
import { combine, devtools } from "zustand/middleware";
// Types only, and deliberately spelled `import type`: a plain import of QsoFilter drags the whole
// component tree in behind it, and the store is imported by just about everything.
import type { QsoFilter } from "../components/filters";
import type { QSO } from "../components/qso";
import type { Band } from "../data/bands";
import type { Mode } from "../data/modes";
import type { HamQTHSettingsType } from "./hamqth";
import type { ClublogSettingsType } from "./clublog";
import type { EqslSettingsType } from "./eqsl";
import type { LotwSettingsType } from "./lotw";
import type { Session } from "./session";
// Runtime import, but a deliberately light one: `spots/types` holds no reference data and pulls in
// nothing but Luxon. The rest of the spots code hangs off ./spots/status, which does.
import {
    defaultSpotFilter,
    migrateSpotFilter,
    type DxCluster,
    type LegacySpotAlert,
    type SelfSpotTarget,
    type SpotFilter,
    type SpotSource,
} from "./spots/types";
import type { TotaView } from "./tota";

// Only the operator's identity lives here. The rest of the station — rig, antenna, QTH, country —
// is per-QSO: there's rarely just one of each, so it's set on the QSO and carried over from there.
export type Settings = {
    myGridsquare?: string;
    myCallsign: string;
    showBeacons: boolean;
    showHeatmap: boolean;
    showSpots: boolean;
    showFilters: boolean;
    // Events list/map choice. It lives here rather than in the page's state so the view survives
    // navigating away; the toggle itself is only rendered on the Events page.
    eventsMap: boolean;
    // Same idea for the Tiles on the Air page, whose second view is the progress poster.
    totaView: TotaView;
    // The day the operator registered with tilesontheair.com, yyyyMMdd. Nothing in a log says it,
    // and their uploader refuses an activation more than 30 days older than it, so the Tiles page
    // asks for it once and hides what the site would never take. See utils/tota.
    totaRegistered?: string;
    imperial: boolean;
    timeoffThreshold: number;
    datemonth: boolean;
    hamqth?: HamQTHSettingsType;
    geocodeMapsCoKey?: string;
    // LoTW website account, needed only to pull confirmations. The password is kept in the device
    // keychain on native like the HamQTH one; it is not the callsign certificate, which this app
    // never holds — see utils/lotw.
    lotw?: LotwSettingsType;
    // How far back the next confirmation pull asks, yyyy-MM-dd. Moved forward after a successful
    // one so a second pull isn't the operator's whole LoTW history again.
    lotwPulledSince?: string;
    // Desktop only: the TQSL Station Location each callsign signs with, by callsign. A callsign with
    // no entry signs with the first location TQSL has for it — see utils/tqsl.
    tqslLocations?: Record<string, string>;
    // eQSL website account, used to pull the inbox and to upload. The password is kept in the device
    // keychain on native, like the LoTW one — see utils/eqsl.
    eqsl?: EqslSettingsType;
    // How far back the next inbox pull asks, yyyyMMdd. Moved forward after a successful one.
    eqslRcvdSince?: string;
    // Club Log account, used only to upload. The password is kept in the device keychain on native,
    // like the eQSL one — see utils/clublog.
    clublog?: ClublogSettingsType;
    // Which spot networks are polled. SOTAwatch isn't among them yet — see utils/spots/sota.
    spotSources: SpotSource[];
    // Drives the Spots page, the spots bar and the alerts alike — see utils/spots/types.
    spotFilter: SpotFilter;
    // Notify on new spots that pass `spotFilter`.
    spotAlertsEnabled: boolean;
    // Desktop only: the telnet clusters to log in to. Their spots arrive as the "dx" source.
    dxClusters: DxCluster[];
    // Where "Spot me" posts. Empty means the button asks before it can do anything.
    selfSpotTargets: SelfSpotTarget[];
    // ParksnPeaks account, needed only to post spots. The key is treated as a credential: on native
    // it lives in the Keychain rather than the settings blob, like the HamQTH password.
    pnpUserId?: string;
    pnpApiKey?: string;
    favouriteModes: Mode[];
    favouriteBands: Band[];
    inputBarConfig: (keyof QSO)[];
    carryOver: (keyof QSO)[];
};

const defaultSettings: Settings = {
    myCallsign: "",
    showBeacons: false,
    showHeatmap: false,
    showSpots: false,
    spotSources: ["pota", "pnp"],
    spotFilter: defaultSpotFilter,
    spotAlertsEnabled: false,
    selfSpotTargets: [],
    dxClusters: [],
    imperial: false,
    datemonth: false,
    timeoffThreshold: 10,
    showFilters: false,
    eventsMap: false,
    totaView: "list",
    favouriteBands: [],
    favouriteModes: [],
    inputBarConfig: [],
    carryOver: [
        "frequency",
        "band",
        "mode",
        "power",
        "myCountry",
        "myState",
        "myQth",
        "myPota",
        "myWwff",
        "mySota",
        "myIota",
        "mySig",
        "mySigInfo",
        "myRig",
        "myAntenna",
    ],
};

// Settings that no longer exist, dropped on the way out of storage. `contestMode` became a session:
// it only ever drove two bits of UI, so there is nothing to migrate — the operator starts a contest
// session instead. See utils/session.
// `totaMap` was the Tiles page's list/map boolean. The poster replaced that map — it says which
// tiles are covered, which is what the map was being read for — and the list is still the default,
// so a stored `false` needs nothing carried over and a stored `true` has nowhere to go.
// `lotwQslSince` was the LoTW pull window, moved forward by pulls that read every confirmation as
// nothing to confirm (see confirmQso in components/qsl). Dropping it lets the next pull start again
// from the oldest QSO and pick up what those skipped; `lotwConfirmedSince` replaced it.
// `lotwConfirmedSince` went the same way once confirmations started filling in the other
// station's state: confirmations pulled before that never had it read, and starting the window
// over is what brings them back. `lotwPulledSince` replaced it.
// `spotAlerts` was a second set of filter rules just for notifications; it's folded into
// `spotFilter` below and only its on/off survives, as `spotAlertsEnabled`.
const legacySettings = ["contestMode", "totaMap", "spotAlerts", "lotwQslSince", "lotwConfirmedSince"];

// Rebuilt whenever it's there at all, so a filter stored before a field existed gets that field's
// default rather than an `undefined` the filter code would trip over.
const fixSpotSettings = (settings: Partial<Settings> & { spotAlerts?: LegacySpotAlert }): Partial<Settings> => {
    if (!settings.spotFilter && !settings.spotAlerts) return settings;
    return {
        ...settings,
        spotFilter: migrateSpotFilter(settings.spotFilter, settings.spotAlerts),
        spotAlertsEnabled: settings.spotAlertsEnabled ?? !!settings.spotAlerts?.enabled,
    };
};

export const fixSettings = (stored: Partial<Settings>): Settings => {
    const settings = fixSpotSettings(stored);
    return {
        ...Object.fromEntries(Object.entries(settings).filter(([k]) => !legacySettings.includes(k))),
        ...Object.fromEntries(Object.entries(defaultSettings).filter(([k, v]) => !(k in settings))),
    } as Settings;
};

type DTLStoreProps = {
    qsos: QSO[];
    filters: QsoFilter[];
    settings: Settings;
    currentLocation: string;
    // Every session ever run, newest last. The active one is the one `activeSessionId` points at and
    // it's held by id rather than by value so ending it is a one-field write.
    sessions: Session[];
    activeSessionId?: string;
    // Manual answers to QSL records the importer couldn't place, keyed by qslRecordKey. The value
    // is the id of the QSO the record belongs to, or QSL_IGNORED. Held here rather than on the QSO
    // so that re-importing a download the operator has already sorted out asks nothing twice —
    // see components/qsl.
    qslResolutions: Record<string, string>;
};

type DTLStoreActionsProps = {
    log: (qso: QSO | QSO[]) => void;
    updateSetting: <T extends keyof Settings>(field: T, value: Settings[T]) => void;
    updateFilters: (filters: QsoFilter[]) => void;
    deleteLog: (qso: QSO) => void;
    resetStore: () => void;
    setCurrentLocation: (location: string) => void;
    startSession: (session: Session) => void;
    updateSession: (id: string, patch: Partial<Session>) => void;
    endSession: (id: string) => void;
    deleteSession: (id: string) => void;
    bumpSerial: (id: string) => void;
    adoptSessions: (sessions: Session[], qsos: QSO[]) => void;
    resolveQsl: (key: string, target: string | null) => void;
};

type DTLStoreActionsMutatorProps = (
    set: (stateMutator: (state: DTLStoreProps) => Partial<DTLStoreProps>) => void,
    get: () => DTLStoreProps,
) => DTLStoreActionsProps;

const InitialStore: DTLStoreProps = {
    qsos: [],
    filters: [],
    settings: defaultSettings,
    currentLocation: "",
    sessions: [],
    qslResolutions: {},
};

const StoreActions: DTLStoreActionsMutatorProps = (set) => ({
    // The bulk branch used to run `some()` over the incoming batch for every stored QSO, so an
    // import cost stored × imported comparisons — the shape that makes a big ADIF look hung.
    // A Set of the incoming ids answers the same question in one lookup.
    log: (qso) =>
        set((state) => {
            if (!Array.isArray(qso)) return { qsos: [...state.qsos.filter((q) => q.id != qso.id), qso] };
            const incoming = new Set(qso.map((q) => q.id));
            return { qsos: [...state.qsos.filter((q) => !incoming.has(q.id)), ...qso] };
        }),
    updateSetting: (field, value) => set((state) => ({ settings: { ...state.settings, [field]: value } })),
    updateFilters: (filters) =>
        set((state) => ({
            filters,
            settings: { ...state.settings, showFilters: filters.length ? true : state.settings.showFilters },
        })),
    deleteLog: (qso) => set((state) => ({ qsos: [...state.qsos.filter((q) => q.id != qso.id)] })),
    // Sessions and filters are only ever about QSOs, so leaving them behind left the Sessions page
    // listing outings that contain nothing, an activeSessionId naming a session with no contacts,
    // and filters still narrowing an empty log.
    resetStore: () => set(() => ({ qsos: [], sessions: [], activeSessionId: undefined, filters: [] })),
    setCurrentLocation: (location) => set(() => ({ currentLocation: location })),
    // Starting a session ends whatever was running: two at once would leave it ambiguous which one
    // owns the next QSO.
    startSession: (session) =>
        set((state) => ({
            sessions: [
                ...state.sessions.map((s) =>
                    s.id === state.activeSessionId && !s.endedAt ? { ...s, endedAt: DateTime.utc() } : s,
                ),
                session,
            ],
            activeSessionId: session.id,
        })),
    updateSession: (id, patch) =>
        set((state) => ({ sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...patch } : s)) })),
    endSession: (id) =>
        set((state) => ({
            sessions: state.sessions.map((s) => (s.id === id ? { ...s, endedAt: DateTime.utc() } : s)),
            activeSessionId: state.activeSessionId === id ? undefined : state.activeSessionId,
        })),
    // The QSOs it logged keep their sessionId and stay in the log: deleting a session forgets the
    // outing's settings, not the contacts.
    deleteSession: (id) =>
        set((state) => ({
            sessions: state.sessions.filter((s) => s.id !== id),
            activeSessionId: state.activeSessionId === id ? undefined : state.activeSessionId,
        })),
    bumpSerial: (id) =>
        set((state) => ({
            sessions: state.sessions.map((s) =>
                s.id === id && s.contest ? { ...s, contest: { ...s.contest, serial: s.contest.serial + 1 } } : s,
            ),
        })),
    // Sessions worked out from QSOs already in the log, stored alongside the QSOs they now own. One
    // write for both halves: a session pointing at QSOs that never got their `sessionId` would show
    // up empty everywhere. Nothing becomes active — these are outings that are already over.
    adoptSessions: (sessions, qsos) =>
        set((state) => {
            const adopted = new Set(qsos.map((q) => q.id));
            // Never two sessions under one id: every lookup finds the first and the other is a ghost.
            const known = new Set(state.sessions.map((s) => s.id));
            return {
                sessions: [...state.sessions, ...sessions.filter((s) => !known.has(s.id))],
                qsos: [...state.qsos.filter((q) => !adopted.has(q.id)), ...qsos],
            };
        }),
    // null forgets the answer, which is the undo behind a mis-click: the next import asks about the
    // record again. It doesn't touch the QSO — confirmations are one-way everywhere else too.
    resolveQsl: (key, target) =>
        set((state) => {
            const rest = Object.fromEntries(Object.entries(state.qslResolutions).filter(([k]) => k !== key));
            return { qslResolutions: target === null ? rest : { ...rest, [key]: target } };
        }),
});

export type UseStorePropsType = DTLStoreProps & DTLStoreActionsProps;

// Saving and loading live in ./persistence, which subscribes to this store once the log is read.
export const useStore = create<UseStorePropsType, [["zustand/devtools", never]]>(
    devtools(combine(InitialStore, StoreActions)),
);
