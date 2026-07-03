"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth";
import { authApi } from "@/lib/api/auth";
import { useLocale } from "@/lib/i18n";

const loginSchema = z.object({
    email: z.string().email("সঠিক ইমেইল এড্রেস লিখুন"),
    password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"),
});

type LoginSchemaInput = z.infer<typeof loginSchema>;

function LoginForm() {
    const { t } = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get("redirect") || "/dashboard";
    const setUser = useAuthStore((s) => s.setUser);

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginSchemaInput>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginSchemaInput) => {
        setError(null);
        setLoading(true);
        try {
            const res = await authApi.login(data);
            authApi.saveTokens({
                accessToken: res.accessToken,
                refreshToken: res.refreshToken,
            });
            setUser(res.user);
            router.push(redirect);
            router.refresh();
        } catch (err: any) {
            setError(
                err.response?.data?.message || t("auth.login.error.default")
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="card-flat w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">{t("auth.login.heading")}</h2>
                    <p className="mt-2 text-sm text-gray-500">{t("auth.login.subheading")}</p>
                </div>

                {error && (
                    <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600 font-medium">
                        {error}
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div>
                        <label className="label mb-1.5 block">{t("auth.login.emailLabel")}</label>
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
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="label">{t("auth.login.passwordLabel")}</label>
                        </div>
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

                    <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                        {loading ? t("auth.login.submit.loading") : t("auth.login.submit.text")}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    {t("auth.login.footer.noAccount")}{" "}
                    <Link href="/register" className="font-semibold text-green-800 hover:underline">
                        {t("auth.login.footer.registerLink")}
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    const { t } = useLocale();
    return (
        <Suspense fallback={
            <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center">
                <div className="text-center space-y-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-700 border-t-transparent mx-auto"></div>
                    <p className="text-xs text-gray-500">{t("auth.login.suspense.loading")}</p>
                </div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
