import React, { PropsWithChildren } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useWidthMatches } from "../ui/breakpoints";
import { Button } from "../ui/button";
import { Typography } from "../ui/typography";
import { useGoBack } from "../utils/use-go-back";
import { Grid } from "./grid";
import { Stack } from "./stack";

const styles = StyleSheet.create((theme) => ({
    root: {
        flex: 1,
    },
    // Pulled out of the scroller on a phone, so it needs to paint its own backdrop and mark the
    // edge the content slides under.
    stickyHeader: {
        backgroundColor: theme.background,
        borderBottomWidth: 1,
        borderBottomColor: theme.colours.grey.dark,
        paddingLeft: theme.margins.lg,
        paddingRight: theme.margins.lg,
    },
}));

export type PageLayoutProps = PropsWithChildren<{
    title: React.ReactNode;
    titleMargin?: number;
}>;

export const PageLayout = ({ title, titleMargin = 18, children }: PageLayoutProps) => {
    const goBack = useGoBack();
    const { theme } = useUnistyles();
    // On a phone the word "Back" costs more width than the arrow is worth next to a callsign field.
    const compact = !useWidthMatches("md");

    const titleRow = (
        <Stack direction="row">
            {typeof title === "string" ? (
                <Typography variant="h1" style={{ flexGrow: 1 }}>
                    {title}
                </Typography>
            ) : (
                <View style={{ flexGrow: 1, marginTop: titleMargin, marginBottom: titleMargin }}>{title}</View>
            )}

            <View>
                <Button
                    text={compact ? undefined : "Back"}
                    aria-label="Back"
                    startIcon="arrow-back"
                    onPress={goBack}
                    style={
                        compact
                            ? {
                                  paddingLeft: theme.margins.xl,
                                  paddingRight: theme.margins.xl,
                              }
                            : undefined
                    }
                />
            </View>
        </Stack>
    );

    return (
        <View style={styles.root}>
            {/* Phones keep the title and its back button in place; the page scrolls under them. */}
            {compact && <View style={styles.stickyHeader}>{titleRow}</View>}
            <ScrollView style={styles.root}>
                <Grid container>
                    <Grid item xs={0} md={1} lg={2} xxl={3} />
                    <Grid item xs={12} md={10} lg={8} xxl={6}>
                        <View
                            style={{
                                paddingLeft: theme.margins.lg,
                                paddingRight: theme.margins.lg,
                                paddingTop: compact ? theme.margins.xl : 0,
                            }}
                        >
                            <Stack gap="xxl">
                                {!compact && titleRow}
                                {children}
                            </Stack>
                        </View>
                    </Grid>
                    <Grid item xs={0} md={1} lg={2} xxl={3} />
                </Grid>
            </ScrollView>
        </View>
    );
};
