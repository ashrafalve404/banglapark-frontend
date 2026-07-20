"use client";

import Link from "next/link";
import { ArrowRight, ShoppingCart, Loader2, Grid, Shirt, Smartphone, Package, Home, Book, Gem, Watch, Laptop, CheckCircle, X } from "lucide-react";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { productsApi } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { bannersApi } from "@/lib/api/banners";
import { useCartStore } from "@/store/cart";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/lib/i18n";
import { useState, useEffect, useRef, useCallback } from "react";

const CATEGORY_ICONS = [Grid, Package, Shirt, Smartphone, Laptop, Home, Book, Watch, Gem];
const CATEGORY_COLORS = [
    { bg: "bg-emerald-50", icon: "text-emerald-600", hover: "hover:border-emerald-300 hover:shadow-emerald-100" },
    { bg: "bg-blue-50", icon: "text-blue-600", hover: "hover:border-blue-300 hover:shadow-blue-100" },
    { bg: "bg-violet-50", icon: "text-violet-600", hover: "hover:border-violet-300 hover:shadow-violet-100" },
    { bg: "bg-rose-50", icon: "text-rose-600", hover: "hover:border-rose-300 hover:shadow-rose-100" },
    { bg: "bg-amber-50", icon: "text-amber-600", hover: "hover:border-amber-300 hover:shadow-amber-100" },
    { bg: "bg-cyan-50", icon: "text-cyan-600", hover: "hover:border-cyan-300 hover:shadow-cyan-100" },
    { bg: "bg-orange-50", icon: "text-orange-600", hover: "hover:border-orange-300 hover:shadow-orange-100" },
    { bg: "bg-pink-50", icon: "text-pink-600", hover: "hover:border-pink-300 hover:shadow-pink-100" },
    { bg: "bg-teal-50", icon: "text-teal-600", hover: "hover:border-teal-300 hover:shadow-teal-100" },
];

function useScrollReveal() {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { el.classList.add("visible"); observer.unobserve(el); } },
            { threshold: 0.1 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return ref;
}

function RevealSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    const ref = useScrollReveal();
    return <div ref={ref} className={`reveal ${className}`}>{children}</div>;
}

