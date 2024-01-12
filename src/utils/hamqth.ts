import axios from "axios";
import { DateTime } from "luxon";
import { normalise } from "./locator";

export type HamQTHSettingsType = {
    user: string;
    password: string;
    sessionId?: string;
    sessionStart?: DateTime;
};

export type HamQTHCallsignData = {
    name: string;
    qth: string;
    country: string;
    itu: string;
    cq: string;
    grid: string;
    email: string;
    age: number;
    lic_year: number;
    utc_offset: number;
};

const fetchData = async (params: Record<string, string>) => {
    const response = await axios.get(
        `https://www.hamqth.com/xml.php?${Object.entries(params)
            .map(([k, v]) => `${k}=${v}`)
            .join("&")}`,
    );
    const parser = new DOMParser();
    const doc = parser.parseFromString(response.data, "text/xml");
    return doc;
};

const pickXML = (doc: Document, tag: string): string | undefined => {
    const els = doc.getElementsByTagName(tag);
    if (els && els.length) return els[0].innerHTML;
    return undefined;
};

export const isSessionValid = (hamqth: HamQTHSettingsType | undefined) =>
    hamqth &&
    hamqth.sessionId &&
    hamqth.sessionStart &&
    Math.abs(DateTime.now().diff(hamqth.sessionStart, ["hours"]).toObject().hours || 2) < 1;

export const newSessionId = (hamqth: HamQTHSettingsType | undefined, newSession: string) =>
    ({ ...(hamqth || {}), sessionId: newSession, sessionStart: DateTime.now() }) as HamQTHSettingsType;

export const fetchSessionId = async (user: string, password: string) =>
    fetchData({ u: user, p: password }).then((doc) => pickXML(doc, "session_id"));
export const fetchCallsignData = async (sessionId: string | undefined, callsign: string) => {
    if (!sessionId) throw new Error("Missing session ID");
    return fetchData({ id: sessionId, callsign, prg: "down-the-log" }).then((doc) => {
        if (pickXML(doc, "error")) return undefined;
        return {
            name: pickXML(doc, "nick") || pickXML(doc, "adr_name"),
            qth: pickXML(doc, "qth"),
            country: pickXML(doc, "country"),
            itu: pickXML(doc, "itu"),
            cq: pickXML(doc, "cq"),
            grid: normalise(pickXML(doc, "grid")),
            email: pickXML(doc, "email"),
            age: pickXML(doc, "birth_year")
                ? DateTime.now().toObject().year - +(pickXML(doc, "birth_year") as string)
                : undefined,
            lic_year: pickXML(doc, "lic_year") ? +(pickXML(doc, "lic_year") as string) : undefined,
            utc_offset: pickXML(doc, "utc_offset") ? +(pickXML(doc, "utc_offset") as string) : undefined,
        } as HamQTHCallsignData;
    });
};
