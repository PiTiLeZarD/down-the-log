import { Platform } from "react-native";

// Local notifications only. Everything here is raised by the running app off the back of a poll the
// app itself did — nothing is pushed from a server, so nothing arrives while the app is closed. The
// spots poller stops with the last subscriber (see utils/spots/use-spots), which makes "the app is
// open" the honest limit to advertise.
//
// Web and installed PWA go through the service worker rather than `new Notification()`: the
// constructor throws outright on Android Chrome and in an iOS standalone window, and the worker's
// `notificationclick` handler is the only thing that can bring the tab back to the front when a
// notification is tapped. The constructor stays as the fallback for a plain desktop tab with no
// worker registered, and for the Tauri bundle, where scripts/pwa.mjs deliberately registers none.
//
// Tauri's own notification plugin and expo-notifications on iOS/Android are not wired up yet: on
// those builds `notificationsSupported()` answers false and the settings screen says so rather than
// offering a switch that quietly does nothing.

export type NotifyPermission = "granted" | "denied" | "default" | "unsupported";

export type NotifyOptions = {
    title: string;
    body: string;
    // Collapses a repeat onto the notification already on screen instead of stacking a second copy
    // of the same activation.
    tag: string;
    // Where a tap should land, relative to the app's own base path.
    url?: string;
};

const webNotifications = (): typeof Notification | undefined =>
    Platform.OS === "web" && typeof window !== "undefined" && "Notification" in window ? window.Notification : undefined;

export const notificationsSupported = (): boolean => !!webNotifications();

export const notificationPermission = (): NotifyPermission =>
    (webNotifications()?.permission as NotifyPermission) || "unsupported";

/**
 * Ask for permission. Must be called from inside a user gesture: Safari grants from nowhere else,
 * and on iOS only for a PWA that has been added to the home screen. A denial is permanent until the
 * operator clears it in the browser's own site settings, so the answer is worth showing them.
 */
export const requestNotificationPermission = async (): Promise<NotifyPermission> => {
    const api = webNotifications();
    if (!api) return "unsupported";
    try {
        return (await api.requestPermission()) as NotifyPermission;
    } catch {
        return "denied";
    }
};

// `navigator.serviceWorker.ready` never settles when nothing is registered, which would hang the
// caller forever on the Tauri build. `getRegistration()` resolves with undefined instead.
const registration = async (): Promise<ServiceWorkerRegistration | undefined> => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return undefined;
    try {
        return await navigator.serviceWorker.getRegistration();
    } catch {
        return undefined;
    }
};

export const notify = async ({ title, body, tag, url }: NotifyOptions): Promise<void> => {
    const api = webNotifications();
    if (!api || api.permission !== "granted") return;

    const sw = await registration();
    // Addressed through the worker's scope for the same reason sw.js does everything that way: the
    // export is served from /down-the-log/ on GitHub Pages and from the bundle root under Tauri.
    const icon = sw ? new URL("icons/icon-192.png", sw.scope).href : undefined;
    const options: NotificationOptions = { body, tag, icon, data: { url } };

    if (sw?.active) {
        await sw.showNotification(title, options);
        return;
    }
    // No worker — the Expo dev server, a plain http tab, or the Tauri bundle, where scripts/pwa.mjs
    // deliberately registers none.
    try {
        new api(title, options);
    } catch {
        // Android Chrome and an iOS standalone window refuse the constructor outright, and without a
        // worker there is nowhere left to put it.
    }
};
