import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, locale = "en"): string {
    const localeMap: Record<string, string> = { bn: "bn-BD", en: "en-IN" };
    const l = localeMap[locale] || locale;
    return `৳${Number(amount).toLocaleString(l)}`;
}

export function formatDate(dateStr: string, locale = "en"): string {
    const localeMap: Record<string, string> = { bn: "bn-BD", en: "en-IN" };
    const l = localeMap[locale] || locale;
    return new Date(dateStr).toLocaleDateString(l, {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

export function formatDateTime(dateStr: string, locale = "en"): string {
    const localeMap: Record<string, string> = { bn: "bn-BD", en: "en-IN" };
    const l = localeMap[locale] || locale;
    return new Date(dateStr).toLocaleString(l, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export function daysUntil(dateStr: string | undefined): number {
    if (!dateStr) return 0;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getOrderStatusLabel(status: string): string {
    const map: Record<string, string> = {
        PENDING: "অপেক্ষমান",
        CONFIRMED: "নিশ্চিত",
        PROCESSING: "প্রক্রিয়াধীন",
        SHIPPED: "পাঠানো হয়েছে",
        DELIVERED: "ডেলিভারি হয়েছে",
        CANCELLED: "বাতিল",
    };
    return map[status] ?? status;
}

export function getWithdrawStatusLabel(status: string): string {
    const map: Record<string, string> = {
        PENDING: "অপেক্ষমান",
        APPROVED: "অনুমোদিত",
        REJECTED: "প্রত্যাখ্যাত",
        RETURNED: "ফেরত সম্পন্ন",
    };
    return map[status] ?? status;
}

export function getTxTypeLabel(type: string): string {
    const map: Record<string, string> = {
        GENERATION_COMMISSION: "জেনারেশন কমিশন",
        DAILY_BENEFIT: "দৈনিক বেনিফিট",
        PURCHASE: "ক্রয়",
        WITHDRAWAL: "উত্তোলন",
        REFUND: "ফেরত",
        ADMIN_ADJUSTMENT: "এডমিন সমন্বয়",
    };
    return map[type] ?? type;
}

export function getWithdrawMethodLabel(method: string): string {
    const map: Record<string, string> = {
        BKASH: "বিকাশ",
        NAGAD: "নগদ",
        ROCKET: "রকেট",
        BANK: "ব্যাংক ট্রান্সফার",
    };
    return map[method] ?? method;
}

export function truncate(str: string, maxLen = 60): string {
    return str.length > maxLen ? str.slice(0, maxLen) + "…" : str;
}

export function numberToWords(num: number): string {
    if (isNaN(num) || num === 0) return "Zero Taka Only";
    const a = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
        "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
    ];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    function inWords(n: number): string {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
        if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + inWords(n % 100) : "");
        if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + inWords(n % 1000) : "");
        if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + inWords(n % 100000) : "");
        return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + inWords(n % 10000000) : "");
    }

    const whole = Math.floor(num);
    const fraction = Math.round((num - whole) * 100);

    let res = inWords(whole) + " Taka";
    if (fraction > 0) {
        res += " and " + inWords(fraction) + " Poisha";
    }
    return res + " Only";
}
