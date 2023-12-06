import { P } from "@expo/html-elements";
import React from "react";
import { Pressable, TextStyle } from "react-native";
import { Grid } from "../../utils/grid";
import { createStyleSheet, useStyles } from "../../utils/theme";

const stylesheet = createStyleSheet((theme) => ({
    cell: {
        paddingHorizontal: 5,
        paddingVertical: 3,
    },
    header: {
        fontWeight: "bold",
    },
    rowHighlight: {
        backgroundColor: theme.colors.primary[200],
    },
}));

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
    const { styles } = useStyles(stylesheet);
    const cellContent = (content: React.ReactNode, style: TextStyle) =>
        typeof content === "string" ? <P style={style}>{content}</P> : content;
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
