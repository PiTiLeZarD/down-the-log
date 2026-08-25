import { DateTime } from "luxon";
import { QSO } from "../components/qso";
import { Band } from "../data/bands";
import { groupBy } from "./arrays";
import { RecordMassageFn } from "./file-format";
import { normalise } from "./locator";

// Tiles on the Air (tilesontheair.com). The unit of activation is the 6-character Maidenhead
// subsquare — the "tile" — you operated from, roughly 5x7km, and a trip is scored per UTC day
// (their uploader offers to split a multi-day ADIF the same way). One QSO makes a valid
// activation, so unlike POTA/WWFF there is no target to count towards.
//
// Everything else TOTA scores — distance travelled on foot, elevation gain, ruck weight, pets,
// kids — is entered on their site or read off a GPX/TCX track, none of which lives in a log. So
// all the log owes an activation is the tile, the UTC day, and the QSOs, which is exactly what
// their ADIF import reads back out (MY_GRIDSQUARE / STATION_CALLSIGN, plus date, time and count).
export const TILE_LENGTH = 6;

// The Tiles page shows the same activations two ways: the list that hands out ADIFs, and the poster
// of which tiles are covered. The choice is a setting so it survives navigating away. See app/tota.
export type TotaView = "list" | "poster";

export const dtFormat = "yyyyMMdd";

// TOTA has no reference field of its own: the tile is wherever the station was, so it comes off
// myLocator. A 4-character locator names a square 100 times the size of a tile, which isn't an
// activation — those QSOs are reported as missing rather than guessed at.
export const tileOf = (qso: QSO): string | undefined => {
    const locator = normalise(qso.myLocator);
    return locator && locator.length >= TILE_LENGTH ? locator.substring(0, TILE_LENGTH) : undefined;
};

export type TotaActivation = {
    tile: string;
    // UTC day, dtFormat.
    date: string;
    qsos: QSO[];
};

// Names the outing rather than the QSOs in it, so it stays put as the log around it is edited.
export const activationKey = ({ tile, date }: TotaActivation): string => `${tile}/${date}`;

// One activation per tile per UTC day. Moving between tiles in a single outing is several
// activations to TOTA, and an overnight stay in one tile is two, which falls out of the grouping.
export const getTotaActivations = (qsos: QSO[]): TotaActivation[] =>
    Object.entries(
        groupBy(
            qsos.filter((q) => !!tileOf(q)),
            (q) => `${tileOf(q)}/${q.date.toFormat(dtFormat)}`,
        ),
    )
        .map(([, activationQsos]) => ({
            tile: tileOf(activationQsos[0]) as string,
            date: activationQsos[0].date.toFormat(dtFormat),
            qsos: [...activationQsos].sort((q1, q2) => q1.date.toMillis() - q2.date.toMillis()),
        }))
        .sort((a1, a2) => (a1.date === a2.date ? a1.tile.localeCompare(a2.tile) : a2.date.localeCompare(a1.date)));

// QSOs that would be an activation if we knew which tile they came from.
export const qsosMissingTile = (qsos: QSO[]): QSO[] => qsos.filter((q) => !tileOf(q));

// The QRP doubler is HF-only: a handheld running 5W on 2m is how handhelds work, not low power.
const HF_BANDS: Band[] = ["160m", "80m", "60m", "40m", "30m", "20m", "17m", "15m", "12m", "10m"];

// TOTA doubles the contact count for an activation run at 10W or less that includes at least one
// HF QSO. Power is per QSO here and optional, so an unpowered QSO means we can't claim it.
export const isQrpActivation = ({ qsos }: TotaActivation): boolean =>
    qsos.length > 0 &&
    qsos.every((q) => q.power !== undefined && q.power <= 10) &&
    qsos.some((q) => !!q.band && HF_BANDS.includes(q.band));

// When the activation was uploaded to their site, or nothing if it hasn't been. The mark is per
// QSO, so an outing only counts as uploaded once every QSO in it carries one: log a late contact
// into a day already sent and the activation goes back to unsent, which is the truth — the file
// they hold is missing it. The oldest mark is the answer, that's when the outing first went up.
export const uploadedAt = ({ qsos }: TotaActivation): string | undefined => {
    const marks = qsos.map((q) => q.totaUploaded);
    return qsos.length > 0 && marks.every((m) => !!m) ? (marks as string[]).sort()[0] : undefined;
};

// The QSOs of the activation with the mark set or cleared, ready to go back into the log. Every
// QSO carries it so the answer survives filtering the log down to any part of the outing.
export const markUploaded = ({ qsos }: TotaActivation, uploaded: boolean, at: DateTime = DateTime.utc()): QSO[] =>
    qsos.map((q) => ({ ...q, totaUploaded: uploaded ? (at.toISO() as string) : undefined }));

export const totaFileName = ({ tile, date, qsos }: TotaActivation): string =>
    `${qsos[0].myCallsign || "log"}@${tile}_${date}.adif`;

// Their importer reads the tile straight off MY_GRIDSQUARE, so an 8-character locator would hand
// it a grid it has to trim itself. Send the tile. The sig fields are left alone: the same QSOs are
// usually a POTA or SOTA activation too, and TOTA doesn't ask for a sig of its own.
export const totaMassage: RecordMassageFn = (r) => ({
    ...r,
    my_gridsquare: r.my_gridsquare?.substring(0, TILE_LENGTH),
});

// Their uploader won't take an activation dated more than 30 days before the day the account was
// registered, so anything older is a file that would bounce off the form. Registration day isn't
// anywhere in a log — the operator tells us once, on the Tiles page — and everything before the
// cutoff is left out of the page rather than offered as a download that can't be used.
export const TOTA_BACKDATE_DAYS = 30;

// First day TOTA will accept, dtFormat. Same format both sides, so the comparisons below are
// string comparisons and there's no timezone to get wrong: the log's day is already UTC.
export const totaCutoff = (registered: string): string =>
    DateTime.fromFormat(registered, dtFormat, { zone: "utc" }).minus({ days: TOTA_BACKDATE_DAYS }).toFormat(dtFormat);

export const isUploadable = ({ date }: TotaActivation, registered: string): boolean => date >= totaCutoff(registered);

// The same question for a QSO that has no tile yet: no point warning about a missing gridsquare on
// a day TOTA would refuse anyway.
export const isQsoUploadable = (qso: QSO, registered: string): boolean =>
    qso.date.toFormat(dtFormat) >= totaCutoff(registered);
