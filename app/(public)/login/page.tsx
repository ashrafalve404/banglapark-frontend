"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { authApi } from "@/lib/api/auth";
import { useLocale } from "@/lib/i18n";

const loginSchema = z.object({
    email: z.string().email("à¦¸à¦ à¦¿à¦• à¦‡à¦®à§‡à¦‡à¦² à¦à¦¡à§à¦°à§‡à¦¸ à¦²à¦¿à¦–à§à¦¨"),
    password: z.string().min(6, "à¦ªà¦¾à¦¸à¦“à¦¯à¦¼à¦¾à¦°à§à¦¡ à¦•à¦®à¦ªà¦•à§à¦·à§‡ à§¬ à¦…à¦•à§à¦·à¦°à§‡à¦° à¦¹à¦¤à§‡ à¦¹à¦¬à§‡"),
});

type LoginSchemaInput = z.infer<typeof loginSchema>;

function LoginForm() {
    const { t } = useLocale();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectParam = searchParams.get("redirect");
    const setUser = useAuthStore((s) => s.setUser);

    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
        if (!credentialResponse.credential) return;
        setError(null);
        setGoogleLoading(true);
        try {
            const res = await authApi.googleLogin(credentialResponse.credential);
            authApi.saveTokens({
                accessToken: res.accessToken,
                refreshToken: res.refreshToken,
            });
            setUser(res.user);
            router.push(redirectParam || (res.user.role === "ADMIN" || res.user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard"));
            router.refresh();
        } catch (err: any) {
            setError(err.response?.data?.message || "Google login failed");
        } finally {
            setGoogleLoading(false);
        }
    };

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
            router.push(redirectParam || (res.user.role === "ADMIN" || res.user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard"));
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
                    <img src="/logo.png?v=2" alt="Bangla Park" className="mx-auto h-14 w-auto mb-4" />
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
                            placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
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

                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-3 text-gray-400">or</span></div>
                </div>

                <div className="flex justify-center">
                    {googleLoading ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="animate-spin" size={16} /> Connecting...</div>
                    ) : (
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError("Google login failed")}
                            theme="outline"
                            size="large"
                            text="signin_with"
                            shape="rectangular"
                            width={300}
                        />
                    )}
                </div>

                <div className="mt-6 text-center text-sm text-gray-500">
                    {t("auth.login.footer.noAccount")}{" "}
                    <Link href="/register" className="font-semibold text-red-800 hover:underline">
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
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-700 border-t-transparent mx-auto"></div>
                    <p className="text-xs text-gray-500">{t("auth.login.suspense.loading")}</p>
                </div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
