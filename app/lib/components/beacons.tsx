import { DateTime } from "luxon";
import React, { useEffect } from "react";
import { Band, freq2band } from "../data/bands";
import { findCountry, getCallsignData } from "../utils/callsign";
import { maidenDistance } from "../utils/locator";
import { Modal } from "../utils/modal";
import { useStore } from "../utils/store";
import { widthMatches } from "../utils/theme/breakpoints";
import { Alert } from "../utils/theme/components/alert";
import { Button } from "../utils/theme/components/button";
import { Typography } from "../utils/theme/components/typography";
import { useSettings } from "../utils/use-settings";
import { Stack } from "./stack";

const beaconsMap = {
    "4U1UN": "FN30ar",
    VE8AT: "CP28mf",
    W6WX: "CM87xh",
    KH6RS: "BL10sv",
    ZL6B: "RE79ub",
    VK6RBP: "QF22pd",
    JA2IGY: "PM84jl",
    RR9O: "NO14kx",
    VR2B: "OL72ch",
    "4S7B": "MJ96ww",
    ZS6DN: "KF19lk",
    "5Z4B": "KI88jt",
    "4X6TU": "KM72jb",
    OH2B: "KP21uw",
    CS3B: "IM12mp",
    LU4AA: "GF05tj",
    OA4B: "FH17lw",
    YV5B: "FK60nl",
};

type Beacon = keyof typeof beaconsMap;

const frequencies = [14.1, 18.11, 21.15, 24.93, 28.2];

const beaconOn = (band: Band): Beacon => {
    const utc = DateTime.utc().toObject();
    const b20 = ((utc.hour * 60 + utc.minute) % 3) * 6 + Math.floor(utc.second / 10);
    const beacons = Object.keys(beaconsMap);
    const beaconIndex = (b20 + beacons.length - frequencies.findIndex((f) => freq2band(f) == band)) % beacons.length;
    return beacons[beaconIndex] as Beacon;
};

const rotateBeacons = (a: Array<Beacon>, b: Beacon): Array<Beacon> => {
    for (let i = 0; i < a.findIndex((bi) => bi === b); i++) {
        a.unshift(a.pop() as Beacon);
    }
    return a;
};

export type BeaconsProps = {};

export type BeaconsComponent = React.FC<BeaconsProps>;

export const Beacons: BeaconsComponent = (): JSX.Element => {
    const [modalOpen, setModalOpen] = React.useState<boolean>(false);
    const currentLocation = useStore((state) => state.currentLocation);
    const updateSetting = useStore((state) => state.updateSetting);
    const settings = useSettings();
    const [band, setBand] = React.useState<Band>("20m");
    const [beacon, setBeacon] = React.useState<Beacon>(Object.keys(beaconsMap)[0] as Beacon);
    const smallScreen = widthMatches(undefined, "md");

    const updateBeacon = (b: Band) => {
        if (band != b) setBand(b);
        setBeacon(beaconOn(b));
    };

    useEffect(() => {
        const beaconInterval = setInterval(() => {
            updateBeacon(band);
        }, 500);
        return () => {
            clearInterval(beaconInterval);
        };
    }, [band]);

    const csdata = getCallsignData(beacon);
    const country = csdata ? findCountry(csdata) : null;

    return (
        <Stack direction="row" gap="xxl">
            <Typography variant="em">{smallScreen ? "Beacons:" : "NCDXF/IARU Beacons:"}</Typography>
            <Stack direction="row">
                {smallScreen && <Button text={band} onPress={() => setModalOpen(true)} />}
                {!smallScreen &&
                    frequencies.map((f) => (
                        <Button
                            key={f}
                            variant={freq2band(f) == band ? "contained" : "outlined"}
                            onPress={() => updateBeacon(freq2band(f) || "20m")}
                            text={freq2band(f)}
                        />
                    ))}
            </Stack>
            <Alert severity="info" style={{ flexGrow: 1 }}>
                <Stack direction="row">
                    {!smallScreen && (
                        <Typography variant="subtitle">
                            {(frequencies.find((f) => freq2band(f) === band) as number).toFixed(3)}Mhz
                        </Typography>
                    )}
                    <Typography>{beacon}</Typography>
                    {smallScreen && <Typography variant="em">{country?.name}</Typography>}
                    {!smallScreen && (
                        <Typography variant="em">
                            {country?.flag} {country?.name} ({csdata?.ctn}){" "}
                            {maidenDistance(beaconsMap[beacon as Beacon], currentLocation, settings.imperial)}
                            {settings.imperial ? "mi" : "km"}
                        </Typography>
                    )}
                    {!smallScreen && (
                        <Typography>
                            Next:{" "}
                            {rotateBeacons(Object.keys(beaconsMap) as Array<Beacon>, beacon)
                                .splice(1, 5)
                                .join(", ")}
                        </Typography>
                    )}
                </Stack>
            </Alert>
            {!smallScreen && (
                <Button startIcon="close" onPress={() => updateSetting("showBeacons", false)} style={{ flexGrow: 0 }} />
            )}
            <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
                <Stack gap="xxl">
                    {frequencies.map((f) => (
                        <Button
                            key={f}
                            variant={freq2band(f) == band ? "contained" : "outlined"}
                            onPress={() => {
                                updateBeacon(freq2band(f) || "20m");
                                setModalOpen(false);
                            }}
                            text={freq2band(f)}
                        />
                    ))}
                    <Button colour="success" text="OK" onPress={() => setModalOpen(false)} />
                </Stack>
            </Modal>
        </Stack>
    );
};
