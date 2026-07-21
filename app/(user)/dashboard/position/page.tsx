"use client";

import { useQuery } from "@tanstack/react-query";
import { positionApi, type PositionDef } from "@/lib/api/position";
import { Lock, Unlock, Trophy, Users, BadgeCheck, ChevronRight } from "lucide-react";
import { useLocale } from "@/lib/i18n";

const BDT_FORMAT = (n: number, locale: string) => {
    if (locale === "bn") {
        return n >= 10_000_000
            ? `${Number(n / 10_000_000).toLocaleString("bn-BD")} কোটি টাকা`
            : n >= 100_000
                ? `${Number(n / 100_000).toLocaleString("bn-BD")} লক্ষ টাকা`
                : n >= 1_000
                    ? `${Number(n / 1_000).toLocaleString("bn-BD")} হাজার টাকা`
                    : `${Number(n).toLocaleString("bn-BD")} টাকা`;
    } else {
        return n >= 10_000_000
            ? `${(n / 10_000_000).toFixed(n % 10_000_000 === 0 ? 0 : 1)} Crore BDT`
            : n >= 100_050
                ? `${(n / 100_000).toFixed(n % 100_000 === 0 ? 0 : 1)} Lakh BDT`
                : `${n.toLocaleString("en-IN")} BDT`;
    }
};

