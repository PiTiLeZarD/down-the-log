import axios from "axios";
import { DateTime } from "luxon";
import React, { useEffect } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useWidthMatches } from "../ui/breakpoints";
import { Button } from "../ui/button";
import colours from "../ui/colours.json";
import { Typography } from "../ui/typography";
import { isLocator, maidenhead2Latlong, normalise } from "../utils/locator";
import { Modal } from "../utils/modal";
import {
    BandCondition,
    ConditionLabel,
    PathType,
    Propagation,
    aIndex,
    estimatePropagation,
    takeaway,
} from "../utils/propagation";
import { useStore } from "../utils/store";
import { useSettings } from "../utils/use-settings";
import { withCache } from "../utils/with-cache";
import { Stack } from "./stack";

const dtFormat = "yyyyMMddHHmm";
type DataType = { date: DateTime; value: number };
// The daily indices file gives us three series in one go, so they're fetched and cached together.
type SolarType = { date: DateTime; sfi: number; sunspots: number; sunspotArea: number };
const solarSeries = ["sfi", "sunspots", "sunspotArea"] as const;

const serialise = (data: DataType[]) =>
    JSON.stringify(data.map(({ date, value }) => ({ date: date.toFormat(dtFormat), value: String(value) })));
const deserialise = (data: string) =>
    JSON.parse(data).map(({ date, value }: { date: string; value: string }) => ({
        date: DateTime.fromFormat(date, dtFormat),
        value: +value,
    }));

const serialiseSolar = (data: SolarType[]) =>
    JSON.stringify(
        data.map((e) => ({
            date: e.date.toFormat(dtFormat),
            ...Object.fromEntries(solarSeries.map((key) => [key, String(e[key])])),
        })),
    );
const deserialiseSolar = (data: string): SolarType[] =>
    JSON.parse(data).map((e: Record<string, string>) => ({
        date: DateTime.fromFormat(e.date, dtFormat),
        ...(Object.fromEntries(solarSeries.map((key) => [key, +e[key]])) as Omit<SolarType, "date">),
    }));

const sirx =
    /^(\d{4} \d{2} \d{2})\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+([-]?\d+)\s+([*]|([A-Z]\d+[.]\d+))\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/;

const fetchSolarData = async () =>
    axios
        .get(`https://services.swpc.noaa.gov/text/daily-solar-indices.txt`)
        .then(({ data }) =>
            data
                .split("\n")
                .filter((l: string) => !l.startsWith(":") && !l.startsWith("#"))
                .map((l: string) => {
                    const d = l.match(sirx);
                    if (d) {
                        return {
                            date: DateTime.fromFormat(d[1], "yyyy MM dd"),
                            sfi: +d[2],
                            sunspots: +d[3],
                            sunspotArea: +d[4],
                        };
                    }
                })
                .filter((e: any) => !!e),
        )
        .then(serialiseSolar);

// The K series is kept whole rather than trimmed to its last reading: the A index is the last
// twenty-four hours of it averaged.
const fetchMagneticData = async () =>
    axios
        .get("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json")
        .then(({ data }) =>
            data.map((e: { time_tag: string; Kp: number }) => ({
                date: DateTime.fromISO(e.time_tag),
                value: +e.Kp,
            })),
        )
        .then(serialise);

// The current X-ray class, which is what the R scale is read off. A flare shows up here minutes
// after it starts, so this one is cached for far less time than the daily indices.
const fetchXrayClass = async () =>
    axios
        .get("https://services.swpc.noaa.gov/json/goes/primary/xray-flares-latest.json")
        .then(({ data }) => String(data?.[0]?.current_class ?? ""));

const coloursGradient = [
    colours.red[700],
    colours.red[500],
    colours.orange[500],
    colours.orange[300],
    colours.green[300],
    colours.green[600],
];
const scaleColour = (value: number, cutoffs: number[], reverse: boolean = false): string => {
    if (cutoffs.length != 7) throw new Error("wrong cutoffs");
    // Anything off either end of the scale sticks to the nearest bucket rather than falling off the gradient.
    const found = cutoffs.findIndex((v, i) => value >= v && value < cutoffs[i + 1]);
    let status = found >= 0 ? found : value < cutoffs[0] ? 0 : coloursGradient.length - 1;
    if (reverse) status = coloursGradient.length - status - 1;
    return coloursGradient[status];
};

const conditionColour: Record<ConditionLabel, string> = {
    Good: colours.green[500],
    Fair: colours.yellow[400],
    Poor: colours.orange[400],
    Closed: colours.red[400],
};

const paths: { key: PathType; label: string; description: string }[] = [
    { key: "local", label: "Local", description: "< 1,000 km" },
    { key: "dx", label: "DX", description: "> 3,000 km" },
];

