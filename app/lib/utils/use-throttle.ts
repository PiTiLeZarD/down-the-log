import { useRef, useState } from "react";

export const useThrottle = <T, ARGS extends any[]>(
    fn: (...args: ARGS) => T | Promise<T>,
    ms: number = 200,
): ((...args: ARGS) => T | undefined) => {
    const [state, setState] = useState<T | undefined>(undefined);
    const timeout = useRef<ReturnType<typeof setTimeout>>();
    const currentArgs = useRef<ARGS>();

    const timeoutCb = () => {
        Promise.resolve(fn(...(currentArgs.current as ARGS))).then((ret) => setState(ret));
    };
    return (...args) => {
        if (timeout.current) {
            clearTimeout(timeout.current);
            timeout.current = undefined;
        }
        timeout.current = setTimeout(timeoutCb, ms);
        currentArgs.current = args;
        return state;
    };
};
