import { Text } from "@gluestack-ui/themed";
import { DateTime } from "luxon";
import React from "react";
import { Grid } from "./grid";

export type ClocksProps = {};

export type ClocksComponent = React.FC<ClocksProps>;

export const Clocks: ClocksComponent = (): JSX.Element => {
    const [time, setTime] = React.useState<DateTime>(DateTime.local());

    React.useEffect(() => {
        const timer = setInterval(() => {
            setTime(DateTime.local());
        }, 1000 * 60);
        return () => {
            clearInterval(timer);
        };
    }, []);

    return (
        <Grid container sx={{ backgroundColor: "$primary200" } as any}>
            <Grid item xs={6}>
                <Text sx={{ textAlign: "center" }}>Local: {time.toFormat("HH:mm")}</Text>
            </Grid>
            <Grid item xs={6}>
                <Text sx={{ textAlign: "center" }}>UTC: {time.toUTC().toFormat("HH:mm")}</Text>
            </Grid>
        </Grid>
    );
};
