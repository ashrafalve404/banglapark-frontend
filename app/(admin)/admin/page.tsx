"use client";

import { useQuery } from "@tanstack/react-query";
import {
    Users, ShoppingBag, ArrowUpRight, TrendingUp,
    AlertCircle, ShieldAlert, BadgeAlert, CheckCircle2,
    Package, DollarSign, CreditCard, BarChart3, Wallet,
    AlertTriangle, TrendingDown
} from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

export default function AdminOverview() {
    const { t } = useLocale();
    const { data: stats, isLoading } = useQuery({
        queryKey: ["admin-stats"],
        queryFn: () => adminApi.stats(),
    });

    const profitColor = !stats ? "text-slate-800" : stats.netProfit >= 0 ? "text-green-700" : "text-red-700";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">{t("admin.overview.heading")}</h1>
                <p className="text-sm text-slate-500">{t("admin.overview.subheading")}</p>
            </div>

            {/* KPI stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Users */}
                <div className="card p-5 bg-white flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">{t("admin.overview.totalUsers")}</span>
                        <span className="text-2xl font-bold text-slate-800">
                            {isLoading ? "..." : stats?.users?.total ?? 0} {t("admin.overview.unit")}
                        </span>
                    </div>
                    <div className="rounded-lg bg-teal-50 p-2.5 text-teal-800">
                        <Users size={20} />
                    </div>
                </div>

                {/* Active Users */}
                <div className="card p-5 bg-white flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">{t("admin.overview.activeUsers")}</span>
                        <span className="text-2xl font-bold text-green-700">
                            {isLoading ? "..." : stats?.users?.active ?? 0} {t("admin.overview.unit")}
                        </span>
                    </div>
                    <div className="rounded-lg bg-green-50 p-2.5 text-green-800">
                        <CheckCircle2 size={20} />
                    </div>
                </div>

                {/* Total Products */}
                <div className="card p-5 bg-white flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Total Products</span>
                        <span className="text-2xl font-bold text-violet-700">
                            {isLoading ? "..." : stats?.totalProducts ?? 0}
                        </span>
                    </div>
                    <div className="rounded-lg bg-violet-50 p-2.5 text-violet-800">
                        <Package size={20} />
                    </div>
                </div>

                {/* Total Sales Revenue */}
                <div className="card p-5 bg-white flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">{t("admin.overview.totalRevenue")}</span>
                        <span className="text-2xl font-bold text-emerald-800">
                            {isLoading ? "..." : formatCurrency(stats?.totalSales ?? 0)}
                        </span>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-800">
                        <TrendingUp size={20} />
                    </div>
                </div>

                {/* Total Product Value (Inventory) */}
                <div className="card p-5 bg-white flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Product Value</span>
                        <span className="text-2xl font-bold text-amber-700">
                            {isLoading ? "..." : formatCurrency(stats?.totalProductValue ?? 0)}
                        </span>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-2.5 text-amber-800">
                        <DollarSign size={20} />
                    </div>
                </div>

                {/* Total Cost Value */}
                <div className="card p-5 bg-white flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Total Cost Price</span>
                        <span className="text-2xl font-bold text-orange-700">
                            {isLoading ? "..." : formatCurrency(stats?.totalCostValue ?? 0)}
                        </span>
                    </div>
                    <div className="rounded-lg bg-orange-50 p-2.5 text-orange-800">
                        <CreditCard size={20} />
                    </div>
                </div>

                {/* Total Commission Paid */}
                <div className="card p-5 bg-white flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">{t("admin.overview.totalCommission")}</span>
                        <span className="text-2xl font-bold text-indigo-700">
                            {isLoading ? "..." : formatCurrency(stats?.totalCommissionsPaid ?? 0)}
                        </span>
                    </div>
                    <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-800">
                        <ArrowUpRight size={20} />
                    </div>
                </div>

                {/* Withdrawals Approved */}
                <div className="card p-5 bg-white flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Benefits/Withdrawals</span>
                        <span className="text-2xl font-bold text-rose-700">
                            {isLoading ? "..." : formatCurrency(stats?.totalWithdrawalsApproved ?? 0)}
                        </span>
                    </div>
                    <div className="rounded-lg bg-rose-50 p-2.5 text-rose-800">
                        <Wallet size={20} />
                    </div>
                </div>
            </div>

            {/* Profit & Loss Section */}
            {!isLoading && stats && (
                <div className="card p-6 bg-white">
                    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-4">Profit & Loss Summary</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="rounded-xl bg-slate-50 p-4">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Sales Revenue</span>
                            <span className="text-xl font-bold text-emerald-700 block mt-1">{formatCurrency(stats.totalSales)}</span>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-4">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Minus: Cost of Sold Goods</span>
                            <span className="text-xl font-bold text-orange-700 block mt-1">- {formatCurrency(stats.totalSoldCost)}</span>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-4">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Minus: Commissions Paid</span>
                            <span className="text-xl font-bold text-indigo-700 block mt-1">- {formatCurrency(stats.totalCommissionsPaid)}</span>
                        </div>
                        <div className="rounded-xl bg-slate-50 p-4">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Minus: Withdrawals (Approved)</span>
                            <span className="text-xl font-bold text-rose-700 block mt-1">- {formatCurrency(stats.totalWithdrawalsApproved)}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <div className="rounded-xl bg-slate-100 p-4">
                            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block">Gross Profit (Sales - Cost)</span>
                            <span className={`text-xl font-bold block mt-1 ${stats.grossProfit >= 0 ? "text-green-700" : "text-red-700"}`}>
                                {stats.grossProfit >= 0 ? "" : "- "}{formatCurrency(Math.abs(stats.grossProfit))}
                            </span>
                        </div>
                        <div className="rounded-xl bg-slate-800 p-4">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Net Profit / Loss</span>
                            <span className={`text-2xl font-bold block mt-1 ${profitColor}`}>
                                {stats.netProfit >= 0 ? "+ " : "- "}{formatCurrency(Math.abs(stats.netProfit))}
                            </span>
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3">
                        Net Profit = Sales Revenue - Cost of Sold Goods - Commissions - Withdrawals Approved
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending Alerts columns */}
                <div className="lg:col-span-2 card p-6 bg-white space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">{t("admin.overview.pendingAlert.heading")}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 flex items-center gap-3">
                            <BadgeAlert className="text-amber-800 flex-shrink-0" size={24} />
                            <div>
                                <span className="text-[10px] text-amber-800 font-bold block uppercase">{t("admin.overview.pendingAlert.pendingWithdrawals")}</span>
                                <span className="text-lg font-bold text-amber-900 block">{stats?.pendingWithdrawals ?? 0} {t("admin.overview.pendingAlert.paymentUnit")}</span>
                                <span className="text-xs text-gray-500">{t("admin.overview.pendingAlert.pendingWithdrawalsDesc")}</span>
                            </div>
                        </div>

                        <div className="rounded-xl border border-indigo-150 bg-indigo-50/30 p-4 flex items-center gap-3">
                            <ShoppingBag className="text-indigo-800 flex-shrink-0" size={24} />
                            <div>
                                <span className="text-[10px] text-indigo-800 font-bold block uppercase">{t("admin.overview.pendingAlert.orders")}</span>
                                <span className="text-lg font-bold text-indigo-900 block">{stats?.orders?.total ?? 0} {t("admin.overview.pendingAlert.totalOrders")}</span>
                                <span className="text-xs text-gray-500">{t("admin.overview.pendingAlert.ordersDesc")}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Short tutorial instructions */}
                <div className="card p-6 bg-slate-900 text-white space-y-3 flex flex-col justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-amber-400 uppercase mb-2">{t("admin.overview.guide.heading")}</h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                            {t("admin.overview.guide.text")}
                        </p>
                    </div>
                    <span className="text-[10px] text-slate-500">{t("admin.overview.footer")}</span>
                </div>
            </div>
        </div>
    );
}