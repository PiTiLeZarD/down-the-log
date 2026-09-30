import { Linking } from "react-native";
import { isTauri } from "./notify";

// The Tauri webview drops `window.open`, which is all react-native-web's Linking.openURL does, so a
// link out of the desktop build goes to the OS browser over IPC instead. See the opener permission
// in src-tauri/capabilities/migrated.json and the plugin registration in src-tauri/src/main.rs.
export const openURL = async (url: string): Promise<void> => {
    if (isTauri()) {
        const { openUrl } = await import("@tauri-apps/plugin-opener");
        await openUrl(url);
        return;
    }
    if (await Linking.canOpenURL(url)) await Linking.openURL(url);
};
