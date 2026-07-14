"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n";
import { MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
    const { t, locale } = useLocale();

    // Localized strings
    const isEn = locale === "en";
    const officeHeader = isEn ? "HEAD OFFICE" : "প্রধান কার্যালয়";
    const addressLabel = isEn ? "Address" : "ঠিকানা";
    const addressValue = isEn
        ? "Navana Shopping Centre, Gulshan Avenue-1, Dhaka-1212"
        : "নাভানা শপিং সেন্টার, গুলশান এভিনিউ-০১, ঢাকা-১২১২";
    const hotlineLabel = isEn ? "Hotline" : "হটলাইন";
    const emailLabel = isEn ? "E-mail" : "ই-মেইল";

    const pageHeader = isEn ? "PAGE" : "পেজ";
    const pageAbout = isEn ? "About Ecom" : "আমাদের সম্পর্কে";
    const pageDelivery = isEn ? "Delivery Policy" : "ডেলিভারি পলিসি";
    const pageTerms = isEn ? "Terms & Condition" : "শর্তাবলী";
    const pageReturn = isEn ? "Return Policy" : "রিটার্ন পলিসি";
    const followHeader = isEn ? "FOLLOW US" : "আমাদের ফলো করুন";

    return (
        <><footer className="mt-auto bg-[#111c2a] border-t border-slate-800 text-slate-350">
            <div className="page-container py-12 lg:py-16">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-start">

                    {/* Left Column: Brand & Tagline */}
                    <div className="lg:col-span-4 space-y-4 lg:pr-10">
                        <Link href="/" className="inline-block transition-transform hover:scale-102">
                            <img src="/logo.png?v=2" alt="Bangla Park Limited" className="h-16 sm:h-20 lg:h-28 w-auto" />
                        </Link>
                        <p className="text-2xl font-extrabold text-white tracking-wide">Bangla Park Limited</p>
                        <p className="text-sm text-slate-400 leading-relaxed font-medium">
                            {t("nav.footerTagline")}
                        </p>
                    </div>

                    {/* Middle Column: Page & Follow Us */}
                    <div className="lg:col-span-4 space-y-6 lg:px-10 lg:border-x border-slate-700/60 pt-8 lg:pt-0">
                        {/* PAGE */}
                        <div className="space-y-3 lg:pl-6">
                            <h4 className={`text-sm font-bold text-white uppercase flex items-center gap-2 ${isEn ? "tracking-widest" : ""}`}>
                                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M4 6H2v14a2 2 0 0 0 2 2h14v-2H4V6zm16-4H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/></svg>
                                <span>{pageHeader}</span>
                            </h4>
                            <ul className="space-y-2.5 text-sm font-bold text-slate-300">
                                <li>
                                    <Link href="/shop" className="hover:text-white transition-colors">{isEn ? "Shop" : "শপ"}</Link>
                                </li>
                                <li>
                                    <Link href="/" className="hover:text-white transition-colors">{pageAbout}</Link>
                                </li>
                                <li>
                                    <Link href="/" className="hover:text-white transition-colors">{pageDelivery}</Link>
                                </li>
                                <li>
                                    <Link href="/" className="hover:text-white transition-colors">{pageTerms}</Link>
                                </li>
                                <li>
                                    <Link href="/" className="hover:text-white transition-colors">{pageReturn}</Link>
                                </li>
                            </ul>
                        </div>

                        {/* FOLLOW US */}
                        <div className="space-y-3 lg:pl-6">
                            <h4 className={`text-sm font-bold text-white uppercase flex items-center gap-2 ${isEn ? "tracking-widest" : ""}`}>
                                    <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                <span>{followHeader}</span>
                            </h4>
                            <div className="flex gap-3">
                                {/* Facebook */}
                                <a
                                    href="https://www.facebook.com/profile.php?id=61589186879275"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded bg-[#1877F2] hover:opacity-90 flex items-center justify-center text-white transition-opacity"
                                    title="Facebook"
                                >
                                    <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
                                        <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3l-.5 3h-2.5v6.8c4.56-.93 8-4.96 8-9.8z" />
                                    </svg>
                                </a>
                                {/* YouTube */}
                                <a
                                    href="https://youtube.com/@banglapark?si=7mFnhHpG0s9fE0Hf"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded bg-[#FF0000] hover:opacity-90 flex items-center justify-center text-white transition-opacity"
                                    title="YouTube"
                                >
                                    <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
                                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Head Office */}
                    <div className="lg:col-span-4 space-y-4 lg:pl-10 pt-8 lg:pt-0">
                        <h4 className={`text-sm font-bold text-white uppercase flex items-center gap-2 ${isEn ? "tracking-widest" : ""}`}>
                                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
                            <span>{officeHeader}</span>
                        </h4>
                        <ul className="space-y-4 text-sm font-bold text-slate-300">
                            <li className="flex items-start gap-2.5 leading-normal">
                                <MapPin size={16} className="text-slate-400 flex-shrink-0 mt-0.5" />
                                <span>
                                    <b className="text-white block mb-0.5">{addressLabel}:</b>
                                    <span className="font-bold">{addressValue}</span>
                                </span>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <Phone size={16} className="text-slate-400 flex-shrink-0" />
                                <span>
                                    <b className="text-white mr-1">{hotlineLabel}:</b>
                                    <span className="font-bold">+8801823674796</span>
                                </span>
                            </li>
                            <li className="flex items-center gap-2.5">
                                <Mail size={16} className="text-slate-400 flex-shrink-0" />
                                <span className="break-all">
                                    <b className="text-white mr-1">{emailLabel}:</b>
                                    <span className="font-bold">banglaparkltd@gmail.com</span>
                                </span>
                            </li>
                        </ul>
                    </div>

                </div>

            </div>

        </footer>

        {/* Bottom Bar: Announcement-style Copyright */}
        <div className="w-full bg-red-600 py-3 px-4 pb-16 md:pb-3">
            <p className="text-xs sm:text-sm text-white font-bold text-center tracking-wide">
                &copy; 2026 Bangla Park Limited. All rights reserved.
            </p>
        </div></>
    );
}
