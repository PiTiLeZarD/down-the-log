import React from "react";
import { EventType } from "../utils/event-rules";
import { Button } from "../utils/theme/components/button";
import { Typography } from "../utils/theme/components/typography";
import { GmapsChip } from "./gmaps-chip";

export type ReferenceDatum = { name: string; locator?: string };

export type ReferenceInfoProps = {
    event: EventType;
    info?: string;
    reference?: string;
    data?: Record<string, ReferenceDatum>;
};

export type ReferenceInfoComponent = React.FC<ReferenceInfoProps>;

export const ReferenceInfo: ReferenceInfoComponent = ({ event, reference, data, info }): JSX.Element => {
    if (!reference) return <></>;
    if (event === "sig") {
        if (info?.toLowerCase() === "zlota") {
            return (
                <Button variant="chip" text={info} url={`https://ontheair.nz/assets/${reference.replace("/", "_")}`} />
            );
        }
        if (info?.toLowerCase() === "siota") {
            return <Button variant="chip" text={info} url={`https://www.silosontheair.com/silos/#${reference}`} />;
        }
        return <></>;
    }
    if (!data || !(reference in data)) return <Typography variant="subtitle">Unknown reference {reference}</Typography>;
    const { name, locator } = data[reference as keyof typeof data] as ReferenceDatum;
    if (event === "pota") return <Button variant="chip" text={name} url={`https://pota.app/#/park/${reference}`} />;
    return <GmapsChip text={name} locator={locator} zoom={14} />;
};
