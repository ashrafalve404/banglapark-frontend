"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
import { Download, IdCard } from "lucide-react";
import jsPDF from "jspdf";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api/client";
import { useLocale } from "@/lib/i18n";

const profileSchema = z.object({
    name: z.string().min(2, "à¦¨à¦¾à¦® à¦…à¦¬à¦¶à§à¦¯à¦‡ à¦¦à¦¿à¦¤à§‡ à¦¹à¦¬à§‡"),
    email: z.string().email("à¦¸à¦ à¦¿à¦• à¦‡à¦®à§‡à¦‡à¦² à¦¦à¦¿à¦¨"),
    phone: z.string().min(10, "à¦¸à¦ à¦¿à¦• à¦®à§‹à¦¬à¦¾à¦‡à¦² à¦¨à¦¾à¦®à§à¦¬à¦¾à¦° à¦¦à¦¿à¦¨"),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(6, "à¦¬à¦°à§à¦¤à¦®à¦¾à¦¨ à¦ªà¦¾à¦¸à¦“à¦¯à¦¼à¦¾à¦°à§à¦¡ à¦¦à¦¿à¦¨"),
    newPassword: z.string().min(6, "à¦¨à¦¤à§à¦¨ à¦ªà¦¾à¦¸à¦“à¦¯à¦¼à¦¾à¦°à§à¦¡ à¦•à¦®à¦ªà¦•à§à¦·à§‡ à§¬ à¦…à¦•à§à¦·à¦°à§‡à¦° à¦¹à¦¤à§‡ à¦¹à¦¬à§‡"),
    confirmPassword: z.string().min(6, "à¦ªà§à¦¨à¦°à¦¾à§Ÿ à¦¨à¦¤à§à¦¨ à¦ªà¦¾à¦¸à¦“à¦¯à¦¼à¦¾à¦°à§à¦¡ à¦²à¦¿à¦–à§à¦¨"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "à¦¨à¦¤à§à¦¨ à¦ªà¦¾à¦¸à¦“à¦¯à¦¼à¦¾à¦°à§à¦¡ à¦¦à§à¦Ÿà¦¿ à¦®à¦¿à¦²à¦›à§‡ à¦¨à¦¾",
    path: ["confirmPassword"],
});

type ProfileInput = z.infer<typeof profileSchema>;
type PasswordInput = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
    const { user, setUser } = useAuthStore();
    const { t } = useLocale();
    const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [profileLoading, setProfileLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [usedReferralCode, setUsedReferralCode] = useState<string | null>(null);

    useEffect(() => {
        api.get("/users/profile").then((res: any) => {
            setUsedReferralCode(res.data.usedReferralCode);
        }).catch(() => {});
    }, []);

    const downloadPDF = () => {
        if (!user) return;
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
        const idText = `ID: BP-${user.memberId || "N/A"}`;
        doc.text(idText, pageW / 2, y, { align: "center" });
        y += 10;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const refDisplay = usedReferralCode || "No code used";
        const fields = [
            { label: "Name", value: user.name },
            { label: "Email", value: user.email },
            { label: "Phone", value: user.phone },
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

        doc.save(`BanglaPark_Member_BP-${user.memberId || "N/A"}.pdf`);
    };

    const { register: regProfile, handleSubmit: handleProfileSubmit, setValue } = useForm<ProfileInput>({
        resolver: zodResolver(profileSchema),
    });

    const { register: regPass, handleSubmit: handlePassSubmit, reset: resetPass } = useForm<PasswordInput>({
        resolver: zodResolver(passwordSchema),
    });

    useEffect(() => {
        if (user) {
            setValue("name", user.name);
            setValue("email", user.email);
            setValue("phone", user.phone);
        }
    }, [user, setValue]);

    const onUpdateProfile = async (data: ProfileInput) => {
        setProfileLoading(true);
        setProfileMsg(null);
        try {
            const res = await api.patch("/users/profile", data);
            setUser(res.data);
            setProfileMsg({ type: "success", text: t("profile.msg.updateSuccess") });
        } catch (err: any) {
            setProfileMsg({ type: "error", text: err.response?.data?.message || t("profile.msg.updateError") });
        } finally {
            setProfileLoading(false);
        }
    };

    const onUpdatePassword = async (data: PasswordInput) => {
        setPasswordLoading(true);
        setPasswordMsg(null);
        try {
            await api.patch("/users/change-password", {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            setPasswordMsg({ type: "success", text: t("profile.msg.passwordSuccess") });
            resetPass();
        } catch (err: any) {
            setPasswordMsg({ type: "error", text: err.response?.data?.message || t("profile.msg.passwordError") });
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{t("profile.heading")}</h1>
                <p className="text-sm text-gray-500">{t("profile.subheading")}</p>
            </div>

            {/* Member ID Card */}
            {user?.memberId && (
                <div className="card p-6 bg-gradient-to-br from-red-900 to-red-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                            <IdCard size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-red-200 font-medium uppercase tracking-wider">Member ID</p>
                            <p className="text-2xl font-black mt-0.5">BP-{user.memberId}</p>
                            <p className="text-xs text-red-200 mt-1">Referral Code: <span className="font-bold text-white">{user.referralCode}</span></p>
                        </div>
                    </div>
                    <button onClick={downloadPDF} className="flex items-center gap-2 rounded-lg bg-white/20 hover:bg-white/30 px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap">
                        <Download size={16} /> Download ID Card
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-6">
                    <h2 className="text-base font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">{t("profile.personalInfo.heading")}</h2>
                    {profileMsg && (
                        <div className={`mb-4 rounded-lg p-3 text-xs font-semibold ${profileMsg.type === "success" ? "bg-red-50 text-red-700" : "bg-red-50 text-red-600"}`}>
                            {profileMsg.text}
                        </div>
                    )}
                    <form onSubmit={handleProfileSubmit(onUpdateProfile)} className="space-y-4">
                        <div>
                            <label className="label mb-1 block">{t("profile.personalInfo.nameLabel")}</label>
                            <input type="text" className="input text-left" {...regProfile("name")} />
                        </div>
                        <div>
                            <label className="label mb-1 block">{t("profile.personalInfo.emailLabel")}</label>
                            <input type="email" className="input text-left" {...regProfile("email")} />
                        </div>
                        <div>
                            <label className="label mb-1 block">{t("profile.personalInfo.phoneLabel")}</label>
                            <input type="text" className="input text-left" {...regProfile("phone")} />
                        </div>
                        <button type="submit" disabled={profileLoading} className="btn-primary w-full">
                            {profileLoading ? t("profile.personalInfo.submit.loading") : t("profile.personalInfo.submit.text")}
                        </button>
                    </form>
                </div>

                <div className="card p-6">
                    <h2 className="text-base font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">{t("profile.password.heading")}</h2>
                    {passwordMsg && (
                        <div className={`mb-4 rounded-lg p-3 text-xs font-semibold ${passwordMsg.type === "success" ? "bg-red-50 text-red-700" : "bg-red-50 text-red-600"}`}>
                            {passwordMsg.text}
                        </div>
                    )}
                    <form onSubmit={handlePassSubmit(onUpdatePassword)} className="space-y-4">
                        <div>
                            <label className="label mb-1 block">{t("profile.password.currentLabel")}</label>
                            <input type="password" className="input text-left" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" {...regPass("currentPassword")} />
                        </div>
                        <div>
                            <label className="label mb-1 block">{t("profile.password.newLabel")}</label>
                            <input type="password" className="input text-left" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" {...regPass("newPassword")} />
                        </div>
                        <div>
                            <label className="label mb-1 block">{t("profile.password.confirmLabel")}</label>
                            <input type="password" className="input text-left" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" {...regPass("confirmPassword")} />
                        </div>
                        <button type="submit" disabled={passwordLoading} className="btn-primary w-full">
                            {passwordLoading ? t("profile.password.submit.loading") : t("profile.password.submit.text")}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
