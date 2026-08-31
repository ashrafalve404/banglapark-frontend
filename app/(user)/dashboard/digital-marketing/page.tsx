"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Megaphone, TrendingUp, Clock, CheckCircle2, AlertCircle, Loader2, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";
import { digitalMarketingApi, type DigitalMarketingPackage, type DigitalMarketingPurchase } from "@/lib/api/digital-marketing";
import { walletApi } from "@/lib/api/wallet";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

function CountdownTimer({ expiresAt, locale }: { expiresAt: string; locale: string }) {
    const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number; isExpired: boolean }>({
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: false,
    });

    useEffect(() => {
        const updateTimer = () => {
            const diff = new Date(expiresAt).getTime() - Date.now();
            if (diff <= 0) {
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true });
                return;
            }
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft({ hours, minutes, seconds, isExpired: false });
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [expiresAt]);

    if (timeLeft.isExpired) {
        return (
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 size={12} /> {locale === "bn" ? "প্রসেসিং হচ্ছে (অনবিলম্বে ওয়ালেটে যোগ হবে)" : "Processing Return..."}
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
            <Clock size={12} className="animate-spin" />
            {String(timeLeft.hours).padStart(2, "0")}:{String(timeLeft.minutes).padStart(2, "0")}:{String(timeLeft.seconds).padStart(2, "0")} {locale === "bn" ? "বাকি" : "remaining"}
        </span>
    );
}

