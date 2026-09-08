import { Platform } from "react-native";
import { nativeBackend } from "./native";
import { isTauri, tauriBackend } from "./tauri";
import type { NotifyBackend, NotifyOptions, NotifyPermission } from "./types";
import { webBackend } from "./web";

// Local notifications only. Everything here is raised by the running app off the back of a poll the
// app itself did — nothing is pushed from a server, so nothing arrives while the app is closed. The
// spots poller stops with the last subscriber (see utils/spots/use-spots), which makes "the app is
// open" the honest limit to advertise on every platform.
//
// Three notifiers, one per way this app is shipped: ./web for a browser tab and the installed PWA,
// ./tauri for the desktop bundle, which runs the same web build with no service worker and no usable
// `Notification` constructor, and ./native for iOS and Android over expo-notifications.

export type { NotifyBackend, NotifyOptions, NotifyPermission };
export { isTauri };

// Picked per call rather than once at import: `isTauri` reads a global the Tauri runtime injects,
// and this module is imported by the store, which is pulled in early enough that reading it at
// module scope is a race worth not having.
const backend = (): NotifyBackend => (Platform.OS === "web" ? (isTauri() ? tauriBackend : webBackend) : nativeBackend);

/** Whether this build can raise a notification at all. Synchronous, so the settings screen can
 * decide between offering a switch and explaining why there isn't one without a render pass. */
export const notificationsSupported = (): boolean => backend().supported();

export const notificationPermission = async (): Promise<NotifyPermission> => {
    const active = backend();
    return active.supported() ? active.permission() : "unsupported";
};

/**
 * Ask for permission. Must be called from inside a user gesture: Safari grants from nowhere else,
 * and Android's runtime prompt holds the same rule.
 */
export const requestNotificationPermission = async (): Promise<NotifyPermission> => {
    const active = backend();
    return active.supported() ? active.request() : "unsupported";
};

export const notify = async (options: NotifyOptions): Promise<void> => {
    const active = backend();
    if (active.supported()) await active.send(options);
};
