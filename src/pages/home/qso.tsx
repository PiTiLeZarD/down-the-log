import { Pressable, Text } from '@gluestack-ui/themed';
import React from 'react';
import { Grid } from '../../utils/grid';

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
    time: React.ReactNode;
    band: React.ReactNode;
    callsign: React.ReactNode;
    name: React.ReactNode;
    onPress?: () => void;
};

export type QsoComponent = React.FC<QsoProps>;

export const Qso: QsoComponent = ({ onPress, header = false, position, time, band, callsign, name }): JSX.Element => {
    const cellContent = (content: React.ReactNode, sx: any) =>
        typeof content === 'string' ? <Text sx={sx}>{content}</Text> : content;
    const sx = header ? classes.header : {};
    return (
        <Pressable onPress={onPress}>
            <Grid container sx={(+position % 2 || header ? classes.rowHighlight : {}) as any}>
                <Grid item sx={classes.cell as any} xs={1}>
                    {cellContent(position, sx)}
                </Grid>
                <Grid item sx={classes.cell as any} xs={2}>
                    {cellContent(time, sx)}
                </Grid>
                <Grid item sx={classes.cell as any} xs={7} md={5}>
                    {cellContent(callsign, sx)}
                </Grid>
                <Grid item sx={classes.cell as any} xs={-1} md={2}>
                    {cellContent(name, sx)}
                </Grid>
                <Grid item sx={classes.cell as any} xs={2}>
                    {cellContent(band, sx)}
                </Grid>
            </Grid>
        </Pressable>
    );
};
