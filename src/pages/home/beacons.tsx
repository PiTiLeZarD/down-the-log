import { DateTime } from "luxon";
import React, { useEffect } from "react";
import { Band, freq2band } from "../../data/bands";
import { findCountry, getCallsignData } from "../../utils/callsign";
import { Stack } from "../../utils/stack";
import { Alert } from "../../utils/theme/components/alert";
import { Button } from "../../utils/theme/components/button";
import { Typography } from "../../utils/theme/components/typography";

const beacons = [
    "4U1UN",
    "VE8AT",
    "W6WX",
    "KH6RS",
    "ZL6B",
    "VK6RBP",
    "JA2IGY",
    "RR9O",
    "VR2B",
    "4S7B",
    "ZS6DN",
    "5Z4B",
    "4X6TU",
    "OH2B",
    "CS3B",
    "LU4AA",
    "OA4B",
    "YV5B",
];

const frequencies = [14.1, 18.11, 21.15, 24.93, 28.2];

const beaconOn = (band: Band) => {
    const utc = DateTime.utc().toObject();
    const b20 = ((utc.hour * 60 + utc.minute) % 3) * 6 + Math.floor(utc.second / 10);
    const beaconIndex = (b20 + beacons.length - frequencies.findIndex((f) => freq2band(f) == band)) % beacons.length;
    return beacons[beaconIndex];
};

export type BeaconsProps = {};

export type BeaconsComponent = React.FC<BeaconsProps>;

export const Beacons: BeaconsComponent = (): JSX.Element => {
    const [band, setBand] = React.useState<Band>("20m");
    const [beacon, setBeacon] = React.useState<string>(beacons[0]);

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
                        {country?.flag} {country?.name} ({csdata?.ctn})
                    </Typography>
                </Stack>
            </Alert>
        </Stack>
    );
};
