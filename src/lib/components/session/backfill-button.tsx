import React from "react";
import { Button } from "../../ui/button";
import { showDialog } from "../../ui/dialog";
import { backfillSessions } from "../../utils/session";
import { useStore } from "../../utils/store";
import { useQsos } from "../qso";

// Turns the activations the Events screen works out from the QSOs into real sessions. Only a session
// shows up on this list, exports as one, or can be picked up again — so a log that predates sessions
// gets nothing from them until it's been through here.
export const BackfillButton = () => {
    const qsos = useQsos();
    const adoptSessions = useStore((state) => state.adoptSessions);
    // The whole log walked per event; worth memoising, since it recomputes on any press on the page.
    const pending = React.useMemo(() => backfillSessions(qsos), [qsos]);

    if (!pending.sessions.length) return null;

    const handlePress = async () => {
        const confirmed = await showDialog({
            title: `Make ${pending.sessions.length} sessions?`,
            icon: "question",
            text: `${pending.qsos.length} QSOs from past activations aren't in a session yet. Each activation becomes one, dated when it happened. Nothing is logged or changed beyond that.`,
            confirmButtonText: "Make them",
            cancelButtonText: "Cancel",
        });
        if (confirmed) adoptSessions(pending.sessions, pending.qsos);
    };

    return (
        <Button
            variant="chip"
            colour="secondary"
            startIcon="albums"
            text={`Sessions (${pending.sessions.length})`}
            onPress={handlePress}
        />
    );
};
