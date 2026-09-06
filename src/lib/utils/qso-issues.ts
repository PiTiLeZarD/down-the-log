import { QSO } from "../components/qso";
import { Band, bands } from "../data/bands";
import { CallsignData, callsigns } from "../data/callsigns";
import { countries, resolveCountry } from "../data/countries";
import { unique } from "./arrays";
import { collapseCallsign, getCallsignData } from "./callsign";
import { EventType, capitalise, eventDataMap, events } from "./event-rules";
import { locatorRegexp, maidenDistance } from "./locator";

// The description quotes the offending values, so it moves as soon as the QSO is edited and can't
// identify anything. Dismissals are keyed on field + code instead: an operator who accepts that our
// entity table calls VK9 Australia keeps that dismissal, but a later wrong DXCC still surfaces.
export const issueCodes = [
    "country-unknown",
    "country-callsign",
    "continent-country",
    "dxcc-country",
    "locator-invalid",
    "locator-distance",
    "event-unknown",
    "event-missing",
    "event-mismatch",
    "band-unknown",
    "frequency-band",
] as const;
export type QsoIssueCode = (typeof issueCodes)[number];

export type QsoIssue = { field: keyof QSO; code: QsoIssueCode; description: string; ignored: boolean };

export const issueKey = (issue: Pick<QsoIssue, "field" | "code">): string => `${issue.field}:${issue.code}`;

// The labels the form puts on those fields, so an issue points at something the operator can see.
const fieldLabels: Partial<Record<keyof QSO, string>> = {
    country: "Country",
    continent: "Continent",
    dxcc: "DXCC",
    locator: "Gridsquare",
    band: "Band",
    frequency: "Frequency",
    pota: "POTA",
    myPota: "My POTA",
    wwff: "WWFF",
    myWwff: "My WWFF",
    sota: "SOTA",
    mySota: "My SOTA",
    iota: "IOTA",
    myIota: "My IOTA",
    sigInfo: "Sig info",
    mySigInfo: "My sig info",
};
export const issueFieldLabel = (field: keyof QSO): string => fieldLabels[field] || field;

// Grids are only checked against the reference square of the whole entity, so the tolerance has to
// cover the biggest ones (Russia, Antarctica) or every QSO with them would be flagged. It still
// catches the mistake that actually happens: a grid on the wrong side of the planet.
const MAX_ENTITY_RADIUS_KM = 5000;

const eventNames: Record<EventType, string> = {
    pota: "POTA",
    wwff: "WWFF",
    sota: "SOTA",
    iota: "IOTA",
    sig: "SIG",
};
const sig2event = Object.fromEntries(events.map((e) => [eventNames[e], e])) as Record<string, EventType>;

const refField = (event: EventType, mine: boolean) => (mine ? (`my${capitalise(event)}` as keyof QSO) : event);

// One iso3 can span several DXCC entities (RUS is European and Asiatic Russia, USA covers Hawaii),
// so a country resolves to a list and anything matching any of them is fine. Keying a single entity
// per iso3 flagged every European Russian QSO against the Asiatic entity.
const entitiesByIso3 = callsigns.reduce<Map<string, CallsignData[]>>(
    (map, entity) => map.set(entity.iso3, [...(map.get(entity.iso3) || []), entity]),
    new Map(),
);

// The other direction, and the reason it exists: this table is keyed by ISO country, and DXCC splits
// islands ISO doesn't (Balearic, Canary, Lord Howe, Mellish...), so ~100 entity numbers appear in no
// row at all. A DXCC we can't place is not evidence of a mismatch — only one we can place, somewhere
// else, is. Without this every one of those entities reads as an error against its parent country.
const iso3ByDxcc = callsigns.reduce<Map<number, Set<string>>>(
    (map, entity) =>
        [entity.dxcc, ...(entity.dxccAlt || [])].reduce(
            (acc, d) => acc.set(+d, (acc.get(+d) || new Set<string>()).add(entity.iso3)),
            map,
        ),
    new Map(),
);

// The numeric fields only hold numbers when the QSO came from an import: editing one on the form
// hands react-hook-form the raw text, so `dxcc` becomes "170" and a strict compare against 170 says
// New Zealand doesn't match New Zealand. Everything numeric is read through here.
const num = (value: unknown): number | undefined => {
    if (value === undefined || value === null || value === "") return undefined;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
};

// getCallsignData walks the 300-odd entity table matching regexps, and the list re-checks a QSO
// whenever its row is rendered, so the answer is memoised on the callsign it came from.
const csdataCache = new Map<string, ReturnType<typeof getCallsignData>>();
const callsignData = (callsign: string) => {
    if (!csdataCache.has(callsign)) csdataCache.set(callsign, getCallsignData(collapseCallsign(callsign)));
    return csdataCache.get(callsign);
};

type RawIssue = Omit<QsoIssue, "ignored">;

