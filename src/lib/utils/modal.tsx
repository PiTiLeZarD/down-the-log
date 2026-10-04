import React, { PropsWithChildren } from "react";
import { Modal as RNModal, ScrollView, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";
import { Grid } from "../components/grid";

const styles = StyleSheet.create((theme) => ({
    container: {
        backgroundColor: theme.background,
        flex: 1,
    },
    pinned: {
        paddingTop: theme.margins.lg,
        paddingBottom: theme.margins.lg,
    },
    // Capped in pixels rather than by flex or a percentage: the Grid item is laid out by width and
    // carries no height of its own, so there's nothing for either to resolve against.
    frame: (maxHeight: number) => ({
        maxHeight,
        flexDirection: "column",
    }),
}));

export type ModalProps = PropsWithChildren<{
    open: boolean;
    wide?: boolean;
    onClose: () => void;
    /** Pinned above the scrolling body. */
    header?: React.ReactNode;
    /** Pinned below the scrolling body, so the way out is always on screen. */
    footer?: React.ReactNode;
}>;

export const Modal = ({ open, wide, onClose, header, footer, children }: ModalProps) => {
    const { height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const framed = header !== undefined || footer !== undefined;

    return (
        <RNModal animationType="none" visible={open} onRequestClose={onClose} transparent>
            <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
                <Grid container>
                    <Grid
                        item
                        {...(wide ? { xs: -1, md: 1, lg: 2, xl: 3, xxl: 4 } : { xs: 1, md: 2, lg: 3, xl: 4, xxl: 5 })}
                    />
                    <Grid
                        item
                        {...(wide ? { xs: 12, md: 10, lg: 8, xl: 6, xxl: 4 } : { xs: 10, md: 8, lg: 6, xl: 4, xxl: 2 })}
                    >
                        {framed ? (
                            <View style={styles.frame(height - insets.top - insets.bottom)}>
                                {header !== undefined && <View style={styles.pinned}>{header}</View>}
                                <ScrollView style={{ flexShrink: 1, flexGrow: 0 }}>{children}</ScrollView>
                                {footer !== undefined && <View style={styles.pinned}>{footer}</View>}
                            </View>
                        ) : (
                            children
                        )}
                    </Grid>
                    <Grid
                        item
                        {...(wide ? { xs: -1, md: 1, lg: 2, xl: 3, xxl: 4 } : { xs: 1, md: 2, lg: 3, xl: 4, xxl: 5 })}
                    />
                </Grid>
            </View>
        </RNModal>
    );
};
