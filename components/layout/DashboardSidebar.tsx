"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    FaGauge, FaUser, FaBriefcase, FaWallet, FaBagShopping,
    FaUsers, FaBell, FaChevronRight, FaXmark, FaHouse, FaFileLines,
    FaRightFromBracket, FaAward, FaPlane, FaMoneyBills, FaCircleQuestion,
    FaTags, FaBoxOpen, FaCartShopping, FaStore, FaBullhorn, FaRectangleAd,
    FaChartPie, FaTag, FaTrophy, FaBuilding, FaChartBar
} from "react-icons/fa6";
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
        { href: "/dashboard", label: t("nav.overview"), icon: FaGauge, exact: true, activeBg: "bg-indigo-50 text-indigo-800 border-l-4 border-indigo-600 shadow-xs", iconColor: "text-indigo-600" },
        { href: "/dashboard/profile", label: t("nav.profile"), icon: FaUser, activeBg: "bg-blue-50 text-blue-800 border-l-4 border-blue-600 shadow-xs", iconColor: "text-blue-600" },
        { href: "/dashboard/referrals", label: t("nav.referrals"), icon: FaUsers, activeBg: "bg-cyan-50 text-cyan-800 border-l-4 border-cyan-600 shadow-xs", iconColor: "text-cyan-600" },
        { href: "#", label: t("nav.categories"), icon: FaTags, activeBg: "bg-sky-50 text-sky-800 border-l-4 border-sky-600 shadow-xs", iconColor: "text-sky-600" },
        { href: "/dashboard/orders", label: t("nav.orders"), icon: FaBagShopping, activeBg: "bg-purple-50 text-purple-800 border-l-4 border-purple-600 shadow-xs", iconColor: "text-purple-600" },
        { href: "/dashboard/quiz", label: t("nav.quiz"), icon: FaCircleQuestion, activeBg: "bg-purple-50 text-purple-800 border-l-4 border-purple-600 shadow-xs", iconColor: "text-purple-600" },
        { href: "/dashboard/daily-work", label: t("nav.dailyWork"), icon: FaBriefcase, activeBg: "bg-amber-50 text-amber-800 border-l-4 border-amber-600 shadow-xs", iconColor: "text-amber-600" },
        { href: "/shop", label: t("nav.buyProduct"), icon: FaCartShopping, activeBg: "bg-orange-50 text-orange-800 border-l-4 border-orange-600 shadow-xs", iconColor: "text-orange-600" },
        { href: "/dashboard/product-sell", label: t("nav.productSell"), icon: FaStore, activeBg: "bg-teal-50 text-teal-800 border-l-4 border-teal-600 shadow-xs", iconColor: "text-teal-600" },
        { href: "/dashboard/travel", label: t("nav.travel"), icon: FaPlane, activeBg: "bg-orange-50 text-orange-800 border-l-4 border-orange-600 shadow-xs", iconColor: "text-orange-600" },
        { href: "/dashboard/position", label: t("nav.position"), icon: FaAward, activeBg: "bg-teal-50 text-teal-800 border-l-4 border-teal-600 shadow-xs", iconColor: "text-teal-600" },
        { href: "#", label: t("nav.digitalMarketing"), icon: FaBullhorn, activeBg: "bg-indigo-50 text-indigo-800 border-l-4 border-indigo-600 shadow-xs", iconColor: "text-indigo-600" },
        { href: "#", label: t("nav.cpaMarketing"), icon: FaRectangleAd, activeBg: "bg-purple-50 text-purple-800 border-l-4 border-purple-600 shadow-xs", iconColor: "text-purple-600" },
        { href: "#", label: t("nav.affiliateMarketing"), icon: FaChartPie, activeBg: "bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600 shadow-xs", iconColor: "text-emerald-600" },
        { href: "#", label: t("nav.myOffers"), icon: FaTag, activeBg: "bg-pink-50 text-pink-800 border-l-4 border-pink-600 shadow-xs", iconColor: "text-pink-600" },
        { href: "#", label: t("nav.reward"), icon: FaTrophy, activeBg: "bg-fuchsia-50 text-fuchsia-800 border-l-4 border-fuchsia-600 shadow-xs", iconColor: "text-fuchsia-600" },
        { href: "#", label: t("nav.shareholder"), icon: FaBuilding, activeBg: "bg-violet-50 text-violet-800 border-l-4 border-violet-600 shadow-xs", iconColor: "text-violet-600" },
        { href: "/dashboard/withdraw", label: t("nav.withdraw"), icon: FaMoneyBills, activeBg: "bg-rose-50 text-rose-800 border-l-4 border-rose-600 shadow-xs", iconColor: "text-rose-600" },
        { href: "/dashboard/wallet", label: t("nav.wallet"), icon: FaWallet, activeBg: "bg-emerald-50 text-emerald-800 border-l-4 border-emerald-600 shadow-xs", iconColor: "text-emerald-600" },
        { href: "/dashboard/statement", label: t("nav.statement"), icon: FaFileLines, activeBg: "bg-violet-50 text-violet-800 border-l-4 border-violet-600 shadow-xs", iconColor: "text-violet-600" },
        { href: "#", label: t("nav.reports"), icon: FaChartBar, activeBg: "bg-fuchsia-50 text-fuchsia-800 border-l-4 border-fuchsia-600 shadow-xs", iconColor: "text-fuchsia-600" },
        { href: "/dashboard/notifications", label: t("nav.notifications"), icon: FaBell, activeBg: "bg-fuchsia-50 text-fuchsia-800 border-l-4 border-fuchsia-600 shadow-xs", iconColor: "text-fuchsia-600" },
    ];

    return (
        <aside className={cn("flex h-full flex-col bg-white", mobile && "border-r border-gray-100 pb-16")}>
            {mobile && (
                <div className="flex h-16 items-center justify-between px-4 border-b border-gray-100">
                    <span className="font-bold text-red-700">{t("nav.banglaPark")}</span>
                    <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700">
                        <FaXmark size={20} />
                    </button>
                </div>
            )}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                <Link
                    href="/"
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 transition-all mb-1 border border-red-100"
                >
                    <FaHouse size={17} />
                    {t("nav.backToSite")}
                </Link>
                <div className="border-t border-gray-100 my-1" />
                {navItems.map((item) => {
                    const isPlaceholder = item.href === "#";
                    const active = !isPlaceholder && (item.exact ? pathname === item.href : pathname.startsWith(item.href));
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            onClick={(e) => {
                                if (isPlaceholder) e.preventDefault();
                                else onClose?.();
                            }}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                                active
                                    ? item.activeBg
                                    : isPlaceholder
                                    ? "text-gray-400 hover:bg-gray-50 hover:text-gray-500 cursor-default"
                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                            )}
                        >
                            <Icon size={17} className={active ? item.iconColor : isPlaceholder ? "text-gray-300" : "text-gray-400 group-hover:text-gray-600"} />
                            {item.label}
                            {active && <FaChevronRight size={13} className={cn("ml-auto opacity-70", item.iconColor)} />}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t border-gray-100 p-3 space-y-3">
                <button
                    onClick={() => { handleLogout(); onClose?.(); }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-all cursor-pointer"
                >
                    <FaRightFromBracket size={17} />
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
