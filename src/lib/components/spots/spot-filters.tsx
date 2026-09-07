import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Band, sortBands } from "../../data/bands";
import { EventType } from "../../utils/event-rules";
import {
    MergedSpot,
    SpotFilter,
    SpotModeGroup,
    SpotSource,
    modeGroup,
    spotModeGroups,
    spotSourceLabels,
    spotSources,
} from "../../utils/spots";
import { sotaApprovalPending } from "../../utils/spots/sota";
import { useStore } from "../../utils/store";
import { useSettings } from "../../utils/use-settings";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Typography } from "../../ui/typography";
import { Stack } from "../stack";
import { programmeColours } from "./spot-row";

const styles = StyleSheet.create((theme) => ({
    chips: {
        flexWrap: "wrap",
    },
    label: {
        width: 74,
    },
}));

const programmeLabels: Partial<Record<EventType, string>> = {
    pota: "POTA",
    wwff: "WWFF",
    sota: "SOTA",
    sig: "Other",
};

// A chip is on when it's picked, and a row with nothing picked means "no opinion" rather than
// "nothing" — otherwise switching a filter on for the first time empties the list.
const toggle = <T,>(values: T[], value: T): T[] =>
    values.includes(value) ? values.filter((v) => v !== value) : [...values, value];

export type FilterRowProps<T extends string> = {
    label: string;
    options: T[];
    selected: T[];
    labelFor?: (option: T) => string;
    colourFor?: (option: T) => "primary" | "secondary" | "grey" | "success" | "danger";
    onToggle: (option: T) => void;
};

const FilterRow = <T extends string>({
    label,
    options,
    selected,
    labelFor,
    colourFor,
    onToggle,
}: FilterRowProps<T>) => (
    <Stack direction="row" gap="lg" style={styles.chips}>
        <Typography variant="em" style={styles.label}>
            {label}
        </Typography>
        {options.map((option) => (
            // Wrapped so each chip is as wide as its label: a Button is `flex: 1` by default, which
            // in a row divides the width between them and squeezes every label to nothing.
            <View key={option}>
                <Button
                    variant={selected.includes(option) ? "contained" : "chip"}
                    colour={colourFor ? colourFor(option) : "grey"}
                    text={labelFor ? labelFor(option) : option}
                    onPress={() => onToggle(option)}
                />
            </View>
        ))}
    </Stack>
);

export type SpotFiltersProps = {
    // The unfiltered feed, so the band chips only offer bands something is actually spotted on.
    spots: MergedSpot[];
};

export const SpotFilters = ({ spots }: SpotFiltersProps) => {
    const settings = useSettings();
    const updateSetting = useStore((state) => state.updateSetting);
    const filter = settings.spotFilter;
    const patch = (values: Partial<SpotFilter>) => updateSetting("spotFilter", { ...filter, ...values });

    const bands = ([...new Set(spots.map((spot) => spot.band))].filter(Boolean) as Band[]).sort(sortBands);
    // SOTAwatch is listed but not offerable until the API approval lands; hiding it entirely would
    // just raise the same question every time somebody wonders where SOTA spots are.
    const sources = spotSources.filter((source) => source !== "sota" || !sotaApprovalPending);

    return (
        <Stack gap="lg">
            <FilterRow<SpotSource>
                label="Networks"
                options={[...sources]}
                selected={settings.spotSources}
                labelFor={(source) => spotSourceLabels[source]}
                onToggle={(source) => updateSetting("spotSources", toggle(settings.spotSources, source))}
            />
            <FilterRow<EventType>
                label="Award"
                options={Object.keys(programmeLabels) as EventType[]}
                selected={filter.programmes}
                labelFor={(programme) => programmeLabels[programme] as string}
                colourFor={(programme) => programmeColours[programme]}
                onToggle={(programme) => patch({ programmes: toggle(filter.programmes, programme) })}
            />
            {bands.length > 1 && (
                <FilterRow<Band>
                    label="Band"
                    options={bands}
                    selected={filter.bands}
                    onToggle={(band) => patch({ bands: toggle(filter.bands, band) })}
                />
            )}
            <FilterRow<SpotModeGroup>
                label="Mode"
                options={[...spotModeGroups]}
                selected={filter.modeGroups}
                onToggle={(group) => patch({ modeGroups: toggle(filter.modeGroups, group) })}
            />
            <FilterRow<string>
                label="Show"
                options={["New refs", "Hide QRT", "Hide RBN"]}
                selected={[
                    ...(filter.newOnly ? ["New refs"] : []),
                    ...(filter.hideQrt ? ["Hide QRT"] : []),
                    ...(filter.hideAutomatic ? ["Hide RBN"] : []),
                ]}
                onToggle={(option) =>
                    patch(
                        option === "New refs"
                            ? { newOnly: !filter.newOnly }
                            : option === "Hide QRT"
                              ? { hideQrt: !filter.hideQrt }
                              : { hideAutomatic: !filter.hideAutomatic },
                    )
                }
            />
            <FilterRow<string>
                label="Age"
                options={["30m", "1h", "3h"]}
                selected={[{ 30: "30m", 60: "1h", 180: "3h" }[filter.maxAgeMinutes] || ""]}
                onToggle={(option) => patch({ maxAgeMinutes: { "30m": 30, "1h": 60, "3h": 180 }[option] as number })}
            />
            <Stack direction="row" gap="lg">
                <Typography variant="em" style={styles.label}>
                    Search
                </Typography>
                <View style={{ flexGrow: 1 }}>
                    <Input
                        value={filter.search}
                        placeholder="Callsign, reference or park"
                        onChangeText={(search) => patch({ search })}
                    />
                </View>
            </Stack>
        </Stack>
    );
};

// Used by the modeGroup chips above and by the page's summary line.
export const spotModeGroupOf = modeGroup;
