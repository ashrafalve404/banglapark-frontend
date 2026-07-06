"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ShoppingCart, ShoppingBag, Loader2, ArrowLeft } from "lucide-react";
import { productsApi } from "@/lib/api/products";
import { useCartStore } from "@/store/cart";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

export default function ProductDetailPage() {
    const { slug } = useParams() as { slug: string };
    const router = useRouter();
    const addItem = useCartStore((s) => s.addItem);
    const { t, locale } = useLocale();
    const [qty, setQty] = useState(1);
    const [selectedSize, setSelectedSize] = useState("");
    const [msg, setMsg] = useState(false);

    const { data: product, isLoading, error } = useQuery({
        queryKey: ["product", slug],
        queryFn: () => productsApi.getBySlug(slug),
    });

    const pageTitle = product?.name
        ? `${product.name} | Bangla Park Limited`
        : "Product | Bangla Park Limited";

    useEffect(() => {
        document.title = pageTitle;
    }, [pageTitle]);

    if (isLoading) {
        return (
            <div className="flex h-[calc(100vh-16rem)] items-center justify-center">
                <Loader2 className="animate-spin text-green-800" size={32} />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="page-container py-20 text-center">
                <h2 className="text-xl font-bold text-gray-800">{t("product.notFound")}</h2>
                <button onClick={() => router.push("/shop")} className="btn-primary mt-4 inline-flex gap-2">
                    <ArrowLeft size={16} /> {t("product.backToShop")}
                </button>
            </div>
        );
    }

    const isQualifying = Number(product.price) >= 2000;
    const hasSizes = product.sizes && product.sizes.length > 0;

    const handleAddToCart = () => {
        addItem(product, qty, selectedSize || undefined);
        setMsg(true);
        setTimeout(() => setMsg(false), 2000);
    };

    const handleBuyNow = () => {
        addItem(product, qty, selectedSize || undefined);
        router.push("/cart");
    };

    return (
        <div className="page-container py-10">
            <button onClick={() => router.back()} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-green-800 transition-colors">
                <ArrowLeft size={16} /> {t("product.backButton")}
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 bg-white card-flat p-6 lg:p-10">
                {/* Gallery / Image view */}
                <div className="bg-gray-50 rounded-xl overflow-hidden aspect-square flex items-center justify-center border border-gray-100">
                    {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                        <div className="text-gray-300">{t("product.noImage")}</div>
                    )}
                </div>

                {/* Product Details info */}
                <div className="flex flex-col">
                    {isQualifying && (
                        <span className="mb-3 self-start rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                            {t("product.qualifyingBadge")}
                        </span>
                    )}

                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight mb-2">
                        {product.name}
                    </h1>

                    <div className="mt-2 mb-6">
                        <span className="text-3xl font-extrabold text-green-800">{formatCurrency(product.price, locale)}</span>
                        <span className="ml-2 text-sm text-gray-400 font-medium">{t("product.vatLabel")}</span>
                    </div>

                    <div className="border-t border-b border-gray-100 py-6 mb-6">
                        <p className="text-sm font-semibold text-gray-700 mb-2">{t("product.description.heading")}</p>
                        <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-wrap">
                            {product.description || t("product.description.fallback")}
                        </p>
                    </div>

                    {/* Action logic details */}
                    {product.stock > 0 ? (
                        <div className="space-y-4">
                            {hasSizes && (
                                <div>
                                    <span className="text-sm font-medium text-gray-600">{t("product.sizeLabel", undefined, "Size")}</span>
                                    <div className="flex flex-wrap gap-2 mt-1.5">
                                        {product.sizes.map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setSelectedSize(s === selectedSize ? "" : s)}
                                                className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-all ${selectedSize === s
                                                    ? "border-green-800 bg-green-800 text-white"
                                                    : "border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-700"
                                                    }`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-600">{t("product.quantityLabel")}</span>
                                <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold">-</button>
                                    <span className="px-4 py-1.5 text-sm font-semibold text-gray-800 w-12 text-center">{qty}</span>
                                    <button onClick={() => setQty(qty + 1)} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold">+</button>
                                </div>
                                <span className="text-xs text-gray-400">{t("product.stockInfo")} {product.stock} {t("product.stockUnit")}</span>
                            </div>

                            {msg && (
                                <div className="rounded-lg bg-green-50 p-3 text-xs text-green-700 font-semibold">
                                    {t("product.addedToCartMsg")}
                                </div>
                            )}

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button onClick={handleAddToCart} className="btn-secondary flex-1 py-3.5 flex items-center justify-center gap-2">
                                    <ShoppingCart size={18} /> {t("product.addToCart")}
                                </button>
                                <button onClick={handleBuyNow} className="btn-primary flex-1 py-3.5 flex items-center justify-center gap-2">
                                    <ShoppingBag size={18} /> {t("product.buyNow")}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl border-2 border-red-100 bg-red-50 p-6 text-center text-sm font-bold text-red-600">
                            {t("product.outOfStock")}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