const styles = StyleSheet.create((theme) => ({
    pills: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: theme.margins.lg,
    },
    pill: (background: string) => ({
        backgroundColor: background,
        borderRadius: theme.margins.xxl,
        paddingTop: theme.margins.sm,
        paddingBottom: theme.margins.sm,
        paddingLeft: theme.margins.lg,
        paddingRight: theme.margins.lg,
    }),
    pillText: {
        fontSize: theme.components.typography.fontSize - 4,
        color: theme.colours.grey.darker,
        fontWeight: "bold",
    },
    headings: {
        flexDirection: "row",
        alignItems: "flex-end",
        paddingBottom: theme.margins.md,
        borderBottomWidth: theme.margins.xs,
        borderBottomColor: theme.colours.grey.light,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingTop: theme.margins.md,
        paddingBottom: theme.margins.md,
    },
    band: {
        width: 46,
        fontWeight: "bold",
    },
    cell: {
        flexGrow: 1,
        flexBasis: 0,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.margins.lg,
        paddingRight: theme.margins.lg,
    },
    track: {
        flexGrow: 1,
        flexBasis: 0,
        height: 12,
        borderRadius: 6,
        backgroundColor: theme.colours.grey.lighter,
        overflow: "hidden",
    },
    // Unistyles hands dynamic styles the values it needs, so the width and the colour of the fill
    // can both come from the score without a stylesheet per band.
    fill: (score: number, colour: string) => ({
        width: `${Math.max(score, 3)}%`,
        height: "100%",
        borderRadius: 6,
        backgroundColor: colour,
    }),
    condition: {
        width: 52,
        fontSize: 12,
    },
    takeaway: {
        backgroundColor: theme.colours.primary.lighter,
        borderLeftWidth: theme.margins.md,
        borderLeftColor: theme.colours.primary.main,
        padding: theme.margins.lg,
    },
}));

/** A reading, not a control — the indices are there to be read past, not tapped. */
const Pill = ({ label, value, colour }: { label: string; value: string; colour: string }) => (
    <View style={styles.pill(colour)}>
        <Typography style={styles.pillText}>
            {label} {value}
        </Typography>
    </View>
);

const BandRow = ({ condition, wide }: { condition: BandCondition; wide: boolean }) => (
    <View style={styles.row}>
        <Typography style={styles.band}>{condition.band}</Typography>
        {paths.map(({ key }) => (
            <View key={key} style={styles.cell}>
                <View style={styles.track}>
                    <View style={styles.fill(condition.scores[key], conditionColour[condition.labels[key]])} />
                </View>
                {wide ? <Typography style={styles.condition}>{condition.labels[key]}</Typography> : null}
            </View>
        ))}
    </View>
);

const Conditions = ({ propagation, locator }: { propagation: Propagation; locator: string }) => {
    // The condition words don't fit beside two bars on a phone, so there the colour carries it and
    // the takeaway underneath says the part that matters in words.
    const wide = useWidthMatches("md");
    const { sunElevation, daylight, muf, luf, blackout, bands } = propagation;
    const sun =
        sunElevation > 0
            ? `sun ${Math.round(sunElevation)}° up`
            : `sun ${Math.round(-sunElevation)}° below the horizon`;

    return (
        <Stack>
            <Typography variant="subtitle">
                {locator} · {propagation.at.toFormat("HH:mm")} local · {sun} ·{" "}
                {daylight === "greyline" ? "grey line" : daylight}
            </Typography>
            <Typography variant="subtitle">
                MUF {muf.dx.toFixed(1)} MHz over a 3,000 km hop, {muf.local.toFixed(1)} MHz close in. Everything under
                about {luf.dx.toFixed(1)} MHz is being absorbed on the way out.
                {blackout.scale > 0 ? ` ${blackout.label} radio blackout (${blackout.xray}).` : ""}
            </Typography>
            <View style={styles.headings}>
                <Typography style={styles.band}> </Typography>
                {paths.map(({ key, label, description }) => (
                    <View key={key} style={styles.cell}>
                        <Typography variant="em">{wide ? `${label} ${description}` : label}</Typography>
                    </View>
                ))}
            </View>
            {bands.map((condition) => (
                <BandRow key={condition.band} condition={condition} wide={wide} />
            ))}
            <View style={styles.takeaway}>
                <Typography>{takeaway(propagation)}</Typography>
            </View>
            <Typography variant="subtitle">
                Worked out for your own grid square and the time it is there, from the solar flux, the K index and where
                the sun is: it is an estimate, not a forecast. Sporadic E isn&apos;t modelled, so 10m and 6m can open
                when this says they won&apos;t.
            </Typography>
        </Stack>
    );
};

