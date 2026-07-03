"use client";

import { useLocale } from "@/lib/i18n";

export function LocaleSwitcher() {
    const { locale, setLocale } = useLocale();

    return (
        <button
            onClick={() => setLocale(locale === "bn" ? "en" : "bn")}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
            title={locale === "bn" ? "Switch to English" : "বাংলায় সুইচ করুন"}
        >
            <span className={`${locale === "bn" ? "text-green-700 font-bold" : "text-gray-400"}`}>BN</span>
            <span className="text-gray-300">/</span>
            <span className={`${locale === "en" ? "text-green-700 font-bold" : "text-gray-400"}`}>EN</span>
        </button>
    );
}
