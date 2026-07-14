"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Search, ShieldAlert, Check, Ban, XSquare, Loader2, Trash2, Plus, UserPlus, X, Pencil, Save, EyeOff, FileText, Download } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";
import type { jsPDF } from "jspdf";

export default function AdminUsersPage() {
    const { t, locale } = useLocale();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "USER" });

    // Edit modal state
    const [editUserId, setEditUserId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", role: "", password: "" });

    // Statement modal state
    const [statementUserId, setStatementUserId] = useState<string | null>(null);
    const [statementUserName, setStatementUserName] = useState("");

    const { data, isLoading } = useQuery({
        queryKey: ["admin-users", page, search, status],
        queryFn: () => adminApi.users({ page, limit: 12, search: search || undefined, status: status || undefined }),
    });

    const { data: editUserData, isLoading: editLoading } = useQuery({
        queryKey: ["admin-user-details", editUserId],
        queryFn: () => adminApi.getUserDetails(editUserId!),
        enabled: !!editUserId,
    });

    const { data: statementData, isLoading: statementLoading } = useQuery({
        queryKey: ["admin-user-statement", statementUserId],
        queryFn: () => adminApi.getUserStatement(statementUserId!),
        enabled: !!statementUserId,
    });

    const users = data?.users ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / 12) || 1;

    const banMutation = useMutation({
        mutationFn: (id: string) => adminApi.banUser(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
    });

    const unbanMutation = useMutation({
        mutationFn: (id: string) => adminApi.unbanUser(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
    });

    const activateMutation = useMutation({
        mutationFn: (id: string) => adminApi.activateUser(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
    });

    const deactivateMutation = useMutation({
        mutationFn: (id: string) => adminApi.deactivateUser(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
    });

    const createMutation = useMutation({
        mutationFn: (data: { name: string; email: string; phone: string; password: string; role?: string }) => adminApi.createUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            setShowForm(false);
            setForm({ name: "", email: "", phone: "", password: "", role: "USER" });
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || "Failed to create user");
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string; email?: string; phone?: string; password?: string; role?: string } }) => adminApi.updateUser(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
            queryClient.invalidateQueries({ queryKey: ["admin-user-details"] });
            closeEdit();
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || "Failed to update user");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminApi.deleteUser(id),
        onSuccess: (_data, userId) => {
            queryClient.setQueriesData<any>({ queryKey: ["admin-users"] }, (old: any) => {
                if (!old?.users) return old;
                return { ...old, users: old.users.filter((u: any) => u.id !== userId) };
            });
        },
    });

    const handleDelete = (id: string, name: string) => {
        if (window.confirm(`Are you sure you want to permanently delete "${name}"? This action cannot be undone.`)) {
            deleteMutation.mutate(id);
        }
    };

    const openEdit = (user: any) => {
        setEditForm({
            name: user.name || "",
            email: user.email || "",
            phone: user.phone || "",
            role: user.role || "USER",
            password: "",
        });
        setEditUserId(user.id);
    };

    const closeEdit = () => {
        setEditUserId(null);
        setEditForm({ name: "", email: "", phone: "", role: "", password: "" });
    };

    const handleSaveEdit = () => {
        const payload: any = {};
        if (editForm.name !== editUserData?.name) payload.name = editForm.name;
        if (editForm.email !== editUserData?.email) payload.email = editForm.email;
        if (editForm.phone !== editUserData?.phone) payload.phone = editForm.phone;
        if (editForm.role !== editUserData?.role) payload.role = editForm.role;
        if (editForm.password) payload.password = editForm.password;
        if (Object.keys(payload).length === 0) { closeEdit(); return; }
        updateMutation.mutate({ id: editUserId!, data: payload });
    };

    const openStatement = (user: any) => {
        setStatementUserId(user.id);
        setStatementUserName(user.name);
    };

    const closeStatement = () => {
        setStatementUserId(null);
        setStatementUserName("");
    };

    const downloadStatementPDF = async () => {
        if (!statementData) return;
        const jsPDFMod = await import("jspdf");
        await import("jspdf-autotable");
        const doc = new jsPDFMod.default({ format: "a4" });
        const acc = statementData.account;
        const tx = statementData.transactions ?? [];
        const wd = statementData.withdrawals ?? [];

        let y = 20;
        const l = (text: string, opts?: any) => {
            const r = doc.text(text, 14, y, opts || {});
            y += (opts?.lineHeight ?? 7);
            return r;
        };

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        l("Bangla Park Limited");
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        l(`Account Statement — ${acc.name} (#${acc.memberId})`);
        l(`Email: ${acc.email} | Phone: ${acc.phone}`);
        l(`Referral: ${acc.referralCode} | Used Code: ${acc.usedReferralCode || "None"}`);
        l(`Generated: ${new Date().toLocaleDateString("en-GB")}`);
        y += 4;

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        l("Wallet Summary");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        l(`Balance: ৳${acc.walletBalance}`);
        l(`Daily Reward: ৳${acc.dailyReward}`);
        l(`Tier Bonus: ৳${acc.tierBonus}`);
        l(`Generation Income: ৳${acc.generationIncome}`);
        l(`Pending Withdrawal: ৳${acc.pendingWithdrawal}`);
        l(`Withdrawable: ৳${acc.withdrawable}`);
        y += 4;

        if (tx.length > 0) {
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            l("Transactions (Last 50)");
            (doc as any).autoTable({
                startY: y,
                head: [["Date", "Type", "Amount", "Balance", "Description"]],
                body: tx.map((t: any) => [
                    new Date(t.createdAt).toLocaleDateString("en-GB"),
                    t.type,
                    `৳${t.amount}`,
                    `৳${t.balanceAfter ?? ""}`,
                    t.description ?? "",
                ]),
                styles: { fontSize: 7 },
                headStyles: { fillColor: [22, 163, 74] },
            });
            y = (doc as any).lastAutoTable.finalY + 8;
        }

        if (wd.length > 0) {
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            l("Withdrawals (Last 50)");
            (doc as any).autoTable({
                startY: y,
                head: [["Date", "Amount", "Method", "Status"]],
                body: wd.map((w: any) => [
                    new Date(w.createdAt).toLocaleDateString("en-GB"),
                    `৳${w.amount}`,
                    w.method,
                    w.status,
                ]),
                styles: { fontSize: 7 },
                headStyles: { fillColor: [22, 163, 74] },
            });
            y = (doc as any).lastAutoTable.finalY + 8;
        }

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        l(`Team Members: ${statementData.team?.totalTeam ?? 0}`);
        l(`Total Orders: ${statementData.orders?.totalOrders ?? 0} | Total Spent: ৳${statementData.orders?.totalSpent ?? 0}`);

        doc.save(`statement_${acc.memberId}_${acc.name.replace(/\s+/g, "_")}.pdf`);
    };

    const isRtl = locale === "bn";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">{t("admin.users.heading")}</h1>
                <p className="text-sm text-slate-500">{t("admin.users.subheading")}</p>
            </div>

            {/* Filter and search bar */}
            <div className="card p-5 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                    <input
                        type="text"
                        className="input pl-10"
                        placeholder={t("admin.users.search.placeholder")}
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    />
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>

                <select
                    className="input sm:w-44 cursor-pointer"
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                >
                    <option value="">{t("admin.users.filter.all")}</option>
                    <option value="ACTIVE">{t("admin.users.filter.active")}</option>
                    <option value="INACTIVE">{t("admin.users.filter.inactive")}</option>
                </select>
            </div>

            {/* Add User */}
            <div className="flex justify-end">
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
                >
                    {showForm ? <X size={16} /> : <UserPlus size={16} />}
                    {showForm ? "Cancel" : "Add User"}
                </button>
            </div>

            {showForm && (
                <div className="card p-6 bg-white space-y-4">
                    <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Create New User</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Name</label>
                            <input type="text" className="input w-full" value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                            <input type="email" className="input w-full" value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                            <input type="text" className="input w-full" value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                            <input type="password" className="input w-full" value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Role</label>
                            <select className="input w-full" value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value })}>
                                <option value="USER">User</option>
                                <option value="ADMIN">Admin</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button
                            onClick={() => createMutation.mutate(form)}
                            disabled={createMutation.isPending || !form.name || !form.email || !form.phone || !form.password}
                            className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
                        >
                            {createMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                            Create {form.role === "ADMIN" ? "Admin" : "User"}
                        </button>
                    </div>
                </div>
            )}

            {/* Users table list */}
            <div className="card overflow-hidden">
                {isLoading ? (
                    <div className="py-20 flex justify-center">
                        <Loader2 className="animate-spin text-slate-700" size={32} />
                    </div>
                ) : users.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">{t("admin.users.empty")}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-55 bg-slate-50 border-b border-slate-150">
                                    <th className="p-4 text-xs font-bold text-slate-600">{t("admin.users.table.colUser")}</th>
                                    <th className="p-4 text-xs font-bold text-slate-600">{t("admin.users.table.colReferral")}</th>
                                    <th className="p-4 text-xs font-bold text-slate-600">{t("admin.users.table.colActivation")}</th>
                                    <th className="p-4 text-xs font-bold text-slate-600 text-center">{t("admin.users.table.colStatus")}</th>
                                    <th className="p-4 text-xs font-bold text-slate-600 text-center">{t("admin.users.table.colAction")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {users.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50">
                                        <td className="p-4 min-w-[200px]">
                                            <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                                                {item.name}
                                                {item.isBanned && (
                                                    <span className="text-[9px] font-bold text-red-700 bg-red-50 rounded-full px-1.5 py-0.5 border border-red-200">{t("admin.users.table.bannedBadge")}</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-laravel text-gray-500 font-medium">{item.phone}</div>
                                            <div className="text-[10px] text-gray-400">{item.email}</div>
                                        </td>
                                        <td className="p-4 text-xs font-bold text-slate-700">{item.referralCode}</td>
                                        <td className="p-4 text-xs text-slate-500">
                                            {item.activeUntil ? formatDate(item.activeUntil) : t("admin.users.table.noActivation")}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${item.status === "ACTIVE" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-500"
                                                }`}>
                                                {item.status === "ACTIVE" ? t("admin.users.table.statusActive") : t("admin.users.table.statusInactive")}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* Statement */}
                                                <button onClick={() => openStatement(item)} className="rounded-lg p-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors" title="Statement">
                                                    <FileText size={14} />
                                                </button>

                                                {/* Edit */}
                                                <button onClick={() => openEdit(item)} className="rounded-lg p-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors" title="Edit user">
                                                    <Pencil size={14} />
                                                </button>

                                                {/* Ban / Unban triggers */}
                                                {item.isBanned ? (
                                                    <button onClick={() => unbanMutation.mutate(item.id)} className="rounded-lg p-1.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors" title={t("admin.users.table.unbanTitle")}>
                                                        <Check size={14} />
                                                    </button>
                                                ) : (
                                                    <button onClick={() => banMutation.mutate(item.id)} className="rounded-lg p-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors" title={t("admin.users.table.banTitle")}>
                                                        <Ban size={14} />
                                                    </button>
                                                )}

                                                {/* Force Activation / Deactivation hooks */}
                                                {item.status === "ACTIVE" ? (
                                                    <button onClick={() => deactivateMutation.mutate(item.id)} className="btn-secondary py-1 px-2.5 text-[10px] font-bold text-amber-800 hover:bg-amber-50">
                                                        {t("admin.users.table.deactivate")}
                                                    </button>
                                                ) : (
                                                    <button onClick={() => activateMutation.mutate(item.id)} className="btn-primary py-1 px-2.5 text-[10px] font-bold">
                                                        {t("admin.users.table.activate")}
                                                    </button>
                                                )}

                                                <button onClick={() => handleDelete(item.id, item.name)} className="rounded-lg p-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors" title={t("admin.users.table.deleteTitle")}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
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
                        <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary py-1 px-3 text-xs">{t("admin.users.prev")}</button>
                        <span className="text-xs text-slate-500 font-semibold">{page} / {totalPages} {t("admin.users.page")}</span>
                        <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn-secondary py-1 px-3 text-xs">{t("admin.users.next")}</button>
                    </div>
                )}
            </div>

            {/* Edit User Modal */}
            {editUserId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeEdit}>
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-6 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800">Edit User</h2>
                            <button onClick={closeEdit} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        {editLoading ? (
                            <div className="py-20 flex justify-center">
                                <Loader2 className="animate-spin text-slate-700" size={32} />
                            </div>
                        ) : editUserData ? (
                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <InfoCard label="Member ID" value={`#${editUserData.memberId}`} />
                                    <InfoCard label="Referral Code" value={editUserData.referralCode} />
                                    <InfoCard label="Status" value={editUserData.status} />
                                    <InfoCard label="Banned" value={editUserData.isBanned ? "Yes" : "No"} />
                                    <InfoCard label="Referrals" value={String(editUserData.referralsCount)} />
                                    <InfoCard label="Orders" value={String(editUserData.ordersCount)} />
                                    <InfoCard label="Joined" value={formatDate(editUserData.createdAt)} />
                                    <InfoCard label="Parent" value={editUserData.parent ? `${editUserData.parent.name} (#${editUserData.parent.memberId})` : "None"} />
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-700 mb-2">Wallet</h3>
                                    <div className="grid grid-cols-3 gap-3">
                                        <InfoCard label="Balance" value={`৳${editUserData.wallet?.balance ?? 0}`} />
                                        <InfoCard label="Total Earned" value={`৳${editUserData.wallet?.totalEarned ?? 0}`} />
                                        <InfoCard label="Pending Withdrawal" value={`৳${editUserData.wallet?.pendingWithdrawal ?? 0}`} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                        <InfoCard label="Commission Earned" value={`৳${editUserData.totalCommission ?? 0}`} />
                                        <InfoCard label="Withdrawals Approved" value={`৳${editUserData.totalWithdrawnApproved ?? 0}`} />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-700 mb-3">Edit Fields</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-xs font-semibold text-slate-600 mb-1 ${isRtl ? "text-right" : ""}`}>Name</label>
                                            <input type="text" className="input w-full" value={editForm.name}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className={`block text-xs font-semibold text-slate-600 mb-1 ${isRtl ? "text-right" : ""}`}>Email</label>
                                            <input type="email" className="input w-full" value={editForm.email}
                                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className={`block text-xs font-semibold text-slate-600 mb-1 ${isRtl ? "text-right" : ""}`}>Phone</label>
                                            <input type="text" className="input w-full" value={editForm.phone}
                                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className={`block text-xs font-semibold text-slate-600 mb-1 ${isRtl ? "text-right" : ""}`}>Role</label>
                                            <select className="input w-full" value={editForm.role}
                                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                                                <option value="USER">User</option>
                                                <option value="ADMIN">Admin</option>
                                                <option value="SUPER_ADMIN">Super Admin</option>
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className={`block text-xs font-semibold text-slate-600 mb-1 ${isRtl ? "text-right" : ""}`}>
                                                Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
                                            </label>
                                            <input type="password" className="input w-full" value={editForm.password} placeholder="New password"
                                                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                    <button onClick={closeEdit} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
                                    <button
                                        onClick={handleSaveEdit}
                                        disabled={updateMutation.isPending}
                                        className="btn-primary py-2 px-4 text-sm flex items-center gap-2"
                                    >
                                        {updateMutation.isPending ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                        Save Changes
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="py-20 text-center text-slate-400">User not found</div>
                        )}
                    </div>
                </div>
            )}

            {/* Statement Modal */}
            {statementUserId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={closeStatement}>
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                            <h2 className="text-lg font-bold text-slate-800">Statement — {statementUserName}</h2>
                            <div className="flex items-center gap-2">
                                {statementData && (
                                    <button onClick={downloadStatementPDF} className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5">
                                        <Download size={14} />
                                        PDF
                                    </button>
                                )}
                                <button onClick={closeStatement} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                                    <X size={20} className="text-slate-500" />
                                </button>
                            </div>
                        </div>

                        {statementLoading ? (
                            <div className="py-20 flex justify-center">
                                <Loader2 className="animate-spin text-slate-700" size={32} />
                            </div>
                        ) : statementData ? (
                            <div className="p-6 space-y-6">
                                {/* Account Info */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-700 mb-3">Account</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <InfoCard label="Name" value={statementData.account.name} />
                                        <InfoCard label="Member ID" value={`#${statementData.account.memberId}`} />
                                        <InfoCard label="Email" value={statementData.account.email} />
                                        <InfoCard label="Phone" value={statementData.account.phone} />
                                        <InfoCard label="Referral Code" value={statementData.account.referralCode} />
                                        <InfoCard label="Used Code" value={statementData.account.usedReferralCode || "None"} />
                                        <InfoCard label="Status" value={statementData.account.status} />
                                        <InfoCard label="Role" value={statementData.account.role} />
                                    </div>
                                </div>

                                {/* Wallet Summary */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-700 mb-3">Wallet Summary</h3>
                                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                                        <InfoCard label="Balance" value={`৳${statementData.account.walletBalance}`} />
                                        <InfoCard label="Daily Reward" value={`৳${statementData.account.dailyReward}`} />
                                        <InfoCard label="Tier Bonus" value={`৳${statementData.account.tierBonus}`} />
                                        <InfoCard label="Generation Income" value={`৳${statementData.account.generationIncome}`} />
                                        <InfoCard label="Pending Withdrawal" value={`৳${statementData.account.pendingWithdrawal}`} />
                                        <InfoCard label="Withdrawable" value={`৳${statementData.account.withdrawable}`} />
                                    </div>
                                </div>

                                {/* Transactions */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-700 mb-3">Transactions (Last 50)</h3>
                                    {statementData.transactions?.length > 0 ? (
                                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                    <tr className="bg-red-600 text-white">
                                                        <th className="p-2.5 font-semibold">Date</th>
                                                        <th className="p-2.5 font-semibold">Type</th>
                                                        <th className="p-2.5 font-semibold text-right">Amount</th>
                                                        <th className="p-2.5 font-semibold text-right">Balance</th>
                                                        <th className="p-2.5 font-semibold">Description</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {statementData.transactions.map((tx: any) => (
                                                        <tr key={tx.id} className="hover:bg-slate-50">
                                                            <td className="p-2.5 text-slate-500 whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                                                            <td className="p-2.5 font-medium">{tx.type}</td>
                                                            <td className={`p-2.5 text-right font-semibold ${Number(tx.amount) >= 0 ? "text-red-700" : "text-red-600"}`}>
                                                                ৳{tx.amount}
                                                            </td>
                                                            <td className="p-2.5 text-right text-slate-600">৳{tx.balanceAfter ?? ""}</td>
                                                            <td className="p-2.5 text-slate-500 max-w-[200px] truncate">{tx.description ?? ""}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400">No transactions yet</p>
                                    )}
                                </div>

                                {/* Withdrawals */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-700 mb-3">Withdrawals (Last 50)</h3>
                                    {statementData.withdrawals?.length > 0 ? (
                                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                                            <table className="w-full text-left text-xs">
                                                <thead>
                                                    <tr className="bg-red-600 text-white">
                                                        <th className="p-2.5 font-semibold">Date</th>
                                                        <th className="p-2.5 font-semibold text-right">Amount</th>
                                                        <th className="p-2.5 font-semibold">Method</th>
                                                        <th className="p-2.5 font-semibold">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {statementData.withdrawals.map((w: any) => (
                                                        <tr key={w.id} className="hover:bg-slate-50">
                                                            <td className="p-2.5 text-slate-500 whitespace-nowrap">{formatDate(w.createdAt)}</td>
                                                            <td className="p-2.5 text-right font-semibold text-slate-800">৳{w.amount}</td>
                                                            <td className="p-2.5 text-slate-600">{w.method}</td>
                                                            <td className="p-2.5">
                                                                <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${w.status === "APPROVED" ? "bg-red-100 text-red-800" : w.status === "REJECTED" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                                                                    {w.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-400">No withdrawals yet</p>
                                    )}
                                </div>

                                {/* Team & Orders */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-700 mb-3">Summary</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <InfoCard label="Team Members" value={String(statementData.team?.totalTeam ?? 0)} />
                                        <InfoCard label="Total Orders" value={String(statementData.orders?.totalOrders ?? 0)} />
                                        <InfoCard label="Total Spent" value={`৳${statementData.orders?.totalSpent ?? 0}`} />
                                        <InfoCard label="Generated" value={new Date().toLocaleDateString("en-GB")} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-20 text-center text-slate-400">Failed to load statement</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-slate-50 rounded-xl p-3">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
            <div className="text-sm font-bold text-slate-800 mt-0.5">{value}</div>
        </div>
    );
}