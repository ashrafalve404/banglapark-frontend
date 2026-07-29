"use client";

export function PublicMainContainer({ children }: { children: React.ReactNode }) {
    return (
        <main className="flex-1 pt-14 sm:pt-16">
            {children}
        </main>
    );
}
