"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    CheckCircle,
    Loader2,
    Play,
    Globe,
    ExternalLink,
} from "lucide-react";
import { cpaApi, type CpaTaskPublic, type CpaTaskUserPurchase } from "@/lib/api/cpa";
import { useLocale } from "@/lib/i18n";

export default function UserCpaMarketingPage() {
    const { t, locale } = useLocale();
    const queryClient = useQueryClient();

    const [selectedTask, setSelectedTask] = useState<CpaTaskPublic | null>(null);
    const [purchaseError, setPurchaseError] = useState<string | null>(null);
    const [successTaskTitle, setSuccessTaskTitle] = useState<string | null>(null);
    const [successRedirectLink, setSuccessRedirectLink] = useState<string | null>(null);

    const { data: tasks = [], isLoading: isTasksLoading } = useQuery<CpaTaskPublic[]>({
        queryKey: ["user-cpa-tasks"],
        queryFn: () => cpaApi.getPublicTasks(),
    });

    const { data: myPurchases = [] } = useQuery<CpaTaskUserPurchase[]>({
        queryKey: ["user-cpa-my-purchases"],
        queryFn: () => cpaApi.getMyPurchases(),
    });

    const buyMutation = useMutation({
        mutationFn: (taskId: string) => cpaApi.buyTask(taskId),
        onSuccess: (res: any) => {
            queryClient.invalidateQueries({ queryKey: ["user-cpa-tasks"] });
            queryClient.invalidateQueries({ queryKey: ["user-cpa-my-purchases"] });
            const title = selectedTask?.title || "CPA Task";
            const redirectLink = res?.purchase?.redirectLink || "#";
            setSelectedTask(null);
            setPurchaseError(null);
            setSuccessTaskTitle(title);
            setSuccessRedirectLink(redirectLink);

            if (redirectLink && redirectLink !== "#") {
                window.open(redirectLink, "_blank");
            }
        },
        onError: (err: any) => {
            setPurchaseError(
                err?.response?.data?.message || err?.message || (locale === "bn" ? "কাজ শুরু করতে ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।" : "Failed to start task. Please try again.")
            );
        },
    });

    const completeTaskMutation = useMutation({
        mutationFn: (purchaseId: string) => cpaApi.completeTask(purchaseId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-cpa-my-purchases"] });
            queryClient.invalidateQueries({ queryKey: ["user-cpa-tasks"] });
        },
    });

    const handleConfirmBuy = () => {
        if (!selectedTask) return;
        setPurchaseError(null);
        buyMutation.mutate(selectedTask.id);
    };

    const handleOpenTask = (taskId: string) => {
        const userPurchase = myPurchases.find((p) => p.taskId === taskId);
        if (userPurchase) {
            completeTaskMutation.mutate(userPurchase.id);
            if (userPurchase.redirectLink && userPurchase.redirectLink !== "#") {
                window.open(userPurchase.redirectLink, "_blank");
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Clean Header Banner */}
            <div className="card p-6 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold">{t("cpa.title")}</h1>
                    <p className="text-xs text-purple-200 mt-1">
                        {locale === "bn"
                            ? "সিপিএ টাস্ক শুরু করুন এবং সরাসরি লিংক ওপেন করে সম্পন্ন করুন।"
                            : "Start any CPA task. Access redirect links directly right here!"}
                    </p>
                </div>
            </div>

            {/* Success Banner */}
            {successTaskTitle && (
                <div className="card p-5 bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm fade-in rounded-xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                                {locale === "bn" ? "টাস্ক শুরু হয়েছে!" : "Task Started!"}
                            </h3>
                            <p className="text-xs text-slate-600 mt-0.5">
                                "{successTaskTitle}" {locale === "bn" ? "সফলভাবে আনলক করা হয়েছে।" : "is now unlocked."}
                            </p>
                        </div>
                    </div>
                    {successRedirectLink && successRedirectLink !== "#" && (
                        <button
                            onClick={() => window.open(successRedirectLink, "_blank")}
                            className="btn-primary bg-emerald-600 hover:bg-emerald-700 text-xs font-bold py-2.5 px-5 rounded-lg whitespace-nowrap flex items-center gap-2 shadow-xs cursor-pointer text-white"
                        >
                            <ExternalLink size={16} /> {locale === "bn" ? "টাস্ক লিংক ওপেন করুন" : "Open Task Link"}
                        </button>
                    )}
                </div>
            )}

            {/* Task Grid */}
            {isTasksLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-purple-600" />
                </div>
            ) : tasks.length === 0 ? (
                <div className="card p-12 bg-white text-center text-slate-400 space-y-3 rounded-xl">
                    <Globe size={48} className="mx-auto text-slate-300" />
                    <p className="text-sm font-semibold">{t("cpa.noTasks")}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {tasks.map((task) => {
                        const isUnlocked = task.isPurchased || myPurchases.some((p) => p.taskId === task.id);
                        return (
                            <div
                                key={task.id}
                                className={`card p-5 sm:p-6 bg-white border-2 flex flex-col justify-between transition-all hover:shadow-md rounded-xl ${
                                    isUnlocked ? "border-emerald-200 bg-emerald-50/20" : "border-slate-100 hover:border-purple-200"
                                }`}
                            >
                                <div className="space-y-3">
                                    {isUnlocked && (
                                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 w-max">
                                            <CheckCircle size={14} /> {locale === "bn" ? "আনলক করা হয়েছে" : "Unlocked & Active"}
                                        </span>
                                    )}

                                    <div>
                                        <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug">{task.title}</h3>
                                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{task.description}</p>
                                    </div>
                                </div>

                                <div className="pt-4 mt-4 border-t border-slate-100">
                                    {isUnlocked ? (
                                        <button
                                            onClick={() => handleOpenTask(task.id)}
                                            className="w-full btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-2 text-white bg-emerald-600 hover:bg-emerald-700 transition-all cursor-pointer rounded-lg shadow-xs"
                                        >
                                            <ExternalLink size={16} /> {locale === "bn" ? "টাস্ক লিংক ওপেন করুন" : "Open Task Link"}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setSuccessTaskTitle(null);
                                                setSuccessRedirectLink(null);
                                                setPurchaseError(null);
                                                setSelectedTask(task);
                                            }}
                                            className="w-full btn-primary py-2.5 text-xs font-bold flex items-center justify-center gap-2 bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition-all cursor-pointer rounded-lg"
                                        >
                                            <Play size={15} /> {locale === "bn" ? "কাজ শুরু করুন" : "Start Task"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Start Task Modal Confirmation */}
            {selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 fade-in">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-5 text-center">
                        <div className="w-14 h-14 rounded-full bg-purple-100 text-purple-600 mx-auto flex items-center justify-center">
                            <Play size={28} />
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-slate-900">{locale === "bn" ? "সিপিএ টাস্ক শুরু করুন" : "Start CPA Task"}</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                {locale === "bn" ? "আপনি কি" : "Are you sure you want to start"} <strong className="text-slate-800">"{selectedTask.title}"</strong> {locale === "bn" ? "টাস্কটি শুরু করতে চান?" : "task?"}
                            </p>
                        </div>

                        {purchaseError && (
                            <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 font-semibold text-left">
                                {purchaseError}
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <button
                                onClick={handleConfirmBuy}
                                disabled={buyMutation.isPending}
                                className="btn-primary flex-1 py-2.5 text-xs sm:text-sm font-bold bg-purple-700 hover:bg-purple-800 flex items-center justify-center gap-2 cursor-pointer rounded-lg text-white"
                            >
                                {buyMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : (locale === "bn" ? "কাজ শুরু করুন" : "Start Task")}
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedTask(null);
                                    setPurchaseError(null);
                                }}
                                className="btn-outline-primary py-2.5 text-xs sm:text-sm font-semibold rounded-lg"
                            >
                                {t("cpa.cancel")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
