import axios from "axios";
import { DateTime } from "luxon";
import type { QSO } from "../components/qso";
import { AdifAPI } from "./file-format/adif";
import { header } from "./file-format/common";
import { relayed } from "./spots/fetch";

/**
 * eQSL account. Unlike LoTW there's no certificate involved: the website login is all eQSL asks for,
 * both to read the inbox and to upload QSOs. The QTH nickname only matters for accounts that hold
 * more than one QTH under the same callsign — eQSL refuses to guess which one is meant.
 */
export type EqslSettingsType = {
    user: string;
    password: string;
    qthNickname?: string;
};

/** What a fetch or an upload did, so the button can say it without a dialog for the ordinary cases. */
export type EqslStatus = "idle" | "loading" | "done" | "auth" | "offline" | "error";

const INBOX_URL = "https://www.eqsl.cc/qslcard/DownloadInBox.cfm";
const UPLOAD_URL = "https://www.eqsl.cc/qslcard/ImportADIF.cfm";

// eQSL builds the inbox file on request, and a first full-history pull is not quick.
const TIMEOUT_MS = 120000;

// Small enough that one rejected record only holds back a handful of others (see uploadToEqsl), and
// that a body stays well clear of what eQSL and the relay will take in one request.
export const UPLOAD_CHUNK = 250;

export class EqslError extends Error {
    constructor(
        readonly status: EqslStatus,
        message: string,
    ) {
        super(message);
    }
}

type Credentials = EqslSettingsType;

/** eQSL answers failures as prose inside an HTML page, so the reason has to be read out of the body. */
const classify = (body: string): EqslStatus =>
    /no such username|username\/password|no match on eqsl_user|(bad|invalid|incorrect) password/i.test(body)
        ? "auth"
        : "error";

const authMessage = "eQSL refused those credentials. Check your user name and password in Settings > API's.";

// Only the lines eQSL flags, tags stripped: its pages are a full site template around a few lines of
// actual answer, and that's all the operator needs to see.
const flaggedLines = (body: string): string[] =>
    body
        .split(/<br\s*\/?>|\n/i)
        .map((l) => l.replace(/<[^>]*>/g, "").trim())
        .filter((l) => /^(error|warning|caution)\b/i.test(l));

const get = async (url: string): Promise<string> => {
    try {
        // transformResponse is off on purpose: axios would otherwise try to read a body that happens
        // to start with a brace as JSON and hand back an object.
        const response = await axios.get<string>(relayed(url), {
            timeout: TIMEOUT_MS,
            responseType: "text",
            transformResponse: [(d) => d],
        });
        return typeof response.data === "string" ? response.data : String(response.data);
    } catch (e) {
        throw new EqslError("offline", `Could not reach eQSL: ${e instanceof Error ? e.message : String(e)}`);
    }
};

/**
 * Credentials travel in the query string — eQSL's inbox API takes them no other way — so this URL
 * is a secret in its own right, and must never be logged.
 */
export const eqslInboxUrl = ({ user, password, qthNickname, since }: Credentials & { since: string }): string => {
    const params: Record<string, string> = { UserName: user, Password: password, RcvdSince: since };
    if (qthNickname) params.QTHNickname = qthNickname;
    return `${INBOX_URL}?${Object.entries(params)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join("&")}`;
};

/**
 * The raw ADIF inbox, ready for the same importer the LoTW report goes through. eQSL doesn't answer
 * with the file: it answers with a page linking to one it has just generated, so this is two
 * requests. An empty inbox comes back as an empty string rather than an error — there is simply
 * nothing new.
 */
export const fetchEqslConfirmations = async (credentials: Credentials & { since: string }): Promise<string> => {
    const page = await get(eqslInboxUrl(credentials));

    const link = page.match(/href="([^"]+\.adi)"/i)?.[1];
    if (!link) {
        if (/no log entries|no qsls|0 records/i.test(page)) return "";
        const status = classify(page);
        throw new EqslError(
            status,
            status === "auth"
                ? authMessage
                : flaggedLines(page)[0] || "eQSL answered with something that isn't an inbox. Try again in a moment.",
        );
    }

    // The link is relative to the page that held it (../downloadedfiles/…).
    const body = await get(new URL(link, INBOX_URL).toString());
    // Every ADIF file eQSL generates has a header. A body without one is an error page, and the
    // importer must never see it: it would parse to nothing and be reported as zero confirmations.
    if (!/<eoh>/i.test(body))
        throw new EqslError("error", "eQSL's inbox file couldn't be read. Try again in a moment.");
    return body;
};

