import { QSO } from "../components/qso";
import { baseCallsign, getCallsignData } from "./callsign";
import { fetchData as hamqthFetchData } from "./spot-sources/hamqth";
import { Settings } from "./store";

type SpotMandatoryFields = "callsign" | "frequency";
export type Spot = Required<Pick<QSO, SpotMandatoryFields>> & Partial<Omit<QSO, SpotMandatoryFields>>;

export type SpotFetchDataFn = (settings: Settings) => Promise<Spot[]>;

export const spotSourceMap: Record<string, SpotFetchDataFn> = {
    hamqth: hamqthFetchData,
};

const onlySpotsFromMyContinent = (myCallsign: string) => (spots: Spot[]) =>
    spots.filter((spot) =>
        spot.myCallsign
            ? getCallsignData(baseCallsign(myCallsign) || "")?.ctn ===
              getCallsignData(baseCallsign(spot.myCallsign) || "")?.ctn
            : false,
    );

export const updateAllSpots = (settings: Settings, updateSpots: (spots: Spot[]) => void) => {
    Object.entries(spotSourceMap).map(([key, fetchData]) => {
        fetchData(settings)
            .then(onlySpotsFromMyContinent(settings.myCallsign))
            .then((spots) =>
                spots.map((spot) => {
                    spot.honeypot = { ...(spot.honeypot || {}), spotSources: JSON.stringify([key]) };
                    return spot;
                }),
            )
            .then(updateSpots);
    });
};
