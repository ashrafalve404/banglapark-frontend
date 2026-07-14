"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Award, Users, TrendingUp, HelpCircle } from "lucide-react";
import { dailyBenefitApi } from "@/lib/api/commissions";
import { referralApi } from "@/lib/api/categories";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

export default function DailyBenefitPage() {
    const { t, locale } = useLocale();
    const [page, setPage] = useState(1);

    const { data: tiers = [], isLoading: tiersLoading } = useQuery({
        queryKey: ["benefit-tiers"],
        queryFn: () => dailyBenefitApi.tiers(),
    });

    const { data: stats } = useQuery({
        queryKey: ["referral-stats"],
        queryFn: () => referralApi.teamStats(),
        refetchOnWindowFocus: true,
    });

    const { data: logData, isLoading: logsLoading } = useQuery({
        queryKey: ["my-daily-benefit-logs", page],
        queryFn: () => dailyBenefitApi.myLogs({ page, limit: 10 }),
    });

    const activeCount = stats?.activeTeam ?? 0;
    const logs = logData?.logs ?? [];
    const total = logData?.total ?? 0;
    const totalPages = Math.ceil(total / 10) || 1;

    const currentTier = [...tiers]
        .sort((a, b) => b.minCount - a.minCount)
        .find((tier) => activeCount >= tier.minCount);

    const nextTargetTier = [...tiers]
        .sort((a, b) => a.minCount - b.minCount)
        .find((tier) => activeCount < tier.minCount);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{t("dailyBenefit.heading")}</h1>
                <p className="text-sm text-gray-500">{t("dailyBenefit.subheading")}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card p-6 flex flex-col justify-between bg-gradient-to-br from-green-900 to-green-800 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-xs text-green-100 font-semibold uppercase tracking-wider">{t("dailyBenefit.currentTier.label")}</span>
                        <Award size={20} className="text-amber-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold mb-1">
                            {currentTier ? `${formatCurrency(currentTier.amount, locale)} ${t("dailyBenefit.currentTier.perDay")}` : t("dailyBenefit.currentTier.none")}
                        </h2>
                        <p className="text-xs text-green-200">
                            {t("dailyBenefit.currentTier.teamLabel")} <strong className="text-white">{activeCount}{t("dailyBenefit.currentTier.teamUnit")}</strong>
                        </p>
                    </div>
                </div>

                <div className="card p-6 flex flex-col justify-between bg-white border border-gray-150">
                    <div className="flex items-center justify-between mb-3.5">
                        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{t("dailyBenefit.nextTier.label")}</span>
                        <TrendingUp size={20} className="text-green-700" />
                    </div>

                    {nextTargetTier ? (
                        <div>
                            <p className="text-xs text-gray-500 mb-2">
                                {t("dailyBenefit.nextTier.text", { count: nextTargetTier.minCount, amount: formatCurrency(nextTargetTier.amount, locale) })}
                            </p>
                            <div className="h-2 w-full bg-gray-150 rounded-full mb-1 bg-gray-100 overflow-hidden">
                                <div className="h-full bg-green-755" style={{ width: `${Math.min(100, (activeCount / nextTargetTier.minCount) * 100)}%` }} />
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold">
                                <span>{activeCount}{t("dailyBenefit.nextTier.unit")}</span>
                                <span>{t("dailyBenefit.nextTier.progress")} {nextTargetTier.minCount}{t("dailyBenefit.nextTier.unit")}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-xs text-green-770 font-semibold">{t("dailyBenefit.nextTier.maxReached")}</p>
                    )}
                </div>
            </div>

            <div className="card p-6 bg-white space-y-4">
                <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">{t("dailyBenefit.chart.heading")}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {tiers.map((tier) => {
                        const isSelfOrMore = activeCount >= tier.minCount;
                        return (
                            <div key={tier.minCount} className={`rounded-xl p-4 text-center border transition-all ${isSelfOrMore
                                    ? "bg-green-50/50 border-green-777 shadow-sm"
                                    : "bg-gray-50 border-gray-150"
                                }`}>
                                <Users size={16} className={`mx-auto mb-1.5 ${isSelfOrMore ? "text-green-800" : "text-gray-400"}`} />
                                <div className="text-xs font-semibold text-gray-600 mb-1">{t("dailyBenefit.chart.memberLabel")}</div>
                                <div className="text-sm font-bold text-gray-900 mb-1">{tier.minCount}{t("dailyBenefit.chart.memberCount")}</div>
                                <hr className="my-1.5 border-gray-100" />
                                <div className={`text-base font-extrabold ${isSelfOrMore ? "text-green-850" : "text-gray-600"}`}>{formatCurrency(tier.amount, locale)}</div>
                                <div className="text-[10px] text-gray-500">{t("dailyBenefit.chart.perDay")}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-white">
                    <h3 className="text-sm font-bold text-gray-800">{t("dailyBenefit.history.heading")}</h3>
                </div>

                {logsLoading ? (
                    <div className="py-16 text-center text-gray-400">{t("dailyBenefit.history.loading")}</div>
                ) : logs.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">{t("dailyBenefit.history.empty")}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-150">
                                    <th className="p-4 text-xs font-bold text-gray-650">{t("dailyBenefit.history.colDate")}</th>
                                    <th className="p-4 text-xs font-bold text-gray-660 text-center">{t("dailyBenefit.history.colTeam")}</th>
                                    <th className="p-4 text-xs font-bold text-gray-670 text-right">{t("dailyBenefit.history.colCommission")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {logs.map((lg) => (
                                    <tr key={lg.id} className="hover:bg-gray-50/50">
                                        <td className="p-4 text-xs text-gray-650">{formatDate(lg.date, locale)}</td>
                                        <td className="p-4 text-xs text-gray-550 text-center font-semibold">{lg.teamCount}{t("dailyBenefit.history.teamUnit")}</td>
                                        <td className="p-4 text-xs font-bold text-green-700 text-right">{formatCurrency(lg.amount, locale)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                        <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary py-1 px-3 text-xs">{t("dailyBenefit.prev")}</button>
                        <span className="text-xs text-gray-500 font-semibold">{page} / {totalPages} {t("dailyBenefit.page")}</span>
                        <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn-secondary py-1 px-3 text-xs">{t("dailyBenefit.next")}</button>
                    </div>
                )}
            </div>
        </div>
    );
}