const MEMBER_FORMAT = (n: number, locale: string) => {
    if (locale === "bn") {
        return n >= 10_000_000
            ? `${Number(n / 10_000_000).toLocaleString("bn-BD")} কোটি`
            : n >= 100_000
                ? `${Number(n / 100_000).toLocaleString("bn-BD")} লক্ষ`
                : n >= 1_000
                    ? `${Number(n / 1_000).toLocaleString("bn-BD")} হাজার`
                    : `${Number(n).toLocaleString("bn-BD")}`;
    } else {
        return n >= 1_000_000
            ? `${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
            : n >= 1_000
                ? `${(n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1)}k`
                : `${n}`;
    }
};

const RANK_COLORS = [
    "from-emerald-500 to-green-600",
    "from-teal-500 to-emerald-600",
    "from-cyan-500 to-teal-600",
    "from-blue-500 to-cyan-600",
    "from-indigo-500 to-blue-600",
    "from-violet-500 to-indigo-600",
    "from-purple-500 to-violet-600",
    "from-fuchsia-500 to-purple-600",
    "from-rose-500 to-fuchsia-600",
    "from-amber-500 to-orange-600",
];

export default function PositionPage() {
    const { locale } = useLocale();

    const { data, isLoading } = useQuery({
        queryKey: ["my-position"],
        queryFn: () => positionApi.my(),
        staleTime: 60_000,
    });

    const activeTeamCount = data?.activeTeamCount ?? 0;
    const positions = data?.positions ?? [];
    const highestUnlocked = data?.highestUnlocked ?? null;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">
                    {locale === "bn" ? "পদবী" : "Position"}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    {locale === "bn"
                        ? "আপনার দলের সক্রিয় সদস্য অনুযায়ী পদবী আনলক করুন এবং মাসিক বেতন পান।"
                        : "Unlock ranks based on active downline members and receive monthly salaries."}
                </p>
            </div>

            {isLoading ? (
                <div className="card bg-white p-12 flex justify-center">
                    <div className="w-8 h-8 rounded-full border-2 border-green-700 border-t-transparent animate-spin" />
                </div>
            ) : (
                <>
                    {/* Current status banner */}
                    {highestUnlocked ? (
                        <div className={`rounded-xl p-5 bg-gradient-to-r ${RANK_COLORS[highestUnlocked.rank - 1]} text-white shadow-lg`}>
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                                        <Trophy size={24} className="text-white" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-white/80 font-medium">
                                            {locale === "bn" ? "আপনার বর্তমান পদবী" : "Your Current Position"}
                                        </p>
                                        <h2 className="text-xl font-bold">{highestUnlocked.name}</h2>
                                        <p className="text-sm text-white/80">
                                            {locale === "bn" ? "মাসিক বেতন: " : "Monthly Salary: "}
                                            {BDT_FORMAT(highestUnlocked.monthlySalary, locale)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="flex items-center gap-1.5 bg-white/20 rounded-lg px-3 py-1.5">
                                        <Users size={14} />
                                        <span className="text-sm font-bold">
                                            {activeTeamCount.toLocaleString(locale === "bn" ? "bn-BD" : "en-US")}
                                        </span>
                                        <span className="text-xs text-white/80">
                                            {locale === "bn" ? "সক্রিয় সদস্য" : "Active Members"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-white/80">
                                        <BadgeCheck size={12} />
                                        <span>
                                            {locale === "bn"
                                                ? "বেতন প্রতি মাসের ১ তারিখে যোগ হয়"
                                                : "Salary credited on the 1st of every month"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <Lock size={20} className="text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-amber-900">
                                    {locale === "bn" ? "আপনি এখনো কোনো পদবীর যোগ্য নন" : "You are not eligible for any position yet"}
                                </h3>
                                <p className="text-sm text-amber-700 mt-0.5">
                                    {locale === "bn" ? (
                                        <>
                                            আপনার বর্তমান সক্রিয় দল: <strong>{activeTeamCount.toLocaleString("bn-BD")}</strong> সদস্য। Executive Officer পদবীর জন্য ৫,০০০ সক্রিয় সদস্য প্রয়োজন।
                                        </>
                                    ) : (
                                        <>
                                            Your current active team has <strong>{activeTeamCount.toLocaleString("en-US")}</strong> members. 5,000 active members are required to unlock Executive Officer rank.
                                        </>
                                    )}
                                </p>
                            </div>
                            <div className="bg-amber-100 rounded-lg px-3 py-2 text-center flex-shrink-0">
                                <p className="text-[10px] text-amber-700 font-medium">
                                    {locale === "bn" ? "বাকি আছে" : "Remaining"}
                                </p>
                                <p className="text-lg font-bold text-amber-800">
                                    {Math.max(0, 5000 - activeTeamCount).toLocaleString(locale === "bn" ? "bn-BD" : "en-US")}
                                </p>
                                <p className="text-[10px] text-amber-700">
                                    {locale === "bn" ? "সদস্য" : "Members"}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Active team count info */}
                    <div className="card bg-white p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <Users size={18} className="text-green-700" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">
                                {locale === "bn" ? "আপনার মোট সক্রিয় দল সদস্য" : "Your Total Active Team Members"}
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {activeTeamCount.toLocaleString(locale === "bn" ? "bn-BD" : "en-US")}
                            </p>
                        </div>
                    </div>

                    {/* Positions list */}
                    <div className="space-y-3">
                        <h2 className="text-sm font-bold text-gray-700 px-1">
                            {locale === "bn" ? "সকল পদবী ও শর্তাবলী" : "All Positions & Requirements"}
                        </h2>
                        {positions.map((pos) => (
                            <PositionCard
                                key={pos.rank}
                                position={pos}
                                activeTeamCount={activeTeamCount}
                                isHighest={highestUnlocked?.rank === pos.rank}
                                locale={locale}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

function PositionCard({
    position,
    activeTeamCount,
    isHighest,
    locale,
}: {
    position: PositionDef;
    activeTeamCount: number;
    isHighest: boolean;
    locale: string;
}) {
    const progress = Math.min(100, (activeTeamCount / position.requiredMembers) * 100);
    const remaining = Math.max(0, position.requiredMembers - activeTeamCount);
    const colorClass = RANK_COLORS[position.rank - 1];

    return (
        <div
            className={`card bg-white p-4 sm:p-5 border transition-all ${position.isUnlocked
                    ? "border-green-200 shadow-sm"
                    : "border-gray-100"
                } ${isHighest ? "ring-2 ring-green-500 ring-offset-1" : ""}`}
        >
            <div className="flex items-start gap-3 sm:gap-4">
                {/* Rank badge */}
                <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow`}
                >
                    {locale === "bn"
                        ? position.rank.toLocaleString("bn-BD")
                        : position.rank}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-gray-900">{position.name}</h3>
                            {isHighest && (
                                <span className="text-[9px] font-bold bg-green-600 text-white rounded-full px-1.5 py-0.5">
                                    {locale === "bn" ? "বর্তমান" : "Current"}
                                </span>
                            )}
                        </div>
                        {position.isUnlocked ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                                <Unlock size={10} /> {locale === "bn" ? "আনলক" : "Unlocked"}
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                                <Lock size={10} /> {locale === "bn" ? "লক" : "Locked"}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                        <div className="flex items-center gap-1.5">
                            <Users size={12} className="text-gray-400 flex-shrink-0" />
                            <span className="text-[11px] text-gray-600">
                                {locale === "bn" ? (
                                    <>
                                        প্রয়োজন: <strong>{MEMBER_FORMAT(position.requiredMembers, "bn")} সক্রিয় সদস্য</strong>
                                    </>
                                ) : (
                                    <>
                                        Requirement: <strong>{MEMBER_FORMAT(position.requiredMembers, "en")} active members</strong>
                                    </>
                                )}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <ChevronRight size={12} className="text-gray-400 flex-shrink-0" />
                            <span className="text-[11px] text-gray-600">
                                {locale === "bn" ? (
                                    <>
                                        মাসিক বেতন: <strong className="text-green-700">{BDT_FORMAT(position.monthlySalary, "bn")}</strong>
                                    </>
                                ) : (
                                    <>
                                        Monthly Salary: <strong className="text-green-700">{BDT_FORMAT(position.monthlySalary, "en")}</strong>
                                    </>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-3">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-gray-400">
                                {activeTeamCount.toLocaleString(locale === "bn" ? "bn-BD" : "en-US")} / {position.requiredMembers.toLocaleString(locale === "bn" ? "bn-BD" : "en-US")}
                            </span>
                            {!position.isUnlocked && (
                                <span className="text-[10px] text-gray-400">
                                    {locale === "bn"
                                        ? `আর ${remaining.toLocaleString("bn-BD")} সদস্য দরকার`
                                        : `${remaining.toLocaleString("en-US")} more members needed`}
                                </span>
                            )}
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div
                                className={`h-full rounded-full bg-gradient-to-r ${colorClass} transition-all duration-500`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