function SkeletonGrid() {
    return (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="skeleton-card animate-pulse overflow-hidden">
                    <div className="skeleton-img" />
                    <div className="p-3 space-y-2">
                        <div className="skeleton-line" />
                        <div className="skeleton-line-short" />
                        <div className="skeleton-btn mt-2" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function CartToast({ message, visible, onClose }: { message: string; visible: boolean; onClose: () => void }) {
    useEffect(() => {
        if (!visible) return;
        const t = setTimeout(onClose, 3000);
        return () => clearTimeout(t);
    }, [visible, onClose]);
    if (!visible) return null;
    return (
        <div className="fixed top-4 right-4 z-50 toast-enter">
            <div className="flex items-center gap-3 bg-white rounded-sm shadow-xl border border-green-100 px-4 py-3 min-w-[280px]">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={16} className="text-green-700" />
                </div>
                <p className="text-sm font-medium text-gray-800 flex-1">{message}</p>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}

export default function HomePage() {
    const { t, locale } = useLocale();
    const addItem = useCartStore((s) => s.addItem);
    const [addedId, setAddedId] = useState<string | null>(null);
    const [toastMsg, setToastMsg] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [productPage, setProductPage] = useState(1);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const triggerToast = useCallback((msg: string) => {
        setToastMsg(msg);
        setShowToast(true);
    }, []);

    const handleAddToCart = (product: any, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product);
        setAddedId(product.id);
        setTimeout(() => setAddedId(null), 1500);
        triggerToast(`"${product.name}" added to cart`);
    };

    const { data: firstPageData, isError: firstPageError, isLoading: productsLoading } = useQuery({
        queryKey: ["products", "all", "popular", 1],
        queryFn: () => productsApi.list({ page: 1, limit: 50, sort: "popular" }),
    });

    useEffect(() => {
        if (firstPageError) setHasMore(false);
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
            <CartToast
                message={toastMsg}
                visible={showToast}
                onClose={() => setShowToast(false)}
            />

            <BannerCarousel />

            <AnnouncementBar />

            {/* Hero */}
            <section className="relative overflow-hidden bg-gradient-to-br from-green-900 via-green-800 to-green-700 text-white w-full">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2760%27%20height=%2760%27%20viewBox=%270%200%2060%2060%27%20xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg%20fill=%27none%27%20fill-rule=%27evenodd%27%3E%3Cg%20fill=%27%23ffffff%27%2520fill-opacity=%270.03%27%3E%3Cpath%20d=%27M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50" />

                <div className="absolute -top-32 -right-20 h-[28rem] w-[28rem] opacity-25 blur-3xl" style={{ borderRadius: "42% 58% 35% 65% / 55% 40% 60% 45%", background: "linear-gradient(135deg, #166534, #14532d)" }} />
                <div className="absolute -bottom-40 -left-28 h-[35rem] w-[35rem] opacity-20 blur-3xl" style={{ borderRadius: "55% 45% 65% 35% / 40% 60% 40% 60%", background: "linear-gradient(225deg, #052e16, #14532d)" }} />
                <div className="absolute top-1/4 right-1/4 h-72 w-72 opacity-15 blur-2xl" style={{ borderRadius: "60% 40% 50% 50% / 40% 55% 45% 60%", background: "linear-gradient(180deg, #15803d, #166534)" }} />
                <div className="absolute bottom-1/3 left-1/5 h-56 w-56 opacity-15 blur-2xl rotate-12" style={{ borderRadius: "38% 62% 45% 55% / 50% 40% 60% 50%", background: "linear-gradient(300deg, #052e16, #166534)" }} />

                <svg className="absolute top-0 right-0 h-full w-64 text-green-950/20" viewBox="0 0 100 100" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 0C60 20 40 60 60 100H100V0Z" fill="currentColor" />
                </svg>
                <svg className="absolute bottom-0 left-0 h-32 w-full text-green-950/15" viewBox="0 0 1440 100" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 100C360 20 720 80 1440 30V100H0Z" fill="currentColor" />
                </svg>

                <div className="w-full px-2 sm:px-4 lg:px-6 relative py-16 lg:py-20">
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
                            <Link href="/shop" className="inline-flex items-center gap-2 rounded-sm bg-white px-6 py-3 text-sm font-semibold text-green-900 hover:bg-green-50 transition-all shadow-lg hover:shadow-xl">
                                {t("home.hero.cta.shop")} <ArrowRight size={16} />
                            </Link>
                            <Link href="/register" className="inline-flex items-center gap-2 rounded-sm border-2 border-white/40 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all backdrop-blur-sm">
                                {t("home.hero.cta.register")}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Offer Section */}
            {offers.length > 0 && (
                <section className="py-6 sm:py-8 bg-white">
                    <div className="w-full px-2 sm:px-4 lg:px-6">
                        <RevealSection>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {offers.map((offer) => (
                                    <Link key={offer.id} href={offer.linkUrl || "/shop"} className="group relative rounded-xl overflow-hidden aspect-[16/9] bg-gray-100 block shadow-sm hover:shadow-xl transition-all duration-300">
                                        <img src={offer.imageUrl} alt={offer.title || "Offer"} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                                        {(offer.badge || offer.title) && (
                                            <div className="absolute bottom-4 left-4 right-4">
                                                {offer.badge && (
                                                    <span className="inline-block rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider mb-2 shadow-lg">{offer.badge}</span>
                                                )}
                                                {offer.title && (
                                                    <h3 className="text-base sm:text-lg font-bold text-white drop-shadow-lg">{offer.title}</h3>
                                                )}
                                            </div>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </RevealSection>
                    </div>
                </section>
            )}

            {/* Categories */}
            {categories.length > 0 && (
                <section className="py-8 sm:py-12 bg-gray-50/80">
                    <div className="w-full px-2 sm:px-4 lg:px-6">
                        <RevealSection>
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="section-title">{t("home.categories.heading")}</h2>
                                    <p className="section-subtitle mt-1">
                                        {locale === "en" ? "Browse by category to find what you need" : "প্রয়োজনীয় জিনিস খুঁজতে ক্যাটাগরি অনুযায়ী ব্রাউজ করুন"}
                                    </p>
                                </div>
                                <Link href="/shop" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-800 transition-colors">
                                    {t("home.categories.viewAll")} <ArrowRight size={14} />
                                </Link>
                            </div>
                        </RevealSection>
                        <RevealSection>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                                {categories.map((cat, i) => {
                                    const Icon = CATEGORY_ICONS[i % CATEGORY_ICONS.length];
                                    const colors = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                                    return (
                                        <Link
                                            key={cat.id}
                                            href={`/shop?categoryId=${cat.id}`}
                                            className={`group flex flex-col items-center gap-3 rounded-xl border border-gray-100 ${colors.bg} p-5 sm:p-6 shadow-sm ${colors.hover} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
                                        >
                                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white shadow-sm flex items-center justify-center ${colors.icon} group-hover:scale-110 transition-transform duration-200`}>
                                                <Icon size={20} className="sm:w-[22px] sm:h-[22px]" />
                                            </div>
                                            <span className="text-xs sm:text-sm font-semibold text-gray-700 text-center leading-tight">{cat.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </RevealSection>
                        <div className="flex sm:hidden justify-center mt-5">
                            <Link href="/shop" className="inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-800 transition-colors">
                                {t("home.categories.viewAll")} <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* All Products */}
            <section className="py-8 sm:py-12 bg-white">
                <div className="w-full px-2 sm:px-4 lg:px-6">
                    <RevealSection>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="section-title">{t("home.allProducts.heading", undefined, "All Products")}</h2>
                            <Link href="/shop" className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-800 transition-colors">
                                {t("home.allProducts.viewAll", undefined, "View All")}
                            </Link>
                        </div>
                    </RevealSection>

                    {productsLoading ? (
                        <SkeletonGrid />
                    ) : allProducts.length === 0 ? (
                        <div className="text-center py-20">
                            <Package size={40} className="mx-auto text-gray-200 mb-3" />
                            <p className="text-gray-400 text-sm">{t("home.allProducts.empty", undefined, "No products found")}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-5 sm:grid-cols-3 lg:grid-cols-4">
                            {allProducts.map((product, idx) => (
                                <Link
                                    key={product.id}
                                    href={`/product/${product.slug}`}
                                    className="group card-flat overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                                >
                                    <div className="aspect-square bg-gray-50 overflow-hidden relative">
                                        {product.images?.[0] ? (
                                            <img
                                                src={product.images[0]}
                                                alt={product.name}
                                                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-gray-300">
                                                <Package size={32} />
                                            </div>
                                        )}
                                        {product.stock <= 3 && product.stock > 0 && (
                                            <span className="absolute top-2 left-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                                                Only {product.stock} left
                                            </span>
                                        )}
                                        {product.stock === 0 && (
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-800 shadow-lg">
                                                    Out of Stock
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 sm:p-4">
                                        <h3 className="text-xs sm:text-sm font-semibold text-gray-800 line-clamp-2 leading-snug min-h-[2.2em]">{product.name}</h3>
                                        <p className="mt-1.5 text-base sm:text-lg font-bold text-green-800 tracking-tight">
                                            ৳{Number(product.price).toLocaleString(locale === "bn" ? "bn-BD" : "en-IN")}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <p className={`text-[11px] ${product.stock > 0 ? 'text-gray-400' : 'text-red-500'}`}>
                                                {product.stock > 0 ? `${t("home.featuredProducts.stockLabel")} ${product.stock}` : t("home.featuredProducts.stockOut")}
                                            </p>
                                            {product.clicks > 0 && (
                                                <span className="text-[10px] text-gray-300">• {product.clicks} views</span>
                                            )}
                                        </div>
                                        {product.stock > 0 && (
                                            <div className="mt-2.5">
                                                <button
                                                    onClick={(e) => handleAddToCart(product, e)}
                                                    className="w-full rounded-sm bg-gradient-to-r from-red-700 to-red-600 py-2 text-xs sm:text-sm font-bold text-white hover:from-red-600 hover:to-red-500 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                                                >
                                                    {addedId === product.id ? (
                                                        <span className="flex items-center gap-1"><CheckCircle size={13} /> Added!</span>
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
                        <RevealSection>
                            <div className="flex justify-center mt-10">
                                <button onClick={handleLoadMore} disabled={loadingMore} className="btn-secondary py-3 px-10 text-sm font-semibold flex items-center gap-2 rounded-xl shadow-sm hover:shadow-md transition-all">
                                    {loadingMore ? <Loader2 className="animate-spin" size={16} /> : null}
                                    {loadingMore ? (t("home.allProducts.loading", undefined, "Loading...")) : (t("home.allProducts.loadMore", undefined, "Load More"))}
                                </button>
                            </div>
                        </RevealSection>
                    )}
                </div>
            </section>

            {/* Success Stories */}
            <section className="relative overflow-hidden bg-[#f7f7f7] py-16 lg:py-24">
                <div className="w-full px-2 sm:px-4 lg:px-6 relative z-10">
                    <RevealSection>
                        <div className="text-center mb-12 lg:mb-16">
                            <h2 className="section-title">{locale === "en" ? "Our Success Stories" : "আমাদের সাফল্যের গল্প"}</h2>
                            <p className="section-subtitle mx-auto mt-3">
                                {locale === "en"
                                    ? "Real people, real results — hear from those who grew with Bangla Park."
                                    : "বাস্তব মানুষ, বাস্তব ফলাফল — যারা ব্যাংলা পার্কের সাথে বেড়ে উঠেছেন তাদের কাছ থেকে শুনুন।"}
                            </p>
                        </div>
                    </RevealSection>
                    <RevealSection>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                            {[
                                {
                                    name: locale === "en" ? "Md. Rahman" : "মোঃ রহমান",
                                    role: locale === "en" ? "Team Leader, Dhaka" : "টিম লিডার, ঢাকা",
                                    quote: locale === "en"
                                        ? "Joining Bangla Park changed my life. Within 6 months I built a strong team and now earn a steady monthly income."
                                        : "ব্যাংলা পার্কে যোগ দেওয়া আমার জীবন বদলে দিয়েছে। ৬ মাসের মধ্যে আমি একটি শক্তিশালী টিম গড়েছি এবং এখন স্থির মাসিক আয় করছি।",
                                },
                                {
                                    name: locale === "en" ? "Fatima Begum" : "ফাতিমা বেগম",
                                    role: locale === "en" ? "Affiliate, Chattogram" : "অ্যাফিলিয়েট, চট্টগ্রাম",
                                    quote: locale === "en"
                                        ? "The daily benefits and commission system is amazing. I've never seen such a supportive community."
                                        : "দৈনিক বেনিফিট এবং কমিশন সিস্টেম অসাধারণ। আমি এত সমর্থনশীল কমিউনিটি কখনো দেখিনি।",
                                },
                                {
                                    name: locale === "en" ? "Shahidul Islam" : "শহিদুল ইসলাম",
                                    role: locale === "en" ? "Senior Affiliate, Sylhet" : "সিনিয়র অ্যাফিলিয়েট, সিলেট",
                                    quote: locale === "en"
                                        ? "From a small start to a full-time income — Bangla Park made it possible with their easy system."
                                        : "ছোট শুরু থেকে পূর্ণকালীন আয় — ব্যাংলা পার্ক তাদের সহজ সিস্টেমের মাধ্যমে এটি সম্ভব করেছে।",
                                },
                            ].map((story, i) => (
                                <div key={i} className="group relative bg-white rounded-xl p-6 sm:p-7 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                    <div className="absolute -top-2 -right-2 w-9 h-9 bg-gradient-to-br from-red-700 to-red-500 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-lg">
                                        0{i + 1}
                                    </div>
                                    <svg className="w-8 h-8 text-red-700/20 mb-4" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                                    </svg>
                                    <p className="text-sm text-gray-600 leading-relaxed mb-5 italic">"{story.quote}"</p>
                                    <div className="border-t border-gray-100 pt-4 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
                                            {story.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{story.name}</p>
                                            <p className="text-xs text-green-700">{story.role}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </RevealSection>
                </div>
            </section>
        </div>
    );
}
