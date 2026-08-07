import { DateTime } from "luxon";
import React from "react";
import { StyleSheet } from "react-native-unistyles";
import { Typography } from "../ui/typography";
import { Grid } from "./grid";

const styles = StyleSheet.create((theme) => ({
    container: {
        backgroundColor: theme.colours.primary.light,
        paddingTop: theme.margins.md,
        paddingBottom: theme.margins.md,
    },
}));

export const Clocks = () => {
    const [time, setTime] = React.useState<DateTime>(DateTime.local());

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
