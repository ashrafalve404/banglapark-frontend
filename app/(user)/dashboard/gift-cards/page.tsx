"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Gift,
    Sparkles,
    ShoppingBag,
    Loader2,
    CheckCircle,
    Copy,
    Check,
    Wallet,
    AlertCircle,
    Phone,
    Clock,
    ArrowRightLeft,
    X,
} from "lucide-react";
import { giftCardsApi, type GiftCardPublic, type GiftCardUserPurchase } from "@/lib/api/gift-cards";
import { useLocale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

export default function UserGiftCardsPage() {
    const { t, locale } = useLocale();
    const queryClient = useQueryClient();

    const [activeTab, setActiveTab] = useState<"store" | "my-cards">("store");
    const [selectedCard, setSelectedCard] = useState<GiftCardPublic | null>(null);
    const [sellingCard, setSellingCard] = useState<GiftCardUserPurchase | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<"WALLET" | "BKASH">("WALLET");
    const [userBkashNumber, setUserBkashNumber] = useState("");
    const [bkashTrxId, setBkashTrxId] = useState("");
    const [purchaseError, setPurchaseError] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Cards Store Query
    const { data: cards = [], isLoading: isCardsLoading } = useQuery<GiftCardPublic[]>({
        queryKey: ["user-gift-cards"],
        queryFn: () => giftCardsApi.getPublicCards(),
    });

    // My Purchased Cards Query
    const { data: myCards = [], isLoading: isMyCardsLoading } = useQuery<GiftCardUserPurchase[]>({
        queryKey: ["user-my-gift-cards"],
        queryFn: () => giftCardsApi.getMyCards(),
    });

    const buyMutation = useMutation({
        mutationFn: (cardId: string) => giftCardsApi.buyCard(cardId, {
            paymentMethod,
            userBkashNumber: paymentMethod === "BKASH" ? userBkashNumber : undefined,
            bkashTrxId: paymentMethod === "BKASH" ? bkashTrxId : undefined,
        }),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["user-gift-cards"] });
            queryClient.invalidateQueries({ queryKey: ["user-my-gift-cards"] });
            queryClient.invalidateQueries({ queryKey: ["user-me"] });
            setSelectedCard(null);
            setUserBkashNumber("");
            setBkashTrxId("");
            setSuccessMessage(res.message);
            setActiveTab("my-cards");
        },
        onError: (err: any) => {
            setPurchaseError(err?.response?.data?.message || err?.message || "Failed to purchase Gift Card");
        },
    });

    const sellMutation = useMutation({
        mutationFn: (purchaseId: string) => giftCardsApi.sellCard(purchaseId),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["user-my-gift-cards"] });
            queryClient.invalidateQueries({ queryKey: ["user-me"] });
            setSellingCard(null);
            setSuccessMessage(res.message);
        },
        onError: (err: any) => {
            setPurchaseError(err?.response?.data?.message || err?.message || "Failed to sell Gift Card");
        },
    });

    const handleCopyVoucher = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const getDaysRemaining = (canSellAt?: string) => {
        if (!canSellAt) return 0;
        const diff = new Date(canSellAt).getTime() - new Date().getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            {/* Simple Clean Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-800">{t("giftCard.title")}</h1>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {locale === "bn"
                            ? "গিফট কার্ড কিনুন এবং ৩০ দিন পর ওয়ালেটে রিফান্ড পান।"
                            : "Purchase gift cards and resell back to wallet after 30 days."}
                    </p>
                </div>
            </div>

            {/* Success Message Alert */}
            {successMessage && (
                <div className="card p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-xs font-semibold fade-in rounded-xl">
                    <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-emerald-600 shrink-0" />
                        <span>{successMessage}</span>
                    </div>
                    <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700 p-1">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 gap-6">
                <button
                    onClick={() => setActiveTab("store")}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === "store" ? "border-rose-600 text-rose-700" : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                >
                    <ShoppingBag size={16} /> {t("giftCard.storeTab")} ({cards.length})
                </button>
                <button
                    onClick={() => setActiveTab("my-cards")}
                    className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === "my-cards" ? "border-rose-600 text-rose-700" : "border-transparent text-slate-500 hover:text-slate-700"
                    }`}
                >
                    <Gift size={16} /> {t("giftCard.myCards")} ({myCards.length})
                </button>
            </div>

            {/* TAB 1: GIFT CARD STORE */}
            {activeTab === "store" && (
                <div>
                    {isCardsLoading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 size={32} className="animate-spin text-rose-600" />
                        </div>
                    ) : cards.length === 0 ? (
                        <div className="card p-12 bg-white text-center text-slate-400 space-y-2 rounded-2xl border border-slate-100">
                            <Gift size={40} className="mx-auto text-slate-300" />
                            <p className="text-sm font-semibold">{locale === "bn" ? "কোনো গিফট কার্ড উপলব্ধ নেই।" : "No Gift Cards available."}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {cards.map((card) => {
                                const isActivationEligible = Number(card.price) >= 2000;
                                return (
                                    <div
                                        key={card.id}
                                        className={`card bg-white border flex flex-col justify-between overflow-hidden rounded-2xl transition-all hover:shadow-md ${
                                            card.isPurchased ? "border-emerald-200 bg-emerald-50/20" : "border-slate-200 hover:border-rose-300"
                                        }`}
                                    >
                                        {/* Card Image Banner */}
                                        <div className="relative h-40 bg-slate-900 overflow-hidden flex items-center justify-center p-3">
                                            {card.image ? (
                                                <img src={card.image} alt={card.title} className="w-full h-full object-cover rounded-lg" />
                                            ) : (
                                                <div className="text-center text-white space-y-1">
                                                    <Gift size={36} className="mx-auto text-rose-300" />
                                                    <p className="text-[10px] font-bold tracking-widest text-rose-200 uppercase">GIFT CARD</p>
                                                </div>
                                            )}
                                            {isActivationEligible && (
                                                <span className="absolute top-2 right-2 bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                                    <Sparkles size={10} /> {locale === "bn" ? "৩০ দিন অ্যাকাউন্ট অ্যাক্টিভেশন" : "30-Day Auto Activate"}
                                                </span>
                                            )}
                                        </div>

                                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-slate-900 text-sm leading-snug">{card.title}</h3>
                                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{card.description}</p>
                                            </div>

                                            <div className="pt-3 border-t border-slate-100 space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs text-slate-400 font-medium">{locale === "bn" ? "মূল্য:" : "Price:"}</span>
                                                    <span className="text-lg font-extrabold text-rose-700">
                                                        {formatCurrency(card.price, locale)}
                                                    </span>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        setPurchaseError(null);
                                                        setPaymentMethod("WALLET");
                                                        setSelectedCard(card);
                                                    }}
                                                    className="w-full py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
                                                >
                                                    <ShoppingBag size={14} /> {t("giftCard.buyCard")}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: MY GIFT CARDS */}
            {activeTab === "my-cards" && (
                <div>
                    {isMyCardsLoading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 size={32} className="animate-spin text-rose-600" />
                        </div>
                    ) : myCards.length === 0 ? (
                        <div className="card p-12 bg-white text-center text-slate-400 space-y-2 rounded-2xl border border-slate-100">
                            <Gift size={40} className="mx-auto text-slate-300" />
                            <p className="text-sm font-semibold">{locale === "bn" ? "আপনার কোনো ক্রয়কৃত গিফট কার্ড নেই।" : "You have not purchased any Gift Cards yet."}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {myCards.map((card) => {
                                const daysLeft = getDaysRemaining(card.canSellAt);
                                const isEligibleToSell = daysLeft === 0 && !card.isSold;

                                return (
                                    <div
                                        key={card.id}
                                        className={`card bg-white border p-4 rounded-2xl space-y-3 shadow-xs transition-all ${
                                            card.isSold ? "border-slate-200 bg-slate-50/50 opacity-85" : "border-slate-200"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="space-y-1">
                                                <div>
                                                    {card.isSold ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                                                            <CheckCircle size={10} /> {locale === "bn" ? "বিক্রি ও রিফান্ডকৃত" : "Sold & Refunded"}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                            <CheckCircle size={10} /> {locale === "bn" ? "সক্রিয় কার্ড" : "Active Card"}
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="font-bold text-slate-900 text-sm">{card.title}</h3>
                                            </div>
                                            <span className="text-base font-extrabold text-rose-700 shrink-0">
                                                {formatCurrency(card.pricePaid, locale)}
                                            </span>
                                        </div>

                                        {/* Voucher Code Box */}
                                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                                            <div>
                                                <span className="text-[10px] text-slate-400 font-medium block">{t("giftCard.voucherCode")}</span>
                                                <span className="font-mono text-xs font-bold text-purple-700 tracking-wider">
                                                    {card.voucherCode}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleCopyVoucher(card.voucherCode, card.id)}
                                                className="btn-outline-primary py-1 px-2.5 text-[11px] flex items-center gap-1 shrink-0"
                                            >
                                                {copiedId === card.id ? <Check size={12} /> : <Copy size={12} />}
                                                {copiedId === card.id ? (locale === "bn" ? "কপি হয়েছে" : "Copied") : (locale === "bn" ? "কপি" : "Copy")}
                                            </button>
                                        </div>

                                        {/* Resale Action or Eligibility Countdown */}
                                        <div className="pt-2 border-t border-slate-100">
                                            {card.isSold ? (
                                                <div className="text-[11px] text-slate-500 flex items-center justify-between bg-slate-100 p-2 rounded-lg">
                                                    <span>{locale === "bn" ? "ওয়ালেটে রিফান্ড করা হয়েছে" : "Refunded to Wallet"}</span>
                                                    <span className="font-semibold">{new Date(card.soldAt || card.purchasedAt).toLocaleDateString()}</span>
                                                </div>
                                            ) : isEligibleToSell ? (
                                                <button
                                                    onClick={() => setSellingCard(card)}
                                                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
                                                >
                                                    <ArrowRightLeft size={14} />
                                                    {locale === "bn" ? `গিফট কার্ড বিক্রি করুন (${formatCurrency(card.pricePaid, locale)} ওয়ালেটে নিন)` : `Sell Gift Card (Get ${formatCurrency(card.pricePaid, locale)} in Wallet)`}
                                                </button>
                                            ) : (
                                                <div className="bg-slate-50 border border-slate-200 p-2 rounded-xl flex items-center justify-between text-xs text-slate-600">
                                                    <span className="flex items-center gap-1.5 text-[11px] font-medium">
                                                        <Clock size={13} className="text-slate-400 shrink-0" />
                                                        {locale === "bn" ? "বিক্রি করার সময়:" : "Resale available in:"}
                                                    </span>
                                                    <span className="font-bold text-amber-700 text-[11px]">
                                                        {daysLeft} {locale === "bn" ? "দিন বাকি" : "Days left"}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Purchase Confirmation Modal */}
            {selectedCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 fade-in">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-900">{t("giftCard.confirmTitle")}</h2>
                            <button onClick={() => setSelectedCard(null)} className="text-slate-400 hover:text-slate-600 p-1">
                                <X size={18} />
                            </button>
                        </div>

                        {purchaseError && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">
                                <AlertCircle size={16} />
                                <span>{purchaseError}</span>
                            </div>
                        )}

                        <div className="space-y-3 text-xs">
                            <p className="text-slate-600 font-medium">
                                {t("giftCard.confirmPrompt")} <strong className="text-slate-900">"{selectedCard.title}"</strong>
                            </p>

                            <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 border border-slate-100">
                                <div className="flex justify-between items-center text-slate-600">
                                    <span>{t("cpa.taskPrice")}</span>
                                    <span className="font-bold text-slate-900 text-sm">{formatCurrency(selectedCard.price, locale)}</span>
                                </div>
                            </div>

                            {/* Payment Method Selector */}
                            <div className="space-y-1.5">
                                <label className="block text-slate-700 font-bold">{locale === "bn" ? "পেমেন্ট মাধ্যম (ক্যাশ পেমেন্ট প্রযোজ্য নয়)" : "Payment Method (No Cash Payment)"}</label>
                                <div className="grid grid-cols-2 gap-2.5">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("WALLET")}
                                        className={`p-2.5 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                                            paymentMethod === "WALLET" ? "border-rose-600 bg-rose-50 text-rose-800" : "border-slate-200 text-slate-600 hover:border-slate-300"
                                        }`}
                                    >
                                        <Wallet size={15} className="text-emerald-600" />
                                        {locale === "bn" ? "ওয়ালেট ব্যালেন্স" : "Wallet Balance"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("BKASH")}
                                        className={`p-2.5 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-xs transition-all ${
                                            paymentMethod === "BKASH" ? "border-pink-600 bg-pink-50 text-pink-800" : "border-slate-200 text-slate-600 hover:border-slate-300"
                                        }`}
                                    >
                                        <Phone size={15} className="text-pink-600" />
                                        {locale === "bn" ? "বিকাশ পেমেন্ট" : "bKash Payment"}
                                    </button>
                                </div>
                            </div>

                            {/* bKash Details Form if selected */}
                            {paymentMethod === "BKASH" && (
                                <div className="p-3 bg-pink-50/70 border border-pink-200 rounded-xl space-y-2.5">
                                    <p className="text-[11px] font-semibold text-pink-900">
                                        {locale === "bn" ? "বিকাশ মার্চেন্ট নম্বরে পেমেন্ট দিয়ে তথ্য দিন:" : "Send Payment to bKash Merchant Number: "}
                                        <span className="font-bold text-pink-700 font-mono text-xs block">01823674796</span>
                                    </p>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-700 mb-0.5">{locale === "bn" ? "আপনার বিকাশ নম্বর" : "bKash Phone Number"}</label>
                                        <input
                                            type="text"
                                            placeholder="018XXXXXXXX"
                                            value={userBkashNumber}
                                            onChange={(e) => setUserBkashNumber(e.target.value)}
                                            className="input w-full bg-white text-xs py-1.5"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-700 mb-0.5">{locale === "bn" ? "ট্রানজেকশন আইডি (TrxID)" : "Transaction ID (TrxID)"}</label>
                                        <input
                                            type="text"
                                            placeholder="TRX998877"
                                            value={bkashTrxId}
                                            onChange={(e) => setBkashTrxId(e.target.value)}
                                            className="input w-full bg-white font-mono text-xs uppercase py-1.5"
                                        />
                                    </div>
                                </div>
                            )}

                            {Number(selectedCard.price) >= 2000 && (
                                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                                    <Sparkles size={14} className="text-emerald-600 shrink-0" />
                                    <span>{t("giftCard.activationNotice")}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2.5 pt-1">
                            <button
                                onClick={() => buyMutation.mutate(selectedCard.id)}
                                disabled={buyMutation.isPending}
                                className="btn-primary bg-rose-600 hover:bg-rose-700 flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5"
                            >
                                {buyMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {t("cpa.confirmAndPay")}
                            </button>
                            <button
                                onClick={() => setSelectedCard(null)}
                                className="btn-outline-primary py-2 text-xs font-semibold px-4"
                            >
                                {t("cpa.cancel")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resale Confirmation Modal */}
            {sellingCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 fade-in">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-base font-bold text-slate-900">{locale === "bn" ? "গিফট কার্ড বিক্রয় নিশ্চিতকরণ" : "Confirm Gift Card Resale"}</h2>
                            <button onClick={() => setSellingCard(null)} className="text-slate-400 hover:text-slate-600 p-1">
                                <X size={18} />
                            </button>
                        </div>

                        {purchaseError && (
                            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-xs font-semibold">
                                <AlertCircle size={16} />
                                <span>{purchaseError}</span>
                            </div>
                        )}

                        <div className="space-y-3 text-xs">
                            <p className="text-slate-600 font-medium">
                                {locale === "bn" ? "আপনি কি নিশ্চিত যে আপনি এই গিফট কার্ডটি বিক্রি করতে চান?" : "Are you sure you want to sell"} <strong className="text-slate-900">"{sellingCard.title}"</strong>?
                            </p>

                            <div className="bg-emerald-50 rounded-xl p-3 space-y-1 border border-emerald-200">
                                <div className="flex justify-between items-center text-emerald-800 font-semibold">
                                    <span>{locale === "bn" ? "ওয়ালেটে রিফান্ড পরিমাণ:" : "Refund to Wallet:"}</span>
                                    <span className="font-extrabold text-emerald-700 text-base">{formatCurrency(sellingCard.pricePaid, locale)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2.5 pt-1">
                            <button
                                onClick={() => sellMutation.mutate(sellingCard.id)}
                                disabled={sellMutation.isPending}
                                className="btn-primary bg-emerald-600 hover:bg-emerald-700 flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5"
                            >
                                {sellMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {locale === "bn" ? "বিক্রি নিশ্চিত করুন" : "Confirm Resale"}
                            </button>
                            <button
                                onClick={() => setSellingCard(null)}
                                className="btn-outline-primary py-2 text-xs font-semibold px-4"
                            >
                                {t("cpa.cancel")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
