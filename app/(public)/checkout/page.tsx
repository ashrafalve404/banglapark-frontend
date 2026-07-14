"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { ordersApi } from "@/lib/api/orders";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";
import { CheckCircle2, ArrowRight, X, Smartphone, MapPin } from "lucide-react";
import type { Order, PaymentMethod, DeliveryArea } from "@/types";

const checkoutSchema = z.object({
    name: z.string().min(2, "নাম অবশ্যই প্রদান করতে হবে"),
    phone: z.string().min(10, "সঠিক মোবাইল নাম্বার প্রদান করুন"),
    city: z.string().min(2, "জেলা/শহর লিখুন"),
    address: z.string().min(5, "সম্পূর্ণ ঠিকানা লিখুন"),
    notes: z.string().optional(),
});

type CheckoutSchemaInput = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
    const { t, locale } = useLocale();
    const { items, total, clear } = useCartStore();
    const { isAuthenticated, user } = useAuthStore();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH_ON_DELIVERY");
    const [transactionId, setTransactionId] = useState("");
    const [userBkashNumber, setUserBkashNumber] = useState("");
    const [deliveryArea, setDeliveryArea] = useState<DeliveryArea>("INSIDE_DHAKA");

    const cartTotal = total();
    const deliveryCharge = deliveryArea === "INSIDE_DHAKA" ? 60 : 150;
    const finalTotal = cartTotal + deliveryCharge;

    // Route back if user has empty cart
    useEffect(() => {
        if (items.length === 0 && !confirmedOrder) {
            router.push("/shop");
        }
    }, [items, router, confirmedOrder]);

    // Route to login if not authenticated
    useEffect(() => {
        if (!isAuthenticated) {
            router.push("/login?redirect=/checkout");
        }
    }, [isAuthenticated, router]);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<CheckoutSchemaInput>({
        resolver: zodResolver(checkoutSchema),
    });

    // Prefill user details if logged in
    useEffect(() => {
        if (user) {
            setValue("name", user.name);
            setValue("phone", user.phone);
        }
    }, [user, setValue]);

    const onSubmit = async (data: CheckoutSchemaInput) => {
        setError(null);
        if (paymentMethod === "BKASH" && (!transactionId.trim() || !userBkashNumber.trim())) {
            setError(t("checkout.error.default"));
            return;
        }
        setLoading(true);
        try {
            const orderItems = items.map((i) => ({
                productId: i.product.id,
                quantity: i.quantity,
            }));

            const order = await ordersApi.checkout({
                items: orderItems,
                shippingAddress: {
                    name: data.name,
                    phone: data.phone,
                    city: data.city,
                    address: data.address,
                },
                notes: data.notes,
                paymentMethod,
                transactionId: paymentMethod === "CASH_ON_DELIVERY" ? undefined : transactionId,
                userBkashNumber: paymentMethod === "CASH_ON_DELIVERY" ? undefined : userBkashNumber,
                deliveryArea,
            });

            // Clear cart and show confirmation modal
            clear();
            setConfirmedOrder(order);
        } catch (err: any) {
            setError(
                err.response?.data?.message || t("checkout.error.default")
            );
        } finally {
            setLoading(false);
        }
    };

    // â”€â”€ Order Confirmation Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (confirmedOrder) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-[fadeInUp_0.4s_ease]">
                    {/* Icon */}
                    <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50">
                        <div className="absolute inset-0 rounded-full bg-red-100 animate-ping opacity-40" />
                        <CheckCircle2 className="text-red-600 relative z-10" size={44} strokeWidth={1.5} />
                    </div>

                    {/* Heading */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Order Confirmed
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Your order has been placed successfully. We will contact you shortly.
                    </p>

                    {/* Order details card */}
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 mb-6 text-left space-y-2">
                        <div className="flex justify-between text-xs text-gray-500">
                            <span className="font-semibold uppercase tracking-wide">Order ID</span>
                            <span className="font-mono text-gray-700 truncate max-w-[180px]">{confirmedOrder.id}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                            <span className="font-semibold uppercase tracking-wide">Total</span>
                            <span className="font-bold text-red-800 text-sm">{formatCurrency(Number(confirmedOrder.total), locale)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500">
                            <span className="font-semibold uppercase tracking-wide">Status</span>
                            <span className="rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5">Pending</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => router.push("/dashboard/orders")}
                            className="flex-1 btn-primary flex items-center justify-center gap-2"
                        >
                            View My Orders <ArrowRight size={15} />
                        </button>
                        <button
                            onClick={() => router.push("/shop")}
                            className="flex-1 btn-secondary"
                        >
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || items.length === 0) return null;

    return (
        <div className="page-container py-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">{t("checkout.heading")}</h1>

            {error && (
                <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 font-medium">
                    {error}
                </div>
            )}

            <form className="grid grid-cols-1 lg:grid-cols-3 gap-8" onSubmit={handleSubmit(onSubmit)}>
                {/* Shipping address details */}
                <div className="lg:col-span-2 space-y-6 card-flat p-6 lg:p-8">
                    <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">{t("checkout.shipping.heading")}</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="label mb-1.5 block">{t("checkout.shipping.nameLabel")}</label>
                            <input type="text" className="input text-left" {...register("name")} />
                            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                        </div>

                        <div>
                            <label className="label mb-1.5 block">{t("checkout.shipping.phoneLabel")}</label>
                            <input type="text" className="input text-left" {...register("phone")} />
                            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="label mb-1.5 block">{t("checkout.shipping.cityLabel")}</label>
                            <input type="text" className="input text-left" placeholder={t("checkout.shipping.cityPlaceholder")} {...register("city")} />
                            {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>}
                        </div>

                        <div>
                            <label className="label mb-1.5 block">{t("checkout.shipping.addressLabel")}</label>
                            <input type="text" className="input text-left" placeholder={t("checkout.shipping.addressPlaceholder")} {...register("address")} />
                            {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="label mb-1.5 block">{t("checkout.shipping.deliveryAreaLabel")}</label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${deliveryArea === "INSIDE_DHAKA" ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"}`}>
                                <input
                                    type="radio"
                                    name="deliveryArea"
                                    value="INSIDE_DHAKA"
                                    checked={deliveryArea === "INSIDE_DHAKA"}
                                    onChange={() => setDeliveryArea("INSIDE_DHAKA")}
                                    className="accent-red-800"
                                />
                                <div>
                                    <span className="text-xs font-semibold text-gray-800">{t("checkout.shipping.insideDhaka")}</span>
                                    <p className="text-[10px] text-gray-400">{t("checkout.shipping.deliveryChargeInside")}</p>
                                </div>
                            </label>
                            <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${deliveryArea === "OUTSIDE_DHAKA" ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"}`}>
                                <input
                                    type="radio"
                                    name="deliveryArea"
                                    value="OUTSIDE_DHAKA"
                                    checked={deliveryArea === "OUTSIDE_DHAKA"}
                                    onChange={() => setDeliveryArea("OUTSIDE_DHAKA")}
                                    className="accent-red-800"
                                />
                                <div>
                                    <span className="text-xs font-semibold text-gray-800">{t("checkout.shipping.outsideDhaka")}</span>
                                    <p className="text-[10px] text-gray-400">{t("checkout.shipping.deliveryChargeOutside")}</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="label mb-1.5 block">{t("checkout.shipping.notesLabel")}</label>
                        <textarea className="input text-left min-h-[80px]" placeholder={t("checkout.shipping.notesPlaceholder")} {...register("notes")} />
                    </div>
                </div>

                {/* Order review sidebar */}
                <div className="space-y-6">
                    <div className="card-flat p-6">
                        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">{t("checkout.review.heading")}</h2>
                        <div className="space-y-4 mb-6 max-h-60 sm:max-h-80 overflow-y-auto">
                            {items.map((item) => (
                                <div key={item.product.id} className="flex justify-between items-center gap-4 py-1">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-gray-800 truncate">{item.product.name}</p>
                                        <p className="text-xs text-gray-400">৳{Number(item.product.price).toLocaleString()} x {item.quantity}</p>
                                    </div>
                                    <span className="text-sm font-bold text-gray-700">{formatCurrency(Number(item.product.price) * item.quantity, locale)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3 mb-6 border-t border-gray-100 pt-4">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>{t("checkout.review.subtotal")}</span>
                                <span>{formatCurrency(cartTotal, locale)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>{t("checkout.review.delivery")}</span>
                                <span className="text-red-700 font-semibold">{formatCurrency(deliveryCharge, locale)}</span>
                            </div>
                            <hr className="border-gray-100" />
                            <div className="flex justify-between text-base font-bold text-gray-900">
                                <span>{t("checkout.review.total")}</span>
                                <span className="text-red-800">{formatCurrency(finalTotal, locale)}</span>
                            </div>
                        </div>

                        <div className="rounded-md border border-red-150 bg-red-50 p-4 mb-6">
                            <p className="text-xs font-bold text-red-800 uppercase tracking-wide mb-3">{t("checkout.payment.heading")}</p>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 cursor-pointer hover:border-red-400 transition-colors">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="CASH_ON_DELIVERY"
                                        checked={paymentMethod === "CASH_ON_DELIVERY"}
                                        onChange={() => setPaymentMethod("CASH_ON_DELIVERY")}
                                        className="accent-red-800"
                                    />
                                    <div>
                                        <span className="text-xs font-semibold text-gray-800">{t("checkout.payment.method")}</span>
                                    </div>
                                </label>
                                <label className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 cursor-pointer hover:border-red-400 transition-colors">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="BKASH"
                                        checked={paymentMethod === "BKASH"}
                                        onChange={() => setPaymentMethod("BKASH")}
                                        className="accent-red-800"
                                    />
                                    <div className="flex items-center gap-2">
                                        <Smartphone size={16} className="text-pink-600" />
                                        <span className="text-xs font-semibold text-gray-800">{t("checkout.payment.bkash")}</span>
                                    </div>
                                </label>
                                {paymentMethod === "BKASH" && (
                                    <div className="space-y-3 rounded-lg border border-pink-200 bg-pink-50 p-3">
                                        <p className="text-xs font-bold text-pink-800">{t("checkout.payment.bkashNumber")}</p>
                                        <input
                                            type="text"
                                            className="input text-left text-xs"
                                            placeholder={t("checkout.payment.bkashNumberPlaceholder")}
                                            value={userBkashNumber}
                                            onChange={(e) => setUserBkashNumber(e.target.value)}
                                        />
                                        <div>
                                            <label className="text-xs font-semibold text-pink-800 block mb-1">{t("checkout.payment.transactionId")}</label>
                                            <input
                                                type="text"
                                                className="input text-left text-xs"
                                                placeholder={t("checkout.payment.transactionIdPlaceholder")}
                                                value={transactionId}
                                                onChange={(e) => setTransactionId(e.target.value)}
                                            />
                                        </div>
                                        <p className="text-xs text-red-600 font-semibold">{t("checkout.payment.transactionIdHelp")}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="btn-primary w-full py-4 text-sm font-bold">
                            {loading ? t("checkout.submit.loading") : t("checkout.submit.text")}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

