"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    FaGauge, FaImage, FaClipboardList, FaCircleQuestion, FaUserGroup,
    FaAward, FaPlane, FaBoxOpen, FaTags, FaBagShopping,
    FaArrowsDownToLine, FaGear, FaChartLine, FaHouse, FaChevronRight, FaXmark,
    FaChartBar
} from "react-icons/fa6";
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
        { href: "/admin", label: t("nav.overview"), icon: FaGauge, exact: true, activeBg: "bg-indigo-500/20 text-indigo-300 border-l-4 border-indigo-500 font-bold", iconColor: "text-indigo-400" },
        { href: "/admin/banners", label: t("nav.banners"), icon: FaImage, activeBg: "bg-pink-500/20 text-pink-300 border-l-4 border-pink-500 font-bold", iconColor: "text-pink-400" },
        { href: "/admin/daily-work", label: t("nav.dailyWork"), icon: FaClipboardList, activeBg: "bg-amber-500/20 text-amber-300 border-l-4 border-amber-500 font-bold", iconColor: "text-amber-400" },
        { href: "/admin/quiz", label: t("nav.quiz"), icon: FaCircleQuestion, activeBg: "bg-purple-500/20 text-purple-300 border-l-4 border-purple-500 font-bold", iconColor: "text-purple-400" },
        { href: "/admin/users", label: t("nav.users"), icon: FaUserGroup, activeBg: "bg-cyan-500/20 text-cyan-300 border-l-4 border-cyan-500 font-bold", iconColor: "text-cyan-400" },
        { href: "/admin/position", label: t("nav.position"), icon: FaAward, activeBg: "bg-teal-500/20 text-teal-300 border-l-4 border-teal-500 font-bold", iconColor: "text-teal-400" },
        { href: "/admin/travel", label: t("nav.travel"), icon: FaPlane, activeBg: "bg-orange-500/20 text-orange-300 border-l-4 border-orange-500 font-bold", iconColor: "text-orange-400" },
        { href: "/admin/products", label: t("nav.products"), icon: FaBoxOpen, activeBg: "bg-emerald-500/20 text-emerald-300 border-l-4 border-emerald-500 font-bold", iconColor: "text-emerald-400" },
        { href: "/admin/categories", label: t("nav.categories"), icon: FaTags, activeBg: "bg-sky-500/20 text-sky-300 border-l-4 border-sky-500 font-bold", iconColor: "text-sky-400" },
        { href: "/admin/orders", label: t("nav.orders"), icon: FaBagShopping, activeBg: "bg-blue-500/20 text-blue-300 border-l-4 border-blue-500 font-bold", iconColor: "text-blue-400" },
        { href: "/admin/withdrawals", label: t("nav.withdrawals"), icon: FaArrowsDownToLine, activeBg: "bg-rose-500/20 text-rose-300 border-l-4 border-rose-500 font-bold", iconColor: "text-rose-400" },
        { href: "/admin/commission-rules", label: t("nav.commissionRules"), icon: FaGear, activeBg: "bg-violet-500/20 text-violet-300 border-l-4 border-violet-500 font-bold", iconColor: "text-violet-400" },
        { href: "/admin/profit-loss", label: t("nav.profitLoss"), icon: FaChartLine, activeBg: "bg-lime-500/20 text-lime-300 border-l-4 border-lime-500 font-bold", iconColor: "text-lime-400" },
        { href: "/admin/reports", label: t("nav.reports"), icon: FaChartBar, activeBg: "bg-fuchsia-500/20 text-fuchsia-300 border-l-4 border-fuchsia-500 font-bold", iconColor: "text-fuchsia-400" },
    ];

    return (
        <aside className={cn("flex h-full flex-col bg-slate-900", mobile && "")}>
            {mobile && (
                <div className="flex h-16 items-center justify-between px-4 border-b border-slate-700">
                    <span className="font-bold text-white">{t("nav.adminPanel")}</span>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-white">
                        <FaXmark size={20} />
                    </button>
                </div>
            )}
            {!mobile && (
                <div className="flex h-16 items-center px-4 border-b border-slate-700">
                    <span className="font-bold text-white">{t("nav.banglaPark")}</span>
                    <span className="ml-2 rounded-full bg-red-600/20 px-2 py-0.5 text-[10px] font-semibold text-red-400 uppercase">{t("nav.adminPanel")}</span>
                </div>
            )}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                <Link
                    href="/"
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-slate-800 transition-all mb-1 border border-slate-700"
                >
                    <FaHouse size={17} />
                    {t("nav.backToSite")}
                </Link>
                <div className="border-t border-slate-700 my-1" />
                {navItems.map((item) => {
                    const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                active
                                    ? item.activeBg
                                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                            )}
                        >
                            <Icon size={17} className={active ? item.iconColor : "text-slate-400"} />
                            {item.label}
                            {active && <FaChevronRight size={13} className={cn("ml-auto opacity-80", item.iconColor)} />}
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
