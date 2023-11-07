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
        backgroundColor: '#e9e9e9',
    },
};

export type QsoProps = {
    header?: boolean;
    position: string;
    time: string;
    band: string;
    mode: string;
    callsign: string;
    onPress?: () => void;
};

export type QsoComponent = React.FC<QsoProps>;

export const Qso: QsoComponent = ({ onPress, header = false, position, time, band, mode, callsign }): JSX.Element => {
    return (
        <Pressable onPress={onPress}>
            <Grid container sx={(+position % 2 || header ? classes.rowHighlight : {}) as any}>
                <Grid item sx={classes.cell as any} xs={1}>
                    <Text sx={header ? classes.header : {}}>{position}</Text>
                </Grid>
                <Grid item sx={classes.cell as any} xs={2}>
                    <Text sx={header ? classes.header : {}}>{time}</Text>
                </Grid>
                <Grid item sx={classes.cell as any} xs={5}>
                    <Text sx={header ? classes.header : {}}>{callsign}</Text>
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
