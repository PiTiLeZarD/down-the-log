import React from "react";
import { View } from "react-native";
import { Modal } from "../utils/modal";
import { Settings, useStore } from "../utils/store";
import { Button } from "../ui/button";
import { PaginatedList } from "../ui/paginated-list";
import { useSettings } from "../utils/use-settings";
import { Stack } from "./stack";

export type PickFavouriteProps = {
    label: string;
    settingsKey: keyof Settings;
    availableValues: string[];
};

export const PickFavourite = ({ label, settingsKey, availableValues }: PickFavouriteProps) => {
    const [open, setOpen] = React.useState<boolean>(false);
    const settings = useSettings();
    const updateSetting = useStore((state) => state.updateSetting);

    const values = settings[settingsKey] as Array<string>;
    const selectedValues = (settings[settingsKey] as Array<string>) || [];

    return (
        <Stack direction="row" style={{ flexWrap: "wrap" }}>
            <View>
                <Button text={label} onPress={() => setOpen(true)} />
            </View>
            {(values || []).map((v) => (
                <Button style={{ minWidth: 100 }} key={v} variant="chip" colour="grey" text={v} />
            ))}
            <Modal open={open} onClose={() => setOpen(false)}>
                <Stack>
                    <PaginatedList>
                        {availableValues.map((v) => (
                            <Button
                                key={v}
                                text={v}
                                variant={selectedValues.includes(v) ? "contained" : "outlined"}
                                onPress={() =>
                                    updateSetting(
                                        settingsKey,
                                        selectedValues.includes(v)
                                            ? selectedValues.filter((vv) => vv !== v)
                                            : ([...selectedValues, v] as any),
                                    )
                                }
                            />
                        ))}
                    </PaginatedList>
                    <Button colour="success" text="OK" onPress={() => setOpen(false)} />
                </Stack>
            </Modal>
        </Stack>
    );
};
