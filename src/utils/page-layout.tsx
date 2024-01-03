import { DrawerScreenProps } from "@react-navigation/drawer";
import React from "react";
import { ScrollView, View } from "react-native";
import { useStyles } from "react-native-unistyles";
import { NavigationParamList } from "../Navigation";
import { Grid } from "./grid";
import { Stack } from "./stack";
import { Button } from "./theme/components/button";
import { Typography } from "./theme/components/typography";

export type PageLayoutProps = {
    title: React.ReactNode;
    titleMargin?: number;
} & Pick<DrawerScreenProps<NavigationParamList, any>, "navigation">;

export type PageLayoutComponent = React.FC<React.PropsWithChildren<PageLayoutProps>>;

export const PageLayout: PageLayoutComponent = ({ title, titleMargin = 18, navigation, children }): JSX.Element => {
    const { theme } = useStyles();
    return (
        <Grid container>
            <Grid item xs={0} md={2} lg={3} />
            <Grid item xs={12} md={8} lg={6}>
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
                                    text="Back"
                                    startIcon="arrow-back"
                                    onPress={() => navigation.navigate("Home")}
                                />
                            </View>
                        </Stack>
                        {children}
                    </Stack>
                </ScrollView>
            </Grid>
            <Grid item xs={0} md={2} lg={3} />
        </Grid>
    );
};
