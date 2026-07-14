"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, ShoppingCart, User, LayoutDashboard } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
    { href: "/", icon: Home, labelKey: "nav.home" },
    { href: "/shop", icon: ShoppingBag, labelKey: "nav.shop" },
    { href: "/cart", icon: ShoppingCart, labelKey: "nav.cart", showBadge: true },
    { href: "/dashboard", icon: LayoutDashboard, labelKey: "nav.dashboard", auth: true },
    { href: "/login", icon: User, labelKey: "nav.login", guest: true },
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
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden safe-area-pb">
            <div className="flex items-center justify-around">
                {visibleItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center py-2 px-3 min-w-[56px] relative ${
                                isActive ? "text-green-800" : "text-gray-400"
                            }`}
                        >
                            <div className="relative">
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                                {item.showBadge && mounted && cartCount > 0 && (
                                    <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-green-800 text-[10px] font-bold text-white">
                                        {cartCount > 9 ? "9+" : cartCount}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[10px] mt-1 ${isActive ? "font-semibold" : "font-medium"}`}>
                                {t(item.labelKey)}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
