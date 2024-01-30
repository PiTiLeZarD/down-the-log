import React from "react";
import wwff from "../../data/wwff.json";
import { Typography } from "../../utils/theme/components/typography";
import { GmapsChip } from "./gmaps-chip";

export type WwffDatum = { name: string; locator: string };

export type WwffInfoProps = {
    parkRef?: string;
};

export type WwffInfoComponent = React.FC<WwffInfoProps>;

export const WwffInfo: WwffInfoComponent = ({ parkRef }): JSX.Element => {
    if (!parkRef) return <></>;
    if (!(parkRef in wwff)) return <Typography>Unknown parkRef {parkRef}</Typography>;

    const { name, locator } = wwff[parkRef as keyof typeof wwff] as WwffDatum;
    return <GmapsChip text={name} locator={locator} zoom={14} />;
};