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

            {/* Mobile App-Style Action Grid — Responsive grid (2 cols mobile, 3-4 cols PC) with full cover images and aligned text labels */}
            <div className="max-w-4xl">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
                    {quickAppItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`relative group ${item.cardBg} border rounded-md overflow-hidden flex flex-col justify-between items-center text-center transition-all duration-200 shadow-xs hover:shadow-md active:scale-95 h-36 sm:h-40 p-3`}
                        >
                            {item.badge && (
                                <span className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full shadow-md z-20">
                                    {item.badge}
                                </span>
                            )}

                            {item.image ? (
                                <>
                                    {/* Full cover image filling cardview */}
                                    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-white">
                                        <img
                                            src={item.image}
                                            alt={item.label}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        {/* Bottom gradient overlay to make text label stand out cleanly */}
                                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent z-10" />
                                    </div>
                                </>
                            ) : item.icon ? (
                                <div className="flex-1 flex items-center justify-center my-auto z-10">
                                    <div className="p-3 rounded-md bg-[#111c2a] text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
                                        <item.icon size={26} />
                                    </div>
                                </div>
                            ) : null}

                            {/* Text label slot — Aligned at the exact same bottom position across all cards */}
                            <div className={`w-full z-20 mt-auto pt-1 pb-0.5 text-center ${item.image ? 'text-white drop-shadow-md font-extrabold' : 'text-gray-950 font-bold'}`}>
                                <span className="text-sm tracking-tight block truncate">
                                    {item.label}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
