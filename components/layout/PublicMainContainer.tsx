"use client";

import { useAnnouncement } from "@/lib/announcement-context";

export function PublicMainContainer({ children }: { children: React.ReactNode }) {
    const { dismissed } = useAnnouncement();
    return (
        <main className={`flex-1 transition-[padding-top] duration-300 ${dismissed ? "pt-16" : "pt-24 sm:pt-[100px]"}`}>
            {children}
        </main>
    );
}
