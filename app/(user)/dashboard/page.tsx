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

    // 2-column mobile / responsive PC grid buttons ordered: Quiz, Daily Work, Travel, Wallet, Orders, Referrals, Monthly Salary, Withdraw, Profile
    // Quiz, Daily Work & Travel use custom badge images without icon box background.
    const quickAppItems: Array<{
        href: string;
        label: string;
        icon?: any;
        image?: string;
        cardBg: string;
        badge?: string;
    }> = [
        {
            href: "/dashboard/quiz",
            label: t("nav.quiz"),
            image: "/images/quiz.png",
            cardBg: "bg-purple-200 text-purple-950 border-purple-300 hover:bg-purple-300",
        },
        {
            href: "/dashboard/daily-work",
            label: t("nav.dailyWork"),
            image: "/images/dailywork.png",
            cardBg: "bg-emerald-200 text-emerald-950 border-emerald-300 hover:bg-emerald-300",
        },
        {
            href: "/dashboard/travel",
            label: t("nav.travel"),
            image: "/images/trveling.png",
            cardBg: "bg-indigo-200 text-indigo-950 border-indigo-300 hover:bg-indigo-300",
            badge: "New",
        },
        {
            href: "/dashboard/wallet",
            label: t("nav.wallet"),
            icon: Wallet,
            cardBg: "bg-green-200 text-green-950 border-green-300 hover:bg-green-300",
        },
        {
            href: "/dashboard/orders",
            label: t("nav.orders"),
            icon: ShoppingBag,
            cardBg: "bg-amber-200 text-amber-950 border-amber-300 hover:bg-amber-300",
        },
        {
            href: "/dashboard/referrals",
            label: t("nav.referrals"),
            icon: Users,
            cardBg: "bg-teal-200 text-teal-950 border-teal-300 hover:bg-teal-300",
        },
        {
            href: "/dashboard/position",
            label: t("nav.position"), // Displays "Monthly Salary" / "মাসিক সেলারি"
            icon: Award,
            cardBg: "bg-yellow-200 text-yellow-950 border-yellow-300 hover:bg-yellow-300",
            badge: "Hot",
        },
        {
            href: "/dashboard/withdraw",
            label: t("nav.withdraw"),
            icon: ArrowDownToLine,
            cardBg: "bg-rose-200 text-rose-950 border-rose-300 hover:bg-rose-300",
        },
        {
            href: "/dashboard/profile",
            label: t("nav.profile"),
            icon: User,
            cardBg: "bg-blue-200 text-blue-950 border-blue-300 hover:bg-blue-300",
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

            {/* Action Grid — 1:1 Aspect Square Buttons matching image dimensions with full cover & labels under the card */}
            <div className="max-w-4xl">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
                    {quickAppItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="group flex flex-col items-center text-center focus:outline-none"
                        >
                            {/* Card Box — 1:1 Aspect Square */}
                            <div
                                className={`relative w-full aspect-square ${item.cardBg} border rounded-md p-0 flex items-center justify-center transition-all duration-200 shadow-xs group-hover:shadow-md active:scale-95 overflow-hidden`}
                            >
                                {item.badge && (
                                    <span className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shadow-md z-10">
                                        {item.badge}
                                    </span>
                                )}

                                {item.image ? (
                                    <img
                                        src={item.image}
                                        alt={item.label}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    />
                                ) : item.icon ? (
                                    <div className="p-3.5 rounded-md bg-[#111c2a] text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
                                        <item.icon size={26} />
                                    </div>
                                ) : null}
                            </div>

                            {/* Text Label — Placed cleanly under the card box */}
                            <span className="mt-2 text-xs sm:text-sm font-bold text-gray-900 tracking-tight block truncate w-full group-hover:text-indigo-600 transition-colors">
                                {item.label}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
