"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CheckCircle2, XCircle, Clock, Search, PlusCircle, RefreshCw } from "lucide-react";
import { depositApi } from "@/lib/api/deposit";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function AdminDepositsPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("");
    const [rejectNote, setRejectNote] = useState("");
    const [rejectingId, setRejectingId] = useState<string | null>(null);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ["admin-deposits", page, status],
        queryFn: () => depositApi.adminList({ page, limit: 20, status: status || undefined }),
        refetchOnWindowFocus: true,
    });

    const requests = data?.requests ?? [];
    const totalPages = data?.totalPages ?? 1;

    const approveMutation = useMutation({
        mutationFn: (id: string) => depositApi.approve(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-deposits"] }),
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, note }: { id: string; note?: string }) => depositApi.reject(id, note),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-deposits"] });
            setRejectingId(null);
            setRejectNote("");
        },
    });

    const pendingCount = requests.filter((r) => r.status === "PENDING").length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Deposit Requests</h1>
                    <p className="text-sm text-slate-500">Review and approve Bkash manual top-up requests</p>
                </div>
                <button onClick={() => refetch()} className="btn-secondary self-start py-2 px-3 flex items-center gap-1.5 text-xs">
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {pendingCount > 0 && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
                    <Clock size={20} className="text-amber-600 shrink-0" />
                    <p className="text-sm font-semibold text-amber-800">
                        {pendingCount} pending deposit request{pendingCount > 1 ? "s" : ""} awaiting your review
                    </p>
                </div>
            )}

            {/* Filter */}
            <div className="card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <Search size={16} className="text-slate-400 shrink-0" />
                <select
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600 w-full sm:w-44"
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                >
                    <option value="">All Requests</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>

            {/* Table */}
            <div className="card overflow-hidden">
                {isLoading ? (
                    <div className="py-20 text-center text-slate-400">Loading...</div>
                ) : requests.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">No deposit requests found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-150">
                                    <th className="p-4 text-xs font-bold text-slate-600">Date</th>
                                    <th className="p-4 text-xs font-bold text-slate-600">Member</th>
                                    <th className="p-4 text-xs font-bold text-slate-600">Sender Bkash</th>
                                    <th className="p-4 text-xs font-bold text-slate-600">TxID</th>
                                    <th className="p-4 text-xs font-bold text-slate-600 text-right">Amount</th>
                                    <th className="p-4 text-xs font-bold text-slate-600 text-center">Status</th>
                                    <th className="p-4 text-xs font-bold text-slate-600 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50/50">
                                        <td className="p-4 text-xs text-slate-600 whitespace-nowrap">{formatDateTime(req.createdAt, "en")}</td>
                                        <td className="p-4">
                                            <p className="text-xs font-bold text-slate-900">{(req as any).user?.name}</p>
                                            <p className="text-[10px] text-slate-400">{(req as any).user?.phone} — ID#{(req as any).user?.memberId}</p>
                                        </td>
                                        <td className="p-4 text-xs font-mono text-slate-700">{req.senderPhone}</td>
                                        <td className="p-4">
                                            <span className="text-xs font-mono font-bold text-slate-900 select-all">{req.transactionId}</span>
                                        </td>
                                        <td className="p-4 text-xs font-bold text-slate-900 text-right">{formatCurrency(req.amount, "en")}</td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                                req.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                                req.status === "REJECTED" ? "bg-red-50 text-red-700 border-red-200" :
                                                "bg-amber-50 text-amber-700 border-amber-200"
                                            }`}>
                                                {req.status === "APPROVED" ? <CheckCircle2 size={11} /> :
                                                 req.status === "REJECTED" ? <XCircle size={11} /> :
                                                 <Clock size={11} />}
                                                {req.status}
                                            </span>
                                            {req.adminNote && <p className="text-[10px] text-slate-400 mt-1">{req.adminNote}</p>}
                                        </td>
                                        <td className="p-4 text-center">
                                            {req.status === "PENDING" ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            if (confirm(`Approve ৳${req.amount} deposit from ${(req as any).user?.name}?`)) {
                                                                approveMutation.mutate(req.id);
                                                            }
                                                        }}
                                                        disabled={approveMutation.isPending}
                                                        className="px-3 py-1.5 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50 cursor-pointer transition-colors"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => setRejectingId(req.id)}
                                                        className="px-3 py-1.5 text-[11px] font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer transition-colors"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-slate-400">Completed</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary py-1 px-3 text-xs">Prev</button>
                        <span className="text-xs text-slate-500 font-semibold">{page} / {totalPages}</span>
                        <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn-secondary py-1 px-3 text-xs">Next</button>
                    </div>
                )}
            </div>

            {/* Reject confirmation modal */}
            {rejectingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
                        <h3 className="text-base font-bold text-slate-900">Reject Deposit Request</h3>
                        <p className="text-sm text-slate-500">Optionally provide a reason for the user.</p>
                        <textarea
                            className="input w-full text-sm resize-none"
                            rows={3}
                            placeholder="Reason for rejection (optional)"
                            value={rejectNote}
                            onChange={(e) => setRejectNote(e.target.value)}
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => rejectMutation.mutate({ id: rejectingId, note: rejectNote || undefined })}
                                disabled={rejectMutation.isPending}
                                className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50 cursor-pointer"
                            >
                                Confirm Reject
                            </button>
                            <button onClick={() => { setRejectingId(null); setRejectNote(""); }} className="px-4 py-2.5 text-sm font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
