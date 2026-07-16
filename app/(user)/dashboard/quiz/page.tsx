"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, HelpCircle, Clock, DollarSign, CheckCircle, Award, XCircle, Wallet, Smartphone } from "lucide-react";
import { quizApi, type Quiz, type QuizPurchase } from "@/lib/api/quiz";
import { walletApi } from "@/lib/api/wallet";
import { useLocale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/utils";

export default function QuizPage() {
    const { t } = useLocale();
    const router = useRouter();
    const queryClient = useQueryClient();
    const [purchaseModal, setPurchaseModal] = useState<Quiz | null>(null);
    const [payMethod, setPayMethod] = useState<"WALLET" | "BKASH">("WALLET");

    const { data: quizzes = [], isLoading: qLoading } = useQuery<Quiz[]>({
        queryKey: ["quizzes"],
        queryFn: () => quizApi.findActive(),
    });

    const { data: purchases = [], isLoading: pLoading } = useQuery<QuizPurchase[]>({
        queryKey: ["quiz-purchases"],
        queryFn: () => quizApi.getPurchased(),
    });

    const { data: wallet } = useQuery({
        queryKey: ["wallet"],
        queryFn: () => walletApi.balance(),
    });

    const purchaseMutation = useMutation({
        mutationFn: ({ id, method }: { id: string; method: string }) => quizApi.purchase(id, method),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["quiz-purchases"] });
            queryClient.invalidateQueries({ queryKey: ["wallet"] });
            setPurchaseModal(null);
        },
    });

    const purchasedIds = new Set(purchases.map((p) => p.quizId));
    const purchaseMap = new Map(purchases.map((p) => [p.quizId, p]));

    if (qLoading || pLoading) {
        return <div className="flex justify-center py-20"><Loader2 className="animate-spin" size={32} /></div>;
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">{t("dashboard.quiz.title")}</h1>
            </div>

            {quizzes.length === 0 ? (
                <div className="card p-12 bg-white flex flex-col items-center gap-3 text-gray-400">
                    <HelpCircle size={48} />
                    <p className="text-sm">{t("dashboard.quiz.noQuizzes")}</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {quizzes.map((quiz) => {
                        const bought = purchasedIds.has(quiz.id);
                        const purchase = purchaseMap.get(quiz.id);
                        return (
                            <div key={quiz.id} className="card p-5 bg-white flex items-center justify-between">
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-gray-800">{quiz.title}</h3>
                                    <div className="flex gap-4 mt-1 text-[10px] text-gray-400">
                                        <span className="flex items-center gap-1"><DollarSign size={12} /> {formatCurrency(quiz.price)}</span>
                                        <span className="flex items-center gap-1"><HelpCircle size={12} /> {quiz._count?.questions ?? 0} {t("dashboard.quiz.questions")}</span>
                                        <span className="flex items-center gap-1"><Clock size={12} /> {quiz.timeLimit} {t("dashboard.quiz.minutes")}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {bought ? (
                                        purchase?.status === "PURCHASED" ? (
                                            <button
                                                onClick={() => router.push(`/dashboard/quiz/attempt/${purchase!.id}`)}
                                                className="btn-primary text-xs"
                                            >
                                                {t("dashboard.quiz.startQuiz")}
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-semibold ${purchase?.status === "COMPLETED" ? "text-green-700" : "text-red-600"}`}>
                                                    {purchase?.status === "COMPLETED" ? (
                                                        <span className="flex items-center gap-1"><Award size={14} /> {purchase.score}/{purchase.totalQuestions}</span>
                                                    ) : (
                                                        <span className="flex items-center gap-1"><XCircle size={14} /> {t("dashboard.quiz.timedOut")}</span>
                                                    )}
                                                </span>
                                                {purchase?.status === "COMPLETED" && (
                                                    <button onClick={() => router.push(`/dashboard/quiz/attempt/${purchase!.id}`)} className="text-xs text-green-700 hover:underline font-semibold">
                                                        {t("dashboard.quiz.retake")}
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    ) : (
                                        <button onClick={() => setPurchaseModal(quiz)} className="btn-primary text-xs">
                                            {t("dashboard.quiz.purchase")}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {purchases.length > 0 && (
                <div>
                    <h2 className="text-sm font-bold text-gray-800 mb-3">{t("dashboard.quiz.purchased")}</h2>
                    <div className="space-y-2">
                        {purchases.map((p) => (
                            <div key={p.id} className="card p-3 bg-white flex items-center justify-between text-xs">
                                <div>
                                    <span className="font-semibold text-gray-800">{p.quiz?.title}</span>
                                    <span className="ml-3 text-gray-400">
                                        {p.status === "PURCHASED" ? (
                                            <span className="text-yellow-600 font-semibold">{t("dashboard.quiz.purchased")}</span>
                                        ) : p.status === "COMPLETED" ? (
                                            <span className="text-green-700 font-semibold flex items-center gap-1"><CheckCircle size={12} /> {p.score}/{p.totalQuestions}</span>
                                        ) : (
                                            <span className="text-red-600 font-semibold">{t("dashboard.quiz.timedOut")}</span>
                                        )}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {p.status === "PURCHASED" ? (
                                        <button onClick={() => router.push(`/dashboard/quiz/attempt/${p.id}`)} className="btn-primary text-[10px]">{t("dashboard.quiz.startQuiz")}</button>
                                    ) : (
                                        <button onClick={() => router.push(`/dashboard/quiz/attempt/${p.id}`)} className="text-[10px] text-green-700 hover:underline font-semibold">{t("dashboard.quiz.retake")}</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Purchase Modal */}
            {purchaseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-xl p-6 w-full max-w-sm mx-4 space-y-4">
                        <h3 className="text-sm font-bold text-gray-800">{t("dashboard.quiz.completePurchase")}</h3>
                        <p className="text-xs text-gray-500">{purchaseModal.title} — {formatCurrency(purchaseModal.price)}</p>

                        <div className="space-y-2">
                            <button
                                onClick={() => setPayMethod("WALLET")}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-sm ${payMethod === "WALLET" ? "border-green-600 bg-green-50" : "border-gray-200"}`}
                            >
                                <Wallet size={18} />
                                <div className="text-left">
                                    <p className="font-semibold text-gray-800">{t("dashboard.quiz.payWallet")}</p>
                                    <p className="text-[10px] text-gray-400">{wallet ? formatCurrency(Number(wallet.balance)) : "..."}</p>
                                </div>
                                {payMethod === "WALLET" && <CheckCircle size={16} className="ml-auto text-green-700" />}
                            </button>
                            <button
                                onClick={() => setPayMethod("BKASH")}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-sm ${payMethod === "BKASH" ? "border-green-600 bg-green-50" : "border-gray-200"}`}
                            >
                                <Smartphone size={18} />
                                <div className="text-left">
                                    <p className="font-semibold text-gray-800">{t("dashboard.quiz.payBkash")}</p>
                                </div>
                                {payMethod === "BKASH" && <CheckCircle size={16} className="ml-auto text-green-700" />}
                            </button>
                        </div>

                        {payMethod === "WALLET" && wallet && Number(wallet.balance) < Number(purchaseModal.price) && (
                            <p className="text-xs text-red-600 text-center">{t("dashboard.quiz.insufficientBalance")}</p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => purchaseMutation.mutate({ id: purchaseModal.id, method: payMethod })}
                                disabled={purchaseMutation.isPending || (payMethod === "WALLET" && Number(wallet?.balance ?? 0) < Number(purchaseModal.price))}
                                className="btn-primary flex-1 text-sm"
                            >
                                {purchaseMutation.isPending ? <Loader2 size={14} className="animate-spin mx-auto" /> : t("dashboard.quiz.confirmPurchase")}
                            </button>
                            <button onClick={() => setPurchaseModal(null)} className="btn-outline-primary text-sm">{t("dashboard.quiz.backToQuizzes")}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
