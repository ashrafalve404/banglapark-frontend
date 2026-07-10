"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export function AnnouncementBar() {
    const { t } = useLocale();
    const [dismissed, setDismissed] = useState(false);
    const [closing, setClosing] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    useEffect(() => {
        const handleVisibility = () => setIsPaused(document.hidden);
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, []);

    const handleClose = () => {
        setClosing(true);
        setTimeout(() => setDismissed(true), 300);
    };

    if (dismissed) return null;

    const announcementText = t("common.announcement");

    return (
        <div
            className="w-full bg-neutral-900 text-white overflow-hidden h-8 sm:h-9 flex items-center select-none transition-all duration-300"
            style={{
                opacity: closing ? 0 : 1,
            }}
        >
            {/* Scrolling Banner */}
            <div className="flex-1 overflow-hidden relative flex items-center h-full pl-4 pr-1">
                <div
                    className="whitespace-nowrap animate-marquee-slow inline-block text-[10px] sm:text-[11px] font-medium"
                    style={{ animationPlayState: isPaused ? "paused" : "running" }}
                >
                    <span className="inline-block pr-24">{announcementText}</span>
                    <span className="inline-block pr-24">{announcementText}</span>
                </div>
            </div>

            {/* Close Button */}
            <button
                onClick={handleClose}
                aria-label="Close announcement"
                className="flex-shrink-0 mr-2 sm:mr-3 p-1 rounded hover:bg-white/15 transition-colors focus:outline-none focus:ring-1 focus:ring-white/40 cursor-pointer"
            >
                <X size={13} strokeWidth={2.5} />
            </button>
        </div>
    );
}

