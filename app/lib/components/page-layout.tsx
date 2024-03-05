import React from "react";
import { ScrollView, View } from "react-native";
import { useStyles } from "react-native-unistyles";
import { Button } from "../utils/theme/components/button";
import { Typography } from "../utils/theme/components/typography";
import { useGoBack } from "../utils/use-go-back";
import { Grid } from "./grid";
import { Stack } from "./stack";

export type PageLayoutProps = {
    title: React.ReactNode;
    titleMargin?: number;
};

export type PageLayoutComponent = React.FC<React.PropsWithChildren<PageLayoutProps>>;

export const PageLayout: PageLayoutComponent = ({ title, titleMargin = 18, children }): JSX.Element => {
    const goBack = useGoBack();
    const { theme } = useStyles();
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
                                    <Button text="Back" startIcon="arrow-back" onPress={goBack} />
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
