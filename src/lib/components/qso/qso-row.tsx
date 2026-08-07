import React from "react";
import { Pressable, TextStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ColourVariant } from "../../ui/theme";
import { Typography } from "../../ui/typography";
import { Grid } from "../grid";

const styles = StyleSheet.create((theme) => ({
    cell: {
        paddingHorizontal: theme.margins.md,
        paddingVertical: theme.margins.sm,
    },
    header: (lineHeight: number) => ({
        lineHeight,
        fontWeight: "bold",
    }),
    row: (highlight: boolean, colour: ColourVariant) => ({
        backgroundColor: theme.colours[colour][theme.rowShade(highlight)],
    }),
}));

export type QsoRowProps = {
    header?: boolean;
    success?: boolean;
    danger?: boolean;
    lineHeight?: number;
    position: string;
    hidePosition?: boolean;
    time: React.ReactNode;
    duration?: React.ReactNode;
    band: React.ReactNode;
    callsign: React.ReactNode;
    name: React.ReactNode;
    onPress?: () => void;
};

export const QsoRow = ({
    onPress,
    header = false,
    success = false,
    danger = false,
    lineHeight = 20,
    position,
    hidePosition = false,
    time,
    duration,
    band,
    callsign,
    name,
}: QsoRowProps) => {
    const cellContent = (content: React.ReactNode, style: TextStyle, numberOfLines?: number) =>
        typeof content === "string" ? (
            <Typography style={style} numberOfLines={numberOfLines}>
                {content}
            </Typography>
        ) : (
            content
        );
    const cellStyle = header ? styles.header(lineHeight) : { lineHeight };
    // Issues win over a confirmed QSL: a row the operator still has to fix shouldn't read as done.
    const colour: ColourVariant = danger ? "danger" : success ? "success" : "grey";
    return (
        <Pressable onPress={onPress}>
            <Grid container style={styles.row(+position % 2 === 0 || header, colour)}>
                {!hidePosition && (
                    <Grid item style={styles.cell} xs={1}>
                        {cellContent(position, cellStyle)}
                    </Grid>
                )}
                <Grid item style={styles.cell} xs={hidePosition ? 3 : 2} md={hidePosition ? 2 : 1}>
                    {cellContent(time, cellStyle, 1)}
                </Grid>
                <Grid item style={styles.cell} xs={-1} lg={1}>
                    {cellContent(duration, cellStyle)}
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
