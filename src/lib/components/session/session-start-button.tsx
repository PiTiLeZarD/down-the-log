import React from "react";
import { View } from "react-native";
import { Button } from "../../ui/button";
import { useActiveSession } from "../../utils/use-session";
import { SessionModal } from "./session-modal";

// Where starting a session lives when none is running: in the input bar with the other pre-callsign
// controls, costing no vertical space. Once one is running the bar above the inputs takes over — by
// then there is something to show.
export const SessionStartButton = () => {
    const session = useActiveSession();
    const [open, setOpen] = React.useState<boolean>(false);

    if (session) return null;

    // The View is in here rather than around the call site: an empty one left behind when a session
    // starts still counts as a child of the input row and holds its gap open.
    return (
        <View>
            <Button aria-label="Start a session" startIcon="play" onPress={() => setOpen(true)} />
            <SessionModal open={open} onClose={() => setOpen(false)} />
        </View>
    );
};
