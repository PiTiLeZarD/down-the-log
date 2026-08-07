import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { View } from "react-native";
import { unique } from "../../utils/arrays";
import { Modal } from "../../utils/modal";
import { Alert } from "../../ui/alert";
import { Badge } from "../../ui/badge";
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

// None of this comes from the settings: an operator has more than one rig, antenna or operating
// site, so it belongs to the QSO and every following QSO carries it over. That leaves the first QSO
// of a log — and any QSO where one of them was never filled in — with gaps the operator can't see
// from the outside, hence the badge on the button. `myState` is left out: plenty of countries
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
    // Watched rather than read off getValues(): the badge has to clear as soon as the gaps are
    // filled in, and the rig/antenna pick lists have to drop whatever was just chosen.
    const values = useWatch({ control });

    const missing = expectedFields.filter(({ name }) => !values[name]);

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
            <Badge count={missing.length} colour="secondary" label="!">
                <Button text="My Station" variant="outlined" onPress={openWithDefaults} />
            </Badge>
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
