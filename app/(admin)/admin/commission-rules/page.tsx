"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Check, Loader2, Users, TrendingUp, DollarSign, Calendar, ShieldCheck } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

export default function AdminCommissionRulesPage() {
    const { t } = useLocale();
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
                        <span className="text-xl font-bold text-slate-800">{stats ? formatCurrency(stats.totalCommissionsPaid) : "..."}</span>
                    </div>
                </div>
                <div className="card p-4 bg-white flex items-center gap-3.5">
                    <div className="rounded-lg bg-amber-50 p-2.5 text-amber-700">
                        <DollarSign size={20} />
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
                                    <DollarSign size={16} className="text-slate-500" />
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

                    {/* ── Commission Rules Images ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="card overflow-hidden bg-white">
                            <img
                                src="/images/comissionrulesimage1.jpeg"
                                alt="Commission rules overview"
                                className="w-full h-auto object-contain"
                            />
                        </div>
                        <div className="card overflow-hidden bg-white">
                            <img
                                src="/images/comissionrulesimage2.jpeg"
                                alt="Commission rules details"
                                className="w-full h-auto object-contain"
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
