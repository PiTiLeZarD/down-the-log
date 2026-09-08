import { Platform } from "react-native";
import type { NotifyBackend, NotifyOptions, NotifyPermission } from "./types";
import { tagId } from "./types";

// The desktop notifier. Tauri runs the same exported web build as the browser, but with no service
// worker (scripts/pwa.mjs deliberately registers none there) and, on macOS and Windows, no working
// `Notification` constructor inside the webview — so the OS notification has to be raised over IPC
// by tauri-plugin-notification instead. See src-tauri/capabilities/migrated.json for the permission
// that allows it and src-tauri/src/main.rs for the plugin registration.

/** Tauri v2 injects this into every window it opens; nothing else distinguishes it from a tab. */
export const isTauri = (): boolean => typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

type Plugin = typeof import("@tauri-apps/plugin-notification");

// Imported on demand: on the web build this module is still bundled, and a static import would send
// the plugin's IPC shim to every browser that will never call it.
let plugin: Promise<Plugin> | undefined;
const load = (): Promise<Plugin> => (plugin ??= import("@tauri-apps/plugin-notification"));

// `isPermissionGranted()` answers a boolean, so a refusal and a never-asked look identical to it.
// Whatever the last prompt returned is remembered for the session, which is the only way the
// settings screen can tell the operator that the OS is the thing saying no.
let denied = false;

const permission = async (): Promise<NotifyPermission> => {
    try {
        const { isPermissionGranted } = await load();
        if (await isPermissionGranted()) return "granted";
        return denied ? "denied" : "default";
    } catch {
        return "unsupported";
    }
};

const request = async (): Promise<NotifyPermission> => {
    try {
        const { isPermissionGranted, requestPermission } = await load();
        if (await isPermissionGranted()) return "granted";
        const answer = (await requestPermission()) as NotifyPermission;
        denied = answer !== "granted";
        return answer;
    } catch {
        return "unsupported";
    }
};

const send = async ({ title, body, tag }: NotifyOptions): Promise<void> => {
    try {
        const { isPermissionGranted, sendNotification } = await load();
        if (!(await isPermissionGranted())) return;
        // No `url`: the plugin's tap events only arrive on the mobile targets, so on desktop a tap
        // does nothing beyond dismissing. The window is already open — that is where the operator
        // is going anyway.
        sendNotification({ id: tagId(tag), title, body });
    } catch {
        // A build whose capabilities are missing the notification permission rejects the IPC call.
        // Losing one alert is not worth taking the poller down with it.
    }
};

export const tauriBackend: NotifyBackend = {
    supported: () => Platform.OS === "web" && isTauri(),
    permission,
    request,
    send,
};
