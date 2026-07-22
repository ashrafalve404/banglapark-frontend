"use client";

import { useQuery } from "@tanstack/react-query";
import { travelApi } from "@/lib/api/travel";
import {
    Plane, MapPin, Users, CheckCircle2, XCircle,
    Lock, Star, Trophy, TrendingUp, Loader2, Calendar
} from "lucide-react";

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const TIER_META = [
    {
        tierNumber: 1,
        label: "Bronze Traveler",
        icon: "✈️",
        minMembers: 500,
        gradient: "from-amber-500 to-orange-500",
        softBg: "bg-amber-50",
        border: "border-amber-200",
        badgeBg: "bg-amber-100 text-amber-800",
        progressColor: "bg-amber-500",
    },
    {
        tierNumber: 2,
        label: "Silver Traveler",
        icon: "🌏",
        minMembers: 5000,
        gradient: "from-slate-500 to-gray-600",
        softBg: "bg-slate-50",
        border: "border-slate-200",
        badgeBg: "bg-slate-100 text-slate-700",
        progressColor: "bg-slate-500",
    },
    {
        tierNumber: 3,
        label: "Gold Traveler",
        icon: "🕌",
        minMembers: 20000,
        gradient: "from-yellow-500 to-amber-600",
        softBg: "bg-yellow-50",
        border: "border-yellow-200",
        badgeBg: "bg-yellow-100 text-yellow-800",
        progressColor: "bg-yellow-500",
    },
];