export const PropagationData = () => {
    const [modal, setModal] = React.useState<boolean>(false);
    const [solarData, setSolarData] = React.useState<SolarType[]>();
    const [magneticData, setMagneticData] = React.useState<DataType[]>();
    const [xray, setXray] = React.useState<string>();
    // The estimate moves with the sun, so it is recomputed on a clock of its own rather than only
    // when a fetch lands.
    const [now, setNow] = React.useState<DateTime>(DateTime.local());
    const settings = useSettings();
    const currentLocation = useStore((state) => state.currentLocation);
    const locator = normalise(settings.myGridsquare || currentLocation);

    const updateCache = () => {
        // Key bumped from "solarData" because the cached shape now carries three series per row.
        withCache("solarIndices", fetchSolarData, 60 * 60 * 3).then((data) => setSolarData(deserialiseSolar(data)));
        withCache("magneticData", fetchMagneticData, 60 * 60 * 3).then((data) => setMagneticData(deserialise(data)));
        withCache("xrayClass", fetchXrayClass, 60 * 15).then(setXray);
    };

    useEffect(() => {
        updateCache();
        const ts = setInterval(updateCache, 10 * 60 * 1000);
        const clock = setInterval(() => setNow(DateTime.local()), 60 * 1000);
        return () => {
            clearInterval(ts);
            clearInterval(clock);
        };
    }, []);

    const latestSolar = solarData?.length ? solarData[solarData.length - 1] : undefined;
    const kpSeries = magneticData?.map(({ value }) => value) || [];
    const sfi = latestSolar?.sfi;
    const kp = kpSeries.length ? kpSeries[kpSeries.length - 1] : undefined;

    // No grid square means no local sun angle, which is the whole estimate — the indices are still
    // worth showing, so the panel falls back to those alone.
    const propagation =
        locator && isLocator(locator)
            ? estimatePropagation({ sfi, kp, xray, at: now, location: maidenhead2Latlong(locator) })
            : undefined;

    // The indices are the estimate's inputs rather than its answer, so they sit in the panel as
    // readings to check rather than as the headline.
    const indices: { label: string; value?: number; cutoffs: number[]; reverse?: boolean }[] = [
        { label: "SFI", value: sfi, cutoffs: [0, 50, 100, 150, 200, 250, 300] },
        { label: "K", value: kp, cutoffs: [0, 8, 15, 30, 50, 100, 400], reverse: true },
        { label: "A", value: aIndex(kpSeries), cutoffs: [0, 8, 16, 30, 50, 100, 400], reverse: true },
        { label: "SS", value: latestSolar?.sunspots, cutoffs: [0, 20, 50, 90, 140, 200, 500] },
        { label: "SA", value: latestSolar?.sunspotArea, cutoffs: [0, 100, 300, 600, 1000, 1500, 5000] },
    ];

    const wideScreen = useWidthMatches("md");

    // The header carries the answer rather than the inputs: the band to reach for right now,
    // coloured by how well it is expected to work. It waits for the flux rather than showing a
    // band worked out from the quiet-sun default, which would be a guess wearing a colour.
    const best = sfi === undefined ? undefined : propagation?.best;
    const open = best?.local || best?.dx;

    return (
        <Stack direction="row">
            <Button
                variant="chip"
                colour="grey"
                numberOfLines={1}
                text={
                    open
                        ? [best.local?.band, best.dx?.band !== best.local?.band ? best.dx?.band : undefined]
                              .filter(Boolean)
                              .join("/")
                        : !propagation
                          ? "Set a grid"
                          : sfi === undefined
                            ? "Fetching..."
                            : "Bands shut"
                }
                onPress={() => setModal(true)}
                style={{
                    backgroundColor: open
                        ? conditionColour[best.local?.labels.local || best.dx!.labels.dx]
                        : propagation && sfi !== undefined
                          ? conditionColour.Closed
                          : undefined,
                    // flex: 0, not flexGrow/flexShrink: the base button's `flex: 1` also sets a 0%
                    // basis, which survives those two and collapses the chip to its padding.
                    ...(wideScreen ? {} : { flex: 0, flexBasis: "auto" as const, paddingLeft: 6, paddingRight: 6 }),
                }}
            />
            <Modal wide open={modal} onClose={() => setModal(false)}>
                <Stack gap="xxl">
                    <Typography variant="h2">HF propagation</Typography>
                    <View style={styles.pills}>
                        {indices.map(({ label, value, cutoffs, reverse }) => (
                            <Pill
                                key={label}
                                label={label}
                                value={value === undefined ? "—" : String(value)}
                                colour={value === undefined ? colours.gray[300] : scaleColour(value, cutoffs, reverse)}
                            />
                        ))}
                        <Pill
                            label="R"
                            value={propagation?.blackout.scale ? propagation.blackout.label : "None"}
                            colour={
                                !propagation?.blackout.scale
                                    ? colours.green[300]
                                    : propagation.blackout.scale > 2
                                      ? colours.red[500]
                                      : colours.orange[300]
                            }
                        />
                    </View>
                    {propagation && locator ? (
                        <Conditions propagation={propagation} locator={locator} />
                    ) : (
                        <Typography>
                            Set a gridsquare in Settings, or let the app find your location, and the bands get worked
                            out for where you actually are.
                        </Typography>
                    )}
                    <Button colour="success" text="OK" onPress={() => setModal(false)} />
                </Stack>
            </Modal>
        </Stack>
    );
};
