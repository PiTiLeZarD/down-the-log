import { DrawerScreenProps } from "@react-navigation/drawer";
import React from "react";
import { NavigationParamList } from "../../Navigation";
import { PageLayout } from "../../utils/page-layout";
import { Stack } from "../../utils/stack";
import { Typography } from "../../utils/theme/components/typography";

export type AboutProps = {} & DrawerScreenProps<NavigationParamList, "About">;

export type AboutComponent = React.FC<AboutProps>;

export const About: AboutComponent = ({ navigation }): JSX.Element => {
    return (
        <PageLayout title="About" navigation={navigation}>
            <Stack>
                <Typography>
                    Look, this app is absolute rubbish for now. Just so you know, I'm coding this in chunks of 5mn when
                    I get the time (kids and all) so it'll only get better. I have plenty of ideas, and I'll just keep
                    adding to it. If you see this app now it's simply because I'm testing things.
                </Typography>
                <Typography>Just a couple of ideas I have:</Typography>
                <Typography variant="subtitle">
                    1) All basic log stuff, import/export adif, quick around the band qso, contest mode
                </Typography>
                <Typography variant="subtitle">
                    2) I'd like to have a band browse mode. You hear people on different frenquencies, you pencil them
                    in, whenever you get a qso, you just need to select one of the callsigns. (I often try multiple
                    times to get someone and sometimes forget where in the band they were) Kinda like a mempad on icom.
                </Typography>
                <Typography variant="subtitle">
                    3) I want all the QTH, location, distance and all that to be as smooth as possible. I need 4 tools
                    now to find the maidenhead, and have the right location and all that.
                </Typography>
                <Typography variant="subtitle">
                    4) I'd like nice visualisation tools, see your qsos as map, as sessions, have filters, dx bingo and
                    so on.
                </Typography>
                <Typography variant="subtitle">5) Special modes for SOTA, WWFF, POTA, pileups and so on.</Typography>
                <Typography variant="subtitle">
                    6) down the track, integrated with HamQTH, QRZ, lotw and all the goodies
                </Typography>
            </Stack>
        </PageLayout>
    );
};
