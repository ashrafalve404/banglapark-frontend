"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { Download, Copy, Check, Loader2, ImageIcon, ExternalLink, CheckCircle, Play } from "lucide-react";
import { bannersApi, type Banner } from "@/lib/api/banners";
import { quizApi, type QuizPurchaseInfo } from "@/lib/api/quiz";
import { cpaApi, type CpaTaskUserPurchase, type CpaTaskPublic } from "@/lib/api/cpa";
import { useLocale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

export default function DailyWorkPage() {
    const { t, locale } = useLocale();
    const queryClient = useQueryClient();
    const [copied, setCopied] = useState(false);
    const [userLink, setUserLink] = useState("");
    const [startingTaskId, setStartingTaskId] = useState<string | null>(null);

    const { data: purchases = [], isLoading: pLoading } = useQuery<QuizPurchaseInfo[]>({
        queryKey: ["quiz-purchases"],
        queryFn: () => quizApi.getPurchased(),
    });

    const { data: cpaPurchases = [], isLoading: cpaLoading } = useQuery<CpaTaskUserPurchase[]>({
        queryKey: ["user-cpa-my-purchases"],
        queryFn: () => cpaApi.getMyPurchases(),
    });

    const { data: cpaPublicTasks = [] } = useQuery<CpaTaskPublic[]>({
        queryKey: ["user-cpa-public-tasks"],
        queryFn: () => cpaApi.getPublicTasks(),
    });

    const { data: dailyWork, isLoading } = useQuery<Banner | null>({
        queryKey: ["daily-work"],
        queryFn: () => bannersApi.findDailyWork(),
    });

    const completeTaskMutation = useMutation({
        mutationFn: (purchaseId: string) => cpaApi.completeTask(purchaseId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["user-cpa-my-purchases"] });
            queryClient.invalidateQueries({ queryKey: ["user-cpa-public-tasks"] });
        },
    });

    const startTaskMutation = useMutation({
        mutationFn: async (taskId: string) => {
            setStartingTaskId(taskId);
            const res = await cpaApi.buyTask(taskId);
            return res;
        },
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ["user-cpa-my-purchases"] });
            queryClient.invalidateQueries({ queryKey: ["user-cpa-public-tasks"] });
            if (res.purchase?.redirectLink && res.purchase.redirectLink !== "#") {
                window.open(res.purchase.redirectLink, "_blank");
            }
        },
        onSettled: () => {
            setStartingTaskId(null);
        },
    });

    const handleOpenTask = (task: CpaTaskUserPurchase) => {
        completeTaskMutation.mutate(task.id);
        if (task.redirectLink && task.redirectLink !== "#") {
            window.open(task.redirectLink, "_blank");
        }
    };

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(userLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const ta = document.createElement("textarea");
            ta.value = userLink;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownload = () => {
        if (!dailyWork) return;
        const link = document.createElement("a");
        link.href = dailyWork.imageUrl;
        link.download = "daily-work.jpg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-red-700" size={32} />
            </div>
        );
    }

    const activeQuizPurchases = purchases.filter((p) => p.status === "PURCHASED");
    const activePublicCpaTasks = cpaPublicTasks.filter((t) => t.isActive);

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">{t("nav.dailyWork")}</h1>
                <p className="text-sm text-gray-500">{t("dashboard.dailyWork.description")}</p>
            </div>

            {/* CPA Marketing Tasks Section (All Available + User Started) */}
            {(cpaPurchases.length > 0 || activePublicCpaTasks.length > 0) && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-gray-800">
                            {locale === "bn" ? "সিপিএ মার্কেটিং কাজসমূহ" : "CPA Marketing Tasks"}
                        </h2>
                        <Link
                            href="/dashboard/cpa-marketing"
                            className="text-xs font-bold text-red-700 hover:text-red-800 flex items-center gap-1"
                        >
                            {locale === "bn" ? "সব টাস্ক দেখুন" : "View All"} →
                        </Link>
                    </div>

                    <div className="space-y-3">
                        {/* 1. Show Started/Unlocked Tasks First */}
                        {cpaPurchases.map((task) => (
                            <div
                                key={task.id}
                                className="card p-4 bg-white block text-left w-full border border-slate-200 hover:border-red-300 transition-all rounded-lg shadow-xs"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                                                <CheckCircle size={10} /> {locale === "bn" ? "চলতি কাজ" : "Active Work"}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {formatCurrency(task.pricePaid, locale)}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-sm">
                                            {task.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
                                    </div>

                                    <button
                                        onClick={() => handleOpenTask(task)}
                                        className="flex items-center gap-1 text-xs font-bold text-white bg-red-700 hover:bg-red-800 px-3 py-2 rounded-md transition-all shrink-0 cursor-pointer shadow-xs"
                                    >
                                        {t("cpa.openLink")} <ExternalLink size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* 2. Show Unstarted Available Tasks */}
                        {activePublicCpaTasks
                            .filter((pt) => !cpaPurchases.some((p) => p.taskId === pt.id))
                            .map((task) => (
                                <div
                                    key={task.id}
                                    className="card p-4 bg-white block text-left w-full border border-slate-200 hover:border-red-300 transition-all rounded-lg shadow-xs"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="space-y-1 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-100">
                                                    {locale === "bn" ? "নতুন টাস্ক (ফ্রি)" : "New Task (FREE)"}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-slate-900 text-sm">
                                                {task.title}
                                            </h3>
                                            <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
                                        </div>

                                        <button
                                            onClick={() => startTaskMutation.mutate(task.id)}
                                            disabled={startingTaskId === task.id}
                                            className="flex items-center gap-1 text-xs font-bold text-white bg-red-700 hover:bg-red-800 px-3 py-2 rounded-md transition-all shrink-0 cursor-pointer shadow-xs disabled:opacity-50"
                                        >
                                            {startingTaskId === task.id ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <>
                                                    <Play size={13} /> {locale === "bn" ? "কাজ শুরু করুন" : "Start Task"}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Quiz Purchases */}
            {!pLoading && purchases.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-sm font-bold text-gray-800">{t("dashboard.quiz.title")}</h2>
                    <div className="space-y-4">
                        {activeQuizPurchases.map((p) => (
                            <Link
                                key={p.id}
                                href={`/dashboard/quiz/attempt/${p.id}`}
                                className="card bg-white overflow-hidden block hover:-translate-y-0.5 transition-transform rounded-lg"
                            >
                                <img src={p.category?.imageUrl || ""} alt={p.category?.name || ""} className="w-full h-auto object-contain" />
                                <div className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-gray-800">{p.category?.name}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{p.answers?.length ?? 0}/{p.questionCount} answered</p>
                                    </div>
                                    <span className="text-[10px] font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full">Active</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {!dailyWork ? (
                <div className="card p-12 bg-white flex flex-col items-center gap-3 text-gray-400 rounded-lg">
                    <ImageIcon size={48} />
                    <p className="text-sm">{t("dashboard.dailyWork.noImage")}</p>
                </div>
            ) : (
                <>
                    <div className="card bg-white overflow-hidden rounded-lg">
                        <img
                            src={dailyWork.imageUrl}
                            alt="Daily Task Work"
                            className="w-full h-auto object-contain"
                        />
                        <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                            <button
                                onClick={handleDownload}
                                className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 text-xs font-bold bg-red-700 hover:bg-red-800 text-white rounded-md"
                            >
                                <Download size={16} /> {t("dashboard.dailyWork.downloadImage")}
                            </button>
                        </div>
                    </div>

                    <div className="card p-5 bg-white space-y-4 rounded-lg">
                        <h2 className="text-sm font-bold text-gray-800">
                            {t("dashboard.dailyWork.submitTitle")}
                        </h2>
                        <div className="space-y-1.5">
                            <label className="label text-xs">
                                {t("dashboard.dailyWork.linkPrompt")}
                            </label>
                            <input
                                type="url"
                                className="input text-xs rounded-md border-gray-300 focus:border-red-700 focus:ring-red-700"
                                placeholder={t("dashboard.dailyWork.linkPlaceholder")}
                                value={userLink}
                                onChange={(e) => setUserLink(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleCopy}
                            disabled={!userLink.trim()}
                            className="btn-secondary w-full py-2.5 flex items-center justify-center gap-2 text-xs font-bold disabled:opacity-50 cursor-pointer rounded-md"
                        >
                            {copied ? (
                                <>
                                    <Check size={16} className="text-green-600" />
                                    <span>{t("dashboard.dailyWork.copied")}</span>
                                </>
                            ) : (
                                <>
                                    <Copy size={16} />
                                    <span>{t("dashboard.dailyWork.copyLink")}</span>
                                </>
                            )}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
