"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Image from "next/image";
import { Plus, Edit2, Trash2, CheckCircle2, AlertCircle, Eye, EyeOff, Upload, Loader2, X, Image as ImageIcon, ArrowUp, ArrowDown } from "lucide-react";
import { categoriesApi } from "@/lib/api/categories";
import { uploadsApi } from "@/lib/api/uploads";
import { useLocale } from "@/lib/i18n";

export default function AdminCategoriesPage() {
    const { t, locale } = useLocale();
    const isBn = locale === "bn";
    const queryClient = useQueryClient();

    // Create Form State
    const [name, setName] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [sortOrder, setSortOrder] = useState<number>(0);
    const [isHidden, setIsHidden] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Edit Form State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const [editingImageUrl, setEditingImageUrl] = useState("");
    const [editingSortOrder, setEditingSortOrder] = useState<number>(0);
    const [editingIsHidden, setEditingIsHidden] = useState(false);
    const [editingUploading, setEditingUploading] = useState(false);

    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Read all categories including hidden ones for admin
    const { data: categoriesData, isLoading } = useQuery({
        queryKey: ["categories-admin"],
        queryFn: () => categoriesApi.list({ includeHidden: true }),
    });

    const categories = categoriesData?.categories ?? [];

    const handleFileUpload = async (file: File, isEdit = false) => {
        if (isEdit) setEditingUploading(true);
        else setUploading(true);
        setMsg(null);
        try {
            const { url } = await uploadsApi.upload(file);
            if (isEdit) setEditingImageUrl(url);
            else setImageUrl(url);
        } catch (err: any) {
            setMsg({
                type: "error",
                text: err?.response?.data?.message || (isBn ? "ছবি আপলোড ব্যর্থ হয়েছে" : "Failed to upload image"),
            });
        } finally {
            if (isEdit) setEditingUploading(false);
            else setUploading(false);
        }
    };

    // Create category mutation
    const createMutation = useMutation({
        mutationFn: (data: { name: string; image?: string; sortOrder?: number; isHidden: boolean }) => categoriesApi.create(data),
        onSuccess: () => {
            setName("");
            setImageUrl("");
            setSortOrder(0);
            setIsHidden(false);
            setMsg({ type: "success", text: t("admin.categories.createSuccess") });
            queryClient.invalidateQueries({ queryKey: ["categories-admin"] });
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
        mutationFn: ({ id, catName, image, sortOrder, isHidden }: { id: string; catName: string; image?: string | null; sortOrder?: number; isHidden: boolean }) =>
            categoriesApi.update(id, { name: catName, image, sortOrder, isHidden }),
        onSuccess: () => {
            setEditingId(null);
            setEditingName("");
            setEditingImageUrl("");
            setMsg({ type: "success", text: t("admin.categories.updateSuccess") });
            queryClient.invalidateQueries({ queryKey: ["categories-admin"] });
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
        onError: (err: any) => {
            setMsg({
                type: "error",
                text: err.response?.data?.message || t("admin.categories.updateError"),
            });
        },
    });

    // Swap / Move Order mutation
    const moveOrder = async (index: number, direction: "up" | "down") => {
        const targetIndex = direction === "up" ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= categories.length) return;

        const currentCat = categories[index];
        const targetCat = categories[targetIndex];

        const currentOrder = currentCat.sortOrder ?? index;
        const targetOrder = targetCat.sortOrder ?? targetIndex;

        const newCurrentOrder = currentOrder === targetOrder ? (direction === "up" ? targetOrder - 1 : targetOrder + 1) : targetOrder;
        const newTargetOrder = currentOrder === targetOrder ? targetOrder : currentOrder;

        setMsg(null);
        try {
            await Promise.all([
                categoriesApi.update(currentCat.id, { sortOrder: newCurrentOrder }),
                categoriesApi.update(targetCat.id, { sortOrder: newTargetOrder }),
            ]);
            setMsg({ type: "success", text: isBn ? "ক্যাটাগরি ক্রমানুসার আপডেট করা হয়েছে" : "Category order updated" });
            queryClient.invalidateQueries({ queryKey: ["categories-admin"] });
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        } catch (err: any) {
            setMsg({ type: "error", text: isBn ? "ক্রম আপডেট করা সম্ভব হয়নি" : "Failed to update category order" });
        }
    };

    // Toggle visibility mutation
    const toggleMutation = useMutation({
        mutationFn: (id: string) => categoriesApi.toggleVisibility(id),
        onSuccess: () => {
            setMsg({ type: "success", text: isBn ? "ক্যাটাগরির দৃশ্যমানতা পরিবর্তন করা হয়েছে" : "Category visibility toggled" });
            queryClient.invalidateQueries({ queryKey: ["categories-admin"] });
            queryClient.invalidateQueries({ queryKey: ["categories"] });
        },
        onError: (err: any) => {
            setMsg({
                type: "error",
                text: err.response?.data?.message || (isBn ? "ক্যাটাগরি আপডেট করা যায়নি" : "Failed to toggle category visibility"),
            });
        },
    });

    // Delete category mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => categoriesApi.delete(id),
        onSuccess: () => {
            setMsg({ type: "success", text: t("admin.categories.deleteSuccess") });
            queryClient.invalidateQueries({ queryKey: ["categories-admin"] });
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
        createMutation.mutate({ name: name.trim(), image: imageUrl || undefined, sortOrder: Number(sortOrder) || 0, isHidden });
    };

    const handleUpdate = (e: React.FormEvent, id: string) => {
        e.preventDefault();
        if (!editingName.trim()) return;
        setMsg(null);
        updateMutation.mutate({ id, catName: editingName.trim(), image: editingImageUrl || null, sortOrder: Number(editingSortOrder) || 0, isHidden: editingIsHidden });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">{t("admin.categories.heading")}</h1>
                <p className="text-sm text-slate-500">{t("admin.categories.subheading")}</p>
            </div>

            {msg && (
                <div className={`rounded-lg p-4 text-xs font-semibold ${msg.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"}`}>
                    {msg.type === "success" ? <CheckCircle2 size={16} className="inline mr-2" /> : <AlertCircle size={16} className="inline mr-2" />}
                    {msg.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create Input form wrapper */}
                <div className="card p-6 bg-white space-y-4 h-fit">
                    <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">{t("admin.categories.form.heading")}</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <div>
                            <label className="label mb-1 block">{t("admin.categories.form.nameLabel")}</label>
                            <input
                                type="text"
                                required
                                className="input text-left"
                                placeholder={t("admin.categories.form.placeholder")}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        {/* Display Order / Position Input */}
                        <div>
                            <label className="label mb-1 block text-slate-700 font-bold">
                                {isBn ? "প্রদর্শনের ক্রমিক (Display Order)" : "Display Order (Position)"}
                            </label>
                            <input
                                type="number"
                                min="0"
                                className="input text-left"
                                placeholder="0"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(Number(e.target.value))}
                            />
                            <p className="text-[11px] text-slate-400 mt-1">
                                {isBn ? "কম নম্বর আগে দেখাবে (যেমন: ১, ২, ৩...)" : "Lower numbers display first (e.g. 1, 2, 3...)"}
                            </p>
                        </div>

                        {/* Category Image Upload (1:1 Ratio) */}
                        <div>
                            <label className="label mb-1 block text-slate-700 font-bold">
                                {isBn ? "ক্যাটাগরি ছবি (ঐচ্ছিক - ১:১ আকার)" : "Category Image (Optional - 1:1 ratio)"}
                            </label>

                            {imageUrl ? (
                                <div className="flex items-center gap-3">
                                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-xs">
                                        <img src={imageUrl} alt="Category image" className="h-full w-full object-cover" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setImageUrl("")}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                                    >
                                        <X size={14} /> {isBn ? "ছবি মুছুন" : "Remove Image"}
                                    </button>
                                </div>
                            ) : (
                                <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all">
                                    {uploading ? (
                                        <Loader2 className="animate-spin text-indigo-600" size={20} />
                                    ) : (
                                        <>
                                            <Upload size={18} />
                                            <span className="text-[10px] font-bold mt-1">{isBn ? "আপলোড" : "Upload"}</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        disabled={uploading}
                                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], false)}
                                        className="hidden"
                                    />
                                </label>
                            )}

                            {/* PNG Note */}
                            <p className="text-[11px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-2 leading-tight">
                                💡 <strong>{isBn ? "নোট:" : "Note:"}</strong> {isBn
                                    ? "সেরা রূপের জন্য ১:১ আকারের PNG ছবি ব্যবহার করুন। ছবি দেওয়া না থাকলে অটোমেটিক ডিফল্ট আইকন দেখানো হবে।"
                                    : "Use a 1:1 aspect ratio PNG image. If no image is added, default icon will be displayed."}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                            <input
                                type="checkbox"
                                id="create-hidden"
                                checked={isHidden}
                                onChange={(e) => setIsHidden(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <label htmlFor="create-hidden" className="text-xs font-semibold text-slate-700 cursor-pointer select-none">
                                {isBn ? "ক্যাটাগরি লুকান (Hide Category)" : "Hide Category (Hidden from website)"}
                            </label>
                        </div>

                        <button type="submit" disabled={createMutation.isPending || uploading} className="btn-primary w-full py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold cursor-pointer">
                            <Plus size={16} /> {t("admin.categories.form.submit")}
                        </button>
                    </form>
                </div>

                {/* Categories table directory list */}
                <div className="lg:col-span-2 card overflow-hidden bg-white">
                    <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="text-sm font-bold text-slate-800">{t("admin.categories.list.heading")}</h3>
                        <span className="text-xs text-slate-400 font-semibold">{categories.length} {isBn ? "টি ক্যাটাগরি" : "categories"}</span>
                    </div>

                    {isLoading ? (
                        <div className="py-16 text-center text-slate-400">{t("admin.categories.list.loading")}</div>
                    ) : categories.length === 0 ? (
                        <div className="py-16 text-center text-slate-400 font-medium">{t("admin.categories.list.empty")}</div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {categories.map((item, idx) => (
                                <div key={item.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                                    {editingId === item.id ? (
                                        <form onSubmit={(e) => handleUpdate(e, item.id)} className="flex-1 flex flex-col gap-3">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">{isBn ? "ক্যাটাগরি নাম" : "Category Name"}</label>
                                                    <input
                                                        type="text"
                                                        className="input text-left py-1 text-xs"
                                                        value={editingName}
                                                        onChange={(e) => setEditingName(e.target.value)}
                                                        autoFocus
                                                    />
                                                </div>

                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">{isBn ? "ক্রমিক (Order)" : "Sort Order"}</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        className="input text-left py-1 text-xs"
                                                        value={editingSortOrder}
                                                        onChange={(e) => setEditingSortOrder(Number(e.target.value))}
                                                    />
                                                </div>
                                            </div>

                                            {/* Edit Image Upload & Hidden */}
                                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                                                {editingImageUrl ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                                                            <img src={editingImageUrl} alt="Preview" className="h-full w-full object-cover" />
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingImageUrl("")}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                                                        >
                                                            <X size={12} /> {isBn ? "ছবি মুছুন" : "Remove Image"}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label className="flex h-9 px-3 cursor-pointer items-center gap-1.5 rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all text-xs font-semibold">
                                                        {editingUploading ? <Loader2 size={14} className="animate-spin text-indigo-600" /> : <Upload size={14} />}
                                                        <span>{isBn ? "PNG ছবি আপলোড (১:১)" : "Upload PNG (1:1)"}</span>
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            disabled={editingUploading}
                                                            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], true)}
                                                            className="hidden"
                                                        />
                                                    </label>
                                                )}

                                                <div className="flex items-center gap-1.5 px-2">
                                                    <input
                                                        type="checkbox"
                                                        id={`edit-hidden-${item.id}`}
                                                        checked={editingIsHidden}
                                                        onChange={(e) => setEditingIsHidden(e.target.checked)}
                                                        className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 cursor-pointer"
                                                    />
                                                    <label htmlFor={`edit-hidden-${item.id}`} className="text-xs text-slate-600 font-semibold cursor-pointer">
                                                        {isBn ? "লুকানো" : "Hidden"}
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 justify-end pt-1">
                                                <button type="submit" disabled={editingUploading} className="btn-primary py-1 px-3 text-xs cursor-pointer">{t("admin.categories.list.save")}</button>
                                                <button type="button" onClick={() => setEditingId(null)} className="btn-secondary py-1 px-3 text-xs text-rose-500 hover:bg-rose-50 cursor-pointer">{t("admin.categories.list.cancel")}</button>
                                            </div>
                                        </form>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3">
                                                {/* Re-order Arrows */}
                                                <div className="flex flex-col gap-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => moveOrder(idx, "up")}
                                                        disabled={idx === 0}
                                                        title={isBn ? "উপরে তুলুন" : "Move Up"}
                                                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-500 transition-colors cursor-pointer"
                                                    >
                                                        <ArrowUp size={13} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => moveOrder(idx, "down")}
                                                        disabled={idx === categories.length - 1}
                                                        title={isBn ? "নিচে নামান" : "Move Down"}
                                                        className="p-1 rounded hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-500 transition-colors cursor-pointer"
                                                    >
                                                        <ArrowDown size={13} />
                                                    </button>
                                                </div>

                                                <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shrink-0 flex items-center justify-center">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <ImageIcon size={20} className="text-slate-400" />
                                                    )}
                                                </div>

                                                <div className="space-y-0.5">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="text-sm font-bold text-slate-800">{item.name}</p>
                                                        <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-extrabold text-indigo-700 border border-indigo-200">
                                                            #{item.sortOrder ?? idx + 1}
                                                        </span>
                                                        {item.isHidden ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                                                                <EyeOff size={10} /> {isBn ? "লুকানো" : "Hidden"}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                                                <Eye size={10} /> {isBn ? "দৃশ্যমান" : "Visible"}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] text-gray-400 uppercase tracking-widest block font-bold">ID: {item.id}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => toggleMutation.mutate(item.id)}
                                                    disabled={toggleMutation.isPending}
                                                    title={item.isHidden ? (isBn ? "দৃশ্যমান করুন" : "Make Visible") : (isBn ? "লুকিয়ে ফেলুন" : "Hide Category")}
                                                    className={`rounded-lg p-1.5 transition-colors border ${item.isHidden ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" : "bg-slate-50 text-slate-600 border-gray-200 hover:bg-slate-100"}`}
                                                >
                                                    {item.isHidden ? <EyeOff size={15} /> : <Eye size={15} />}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingId(item.id);
                                                        setEditingName(item.name);
                                                        setEditingImageUrl(item.image || "");
                                                        setEditingSortOrder(item.sortOrder ?? 0);
                                                        setEditingIsHidden(!!item.isHidden);
                                                    }}
                                                    className="rounded-lg p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors border border-gray-200"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => { if (confirm(t("admin.categories.list.confirmDelete"))) deleteMutation.mutate(item.id); }}
                                                    className="rounded-lg p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors border border-gray-200"
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
