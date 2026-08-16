"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Link from "next/link";
import { Download, Copy, Check, Loader2, ImageIcon, ExternalLink, Sparkles, CheckCircle } from "lucide-react";
import { bannersApi, type Banner } from "@/lib/api/banners";
import { quizApi, type QuizPurchaseInfo } from "@/lib/api/quiz";
import { cpaApi, type CpaTaskUserPurchase } from "@/lib/api/cpa";
import { useLocale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

export default function DailyWorkPage() {
    const { t, locale } = useLocale();
    const [copied, setCopied] = useState(false);
    const [userLink, setUserLink] = useState("");

    const { data: purchases = [], isLoading: pLoading } = useQuery<QuizPurchaseInfo[]>({
        queryKey: ["quiz-purchases"],
        queryFn: () => quizApi.getPurchased(),
    });

    const { data: cpaPurchases = [], isLoading: cpaLoading } = useQuery<CpaTaskUserPurchase[]>({
        queryKey: ["user-cpa-my-purchases"],
        queryFn: () => cpaApi.getMyPurchases(),
    });

    const { data: dailyWork, isLoading } = useQuery<Banner | null>({
        queryKey: ["daily-work"],
        queryFn: () => bannersApi.findDailyWork(),
    });

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
                <Loader2 className="animate-spin" size={32} />
            </div>
        );
    }

    const activeQuizPurchases = purchases.filter((p) => p.status === "PURCHASED");

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">{t("nav.dailyWork")}</h1>
                <p className="text-sm text-gray-500">{t("dashboard.dailyWork.description")}</p>
            </div>

            {/* CPA Marketing Purchased Tasks Section */}
            {!cpaLoading && cpaPurchases.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                            <Sparkles size={16} className="text-purple-600" />
                            {t("cpa.purchasedCpaTasks")}
                        </h2>
                        <span className="text-xs text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full font-semibold">
                            {cpaPurchases.length} {locale === "bn" ? "টি" : "Task(s)"}
                        </span>
                    </div>

                    <div className="space-y-3">
                        {cpaPurchases.map((task) => (
                            <a
                                key={task.id}
                                href={task.redirectLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="card p-4 bg-white block border-2 border-purple-100 hover:border-purple-300 hover:shadow-md transition-all group"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                                                <CheckCircle size={10} /> {t("cpa.activeTask")}
                                            </span>
                                            <span className="text-[10px] text-slate-400">
                                                {formatCurrency(task.pricePaid, locale)}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-purple-700 transition-colors">
                                            {task.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
                                    </div>

                                    <div className="flex items-center gap-1 text-xs font-bold text-purple-700 bg-purple-50 group-hover:bg-purple-600 group-hover:text-white px-3 py-2 rounded-lg transition-all shrink-0">
                                        {t("cpa.openLink")} <ExternalLink size={14} />
                                    </div>
                                </div>
                            </a>
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
                                className="card bg-white overflow-hidden block hover:-translate-y-0.5 transition-transform"
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
                <div className="card p-12 bg-white flex flex-col items-center gap-3 text-gray-400">
                    <ImageIcon size={48} />
                    <p className="text-sm">{t("dashboard.dailyWork.noImage")}</p>
                </div>
            ) : (
                <>
                    <div className="card bg-white overflow-hidden">
                        <img
                            src={dailyWork.imageUrl}
                            alt="Daily Work"
                            className="w-full h-auto object-contain"
                        />
                    </div>

                    <div className="card p-5 bg-white space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t("dashboard.dailyWork.yourLink")}
                            </label>
                            <input
                                type="text"
                                value={userLink}
                                onChange={(e) => setUserLink(e.target.value)}
                                className="input w-full"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button onClick={handleDownload} className="btn-primary flex items-center gap-2">
                                <Download size={16} />
                                {t("dashboard.dailyWork.download")}
                            </button>
                            <button
                                onClick={handleCopy}
                                className="btn-outline-primary flex items-center gap-2"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? t("dashboard.dailyWork.copied") : t("dashboard.dailyWork.copyLink")}
                            </button>
                        </div>

                        <p className="text-xs text-gray-400">{t("dashboard.dailyWork.shareHint")}</p>
                    </div>
                </>
            )}
        </div>
    );
}
