"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard, User, Wallet, ShoppingBag, Users,
    TrendingUp, ArrowDownToLine, Bell, ChevronRight, X, Home,
    FileText, LogOut, ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";
import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";
import { authApi } from "@/lib/api/auth";

interface DashboardSidebarProps {
    onClose?: () => void;
    mobile?: boolean;
}

export function DashboardSidebar({ onClose, mobile }: DashboardSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { t } = useLocale();

    const handleLogout = async () => {
        await authApi.logout();
        router.push("/login");
    };

    const navItems = [
        { href: "/dashboard", label: t("nav.overview"), icon: LayoutDashboard, exact: true },
        { href: "/dashboard/profile", label: t("nav.profile"), icon: User },
        { href: "/dashboard/daily-work", label: t("nav.dailyWork"), icon: ImageIcon },
        { href: "/dashboard/wallet", label: t("nav.wallet"), icon: Wallet },
        { href: "/dashboard/orders", label: t("nav.orders"), icon: ShoppingBag },
        { href: "/dashboard/referrals", label: t("nav.referrals"), icon: Users },
        { href: "/dashboard/withdraw", label: t("nav.withdraw"), icon: ArrowDownToLine },
        { href: "/dashboard/statement", label: t("nav.statement"), icon: FileText },
        { href: "/dashboard/notifications", label: t("nav.notifications"), icon: Bell },
    ];

    return (
        <aside className={cn("flex h-full flex-col bg-white", mobile && "border-r border-gray-100 pb-16")}>
            {mobile && (
                <div className="flex h-16 items-center justify-between px-4 border-b border-gray-100">
                    <span className="font-bold text-green-800">{t("nav.banglaPark")}</span>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>
            )}
            <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
                <Link
                    href="/"
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-green-700 hover:bg-green-50 transition-all mb-1 border border-green-100"
                >
                    <Home size={17} />
                    {t("nav.backToSite")}
                </Link>
                <div className="border-t border-gray-100 my-1" />
                {navItems.map((item) => {
                    const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                                active
                                    ? "bg-green-50 text-green-800"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <item.icon size={17} className={active ? "text-green-700" : "text-gray-400"} />
                            {item.label}
                            {active && <ChevronRight size={14} className="ml-auto text-green-600" />}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t border-gray-100 p-3 space-y-3">
                <button
                    onClick={() => { handleLogout(); onClose?.(); }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
                >
                    <LogOut size={17} />
                    {t("nav.logout")}
                </button>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{t("nav.language")}</span>
                    <LocaleSwitcher />
                </div>
            </div>
        </aside>
    );
}
