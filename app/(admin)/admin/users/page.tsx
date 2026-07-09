"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ShieldAlert, Check, Ban, XSquare, Loader2, Trash2, Plus, UserPlus, X } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { formatDate } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

export default function AdminUsersPage() {
    const { t } = useLocale();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", role: "USER" });

    const { data, isLoading } = useQuery({
        queryKey: ["admin-users", page, search, status],
        queryFn: () => adminApi.users({ page, limit: 12, search: search || undefined, status: status || undefined }),
    });

    const users = data?.users ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / 12) || 1;

    // Mutation commands
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
                                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${item.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-500"
                                                }`}>
                                                {item.status === "ACTIVE" ? t("admin.users.table.statusActive") : t("admin.users.table.statusInactive")}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-center gap-2">
                                                {/* Ban / Unban triggers */}
                                                {item.isBanned ? (
                                                    <button onClick={() => unbanMutation.mutate(item.id)} className="rounded-lg p-1.5 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors" title={t("admin.users.table.unbanTitle")}>
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
        </div>
    );
}
