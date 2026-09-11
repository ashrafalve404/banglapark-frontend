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
    const [dailyProfitPercent, setDailyProfitPercent] = useState("0.50");
    const [durationDays, setDurationDays] = useState("365");
    const [uploadingImage, setUploadingImage] = useState(false);
    const [formError, setFormError] = useState("");

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
        onError: (err: any) => {
            setFormError(err?.response?.data?.message || err?.message || "Failed to create package");
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, body }: { id: string; body: Partial<DigitalMarketingPackage> }) => digitalMarketingApi.adminUpdatePackage(id, body),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-dm-packages"] });
            resetForm();
        },
        onError: (err: any) => {
            setFormError(err?.response?.data?.message || err?.message || "Failed to update package");
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
            setFormError("");
            const res = await uploadsApi.upload(file);
            setImage(res.url);
        } catch (err: any) {
            setFormError("Image upload failed: " + (err?.response?.data?.message || err.message || "Error"));
        } finally {
            setUploadingImage(false);
        }
    };

    const resetForm = () => {
        setShowModal(false);
        setEditingPkg(null);
        setFormError("");
        setTitle("");
        setDescription("");
        setImage("");
        setLink("");
        setPrice("");
        setDailyProfitPercent("0.50");
        setDurationDays("365");
    };

    const handleEdit = (pkg: DigitalMarketingPackage) => {
        setEditingPkg(pkg);
        setFormError("");
        setTitle(pkg.title);
        setDescription(pkg.description || "");
        setImage(pkg.image || "");
        setLink(pkg.link || "");
        setPrice(String(pkg.price));
        setDailyProfitPercent(String(pkg.dailyProfitPercent ?? pkg.profitPercent ?? 0.5));
        setDurationDays(String(pkg.durationDays ?? 365));
        setShowModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !price) return;
        setFormError("");
        const body = {
            title: title.trim(),
            description: description.trim() || undefined,
            image: image.trim() || undefined,
            link: link.trim() || undefined,
            price: Number(price),
            profitPercent: Number(dailyProfitPercent),
            dailyProfitPercent: Number(dailyProfitPercent),
            durationDays: Number(durationDays),
        };
        if (editingPkg) {
            updateMutation.mutate({ id: editingPkg.id, body });
        } else {
            createMutation.mutate(body);
        }
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
                    <button onClick={() => { refetchPackages(); refetchPurchases(); }} className="btn-secondary py-2 px-3 flex items-center gap-1.5 text-xs cursor-pointer">
                        <RefreshCw size={14} /> Refresh
                    </button>
                    <button onClick={() => { resetForm(); setShowModal(true); }} className="py-2 px-4 flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-xs cursor-pointer">
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
                        {(packages ?? []).map((pkg) => {
                            const pPrice = Number(pkg.price);
                            const pPercent = Number(pkg.dailyProfitPercent ?? pkg.profitPercent ?? 0.5);
                            const pDays = Number(pkg.durationDays ?? 365);
                            const pDailyReturn = Math.round((pPrice * (pPercent / 100)) * 100) / 100;
                            const pTotalReturn = Math.round((pDailyReturn * pDays) * 100) / 100;

                            return (
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
                                            <span className="font-bold text-slate-800">{formatCurrency(pPrice, locale)}</span>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-semibold block uppercase">Daily Profit ({pPercent}%)</span>
                                            <span className="font-bold text-emerald-600">+{formatCurrency(pDailyReturn, locale)} / day</span>
                                        </div>
                                        <div className="col-span-2 pt-1 border-t border-slate-100 flex justify-between items-center text-[11px]">
                                            <span className="text-slate-500 font-medium">Duration: <strong className="text-slate-700">{pDays} Days</strong></span>
                                            <span className="text-emerald-700 font-bold">Total Return: {formatCurrency(pTotalReturn, locale)}</span>
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
                            );
                        })}
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
                            <option value="ACTIVE">ACTIVE (দৈনিক 0.5% পেআউট चालू)</option>
                            <option value="COMPLETED">COMPLETED (365 দিন সম্পন্ন)</option>
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
                                    <th className="p-3.5 text-right">Daily Profit (0.5%)</th>
                                    <th className="p-3.5 text-center">Progress (Days Paid)</th>
                                    <th className="p-3.5 text-right">Total Earned</th>
                                    <th className="p-3.5 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {purchases.map((pur) => {
                                    const dProfit = Number(pur.dailyProfitAmount ?? pur.profitAmount ?? (Number(pur.amount) * 0.005));
                                    const dPaid = Number(pur.daysPaid ?? 0);
                                    const dTotal = Number(pur.daysTotal ?? 365);
                                    const tEarned = Number(pur.totalEarned ?? (dPaid * dProfit));

                                    return (
                                        <tr key={pur.id} className="hover:bg-slate-50/60">
                                            <td className="p-3.5 text-slate-500 font-medium">{formatDateTime(pur.purchasedAt, locale)}</td>
                                            <td className="p-3.5">
                                                <div className="font-bold text-slate-900">{pur.user?.name}</div>
                                                <div className="text-[10px] text-slate-400">{pur.user?.phone} (ID: {pur.user?.memberId})</div>
                                            </td>
                                            <td className="p-3.5 font-bold text-indigo-900">{pur.package?.title}</td>
                                            <td className="p-3.5 text-right font-bold text-slate-800">{formatCurrency(pur.amount, locale)}</td>
                                            <td className="p-3.5 text-right font-bold text-emerald-600">+{formatCurrency(dProfit, locale)} / day</td>
                                            <td className="p-3.5 text-center font-bold text-indigo-700">{dPaid} / {dTotal} Days</td>
                                            <td className="p-3.5 text-right font-extrabold text-emerald-700">{formatCurrency(tEarned, locale)}</td>
                                            <td className="p-3.5 text-center">
                                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${pur.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : "bg-indigo-100 text-indigo-800"}`}>
                                                    {pur.status === "COMPLETED" ? "365 DAYS COMPLETED" : "DAILY PAYOUT ACTIVE"}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Create / Edit Package Modal ── */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-slate-900">{editingPkg ? (locale === "bn" ? "প্যাকেজ এডিট করুন" : "Edit Package") : (locale === "bn" ? "নতুন প্যাকেজ তৈরি করুন" : "Create New Package")}</h3>
                            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600 text-xl leading-none cursor-pointer">✕</button>
                        </div>

                        {formError && (
                            <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl text-xs font-semibold">
                                {formError}
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block">{locale === "bn" ? "প্যাকেজের শিরোনাম" : "Package Title"}</label>
                                <input type="text" required className="input w-full text-sm" placeholder="Starter Marketing Package" value={title} onChange={(e) => setTitle(e.target.value)} />
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

                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 block">{locale === "bn" ? "মূল্য (৳)" : "Price (৳)"}</label>
                                    <input type="number" required className="input w-full text-sm" placeholder="2000" min={1} value={price} onChange={(e) => setPrice(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 block">{locale === "bn" ? "দৈনিক প্রফিট (%)" : "Daily Profit (%)"}</label>
                                    <input type="number" step="0.01" className="input w-full text-sm" placeholder="0.50" value={dailyProfitPercent} onChange={(e) => setDailyProfitPercent(e.target.value)} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 block">{locale === "bn" ? "মেয়াদ (দিন)" : "Duration (Days)"}</label>
                                    <input type="number" className="input w-full text-sm" placeholder="365" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                disabled={!title.trim() || !price || uploadingImage || createMutation.isPending || updateMutation.isPending}
                                className="flex-1 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                {(createMutation.isPending || updateMutation.isPending) ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" /> Saving...
                                    </>
                                ) : (
                                    editingPkg ? t("digitalMarketing.saveChanges") : t("digitalMarketing.createPackage")
                                )}
                            </button>
                            <button type="button" onClick={resetForm} className="px-4 py-2.5 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                                 {t("digitalMarketing.cancel")}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
