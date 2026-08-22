"use client";

import Link from "next/link";
import Image from "next/image";
import {
    ArrowRight, ShoppingCart, Loader2, LayoutGrid, CheckCircle, X, Users, Sparkles, TrendingUp,
    ShieldCheck, Package, Gift
} from "lucide-react";
import { BannerCarousel } from "@/components/home/BannerCarousel";
import { SuccessStoriesSlider } from "@/components/home/SuccessStoriesSlider";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";

import { productsApi } from "@/lib/api/products";
import { categoriesApi } from "@/lib/api/categories";
import { bannersApi } from "@/lib/api/banners";
import { publicApi } from "@/lib/api/admin";
import { giftCardsApi, type GiftCardPublic } from "@/lib/api/gift-cards";
import { useCartStore } from "@/store/cart";
import { useQuery } from "@tanstack/react-query";
import { useLocale } from "@/lib/i18n";
import { useState, useEffect, useRef, useCallback } from "react";
import { formatCurrency } from "@/lib/utils";

function getCategoryIcon(_name?: string, _slug?: string) {
    return LayoutGrid;
}

const CATEGORY_GRADIENTS = [
    "from-red-600 to-rose-700 shadow-red-600/20",
    "from-slate-800 to-slate-900 shadow-slate-900/20",
    "from-rose-600 to-red-800 shadow-rose-600/20",
    "from-red-700 to-amber-700 shadow-red-700/20",
    "from-slate-700 to-zinc-900 shadow-slate-800/20",
    "from-red-600 to-rose-800 shadow-red-600/20",
    "from-rose-700 to-red-900 shadow-rose-700/20",
    "from-zinc-800 to-slate-900 shadow-zinc-800/20",
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

    const { data: homeGiftCards = [] } = useQuery<GiftCardPublic[]>({
        queryKey: ["home-gift-cards"],
        queryFn: () => giftCardsApi.getPublicCards(),
    });

    const FALLBACK_USER_COUNT = 2010971;
    const { data: publicStats } = useQuery({
        queryKey: ["public-stats"],
        queryFn: () => publicApi.stats(),
        retry: 0,
        staleTime: 300_000,
    });
    const totalDistributors = publicStats?.totalUsers ?? FALLBACK_USER_COUNT;

    const { data: newMembers = [] } = useQuery({
        queryKey: ["public-new-members"],
        queryFn: () => publicApi.newMembers(),
        retry: 0,
        staleTime: 120_000,
    });

    const { data: topLeaders = [] } = useQuery({
        queryKey: ["public-top-leaders"],
        queryFn: () => publicApi.topLeaders(),
        retry: 0,
        staleTime: 120_000,
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
            <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-100/80 text-slate-900 w-full border-b border-slate-200/70">
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

                <div className="w-full px-2 sm:px-4 lg:px-6 relative py-16 lg:py-20">
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="mb-4 text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
                            {locale === "en" ? (
                                <>
                                    <span className="md:whitespace-nowrap">
                                        Buy products from the
                                        <br className="block md:hidden" /> Affiliate Marketplace,
                                    </span>
                                    <br />
                                    <span className="md:whitespace-nowrap text-red-700">Start Earning</span>
                                </>
                            ) : (
                                <>
                                    <span className="md:whitespace-nowrap">
                                        অ্যাফিলিয়েট মার্কেটপ্লেস থেকে
                                        <br className="block md:hidden" /> পণ্য কিনুন,
                                    </span>
                                    <br />
                                    <span className="md:whitespace-nowrap text-red-700">আয় শুরু করুন</span>
                                </>
                            )}
                        </h1>
                        <p className="mb-6 text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto font-medium">
                            {t("home.hero.subtitle")}
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            <Link href="/shop" className="inline-flex items-center gap-2 rounded-md bg-red-700 px-6 py-3 text-sm font-bold text-white hover:bg-red-800 transition-all shadow-md hover:shadow-lg">
                                {t("home.hero.cta.shop")} <ArrowRight size={16} />
                            </Link>
                            <Link href="/register" className="inline-flex items-center gap-2 rounded-md border-2 border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-all">
                                {t("home.hero.cta.register")}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Offer Section */}
            {offers.length > 0 && (
                <section className="py-6 sm:py-8 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <RevealSection>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {offers.map((offer) => (
                                    <Link key={offer.id} href={offer.linkUrl || "/shop"} className="group relative rounded-xl overflow-hidden aspect-[16/9] bg-gray-100 block transition-all duration-300">
                                        <img src={offer.imageUrl} alt={offer.title || "Offer"} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        {(offer.badge || offer.title) && (
                                            <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
                                                {offer.badge && (
                                                    <span className="inline-block rounded-full bg-amber-500/90 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider mb-1">{offer.badge}</span>
                                                )}
                                                {offer.title && (
                                                    <h3 className="text-sm sm:text-base font-bold text-white drop-shadow-md">{offer.title}</h3>
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


            {/* Gift Cards Section */}
            {homeGiftCards.length > 0 && (
                <section className="py-8 sm:py-12 bg-gradient-to-b from-rose-50/50 via-purple-50/30 to-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <RevealSection>
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="section-title text-slate-900">{t("giftCard.title")}</h2>
                                        <span className="bg-rose-100 text-rose-700 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-rose-200 uppercase tracking-wider">
                                            {locale === "bn" ? "অফার" : "Offers"}
                                        </span>
                                    </div>
                                    <p className="section-subtitle mt-1">
                                        {locale === "en" ? "Purchase gift cards with Wallet or bKash." : "ওয়ালেট বা বিকাশ দিয়ে সহজে গিফট কার্ড কিনুন।"}
                                    </p>
                                </div>
                                <Link href="/dashboard/gift-cards" className="hidden sm:inline-flex items-center gap-1 text-sm font-bold text-rose-700 hover:text-rose-800 transition-colors">
                                    {t("giftCard.storeTab")} <ArrowRight size={14} />
                                </Link>
                            </div>
                        </RevealSection>

                        <RevealSection>
                            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                                {homeGiftCards.slice(0, 4).map((card) => {
                                    return (
                                        <div
                                            key={card.id}
                                            className="group relative rounded-lg bg-white border border-rose-100 p-2.5 sm:p-4 shadow-xs hover:shadow-xl hover:border-rose-300 transition-all duration-300 flex flex-col justify-between"
                                        >
                                            <div className="space-y-2 sm:space-y-3">
                                                <div className="relative w-full aspect-[3/2] bg-slate-900 rounded-md overflow-hidden flex items-center justify-center">
                                                    {card.image ? (
                                                        <img src={card.image} alt={card.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                                    ) : (
                                                        <div className="text-center text-white space-y-1">
                                                            <Gift size={28} className="mx-auto text-rose-300 group-hover:scale-110 transition-transform duration-300" />
                                                            <p className="text-[9px] font-black text-rose-200 tracking-widest uppercase">GIFT CARD</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div>
                                                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-1 group-hover:text-rose-700 transition-colors">
                                                        {card.title}
                                                    </h3>
                                                    {card.description && (
                                                        <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 line-clamp-2 leading-tight sm:leading-relaxed">
                                                            {card.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="pt-2 sm:pt-3 mt-2 sm:mt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
                                                <span className="text-sm sm:text-base font-black text-rose-700">
                                                    {formatCurrency(card.price, locale)}
                                                </span>
                                                <Link
                                                    href="/dashboard/gift-cards"
                                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md shadow-xs transition-colors"
                                                >
                                                    {t("giftCard.buyCard")}
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </RevealSection>
                    </div>
                </section>
            )}

            {/* All Products */}
            <section className="py-8 sm:py-12 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                                        <p className="mt-1.5 text-base sm:text-lg font-bold text-emerald-600 tracking-tight">
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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
                        {(() => {
                            const defaultFallbackStories = [
                                {
                                    name: locale === "en" ? "Md. Rahman" : "মোঃ রহমান",
                                    role: locale === "en" ? "Affiliate, Dhaka" : "অ্যাফিলিয়েট, ঢাকা",
                                },
                                {
                                    name: locale === "en" ? "Fatima Begum" : "ফাতিমা বেগম",
                                    role: locale === "en" ? "Affiliate, Dhaka" : "অ্যাফিলিয়েট, ঢাকা",
                                },
                                {
                                    name: locale === "en" ? "Shahidul Islam" : "শহিদুল ইসলাম",
                                    role: locale === "en" ? "Affiliate, Dhaka" : "অ্যাফিলিয়েট, ঢাকা",
                                },
                                {
                                    name: locale === "en" ? "Tanvir Ahmed" : "তানভীর আহমেদ",
                                    role: locale === "en" ? "Affiliate, Dhaka" : "অ্যাফিলিয়েট, ঢাকা",
                                },
                                {
                                    name: locale === "en" ? "Nusrat Jahan" : "নুসরত জাহান",
                                    role: locale === "en" ? "Affiliate, Dhaka" : "অ্যাফিলিয়েট, ঢাকা",
                                },
                                {
                                    name: locale === "en" ? "Ariful Islam" : "আরিফুল ইসলাম",
                                    role: locale === "en" ? "Affiliate, Dhaka" : "অ্যাফিলিয়েট, ঢাকা",
                                },
                                {
                                    name: locale === "en" ? "Sharmin Akter" : "শারমিন আক্তার",
                                    role: locale === "en" ? "Affiliate, Dhaka" : "অ্যাফিলিয়েট, ঢাকা",
                                },
                                {
                                    name: locale === "en" ? "Kawsar Hossain" : "কাওসার হোসেন",
                                    role: locale === "en" ? "Affiliate, Dhaka" : "অ্যাফিলিয়েট, ঢাকা",
                                },
                                {
                                    name: locale === "en" ? "Farhana Yasmin" : "ফারহানা ইয়াসমিন",
                                    role: locale === "en" ? "Affiliate, Dhaka" : "অ্যাফিলিয়েট, ঢাকা",
                                },
                                {
                                    name: locale === "en" ? "Mahmudul Hasan" : "মাহমুদুল হাসান",
                                    role: locale === "en" ? "Affiliate, Dhaka" : "অ্যাফিলিয়েট, ঢাকা",
                                },
                            ];

                            const storyQuotes = [
                                locale === "en"
                                    ? "Joining Bangla Park changed my life. Within 6 months I built a strong team and now earn a steady monthly income."
                                    : "ব্যাংলা পার্কে যোগ দেওয়া আমার জীবন বদলে দিয়েছে। ৬ মাসের মধ্যে আমি একটি শক্তিশালী টিম গড়েছি এবং এখন স্থির মাসিক আয় করছি।",
                                locale === "en"
                                    ? "The daily benefits and commission system is amazing. I've never seen such a supportive community."
                                    : "দৈনিক বেনিফিট এবং কমিশন সিস্টেম অসাধারণ। আমি এত সমর্থনশীল কমিউনিটি কখনো দেখিনি।",
                                locale === "en"
                                    ? "From a small start to a full-time income — Bangla Park made it possible with their easy system."
                                    : "ছোট শুরু থেকে পূর্ণকালীন আয় — ব্যাংলা পার্ক তাদের সহজ সিস্টেমের মাধ্যমে এটি সম্ভব করেছে।",
                                locale === "en"
                                    ? "Bangla Park gave me financial freedom and an opportunity to lead a growing team of dedicated members."
                                    : "ব্যাংলা পার্ক আমাকে আর্থিক স্বাধীনতা এবং একটি ক্রমবর্ধমান নিবেদিত টিমের নেতৃত্ব দেওয়ার সুযোগ দিয়েছে।",
                                locale === "en"
                                    ? "Consistent effort and the transparent system helped me achieve top earnings in a short time."
                                    : "ধারাবাহিক প্রচেষ্টা এবং স্বচ্ছ সিস্টেম আমাকে স্বল্প সময়ে সেরা আয় অর্জন করতে সাহায্য করেছে।",
                                locale === "en"
                                    ? "Working with Bangla Park has given me true independence and confidence to achieve my financial goals."
                                    : "বাংলা পার্কের সাথে কাজ করা আমাকে নিজের আর্থিক লক্ষ্য অর্জনের জন্য প্রকৃত স্বাধীনতা এবং আত্মবিশ্বাস দিয়েছে।",
                                locale === "en"
                                    ? "The affiliate program is transparent and reliable. I recommend it to all ambitious individuals looking to grow!"
                                    : "অ্যাফিলিয়েট প্রোগ্রামটি স্বচ্ছ এবং অত্যন্ত নির্ভরযোগ্য। সফল হতে চাওয়া প্রত্যেক মানুষের জন্য এটি সেরা সুযোগ!",
                                locale === "en"
                                    ? "I started part-time alongside my studies, and now Bangla Park supports all my educational and daily expenses."
                                    : "আমি পড়াশোনার পাশাপাশি পার্ট-টাইম শুরু করেছিলাম, আর এখন বাংলা পার্ক আমার সকল খরচ বহন করছে।",
                                locale === "en"
                                    ? "Fast payouts, incredible team guidance, and great growth opportunities make this platform the best."
                                    : "দ্রুত পে-আউট, অসাধারণ টিম গাইডেন্স এবং চমৎকার বৃদ্ধির সুযোগ এই প্ল্যাটফর্মটিকে অনন্য করে তুলেছে।",
                                locale === "en"
                                    ? "Bangla Park empowers ordinary people to achieve extraordinary financial success with dedication."
                                    : "বাংলা পার্ক সাধারণ মানুষকে নিষ্ঠার সাথে অসাধারণ আর্থিক সাফল্য অর্জনে ক্ষমতায়ন করে।",
                            ];

                            const stories = Array.from({ length: 10 }).map((_, i) => {
                                const leader = topLeaders && topLeaders[i];
                                const fallback = defaultFallbackStories[i];
                                const name = leader?.name || fallback.name;
                                const role = fallback.role;
                                const profileImage = leader?.profileImage;

                                return {
                                    name,
                                    role,
                                    quote: storyQuotes[i],
                                    profileImage,
                                };
                            });

                            return <SuccessStoriesSlider stories={stories} />;
                        })()}
                    </RevealSection>
                </div>
            </section>

            {/* Distributors Counter & Impact Section */}
            <section className="relative overflow-hidden bg-white py-16 lg:py-24 border-t border-slate-200/60">
                <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
                    <RevealSection>
                        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-800 tracking-wider uppercase mb-4">
                            {locale === "en" ? "We are now" : "আমরা এখন"}
                        </h2>

                        {/* Number Counter */}
                        <div className="my-2 flex items-center justify-center gap-2">
                            <span className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-red-700 drop-shadow-xs">
                                {totalDistributors.toLocaleString("en-IN")}
                            </span>
                        </div>

                        <p className={`text-base sm:text-xl font-bold text-slate-700 mb-8 flex items-center justify-center gap-2 ${locale === "en" ? "tracking-widest uppercase" : "tracking-normal"}`}>
                            <Users className="w-5 h-5 text-red-700" />
                            <span>{locale === "en" ? "Digital marketing partner" : "ডিজিটাল মার্কেটিং পার্টনার"}</span>
                        </p>

                        {/* New Member List */}
                        {(() => {
                            const FALLBACK_NEW_MEMBERS = [
                                { id: "fb-1", name: "Mahfuza Akter Lovely", initials: "MA", profileImage: null },
                                { id: "fb-2", name: "Farzana Akter", initials: "FA", profileImage: null },
                                { id: "fb-3", name: "Mst jannatul Ferdous", initials: "MJ", profileImage: null },
                                { id: "fb-4", name: "SAZIB", initials: "S", profileImage: null },
                                { id: "fb-5", name: "Mst.Najma Acter", initials: "MA", profileImage: null },
                                { id: "fb-6", name: "Md.mustafa iqbal", initials: "MI", profileImage: null },
                                { id: "fb-7", name: "Sumon chandra", initials: "SC", profileImage: null },
                                { id: "fb-8", name: "Shikh osman", initials: "SO", profileImage: null },
                            ];
                            const memberList = newMembers.length > 0 ? newMembers : FALLBACK_NEW_MEMBERS;

                            return (
                                <div className="mb-10">
                                    <p className={`text-sm font-bold text-slate-500 mb-5 text-center ${locale === "en" ? "tracking-widest uppercase" : "tracking-normal"}`}>
                                        {locale === "en" ? "New Member List" : "নতুন সদস্য তালিকা"}
                                    </p>
                                    <div className="grid grid-cols-3 min-[340px]:grid-cols-4 md:grid-cols-8 gap-3.5 sm:gap-4 lg:gap-6 max-w-4xl mx-auto px-2">
                                        {memberList.map((member: any) => {
                                            const initials = member.initials || member.name
                                                .split(" ")
                                                .filter(Boolean)
                                                .map((w: string) => w[0].toUpperCase())
                                                .slice(0, 2)
                                                .join("");
                                            return (
                                                <div key={member.id} className="flex flex-col items-center gap-1.5 w-full">
                                                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border-2 border-red-400 shadow-md bg-slate-50 flex items-center justify-center shrink-0">
                                                        {member.profileImage ? (
                                                            <img src={member.profileImage} alt={member.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-xs sm:text-sm font-bold text-slate-800">{initials}</span>
                                                        )}
                                                    </div>
                                                    <span className="text-[11px] sm:text-xs font-bold text-slate-800 text-center leading-snug whitespace-normal break-words w-full">{member.name}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Tagline Card */}
                        <div className="relative max-w-3xl mx-auto rounded bg-white p-6 sm:p-8 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
                            <p className="text-sm sm:text-base lg:text-lg font-extrabold text-slate-800 leading-relaxed tracking-wide">
                                {locale === "en"
                                    ? "“LET'S STRIVE TOGETHER WITH BANGLA PARK LIMITED — YOUR TRUSTED DIGITAL, AFFILIATE & CPA MARKETING PARTNER FOR SUCCESS”"
                                    : "“আসুন একসাথে চেষ্টা করি বাংলা পার্ক লিমিটেডের সাথে ডিজিটাল মার্কেটিং, অ্যাফিলিয়েট ও সিপিএ মার্কেটিংয়ের বিশ্বস্ত পার্টনার হয়ে সাফল্য অর্জন করতে”"}
                            </p>
                        </div>
                    </RevealSection>
                </div>
            </section>
        </div>
    );
}
