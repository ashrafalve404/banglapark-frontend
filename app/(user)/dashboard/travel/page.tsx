"use client";

import { useQuery } from "@tanstack/react-query";
import { travelApi } from "@/lib/api/travel";
import {
    Plane, MapPin, Users, CheckCircle2,
    Lock, Star, Trophy, Loader2, Calendar, Globe, Compass, ArrowUpRight
} from "lucide-react";
import { useLocale } from "@/lib/i18n";

const MONTHS_EN = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const MONTHS_BN = [
    "জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন",
    "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর",
];

const TIER_META = [
    {
        tierNumber: 1,
        labelKey: "travel.bronzeTraveler",
        IconComponent: Compass,
        minMembers: 500,
        badgeText: "Bronze Tier",
        headerGradient: "from-amber-800 via-amber-900 to-amber-950",
        badgeBg: "bg-amber-100 text-amber-900 border-amber-300",
        cardBorder: "border-amber-200/80 hover:border-amber-400",
        progressColor: "bg-amber-600",
    },
    {
        tierNumber: 2,
        labelKey: "travel.silverTraveler",
        IconComponent: Globe,
        minMembers: 5000,
        badgeText: "Silver Tier",
        headerGradient: "from-slate-700 via-slate-800 to-slate-900",
        badgeBg: "bg-slate-100 text-slate-900 border-slate-300",
        cardBorder: "border-slate-200/80 hover:border-slate-400",
        progressColor: "bg-slate-700",
    },
    {
        tierNumber: 3,
        labelKey: "travel.goldTraveler",
        IconComponent: Plane,
        minMembers: 20000,
        badgeText: "Gold Tier",
        headerGradient: "from-amber-600 via-yellow-600 to-amber-700",
        badgeBg: "bg-yellow-100 text-yellow-900 border-yellow-300",
        cardBorder: "border-yellow-300/80 hover:border-yellow-400",
        progressColor: "bg-amber-500",
    },
];

