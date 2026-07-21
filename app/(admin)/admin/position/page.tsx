"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { positionApi } from "@/lib/api/position";
import { POSITIONS } from "@/lib/constants/positions";
import { Search, Trophy, Users, Loader2, Play, Zap, Lock, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

const RANK_COLORS = [
    "bg-emerald-100 text-emerald-800 border-emerald-200",
    "bg-teal-100 text-teal-800 border-teal-200",
    "bg-cyan-100 text-cyan-800 border-cyan-200",
    "bg-blue-100 text-blue-800 border-blue-200",
    "bg-indigo-100 text-indigo-800 border-indigo-200",
    "bg-violet-100 text-violet-800 border-violet-200",
    "bg-purple-100 text-purple-800 border-purple-200",
    "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
    "bg-rose-100 text-rose-800 border-rose-200",
    "bg-amber-100 text-amber-800 border-amber-200",
];

export default function AdminPositionPage() {
    const { locale } = useLocale();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [distributeMsg, setDistributeMsg] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["admin-position-members", page, search],
        queryFn: () => positionApi.adminMembers({ page, limit: 15, search: search || undefined }),
        staleTime: 30_000,
    });

    const users = data?.users ?? [];
    const total = data?.total ?? 0;
    const totalPages = data?.totalPages ?? 1;

    const payMutation = useMutation({
        mutationFn: (userId: string) => positionApi.adminPay(userId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-position-members"] }),
    });

    const distributeMutation = useMutation({
        mutationFn: () => positionApi.adminDistribute(),
        onSuccess: (res: any) => {
            setDistributeMsg(res?.message ?? "Distribution triggered successfully");
            setTimeout(() => setDistributeMsg(null), 5000);
        },
    });

    const eligibleCount = users.filter((u) => u.currentPosition !== null).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Position Management</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        View member positions based on active team size and manage salary distribution.
                    </p>
                </div>
                <button
                    onClick={() => distributeMutation.mutate()}
                    disabled={distributeMutation.isPending}
                    className="btn-primary flex items-center gap-2 py-2 px-4 text-sm"
                >
                    {distributeMutation.isPending ? (
                        <Loader2 size={15} className="animate-spin" />
                    ) : (
                        <Zap size={15} />
                    )}
                    Run Monthly Distribution
                </button>
            </div>

            {distributeMsg && (
                <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-sm text-green-800 font-medium flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
                    {distributeMsg}
                </div>
            )}

            {/* Position requirements reference */}
            <div className="card bg-white p-5">
                <h2 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Trophy size={15} className="text-amber-500" />
                    Position Salary Table
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                    {POSITIONS.map((pos) => (
                        <div key={pos.rank} className={`rounded-lg border px-3 py-2 text-[11px] font-medium ${RANK_COLORS[pos.rank - 1]}`}>
                            <div className="font-bold text-[10px]">#{pos.rank} {pos.name}</div>
                            <div className="mt-0.5 opacity-80">{(pos.requiredMembers / 1000).toLocaleString()}k members</div>
                            <div className="font-bold">{formatCurrency(pos.monthlySalary, locale)}/mo</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Search + stats */}
            <div className="card bg-white p-4 flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by name, phone or email..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="input pl-8 w-full text-sm"
                    />
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 text-xs font-semibold text-slate-600">
                    <span className="flex items-center gap-1.5">
                        <Users size={13} className="text-slate-400" />
                        {total} members
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Trophy size={13} className="text-amber-500" />
                        {eligibleCount} eligible (this page)
                    </span>
                </div>
            </div>

            {/* Members table */}
            <div className="card bg-white overflow-hidden">
                {isLoading ? (
                    <div className="py-20 flex justify-center">
                        <Loader2 className="animate-spin text-slate-700" size={32} />
                    </div>
                ) : users.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">No members found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="p-4 text-xs font-bold text-slate-600">Member</th>
                                    <th className="p-4 text-xs font-bold text-slate-600 text-center">Status</th>
                                    <th className="p-4 text-xs font-bold text-slate-600 text-right">Active Team</th>
                                    <th className="p-4 text-xs font-bold text-slate-600">Current Position</th>
                                    <th className="p-4 text-xs font-bold text-slate-600 text-right">Monthly Salary</th>
                                    <th className="p-4 text-xs font-bold text-slate-600 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50">
                                        <td className="p-4 min-w-[200px]">
                                            <div className="text-sm font-bold text-slate-800">{user.name}</div>
                                            {user.memberId && <div className="text-[10px] text-slate-400">#{user.memberId}</div>}
                                            <div className="text-[11px] text-slate-500">{user.phone}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${user.status === "ACTIVE"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-slate-100 text-slate-500"
                                                }`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="text-sm font-bold text-slate-800">
                                                {user.activeTeamCount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {user.currentPosition ? (
                                                <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-bold ${RANK_COLORS[user.currentPosition.rank - 1]}`}>
                                                    <Trophy size={10} />
                                                    #{user.currentPosition.rank} {user.currentPosition.name}
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                                                    <Lock size={11} /> Not eligible
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right text-sm font-bold text-slate-800">
                                            {user.currentPosition
                                                ? formatCurrency(user.currentPosition.monthlySalary, locale)
                                                : <span className="text-slate-300 text-xs font-normal">—</span>
                                            }
                                        </td>
                                        <td className="p-4 text-center">
                                            {user.currentPosition ? (
                                                <button
                                                    onClick={() => payMutation.mutate(user.id)}
                                                    disabled={payMutation.isPending && payMutation.variables === user.id}
                                                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 text-white px-2.5 py-1.5 text-[11px] font-bold hover:bg-green-700 disabled:opacity-60 transition-colors"
                                                    title="Pay this month's salary to this user"
                                                >
                                                    {payMutation.isPending && payMutation.variables === user.id ? (
                                                        <Loader2 size={11} className="animate-spin" />
                                                    ) : (
                                                        <Play size={11} />
                                                    )}
                                                    Pay Salary
                                                </button>
                                            ) : (
                                                <span className="text-[10px] text-slate-300">—</span>
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
                        <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary py-1 px-3 text-xs">Previous</button>
                        <span className="text-xs text-slate-500 font-semibold">{page} / {totalPages} pages</span>
                        <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn-secondary py-1 px-3 text-xs">Next</button>
                    </div>
                )}
            </div>
        </div>
    );
}
