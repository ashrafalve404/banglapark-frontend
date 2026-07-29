"use client";

import { useQuery } from "@tanstack/react-query";
import { Award, RefreshCw, ArrowLeft, TrendingUp } from "lucide-react";
import { walletApi } from "@/lib/api/wallet";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";
import Link from "next/link";

export default function SalesBonusPage() {
    const { locale } = useLocale();
    const isBn = locale === "bn";

    const { data: balanceData, isLoading: balLoading, refetch: refetchBal } = useQuery({
        queryKey: ["wallet-balance"],
        queryFn: () => walletApi.balance(),
    });

    const { data: txData, isLoading: txLoading, refetch: refetchTx } = useQuery({
        queryKey: ["sales-bonus-transactions"],
        queryFn: () => walletApi.transactions({ page: 1, limit: 1, type: "TIER_BONUS" }),
    });

    const latestTx = txData?.transactions?.[0];

    const handleRefresh = () => {
        refetchBal();
        refetchTx();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/wallet" className="text-slate-400 hover:text-slate-600 transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                        <h1 className="text-2xl font-bold text-slate-900">
                            {isBn ? "সেলস বোনাস" : "Sales Bonus"}
                        </h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        {isBn
                            ? "বাংলা পার্কে আপনার ও আপনার টিমের সেলস পারফরম্যান্স অর্জনের উপর অর্জিত সেলস বোনাস"
                            : "Earnings from sales milestones and team sales achievements on Bangla Park"}
                    </p>
                </div>
                <button onClick={handleRefresh} className="btn-secondary self-start py-2 px-3 flex items-center gap-1.5 text-xs cursor-pointer">
                    <RefreshCw size={14} /> {isBn ? "রিফ্রেশ" : "Refresh"}
                </button>
            </div>

            {/* Metric Summary Cards Grid with Light Solid Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Card 1: Total Sales Bonus Balance */}
                <div className="rounded-xl bg-teal-50/80 border border-teal-200/80 p-6 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">
                            {isBn ? "মোট অর্জিত সেলস বোনাস" : "Total Sales Bonus Balance"}
                        </span>
                        <div className="rounded-xl bg-teal-100 p-2.5">
                            <Award size={22} className="text-teal-700" />
                        </div>
                    </div>
                    <div className="text-3xl sm:text-4xl font-extrabold text-teal-950">
                        {balLoading ? "..." : formatCurrency(balanceData?.tierBonus ?? 0, locale)}
                    </div>
                </div>

                {/* Card 2: Latest Bonus Earned */}
                <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/80 p-6 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                            {isBn ? "সর্বশেষ অর্জিত বোনাস" : "Latest Bonus Earned"}
                        </span>
                        <div className="rounded-xl bg-emerald-100 p-2.5">
                            <TrendingUp size={22} className="text-emerald-700" />
                        </div>
                    </div>
                    <div className="text-3xl sm:text-4xl font-extrabold text-emerald-950">
                        {txLoading ? "..." : formatCurrency(latestTx?.amount ?? 0, locale)}
                    </div>
                </div>
            </div>
        </div>
    );
}
