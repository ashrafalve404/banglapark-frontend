"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState, useEffect } from "react";
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
    confirmPassword: z.string().min(6, "পুনরায় নতুন পাসওয়ার্ড লিখুন"),
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-6">
                    <h2 className="text-base font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">{t("profile.personalInfo.heading")}</h2>
                    {profileMsg && (
                        <div className={`mb-4 rounded-lg p-3 text-xs font-semibold ${profileMsg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
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
