import React from "react";
import { Modal } from "../../utils/modal";
import { Button } from "../../utils/theme/components/button";
import { Stack } from "../stack";
import { FormField } from "./form-field";

export type MyStationProps = {};

export type MyStationComponent = React.FC<MyStationProps>;

export const MyStation: MyStationComponent = (): JSX.Element => {
    const [open, setOpen] = React.useState<boolean>(false);
    return (
        <>
            <Button text="My Station" variant="outlined" onPress={() => setOpen(true)} />
            <Modal open={open} onClose={() => setOpen(false)}>
                <Stack>
                    <FormField name="myCallsign" label="My Callsign:" />
                    <FormField name="myQth" label="My QTH:" />
                    <FormField name="myLocator" label="My Gridsquare:" />
                    <FormField role="country" name="myCountry" label="My Country:" />
                    <FormField name="myState" label="My State:" />
                    <FormField name="myRig" label="My Rig:" />
                    <FormField name="myAntenna" label="My Antenna:" />
                    <Button colour="success" text="OK" onPress={() => setOpen(false)} />
                </Stack>
            </Modal>
        </>
    );
};
