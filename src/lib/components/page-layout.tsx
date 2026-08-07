import React, { PropsWithChildren } from "react";
import { ScrollView, View } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import { useWidthMatches } from "../ui/breakpoints";
import { Button } from "../ui/button";
import { Typography } from "../ui/typography";
import { useGoBack } from "../utils/use-go-back";
import { Grid } from "./grid";
import { Stack } from "./stack";

export type PageLayoutProps = PropsWithChildren<{
    title: React.ReactNode;
    titleMargin?: number;
}>;

export const PageLayout = ({ title, titleMargin = 18, children }: PageLayoutProps) => {
    const goBack = useGoBack();
    const { theme } = useUnistyles();
    // On a phone the word "Back" costs more width than the arrow is worth next to a callsign field.
    const compact = !useWidthMatches("md");
    return (
        <ScrollView>
            <Grid container>
                <Grid item xs={0} md={1} lg={2} xxl={3} />
                <Grid item xs={12} md={10} lg={8} xxl={6}>
                    <ScrollView style={{ paddingLeft: theme.margins.lg, paddingRight: theme.margins.lg }}>
                        <Stack gap="xxl">
                            <Stack direction="row">
                                {typeof title === "string" ? (
                                    <Typography variant="h1" style={{ flexGrow: 1 }}>
                                        {title}
                                    </Typography>
                                ) : (
                                    <View style={{ flexGrow: 1, marginTop: titleMargin, marginBottom: titleMargin }}>
                                        {title}
                                    </View>
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
                            {children}
                        </Stack>
                    </ScrollView>
                </Grid>
                <Grid item xs={0} md={1} lg={2} xxl={3} />
            </Grid>
        </ScrollView>
    );
};
