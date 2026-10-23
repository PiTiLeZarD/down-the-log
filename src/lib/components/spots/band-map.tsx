import { useRouter } from "expo-router";
import React from "react";
import { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, ScrollViewInstance, View } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { Band, bands } from "../../data/bands";
import { Button } from "../../ui/button";
import { IconName } from "../../ui/icon";
import { SelectInput } from "../../ui/select-input";
import { ColourVariant } from "../../ui/theme";
import { Typography } from "../../ui/typography";
import {
    DEFAULT_ZOOM,
    LABEL_HEIGHT,
    MergedSpot,
    SpotStatus,
    applySpotFilter,
    bandMapBands,
    bandMapZooms,
    layoutBandMap,
    spotProgrammeLabel,
    spotStatus,
    useSpots,
} from "../../utils/spots";
import { useSettings } from "../../utils/use-settings";
import { useQsos } from "../qso";
import { Stack } from "../stack";
import { programmeColour } from "./spot-row";

const SCALE_WIDTH = 64;
const CONNECTOR_WIDTH = 36;

// Colour carries what the spots page says in words: red is a dupe, green a reference never worked.
const statusColour = (status: SpotStatus): ColourVariant =>
    status.dupe ? "danger" : status.newReference ? "success" : "grey";

const styles = StyleSheet.create((theme) => ({
    panel: {
        flex: 1,
        backgroundColor: theme.background,
        borderLeftWidth: theme.margins.xs,
        borderColor: theme.colours.grey.light,
    },
    header: {
        padding: theme.margins.md,
        borderBottomWidth: theme.margins.xs,
        borderColor: theme.colours.grey.light,
    },
    tick: {
        position: "absolute",
        left: 0,
        width: SCALE_WIDTH,
        borderTopWidth: theme.margins.xs,
        borderColor: theme.colours.grey.main,
    },
    tickText: {
        fontSize: theme.components.typography.fontSize - 4,
    },
    axis: {
        position: "absolute",
        left: SCALE_WIDTH,
        top: 0,
        bottom: 0,
        width: theme.margins.xs,
        backgroundColor: theme.colours.grey.main,
    },
    // Where the QSO form says the radio is.
    rig: {
        position: "absolute",
        left: 0,
        width: SCALE_WIDTH + CONNECTOR_WIDTH,
        height: theme.margins.sm,
        backgroundColor: theme.colours.secondary.main,
    },
    label: (colour: ColourVariant, workedBefore: boolean) => ({
        position: "absolute",
        left: SCALE_WIDTH + CONNECTOR_WIDTH,
        height: LABEL_HEIGHT,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.margins.lg,
        paddingRight: theme.margins.lg,
        borderRadius: theme.margins.md,
        overflow: "hidden",
        backgroundColor: theme.colours[colour].light,
        // Worked before is worth seeing, just not worth chasing first.
        opacity: workedBefore ? 0.6 : 1,
    }),
    rail: (colour: ColourVariant) => ({
        width: theme.margins.md,
        alignSelf: "stretch",
        backgroundColor: theme.colours[colour].main,
    }),
    callsign: (colour: ColourVariant) => ({
        color: theme.colours[colour].darker,
        fontWeight: "bold",
    }),
    detail: (colour: ColourVariant) => ({
        color: theme.colours[colour].darker,
        fontSize: theme.components.typography.fontSize - 4,
    }),
    empty: {
        position: "absolute",
        left: SCALE_WIDTH + CONNECTOR_WIDTH,
        top: theme.margins.lg,
    },
    legend: {
        padding: theme.margins.lg,
        borderTopWidth: theme.margins.xs,
        borderColor: theme.colours.grey.light,
    },
}));

// Wrapped: the button's theme style is `flex: 1`, and in a row of six that stretches every one.
const IconButton = ({
    icon,
    label,
    onPress,
    colour = "grey",
}: {
    icon: IconName;
    label: string;
    onPress: () => void;
    colour?: ColourVariant;
}) => (
    <View>
        <Button variant="chip" colour={colour} startIcon={icon} aria-label={label} onPress={onPress} />
    </View>
);

export type BandMapProps = {
    // The QSO form's band and frequency: the map follows the band, except while one picked by hand
    // overrides it.
    band?: Band;
    frequency?: number;
    onSpotPress: (spot: MergedSpot) => void;
    // Spot what's being heard: the station in the QSO form, where the form is tuned.
    onSpot: () => void;
    onClose: () => void;
};

/**
 * The spots on one band laid out on a frequency scale, the way a contest logger's bandmap does it:
 * where the activity is matters more than when it was spotted. Tapping a call logs it.
 */
