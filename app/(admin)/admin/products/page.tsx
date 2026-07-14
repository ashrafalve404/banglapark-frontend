"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useTransition } from "react";
import { Plus, Edit2, Trash2, CheckCircle2, ArrowLeft, Loader2, ImagePlus, X } from "lucide-react";
import { productsApi } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { uploadsApi } from "@/lib/api/uploads";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

interface ProductFormState {
    name: string;
    description: string;
    price: number;
    stock: number;
    categoryId: string;
    images: string[];
    sizes: string[];
}

const initialForm: ProductFormState = {
    name: "",
    description: "",
    price: 0,
    stock: 10,
    categoryId: "",
    images: [],
    sizes: [],
};

export default function AdminProductsPage() {
    const { t, locale } = useLocale();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [view, setView] = useState<"list" | "form">("list");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<ProductFormState>(initialForm);
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
    const [sizeInput, setSizeInput] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            description: prod.description || "",
            price: Number(prod.price),
            stock: prod.stock,
            categoryId: prod.categoryId || "",
            images: prod.images && prod.images.length > 0 ? [...prod.images] : [],
            sizes: prod.sizes && prod.sizes.length > 0 ? [...prod.sizes] : [],
        });
        setView("form");
    };

    const handleCreateInit = () => {
        setEditingId(null);
        setForm({
            ...initialForm,
            categoryId: "",
        });
        setView("form");
    };

    const handleImageChange = (index: number, val: string) => {
        const updated = [...form.images];
        updated[index] = val;
        setForm({ ...form, images: updated });
    };

    const addImageUrlInput = () => {
        if (form.images.length >= 4) return;
        setForm({ ...form, images: [...form.images, ""] });
    };

    const removeImageUrlInput = (index: number) => {
        setForm({ ...form, images: form.images.filter((_, i) => i !== index) });
    };

    const COMMON_SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"];

    const addSize = (size: string) => {
        const s = size.trim().toUpperCase();
        if (s && !form.sizes.includes(s)) {
            setForm({ ...form, sizes: [...form.sizes, s] });
        }
        setSizeInput("");
    };

    const removeSize = (size: string) => {
        setForm({ ...form, sizes: form.sizes.filter((s) => s !== size) });
    };

    const handleSizeKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addSize(sizeInput);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);

        // Clean image URLs (ignore empty fields)
        const cleanImages = form.images.filter((url) => !!url.trim());

        const payload = {
            name: form.name,
            description: form.description,
            price: Number(form.price),
            stock: Number(form.stock),
            categoryId: form.categoryId || undefined,
            images: cleanImages,
            sizes: form.sizes,
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
                <div className={`rounded-xl p-4 text-xs font-semibold ${msg.type === "success" ? "bg-red-50 text-red-700" : "bg-red-50 text-red-650"}`}>
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
                            <label className="label mb-1 block">{t("admin.products.form.categoryLabel")} <span className="text-gray-400 font-normal">({t("admin.products.form.optional", undefined, "Optional")})</span></label>
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

                    {/* Sizes */}
                    <div className="space-y-2">
                        <label className="label font-bold text-slate-700">{t("admin.products.form.sizesLabel")}</label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {form.sizes.map((s) => (
                                <span key={s} className="inline-flex items-center gap-1 rounded-md bg-red-50 text-red-800 border border-red-200 px-2.5 py-1 text-xs font-semibold">
                                    {s}
                                    <button type="button" onClick={() => removeSize(s)} className="hover:text-red-600"><X size={11} /></button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="input text-left flex-1"
                                placeholder={t("admin.products.form.sizesPlaceholder")}
                                value={sizeInput}
                                onChange={(e) => setSizeInput(e.target.value)}
                                onKeyDown={handleSizeKeyDown}
                            />
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {COMMON_SIZES.filter((s) => !form.sizes.includes(s)).map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => addSize(s)}
                                    className="px-2.5 py-1 rounded-md border border-slate-200 text-xs font-medium text-slate-500 hover:border-red-300 hover:text-red-700 hover:bg-red-50 transition-colors"
                                >
                                    + {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Image Upload */}
                    <div className="space-y-3">
                        <label className="label font-bold text-slate-700">{t("admin.products.form.imagesLabel")} <span className="text-[10px] text-gray-400 font-normal">(max 4)</span></label>
                        <div className="flex flex-wrap gap-3">
                            {form.images.map((url, i) => url ? (
                                <div key={i} className="relative group w-24 h-24 rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                                    <img src={url} alt="" className="h-full w-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const updated = form.images.filter((_, j) => j !== i);
                                            setForm({ ...form, images: updated });
                                        }}
                                        className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600/80 text-white transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ) : null)}
                            <label className="flex flex-col items-center justify-center w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 cursor-pointer hover:border-red-400 hover:bg-red-50/50 transition-colors">
                                {uploadingIdx !== null ? (
                                    <Loader2 size={20} className="animate-spin text-red-700" />
                                ) : (
                                    <ImagePlus size={20} className="text-slate-400" />
                                )}
                                <span className="text-[10px] text-slate-400 mt-1 font-medium">
                                    {uploadingIdx !== null ? t("admin.products.form.uploading", undefined, "Uploading...") : t("admin.products.form.addImage")}
                                </span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    className="hidden"
                                    disabled={uploadingIdx !== null}
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        setUploadingIdx(form.images.length);
                                        try {
                                            const { url } = await uploadsApi.upload(file);
                                            const hasEmpty = form.images.length === 1 && form.images[0] === "";
                                            setForm({
                                                ...form,
                                                images: hasEmpty ? [url] : [...form.images, url],
                                            });
                                        } catch {
                                            setMsg({ type: "error", text: t("admin.products.form.uploadError", undefined, "Upload failed") });
                                        } finally {
                                            setUploadingIdx(null);
                                            if (fileInputRef.current) fileInputRef.current.value = "";
                                        }
                                    }}
                                />
                            </label>
                        </div>
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
                                            <td className="p-4 text-sm font-bold text-slate-800 text-right">{formatCurrency(item.price, locale)}</td>
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
