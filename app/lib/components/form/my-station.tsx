import React from "react";
import { useFormContext } from "react-hook-form";
import { View } from "react-native";
import { unique } from "../../utils/arrays";
import { Modal } from "../../utils/modal";
import { Button } from "../../utils/theme/components/button";
import { SelectInput } from "../../utils/theme/components/select-input";
import { ButtonOffset } from "../button-offset";
import { QSO, useQsos } from "../qso";
import { Stack } from "../stack";
import { FormField } from "./form-field";
import { StateField } from "./state-field";

export type MyStationProps = {};

export type MyStationComponent = React.FC<MyStationProps>;

export const MyStation: MyStationComponent = (): JSX.Element => {
    const [open, setOpen] = React.useState<boolean>(false);
    const { getValues, setValue } = useFormContext<QSO>();

    const rig = getValues().myRig;
    const rigs = unique(
        useQsos()
            .map((q) => q.myRig)
            .filter((e) => !!e),
    ).filter((a) => a !== rig);

    const antenna = getValues().myAntenna;
    const antennas = unique(
        useQsos()
            .map((q) => q.myAntenna)
            .filter((e) => !!e),
    ).filter((a) => a !== antenna);

    return (
        <>
            <Button text="My Station" variant="outlined" onPress={() => setOpen(true)} />
            <Modal open={open} onClose={() => setOpen(false)}>
                <Stack>
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
                                        onValueChange={(v, i) => {
                                            if (v !== "-1") setValue("myRig", v);
                                        }}
                                        placeholder="Pick"
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
                                        onValueChange={(v, i) => {
                                            if (v !== "-1") setValue("myAntenna", v);
                                        }}
                                        placeholder="Pick"
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