export default function UserTravelPage() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

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
                    <Loader2 size={36} className="animate-spin text-indigo-500" />
                    <p className="text-sm text-slate-500">Loading your travel eligibility...</p>
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
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 shadow-lg shadow-indigo-200">
                    <Plane size={22} className="text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Travel Rewards</h1>
                    <p className="text-sm text-gray-500">Monthly eligibility based on your new direct referrals</p>
                </div>
            </div>

            {/* Month badge */}
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2.5 rounded-xl w-fit">
                <Calendar size={15} className="text-indigo-600" />
                <span className="text-sm font-semibold text-indigo-700">
                    {MONTHS[month - 1]} {year} — Current Month
                </span>
            </div>

            {/* Status Hero Card */}
            <div className={`rounded-2xl p-6 text-white shadow-xl relative overflow-hidden ${isEligible
                    ? "bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700"
                    : "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900"
                }`}>
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-48 h-48 opacity-10">
                    <Plane size={192} className="text-white -rotate-12 translate-x-8 -translate-y-8" />
                </div>

                <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium opacity-80 mb-1">This Month's Status</p>
                            <h2 className="text-3xl font-extrabold">
                                {isEligible ? "🎉 Eligible!" : "Not Eligible Yet"}
                            </h2>
                            {unlockedTier && (
                                <p className="text-sm mt-1 opacity-90">
                                    {TIER_META.find((t) => t.tierNumber === unlockedTier.tierNumber)?.label}
                                </p>
                            )}
                        </div>
                        <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${isEligible ? "bg-white/20 text-white" : "bg-white/10 text-white/70"}`}>
                            {count} / {nextTier?.minMembers ?? "MAX"} members
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <Users size={15} className="opacity-80" />
                                <span className="text-xs opacity-70 font-medium">New Active Referrals</span>
                            </div>
                            <p className="text-2xl font-extrabold">{count.toLocaleString()}</p>
                            <p className="text-xs opacity-60 mt-0.5">Direct referrals activated this month</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-1">
                                <MapPin size={15} className="opacity-80" />
                                <span className="text-xs opacity-70 font-medium">Destinations Unlocked</span>
                            </div>
                            <p className="text-2xl font-extrabold">
                                {unlockedTier?.destinations.length ?? 0}
                            </p>
                            <p className="text-xs opacity-60 mt-0.5">
                                {isEligible ? "Places available for you!" : "Keep going to unlock!"}
                            </p>
                        </div>
                    </div>

                    {/* Progress bar to next tier */}
                    {nextTier && (
                        <div className="mt-4">
                            <div className="flex justify-between text-xs opacity-70 mb-1.5">
                                <span>Progress to next tier</span>
                                <span>{progressPct}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-white/20">
                                <div
                                    className="h-2 rounded-full bg-white transition-all duration-500"
                                    style={{ width: `${progressPct}%` }}
                                />
                            </div>
                            <p className="text-xs opacity-60 mt-1.5">
                                Need {(nextTier.minMembers - count).toLocaleString()} more new active members for next tier
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Unlocked destinations */}
            {isEligible && unlockedTier && unlockedTier.destinations.length > 0 && (
                <div className="card p-5 border border-green-200 bg-green-50/50">
                    <div className="flex items-center gap-2 mb-4">
                        <Trophy size={18} className="text-green-700" />
                        <h3 className="font-bold text-green-800 text-base">Your Unlocked Destinations</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {unlockedTier.destinations.map((dest, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2 bg-white border border-green-200 rounded-xl px-3 py-3 shadow-sm"
                            >
                                <MapPin size={15} className="text-green-600 shrink-0" />
                                <span className="text-sm font-semibold text-green-800">{dest}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* All Tiers breakdown */}
            <div>
                <h3 className="text-base font-bold text-gray-800 mb-3">All Travel Tiers</h3>
                <div className="grid gap-4 md:grid-cols-3">
                    {TIER_META.map((meta) => {
                        const tierData = allTiers.find((t) => t.tierNumber === meta.tierNumber);
                        const achieved = tierData?.achieved ?? false;
                        const dests = tierData?.destinations ?? [];
                        const noDestSet = dests.length === 0;

                        return (
                            <div
                                key={meta.tierNumber}
                                className={`rounded-2xl border ${meta.border} overflow-hidden shadow-sm transition-all ${achieved ? "ring-2 ring-green-400 ring-offset-1" : ""}`}
                            >
                                {/* Header */}
                                <div className={`bg-gradient-to-r ${meta.gradient} p-4 text-white relative`}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <span className="text-2xl">{meta.icon}</span>
                                            <p className="text-sm font-bold mt-1">{meta.label}</p>
                                            <div className="flex items-center gap-1 mt-0.5">
                                                <Users size={12} className="opacity-80" />
                                                <span className="text-xs opacity-80">
                                                    {meta.minMembers.toLocaleString()}+ new members
                                                </span>
                                            </div>
                                        </div>
                                        {achieved ? (
                                            <div className="bg-white/20 rounded-full p-1.5">
                                                <CheckCircle2 size={18} className="text-white" />
                                            </div>
                                        ) : (
                                            <div className="bg-white/10 rounded-full p-1.5">
                                                <Lock size={18} className="text-white/60" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Destinations */}
                                <div className={`p-4 ${meta.softBg}`}>
                                    {noDestSet ? (
                                        <div className="flex items-center gap-2 text-sm text-slate-400 italic">
                                            <XCircle size={14} />
                                            <span>No destinations set this month</span>
                                        </div>
                                    ) : (
                                        <ul className="space-y-1.5">
                                            {dests.map((d, i) => (
                                                <li
                                                    key={i}
                                                    className={`flex items-center gap-2 text-sm font-medium ${achieved ? "text-slate-700" : "text-slate-400"}`}
                                                >
                                                    <MapPin size={13} className={achieved ? "text-green-600" : "text-slate-300"} />
                                                    {d}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {achieved && (
                                        <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 border border-green-200 px-3 py-1.5 rounded-full w-fit">
                                            <Star size={11} fill="currentColor" />
                                            Achieved this month!
                                        </div>
                                    )}
                                    {!achieved && (
                                        <div className="mt-2 text-xs text-slate-400">
                                            Need {Math.max(0, meta.minMembers - count).toLocaleString()} more referrals
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* How it works */}
            <div className="card p-5 border border-blue-100 bg-blue-50/40">
                <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={16} className="text-blue-600" />
                    <h3 className="font-bold text-blue-800 text-sm">How Travel Eligibility Works</h3>
                </div>
                <ul className="space-y-2 text-sm text-blue-700">
                    <li className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-[10px] font-bold">1</span>
                        Eligibility is calculated every month based on your <strong>direct referrals</strong> who activated their account for the first time this month.
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-[10px] font-bold">2</span>
                        Achieve <strong>500</strong> new active referrals to unlock Tier 1 destinations.
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-[10px] font-bold">3</span>
                        Achieve <strong>5,000</strong> for international Tier 2 rewards, and <strong>20,000</strong> for the prestigious Umrah/Hajj package (Tier 3).
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-[10px] font-bold">4</span>
                        Destinations are set by admin each month. Check back regularly!
                    </li>
                </ul>
            </div>
        </div>
    );
}
