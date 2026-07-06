"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, Loader2, ChevronDown, ShoppingCart } from "lucide-react";
import { productsApi } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { useCartStore } from "@/store/cart";
import { useLocale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

function ShopPageContent() {
    const { t, locale } = useLocale();
    const searchParams = useSearchParams();
    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [sort, setSort] = useState<"newest" | "price_asc" | "price_desc">("newest");
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

    const { data: productsData, isLoading: prodLoading } = useQuery({
        queryKey: ["products", selectedCategory, search, sort],
        queryFn: () =>
            productsApi.list({
                categoryId: selectedCategory === "all" ? undefined : selectedCategory,
                search: search || undefined,
                sort: sort === "newest" ? undefined : sort,
                limit: 50,
            }),
    });

    const { data: categoriesData } = useQuery({
        queryKey: ["categories"],
        queryFn: () => categoriesApi.list(),
    });

    const categories = categoriesData?.categories ?? [];
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
                            onChange={(e) => setSort(e.target.value as "newest" | "price_asc" | "price_desc")}
                            className="input pr-8 appearance-none text-sm"
                        >
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

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-64 space-y-6">
                    <div className="card-flat p-5">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
                            {t("shop.filter.categories")}
                        </h3>
                        <div className="flex flex-wrap gap-2 lg:flex-col">
                            <button
                                onClick={() => setSelectedCategory("all")}
                                className={`text-left rounded-lg px-3 py-2 text-sm font-medium transition-colors ${selectedCategory === "all"
                                        ? "bg-green-800 text-white"
                                        : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                {t("shop.filter.all")}
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`text-left rounded-lg px-3 py-2 text-sm font-medium transition-colors ${selectedCategory === cat.id
                                            ? "bg-green-800 text-white"
                                            : "text-gray-600 hover:bg-gray-50"
                                        }`}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1">
                    {prodLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="animate-spin text-green-800" size={32} />
                        </div>
                    ) : products.length === 0 ? (
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
                                        {Number(product.price) >= 2000 && (
                                            <span className="mb-2 self-start rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                                                {t("shop.product.activationBadge")}
                                            </span>
                                        )}
                                        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1.5 flex-1">
                                            {product.name}
                                        </h3>
                                        <div className="mt-auto">
                                            <p className="text-base font-bold text-green-800">
                                                ৳{formatCurrency(product.price, locale).replace("৳", "")}
                                            </p>
                                            <p className={`text-xs mt-0.5 ${product.stock > 0 ? "text-gray-400" : "text-red-500 font-semibold"}`}>
                                                {product.stock > 0 ? `${t("shop.product.stockLabel")} ${product.stock}` : t("shop.product.stockOut")}
                                            </p>
                                            {product.stock > 0 && (
                                                <div className="mt-2 space-y-1.5">
                                                    {product.sizes?.length > 0 && (
                                                        <select
                                                            value={sizePopups[product.id] || ""}
                                                            onChange={(e) => setSizePopups({ ...sizePopups, [product.id]: e.target.value })}
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                                            className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600"
                                                        >
                                                            <option value="">{t("shop.product.selectSize", undefined, "Select size")}</option>
                                                            {product.sizes.map((s: string) => (
                                                                <option key={s} value={s}>{s}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                    <button
                                                        onClick={(e) => handleAddToCart(product, e, sizePopups[product.id] || undefined)}
                                                        className="w-full rounded-lg bg-green-800 py-1.5 text-xs font-semibold text-white hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
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
