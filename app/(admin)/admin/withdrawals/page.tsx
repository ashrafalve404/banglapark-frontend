"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ShieldAlert, Loader2, ArrowRight, RotateCcw } from "lucide-react";
import { withdrawalApi } from "@/lib/api/withdrawal";
import { formatCurrency, formatDateTime, getWithdrawStatusLabel, getWithdrawMethodLabel } from "@/lib/utils";
import type { WithdrawalRequest, WithdrawStatus } from "@/types";
import { useLocale } from "@/lib/i18n";

export default function AdminWithdrawalsPage() {
    const { t, locale } = useLocale();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("PENDING");

    // Modal state for Reject or Return action
    const [actionId, setActionId] = useState<string | null>(null);
    const [actionType, setActionType] = useState<"REJECTED" | "RETURNED">("REJECTED");
    const [actionReason, setActionReason] = useState("");

    const { data, isLoading } = useQuery({
        queryKey: ["admin-withdrawals", page, status],
        queryFn: () => withdrawalApi.adminAll({ page, limit: 12, status: status ? status as WithdrawStatus : undefined }),
    });

    const requests = data?.requests ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / 12) || 1;

    // Approve withdrawal request
    const approveMutation = useMutation({
        mutationFn: (id: string) => withdrawalApi.review(id, { status: "APPROVED" }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
        },
    });

    // Review withdrawal request (REJECTED or RETURNED)
    const reviewMutation = useMutation({
        mutationFn: ({ id, status, reason }: { id: string; status: "REJECTED" | "RETURNED"; reason: string }) =>
            withdrawalApi.review(id, { status, reason }),
        onSuccess: () => {
            setActionId(null);
            setActionReason("");
            queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
        },
    });

    const handleLaunchModal = (id: string, type: "REJECTED" | "RETURNED") => {
        setActionId(id);
        setActionType(type);
        setActionReason(type === "RETURNED" ? (locale === "bn" ? "ব্যালেন্স ইতিমধ্যে অন্য কাজে ব্যবহৃত হওয়ায় ওয়ালেটে ফেরত দেওয়া হয়েছে" : "Returned to wallet balance") : "");
    };

    const handleConfirmAction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!actionId) return;
        reviewMutation.mutate({ id: actionId, status: actionType, reason: actionReason.trim() });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">{t("admin.withdrawals.heading")}</h1>
                <p className="text-sm text-slate-500">{t("admin.withdrawals.subheading")}</p>
            </div>

            {/* Filter tab bar options */}
            <div className="card p-5 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <h3 className="text-sm font-bold text-slate-700">{t("admin.withdrawals.filter.heading")}</h3>
                <select
                    className="input sm:w-56 cursor-pointer text-xs font-semibold"
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                >
                    <option value="PENDING">{t("admin.withdrawals.filter.pending")}</option>
                    <option value="APPROVED">{t("admin.withdrawals.filter.approved")}</option>
                    <option value="RETURNED">{locale === "bn" ? "ফেরত সম্পন্ন (Returned)" : "Returned to Wallet"}</option>
                    <option value="REJECTED">{t("admin.withdrawals.filter.rejected")}</option>
                    <option value="">{locale === "bn" ? "সকল আবেদন (All)" : "All Requests"}</option>
                </select>
            </div>

            {/* Main Table list */}
            <div className="card overflow-hidden bg-white">
                {isLoading ? (
                    <div className="py-20 flex justify-center">
                        <Loader2 className="animate-spin text-slate-800" size={32} />
                    </div>
                ) : requests.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">{t("admin.withdrawals.empty")}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-150">
                                    <th className="p-4 text-xs font-bold text-slate-600">{t("admin.withdrawals.table.colDate")}</th>
                                    <th className="p-4 text-xs font-bold text-slate-600">{t("admin.withdrawals.table.colMember")}</th>
                                    <th className="p-4 text-xs font-bold text-slate-600 text-right">{t("admin.withdrawals.table.colAmount")}</th>
                                    <th className="p-4 text-xs font-bold text-slate-600">{t("admin.withdrawals.table.colAccount")}</th>
                                    <th className="p-4 text-xs font-bold text-slate-600 text-center">{t("admin.withdrawals.table.colStatus")}</th>
                                    <th className="p-4 text-xs font-bold text-slate-600 text-center">{t("admin.withdrawals.table.colAction")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50/50">
                                        <td className="p-4 text-xs text-gray-500 font-medium">{formatDateTime(req.createdAt, locale)}</td>
                                        <td className="p-4">
                                            <div className="text-xs font-semibold text-slate-800">{req.user?.name}</div>
                                            <div className="text-[10px] text-gray-500">{req.user?.phone}</div>
                                        </td>
                                        <td className="p-4 text-xs font-bold text-slate-800 text-right">{formatCurrency(req.amount, locale)}</td>
                                        <td className="p-4 text-xs text-slate-650 min-w-[200px]">
                                            <div className="font-bold">{getWithdrawMethodLabel(req.method)}</div>
                                            <div className="text-[10px] text-gray-500 mt-0.5">
                                                {t("admin.withdrawals.table.accountLabel")} <strong className="text-slate-850 font-bold select-all">{req.accountDetails?.accountNo}</strong>
                                            </div>
                                            {req.method === "BANK" && (
                                                <div className="text-[9px] text-gray-400 mt-0.5">
                                                    {t("admin.withdrawals.table.bankLabel")} {req.accountDetails?.bankName} ({req.accountDetails?.branchName}), নাম: {req.accountDetails?.holderName}
                                                </div>
                                            )}
                                            {req.reason && (
                                                <div className={`text-[10px] font-bold mt-1 ${req.status === "RETURNED" ? "text-indigo-600" : "text-red-500"}`}>
                                                    {t("admin.withdrawals.table.reasonLabel")} {req.reason}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                                req.status === "APPROVED"
                                                    ? "bg-green-50 text-green-700 border border-green-200"
                                                    : req.status === "RETURNED"
                                                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                                        : req.status === "REJECTED"
                                                            ? "bg-red-50 text-red-700 border border-red-200"
                                                            : "bg-amber-100 text-amber-800"
                                            }`}>
                                                {req.status === "RETURNED" ? (locale === "bn" ? "ফেরত সম্পন্ন" : "Returned") : getWithdrawStatusLabel(req.status)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            {req.status === "PENDING" ? (
                                                <div className="flex items-center gap-1.5 justify-center">
                                                    <button
                                                        onClick={() => { if (confirm(t("admin.withdrawals.confirm.approve"))) approveMutation.mutate(req.id); }}
                                                        className="bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold text-[10px] py-1.5 px-2.5 rounded-lg cursor-pointer"
                                                    >
                                                        {t("admin.withdrawals.table.btnApprove")}
                                                    </button>
                                                    <button
                                                        onClick={() => handleLaunchModal(req.id, "RETURNED")}
                                                        className="bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-bold text-[10px] py-1.5 px-2.5 rounded-lg cursor-pointer flex items-center gap-1"
                                                    >
                                                        <RotateCcw size={11} /> {locale === "bn" ? "ফেরত দিন" : "Return"}
                                                    </button>
                                                    <button
                                                        onClick={() => handleLaunchModal(req.id, "REJECTED")}
                                                        className="bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-bold text-[10px] py-1.5 px-2.5 rounded-lg cursor-pointer"
                                                    >
                                                        {t("admin.withdrawals.table.btnReject")}
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-slate-400">{t("admin.withdrawals.table.completed")}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary py-1 px-3 text-xs">{t("admin.withdrawals.prev")}</button>
                        <span className="text-xs text-slate-500 font-semibold">{page} / {totalPages} {t("admin.withdrawals.page")}</span>
                        <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn-secondary py-1 px-3 text-xs">{t("admin.withdrawals.next")}</button>
                    </div>
                )}
            </div>

            {/* Reject or Return Confirmation Modal */}
            {actionId && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleConfirmAction} className="card max-w-sm w-full p-6 bg-white space-y-4 shadow-xl">
                        <h3 className="text-sm font-bold text-slate-800">
                            {actionType === "RETURNED"
                                ? (locale === "bn" ? "উইথড্রয়াল ব্যালেন্স ফেরত দিন" : "Return Withdrawal to Wallet")
                                : t("admin.withdrawals.modal.heading")}
                        </h3>
                        <p className="text-xs text-slate-500">
                            {actionType === "RETURNED"
                                ? (locale === "bn" ? "এই উইথড্রয়াল টাকা ইউজারের ওয়ালেটে ফেরত যোগ করা হবে এবং স্ট্যাটাস 'ফেরত সম্পন্ন' হিসেবে দেখতে পাবে।" : "The pending withdrawal lock will be released back to the user wallet and logged as 'Returned'.")
                                : t("admin.withdrawals.modal.desc")}
                        </p>
                        <textarea
                            className="input text-left h-24 text-xs resize-none"
                            required
                            placeholder={actionType === "RETURNED" ? (locale === "bn" ? "ফেরত দেওয়ার কারণ লিখুন..." : "Reason for return...") : t("admin.withdrawals.modal.placeholder")}
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={reviewMutation.isPending}
                                className={`flex-1 py-2 text-xs font-bold text-white rounded-xl cursor-pointer ${
                                    actionType === "RETURNED" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-red-600 hover:bg-red-700"
                                }`}
                            >
                                {reviewMutation.isPending ? <Loader2 size={14} className="animate-spin mx-auto" /> : actionType === "RETURNED" ? (locale === "bn" ? "ফেরত সম্পন্ন করুন" : "Confirm Return") : t("admin.withdrawals.modal.confirm")}
                            </button>
                            <button type="button" onClick={() => setActionId(null)} className="px-4 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                                {t("admin.withdrawals.modal.cancel")}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
