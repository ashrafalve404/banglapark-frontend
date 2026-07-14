"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Edit2, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { categoriesApi } from "@/lib/api/categories";
import { useLocale } from "@/lib/i18n";

export default function AdminCategoriesPage() {
    const { t } = useLocale();
    const queryClient = useQueryClient();
    const [name, setName] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Read categories list
    const { data: categoriesData, isLoading } = useQuery({
        queryKey: ["categories"],
        queryFn: () => categoriesApi.list(),
    });

    const categories = categoriesData?.categories ?? [];

    // Create category mutation
    const createMutation = useMutation({
        mutationFn: (catName: string) => categoriesApi.create({ name: catName }),
        onSuccess: () => {
            setName("");
            setMsg({ type: "success", text: t("admin.categories.createSuccess") });
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
        onError: (err: any) => {
            setMsg({
                type: "error",
                text: err.response?.data?.message || t("admin.categories.createError"),
            });
        },
    });

    // Update category mutation
    const updateMutation = useMutation({
        mutationFn: ({ id, catName }: { id: string; catName: string }) =>
            categoriesApi.update(id, { name: catName }),
        onSuccess: () => {
            setEditingId(null);
            setEditingName("");
            setMsg({ type: "success", text: t("admin.categories.updateSuccess") });
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
        onError: (err: any) => {
            setMsg({
                type: "error",
                text: err.response?.data?.message || t("admin.categories.updateError"),
            });
        },
    });

    // Delete category mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => categoriesApi.delete(id),
        onSuccess: () => {
            setMsg({ type: "success", text: t("admin.categories.deleteSuccess") });
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
        onError: (err: any) => {
            setMsg({
                type: "error",
                text: err.response?.data?.message || t("admin.categories.deleteError"),
            });
        },
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        setMsg(null);
        createMutation.mutate(name.trim());
    };

    const handleUpdate = (e: React.FormEvent, id: string) => {
        e.preventDefault();
        if (!editingName.trim()) return;
        setMsg(null);
        updateMutation.mutate({ id, catName: editingName.trim() });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">{t("admin.categories.heading")}</h1>
                <p className="text-sm text-slate-500">{t("admin.categories.subheading")}</p>
            </div>

            {msg && (
                <div className={`rounded-lg p-4 text-xs font-semibold ${msg.type === "success" ? "bg-red-50 text-red-700 font-bold" : "bg-red-50 text-red-650"}`}>
                    {msg.type === "success" ? <CheckCircle2 size={16} className="inline mr-2" /> : <AlertCircle size={16} className="inline mr-2" />}
                    {msg.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create Input form wrapper */}
                <div className="card p-6 bg-white space-y-4 h-fit">
                    <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">{t("admin.categories.form.heading")}</h2>
                    <form onSubmit={handleCreate} className="space-y-3">
                        <div>
                            <label className="label mb-1 block">{t("admin.categories.form.nameLabel")}</label>
                            <input
                                type="text"
                                className="input text-left"
                                placeholder={t("admin.categories.form.placeholder")}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <button type="submit" disabled={createMutation.isPending} className="btn-primary w-full py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold">
                            <Plus size={16} /> {t("admin.categories.form.submit")}
                        </button>
                    </form>
                </div>

                {/* Categories table directory list */}
                <div className="lg:col-span-2 card overflow-hidden bg-white">
                    <div className="p-5 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-800">{t("admin.categories.list.heading")}</h3>
                    </div>

                    {isLoading ? (
                        <div className="py-16 text-center text-slate-400">{t("admin.categories.list.loading")}</div>
                    ) : categories.length === 0 ? (
                        <div className="py-16 text-center text-slate-400 font-medium">{t("admin.categories.list.empty")}</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {categories.map((item) => (
                                <div key={item.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                                    {editingId === item.id ? (
                                        <form onSubmit={(e) => handleUpdate(e, item.id)} className="flex-1 flex gap-2">
                                            <input
                                                type="text"
                                                className="input text-left py-1 text-xs"
                                                value={editingName}
                                                onChange={(e) => setEditingName(e.target.value)}
                                                autoFocus
                                            />
                                            <button type="submit" className="btn-primary py-1 px-3 text-xs">{t("admin.categories.list.save")}</button>
                                            <button type="button" onClick={() => setEditingId(null)} className="btn-secondary py-1 px-3 text-xs text-red-500 hover:bg-red-50">{t("admin.categories.list.cancel")}</button>
                                        </form>
                                    ) : (
                                        <>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-850 text-slate-800">{item.name}</p>
                                                <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">{t("admin.categories.list.idLabel")} {item.id}</span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => { setEditingId(item.id); setEditingName(item.name); }}
                                                    className="rounded-lg p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors border border-gray-100"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => { if (confirm(t("admin.categories.list.confirmDelete"))) deleteMutation.mutate(item.id); }}
                                                    className="rounded-lg p-1.5 text-slate-500 hover:text-red-650 hover:bg-red-50/50 transition-colors border border-gray-100"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
