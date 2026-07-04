"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useAnnouncement } from "@/lib/announcement-context";

const SEGMENTS = [
    "🎉 Welcome to Bangla Park Limited — Start Earning Today!",
    "📞 Contact: 01700-000000",
    "📧 support@banglapark.com",
    "🚚 Delivery all over Bangladesh",
];

const SEPARATOR = "     ·     ";
const TRACK_TEXT = SEGMENTS.join(SEPARATOR);

export function AnnouncementBar() {
    const { dismissed, dismiss } = useAnnouncement();
    const [isPaused, setIsPaused] = useState(false);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        const handleVisibility = () => setIsPaused(document.hidden);
        document.addEventListener("visibilitychange", handleVisibility);
        return () => document.removeEventListener("visibilitychange", handleVisibility);
    }, []);

    // Animate out then dismiss
    const handleClose = () => {
        setClosing(true);
        setTimeout(dismiss, 280); // matches transition duration
    };

    if (dismissed) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[60] bg-neutral-900 text-white overflow-hidden h-8 sm:h-9 flex items-center select-none transition-all duration-300"
            style={{
                transform: closing ? "translateY(-100%)" : "translateY(0)",
                opacity: closing ? 0 : 1,
            }}
        >
            {/* Scrolling text — two duplicate tracks for seamless loop */}
            <div
                className="flex whitespace-nowrap text-[10px] sm:text-[11px] animate-marquee flex-1 min-w-0"
                style={{ animationPlayState: isPaused ? "paused" : "running" }}
            >
                <span className="inline-block px-8">{TRACK_TEXT}</span>
                <span className="inline-block px-8" aria-hidden="true">{TRACK_TEXT}</span>
            </div>

            {/* Close button */}
            <button
                onClick={handleClose}
                aria-label="Close announcement"
                className="flex-shrink-0 mr-2 sm:mr-3 p-1 rounded hover:bg-white/15 transition-colors focus:outline-none focus:ring-1 focus:ring-white/40"
            >
                <X size={13} strokeWidth={2.5} />
            </button>
        </div>
    );
}
