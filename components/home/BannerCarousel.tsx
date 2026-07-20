"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { bannersApi } from "@/lib/api/banners";
import { useQuery } from "@tanstack/react-query";

const AUTO_PLAY_INTERVAL = 5000;

const FALLBACK_BANNERS = [
    { id: "fb1", imageUrl: "/images/b1.jpg", linkUrl: "/shop", title: "Affiliate Marketplace", badge: "New" },
    { id: "fb2", imageUrl: "/images/b2.jpg", linkUrl: "/shop", title: "Top Products", badge: "Hot" },
    { id: "fb3", imageUrl: "/images/b3.jpg", linkUrl: "/register", title: "Start Earning Today", badge: "Join" },
    { id: "fb4", imageUrl: "/images/b4.jpg", linkUrl: "/shop", title: "Exclusive Deals", badge: "Sale" },
    { id: "fb5", imageUrl: "/images/b5.jpg", linkUrl: "/register", title: "Build Your Team", badge: "Earn" },
];

export function BannerCarousel() {
    const router = useRouter();
    const [current, setCurrent] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const { data: bannersData, isError } = useQuery({
        queryKey: ["banners", "slider"],
        queryFn: () => bannersApi.findActive("SLIDER"),
        retry: 0,
    });
    const banners = isError || !bannersData || bannersData.length === 0 ? FALLBACK_BANNERS : bannersData;

    const goTo = useCallback((index: number) => {
        if (isTransitioning || banners.length === 0) return;
        setIsTransitioning(true);
        setCurrent(index);
        setTimeout(() => setIsTransitioning(false), 600);
    }, [isTransitioning, banners.length]);

    const next = useCallback(() => {
        if (!isTransitioning && banners.length > 0) {
            setIsTransitioning(true);
            setCurrent((prev) => (prev + 1) % banners.length);
            setTimeout(() => setIsTransitioning(false), 600);
        }
    }, [isTransitioning, banners.length]);

    const prev = useCallback(() => {
        if (!isTransitioning && banners.length > 0) {
            setIsTransitioning(true);
            setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
            setTimeout(() => setIsTransitioning(false), 600);
        }
    }, [isTransitioning, banners.length]);

    const handleBannerClick = (linkUrl?: string) => {
        if (!linkUrl) return;
        if (linkUrl.startsWith("http")) {
            window.open(linkUrl, "_blank", "noopener,noreferrer");
        } else {
            router.push(linkUrl);
        }
    };

    useEffect(() => {
        if (banners.length === 0) return;
        const timer = setInterval(next, AUTO_PLAY_INTERVAL);
        return () => clearInterval(timer);
    }, [next, banners.length]);

    if (banners.length === 0) return null;

    return (
        <section className="relative aspect-[21/9] sm:aspect-[5/2] overflow-hidden bg-gray-900 sm:mx-6 lg:mx-auto lg:max-w-7xl mt-2 mb-2 sm:mt-4 sm:mb-4 rounded-sm shadow-lg">
            {banners.map((banner, index) => (
                <div
                    key={banner.id}
                    className="banner-slide"
                    style={{
                        transform: `translateX(${(index - current) * 100}%)`,
                    }}
                >
                    <img
                        src={banner.imageUrl}
                        alt={banner.title || ""}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                </div>
            ))}

            {banners.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 items-center justify-center w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-md transition-all z-10 border border-white/20 hover:border-white/40"
                        aria-label="Previous banner"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button
                        onClick={next}
                        className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 items-center justify-center w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-white backdrop-blur-md transition-all z-10 border border-white/20 hover:border-white/40"
                        aria-label="Next banner"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                    </button>

                    <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => goTo(index)}
                                className={`rounded-full transition-all duration-300 ${
                                    index === current ? "bg-white w-8 h-2.5 shadow-lg" : "bg-white/40 hover:bg-white/70 w-2.5 h-2.5"
                                }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}
