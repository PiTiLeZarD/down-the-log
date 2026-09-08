import { Platform } from "react-native";
import type { NotifyBackend, NotifyOptions, NotifyPermission } from "./types";

// The iOS and Android notifier, over expo-notifications. Local notifications only — the same poll
// the web build runs, raised on the device that did the polling. Nothing is registered for push, so
// no token leaves the app and nothing arrives while it is closed. Worse than that on iOS, in fact:
// the OS suspends the timers a backgrounded app is running, so the poll — and with it the alert —
// stops until the operator comes back to the app.
//
// Requires a development or EAS build. The module is native, so it is absent from Expo Go.

export const SPOT_CHANNEL = "spots";

type Module = typeof import("expo-notifications");

// Imported on demand, so the web bundle never carries it: the package resolves on web too, and a
// static import would put the whole notification module in front of every browser.
let module: Promise<Module> | undefined;

const load = (): Promise<Module> =>
    (module ??= import("expo-notifications").then(async (notifications) => {
        // Without a handler, a notification raised while the app is in the foreground is delivered
        // silently — and the foreground is the only place this app ever raises one, so leaving it
        // out would mean nothing was ever shown.
        notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowBanner: true,
                shouldShowList: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
            }),
        });
        // Android puts every notification in a channel, and one created implicitly can't be given a
        // name or an importance later — the operator would find "Miscellaneous" in system settings
        // with no way to tell what it was for.
        if (Platform.OS === "android")
            await notifications.setNotificationChannelAsync(SPOT_CHANNEL, {
                name: "Spot alerts",
                importance: notifications.AndroidImportance.DEFAULT,
                // A spot is worth a glance, not a takeover of whatever is on screen.
                lockscreenVisibility: notifications.AndroidNotificationVisibility.PRIVATE,
            });
        return notifications;
    }));

const map = (status: string): NotifyPermission =>
    status === "granted" ? "granted" : status === "denied" ? "denied" : "default";

const permission = async (): Promise<NotifyPermission> => {
    try {
        const { getPermissionsAsync } = await load();
        const { status, ios } = await getPermissionsAsync();
        // iOS grants "provisional" authorisation as `undetermined` with a status of its own: quiet
        // delivery straight to the notification centre, which still counts as being allowed.
        if (ios?.status === 3 /* PROVISIONAL */) return "granted";
        return map(status);
    } catch {
        return "unsupported";
    }
};

const request = async (): Promise<NotifyPermission> => {
    try {
        const { requestPermissionsAsync } = await load();
        const { status } = await requestPermissionsAsync({
            ios: { allowAlert: true, allowSound: true, allowBadge: false },
        });
        return map(status);
    } catch {
        return "unsupported";
    }
};

const send = async ({ title, body, tag, url }: NotifyOptions): Promise<void> => {
    try {
        const notifications = await load();
        const { status } = await notifications.getPermissionsAsync();
        if (status !== "granted") return;
        await notifications.scheduleNotificationAsync({
            // The web notifier's `tag` by another name: scheduling under an identifier that is
            // already on screen replaces it rather than stacking a second copy.
            identifier: tag,
            content: {
                title,
                body,
                // Read back by use-notification-taps to decide where a tap lands.
                data: url ? { url } : {},
                ...(Platform.OS === "android" ? { channelId: SPOT_CHANNEL } : {}),
            },
            // Now, rather than on a schedule. The poll already decided this was news.
            trigger: null,
        });
    } catch {
        // A build without the native module — Expo Go — throws on import. One lost alert is not
        // worth taking the poller down with it.
    }
};

export const nativeBackend: NotifyBackend = {
    supported: () => Platform.OS === "ios" || Platform.OS === "android",
    permission,
    request,
    send,
};
