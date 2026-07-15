"use client";

import Link from "next/link";
import { ArrowRight, ShoppingCart, Loader2 } from "lucide-react";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { productsApi } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { bannersApi } from "@/lib/api/banners";
import { useCartStore } from "@/store/cart";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/lib/i18n";
import { useState, useEffect } from "react";

export default function HomePage() {
    const { t, locale } = useLocale();
    const addItem = useCartStore((s) => s.addItem);
    const [addedId, setAddedId] = useState<string | null>(null);
    const [sizePopups, setSizePopups] = useState<Record<string, string>>({});
    const [productPage, setProductPage] = useState(1);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const handleAddToCart = (product: any, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product);
        setAddedId(product.id);
        setTimeout(() => setAddedId(null), 1500);
    };

    const handleAddToCartWithSize = (product: any, e: React.MouseEvent, size?: string) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product, 1, size);
        setAddedId(product.id);
        setTimeout(() => setAddedId(null), 1500);
    };

    const { data: firstPageData, isError: firstPageError } = useQuery({
        queryKey: ["products", "all", "popular", 1],
        queryFn: () => productsApi.list({ page: 1, limit: 50, sort: "popular" }),
    });

    useEffect(() => {
        if (firstPageError) {
            setHasMore(false);
        }
    }, [firstPageError]);

    useEffect(() => {
        if (firstPageData) {
            if (firstPageData.products?.length > 0) {
                setAllProducts(firstPageData.products);
                setHasMore(firstPageData.page * firstPageData.limit < firstPageData.total);
            }
        }
    }, [firstPageData]);

    const { data: categoriesData } = useQuery({
        queryKey: ["categories"],
        queryFn: () => categoriesApi.list(),
    });

    const categories = categoriesData?.categories ?? [];

    const { data: offers = [] } = useQuery({
        queryKey: ["offers"],
        queryFn: () => bannersApi.findOffers(),
    });

    const handleLoadMore = async () => {
        setLoadingMore(true);
        const nextPage = productPage + 1;
        try {
            const res = await productsApi.list({ page: nextPage, limit: 50, sort: "popular" });
            setAllProducts((prev) => [...prev, ...res.products]);
            setProductPage(nextPage);
            setHasMore(nextPage * res.limit < res.total);
        } finally {
            setLoadingMore(false);
        }
    };

    return (
        <div>
            <BannerCarousel />

            <AnnouncementBar />

            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-700 text-white">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2760%27%20height=%2760%27%20viewBox=%270%200%2060%2060%27%20xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg%20fill=%27none%27%20fill-rule=%27evenodd%27%3E%3Cg%20fill=%27%23ffffff%27%2520fill-opacity=%270.03%27%3E%3Cpath%20d=%27M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />

                {/* Decorative curved shapes */}
                <div className="absolute -top-32 -right-20 h-[28rem] w-[28rem] opacity-25 blur-3xl" style={{ borderRadius: "42% 58% 35% 65% / 55% 40% 60% 45%", background: "linear-gradient(135deg, #166534, #14532d)" }} />
                <div className="absolute -bottom-40 -left-28 h-[35rem] w-[35rem] opacity-20 blur-3xl" style={{ borderRadius: "55% 45% 65% 35% / 40% 60% 40% 60%", background: "linear-gradient(225deg, #052e16, #14532d)" }} />
                <div className="absolute top-1/4 right-1/4 h-72 w-72 opacity-15 blur-2xl" style={{ borderRadius: "60% 40% 50% 50% / 40% 55% 45% 60%", background: "linear-gradient(180deg, #15803d, #166534)" }} />
                <div className="absolute bottom-1/3 left-1/5 h-56 w-56 opacity-15 blur-2xl rotate-12" style={{ borderRadius: "38% 62% 45% 55% / 50% 40% 60% 50%", background: "linear-gradient(300deg, #052e16, #166534)" }} />

                {/* Curved accent lines */}
                <svg className="absolute top-0 right-0 h-full w-64 text-green-950/20" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 0C60 20 40 60 60 100H100V0Z" fill="currentColor" />
                </svg>
                <svg className="absolute bottom-0 left-0 h-32 w-full text-green-950/15" viewBox="0 0 1440 100" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 100C360 20 720 80 1440 30V100H0Z" fill="currentColor" />
                </svg>

                <div className="page-container relative py-16 lg:py-20">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="mb-4 text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold leading-tight">
                            {locale === "en" ? (
                                <>
                                    <span className="md:whitespace-nowrap">
                                        Buy products from the
                                        <br className="block md:hidden" /> Affiliate Marketplace,
                                    </span>
                                    <br />
                                    <span className="md:whitespace-nowrap">Start Earning</span>
                                </>
                            ) : (
                                <>
                                    <span className="md:whitespace-nowrap">
                                        অ্যাফিলিয়েট মার্কেটপ্লেস থেকে
                                        <br className="block md:hidden" /> পণ্য কিনুন,
                                    </span>
                                    <br />
                                    <span className="md:whitespace-nowrap">আয় শুরু করুন</span>
                                </>
                            )}
                        </h1>
                        <p className="mb-6 text-sm sm:text-base lg:text-lg text-green-100 leading-relaxed max-w-3xl mx-auto">
                            {t("home.hero.subtitle")}
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            <Link href="/shop" className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-green-900 hover:bg-green-50 transition-all shadow-lg hover:shadow-xl">
                                {t("home.hero.cta.shop")} <ArrowRight size={16} />
                            </Link>
                            <Link href="/register" className="inline-flex items-center gap-2 rounded-lg border-2 border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all backdrop-blur-sm">
                                {t("home.hero.cta.register")}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Offer Section */}
            {offers.length > 0 && (
                <section className="py-4 bg-white">
                    <div className="page-container">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {offers.map((offer) => (
                                <Link key={offer.id} href={offer.linkUrl || "/shop"} className="group relative rounded-lg overflow-hidden aspect-[16/9] bg-gray-100 block">
                                    <img src={offer.imageUrl} alt={offer.title || "Offer"} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                    {(offer.badge || offer.title) && (
                                        <div className="absolute bottom-3 left-3 right-3">
                                            {offer.badge && (
                                                <span className="inline-block rounded-full bg-green-600 px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wide mb-1">{offer.badge}</span>
                                            )}
                                            {offer.title && (
                                                <h3 className="text-sm font-bold text-white">{offer.title}</h3>
                                            )}
                                        </div>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Categories */}
            {categories.length > 0 && (
                <section className="py-8 bg-gray-50">
                    <div className="page-container">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="section-title text-xl">{t("home.categories.heading")}</h2>
                            <Link href="/shop" className="text-sm font-medium text-green-800 hover:underline">{t("home.categories.viewAll")}</Link>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {categories.map((cat) => (
                                <Link key={cat.id} href={`/shop?categoryId=${cat.id}`}
                                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:border-green-600 hover:text-green-800 hover:shadow-md transition-all">
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* All Products */}
            <section className="py-8 bg-white">
                <div className="page-container">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="section-title text-xl lg:text-2xl">{t("home.allProducts.heading", undefined, "All Products")}</h2>
                        <Link href="/shop" className="text-sm font-medium text-green-800 hover:underline">{t("home.allProducts.viewAll", undefined, "View All →")}</Link>
                    </div>
                    {allProducts.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">{t("home.allProducts.empty", undefined, "No products found")}</div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {allProducts.map((product) => (
                                <Link key={product.id} href={`/product/${product.slug}`} className="group card-flat overflow-hidden hover:shadow-md transition-all">
                                    <div className="aspect-square bg-gray-50 overflow-hidden">
                                        {product.images?.[0] ? (
                                            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-gray-300 text-sm">{t("home.featuredProducts.noImage")}</div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">{product.name}</h3>
                                        <p className="mt-1 text-base font-bold text-green-800">৳{Number(product.price).toLocaleString(locale === "bn" ? "bn-BD" : "en-IN")}</p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <p className={`text-xs ${product.stock > 0 ? 'text-gray-400' : 'text-red-500'}`}>
                                                {product.stock > 0 ? `${t("home.featuredProducts.stockLabel")} ${product.stock}` : t("home.featuredProducts.stockOut")}
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
                                                        className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600"
                                                    >
                                                        <option value="">{t("shop.product.selectSize", undefined, "Select size")}</option>
                                                        {product.sizes.map((s: string) => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))}
                                                    </select>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        if (product.sizes?.length > 0) {
                                                            handleAddToCartWithSize(product, e, sizePopups[product.id] || undefined);
                                                        } else {
                                                            handleAddToCart(product, e);
                                                        }
                                                    }}
                                                    className="w-full rounded-lg bg-red-800 py-2 text-sm font-bold text-white hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
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
                                </Link>
                            ))}
                        </div>
                    )}
                    {allProducts.length > 0 && hasMore && (
                        <div className="flex justify-center mt-8">
                            <button onClick={handleLoadMore} disabled={loadingMore} className="btn-secondary py-2.5 px-8 text-sm font-semibold flex items-center gap-2">
                                {loadingMore ? <Loader2 className="animate-spin" size={16} /> : null}
                                {loadingMore ? (t("home.allProducts.loading", undefined, "Loading...")) : (t("home.allProducts.loadMore", undefined, "Load More"))}
                            </button>
                        </div>
                    )}
                </div>
            </section>


        </div>
    );
}
