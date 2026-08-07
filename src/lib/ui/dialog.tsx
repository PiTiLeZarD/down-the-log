import React from "react";
import { Animated, Modal as RNModal, Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { create } from "zustand";
import { Stack } from "../components/stack";
import { Button } from "./button";
import { Icon, IconName } from "./icon";
import { ColourVariant } from "./theme";
import { Typography } from "./typography";

export type DialogIcon = "info" | "success" | "warning" | "error" | "question";

const icons: Record<DialogIcon, { name: IconName; colour: ColourVariant }> = {
    info: { name: "information-circle-outline", colour: "primary" },
    success: { name: "checkmark-circle-outline", colour: "success" },
    warning: { name: "warning-outline", colour: "secondary" },
    error: { name: "alert-circle-outline", colour: "danger" },
    question: { name: "help-circle-outline", colour: "primary" },
};

export type DialogProps = {
    title: string;
    text?: string;
    icon?: DialogIcon;
    confirmButtonText?: string;
    // Omitting this makes the dialog a plain acknowledgement: one button, no way to answer "no".
    cancelButtonText?: string;
    confirmColour?: ColourVariant;
};

type PendingDialog = DialogProps & { resolve: (confirmed: boolean) => void };

// A queue rather than a single slot: firing a dialog from a callback that itself resolved a dialog
// is common here, and dropping the second one silently would be the worst failure mode.
const useDialogStore = create<{
    queue: PendingDialog[];
    // The dialog that just closed, kept only so the fade-out animates a filled card, not an empty one.
    last?: DialogProps;
    push: (dialog: PendingDialog) => void;
    resolve: (confirmed: boolean) => void;
}>((set, get) => ({
    queue: [],
    push: (dialog) => set({ queue: [...get().queue, dialog] }),
    resolve: (confirmed) => {
        const [current, ...rest] = get().queue;
        if (!current) return;
        set({ queue: rest, last: current });
        current.resolve(confirmed);
    },
}));

/**
 * Fire a dialog from anywhere — hooks, event handlers, plain functions. Resolves `true` when the
 * confirm button is pressed, `false` on cancel, backdrop press, Escape or Android back.
 * Requires <DialogHost /> mounted once, in the root layout.
 */
export const showDialog = (dialog: DialogProps) =>
    new Promise<boolean>((resolve) => useDialogStore.getState().push({ ...dialog, resolve }));

const styles = StyleSheet.create((theme) => ({
    centre: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: theme.margins.xxl,
    },
    card: {
        width: "100%",
        maxWidth: 420,
        backgroundColor: theme.background,
        borderRadius: theme.margins.lg,
        borderWidth: 1,
        borderColor: theme.colours.grey.light,
        padding: theme.margins.xxl * 1.5,
        gap: theme.margins.xxl,
        // Softens the card against the backdrop; on Android elevation does the same job.
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 8 },
        elevation: 8,
    },
    title: {
        textAlign: "center",
        marginTop: 0,
        marginBottom: 0,
    },
    text: {
        textAlign: "center",
        color: theme.text.main,
    },
    buttons: {
        justifyContent: "center",
    },
}));

export const DialogHost = () => {
    const current = useDialogStore((state) => state.queue[0]);
    const last = useDialogStore((state) => state.last);
    const resolve = useDialogStore((state) => state.resolve);

    const shown = current ?? last;
    const open = current !== undefined;

    const [scale] = React.useState(() => new Animated.Value(0.94));
    React.useEffect(() => {
        if (!open) {
            scale.setValue(0.94);
            return;
        }
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 260 }).start();
    }, [open, scale]);

    if (!shown) return null;

    const { title, text, icon, confirmButtonText = "OK", cancelButtonText, confirmColour } = shown;
    const iconProps = icon ? icons[icon] : undefined;

    return (
        <RNModal animationType="fade" transparent visible={open} onRequestClose={() => resolve(false)}>
            {/* Backdrop styles stay inline: they're theme-independent, and the dim needs to sit
                behind the card without Unistyles' non-enumerable descriptors in the way. */}
            <Pressable
                style={{ flex: 1, backgroundColor: "rgba(0, 0, 0, 0.55)" }}
                onPress={() => resolve(false)}
                accessibilityLabel="Close dialog"
            >
                <View style={styles.centre}>
                    <Animated.View style={{ width: "100%", alignItems: "center", transform: [{ scale }] }}>
                        {/* Swallows the press so tapping the card doesn't hit the backdrop behind it. */}
                        <Pressable onPress={() => {}} style={{ width: "100%", maxWidth: 420 }}>
                            <View style={styles.card}>
                                <Stack gap="lg" style={{ alignItems: "center" }}>
                                    {iconProps && <Icon {...iconProps} size={48} />}
                                    <Typography variant="h4" style={styles.title}>
                                        {title}
                                    </Typography>
                                    {text !== undefined && text !== "" && (
                                        <Typography style={styles.text}>{text}</Typography>
                                    )}
                                </Stack>
                                <Stack direction="row" gap="lg" style={styles.buttons}>
                                    {cancelButtonText !== undefined && (
                                        <Button
                                            variant="outlined"
                                            colour="grey"
                                            text={cancelButtonText}
                                            onPress={() => resolve(false)}
                                        />
                                    )}
                                    <Button
                                        colour={confirmColour ?? iconProps?.colour ?? "primary"}
                                        text={confirmButtonText}
                                        onPress={() => resolve(true)}
                                    />
                                </Stack>
                            </View>
                        </Pressable>
                    </Animated.View>
                </View>
            </Pressable>
        </RNModal>
    );
};
