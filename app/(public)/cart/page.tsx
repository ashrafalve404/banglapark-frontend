"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

const ACTIVATION_THRESHOLD = 2000;

export default function CartPage() {
    const { t } = useLocale();
    const { items, updateQty, removeItem, total, clear } = useCartStore();
    const router = useRouter();

    const cartTotal = total();
    const activationGoalMet = cartTotal >= ACTIVATION_THRESHOLD;
    const remainingForActivation = ACTIVATION_THRESHOLD - cartTotal;

    if (items.length === 0) {
        return (
            <div className="page-container py-20 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                    <ShoppingBag size={28} className="text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">{t("cart.empty.title")}</h2>
                <p className="mt-1 text-sm text-gray-400">{t("cart.empty.subtext")}</p>
                <Link href="/shop" className="btn-primary mt-6 inline-flex gap-2">
                    {t("cart.empty.cta")} <ArrowRight size={16} />
                </Link>
            </div>
        );
    }

    return (
        <div className="page-container py-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">{t("cart.heading")}</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart items list */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map((item) => (
                        <div key={`${item.product.id}-${item.size || ""}`} className="card-flat p-4 flex gap-4 items-center">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                                {item.product.images?.[0] ? (
                                    <img src={item.product.images[0]} alt={item.product.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-gray-300 text-xs">{t("cart.product.noImage")}</div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <Link href={`/product/${item.product.slug}`} className="text-sm font-semibold text-gray-900 hover:text-green-800 line-clamp-2">
                                    {item.product.name}
                                </Link>
                                {item.size && (
                                    <span className="text-xs text-gray-500 font-medium">{t("cart.product.sizeLabel", undefined, "Size")}: {item.size}</span>
                                )}
                                <div className="mt-1 flex items-center gap-4">
                                    <span className="text-sm font-bold text-green-800">{formatCurrency(item.product.price)}</span>
                                    {Number(item.product.price) >= ACTIVATION_THRESHOLD && (
                                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full">{t("cart.product.activationBadge")}</span>
                                    )}
                                </div>
                            </div>

                            {/* Quantity selectors */}
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
                                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                    <button onClick={() => updateQty(item.product.id, item.quantity - 1, item.size)} className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold">-</button>
                                    <span className="px-3 py-1 text-sm font-semibold text-gray-800 min-w-8 text-center">{item.quantity}</span>
                                    <button onClick={() => updateQty(item.product.id, item.quantity + 1, item.size)} className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold">+</button>
                                </div>
                                <button onClick={() => removeItem(item.product.id, item.size)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    <div className="flex items-center justify-between">
                        <button onClick={clear} className="text-sm font-semibold text-gray-400 hover:text-red-500 transition-colors">
                            {t("cart.clearCart")}
                        </button>
                        <Link href="/shop" className="text-sm font-semibold text-green-800 hover:underline">
                            {t("cart.continueShopping")}
                        </Link>
                    </div>
                </div>

                {/* Cart summary box */}
                <div className="space-y-6">
                    <div className="card-flat p-6">
                        <h3 className="text-base font-bold text-gray-900 mb-4 border-b border-gray-100 pb-3">{t("cart.summary.heading")}</h3>

                        {/* Activation Progress bar / notification */}
                        <div className="mb-6 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-4">
                            <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1.5">{t("cart.activationStatus.heading")}</h4>
                            {activationGoalMet ? (
                                <div>
                                    <div className="h-2 w-full bg-amber-200 rounded-full mb-2 overflow-hidden">
                                        <div className="h-full bg-green-700 w-full" />
                                    </div>
                                    <p className="text-xs text-green-800 font-semibold">{t("cart.activationStatus.met")}</p>
                                </div>
                            ) : (
                                <div>
                                    <div className="h-2 w-full bg-amber-200 rounded-full mb-2 overflow-hidden">
                                        <div className="h-full bg-amber-600" style={{ width: `${(cartTotal / ACTIVATION_THRESHOLD) * 100}%` }} />
                                    </div>
                                    <p className="text-xs text-amber-700 font-medium">
                                        {t("cart.activationStatus.notMet", { amount: formatCurrency(remainingForActivation) })}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>{t("cart.summary.subtotal")}</span>
                                <span className="font-semibold text-gray-900">{formatCurrency(cartTotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>{t("cart.summary.delivery")}</span>
                                <span className="text-green-700 font-semibold">{t("cart.summary.deliveryFree")}</span>
                            </div>
                            <hr className="border-gray-100" />
                            <div className="flex justify-between text-base font-bold text-gray-900">
                                <span>{t("cart.summary.total")}</span>
                                <span className="text-green-800">{formatCurrency(cartTotal)}</span>
                            </div>
                        </div>

                        <button onClick={() => router.push("/checkout")} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
                            {t("cart.checkout.cta")} <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
