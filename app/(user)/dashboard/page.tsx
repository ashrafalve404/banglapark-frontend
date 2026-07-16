"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
    Users, ShieldCheck, AlertCircle, Clock, Wallet, ArrowUpRight,
    ImageIcon, Download, HelpCircle, FolderOpen
} from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { walletApi } from "@/lib/api/wallet";
import { referralApi } from "@/lib/api/categories";
import { bannersApi, type Banner } from "@/lib/api/banners";
import { quizApi, type QuizCategoryItem } from "@/lib/api/quiz";
import { authApi } from "@/lib/api/auth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";
import { useEffect } from "react";

export default function DashboardOverview() {
    const { user: storeUser, setUser } = useAuthStore();
    const { t, locale } = useLocale();

    // Always fetch fresh user profile — the auth store can be stale from login time
    const { data: freshUser } = useQuery({
        queryKey: ["user-me"],
        queryFn: () => authApi.me(),
        // Refetch on window focus so status updates after admin action are reflected immediately
        refetchOnWindowFocus: true,
        staleTime: 0,
    });

    // Sync fresh data back into the auth store whenever it changes
    useEffect(() => {
        if (freshUser) setUser(freshUser);
    }, [freshUser, setUser]);

    // Use fresh API data when available, fall back to store
    const user = freshUser ?? storeUser;

    const { data: wallet, isLoading: walletLoading } = useQuery({
        queryKey: ["wallet-balance"],
        queryFn: () => walletApi.balance(),
        refetchOnWindowFocus: true,
    });

    const { data: referralStats, isLoading: refLoading } = useQuery({
        queryKey: ["referral-stats"],
        queryFn: () => referralApi.teamStats(),
        refetchOnWindowFocus: true,
    });

    const { data: dailyWork } = useQuery<Banner | null>({
        queryKey: ["daily-work"],
        queryFn: () => bannersApi.findDailyWork(),
    });

    const { data: quizCategories = [] } = useQuery<QuizCategoryItem[]>({
        queryKey: ["quiz-categories"],
        queryFn: () => quizApi.getCategories(),
    });

    const { data: activation } = useQuery({
        queryKey: ["my-activation"],
        queryFn: () => authApi.activation(),
        refetchOnWindowFocus: true,
        staleTime: 60_000,
    });

    const activeDays = activation?.daysLeft ?? 0;
    const activeUntilDate = activation?.activeUntil ?? user?.activeUntil;
    const isExpiringSoon = activeDays > 0 && activeDays <= 5;
    const isInactive = user?.status === "INACTIVE";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{t("dashboard.heading")}</h1>
                <p className="text-sm text-gray-500">{t("dashboard.subheading")}</p>
            </div>

            {isInactive ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-red-100 p-2 text-red-600">
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-red-800 text-sm sm:text-base">{t("dashboard.alert.inactive.title")}</h3>
                        </div>
                    </div>
                    <Link href="/shop" className="btn-primary bg-red-600 hover:bg-red-700 whitespace-nowrap text-xs py-2 px-4">
                        {t("dashboard.alert.inactive.cta")}
                    </Link>
                </div>
            ) : isExpiringSoon ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="rounded-full bg-amber-100 p-2 text-amber-600">
                            <Clock size={20} className="animate-pulse" />
                        </div>
                        <div>
                            <h3 className="font-bold text-amber-800 text-sm sm:text-base">{t("dashboard.alert.expiring.title")}</h3>
                            <p className="text-xs sm:text-sm text-amber-600">{t("dashboard.alert.expiring.desc", { days: activeDays })}</p>
                        </div>
                    </div>
                    <Link href="/shop" className="btn-primary bg-amber-600 hover:bg-amber-700 whitespace-nowrap text-xs py-2 px-4">
                        {t("dashboard.alert.expiring.cta")}
                    </Link>
                </div>
            ) : null}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="card p-5 flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">{t("dashboard.card.walletBalance")}</span>
                        <span className="text-2xl font-bold text-green-800">
                            {walletLoading ? "..." : formatCurrency(wallet?.balance ?? 0, locale)}
                        </span>
                    </div>
                    <div className="rounded-lg bg-green-50 p-2.5 text-green-800">
                        <Wallet size={20} />
                    </div>
                </div>

                <div className="card p-5 flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">{t("dashboard.card.pendingWithdrawal")}</span>
                        <span className="text-2xl font-bold text-gray-800">
                            {walletLoading ? "..." : formatCurrency(wallet?.pendingWithdrawal ?? 0, locale)}
                        </span>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2.5 text-gray-800">
                        <ArrowUpRight size={20} />
                    </div>
                </div>

                <div className="card p-5 flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">{t("dashboard.card.activeTeam")}</span>
                        <span className="text-2xl font-bold text-green-800">
                            {refLoading ? "..." : referralStats?.activeTeam ?? 0}{t("dashboard.card.activeTeamUnit")}
                        </span>
                    </div>
                    <div className="rounded-lg bg-green-50 p-2.5 text-green-800">
                        <Users size={20} />
                    </div>
                </div>

                <div className="card p-5 flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">{t("dashboard.card.activationEnd")}</span>
                        <span className="text-sm font-semibold text-gray-800 block">
                            {activeUntilDate ? formatDate(activeUntilDate, locale) : t("dashboard.card.activationEndNone")}
                        </span>
                        {!isInactive && (
                            <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full inline-block">
                                {t("dashboard.card.daysRemaining")} {activeDays} {t("dashboard.card.daysUnit")}
                            </span>
                        )}
                    </div>
                    <div className="rounded-lg bg-green-50 p-2.5 text-green-800">
                        <ShieldCheck size={20} />
                    </div>
                </div>
            </div>

            <div className="card p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">{t("dashboard.quickLinks.heading")}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { href: "/dashboard/wallet", title: t("dashboard.quickLinks.wallet"), bg: "bg-green-50", text: "text-green-800" },
                        { href: "/dashboard/withdraw", title: t("dashboard.quickLinks.withdraw"), bg: "bg-blue-50", text: "text-blue-800" },
                        { href: "/dashboard/referrals", title: t("dashboard.quickLinks.referrals"), bg: "bg-amber-50", text: "text-amber-800" },
                        { href: "/dashboard/orders", title: t("dashboard.quickLinks.orders"), bg: "bg-purple-50", text: "text-purple-800" },
                    ].map((lnk) => (
                        <Link key={lnk.href} href={lnk.href} className={`rounded-xl p-4 text-center ${lnk.bg} hover:-translate-y-0.5 transition-transform flex flex-col justify-center items-center`}>
                            <span className={`text-sm font-bold ${lnk.text}`}>{lnk.title}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Daily Work Section */}
            {dailyWork && (
                <div className="card p-5 bg-white">
                    <div className="flex items-center gap-2 mb-3">
                        <ImageIcon size={18} className="text-green-700" />
                        <h3 className="text-sm font-bold text-gray-900">{t("nav.dailyWork")}</h3>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <div className="w-full sm:w-48 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200">
                            <img src={dailyWork.imageUrl} alt="Daily Work" className="w-full h-auto object-contain" />
                        </div>
                        <div className="flex-1 space-y-3">
                            <p className="text-xs text-gray-500">{t("dashboard.dailyWork.description")}</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        const link = document.createElement("a");
                                        link.href = dailyWork.imageUrl;
                                        link.download = "daily-work.jpg";
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                    }}
                                    className="btn-primary text-xs flex items-center gap-1.5"
                                >
                                    <Download size={14} /> {t("dashboard.dailyWork.download")}
                                </button>
                                <Link href="/dashboard/daily-work" className="btn-outline-primary text-xs">
                                    {t("dashboard.dailyWork.viewDetail")}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Quiz Categories Section */}
            {quizCategories.length > 0 && (
                <div className="card p-5 bg-white">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <FolderOpen size={18} className="text-green-700" />
                            <h3 className="text-sm font-bold text-gray-900">{t("nav.quiz")}</h3>
                        </div>
                        <Link href="/dashboard/quiz" className="text-xs text-green-700 font-semibold hover:underline">{t("dashboard.quiz.viewAll")}</Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {quizCategories.map((cat) => (
                            <Link key={cat.id} href={`/dashboard/quiz?category=${cat.id}`} className="group rounded-xl overflow-hidden border border-gray-200 bg-white hover:-translate-y-0.5 transition-transform">
                                <div className="aspect-[4/3] bg-gray-100">
                                    <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                </div>
                                <div className="p-2.5 text-center">
                                    <p className="text-xs font-bold text-gray-800 truncate">{cat.name}</p>
                                    <p className="text-[10px] text-gray-400">{cat._count?.questions ?? 0} questions</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
