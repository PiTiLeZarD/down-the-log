import React from "react";
import { FormField } from "../../utils/form-field";
import { Modal } from "../../utils/modal";
import { Stack } from "../../utils/stack";
import { Button } from "../../utils/theme/components/button";

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
                    <FormField name="myRig" label="My Rig:" />
                    <FormField name="myAntenna" label="My Antenna:" />
                    <Button colour="success" text="OK" onPress={() => setOpen(false)} />
                </Stack>
            </Modal>
        </>
    );
};
