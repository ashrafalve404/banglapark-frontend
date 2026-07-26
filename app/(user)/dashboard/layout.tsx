"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Loader2 } from "lucide-react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useAuthStore } from "@/store/auth";
import { useLocale } from "@/lib/i18n";
import { NotificationDropdown } from "@/components/layout/NotificationDropdown";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user } = useAuthStore();
    const { t } = useLocale();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    // Hydration guard: Zustand persist reads localStorage only on the client.
    // Without this, isAuthenticated is false during SSR/hydration → false redirect to login.
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
                <Loader2 className="animate-spin text-green-700" size={32} />
            </div>
        );
    }

    if (!isAuthenticated || !user) return null;

    const firstLetter = user.name ? user.name.trim().charAt(0).toUpperCase() : "U";

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
                <header className="flex h-14 items-center gap-1.5 sm:gap-3 border-b border-gray-100 bg-white px-2.5 sm:px-4 lg:px-6">
                    <button className="lg:hidden p-1.5 text-gray-500 hover:text-gray-700 shrink-0" onClick={() => setSidebarOpen(true)}>
                        <Menu size={20} />
                    </button>
                    <div className="flex-1 min-w-0" />
                    <div className="flex items-center gap-1.5 sm:gap-4 shrink-0 min-w-0">
                        <NotificationDropdown />
                        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                            <span className="text-[11px] sm:text-sm text-gray-500 hidden min-[360px]:inline">{t("dashboard.header.welcome")},</span>
                            <span className="text-xs sm:text-sm font-semibold text-gray-800 truncate max-w-[70px] min-[360px]:max-w-[110px] sm:max-w-none">{user.name}</span>
                            <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-semibold shrink-0 ${user.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                                {user.status === "ACTIVE" ? t("dashboard.header.active") : t("dashboard.header.inactive")}
                            </span>
                            <Link href="/dashboard/profile" title={user.name} className="shrink-0">
                                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-slate-600 bg-slate-200 flex items-center justify-center text-[10px] sm:text-xs font-bold text-slate-700 shadow-xs shrink-0 ml-0.5 sm:ml-1 transition-transform hover:scale-105">
                                    {user.profileImage ? (
                                        <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{firstLetter}</span>
                                    )}
                                </div>
                            </Link>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-[72px] md:pb-6">{children}</main>
                <MobileBottomNav />
            </div>
        </div>
    );
}

