export const merge = (currentProvided: object, updates: object) => {
    const current = { ...(currentProvided || {}) };
    if (updates) {
        for (const k of Object.keys(updates)) {
            const key = k as keyof typeof updates;
            if (!current.hasOwnProperty(key) || typeof updates[key] !== "object") current[key] = updates[key];
            else merge(current[key], updates[key]);
        }
    }
    return current;
};
