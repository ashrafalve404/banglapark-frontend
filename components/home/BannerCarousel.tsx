"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { bannersApi } from "@/lib/api/banners";
import { useQuery } from "@tanstack/react-query";

const AUTO_PLAY_INTERVAL = 4000;

const FALLBACK_BANNER = {
    id: "fallback",
    imageUrl: "/images/demobanner.png",
    linkUrl: undefined,
};

export function BannerCarousel() {
    const router = useRouter();
    const [current, setCurrent] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const { data: bannersData, isError } = useQuery({
        queryKey: ["banners"],
        queryFn: () => bannersApi.findActive(),
        retry: 0,
    });

    const apiBanners = (bannersData ?? []).filter((b: { isActive: boolean }) => b.isActive);
    const banners = isError || apiBanners.length === 0 ? [FALLBACK_BANNER] : apiBanners;

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
        <section className="relative aspect-[5/2] overflow-hidden bg-gray-900 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4 mb-4">
            {banners.map((banner, index) => (
                <div
                    key={banner.id}
                    className="banner-slide"
                    style={{
                        transform: `translateX(${(index - current) * 100}%)`,
                    }}
                >
                    {banner.linkUrl ? (
                        <button
                            onClick={() => handleBannerClick(banner.linkUrl)}
                            className="w-full h-full cursor-pointer"
                            type="button"
                        >
                            <img
                                src={banner.imageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ) : (
                        <img
                            src={banner.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    )}
                </div>
            ))}

            {banners.length > 1 && (
                <>
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
                        {banners.map((_, index) => (
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
                </>
            )}
        </section>
    );
}
