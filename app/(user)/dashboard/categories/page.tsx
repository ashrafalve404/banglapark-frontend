"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { categoriesApi } from "@/lib/api/categories";
import type { Category } from "@/types";
import {
    FaTags,
    FaBoxOpen,
    FaArrowRight,
    FaSpinner,
    FaMagnifyingGlass,
    FaLayerGroup
} from "react-icons/fa6";
import { useLocale } from "@/lib/i18n";

type CategoryWithCount = Category & {
    _count?: {
        products?: number;
    };
};

export default function UserCategoriesPage() {
    const { locale } = useLocale();
    const isBn = locale === "bn";

    const [categories, setCategories] = useState<CategoryWithCount[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const res = await categoriesApi.list();
            setCategories(res.categories || []);
        } catch (error) {
            console.error("Failed to load categories:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCategories = categories.filter((cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getGradientByIndex = (index: number) => {
        const gradients = [
            "from-indigo-500 to-purple-600",
            "from-blue-500 to-cyan-600",
            "from-emerald-500 to-teal-600",
            "from-amber-500 to-orange-600",
            "from-rose-500 to-pink-600",
            "from-violet-500 to-indigo-600",
            "from-sky-500 to-blue-600",
            "from-teal-500 to-emerald-600",
        ];
        return gradients[index % gradients.length];
    };

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/10">
                            <FaTags className="text-indigo-400" />
                            <span>{isBn ? "সকল ক্যাটাগরি" : "All Categories"}</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                            {isBn ? "পণ্য ক্যাটাগরি সমূহ" : "Product Categories"}
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                            {isBn
                                ? "আপনার পছন্দের ক্যাটাগরি বেছে নিয়ে সেরা পণ্যসমূহ সহজে খুঁজে নিন।"
                                : "Browse through our curated collection of product categories and explore top deals."}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/10 text-center shrink-0 min-w-28">
                            <span className="block text-2xl font-black text-white">{categories.length}</span>
                            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                                {isBn ? "ক্যাটাগরি" : "Categories"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
                <div className="relative w-full sm:w-80">
                    <FaMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                    <input
                        type="text"
                        placeholder={isBn ? "ক্যাটাগরি অনুসন্ধান করুন..." : "Search categories..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-gray-200 focus:border-indigo-500 focus:outline-hidden transition-all bg-gray-50/50"
                    />
                </div>

                <div className="text-xs text-gray-500 font-semibold self-end sm:self-center">
                    {isBn ? `মোট ${filteredCategories.length} টি ক্যাটাগরি প্রদর্শিত` : `Showing ${filteredCategories.length} categories`}
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="py-24 text-center space-y-3 bg-white rounded-2xl border border-gray-100 shadow-xs">
                    <FaSpinner className="animate-spin text-indigo-600 mx-auto" size={32} />
                    <p className="text-xs font-semibold text-gray-500">
                        {isBn ? "ক্যাটাগরি লোড হচ্ছে..." : "Loading categories..."}
                    </p>
                </div>
            ) : filteredCategories.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-2xl border border-gray-100 shadow-xs space-y-4 px-4">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
                        <FaLayerGroup size={28} />
                    </div>
                    <div className="space-y-1 max-w-sm mx-auto">
                        <h3 className="text-base font-bold text-gray-900">
                            {categories.length === 0
                                ? (isBn ? "কোনো ক্যাটাগরি পাওয়া যায়নি" : "No categories found")
                                : (isBn ? "খুঁজে পাওয়া যায়নি" : "No matching categories")}
                        </h3>
                        <p className="text-xs text-gray-500">
                            {categories.length === 0
                                ? (isBn
                                    ? "এডমিন প্যানেল থেকে এখনও কোনো ক্যাটাগরি যোগ করা হয়নি।"
                                    : "No categories have been added from the admin panel yet.")
                                : (isBn
                                    ? "আপনার সার্চ টার্মের সাথে কোনো ক্যাটাগরি মিলেনি।"
                                    : "Try searching with a different term.")}
                        </p>
                    </div>

                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200 transition-all cursor-pointer"
                        >
                            {isBn ? "সার্চ ক্লিয়ার করুন" : "Clear Search"}
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                    {filteredCategories.map((cat, idx) => {
                        const productCount = cat._count?.products ?? 0;
                        const gradient = getGradientByIndex(idx);

                        return (
                            <Link
                                key={cat.id}
                                href={`/shop?category=${cat.slug}`}
                                className="group relative rounded-2xl bg-white p-5 border border-gray-100 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
                            >
                                {/* Top Color Accent Bar */}
                                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${gradient}`} />

                                <div className="space-y-4 pt-1">
                                    <div className="flex items-center justify-between">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center font-bold text-lg shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                            {cat.name.charAt(0).toUpperCase()}
                                        </div>

                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 border border-indigo-100">
                                            <FaBoxOpen size={11} />
                                            {isBn ? `${productCount} টি পণ্য` : `${productCount} Products`}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                                            {cat.name}
                                        </h3>
                                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                                            /{cat.slug}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 mt-4 border-t border-gray-50 flex items-center justify-between text-xs font-bold text-indigo-600 group-hover:text-indigo-700">
                                    <span>{isBn ? "পণ্যসমূহ দেখুন" : "Explore Products"}</span>
                                    <FaArrowRight className="group-hover:translate-x-1 transition-transform" size={12} />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
