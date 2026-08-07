import { Button } from "../ui/button";
import { Typography } from "../ui/typography";
import { useStore } from "../utils/store";
import { useSettings } from "../utils/use-settings";
import { Stack } from "./stack";

// A switch only ever reads as "on/off of whatever the label says", which made the units and the date
// format guesswork: on means what? Both choices are spelled out instead, and the picked one is filled in.
export type ChoiceSettingProps<T extends string | boolean> = {
    label: string;
    hint?: string;
    value: T;
    options: { label: string; value: T }[];
    onChange: (value: T) => void;
};

export const ChoiceSetting = <T extends string | boolean>({
    label,
    hint,
    value,
    options,
    onChange,
}: ChoiceSettingProps<T>) => (
    <Stack>
        <Typography underline>{label}</Typography>
        {hint && <Typography variant="subtitle">{hint}</Typography>}
        <Stack direction="row">
            {options.map((option) => (
                <Button
                    key={String(option.value)}
                    text={option.label}
                    colour={option.value === value ? "primary" : "grey"}
                    variant={option.value === value ? "contained" : "outlined"}
                    onPress={() => onChange(option.value)}
                />
            ))}
        </Stack>
    </Stack>
);

// Both of these live on the Settings screen and on the first-run setup, so they read and write the
// store themselves rather than being wired up twice.
export const UnitsSetting = () => {
    const settings = useSettings();
    const updateSetting = useStore((state) => state.updateSetting);

    return (
        <ChoiceSetting
            label="Distances:"
            value={!!settings.imperial}
            options={[
                { label: "Kilometres", value: false },
                { label: "Miles", value: true },
            ]}
            onChange={(v) => updateSetting("imperial", v)}
        />
    );
};

export const DateFormatSetting = () => {
    const settings = useSettings();
    const updateSetting = useStore((state) => state.updateSetting);

    return (
        <ChoiceSetting
            label="Date format:"
            value={!!settings.datemonth}
            options={[
                { label: "31/12/2026", value: false },
                { label: "12-31-2026", value: true },
            ]}
            onChange={(v) => updateSetting("datemonth", v)}
        />
    );
};
