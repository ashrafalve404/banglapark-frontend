"use client";

import { useState, useEffect, useCallback } from "react";

interface Banner {
    id: string;
    image: string;
    title: string;
    subtitle?: string;
    ctaText?: string;
    ctaLink?: string;
}

const BANNERS: Banner[] = [
    {
        id: "1",
        image: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&h=600&fit=crop",
        title: "মেগা শপিং ফেস্টিভাল",
        subtitle: "অপার হাল নিয়ে আগামী ৭ দিন",
        ctaText: "শপ করুন",
        ctaLink: "/shop",
    },
    {
        id: "2",
        image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&h=600&fit=crop",
        title: "নিয়মিত আয় করুন",
        subtitle: "রেফার করে জেনারেশন কমিশন",
        ctaText: "রেজিস্টার",
        ctaLink: "/register",
    },
    {
        id: "3",
        image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1600&h=600&fit=crop",
        title: "প্রোডাক্ট কিনুন অ্যাকটিভেট",
        subtitle: "২,০০০/- এর ওপর অর্ডার করলেই একাউন্ট একটিভ",
        ctaText: "প্রোডাক্ট দেখুন",
        ctaLink: "/shop",
    },
];

const AUTO_PLAY_INTERVAL = 4000;

export function BannerCarousel() {
    const [current, setCurrent] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const goTo = useCallback((index: number) => {
        if (isTransitioning) return;
        setCurrent(index);
    }, [isTransitioning]);

    const next = useCallback(() => {
        if (!isTransitioning) {
            setIsTransitioning(true);
            setCurrent((prev) => (prev + 1) % BANNERS.length);
            setTimeout(() => setIsTransitioning(false), 600);
        }
    }, [isTransitioning]);

    const prev = useCallback(() => {
        if (!isTransitioning) {
            setIsTransitioning(true);
            setCurrent((prev) => (prev - 1 + BANNERS.length) % BANNERS.length);
            setTimeout(() => setIsTransitioning(false), 600);
        }
    }, [isTransitioning]);

    useEffect(() => {
        const timer = setInterval(next, AUTO_PLAY_INTERVAL);
        return () => clearInterval(timer);
    }, [next]);

    return (
        <section className="relative w-full h-[260px] sm:h-[360px] md:h-[460px] lg:h-[520px] overflow-hidden bg-gray-900">
            {BANNERS.map((banner, index) => (
                <div
                    key={banner.id}
                    className="absolute inset-0 transition-transform duration-600 ease-in-out"
                    style={{
                        transform: `translateX(${(index - current) * 100}%)`,
                    }}
                >
                    <img
                        src={banner.image}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
                    <div className="absolute inset-0 flex items-center">
                        <div className="page-container">
                            <div className="max-w-xl text-white">
                                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-3">
                                    {banner.title}
                                </h2>
                                {banner.subtitle && (
                                    <p className="text-sm sm:text-base md:text-lg text-gray-200 mb-5">
                                        {banner.subtitle}
                                    </p>
                                )}
                                {banner.ctaText && banner.ctaLink && (
                                    <a
                                        href={banner.ctaLink}
                                        className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-all shadow-lg"
                                    >
                                        {banner.ctaText}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            <button
                onClick={prev}
                className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 items-center justify-center w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm transition-all z-10"
                aria-label="Previous banner"
            >
                ‹
            </button>
            <button
                onClick={next}
                className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 items-center justify-center w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-sm transition-all z-10"
                aria-label="Next banner"
            >
                ›
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                {BANNERS.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => goTo(index)}
                        className={`rounded-full transition-all ${
                            index === current ? "bg-white w-6 h-2.5" : "bg-white/50 hover:bg-white/80 w-2.5 h-2.5"
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </section>
    );
}
