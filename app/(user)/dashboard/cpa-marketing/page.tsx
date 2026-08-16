"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
    ShoppingBag,
    CheckCircle,
    Loader2,
    Lock,
    ArrowRight,
    Wallet,
    AlertCircle,
    Sparkles,
    Briefcase,
} from "lucide-react";
import { cpaApi, type CpaTaskPublic } from "@/lib/api/cpa";
import { walletApi } from "@/lib/api/wallet";
import { useLocale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

export default function UserCpaMarketingPage() {
    const { t, locale } = useLocale();
    const router = useRouter();
    const queryClient = useQueryClient();

    const [selectedTask, setSelectedTask] = useState<CpaTaskPublic | null>(null);
    const [purchaseError, setPurchaseError] = useState<string | null>(null);
    const [successTaskTitle, setSuccessTaskTitle] = useState<string | null>(null);

    const { data: tasks = [], isLoading: isTasksLoading } = useQuery<CpaTaskPublic[]>({
        queryKey: ["user-cpa-tasks"],
        queryFn: () => cpaApi.getPublicTasks(),
    });

    const { data: wallet } = useQuery({
        queryKey: ["wallet"],
        queryFn: () => walletApi.balance(),
    });

    const walletBalance = Number(wallet?.balance ?? 0);

    const buyMutation = useMutation({
        mutationFn: (taskId: string) => cpaApi.buyTask(taskId),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["user-cpa-tasks"] });
            queryClient.invalidateQueries({ queryKey: ["wallet"] });
            queryClient.invalidateQueries({ queryKey: ["user-cpa-my-purchases"] });
            const title = selectedTask?.title || "CPA Task";
            setSelectedTask(null);
            setPurchaseError(null);
            setSuccessTaskTitle(title);
        },
        onError: (err: any) => {
            setPurchaseError(
                err?.response?.data?.message || err?.message || "Purchase failed. Please try again."
            );
        },
    });

    const handleConfirmBuy = () => {
        if (!selectedTask) return;
        setPurchaseError(null);
        buyMutation.mutate(selectedTask.id);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="card p-6 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-lg overflow-hidden relative">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
                    <Sparkles size={200} />
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-semibold mb-2 border border-purple-400/20">
                            <Sparkles size={14} /> Earn & Perform Tasks
                        </span>
                        <h1 className="text-2xl font-bold">CPA Marketing Tasks</h1>
                        <p className="text-xs text-slate-300 mt-1 max-w-lg">
                            Buy CPA marketing tasks using your wallet balance. Once purchased, the task and its target link will be ready in your Daily Work page!
                        </p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/10 flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                            <Wallet size={20} />
                        </div>
                        <div>
                            <p className="text-[11px] text-slate-300 font-medium">Wallet Balance</p>
                            <p className="text-lg font-black text-emerald-400">{formatCurrency(walletBalance, locale)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Banner */}
            {successTaskTitle && (
                <div className="card p-5 bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm fade-in">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                                Task Purchased Successfully!
                            </h3>
                            <p className="text-xs text-slate-600 mt-0.5">
                                "{successTaskTitle}" is now unlocked in your <strong className="text-emerald-700">Daily Work</strong> page.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push("/dashboard/daily-work")}
                        className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-xs font-bold py-2.5 px-5 rounded-lg whitespace-nowrap flex items-center gap-2 shadow-xs"
                    >
                        <Briefcase size={16} /> Go to Daily Work <ArrowRight size={14} />
                    </button>
                </div>
            )}

            {/* Task Grid */}
            {isTasksLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-purple-600" />
                </div>
            ) : tasks.length === 0 ? (
                <div className="card p-12 bg-white text-center text-slate-400 space-y-3">
                    <ShoppingBag size={48} className="mx-auto text-slate-300" />
                    <p className="text-sm font-semibold">No CPA tasks available at the moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {tasks.map((task) => {
                        const hasInsufficientBalance = walletBalance < task.price;

                        return (
                            <div
                                key={task.id}
                                className={`card p-6 bg-white border-2 flex flex-col justify-between transition-all hover:shadow-md ${
                                    task.isPurchased ? "border-emerald-200 bg-emerald-50/20" : "border-slate-100 hover:border-purple-200"
                                }`}
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                                            CPA Task
                                        </span>
                                        {task.isPurchased ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                                                <CheckCircle size={14} /> Purchased
                                            </span>
                                        ) : (
                                            <span className="text-base font-black text-slate-900">
                                                {formatCurrency(task.price, locale)}
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-slate-900 text-lg leading-snug">{task.title}</h3>
                                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{task.description}</p>
                                    </div>

                                    {!task.isPurchased && (
                                        <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-lg flex items-center gap-2 text-[11px] text-amber-800 font-medium">
                                            <Lock size={14} className="text-amber-600 shrink-0" />
                                            <span>Target link is hidden. Unlock it by purchasing task!</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-4 mt-4 border-t border-slate-100">
                                    {task.isPurchased ? (
                                        <button
                                            onClick={() => router.push("/dashboard/daily-work")}
                                            className="w-full btn-secondary py-2.5 text-xs font-bold flex items-center justify-center gap-2 text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100 transition-all"
                                        >
                                            <Briefcase size={16} /> View in Daily Work
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setSuccessTaskTitle(null);
                                                setPurchaseError(null);
                                                setSelectedTask(task);
                                            }}
                                            className="w-full btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition-all"
                                        >
                                            <ShoppingBag size={16} /> Buy Task ({formatCurrency(task.price, locale)})
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Buy Modal Confirmation */}
            {selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 fade-in">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-5 text-center">
                        <div className="w-14 h-14 rounded-full bg-purple-100 text-purple-600 mx-auto flex items-center justify-center">
                            <ShoppingBag size={28} />
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Confirm CPA Task Purchase</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Are you sure you want to buy <strong className="text-slate-800">"{selectedTask.title}"</strong>?
                            </p>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 text-left border border-slate-100 space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-500 font-medium">Task Price:</span>
                                <strong className="text-slate-900 font-bold">{formatCurrency(selectedTask.price, locale)}</strong>
                            </div>
                            <div className="flex justify-between border-t border-slate-200/60 pt-2">
                                <span className="text-slate-500 font-medium">Your Wallet Balance:</span>
                                <strong className={walletBalance < selectedTask.price ? "text-red-600 font-bold" : "text-emerald-700 font-bold"}>
                                    {formatCurrency(walletBalance, locale)}
                                </strong>
                            </div>
                        </div>

                        {walletBalance < selectedTask.price && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-xs text-red-600 font-semibold text-left">
                                <AlertCircle size={16} className="shrink-0" />
                                <span>Insufficient wallet balance. Please add funds to your wallet.</span>
                            </div>
                        )}

                        {purchaseError && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 font-semibold text-left">
                                {purchaseError}
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={handleConfirmBuy}
                                disabled={walletBalance < selectedTask.price || buyMutation.isPending}
                                className="btn-primary flex-1 py-3 text-xs sm:text-sm font-bold bg-purple-700 hover:bg-purple-800 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {buyMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : "Confirm & Pay"}
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedTask(null);
                                    setPurchaseError(null);
                                }}
                                className="btn-outline-primary py-3 text-xs sm:text-sm font-semibold"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
