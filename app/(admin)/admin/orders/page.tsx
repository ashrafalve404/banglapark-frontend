"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Search, ShieldAlert, Loader2, Trash2, Smartphone, Minus, Copy, Check, Printer, PackageCheck } from "lucide-react";
import { ordersApi } from "@/lib/api/orders";
import { formatCurrency, formatDateTime, getOrderStatusLabel, numberToWords } from "@/lib/utils";
import type { Order, OrderItem, OrderStatus } from "@/types";
import { useLocale } from "@/lib/i18n";

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) { }
    };
    return (
        <button
            onClick={handleCopy}
            className="inline-flex items-center justify-center p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-green-700 transition-colors cursor-pointer"
            type="button"
            title="Copy"
        >
            {copied ? (
                <Check size={11} className="text-green-600 animate-pulse" />
            ) : (
                <Copy size={11} />
            )}
        </button>
    );
}

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
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");

    // Printable Order Voucher modal state
    const [voucherOrder, setVoucherOrder] = useState<Order | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ["admin-orders", page, status, search],
        queryFn: () => ordersApi.adminAll({ page, limit: 12, status: status ? status as OrderStatus : undefined, search: search || undefined }),
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
        onSuccess: (updatedOrder, variables) => {
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
            queryClient.invalidateQueries({ queryKey: ["admin-orders"] });

            // If order status was changed to DELIVERED, launch printable voucher modal automatically!
            if (variables.nextStatus === "DELIVERED") {
                const targetOrder = orders.find((o) => o.id === variables.id);
                if (targetOrder) {
                    setVoucherOrder({ ...targetOrder, status: "DELIVERED" });
                }
            }
        },
        onSettled: () => {
            setMutatingId(null);
        },
    });


    return (
        <div className="space-y-6">
            {/* Global style tag for perfect printable PDF formatting */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    .id-order-voucher-modal, .id-order-voucher-modal * {
                        visibility: visible !important;
                    }
                    .id-order-voucher-modal {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                }
            `}</style>
            <div>
                <h1 className="text-2xl font-bold text-slate-800">{t("admin.orders.heading")}</h1>
                <p className="text-sm text-slate-500">{t("admin.orders.subheading")}</p>
            </div>

            {/* Filters: search + status */}
            <div className="card p-4 bg-white flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by Order ID, name, phone or email..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                        className="input pl-8 w-full text-sm"
                    />
                </div>
                <select
                    className="input sm:w-48 cursor-pointer text-xs flex-shrink-0"
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
                                            <td className="p-4">
                                                <div className="flex items-center gap-1">
                                                    <span className="font-mono text-[10px] text-slate-500 font-bold bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100" title={order.id}>
                                                        {order.id.slice(0, 8)}...
                                                    </span>
                                                    <CopyButton text={order.id} />
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <div className="text-xs font-bold text-slate-800">{order.user?.name}</div>
                                                    {order.user?.email && <div className="text-[9px] text-gray-400 truncate max-w-[150px]">{order.user.email}</div>}
                                                    {order.user?.phone && (
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <span className="text-[10.5px] font-semibold text-slate-600">{order.user.phone}</span>
                                                            <CopyButton text={order.user.phone} />
                                                        </div>
                                                    )}
                                                </div>
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
                                                                <div className="font-medium truncate max-w-[160px] text-slate-800" title={item.product?.name}>{item.product?.name || t("admin.orders.table.productFallback")}</div>
                                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                                    {item.product?.id && (
                                                                        <div className="flex items-center gap-0.5 bg-slate-50 px-1 border border-slate-100 rounded">
                                                                            <span className="text-[8px] font-mono text-gray-400">ID: {item.product.id.slice(0, 8)}</span>
                                                                            <CopyButton text={item.product.id} />
                                                                        </div>
                                                                    )}
                                                                    {item.size && (
                                                                        <span className="text-[9px] font-semibold text-green-700 bg-green-50 border border-green-200 rounded px-1 py-px">{item.size}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <span className="text-gray-500 shrink-0 font-medium">x{item.quantity}</span>
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
                                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-pink-700 bg-pink-50 rounded px-1.5 py-0.5 border border-pink-200">
                                                        <Smartphone size={9} />
                                                        bKash
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center text-[9px] font-bold text-gray-600 bg-gray-50 rounded px-1.5 py-0.5 border border-gray-200">COD</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {order.transactionId ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <div className="flex items-center gap-0.5 bg-gray-50 rounded px-1.5 py-0.5 border border-gray-200">
                                                            <span className="text-[10px] font-mono font-bold text-gray-700">{order.transactionId}</span>
                                                            <CopyButton text={order.transactionId} />
                                                        </div>
                                                        {order.userBkashNumber && (
                                                            <span className="text-[9px] text-gray-400">From: {order.userBkashNumber}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="text-center"><span className="text-[10px] text-gray-300">—</span></div>
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
                                                <div className="flex items-start justify-between gap-1">
                                                    <span className="text-[11px] leading-relaxed">
                                                        {order.shippingAddress?.address}, {order.shippingAddress?.city}
                                                    </span>
                                                    {(order.shippingAddress?.address || order.shippingAddress?.city) && (
                                                        <CopyButton text={`${order.shippingAddress?.address || ""}, ${order.shippingAddress?.city || ""}`} />
                                                    )}
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
                                                        <div className="flex flex-col gap-1 items-center">
                                                            <span className="text-[10px] text-gray-400 font-semibold">{t("admin.orders.table.completed")}</span>
                                                            {order.status === "DELIVERED" && (
                                                                <button
                                                                    onClick={() => setVoucherOrder(order)}
                                                                    className="text-[10px] py-1 px-2.5 rounded font-bold border bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 cursor-pointer flex items-center justify-center gap-1 transition-all shadow-2xs"
                                                                    title="Print Order Voucher PDF"
                                                                >
                                                                    <Printer size={11} />
                                                                    {locale === "bn" ? "ভাউচার প্রিন্ট" : "Voucher PDF"}
                                                                </button>
                                                            )}
                                                        </div>
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

            {/* Detailed Printable Order Delivery Voucher Modal */}
            {voucherOrder && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto print:p-0 print:bg-white print:static">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-6 space-y-6 relative print:p-0 print:shadow-none print:max-w-none print:w-full id-order-voucher-modal">
                        {/* Action Bar (Hidden when printing) */}
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
                            <div className="flex items-center gap-2">
                                <Printer className="text-indigo-600" size={20} />
                                <h3 className="text-base font-bold text-slate-900">
                                    {locale === "bn" ? "অর্ডার ডেলিভারি ইনভয়েস ভাউচার (PDF / প্রিন্ট)" : "Order Delivery Invoice Voucher (PDF / Print)"}
                                </h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="py-1.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                                >
                                    <Printer size={14} /> {locale === "bn" ? "প্রিন্ট / PDF সেভ করুন" : "Print / Save PDF"}
                                </button>
                                <button
                                    onClick={() => setVoucherOrder(null)}
                                    className="py-1.5 px-3 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Official Order Delivery Voucher Document Sheet */}
                        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-6 text-slate-800 font-sans print:border-none print:p-6">
                            {/* Header Banner */}
                            <div className="flex items-start justify-between border-b-2 border-indigo-600 pb-4">
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight text-indigo-900">BANGLAPARK</h2>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">BanglaPark E-Commerce Portal</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Official Product Delivery Voucher & Sales Receipt</p>
                                </div>
                                <div className="text-right">
                                    <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 rounded-md font-bold text-xs uppercase tracking-wider border border-emerald-300">
                                        DELIVERED (ডেলিভারি সম্পন্ন)
                                    </span>
                                    <div className="text-xs font-mono font-bold text-slate-700 mt-2">
                                        INVOICE NO: <span className="text-indigo-700">INV-{voucherOrder.id.slice(0, 8).toUpperCase()}</span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                                        Order Date: {formatDateTime(voucherOrder.createdAt, locale)}
                                    </div>
                                </div>
                            </div>

                            {/* Customer & Delivery Information Grid */}
                            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <div className="space-y-1.5">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-1">
                                        Customer Details (গ্রাহকের তথ্য)
                                    </div>
                                    <div><strong className="text-slate-500">Customer Name:</strong> <span className="font-bold text-slate-900">{voucherOrder.user?.name || "N/A"}</span></div>
                                    <div><strong className="text-slate-500">Phone Number:</strong> <span className="font-bold text-slate-900">{voucherOrder.user?.phone || "N/A"}</span></div>
                                    {voucherOrder.user?.email && (
                                        <div><strong className="text-slate-500">Email:</strong> <span className="text-slate-900">{voucherOrder.user.email}</span></div>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 border-b border-slate-200 pb-1">
                                        Shipping & Payment Info (ডেলিভারি ঠিকানা)
                                    </div>
                                    <div><strong className="text-slate-500">Address:</strong> <span className="font-semibold text-slate-900">{voucherOrder.shippingAddress?.address || "N/A"}, {voucherOrder.shippingAddress?.city || ""}</span></div>
                                    <div><strong className="text-slate-500">Delivery Area:</strong> <span className="font-semibold text-slate-900">{voucherOrder.deliveryArea === "INSIDE_DHAKA" ? "Inside Dhaka" : "Outside Dhaka"}</span></div>
                                    <div><strong className="text-slate-500">Payment Method:</strong> <span className="font-bold text-indigo-900 uppercase">{voucherOrder.paymentMethod} {voucherOrder.transactionId ? `(TrxID: ${voucherOrder.transactionId})` : ""}</span></div>
                                </div>
                            </div>

                            {/* Delivered Products Table */}
                            <div className="overflow-hidden rounded-xl border border-slate-200">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-indigo-900 text-white font-bold uppercase tracking-wider">
                                            <th className="p-3">#</th>
                                            <th className="p-3">Product Name</th>
                                            <th className="p-3 text-center">Qty</th>
                                            <th className="p-3 text-right">Unit Price</th>
                                            <th className="p-3 text-right">Total (BDT)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 font-medium">
                                        {voucherOrder.items.map((item, index) => (
                                            <tr key={item.id}>
                                                <td className="p-3 text-slate-400 font-bold">{index + 1}</td>
                                                <td className="p-3 font-bold text-slate-900">
                                                    {item.product?.name || "Product"}
                                                    {item.size && <span className="ml-2 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">Size: {item.size}</span>}
                                                </td>
                                                <td className="p-3 text-center font-bold text-slate-800">x{item.quantity}</td>
                                                <td className="p-3 text-right text-slate-700">{formatCurrency(item.price, locale)}</td>
                                                <td className="p-3 text-right font-bold text-slate-900">{formatCurrency(item.price * item.quantity, locale)}</td>
                                            </tr>
                                        ))}

                                        {/* Delivery Charge */}
                                        <tr>
                                            <td colSpan={4} className="p-3 text-right font-bold text-slate-600">Delivery Charge</td>
                                            <td className="p-3 text-right font-bold text-slate-800">{formatCurrency(voucherOrder.deliveryCharge || 0, locale)}</td>
                                        </tr>

                                        {/* Total Net Payable */}
                                        <tr className="bg-emerald-50/80 font-extrabold text-sm text-emerald-900">
                                            <td colSpan={4} className="p-3 text-emerald-950 uppercase tracking-wide text-right">Grand Total Paid Amount</td>
                                            <td className="p-3 text-right text-emerald-700">{formatCurrency(voucherOrder.total, locale)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Amount in Words */}
                            <div className="bg-slate-100 p-3 rounded-lg text-xs font-semibold border border-slate-200">
                                <span className="text-slate-500 font-bold uppercase text-[10px] block mb-0.5">Amount in Words:</span>
                                <span className="text-slate-900 italic font-bold">{numberToWords(Number(voucherOrder.total))}</span>
                            </div>

                            {/* Signatures Footer */}
                            <div className="pt-12 grid grid-cols-3 gap-6 text-center text-xs">
                                <div className="border-t border-slate-400 pt-2 space-y-0.5">
                                    <p className="font-bold text-slate-800">Customer Received</p>
                                    <p className="text-[10px] text-slate-400">Receiver's Signature</p>
                                </div>
                                <div className="border-t border-slate-400 pt-2 space-y-0.5">
                                    <p className="font-bold text-slate-800">Courier / Agent</p>
                                    <p className="text-[10px] text-slate-400">Delivery Person</p>
                                </div>
                                <div className="border-t border-slate-400 pt-2 space-y-0.5">
                                    <p className="font-bold text-indigo-900">BanglaPark Operations</p>
                                    <p className="text-[10px] text-slate-400">Authorized Stamp & Signature</p>
                                </div>
                            </div>

                            {/* Disclaimer */}
                            <div className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-200">
                                Thank you for shopping with BanglaPark! Computer generated official order delivery voucher & receipt. © {new Date().getFullYear()} BanglaPark.
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
