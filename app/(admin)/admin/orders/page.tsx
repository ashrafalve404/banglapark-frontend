"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ShieldAlert, Loader2, Trash2, Smartphone, Minus } from "lucide-react";
import { ordersApi } from "@/lib/api/orders";
import { formatCurrency, formatDateTime, getOrderStatusLabel } from "@/lib/utils";
import type { Order, OrderItem, OrderStatus } from "@/types";
import { useLocale } from "@/lib/i18n";

const ORDER_STATUS_TRANSITIONS: Record<string, string[]> = {
    PENDING: ["CONFIRMED", "CANCELLED"],
    CONFIRMED: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: [],
    CANCELLED: [],
};

export default function AdminOrdersPage() {
    const { t, locale } = useLocale();
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [status, setStatus] = useState("");

    const { data, isLoading } = useQuery({
        queryKey: ["admin-orders", page, status],
        queryFn: () => ordersApi.adminAll({ page, limit: 12, status: status ? status as OrderStatus : undefined }),
    });

    const orders = data?.orders ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.ceil(total / 12) || 1;

    const [mutatingId, setMutatingId] = useState<string | null>(null);
    const [reducingItem, setReducingItem] = useState<string | null>(null);

    // Reduce item quantity mutation
    const reduceQtyMutation = useMutation({
        mutationFn: async ({ orderId, itemId, quantity }: { orderId: string; itemId: string; quantity: number }) => {
            setReducingItem(itemId);
            return ordersApi.updateItemQuantity(orderId, itemId, quantity);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
        },
        onSettled: () => {
            setReducingItem(null);
        },
    });

    // Delete order mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => ordersApi.deleteOrder(id),
        onSuccess: (_data, orderId) => {
            queryClient.setQueriesData<any>({ queryKey: ["admin-orders"] }, (old: any) => {
                if (!old?.orders) return old;
                return { ...old, orders: old.orders.filter((o: any) => o.id !== orderId) };
            });
            queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
        },
    });

    const handleDeleteOrder = (orderId: string) => {
        if (window.confirm("Are you sure you want to permanently delete this order? This action cannot be undone.")) {
            deleteMutation.mutate(orderId);
        }
    };

    // Change order status mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, nextStatus }: { id: string; nextStatus: string }) => {
            setMutatingId(id);
            return ordersApi.updateStatus(id, nextStatus as OrderStatus);
        },
        onSuccess: (updatedOrder) => {
            // Update react-query cache directly for instant UI changes
            queryClient.setQueriesData<any>({ queryKey: ["admin-orders"] }, (oldData: any) => {
                if (!oldData) return oldData;
                return {
                    ...oldData,
                    orders: oldData.orders?.map((order: any) =>
                        order.id === updatedOrder.id ? { ...order, status: updatedOrder.status } : order
                    ) || [],
                };
            });
            // Also trigger background invalidation / check
            queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
        },
        onSettled: () => {
            setMutatingId(null);
        },
    });


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">{t("admin.orders.heading")}</h1>
                <p className="text-sm text-slate-500">{t("admin.orders.subheading")}</p>
            </div>

            {/* Status filtering widgets */}
            <div className="card p-5 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                <h3 className="text-sm font-bold text-slate-700">{t("admin.orders.filter.heading")}</h3>
                <select
                    className="input sm:w-48 cursor-pointer text-xs"
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                >
                    <option value="">{t("admin.orders.filter.all")}</option>
                    <option value="PENDING">{t("admin.orders.filter.pending")}</option>
                    <option value="CONFIRMED">{t("admin.orders.filter.confirmed")}</option>
                    <option value="PROCESSING">{t("admin.orders.filter.processing")}</option>
                    <option value="SHIPPED">{t("admin.orders.filter.shipped")}</option>
                    <option value="DELIVERED">{t("admin.orders.filter.delivered")}</option>
                    <option value="CANCELLED">{t("admin.orders.filter.cancelled")}</option>
                </select>
            </div>

            {/* Orders queue listings */}
            <div className="card overflow-hidden bg-white">
                {isLoading ? (
                    <div className="py-20 flex justify-center">
                        <Loader2 className="animate-spin text-slate-850" size={32} />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="py-20 text-center text-slate-400">{t("admin.orders.empty")}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-150">
                                    <th className="p-4 text-xs font-bold text-slate-600">{t("admin.orders.table.colOrderId")}</th>
                                    <th className="p-4 text-xs font-bold text-slate-600">{t("admin.orders.table.colCustomer")}</th>
                                    <th className="p-4 text-xs font-bold text-slate-600 min-w-[200px]">Products</th>
                                    <th className="p-4 text-xs font-bold text-slate-600 text-right">{t("admin.orders.table.colPrice")}</th>
                                    <th className="p-4 text-xs font-bold text-slate-600">{t("admin.orders.table.colPayment")}</th>
                                    <th className="p-4 text-xs font-bold text-slate-600">{t("admin.orders.table.colTrxID")}</th>
                                    <th className="p-4 text-xs font-bold text-slate-600">{t("admin.orders.table.colDeliveryArea")}</th>
                                    <th className="p-4 text-xs font-bold text-slate-600 text-right">{t("admin.orders.table.colDeliveryCharge")}</th>
                                    <th className="p-4 text-xs font-bold text-slate-600">{t("admin.orders.table.colAddress")}</th>
                                    <th className="p-4 text-xs font-bold text-slate-600 text-center">{t("admin.orders.table.colStatus")}</th>
                                    <th className="p-4 text-xs font-bold text-slate-605 text-center">{t("admin.orders.table.colAction")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orders.map((order) => {
                                    const allowedTrans = ORDER_STATUS_TRANSITIONS[order.status] || [];
                                    return (
                                        <tr key={order.id} className="hover:bg-slate-50/50">
                                            <td className="p-4 font-mono text-[10px] text-slate-400 font-bold max-w-[80px] lg:max-w-[200px] truncate">{order.id}</td>
                                            <td className="p-4">
                                                <div className="text-xs font-semibold text-slate-800">{order.user?.name}</div>
                                                <div className="text-[10px] text-gray-500">{order.user?.phone}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="space-y-2">
                                                    {order.items.map((item) => (
                                                        <div key={item.id} className="flex items-center gap-2 text-xs text-slate-700">
                                                            <div className="w-9 h-9 rounded border border-slate-200 overflow-hidden bg-slate-50 flex-shrink-0">
                                                                {item.product?.images?.[0] ? (
                                                                    <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-300">N/A</div>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="font-medium truncate max-w-[160px]">{item.product?.name || t("admin.orders.table.productFallback")}</div>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    <span className="text-[9px] font-mono text-gray-400">#{item.product?.id?.slice(0, 8) || item.id?.slice(0, 8)}</span>
                                                                    {item.size && (
                                                                        <span className="text-[9px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded px-1 py-px">{item.size}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className="text-gray-400 shrink-0">x{item.quantity}</span>
                                                            {item.quantity > 1 && (
                                                                <button
                                                                    onClick={() => reduceQtyMutation.mutate({ orderId: order.id, itemId: item.id, quantity: item.quantity - 1 })}
                                                                    disabled={reducingItem === item.id}
                                                                    className="shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-green-100 text-green-600 hover:bg-green-200 disabled:opacity-50 cursor-pointer"
                                                                >
                                                                    {reducingItem === item.id ? <Loader2 size={8} className="animate-spin" /> : <Minus size={8} />}
                                                                </button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs font-bold text-slate-800 text-right">{formatCurrency(order.total, locale)}</td>
                                            <td className="p-4 text-center">
                                                {order.paymentMethod === "BKASH" ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-pink-700 bg-pink-50 rounded-full px-2 py-0.5 border border-pink-200">
                                                        <Smartphone size={10} />
                                                        bKash
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-gray-400 font-semibold">COD</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                {order.transactionId ? (
                                                    <div className="flex flex-col items-center gap-0.5">
                                                        <span className="text-[10px] font-mono font-bold text-gray-700 bg-gray-50 rounded px-1.5 py-0.5 border border-gray-200">{order.transactionId}</span>
                                                        {order.userBkashNumber && (
                                                            <span className="text-[9px] text-gray-400">{order.userBkashNumber}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-gray-300">—</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                {order.deliveryArea ? (
                                                    <span className="text-[10px] font-semibold text-gray-700">
                                                        {order.deliveryArea === "INSIDE_DHAKA" ? t("checkout.shipping.insideDhaka") : t("checkout.shipping.outsideDhaka")}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-gray-300">—</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right text-xs font-bold text-slate-800">
                                                {order.deliveryCharge != null ? formatCurrency(order.deliveryCharge, locale) : "—"}
                                            </td>
                                            <td className="p-4 text-xs text-slate-650 min-w-[200px]">
                                                <div>
                                                    {order.shippingAddress?.address}, {order.shippingAddress?.city}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${order.status === "DELIVERED"
                                                    ? "bg-green-100 text-green-800"
                                                    : order.status === "CANCELLED"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-amber-105 bg-amber-50 text-amber-800"
                                                    }`}>
                                                    {getOrderStatusLabel(order.status)}
                                                </span>
                                                {order.isQualifying && (
                                                    <span className="block mt-1 font-bold text-[9px] text-amber-800 bg-amber-50 rounded-full px-1.5 py-0.5 border border-amber-200">
                                                        {t("admin.orders.table.activationBadge")}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex flex-col gap-1 items-center">
                                                    {allowedTrans.length > 0 ? (
                                                        allowedTrans.map((next) => {
                                                            const isMutating = mutatingId === order.id;
                                                            return (
                                                                <button
                                                                    key={next}
                                                                    disabled={isMutating}
                                                                    onClick={() => updateStatusMutation.mutate({ id: order.id, nextStatus: next })}
                                                                    className={`text-[10px] py-1 px-2.5 rounded font-bold border flex items-center justify-center gap-1 ${isMutating
                                                                            ? "opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200"
                                                                            : next === "CANCELLED"
                                                                                ? "bg-green-50 text-green-650 border-green-200 hover:bg-green-100 cursor-pointer"
                                                                                : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 cursor-pointer"
                                                                        }`}
                                                                >
                                                                    {isMutating && <Loader2 className="animate-spin" size={10} />}
                                                                    {next === "CONFIRMED" ? t("admin.orders.table.btnConfirm") : next === "PROCESSING" ? t("admin.orders.table.btnProcess") : next === "SHIPPED" ? t("admin.orders.table.btnShip") : next === "DELIVERED" ? t("admin.orders.table.btnDeliver") : t("admin.orders.table.btnCancel")}
                                                                </button>
                                                            );
                                                        })
                                                    ) : (
                                                        <span className="text-[10px] text-gray-400 font-semibold">{t("admin.orders.table.completed")}</span>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteOrder(order.id)}
                                                        className="text-[10px] py-1 px-2.5 rounded font-bold border bg-green-50 text-green-600 border-green-200 hover:bg-green-100 cursor-pointer flex items-center gap-1"
                                                        title="Delete order"
                                                    >
                                                        <Trash2 size={10} />
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary py-1 px-3 text-xs">{t("admin.orders.prev")}</button>
                        <span className="text-xs text-slate-500 font-semibold">{page} / {totalPages} {t("admin.orders.page")}</span>
                        <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn-secondary py-1 px-3 text-xs">{t("admin.orders.next")}</button>
                    </div>
                )}
            </div>
        </div>
    );
}
