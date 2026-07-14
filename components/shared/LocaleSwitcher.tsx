"use client";

import { useLocale } from "@/lib/i18n";

export function LocaleSwitcher({ light }: { light?: boolean }) {
    const { locale, setLocale } = useLocale();

    return (
        <button
            onClick={() => setLocale(locale === "bn" ? "en" : "bn")}
            className={`flex items-center gap-0.5 sm:gap-1 rounded-lg border px-1.5 sm:px-2.5 py-1 text-[10px] sm:text-xs font-medium transition-colors ${light ? "border-white/30 text-white/85 hover:bg-white/10 hover:text-white" : "border-gray-200 text-gray-800 hover:bg-gray-100"}`}
            title={locale === "bn" ? "Switch to English" : "বাংলায় সুইচ করুন"}
        >
            <span className={`${locale === "bn" ? "font-bold" : ""} ${light ? (locale === "bn" ? "text-white" : "text-white/50") : (locale === "bn" ? "text-gray-900" : "text-gray-500")}`}>BN</span>
            <span className={light ? "text-white/30" : "text-gray-400"}>/</span>
            <span className={`${locale === "en" ? "font-bold" : ""} ${light ? (locale === "en" ? "text-white" : "text-white/50") : (locale === "en" ? "text-gray-900" : "text-gray-500")}`}>EN</span>
        </button>
    );
}
