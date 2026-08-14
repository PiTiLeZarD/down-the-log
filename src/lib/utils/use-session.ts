import React from "react";
import { Session } from "./session";
import { useStore } from "./store";

// The session the next QSO belongs to, or nothing. An ended session stays in `sessions` for the
// history list, so the endedAt check is what makes "stop" actually stop.
export const useActiveSession = (): Session | undefined =>
    useStore((state) => {
        const session = state.sessions.find((s) => s.id === state.activeSessionId);
        return session && !session.endedAt ? session : undefined;
    });

// Newest first, which is the order the sessions page and the resume chips both want.
export const useSessions = (): Session[] => {
    const sessions = useStore((state) => state.sessions);
    return React.useMemo(() => [...sessions].sort((s1, s2) => s2.startedAt.toMillis() - s1.startedAt.toMillis()), [
        sessions,
    ]);
};
