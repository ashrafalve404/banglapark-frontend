"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Loader2, ChevronDown, ShoppingCart } from "lucide-react";
import { productsApi } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { useCartStore } from "@/store/cart";
import { useLocale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

function ShopPageContent() {
    const { t, locale } = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc" | "popular">("popular");
    const addItem = useCartStore((s) => s.addItem);

    useEffect(() => {
        document.title = `${t("shop.heading")} | Bangla Park Limited`;
    }, [t]);
    const [addedId, setAddedId] = useState<string | null>(null);
    const [sizePopups, setSizePopups] = useState<Record<string, string>>({});

    const handleAddToCart = (product: any, e: React.MouseEvent, size?: string) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product, 1, size);
        setAddedId(product.id);
        setTimeout(() => setAddedId(null), 1500);
    };

    const { data: categoriesData } = useQuery({
        queryKey: ["categories"],
        queryFn: () => categoriesApi.list(),
    });

    const categories = (categoriesData?.categories ?? []).filter((c: any) => (c._count?.products ?? 0) > 0);

    const handleCategorySelect = (catId: string) => {
        setSelectedCategory(catId);
        const params = new URLSearchParams(searchParams.toString());
        if (catId === "all") {
            params.delete("categoryId");
            params.delete("category");
        } else {
            params.set("categoryId", catId);
        }
        const queryString = params.toString();
        router.replace(queryString ? `/shop?${queryString}` : "/shop", { scroll: false });
    };

    useEffect(() => {
        const catParam = searchParams.get("categoryId") || searchParams.get("category");
        if (catParam) {
            const found = categories.find((c) => c.id === catParam || c.slug === catParam);
            if (found) {
                setSelectedCategory(found.id);
            } else {
                setSelectedCategory(catParam);
            }
        } else {
            setSelectedCategory("all");
        }
        const sParam = searchParams.get("search");
        if (sParam !== null) {
            setSearch(sParam);
        }
    }, [searchParams, categories]);

    const { data: productsData, isLoading: prodLoading, isError: prodError } = useQuery({
        queryKey: ["products", selectedCategory, search, sort],
        queryFn: () =>
            productsApi.list({
                categoryId: selectedCategory === "all" ? undefined : selectedCategory,
                search: search || undefined,
                sort: sort,
                limit: 50,
            }),
    });

    const products = productsData?.products ?? [];

    return (
        <div className="page-container py-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{t("shop.heading")}</h1>
                    <p className="mt-1 text-sm text-gray-500">{t("shop.subheading")}</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select
                            value={sort}
                            onChange={(e) => setSort(e.target.value as "newest" | "price_asc" | "price_desc" | "popular")}
                            className="input pr-8 appearance-none text-sm"
                        >
                            <option value="popular">{t("shop.sort.popular", undefined, "Most Popular")}</option>
                            <option value="newest">{t("shop.sort.newest", undefined, "Newest")}</option>
                            <option value="price_asc">{t("shop.sort.priceLowHigh", undefined, "Price: Low to High")}</option>
                            <option value="price_desc">{t("shop.sort.priceHighLow", undefined, "Price: High to Low")}</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    <div className="relative w-full md:w-80">
                        <input
                            type="text"
                            className="input pl-10"
                            placeholder={t("shop.search.placeholder")}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                </div>
            </div>

            {/* Mobile Category Horizontal Scroll Pill Bar */}
            {categories.length > 0 && (
                <div className="block lg:hidden mb-4">
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none snap-x">
                        <button
                            onClick={() => handleCategorySelect("all")}
                            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all snap-start cursor-pointer ${selectedCategory === "all"
                                    ? "bg-red-700 text-white shadow-xs"
                                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                                }`}
                        >
                            {t("shop.filter.all")}
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => handleCategorySelect(cat.id)}
                                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all snap-start cursor-pointer ${selectedCategory === cat.id
                                        ? "bg-red-700 text-white shadow-xs"
                                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Desktop Category Sidebar */}
                {categories.length > 0 && (
                    <div className="hidden lg:block lg:w-64 space-y-6 shrink-0">
                        <div className="card-flat p-4 sticky top-24">
                            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    {t("shop.filter.categories")}
                                </h3>
                                <span className="text-[11px] font-semibold text-slate-400">({categories.length})</span>
                            </div>
                            <div className="max-h-[calc(100vh-180px)] overflow-y-auto pr-1.5 space-y-1 divide-y divide-slate-50 flex flex-col">
                                <button
                                    onClick={() => handleCategorySelect("all")}
                                    className={`text-left rounded-lg px-3 py-2 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${selectedCategory === "all"
                                            ? "bg-red-700 text-white shadow-xs"
                                            : "text-slate-700 hover:bg-slate-50"
                                        }`}
                                >
                                    <span>{t("shop.filter.all")}</span>
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => handleCategorySelect(cat.id)}
                                        className={`text-left rounded-lg px-3 py-2 text-xs font-semibold transition-colors flex items-center justify-between cursor-pointer ${selectedCategory === cat.id
                                                ? "bg-red-700 text-white shadow-xs"
                                                : "text-slate-700 hover:bg-slate-50"
                                            }`}
                                    >
                                        <span className="truncate">{cat.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1">
                    {products.length === 0 ? (
                        <div className="card-flat py-20 text-center text-gray-400">
                            {t("shop.empty")}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                            {products.map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/product/${product.slug}`}
                                    className="group card-flat overflow-hidden hover:shadow-md transition-all flex flex-col"
                                >
                                    <div className="aspect-square bg-gray-50 overflow-hidden relative">
                                        {product.images?.[0] ? (
                                            <img
                                                src={product.images[0]}
                                                alt={product.name}
                                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-gray-300 text-sm">
                                                {t("shop.product.noImage")}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 flex flex-col flex-1">
                                        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1.5 flex-1">
                                            {product.name}
                                        </h3>
                                        <div className="mt-auto">
                                            <p className="text-base font-bold text-emerald-600">
                                                ৳{formatCurrency(product.price, locale).replace("৳", "")}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className={`text-xs ${product.stock > 0 ? "text-gray-400" : "text-red-500 font-semibold"}`}>
                                                    {product.stock > 0 ? `${t("shop.product.stockLabel")} ${product.stock}` : t("shop.product.stockOut")}
                                                </p>
                                                {product.clicks > 0 && (
                                                    <span className="text-[10px] text-gray-400">• {product.clicks} views</span>
                                                )}
                                            </div>
                                            {product.stock > 0 && (
                                                <div className="mt-2 space-y-1.5">
                                                    {product.sizes?.length > 0 && (
                                                        <select
                                                            value={sizePopups[product.id] || ""}
                                                            onChange={(e) => setSizePopups({ ...sizePopups, [product.id]: e.target.value })}
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                            className="w-full rounded-sm border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600"
                                                        >
                                                            <option value="">{t("shop.product.selectSize", undefined, "Select size")}</option>
                                                            {product.sizes.map((s: string) => (
                                                                <option key={s} value={s}>{s}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                    <button
                                                        onClick={(e) => handleAddToCart(product, e, sizePopups[product.id] || undefined)}
                                                        className="w-full rounded-sm bg-red-700 py-2 text-sm font-bold text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        {addedId === product.id ? (
                                                            <span>{t("shop.product.added", undefined, "Added!")}</span>
                                                        ) : (
                                                            <><ShoppingCart size={14} /> {t("product.addToCart")}</>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function ShopPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-green-800" size={32} />
            </div>
        }>
            <ShopPageContent />
        </Suspense>
    );
}
