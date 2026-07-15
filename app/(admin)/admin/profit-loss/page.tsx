"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingUp, DollarSign, Wallet, ArrowUpRight, BarChart3, Info } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

export default function AdminProfitLossPage() {
    const { t } = useLocale();
    const { data: stats, isLoading } = useQuery({
        queryKey: ["admin-stats"],
        queryFn: () => adminApi.stats(),
    });

    const profitColor = !stats ? "text-slate-800" : stats.netProfit >= 0 ? "text-green-700" : "text-red-700";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">{t("admin.overview.profitLoss.heading")}</h1>
                <p className="text-sm text-slate-500">{t("admin.overview.subheading")}</p>
            </div>

            {isLoading ? (
                <div className="py-20 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700" />
                </div>
            ) : !stats ? (
                <div className="py-20 text-center text-slate-400 text-sm">No data available</div>
            ) : (
                <>
                    {/* ── Revenue & Costs Grid ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="card p-5 bg-white">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{t("admin.overview.profitLoss.salesRevenue")}</span>
                                <TrendingUp size={18} className="text-emerald-600" />
                            </div>
                            <span className="text-2xl font-bold text-emerald-700">{formatCurrency(stats.totalSales)}</span>
                        </div>
                        <div className="card p-5 bg-white">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{t("admin.overview.profitLoss.minusCostOfSold")}</span>
                                <DollarSign size={18} className="text-orange-600" />
                            </div>
                            <span className="text-2xl font-bold text-orange-700">- {formatCurrency(stats.totalSoldCost)}</span>
                        </div>
                        <div className="card p-5 bg-white">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{t("admin.overview.profitLoss.minusCommission")}</span>
                                <ArrowUpRight size={18} className="text-indigo-600" />
                            </div>
                            <span className="text-2xl font-bold text-indigo-700">- {formatCurrency(stats.totalCommissionsPaid)}</span>
                        </div>
                        <div className="card p-5 bg-white">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{t("admin.overview.profitLoss.minusWithdrawals")}</span>
                                <Wallet size={18} className="text-rose-600" />
                            </div>
                            <span className="text-2xl font-bold text-rose-700">- {formatCurrency(stats.totalWithdrawalsApproved)}</span>
                        </div>
                    </div>

                    {/* ── Gross & Net Profit ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="card p-6 bg-white">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{t("admin.overview.profitLoss.grossProfit")}</span>
                                <BarChart3 size={20} className="text-slate-400" />
                            </div>
                            <span className={`text-3xl font-bold block ${stats.grossProfit >= 0 ? "text-green-700" : "text-red-700"}`}>
                                {stats.grossProfit >= 0 ? "" : "- "}{formatCurrency(Math.abs(stats.grossProfit))}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1">
                                {t("admin.overview.profitLoss.grossProfit")}: {t("admin.overview.profitLoss.salesRevenue")} - {t("admin.overview.profitLoss.minusCostOfSold")}
                            </p>
                        </div>
                        <div className="card p-6 bg-slate-800">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{t("admin.overview.profitLoss.netProfit")}</span>
                                <BarChart3 size={20} className="text-slate-500" />
                            </div>
                            <span className={`text-4xl font-bold block ${profitColor}`}>
                                {stats.netProfit >= 0 ? "+ " : "- "}{formatCurrency(Math.abs(stats.netProfit))}
                            </span>
                            <p className="text-[10px] text-slate-500 mt-1">
                                {t("admin.overview.profitLoss.netProfit")}: {t("admin.overview.profitLoss.salesRevenue")} - {t("admin.overview.profitLoss.minusCostOfSold")} - {t("admin.overview.profitLoss.minusCommission")} - {t("admin.overview.profitLoss.minusWithdrawals")}
                            </p>
                        </div>
                    </div>

                    {/* ── Supporting Data ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="card p-4 bg-white flex items-center justify-between">
                            <div>
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">{t("admin.overview.totalProducts")}</span>
                                <span className="text-lg font-bold text-slate-800">{stats.totalProducts}</span>
                            </div>
                            <div className="rounded-lg bg-violet-50 p-2 text-violet-700">
                                <DollarSign size={16} />
                            </div>
                        </div>
                        <div className="card p-4 bg-white flex items-center justify-between">
                            <div>
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">{t("admin.overview.productValue")}</span>
                                <span className="text-lg font-bold text-amber-700">{formatCurrency(stats.totalProductValue)}</span>
                            </div>
                            <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
                                <DollarSign size={16} />
                            </div>
                        </div>
                        <div className="card p-4 bg-white flex items-center justify-between">
                            <div>
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">{t("admin.overview.totalCostPrice")}</span>
                                <span className="text-lg font-bold text-orange-700">{formatCurrency(stats.totalCostValue)}</span>
                            </div>
                            <div className="rounded-lg bg-orange-50 p-2 text-orange-700">
                                <DollarSign size={16} />
                            </div>
                        </div>
                        <div className="card p-4 bg-white flex items-center justify-between">
                            <div>
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">{t("admin.overview.benefitsWithdrawals")}</span>
                                <span className="text-lg font-bold text-rose-700">{formatCurrency(stats.totalWithdrawalsApproved)}</span>
                            </div>
                            <div className="rounded-lg bg-rose-50 p-2 text-rose-700">
                                <Wallet size={16} />
                            </div>
                        </div>
                    </div>

                    {/* ── Formula ── */}
                    <div className="card p-4 bg-slate-50 flex items-start gap-3">
                        <Info size={16} className="text-slate-400 mt-0.5 flex-shrink-0" />
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                            {t("admin.overview.profitLoss.formula")}
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
