"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Download, CheckCircle, ArrowRight } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { authApi } from "@/lib/api/auth";
import { useLocale } from "@/lib/i18n";
import jsPDF from "jspdf";

import { Suspense } from "react";

const registerSchema = z.object({
    name: z.string().min(2, "à¦¨à¦¾à¦® à¦•à¦®à¦ªà¦•à§à¦·à§‡ à§¨ à¦…à¦•à§à¦·à¦°à§‡à¦° à¦¹à¦¤à§‡ à¦¹à¦¬à§‡"),
    email: z.string().email("à¦¸à¦ à¦¿à¦• à¦‡à¦®à§‡à¦‡à¦² à¦à¦¡à§à¦°à§‡à¦¸ à¦²à¦¿à¦–à§à¦¨"),
    phone: z.string().min(10, "à¦¸à¦ à¦¿à¦• à¦®à§‹à¦¬à¦¾à¦‡à¦² à¦¨à¦¾à¦®à§à¦¬à¦¾à¦° à¦¦à¦¿à¦¨"),
    password: z.string().min(6, "à¦ªà¦¾à¦¸à¦“à¦¯à¦¼à¦¾à¦°à§à¦¡ à¦•à¦®à¦ªà¦•à§à¦·à§‡ à§¬ à¦…à¦•à§à¦·à¦°à§‡à¦° à¦¹à¦¤à§‡ à¦¹à¦¬à§‡"),
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
    const [registeredUser, setRegisteredUser] = useState<any>(null);
    const [usedReferralCode, setUsedReferralCode] = useState<string | null>(null);

    const pdfRef = useRef<HTMLDivElement>(null);

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

    const downloadPDF = () => {
        if (!registeredUser) return;
        const doc = new jsPDF({ unit: "mm", format: "a5" });
        const pageW = doc.internal.pageSize.getWidth();
        let y = 20;

        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("Bangla Park Limited", pageW / 2, y, { align: "center" });
        y += 10;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text("Member Registration Card", pageW / 2, y, { align: "center" });
        y += 10;

        doc.setDrawColor(34, 197, 94);
        doc.setLineWidth(0.5);
        doc.line(20, y, pageW - 20, y);
        y += 8;

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        const idText = `ID: BP-${registeredUser.memberId}`;
        doc.text(idText, pageW / 2, y, { align: "center" });
        y += 10;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        const refDisplay = usedReferralCode || "No code used";
        const fields = [
            { label: "Name", value: registeredUser.name },
            { label: "Email", value: registeredUser.email },
            { label: "Phone", value: registeredUser.phone },
            { label: "Referral Code Used", value: refDisplay },
        ];

        for (const f of fields) {
            doc.setFont("helvetica", "bold");
            doc.text(`${f.label}:`, 25, y);
            const labelW = doc.getTextWidth(`${f.label}:`);
            doc.setFont("helvetica", "normal");
            doc.text(f.value, 25 + labelW + 3, y);
            y += 8;
        }

        y += 5;
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text("Registration Date: " + new Date().toLocaleDateString(), pageW / 2, y, { align: "center" });

        doc.save(`BanglaPark_Member_BP-${registeredUser.memberId}.pdf`);
    };

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
            setRegisteredUser(res.user);
            setUsedReferralCode(data.referralCode || null);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                t("auth.register.error.default")
            );
        } finally {
            setLoading(false);
        }
    };

    if (registeredUser) {
        return (
            <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="card-flat w-full max-w-md p-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                        <CheckCircle size={36} className="text-red-700" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h2>
                    <p className="text-sm text-gray-500 mb-4">Welcome to Bangla Park Limited</p>

                        <div ref={pdfRef} className="bg-gray-50 rounded-xl p-6 text-left space-y-2 mb-6">
                            <p className="text-center text-lg font-bold text-red-800">BP-{registeredUser.memberId}</p>
                            <div className="text-sm space-y-1">
                                <p><span className="font-semibold text-gray-700">Name:</span> {registeredUser.name}</p>
                                <p><span className="font-semibold text-gray-700">Email:</span> {registeredUser.email}</p>
                                <p><span className="font-semibold text-gray-700">Phone:</span> {registeredUser.phone}</p>
                                <p><span className="font-semibold text-gray-700">Referral Code Used:</span> {usedReferralCode || "No code used"}</p>
                            </div>
                        </div>

                    <div className="flex flex-col gap-3">
                        <button onClick={downloadPDF} className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold">
                            <Download size={18} /> Download ID Card (PDF)
                        </button>
                        <Link href="/dashboard" className="btn-secondary w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold">
                            Go to Dashboard <ArrowRight size={16} />
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="card-flat w-full max-w-md p-8">
                <div className="text-center mb-6">
                    <img src="/logo.png?v=2" alt="Bangla Park" className="mx-auto h-14 w-auto mb-4" />
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
                    <Link href="/login" className="font-semibold text-red-800 hover:underline">
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
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-700 border-t-transparent mx-auto"></div>
                    <p className="text-xs text-gray-500">{t("auth.register.suspense.loading")}</p>
                </div>
            </div>
        }>
            <RegisterForm />
        </Suspense>
    );
}
