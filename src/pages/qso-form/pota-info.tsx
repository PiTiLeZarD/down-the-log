import React from "react";
import pota from "../../data/pota.json";
import { Typography } from "../../utils/theme/components/typography";
import { GmapsChip } from "./gmaps-chip";

export type PotaDatum = { name: string; locator: string };

export type PotaInfoProps = {
    parkRef?: string;
};

export type PotaInfoComponent = React.FC<PotaInfoProps>;

export const PotaInfo: PotaInfoComponent = ({ parkRef }): JSX.Element => {
    if (!parkRef) return <></>;
    if (!(parkRef in pota)) return <Typography>Unknown parkRef {parkRef}</Typography>;

    const { name, locator } = pota[parkRef as keyof typeof pota] as PotaDatum;
    return <GmapsChip text={name} locator={locator} zoom={14} />;
};
