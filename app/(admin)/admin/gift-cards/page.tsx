"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Plus,
    Trash2,
    Edit2,
    Loader2,
    CheckCircle,
    XCircle,
    Search,
    AlertCircle,
    FileText,
    DollarSign,
    ShoppingBag,
    Users,
    Gift,
    Sparkles,
    Calendar,
    Phone,
    Mail,
    User as UserIcon,
    ArrowRightLeft,
    Wallet,
} from "lucide-react";
import { giftCardsApi, type GiftCardAdmin, type CreateGiftCardInput, type GiftCardAdminStats, type GiftCardAdminPurchaseLog } from "@/lib/api/gift-cards";
import { useLocale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

export default function AdminGiftCardsPage() {
    const { t, locale } = useLocale();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState<"cards" | "purchases">("cards");
    const [searchTerm, setSearchTerm] = useState("");
    const [purchaseSearch, setPurchaseSearch] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingCard, setEditingCard] = useState<GiftCardAdmin | null>(null);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState<number>(2000);
    const [image, setImage] = useState("");
    const [voucherCode, setVoucherCode] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [formError, setFormError] = useState<string | null>(null);

    // Stats Query
    const { data: stats } = useQuery<GiftCardAdminStats>({
        queryKey: ["admin-gift-card-stats"],
        queryFn: () => giftCardsApi.adminGetStats(),
    });

    // Cards Query
    const { data: cards = [], isLoading: isCardsLoading } = useQuery<GiftCardAdmin[]>({
        queryKey: ["admin-gift-cards"],
        queryFn: () => giftCardsApi.adminGetCards(),
    });

    // Purchases Log Query
    const { data: purchases = [], isLoading: isPurchasesLoading } = useQuery<GiftCardAdminPurchaseLog[]>({
        queryKey: ["admin-gift-card-purchases"],
        queryFn: () => giftCardsApi.adminGetPurchases(),
    });

    const createMutation = useMutation({
        mutationFn: (data: CreateGiftCardInput) => giftCardsApi.adminCreateCard(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-gift-cards"] });
            queryClient.invalidateQueries({ queryKey: ["admin-gift-card-stats"] });
            resetForm();
            setIsCreateModalOpen(false);
        },
        onError: (err: any) => {
            setFormError(err?.response?.data?.message || err?.message || (locale === "bn" ? "গিফট কার্ড তৈরি ব্যর্থ হয়েছে" : "Failed to create Gift Card"));
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateGiftCardInput> }) =>
            giftCardsApi.adminUpdateCard(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-gift-cards"] });
            queryClient.invalidateQueries({ queryKey: ["admin-gift-card-stats"] });
            resetForm();
            setEditingCard(null);
        },
        onError: (err: any) => {
            setFormError(err?.response?.data?.message || err?.message || (locale === "bn" ? "গিফট কার্ড আপডেট ব্যর্থ হয়েছে" : "Failed to update Gift Card"));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => giftCardsApi.adminDeleteCard(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-gift-cards"] });
            queryClient.invalidateQueries({ queryKey: ["admin-gift-card-stats"] });
        },
    });

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setPrice(2000);
        setImage("");
        setVoucherCode("");
        setIsActive(true);
        setFormError(null);
    };

    const handleOpenCreate = () => {
        resetForm();
        setEditingCard(null);
        setIsCreateModalOpen(true);
    };

    const handleOpenEdit = (card: GiftCardAdmin) => {
        setFormError(null);
        setEditingCard(card);
        setTitle(card.title);
        setDescription(card.description);
        setPrice(Number(card.price));
        setImage(card.image || "");
        setVoucherCode(card.voucherCode || "");
        setIsActive(card.isActive);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        if (!title.trim() || !description.trim()) {
            setFormError(locale === "bn" ? "শিরোনাম এবং বিবরণ আবশ্যক।" : "Title and Description are required.");
            return;
        }

        if (editingCard) {
            updateMutation.mutate({
                id: editingCard.id,
                data: { title, description, price, image, voucherCode, isActive },
            });
        } else {
            createMutation.mutate({ title, description, price, image, voucherCode, isActive });
        }
    };

    const filteredCards = cards.filter((c) =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredPurchases = purchases.filter((p) =>
        p.user?.fullName.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
        p.user?.phone.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
        p.user?.email.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
        p.giftCard?.title.toLowerCase().includes(purchaseSearch.toLowerCase()) ||
        (p.voucherCode && p.voucherCode.toLowerCase().includes(purchaseSearch.toLowerCase()))
    );

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">{t("giftCard.adminTitle")}</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {t("giftCard.adminDesc")}
                    </p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="btn-primary flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg shadow-sm"
                >
                    <Plus size={18} /> {t("giftCard.addNewCard")}
                </button>
            </div>

            {/* Top Summary Analytics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="card p-4 bg-white border border-rose-100 flex items-center gap-3 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                        <DollarSign size={20} />
                    </div>
                    <div>
                        <p className="text-[11px] text-slate-500 font-medium">{locale === "bn" ? "মোট বিক্রি আয়" : "Total Revenue"}</p>
                        <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                            {formatCurrency(stats?.totalRevenue ?? 0, locale)}
                        </h3>
                    </div>
                </div>

                <div className="card p-4 bg-white border border-purple-100 flex items-center gap-3 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                        <ShoppingBag size={20} />
                    </div>
                    <div>
                        <p className="text-[11px] text-slate-500 font-medium">{locale === "bn" ? "মোট বিক্রি সংখ্যা" : "Total Purchases"}</p>
                        <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                            {stats?.totalPurchases ?? 0}
                        </h3>
                    </div>
                </div>

                <div className="card p-4 bg-white border border-emerald-100 flex items-center gap-3 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <ArrowRightLeft size={20} />
                    </div>
                    <div>
                        <p className="text-[11px] text-slate-500 font-medium">{locale === "bn" ? "মোট রিফান্ড ফেরত" : "Resale Refunds"}</p>
                        <h3 className="text-lg font-extrabold text-emerald-700 mt-0.5">
                            {formatCurrency(stats?.totalResalePayout ?? 0, locale)}
                        </h3>
                    </div>
                </div>

                <div className="card p-4 bg-white border border-indigo-100 flex items-center gap-3 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                        <Sparkles size={20} />
                    </div>
                    <div>
                        <p className="text-[11px] text-slate-500 font-medium">{locale === "bn" ? "সক্রিয় অ্যাকাউন্ট" : "Activated"}</p>
                        <h3 className="text-lg font-extrabold text-indigo-700 mt-0.5">
                            {stats?.activatedAccountsCount ?? 0}
                        </h3>
                    </div>
                </div>

                <div className="card p-4 bg-white border border-slate-100 flex items-center gap-3 shadow-sm">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <Gift size={20} />
                    </div>
                    <div>
                        <p className="text-[11px] text-slate-500 font-medium">{locale === "bn" ? "মোট কার্ডসমূহ" : "Total Cards"}</p>
                        <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                            {stats?.totalCards ?? 0} <span className="text-[10px] font-normal text-emerald-600 font-semibold">({stats?.activeCards ?? 0} {t("cpa.active")})</span>
                        </h3>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 gap-6">
                <button
                    onClick={() => setActiveTab("cards")}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === "cards" ? "border-rose-600 text-rose-700" : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                >
                    <Gift size={16} /> {locale === "bn" ? "গিফট কার্ড ক্যাটালগ" : "Cards Catalog"} ({cards.length})
                </button>
                <button
                    onClick={() => setActiveTab("purchases")}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === "purchases" ? "border-rose-600 text-rose-700" : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                >
                    <ShoppingBag size={16} /> {locale === "bn" ? "ব্যবহারকারী ক্রয় ও বিক্রয় হিস্টোরি" : "Purchase & Resale Logs"} ({purchases.length})
                </button>
            </div>

            {/* TAB 1: CARDS CATALOG */}
            {activeTab === "cards" && (
                <div className="space-y-4">
                    {/* Filter Search */}
                    <div className="card p-4 bg-white">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder={t("giftCard.searchPlaceholder")}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input pl-10 w-full text-sm"
                            />
                        </div>
                    </div>

                    {/* Card List Grid */}
                    {isCardsLoading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 size={32} className="animate-spin text-slate-400" />
                        </div>
                    ) : filteredCards.length === 0 ? (
                        <div className="card p-12 bg-white text-center text-slate-400 space-y-3">
                            <Gift size={48} className="mx-auto text-slate-300" />
                            <p className="text-sm font-semibold">{locale === "bn" ? "কোনো গিফট কার্ড পাওয়া যায়নি।" : "No gift cards found."}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredCards.map((card) => {
                                const isActivationEligible = Number(card.price) >= 2000;
                                return (
                                    <div
                                        key={card.id}
                                        className={`card bg-white border-2 flex flex-col justify-between overflow-hidden transition-all ${
                                            card.isActive ? "border-slate-100 hover:border-rose-200" : "border-slate-200 bg-slate-50/50 opacity-75"
                                        }`}
                                    >
                                        {/* Card Image Banner */}
                                        <div className="relative h-40 bg-gradient-to-r from-rose-900 via-purple-900 to-indigo-900 overflow-hidden flex items-center justify-center p-4">
                                            {card.image ? (
                                                <img src={card.image} alt={card.title} className="w-full h-full object-cover rounded-lg" />
                                            ) : (
                                                <div className="text-center text-white space-y-1">
                                                    <Gift size={40} className="mx-auto text-rose-300" />
                                                    <p className="text-xs font-bold text-rose-200">GIFT CARD</p>
                                                </div>
                                            )}
                                            {isActivationEligible && (
                                                <span className="absolute top-2 right-2 bg-emerald-500 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
                                                    <Sparkles size={12} /> {locale === "bn" ? "৩০ দিন অ্যাক্টিভেশন" : "30-Day Auto Activate"}
                                                </span>
                                            )}
                                        </div>

                                        <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span
                                                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                                            card.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                                                        }`}
                                                    >
                                                        {card.isActive ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                        {card.isActive ? t("cpa.active") : t("cpa.inactive")}
                                                    </span>
                                                    <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
                                                        {t("cpa.purchasesCount")} {card._count?.purchases ?? 0}
                                                    </span>
                                                </div>

                                                <div>
                                                    <h3 className="font-bold text-slate-900 text-base leading-snug">{card.title}</h3>
                                                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{card.description}</p>
                                                </div>
                                            </div>

                                            <div className="pt-3 border-t border-slate-100 space-y-2">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="text-slate-500 font-medium">{locale === "bn" ? "কার্ড মূল্য:" : "Card Price:"}</span>
                                                    <span className="text-lg font-black text-rose-700">
                                                        {formatCurrency(Number(card.price), locale)}
                                                    </span>
                                                </div>

                                                {card.voucherCode && (
                                                    <div className="bg-slate-50 rounded-lg p-2 flex items-center justify-between text-xs border border-slate-100">
                                                        <span className="text-slate-400 text-[10px] font-medium">{t("giftCard.voucherCode")}:</span>
                                                        <span className="font-mono text-xs font-bold text-purple-700">
                                                            {card.voucherCode}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-100 bg-slate-50/50">
                                            <button
                                                onClick={() => handleOpenEdit(card)}
                                                className="p-2 rounded-lg text-slate-600 hover:bg-slate-200/60 hover:text-rose-700 transition-colors"
                                                title="Edit Gift Card"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm(`${t("giftCard.deleteConfirm")} "${card.title}"?`)) {
                                                        deleteMutation.mutate(card.id);
                                                    }
                                                }}
                                                className="p-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                title="Delete Gift Card"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: USER PURCHASE & RESALE LOGS TABLE */}
            {activeTab === "purchases" && (
                <div className="space-y-4">
                    {/* Search Purchase Logs */}
                    <div className="card p-4 bg-white">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder={locale === "bn" ? "ব্যবহারকারীর নাম, মোবাইল, ইমেইল বা ভাউচার কোড দিয়ে খুঁজুন..." : "Search by user name, phone, email, card title or voucher..."}
                                value={purchaseSearch}
                                onChange={(e) => setPurchaseSearch(e.target.value)}
                                className="input pl-10 w-full text-sm"
                            />
                        </div>
                    </div>

                    {/* Purchase & Resale Log Table */}
                    {isPurchasesLoading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 size={32} className="animate-spin text-slate-400" />
                        </div>
                    ) : filteredPurchases.length === 0 ? (
                        <div className="card p-12 bg-white text-center text-slate-400 space-y-3">
                            <ShoppingBag size={48} className="mx-auto text-slate-300" />
                            <p className="text-sm font-semibold">{locale === "bn" ? "কোনো ক্রয় বা বিক্রয় রেজিষ্ট্রেশন পাওয়া যায়নি।" : "No purchase logs found."}</p>
                        </div>
                    ) : (
                        <div className="card bg-white overflow-hidden shadow-xs border border-slate-200">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold tracking-wider">
                                            <th className="py-3.5 px-4">{locale === "bn" ? "ব্যবহারকারী" : "User Info"}</th>
                                            <th className="py-3.5 px-4">{locale === "bn" ? "ক্রয়কৃত গিফট কার্ড" : "Gift Card"}</th>
                                            <th className="py-3.5 px-4">{locale === "bn" ? "পরিশোধের মূল্য ও মাধ্যম" : "Price & Method"}</th>
                                            <th className="py-3.5 px-4">{locale === "bn" ? "ভাউচার কোড" : "Voucher Code"}</th>
                                            <th className="py-3.5 px-4 text-center">{locale === "bn" ? "অবস্থা (Status)" : "Resale Status"}</th>
                                            <th className="py-3.5 px-4">{locale === "bn" ? "তারিখ" : "Date"}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredPurchases.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3 px-4">
                                                    <div className="space-y-0.5">
                                                        <p className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                                            <UserIcon size={14} className="text-rose-600 shrink-0" />
                                                            {log.user.fullName}
                                                        </p>
                                                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                                            <span className="flex items-center gap-1">
                                                                <Phone size={12} className="text-slate-400" /> {log.user.phone}
                                                            </span>
                                                            {log.user.email && (
                                                                <span className="flex items-center gap-1">
                                                                    <Mail size={12} className="text-slate-400" /> {log.user.email}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <p className="font-bold text-slate-800 text-xs">{log.giftCard.title}</p>
                                                    {log.wasAccountActivated && (
                                                        <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5 border border-emerald-200">
                                                            <Sparkles size={10} /> {locale === "bn" ? "অ্যাক্টিভেটেড" : "Activated"}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="space-y-0.5">
                                                        <span className="font-extrabold text-rose-700 text-sm block">
                                                            {formatCurrency(log.pricePaid, locale)}
                                                        </span>
                                                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase">
                                                            {log.paymentMethod || "WALLET"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 font-mono font-bold text-purple-700">
                                                    {log.voucherCode || "N/A"}
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {log.isSold ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700 bg-slate-200 px-2.5 py-1 rounded-full">
                                                            <ArrowRightLeft size={12} className="text-emerald-600" />
                                                            {locale === "bn" ? "বিক্রি ও রিফান্ডকৃত" : "SOLD & REFUNDED"}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                                            <CheckCircle size={12} />
                                                            {locale === "bn" ? "সক্রিয় রয়েছে" : "ACTIVE"}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-slate-500 text-xs whitespace-nowrap">
                                                    <div className="space-y-0.5">
                                                        <span className="flex items-center gap-1 text-slate-700 font-medium">
                                                            <Calendar size={12} className="text-slate-400" />
                                                            {new Date(log.purchasedAt).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US")}
                                                        </span>
                                                        {log.isSold && log.soldAt && (
                                                            <span className="text-[10px] text-emerald-600 font-bold block">
                                                                {locale === "bn" ? "বিক্রি:" : "Sold:"} {new Date(log.soldAt).toLocaleDateString(locale === "bn" ? "bn-BD" : "en-US")}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Create / Edit Modal */}
            {(isCreateModalOpen || editingCard) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 fade-in">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-lg font-bold text-slate-900">
                                {editingCard ? t("giftCard.updateCardBtn") : t("giftCard.createCardBtn")}
                            </h2>
                            <button
                                onClick={() => {
                                    setIsCreateModalOpen(false);
                                    setEditingCard(null);
                                }}
                                className="text-slate-400 hover:text-slate-600"
                            >
                                ✕
                            </button>
                        </div>

                        {formError && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">
                                <AlertCircle size={16} />
                                <span>{formError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-slate-700 font-bold mb-1">{t("giftCard.cardTitleLabel")}</label>
                                <input
                                    type="text"
                                    placeholder={t("giftCard.cardTitlePlaceholder")}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="input w-full"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 font-bold mb-1">{t("giftCard.cardDescLabel")}</label>
                                <textarea
                                    rows={3}
                                    placeholder={t("giftCard.cardDescPlaceholder")}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="input w-full"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 font-bold mb-1">{t("giftCard.priceLabel")}</label>
                                <input
                                    type="number"
                                    min={0}
                                    step={100}
                                    placeholder="2000"
                                    value={price}
                                    onChange={(e) => setPrice(Number(e.target.value))}
                                    className="input w-full"
                                    required
                                />
                                <p className="text-[11px] text-emerald-600 mt-1 font-medium">{t("giftCard.priceHint")}</p>
                            </div>

                            <div>
                                <label className="block text-slate-700 font-bold mb-1">{t("giftCard.imageLabel")}</label>
                                <input
                                    type="url"
                                    placeholder={t("giftCard.imagePlaceholder")}
                                    value={image}
                                    onChange={(e) => setImage(e.target.value)}
                                    className="input w-full font-mono text-[11px]"
                                />
                            </div>

                            <div>
                                <label className="block text-slate-700 font-bold mb-1">{t("giftCard.voucherLabel")}</label>
                                <input
                                    type="text"
                                    placeholder={t("giftCard.voucherPlaceholder")}
                                    value={voucherCode}
                                    onChange={(e) => setVoucherCode(e.target.value)}
                                    className="input w-full font-mono text-[11px]"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="isActiveCard"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="rounded text-rose-600 focus:ring-rose-500 h-4 w-4"
                                />
                                <label htmlFor="isActiveCard" className="text-slate-700 font-semibold cursor-pointer">
                                    {t("giftCard.isActiveLabel")}
                                </label>
                            </div>

                            <div className="flex items-center gap-3 pt-3">
                                <button
                                    type="submit"
                                    disabled={createMutation.isPending || updateMutation.isPending}
                                    className="btn-primary bg-rose-600 hover:bg-rose-700 flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2"
                                >
                                    {(createMutation.isPending || updateMutation.isPending) && (
                                        <Loader2 size={16} className="animate-spin" />
                                    )}
                                    {editingCard ? t("giftCard.updateCardBtn") : t("giftCard.createCardBtn")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCreateModalOpen(false);
                                        setEditingCard(null);
                                    }}
                                    className="btn-outline-primary py-2.5 text-sm font-semibold"
                                >
                                    {t("cpa.cancel")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
