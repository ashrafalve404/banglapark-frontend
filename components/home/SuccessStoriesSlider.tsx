"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Story {
    name: string;
    role: string;
    quote: string;
    profileImage?: string | null;
}

interface SuccessStoriesSliderProps {
    stories: Story[];
}

function useVisibleCount() {
    const [count, setCount] = useState(3);
    useEffect(() => {
        const update = () => {
            if (window.innerWidth < 640) setCount(1);
            else if (window.innerWidth < 1024) setCount(2);
            else setCount(3);
        };
        update();
        window.addEventListener("resize", update);
        return () => window.removeEventListener("resize", update);
    }, []);
    return count;
}

export function SuccessStoriesSlider({ stories }: SuccessStoriesSliderProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const visibleCount = useVisibleCount();

    const maxIndex = Math.max(0, stories.length - visibleCount);

    // Keep currentIndex within bounds if visibleCount changes
    useEffect(() => {
        if (currentIndex > maxIndex) {
            setCurrentIndex(maxIndex);
        }
    }, [visibleCount, maxIndex, currentIndex]);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, [maxIndex]);

    const prevSlide = useCallback(() => {
        setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
    }, [maxIndex]);

    // Auto-play interval
    useEffect(() => {
        if (isHovered || stories.length === 0) return;
        const interval = setInterval(() => {
            nextSlide();
        }, 4000);
        return () => clearInterval(interval);
    }, [nextSlide, isHovered, stories.length]);

    // Touch swipe support
    const touchStartX = useRef<number | null>(null);
    const touchEndX = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
        if (!touchStartX.current || !touchEndX.current) return;
        const diff = touchStartX.current - touchEndX.current;
        if (diff > 50) {
            nextSlide();
        } else if (diff < -50) {
            prevSlide();
        }
        touchStartX.current = null;
        touchEndX.current = null;
    };

    if (!stories || stories.length === 0) return null;

    const gap = 24; // px gap between items

    return (
        <div
            className="relative px-6 sm:px-8 lg:px-0"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Slider track container - pt-6 and px-3 give top & right breathing room for floating badge */}
            <div className="overflow-hidden pt-6 pb-4 px-3 sm:px-4 lg:px-2">
                <div
                    className="flex transition-transform duration-500 ease-out"
                    style={{
                        gap: `${gap}px`,
                        transform: `translateX(calc(-${currentIndex} * (100% + ${gap}px) / ${visibleCount}))`,
                    }}
                >
                    {stories.map((story, i) => (
                        <div
                            key={i}
                            className="group relative bg-white rounded p-6 sm:p-7 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shrink-0"
                            style={{
                                width: `calc((100% - (${visibleCount - 1} * ${gap}px)) / ${visibleCount})`,
                            }}
                        >
                            <div className="absolute -top-2.5 -right-2.5 w-9 h-9 bg-gradient-to-br from-red-700 to-red-500 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-lg z-20">
                                {String(i + 1).padStart(2, "0")}
                            </div>
                            <svg className="w-8 h-8 text-red-700/20 mb-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                            </svg>
                            <p className="text-sm text-gray-600 leading-relaxed mb-5 italic">"{story.quote}"</p>
                            <div className="border-t border-gray-100 pt-4 flex items-center gap-3">
                                <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-sm font-bold text-slate-800 shrink-0 border-2 border-red-300 shadow-sm overflow-hidden">
                                    {story.profileImage ? (
                                        <img src={story.profileImage} alt={story.name} className="w-full h-full object-cover" />
                                    ) : (
                                        (story.name || "BP").split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{story.name}</p>
                                    <p className="text-xs text-emerald-600 font-semibold">{story.role}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Arrows */}
            {maxIndex > 0 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-0 sm:left-1 lg:-left-6 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-slate-700 shadow-md border border-gray-200 flex items-center justify-center hover:bg-red-700 hover:text-white hover:border-red-700 transition-all z-20 cursor-pointer"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-0 sm:right-1 lg:-right-6 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-slate-700 shadow-md border border-gray-200 flex items-center justify-center hover:bg-red-700 hover:text-white hover:border-red-700 transition-all z-20 cursor-pointer"
                        aria-label="Next slide"
                    >
                        <ChevronRight size={20} />
                    </button>

                    {/* Pagination Dots */}
                    <div className="flex items-center justify-center gap-2 mt-6">
                        {Array.from({ length: maxIndex + 1 }).map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`rounded-full transition-all duration-300 cursor-pointer ${
                                    idx === currentIndex
                                        ? "bg-red-700 w-8 h-2.5 shadow-xs"
                                        : "bg-gray-300 hover:bg-gray-400 w-2.5 h-2.5"
                                }`}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
