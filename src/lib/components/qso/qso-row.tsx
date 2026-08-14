import React from "react";
import { Pressable, TextStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { ColourVariant } from "../../ui/theme";
import { Typography } from "../../ui/typography";
import { Grid } from "../grid";
import { SpineInfo } from "../../utils/session-spine";
import { SPINE_GUTTER, SessionSpine } from "./session-spine";

const styles = StyleSheet.create((theme) => ({
    cell: {
        paddingHorizontal: theme.margins.md,
        paddingVertical: theme.margins.sm,
    },
    header: (lineHeight: number) => ({
        lineHeight,
        fontWeight: "bold",
    }),
    // The gutter goes on every row of the list, header included, or the columns stop lining up with
    // their titles the moment a session appears in the log.
    row: (highlight: boolean, colour: ColourVariant, gutter: boolean) => ({
        backgroundColor: theme.colours[colour][theme.rowShade(highlight)],
        paddingLeft: gutter ? SPINE_GUTTER : 0,
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
    gutter?: boolean;
    spine?: SpineInfo;
    onSpinePress?: (sessionId: string) => void;
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
    gutter = false,
    spine,
    onSpinePress,
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
            <Grid container style={styles.row(+position % 2 === 0 || header, colour, gutter)}>
                {!hidePosition && (
                    // Four-figure ids wrap at one column on a phone, so the id gets a second one
                    // there and hands it back once there's room for the wider columns.
                    <Grid item style={styles.cell} xs={2} md={1}>
                        {cellContent(position, cellStyle, 1)}
                    </Grid>
                )}
                <Grid item style={styles.cell} xs={hidePosition ? 3 : 2} md={hidePosition ? 2 : 1}>
                    {cellContent(time, cellStyle, 1)}
                </Grid>
                <Grid item style={styles.cell} xs={-1} lg={1}>
                    {cellContent(duration, cellStyle)}
                </Grid>
                <Grid item style={styles.cell} xs={hidePosition ? 6 : 5} md={5}>
                    {cellContent(callsign, cellStyle)}
                </Grid>
                <Grid item style={styles.cell} xs={-1} md={2}>
                    {cellContent(name, cellStyle)}
                </Grid>
                {/* Band, mode and the status icons all share this cell, so it needs an extra column
                    on a phone — at xs={2} the icons ran off the right edge of the screen. */}
                <Grid item style={styles.cell} xs={3} md={2}>
                    {cellContent(band, cellStyle)}
                </Grid>
            </Grid>
            {/* Outside the grid and after it: inside, the gutter padding would push it back over
                the id column, and before it, the row's own background would cover it on native. */}
            {spine && <SessionSpine spine={spine} onPress={onSpinePress} />}
        </Pressable>
    );
};
