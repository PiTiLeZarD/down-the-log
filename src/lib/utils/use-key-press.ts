import { useEffect, useEffectEvent } from "react";
import { Platform } from "react-native";

/**
 * Fire `handler` on a physical key press. Web only: it's the one build with a hardware keyboard as
 * the normal way in, and the only one with a document to listen on.
 *
 * The handler is an effect event so a fresh closure every render doesn't rebind the listener, and
 * `enabled` is what callers use to stand down while a modal or a dialog owns the key.
 */
export const useKeyPress = (key: string, handler: () => void, enabled: boolean = true) => {
    const onKey = useEffectEvent(() => handler());

    useEffect(() => {
        if (Platform.OS !== "web" || !enabled) return;
        const listener = (event: KeyboardEvent) => {
            if (event.key !== key) return;
            event.preventDefault();
            onKey();
        };
        document.addEventListener("keydown", listener);
        return () => document.removeEventListener("keydown", listener);
    }, [key, enabled]);
};
