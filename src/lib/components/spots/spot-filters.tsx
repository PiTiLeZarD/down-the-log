import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { Band, bands as bandRanges, sortBands } from "../../data/bands";
import { Continent, continents } from "../../data/callsigns";
import { EventType } from "../../utils/event-rules";
import {
    SpotFilter,
    SpotModeGroup,
    SpotSource,
    activeFilterCount,
    defaultSpotFilter,
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
        width: 84,
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
export const toggle = <T,>(values: T[], value: T): T[] =>
    values.includes(value) ? values.filter((v) => v !== value) : [...values, value];

export type FilterRowProps<T extends string> = {
    label: string;
    options: T[];
    selected: T[];
    labelFor?: (option: T) => string;
    colourFor?: (option: T) => "primary" | "secondary" | "grey" | "success" | "danger";
    onToggle: (option: T) => void;
};

export const FilterRow = <T extends string>({
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

// Every band rather than the ones currently spotted: a chip row that changes shape with the feed
// can't be set once and left alone, and the band nothing is on right now is the one an alert is for.
const allBands = (Object.keys(bandRanges) as Band[]).sort(sortBands);

// Free text, because the operator is typing calls they heard about rather than picking from a list.
// Commas, spaces and newlines all separate — nobody should have to guess which.
const parseWatch = (text: string): string[] =>
    text
        .toUpperCase()
        .split(/[\s,;]+/)
        .filter(Boolean);

export const SpotFilters = () => {
    const settings = useSettings();
    const updateSetting = useStore((state) => state.updateSetting);
    const filter = settings.spotFilter;
    const patch = (values: Partial<SpotFilter>) => updateSetting("spotFilter", { ...filter, ...values });

    // Held separately from the setting so a half-typed callsign isn't parsed into the list on every
    // keystroke — "G4A" would be a rule of its own for as long as it takes to finish typing.
    const [watchText, setWatchText] = React.useState(filter.watch.join(" "));
    // SOTAwatch is listed but not offerable until the API approval lands; hiding it entirely would
    // just raise the same question every time somebody wonders where SOTA spots are.
    const sources = spotSources.filter((source) => source !== "sota" || !sotaApprovalPending);
    const count = activeFilterCount(filter);

    return (
        <Stack gap="lg">
            <Typography variant="subtitle">
                Decides what the Spots page and the spots bar list, and what alerts fire for. Every row has to match; a
                row with nothing picked matches everything.
            </Typography>
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
            <FilterRow<Band>
                label="Band"
                options={allBands}
                selected={filter.bands}
                onToggle={(band) => patch({ bands: toggle(filter.bands, band) })}
            />
            <FilterRow<SpotModeGroup>
                label="Mode"
                options={[...spotModeGroups]}
                selected={filter.modeGroups}
                onToggle={(group) => patch({ modeGroups: toggle(filter.modeGroups, group) })}
            />
            <FilterRow<Continent>
                label="Continent"
                options={Object.keys(continents) as Continent[]}
                selected={filter.continents}
                labelFor={(continent) => continents[continent]}
                onToggle={(continent) => patch({ continents: toggle(filter.continents, continent) })}
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
                    Callsigns
                </Typography>
                <View style={{ flexGrow: 1 }}>
                    <Input
                        value={watchText}
                        placeholder="VK* ZL* G4XYZ — blank for any"
                        onChangeText={setWatchText}
                        onBlur={() => patch({ watch: parseWatch(watchText) })}
                    />
                </View>
            </Stack>
            <Typography variant="subtitle">
                Spaces or commas between calls. * matches anything, so VK* is every VK station, portable or not.
            </Typography>
            {count > 0 && (
                <View>
                    <Button
                        variant="outlined"
                        text={`Clear filter (${count})`}
                        onPress={() => {
                            setWatchText("");
                            updateSetting("spotFilter", { ...defaultSpotFilter, maxAgeMinutes: filter.maxAgeMinutes });
                        }}
                    />
                </View>
            )}
        </Stack>
    );
};