const countryIssues = (qso: QSO, issues: RawIssue[]) => {
    const csdata = callsignData(qso.callsign);
    const iso3 = resolveCountry(qso.country);

    if (qso.country && !iso3)
        issues.push({ field: "country", code: "country-unknown", description: `Unknown country "${qso.country}"` });
    if (csdata && iso3 && csdata.iso3 !== iso3)
        issues.push({
            field: "country",
            code: "country-callsign",
            description: `Country ${countries[iso3].name} doesn't match the callsign (${countries[csdata.iso3]?.name})`,
        });

    const entities = (iso3 && entitiesByIso3.get(iso3)) || (csdata ? [csdata] : []);
    if (entities.length === 0) return;
    const name = countries[entities[0].iso3]?.name || entities[0].iso3;

    if (qso.continent && !entities.some((e) => e.ctn === qso.continent))
        issues.push({
            field: "continent",
            code: "continent-country",
            description: `Continent ${qso.continent} doesn't match ${name} (${unique(entities.map((e) => e.ctn)).join(", ")})`,
        });

    const dxcc = num(qso.dxcc);
    const owners = dxcc ? iso3ByDxcc.get(dxcc) : undefined;
    if (dxcc && owners && !owners.has(entities[0].iso3))
        issues.push({
            field: "dxcc",
            code: "dxcc-country",
            description: `DXCC ${dxcc} belongs to ${unique([...owners].map((iso3) => countries[iso3]?.name || iso3)).join(", ")}, not ${name}`,
        });

    if (!qso.locator) return;
    if (!locatorRegexp.test(qso.locator)) {
        issues.push({
            field: "locator",
            code: "locator-invalid",
            description: `"${qso.locator}" is not a valid Maidenhead locator`,
        });
        return;
    }
    // Antarctica wraps the pole, so no single reference square says anything useful about a grid there.
    if (entities.some((e) => e.ctn === "AN")) return;
    if (Math.min(...entities.map((e) => maidenDistance(qso.locator as string, e.gs))) > MAX_ENTITY_RADIUS_KM)
        issues.push({
            field: "locator",
            code: "locator-distance",
            description: `Locator ${qso.locator} is nowhere near ${name}`,
        });
};

const eventIssues = (qso: QSO, issues: RawIssue[]) => {
    [false, true].forEach((mine) => {
        events
            .filter((event) => event !== "sig")
            .forEach((event) => {
                const field = refField(event, mine);
                const reference = qso[field] as string | undefined;
                if (reference && !(reference in eventDataMap[event]))
                    issues.push({
                        field,
                        code: "event-unknown",
                        description: `${reference} is not a known ${eventNames[event]} reference`,
                    });
            });

        const sig = qso[mine ? "mySig" : "sig"];
        const sigInfo = qso[mine ? "mySigInfo" : "sigInfo"];
        const event = sig ? sig2event[sig.toUpperCase()] : undefined;
        if (!event || event === "sig" || !sigInfo) return;

        const field = refField(event, mine);
        const reference = qso[field] as string | undefined;
        if (!reference)
            issues.push({
                field,
                code: "event-missing",
                description: `${eventNames[event]} reference missing for ${sig} ${sigInfo}`,
            });
        else if (reference !== sigInfo)
            issues.push({
                field: mine ? "mySigInfo" : "sigInfo",
                code: "event-mismatch",
                description: `${sig} ${sigInfo} doesn't match the ${eventNames[event]} reference ${reference}`,
            });
    });
};

const bandIssues = (qso: QSO, issues: RawIssue[]) => {
    if (qso.band && !(qso.band in bands)) {
        issues.push({ field: "band", code: "band-unknown", description: `Unknown band "${qso.band}"` });
        return;
    }
    const frequency = num(qso.frequency);
    if (!frequency || !qso.band) return;

    const [low, high] = bands[qso.band as Band];
    if (frequency < low || frequency > high)
        issues.push({
            field: "frequency",
            code: "frequency-band",
            description: `${frequency}MHz is outside ${qso.band} (${low}-${high}MHz)`,
        });
};

// The log filter asks every QSO for its issues and the list rows ask again while rendering, so the
// answer is kept against the QSO itself. The store replaces objects rather than mutating them, so an
// edited QSO arrives as a new key and gets re-checked.
const issueCache = new WeakMap<QSO, QsoIssue[]>();

// Dismissed issues are still returned, flagged: the QSO page lists them so a dismissal can be taken
// back, and only the callers that decide whether a QSO looks wrong (the red line, the filter) drop them.
export const getQsoIssues = (qso: QSO): QsoIssue[] => {
    const cached = issueCache.get(qso);
    if (cached) return cached;

    const raw: RawIssue[] = [];
    countryIssues(qso, raw);
    eventIssues(qso, raw);
    bandIssues(qso, raw);

    const ignoredKeys = qso.ignoredIssues || [];
    const issues = raw.map((issue) => ({ ...issue, ignored: ignoredKeys.includes(issueKey(issue)) }));

    issueCache.set(qso, issues);
    return issues;
};

// A QSO whose issues have all been dismissed still has them: `hasIssues` answers that literally, and
// only `hasOpenIssues` — what the red line and the "left to fix" filter ask — honours the dismissals.
export const hasIssues = (qso: QSO): boolean => getQsoIssues(qso).length > 0;
export const hasOpenIssues = (qso: QSO): boolean => getQsoIssues(qso).some((issue) => !issue.ignored);
export const hasIgnoredIssues = (qso: QSO): boolean => getQsoIssues(qso).some((issue) => issue.ignored);

export const ignoreIssue = (ignored: string[] | undefined, issue: QsoIssue): string[] =>
    unique([...(ignored || []), issueKey(issue)]);
export const restoreIssue = (ignored: string[] | undefined, issue: QsoIssue): string[] =>
    (ignored || []).filter((key) => key !== issueKey(issue));
