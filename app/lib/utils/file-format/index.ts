import { QSO } from "../../components/qso";
import { adifFileToRecordList, qsos2Adif } from "./adif";
import { adxFileToRecordList, qsos2Adx } from "./adx";
import { QSORecord, RecordMassageFn } from "./common";
import { qsos2Wsjtx, wsjtxFileToRecordList } from "./wsjtx";

export { RecordMassageFn, qso2record, record2qso } from "./common";

export const downloadQsos = (
    title: string,
    qsos: QSO[],
    type: "adif" | "adx" | "wsjtx" = "adif",
    massage?: RecordMassageFn,
) =>
    Object.assign(document.createElement("a"), {
        href: `data:text/plain,${encodeURIComponent(
            { adif: qsos2Adif, adx: qsos2Adx, wsjtx: qsos2Wsjtx }[type](qsos, massage),
        )}`,
        download: title,
    }).click();

export const getImportFunctionFromFilename = (filename: string): ((c: string) => QSORecord[]) => {
    if (filename === "wsjtx.log") return wsjtxFileToRecordList;
    if (filename.endsWith("adx")) return adxFileToRecordList;
    if (
        filename.endsWith("adif") ||
        filename.endsWith("adi") ||
        filename.endsWith("adi.txt") ||
        filename.endsWith("adif.txt")
    )
        return adifFileToRecordList;
    return () => [];
};
