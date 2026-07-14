"use client";

import { useLocale } from "@/lib/i18n";

export function LocaleSwitcher() {
    const { locale, setLocale } = useLocale();

    return (
        <button
            onClick={() => setLocale(locale === "bn" ? "en" : "bn")}
            className="flex items-center gap-0.5 sm:gap-1 rounded-lg border border-gray-200 px-1.5 sm:px-2.5 py-1 text-[10px] sm:text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors"
            title={locale === "bn" ? "Switch to English" : "à¦¬à¦¾à¦‚à¦²à¦¾à§Ÿ à¦¸à§à¦‡à¦š à¦•à¦°à§à¦¨"}
        >
            <span className={`${locale === "bn" ? "text-red-700 font-bold" : "text-gray-400"}`}>BN</span>
            <span className="text-gray-300">/</span>
            <span className={`${locale === "en" ? "text-red-700 font-bold" : "text-gray-400"}`}>EN</span>
        </button>
    );
}
