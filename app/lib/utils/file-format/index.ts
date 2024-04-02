import { QSO } from "../../components/qso";
import { AdifAPI } from "./adif";
import { AdxAPI } from "./adx";
import { FileFormatAPI, RecordMassageFn, header } from "./common";
import { WsjtxAPI } from "./wsjtx";

export { RecordMassageFn, qso2record, record2qso } from "./common";

export const downloadQsos = (
    title: string,
    qsos: QSO[],
    type: "adif" | "adx" | "wsjtx" = "adif",
    massage?: RecordMassageFn,
) =>
    Object.assign(document.createElement("a"), {
        href: `data:text/plain,${encodeURIComponent(
            { adif: AdifAPI, adx: AdxAPI, wsjtx: WsjtxAPI }[type].generateFile(qsos, header(), massage),
        )}`,
        download: title,
    }).click();

export const getFileApiFromFilename = (filename: string): FileFormatAPI => {
    if (filename === "wsjtx.log") return WsjtxAPI;
    if (filename.endsWith("adx")) return AdxAPI;
    if (
        filename.endsWith("adif") ||
        filename.endsWith("adi") ||
        filename.endsWith("adi.txt") ||
        filename.endsWith("adif.txt")
    )
        return AdifAPI;
    throw new Error(`No File API Found for ${filename}`);
};
