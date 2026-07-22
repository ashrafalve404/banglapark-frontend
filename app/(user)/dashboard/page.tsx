"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
    AlertCircle, Clock, Briefcase, HelpCircle, User, Wallet,
    ShoppingBag, Users, Award, ArrowDownToLine, Plane
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

    // 2-column grid buttons ordered: Quiz, Daily Work, Wallet, Orders, Referrals, Monthly Salary, Travel, Withdraw, Profile
    // Solid background colors, dark icons (#111c2a), rounded-md matching site cardviews
    const quickAppItems = [
        {
            href: "/dashboard/quiz",
            label: t("nav.quiz"),
            icon: HelpCircle,
            cardBg: "bg-purple-100 text-purple-900 border-purple-200 hover:bg-purple-200",
        },
        {
            href: "/dashboard/daily-work",
            label: t("nav.dailyWork"),
            icon: Briefcase,
            cardBg: "bg-emerald-100 text-emerald-900 border-emerald-200 hover:bg-emerald-200",
        },
        {
            href: "/dashboard/wallet",
            label: t("nav.wallet"),
            icon: Wallet,
            cardBg: "bg-green-100 text-green-900 border-green-200 hover:bg-green-200",
        },
        {
            href: "/dashboard/orders",
            label: t("nav.orders"),
            icon: ShoppingBag,
            cardBg: "bg-amber-100 text-amber-900 border-amber-200 hover:bg-amber-200",
        },
        {
            href: "/dashboard/referrals",
            label: t("nav.referrals"),
            icon: Users,
            cardBg: "bg-cyan-100 text-cyan-900 border-cyan-200 hover:bg-cyan-200",
        },
        {
            href: "/dashboard/position",
            label: t("nav.position"), // Displays "Monthly Salary" / "মাসিক সেলারি"
            icon: Award,
            cardBg: "bg-yellow-100 text-yellow-900 border-yellow-200 hover:bg-yellow-200",
            badge: "Hot",
        },
        {
            href: "/dashboard/travel",
            label: t("nav.travel"),
            icon: Plane,
            cardBg: "bg-indigo-100 text-indigo-900 border-indigo-200 hover:bg-indigo-200",
            badge: "New",
        },
        {
            href: "/dashboard/withdraw",
            label: t("nav.withdraw"),
            icon: ArrowDownToLine,
            cardBg: "bg-rose-100 text-rose-900 border-rose-200 hover:bg-rose-200",
        },
        {
            href: "/dashboard/profile",
            label: t("nav.profile"),
            icon: User,
            cardBg: "bg-blue-100 text-blue-900 border-blue-200 hover:bg-blue-200",
        },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">{t("dashboard.heading")}</h1>

            {/* Account Status Alert */}
            {isInactive ? (
                <div className="rounded-md border border-red-200 bg-red-50 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3.5">
                        <div className="rounded-md bg-red-100 p-2.5 text-red-600 shrink-0">
                            <AlertCircle size={22} />
                        </div>
                        <div>
                            <h3 className="font-bold text-red-900 text-sm sm:text-base">{t("dashboard.alert.inactive.title")}</h3>
                            <p className="text-xs text-red-600 mt-0.5">Purchase products from shop to activate your account and start earning.</p>
                        </div>
                    </div>
                    <Link href="/shop" className="btn-primary bg-red-600 hover:bg-red-700 whitespace-nowrap text-xs font-bold py-2.5 px-5 rounded-md">
                        {t("dashboard.alert.inactive.cta")}
                    </Link>
                </div>
            ) : isExpiringSoon ? (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3.5">
                        <div className="rounded-md bg-amber-100 p-2.5 text-amber-600 shrink-0">
                            <Clock size={22} className="animate-pulse" />
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-900 text-sm sm:text-base">{t("dashboard.alert.expiring.title")}</h3>
                            <p className="text-xs text-amber-700 mt-0.5">{t("dashboard.alert.expiring.desc", { days: activeDays })}</p>
                        </div>
                    </div>
                    <Link href="/shop" className="btn-primary bg-amber-600 hover:bg-amber-700 whitespace-nowrap text-xs font-bold py-2.5 px-5 rounded-md">
                        {t("dashboard.alert.expiring.cta")}
                    </Link>
                </div>
            ) : null}

            {/* Mobile App-Style Square Action Grid — Exactly 2 Columns with standard site rounded-md corners & dark footer-style icons */}
            <div>
                <div className="grid grid-cols-2 gap-4">
                    {quickAppItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`relative group ${item.cardBg} border rounded-md p-5 flex flex-col items-center justify-center text-center transition-all duration-200 shadow-xs hover:shadow-sm active:scale-95`}
                        >
                            {item.badge && (
                                <span className="absolute top-2.5 right-2.5 bg-red-600 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-xs">
                                    {item.badge}
                                </span>
                            )}
                            <div className="p-3 rounded-md bg-[#111c2a] text-white shadow-xs mb-3 group-hover:scale-105 transition-transform duration-200">
                                <item.icon size={24} />
                            </div>
                            <span className="text-sm font-bold tracking-tight">
                                {item.label}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
