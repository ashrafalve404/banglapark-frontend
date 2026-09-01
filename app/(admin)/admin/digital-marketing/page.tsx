"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PlusCircle, Megaphone, CheckCircle2, Clock, Eye, EyeOff, Trash2, Edit, RefreshCw, ExternalLink, Image as ImageIcon, Upload, Loader2 } from "lucide-react";
import { digitalMarketingApi, type DigitalMarketingPackage } from "@/lib/api/digital-marketing";
import { uploadsApi } from "@/lib/api/uploads";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

export default function AdminDigitalMarketingPage() {
    const { t, locale } = useLocale();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [statusFilter, setStatusFilter] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingPkg, setEditingPkg] = useState<DigitalMarketingPackage | null>(null);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState("");
    const [link, setLink] = useState("");
    const [price, setPrice] = useState("");
    const [profitPercent, setProfitPercent] = useState("0.10");
    const [durationHours, setDurationHours] = useState("24");
    const [uploadingImage, setUploadingImage] = useState(false);

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

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setUploadingImage(true);
            const res = await uploadsApi.upload(file);
            setImage(res.url);
        } catch (err: any) {
            alert("Image upload failed: " + (err.message || "Error"));
        } finally {
            setUploadingImage(false);
        }
    };

    const resetForm = () => {
        setShowModal(false);
        setEditingPkg(null);
        setTitle("");
        setDescription("");
        setImage("");
        setLink("");
        setPrice("");
        setProfitPercent("0.10");
        setDurationHours("24");
    };

    const handleEdit = (pkg: DigitalMarketingPackage) => {
        setEditingPkg(pkg);
        setTitle(pkg.title);
        setDescription(pkg.description || "");
        setImage(pkg.image || "");
        setLink(pkg.link || "");
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
                    <h1 className="text-2xl font-bold text-slate-800">{t("digitalMarketing.adminTitle")}</h1>
                    <p className="text-sm text-slate-500">{t("digitalMarketing.adminSubtitle")}</p>
                </div>
                <div className="flex items-center gap-2 self-start">
                    <button onClick={() => { refetchPackages(); refetchPurchases(); }} className="btn-secondary py-2 px-3 flex items-center gap-1.5 text-xs">
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <button onClick={() => { resetForm(); setShowModal(true); }} className="py-2 px-4 flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-xs">
                        <PlusCircle size={14} /> {t("digitalMarketing.createPackage")}
                    </button>
                </div>
            </div>

            {/* Packages Grid / Table */}
            <div className="card p-5 bg-white space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Megaphone size={18} className="text-indigo-600" /> {t("digitalMarketing.packageList")}
                </h2>

                {pkgLoading ? (
                    <div className="py-8 text-center text-slate-400 text-xs">Loading packages...</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(packages ?? []).map((pkg) => (
                            <div key={pkg.id} className="border border-slate-200 rounded-2xl p-4 space-y-3 relative bg-slate-50/50 hover:border-slate-300 transition-all">
                                {pkg.image && (
                                    <div className="w-full h-36 rounded-xl overflow-hidden bg-slate-900/5 border border-slate-200 flex items-center justify-center p-1">
                                        <img src={pkg.image} alt={pkg.title} className="w-full h-full object-contain rounded-lg" />
                                    </div>
                                )}
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm">{pkg.title}</h3>
                                        <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{pkg.description}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${pkg.isHidden ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                                        {pkg.isHidden ? "Hidden" : "Active"}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-slate-150">
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">Price</span>
                                        <span className="font-bold text-slate-800">{formatCurrency(pkg.price, locale)}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-semibold block uppercase">Profit (+{pkg.profitPercent}%)</span>
                                        <span className="font-bold text-emerald-600">+{formatCurrency((pkg.price * pkg.profitPercent) / 100, locale)}</span>
                                    </div>
                                </div>

                                {pkg.link && (
                                    <a href={pkg.link} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1">
                                        <ExternalLink size={12} /> {locale === "bn" ? "ক্যাম্পেইন লিংক" : "Campaign Link"}
                                    </a>
                                )}

                                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                                    <span className="text-[10px] text-slate-400">{pkg._count?.purchases ?? 0} Sales</span>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => updateMutation.mutate({ id: pkg.id, body: { isHidden: !pkg.isHidden } })}
                                            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 rounded cursor-pointer"
                                            title={pkg.isHidden ? "Unhide" : "Hide"}
                                        >
                                            {pkg.isHidden ? <Eye size={14} /> : <EyeOff size={14} />}
                                        </button>
                                        <button onClick={() => handleEdit(pkg)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer" title="Edit">
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            onClick={() => { if (confirm("Delete this package?")) deleteMutation.mutate(pkg.id); }}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── User Purchases History Table ── */}
            <div className="card p-5 bg-white space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-emerald-600" /> {locale === "bn" ? "ইউজার প্যাকেজ ক্রয়ের তথ্য" : "All User Package Purchases"}
                    </h2>

                    <div className="flex items-center gap-2">
                        <select
                            className="input text-xs py-1.5 font-semibold cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                        >
                            <option value="">{locale === "bn" ? "সকল স্ট্যাটাস (All)" : "All Status"}</option>
                            <option value="ACTIVE">ACTIVE (টাইমার চালু)</option>
                            <option value="COMPLETED">COMPLETED (পেআউট সম্পন্ন)</option>
                        </select>
                    </div>
                </div>

                {purLoading ? (
                    <div className="py-12 text-center text-slate-400 text-xs">Loading purchases...</div>
                ) : purchases.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 text-xs">No package purchases found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-bold uppercase">
                                    <th className="p-3.5">Purchased Date</th>
                                    <th className="p-3.5">User</th>
                                    <th className="p-3.5">Package</th>
                                    <th className="p-3.5 text-right">Investment</th>
                                    <th className="p-3.5 text-right">0.1% Profit</th>
                                    <th className="p-3.5 text-right">Total 24h Return</th>
                                    <th className="p-3.5 text-center">Status</th>
                                    <th className="p-3.5 text-right">Matures At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {purchases.map((pur) => (
                                    <tr key={pur.id} className="hover:bg-slate-50/60">
                                        <td className="p-3.5 text-slate-500 font-medium">{formatDateTime(pur.purchasedAt, locale)}</td>
                                        <td className="p-3.5">
                                            <div className="font-bold text-slate-900">{pur.user?.name}</div>
                                            <div className="text-[10px] text-slate-400">{pur.user?.phone} (ID: {pur.user?.memberId})</div>
                                        </td>
                                        <td className="p-3.5 font-bold text-indigo-900">{pur.package?.title}</td>
                                        <td className="p-3.5 text-right font-bold text-slate-800">{formatCurrency(pur.amount, locale)}</td>
                                        <td className="p-3.5 text-right font-bold text-emerald-600">+{formatCurrency(pur.profitAmount, locale)}</td>
                                        <td className="p-3.5 text-right font-extrabold text-emerald-700">{formatCurrency(pur.totalReturn, locale)}</td>
                                        <td className="p-3.5 text-center">
                                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${pur.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                                                {pur.status === "COMPLETED" ? "PAYOUT COMPLETED" : "ACTIVE 24H TIMER"}
                                            </span>
                                        </td>
                                        <td className="p-3.5 text-right text-slate-500">{formatDateTime(pur.maturesAt, locale)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Create / Edit Package Modal ── */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900">{editingPkg ? (locale === "bn" ? "প্যাকেজ এডিট করুন" : "Edit Package") : (locale === "bn" ? "নতুন প্যাকেজ তৈরি করুন" : "Create New Package")}</h3>
                            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 text-xl leading-none cursor-pointer">✕</button>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block">{locale === "bn" ? "প্যাকেজের শিরোনাম" : "Package Title"}</label>
                                <input type="text" className="input w-full text-sm" placeholder="Starter Marketing Package" value={title} onChange={(e) => setTitle(e.target.value)} />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block">{locale === "bn" ? "বিবরণ (ঐচ্ছিক)" : "Description (Optional)"}</label>
                                <textarea className="input w-full text-sm resize-none" rows={2} placeholder="Package details..." value={description} onChange={(e) => setDescription(e.target.value)} />
                            </div>

                            {/* Image File Uploader */}
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block">
                                    {locale === "bn" ? "প্যাকেজ ব্যানার ছবি (ঐচ্ছিক)" : "Package Banner Image (Optional)"}
                                </label>
                                {image ? (
                                    <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 group">
                                        <img src={image} alt="Preview" className="w-full h-full object-contain" />
                                        <button
                                            type="button"
                                            onClick={() => setImage("")}
                                            className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow cursor-pointer hover:bg-red-700"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <label className="flex-1 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-3 text-center cursor-pointer transition-all bg-slate-50 hover:bg-indigo-50/50">
                                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploadingImage} />
                                            {uploadingImage ? (
                                                <span className="text-xs text-indigo-600 font-bold flex items-center justify-center gap-1">
                                                    <Loader2 size={14} className="animate-spin" /> Uploading image...
                                                </span>
                                            ) : (
                                                <span className="text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5">
                                                    <Upload size={14} className="text-indigo-600" /> {locale === "bn" ? "ছবি ফাইল আপলোড করুন" : "Upload Banner Image File"}
                                                </span>
                                            )}
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block">{locale === "bn" ? "ক্যাম্পেইন / প্রমোশন লিংক (ঐচ্ছিক)" : "Campaign Target Link (Optional)"}</label>
                                <input type="url" className="input w-full text-sm" placeholder="https://facebook.com/my-page or https://youtu.be/..." value={link} onChange={(e) => setLink(e.target.value)} />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 block">{locale === "bn" ? "মূল্য (৳)" : "Price (৳)"}</label>
                                    <input type="number" className="input w-full text-sm" placeholder="1000" min={1} value={price} onChange={(e) => setPrice(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 block">{locale === "bn" ? "প্রফিট বোনাস (%)" : "Profit Bonus (%)"}</label>
                                    <input type="number" step="0.01" className="input w-full text-sm" placeholder="0.10" value={profitPercent} onChange={(e) => setProfitPercent(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => {
                                    if (!title || !price) return;
                                    const body = { title, description, image, link, price: Number(price), profitPercent: Number(profitPercent), durationHours: Number(durationHours) };
                                    if (editingPkg) {
                                        updateMutation.mutate({ id: editingPkg.id, body });
                                    } else {
                                        createMutation.mutate(body);
                                    }
                                }}
                                disabled={!title || !price || uploadingImage || createMutation.isPending || updateMutation.isPending}
                                className="flex-1 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 cursor-pointer"
                            >
                                {editingPkg ? t("digitalMarketing.saveChanges") : t("digitalMarketing.createPackage")}
                            </button>
                            <button onClick={resetForm} className="px-4 py-2.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                                {t("digitalMarketing.cancel")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
