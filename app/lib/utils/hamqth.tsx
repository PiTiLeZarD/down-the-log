import axios from "axios";
import { DateTime } from "luxon";
import { useEffect } from "react";
import { useStyles } from "react-native-unistyles";
import { baseCallsign, parseCallsign } from "./callsign";
import { latlong2Maidenhead, normalise } from "./locator";
import { useStore } from "./store";
import { fireSwal } from "./theme/swal";
import { ThemeType } from "./theme/theme";
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

const fetchData = async (params: Record<string, string>) => {
    const response = await axios.get(
        `https://www.hamqth.com/xml.php?${Object.entries(params)
            .map(([k, v]) => `${k}=${v}`)
            .join("&")}`,
    );
    const parser = new DOMParser();
    const doc = parser.parseFromString(response.data, "text/xml");
    const error = pickXML(doc, "error");
    if (error) throw new Error(error);
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
    const { theme } = useStyles();
    const settings = useSettings();
    const updateSetting = useStore((state) => state.updateSetting);

    const launch = (cs: string) => {
        if (cs && isSessionValid(settings.hamqth)) {
            return fetchCallsignData(settings.hamqth?.sessionId as string, cs).catch((e) => swal(theme, e));
        }
        return undefined;
    };
    const throttled = useThrottle(launch, 500);

    useEffect(() => {
        if (settings.hamqth?.user && settings.hamqth.password) {
            if (!isSessionValid(settings.hamqth)) {
                console.info("Fetching new hamqth session");
                fetchSessionId(settings.hamqth.user, settings.hamqth.password)
                    .then((sessionId) => {
                        if (sessionId) {
                            updateSetting("hamqth", newSessionId(settings.hamqth, sessionId));
                        }
                    })
                    .catch((e) => swal(theme, e));
            }
        }
    }, []);

    if (callsign) {
        const parsedCallsign = parseCallsign(callsign);
        const bcs = baseCallsign(callsign);

        if (bcs && (parsedCallsign?.delineation || "").length) {
            return throttled(bcs);
        }
    }

    return undefined;
};
