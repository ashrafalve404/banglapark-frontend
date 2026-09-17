"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { categoriesApi } from "@/lib/api/categories";
import type { Category } from "@/types";
import {
    FaTags,
    FaSpinner,
    FaMagnifyingGlass,
    FaLayerGroup
} from "react-icons/fa6";
import { LayoutGrid } from "lucide-react";
import { useLocale } from "@/lib/i18n";

type CategoryWithCount = Category & {
    _count?: {
        products?: number;
    };
};

function getCategoryIcon(_name?: string, _slug?: string) {
    return LayoutGrid;
}

const CATEGORY_SOLID_COLORS = [
    { bg: "bg-indigo-600", accent: "bg-indigo-600" },
    { bg: "bg-blue-600", accent: "bg-blue-600" },
    { bg: "bg-emerald-600", accent: "bg-emerald-600" },
    { bg: "bg-amber-600", accent: "bg-amber-600" },
    { bg: "bg-rose-600", accent: "bg-rose-600" },
    { bg: "bg-violet-600", accent: "bg-violet-600" },
    { bg: "bg-sky-600", accent: "bg-sky-600" },
    { bg: "bg-teal-600", accent: "bg-teal-600" },
];

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
        ((cat as any)._count?.products ?? 0) > 0 &&
        (cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         cat.slug.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-xl bg-slate-900 p-6 sm:p-8 text-white shadow-md">
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
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-xs">
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
                    {filteredCategories.map((cat, idx) => {
                        const productCount = cat._count?.products ?? 0;
                        const Icon = getCategoryIcon(cat.name, cat.slug);
                        const solidColor = CATEGORY_SOLID_COLORS[idx % CATEGORY_SOLID_COLORS.length];

                        return (
                            <Link
                                key={cat.id}
                                href={`/shop?categoryId=${cat.id}`}
                                className="group relative flex flex-col items-center justify-center text-center gap-3 rounded-xl bg-white border border-slate-150/90 p-5 shadow-xs hover:shadow-lg hover:border-indigo-500/30 hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
                            >
                                {/* Top Color Accent Line */}
                                <div className={`absolute top-0 left-0 right-0 h-1 ${solidColor.accent}`} />

                                {cat.image ? (
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center p-1 group-hover:scale-105 transition-transform duration-300">
                                        <img src={cat.image} alt={cat.name} className="max-h-full max-w-full object-contain" />
                                    </div>
                                ) : (
                                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${solidColor.bg} text-white shadow-xs flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                                        <Icon size={24} className="sm:w-6 sm:h-6 stroke-[2.2]" />
                                    </div>
                                )}

                                <div className="space-y-0.5">
                                    <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors block line-clamp-1">
                                        {cat.name}
                                    </span>
                                    <span className="text-[10px] font-semibold text-slate-400 block">
                                        {productCount} {isBn ? "টি পণ্য" : "products"}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
