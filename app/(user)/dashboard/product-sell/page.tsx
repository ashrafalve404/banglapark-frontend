"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
    FaStore, FaPlus, FaCircleInfo, FaClock, FaCircleCheck,
    FaCircleXmark, FaCoins, FaBoxOpen, FaUpload, FaSpinner, FaLock
} from "react-icons/fa6";
import { useAuthStore } from "@/store/auth";
import { userProductsApi } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { uploadsApi } from "@/lib/api/uploads";
import type { Category, Product } from "@/types";
import { useLocale } from "@/lib/i18n";
import Link from "next/link";

type UserProductItem = Product & {
    totalSoldQuantity: number;
    totalRevenue: number;
    sellerEarnings80Percent: number;
};

export default function ProductSellPage() {
    const { user } = useAuthStore();
    const { locale } = useLocale();
    const isBn = locale === "bn";

    const isActiveUser = user?.status === "ACTIVE";

    const [products, setProducts] = useState<UserProductItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    // Form Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formMsg, setFormMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        stock: "1",
        categoryId: "",
        images: [] as string[],
        sizes: "",
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [myProducts, catRes] = await Promise.all([
                userProductsApi.getMyProducts().catch(() => []),
                categoriesApi.list().catch(() => ({ categories: [] })),
            ]);
            setProducts(myProducts);
            setCategories(catRes.categories || []);
        } catch (error) {
            console.error("Failed to load seller data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;
        if (formData.images.length >= 4) {
            setFormMsg({ type: "error", text: isBn ? "সর্বোচ্চ ৪ টি ছবি আপলোড করা যাবে" : "Maximum 4 images allowed per product" });
            return;
        }

        setUploading(true);
        setFormMsg(null);
        try {
            const file = files[0];
            const { url } = await uploadsApi.upload(file);
            setFormData((prev) => ({ ...prev, images: [...prev.images, url] }));
        } catch (err: any) {
            setFormMsg({ type: "error", text: err?.response?.data?.message || (isBn ? "ছবি আপলোড ব্যর্থ হয়েছে" : "Failed to upload image") });
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index),
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormMsg(null);
        if (!formData.name.trim()) {
            setFormMsg({ type: "error", text: isBn ? "পোডাক্টের নাম দেওয়া আবশ্যক" : "Product name is required" });
            return;
        }
        if (!formData.price || Number(formData.price) <= 0) {
            setFormMsg({ type: "error", text: isBn ? "সঠিক বিক্রয় মূল্য দেওয়া আবশ্যক" : "Valid price is required" });
            return;
        }

        setSubmitting(true);
        try {
            await userProductsApi.submitProduct({
                name: formData.name.trim(),
                description: formData.description.trim() || undefined,
                price: Number(formData.price),
                stock: Number(formData.stock) || 1,
                categoryId: formData.categoryId || undefined,
                images: formData.images,
                sizes: formData.sizes ? formData.sizes.split(",").map((s) => s.trim()).filter(Boolean) : [],
            });

            setFormMsg({
                type: "success",
                text: isBn
                    ? "পোডাক্ট সফলভাবে জমা দেওয়া হয়েছে! এডমিন অনুমোদনের অপেক্ষায় রয়েছে।"
                    : "Product submitted successfully! Pending admin approval."
            });
            setTimeout(() => {
                setIsModalOpen(false);
                setFormMsg(null);
            }, 1500);
            setFormData({
                name: "",
                description: "",
                price: "",
                stock: "1",
                categoryId: "",
                images: [],
                sizes: "",
            });
            loadData();
        } catch (err: any) {
            setFormMsg({ type: "error", text: err?.response?.data?.message || (isBn ? "পোডাক্ট সাবমিট করতে সমস্যা হয়েছে" : "Failed to submit product") });
        } finally {
            setSubmitting(false);
        }
    };

    const totalSellerEarnings = products.reduce((acc, p) => acc + p.sellerEarnings80Percent, 0);
    const totalSoldUnits = products.reduce((acc, p) => acc + p.totalSoldQuantity, 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FaStore className="text-teal-600" />
                        {isBn ? "পোডাক্ট বিক্রয় ড্যাশবোর্ড" : "Product Selling Dashboard"}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {isBn
                            ? "বাংলা পার্কে আপনার পণ্য যুক্ত করুন এবং প্রতি বিক্রয়ে ৮০% অর্থ উপার্জন করুন"
                            : "List your products on Bangla Park and earn 80% on every sale"}
                    </p>
                </div>
                {isActiveUser ? (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-all cursor-pointer"
                    >
                        <FaPlus size={14} /> {isBn ? "নতুন পোডাক্ট যোগ করুন" : "Add New Product"}
                    </button>
                ) : (
                    <button
                        disabled
                        className="flex items-center justify-center gap-2 rounded-xl bg-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-500 cursor-not-allowed"
                    >
                        <FaLock size={14} /> {isBn ? "পোডাক্ট যোগ করুন (শুধুমাত্র অ্যাক্টিভ ইউজার)" : "Add Product (Active Users Only)"}
                    </button>
                )}
            </div>

            {/* Inactive Alert Banner */}
            {!isActiveUser && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 sm:p-5 flex items-start gap-4 text-amber-800">
                    <FaLock size={22} className="text-amber-600 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                        <h3 className="font-bold text-amber-900 text-base">
                            {isBn ? "পণ্য বিক্রয়ের জন্য অ্যাক্টিভ একাউন্ট প্রয়োজন" : "Active Account Required for Selling"}
                        </h3>
                        <p className="text-xs sm:text-sm text-amber-700 leading-relaxed">
                            {isBn
                                ? "শুধুমাত্র সক্রিয় সদস্যগণ বাংলা পার্কে তাদের নিজস্ব পণ্য তালিকাভুক্ত ও বিক্রি করতে পারবেন। অনুগ্রহ করে একটি পণ্য ক্রয় করে বা অ্যাক্টিভেশন সম্পন্ন করে প্রথমে একাউন্ট সক্রিয় করুন।"
                                : "Only active members can list and sell products on Bangla Park. Please activate your account first by placing a qualifying purchase or completing activation."}
                        </p>
                        <div className="pt-2">
                            <Link
                                href="/shop"
                                className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-all"
                            >
                                {isBn ? "শপ করুন ও অ্যাক্টিভ হন" : "Shop & Activate Now"}
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Store Delivery & Commission Rules Info Banner */}
            <div className="rounded-xl bg-gradient-to-br from-teal-900 to-emerald-950 p-5 text-white shadow-lg space-y-3 border border-teal-700/50">
                <div className="flex items-center gap-3 text-teal-300 font-bold text-base">
                    <FaCircleInfo size={20} />
                    <span>{isBn ? "বাংলা পার্কে কিভাবে পণ্য বিক্রি কাজ করে" : "How Product Selling Works on Bangla Park"}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 text-xs sm:text-sm pt-1 text-teal-100/90">
                    <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs border border-white/10 space-y-1">
                        <div className="font-bold text-teal-200">
                            {isBn ? "১. অনলাইনে পণ্য জমা দিন" : "1. List Product Online"}
                        </div>
                        <p className="text-xs leading-relaxed text-teal-100/80">
                            {isBn
                                ? "পণ্যের বিবরণ ও ছবি দিন। এডমিন অনুমোদনের পূর্বে এটি পেন্ডিং থাকবে।"
                                : "Submit product details & images. Your product stays pending until admin approval."}
                        </p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs border border-white/10 space-y-1">
                        <div className="font-bold text-teal-200">
                            {isBn ? "২. টিম স্টোরে পণ্য জমা দিন" : "2. Deliver Stock to Store"}
                        </div>
                        <p className="text-xs leading-relaxed text-teal-100/80">
                            {isBn
                                ? "সাপোর্টে যোগাযোগ করে পণ্যটি সরাসরি বাংলা পার্ক টিম স্টোরে পৌঁছে দিন।"
                                : "Deliver your physical product to Bangla Park team store by contacting support."}
                        </p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs border border-white/10 space-y-1">
                        <div className="font-bold text-teal-200">
                            {isBn ? "৩. বিক্রয়ে ৮০% পে-আউট পান" : "3. Get 80% Payout on Sale"}
                        </div>
                        <p className="text-xs leading-relaxed text-teal-100/80">
                            {isBn
                                ? "পণ্য বিক্রি ও ডেলিভারি হওয়ার সাথে সাথে ৮০% অর্থ ওয়ালেটে যুক্ত হবে (২০% প্ল্যাটফর্ম কমিশন)।"
                                : "When sold and delivered, 80% of price is instantly credited to your wallet (20% platform fee)."}
                        </p>
                    </div>
                </div>
            </div>

            {/* Seller Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-white p-5 border border-gray-100 shadow-xs flex items-center gap-4">
                    <div className="rounded-xl bg-teal-100 p-3.5 text-teal-700">
                        <FaBoxOpen size={24} />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-gray-500">{isBn ? "আমার তালিকাভুক্ত পোডাক্ট" : "My Listed Products"}</div>
                        <div className="text-2xl font-extrabold text-gray-900 mt-0.5">{products.length}</div>
                    </div>
                </div>
                <div className="rounded-xl bg-white p-5 border border-gray-100 shadow-xs flex items-center gap-4">
                    <div className="rounded-xl bg-purple-100 p-3.5 text-purple-700">
                        <FaStore size={24} />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-gray-500">{isBn ? "মোট বিক্রিত ইউনিট" : "Total Units Sold"}</div>
                        <div className="text-2xl font-extrabold text-gray-900 mt-0.5">{totalSoldUnits}</div>
                    </div>
                </div>
                <div className="rounded-xl bg-white p-5 border border-gray-100 shadow-xs flex items-center gap-4">
                    <div className="rounded-xl bg-emerald-100 p-3.5 text-emerald-700">
                        <FaCoins size={24} />
                    </div>
                    <div>
                        <div className="text-xs font-medium text-gray-500">{isBn ? "মোট অর্জিত আয়" : "Total Earned"}</div>
                        <div className="text-2xl font-extrabold text-emerald-600 mt-0.5">BDT {totalSellerEarnings.toFixed(2)}</div>
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className="rounded-xl bg-white border border-gray-100 shadow-xs overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h2 className="font-bold text-gray-900">{isBn ? "আমার পোডাক্ট তালিকা" : "My Product Listings"}</h2>
                    <span className="text-xs text-gray-400 font-medium">{products.length} {isBn ? "টি" : "items"}</span>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-400 space-y-2">
                        <FaSpinner className="animate-spin text-teal-600 mx-auto" size={24} />
                        <p className="text-xs font-medium">{isBn ? "পোডাক্ট লোড হচ্ছে..." : "Loading products..."}</p>
                    </div>
                ) : products.length === 0 ? (
                    <div className="p-12 text-center space-y-3">
                        <FaBoxOpen className="mx-auto text-gray-300" size={40} />
                        <div className="text-gray-500 text-sm font-medium">{isBn ? "এখনও কোনো পোডাক্ট যোগ করা হয়নি" : "No products listed yet"}</div>
                        {isActiveUser && (
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-700 transition-all cursor-pointer"
                            >
                                <FaPlus size={12} /> {isBn ? "আপনার প্রথম পোডাক্ট যোগ করুন" : "Add Your First Product"}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider border-b border-gray-100">
                                <tr>
                                    <th className="px-5 py-3.5">{isBn ? "পোডাক্ট" : "Product"}</th>
                                    <th className="px-5 py-3.5">{isBn ? "ক্যাটাগরি" : "Category"}</th>
                                    <th className="px-5 py-3.5">{isBn ? "মূল্য" : "Price"}</th>
                                    <th className="px-5 py-3.5">{isBn ? "স্টক" : "Stock"}</th>
                                    <th className="px-5 py-3.5">{isBn ? "স্ট্যাটাস" : "Status"}</th>
                                    <th className="px-5 py-3.5">{isBn ? "বিক্রি" : "Sold"}</th>
                                    <th className="px-5 py-3.5">{isBn ? "মোট অর্জিত আয়" : "Total Earned"}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                                {products.map((p) => {
                                    const img = p.images?.[0] || "/placeholder.png";
                                    return (
                                        <tr key={p.id} className="hover:bg-gray-50/80 transition-all">
                                            <td className="px-5 py-3.5 flex items-center gap-3">
                                                <div className="relative h-11 w-11 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 shrink-0">
                                                    <Image src={img} alt={p.name} fill className="object-cover" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 text-sm">{p.name}</div>
                                                    <div className="text-[11px] text-gray-400">ID: {p.id.slice(0, 8)}</div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-gray-600">
                                                {p.category?.name || (isBn ? "সাধারণ" : "General")}
                                            </td>
                                            <td className="px-5 py-3.5 font-bold text-gray-900">
                                                BDT {Number(p.price).toFixed(2)}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className="rounded-md bg-gray-100 px-2 py-1 text-gray-700 font-semibold">
                                                    {p.stock} {isBn ? "টি" : "units"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {p.approvalStatus === "PENDING" && (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 border border-amber-200">
                                                        <FaClock size={11} /> {isBn ? "অনুমোদনের অপেক্ষায়" : "Pending Approval"}
                                                    </span>
                                                )}
                                                {p.approvalStatus === "APPROVED" && (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200">
                                                        <FaCircleCheck size={11} /> {isBn ? "অনুমোদিত ও লাইভ" : "Approved & Live"}
                                                    </span>
                                                )}
                                                {p.approvalStatus === "REJECTED" && (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-bold text-rose-700 border border-rose-200" title={p.rejectionReason || (isBn ? "অনুমোদিত নয়" : "Not approved")}>
                                                        <FaCircleXmark size={11} /> {isBn ? "প্রত্যাখ্যাত" : "Rejected"}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 font-semibold text-gray-800">
                                                {p.totalSoldQuantity} {isBn ? "টি" : "units"}
                                            </td>
                                            <td className="px-5 py-3.5 font-extrabold text-emerald-600 text-sm">
                                                BDT {p.sellerEarnings80Percent.toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Product Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
                    <div className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl space-y-4 my-8">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <FaPlus className="text-teal-600" size={16} /> {isBn ? "বিক্রয়ের জন্য পোডাক্ট যোগ করুন" : "Add Product for Selling"}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 p-1"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                            {formMsg && (
                                <div className={`rounded-xl p-3 text-xs font-semibold ${formMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                                    {formMsg.text}
                                </div>
                            )}
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">{isBn ? "পোডাক্টের নাম *" : "Product Title *"}</label>
                                <input
                                    type="text"
                                    required
                                    placeholder={isBn ? "যেমন: হাতের কাজের কটন শার্ট" : "e.g. Handmade Cotton Shirt"}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-teal-500 focus:outline-hidden"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">{isBn ? "বিক্রয় মূল্য (টাকা) *" : "Selling Price (BDT) *"}</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        placeholder="1000"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-teal-500 focus:outline-hidden"
                                    />
                                    <span className="text-[10px] text-teal-600 font-medium mt-0.5 block">
                                        {isBn
                                            ? `আপনি পাবেন ৳ ${formData.price ? (Number(formData.price) * 0.8).toFixed(2) : "0.00"} (৮০%)`
                                            : `You get BDT ${formData.price ? (Number(formData.price) * 0.8).toFixed(2) : "0.00"} (80%)`}
                                    </span>
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-700 mb-1">{isBn ? "প্রাথমিক স্টক পরিমাণ *" : "Initial Stock Quantity *"}</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        placeholder="5"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-teal-500 focus:outline-hidden"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">{isBn ? "ক্যাটাগরি" : "Category"}</label>
                                <select
                                    value={formData.categoryId}
                                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-teal-500 focus:outline-hidden bg-white"
                                >
                                    <option value="">{isBn ? "ক্যাটাগরি নির্বাচন করুন" : "Select Category"}</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">{isBn ? "বিবরণ" : "Description"}</label>
                                <textarea
                                    rows={3}
                                    placeholder={isBn ? "আপনার পণ্য সম্পর্কে বিস্তারিত লিখুন..." : "Write a brief detail about your product..."}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-teal-500 focus:outline-hidden"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-gray-700 mb-1">{isBn ? "সাইজ (ঐচ্ছিক, কমা দিয়ে আলাদা করুন)" : "Sizes (Optional, comma separated)"}</label>
                                <input
                                    type="text"
                                    placeholder="M, L, XL"
                                    value={formData.sizes}
                                    onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                                    className="w-full rounded-xl border border-gray-200 p-2.5 text-sm focus:border-teal-500 focus:outline-hidden"
                                />
                            </div>

                            {/* Images Upload */}
                            <div>
                                <label className="block font-bold text-gray-700 mb-1">{isBn ? "পোডাক্টের ছবি (সর্বোচ্চ ৪ টি)" : "Product Images (Max 4)"}</label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {formData.images.map((url, idx) => (
                                        <div key={idx} className="relative h-16 w-16 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                                            <Image src={url} alt="Product preview" fill className="object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(idx)}
                                                className="absolute top-0.5 right-0.5 rounded-full bg-black/70 text-white p-1 text-[10px]"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}

                                    {formData.images.length < 4 && (
                                        <label className="flex h-16 w-16 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 hover:border-teal-500 hover:bg-teal-50 transition-all">
                                            {uploading ? (
                                                <FaSpinner className="animate-spin text-teal-600" size={16} />
                                            ) : (
                                                <>
                                                    <FaUpload size={14} />
                                                    <span className="text-[9px] font-semibold mt-1">{isBn ? "আপলোড" : "Upload"}</span>
                                                </>
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                disabled={uploading}
                                                onChange={handleImageUpload}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-all cursor-pointer"
                                >
                                    {isBn ? "বাতিল" : "Cancel"}
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition-all cursor-pointer disabled:opacity-50"
                                >
                                    {submitting && <FaSpinner className="animate-spin" />}
                                    {isBn ? "অনুমোদনের জন্য জমা দিন" : "Submit Product for Approval"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
