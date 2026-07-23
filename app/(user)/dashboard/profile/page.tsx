"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect, useRef } from "react";
import { Download, IdCard, Camera, Loader2, User as UserIcon } from "lucide-react";
import jsPDF from "jspdf";
import { useAuthStore } from "@/store/auth";
import { api } from "@/lib/api/client";
import { useLocale } from "@/lib/i18n";

const profileSchema = z.object({
    name: z.string().min(2, "নাম অবশ্যই দিতে হবে"),
    email: z.string().email("সঠিক ইমেইল দিন"),
    phone: z.string().min(10, "সঠিক মোবাইল নাম্বার দিন"),
});

const passwordSchema = z.object({
    currentPassword: z.string().min(6, "বর্তমান পাসওয়ার্ড দিন"),
    newPassword: z.string().min(6, "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে"),
    confirmPassword: z.string().min(6, "পুনরায় নতুন পাসওয়ার্ড লিখুন"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "নতুন পাসওয়ার্ড দুটি মিলছে না",
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
    const [imageUploading, setImageUploading] = useState(false);
    const [usedReferralCode, setUsedReferralCode] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        api.get("/users/profile").then((res: any) => {
            setUsedReferralCode(res.data.usedReferralCode);
            if (res.data) setUser({ ...user, ...res.data });
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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageUploading(true);
        setProfileMsg(null);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const uploadRes = await api.post("/uploads", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const imageUrl = uploadRes.data.url;

            const updateRes = await api.patch("/users/profile", { profileImage: imageUrl });
            setUser({ ...user, profileImage: imageUrl, ...updateRes.data });
            setProfileMsg({ type: "success", text: "প্রোফাইল ছবি সফলভাবে আপডেট হয়েছে!" });
        } catch (err: any) {
            setProfileMsg({ type: "error", text: err.response?.data?.message || "ছবি আপলোড করতে সমস্যা হয়েছে" });
        } finally {
            setImageUploading(false);
        }
    };

    const onUpdateProfile = async (data: ProfileInput) => {
        setProfileLoading(true);
        setProfileMsg(null);
        try {
            const res = await api.patch("/users/profile", data);
            setUser({ ...user, ...res.data });
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

    const initials = user?.name
        ? user.name.split(" ").filter(Boolean).map(n => n[0].toUpperCase()).slice(0, 2).join("")
        : "BP";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{t("profile.heading")}</h1>
                <p className="text-sm text-gray-500">{t("profile.subheading")}</p>
            </div>

            {/* Member ID Card */}
            {user?.memberId && (
                <div className="card p-6 bg-gradient-to-br from-green-900 to-green-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="relative group shrink-0">
                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/40 bg-white/20 flex items-center justify-center text-xl font-bold text-white shadow-inner">
                                {user.profileImage ? (
                                    <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{initials}</span>
                                )}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-green-200 font-medium uppercase tracking-wider">Member ID</p>
                            <p className="text-2xl font-black mt-0.5">BP-{user.memberId}</p>
                            <p className="text-xs text-green-200 mt-1">Referral Code: <span className="font-bold text-white">{user.referralCode}</span></p>
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
                        <div className={`mb-4 rounded-lg p-3 text-xs font-semibold ${profileMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                            {profileMsg.text}
                        </div>
                    )}

                    {/* Profile Picture Upload Avatar Box */}
                    <div className="flex flex-col items-center mb-6 pb-4 border-b border-gray-100">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-emerald-500/20 bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center shadow-md">
                                {imageUploading ? (
                                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                                ) : user?.profileImage ? (
                                    <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-black text-emerald-800">{initials}</span>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-6 h-6 text-white" />
                            </div>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={handleImageUpload}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={imageUploading}
                            className="mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5"
                        >
                            <Camera size={14} />
                            {imageUploading ? "আপলোড হচ্ছে..." : "প্রোফাইল ছবি পরিবর্তন করুন"}
                        </button>
                    </div>

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
                        <div className={`mb-4 rounded-lg p-3 text-xs font-semibold ${passwordMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                            {passwordMsg.text}
                        </div>
                    )}
                    <form onSubmit={handlePassSubmit(onUpdatePassword)} className="space-y-4">
                        <div>
                            <label className="label mb-1 block">{t("profile.password.currentLabel")}</label>
                            <input type="password" className="input text-left" placeholder="••••••••" {...regPass("currentPassword")} />
                        </div>
                        <div>
                            <label className="label mb-1 block">{t("profile.password.newLabel")}</label>
                            <input type="password" className="input text-left" placeholder="••••••••" {...regPass("newPassword")} />
                        </div>
                        <div>
                            <label className="label mb-1 block">{t("profile.password.confirmLabel")}</label>
                            <input type="password" className="input text-left" placeholder="••••••••" {...regPass("confirmPassword")} />
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
