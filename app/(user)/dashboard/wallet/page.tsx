"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { Wallet, AlertCircle, RefreshCw, Gift, TrendingUp, Award, DollarSign, MapPin, PieChart, Users, ShieldCheck, Plane, ShoppingBag, SendHorizontal, CheckCircle2, Loader2, Search, PlusCircle, Clock, XCircle } from "lucide-react";
import { walletApi } from "@/lib/api/wallet";
import { depositApi, type DepositRequest } from "@/lib/api/deposit";
import { referralApi } from "@/lib/api/categories";
import { commissionsApi } from "@/lib/api/commissions";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/store/auth";
import { formatCurrency, formatDateTime, formatDate } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

export default function WalletPage() {
    const { user } = useAuthStore();
    const { t, locale } = useLocale();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [type, setType] = useState("");

    // Transfer modal state
    const [showTransfer, setShowTransfer] = useState(false);
    const [transferPhone, setTransferPhone] = useState("");
    const [transferAmount, setTransferAmount] = useState("");
    const [transferRecipient, setTransferRecipient] = useState<{ name: string; phone: string } | null>(null);
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState("");
    const [transferSuccess, setTransferSuccess] = useState("");

    // Deposit (Bkash top-up) modal state
    const [showDeposit, setShowDeposit] = useState(false);
    const [depositAmount, setDepositAmount] = useState("");
    const [depositTxId, setDepositTxId] = useState("");
    const [depositPhone, setDepositPhone] = useState("");
    const [depositSuccess, setDepositSuccess] = useState(false);

    const isInactive = user?.status === "INACTIVE";

    const { data: referralStats, isLoading: refLoading } = useQuery({
        queryKey: ["referral-stats"],
        queryFn: () => referralApi.teamStats(),
        refetchOnWindowFocus: true,
    });

    const { data: activation } = useQuery({
        queryKey: ["my-activation"],
        queryFn: () => authApi.activation(),
        refetchOnWindowFocus: true,
        staleTime: 60_000,
    });

    const activeDays = activation?.daysLeft ?? 0;
    const activeUntilDate = activation?.activeUntil ?? user?.activeUntil;
    const isExpiringSoon = activeDays > 0 && activeDays <= 5;

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

    const [commPage, setCommPage] = useState(1);
    const { data: commData, isLoading: commLoading } = useQuery({
        queryKey: ["wallet-commissions", commPage],
        queryFn: () => commissionsApi.my({ page: commPage, limit: 10 }),
    });

    const commissions = commData?.commissions ?? [];
    const commTotal = commData?.total ?? 0;
    const commTotalPages = Math.ceil(commTotal / 10) || 1;

    const handleRefresh = () => {
        refetchBal();
        refetchTx();
    };

    const handlePhoneLookup = async (phone: string) => {
        setTransferRecipient(null);
        setLookupError("");
        if (phone.length < 11) return;
        setLookupLoading(true);
        try {
            const result = await walletApi.lookupUser(phone);
            if (result.phone === user?.phone) {
                setLookupError(locale === "bn" ? "নিজের নম্বরে ট্রান্সফার করা যাবে না" : "You cannot transfer to yourself");
            } else {
                setTransferRecipient(result);
            }
        } catch {
            setLookupError(locale === "bn" ? "এই নম্বরে কোনো ব্যবহারকারী পাওয়া যায়নি" : "No user found with this phone number");
        } finally {
            setLookupLoading(false);
        }
    };

    const transferMutation = useMutation({
        mutationFn: (body: { recipientPhone: string; amount: number }) => walletApi.transfer(body),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
            queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
            setTransferSuccess(res.message);
            setTransferPhone("");
            setTransferAmount("");
            setTransferRecipient(null);
            setLookupError("");
        },
    });

    const { data: adminInfo } = useQuery({
        queryKey: ["deposit-admin-info"],
        queryFn: () => depositApi.getAdminInfo(),
        staleTime: Infinity,
    });

    const { data: myDeposits, refetch: refetchDeposits } = useQuery({
        queryKey: ["my-deposits"],
        queryFn: () => depositApi.getMyRequests({ limit: 5 }),
    });

    const depositMutation = useMutation({
        mutationFn: (body: { amount: number; transactionId: string; senderPhone: string }) => depositApi.submit(body),
        onSuccess: () => {
            setDepositSuccess(true);
            setDepositAmount("");
            setDepositTxId("");
            setDepositPhone("");
            refetchDeposits();
        },
    });

    return (
        <>
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t("wallet.heading")}</h1>
                    <p className="text-sm text-gray-500">{t("wallet.subheading")}</p>
                </div>
                <button onClick={handleRefresh} className="btn-secondary self-start py-2 px-3 flex items-center gap-1.5 text-xs">
                    <RefreshCw size={14} /> {t("wallet.refresh")}
                </button>
                <button
                    onClick={() => { setShowTransfer(true); setTransferSuccess(""); }}
                    className="self-start py-2 px-4 flex items-center gap-1.5 text-xs font-bold text-white bg-red-700 hover:bg-red-800 rounded-lg transition-all shadow-xs"
                >
                    <SendHorizontal size={14} /> {locale === "bn" ? "ব্যালেন্স ট্রান্সফার" : "Transfer Balance"}
                </button>
                <button
                    onClick={() => { setShowDeposit(true); setDepositSuccess(false); depositMutation.reset(); }}
                    className="self-start py-2 px-4 flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-all shadow-xs"
                >
                    <PlusCircle size={14} /> {locale === "bn" ? "টাকা যোগ করুন" : "Add Money"}
                </button>
            </div>

            {isInactive && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-5 flex items-center gap-3.5">
                    <AlertCircle size={24} className="text-red-600 flex-shrink-0" />
                    <div>
                        <h3 className="font-bold text-red-800 text-sm">{t("wallet.inactiveAlert.title")}</h3>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
                <div className="card p-5 bg-gradient-to-br from-green-900 to-green-800 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] text-green-100 font-semibold uppercase tracking-wider">{t("wallet.balance.total")}</span>
                        <Wallet size={18} className="text-green-300" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-white">
                        {balLoading ? "..." : formatCurrency(balanceData?.balance ?? 0, locale)}
                    </h2>
                </div>

                <div className="card p-5 bg-gradient-to-br from-purple-900 to-purple-800 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] text-purple-100 font-semibold uppercase tracking-wider">{t("wallet.balance.dailyReward")}</span>
                        <Gift size={18} className="text-purple-300" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-white">
                        {balLoading ? "..." : formatCurrency(balanceData?.dailyReward ?? 0, locale)}
                    </h2>
                </div>

                <div className="card p-5 bg-gradient-to-br from-indigo-900 to-indigo-800 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] text-indigo-100 font-semibold uppercase tracking-wider">{t("wallet.balance.tierBonus")}</span>
                        <Award size={18} className="text-indigo-300" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-white">
                        {balLoading ? "..." : formatCurrency(balanceData?.tierBonus ?? 0, locale)}
                    </h2>
                </div>

                <div className="card p-5 bg-gradient-to-br from-blue-900 to-blue-800 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] text-blue-100 font-semibold uppercase tracking-wider">{t("wallet.balance.generationIncome")}</span>
                        <TrendingUp size={18} className="text-blue-300" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-white">
                        {balLoading ? "..." : formatCurrency(balanceData?.generationIncome ?? 0, locale)}
                    </h2>
                </div>

                <div className="card p-5 bg-gradient-to-br from-amber-900 to-amber-800 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] text-amber-100 font-semibold uppercase tracking-wider">{t("wallet.balance.quizEarning")}</span>
                        <TrendingUp size={18} className="text-amber-300" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-white">
                        {balLoading ? "..." : formatCurrency(balanceData?.quizEarning ?? 0, locale)}
                    </h2>
                </div>

                <div className="card p-5 bg-gradient-to-br from-teal-900 to-teal-800 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] text-teal-100 font-semibold uppercase tracking-wider">
                            {locale === "bn" ? "পোডাক্ট বিক্রয় আয়" : "Product Sales"}
                        </span>
                        <ShoppingBag size={18} className="text-teal-300" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-white">
                        {balLoading ? "..." : formatCurrency(balanceData?.productSalesIncome ?? 0, locale)}
                    </h2>
                </div>

                <div className="card p-5 bg-white border border-gray-150">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{t("wallet.balance.pending")}</span>
                        <AlertCircle size={18} className="text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-gray-800">
                        {balLoading ? "..." : formatCurrency(balanceData?.pendingWithdrawal ?? 0, locale)}
                    </h2>
                </div>

                <div className="card p-5 bg-green-50/50 border border-green-100">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] text-green-700 font-semibold uppercase tracking-wider">{t("wallet.balance.available")}</span>
                        <Wallet size={18} className="text-green-700" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-green-800">
                        {balLoading ? "..." : formatCurrency(balanceData?.availableBalance ?? 0, locale)}
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
                        {balLoading ? "..." : formatCurrency(balanceData?.reward ?? 0, locale)}
                    </h2>
                </div>
                <div className="card p-4 border border-dashed border-gray-200 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{t("wallet.balance.salary")}</span>
                        <DollarSign size={16} className="text-gray-300" />
                    </div>
                    <h2 className="text-xl font-extrabold text-gray-400">
                        {balLoading ? "..." : formatCurrency(balanceData?.salary ?? 0, locale)}
                    </h2>
                </div>
                <Link href="/dashboard/travel" className="card p-4 border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50 transition-all group">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">{t("wallet.balance.travelling")}</span>
                        <Plane size={16} className="text-indigo-600 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-900 group-hover:underline">Check Eligibility & Destination →</span>
                    </div>
                </Link>
                <div className="card p-4 border border-dashed border-gray-200 bg-gray-50/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">{t("wallet.balance.share")}</span>
                        <PieChart size={16} className="text-gray-300" />
                    </div>
                    <h2 className="text-xl font-extrabold text-gray-400">
                        {balLoading ? "..." : formatCurrency(balanceData?.share ?? 0, locale)}
                    </h2>
                </div>
            </div>

            <div className="card p-5">
                <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">{t("dashboard.quickLinks.heading")}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { href: "/dashboard/wallet", title: t("dashboard.quickLinks.wallet"), bg: "bg-green-50", text: "text-green-800" },
                        { href: "/dashboard/withdraw", title: t("dashboard.quickLinks.withdraw"), bg: "bg-blue-50", text: "text-blue-800" },
                        { href: "/dashboard/referrals", title: t("dashboard.quickLinks.referrals"), bg: "bg-amber-50", text: "text-amber-800" },
                        { href: "/dashboard/orders", title: t("dashboard.quickLinks.orders"), bg: "bg-purple-50", text: "text-purple-800" },
                    ].map((lnk) => (
                        <Link key={lnk.href} href={lnk.href} className={`rounded-xl p-4 text-center ${lnk.bg} hover:-translate-y-0.5 transition-transform flex flex-col justify-center items-center`}>
                            <span className={`text-sm font-bold ${lnk.text}`}>{lnk.title}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Team Stats + Activation */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card p-5 flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">{t("dashboard.card.teamMembers")}</span>
                        <span className="text-2xl font-extrabold text-gray-900 block">
                            {refLoading ? "..." : referralStats?.teamSize ?? 0}
                        </span>
                    </div>
                    <div className="rounded-lg bg-green-50 p-2.5 text-green-800">
                        <Users size={20} />
                    </div>
                </div>

                <div className="card p-5 flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">{t("dashboard.card.activeTeamMembers")}</span>
                        <span className="text-2xl font-extrabold text-gray-900 block">
                            {refLoading ? "..." : referralStats?.activeTeam ?? 0}
                        </span>
                    </div>
                    <div className="rounded-lg bg-green-50 p-2.5 text-green-800">
                        <Users size={20} />
                    </div>
                </div>

                <div className="card p-5 flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">{t("dashboard.card.activationEnd")}</span>
                        <span className="text-sm font-semibold text-gray-800 block">
                            {activeUntilDate ? formatDate(activeUntilDate, locale) : t("dashboard.card.activationEndNone")}
                        </span>
                        {!isInactive && (
                            <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full inline-block">
                                {t("dashboard.card.daysRemaining")} {activeDays} {t("dashboard.card.daysUnit")}
                            </span>
                        )}
                    </div>
                    <div className="rounded-lg bg-green-50 p-2.5 text-green-800">
                        <ShieldCheck size={20} />
                    </div>
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
                    <h3 className="text-base font-bold text-gray-800">{t("wallet.ledger.heading")}</h3>

                    <select className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-green-700 w-full sm:w-44" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
                        <option value="">{t("wallet.ledger.filterAll")}</option>
                        <option value="GENERATION_COMMISSION">{t("wallet.ledger.filterGeneration")}</option>
                        <option value="DAILY_BENEFIT">{t("wallet.ledger.filterDailyBenefit")}</option>
                        <option value="GIFT_CARD_PURCHASE">{locale === "bn" ? "গিফট কার্ড ক্রয়" : "Gift Card Purchase"}</option>
                        <option value="PURCHASE">{t("wallet.ledger.filterPurchase")}</option>
                        <option value="WITHDRAWAL">{t("wallet.ledger.filterWithdrawal")}</option>
                        <option value="ADMIN_ADJUSTMENT">{t("wallet.ledger.filterAdmin")}</option>
                        <option value="TRANSFER_OUT">{locale === "bn" ? "ট্রান্সফার (পাঠানো)" : "Transfer (Sent)"}</option>
                        <option value="TRANSFER_IN">{locale === "bn" ? "ট্রান্সফার (প্রাপ্ত)" : "Transfer (Received)"}</option>
                        <option value="DEPOSIT">{locale === "bn" ? "ডিপোজিট (বিকাশ)" : "Deposit (Bkash)"}</option>
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
                                    const isDebit =
                                        ["PURCHASE", "WITHDRAWAL", "GIFT_CARD_PURCHASE", "CPA_TASK_PURCHASE", "QUIZ_PURCHASE", "QUIZ_DEDUCTION", "TRANSFER_OUT"].includes(tx.type) ||
                                        tx.type.includes("PURCHASE") ||
                                        tx.type.includes("WITHDRAWAL") ||
                                        Number(tx.amount) < 0;

                                    return (
                                        <tr key={tx.id} className="hover:bg-gray-50/50">
                                            <td className="p-4 text-xs text-gray-600">{formatDateTime(tx.createdAt, locale)}</td>
                                            <td className="p-4 text-xs">
                                                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${isDebit ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
                                                    {(() => {
                                                        const key = `dashboard.wallet.transactionType.${tx.type}`;
                                                        const translated = t(key as any);
                                                        if (translated && translated !== key) return translated;
                                                        return tx.type.replace(/_/g, " ").replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
                                                    })()}
                                                </span>
                                            </td>
                                            <td className="p-4 text-xs text-gray-500">{tx.description}</td>
                                            <td className={`p-4 text-xs font-bold text-right ${isDebit ? "text-red-600" : "text-green-700"}`}>
                                                {isDebit ? "- " : "+ "}{formatCurrency(Math.abs(tx.amount), locale)}
                                            </td>
                                            <td className="p-4 text-xs font-semibold text-gray-700 text-right">{formatCurrency(tx.balanceAfter, locale)}</td>
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

            <div className="card overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-white">
                    <h3 className="text-sm font-bold text-gray-800">{t("generationIncome.history.heading")}</h3>
                </div>

                {commLoading ? (
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
                                        <td className="p-4 text-xs text-gray-600">{formatDateTime(comm.createdAt, locale)}</td>
                                        <td className="p-4 text-sm font-semibold text-gray-800">
                                            {comm.fromUser?.name || t("generationIncome.history.memberUnknown")}
                                        </td>
                                        <td className="p-4 text-xs text-center font-bold text-gray-700">
                                            {t("generationIncome.history.level")} {comm.level}
                                        </td>
                                        <td className="p-4 text-xs font-bold text-green-700 text-right">
                                            +{formatCurrency(comm.amount, locale)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {commTotalPages > 1 && (
                    <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                        <button disabled={commPage === 1} onClick={() => setCommPage(commPage - 1)} className="btn-secondary py-1 px-3 text-xs">{t("generationIncome.prev")}</button>
                        <span className="text-xs text-gray-500 font-semibold">{commPage} / {commTotalPages} {t("generationIncome.page")}</span>
                        <button disabled={commPage === commTotalPages} onClick={() => setCommPage(commPage + 1)} className="btn-secondary py-1 px-3 text-xs">{t("generationIncome.next")}</button>
                    </div>
                )}
            </div>
        </div>

            {/* Transfer Modal */}
            {showTransfer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-red-50 text-red-700">
                                    <SendHorizontal size={20} />
                                </div>
                                <h3 className="text-base font-bold text-slate-900">
                                    {locale === "bn" ? "ব্যালেন্স ট্রান্সফার" : "Transfer Balance"}
                                </h3>
                            </div>
                            <button onClick={() => { setShowTransfer(false); setTransferSuccess(""); setTransferRecipient(null); setLookupError(""); setTransferPhone(""); setTransferAmount(""); }} className="text-slate-400 hover:text-slate-600 text-xl leading-none cursor-pointer">✕</button>
                        </div>

                        {/* Success state */}
                        {transferSuccess ? (
                            <div className="flex flex-col items-center gap-4 py-6 text-center">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                    <CheckCircle2 size={36} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-base">{locale === "bn" ? "ট্রান্সফার সফল!" : "Transfer Successful!"}</p>
                                    <p className="text-sm text-slate-500 mt-1">{transferSuccess}</p>
                                </div>
                                <button onClick={() => { setShowTransfer(false); setTransferSuccess(""); }} className="btn-primary bg-red-700 hover:bg-red-800 text-white text-sm font-bold px-6 py-2.5 rounded-xl">
                                    {locale === "bn" ? "বন্ধ করুন" : "Close"}
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* 10% Service Charge Info Notice */}
                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-800">
                                    <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold">{locale === "bn" ? "১০% সার্ভিস চার্জ প্রযোজ্য" : "10% Platform Service Fee Applies"}</p>
                                        <p className="text-[11px] text-amber-700 mt-0.5">
                                            {locale === "bn"
                                                ? "ট্রান্সফারকৃত পরিমাণ থেকে ১০% চার্জ কাটা হবে এবং অবশিষ্টাংশ প্রাপক পাবেন। সর্বনিম্ন ট্রান্সফার ৳৫০০।"
                                                : "A 10% fee is deducted from the transfer amount and the recipient receives the remaining 90%. Minimum transfer is ৳500."}
                                        </p>
                                    </div>
                                </div>

                                {/* Recipient lookup */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 block">
                                        {locale === "bn" ? "প্রাপকের ফোন নম্বর" : "Recipient Phone Number"}
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            className="input w-full pr-10 text-sm"
                                            placeholder={locale === "bn" ? "01XXXXXXXXX" : "01XXXXXXXXX"}
                                            value={transferPhone}
                                            maxLength={11}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, "");
                                                setTransferPhone(val);
                                                setTransferRecipient(null);
                                                setLookupError("");
                                                if (val.length === 11) handlePhoneLookup(val);
                                            }}
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                                            {lookupLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                                        </span>
                                    </div>
                                    {transferRecipient && (
                                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                            <span className="text-xs font-bold text-emerald-900">{transferRecipient.name}</span>
                                            <span className="text-xs text-emerald-600 ml-auto">{transferRecipient.phone}</span>
                                        </div>
                                    )}
                                    {lookupError && (
                                        <p className="text-xs text-red-600 font-semibold">{lookupError}</p>
                                    )}
                                </div>

                                {/* Amount */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 block">
                                        {locale === "bn" ? "পরিমাণ (সর্বনিম্ন ৳500)" : "Amount (minimum ৳500)"}
                                    </label>
                                    <input
                                        type="number"
                                        className="input w-full text-sm"
                                        placeholder="500"
                                        min={500}
                                        max={Number(balanceData?.availableBalance ?? 0)}
                                        value={transferAmount}
                                        onChange={(e) => setTransferAmount(e.target.value)}
                                    />
                                    <p className="text-[11px] text-slate-400">
                                        {locale === "bn" ? "উপলব্ধ ব্যালেন্স:" : "Available balance:"} {formatCurrency(balanceData?.availableBalance ?? 0, locale)}
                                    </p>
                                </div>

                                {Number(transferAmount) >= 500 && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 text-xs">
                                        <div className="flex justify-between text-slate-600">
                                            <span>{locale === "bn" ? "ট্রান্সফার পরিমাণ:" : "Transfer Amount:"}</span>
                                            <span className="font-semibold">{formatCurrency(Number(transferAmount), locale)}</span>
                                        </div>
                                        <div className="flex justify-between text-amber-700">
                                            <span>{locale === "bn" ? "সার্ভিস চার্জ (১০%):" : "Service Charge (10%):"}</span>
                                            <span className="font-bold">- {formatCurrency(Math.round(Number(transferAmount) * 0.10 * 100) / 100, locale)}</span>
                                        </div>
                                        <div className="flex justify-between text-emerald-800 font-bold border-t border-slate-200 pt-1.5">
                                            <span>{locale === "bn" ? "প্রাপক পাবেন:" : "Recipient Receives:"}</span>
                                            <span>{formatCurrency(Math.round((Number(transferAmount) - Math.round(Number(transferAmount) * 0.10 * 100) / 100) * 100) / 100, locale)}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Error from mutation */}
                                {transferMutation.isError && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-semibold">
                                        {(transferMutation.error as any)?.response?.data?.message || (locale === "bn" ? "ট্রান্সফার ব্যর্থ হয়েছে" : "Transfer failed")}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-3 pt-1">
                                    <button
                                        onClick={() => {
                                            if (!transferRecipient || !transferAmount) return;
                                            transferMutation.mutate({ recipientPhone: transferRecipient.phone, amount: Number(transferAmount) });
                                        }}
                                        disabled={!transferRecipient || !transferAmount || Number(transferAmount) < 500 || transferMutation.isPending}
                                        className="flex-1 py-2.5 flex items-center justify-center gap-2 text-sm font-bold text-white bg-red-700 hover:bg-red-800 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                                    >
                                        {transferMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <SendHorizontal size={16} />}
                                        {locale === "bn" ? "ট্রান্সফার করুন" : "Send Transfer"}
                                    </button>
                                    <button onClick={() => { setShowTransfer(false); setTransferRecipient(null); setLookupError(""); setTransferPhone(""); setTransferAmount(""); }} className="px-4 py-2.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                                        {locale === "bn" ? "বাতিল" : "Cancel"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Deposit (Bkash Top-Up) Modal */}
            {showDeposit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                                    <PlusCircle size={20} />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">
                                        {locale === "bn" ? "বিকাশে টাকা পাঠান" : "Add Money via Bkash"}
                                    </h3>
                                    <p className="text-xs text-slate-500">{locale === "bn" ? "অ্যাডমিনের বিকাশ নম্বরে পাঠান, এরপর নিচে জমা দিন" : "Send to admin Bkash, then submit the details below"}</p>
                                </div>
                            </div>
                            <button onClick={() => { setShowDeposit(false); setDepositSuccess(false); }} className="text-slate-400 hover:text-slate-600 text-xl leading-none cursor-pointer">✕</button>
                        </div>

                        {depositSuccess ? (
                            <div className="flex flex-col items-center gap-4 py-6 text-center">
                                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                    <CheckCircle2 size={36} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-base">{locale === "bn" ? "জমা সফল!" : "Request Submitted!"}</p>
                                    <p className="text-sm text-slate-500 mt-1">{locale === "bn" ? "অ্যাডমিন যাচাই করার পরে আপনার ওয়ালেটে টাকা যোগ হবে।" : "Admin will verify and credit your wallet shortly."}</p>
                                </div>
                                <button onClick={() => { setShowDeposit(false); setDepositSuccess(false); }} className="btn-primary bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold px-6 py-2.5 rounded-xl">
                                    {locale === "bn" ? "বন্ধ করুন" : "Close"}
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Step 1 - Admin bkash number */}
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-1">
                                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                                        {locale === "bn" ? "ধাপ ১: নিচের বিকাশ নম্বরে টাকা পাঠান" : "Step 1: Send money to this Bkash number"}
                                    </p>
                                    <p className="text-2xl font-black text-emerald-900 tracking-widest">
                                        {adminInfo?.bkashNumber ?? "01823674796"}
                                    </p>
                                    <p className="text-[11px] text-emerald-600">{locale === "bn" ? "বিকাশ Send Money অথবা Payment ব্যবহার করুন" : "Use Bkash Send Money or Payment"}</p>
                                </div>

                                {/* Step 2 - Form */}
                                <div className="space-y-1">
                                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                                        {locale === "bn" ? "ধাপ ২: নিচের ফর্ম পূরণ করুন" : "Step 2: Fill in the details below"}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 block">
                                            {locale === "bn" ? "পরিমাণ (সর্বনিম্ন ৳10)" : "Amount (minimum ৳10)"}
                                        </label>
                                        <input
                                            type="number"
                                            className="input w-full text-sm"
                                            placeholder="100"
                                            min={10}
                                            value={depositAmount}
                                            onChange={(e) => setDepositAmount(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 block">
                                            {locale === "bn" ? "বিকাশ ট্রানজেকশন আইডি (TxID)" : "Bkash Transaction ID (TxID)"}
                                        </label>
                                        <input
                                            type="text"
                                            className="input w-full text-sm font-mono"
                                            placeholder="8A23ABC456"
                                            value={depositTxId}
                                            onChange={(e) => setDepositTxId(e.target.value.trim())}
                                        />
                                        <p className="text-[11px] text-slate-400">{locale === "bn" ? "বিকাশ SMS থেকে ট্রানজেকশন আইডি কপি করুন" : "Copy Transaction ID from Bkash SMS"}</p>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 block">
                                            {locale === "bn" ? "আপনার বিকাশ নম্বর (প্রেরকের নম্বর)" : "Your Bkash Number (Sender)"}
                                        </label>
                                        <input
                                            type="tel"
                                            className="input w-full text-sm"
                                            placeholder="01XXXXXXXXX"
                                            maxLength={11}
                                            value={depositPhone}
                                            onChange={(e) => setDepositPhone(e.target.value.replace(/\D/g, ""))}
                                        />
                                    </div>
                                </div>

                                {depositMutation.isError && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-semibold">
                                        {(depositMutation.error as any)?.response?.data?.message || (locale === "bn" ? "জমা দেওয়া ব্যর্থ হয়েছে" : "Submission failed")}
                                    </div>
                                )}

                                <div className="flex gap-3 pt-1">
                                    <button
                                        onClick={() => {
                                            if (!depositAmount || !depositTxId || !depositPhone) return;
                                            depositMutation.mutate({ amount: Number(depositAmount), transactionId: depositTxId, senderPhone: depositPhone });
                                        }}
                                        disabled={!depositAmount || Number(depositAmount) < 10 || !depositTxId || depositPhone.length < 11 || depositMutation.isPending}
                                        className="flex-1 py-2.5 flex items-center justify-center gap-2 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                                    >
                                        {depositMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <PlusCircle size={16} />}
                                        {locale === "bn" ? "জমা দিন" : "Submit Request"}
                                    </button>
                                    <button onClick={() => setShowDeposit(false)} className="px-4 py-2.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                                        {locale === "bn" ? "বাতিল" : "Cancel"}
                                    </button>
                                </div>

                                {/* Recent deposit requests */}
                                {myDeposits && myDeposits.requests.length > 0 && (
                                    <div className="border-t border-slate-100 pt-4 space-y-2">
                                        <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{locale === "bn" ? "সাম্প্রতিক রিকোয়েস্ট" : "Recent Requests"}</p>
                                        {myDeposits.requests.map((req) => (
                                            <div key={req.id} className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2.5">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-900">{formatCurrency(req.amount, locale)}</p>
                                                    <p className="text-[10px] text-slate-400">{req.transactionId}</p>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                                    req.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                    req.status === "REJECTED" ? "bg-red-50 text-red-700 border-red-200" :
                                                    "bg-amber-50 text-amber-700 border-amber-200"
                                                }`}>
                                                    {req.status === "APPROVED" ? (locale === "bn" ? "অনুমোদিত" : "Approved") :
                                                     req.status === "REJECTED" ? (locale === "bn" ? "বাতিল" : "Rejected") :
                                                     (locale === "bn" ? "অপেক্ষায়" : "Pending")}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
