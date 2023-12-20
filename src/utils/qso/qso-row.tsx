import React from "react";
import { Pressable, TextStyle } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { Grid } from "../../utils/grid";
import { Typography } from "../../utils/theme/components/typography";

const stylesheet = createStyleSheet((theme) => ({
    cell: {
        paddingHorizontal: theme.margins.md,
        paddingVertical: theme.margins.sm,
    },
    header: (lineHeight: number) => ({
        lineHeight,
        fontWeight: "bold",
    }),
    row: (success: boolean) => ({
        backgroundColor: theme.colours[success ? "success" : "grey"][200],
    }),
    rowHighlight: (success: boolean) => ({
        backgroundColor: theme.colours[success ? "success" : "grey"][300],
    }),
}));

export type QsoRowProps = {
    header?: boolean;
    success?: boolean;
    lineHeight?: number;
    position: string;
    time: React.ReactNode;
    band: React.ReactNode;
    callsign: React.ReactNode;
    name: React.ReactNode;
    onPress?: () => void;
};

export type QsoRowComponent = React.FC<QsoRowProps>;

export const QsoRow: QsoRowComponent = ({
    onPress,
    header = false,
    success = false,
    lineHeight = 20,
    position,
    time,
    band,
    callsign,
    name,
}): JSX.Element => {
    const { styles } = useStyles(stylesheet);
    const cellContent = (content: React.ReactNode, style: TextStyle) =>
        typeof content === "string" ? <Typography style={style}>{content}</Typography> : content;
    const cellStyle = header ? styles.header(lineHeight) : { lineHeight };
    return (
        <Pressable onPress={onPress}>
            <Grid container style={(+position % 2 || header ? styles.rowHighlight : styles.row)(success)}>
                <Grid item style={styles.cell} xs={1}>
                    {cellContent(position, cellStyle)}
                </Grid>
                <Grid item style={styles.cell} xs={2}>
                    {cellContent(time, cellStyle)}
                </Grid>
                <Grid item style={styles.cell} xs={7} md={5}>
                    {cellContent(callsign, cellStyle)}
                </Grid>
                <Grid item style={styles.cell} xs={-1} md={2}>
                    {cellContent(name, cellStyle)}
                </Grid>
                <Grid item style={styles.cell} xs={2}>
                    {cellContent(band, cellStyle)}
                </Grid>
            </Grid>
        </Pressable>
    );
};
