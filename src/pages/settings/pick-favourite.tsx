import React from "react";
import { View } from "react-native";
import { bands } from "../../data/bands";
import { modes } from "../../data/modes";
import { useStore } from "../../store";
import { Modal } from "../../utils/modal";
import { Stack } from "../../utils/stack";
import { Button } from "../../utils/theme/components/button";
import { PaginatedList } from "../../utils/theme/components/paginated-list";
import { useSettings } from "../../utils/use-settings";

export type PickFavouriteProps = {
    type: "mode" | "band";
};

export type PickFavouriteComponent = React.FC<PickFavouriteProps>;

export const PickFavourite: PickFavouriteComponent = ({ type }): JSX.Element => {
    const [open, setOpen] = React.useState<boolean>(false);
    const settings = useSettings();
    const updateSetting = useStore((state) => state.updateSetting);

    const settingsKey = { mode: "favouriteModes", band: "favouriteBands" }[type] as keyof typeof settings;
    const values = settings[settingsKey] as Array<string>;
    const availableValues = (type === "band" ? Object.keys(bands) : modes) as Array<string>;
    const selectedValues = (settings[settingsKey] as Array<string>) || [];

    return (
        <Stack direction="row">
            <View>
                <Button text={`Pick favourite ${type}`} onPress={() => setOpen(true)} />
            </View>
            {(values || []).map((v) => (
                <Button key={v} variant="chip" colour="grey" text={v} />
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
