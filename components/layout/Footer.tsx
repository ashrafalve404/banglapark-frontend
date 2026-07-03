"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/lib/i18n";

export function Footer() {
    const { t } = useLocale();
    return (
        <footer className="mt-auto border-t border-gray-700 bg-neutral-900">
            <div className="page-container py-10">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <Link href="/" className="inline-block mb-3">
                            <Image src="/logo.png" alt="Bangla Park Limited" width={360} height={96} className="h-16 sm:h-24 md:h-40 w-auto" />
                        </Link>
                        <p className="text-base sm:text-xl font-bold text-white">Bangla Park Limited</p>
                        <p className="text-sm text-gray-400 leading-relaxed mt-1">
                            {t("nav.footerTagline")}
                        </p>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-200 mb-3">{t("nav.shopping")}</h4>
                        <ul className="space-y-2">
                            <li><Link href="/shop" className="text-sm text-gray-400 hover:text-white transition-colors">{t("nav.allProducts")}</Link></li>
                            <li><Link href="/cart" className="text-sm text-gray-400 hover:text-white transition-colors">{t("nav.cart")}</Link></li>
                            <li><Link href="/checkout" className="text-sm text-gray-400 hover:text-white transition-colors">{t("nav.checkout")}</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-200 mb-3">{t("nav.account")}</h4>
                        <ul className="space-y-2">
                            <li><Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">{t("nav.login")}</Link></li>
                            <li><Link href="/register" className="text-sm text-gray-400 hover:text-white transition-colors">{t("nav.register")}</Link></li>
                            <li><Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">{t("nav.dashboard")}</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-sm font-semibold text-gray-200 mb-3">{t("nav.support")}</h4>
                        <ul className="space-y-2">
                            <li><span className="text-sm text-gray-400">{t("nav.supportHours")}</span></li>
                            <li><span className="text-sm text-gray-400">{t("nav.supportEmail")}</span></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-8 border-t border-gray-700 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
                    <p className="text-xs text-gray-500">{t("nav.copyright", { year: new Date().getFullYear() })}</p>
                    <p className="text-xs text-gray-500">{t("nav.mlmTagline")}</p>
                </div>
            </div>
        </footer>
    );
}
