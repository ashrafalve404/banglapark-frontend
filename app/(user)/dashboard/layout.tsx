"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Loader2 } from "lucide-react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useAuthStore } from "@/store/auth";
import { useLocale } from "@/lib/i18n";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user } = useAuthStore();
    const { t } = useLocale();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    // Hydration guard: Zustand persist reads localStorage only on the client.
    // Without this, isAuthenticated is false during SSR/hydration â†’ false redirect to login.
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        // Only redirect AFTER hydration so we don't act on the transient pre-hydration state
        if (mounted && !isAuthenticated) {
            router.push("/login?redirect=/dashboard");
        }
    }, [mounted, isAuthenticated, router]);

    // Show a full-screen loader while Zustand is hydrating from localStorage
    if (!mounted) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-red-700" size={32} />
            </div>
        );
    }

    if (!isAuthenticated || !user) return null;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Desktop sidebar */}
            <div className="hidden lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-gray-100">
                <DashboardSidebar />
            </div>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                    <div className="absolute left-0 top-0 h-full w-64">
                        <DashboardSidebar mobile onClose={() => setSidebarOpen(false)} />
                    </div>
                </div>
            )}

            {/* Main content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Topbar */}
                <header className="flex h-14 items-center gap-3 border-b border-gray-100 bg-white px-4 lg:px-6">
                    <button className="lg:hidden p-2 text-gray-500 hover:text-gray-700" onClick={() => setSidebarOpen(true)}>
                        <Menu size={20} />
                    </button>
                    <div className="flex-1" />
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{t("dashboard.header.welcome")},</span>
                        <span className="text-sm font-semibold text-gray-800">{user.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${user.status === "ACTIVE" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-500"}`}>
                            {user.status === "ACTIVE" ? t("dashboard.header.active") : t("dashboard.header.inactive")}
                        </span>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-[72px] md:pb-6">{children}</main>
                <MobileBottomNav />
            </div>
        </div>
    );
}

