import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import { DateTime } from "luxon";
import { useEffect, useEffectEvent } from "react";
import { useUnistyles } from "react-native-unistyles";
import { baseCallsign, parseCallsign } from "./callsign";
import { latlong2Maidenhead, normalise } from "./locator";
import { useStore } from "./store";
import { fireSwal } from "../ui/swal";
import { ThemeType } from "../ui/theme";
import { useSettings } from "./use-settings";
import { useThrottle } from "./use-throttle";

const ignoreErrors = ["Callsign not found", "timeout exceeded", "Network Error"];

export type HamQTHSettingsType = {
    user: string;
    password: string;
    sessionId?: string;
    sessionStart?: DateTime;
};

export type HamQTHCallsignData = {
    callsign: string;
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

/**
 * `DOMParser` only exists on web, so lookups died on native. `fast-xml-parser` is pure JS. Values
 * stay strings (a grid like 1234 isn't a number) and the parser decodes XML entities for us.
 */
const parser = new XMLParser({ ignoreAttributes: true, parseTagValue: false, trimValues: true });

/** Flat tag -> text map. HamQTH buries its payload under <HamQTH><search> or <session>, and the old
 * `getElementsByTagName` lookup didn't care about depth, so neither does this. First tag wins. */
type XMLDoc = Record<string, string>;

const flatten = (node: unknown, into: XMLDoc = {}): XMLDoc => {
    if (node === null || typeof node !== "object") return into;
    Object.entries(node as Record<string, unknown>).forEach(([tag, value]) =>
        [value].flat().forEach((v) => {
            if (v !== null && typeof v === "object") flatten(v, into);
            else if (!(tag in into)) into[tag] = String(v ?? "");
        }),
    );
    return into;
};

const fetchData = async (params: Record<string, string>) => {
    const response = await axios.get(
        `https://www.hamqth.com/xml.php?${Object.entries(params)
            .map(([k, v]) => `${k}=${v}`)
            .join("&")}`,
    );
    const doc = flatten(parser.parse(response.data));
    const error = pickXML(doc, "error");
    if (error) throw new Error(error);
    return doc;
};

const pickXML = (doc: XMLDoc, tag: string): string | undefined => doc[tag] || undefined;

export const isSessionValid = (hamqth: HamQTHSettingsType | undefined) =>
    hamqth &&
    hamqth.sessionId &&
    hamqth.sessionStart &&
    Math.abs(DateTime.now().diff(hamqth.sessionStart, ["hours"]).toObject().hours || 2) < 1;

export const newSessionId = (hamqth: HamQTHSettingsType | undefined, newSession: string) =>
    ({ ...(hamqth || {}), sessionId: newSession, sessionStart: DateTime.now() }) as HamQTHSettingsType;

const swal = (theme: ThemeType, error: Error) => {
    if (!ignoreErrors.includes(error.message)) {
        fireSwal({ theme, title: "HamQTH Error!", text: error.message, icon: "error", confirmButtonText: "Ok" });
    }
    return undefined;
};

export const fetchSessionId = async (user: string, password: string) =>
    fetchData({ u: user, p: password }).then((doc) => pickXML(doc, "session_id"));

export const fetchCallsignData = async (sessionId: string, callsign: string) =>
    fetchData({ id: sessionId, callsign, prg: "down-the-log" }).then((doc) => {
        if (pickXML(doc, "error")) return undefined;
        return {
            callsign,
            name: pickXML(doc, "nick") || pickXML(doc, "adr_name"),
            qth: pickXML(doc, "qth"),
            country: pickXML(doc, "country"),
            itu: pickXML(doc, "itu"),
            cq: pickXML(doc, "cq"),
            grid: pickXML(doc, "grid")
                ? normalise(pickXML(doc, "grid"))
                : pickXML(doc, "latitude") && pickXML(doc, "longitude")
                  ? latlong2Maidenhead({
                        latitude: +(pickXML(doc, "latitude") as string),
                        longitude: +(pickXML(doc, "longitude") as string),
                    })
                  : undefined,
            email: pickXML(doc, "email"),
            age: pickXML(doc, "birth_year")
                ? DateTime.now().toObject().year - +(pickXML(doc, "birth_year") as string)
                : undefined,
            lic_year: pickXML(doc, "lic_year") ? +(pickXML(doc, "lic_year") as string) : undefined,
            utc_offset: pickXML(doc, "utc_offset") ? +(pickXML(doc, "utc_offset") as string) : undefined,
        } as HamQTHCallsignData;
    });

export const useHamqth = (callsign?: string) => {
    const { theme } = useUnistyles();
    const settings = useSettings();
    const updateSetting = useStore((state) => state.updateSetting);

    // The session id is an argument rather than something `launch` closes over, so that a session
    // refresh changes the throttled arguments and reschedules the lookup. Closing over it would
    // mean the same callsign never gets looked up again once the session it was typed under expired.
    const launch = (cs: string, sessionId?: string) =>
        cs && sessionId ? fetchCallsignData(sessionId, cs).catch((e) => swal(theme, e)) : undefined;
    const throttled = useThrottle(launch, 500);

    // Sessions expire after an hour, so this has to follow the credentials and the validity of the
    // session rather than run once on mount, or lookups go quiet until the app is remounted.
    const user = settings.hamqth?.user;
    const password = settings.hamqth?.password;
    const sessionValid = isSessionValid(settings.hamqth);

    const refreshSession = useEffectEvent(() => {
        if (!user || !password || sessionValid) return;

        console.info("Fetching new hamqth session");
        fetchSessionId(user, password)
            .then((sessionId) => {
                if (sessionId) {
                    updateSetting("hamqth", newSessionId(settings.hamqth, sessionId));
                }
            })
            .catch((e) => swal(theme, e));
    });
    useEffect(() => refreshSession(), [user, password, sessionValid]);

    if (callsign) {
        const parsedCallsign = parseCallsign(callsign);
        const bcs = baseCallsign(callsign);

        if (bcs && (parsedCallsign?.delineation || "").length) {
            return throttled(bcs, sessionValid ? settings.hamqth?.sessionId : undefined);
        }
    }

    return undefined;
};
