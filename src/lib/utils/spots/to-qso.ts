import {
    QSO,
    carryOver,
    createQso,
    myStationFromSettings,
    prefillMyStation,
    prefillOperating,
    prefillSession,
} from "../../components/qso";
import { EventType, capitalise } from "../event-rules";
import { Session, carryOverFields } from "../session";
import { Settings } from "../store";
import { spotLocator } from "./status";
import { MergedSpot, Spot } from "./types";

// Which QSO field holds the worked station's side of each programme. `sig`/`sigInfo` is the catch-all
// the QSO type already uses for schemes with no field of their own — shires, silos, ZLOTA.
const referenceField = (programme: EventType): keyof QSO =>
    programme === "sig" ? "sigInfo" : (programme as keyof QSO);

/**
 * Every reference the merged row knows about, not just the newest spot's: a park spotted on
 * ParksnPeaks as VKFF-0981 and on pota.app as VK-0123 is one contact that counts for both awards,
 * and filling only the one that happened to be spotted last loses the other from the log.
 */
export const spotReferences = (spot: MergedSpot): Partial<QSO> =>
    spot.sources.reduce<Partial<QSO>>((fields, source) => {
        if (!source.reference) return fields;
        const field = referenceField(source.programme);
        if (fields[field]) return fields;
        return {
            ...fields,
            [field]: source.reference,
            ...(source.programme === "sig" && source.programmeLabel ? { sig: source.programmeLabel } : {}),
        };
    }, {});

export const spotOperating = (spot: Spot): Partial<QSO> => ({
    ...(spot.frequency ? { frequency: spot.frequency } : {}),
    ...(spot.band ? { band: spot.band } : {}),
    ...(spot.mode ? { mode: spot.mode } : {}),
});

export type SpotQsoContext = {
    settings: Settings;
    currentLocation: string;
    session?: Session;
    // The last QSO logged, for the same carry-over a hand-typed callsign gets.
    previous?: QSO;
};

/**
 * A QSO seeded from a spot, filled the same way the log screen fills a blank one — my station from
 * settings, the previous QSO's rig and antenna, the session's values — with the spot's own facts
 * written over the top, since they're the only part the operator hasn't had to type.
 */
export const qsoFromSpot = (spot: MergedSpot, { settings, currentLocation, session, previous }: SpotQsoContext): QSO => {
    let qso = prefillMyStation(createQso(spot.callsign), myStationFromSettings(settings, currentLocation));
    if (previous) qso = carryOver(qso, previous, carryOverFields(settings.carryOver, previous, session));
    qso = prefillSession(qso, session);
    const locator = spotLocator(spot);
    qso = {
        ...qso,
        ...spotOperating(spot),
        ...spotReferences(spot),
        ...(locator ? { locator } : {}),
    };
    // Last, so the report scale follows the mode the spot says they're using rather than the
    // default the form would otherwise have picked.
    return prefillOperating(qso, { mode: "SSB", band: "20m" });
};

// Not used to fill the QSO — the field names above do that — but the summary the row shows once the
// operator has tapped it, so they can see what's about to be logged.
export const spotSummary = (spot: MergedSpot): string =>
    [
        spot.callsign,
        spot.frequency ? `${spot.frequency}MHz` : spot.band,
        spot.mode,
        ...spot.sources.filter((s) => s.reference).map((s) => `${capitalise(s.programme)} ${s.reference}`),
    ]
        .filter(Boolean)
        .join(" · ");
