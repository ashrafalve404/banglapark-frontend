"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ShieldAlert, Loader2, ArrowRight, RotateCcw, Printer, FileText, CheckCircle2 } from "lucide-react";
import { withdrawalApi } from "@/lib/api/withdrawal";
import { formatCurrency, formatDateTime, getWithdrawStatusLabel, getWithdrawMethodLabel, numberToWords } from "@/lib/utils";
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

    // Printable Voucher modal state
    const [voucherReq, setVoucherReq] = useState<WithdrawalRequest | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["admin-withdrawals", page, status],
        queryFn: () => withdrawalApi.adminAll({ page, limit: 12, status: status ? status as WithdrawStatus : undefined }),
    });

    const requests = data?.requests ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / 12) || 1;

    // Approve withdrawal request & launch payment voucher print
    const approveMutation = useMutation({
        mutationFn: (id: string) => withdrawalApi.review(id, { status: "APPROVED" }),
        onSuccess: (_, targetId) => {
            queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
            const targetReq = requests.find((r) => r.id === targetId);
            if (targetReq) {
                setVoucherReq({ ...targetReq, status: "APPROVED" });
            }
        },
    });

    const [actionError, setActionError] = useState("");

    // Review withdrawal request (REJECTED or RETURNED)
    const reviewMutation = useMutation({
        mutationFn: ({ id, status, reason }: { id: string; status: "REJECTED" | "RETURNED"; reason: string }) =>
            withdrawalApi.review(id, { status, reason }),
        onSuccess: () => {
            setActionId(null);
            setActionReason("");
            setActionError("");
            queryClient.invalidateQueries({ queryKey: ["admin-withdrawals"] });
        },
        onError: (err: any) => {
            setActionError(err?.response?.data?.message || err?.message || "Failed to update withdrawal status");
        },
    });

    const handleLaunchModal = (id: string, type: "REJECTED" | "RETURNED") => {
        setActionId(id);
        setActionType(type);
        setActionError("");
        setActionReason(type === "RETURNED" ? (locale === "bn" ? "ব্যালেন্স ইতিমধ্যে অন্য কাজে ব্যবহৃত হওয়ায় ওয়ালেটে ফেরত দেওয়া হয়েছে" : "Returned to wallet balance") : "");
    };

    const handleConfirmAction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!actionId) return;
        setActionError("");
        reviewMutation.mutate({ id: actionId, status: actionType, reason: actionReason.trim() });
    };

    return (
        <div className="space-y-6">
            {/* Global style tag for perfect printable PDF formatting */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    .id-voucher-modal, .id-voucher-modal * {
                        visibility: visible !important;
                    }
                    .id-voucher-modal {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>

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
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className="text-[10px] text-slate-400">{t("admin.withdrawals.table.completed")}</span>
                                                    <button
                                                        onClick={() => setVoucherReq(req)}
                                                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-bold text-[10px] py-1 px-2.5 rounded-lg cursor-pointer flex items-center gap-1 transition-all"
                                                        title="Print Voucher PDF"
                                                    >
                                                        <Printer size={12} /> {locale === "bn" ? "ভাউচার প্রিন্ট" : "Voucher PDF"}
                                                    </button>
                                                </div>
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
                        {actionError && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-2.5 text-xs text-red-700 font-semibold">
                                {actionError}
                            </div>
                        )}
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

            {/* Detailed Printable Payment Voucher Modal */}
            {voucherReq && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto print:p-0 print:bg-white print:static">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-6 relative print:p-0 print:shadow-none print:max-w-none print:w-full id-voucher-modal">
                        {/* Action Bar (Hidden when printing) */}
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
                            <div className="flex items-center gap-2">
                                <Printer className="text-indigo-600" size={20} />
                                <h3 className="text-base font-bold text-slate-900">
                                    {locale === "bn" ? "উইথড্রয়াল পেমেন্ট ভাউচার (PDF / প্রিন্ট)" : "Withdrawal Payment Voucher (PDF / Print)"}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="py-1.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                                >
                                    <Printer size={14} /> {locale === "bn" ? "প্রিন্ট / PDF সেভ করুন" : "Print / Save PDF"}
                                </button>
                                <button
                                    onClick={() => setVoucherReq(null)}
                                    className="py-1.5 px-3 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Official Voucher Document Sheet */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-6 text-slate-800 font-sans print:border-none print:p-6">
                            {/* Header Banner */}
                            <div className="flex items-start justify-between border-b-2 border-indigo-600 pb-4">
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight text-indigo-900">BANGLAPARK</h2>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">BanglaPark E-Commerce Portal</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Official Payment Disbursement Voucher</p>
                                </div>
                                <div className="text-right">
                                    <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-md font-bold text-xs uppercase tracking-wider border border-emerald-300">
                                        {voucherReq.status === "APPROVED" ? (locale === "bn" ? "অনুমোদিত পেমেন্ট (APPROVED)" : "PAYMENT DISBURSED") : voucherReq.status}
                                    </span>
                                    <div className="text-xs font-mono font-bold text-slate-700 mt-2">
                                        VOUCHER NO: <span className="text-indigo-700">WD-{voucherReq.id.slice(0, 8).toUpperCase()}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                                        Date: {formatDateTime(voucherReq.createdAt, locale)}
                                    </div>
                                </div>
                            </div>

                            {/* User & Payment Information Grid */}
                            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="space-y-1.5">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-1">
                                        Beneficiary Details (গ্রাহকের তথ্য)
                                    </div>
                                    <div><strong className="text-slate-500">Name:</strong> <span className="font-bold text-slate-900">{voucherReq.user?.name || "N/A"}</span></div>
                                    <div><strong className="text-slate-500">Phone:</strong> <span className="font-bold text-slate-900">{voucherReq.user?.phone || "N/A"}</span></div>
                                    <div><strong className="text-slate-500">User / Member ID:</strong> <span className="font-bold text-slate-900">#{voucherReq.user?.memberId || voucherReq.userId?.slice(0, 8)}</span></div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-1">
                                        Disbursal Account Info (পেমেন্ট মাধ্যম)
                                    </div>
                                    <div><strong className="text-slate-500">Method:</strong> <span className="font-bold text-indigo-900 uppercase">{getWithdrawMethodLabel(voucherReq.method)}</span></div>
                                    <div><strong className="text-slate-500">Account No:</strong> <span className="font-mono font-bold text-slate-900 select-all">{voucherReq.accountDetails?.accountNo || "N/A"}</span></div>
                                    {voucherReq.method === "BANK" && (
                                        <>
                                            <div><strong className="text-slate-500">Bank & Branch:</strong> {voucherReq.accountDetails?.bankName} ({voucherReq.accountDetails?.branchName})</div>
                                            <div><strong className="text-slate-500">Account Holder:</strong> {voucherReq.accountDetails?.holderName}</div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Financial Breakdown Table */}
                            <div className="overflow-hidden rounded-xl border border-slate-200">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-indigo-900 text-white font-bold uppercase tracking-wider">
                                            <th className="p-3">Financial Description</th>
                                            <th className="p-3 text-right">Amount (BDT)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 font-medium">
                                        <tr>
                                            <td className="p-3">Requested Withdrawal Balance</td>
                                            <td className="p-3 text-right font-bold text-slate-900">{formatCurrency(voucherReq.amount, locale)}</td>
                                        </tr>
                                        <tr>
                                            <td className="p-3 text-slate-500">Processing / Gateway Charge</td>
                                            <td className="p-3 text-right text-slate-500">৳0.00</td>
                                        </tr>
                                        <tr className="bg-emerald-50/80 font-extrabold text-sm text-emerald-900">
                                            <td className="p-3 text-emerald-950 uppercase tracking-wide">Net Disbursed Payable Amount</td>
                                            <td className="p-3 text-right text-emerald-700">{formatCurrency(voucherReq.amount, locale)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Amount in Words */}
                            <div className="bg-slate-100 p-3 rounded-lg text-xs font-semibold border border-slate-200">
                                <span className="text-slate-500 font-bold uppercase text-[10px] block mb-0.5">Amount in Words:</span>
                                <span className="text-slate-900 italic font-bold">{numberToWords(Number(voucherReq.amount))}</span>
                            </div>

                            {/* Signatures & Approval Footer */}
                            <div className="pt-12 grid grid-cols-3 gap-6 text-center text-xs">
                                <div className="border-t border-slate-400 pt-2 space-y-0.5">
                                    <p className="font-bold text-slate-800">System Admin</p>
                                    <p className="text-[10px] text-slate-400">Prepared By</p>
                                </div>
                                <div className="border-t border-slate-400 pt-2 space-y-0.5">
                                    <p className="font-bold text-slate-800">Accounts Manager</p>
                                    <p className="text-[10px] text-slate-400">Verified By</p>
                                </div>
                                <div className="border-t border-slate-400 pt-2 space-y-0.5">
                                    <p className="font-bold text-indigo-900">Authorized Signature & Stamp</p>
                                    <p className="text-[10px] text-slate-400">Disbursed Authority</p>
                                </div>
                            </div>

                            {/* Computer Generated Footer Disclaimer */}
                            <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-200">
                                Computer generated payment voucher. BanglaPark Portal © {new Date().getFullYear()}. All Rights Reserved.
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
