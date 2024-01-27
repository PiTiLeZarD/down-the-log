import React from "react";
import iota from "../../data/iota.json";
import { Typography } from "../../utils/theme/components/typography";
import { GmapsChip } from "./gmaps-chip";

export type IotaDatum = { name: string; locator: string };

export type IotaInfoProps = {
    parkRef?: string;
};

export type IotaInfoComponent = React.FC<IotaInfoProps>;

export const IotaInfo: IotaInfoComponent = ({ parkRef }): JSX.Element => {
    if (!parkRef) return <></>;
    if (!(parkRef in iota)) return <Typography>Unknown parkRef {parkRef}</Typography>;

    const { name, locator } = iota[parkRef as keyof typeof iota] as IotaDatum;
    return <GmapsChip text={name} locator={locator} zoom={14} />;
};
