import { Pressable, Text } from '@gluestack-ui/themed';
import React from 'react';
import { Grid } from '../utils/grid';

const classes: Record<string, object> = {
    cell: {
        paddingHorizontal: 5,
        paddingVertical: 3,
    },
    header: {
        fontWeight: 'bold',
    },
    rowHighlight: {
        backgroundColor: '$backgroundLight200',
    },
};

export type QsoProps = {
    header?: boolean;
    position: string;
    time: string;
    band: string;
    mode: string;
    callsign: string;
    name: string;
    onPress?: () => void;
};

export type QsoComponent = React.FC<QsoProps>;

export const Qso: QsoComponent = ({
    onPress,
    header = false,
    position,
    time,
    band,
    mode,
    callsign,
    name,
}): JSX.Element => {
    return (
        <Pressable onPress={onPress}>
            <Grid container sx={(+position % 2 || header ? classes.rowHighlight : {}) as any}>
                <Grid item sx={classes.cell as any} xs={1}>
                    <Text sx={header ? classes.header : {}}>{position}</Text>
                </Grid>
                <Grid item sx={classes.cell as any} xs={2}>
                    <Text sx={header ? classes.header : {}}>{time}</Text>
                </Grid>
                <Grid item sx={classes.cell as any} xs={5} md={3}>
                    <Text sx={header ? classes.header : {}}>{callsign}</Text>
                </Grid>
                <Grid item sx={classes.cell as any} xs={-1} md={2}>
                    <Text sx={header ? classes.header : {}}>{name}</Text>
                </Grid>
                <Grid item sx={classes.cell as any} xs={2}>
                    <Text sx={header ? classes.header : {}}>{band}</Text>
                </Grid>
                <Grid item sx={classes.cell as any} xs={2}>
                    <Text sx={header ? classes.header : {}}>{mode}</Text>
                </Grid>
            </Grid>
        </Pressable>
    );
};
