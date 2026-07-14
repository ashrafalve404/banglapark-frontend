"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard, Users, Package, Tag, ShoppingBag,
    Wallet, ArrowDownToLine, Settings, BarChart2, X, ChevronRight, Home, Image
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";
import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";

interface AdminSidebarProps {
    onClose?: () => void;
    mobile?: boolean;
}

export function AdminSidebar({ onClose, mobile }: AdminSidebarProps) {
    const pathname = usePathname();
    const { t } = useLocale();

    const navItems = [
        { href: "/admin", label: t("nav.overview"), icon: LayoutDashboard, exact: true },
        { href: "/admin/banners", label: t("nav.banners"), icon: Image },
        { href: "/admin/users", label: t("nav.users"), icon: Users },
        { href: "/admin/products", label: t("nav.products"), icon: Package },
        { href: "/admin/categories", label: t("nav.categories"), icon: Tag },
        { href: "/admin/orders", label: t("nav.orders"), icon: ShoppingBag },
        { href: "/admin/withdrawals", label: t("nav.withdrawals"), icon: ArrowDownToLine },
        { href: "/admin/commission-rules", label: t("nav.commissionRules"), icon: Settings },
        { href: "/admin/reports", label: t("nav.reports"), icon: BarChart2 },
    ];

    return (
        <aside className={cn("flex h-full flex-col bg-slate-900", mobile && "")}>
            {mobile && (
                <div className="flex h-16 items-center justify-between px-4 border-b border-slate-700">
                    <span className="font-bold text-white">{t("nav.adminPanel")}</span>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
            )}
            {!mobile && (
                <div className="flex h-16 items-center px-4 border-b border-slate-700">
                    <span className="font-bold text-white">{t("nav.banglaPark")}</span>
                    <span className="ml-2 rounded-full bg-green-600/20 px-2 py-0.5 text-[10px] font-semibold text-green-400 uppercase">{t("nav.adminPanel")}</span>
                </div>
            )}
            <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
                <Link
                    href="/"
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-green-400 hover:bg-slate-800 transition-all mb-1 border border-slate-700"
                >
                    <Home size={17} />
                    {t("nav.backToSite")}
                </Link>
                <div className="border-t border-slate-700 my-1" />
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
                                    ? "bg-green-600/20 text-green-400"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                            )}
                        >
                            <item.icon size={17} />
                            {item.label}
                            {active && <ChevronRight size={14} className="ml-auto" />}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t border-slate-700 p-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{t("nav.language")}</span>
                    <LocaleSwitcher />
                </div>
            </div>
        </aside>
    );
}