/**
 * The window to ask for, yyyyMMdd. `RcvdSince` is about when a card reached the inbox, so a
 * successful pull can move it forward — to a day before the pull, which absorbs eQSL's own clock
 * being in a different zone.
 */
export const nextRcvdSince = (): string => DateTime.utc().minus({ days: 1 }).toFormat("yyyyMMdd");

/** The ADIF eQSL takes for an upload: an ordinary export with the login in its header. */
export const eqslUploadAdif = (qsos: QSO[], { user, password, qthNickname }: Credentials): string => {
    const base = header();
    return AdifAPI.generateFile(qsos, {
        ...base,
        fields: {
            ...base.fields,
            eqsl_user: user,
            eqsl_pswd: password,
            ...(qthNickname ? { app_eqsl_qth_nickname: qthNickname } : {}),
        },
    });
};

export type EqslChunkResult = {
    /** Records eQSL now holds: newly added, or already there from an earlier upload. */
    accepted: number;
    added: number;
    duplicates: number;
    /** eQSL's own words for anything it flagged, duplicates aside. */
    problems: string[];
};

/** Reads eQSL's answer to one upload. Throws when it isn't an upload result at all. */
export const parseUploadResult = (body: string): EqslChunkResult => {
    const result = body.match(/result:\s*(\d+)\s+out of\s+(\d+)\s+records? added/i);
    if (!result) {
        const status = classify(body);
        throw new EqslError(
            status,
            status === "auth"
                ? authMessage
                : flaggedLines(body)[0] || "eQSL answered with something that isn't an upload result.",
        );
    }
    // eQSL cautions that it doesn't know the logger on every upload from a program it hasn't
    // registered, even though the header carries a PROGRAMID. It changes nothing, so it isn't news.
    const flagged = flaggedLines(body).filter((l) => !/programid or logger not found/i.test(l));
    const duplicates = flagged.filter((l) => /duplicate/i.test(l)).length;
    const added = +result[1];
    return { accepted: added + duplicates, added, duplicates, problems: flagged.filter((l) => !/duplicate/i.test(l)) };
};

/**
 * Sends one batch. The credentials ride in the ADIF header, inside a POST body, so nothing secret
 * ends up in a URL.
 */
export const uploadChunk = async (qsos: QSO[], credentials: Credentials): Promise<EqslChunkResult> => {
    let body: string;
    try {
        const response = await axios.post<string>(
            relayed(UPLOAD_URL),
            `ADIFData=${encodeURIComponent(eqslUploadAdif(qsos, credentials))}`,
            {
                timeout: TIMEOUT_MS,
                responseType: "text",
                transformResponse: [(d) => d],
                headers: { "content-type": "application/x-www-form-urlencoded" },
            },
        );
        body = typeof response.data === "string" ? response.data : String(response.data);
    } catch (e) {
        throw new EqslError("offline", `Could not reach eQSL: ${e instanceof Error ? e.message : String(e)}`);
    }
    return parseUploadResult(body);
};

export type EqslUploadResult = {
    /** QSOs that are now on eQSL, and can be marked as sent. */
    sent: QSO[];
    added: number;
    duplicates: number;
    /** QSOs held back because their batch had something eQSL didn't take. */
    held: number;
    problems: string[];
};

/**
 * Uploads in batches, one after the other. eQSL's answer names a problem record only in prose, so a
 * batch is only counted as sent when every record in it is accounted for — added, or a duplicate of
 * one it already had. Anything short of that holds the whole batch back: it goes again next time,
 * where the ones that did land come back as harmless duplicates.
 *
 * A failure part way through keeps what the earlier batches achieved: `onChunk` hands each one over
 * as it lands, so the caller can mark it sent before the next is tried.
 */
export const uploadToEqsl = async (
    qsos: QSO[],
    credentials: Credentials,
    onChunk: (sent: QSO[]) => void = () => {},
): Promise<EqslUploadResult> => {
    const total: EqslUploadResult = { sent: [], added: 0, duplicates: 0, held: 0, problems: [] };
    for (let i = 0; i < qsos.length; i += UPLOAD_CHUNK) {
        const chunk = qsos.slice(i, i + UPLOAD_CHUNK);
        const result = await uploadChunk(chunk, credentials);
        total.added += result.added;
        total.duplicates += result.duplicates;
        total.problems.push(...result.problems);
        if (result.accepted >= chunk.length) {
            total.sent.push(...chunk);
            onChunk(chunk);
        } else total.held += chunk.length;
    }
    return total;
};