export const BandMap = ({ band, frequency, onSpotPress, onSpot, onClose }: BandMapProps) => {
    const { navigate } = useRouter();
    const { theme } = useUnistyles();
    const settings = useSettings();
    const qsos = useQsos();
    const { spots, fetchedAt, loading } = useSpots();
    // Remembered against the form's band at the time, so a band change in the form takes over again.
    const [picked, setPicked] = React.useState<{ band: Band; over?: Band } | undefined>(undefined);
    const [zoom, setZoom] = React.useState<number>(DEFAULT_ZOOM);
    const [legend, setLegend] = React.useState<boolean>(false);
    const [viewport, setViewport] = React.useState<number>(0);
    const scroller = React.useRef<ScrollViewInstance>(null);
    // The frequency at the middle of the view, so zooming keeps it there instead of jumping.
    const centre = React.useRef<number | undefined>(undefined);

    const shown: Band =
        picked && picked.over === band ? picked.band : band && bandMapBands.includes(band) ? band : "20m";
    const [low, high] = bands[shown];
    const rig = frequency && frequency >= low && frequency <= high ? frequency : undefined;

    const layout = React.useMemo(
        () => layoutBandMap(applySpotFilter(spots, settings.spotFilter, settings.spotSources, qsos), shown, zoom),
        [spots, settings.spotFilter, settings.spotSources, qsos, shown, zoom],
    );
    const y = (mhz: number) => (high - mhz) * 1000 * zoom;

    const scrollTo = (mhz?: number) => {
        if (!viewport) return;
        scroller.current?.scrollTo({ y: mhz ? Math.max(0, y(mhz) - viewport / 2) : 0, animated: false });
    };
    // A new band opens on the radio, or at its top when the radio is elsewhere.
    // Effect events: following the radio's frequency as it's typed would yank the view away mid-scan.
    const openOnRig = React.useEffectEvent(() => scrollTo(rig));
    const keepCentre = React.useEffectEvent(() => scrollTo(centre.current));
    React.useEffect(() => openOnRig(), [shown, viewport]);
    React.useEffect(() => keepCentre(), [zoom]);

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        centre.current = high - (event.nativeEvent.contentOffset.y + viewport / 2) / zoom / 1000;
    };
    const stepZoom = (by: number) => {
        const next = bandMapZooms[bandMapZooms.indexOf(zoom) + by];
        if (next) setZoom(next);
    };

    const status = !fetchedAt ? (loading ? "Fetching spots..." : "Spots unavailable") : `No spots on ${shown}`;

    return (
        <View style={styles.panel}>
            <Stack direction="row" gap="xs" style={styles.header}>
                <SelectInput
                    value={shown}
                    items={bandMapBands.map((b) => ({ label: b, value: b }))}
                    onValueChange={(value) => setPicked({ band: value as Band, over: band })}
                    aria-label="Band"
                />
                <View style={{ flexGrow: 1 }} />
                <IconButton icon="remove" label="Zoom out" onPress={() => stepZoom(-1)} />
                <Typography variant="subtitle">{zoom}px/kHz</Typography>
                <IconButton icon="add" label="Zoom in" onPress={() => stepZoom(1)} />
                <IconButton icon="megaphone" label="Spot" colour="secondary" onPress={onSpot} />
                <IconButton icon="list" label="Spots page" onPress={() => navigate("/spots")} />
                <IconButton icon="help" label="Legend" onPress={() => setLegend(!legend)} />
                <IconButton icon="close" label="Close bandmap" onPress={onClose} />
            </Stack>
            <ScrollView
                ref={scroller}
                onLayout={(event: LayoutChangeEvent) => setViewport(event.nativeEvent.layout.height)}
                onScroll={onScroll}
                scrollEventThrottle={100}
            >
                <View style={{ height: layout.height }}>
                    <View style={styles.axis} />
                    {layout.ticks.map((tick) => (
                        <View key={tick.khz} style={[styles.tick, { top: tick.y }]}>
                            <Typography variant="subtitle" style={styles.tickText}>
                                {tick.khz.toLocaleString()}
                            </Typography>
                        </View>
                    ))}
                    {!!rig && <View style={[styles.rig, { top: y(rig) }]} />}
                    {/* Plain colours off the live theme: Svg isn't a unistyles-processed component. */}
                    <Svg
                        width={CONNECTOR_WIDTH}
                        height={layout.height}
                        style={{ position: "absolute", left: SCALE_WIDTH, top: 0 }}
                    >
                        {layout.labels.map(({ spot, anchor, top }) => {
                            const colour = theme.colours[statusColour(spotStatus(spot, qsos))].main;
                            const middle = top + LABEL_HEIGHT / 2;
                            return (
                                <React.Fragment key={spot.id}>
                                    <Circle cx={4} cy={anchor} r={3} fill={colour} />
                                    <Line
                                        x1={4}
                                        y1={anchor}
                                        x2={CONNECTOR_WIDTH}
                                        y2={middle}
                                        stroke={colour}
                                        strokeWidth={1}
                                        // Dashed once the label has been pushed off its frequency.
                                        strokeDasharray={Math.abs(middle - anchor) > 1 ? "3 3" : undefined}
                                    />
                                </React.Fragment>
                            );
                        })}
                    </Svg>
                    {layout.labels.map(({ spot, top }) => {
                        const spotState = spotStatus(spot, qsos);
                        const colour = statusColour(spotState);
                        return (
                            <Pressable
                                key={spot.id}
                                style={[styles.label(colour, spotState.workedBefore && !spotState.dupe), { top }]}
                                onPress={() => onSpotPress(spot)}
                                aria-label={`Log ${spot.callsign}`}
                            >
                                <View style={styles.rail(programmeColour(spot.programme))} />
                                <Typography style={styles.callsign(colour)}>{spot.callsign}</Typography>
                                {!!spot.programme && (
                                    <Typography style={styles.detail(colour)}>{spotProgrammeLabel(spot)}</Typography>
                                )}
                                {!!spot.mode && <Typography style={styles.detail(colour)}>{spot.mode}</Typography>}
                            </Pressable>
                        );
                    })}
                    {!layout.labels.length && (
                        <Typography variant="subtitle" style={styles.empty}>
                            {status}
                        </Typography>
                    )}
                </View>
            </ScrollView>
            {legend && (
                <Stack gap="sm" style={styles.legend}>
                    <Typography variant="subtitle">Tap a call to log it.</Typography>
                    <Typography variant="subtitle">
                        Green: reference never worked · Red: dupe today · Faded: worked before
                    </Typography>
                    <Typography variant="subtitle">
                        Left stripe: programme (blue SOTA, green WWFF, orange POTA, grey other/DX)
                    </Typography>
                    <Typography variant="subtitle">Orange line: the frequency in the QSO form.</Typography>
                </Stack>
            )}
        </View>
    );
};
