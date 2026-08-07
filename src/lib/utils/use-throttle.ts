import { useRef, useState } from "react";

const sameArgs = (previous: unknown[] | undefined, next: unknown[]) =>
    !!previous && previous.length === next.length && previous.every((v, i) => v === next[i]);

export const useThrottle = <T, ARGS extends any[]>(
    fn: (...args: ARGS) => T | Promise<T>,
    ms: number = 200,
): ((...args: ARGS) => T | undefined) => {
    const [state, setState] = useState<T | undefined>(undefined);
    const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const currentArgs = useRef<ARGS | undefined>(undefined);

    const timeoutCb = () => {
        timeout.current = undefined;
        Promise.resolve(fn(...(currentArgs.current as ARGS))).then((ret) => setState(ret));
    };
    return (...args) => {
        // Callers that run this during render (rather than from an event handler) used to restart
        // the timer on every render, and every firing `setState`d a fresh value, which re-rendered
        // the caller, which restarted the timer — a lookup every `ms` for as long as the component
        // stayed mounted. Only (re)schedule when the arguments actually changed.
        if (sameArgs(currentArgs.current, args)) return state;

        currentArgs.current = args;
        if (timeout.current) clearTimeout(timeout.current);
        timeout.current = setTimeout(timeoutCb, ms);
        return state;
    };
};
