import { DateTime } from "luxon";
import React, { useEffect } from "react";
import { Band, freq2band } from "../../data/bands";
import { useStore } from "../../store";
import { findCountry, getCallsignData } from "../../utils/callsign";
import { maidenDistance } from "../../utils/locator";
import { Stack } from "../../utils/stack";
import { Alert } from "../../utils/theme/components/alert";
import { Button } from "../../utils/theme/components/button";
import { Typography } from "../../utils/theme/components/typography";

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

const frequencies = [14.1, 18.11, 21.15, 24.93, 28.2];

const beaconOn = (band: Band) => {
    const utc = DateTime.utc().toObject();
    const b20 = ((utc.hour * 60 + utc.minute) % 3) * 6 + Math.floor(utc.second / 10);
    const beacons = Object.keys(beaconsMap);
    const beaconIndex = (b20 + beacons.length - frequencies.findIndex((f) => freq2band(f) == band)) % beacons.length;
    return beacons[beaconIndex];
};

export type BeaconsProps = {};

export type BeaconsComponent = React.FC<BeaconsProps>;

export const Beacons: BeaconsComponent = (): JSX.Element => {
    const currentLocation = useStore((state) => state.currentLocation);
    const settings = useStore((state) => state.settings);
    const [band, setBand] = React.useState<Band>("20m");
    const [beacon, setBeacon] = React.useState<string>(Object.keys(beaconsMap)[0]);

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
            <Typography variant="em">NCDXF/IARU Beacons:</Typography>
            <Stack direction="row">
                {frequencies.map((f) => (
                    <Button
                        variant={freq2band(f) == band ? "contained" : "outlined"}
                        onPress={() => updateBeacon(freq2band(f) || "20m")}
                        text={freq2band(f)}
                    />
                ))}
            </Stack>
            <Alert severity="info" style={{ flexGrow: 1 }}>
                <Stack direction="row">
                    <Typography>{beacon}</Typography>
                    <Typography variant="em">
                        {country?.flag} {country?.name} ({csdata?.ctn}){" "}
                        {maidenDistance(
                            beaconsMap[beacon as keyof typeof beaconsMap],
                            currentLocation,
                            settings.imperial,
                        )}
                        {settings.imperial ? "mi" : "km"}
                    </Typography>
                </Stack>
            </Alert>
        </Stack>
    );
};
