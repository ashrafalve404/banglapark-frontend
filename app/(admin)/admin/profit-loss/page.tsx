"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingUp, DollarSign, Wallet, ArrowUpRight, BarChart3, Info, Truck } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
    Cell, PieChart, Pie, Legend, LabelList
} from "recharts";

export default function AdminProfitLossPage() {
    const { t, locale } = useLocale();
    const { data: stats, isLoading } = useQuery({
        queryKey: ["admin-stats"],
        queryFn: () => adminApi.stats(),
    });

    const profitColor = !stats ? "text-slate-800" : stats.netProfit >= 0 ? "text-green-700" : "text-red-700";

    // Prepare chart data
    const barChartData = stats ? [
        { name: t("admin.overview.profitLoss.salesRevenue"), amount: stats.totalSales, fill: "#059669" },
        { name: t("admin.overview.profitLoss.minusCostOfSold"), amount: stats.totalSoldCost, fill: "#ea580c" },
        { name: t("admin.overview.profitLoss.minusDelivery"), amount: stats.totalDeliveryCharges, fill: "#ca8a04" },
        { name: t("admin.overview.profitLoss.minusCommission"), amount: stats.totalCommissionsPaid, fill: "#4f46e5" },
        { name: t("admin.overview.profitLoss.minusWithdrawals"), amount: stats.totalWithdrawalsApproved, fill: "#e11d48" },
        { name: t("admin.overview.profitLoss.netProfit"), amount: Math.max(0, stats.netProfit), fill: stats.netProfit >= 0 ? "#10b981" : "#ef4444" },
    ] : [];

    const pieChartData = stats ? [
        { name: t("admin.overview.profitLoss.minusCostOfSold"), value: stats.totalSoldCost, color: "#ea580c" },
        { name: t("admin.overview.profitLoss.minusDelivery"), value: stats.totalDeliveryCharges, color: "#ca8a04" },
        { name: t("admin.overview.profitLoss.minusCommission"), value: stats.totalCommissionsPaid, color: "#4f46e5" },
        { name: t("admin.overview.profitLoss.minusWithdrawals"), value: stats.totalWithdrawalsApproved, color: "#e11d48" },
        { name: t("admin.overview.profitLoss.netProfit"), value: Math.max(0, stats.netProfit), color: "#10b981" },
    ].filter(d => d.value > 0) : [];

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="card p-5 bg-white">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{t("admin.overview.profitLoss.salesRevenue")}</span>
                                <TrendingUp size={18} className="text-emerald-600" />
                            </div>
                            <span className="text-2xl font-bold text-emerald-700">{formatCurrency(stats.totalSales, locale)}</span>
                        </div>
                        <div className="card p-5 bg-white">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{t("admin.overview.profitLoss.minusCostOfSold")}</span>
                                <DollarSign size={18} className="text-orange-600" />
                            </div>
                            <span className="text-2xl font-bold text-orange-700">- {formatCurrency(stats.totalSoldCost, locale)}</span>
                        </div>
                        <div className="card p-5 bg-white">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{t("admin.overview.profitLoss.minusDelivery")}</span>
                                <Truck size={18} className="text-yellow-600" />
                            </div>
                            <span className="text-2xl font-bold text-yellow-700">- {formatCurrency(stats.totalDeliveryCharges, locale)}</span>
                        </div>
                        <div className="card p-5 bg-white">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{t("admin.overview.profitLoss.minusCommission")}</span>
                                <ArrowUpRight size={18} className="text-indigo-600" />
                            </div>
                            <span className="text-2xl font-bold text-indigo-700">- {formatCurrency(stats.totalCommissionsPaid, locale)}</span>
                        </div>
                        <div className="card p-5 bg-white">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{t("admin.overview.profitLoss.minusWithdrawals")}</span>
                                <Wallet size={18} className="text-rose-600" />
                            </div>
                            <span className="text-2xl font-bold text-rose-700">- {formatCurrency(stats.totalWithdrawalsApproved, locale)}</span>
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
                                {stats.grossProfit >= 0 ? "" : "- "}{formatCurrency(Math.abs(stats.grossProfit), locale)}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1">
                                {t("admin.overview.profitLoss.grossProfit")}: {t("admin.overview.profitLoss.salesRevenue")} - {t("admin.overview.profitLoss.minusCostOfSold")} - {t("admin.overview.profitLoss.minusDelivery")}
                            </p>
                        </div>
                        <div className="card p-6 bg-slate-800">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{t("admin.overview.profitLoss.netProfit")}</span>
                                <BarChart3 size={20} className="text-slate-500" />
                            </div>
                            <span className={`text-4xl font-bold block ${profitColor}`}>
                                {stats.netProfit >= 0 ? "+ " : "- "}{formatCurrency(Math.abs(stats.netProfit), locale)}
                            </span>
                            <p className="text-[10px] text-slate-500 mt-1">
                                {t("admin.overview.profitLoss.netProfit")}: {t("admin.overview.profitLoss.salesRevenue")} - {t("admin.overview.profitLoss.minusCostOfSold")} - {t("admin.overview.profitLoss.minusDelivery")} - {t("admin.overview.profitLoss.minusCommission")} - {t("admin.overview.profitLoss.minusWithdrawals")}
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
                                <span className="text-lg font-bold text-amber-700">{formatCurrency(stats.totalProductValue, locale)}</span>
                            </div>
                            <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
                                <DollarSign size={16} />
                            </div>
                        </div>
                        <div className="card p-4 bg-white flex items-center justify-between">
                            <div>
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">{t("admin.overview.totalCostPrice")}</span>
                                <span className="text-lg font-bold text-orange-700">{formatCurrency(stats.totalCostValue, locale)}</span>
                            </div>
                            <div className="rounded-lg bg-orange-50 p-2 text-orange-700">
                                <DollarSign size={16} />
                            </div>
                        </div>
                        <div className="card p-4 bg-white flex items-center justify-between">
                            <div>
                                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">{t("admin.overview.benefitsWithdrawals")}</span>
                                <span className="text-lg font-bold text-rose-700">{formatCurrency(stats.totalWithdrawalsApproved, locale)}</span>
                            </div>
                            <div className="rounded-lg bg-rose-50 p-2 text-rose-700">
                                <Wallet size={16} />
                            </div>
                        </div>
                    </div>

                    {/* ── Interactive Financial Analytics Charts (Placed at the bottom) ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Bar Chart: Revenue & Cost Comparison */}
                        <div className="lg:col-span-2 card p-6 bg-slate-900 border border-slate-800 text-white shadow-xl">
                            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                                <BarChart3 size={18} className="text-emerald-400" />
                                Financial Comparison Breakdown
                            </h3>
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barChartData} margin={{ top: 20, right: 10, left: -10, bottom: 25 }}>
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#cbd5e1", fontWeight: 600 }} interval={0} angle={-15} textAnchor="end" />
                                        <YAxis tick={{ fontSize: 10, fill: "#cbd5e1", fontWeight: 600 }} />
                                        <Tooltip
                                            formatter={(value: any) => [formatCurrency(Number(value), locale), "Amount"]}
                                            contentStyle={{ backgroundColor: "#020617", borderRadius: "8px", borderColor: "#334155", color: "#ffffff", fontSize: "12px" }}
                                            itemStyle={{ color: "#38bdf8", fontWeight: 700 }}
                                            labelStyle={{ color: "#94a3b8", fontWeight: 600 }}
                                        />
                                        <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                                            {barChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                            <LabelList
                                                dataKey="amount"
                                                position="top"
                                                fill="#f8fafc"
                                                fontSize={10}
                                                fontWeight={700}
                                                formatter={(val: any) => formatCurrency(Number(val), locale)}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Donut Chart: Revenue Distribution */}
                        <div className="card p-6 bg-slate-900 border border-slate-800 text-white shadow-xl flex flex-col items-center">
                            <h3 className="text-sm font-bold text-white mb-4 w-full text-left">
                                Revenue Allocation Breakdown
                            </h3>
                            <div className="h-72 w-full flex items-center justify-center">
                                {pieChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieChartData}
                                                cx="50%"
                                                cy="45%"
                                                innerRadius={55}
                                                outerRadius={85}
                                                paddingAngle={4}
                                                dataKey="value"
                                            >
                                                {pieChartData.map((entry, index) => (
                                                    <Cell key={`pie-cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: any) => [formatCurrency(Number(value), locale), "Amount"]}
                                                contentStyle={{ backgroundColor: "#020617", borderRadius: "8px", borderColor: "#334155", color: "#ffffff", fontSize: "12px" }}
                                                itemStyle={{ color: "#38bdf8", fontWeight: 700 }}
                                                labelStyle={{ color: "#94a3b8", fontWeight: 600 }}
                                            />
                                            <Legend
                                                wrapperStyle={{ fontSize: "11px", paddingTop: "10px", color: "#cbd5e1" }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <p className="text-xs text-slate-400">No revenue data yet</p>
                                )}
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
