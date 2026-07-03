"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useTransition } from "react";
import { Plus, Edit2, Trash2, CheckCircle2, ArrowLeft, Loader2, ImagePlus } from "lucide-react";
import { productsApi } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

interface ProductFormState {
    name: string;
    slug: string;
    description: string;
    price: number;
    stock: number;
    categoryId: string;
    images: string[];
}

const initialForm: ProductFormState = {
    name: "",
    slug: "",
    description: "",
    price: 0,
    stock: 10,
    categoryId: "",
    images: [""],
};

export default function AdminProductsPage() {
    const { t } = useLocale();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [view, setView] = useState<"list" | "form">("list");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<ProductFormState>(initialForm);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Load products list
    const { data: prodData, isLoading: prodLoading } = useQuery({
        queryKey: ["admin-products", page],
        queryFn: () => productsApi.list({ page, limit: 12 }),
    });

    // Load categories list for dropdowns
    const { data: catData } = useQuery({
        queryKey: ["categories"],
        queryFn: () => categoriesApi.list(),
    });

    const products = prodData?.products ?? [];
    const total = prodData?.total ?? 0;
    const totalPages = Math.ceil(total / 12) || 1;
    const categories = catData?.categories ?? [];

    // Mutations
    const createMutation = useMutation({
        mutationFn: (data: any) => productsApi.create(data),
        onSuccess: () => {
            setMsg({ type: "success", text: t("admin.products.createSuccess") });
            setView("list");
            queryClient.invalidateQueries({ queryKey: ["admin-products"] });
        },
        onError: (err: any) => {
            setMsg({ type: "error", text: err.response?.data?.message || t("admin.products.createError") });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => productsApi.update(id, data),
        onSuccess: () => {
            setMsg({ type: "success", text: t("admin.products.updateSuccess") });
            setView("list");
            queryClient.invalidateQueries({ queryKey: ["admin-products"] });
        },
        onError: (err: any) => {
            setMsg({ type: "error", text: err.response?.data?.message || t("admin.products.updateError") });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => productsApi.delete(id),
        onSuccess: () => {
            setMsg({ type: "success", text: t("admin.products.deleteSuccess") });
            queryClient.invalidateQueries({ queryKey: ["admin-products"] });
        },
        onError: (err: any) => {
            setMsg({ type: "error", text: t("admin.products.deleteError") });
        },
    });

    // Form handlers
    const handleEditInit = (prod: any) => {
        setEditingId(prod.id);
        setForm({
            name: prod.name,
            slug: prod.slug,
            description: prod.description || "",
            price: Number(prod.price),
            stock: prod.stock,
            categoryId: prod.categoryId || "",
            images: prod.images && prod.images.length > 0 ? [...prod.images] : [""],
        });
        setView("form");
    };

    const handleCreateInit = () => {
        setEditingId(null);
        setForm({
            ...initialForm,
            categoryId: categories[0]?.id || "",
        });
        setView("form");
    };

    const handleImageChange = (index: number, val: string) => {
        const updated = [...form.images];
        updated[index] = val;
        setForm({ ...form, images: updated });
    };

    const addImageUrlInput = () => {
        setForm({ ...form, images: [...form.images, ""] });
    };

    const removeImageUrlInput = (index: number) => {
        setForm({ ...form, images: form.images.filter((_, i) => i !== index) });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);

        // Clean image URLs (ignore empty fields)
        const cleanImages = form.images.filter((url) => !!url.trim());

        const payload = {
            name: form.name,
            slug: form.slug || form.name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, ""),
            description: form.description,
            price: Number(form.price),
            stock: Number(form.stock),
            categoryId: form.categoryId || undefined,
            images: cleanImages,
        };

        if (editingId) {
            updateMutation.mutate({ id: editingId, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">{t("admin.products.heading")}</h1>
                    <p className="text-sm text-slate-500">{t("admin.products.subheading")}</p>
                </div>
                {view === "list" ? (
                    <button onClick={handleCreateInit} className="btn-primary flex items-center gap-1.5 py-2 px-4 shadow">
                        <Plus size={16} /> {t("admin.products.addButton")}
                    </button>
                ) : (
                    <button onClick={() => setView("list")} className="btn-secondary flex items-center gap-1.5 py-2 px-4">
                        <ArrowLeft size={16} /> {t("admin.products.backButton")}
                    </button>
                )}
            </div>

            {msg && (
                <div className={`rounded-xl p-4 text-xs font-semibold ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-650"}`}>
                    {msg.text}
                </div>
            )}

            {view === "form" ? (
                /* Edit or create form */
                <form onSubmit={handleSubmit} className="card p-6 lg:p-8 bg-white space-y-5">
                    <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">
                        {editingId ? t("admin.products.form.editTitle") : t("admin.products.form.createTitle")}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="label mb-1 block">{t("admin.products.form.nameLabel")}</label>
                            <input
                                type="text"
                                className="input text-left"
                                required
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="label mb-1 block">{t("admin.products.form.slugLabel")}</label>
                            <input
                                type="text"
                                className="input text-left font-mono"
                                placeholder={t("admin.products.form.slugPlaceholder")}
                                value={form.slug}
                                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="label mb-1 block">{t("admin.products.form.priceLabel")}</label>
                            <input
                                type="number"
                                className="input text-left font-semibold"
                                required
                                value={form.price || ""}
                                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="label mb-1 block">{t("admin.products.form.stockLabel")}</label>
                            <input
                                type="number"
                                className="input text-left font-semibold"
                                required
                                value={form.stock || ""}
                                onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="label mb-1 block">{t("admin.products.form.categoryLabel")}</label>
                            <select
                                className="input cursor-pointer"
                                value={form.categoryId}
                                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                            >
                                <option value="">{t("admin.products.form.categoryPlaceholder")}</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="label mb-1 block">{t("admin.products.form.descriptionLabel")}</label>
                        <textarea
                            className="input text-left min-h-[100px]"
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                    </div>

                    {/* Dynamic Image Link items inputs */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="label font-bold text-slate-700">{t("admin.products.form.imagesLabel")}</label>
                            <button type="button" onClick={addImageUrlInput} className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                                <ImagePlus size={14} /> {t("admin.products.form.addImage")}
                            </button>
                        </div>
                        {form.images.map((img, i) => (
                            <div key={i} className="flex gap-2">
                                <input
                                    type="text"
                                    className="input text-left flex-1"
                                    placeholder="https://example.com/image.jpg"
                                    value={img}
                                    onChange={(e) => handleImageChange(i, e.target.value)}
                                />
                                {form.images.length > 1 && (
                                    <button type="button" onClick={() => removeImageUrlInput(i)} className="text-red-500 hover:text-red-750 px-2 py-1 border border-red-200 rounded-lg bg-red-50/50">
                                        {t("admin.products.form.removeImage")}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="btn-primary w-full py-3.5">
                        {editingId ? t("admin.products.form.submitUpdate") : t("admin.products.form.submitCreate")}
                    </button>
                </form>
            ) : (
                /* Read list directory */
                <div className="card overflow-hidden bg-white">
                    {prodLoading ? (
                        <div className="py-20 flex justify-center">
                            <Loader2 className="animate-spin text-slate-800" size={32} />
                        </div>
                    ) : products.length === 0 ? (
                        <div className="py-20 text-center text-slate-400">{t("admin.products.list.empty")}</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-150">
                                        <th className="p-4 text-xs font-bold text-slate-600">{t("admin.products.list.colProduct")}</th>
                                        <th className="p-4 text-xs font-bold text-slate-600">{t("admin.products.list.colCategory")}</th>
                                        <th className="p-4 text-xs font-bold text-slate-600 text-right">{t("admin.products.list.colPrice")}</th>
                                        <th className="p-4 text-xs font-bold text-slate-600 text-center">{t("admin.products.list.colStock")}</th>
                                        <th className="p-4 text-xs font-bold text-slate-600 text-center">{t("admin.products.list.colAction")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {products.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50">
                                            <td className="p-4 min-w-[240px]">
                                                <div className="flex gap-3 items-center">
                                                    <div className="w-12 h-12 rounded bg-slate-50 border border-slate-100 overflow-hidden flex-shrink-0">
                                                        {item.images?.[0] ? <img src={item.images[0]} alt={item.name} className="h-full w-full object-cover" /> : <div className="text-[9px] text-gray-300 h-full flex items-center justify-center">No image</div>}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="text-sm font-semibold text-slate-800 block truncate">{item.name}</span>
                                                        {Number(item.price) >= 2000 && (
                                                            <span className="inline-block mt-0.5 rounded-full bg-amber-50 text-amber-800 px-1.5 py-0.5 text-[9px] font-bold border border-amber-200">{t("admin.products.list.activationBadge")}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs text-slate-650">{item.category?.name || t("admin.products.list.uncategorized")}</td>
                                            <td className="p-4 text-sm font-bold text-slate-800 text-right">{formatCurrency(item.price)}</td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${item.stock > 0 ? "bg-slate-100 text-slate-800" : "bg-red-50 text-red-650"
                                                    }`}>
                                                    {item.stock} {t("admin.products.list.stockUnit")}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex gap-2 justify-center">
                                                    <button onClick={() => handleEditInit(item)} className="p-1.5 rounded-lg border border-slate-150 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                                        <Edit2 size={13} />
                                                    </button>
                                                    <button onClick={() => { if (confirm(t("admin.products.list.confirmDelete"))) deleteMutation.mutate(item.id); }} className="p-1.5 rounded-lg border border-slate-150 text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors">
                                                        <Trash2 size={13} />
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
                            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary py-1 px-3 text-xs">{t("admin.products.prev")}</button>
                            <span className="text-xs text-slate-500 font-semibold">{page} / {totalPages} {t("admin.products.page")}</span>
                            <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn-secondary py-1 px-3 text-xs">{t("admin.products.next")}</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
