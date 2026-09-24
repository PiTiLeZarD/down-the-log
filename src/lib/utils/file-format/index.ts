import { QSO } from "../../components/qso";
import { serialiseSessions } from "../session";
import { useStore } from "../store";
import { AdifAPI } from "./adif";
import { AdxAPI } from "./adx";
import { CabrilloAPI } from "./cabrillo";
import { FileFormatAPI, RecordMassageFn, header } from "./common";
import { WsjtxAPI } from "./wsjtx";

export { RecordMassageFn, qso2record, record2qso } from "./common";

// A Blob URL rather than a `data:` one. encodeURIComponent held a second copy of the whole file up
// to three times the size — ADIF is dense in `<`, `>`, spaces and newlines, all of which escape —
// so a 50k-QSO export meant hundreds of megabytes of live strings and a URI that long pinned on a
// DOM node, which browsers drop silently past their address limit. The Blob has neither cost.
export const downloadQsos = (
    title: string,
    qsos: QSO[],
    type: "adif" | "adx" | "wsjtx" | "cabrillo" = "adif",
    massage?: RecordMassageFn,
    // The sessions the QSOs belong to, in the header, so a re-import can put them back. Only for a
    // file meant to come back to us: an upload to LoTW or POTA has no use for them. WSJT-X and
    // Cabrillo have nowhere to keep them and skip header fields they don't know.
    withSessions = false,
) => {
    const sessions = withSessions ? serialiseSessions(useStore.getState().sessions, qsos) : undefined;
    const content = { adif: AdifAPI, adx: AdxAPI, wsjtx: WsjtxAPI, cabrillo: CabrilloAPI }[type].generateFile(
        qsos,
        header(sessions),
        massage,
    );
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    const anchor = Object.assign(document.createElement("a"), { href: url, download: title });
    // In the document for the click: a detached anchor is not clickable in every browser, and the
    // revoke waits a tick because revoking in the same task can cancel the download it just started.
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 0);
};

export const getFileApiFromFilename = (filename: string): FileFormatAPI => {
    if (filename === "wsjtx.log") return WsjtxAPI;
    if (filename.endsWith("adx")) return AdxAPI;
    if (filename.endsWith("cab")) return CabrilloAPI;
    if (
        filename.endsWith("adif") ||
        filename.endsWith("adi") ||
        filename.endsWith("adi.txt") ||
        filename.endsWith("adif.txt")
    )
        return AdifAPI;
    throw new Error(`No File API Found for ${filename}`);
};
