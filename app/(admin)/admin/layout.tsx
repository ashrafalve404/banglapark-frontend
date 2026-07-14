"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, Loader2 } from "lucide-react";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { useAuthStore } from "@/store/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user } = useAuthStore();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return; // wait for hydration before checking auth
        if (!isAuthenticated) { router.push("/login"); return; }
        if (user && user.role === "USER") router.push("/dashboard");
    }, [mounted, isAuthenticated, user, router]);

    // Show spinner while Zustand rehydrates from localStorage
    if (!mounted) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-red-700" size={32} />
            </div>
        );
    }

    if (!isAuthenticated || !user || user.role === "USER") return null;

    return (
        <div className="flex h-screen bg-slate-50">
            {/* Desktop sidebar */}
            <div className="hidden lg:flex lg:w-64 lg:flex-col">
                <AdminSidebar />
            </div>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
                    <div className="absolute left-0 top-0 h-full w-64">
                        <AdminSidebar mobile onClose={() => setSidebarOpen(false)} />
                    </div>
                </div>
            )}

            {/* Main */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <header className="flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:px-6">
                    <button className="lg:hidden p-2 text-slate-500" onClick={() => setSidebarOpen(true)}>
                        <Menu size={20} />
                    </button>
                    <div className="flex-1" />
                    <span className="text-sm font-semibold text-slate-700">{user.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-semibold">{user.role}</span>
                </header>
                <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
            </div>
        </div>
    );
}
