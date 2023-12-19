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
    header: {
        fontWeight: "bold",
    },
    rowHighlight: {
        backgroundColor: theme.colours.grey[300],
    },
}));

export type QsoRowProps = {
    header?: boolean;
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
    position,
    time,
    band,
    callsign,
    name,
}): JSX.Element => {
    const { styles } = useStyles(stylesheet);
    const cellContent = (content: React.ReactNode, style: TextStyle) =>
        typeof content === "string" ? <Typography style={style}>{content}</Typography> : content;
    const cellStyle = header ? styles.header : {};
    return (
        <Pressable onPress={onPress}>
            <Grid container style={(+position % 2 || header ? styles.rowHighlight : {}) as any}>
                <Grid item style={styles.cell as any} xs={1}>
                    {cellContent(position, cellStyle)}
                </Grid>
                <Grid item style={styles.cell as any} xs={2}>
                    {cellContent(time, cellStyle)}
                </Grid>
                <Grid item style={styles.cell as any} xs={7} md={5}>
                    {cellContent(callsign, cellStyle)}
                </Grid>
                <Grid item style={styles.cell as any} xs={-1} md={2}>
                    {cellContent(name, cellStyle)}
                </Grid>
                <Grid item style={styles.cell as any} xs={2}>
                    {cellContent(band, cellStyle)}
                </Grid>
            </Grid>
        </Pressable>
    );
};
