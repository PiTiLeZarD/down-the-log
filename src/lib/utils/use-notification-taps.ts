import { router } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";

// A tapped notification has to land somewhere. On web the service worker does this — it is the only
// thing that can focus the tab, see public/sw.js — and on the Tauri desktop bundle nothing does,
// because the plugin's tap events only arrive on its mobile targets and the window is already open
// anyway. This is the iOS and Android half: expo-notifications hands the tap to the app, and the
// `url` the alert was raised with says which screen it meant.
//
// Mounted once, from the root layout.
export const useNotificationTaps = () => {
    useEffect(() => {
        if (Platform.OS !== "ios" && Platform.OS !== "android") return;
        let subscription: { remove: () => void } | undefined;
        let cancelled = false;
        // Same dynamic import as utils/notify/native, and the same reason: the module is native, so
        // a build without it (Expo Go) must fail here rather than at bundle load.
        void import("expo-notifications")
            .then((notifications) => {
                if (cancelled) return;
                subscription = notifications.addNotificationResponseReceivedListener((response) => {
                    const url = response.notification.request.content.data?.url;
                    if (typeof url === "string" && url) router.navigate(`/${url}`);
                });
            })
            .catch(() => undefined);
        return () => {
            cancelled = true;
            subscription?.remove();
        };
    }, []);
};
