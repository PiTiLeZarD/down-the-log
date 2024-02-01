import axios from "axios";
import debounce from "debounce";
import { DateTime } from "luxon";
import React, { useEffect } from "react";
import Swal from "sweetalert2";
import { useStore } from "../store";
import { baseCallsign, parseCallsign } from "./callsign";
import { latlong2Maidenhead, normalise } from "./locator";
import { SwalTheme } from "./theme/theme";
import { useSettings } from "./use-settings";

const ignoreErrors = ["Callsign not found", "timeout exceeded", "Network Error"];

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

const swal = (error: Error) => {
    if (!ignoreErrors.includes(error.message)) {
        Swal.fire({
            ...SwalTheme,
            title: "HamQTH Error!",
            text: error.message,
            icon: "error",
            confirmButtonText: "Ok",
        });
    }
    return undefined;
};

export const fetchSessionId = async (user: string, password: string) =>
    fetchData({ u: user, p: password })
        .then((doc) => pickXML(doc, "session_id"))
        .catch(swal);

export const fetchCallsignData = async (sessionId: string | undefined, callsign: string) => {
    if (!sessionId) return swal(new Error("Missing session ID"));
    return fetchData({ id: sessionId, callsign, prg: "down-the-log" })
        .then((doc) => {
            if (pickXML(doc, "error")) return undefined;
            return {
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
        })
        .catch(swal);
};

export const useHamqth = (callsign?: string) => {
    const [hamqthCsData, setHamqthCsData] = React.useState<HamQTHCallsignData | undefined>(undefined);
    const settings = useSettings();
    const updateSetting = useStore((state) => state.updateSetting);

    useEffect(() => {
        if (settings.hamqth?.user && settings.hamqth.password) {
            if (!isSessionValid(settings.hamqth)) {
                console.info("Fetching new hamqth session");
                fetchSessionId(settings.hamqth.user, settings.hamqth.password).then((sessionId) => {
                    if (sessionId) {
                        updateSetting("hamqth", newSessionId(settings.hamqth, sessionId));
                    }
                });
            }
        }
    }, []);

    useEffect(
        debounce(() => {
            if (callsign) {
                const parsedCallsign = parseCallsign(callsign);
                const bcs = baseCallsign(callsign);
                if (bcs && (parsedCallsign?.delineation || "").length && isSessionValid(settings.hamqth)) {
                    fetchCallsignData(settings.hamqth?.sessionId, bcs).then((data) => setHamqthCsData(data));
                } else {
                    setHamqthCsData(undefined);
                }
            }
        }, 500),
        [callsign],
    );

    return hamqthCsData;
};
