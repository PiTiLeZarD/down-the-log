import { DateTime } from "luxon";
import React, { useMemo } from "react";
import cqzones from "../../data/cqzones.json";
import ituzones from "../../data/ituzones.json";
import { findCountry, getCallsignData } from "../../utils/callsign";
import { HamQTHCallsignData } from "../../utils/hamqth";
import { maidenDistance, maidenhead2Latlong } from "../../utils/locator";
import { findZone } from "../../utils/polydec";
import { useStore } from "../../utils/store";
import { Typography } from "../../utils/theme/components/typography";
import { useSettings } from "../../utils/use-settings";
import { Grid } from "../grid";
import { Stack } from "../stack";

export type CallsignInputExtraProps = {
    value?: string;
    hamqthCSData?: HamQTHCallsignData;
};

export type CallsignInputExtraComponent = React.FC<CallsignInputExtraProps>;

export const CallsignInputExtra: CallsignInputExtraComponent = ({ value, hamqthCSData }): JSX.Element => {
    const callsignData = useMemo(() => (value ? getCallsignData(value) : undefined), [value]);
    const settings = useSettings();
    const country = callsignData ? findCountry(callsignData) : null;
    const currentLocation = useStore((state) => state.currentLocation);

    if (!callsignData) return <></>;

    return (
        <Grid container>
            <Grid item xs={8} md={6} lg={8}>
                <Stack>
                    {hamqthCSData && <Typography>{hamqthCSData.qth}</Typography>}
                    <Stack direction="row">
                        <Typography>{country?.flag}</Typography>
                        <Typography>{country?.name}</Typography>
                        {callsignData.state && <Typography>{callsignData.state}</Typography>}
                        <Typography>({callsignData.ctn})</Typography>
                    </Stack>
                    <Typography variant="subtitle">
                        {maidenDistance(
                            currentLocation,
                            hamqthCSData && hamqthCSData.grid ? hamqthCSData.grid : callsignData.gs,
                            settings.imperial,
                        )}
                        {settings.imperial ? "mi" : "km"}
                    </Typography>
                </Stack>
            </Grid>
            <Grid item xs={4} md={3} lg={3}>
                {hamqthCSData && (
                    <Stack>
                        <Typography>{hamqthCSData.name}</Typography>
                        <Typography variant="subtitle">
                            Local time:{" "}
                            {DateTime.utc()
                                .setZone(
                                    `UTC${
                                        hamqthCSData.utc_offset > 0
                                            ? `+${hamqthCSData.utc_offset}`
                                            : hamqthCSData.utc_offset
                                    }`,
                                )
                                .toFormat("HH:mm")}
                        </Typography>
                        {hamqthCSData.age && <Typography variant="subtitle">{hamqthCSData.age}yo</Typography>}
                    </Stack>
                )}
            </Grid>
            <Grid item xs={-1} md={3} lg={1}>
                <Stack>
                    <Typography variant="subtitle">
                        CQ: {callsignData.gs ? findZone(cqzones, maidenhead2Latlong(callsignData.gs)) : "??"}
                    </Typography>
                    <Typography variant="subtitle">
                        ITU: {callsignData.gs ? findZone(ituzones, maidenhead2Latlong(callsignData.gs)) : "??"}
                    </Typography>
                    <Typography variant="subtitle">DXCC: {callsignData.dxcc}</Typography>
                </Stack>
            </Grid>
        </Grid>
    );
};
