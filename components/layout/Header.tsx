"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Bell, User, Menu, X, LogOut, LayoutDashboard, Shield } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import { authApi } from "@/lib/api/auth";
import { useLocale } from "@/lib/i18n";
import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";

export function Header() {
    const { user, isAuthenticated, clearAuth } = useAuthStore();
    const cartCount = useCartStore((s) => s.count());
    const { t } = useLocale();
    const [menuOpen, setMenuOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => { setMounted(true); }, []);

    const handleLogout = async () => {
        await authApi.logout();
        clearAuth();
        router.push("/login");
    };

    return (
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
            <div className="page-container">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-xl font-bold text-green-800">{t("nav.banglaPark")}</span>
                        <span className="hidden sm:block text-xs text-gray-400 font-medium tracking-wider uppercase">{t("nav.limited")}</span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="header-desktop-nav hidden md:flex items-center gap-6">
                        <Link href="/shop" className="text-sm font-medium text-gray-600 hover:text-green-800 transition-colors">{t("nav.shop")}</Link>
                        <Link href="/shop?categories=all" className="text-sm font-medium text-gray-600 hover:text-green-800 transition-colors">{t("nav.category")}</Link>
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                        {/* Locale Switcher */}
                        <LocaleSwitcher />

                        {/* Cart */}
                        <Link href="/cart" className="relative p-2 text-gray-600 hover:text-green-800 transition-colors">
                            <ShoppingCart size={20} />
                            {mounted && cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-800 text-[10px] font-bold text-white">
                                    {cartCount > 9 ? "9+" : cartCount}
                                </span>
                            )}
                        </Link>

                        {mounted && isAuthenticated && user ? (
                            <div className="relative group">
                                <button className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                    <User size={16} />
                                    <span className="hidden sm:block max-w-[120px] lg:max-w-[200px] truncate">{user.name}</span>
                                </button>
                                <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-gray-100 bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                                    <div className="p-2">
                                        {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                                            <Link href="/admin" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                <Shield size={15} /> {t("nav.adminPanel")}
                                            </Link>
                                        )}
                                        <Link href="/dashboard" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                            <LayoutDashboard size={15} /> {t("nav.dashboard")}
                                        </Link>
                                        <Link href="/dashboard/notifications" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                            <Bell size={15} /> {t("nav.notifications")}
                                        </Link>
                                        <hr className="my-1 border-gray-100" />
                                        <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                                            <LogOut size={15} /> {t("nav.logout")}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="hidden md:flex items-center gap-2">
                                <Link href="/login" className="btn-secondary py-1.5 px-3 text-sm">{t("nav.login")}</Link>
                                <Link href="/register" className="btn-primary py-1.5 px-3 text-sm">{t("nav.register")}</Link>
                            </div>
                        )}

                        {/* Mobile menu toggle */}
                        <button className="header-hamburger md:hidden p-2 text-gray-600 flex items-center justify-center" onClick={() => setMenuOpen(!menuOpen)}>
                            {menuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Nav */}
                {menuOpen && (
                    <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
                        <Link href="/shop" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">{t("nav.shop")}</Link>
                        {isAuthenticated ? (
                            <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">{t("nav.mobileDashboard")}</Link>
                        ) : (
                            <>
                                <Link href="/login" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">{t("nav.login")}</Link>
                                <Link href="/register" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-green-800 hover:bg-green-50 font-semibold">{t("nav.register")}</Link>
                            </>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
}
