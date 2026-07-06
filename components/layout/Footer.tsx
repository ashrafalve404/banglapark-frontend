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
                            <li><span className="text-sm text-gray-400">{t("nav.supportPhone")}</span></li>
                            <li className="pt-2 flex gap-3">
                                <a href="https://www.facebook.com/profile.php?id=61589186879275" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors" title="Facebook">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                                </a>
                                <a href="https://youtube.com/@banglapark?si=7mFnhHpG0s9fE0Hf" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-600 transition-colors" title="YouTube">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="mt-8 border-t border-gray-700 pt-6 flex flex-col items-start gap-3">
                    <div className="flex items-center gap-4 text-sm text-gray-300">
                        <span>{t("nav.paymentMethods")}:</span>
                        <span className="inline-flex items-center gap-1 rounded-sm bg-gray-100 px-2.5 py-1">
                            <img src="/bkash_logo.svg" alt="bKash" className="h-5 w-auto" />
                            <span className="text-pink-600 font-semibold text-xs">bKash</span>
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-sm bg-gray-100 px-2.5 py-1">
                            <img src="/cash.png" alt="Cash" className="h-5 w-auto" />
                            <span className="text-green-700 font-semibold text-xs">Cash</span>
                        </span>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-between w-full gap-2">
                        <p className="text-xs text-gray-500 text-center sm:text-left">{t("nav.copyright", { year: new Date().getFullYear() })}</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