export default function UserTravelPage() {
    const { t, locale } = useLocale();
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const monthName = locale === "bn" ? MONTHS_BN[month - 1] : MONTHS_EN[month - 1];

    const { data, isLoading } = useQuery({
        queryKey: ["travel-eligibility"],
        queryFn: () => travelApi.getEligibility(),
        staleTime: 60_000,
        refetchOnWindowFocus: true,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 size={36} className="animate-spin text-red-700" />
                    <p className="text-sm text-slate-500">{t("common.loading")}</p>
                </div>
            </div>
        );
    }

    const eligibility = data;
    const count = eligibility?.monthlyNewActiveCount ?? 0;
    const isEligible = eligibility?.isEligible ?? false;
    const unlockedTier = eligibility?.unlockedTier;
    const allTiers = eligibility?.allTiers ?? TIER_META.map((t) => ({
        tierNumber: t.tierNumber,
        minMembers: t.minMembers,
        destinations: [],
        achieved: false,
    }));

    // Progress to next tier
    const nextTier = allTiers.find((t) => !t.achieved);
    const prevTierCount = nextTier
        ? (allTiers.find((t) => t.tierNumber === nextTier.tierNumber - 1)?.minMembers ?? 0)
        : 0;
    const progressPct = nextTier
        ? Math.min(100, Math.round(((count - prevTierCount) / (nextTier.minMembers - prevTierCount)) * 100))
        : 100;

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-slate-900 text-white shadow-md">
                        <Plane size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{t("travel.title")}</h1>
                        <p className="text-sm text-slate-500">{t("travel.subtitle")}</p>
                    </div>
                </div>

                {/* Month badge */}
                <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl w-fit">
                    <Calendar size={16} className="text-red-700" />
                    <span className="text-xs font-bold text-slate-800">
                        {monthName} {year} — {t("travel.currentMonth")}
                    </span>
                </div>
            </div>

            {/* Status Hero Card */}
            <div className={`rounded-2xl p-6 text-white shadow-lg relative overflow-hidden transition-all ${
                isEligible
                    ? "bg-gradient-to-br from-emerald-700 via-emerald-800 to-teal-900 border border-emerald-600"
                    : "bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700"
            }`}>

                <div className="relative z-10 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider opacity-75 block mb-1">
                                {t("travel.thisMonthStatus")}
                            </span>
                            <h2 className="text-3xl font-black flex items-center gap-2 tracking-tight">
                                {isEligible ? (
                                    <>
                                        <Trophy size={32} className="text-amber-300 drop-shadow-md" /> {t("travel.eligible")}
                                    </>
                                ) : (
                                    t("travel.notEligible")
                                )}
                            </h2>
                            {unlockedTier && (
                                <p className="text-xs font-bold mt-1 text-emerald-200 bg-white/10 px-3 py-1 rounded-full w-fit">
                                    {t(TIER_META.find((t) => t.tierNumber === unlockedTier.tierNumber)?.labelKey ?? "")}
                                </p>
                            )}
                        </div>

                        <div className="bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2 rounded-xl text-xs font-bold self-start">
                            {count.toLocaleString()} / {nextTier?.minMembers.toLocaleString() ?? "MAX"} {t("travel.members")}
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md border border-white/10">
                            <div className="flex items-center gap-2 mb-1">
                                <Users size={16} className="opacity-80 text-white" />
                                <span className="text-xs opacity-75 font-semibold">{t("travel.newActiveReferrals")}</span>
                            </div>
                            <p className="text-2xl font-black">{count.toLocaleString()}</p>
                            <p className="text-[11px] opacity-65 mt-0.5">{t("travel.newActiveReferralsSub")}</p>
                        </div>

                        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-md border border-white/10">
                            <div className="flex items-center gap-2 mb-1">
                                <MapPin size={16} className="opacity-80 text-white" />
                                <span className="text-xs opacity-75 font-semibold">{t("travel.destinationsUnlocked")}</span>
                            </div>
                            <p className="text-2xl font-black">
                                {unlockedTier?.destinations.length ?? 0}
                            </p>
                            <p className="text-[11px] opacity-65 mt-0.5">
                                {isEligible ? t("travel.placesAvailable") : t("travel.keepGoing")}
                            </p>
                        </div>
                    </div>

                    {/* Progress Bar to next tier */}
                    {nextTier && (
                        <div className="space-y-2 pt-2 border-t border-white/10">
                            <div className="flex justify-between text-xs font-bold opacity-85">
                                <span>{t("travel.progressToNext")}</span>
                                <span>{progressPct}%</span>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-white/20 overflow-hidden">
                                <div
                                    className="h-2.5 rounded-full bg-white transition-all duration-500 shadow-sm"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                            <p className="text-xs opacity-75 font-medium">
                                {t("travel.needMore", { count: Math.max(0, nextTier.minMembers - count).toLocaleString() })}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Unlocked destinations highlight */}
            {isEligible && unlockedTier && unlockedTier.destinations.length > 0 && (
                <div className="card p-6 border border-emerald-200 bg-emerald-50/60 rounded-2xl shadow-xs space-y-4">
                    <div className="flex items-center gap-2">
                        <Trophy size={20} className="text-emerald-700" />
                        <h3 className="font-bold text-emerald-900 text-base">{t("travel.yourUnlockedDestinations")}</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {unlockedTier.destinations.map((dest, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2.5 bg-white border border-emerald-200/80 rounded-xl p-3.5 shadow-xs font-bold text-slate-800 text-xs sm:text-sm"
                            >
                                <MapPin size={16} className="text-emerald-600 shrink-0" />
                                <span>{dest}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* All Travel Tiers Breakdown */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900">{t("travel.allTravelTiers")}</h3>
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                    {TIER_META.map((meta) => {
                        const tierData = allTiers.find((t) => t.tierNumber === meta.tierNumber);
                        const achieved = tierData?.achieved ?? false;
                        const dests = tierData?.destinations ?? [];
                        const noDestSet = dests.length === 0;
                        const TierIcon = meta.IconComponent;
                        const neededMore = Math.max(0, meta.minMembers - count);

                        return (
                            <div
                                key={meta.tierNumber}
                                className={`rounded-2xl border ${meta.cardBorder} overflow-hidden bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                                    achieved ? "ring-2 ring-emerald-500 ring-offset-2" : ""
                                }`}
                            >
                                {/* Header */}
                                <div className={`bg-gradient-to-r ${meta.headerGradient} p-5 text-white relative`}>
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-2">
                                            <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-sm w-fit border border-white/20">
                                                <TierIcon size={22} className="text-white" />
                                            </div>
                                            <div>
                                                <h4 className="text-base font-bold text-white leading-tight">{t(meta.labelKey)}</h4>
                                                <div className="flex items-center gap-1.5 mt-1 text-xs font-medium text-white/80">
                                                    <Users size={13} />
                                                    <span>
                                                        {t("travel.newMembersCount", { count: meta.minMembers.toLocaleString() })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {achieved ? (
                                            <div className="bg-emerald-500/30 border border-emerald-300/40 rounded-full p-2 text-white">
                                                <CheckCircle2 size={20} />
                                            </div>
                                        ) : (
                                            <div className="bg-white/10 rounded-full p-2 text-white/50 border border-white/10">
                                                <Lock size={18} />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-5 bg-white space-y-4 flex-1 flex flex-col justify-between">
                                    {/* Destinations Section */}
                                    <div className="space-y-2">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                                            {locale === "bn" ? "ভ্রমণ গন্তব্যসমূহ" : "Destinations"}
                                        </span>

                                        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3.5">
                                            {noDestSet ? (
                                                <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                                    <MapPin size={14} className="text-slate-400 shrink-0" />
                                                    <span>{t("travel.noDestinationsSet")}</span>
                                                </div>
                                            ) : (
                                                <ul className="space-y-2">
                                                    {dests.map((d, i) => (
                                                        <li
                                                            key={i}
                                                            className={`flex items-center gap-2 text-xs sm:text-sm font-semibold ${
                                                                achieved ? "text-emerald-900 font-bold" : "text-slate-800"
                                                            }`}
                                                        >
                                                            <MapPin size={14} className={achieved ? "text-emerald-600" : "text-slate-400"} />
                                                            <span>{d}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status / Requirement Badge */}
                                    <div className="pt-2 border-t border-slate-100">
                                        {achieved ? (
                                            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-center">
                                                <Star size={13} className="fill-emerald-600 text-emerald-600" />
                                                <span>{t("travel.achievedThisMonth")}</span>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center space-y-1">
                                                <span className="text-xs font-bold text-slate-700 block">
                                                    {t("travel.needMoreReferrals", { count: neededMore.toLocaleString() })}
                                                </span>
                                                <span className="text-[10px] text-slate-400 block font-medium">
                                                    {locale === "bn"
                                                        ? `চলতি মাসে ${count.toLocaleString()} / ${meta.minMembers.toLocaleString()} মেম্বার অর্জিত`
                                                        : `${count.toLocaleString()} / ${meta.minMembers.toLocaleString()} members this month`}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
