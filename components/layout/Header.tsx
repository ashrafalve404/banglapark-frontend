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
    const { t, locale } = useLocale();
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

    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [menuOpen]);

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
            className="fixed top-0 left-0 right-0 z-50 bg-red-700 border-b border-red-800 shadow-sm"
        >
            <div className="page-container">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center">
                        <img src="/logo.png?v=2" alt="Bangla Park Limited" className="h-11 w-auto" />
                        <span className="ml-1.5 sm:ml-2 text-lg sm:text-xl font-extrabold text-white tracking-tight">{locale === "bn" ? "বাংলা পার্ক" : "Bangla Park"}</span>
                    </Link>

                    {/* Search Bar - Desktop */}
                    <form onSubmit={handleSearch} className="header-desktop-nav hidden md:flex items-center flex-1 max-w-md mx-6">
                        <div className="relative w-full">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t("shop.search.placeholder")}
                                className="w-full rounded-sm border border-white/40 bg-white/10 pl-10 pr-4 py-2 text-sm outline-none text-white placeholder:text-white/60 transition-colors focus:border-white focus:ring-2 focus:ring-white/20 focus:bg-white/15"
                            />
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                        </div>
                    </form>

                    {/* Desktop Nav */}
                    <nav className="header-desktop-nav hidden md:flex items-center gap-6">
                        <Link href="/" className="text-sm font-medium text-white/95 hover:text-white transition-colors">{t("nav.home")}</Link>
                        <Link href="/shop" className="text-sm font-medium text-white/95 hover:text-white transition-colors">{t("nav.shop")}</Link>
                        {categories.length > 0 && (
                        <div className="relative group">
                            <button className="text-sm font-medium text-white/85 hover:text-white transition-colors flex items-center gap-1">
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
                        {/* Locale Switcher - Desktop only */}
                        <div className="hidden md:block">
                            <LocaleSwitcher light />
                        </div>

                        {/* Cart */}
                        <Link href="/cart" className="relative p-2 text-white/85 hover:text-white transition-colors">
                            <ShoppingCart size={20} />
                            {mounted && cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-red-800">
                                    {cartCount > 9 ? "9+" : cartCount}
                                </span>
                            )}
                        </Link>

                        {mounted && isAuthenticated && user ? (
                            <div ref={profileRef} className="relative">
                                <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 rounded-sm border border-white/30 px-3 py-1.5 text-sm font-medium text-white/90 hover:bg-white/10 transition-colors">
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
                                <Link href="/login" className="inline-flex items-center justify-center rounded-sm border border-white/40 px-3 py-1.5 text-sm font-semibold text-white transition-all hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-red-800">{t("nav.login")}</Link>
                                <Link href="/register" className="inline-flex items-center justify-center rounded-sm bg-white px-3 py-1.5 text-sm font-semibold text-red-800 transition-all hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-red-800">{t("nav.register")}</Link>
                            </div>
                        )}

                        {/* Mobile menu toggle */}
                        <button className="header-hamburger md:hidden p-2 text-white flex items-center justify-center" onClick={() => setMenuOpen(!menuOpen)}>
                            {menuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Nav - Side Drawer */}
                {menuOpen && (
                    <div className="fixed inset-0 z-[100] md:hidden">
                        <div className="absolute inset-0 bg-black/50 fade-in" onClick={() => setMenuOpen(false)} />
                        <div className="absolute right-0 top-0 bottom-0 w-[280px] max-w-[80vw] bg-white shadow-2xl overflow-y-auto slide-from-right">
                            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
                                <span className="text-sm font-bold text-gray-800">Menu</span>
                                <button onClick={() => setMenuOpen(false)} className="p-1 text-gray-500 hover:text-gray-800">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="px-4 py-3 border-b border-gray-100">
                                <form onSubmit={handleSearch}>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder={t("shop.search.placeholder")}
                                            className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 py-2 text-sm outline-none focus:border-green-600 focus:bg-white"
                                        />
                                        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    </div>
                                </form>
                            </div>

                            <div className="divide-y divide-slate-100">
                                <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100">
                                    {t("nav.home")}
                                </Link>
                                <Link href="/shop" onClick={() => setMenuOpen(false)} className="flex items-center px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100">
                                    {t("nav.shop")}
                                </Link>
                                {categories.length > 0 && categories.map((cat) => (
                                    <Link key={cat.id} href={`/shop?categoryId=${cat.id}`} onClick={() => setMenuOpen(false)} className="flex items-center px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100">
                                        {cat.name}
                                    </Link>
                                ))}
                                {isAuthenticated ? (
                                    <>
                                        <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100">
                                            {t("nav.mobileDashboard")}
                                        </Link>
                                        <Link href="/dashboard/orders" onClick={() => setMenuOpen(false)} className="flex items-center px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100">
                                            {t("nav.orders")}
                                        </Link>
                                        <Link href="/dashboard/notifications" onClick={() => setMenuOpen(false)} className="flex items-center px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100">
                                            {t("nav.notifications")}
                                        </Link>
                                        {(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && (
                                            <Link href="/admin" onClick={() => setMenuOpen(false)} className="flex items-center px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors border-b border-slate-100">
                                                {t("nav.adminPanel")}
                                            </Link>
                                        )}
                                        <button onClick={() => { handleLogout(); setMenuOpen(false); }} className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors text-left border-b border-slate-100">
                                            {t("nav.logout")}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/login" onClick={() => setMenuOpen(false)} className="flex items-center px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100">
                                            {t("nav.login")}
                                        </Link>
                                        <Link href="/register" onClick={() => setMenuOpen(false)} className="flex items-center px-4 py-3 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors border-b border-slate-100">
                                            {t("nav.register")}
                                        </Link>
                                    </>
                                )}
                            </div>

                            <div className="px-4 py-3 bg-slate-50/50">
                                <LocaleSwitcher />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
