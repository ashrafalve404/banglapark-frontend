"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { Plus, Trash2, Loader2, ImagePlus, X, Image as ImageIcon } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { uploadsApi } from "@/lib/api/uploads";
import { useLocale } from "@/lib/i18n";

interface Banner {
    id: string;
    imageUrl: string;
    linkUrl?: string;
    isActive: boolean;
    sortOrder: number;
    section: "SLIDER" | "OFFER";
    title?: string;
    badge?: string;
}

export default function AdminBannersPage() {
    const { t } = useLocale();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editing, setEditing] = useState<Banner | null>(null);
    const [section, setSection] = useState<"SLIDER" | "OFFER">("SLIDER");
    const [imageUrl, setImageUrl] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [title, setTitle] = useState("");
    const [badge, setBadge] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [sortOrder, setSortOrder] = useState(0);
    const [uploading, setUploading] = useState(false);

    const { data: banners = [], isLoading } = useQuery<Banner[]>({
        queryKey: ["admin-banners"],
        queryFn: () => adminApi.banners(),
    });

    const createMutation = useMutation({
        mutationFn: (data: { section?: string; imageUrl: string; linkUrl?: string; title?: string; badge?: string; isActive?: boolean; sortOrder?: number }) =>
            adminApi.createBanner(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
            resetForm();
        },
        onError: (err: any) => {
            alert(err.response?.data?.message || "Failed to create banner");
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: { section?: string; imageUrl?: string; linkUrl?: string; title?: string; badge?: string; isActive?: boolean; sortOrder?: number } }) =>
            adminApi.updateBanner(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
            resetForm();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => adminApi.deleteBanner(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
        },
    });

    const resetForm = () => {
        setEditing(null);
        setSection("SLIDER");
        setImageUrl("");
        setLinkUrl("");
        setTitle("");
        setBadge("");
        setIsActive(true);
        setSortOrder(0);
    };

    const handleEdit = (banner: Banner) => {
        setEditing(banner);
        setSection(banner.section);
        setImageUrl(banner.imageUrl);
        setLinkUrl(banner.linkUrl || "");
        setTitle(banner.title || "");
        setBadge(banner.badge || "");
        setIsActive(banner.isActive);
        setSortOrder(banner.sortOrder);
    };

    const handleFileUpload = async (file: File) => {
        setUploading(true);
        try {
            const { url } = await uploadsApi.upload(file);
            setImageUrl(url);
        } catch {
            alert("Upload failed");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!imageUrl.trim()) return;
        const data = { section, imageUrl, linkUrl: linkUrl || undefined, title: title || undefined, badge: badge || undefined, isActive, sortOrder };
        if (editing) {
            updateMutation.mutate({ id: editing.id, data });
        } else {
            createMutation.mutate(data);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">{t("nav.banners")}</h1>
                <p className="text-sm text-slate-500">Manage homepage sliding banners</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="card p-6 bg-white space-y-4">
                <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
                    {editing ? "Edit Banner" : "Add New Banner"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Banner Image *</label>
                        <p className="text-[10px] text-gray-400 mb-2">{section === "OFFER" ? "Recommended size: 800 Ã— 450 px (16:9)." : "Recommended size: 1200 Ã— 480 px (widescreen). Image crops responsively â€” keep key content centered."}</p>
                        {imageUrl ? (
                            <div className="relative w-full h-40 rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                                <img src={imageUrl} alt="Banner preview" className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => setImageUrl("")}
                                    className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-600/80 text-white hover:bg-red-600"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-40 rounded-lg border-2 border-dashed border-slate-300 cursor-pointer hover:border-red-400 hover:bg-red-50/50 transition-colors">
                                {uploading ? (
                                    <Loader2 size={24} className="animate-spin text-red-700" />
                                ) : (
                                    <ImagePlus size={28} className="text-slate-400" />
                                )}
                                <span className="text-xs text-slate-400 mt-2 font-medium">
                                    {uploading ? "Uploading..." : "Click to upload image"}
                                </span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    className="hidden"
                                    disabled={uploading}
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleFileUpload(file);
                                    }}
                                />
                            </label>
                        )}
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Section</label>
                            <select value={section} onChange={(e) => setSection(e.target.value as "SLIDER" | "OFFER")} className="input w-full">
                                <option value="SLIDER">Slider (Homepage Banner)</option>
                                <option value="OFFER">Offer Section (Below Hero)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Link URL (optional)</label>
                            <input
                                type="url"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="https://example.com/shop"
                                className="input w-full"
                            />
                        </div>
                        {section === "OFFER" && (
                            <>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Title (optional)</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Special Deals"
                                        className="input w-full"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-0.5">Shown as overlay text on the offer card</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Badge (optional)</label>
                                    <input
                                        type="text"
                                        value={badge}
                                        onChange={(e) => setBadge(e.target.value)}
                                        placeholder="Offer"
                                        className="input w-full"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-0.5">Small label like "Offer", "New", "Sale"</p>
                                </div>
                            </>
                        )}
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">Sort Order</label>
                            <input
                                type="number"
                                value={sortOrder}
                                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
                                className="input w-full"
                                min={0}
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="sr-only peer" />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                            </label>
                            <span className="text-sm text-slate-600">{isActive ? "Active" : "Inactive"}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button type="submit" className="btn-primary py-2 px-4 text-sm" disabled={createMutation.isPending || updateMutation.isPending || !imageUrl}>
                        {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="animate-spin" size={16} /> : (editing ? "Update" : "Create")}
                    </button>
                    {editing && (
                        <button type="button" onClick={resetForm} className="btn-secondary py-2 px-4 text-sm">Cancel</button>
                    )}
                </div>
            </form>

            {/* List */}
            <div className="card bg-white">
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="animate-spin text-slate-400" size={32} />
                    </div>
                ) : banners.length === 0 ? (
                    <div className="text-center py-12 text-gray-400 text-sm">No banners yet</div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {banners.map((banner: Banner) => (
                            <div key={banner.id} className="flex items-center gap-4 p-4">
                                <div className="w-32 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                    <img src={banner.imageUrl} alt="" className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-slate-800 truncate">{banner.imageUrl}</p>
                                    {banner.linkUrl && <p className="text-xs text-gray-400 truncate">{banner.linkUrl}</p>}
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${banner.isActive ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-500'}`}>
                                            {banner.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                        <span className="text-[10px] text-gray-400">Sort: {banner.sortOrder}</span>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleEdit(banner)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                                        <ImageIcon size={16} />
                                    </button>
                                    <button onClick={() => deleteMutation.mutate(banner.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
