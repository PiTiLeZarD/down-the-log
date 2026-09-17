import axios from "axios";
import { DateTime } from "luxon";
import { Platform } from "react-native";
import { applyProxy } from "./spots/fetch";

/**
 * LoTW account, used only to pull confirmations. The password is the LoTW website password — the
 * same one used at lotw.arrl.org — and has nothing to do with the callsign certificate: this asks
 * LoTW what it has already matched, it never signs or uploads anything.
 */
export type LotwSettingsType = {
    user: string;
    password: string;
};

/** What a fetch did, so the button can say it without a dialog for the ordinary cases. */
export type LotwStatus = "idle" | "loading" | "done" | "auth" | "blocked" | "offline" | "error";

const REPORT_URL = "https://lotw.arrl.org/lotwuser/lotwreport.adi";

// LoTW's report always ends with this. Anything else it hands back — a login page, a maintenance
// notice, a relay's own error — is not a report, and the importer must never see it: a body with no
// records parses to nothing at all, which would otherwise be reported as a cheerful "0 records".
const EOF_MARKER = "<app_lotw_eof>";

// The report is generated on request, and a first full-history pull on a big log is not quick.
const TIMEOUT_MS = 120000;

export class LotwError extends Error {
    constructor(
        readonly status: LotwStatus,
        message: string,
    ) {
        super(message);
    }
}

/**
 * Credentials travel in the query string — LoTW's API takes them no other way — so this URL is a
 * secret in its own right. It must never be logged, and never handed to a relay the operator
 * didn't choose themselves.
 */
export const lotwReportUrl = ({
    user,
    password,
    since,
    callsign,
}: {
    user: string;
    password: string;
    since: string;
    callsign?: string;
}): string => {
    const params: Record<string, string> = {
        login: user,
        password,
        qso_query: "1",
        // Confirmations only: the log already holds the QSOs, and asking for them too turns a small
        // report into the operator's entire LoTW history.
        qso_qsl: "yes",
        qso_qsldetail: "yes",
        qso_qslsince: since,
    };
    // Without this LoTW reports every callsign on the account, including ones logged elsewhere.
    if (callsign) params.qso_owncall = callsign;
    return `${REPORT_URL}?${Object.entries(params)
        .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
        .join("&")}`;
};

/**
 * Where the request can actually go. Native builds call LoTW directly — there's no CORS in a native
 * HTTP stack. Browsers can't: lotw.arrl.org serves no `access-control-allow-origin`, and that
 * covers the Tauri shell too, which is a webview and plays by the same rules.
 *
 * The public relays in utils/spots/fetch are deliberately not offered here. They're fine for spot
 * data, which is public; this URL carries the operator's LoTW password and their confirmed log, and
 * a relay sees both in full. So the web build needs the operator's own relay or nothing — see
 * scripts/cors-worker.js.
 */
export const lotwSource = (url: string, proxy?: string): string | undefined => {
    if (Platform.OS !== "web") return url;
    return proxy ? applyProxy(proxy, url) : undefined;
};

/** LoTW answers failures as prose, so the reason has to be read out of the body. */
const classify = (body: string): LotwStatus => {
    if (/username\/password|incorrect|invalid.*password|login/i.test(body)) return "auth";
    return "error";
};

/**
 * The raw ADIF report, ready for the same importer a dropped file goes through. Throws a
 * `LotwError` carrying a status the UI can phrase, rather than a bare network error.
 */
export const fetchLotwConfirmations = async ({
    user,
    password,
    since,
    callsign,
    proxy,
}: {
    user: string;
    password: string;
    since: string;
    callsign?: string;
    proxy?: string;
}): Promise<string> => {
    const source = lotwSource(lotwReportUrl({ user, password, since, callsign }), proxy);
    if (!source)
        throw new LotwError(
            "blocked",
            "LoTW doesn't allow browsers to call it directly. Set your own relay in Settings > API's, or use the link below to download the file by hand.",
        );

    let body: string;
    try {
        // transformResponse is off on purpose: axios would otherwise try to read an ADIF body that
        // happens to start with a brace as JSON and hand back an object.
        const response = await axios.get<string>(source, {
            timeout: TIMEOUT_MS,
            responseType: "text",
            transformResponse: [(d) => d],
        });
        body = typeof response.data === "string" ? response.data : String(response.data);
    } catch (e) {
        throw new LotwError("offline", `Could not reach LoTW: ${e instanceof Error ? e.message : String(e)}`);
    }

    if (!body.toLowerCase().includes(EOF_MARKER)) {
        const status = classify(body);
        throw new LotwError(
            status,
            status === "auth"
                ? "LoTW refused those credentials. Check your user name and password in Settings > API's."
                : "LoTW answered with something that isn't a report. Try again in a moment.",
        );
    }
    return body;
};

/**
 * The window to ask for. `qso_qslsince` is about when LoTW *matched* a QSL, not when the QSO
 * happened, so a successful pull can move it forward — but only to a day before the pull, because
 * LoTW timestamps a match in its own time and a same-day boundary can drop one.
 */
export const nextQslSince = (): string => DateTime.utc().minus({ days: 1 }).toFormat("yyyy-MM-dd");
