"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, TrendingUp, Users, Gift } from "lucide-react";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { productsApi } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/lib/i18n";

export default function HomePage() {
    const { t } = useLocale();

    const { data: productsData } = useQuery({
        queryKey: ["products", "featured"],
        queryFn: () => productsApi.list({ limit: 8 }),
    });

    const { data: categoriesData } = useQuery({
        queryKey: ["categories"],
        queryFn: () => categoriesApi.list(),
    });

    const products = productsData?.products ?? [];
    const categories = categoriesData?.categories ?? [];

    return (
        <div>
            <BannerCarousel />

            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-700 text-white">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2760%27%20height=%2760%27%20viewBox=%270%200%2060%2060%27%20xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg%20fill=%27none%27%20fill-rule=%27evenodd%27%3E%3Cg%20fill=%27%23ffffff%27%2520fill-opacity=%270.03%27%3E%3Cpath%20d=%27M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />
                <div className="page-container relative py-20 lg:py-28">
                    <div className="max-w-2xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-sm">
                            <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                            {t("home.badge")}
                        </div>
                        <h1 className="mb-6 text-4xl font-bold leading-tight lg:text-5xl xl:text-6xl">
                            {t("home.hero.title.line1")}<br />
                            <span className="text-amber-400">{t("home.hero.title.line2")}</span>
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
            {categories.length > 0 && (
                <section className="py-12 bg-gray-50">
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
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* How it works */}
            <section className="py-16 bg-white">
                <div className="page-container">
                    <div className="text-center mb-10">
                        <h2 className="section-title text-2xl lg:text-3xl">{t("home.howItWorks.heading")}</h2>
                        <p className="mt-2 text-gray-500">{t("home.howItWorks.subheading")}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        {[
                            { icon: ShieldCheck, step: t("home.howItWorks.step1.label"), title: t("home.howItWorks.step1.title"), desc: t("home.howItWorks.step1.desc"), color: "green" },
                            { icon: Gift, step: t("home.howItWorks.step2.label"), title: t("home.howItWorks.step2.title"), desc: t("home.howItWorks.step2.desc"), color: "amber" },
                            { icon: TrendingUp, step: t("home.howItWorks.step3.label"), title: t("home.howItWorks.step3.title"), desc: t("home.howItWorks.step3.desc"), color: "blue" },
                        ].map((item) => (
                            <div key={item.step} className="card-flat p-6 text-center hover:shadow-md transition-shadow">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                                    <item.icon size={24} className="text-green-700" />
                                </div>
                                <div className="mb-2 text-3xl font-bold text-green-800">{item.step}</div>
                                <h3 className="mb-2 text-base font-semibold text-gray-800">{item.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Earnings Banner */}
            <section className="py-14 bg-gradient-to-r from-amber-50 to-orange-50 border-y border-amber-100">
                <div className="page-container">
                    <div className="flex flex-col lg:flex-row items-center gap-8">
                        <div className="flex-1 text-center lg:text-left">
                            <h2 className="text-2xl font-bold text-gray-900 mb-3">{t("home.earningsBanner.heading")}</h2>
                            <p className="text-gray-600 mb-6">{t("home.earningsBanner.subtext")}</p>
                            <Link href="/register" className="btn-primary inline-flex">{t("home.earningsBanner.cta")} <ArrowRight size={16} className="ml-1" /></Link>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {[
                                { count: "৫+", amount: "৳১০০" },
                                { count: "২০+", amount: "৳২০০" },
                                { count: "৫০+", amount: "৳৩০০" },
                                { count: "১০০+", amount: "৳৫০০" },
                                { count: "৫০০+", amount: "৳১,০০০" },
                                { count: "৫,০০০+", amount: "৳২,০০০" },
                                { count: "১০,০০০+", amount: "৳৫,০০০" },
                            ].slice(0, 4).map((tier) => (
                                <div key={tier.count} className="rounded-xl bg-white p-4 text-center shadow-sm border border-amber-100">
                                    <Users size={18} className="mx-auto mb-1 text-amber-600" />
                                    <div className="text-xs text-gray-500 mb-1">{tier.count} {t("home.earningsBanner.tier.member")}</div>
                                    <div className="text-lg font-bold text-amber-700">{tier.amount}</div>
                                    <div className="text-xs text-gray-400">{t("home.earningsBanner.tier.perDay")}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
