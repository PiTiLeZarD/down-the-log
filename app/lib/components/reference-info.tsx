import React from "react";
import { Typography } from "../utils/theme/components/typography";
import { GmapsChip } from "./gmaps-chip";

export type ReferenceDatum = { name: string; locator?: string };

export type ReferenceInfoProps = {
    reference?: string;
    data: Record<string, ReferenceDatum>;
};

export type ReferenceInfoComponent = React.FC<ReferenceInfoProps>;

export const ReferenceInfo: ReferenceInfoComponent = ({ reference, data }): JSX.Element => {
    if (!reference) return <></>;
    if (!(reference in data)) return <Typography variant="subtitle">Unknown reference {reference}</Typography>;
    const { name, locator } = data[reference as keyof typeof data] as ReferenceDatum;
    return <GmapsChip text={name} locator={locator} zoom={14} />;
};
