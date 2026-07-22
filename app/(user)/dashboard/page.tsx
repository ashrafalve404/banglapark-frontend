"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
    AlertCircle, Clock, Briefcase, HelpCircle, User, Wallet,
    ShoppingBag, Users, Award, ArrowDownToLine, Plane, ChevronRight
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { authApi } from "@/lib/api/auth";
import { useLocale } from "@/lib/i18n";
import { useEffect } from "react";

export default function DashboardOverview() {
    const { user: storeUser, setUser } = useAuthStore();
    const { t } = useLocale();

    // Always fetch fresh user profile — the auth store can be stale from login time
    const { data: freshUser } = useQuery({
        queryKey: ["user-me"],
        queryFn: () => authApi.me(),
        refetchOnWindowFocus: true,
        staleTime: 0,
    });

    // Sync fresh data back into the auth store whenever it changes
    useEffect(() => {
        if (freshUser) setUser(freshUser);
    }, [freshUser, setUser]);

    const user = freshUser ?? storeUser;

    const { data: activation } = useQuery({
        queryKey: ["my-activation"],
        queryFn: () => authApi.activation(),
        refetchOnWindowFocus: true,
        staleTime: 60_000,
    });

    const activeDays = activation?.daysLeft ?? 0;
    const isExpiringSoon = activeDays > 0 && activeDays <= 5;
    const isInactive = user?.status === "INACTIVE";

    // Quick App Grid Buttons (2 per row on all screen sizes with distinct background colors)
    const quickAppItems = [
        {
            href: "/dashboard/profile",
            label: t("nav.profile"),
            icon: User,
            cardBg: "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-100",
            iconBg: "bg-white/20 text-white",
        },
        {
            href: "/dashboard/daily-work",
            label: t("nav.dailyWork"),
            icon: Briefcase,
            cardBg: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-100",
            iconBg: "bg-white/20 text-white",
        },
        {
            href: "/dashboard/quiz",
            label: t("nav.quiz"),
            icon: HelpCircle,
            cardBg: "bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-purple-100",
            iconBg: "bg-white/20 text-white",
        },
        {
            href: "/dashboard/wallet",
            label: t("nav.wallet"),
            icon: Wallet,
            cardBg: "bg-gradient-to-br from-green-600 to-emerald-700 text-white shadow-green-100",
            iconBg: "bg-white/20 text-white",
        },
        {
            href: "/dashboard/orders",
            label: t("nav.orders"),
            icon: ShoppingBag,
            cardBg: "bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-orange-100",
            iconBg: "bg-white/20 text-white",
        },
        {
            href: "/dashboard/referrals",
            label: t("nav.referrals"),
            icon: Users,
            cardBg: "bg-gradient-to-br from-cyan-600 to-blue-600 text-white shadow-cyan-100",
            iconBg: "bg-white/20 text-white",
        },
        {
            href: "/dashboard/position",
            label: t("nav.position"), // Displays "Monthly Salary" / "মাসিক সেলারি"
            icon: Award,
            cardBg: "bg-gradient-to-br from-amber-500 to-yellow-600 text-white shadow-amber-100",
            iconBg: "bg-white/20 text-white",
            badge: "Hot",
        },
        {
            href: "/dashboard/travel",
            label: t("nav.travel"),
            icon: Plane,
            cardBg: "bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-indigo-100",
            iconBg: "bg-white/20 text-white",
            badge: "New",
        },
        {
            href: "/dashboard/withdraw",
            label: t("nav.withdraw"),
            icon: ArrowDownToLine,
            cardBg: "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-rose-100",
            iconBg: "bg-white/20 text-white",
        },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">{t("dashboard.heading")}</h1>

            {/* Account Status Alert */}
            {isInactive ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3.5">
                        <div className="rounded-xl bg-red-100 p-2.5 text-red-600 shrink-0">
                            <AlertCircle size={22} />
                        </div>
                        <div>
                            <h3 className="font-bold text-red-900 text-sm sm:text-base">{t("dashboard.alert.inactive.title")}</h3>
                            <p className="text-xs text-red-600 mt-0.5">Purchase products from shop to activate your account and start earning.</p>
                        </div>
                    </div>
                    <Link href="/shop" className="btn-primary bg-red-600 hover:bg-red-700 whitespace-nowrap text-xs font-bold py-2.5 px-5 rounded-xl">
                        {t("dashboard.alert.inactive.cta")}
                    </Link>
                </div>
            ) : isExpiringSoon ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3.5">
                        <div className="rounded-xl bg-amber-100 p-2.5 text-amber-600 shrink-0">
                            <Clock size={22} className="animate-pulse" />
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-900 text-sm sm:text-base">{t("dashboard.alert.expiring.title")}</h3>
                            <p className="text-xs text-amber-700 mt-0.5">{t("dashboard.alert.expiring.desc", { days: activeDays })}</p>
                        </div>
                    </div>
                    <Link href="/shop" className="btn-primary bg-amber-600 hover:bg-amber-700 whitespace-nowrap text-xs font-bold py-2.5 px-5 rounded-xl">
                        {t("dashboard.alert.expiring.cta")}
                    </Link>
                </div>
            ) : null}

            {/* Mobile App-Style Square Action Grid — Exactly 2 Columns on Mobile & PC */}
            <div>
                <div className="grid grid-cols-2 gap-4">
                    {quickAppItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`relative group ${item.cardBg} rounded-2xl p-5 md:p-6 flex flex-col items-center justify-center text-center transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-1 active:scale-95`}
                        >
                            {item.badge && (
                                <span className="absolute top-3 right-3 bg-white text-gray-900 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-xs">
                                    {item.badge}
                                </span>
                            )}
                            <div className={`p-3.5 rounded-2xl ${item.iconBg} backdrop-blur-sm mb-3 group-hover:scale-110 transition-transform duration-200`}>
                                <item.icon size={26} className="fill-current" />
                            </div>
                            <span className="text-sm md:text-base font-bold tracking-wide">
                                {item.label}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

