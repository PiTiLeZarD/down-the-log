import { useEffect, useState } from "react";

/**
 * The value, but only once it has stopped changing for `ms`.
 *
 * Typing a callsign shouldn't drag a scan of the log along with it keystroke by keystroke: the box
 * takes the letter now, and whatever searches off it catches up when the operator pauses.
 */
export const useDebouncedValue = <T,>(value: T, ms: number = 300): T => {
    const [settled, setSettled] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => setSettled(value), ms);
        return () => clearTimeout(timer);
    }, [value, ms]);

    return settled;
};
