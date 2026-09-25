import axios from "axios";
import type { QSO } from "../components/qso";
import { AdifAPI } from "./file-format/adif";
import { header } from "./file-format/common";
import { relayed } from "./spots/fetch";

/**
 * Club Log account. The password is the account one, or an application password generated on
 * clublog.org for accounts that have one set up. The callsign picks which of the account's logs the
 * QSOs land in; left empty, each QSO goes to the log of the callsign it was made under.
 */
export type ClublogSettingsType = {
    email: string;
    password: string;
    callsign?: string;
};

/** What an upload did, so the button can say it without a dialog for the ordinary cases. */
export type ClublogStatus = "idle" | "loading" | "done" | "auth" | "offline" | "error";

const UPLOAD_URL = "https://clublog.org/putlogs.php";

// Club Log takes the file then processes it on its own queue, so the request itself is only the
// transfer; a first upload of a whole log is still a big body though.
const TIMEOUT_MS = 120000;

/**
 * Club Log issues one API key per application, not per user. It is inlined at build time from the
 * environment (a local `.env`, or the release workflow's secret) and never committed: without it
 * Club Log refuses every upload, so the feature stays hidden.
 */
export const CLUBLOG_API_KEY = process.env.EXPO_PUBLIC_CLUBLOG_API_KEY || "";

export class ClublogError extends Error {
    constructor(
        readonly status: ClublogStatus,
        message: string,
    ) {
        super(message);
    }
}

const authMessage =
    "Club Log refused those credentials. Check your email and password in Settings > API's — accounts with an application password need that one here.";

/**
 * Hand-built rather than FormData: React Native's FormData only takes files from a URI, and a string
 * body goes through the relay untouched on web and desktop.
 */
export const multipartBody = (
    fields: Record<string, string>,
    file: { name: string; field: string; content: string },
    boundary: string,
): string =>
    [
        ...Object.entries(fields).map(
            ([k, v]) => `--${boundary}\r\nContent-Disposition: form-data; name="${k}"\r\n\r\n${v}\r\n`,
        ),
        `--${boundary}\r\nContent-Disposition: form-data; name="${file.field}"; filename="${file.name}"\r\n` +
            `Content-Type: application/octet-stream\r\n\r\n${file.content}\r\n`,
        `--${boundary}--\r\n`,
    ].join("");

/**
 * Reads Club Log's answer. It speaks in status codes with a line of plain text: 200 is taken, 403 is
 * a login (or API key) it won't accept, anything else is a refusal worth showing as is.
 */
export const parseUploadResponse = (status: number, body: string): void => {
    const text = body.replace(/<[^>]*>/g, "").trim();
    if (status === 200) return;
    if (status === 403) {
        throw new ClublogError(
            "auth",
            /api/i.test(text) && !/password|login/i.test(text) ? `Club Log refused the app's API key: ${text}` : authMessage,
        );
    }
    throw new ClublogError("error", text || `Club Log answered with status ${status}.`);
};

/**
 * Which log each QSO goes to: the account's chosen callsign when there is one, otherwise the one the
 * QSO was made under. A QSO with neither can't be placed and stays unsent.
 */
export const groupByLog = (qsos: QSO[], callsign?: string): Map<string, QSO[]> => {
    const groups = new Map<string, QSO[]>();
    for (const q of qsos) {
        const target = (callsign || q.myCallsign || "").trim().toUpperCase();
        if (!target) continue;
        groups.set(target, [...(groups.get(target) || []), q]);
    }
    return groups;
};

/** Sends one log's QSOs in a single file. Club Log merges, so a QSO it already holds is harmless. */
export const uploadLog = async (
    qsos: QSO[],
    { email, password }: ClublogSettingsType,
    callsign: string,
    apiKey: string = CLUBLOG_API_KEY,
): Promise<void> => {
    const boundary = `----dtl${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
    // Never `clear`: that would replace the operator's whole Club Log log with this file.
    const body = multipartBody(
        { email, password, callsign, api: apiKey },
        { field: "file", name: "down-the-log.adi", content: AdifAPI.generateFile(qsos, header()) },
        boundary,
    );
    let status: number;
    let data: string;
    try {
        const response = await axios.post<string>(relayed(UPLOAD_URL), body, {
            timeout: TIMEOUT_MS,
            responseType: "text",
            transformResponse: [(d) => d],
            // Club Log's refusals come back as 4xx with the reason in the body; read them here
            // rather than as a thrown axios error that would look like being offline.
            validateStatus: () => true,
            headers: { "content-type": `multipart/form-data; boundary=${boundary}` },
        });
        status = response.status;
        data = typeof response.data === "string" ? response.data : String(response.data ?? "");
    } catch (e) {
        throw new ClublogError("offline", `Could not reach Club Log: ${e instanceof Error ? e.message : String(e)}`);
    }
    parseUploadResponse(status, data);
};

export type ClublogUploadResult = {
    /** QSOs Club Log has taken, and can be marked as sent. */
    sent: QSO[];
    /** QSOs with no callsign to file them under. */
    unplaced: number;
    /** One line per log Club Log refused, naming the callsign. */
    problems: string[];
};

/**
 * One upload per log, one after the other. A log Club Log refuses keeps its QSOs unsent and the
 * others carry on — except a refused login, which stops everything at once: every web and desktop
 * user reaches Club Log from the relay's addresses, and Club Log blocks addresses that keep failing
 * to log in, so a wrong password must not be tried again and again.
 *
 * `onLog` hands each accepted log over as it lands, so the caller can mark it sent before the next.
 */
export const uploadToClublog = async (
    qsos: QSO[],
    settings: ClublogSettingsType,
    onLog: (sent: QSO[]) => void = () => {},
    apiKey: string = CLUBLOG_API_KEY,
): Promise<ClublogUploadResult> => {
    const groups = groupByLog(qsos, settings.callsign);
    const placed = [...groups.values()].reduce((n, g) => n + g.length, 0);
    const total: ClublogUploadResult = { sent: [], unplaced: qsos.length - placed, problems: [] };
    for (const [callsign, group] of groups) {
        try {
            await uploadLog(group, settings, callsign, apiKey);
        } catch (e) {
            if (e instanceof ClublogError && (e.status === "auth" || e.status === "offline")) throw e;
            total.problems.push(`${callsign}: ${e instanceof Error ? e.message : String(e)}`);
            continue;
        }
        total.sent.push(...group);
        onLog(group);
    }
    return total;
};
