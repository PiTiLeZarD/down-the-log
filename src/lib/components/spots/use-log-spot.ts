import { useRouter } from "expo-router";
import { DateTime } from "luxon";
import React from "react";
import { MergedSpot, qsoFromSpot } from "../../utils/spots";
import { useStore } from "../../utils/store";
import { useActiveSession } from "../../utils/use-session";
import { useSettings } from "../../utils/use-settings";
import { QSO, extrapolate, useQsos } from "../qso";

/**
 * Tapping a spot logs it and opens the QSO, with everything the spot knows already filled in. Shared
 * by the Spots page and the bandmap. Memoised: SpotRow is memoised on its props, and a callback
 * rebuilt on every render would repaint every row whenever anything changed.
 */
export const useLogSpot = () => {
    const settings = useSettings();
    const log = useStore((state) => state.log);
    const bumpSerial = useStore((state) => state.bumpSerial);
    const currentLocation = useStore((state) => state.currentLocation);
    const session = useActiveSession();
    const qsos = useQsos();
    const { navigate } = useRouter();

    return React.useCallback(
        (spot: MergedSpot) => {
            const seeded = qsoFromSpot(spot, { settings, currentLocation, session, previous: qsos[0] });
            const qso: QSO = extrapolate(seeded, qsos, settings.carryOver, session);
            qso.date = DateTime.utc();
            if (session?.contest) {
                qso.stx = session.contest.serial;
                bumpSerial(session.id);
            }
            log(qso);
            navigate(`/qso?qsoId=${qso.id}`);
        },
        [settings, currentLocation, session, qsos, log, bumpSerial, navigate],
    );
};
