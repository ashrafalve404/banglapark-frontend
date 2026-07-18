"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowDownToLine, HelpCircle, Loader2 } from "lucide-react";
import { withdrawalApi } from "@/lib/api/withdrawal";
import { walletApi } from "@/lib/api/wallet";
import { formatCurrency, formatDateTime, getWithdrawStatusLabel, getWithdrawMethodLabel } from "@/lib/utils";
import { useLocale } from "@/lib/i18n";

const withdrawSchema = z.object({
    amount: z.number().min(2000, "সর্বনিম্ন উত্তোলন মূল্য ৳২,০০০ হতে হবে"),
    method: z.enum(["BKASH", "NAGAD", "ROCKET", "BANK"]),
    accountNo: z.string().min(5, "হিসাব নাম্বার অথবা মোবাইল নাম্বার প্রদান করুন"),
    bankName: z.string().optional(),
    branchName: z.string().optional(),
    holderName: z.string().optional(),
});

type WithdrawSchemaInput = z.infer<typeof withdrawSchema>;

export default function WithdrawPage() {
    const { t, locale } = useLocale();
    const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);

    const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useQuery({
        queryKey: ["wallet-balance"],
        queryFn: () => walletApi.balance(),
    });

    const { data: requestsData, isLoading: reqLoading, refetch: refetchRequests } = useQuery({
        queryKey: ["withdrawals-my", page],
        queryFn: () => withdrawalApi.myRequests({ page, limit: 10 }),
    });

    const availableBalance = wallet?.availableBalance ?? 0;
    const requests = requestsData?.requests ?? [];
    const total = requestsData?.total ?? 0;
    const totalPages = Math.ceil(total / 10) || 1;

    const {
        register,
        handleSubmit,
        watch,
        reset,
        formState: { errors },
    } = useForm<WithdrawSchemaInput>({
        resolver: zodResolver(withdrawSchema),
        defaultValues: {
            method: "BKASH",
        },
    });

    const selectedMethod = watch("method");

    const onSubmit = async (data: WithdrawSchemaInput) => {
        if (data.amount > availableBalance) {
            setMsg({ type: "error", text: t("withdraw.error.insufficient") });
            return;
        }

        setLoading(true);
        setMsg(null);

        try {
            const accountDetails: Record<string, string> = {
                accountNo: data.accountNo,
            };

            if (data.method === "BANK") {
                accountDetails.bankName = data.bankName || "";
                accountDetails.branchName = data.branchName || "";
                accountDetails.holderName = data.holderName || "";
            }

            await withdrawalApi.request({
                amount: data.amount,
                method: data.method,
                accountDetails,
            });

            setMsg({ type: "success", text: t("withdraw.success") });
            reset();
            refetchWallet();
            refetchRequests();
        } catch (err: any) {
            setMsg({
                type: "error",
                text: err.response?.data?.message || t("withdraw.error.default"),
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{t("withdraw.heading")}</h1>
                <p className="text-sm text-gray-500">{t("withdraw.subheading")}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card p-6 bg-white space-y-6">
                    <h2 className="text-base font-bold text-gray-800 border-b border-gray-100 pb-2">{t("withdraw.form.heading")}</h2>

                    {msg && (
                        <div className={`rounded-lg p-4 text-xs font-semibold ${msg.type === "success" ? "bg-green-50 text-green-700" : "bg-green-50 text-green-600"}`}>
                            {msg.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="label mb-1.5 block">{t("withdraw.form.amountLabel")}</label>
                                <input
                                    type="number"
                                    className="input text-left"
                                    placeholder={t("withdraw.form.amountPlaceholder")}
                                    {...register("amount", { valueAsNumber: true })}
                                />
                                {errors.amount && (
                                    <p className="mt-1 text-xs text-red-500">{errors.amount.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="label mb-1.5 block">{t("withdraw.form.methodLabel")}</label>
                                <select className="input cursor-pointer" {...register("method")}>
                                    <option value="BKASH">{t("withdraw.form.methodBkash")}</option>
                                    <option value="NAGAD">{t("withdraw.form.methodNagad")}</option>
                                    <option value="ROCKET">{t("withdraw.form.methodRocket")}</option>
                                    <option value="BANK">{t("withdraw.form.methodBank")}</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="label mb-1.5 block">
                                    {selectedMethod === "BANK" ? t("withdraw.form.accountLabelBank") : t("withdraw.form.accountLabelMobile")}
                                </label>
                                <input
                                    type="text"
                                    className="input text-left font-semibold"
                                    placeholder={selectedMethod === "BANK" ? t("withdraw.form.accountPlaceholderBank") : t("withdraw.form.accountPlaceholderMobile")}
                                    {...register("accountNo")}
                                />
                                {errors.accountNo && (
                                    <p className="mt-1 text-xs text-red-500">{errors.accountNo.message}</p>
                                )}
                            </div>
                        </div>

                        {selectedMethod === "BANK" && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50 border border-gray-150">
                                <div>
                                    <label className="label mb-1 block">{t("withdraw.form.bankNameLabel")}</label>
                                    <input type="text" className="input text-left py-1.5 text-xs" placeholder={t("withdraw.form.bankNamePlaceholder")} {...register("bankName")} />
                                </div>
                                <div>
                                    <label className="label mb-1 block">{t("withdraw.form.branchLabel")}</label>
                                    <input type="text" className="input text-left py-1.5 text-xs" placeholder={t("withdraw.form.branchPlaceholder")} {...register("branchName")} />
                                </div>
                                <div>
                                    <label className="label mb-1 block">{t("withdraw.form.holderLabel")}</label>
                                    <input type="text" className="input text-left py-1.5 text-xs" placeholder={t("withdraw.form.holderPlaceholder")} {...register("holderName")} />
                                </div>
                            </div>
                        )}

                        <button type="submit" disabled={loading || walletLoading} className="btn-primary w-full py-3">
                            {loading ? t("withdraw.form.submit.loading") : t("withdraw.form.submit.text")}
                        </button>
                    </form>
                </div>

                <div className="space-y-4">
                    <div className="card p-6 bg-gradient-to-br from-green-900 to-green-800 text-white flex flex-col justify-between">
                        <span className="text-xs text-green-150 font-bold block mb-4 uppercase tracking-wider">{t("withdraw.sidebar.availableBalance")}</span>
                        <div>
                            <h2 className="text-3xl font-extrabold">{walletLoading ? "..." : formatCurrency(availableBalance, locale)}</h2>
                            <span className="text-xs text-green-200 mt-1 block">{t("withdraw.sidebar.minLimit")}</span>
                        </div>
                    </div>

                    <div className="card p-5 bg-white flex items-start gap-3">
                        <HelpCircle size={18} className="text-green-700 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-gray-500 space-y-1">
                            <p className="font-bold text-gray-800">{t("withdraw.sidebar.timing.heading")}</p>
                            <p>{t("withdraw.sidebar.timing.mobile")}</p>
                            <p>{t("withdraw.sidebar.timing.bank")}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-white">
                    <h3 className="text-sm font-bold text-gray-800">{t("withdraw.history.heading")}</h3>
                </div>

                {reqLoading ? (
                    <div className="py-16 text-center text-gray-400">{t("withdraw.history.loading")}</div>
                ) : requests.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">{t("withdraw.history.empty")}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-150">
                                    <th className="p-4 text-xs font-bold text-gray-650">{t("withdraw.history.colDate")}</th>
                                    <th className="p-4 text-xs font-bold text-gray-660">{t("withdraw.history.colMethod")}</th>
                                    <th className="p-4 text-xs font-bold text-gray-670">{t("withdraw.history.colAccount")}</th>
                                    <th className="p-4 text-xs font-bold text-gray-680 text-right">{t("withdraw.history.colAmount")}</th>
                                    <th className="p-4 text-xs font-bold text-gray-690 text-center">{t("withdraw.history.colStatus")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50/50">
                                        <td className="p-4 text-xs text-gray-650">{formatDateTime(req.createdAt, locale)}</td>
                                        <td className="p-4 text-xs font-semibold text-gray-700">{getWithdrawMethodLabel(req.method)}</td>
                                        <td className="p-4 text-xs text-gray-550 min-w-[200px]">
                                            <div><strong>{t("withdraw.history.accountNo")}</strong> {req.accountDetails?.accountNo}</div>
                                            {req.method === "BANK" && (
                                                <div className="text-[10px] text-gray-430 mt-0.5">
                                                    {req.accountDetails?.bankName} ({req.accountDetails?.branchName}), {req.accountDetails?.holderName}
                                                </div>
                                            )}
                                            {req.reason && <div className="text-[10px] text-red-500 font-semibold mt-1">{t("withdraw.history.comment")} {req.reason}</div>}
                                        </td>
                                        <td className="p-4 text-xs font-bold text-gray-900 text-right">{formatCurrency(req.amount, locale)}</td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${req.status === "APPROVED"
                                                ? "bg-green-100 text-green-800"
                                                : req.status === "REJECTED"
                                                    ? "bg-green-150 text-green-700"
                                                    : "bg-amber-100 text-amber-800"
                                                }`}>
                                                {getWithdrawStatusLabel(req.status)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="p-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                        <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn-secondary py-1 px-3 text-xs">{t("withdraw.prev")}</button>
                        <span className="text-xs text-gray-500 font-semibold">{page} / {totalPages} {t("withdraw.page")}</span>
                        <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn-secondary py-1 px-3 text-xs">{t("withdraw.next")}</button>
                    </div>
                )}
            </div>
        </div>
    );
}
