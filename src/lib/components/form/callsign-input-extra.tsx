import { DateTime } from "luxon";
import { useMemo } from "react";
import { clranks, mostWanted } from "../../data/clranks";
import { findCountry, getCallsignData } from "../../utils/callsign";
import { HamQTHCallsignData } from "../../utils/hamqth";
import { maidenDistance } from "../../utils/locator";
import { useStore } from "../../utils/store";
import { Typography } from "../../ui/typography";
import { useSettings } from "../../utils/use-settings";
import { Grid } from "../grid";
import { Stack } from "../stack";

export type CallsignInputExtraProps = {
    value?: string;
    hamqthCSData?: Partial<HamQTHCallsignData>;
};

export const CallsignInputExtra = ({ value, hamqthCSData }: CallsignInputExtraProps) => {
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
                        <Typography>{callsignData.name}</Typography>
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
                        {hamqthCSData.utc_offset && (
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
                        )}

                        {hamqthCSData.age && <Typography variant="subtitle">{hamqthCSData.age}yo</Typography>}
                    </Stack>
                )}
            </Grid>
            <Grid item xs={-1} md={3} lg={1}>
                <Stack>
                    {/* Straight off the callsign's prefix. Deriving these from the entity's
                        reference square put every US station in one zone and every Russian one in
                        another; cty.dat carries them per prefix, call area included. */}
                    <Typography variant="subtitle">CQ: {callsignData.cq}</Typography>
                    <Typography variant="subtitle">ITU: {callsignData.itu}</Typography>
                    <Typography variant="subtitle">
                        DXCC: {callsignData.dxcc} ({mostWanted(callsignData.dxcc)}/{clranks.length})
                    </Typography>
                </Stack>
            </Grid>
        </Grid>
    );
};
