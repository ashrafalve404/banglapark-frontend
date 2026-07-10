"use client";

export function PublicMainContainer({ children }: { children: React.ReactNode }) {
    return (
        <main className="flex-1 pt-16">
            {children}
        </main>
    );
}
