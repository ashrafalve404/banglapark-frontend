"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Check, Loader2, Users, TrendingUp, Banknote, Calendar, ShieldCheck } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

export default function AdminCommissionRulesPage() {
    const { t, locale } = useLocale();
    const queryClient = useQueryClient();
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const { data: config, isLoading: configLoading } = useQuery({
        queryKey: ["admin-system-config"],
        queryFn: () => adminApi.getConfig(),
    });

    const { data: stats } = useQuery({
        queryKey: ["admin-stats"],
        queryFn: () => adminApi.stats(),
    });

    const [minUnlockAmount, setMinUnlockAmount] = useState(2000);
    const [validDays, setValidDays] = useState(30);
    const [deliveryChargeInsideDhaka, setDeliveryChargeInsideDhaka] = useState(60);
    const [deliveryChargeOutsideDhaka, setDeliveryChargeOutsideDhaka] = useState(150);

    useEffect(() => {
        if (config && Array.isArray(config)) {
            const minUnlockObj = config.find(c => c.key === "minUnlockAmount");
            const validityObj = config.find(c => c.key === "activationValidityDays");
            const insideObj = config.find(c => c.key === "deliveryChargeInsideDhaka");
            const outsideObj = config.find(c => c.key === "deliveryChargeOutsideDhaka");

            if (minUnlockObj) setMinUnlockAmount(Number(minUnlockObj.value));
            if (validityObj) setValidDays(Number(validityObj.value));
            if (insideObj) setDeliveryChargeInsideDhaka(Number(insideObj.value));
            if (outsideObj) setDeliveryChargeOutsideDhaka(Number(outsideObj.value));
        }
    }, [config]);

    const updateMutation = useMutation({
        mutationFn: async (payload: {
            minUnlockAmount: number;
            activationValidityDays: number;
            deliveryChargeInsideDhaka: number;
            deliveryChargeOutsideDhaka: number;
        }) => {
            await Promise.all([
                adminApi.setConfig("minUnlockAmount", payload.minUnlockAmount.toString()),
                adminApi.setConfig("activationValidityDays", payload.activationValidityDays.toString()),
                adminApi.setConfig("deliveryChargeInsideDhaka", payload.deliveryChargeInsideDhaka.toString()),
                adminApi.setConfig("deliveryChargeOutsideDhaka", payload.deliveryChargeOutsideDhaka.toString()),
            ]);
        },
        onSuccess: () => {
            setMsg({ type: "success", text: t("admin.commissionRules.updateSuccess") });
            queryClient.invalidateQueries({ queryKey: ["admin-system-config"] });
            setTimeout(() => setMsg(null), 3000);
        },
        onError: (err: any) => {
            setMsg({ type: "error", text: err.response?.data?.message || t("admin.commissionRules.updateError") });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);
        updateMutation.mutate({
            minUnlockAmount,
            activationValidityDays: validDays,
            deliveryChargeInsideDhaka,
            deliveryChargeOutsideDhaka,
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">{t("admin.commissionRules.heading")}</h1>
                <p className="text-sm text-slate-500">{t("admin.commissionRules.subheading")}</p>
            </div>

            {msg && (
                <div className={`rounded-xl p-4 text-xs font-semibold ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                    {msg.text}
                </div>
            )}

            {/* ── Summary Bar ── */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card p-4 bg-white flex items-center gap-3.5">
                    <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-700">
                        <Users size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">{t("admin.commissionRules.summary.activeUsers")}</span>
                        <span className="text-xl font-bold text-slate-800">{stats?.users?.active ?? "..."}</span>
                    </div>
                </div>
                <div className="card p-4 bg-white flex items-center gap-3.5">
                    <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-700">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">{t("admin.commissionRules.summary.commissionPaid")}</span>
                        <span className="text-xl font-bold text-slate-800">{stats ? formatCurrency(stats.totalCommissionsPaid, locale) : "..."}</span>
                    </div>
                </div>
                <div className="card p-4 bg-white flex items-center gap-3.5">
                    <div className="rounded-lg bg-amber-50 p-2.5 text-amber-700">
                        <Banknote size={20} />
                    </div>
                    <div>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">{t("admin.commissionRules.withdrawal.minLabel")}</span>
                        <span className="text-xl font-bold text-slate-800">{t("admin.commissionRules.withdrawal.minValue")}</span>
                    </div>
                </div>
            </div>

            {configLoading ? (
                <div className="py-20 flex justify-center">
                    <Loader2 className="animate-spin text-slate-700" size={32} />
                </div>
            ) : (
                <>
                    {/* ── Withdrawal Rules ── */}
                    <div className="card p-6 bg-white">
                        <div className="flex items-center gap-2.5 mb-3">
                            <ShieldCheck size={18} className="text-slate-700" />
                            <h2 className="text-base font-bold text-slate-800">{t("admin.commissionRules.withdrawal.heading")}</h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="rounded-lg border border-slate-200 p-4 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <Banknote size={16} className="text-slate-500" />
                                    <span className="text-sm font-semibold text-slate-700">{t("admin.commissionRules.withdrawal.minLabel")}</span>
                                </div>
                                <span className="text-sm font-bold text-slate-900">{t("admin.commissionRules.withdrawal.minValue")}</span>
                            </div>
                            <div className="rounded-lg border border-slate-200 p-4 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <Calendar size={16} className="text-slate-500" />
                                    <span className="text-sm font-semibold text-slate-700">{t("admin.commissionRules.withdrawal.dayLabel")}</span>
                                </div>
                                <span className="text-sm font-bold text-rose-700">{t("admin.commissionRules.withdrawal.dayValue")}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Business Rules Settings Form ── */}
                    <form onSubmit={handleSubmit} className="card p-6 lg:p-8 bg-white space-y-6">
                        <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">{t("admin.commissionRules.form.heading")}</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="label mb-1.5 block">{t("admin.commissionRules.form.activationLimit")}</label>
                                <input type="number" className="input text-left font-bold" value={minUnlockAmount} onChange={(e) => setMinUnlockAmount(Number(e.target.value))} />
                                <span className="text-[10px] text-gray-400 mt-1 block">{t("admin.commissionRules.form.activationLimitHint")}</span>
                            </div>
                            <div>
                                <label className="label mb-1.5 block">{t("admin.commissionRules.form.validityDays")}</label>
                                <input type="number" className="input text-left font-bold" value={validDays} onChange={(e) => setValidDays(Number(e.target.value))} />
                                <span className="text-[10px] text-gray-400 mt-1 block">{t("admin.commissionRules.form.validityDaysHint")}</span>
                            </div>
                            <div>
                                <label className="label mb-1.5 block">{t("admin.commissionRules.form.deliveryChargeInside")}</label>
                                <input type="number" className="input text-left font-bold" value={deliveryChargeInsideDhaka} onChange={(e) => setDeliveryChargeInsideDhaka(Number(e.target.value))} />
                                <span className="text-[10px] text-gray-400 mt-1 block">{t("admin.commissionRules.form.deliveryChargeInsideHint")}</span>
                            </div>
                            <div>
                                <label className="label mb-1.5 block">{t("admin.commissionRules.form.deliveryChargeOutside")}</label>
                                <input type="number" className="input text-left font-bold" value={deliveryChargeOutsideDhaka} onChange={(e) => setDeliveryChargeOutsideDhaka(Number(e.target.value))} />
                                <span className="text-[10px] text-gray-400 mt-1 block">{t("admin.commissionRules.form.deliveryChargeOutsideHint")}</span>
                            </div>
                        </div>
                        <button type="submit" disabled={updateMutation.isPending} className="btn-primary w-full py-3 flex items-center justify-center gap-1.5 font-bold">
                            <Check size={18} /> {t("admin.commissionRules.form.submit")}
                        </button>
                    </form>

                    {/* ── All Bonus & Commission Rules Breakdown ── */}
                    <div className="space-y-4 pt-2">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <TrendingUp size={20} className="text-indigo-600" />
                            {locale === "bn" ? "সকল বোনাস ও কমিশন রুলসের তালিকা" : "All Bonus & Commission Rules Overview"}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* 1. Sales Bonus */}
                            <div className="card p-5 bg-white border border-slate-200 hover:border-emerald-300 transition-all space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
                                        <TrendingUp size={18} />
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-sm">
                                        {locale === "bn" ? "সেলস বোনাস (ডাইনামিক টিয়ার)" : "Sales Bonus (Dynamic Tier)"}
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    {locale === "bn"
                                        ? "আপনার ডাউনলাইনের প্রতিটি সক্রিয় মেম্বারের জন্য প্রতিদিন ১ টাকা সেলস বোনাস যোগ হবে।"
                                        : "Earn BDT 1 daily per active member in your downline team directly into your wallet."}
                                </p>
                                <div className="bg-emerald-50/60 rounded-lg p-2.5 text-[11px] font-bold text-emerald-900 flex justify-between border border-emerald-100">
                                    <span>{locale === "bn" ? "হিসাব সূত্র:" : "Formula:"}</span>
                                    <span>{locale === "bn" ? "সক্রিয় মেম্বার × ৳১ / দিন" : "Active Members × ৳1 / day"}</span>
                                </div>
                            </div>

                            {/* 2. Daily Base Benefit */}
                            <div className="card p-5 bg-white border border-slate-200 hover:border-indigo-300 transition-all space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
                                        <Calendar size={18} />
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-sm">
                                        {locale === "bn" ? "দৈনিক বেসিক বেনিফিট" : "Base Daily Benefit"}
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    {locale === "bn"
                                        ? "প্রতিটি সক্রিয় অ্যাকাউন্টধারী মেম্বার প্রতিদিন নিশ্চিত বেসিক দৈনিক বেনিফিট পাবেন।"
                                        : "Every active user automatically earns a fixed base daily reward."}
                                </p>
                                <div className="bg-indigo-50/60 rounded-lg p-2.5 text-[11px] font-bold text-indigo-900 flex justify-between border border-indigo-100">
                                    <span>{locale === "bn" ? "দৈনিক পরিমাণ:" : "Daily Base Reward:"}</span>
                                    <span>৳১০ / দিন</span>
                                </div>
                            </div>

                            {/* 3. Generation Commission */}
                            <div className="card p-5 bg-white border border-slate-200 hover:border-amber-300 transition-all space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
                                        <Users size={18} />
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-sm">
                                        {locale === "bn" ? "জেনারেটর কমিশন (১০ জেনারেশন)" : "Generation Commission (10 Levels)"}
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    {locale === "bn"
                                        ? "রেফারকৃত নতুন মেম্বার ৳২,০০০ টাকার কোয়ালিফাইং অর্ডার দিয়ে একাউন্ট এক্টিভ করলে ১০ ধাপ পর্যন্ত কমিশন।"
                                        : "Earn 10-level commission when referred members activate account with a ৳2,000 order."}
                                </p>
                                <div className="bg-amber-50/60 rounded-lg p-2.5 text-[11px] font-bold text-amber-900 flex justify-between border border-amber-100">
                                    <span>{locale === "bn" ? "কমিশন প্রতি ধাপ:" : "Payout Per Level:"}</span>
                                    <span>৳২০০ (১০ জেনারেশন পর্যন্ত)</span>
                                </div>
                            </div>

                            {/* 4. Digital Marketing Packages */}
                            <div className="card p-5 bg-white border border-slate-200 hover:border-purple-300 transition-all space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
                                        <Banknote size={18} />
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-sm">
                                        {locale === "bn" ? "ডিজিটাল মার্কেটিং প্যাকেজ" : "Digital Marketing Investment"}
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    {locale === "bn"
                                        ? "২৪ ঘন্টা পর মূল টাকা + ০.১% প্রফিট সরাসরি ওয়ালেটে ব্যাক পাবেন (দৈনিক সর্বোচ্চ ৫টি)।"
                                        : "100% Principal + 0.1% Profit returned in 24 hours (Max 5 packages/day)."}
                                </p>
                                <div className="bg-purple-50/60 rounded-lg p-2.5 text-[11px] font-bold text-purple-900 flex justify-between border border-purple-100">
                                    <span>{locale === "bn" ? "মুনাফার হার:" : "Profit Rate:"}</span>
                                    <span>+০.১% (২৪ ঘন্টা পর)</span>
                                </div>
                            </div>
                        </div>

                        {/* 5. Position Salary Table Overview */}
                        <div className="card p-5 bg-white border border-slate-200 space-y-3">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <ShieldCheck size={18} className="text-indigo-600" />
                                {locale === "bn" ? "পদবী ও মাসিক বেতন তালিকা" : "Position Ranks & Monthly Salary Table"}
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold">
                                            <th className="p-2.5">Rank</th>
                                            <th className="p-2.5">Position Title</th>
                                            <th className="p-2.5 text-center">Required Active Members</th>
                                            <th className="p-2.5 text-right">Monthly Salary</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                                        <tr><td className="p-2.5 font-bold">1</td><td className="p-2.5">Executive Officer</td><td className="p-2.5 text-center">5,000</td><td className="p-2.5 text-right font-bold text-emerald-700">৳25,000</td></tr>
                                        <tr><td className="p-2.5 font-bold">2</td><td className="p-2.5">Executive Manager</td><td className="p-2.5 text-center">25,000</td><td className="p-2.5 text-right font-bold text-emerald-700">৳75,000</td></tr>
                                        <tr><td className="p-2.5 font-bold">3</td><td className="p-2.5">Marketing Manager</td><td className="p-2.5 text-center">75,000</td><td className="p-2.5 text-right font-bold text-emerald-700">৳150,000</td></tr>
                                        <tr><td className="p-2.5 font-bold">4</td><td className="p-2.5">District Manager</td><td className="p-2.5 text-center">200,000</td><td className="p-2.5 text-right font-bold text-emerald-700">৳300,000</td></tr>
                                        <tr><td className="p-2.5 font-bold">5</td><td className="p-2.5">Regional Manager</td><td className="p-2.5 text-center">500,000</td><td className="p-2.5 text-right font-bold text-emerald-700">৳500,000</td></tr>
                                        <tr><td className="p-2.5 font-bold">6</td><td className="p-2.5">Executive Vice President</td><td className="p-2.5 text-center">1,200,000</td><td className="p-2.5 text-right font-bold text-emerald-700">৳750,000</td></tr>
                                        <tr><td className="p-2.5 font-bold">7</td><td className="p-2.5">Additional General Manager</td><td className="p-2.5 text-center">2,500,000</td><td className="p-2.5 text-right font-bold text-emerald-700">৳1,200,000</td></tr>
                                        <tr><td className="p-2.5 font-bold">8</td><td className="p-2.5">Divisional General Manager</td><td className="p-2.5 text-center">5,000,000</td><td className="p-2.5 text-right font-bold text-emerald-700">৳2,500,000</td></tr>
                                        <tr><td className="p-2.5 font-bold">9</td><td className="p-2.5">General Manager</td><td className="p-2.5 text-center">5,000,000</td><td className="p-2.5 text-right font-bold text-emerald-700">৳7,500,000</td></tr>
                                        <tr><td className="p-2.5 font-bold">10</td><td className="p-2.5">Executive Director</td><td className="p-2.5 text-center">10,000,000</td><td className="p-2.5 text-right font-bold text-emerald-700">৳10,000,000</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
