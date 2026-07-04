// Tiny context so AnnouncementBar and Header can share the "dismissed" state
// without threading props through every layout file.
"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface AnnouncementCtx {
    dismissed: boolean;
    dismiss: () => void;
}

const AnnouncementContext = createContext<AnnouncementCtx>({
    dismissed: false,
    dismiss: () => { },
});

export function AnnouncementProvider({ children }: { children: ReactNode }) {
    const [dismissed, setDismissed] = useState(false);

    const dismiss = () => setDismissed(true);

    return (
        <AnnouncementContext.Provider value={{ dismissed, dismiss }}>
            {children}
        </AnnouncementContext.Provider>
    );
}

export const useAnnouncement = () => useContext(AnnouncementContext);
