"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Edit3, Check, Loader2 } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

export default function AdminCommissionRulesPage() {
    const { t } = useLocale();
    const queryClient = useQueryClient();
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Read current system config parameters (e.g. settings)
    const { data: config, isLoading } = useQuery({
        queryKey: ["admin-system-config"],
        queryFn: () => adminApi.getConfig(),
    });

    const [minUnlockAmount, setMinUnlockAmount] = useState(2000);
    const [gen1Amt, setGen1Amt] = useState(200);
    const [gen2Amt, setGen2Amt] = useState(10);
    const [validDays, setValidDays] = useState(30);
    const [deliveryChargeInsideDhaka, setDeliveryChargeInsideDhaka] = useState(60);
    const [deliveryChargeOutsideDhaka, setDeliveryChargeOutsideDhaka] = useState(150);

    // Pre-fill fields once data returns
    useEffect(() => {
        if (config && Array.isArray(config)) {
            const minUnlockObj = config.find(c => c.key === "minUnlockAmount");
            const gen1Obj = config.find(c => c.key === "generationOneCommission");
            const gen2Obj = config.find(c => c.key === "generationTwoToFifteenCommission");
            const validityObj = config.find(c => c.key === "activationValidityDays");
            const insideObj = config.find(c => c.key === "deliveryChargeInsideDhaka");
            const outsideObj = config.find(c => c.key === "deliveryChargeOutsideDhaka");

            if (minUnlockObj) setMinUnlockAmount(Number(minUnlockObj.value));
            if (gen1Obj) setGen1Amt(Number(gen1Obj.value));
            if (gen2Obj) setGen2Amt(Number(gen2Obj.value));
            if (validityObj) setValidDays(Number(validityObj.value));
            if (insideObj) setDeliveryChargeInsideDhaka(Number(insideObj.value));
            if (outsideObj) setDeliveryChargeOutsideDhaka(Number(outsideObj.value));
        }
    }, [config]);

    // Update configuration parameters mutation
    const updateMutation = useMutation({
        mutationFn: async (payload: {
            minUnlockAmount: number;
            generationOneCommission: number;
            generationTwoToFifteenCommission: number;
            activationValidityDays: number;
            deliveryChargeInsideDhaka: number;
            deliveryChargeOutsideDhaka: number;
        }) => {
            await Promise.all([
                adminApi.setConfig("minUnlockAmount", payload.minUnlockAmount.toString()),
                adminApi.setConfig("generationOneCommission", payload.generationOneCommission.toString()),
                adminApi.setConfig("generationTwoToFifteenCommission", payload.generationTwoToFifteenCommission.toString()),
                adminApi.setConfig("activationValidityDays", payload.activationValidityDays.toString()),
                adminApi.setConfig("deliveryChargeInsideDhaka", payload.deliveryChargeInsideDhaka.toString()),
                adminApi.setConfig("deliveryChargeOutsideDhaka", payload.deliveryChargeOutsideDhaka.toString()),
            ]);
        },
        onSuccess: () => {
            setMsg({ type: "success", text: t("admin.commissionRules.updateSuccess") });
            queryClient.invalidateQueries({ queryKey: ["admin-system-config"] });
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
            generationOneCommission: gen1Amt,
            generationTwoToFifteenCommission: gen2Amt,
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
                <div className={`rounded-xl p-4 text-xs font-semibold ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-green-50 text-green-650"}`}>
                    {msg.text}
                </div>
            )}

            {isLoading ? (
                <div className="py-20 flex justify-center">
                    <Loader2 className="animate-spin text-slate-700" size={32} />
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="card p-6 lg:p-8 bg-white space-y-6 max-w-2xl">
                    <h2 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">{t("admin.commissionRules.form.heading")}</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Min Activation Product amount threshold */}
                        <div>
                            <label className="label mb-1.5 block">{t("admin.commissionRules.form.activationLimit")}</label>
                            <input
                                type="number"
                                className="input text-left font-bold"
                                value={minUnlockAmount}
                                onChange={(e) => setMinUnlockAmount(Number(e.target.value))}
                            />
                            <span className="text-[10px] text-gray-400 mt-1 block">{t("admin.commissionRules.form.activationLimitHint")}</span>
                        </div>

                        {/* Expire / Validity Days */}
                        <div>
                            <label className="label mb-1.5 block">{t("admin.commissionRules.form.validityDays")}</label>
                            <input
                                type="number"
                                className="input text-left font-bold"
                                value={validDays}
                                onChange={(e) => setValidDays(Number(e.target.value))}
                            />
                            <span className="text-[10px] text-gray-400 mt-1 block">{t("admin.commissionRules.form.validityDaysHint")}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-100 pt-4">
                        {/* Generation 1 Direct Commission amount */}
                        <div>
                            <label className="label mb-1.5 block">{t("admin.commissionRules.form.level1Commission")}</label>
                            <input
                                type="number"
                                className="input text-left font-bold text-green-800"
                                value={gen1Amt}
                                onChange={(e) => setGen1Amt(Number(e.target.value))}
                            />
                            <span className="text-[10px] text-gray-400 mt-1 block">{t("admin.commissionRules.form.level1CommissionHint")}</span>
                        </div>

                        {/* Generation 2-15 downline level indirect commission amount */}
                        <div>
                            <label className="label mb-1.5 block">{t("admin.commissionRules.form.level2to15Commission")}</label>
                            <input
                                type="number"
                                className="input text-left font-bold text-green-850"
                                value={gen2Amt}
                                onChange={(e) => setGen2Amt(Number(e.target.value))}
                            />
                            <span className="text-[10px] text-gray-400 mt-1 block">{t("admin.commissionRules.form.level2to15CommissionHint")}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-t border-slate-100 pt-4">
                        <div>
                            <label className="label mb-1.5 block">{t("admin.commissionRules.form.deliveryChargeInside")}</label>
                            <input
                                type="number"
                                className="input text-left font-bold text-green-800"
                                value={deliveryChargeInsideDhaka}
                                onChange={(e) => setDeliveryChargeInsideDhaka(Number(e.target.value))}
                            />
                            <span className="text-[10px] text-gray-400 mt-1 block">{t("admin.commissionRules.form.deliveryChargeInsideHint")}</span>
                        </div>

                        <div>
                            <label className="label mb-1.5 block">{t("admin.commissionRules.form.deliveryChargeOutside")}</label>
                            <input
                                type="number"
                                className="input text-left font-bold text-green-800"
                                value={deliveryChargeOutsideDhaka}
                                onChange={(e) => setDeliveryChargeOutsideDhaka(Number(e.target.value))}
                            />
                            <span className="text-[10px] text-gray-400 mt-1 block">{t("admin.commissionRules.form.deliveryChargeOutsideHint")}</span>
                        </div>
                    </div>

                    <button type="submit" disabled={updateMutation.isPending} className="btn-primary w-full py-3 flex items-center justify-center gap-1.5 font-bold">
                        <Check size={18} /> {t("admin.commissionRules.form.submit")}
                    </button>
                </form>
            )}
        </div>
    );
}
