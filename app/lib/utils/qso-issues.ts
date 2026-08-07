import { QSO } from "../components/qso";
import { Band, bands } from "../data/bands";
import { CallsignData, callsigns } from "../data/callsigns";
import { countries } from "../data/countries";
import { unique } from "./arrays";
import { collapseCallsign, getCallsignData } from "./callsign";
import { EventType, capitalise, eventDataMap, events } from "./event-rules";
import { maidenDistance } from "./locator";

export type QsoIssue = { field: keyof QSO; description: string };

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
const locatorRegexp = /^[A-R]{2}[0-9]{2}([A-X]{2}([0-9]{2})?)?$/i;

const eventNames: Record<EventType, string> = {
    pota: "POTA",
    wwff: "WWFF",
    sota: "SOTA",
    iota: "IOTA",
    sig: "SIG",
};
const sig2event = Object.fromEntries(events.map((e) => [eventNames[e], e])) as Record<string, EventType>;

const refField = (event: EventType, mine: boolean) => (mine ? (`my${capitalise(event)}` as keyof QSO) : event);

// QSOs we resolved ourselves hold our iso3 in `country`, but an ADIF import puts the DXCC entity
// name in there instead, so both spellings have to resolve before anything can be called a mismatch.
const iso3ByName = Object.fromEntries(Object.entries(countries).map(([iso3, { name }]) => [name.toUpperCase(), iso3]));
export const resolveCountry = (country?: string): string | undefined => {
    if (!country) return undefined;
    if (country in countries) return country;
    return iso3ByName[country.toUpperCase()];
};

// One iso3 can span several DXCC entities (RUS is European and Asiatic Russia, USA covers Hawaii),
// so a country resolves to a list and anything matching any of them is fine. Keying a single entity
// per iso3 flagged every European Russian QSO against the Asiatic entity.
const entitiesByIso3 = callsigns.reduce<Map<string, CallsignData[]>>(
    (map, entity) => map.set(entity.iso3, [...(map.get(entity.iso3) || []), entity]),
    new Map(),
);

// getCallsignData walks the 300-odd entity table matching regexps, and the list re-checks a QSO
// whenever its row is rendered, so the answer is memoised on the callsign it came from.
const csdataCache = new Map<string, ReturnType<typeof getCallsignData>>();
const callsignData = (callsign: string) => {
    if (!csdataCache.has(callsign)) csdataCache.set(callsign, getCallsignData(collapseCallsign(callsign)));
    return csdataCache.get(callsign);
};

const countryIssues = (qso: QSO, issues: QsoIssue[]) => {
    const csdata = callsignData(qso.callsign);
    const iso3 = resolveCountry(qso.country);

    if (qso.country && !iso3) issues.push({ field: "country", description: `Unknown country "${qso.country}"` });
    if (csdata && iso3 && csdata.iso3 !== iso3)
        issues.push({
            field: "country",
            description: `Country ${countries[iso3].name} doesn't match the callsign (${countries[csdata.iso3]?.name})`,
        });

    const entities = (iso3 && entitiesByIso3.get(iso3)) || (csdata ? [csdata] : []);
    if (entities.length === 0) return;
    const name = countries[entities[0].iso3]?.name || entities[0].iso3;

    if (qso.continent && !entities.some((e) => e.ctn === qso.continent))
        issues.push({
            field: "continent",
            description: `Continent ${qso.continent} doesn't match ${name} (${unique(entities.map((e) => e.ctn)).join(", ")})`,
        });

    if (qso.dxcc && !entities.some((e) => [e.dxcc, ...(e.dxccAlt || [])].some((d) => +d === qso.dxcc)))
        issues.push({
            field: "dxcc",
            description: `DXCC ${qso.dxcc} doesn't match ${name} (${entities.map((e) => +e.dxcc).join(", ")})`,
        });

    if (!qso.locator) return;
    if (!locatorRegexp.test(qso.locator)) {
        issues.push({ field: "locator", description: `"${qso.locator}" is not a valid Maidenhead locator` });
        return;
    }
    // Antarctica wraps the pole, so no single reference square says anything useful about a grid there.
    if (entities.some((e) => e.ctn === "AN")) return;
    if (Math.min(...entities.map((e) => maidenDistance(qso.locator as string, e.gs))) > MAX_ENTITY_RADIUS_KM)
        issues.push({ field: "locator", description: `Locator ${qso.locator} is nowhere near ${name}` });
};

const eventIssues = (qso: QSO, issues: QsoIssue[]) => {
    [false, true].forEach((mine) => {
        events
            .filter((event) => event !== "sig")
            .forEach((event) => {
                const field = refField(event, mine);
                const reference = qso[field] as string | undefined;
                if (reference && !(reference in eventDataMap[event]))
                    issues.push({
                        field,
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
            issues.push({ field, description: `${eventNames[event]} reference missing for ${sig} ${sigInfo}` });
        else if (reference !== sigInfo)
            issues.push({
                field: mine ? "mySigInfo" : "sigInfo",
                description: `${sig} ${sigInfo} doesn't match the ${eventNames[event]} reference ${reference}`,
            });
    });
};

const bandIssues = (qso: QSO, issues: QsoIssue[]) => {
    if (qso.band && !(qso.band in bands)) {
        issues.push({ field: "band", description: `Unknown band "${qso.band}"` });
        return;
    }
    if (!qso.frequency || !qso.band) return;

    const [low, high] = bands[qso.band as Band];
    if (qso.frequency < low || qso.frequency > high)
        issues.push({
            field: "frequency",
            description: `${qso.frequency}MHz is outside ${qso.band} (${low}-${high}MHz)`,
        });
};

// The log filter asks every QSO for its issues and the list rows ask again while rendering, so the
// answer is kept against the QSO itself. The store replaces objects rather than mutating them, so an
// edited QSO arrives as a new key and gets re-checked.
const issueCache = new WeakMap<QSO, QsoIssue[]>();

export const getQsoIssues = (qso: QSO): QsoIssue[] => {
    const cached = issueCache.get(qso);
    if (cached) return cached;

    const issues: QsoIssue[] = [];
    countryIssues(qso, issues);
    eventIssues(qso, issues);
    bandIssues(qso, issues);

    issueCache.set(qso, issues);
    return issues;
};

export const hasIssues = (qso: QSO): boolean => getQsoIssues(qso).length > 0;
