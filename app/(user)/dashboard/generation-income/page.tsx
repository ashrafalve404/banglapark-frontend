"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { TrendingUp, Users, HelpCircle } from "lucide-react";
import { commissionsApi } from "@/lib/api/commissions";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

export default function GenerationIncomePage() {
    const { t } = useLocale();
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ["generation-commissions", page],
        queryFn: () => commissionsApi.my({ page, limit: 10 }),
    });

    const commissions = data?.commissions ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / 10) || 1;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t("generationIncome.heading")}</h1>
                    <p className="text-sm text-gray-500">{t("generationIncome.subheading")}</p>
                </div>
            </div>

            <div className="card p-5 bg-white flex items-start gap-3.5">
                <HelpCircle size={20} className="text-red-700 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-gray-500 space-y-1">
                    <p className="font-bold text-gray-800">{t("generationIncome.rules.heading")}</p>
                    <p>{t("generationIncome.rules.level1")}</p>
                    <p>{t("generationIncome.rules.level2to15")}</p>
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-white">
                    <h3 className="text-sm font-bold text-gray-800">{t("generationIncome.history.heading")}</h3>
                </div>

                {isLoading ? (
                    <div className="py-16 text-center text-gray-400">{t("generationIncome.history.loading")}</div>
                ) : commissions.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">{t("generationIncome.history.empty")}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-150">
                                    <th className="p-4 text-xs font-bold text-gray-650">{t("generationIncome.history.colDate")}</th>
                                    <th className="p-4 text-xs font-bold text-gray-660">{t("generationIncome.history.colSource")}</th>
                                    <th className="p-4 text-xs font-bold text-gray-670 text-center">{t("generationIncome.history.colLevel")}</th>
                                    <th className="p-4 text-xs font-bold text-gray-680 text-right">{t("generationIncome.history.colAmount")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {commissions.map((comm) => (
                                    <tr key={comm.id} className="hover:bg-gray-50/50">
                                        <td className="p-4 text-xs text-gray-600">{formatDateTime(comm.createdAt)}</td>
                                        <td className="p-4 text-sm font-semibold text-gray-800">
                                            {comm.fromUser?.name || t("generationIncome.history.memberUnknown")}
                                        </td>
                                        <td className="p-4 text-xs text-center font-bold text-gray-700">
                                            {t("generationIncome.history.level")} {comm.level}
                                        </td>
                                        <td className="p-4 text-xs font-bold text-red-700 text-right">
                                            +{formatCurrency(comm.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                        <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary py-1 px-3 text-xs">{t("generationIncome.prev")}</button>
                        <span className="text-xs text-gray-500 font-semibold">{page} / {totalPages} {t("generationIncome.page")}</span>
                        <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn-secondary py-1 px-3 text-xs">{t("generationIncome.next")}</button>
                    </div>
                )}
            </div>
        </div>
    );
}
