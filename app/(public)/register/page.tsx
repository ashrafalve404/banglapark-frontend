"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { authApi } from "@/lib/api/auth";
import { useLocale } from "@/lib/i18n";

import { Suspense } from "react";

const registerSchema = z.object({
    name: z.string().min(2, "নাম কমপক্ষে ২ অক্ষরের হতে হবে"),
    email: z.string().email("সঠিক ইমেইল এড্রেস লিখুন"),
    phone: z.string().min(10, "সঠিক মোবাইল নাম্বার দিন"),
    password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"),
    referralCode: z.string().optional(),
});

type RegisterSchemaInput = z.infer<typeof registerSchema>;

function RegisterForm() {
    const { t } = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();
    const setUser = useAuthStore((s) => s.setUser);

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [referredByCode, setReferredByCode] = useState<string | null>(null);

    // Auto-detect referral code from query params
    useEffect(() => {
        const ref = searchParams.get("ref");
        if (ref) {
            setReferredByCode(ref);
        }
    }, [searchParams]);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm<RegisterSchemaInput>({
        resolver: zodResolver(registerSchema),
    });

    // Inject referral code automatically if present in URL query
    useEffect(() => {
        if (referredByCode) {
            setValue("referralCode", referredByCode);
        }
    }, [referredByCode, setValue]);

    const onSubmit = async (data: RegisterSchemaInput) => {
        setError(null);
        setLoading(true);
        try {
            const res = await authApi.register(data);
            authApi.saveTokens({
                accessToken: res.accessToken,
                refreshToken: res.refreshToken,
            });
            setUser(res.user);
            router.push("/dashboard");
            router.refresh();
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                t("auth.register.error.default")
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="card-flat w-full max-w-md p-8">
                <div className="text-center mb-6">
                    <img src="/logo.png" alt="Bangla Park" className="mx-auto h-14 w-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900">{t("auth.register.heading")}</h2>
                    <p className="mt-2 text-sm text-gray-500">{t("auth.register.subheading")}</p>
                </div>

                {referredByCode && (
                    <div className="mb-4 rounded-lg bg-orange-50 p-3.5 text-xs text-amber-800 font-medium">
                        {t("auth.register.referralDetected")} <strong className="text-amber-900">{referredByCode}</strong>
                    </div>
                )}

                {error && (
                    <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600 font-medium">
                        {error}
                    </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
                    <div>
                        <label className="label mb-1 block">{t("auth.register.nameLabel")}</label>
                        <input
                            type="text"
                            className="input text-left"
                            placeholder={t("auth.register.namePlaceholder")}
                            {...register("name")}
                        />
                        {errors.name && (
                            <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="label mb-1 block">{t("auth.register.emailLabel")}</label>
                        <input
                            type="email"
                            className="input text-left"
                            placeholder="name@example.com"
                            {...register("email")}
                        />
                        {errors.email && (
                            <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="label mb-1 block">{t("auth.register.phoneLabel")}</label>
                        <input
                            type="text"
                            className="input text-left"
                            placeholder={t("auth.register.phonePlaceholder")}
                            {...register("phone")}
                        />
                        {errors.phone && (
                            <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="label mb-1 block">{t("auth.register.passwordLabel")}</label>
                        <input
                            type="password"
                            className="input text-left"
                            placeholder="••••••••"
                            {...register("password")}
                        />
                        {errors.password && (
                            <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="label mb-1 block">{t("auth.register.referralCodeLabel")}</label>
                        <input
                            type="text"
                            className="input text-left font-bold"
                            placeholder={t("auth.register.referralCodePlaceholder")}
                            {...register("referralCode")}
                            readOnly={!!referredByCode}
                        />
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                        {loading ? t("auth.register.submit.loading") : t("auth.register.submit.text")}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    {t("auth.register.footer.hasAccount")}{" "}
                    <Link href="/login" className="font-semibold text-green-800 hover:underline">
                        {t("auth.register.footer.loginLink")}
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function RegisterPage() {
    const { t } = useLocale();
    return (
        <Suspense fallback={
            <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
                <div className="text-center space-y-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-700 border-t-transparent mx-auto"></div>
                    <p className="text-xs text-gray-500">{t("auth.register.suspense.loading")}</p>
                </div>
            </div>
        }>
            <RegisterForm />
        </Suspense>
    );
}
