import { DrawerScreenProps } from "@react-navigation/drawer";
import React from "react";
import { useFormContext } from "react-hook-form";
import { Pressable, View } from "react-native";
import { createStyleSheet, useStyles } from "react-native-unistyles";
import { NavigationParamList } from "../../Navigation";
import { continents } from "../../data/callsigns";
import { modes } from "../../data/modes";
import { useStore } from "../../store";
import { FormField } from "../../utils/form-field";
import { Grid } from "../../utils/grid";
import { Modal } from "../../utils/modal";
import { PageLayout } from "../../utils/page-layout";
import { QSO } from "../../utils/qso";
import { QsoMap } from "../../utils/qso/qso-map";
import { Stack } from "../../utils/stack";
import { Button } from "../../utils/theme/components/button";
import { Typography } from "../../utils/theme/components/typography";
import { BandFreqInput } from "./band-freq-input";
import { ContinentWarning } from "./continent-warning";
import { CountryWarning } from "./country-warning";
import { GeocodeButton } from "./geocode-button";
import { LocatorField } from "./locator-field";
import { Signal } from "./signal";

const stylesheet = createStyleSheet((theme) => ({
    datetime: {
        borderStyle: "solid",
        borderBottomWidth: theme.margins.sm,
        borderBottomColor: theme.colours.grey[theme.shades.darker],
    },
    callsignInput: {
        textAlign: "center",
        color: theme.colours.primary[theme.shades.darker],
        fontWeight: "700",
        fontSize: 20,
        borderBottomWidth: 3,
        borderBottomColor: theme.colours.primary[theme.shades.dark],
        borderStyle: "dashed",
    },
}));

export type FormFieldsProps = {
    qso: QSO;
} & Pick<DrawerScreenProps<NavigationParamList, "QsoForm">, "navigation">;

export type FormFieldsComponent = React.FC<FormFieldsProps>;

export const FormFields: FormFieldsComponent = ({ navigation, qso }): JSX.Element => {
    const [openTimeLocModal, setOpenTimeLocModal] = React.useState<boolean>(false);
    const { styles } = useStyles(stylesheet);
    const { getValues } = useFormContext<QSO>();
    const deleteLog = useStore((state) => state.deleteLog);

    const onDelete = () => {
        if (qso) deleteLog(qso);
        navigation.navigate("Home");
    };

    return (
        <PageLayout
            title={<FormField name="callsign" style={styles.callsignInput} />}
            navigation={navigation}
            titleMargin={10}
        >
            <Pressable onPress={() => setOpenTimeLocModal(true)}>
                <Stack style={styles.datetime}>
                    {qso && (
                        <Stack direction="row">
                            <Typography variant="h6" style={{ flex: 1 }}>
                                {qso.date.toFormat("dd/MM/yyyy")}
                            </Typography>
                            <Typography variant="h6" style={{ flex: 1, textAlign: "right" }}>
                                {qso.date.toFormat("HH:mm:ss")}
                            </Typography>
                        </Stack>
                    )}
                </Stack>
                {qso && (
                    <Stack direction="row">
                        <Typography variant="subtitle" style={{ flex: 1, textAlign: "center" }}>
                            CQ: {qso.cqzone}
                        </Typography>
                        <Typography variant="subtitle" style={{ flex: 1, textAlign: "center" }}>
                            ITU: {qso.ituzone}
                        </Typography>
                        <Typography variant="subtitle" style={{ flex: 1, textAlign: "center" }}>
                            DXCC: {qso.dxcc}
                        </Typography>
                        <Typography variant="subtitle" style={{ flex: 1, textAlign: "center" }}>
                            QRB: {qso.distance}km
                        </Typography>
                    </Stack>
                )}
            </Pressable>
            <Modal open={openTimeLocModal} onClose={() => setOpenTimeLocModal(false)}>
                <Stack>
                    <FormField name="cqzone" label="CQZone:" />
                    <FormField name="ituzone" label="ITUZone:" />
                    <FormField name="dxcc" label="DXCC:" />
                    <Button text="OK" colour="success" onPress={() => setOpenTimeLocModal(false)} />
                </Stack>
            </Modal>
            <Grid container>
                <Grid item xs={12} md={6} xxl={8}>
                    <FormField name="name" label="Name:" />
                </Grid>
                <Grid item xs={6} md={3} xxl={2} style={{ justifyContent: "center" }}>
                    <View>
                        <Signal field="rst_received" />
                    </View>
                </Grid>
                <Grid item xs={6} md={3} xxl={2} style={{ justifyContent: "center" }}>
                    <View>
                        <Signal field="rst_sent" />
                    </View>
                </Grid>
            </Grid>
            <Grid container>
                <Grid item xs={8}>
                    <FormField name="qth" label="QTH:" />
                </Grid>
                <Grid item xs={1}>
                    <GeocodeButton />
                </Grid>
                <Grid item xs={3}>
                    <LocatorField name="locator" label="Locator:" />
                </Grid>
            </Grid>
            <Grid container>
                <Grid item xs={12} md={6}>
                    <Stack>
                        <BandFreqInput />
                        <Grid container>
                            <Grid item xs={8}>
                                <FormField
                                    role="select"
                                    name="mode"
                                    label="Mode:"
                                    options={Object.fromEntries(modes.map((mode) => [mode, mode]))}
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <FormField name="power" label="Power:" />
                            </Grid>
                        </Grid>
                    </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Stack>
                        <FormField role="country" name="country" label="Country:" />
                        <CountryWarning />
                        <Grid container>
                            <Grid item xs={6}>
                                <FormField name="state" label="State:" />
                            </Grid>
                            <Grid item xs={6}>
                                <FormField
                                    role="select"
                                    name="continent"
                                    label="Continent:"
                                    options={Object.fromEntries(continents.map((ctn) => [ctn, ctn]))}
                                />
                                <ContinentWarning />
                            </Grid>
                        </Grid>
                    </Stack>
                </Grid>
            </Grid>
            <FormField role="textarea" name="note" label="Note:" />
            <QsoMap qso={getValues()} />
            <Stack direction="row">
                <Button variant="outlined" text="Delete" colour="secondary" onPress={() => onDelete()} />
            </Stack>
        </PageLayout>
    );
};
