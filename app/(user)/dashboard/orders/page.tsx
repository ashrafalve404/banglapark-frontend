"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ShoppingBag, Loader2, Clipboard, Smartphone } from "lucide-react";
import { ordersApi } from "@/lib/api/orders";
import { formatCurrency, formatDateTime, getOrderStatusLabel } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

export default function UserOrdersPage() {
    const { t, locale } = useLocale();
    const [page, setPage] = useState(1);

    const { data, isLoading } = useQuery({
        queryKey: ["my-orders", page],
        queryFn: () => ordersApi.myOrders({ page, limit: 10 }),
    });

    const orders = data?.orders ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / 10) || 1;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{t("orders.heading")}</h1>
                <p className="text-sm text-gray-500">{t("orders.subheading")}</p>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="animate-spin text-green-800" size={32} />
                </div>
            ) : orders.length === 0 ? (
                <div className="card py-20 text-center text-gray-400">
                    <ShoppingBag size={32} className="mx-auto mb-2 text-gray-305" />
                    {t("orders.empty")}
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order.id} className="card p-5 bg-white space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 gap-2">
                                <div>
                                    <span className="text-xs text-gray-400 font-semibold uppercase block">{t("orders.orderId")}</span>
                                    <span className="text-sm font-bold text-gray-800 text-left">{order.id}</span>
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className="text-xs text-gray-500">{formatDateTime(order.createdAt, locale)}</span>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${order.status === "DELIVERED"
                                            ? "bg-green-150 text-green-800"
                                            : order.status === "CANCELLED"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-amber-100 text-amber-800"
                                        }`}>
                                        {getOrderStatusLabel(order.status)}
                                    </span>
                                    {order.isQualifying && (
                                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 rounded-full px-2 py-0.5 border border-amber-200">
                                            {t("orders.activationBadge")}
                                        </span>
                                    )}
                                    {order.paymentMethod === "BKASH" && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-pink-700 bg-pink-50 rounded-full px-2 py-0.5 border border-pink-200">
                                            <Smartphone size={10} />
                                            bKash
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="divide-y divide-gray-50">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center py-2">
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-gray-800 truncate">{item.product?.name || t("orders.productFallback")}</p>
                                            <p className="text-xs text-gray-400">৳{Number(item.price).toLocaleString()} x {item.quantity}</p>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-700">{formatCurrency(Number(item.price) * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                                <div className="flex flex-col gap-0.5">
                                    <span className="text-xs text-gray-500">{t("orders.deliveryAddress")} {order.shippingAddress?.address || t("orders.addressNotSelected")}</span>
                                    {order.deliveryArea && (
                                        <span className="text-xs text-gray-400">
                                            {order.deliveryArea === "INSIDE_DHAKA" ? t("checkout.shipping.insideDhaka") : t("checkout.shipping.outsideDhaka")} • {t("checkout.review.delivery")}: {formatCurrency(order.deliveryCharge ?? 0, locale)}
                                        </span>
                                    )}
                                    {order.paymentMethod === "BKASH" && order.transactionId && (
                                        <span className="text-xs text-pink-600 font-medium">
                                            {t("orders.paymentLabel")}: bKash • {t("orders.transactionId")}: {order.transactionId}
                                            {order.userBkashNumber && <> • From: {order.userBkashNumber}</>}
                                        </span>
                                    )}
                                    {order.paymentMethod === "CASH_ON_DELIVERY" && (
                                        <span className="text-xs text-gray-400">{t("orders.paymentLabel")}: Cash on Delivery</span>
                                    )}
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-gray-400 block">{t("orders.totalLabel")}</span>
                                    <span className="text-sm font-bold text-green-800">{formatCurrency(order.total)}</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {totalPages > 1 && (
                        <div className="p-4 bg-white card flex items-center justify-between">
                            <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary py-1 px-3 text-xs">{t("orders.prev")}</button>
                            <span className="text-xs text-gray-500 font-semibold">{page} / {totalPages} {t("orders.page")}</span>
                            <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn-secondary py-1 px-3 text-xs">{t("orders.next")}</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
