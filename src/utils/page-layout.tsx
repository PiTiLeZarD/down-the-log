import React from "react";
import { ScrollView } from "react-native";
import { Grid } from "./grid";
import { Stack } from "./stack";
import { Typography } from "./theme/components/typography";

export type PageLayoutProps = {
    title: string;
};

export type PageLayoutComponent = React.FC<React.PropsWithChildren<PageLayoutProps>>;

export const PageLayout: PageLayoutComponent = ({ title, children }): JSX.Element => {
    return (
        <Grid container>
            <Grid item xs={0} md={2} lg={3} />
            <Grid item xs={12} md={8} lg={6}>
                <ScrollView>
                    <Stack gap="xxl">
                        <Typography variant="h1">{title}</Typography>
                        {children}
                    </Stack>
                </ScrollView>
            </Grid>
            <Grid item xs={0} md={2} lg={3} />
        </Grid>
    );
};