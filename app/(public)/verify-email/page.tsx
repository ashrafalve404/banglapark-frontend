"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, RefreshCw, ArrowLeft } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/store/auth";
import { useLocale } from "@/lib/i18n";

function VerifyEmailForm() {
    const { locale } = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();
    const setUser = useAuthStore((s) => s.setUser);

    const email = searchParams.get("email") || "";
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [resendTimer, setResendTimer] = useState(60);
    const [resending, setResending] = useState(false);

    const inputRefs = [
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null),
    ];

    // Resend countdown timer
    useEffect(() => {
        if (resendTimer <= 0) return;
        const interval = setInterval(() => {
            setResendTimer((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [resendTimer]);

    const handleOtpChange = (index: number, value: string) => {
        if (value.length > 1) {
            // Pasted string case
            const pasted = value.slice(0, 6).split("");
            const newOtp = [...otp];
            pasted.forEach((char, i) => {
                if (i < 6) newOtp[i] = char;
            });
            setOtp(newOtp);
            inputRefs[Math.min(pasted.length, 5)].current?.focus();
            return;
        }

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError(null);

        // Auto-advance
        if (value && index < 5) {
            inputRefs[index + 1].current?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const code = otp.join("");
        if (code.length < 6) {
            setError(locale === "bn" ? "দয়া করে ৬ ডিজিটের কোডটি সঠিকভাবে পূরণ করুন।" : "Please enter the full 6-digit code.");
            return;
        }

        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const res = await authApi.verifyEmail({ email, otp: code });
            authApi.saveTokens({ accessToken: res.accessToken, refreshToken: res.refreshToken });
            setUser(res.user);
            setSuccessMsg(res.message || (locale === "bn" ? "ইমেইল ভেরিফিকেশন সফল হয়েছে!" : "Email verified successfully!"));

            setTimeout(() => {
                router.push("/dashboard");
            }, 1200);
        } catch (err: any) {
            setError(
                err?.response?.data?.message || err?.message || (locale === "bn" ? "কোডটি সঠিক নয় বা মেয়াদ শেষ হয়ে গেছে।" : "Invalid or expired verification code.")
            );
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (resendTimer > 0 || resending) return;
        setResending(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const res = await authApi.resendVerification({ email });
            setSuccessMsg(res.message || (locale === "bn" ? "নতুন ভেরিফিকেশন কোড পাঠানো হয়েছে।" : "A new verification code has been sent."));
            setResendTimer(60);
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || (locale === "bn" ? "কোড পুনরায় পাঠাতে ব্যর্থ হয়েছে।" : "Failed to resend code."));
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="card-flat w-full max-w-md p-8 text-center">
                {/* Header Logo */}
                <div className="text-center mb-6">
                    <img src="/logo.png?v=5" alt="Bangla Park Limited" className="mx-auto h-14 w-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">
                        {locale === "bn" ? "ইমেইল ভেরিফিকেশন" : "Verify Your Email"}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                        {locale === "bn" ? "আমরা আপনার ইমেইলে একটি ৬-ডিজিটের ভেরিফিকেশন কোড পাঠিয়েছি:" : "We sent a 6-digit verification code to:"}
                    </p>
                    <p className="mt-1 text-sm font-bold text-red-700 font-mono bg-red-50 py-1 px-3 rounded inline-block border border-red-100">
                        {email || "your email address"}
                    </p>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 font-medium text-center">
                        {error}
                    </div>
                )}

                {/* Success Banner */}
                {successMsg && (
                    <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700 font-medium flex items-center justify-center gap-1.5">
                        <CheckCircle size={16} />
                        <span>{successMsg}</span>
                    </div>
                )}

                {/* 6-Digit OTP Box */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex justify-center items-center gap-2">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                ref={inputRefs[index]}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-11 h-12 text-center text-xl font-bold font-mono rounded-lg border border-gray-300 bg-gray-50 text-gray-900 focus:border-red-700 focus:bg-white focus:outline-none transition-colors shadow-xs"
                                disabled={loading}
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={loading || otp.join("").length < 6}
                        className="btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : (locale === "bn" ? "অ্যাকাউন্ট ভেরিফাই করুন" : "Verify Account")}
                    </button>
                </form>

                {/* Resend Code Section */}
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                        {locale === "bn" ? "কোড পাননি?" : "Didn't receive code?"}
                    </span>
                    <button
                        onClick={handleResend}
                        disabled={resendTimer > 0 || resending}
                        className="font-semibold text-red-700 hover:text-red-800 disabled:text-gray-400 flex items-center gap-1 cursor-pointer"
                    >
                        {resending ? (
                            <Loader2 size={14} className="animate-spin" />
                        ) : resendTimer > 0 ? (
                            <span>{locale === "bn" ? `আবার পাঠান (${resendTimer}s)` : `Resend in ${resendTimer}s`}</span>
                        ) : (
                            <span className="flex items-center gap-1">
                                <RefreshCw size={14} /> {locale === "bn" ? "কোড পুনরায় পাঠান" : "Resend Code"}
                            </span>
                        )}
                    </button>
                </div>

                <div className="mt-4 pt-2">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 font-medium"
                    >
                        <ArrowLeft size={14} /> {locale === "bn" ? "লগইন পেজে ফিরুন" : "Back to Login"}
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center py-20">
                <Loader2 size={32} className="animate-spin text-red-700" />
            </div>
        }>
            <VerifyEmailForm />
        </Suspense>
    );
}
