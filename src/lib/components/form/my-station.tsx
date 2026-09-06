import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Pressable, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { unique } from "../../utils/arrays";
import { Modal } from "../../utils/modal";
import { Alert } from "../../ui/alert";
import { Button } from "../../ui/button";
import { SelectInput } from "../../ui/select-input";
import { Typography } from "../../ui/typography";
import { useStore } from "../../utils/store";
import { useSettings } from "../../utils/use-settings";
import { ButtonOffset } from "../button-offset";
import { QSO, myStationFromSettings, useQsos } from "../qso";
import { Stack } from "../stack";
import { FormField } from "./form-field";
import { StateField } from "./state-field";

const styles = StyleSheet.create((theme) => ({
    strip: {
        borderStyle: "solid",
        borderBottomWidth: theme.margins.sm,
        borderBottomColor: theme.colours.grey.darker,
        paddingBottom: theme.margins.sm,
    },
    part: {
        flex: 1,
        textAlign: "center",
    },
    missing: {
        flex: 1,
        textAlign: "center",
        borderRadius: theme.margins.md,
        backgroundColor: theme.colours.secondary.dark,
        color: theme.background,
    },
}));

// None of this comes from the settings: an operator has more than one rig, antenna or operating
// site, so it belongs to the QSO and every following QSO carries it over. That leaves the first QSO
// of a log — and any QSO where one of them was never filled in — with gaps the operator can't see
// from the outside, hence the warning on the strip. `myState` is left out: plenty of countries
// don't have states. See myStationFromSettings.
const expectedFields: { name: keyof QSO; label: string }[] = [
    { name: "myCallsign", label: "callsign" },
    { name: "myQth", label: "QTH" },
    { name: "myLocator", label: "gridsquare" },
    { name: "myCountry", label: "country" },
    { name: "myRig", label: "rig" },
    { name: "myAntenna", label: "antenna" },
];

export const MyStation = () => {
    const [open, setOpen] = React.useState<boolean>(false);
    const { control, setValue } = useFormContext<QSO>();
    const settings = useSettings();
    const currentLocation = useStore((state) => state.currentLocation);
    // Watched rather than read off getValues(): the strip has to redraw as soon as the gaps are
    // filled in, and the rig/antenna pick lists have to drop whatever was just chosen.
    const values = useWatch({ control });

    const missing = expectedFields.filter(({ name }) => !values[name]);
    // QTH and country are left out of the strip and only counted as gaps: the callsign and
    // gridsquare already say where the operator is, and the QTH is the long one that would push the
    // rig and antenna off a narrow row.
    const summary = [values.myCallsign, values.myLocator, values.myRig, values.myAntenna].filter(Boolean) as string[];

    const rig = values.myRig;
    const rigs = unique(
        useQsos()
            .map((q) => q.myRig)
            .filter((e) => !!e),
    ).filter((a) => a !== rig);

    const antenna = values.myAntenna;
    const antennas = unique(
        useQsos()
            .map((q) => q.myAntenna)
            .filter((e) => !!e),
    ).filter((a) => a !== antenna);

    // Anything the app can work out for itself is filled in as the modal opens rather than left as a
    // blank to type: a QSO logged before the settings existed, or imported from ADIF, arrives here
    // with nothing in it. Only empty fields are touched, so a QSO from an outing elsewhere keeps
    // whatever it was logged with.
    const openWithDefaults = () => {
        const station = myStationFromSettings(settings, currentLocation);
        if (!values.myCallsign && station.myCallsign) setValue("myCallsign", station.myCallsign);
        if (!values.myLocator && station.myLocator) setValue("myLocator", station.myLocator);
        if (!values.myCountry && station.myCountry) setValue("myCountry", station.myCountry);
        setOpen(true);
    };

    return (
        <>
            {/* A strip rather than a button in the form body: this is the operator's own side of the
                contact, not a field of it, and it reads as context for every QSO on the page when it
                sits under the header showing its values. A button showed none of them, and put "my"
                gridsquare next to theirs. */}
            <Pressable onPress={openWithDefaults}>
                <Stack direction="row" style={styles.strip}>
                    <Typography variant="em">DE</Typography>
                    {summary.length === 0 && (
                        <Typography variant="subtitle" style={styles.part}>
                            Set up my station
                        </Typography>
                    )}
                    {summary.map((part) => (
                        <Typography key={part} variant="subtitle" style={styles.part}>
                            {part}
                        </Typography>
                    ))}
                    {missing.length > 0 && (
                        <Typography variant="subtitle" style={styles.missing}>
                            ! {missing.map(({ label }) => label).join(", ")}
                        </Typography>
                    )}
                </Stack>
            </Pressable>
            <Modal open={open} onClose={() => setOpen(false)}>
                <Stack>
                    {missing.length > 0 && (
                        <Alert severity="warning">
                            <Typography style={{ flexGrow: 1 }}>
                                Not set yet: {missing.map(({ label }) => label).join(", ")}. Fill these in once and
                                every following QSO carries them over.
                            </Typography>
                        </Alert>
                    )}
                    <FormField name="myCallsign" label="My Callsign:" />
                    <FormField name="myQth" label="My QTH:" />
                    <FormField name="myLocator" label="My Gridsquare:" />
                    <FormField role="country" name="myCountry" label="My Country:" />
                    <StateField name="myState" />
                    <Stack direction="row">
                        <View style={{ flexGrow: 1 }}>
                            <FormField name="myRig" label="My Rig:" />
                        </View>
                        {rigs.length > 0 && (
                            <View style={{ flex: 0.5 }}>
                                <ButtonOffset>
                                    <SelectInput
                                        onValueChange={(v) => {
                                            if (v !== "-1") setValue("myRig", v);
                                        }}
                                        value="-1"
                                        items={[
                                            { label: "Pick", value: "-1" },
                                            ...rigs.map((r) => ({ label: r as string, value: r as string })),
                                        ]}
                                    />
                                </ButtonOffset>
                            </View>
                        )}
                    </Stack>
                    <Stack direction="row">
                        <View style={{ flexGrow: 1 }}>
                            <FormField name="myAntenna" label="My Antenna:" />
                        </View>
                        {antennas.length > 0 && (
                            <View style={{ flex: 0.5 }}>
                                <ButtonOffset>
                                    <SelectInput
                                        onValueChange={(v) => {
                                            if (v !== "-1") setValue("myAntenna", v);
                                        }}
                                        value="-1"
                                        items={[
                                            { label: "Pick", value: "-1" },
                                            ...antennas.map((a) => ({ label: a as string, value: a as string })),
                                        ]}
                                    />
                                </ButtonOffset>
                            </View>
                        )}
                    </Stack>
                    <Button colour="success" text="OK" onPress={() => setOpen(false)} />
                </Stack>
            </Modal>
        </>
    );
};
