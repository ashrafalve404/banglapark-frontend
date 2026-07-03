"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import bn from "@/messages/bn.json";
import en from "@/messages/en.json";

export type Locale = "bn" | "en";

const messages = { bn, en } as const;

type NestedValue = string | Record<string, unknown>;

type LocaleContextType = {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string, params?: Record<string, string | number>, fallback?: string) => string;
};

const LocaleContext = createContext<LocaleContextType | null>(null);

function resolve(obj: Record<string, NestedValue>, path: string): string | undefined {
    const parts = path.split(".");
    let current: NestedValue = obj;
    for (const part of parts) {
        if (typeof current !== "object" || current === null) return undefined;
        current = (current as Record<string, NestedValue>)[part];
    }
    return typeof current === "string" ? current : undefined;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>("bn");

    useEffect(() => {
        const stored = localStorage.getItem("locale");
        if (stored === "en" || stored === "bn") {
            setLocaleState(stored);
        }
    }, []);

    const setLocale = useCallback((l: Locale) => {
        setLocaleState(l);
        localStorage.setItem("locale", l);
    }, []);

    const t = useCallback(
        (key: string, params?: Record<string, string | number>, fallback?: string): string => {
            const msg = resolve(messages[locale] as Record<string, NestedValue>, key);
            if (!msg) return fallback || key;
            if (!params) return msg;
            return msg.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
        },
        [locale]
    );

    return (
        <LocaleContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </LocaleContext.Provider>
    );
}

export function useLocale(): LocaleContextType {
    const ctx = useContext(LocaleContext);
    if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
    return ctx;
}
