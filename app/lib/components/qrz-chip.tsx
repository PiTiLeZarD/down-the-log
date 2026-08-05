import { findCountry, getCallsignData, parseCallsign } from "../utils/callsign";
import { Button } from "../utils/theme/components/button";

export type QrzChipProps = {
    callsign: string;
    textIsCallsign?: boolean;
    includeFlag?: boolean;
};

export const QrzChip = ({ callsign, textIsCallsign = false, includeFlag = false }: QrzChipProps) => {
    const parsed = parseCallsign(callsign);
    return (
        <Button
            text={
                textIsCallsign
                    ? includeFlag
                        ? `${findCountry(getCallsignData(callsign))?.flag} ${callsign}`
                        : callsign
                    : "QRZ"
            }
            variant="chip"
            url={`https://www.qrz.com/db/${parsed?.prefix}${parsed?.index}${parsed?.delineation}`}
        />
    );
};
