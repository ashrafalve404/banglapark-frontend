"use client";

import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Users, RefreshCw, ArrowLeft } from "lucide-react";
import { walletApi } from "@/lib/api/wallet";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";
import Link from "next/link";

export default function GenerationIncomePage() {
    const { locale } = useLocale();
    const isBn = locale === "bn";

    const { data: balanceData, isLoading: balLoading, refetch: refetchBal } = useQuery({
        queryKey: ["wallet-balance"],
        queryFn: () => walletApi.balance(),
    });

    const handleRefresh = () => {
        refetchBal();
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
                            {isBn ? "জেনারেশন বোনাস" : "Generation Bonus"}
                        </h1>
                    </div>
                    <p className="text-sm text-slate-500 mt-1">
                        {isBn
                            ? "আপনার টিম স্পনসর নেটওয়ার্কের সদস্যবৃন্দের ক্রয় থেকে অর্জিত মোট বোনাস"
                            : "Bonuses earned from sales across your multi-level referral network"}
                    </p>
                </div>
                <button onClick={handleRefresh} className="btn-secondary self-start py-2 px-3 flex items-center gap-1.5 text-xs cursor-pointer">
                    <RefreshCw size={14} /> {isBn ? "রিফ্রেশ" : "Refresh"}
                </button>
            </div>

            {/* Metric Summary Cards Grid with Light Solid Colors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Card 1: Total Generation Income Balance */}
                <div className="rounded-xl bg-blue-50/80 border border-blue-200/80 p-6 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                            {isBn ? "মোট অর্জিত জেনারেশন বোনাস" : "Total Generation Bonus Balance"}
                        </span>
                        <div className="rounded-xl bg-blue-100 p-2.5">
                            <TrendingUp size={22} className="text-blue-700" />
                        </div>
                    </div>
                    <div className="text-3xl sm:text-4xl font-extrabold text-blue-950">
                        {balLoading ? "..." : formatCurrency(balanceData?.generationIncome ?? 0, locale)}
                    </div>
                </div>

                {/* Card 2: Active Network Levels */}
                <div className="rounded-xl bg-indigo-50/80 border border-indigo-200/80 p-6 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
                            {isBn ? "সক্রিয় রেফারেল লেভেল সীমা" : "Active Network Coverage"}
                        </span>
                        <div className="rounded-xl bg-indigo-100 p-2.5">
                            <Users size={22} className="text-indigo-700" />
                        </div>
                    </div>
                    <div className="text-3xl sm:text-4xl font-extrabold text-indigo-950">
                        {isBn ? "লেভেল ১ - ১০" : "Level 1 - 10"}
                    </div>
                </div>
            </div>
        </div>
    );
}
