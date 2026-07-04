// Tiny context so AnnouncementBar and Header can share the "dismissed" state
// without threading props through every layout file.
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

const STORAGE_KEY = "announcement_dismissed";

interface AnnouncementCtx {
    dismissed: boolean;
    dismiss: () => void;
}

const AnnouncementContext = createContext<AnnouncementCtx>({
    dismissed: false,
    dismiss: () => { },
});

export function AnnouncementProvider({ children }: { children: ReactNode }) {
    // Initialise from localStorage so dismissal survives page navigation.
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        setDismissed(localStorage.getItem(STORAGE_KEY) === "true");
    }, []);

    const dismiss = () => {
        localStorage.setItem(STORAGE_KEY, "true");
        setDismissed(true);
    };

    return (
        <AnnouncementContext.Provider value={{ dismissed, dismiss }}>
            {children}
        </AnnouncementContext.Provider>
    );
}

export const useAnnouncement = () => useContext(AnnouncementContext);
