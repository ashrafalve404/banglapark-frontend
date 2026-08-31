"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PlusCircle, Megaphone, CheckCircle2, Clock, Eye, EyeOff, Trash2, Edit, RefreshCw, Search } from "lucide-react";
import { digitalMarketingApi, type DigitalMarketingPackage } from "@/lib/api/digital-marketing";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export default function AdminDigitalMarketingPage() {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingPkg, setEditingPkg] = useState<DigitalMarketingPackage | null>(null);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [profitPercent, setProfitPercent] = useState("1.00");
    const [durationHours, setDurationHours] = useState("24");

    const { data: packages, isLoading: pkgLoading, refetch: refetchPackages } = useQuery({
        queryKey: ["admin-dm-packages"],
        queryFn: () => digitalMarketingApi.adminGetAllPackages(),
    });

    const { data: purchasesData, isLoading: purLoading, refetch: refetchPurchases } = useQuery({
        queryKey: ["admin-dm-purchases", page, statusFilter],
        queryFn: () => digitalMarketingApi.adminGetAllPurchases({ page, limit: 20, status: statusFilter || undefined }),
    });

    const createMutation = useMutation({
        mutationFn: (body: Partial<DigitalMarketingPackage>) => digitalMarketingApi.adminCreatePackage(body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-dm-packages"] });
            resetForm();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, body }: { id: string; body: Partial<DigitalMarketingPackage> }) => digitalMarketingApi.adminUpdatePackage(id, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-dm-packages"] });
            resetForm();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => digitalMarketingApi.adminDeletePackage(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-dm-packages"] }),
    });

    const resetForm = () => {
        setShowModal(false);
        setEditingPkg(null);
        setTitle("");
        setDescription("");
        setPrice("");
        setProfitPercent("1.00");
        setDurationHours("24");
    };

    const handleEdit = (pkg: DigitalMarketingPackage) => {
        setEditingPkg(pkg);
        setTitle(pkg.title);
        setDescription(pkg.description || "");
        setPrice(String(pkg.price));
        setProfitPercent(String(pkg.profitPercent));
        setDurationHours(String(pkg.durationHours));
        setShowModal(true);
    };

    const purchases = purchasesData?.purchases ?? [];
    const totalPages = purchasesData?.totalPages ?? 1;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Digital Marketing Packages</h1>
                    <p className="text-sm text-slate-500">Create, edit and manage 24h return packages and monitor user investments</p>
                </div>
                <div className="flex items-center gap-2 self-start">
                    <button onClick={() => { refetchPackages(); refetchPurchases(); }} className="btn-secondary py-2 px-3 flex items-center gap-1.5 text-xs">
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <button onClick={() => { resetForm(); setShowModal(true); }} className="py-2 px-4 flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-xs">
                        <PlusCircle size={14} /> Create Package
                    </button>
                </div>
            </div>

            {/* Packages Grid / Table */}
            <div className="card p-5 bg-white space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Megaphone size={18} className="text-indigo-600" /> Package List
                </h2>

                {pkgLoading ? (
                    <div className="py-10 text-center text-slate-400">Loading packages...</div>
                ) : !packages || packages.length === 0 ? (
                    <div className="py-10 text-center text-slate-400">No packages created yet. Click "Create Package" to add one.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {packages.map((pkg) => (
                            <div key={pkg.id} className={`p-4 rounded-xl border ${pkg.isHidden ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-slate-200"} space-y-3`}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm">{pkg.title}</h3>
                                        <p className="text-xs text-slate-500 line-clamp-1">{pkg.description || "No description"}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => updateMutation.mutate({ id: pkg.id, body: { isHidden: !pkg.isHidden } })} title={pkg.isHidden ? "Unhide" : "Hide"} className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer">
                                            {pkg.isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                        <button onClick={() => handleEdit(pkg)} title="Edit" className="p-1.5 text-slate-400 hover:text-indigo-600 cursor-pointer">
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => { if (confirm("Delete this package?")) deleteMutation.mutate(pkg.id); }} title="Delete" className="p-1.5 text-slate-400 hover:text-red-600 cursor-pointer">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="bg-slate-50 rounded-lg p-2.5 text-xs space-y-1">
                                    <div className="flex justify-between text-slate-700">
                                        <span>Price:</span>
                                        <span className="font-bold">{formatCurrency(pkg.price, "en")}</span>
                                    </div>
                                    <div className="flex justify-between text-amber-700">
                                        <span>Profit:</span>
                                        <span className="font-bold">+{pkg.profitPercent}% in {pkg.durationHours}h</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-700 font-bold">
                                        <span>24h Return:</span>
                                        <span>{formatCurrency(Number(pkg.price) * (1 + Number(pkg.profitPercent) / 100), "en")}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── User Purchases Ledger ── */}
            <div className="card overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Clock size={18} className="text-amber-600" /> User Investment Purchases
                    </h2>
                    <select
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-600"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    >
                        <option value="">All Statuses</option>
                        <option value="ACTIVE">Active (24h Countdown)</option>
                        <option value="COMPLETED">Completed (Credited)</option>
                    </select>
                </div>

                {purLoading ? (
                    <div className="py-16 text-center text-slate-400">Loading user purchases...</div>
                ) : purchases.length === 0 ? (
                    <div className="py-16 text-center text-slate-400">No user purchases found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-bold uppercase">
                                    <th className="p-3.5">Purchased Date</th>
                                    <th className="p-3.5">User</th>
                                    <th className="p-3.5">Package</th>
                                    <th className="p-3.5 text-right">Investment</th>
                                    <th className="p-3.5 text-right">1% Profit</th>
                                    <th className="p-3.5 text-right">Total 24h Return</th>
                                    <th className="p-3.5 text-center">Status</th>
                                    <th className="p-3.5 text-right">Matures At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {purchases.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50">
                                        <td className="p-3.5 text-slate-500 whitespace-nowrap">{formatDateTime(item.purchasedAt, "en")}</td>
                                        <td className="p-3.5">
                                            <p className="font-bold text-slate-900">{item.user?.name}</p>
                                            <p className="text-[10px] text-slate-400">{item.user?.phone} (ID#{item.user?.memberId})</p>
                                        </td>
                                        <td className="p-3.5 font-semibold text-slate-900">{item.package?.title}</td>
                                        <td className="p-3.5 text-right font-bold text-slate-800">{formatCurrency(item.amount, "en")}</td>
                                        <td className="p-3.5 text-right font-bold text-amber-700">+ {formatCurrency(item.profitAmount, "en")}</td>
                                        <td className="p-3.5 text-right font-black text-emerald-700">{formatCurrency(item.totalReturn, "en")}</td>
                                        <td className="p-3.5 text-center">
                                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                                item.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                                            }`}>
                                                {item.status === "COMPLETED" ? <CheckCircle2 size={11} /> : <Clock size={11} />}
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-right text-slate-500 whitespace-nowrap">{formatDateTime(item.maturesAt, "en")}</td>
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

            {/* ── Create / Edit Package Modal ── */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900">{editingPkg ? "Edit Package" : "Create New Package"}</h3>
                            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 text-xl leading-none cursor-pointer">✕</button>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block">Package Title</label>
                                <input type="text" className="input w-full text-sm" placeholder="Starter Marketing Package" value={title} onChange={(e) => setTitle(e.target.value)} />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block">Description (Optional)</label>
                                <textarea className="input w-full text-sm resize-none" rows={2} placeholder="Package details..." value={description} onChange={(e) => setDescription(e.target.value)} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 block">Price (৳)</label>
                                    <input type="number" className="input w-full text-sm" placeholder="1000" min={1} value={price} onChange={(e) => setPrice(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 block">Profit Bonus (%)</label>
                                    <input type="number" step="0.1" className="input w-full text-sm" placeholder="1.00" value={profitPercent} onChange={(e) => setProfitPercent(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => {
                                    if (!title || !price) return;
                                    const body = { title, description, price: Number(price), profitPercent: Number(profitPercent), durationHours: Number(durationHours) };
                                    if (editingPkg) {
                                        updateMutation.mutate({ id: editingPkg.id, body });
                                    } else {
                                        createMutation.mutate(body);
                                    }
                                }}
                                disabled={!title || !price || createMutation.isPending || updateMutation.isPending}
                                className="flex-1 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 cursor-pointer"
                            >
                                {editingPkg ? "Save Changes" : "Create Package"}
                            </button>
                            <button onClick={resetForm} className="px-4 py-2.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
