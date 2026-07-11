"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Bell, User, Menu, X, LogOut, LayoutDashboard, Shield, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import { authApi } from "@/lib/api/auth";
import { categoriesApi } from "@/lib/api/categories";
import { useLocale } from "@/lib/i18n";
import { LocaleSwitcher } from "@/components/shared/LocaleSwitcher";
export function Header() {
    const { user, isAuthenticated, clearAuth } = useAuthStore();
    const cartCount = useCartStore((s) => s.count());
    const { t } = useLocale();
    const [menuOpen, setMenuOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();

    const { data: categoriesData } = useQuery({
        queryKey: ["categories"],
        queryFn: () => categoriesApi.list(),
    });
    const categories = categoriesData?.categories ?? [];

    useEffect(() => { setMounted(true); }, []);

    const profileRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleLogout = async () => {
        await authApi.logout();
        clearAuth();
        router.push("/login");
    };

    return (
        <header
            className="fixed left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm top-0"
        >
            <div className="page-container">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center">
                        <img src="/logo.png?v=2" alt="Bangla Park Limited" className="h-11 w-auto" />
                        <span className="ml-1.5 sm:ml-2 text-sm sm:text-base font-bold text-gray-900">Bangla Park</span>
                    </Link>

                    {/* Search Bar - Desktop */}
                    <form onSubmit={handleSearch} className="header-desktop-nav hidden md:flex items-center flex-1 max-w-md mx-6">
                        <div className="relative w-full">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t("shop.search.placeholder")}
                                className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2 text-sm outline-none transition-colors focus:border-green-600 focus:bg-white focus:ring-2 focus:ring-green-600/20"
                            />
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        </div>
                    </form>

                    {/* Desktop Nav */}
                    <nav className="header-desktop-nav hidden md:flex items-center gap-6">
                        <Link href="/shop" className="text-sm font-medium text-gray-600 hover:text-green-800 transition-colors">{t("nav.shop")}</Link>
                        {categories.length > 0 && (
                        <div className="relative group">
                            <button className="text-sm font-medium text-gray-600 hover:text-green-800 transition-colors flex items-center gap-1">
                                {t("nav.category")}
                            </button>
                            <div className="absolute top-full left-0 mt-2 w-48 rounded-lg border border-gray-100 bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
                                <div className="p-2">
                                    {categories.map((cat) => (
                                        <Link key={cat.id} href={`/shop?categoryId=${cat.id}`} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">
                                            {cat.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                        )}
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
                            <div ref={profileRef} className="relative">
                                <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                                    <User size={16} />
                                    <span className="hidden sm:block max-w-[120px] lg:max-w-[200px] truncate">{user.name}</span>
                                </button>
                                {profileOpen && (
                                    <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-gray-100 bg-white shadow-lg z-50">
                                        <div className="p-2">
                                            {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                                                <Link href="/admin" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                    <Shield size={15} /> {t("nav.adminPanel")}
                                                </Link>
                                            )}
                                            <Link href="/dashboard" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                <LayoutDashboard size={15} /> {t("nav.dashboard")}
                                            </Link>
                                            <Link href="/dashboard/notifications" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                                                <Bell size={15} /> {t("nav.notifications")}
                                            </Link>
                                            <hr className="my-1 border-gray-100" />
                                            <button onClick={() => { handleLogout(); setProfileOpen(false); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50">
                                                <LogOut size={15} /> {t("nav.logout")}
                                            </button>
                                        </div>
                                    </div>
                                )}
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
                        <form onSubmit={handleSearch} className="px-3 py-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t("shop.search.placeholder")}
                                    className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-green-600 focus:bg-white"
                                />
                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            </div>
                        </form>
                        <Link href="/shop" onClick={() => setMenuOpen(false)} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">{t("nav.shop")}</Link>
                        {categories.length > 0 && (
                            <div className="px-3 py-2">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{t("nav.category")}</p>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map((cat) => (
                                        <Link key={cat.id} href={`/shop?categoryId=${cat.id}`} onClick={() => setMenuOpen(false)} className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:border-green-600 hover:text-green-800">
                                            {cat.name}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
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
