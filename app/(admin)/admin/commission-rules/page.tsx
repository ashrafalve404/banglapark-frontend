"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Check, Loader2, Users, TrendingUp, Info, DollarSign, GitBranch, Calendar, ShieldCheck, Award } from "lucide-react";
import { adminApi } from "@/lib/api/admin";
import { dailyBenefitApi } from "@/lib/api/commissions";
import { formatCurrency } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

const GEN_LEVELS = 10;
const GEN_AMOUNT = 200;

const GEN_TIERS = [
    { minCount: 10000, amount: 5000 },
    { minCount: 5000, amount: 2000 },
    { minCount: 500, amount: 1000 },
    { minCount: 100, amount: 500 },
    { minCount: 50, amount: 300 },
    { minCount: 20, amount: 200 },
    { minCount: 5, amount: 100 },
];

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

    const { data: benefitTiers } = useQuery({
        queryKey: ["benefit-tiers"],
        queryFn: () => dailyBenefitApi.tiers(),
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

    const genLevels = Array.from({ length: GEN_LEVELS }, (_, i) => ({
        level: i + 1,
        type: i === 0 ? t("admin.commissionRules.genCommission.direct") : t("admin.commissionRules.genCommission.indirect"),
        amount: GEN_AMOUNT,
        cumulative: GEN_AMOUNT * (i + 1),
    }));

    const isLoading = configLoading;

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

            {isLoading ? (
                <div className="py-20 flex justify-center">
                    <Loader2 className="animate-spin text-slate-700" size={32} />
                </div>
            ) : (
                <>
                    {/* ── Generation Commission Table ── */}
                    <div className="card p-6 bg-white">
                        <div className="flex items-center gap-2.5 mb-1">
                            <GitBranch size={18} className="text-slate-700" />
                            <h2 className="text-base font-bold text-slate-800">{t("admin.commissionRules.genCommission.heading")}</h2>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">{t("admin.commissionRules.genCommission.subheading")}</p>

                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-800 text-white text-xs">
                                        <th className="p-3 font-semibold">{t("admin.commissionRules.genCommission.colLevel")}</th>
                                        <th className="p-3 font-semibold">{t("admin.commissionRules.genCommission.colType")}</th>
                                        <th className="p-3 font-semibold text-right">{t("admin.commissionRules.genCommission.colAmount")}</th>
                                        <th className="p-3 font-semibold text-right">{t("admin.commissionRules.genCommission.colTotal")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {genLevels.map((row) => (
                                        <tr key={row.level} className={`hover:bg-slate-50 ${row.level === 1 ? "bg-indigo-50/40" : ""}`}>
                                            <td className="p-3 font-bold text-slate-700">{row.level}</td>
                                            <td className="p-3 text-slate-600">{row.type}</td>
                                            <td className="p-3 text-right font-bold text-emerald-700">+{formatCurrency(row.amount)}</td>
                                            <td className="p-3 text-right font-bold text-slate-800">{formatCurrency(row.cumulative)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-100 text-xs font-bold">
                                        <td colSpan={3} className="p-3 text-slate-700">{t("admin.commissionRules.genCommission.totalLabel")}</td>
                                        <td className="p-3 text-right text-slate-900">{formatCurrency(GEN_LEVELS * GEN_AMOUNT)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1.5">
                            <Info size={12} /> {t("admin.commissionRules.genCommission.note")}
                        </p>
                    </div>

                    {/* ── Daily Benefit Tiers ── */}
                    <div className="card p-6 bg-white">
                        <div className="flex items-center gap-2.5 mb-1">
                            <Award size={18} className="text-slate-700" />
                            <h2 className="text-base font-bold text-slate-800">{t("admin.commissionRules.dailyBenefit.heading")}</h2>
                        </div>
                        <p className="text-xs text-slate-500 mb-4">{t("admin.commissionRules.dailyBenefit.subheading")}</p>

                        {/* Base reward row */}
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 mb-3 flex items-center justify-between">
                            <div>
                                <span className="text-sm font-bold text-slate-800">{t("admin.commissionRules.dailyBenefit.baseLabel")}</span>
                                <span className="text-[10px] text-slate-500 block">{t("admin.commissionRules.dailyBenefit.baseDesc")}</span>
                            </div>
                            <span className="text-lg font-bold text-emerald-700">+{formatCurrency(100)}</span>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-800 text-white text-xs">
                                        <th className="p-3 font-semibold">{t("admin.commissionRules.dailyBenefit.colTeam")}</th>
                                        <th className="p-3 font-semibold text-right">{t("admin.commissionRules.dailyBenefit.colBonus")}</th>
                                        <th className="p-3 font-semibold text-right">{t("admin.commissionRules.dailyBenefit.colTotal")}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs">
                                    {GEN_TIERS.map((tier, i) => {
                                        const total = 100 + tier.amount;
                                        return (
                                            <tr key={i} className="hover:bg-slate-50">
                                                <td className="p-3 font-bold text-slate-700">≥ {tier.minCount.toLocaleString()}</td>
                                                <td className="p-3 text-right font-bold text-indigo-700">+{formatCurrency(tier.amount)}</td>
                                                <td className="p-3 text-right font-bold text-emerald-700">{formatCurrency(total)}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-100 text-xs font-bold">
                                        <td className="p-3 text-slate-700">{t("admin.commissionRules.dailyBenefit.maxLabel")}</td>
                                        <td colSpan={2} className="p-3 text-right text-slate-900">{formatCurrency(100 + (benefitTiers?.[0]?.amount ?? 5000))}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

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

                    {/* ── Example Scenario ── */}
                    <div className="card p-6 bg-gradient-to-br from-slate-800 to-slate-900 text-white">
                        <div className="flex items-center gap-2.5 mb-3">
                            <Info size={18} className="text-amber-400" />
                            <h2 className="text-base font-bold text-amber-400">{t("admin.commissionRules.example.heading")}</h2>
                        </div>
                        <p className="text-xs text-slate-300 mb-4">{t("admin.commissionRules.example.desc")}</p>
                        <div className="space-y-2 text-xs text-slate-200">
                            <div className="flex items-start gap-3">
                                <span className="rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                                <span>{t("admin.commissionRules.example.step1")}</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                                <span>{t("admin.commissionRules.example.step2")}</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                                <span>{t("admin.commissionRules.example.step3")}</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
                                <span>{t("admin.commissionRules.example.step4")}</span>
                            </div>
                            <div className="pt-2 mt-2 border-t border-slate-700 flex items-center gap-2">
                                <TrendingUp size={14} className="text-emerald-400" />
                                <span className="font-bold text-emerald-400">{t("admin.commissionRules.example.total")}</span>
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
                </>
            )}
        </div>
    );
}
