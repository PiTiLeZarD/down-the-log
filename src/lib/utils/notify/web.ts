import { Platform } from "react-native";
import type { NotifyBackend, NotifyOptions, NotifyPermission } from "./types";

// The browser notifier: a plain tab and the installed PWA.
//
// Both go through the service worker rather than `new Notification()`: the constructor throws
// outright on Android Chrome and in an iOS standalone window, and the worker's `notificationclick`
// handler is the only thing that can bring the tab back to the front when a notification is tapped.
// The constructor stays as the fallback for a desktop tab with no worker registered — the Expo dev
// server, or a plain http origin.

const api = (): typeof Notification | undefined =>
    Platform.OS === "web" && typeof window !== "undefined" && "Notification" in window
        ? window.Notification
        : undefined;

const supported = () => !!api();

const permission = async (): Promise<NotifyPermission> => (api()?.permission as NotifyPermission) || "unsupported";

/**
 * Ask for permission. A denial is permanent until the operator clears it in the browser's own site
 * settings, so the answer is worth showing them. On iOS it is only ever granted for a PWA that has
 * been added to the Home Screen.
 */
const request = async (): Promise<NotifyPermission> => {
    const notification = api();
    if (!notification) return "unsupported";
    try {
        return (await notification.requestPermission()) as NotifyPermission;
    } catch {
        return "denied";
    }
};

// `navigator.serviceWorker.ready` never settles when nothing is registered, which would hang the
// caller forever. `getRegistration()` resolves with undefined instead.
const registration = async (): Promise<ServiceWorkerRegistration | undefined> => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return undefined;
    try {
        return await navigator.serviceWorker.getRegistration();
    } catch {
        return undefined;
    }
};

const send = async ({ title, body, tag, url }: NotifyOptions): Promise<void> => {
    const notification = api();
    if (!notification || notification.permission !== "granted") return;

    const sw = await registration();
    // Addressed through the worker's scope for the same reason sw.js does everything that way: the
    // export is served from /down-the-log/ on GitHub Pages and from the bundle root under Tauri.
    const icon = sw ? new URL("icons/icon-192.png", sw.scope).href : undefined;
    const options: NotificationOptions = { body, tag, icon, data: { url } };

    if (sw?.active) {
        await sw.showNotification(title, options);
        return;
    }
    try {
        new notification(title, options);
    } catch {
        // Android Chrome and an iOS standalone window refuse the constructor outright, and without a
        // worker there is nowhere left to put it.
    }
};

export const webBackend: NotifyBackend = { supported, permission, request, send };
