"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { Wallet, AlertCircle, RefreshCw, Gift, TrendingUp, Award, DollarSign, MapPin, PieChart } from "lucide-react";
import { walletApi } from "@/lib/api/wallet";
import { useAuthStore } from "@/store/auth";
import { formatCurrency, formatDateTime, getTxTypeLabel } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

export default function WalletPage() {
    const { user } = useAuthStore();
    const { t } = useLocale();
    const [page, setPage] = useState(1);
    const [type, setType] = useState("");

    const isInactive = user?.status === "INACTIVE";

    const { data: balanceData, isLoading: balLoading, refetch: refetchBal } = useQuery({
        queryKey: ["wallet-balance"],
        queryFn: () => walletApi.balance(),
    });

    const { data: txData, isLoading: txLoading, refetch: refetchTx } = useQuery({
        queryKey: ["wallet-transactions", page, type],
        queryFn: () =>
            walletApi.transactions({
                page,
                limit: 10,
                type: type || undefined,
            }),
    });

    const transactions = txData?.transactions ?? [];
    const totalPages = txData?.totalPages ?? 1;

    const handleRefresh = () => {
        refetchBal();
        refetchTx();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t("wallet.heading")}</h1>
                    <p className="text-sm text-gray-500">{t("wallet.subheading")}</p>
                </div>
                <button onClick={handleRefresh} className="btn-secondary self-start py-2 px-3 flex items-center gap-1.5 text-xs">
                    <RefreshCw size={14} /> {t("wallet.refresh")}
                </button>
            </div>

            {isInactive && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-5 flex items-center gap-3.5">
                    <AlertCircle size={24} className="text-red-600 flex-shrink-0" />
                    <div>
                        <h3 className="font-bold text-red-800 text-sm">{t("wallet.inactiveAlert.title")}</h3>
                        <p className="text-xs text-red-600">{t("wallet.inactiveAlert.desc")}</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="card p-5 bg-gradient-to-br from-green-900 to-green-800 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] text-green-100 font-semibold uppercase tracking-wider">{t("wallet.balance.total")}</span>
                        <Wallet size={18} className="text-green-300" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-white">
                        {balLoading ? "..." : formatCurrency(balanceData?.balance ?? 0)}
                    </h2>
                </div>

                <div className="card p-5 bg-gradient-to-br from-purple-900 to-purple-800 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] text-purple-100 font-semibold uppercase tracking-wider">{t("wallet.balance.dailyReward")}</span>
                        <Gift size={18} className="text-purple-300" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-white">
                        {balLoading ? "..." : formatCurrency(balanceData?.dailyReward ?? 0)}
                    </h2>
                </div>

                <div className="card p-5 bg-gradient-to-br from-indigo-900 to-indigo-800 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] text-indigo-100 font-semibold uppercase tracking-wider">{t("wallet.balance.tierBonus")}</span>
                        <Award size={18} className="text-indigo-300" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-white">
                        {balLoading ? "..." : formatCurrency(balanceData?.tierBonus ?? 0)}
                    </h2>
                </div>

                <div className="card p-5 bg-gradient-to-br from-blue-900 to-blue-800 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] text-blue-100 font-semibold uppercase tracking-wider">{t("wallet.balance.generationIncome")}</span>
                        <TrendingUp size={18} className="text-blue-300" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-white">
                        {balLoading ? "..." : formatCurrency(balanceData?.generationIncome ?? 0)}
                    </h2>
                </div>

                <div className="card p-5 bg-white border border-gray-150">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{t("wallet.balance.pending")}</span>
                        <AlertCircle size={18} className="text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-800">
                        {balLoading ? "..." : formatCurrency(balanceData?.pendingWithdrawal ?? 0)}
                    </h2>
                </div>

                <div className="card p-5 bg-green-50/50 border border-green-100">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] text-green-700 font-semibold uppercase tracking-wider">{t("wallet.balance.available")}</span>
                        <Wallet size={18} className="text-green-700" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-green-800">
                        {balLoading ? "..." : formatCurrency(balanceData?.availableBalance ?? 0)}
                    </h2>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="card p-4 border border-dashed border-gray-200 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{t("wallet.balance.reward")}</span>
                        <Award size={16} className="text-gray-300" />
                    </div>
                    <h2 className="text-xl font-extrabold text-gray-400">
                        {balLoading ? "..." : formatCurrency(balanceData?.reward ?? 0)}
                    </h2>
                </div>
                <div className="card p-4 border border-dashed border-gray-200 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{t("wallet.balance.salary")}</span>
                        <DollarSign size={16} className="text-gray-300" />
                    </div>
                    <h2 className="text-xl font-extrabold text-gray-400">
                        {balLoading ? "..." : formatCurrency(balanceData?.salary ?? 0)}
                    </h2>
                </div>
                <div className="card p-4 border border-dashed border-gray-200 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{t("wallet.balance.travelling")}</span>
                        <MapPin size={16} className="text-gray-300" />
                    </div>
                    <h2 className="text-xl font-extrabold text-gray-400">
                        {balLoading ? "..." : formatCurrency(balanceData?.travelling ?? 0)}
                    </h2>
                </div>
                <div className="card p-4 border border-dashed border-gray-200 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{t("wallet.balance.share")}</span>
                        <PieChart size={16} className="text-gray-300" />
                    </div>
                    <h2 className="text-xl font-extrabold text-gray-400">
                        {balLoading ? "..." : formatCurrency(balanceData?.share ?? 0)}
                    </h2>
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
                    <h3 className="text-base font-bold text-gray-800">{t("wallet.ledger.heading")}</h3>

                    <select className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-green-700 w-full sm:w-44" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
                        <option value="">{t("wallet.ledger.filterAll")}</option>
                        <option value="GENERATION_COMMISSION">{t("wallet.ledger.filterGeneration")}</option>
                        <option value="DAILY_BENEFIT">{t("wallet.ledger.filterDailyBenefit")}</option>
                        <option value="PURCHASE">{t("wallet.ledger.filterPurchase")}</option>
                        <option value="WITHDRAWAL">{t("wallet.ledger.filterWithdrawal")}</option>
                        <option value="ADMIN_ADJUSTMENT">{t("wallet.ledger.filterAdmin")}</option>
                    </select>
                </div>

                {txLoading ? (
                    <div className="py-20 text-center text-gray-400">{t("wallet.ledger.loading")}</div>
                ) : transactions.length === 0 ? (
                    <div className="py-20 text-center text-gray-400">{t("wallet.ledger.empty")}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-150">
                                    <th className="p-4 text-xs font-bold text-gray-600">{t("wallet.ledger.colDate")}</th>
                                    <th className="p-4 text-xs font-bold text-gray-600">{t("wallet.ledger.colType")}</th>
                                    <th className="p-4 text-xs font-bold text-gray-600">{t("wallet.ledger.colDescription")}</th>
                                    <th className="p-4 text-xs font-bold text-gray-600 text-right">{t("wallet.ledger.colAmount")}</th>
                                    <th className="p-4 text-xs font-bold text-gray-600 text-right">{t("wallet.ledger.colBalance")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {transactions.map((tx) => {
                                    const isDebit = ["PURCHASE", "WITHDRAWAL"].includes(tx.type) || (tx.type === "ADMIN_ADJUSTMENT" && tx.amount < 0);
                                    return (
                                        <tr key={tx.id} className="hover:bg-gray-50/50">
                                            <td className="p-4 text-xs text-gray-600">{formatDateTime(tx.createdAt)}</td>
                                            <td className="p-4 text-xs">
                                                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${isDebit ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                                                    {getTxTypeLabel(tx.type)}
                                                </span>
                                            </td>
                                            <td className="p-4 text-xs text-gray-500">{tx.description}</td>
                                            <td className={`p-4 text-xs font-bold text-right ${isDebit ? "text-red-650" : "text-green-700"}`}>
                                                {isDebit ? "-" : "+"}{formatCurrency(Math.abs(tx.amount))}
                                            </td>
                                            <td className="p-4 text-xs font-semibold text-gray-700 text-right">{formatCurrency(tx.balanceAfter)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                        <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary py-1 px-3 text-xs">{t("wallet.ledger.prev")}</button>
                        <span className="text-xs text-gray-500 font-semibold">{page} / {totalPages} {t("wallet.ledger.page")}</span>
                        <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn-secondary py-1 px-3 text-xs">{t("wallet.ledger.next")}</button>
                    </div>
                )}
            </div>
        </div>
    );
}
