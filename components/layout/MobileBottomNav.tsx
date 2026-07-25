"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    FaHouse, FaStore, FaBasketShopping, 
    FaGauge, FaCircleUser 
} from "react-icons/fa6";
import { useLocale } from "@/lib/i18n";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
    { href: "/", icon: FaHouse, labelKey: "nav.home", activeColor: "text-red-700", activeBar: "bg-red-700" },
    { href: "/shop", icon: FaStore, labelKey: "nav.shop", activeColor: "text-indigo-600", activeBar: "bg-indigo-600" },
    { href: "/cart", icon: FaBasketShopping, labelKey: "nav.cart", showBadge: true, activeColor: "text-amber-600", activeBar: "bg-amber-600" },
    { href: "/dashboard", icon: FaGauge, labelKey: "nav.dashboard", auth: true, activeColor: "text-emerald-600", activeBar: "bg-emerald-600" },
    { href: "/login", icon: FaCircleUser, labelKey: "nav.login", guest: true, activeColor: "text-violet-600", activeBar: "bg-violet-600" },
];

export function MobileBottomNav() {
    const pathname = usePathname();
    const { t } = useLocale();
    const cartCount = useCartStore((s) => s.count());
    const { isAuthenticated } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const visibleItems = NAV_ITEMS.filter((item) => {
        if (!mounted) return item.href === "/" || item.href === "/shop" || item.href === "/cart";
        if (item.auth && !isAuthenticated) return false;
        if (item.guest && isAuthenticated) return false;
        return true;
    });

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden safe-area-pb shadow-lg">
            <div className="flex items-center justify-around">
                {visibleItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center py-2 px-3 min-w-14 relative transition-colors duration-200 ${
                                isActive ? item.activeColor : "text-gray-400 hover:text-gray-600"
                            }`}
                        >
                            <div className="relative">
                                <Icon size={21} className={isActive ? "scale-110 transition-transform" : ""} />
                                {item.showBadge && mounted && cartCount > 0 && (
                                    <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-700 text-[10px] font-bold text-white shadow-xs">
                                        {cartCount > 9 ? "9+" : cartCount}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[10px] mt-1 ${isActive ? "font-bold" : "font-medium"}`}>
                                {t(item.labelKey)}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
