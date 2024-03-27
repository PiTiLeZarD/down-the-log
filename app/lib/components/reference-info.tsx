import React from "react";
import { EventType } from "../utils/event-rules";
import { Button } from "../utils/theme/components/button";
import { Typography } from "../utils/theme/components/typography";
import { GmapsChip } from "./gmaps-chip";

export type ReferenceDatum = { name: string; locator?: string };

export type ReferenceInfoProps = {
    event: EventType;
    reference?: string;
    data: Record<string, ReferenceDatum>;
};

export type ReferenceInfoComponent = React.FC<ReferenceInfoProps>;

export const ReferenceInfo: ReferenceInfoComponent = ({ event, reference, data }): JSX.Element => {
    if (!reference) return <></>;
    if (!(reference in data)) return <Typography variant="subtitle">Unknown reference {reference}</Typography>;
    const { name, locator } = data[reference as keyof typeof data] as ReferenceDatum;
    if (event === "pota") return <Button variant="chip" text={name} url={`https://pota.app/#/park/${reference}`} />;
    return <GmapsChip text={name} locator={locator} zoom={14} />;
};
