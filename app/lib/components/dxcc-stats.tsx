import { useRouter } from "expo-router";
import React from "react";
import { View } from "react-native";
import { groupQsos } from "../../stats";
import { sortBands } from "../data/bands";
import { unique } from "../utils/arrays";
import { useStore } from "../utils/store";
import { Button } from "../utils/theme/components/button";
import { Typography } from "../utils/theme/components/typography";
import { dxcc2label, filterQsos } from "./filters";
import { useQsos } from "./qso";
import { Stack } from "./stack";

export type DxccStatsProps = {
    dxcc: number;
};

export type DxccStatsComponent = React.FC<DxccStatsProps>;

export const DxccStats: DxccStatsComponent = ({ dxcc }): JSX.Element => {
    const qsos = useQsos().filter((q) => q.dxcc === dxcc);
    const updateFilters = useStore((state) => state.updateFilters);
    const { navigate } = useRouter();

    const groups = groupQsos(qsos, "band", "mode");
    const modes = unique(
        Object.values(groups)
            .map((g) => Object.keys(g))
            .flat(),
    );

    const chipValue = (band: string, mode: string) => {
        const qs = groups[band][mode] || [];
        if (qs.length === 0) return undefined;
        const confirmed = filterQsos(qs, [{ name: "qsl", values: ["LoTW received", "eQSL received"] }]).length > 0;
        return (
            <Button
                variant="chip"
                colour={confirmed ? "primary" : "grey"}
                text={qs.length}
                onPress={() => {
                    updateFilters([
                        { name: "band", values: [band] },
                        { name: "mode", values: [mode] },
                        { name: "dxcc", values: [dxcc2label(dxcc)] },
                    ]);
                    navigate("/");
                }}
            />
        );
    };

    return (
        <Stack>
            <Stack direction="row">
                <View style={{ flex: 1 }} />
                {modes.map((m) => (
                    <Typography key={`header_${m}`} style={{ flex: 1, textAlign: "center" }}>
                        {m}
                    </Typography>
                ))}
            </Stack>
            {Object.keys(groups)
                .sort(sortBands)
                .map((band) => (
                    <Stack key={band}>
                        <Stack direction="row">
                            <Typography style={{ flex: 1, textAlign: "center" }}>{band}</Typography>
                            {modes.map((mode) => (
                                <View key={`${band}_${mode}`} style={{ flex: 1 }}>
                                    {chipValue(band, mode)}
                                </View>
                            ))}
                        </Stack>
                    </Stack>
                ))}
        </Stack>
    );
};