export default function DigitalMarketingPage() {
    const { t, locale } = useLocale();
    const queryClient = useQueryClient();
    const [selectedPkg, setSelectedPkg] = useState<DigitalMarketingPackage | null>(null);
    const [successMessage, setSuccessMessage] = useState("");

    const { data: packages, isLoading: pkgLoading } = useQuery({
        queryKey: ["dm-packages"],
        queryFn: () => digitalMarketingApi.getPackages(),
    });

    const { data: balanceData } = useQuery({
        queryKey: ["wallet-balance"],
        queryFn: () => walletApi.balance(),
    });

    const { data: myData, isLoading: myLoading, refetch: refetchMy } = useQuery({
        queryKey: ["dm-my-purchases"],
        queryFn: () => digitalMarketingApi.getMyPurchases(),
        refetchInterval: 10000,
    });

    const purchaseMutation = useMutation({
        mutationFn: (packageId: string) => digitalMarketingApi.purchase(packageId),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
            queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
            refetchMy();
            setSuccessMessage(res.message);
            setSelectedPkg(null);
        },
    });

    const availableBalance = Number(balanceData?.availableBalance ?? 0);
    const activePurchases = myData?.active ?? [];
    const completedPurchases = myData?.completed ?? [];

    const totalActiveInvested = activePurchases.reduce((sum, p) => sum + Number(p.amount), 0);
    const totalCompletedEarned = completedPurchases.reduce((sum, p) => sum + Number(p.profitAmount), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Megaphone className="text-indigo-600" />
                        {locale === "bn" ? "ডিজিটাল মার্কেটিং প্যাকেজ" : "Digital Marketing Packages"}
                    </h1>
                    <p className="text-sm text-slate-500">
                        {locale === "bn"
                            ? "পছন্দের প্যাকেজ ক্রয় করুন — ২৪ ঘণ্টা পর আপনার মূল টাকা + ১% অতিরিক্ত প্রফিট ওয়ালেটে যোগ হবে।"
                            : "Purchase marketing packages and receive your principal amount + 1% profit back in your wallet after 24 hours."}
                    </p>
                </div>
            </div>

            {/* Success Alert */}
            {successMessage && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                        <p className="text-xs font-bold text-emerald-900">{successMessage}</p>
                    </div>
                    <button onClick={() => setSuccessMessage("")} className="text-xs text-emerald-700 font-bold hover:underline">✕</button>
                </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card p-5 bg-white flex items-center justify-between">
                    <div>
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                            {locale === "bn" ? "ওয়ালেট ব্যালেন্স" : "Wallet Balance"}
                        </span>
                        <span className="text-2xl font-bold text-slate-900">
                            {formatCurrency(availableBalance, locale)}
                        </span>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
                        <TrendingUp size={22} />
                    </div>
                </div>

                <div className="card p-5 bg-white flex items-center justify-between">
                    <div>
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                            {locale === "bn" ? "সক্রিয় প্যাকেজ ইনভেস্টমেন্ট" : "Active Investments"}
                        </span>
                        <span className="text-2xl font-bold text-amber-700">
                            {formatCurrency(totalActiveInvested, locale)}
                        </span>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                        <Clock size={22} />
                    </div>
                </div>

                <div className="card p-5 bg-white flex items-center justify-between">
                    <div>
                        <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                            {locale === "bn" ? "মোট অর্জিত প্রফিট (১%)" : "Total Profit Earned"}
                        </span>
                        <span className="text-2xl font-bold text-emerald-700">
                            {formatCurrency(totalCompletedEarned, locale)}
                        </span>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                        <Sparkles size={22} />
                    </div>
                </div>
            </div>

            {/* ── Active Purchases Section ── */}
            {activePurchases.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Clock size={18} className="text-amber-600" />
                        {locale === "bn" ? "আপনার সক্রিয় প্যাকেজসমূহ (২৪ ঘণ্টা পেআউট টাইমার)" : "Active Package Returns (24-Hour Timer)"}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activePurchases.map((item) => (
                            <div key={item.id} className="card p-5 bg-gradient-to-br from-indigo-50/60 to-white border border-indigo-100 space-y-3 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-bold text-slate-900 text-sm">{item.package?.title || "Digital Marketing Package"}</h3>
                                    <CountdownTimer expiresAt={item.maturesAt} locale={locale} />
                                </div>
                                <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-slate-100 text-center">
                                    <div>
                                        <span className="text-[10px] text-slate-400 block font-semibold">{locale === "bn" ? "পেমেন্ট পরিমাণ" : "Paid Amount"}</span>
                                        <span className="text-xs font-bold text-slate-900">{formatCurrency(item.amount, locale)}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 block font-semibold">{locale === "bn" ? "+ ১% প্রফিট" : "+ 1% Profit"}</span>
                                        <span className="text-xs font-bold text-amber-700">+ {formatCurrency(item.profitAmount, locale)}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 block font-semibold">{locale === "bn" ? "২৪h মোট ফেরত" : "24h Return"}</span>
                                        <span className="text-xs font-bold text-emerald-700">{formatCurrency(item.totalReturn, locale)}</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                                    <span>{locale === "bn" ? "ক্রয়ের সময়:" : "Purchased:"} {formatDateTime(item.purchasedAt, locale)}</span>
                                    <span>{locale === "bn" ? "ফেরতের সময়:" : "Return Time:"} {formatDateTime(item.maturesAt, locale)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Available Packages Grid ── */}
            <div className="space-y-3">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Megaphone size={18} className="text-indigo-600" />
                    {locale === "bn" ? "প্যাকেজ নির্বাচন করুন" : "Available Marketing Packages"}
                </h2>

                {pkgLoading ? (
                    <div className="py-16 text-center text-slate-400">{locale === "bn" ? "প্যাকেজ লোড হচ্ছে..." : "Loading packages..."}</div>
                ) : !packages || packages.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">{locale === "bn" ? "কোনো প্যাকেজ পাওয়া যায়নি" : "No marketing packages currently available"}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {packages.map((pkg) => {
                            const price = Number(pkg.price);
                            const profitPercent = Number(pkg.profitPercent ?? 1.0);
                            const profitAmount = Math.round((price * (profitPercent / 100)) * 100) / 100;
                            const totalReturn = Math.round((price + profitAmount) * 100) / 100;
                            const canAfford = availableBalance >= price;

                            return (
                                <div key={pkg.id} className="card p-6 bg-white border border-slate-200 hover:border-indigo-300 transition-all flex flex-col justify-between space-y-5 shadow-xs hover:shadow-md">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                                                {locale === "bn" ? "২৪ ঘণ্টার জন্য +১% ফেরত" : "24h Return (+1%)"}
                                            </span>
                                            <ShieldCheck size={18} className="text-emerald-600" />
                                        </div>

                                        <h3 className="text-lg font-bold text-slate-900">{pkg.title}</h3>
                                        {pkg.description && <p className="text-xs text-slate-500 line-clamp-2">{pkg.description}</p>}

                                        {/* Financial Breakdown */}
                                        <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-xs border border-slate-100">
                                            <div className="flex items-center justify-between text-slate-600">
                                                <span>{locale === "bn" ? "প্যাকেজ মূল্য (ওয়ালেট পেমেন্ট):" : "Package Price (Wallet Payment):"}</span>
                                                <span className="font-bold text-slate-900 text-sm">{formatCurrency(price, locale)}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-amber-700">
                                                <span>{locale === "bn" ? "১% অতিরিক্ত বোনাস প্রফিট:" : "1% Bonus Profit:"}</span>
                                                <span className="font-bold">+ {formatCurrency(profitAmount, locale)}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-emerald-800 font-bold border-t border-slate-200 pt-2 text-sm">
                                                <span>{locale === "bn" ? "২৪ ঘণ্টা পর মোট ফেরত পাব:" : "24h Total Return Amount:"}</span>
                                                <span>{formatCurrency(totalReturn, locale)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setSelectedPkg(pkg)}
                                        disabled={!canAfford}
                                        className="w-full py-3 flex items-center justify-center gap-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shadow-xs"
                                    >
                                        {canAfford ? (
                                            <>
                                                {locale === "bn" ? "প্যাকেজ ক্রয় করুন" : "Buy Package Now"} <ArrowRight size={14} />
                                            </>
                                        ) : (
                                            locale === "bn" ? "পর্যাপ্ত ব্যালেন্স নেই" : "Insufficient Wallet Balance"
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Completed Returns History ── */}
            {completedPurchases.length > 0 && (
                <div className="card overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-800">{locale === "bn" ? "সম্পন্ন হওয়া ২৪ ঘণ্টার প্রফিট ফেরত হিস্টোরি" : "Completed 24-Hour Return History"}</h3>
                        <span className="text-xs font-semibold text-slate-500">{completedPurchases.length} {locale === "bn" ? "টি সম্পন্ন" : "completed"}</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-bold uppercase">
                                    <th className="p-3.5">Package</th>
                                    <th className="p-3.5">Purchased Date</th>
                                    <th className="p-3.5 text-right">Investment</th>
                                    <th className="p-3.5 text-right">1% Profit</th>
                                    <th className="p-3.5 text-right">Total Returned</th>
                                    <th className="p-3.5 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {completedPurchases.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50">
                                        <td className="p-3.5 font-bold text-slate-900">{item.package?.title || "Digital Marketing"}</td>
                                        <td className="p-3.5 text-slate-500 whitespace-nowrap">{formatDateTime(item.purchasedAt, locale)}</td>
                                        <td className="p-3.5 text-right font-bold text-slate-800">{formatCurrency(item.amount, locale)}</td>
                                        <td className="p-3.5 text-right font-bold text-amber-700">+ {formatCurrency(item.profitAmount, locale)}</td>
                                        <td className="p-3.5 text-right font-black text-emerald-700">{formatCurrency(item.totalReturn, locale)}</td>
                                        <td className="p-3.5 text-center">
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                                <CheckCircle2 size={11} /> Completed & Credited
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Purchase Confirmation Modal ── */}
            {selectedPkg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900">{locale === "bn" ? "প্যাকেজ ক্রয়ের নিশ্চিতকরণ" : "Confirm Package Purchase"}</h3>
                            <button onClick={() => setSelectedPkg(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none cursor-pointer">✕</button>
                        </div>

                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-2 text-xs">
                            <p className="font-bold text-indigo-900 text-sm">{selectedPkg.title}</p>
                            <div className="flex justify-between text-slate-600 border-t border-indigo-100 pt-2">
                                <span>{locale === "bn" ? "ওয়ালেট থেকে কাটা হবে:" : "Deducted from Wallet:"}</span>
                                <span className="font-bold text-slate-900">{formatCurrency(selectedPkg.price, locale)}</span>
                            </div>
                            <div className="flex justify-between text-amber-700">
                                <span>{locale === "bn" ? "১% প্রফিট বোনাস:" : "1% Profit Bonus:"}</span>
                                <span className="font-bold">+ {formatCurrency(Math.round((Number(selectedPkg.price) * 0.01) * 100) / 100, locale)}</span>
                            </div>
                            <div className="flex justify-between text-emerald-800 font-bold border-t border-indigo-100 pt-2 text-sm">
                                <span>{locale === "bn" ? "২৪ ঘণ্টা পর রিটার্ন পাবেন:" : "24h Return Amount:"}</span>
                                <span>{formatCurrency(Math.round((Number(selectedPkg.price) * 1.01) * 100) / 100, locale)}</span>
                            </div>
                        </div>

                        {purchaseMutation.isError && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-semibold">
                                {(purchaseMutation.error as any)?.response?.data?.message || (locale === "bn" ? "ক্রয় সম্পন্ন করা ব্যর্থ হয়েছে" : "Purchase failed")}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => purchaseMutation.mutate(selectedPkg.id)}
                                disabled={purchaseMutation.isPending}
                                className="flex-1 py-3 flex items-center justify-center gap-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 cursor-pointer transition-all"
                            >
                                {purchaseMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Megaphone size={16} />}
                                {locale === "bn" ? "নিশ্চিত করুন ও ওয়ালেট থেকে পেমেন্ট দিন" : "Confirm & Pay with Wallet"}
                            </button>
                            <button onClick={() => setSelectedPkg(null)} className="px-4 py-3 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                                {locale === "bn" ? "বাতিল" : "Cancel"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
