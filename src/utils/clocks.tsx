import { DateTime } from "luxon";
import React from "react";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Grid } from "./grid";
import { Typography } from "./theme/components/typography";

export type ClocksProps = {};

export type ClocksComponent = React.FC<ClocksProps>;

const stylesheet = createStyleSheet((theme) => ({
    container: {
        backgroundColor: theme.colours.primary[theme.shades.light],
        paddingTop: theme.margins.md,
        paddingBottom: theme.margins.md,
    },
}));

export const Clocks: ClocksComponent = (): JSX.Element => {
    const [time, setTime] = React.useState<DateTime>(DateTime.local());
    const { styles } = useStyles(stylesheet);

    React.useEffect(() => {
        const timer = setInterval(() => {
            setTime(DateTime.local());
        }, 1000);
        return () => {
            clearInterval(timer);
        };
    }, []);

    return (
        <Grid container style={styles.container}>
            <Grid item xs={6} md={12}>
                <Typography variant="em" style={{ textAlign: "center" }}>
                    Local: {time.toFormat("HH:mm")}
                </Typography>
            </Grid>
            <Grid item xs={6} md={12}>
                <Typography variant="em" style={{ textAlign: "center" }}>
                    UTC: {time.toUTC().toFormat("HH:mm")}
                </Typography>
            </Grid>
        </Grid>
    );
};
