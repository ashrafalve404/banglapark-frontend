"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, TrendingUp, Gift, ShoppingCart, ShoppingBag, Award } from "lucide-react";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { productsApi } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { useCartStore } from "@/store/cart";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/lib/i18n";
import { useState } from "react";

export default function HomePage() {
    const { t } = useLocale();
    const addItem = useCartStore((s) => s.addItem);
    const [addedId, setAddedId] = useState<string | null>(null);
    const [sizePopups, setSizePopups] = useState<Record<string, string>>({});

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

    const { data: productsData } = useQuery({
        queryKey: ["products", "featured"],
        queryFn: () => productsApi.list({ limit: 8 }),
    });

    const { data: bestSellerData } = useQuery({
        queryKey: ["products", "best-seller"],
        queryFn: () => productsApi.list({ sort: "price_desc", limit: 8 }),
    });

    const { data: categoriesData } = useQuery({
        queryKey: ["categories"],
        queryFn: () => categoriesApi.list(),
    });

    const products = productsData?.products ?? [];
    const bestSellers = bestSellerData?.products ?? [];
    const categories = categoriesData?.categories ?? [];

    return (
        <div>
            <BannerCarousel />

            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-700 text-white">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2760%27%20height=%2760%27%20viewBox=%270%200%2060%2060%27%20xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg%20fill=%27none%27%20fill-rule=%27evenodd%27%3E%3Cg%20fill=%27%23ffffff%27%2520fill-opacity=%270.03%27%3E%3Cpath%20d=%27M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />

                {/* Decorative curved shapes */}
                <div className="absolute -top-32 -right-20 h-[28rem] w-[28rem] opacity-25 blur-3xl" style={{ borderRadius: "42% 58% 35% 65% / 55% 40% 60% 45%", background: "linear-gradient(135deg, #166534, #14532d)" }} />
                <div className="absolute -bottom-40 -left-28 h-[35rem] w-[35rem] opacity-20 blur-3xl" style={{ borderRadius: "55% 45% 65% 35% / 40% 60% 40% 60%", background: "linear-gradient(225deg, #052e16, #14532d)" }} />
                <div className="absolute top-1/4 right-1/4 h-72 w-72 opacity-15 blur-2xl" style={{ borderRadius: "60% 40% 50% 50% / 40% 55% 45% 60%", background: "linear-gradient(180deg, #047857, #065f46)" }} />
                <div className="absolute bottom-1/3 left-1/5 h-56 w-56 opacity-15 blur-2xl rotate-12" style={{ borderRadius: "38% 62% 45% 55% / 50% 40% 60% 50%", background: "linear-gradient(300deg, #052e16, #166534)" }} />

                {/* Curved accent lines */}
                <svg className="absolute top-0 right-0 h-full w-64 text-green-950/20" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 0C60 20 40 60 60 100H100V0Z" fill="currentColor" />
                </svg>
                <svg className="absolute bottom-0 left-0 h-32 w-full text-green-950/15" viewBox="0 0 1440 100" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 100C360 20 720 80 1440 30V100H0Z" fill="currentColor" />
                </svg>

                <div className="page-container relative py-20 lg:py-28">
                    <div className="max-w-2xl">
                        <h1 className="mb-6 text-4xl font-bold leading-tight lg:text-5xl xl:text-6xl">
                            {t("home.hero.title.line1")}<br />
                            <span className="text-white">{t("home.hero.title.line2")}</span>
                        </h1>
                        <p className="mb-8 text-lg text-green-100 leading-relaxed">
                            {t("home.hero.subtitle")}
                        </p>
                        <div className="flex flex-wrap gap-3">
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

            {/* Categories */}
            <section className="py-12 bg-gray-50">
                <div className="page-container">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="section-title text-xl">{t("home.categories.heading")}</h2>
                        <Link href="/shop" className="text-sm font-medium text-green-800 hover:underline">{t("home.categories.viewAll")}</Link>
                    </div>
                    {categories.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 text-sm">{t("home.categories.empty", undefined, "No categories found")}</div>
                    ) : (
                        <div className="flex flex-wrap gap-3">
                            {categories.map((cat) => (
                                <Link key={cat.id} href={`/shop?categoryId=${cat.id}`}
                                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:border-green-600 hover:text-green-800 hover:shadow-md transition-all">
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Featured Products */}
            <section className="py-14 bg-white">
                <div className="page-container">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="section-title text-xl lg:text-2xl">{t("home.featuredProducts.heading")}</h2>
                        <Link href="/shop" className="text-sm font-medium text-green-800 hover:underline">{t("home.featuredProducts.viewAll")}</Link>
                    </div>
                    {products.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">{t("home.featuredProducts.empty")}</div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {products.map((product) => (
                                <Link key={product.id} href={`/product/${product.slug}`} className="group card-flat overflow-hidden hover:shadow-md transition-all">
                                    <div className="aspect-square bg-gray-50 overflow-hidden">
                                        {product.images?.[0] ? (
                                            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-gray-300 text-sm">{t("home.featuredProducts.noImage")}</div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        {Number(product.price) >= 2000 && (
                                            <span className="mb-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">{t("home.featuredProducts.activationBadge")}</span>
                                        )}
                                        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">{product.name}</h3>
                                        <p className="mt-1 text-base font-bold text-green-800">৳{Number(product.price).toLocaleString()}</p>
                                        <p className={`text-xs mt-0.5 ${product.stock > 0 ? 'text-gray-400' : 'text-red-500'}`}>
                                            {product.stock > 0 ? `${t("home.featuredProducts.stockLabel")} ${product.stock}` : t("home.featuredProducts.stockOut")}
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
                                                    onClick={(e) => {
                                                        if (product.sizes?.length > 0) {
                                                            handleAddToCartWithSize(product, e, sizePopups[product.id] || undefined);
                                                        } else {
                                                            handleAddToCart(product, e);
                                                        }
                                                    }}
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
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Popular Categories */}
            <section className="py-14 bg-white">
                <div className="page-container">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="section-title text-xl lg:text-2xl">{t("home.popularCategories.heading", undefined, "Popular Categories")}</h2>
                        <Link href="/shop" className="text-sm font-medium text-green-800 hover:underline">{t("home.popularCategories.viewAll", undefined, "View All →")}</Link>
                    </div>
                    {categories.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">{t("home.popularCategories.empty", undefined, "No categories found")}</div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                            {categories.slice(0, 6).map((cat) => (
                                <Link key={cat.id} href={`/shop?categoryId=${cat.id}`} className="group card-flat p-6 text-center hover:shadow-md hover:border-green-200 transition-all">
                                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-green-50 group-hover:bg-green-100 transition-colors">
                                        <ShoppingBag size={24} className="text-green-700" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">{cat.name}</h3>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Best Sellers */}
            <section className="py-14 bg-gray-50">
                <div className="page-container">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="section-title text-xl lg:text-2xl">{t("home.bestSellers.heading")}</h2>
                        <Link href="/shop?sort=price_desc" className="text-sm font-medium text-green-800 hover:underline">{t("home.bestSellers.viewAll")}</Link>
                    </div>
                    {bestSellers.length === 0 ? (
                        <div className="text-center py-16 text-gray-400">{t("home.bestSellers.empty", undefined, "No products found")}</div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {bestSellers.map((product) => (
                                <Link key={product.id} href={`/product/${product.slug}`} className="group card-flat overflow-hidden hover:shadow-md transition-all">
                                    <div className="aspect-square bg-gray-50 overflow-hidden relative">
                                        {product.images?.[0] ? (
                                            <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-gray-300 text-sm">{t("home.featuredProducts.noImage")}</div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        {Number(product.price) >= 2000 && (
                                            <span className="mb-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">{t("home.featuredProducts.activationBadge")}</span>
                                        )}
                                        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2">{product.name}</h3>
                                        <p className="mt-1 text-base font-bold text-green-800">৳{Number(product.price).toLocaleString()}</p>
                                        <p className={`text-xs mt-0.5 ${product.stock > 0 ? 'text-gray-400' : 'text-red-500'}`}>
                                            {product.stock > 0 ? `${t("home.featuredProducts.stockLabel")} ${product.stock}` : t("home.featuredProducts.stockOut")}
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
                                                    onClick={(e) => {
                                                        if (product.sizes?.length > 0) {
                                                            handleAddToCartWithSize(product, e, sizePopups[product.id] || undefined);
                                                        } else {
                                                            handleAddToCart(product, e);
                                                        }
                                                    }}
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
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* How it works */}
            <section className="bg-gray-50 py-14 lg:py-16">
                <div className="page-container">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{t("home.howItWorks.heading")}</h2>
                        <p className="text-gray-500 text-sm">{t("home.howItWorks.subheading")}</p>
                    </div>
                    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-center gap-6 sm:gap-0 max-w-4xl mx-auto">
                        {[
                            { icon: ShieldCheck, step: t("home.howItWorks.step1.label"), title: t("home.howItWorks.step1.title"), desc: t("home.howItWorks.step1.desc") },
                            { icon: Gift, step: t("home.howItWorks.step2.label"), title: t("home.howItWorks.step2.title"), desc: t("home.howItWorks.step2.desc") },
                            { icon: TrendingUp, step: t("home.howItWorks.step3.label"), title: t("home.howItWorks.step3.title"), desc: t("home.howItWorks.step3.desc") },
                        ].map((item, i) => (
                            <div key={item.step} className="relative flex-1 sm:px-4">
                                {i < 2 && (
                                    <div className="hidden sm:block absolute top-14 left-[60%] w-[calc(80%)] h-px border-t border-dashed border-gray-300" />
                                )}
                                <div className="group card-flat p-6 text-center hover:shadow-md transition-all">
                                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-700 text-lg font-extrabold">
                                        {item.step}
                                    </div>
                                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-green-50">
                                        <item.icon size={26} className="text-green-700" />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-800 mb-1.5">{item.title}</h3>
                                    <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Daily Benefit */}
            <section className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-700 text-white pb-6 pt-8 lg:pb-10 lg:pt-10">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
                <div className="page-container relative">
                    <div className="text-center mb-4">
                        <h2 className="text-xl lg:text-2xl font-bold text-white mb-1">{t("home.earningsBanner.heading")}</h2>
                        <p className="text-green-200/80 text-sm max-w-xl mx-auto mb-4">{t("home.earningsBanner.subtext")}</p>
                        <Link href="/register" className="inline-flex items-center gap-2 rounded-lg bg-amber-400 hover:bg-amber-300 px-5 py-2 text-xs font-bold text-green-950 shadow-lg hover:shadow-xl transition-all">
                            {t("home.earningsBanner.cta")} <ArrowRight size={18} />
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-4xl mx-auto">
                        {[
                            { count: "৫+", amount: "৳১০০" },
                            { count: "২০+", amount: "৳২০০" },
                            { count: "৫০+", amount: "৳৩০০" },
                            { count: "১০০+", amount: "৳৫০০" },
                            { count: "৫০০+", amount: "৳১,০০০" },
                            { count: "৫,০০০+", amount: "৳২,০০০" },
                            { count: "১০,০০০+", amount: "৳৫,০০০" },
                        ].map((tier) => (
                            <div key={tier.count} className="group rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-3 text-center hover:bg-white/20 hover:border-amber-400/50 transition-all duration-200">
                                <Award size={16} className="mx-auto mb-1.5 text-amber-400/80 group-hover:text-amber-300 transition-colors" />
                                <div className="text-amber-300 font-bold text-xs mb-0.5">{tier.count} {t("home.earningsBanner.tier.member")}</div>
                                <div className="text-white font-extrabold text-xl lg:text-2xl tracking-tight mb-0.5">{tier.amount}</div>
                                <div className="text-green-300/50 text-[10px] font-medium uppercase tracking-wider">{t("home.earningsBanner.tier.perDay")}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
