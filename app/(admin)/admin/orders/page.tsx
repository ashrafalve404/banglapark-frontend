"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ShieldAlert, Loader2, ArrowRight, Trash2 } from "lucide-react";
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
    const { t } = useLocale();
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

    // Delete order mutation
    const deleteMutation = useMutation({
        mutationFn: (id: string) => ordersApi.deleteOrder(id),
        onSuccess: (_data, orderId) => {
            queryClient.setQueriesData<any>({ queryKey: ["admin-orders"] }, (old: any) => {
                if (!old?.orders) return old;
                return { ...old, orders: old.orders.filter((o: any) => o.id !== orderId) };
            });
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
                                    <th className="p-4 text-xs font-bold text-slate-600 text-right">{t("admin.orders.table.colPrice")}</th>
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
                                            <td className="p-4 text-xs font-bold text-slate-800 text-right">{formatCurrency(order.total)}</td>
                                            <td className="p-4 text-xs text-slate-650 min-w-[200px]">
                                                <div className="font-bold border-b border-dashed border-slate-150 pb-1 mb-1.5">
                                                    {order.shippingAddress?.address}, {order.shippingAddress?.city}
                                                </div>
                                                <div className="space-y-0.5">
                                                    {order.items.map((item) => (
                                                        <div key={item.id} className="text-[10px] text-gray-500 flex justify-between">
                                                            <span>- {item.product?.name || t("admin.orders.table.productFallback")} (x{item.quantity})</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${order.status === "DELIVERED"
                                                    ? "bg-green-100 text-green-800"
                                                    : order.status === "CANCELLED"
                                                        ? "bg-red-100 text-red-700"
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
                                                                                ? "bg-red-50 text-red-650 border-red-200 hover:bg-red-100 cursor-pointer"
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
                                                        className="text-[10px] py-1 px-2.5 rounded font-bold border bg-red-50 text-red-600 border-red-200 hover:bg-red-100 cursor-pointer flex items-center gap-1"
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
