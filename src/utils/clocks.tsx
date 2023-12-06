import { P } from "@expo/html-elements";
import { DateTime } from "luxon";
import React from "react";
import { Grid } from "./grid";
import { createStyleSheet, useStyles } from "./theme";

export type ClocksProps = {};

export type ClocksComponent = React.FC<ClocksProps>;

const stylesheet = createStyleSheet((theme) => ({
    container: {
        backgroundColor: theme.colors.primary[200],
    },
}));

export const Clocks: ClocksComponent = (): JSX.Element => {
    const [time, setTime] = React.useState<DateTime>(DateTime.local());
    const { styles } = useStyles(stylesheet);

    React.useEffect(() => {
        const timer = setInterval(() => {
            setTime(DateTime.local());
        }, 1000 * 60);
        return () => {
            clearInterval(timer);
        };
    }, []);

    return (
        <Grid container style={styles.container}>
            <Grid item xs={6}>
                <P style={{ textAlign: "center" }}>Local: {time.toFormat("HH:mm")}</P>
            </Grid>
            <Grid item xs={6}>
                <P style={{ textAlign: "center" }}>UTC: {time.toUTC().toFormat("HH:mm")}</P>
            </Grid>
        </Grid>
    );
};
