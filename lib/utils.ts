import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string): string {
    return `৳${Number(amount).toLocaleString("bn-BD")}`;
}

export function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("bn-BD", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

export function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString("bn-BD", {
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
