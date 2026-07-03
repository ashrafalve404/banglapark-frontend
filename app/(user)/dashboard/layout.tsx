"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { useAuthStore } from "@/store/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user } = useAuthStore();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) router.push("/login?redirect=/dashboard");
    }, [isAuthenticated, router]);

    if (!isAuthenticated || !user) return null;

    return (
        <div className="flex h-screen bg-gray-50">
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
                        <span className="text-sm text-gray-500">স্বাগতম,</span>
                        <span className="text-sm font-semibold text-gray-800">{user.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${user.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`}>
                            {user.status === "ACTIVE" ? "সক্রিয়" : "নিষ্ক্রিয়"}
                        </span>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-[72px] md:pb-6">{children}</main>
                <MobileBottomNav />
            </div>
        </div>
    );
}
