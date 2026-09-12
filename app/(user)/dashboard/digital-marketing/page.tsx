"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Megaphone, Clock, CheckCircle2, Loader2, ShieldCheck, ArrowRight, ExternalLink } from "lucide-react";
import { digitalMarketingApi, type DigitalMarketingPackage } from "@/lib/api/digital-marketing";
import { walletApi } from "@/lib/api/wallet";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

function CountdownTimer({ expiresAt, locale, t }: { expiresAt: string; locale: string; t: (key: string) => string }) {
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

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const todayPurchasesCount = (myData?.purchases ?? []).filter(
        (p) => new Date(p.purchasedAt).getTime() >= startOfToday.getTime()
    ).length;
    const isDailyLimitReached = todayPurchasesCount >= 5;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Megaphone className="text-indigo-600 shrink-0" size={22} />
                        {t("digitalMarketing.title")}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        {t("digitalMarketing.subtitle")}
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold ${
                        isDailyLimitReached
                            ? "bg-red-50 text-red-700 border-red-200"
                            : "bg-indigo-50 text-indigo-700 border-indigo-200"
                    }`}>
                        {locale === "bn" ? `দৈনিক লিমিট: ${todayPurchasesCount}/৫ ব্যবহৃত` : `Daily Limit: ${todayPurchasesCount}/5 Used`}
                    </span>
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

            {/* ── 1. Active Purchases Section (Top Priority) ── */}
            {activePurchases.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-xs sm:text-base md:text-lg font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2">
                        <Clock size={16} className="text-amber-600 shrink-0" />
                        {t("digitalMarketing.activeTitle")}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activePurchases.map((item) => {
                            const amount = Number(item.amount);
                            const dailyProfitPercent = Number(item.dailyProfitPercent ?? 0.5);
                            const dailyProfitAmount = item.dailyProfitAmount ? Number(item.dailyProfitAmount) : Math.round((amount * (dailyProfitPercent / 100)) * 100) / 100;
                            const daysPaid = Number(item.daysPaid ?? 0);
                            const daysTotal = Number(item.daysTotal ?? 365);
                            const totalEarned = Number(item.totalEarned ?? (daysPaid * dailyProfitAmount));

                            return (
                                <div key={item.id} className="card p-4 bg-gradient-to-br from-indigo-50/60 to-white border border-indigo-100 space-y-3 shadow-xs">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="font-bold text-slate-900 text-sm">{item.package?.title || "Digital Marketing Package"}</h3>
                                        <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200 shrink-0">
                                            <Clock size={11} /> {daysPaid} / {daysTotal} {locale === "bn" ? "দিন পরিশোধিত" : "Days Paid"}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-slate-100 text-center">
                                        <div>
                                            <span className="text-[10px] text-slate-400 block font-semibold">{locale === "bn" ? "বিনিয়োগকৃত পরিমাণ" : "Invested Amount"}</span>
                                            <span className="text-xs font-bold text-slate-900">{formatCurrency(amount, locale)}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 block font-semibold">{locale === "bn" ? "দৈনিক ০.৫% লাভ" : "Daily 0.5% Profit"}</span>
                                            <span className="text-xs font-bold text-amber-700">+ {formatCurrency(dailyProfitAmount, locale)} / {locale === "bn" ? "দিন" : "day"}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 block font-semibold">{locale === "bn" ? "মোট অর্জিত" : "Total Earned"}</span>
                                            <span className="text-xs font-bold text-emerald-700">{formatCurrency(totalEarned, locale)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                                        <span>{locale === "bn" ? "ক্রয়ের তারিখ" : "Purchased Date"}: {formatDateTime(item.purchasedAt, locale)}</span>
                                        <span className="text-indigo-600 font-semibold">{locale === "bn" ? "মেয়াদ: ৩৬৫ সক্রিয় দিন" : "Term: 365 Active Days"}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── 2. Available Packages Grid ── */}
            <div className="space-y-3">
                <h2 className="text-xs sm:text-base md:text-lg font-bold text-slate-900 flex items-center gap-1.5 sm:gap-2">
                    <Megaphone size={16} className="text-indigo-600 shrink-0" />
                    {t("digitalMarketing.availableTitle")}
                </h2>

                {pkgLoading ? (
                    <div className="py-16 text-center text-slate-400">{locale === "bn" ? "প্যাকেজ লোড হচ্ছে..." : "Loading packages..."}</div>
                ) : !packages || packages.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">{locale === "bn" ? "কোনো প্যাকেজ পাওয়া যায়নি" : "No marketing packages currently available"}</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {packages.map((pkg) => {
                            const price = Number(pkg.price);
                            const dailyProfitPercent = Number(
                                pkg.dailyProfitPercent && Number(pkg.dailyProfitPercent) >= 0.5
                                    ? pkg.dailyProfitPercent
                                    : (pkg.profitPercent && Number(pkg.profitPercent) >= 0.5 ? pkg.profitPercent : 0.5)
                            );
                            const daysTotal = Number(pkg.durationDays ?? 365);
                            const dailyProfitAmount = Math.round((price * (dailyProfitPercent / 100)) * 100) / 100;
                            const totalReturnPotential = Math.round((dailyProfitAmount * daysTotal) * 100) / 100;
                            const canAfford = availableBalance >= price;

                            return (
                                <div key={pkg.id} className="card p-5 bg-white border border-slate-200 hover:border-indigo-300 transition-all flex flex-col justify-between space-y-4 shadow-xs hover:shadow-md">
                                    <div className="space-y-3">
                                        {pkg.image && (
                                            <div className="w-full h-40 rounded-xl overflow-hidden bg-slate-900/5 border border-slate-200 flex items-center justify-center p-1">
                                                <img src={pkg.image} alt={pkg.title} className="w-full h-full object-contain rounded-lg" />
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
                                                {locale === "bn" ? "দৈনিক ০.৫% লাভ (৩৬৫ দিন)" : "Daily 0.5% Profit (365 Days)"}
                                            </span>
                                            <ShieldCheck size={18} className="text-emerald-600" />
                                        </div>

                                        <h3 className="text-base font-bold text-slate-900">{pkg.title}</h3>
                                        {pkg.description && <p className="text-xs text-slate-500 line-clamp-2">{pkg.description}</p>}

                                        {pkg.link && (
                                            <a
                                                href={pkg.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-all"
                                            >
                                                <ExternalLink size={13} /> {locale === "bn" ? "ক্যাম্পেইন লিংক" : "View Link"}
                                            </a>
                                        )}

                                         {/* Financial Breakdown - Clean & Essential Info Only */}
                                        <div className="bg-slate-50 rounded-xl p-3.5 space-y-2 text-xs border border-slate-100">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500 font-medium">{locale === "bn" ? "প্যাকেজ মূল্য:" : "Package Price:"}</span>
                                                <span className="font-bold text-slate-900 text-sm">{formatCurrency(price, locale)}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-emerald-700 font-bold">
                                                <span>{locale === "bn" ? "দৈনিক লাভ (০.৫%):" : "Daily Profit (0.5%):"}</span>
                                                <span>+{formatCurrency(dailyProfitAmount, locale)} / {locale === "bn" ? "দিন" : "day"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setSelectedPkg(pkg)}
                                        disabled={!canAfford || isDailyLimitReached}
                                        className="w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all shadow-xs"
                                    >
                                        {isDailyLimitReached ? (
                                            locale === "bn" ? "দৈনিক লিমিট শেষ (সর্বোচ্চ ৫টি/দিন)" : "Daily Limit Reached (Max 5/Day)"
                                        ) : canAfford ? (
                                            <>
                                                {t("digitalMarketing.buyPackage")} <ArrowRight size={14} />
                                            </>
                                        ) : (
                                            t("digitalMarketing.insufficientBalance")
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
                        <h3 className="text-sm font-bold text-slate-800">{t("digitalMarketing.completedTitle")}</h3>
                        <span className="text-xs font-semibold text-slate-500">{completedPurchases.length} {locale === "bn" ? "টি সম্পন্ন" : "completed"}</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-bold uppercase">
                                    <th className="p-3.5">Package</th>
                                    <th className="p-3.5">Purchased Date</th>
                                    <th className="p-3.5 text-right">Investment</th>
                                    <th className="p-3.5 text-right">Daily Profit (0.5%)</th>
                                    <th className="p-3.5 text-right">Total Earned (365 Days)</th>
                                    <th className="p-3.5 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {completedPurchases.map((item) => {
                                    const amount = Number(item.amount);
                                    const dailyProfitPercent = Number(item.dailyProfitPercent ?? 0.5);
                                    const dailyProfitAmount = item.dailyProfitAmount ? Number(item.dailyProfitAmount) : Math.round((amount * (dailyProfitPercent / 100)) * 100) / 100;
                                    const totalEarned = Number(item.totalEarned ?? (365 * dailyProfitAmount));

                                    return (
                                        <tr key={item.id} className="hover:bg-slate-50/50">
                                            <td className="p-3.5 font-bold text-slate-900">{item.package?.title || "Digital Marketing"}</td>
                                            <td className="p-3.5 text-slate-500 whitespace-nowrap">{formatDateTime(item.purchasedAt, locale)}</td>
                                            <td className="p-3.5 text-right font-bold text-slate-800">{formatCurrency(amount, locale)}</td>
                                            <td className="p-3.5 text-right font-bold text-amber-700">+ {formatCurrency(dailyProfitAmount, locale)} / {locale === "bn" ? "দিন" : "day"}</td>
                                            <td className="p-3.5 text-right font-black text-emerald-700">{formatCurrency(totalEarned, locale)}</td>
                                            <td className="p-3.5 text-center">
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                                    <CheckCircle2 size={11} /> 365 Days Completed
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Purchase Confirmation Modal ── */}
            {selectedPkg && (() => {
                const price = Number(selectedPkg.price);
                const dailyProfitPercent = Number(
                    selectedPkg.dailyProfitPercent && Number(selectedPkg.dailyProfitPercent) >= 0.5
                        ? selectedPkg.dailyProfitPercent
                        : (selectedPkg.profitPercent && Number(selectedPkg.profitPercent) >= 0.5 ? selectedPkg.profitPercent : 0.5)
                );
                const daysTotal = Number(selectedPkg.durationDays ?? 365);
                const dailyProfitAmount = Math.round((price * (dailyProfitPercent / 100)) * 100) / 100;
                const totalReturnPotential = Math.round((dailyProfitAmount * daysTotal) * 100) / 100;

                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-bold text-slate-900">{t("digitalMarketing.confirmTitle")}</h3>
                                <button onClick={() => setSelectedPkg(null)} className="text-slate-400 hover:text-slate-600 text-xl leading-none cursor-pointer">✕</button>
                            </div>

                            <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-4 space-y-2.5 text-xs">
                                <p className="font-bold text-indigo-950 text-base">{selectedPkg.title}</p>
                                <div className="flex justify-between text-slate-600 border-t border-indigo-150 pt-2">
                                    <span>{locale === "bn" ? "ওয়ালেট থেকে কাটা হবে:" : "Deducted from Wallet:"}</span>
                                    <span className="font-bold text-slate-900 text-sm">{formatCurrency(price, locale)}</span>
                                </div>
                                <div className="flex justify-between text-emerald-800 font-bold">
                                    <span>{locale === "bn" ? "দৈনিক লাভ (০.৫%/দিন):" : "Daily Profit (0.5%/day):"}</span>
                                    <span className="text-emerald-700">+{formatCurrency(dailyProfitAmount, locale)} / {locale === "bn" ? "দিন" : "day"}</span>
                                </div>
                                <p className="text-[11px] text-slate-500 pt-1.5 border-t border-indigo-150/70 leading-relaxed">
                                    {locale === "bn"
                                        ? "💡 আপনার অ্যাকাউন্ট সক্রিয় থাকা অবস্থায় প্রতিদিন ০.৫% ওয়ালেটে জমা হবে (৩৬৫ দিন)।"
                                        : "💡 Daily 0.5% profit will be credited to your wallet for 365 active days."}
                                </p>
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
                                    {t("digitalMarketing.confirmPay")}
                                </button>
                                <button onClick={() => setSelectedPkg(null)} className="px-4 py-3 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                                    {t("digitalMarketing.cancel")}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
